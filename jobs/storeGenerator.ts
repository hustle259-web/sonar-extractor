import { Queue, Worker, Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { 
  shops, 
  shopifyTokens, 
  products, 
  generationJobs,
  aiGenerations 
} from '@/lib/db/schema';
import { scrapeProduct } from '@/services/scraper';
import { generateProductContent } from '@/services/ai';
import { 
  createShopifyClient, 
  uploadTheme, 
  createProductFromScraped 
} from '@/services/shopify';
import { buildTheme } from '@/services/themeBuilder';
import type { 
  StoreGenerationPayload, 
  JobStep, 
  GenerationStepName,
  ShopifyProduct,
  AIGeneratedContent,
} from '@/types';

// ============================================
// Store Generation Queue
// ============================================

const QUEUE_NAME = 'store-generation';

// Redis connection config
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};

// Create queue
export const storeGenerationQueue = new Queue<StoreGenerationPayload>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

/**
 * Add a store generation job to the queue
 */
export async function addStoreGenerationJob(
  payload: StoreGenerationPayload
): Promise<Job<StoreGenerationPayload>> {
  return storeGenerationQueue.add('generate', payload, {
    jobId: `store-gen-${payload.jobId}`,
  });
}

/**
 * Update job step status in database
 */
async function updateJobStep(
  jobId: number,
  stepIndex: number,
  status: JobStep['status'],
  error?: string
): Promise<void> {
  const job = await db.query.generationJobs.findFirst({
    where: eq(generationJobs.id, jobId),
  });

  if (!job || !job.steps) return;

  const steps = [...job.steps];
  steps[stepIndex] = {
    ...steps[stepIndex],
    status,
    ...(status === 'processing' && { startedAt: new Date() }),
    ...(status === 'completed' && { completedAt: new Date() }),
    ...(error && { error }),
  };

  await db
    .update(generationJobs)
    .set({
      steps,
      currentStep: stepIndex,
      status: status === 'failed' ? 'failed' : 'processing',
      ...(error && { error }),
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobId));
}

/**
 * Mark job as completed
 */
async function completeJob(jobId: number, productId: number): Promise<void> {
  await db
    .update(generationJobs)
    .set({
      status: 'completed',
      productId,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobId));
}

/**
 * Mark job as failed
 */
async function failJob(jobId: number, error: string): Promise<void> {
  await db
    .update(generationJobs)
    .set({
      status: 'failed',
      error,
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobId));
}

/**
 * Process store generation job
 */
