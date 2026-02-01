import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { shops, shopifyTokens, generationJobs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { addStoreGenerationJob } from '@/jobs/storeGenerator';
import type { ApiResponse, ThemeConfig, JobStep, GenerationStepName } from '@/types';

// ============================================
// POST /api/shops/generate
// Start store generation pipeline
// ============================================

const generateSchema = z.object({
  shopId: z.number().positive('Invalid shop ID'),
  sourceUrl: z.string().url('Invalid source URL'),
  themeConfig: z.object({
    name: z.string().optional(),
    colors: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
      accent: z.string().optional(),
    }).optional(),
    typography: z.object({
      headingFont: z.string().optional(),
      bodyFont: z.string().optional(),
    }).optional(),
  }).optional(),
});

const GENERATION_STEPS: GenerationStepName[] = [
  'scrape',
  'ai_generate',
  'build_theme',
  'upload_theme',
  'create_product',
  'create_pages',
];

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ jobId: number }>>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = generateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { shopId, sourceUrl, themeConfig } = validation.data;

    // Verify shop ownership and token
    const shop = await db.query.shops.findFirst({
      where: and(
        eq(shops.id, shopId),
        eq(shops.userId, user.id)
      ),
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Check for valid Shopify token
    const token = await db.query.shopifyTokens.findFirst({
      where: eq(shopifyTokens.shopId, shopId),
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Shop not connected to Shopify. Please authenticate first.' },
        { status: 400 }
      );
    }

    // Initialize job steps
    const steps: JobStep[] = GENERATION_STEPS.map(name => ({
      name,
      status: 'pending' as const,
    }));

    // Create generation job
    const [job] = await db
      .insert(generationJobs)
      .values({
        userId: user.id,
        shopId,
        sourceUrl,
        status: 'pending',
        currentStep: 0,
        steps,
        themeConfig: themeConfig as Partial<ThemeConfig>,
      })
      .returning();

    // Add job to queue
    await addStoreGenerationJob({
      jobId: job.id,
      userId: user.id,
      shopId,
      sourceUrl,
      themeConfig: themeConfig as Partial<ThemeConfig>,
    });

    return NextResponse.json({
      success: true,
      data: { jobId: job.id },
      message: 'Store generation started',
    });
  } catch (error) {
    console.error('Store generation error:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to start store generation';
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/shops/generate
// Get generation jobs for the current user
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ jobs: typeof generationJobs.$inferSelect[] }>>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get optional shopId filter
    const searchParams = request.nextUrl.searchParams;
    const shopIdParam = searchParams.get('shopId');

    let jobs;
    
    if (shopIdParam) {
      const shopId = parseInt(shopIdParam, 10);
      jobs = await db.query.generationJobs.findMany({
        where: and(
          eq(generationJobs.userId, user.id),
          eq(generationJobs.shopId, shopId)
        ),
        orderBy: (generationJobs, { desc }) => [desc(generationJobs.createdAt)],
      });
    } else {
      jobs = await db.query.generationJobs.findMany({
        where: eq(generationJobs.userId, user.id),
        orderBy: (generationJobs, { desc }) => [desc(generationJobs.createdAt)],
      });
    }

    return NextResponse.json({
      success: true,
      data: { jobs },
    });
  } catch (error) {
    console.error('Get generation jobs error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get generation jobs' },
      { status: 500 }
    );
  }
}