async function processStoreGeneration(
  job: Job<StoreGenerationPayload>
): Promise<void> {
  const { jobId, userId, shopId, sourceUrl, themeConfig } = job.data;

  console.log(`[Job ${jobId}] Starting store generation for shop ${shopId}`);

  try {
    // Get shop and token
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    const token = await db.query.shopifyTokens.findFirst({
      where: eq(shopifyTokens.shopId, shopId),
    });

    if (!token) {
      throw new Error('Shopify token not found');
    }

    const shopDomain = shop.myshopifyDomain!;
    const accessToken = token.accessToken;

    // Step 1: Scrape product
    console.log(`[Job ${jobId}] Step 1: Scraping product from ${sourceUrl}`);
    await updateJobStep(jobId, 0, 'processing');

    const scrapedProduct = await scrapeProduct(sourceUrl);
    
    // Save scraped product to database
    const [savedProduct] = await db
      .insert(products)
      .values({
        userId,
        shopId,
        title: scrapedProduct.title,
        description: scrapedProduct.description,
        sourceUrl: scrapedProduct.sourceUrl,
        images: scrapedProduct.images,
        price: scrapedProduct.price.toString(),
        currency: scrapedProduct.currency,
        scrapedData: scrapedProduct,
        status: 'imported',
      })
      .returning();

    await updateJobStep(jobId, 0, 'completed');

    // Step 2: Generate AI content
    console.log(`[Job ${jobId}] Step 2: Generating AI content`);
    await updateJobStep(jobId, 1, 'processing');

    const aiResult = await generateProductContent({
      productId: savedProduct.id,
      title: scrapedProduct.title,
      originalDescription: scrapedProduct.description,
      tone: 'professional',
    });

    // Save AI generation
    await db.insert(aiGenerations).values({
      productId: savedProduct.id,
      generatedContent: aiResult.content,
      promptTokens: aiResult.usage.promptTokens,
      completionTokens: aiResult.usage.completionTokens,
      status: 'completed',
    });

    // Update product with generated description
    await db
      .update(products)
      .set({
        description: aiResult.content.description,
        status: 'generated',
        updatedAt: new Date(),
      })
      .where(eq(products.id, savedProduct.id));

    await updateJobStep(jobId, 1, 'completed');

    // Step 3: Build theme
    console.log(`[Job ${jobId}] Step 3: Building theme`);
    await updateJobStep(jobId, 2, 'processing');

    const themeAssets = buildTheme(themeConfig, aiResult.content);
    
    await updateJobStep(jobId, 2, 'completed');

    // Step 4: Upload theme to Shopify
    console.log(`[Job ${jobId}] Step 4: Uploading theme to Shopify`);
    await updateJobStep(jobId, 3, 'processing');

    const themeName = themeConfig?.name || `Dropifi Theme - ${new Date().toISOString().split('T')[0]}`;
    const theme = await uploadTheme(shopDomain, accessToken, themeName, themeAssets);

    console.log(`[Job ${jobId}] Theme uploaded with ID: ${theme.id}`);
    await updateJobStep(jobId, 3, 'completed');

    // Step 5: Create product on Shopify
    console.log(`[Job ${jobId}] Step 5: Creating product on Shopify`);
    await updateJobStep(jobId, 4, 'processing');

    const shopifyProduct: ShopifyProduct = {
      title: scrapedProduct.title,
      body_html: formatProductDescription(aiResult.content),
      tags: aiResult.content.tags.join(', '),
      variants: scrapedProduct.variants?.map(v => ({
        title: v.title,
        price: v.price.toString(),
        sku: v.sku,
      })) || [{
        title: 'Default',
        price: scrapedProduct.price.toString(),
      }],
      images: scrapedProduct.images.map((src, index) => ({
        src,
        position: index + 1,
      })),
    };

    const shopifyProductId = await createProductFromScraped(
      shopDomain,
      accessToken,
      shopifyProduct
    );

    // Update product with Shopify ID
    await db
      .update(products)
      .set({
        shopifyProductId: shopifyProductId.toString(),
        status: 'published',
        updatedAt: new Date(),
      })
      .where(eq(products.id, savedProduct.id));

    await updateJobStep(jobId, 4, 'completed');

    // Step 6: Create pages (FAQ page)
    console.log(`[Job ${jobId}] Step 6: Creating pages`);
    await updateJobStep(jobId, 5, 'processing');

    const client = createShopifyClient(shopDomain, accessToken);
    
    // Create FAQ page
    await client.createPage({
      title: 'FAQ',
      body_html: formatFAQPage(aiResult.content),
      published: true,
    });

    await updateJobStep(jobId, 5, 'completed');

    // Mark job as completed
    await completeJob(jobId, savedProduct.id);

    console.log(`[Job ${jobId}] Store generation completed successfully`);
  } catch (error) {
    console.error(`[Job ${jobId}] Store generation failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await failJob(jobId, errorMessage);
    
    throw error;
  }
}

/**
 * Format product description with bullet points
 */
function formatProductDescription(content: AIGeneratedContent): string {
  let html = `<div class="product-description">`;
  html += `<div class="description">${content.description}</div>`;
  
  if (content.bulletPoints.length > 0) {
    html += `<ul class="features">`;
    for (const bullet of content.bulletPoints) {
      html += `<li>${bullet}</li>`;
    }
    html += `</ul>`;
  }
  
  html += `</div>`;
  return html;
}

/**
 * Format FAQ page HTML
 */
function formatFAQPage(content: AIGeneratedContent): string {
  let html = `<div class="faq-page">`;
  html += `<h1>Frequently Asked Questions</h1>`;
  
  for (const faq of content.faq) {
    html += `
      <div class="faq-item">
        <h3>${faq.question}</h3>
        <p>${faq.answer}</p>
      </div>
    `;
  }
  
  html += `</div>`;
  return html;
}

// ============================================
// Worker
// ============================================

let worker: Worker<StoreGenerationPayload> | null = null;

/**
 * Start the store generation worker
 */
export function startWorker(): Worker<StoreGenerationPayload> {
  if (worker) {
    return worker;
  }

  worker = new Worker<StoreGenerationPayload>(
    QUEUE_NAME,
    processStoreGeneration,
    {
      connection: redisConnection,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[Worker] Worker error:', error);
  });

  console.log('[Worker] Store generation worker started');

  return worker;
}

/**
 * Stop the worker
 */
export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('[Worker] Store generation worker stopped');
  }
}

export default {
  storeGenerationQueue,
  addStoreGenerationJob,
  startWorker,
  stopWorker,
};

