import { eq, and, desc } from 'drizzle-orm';
import { db } from './drizzle';
import {
  shops,
  shopifyTokens,
  products,
  aiGenerations,
  generationJobs,
  type Shop,
  type NewShop,
  type ShopifyToken,
  type NewShopifyToken,
  type Product,
  type NewProduct,
  type AIGeneration,
  type NewAIGeneration,
  type GenerationJob,
  type NewGenerationJob,
} from './schema';

// ============================================
// Shop Queries
// ============================================

export async function getShopsByUserId(userId: number): Promise<Shop[]> {
  return db.query.shops.findMany({
    where: eq(shops.userId, userId),
    orderBy: [desc(shops.createdAt)],
  });
}

export async function getShopById(shopId: number, userId: number): Promise<Shop | undefined> {
  return db.query.shops.findFirst({
    where: and(eq(shops.id, shopId), eq(shops.userId, userId)),
  });
}

export async function getShopByDomain(domain: string): Promise<Shop | undefined> {
  return db.query.shops.findFirst({
    where: eq(shops.myshopifyDomain, domain),
  });
}

export async function createShop(data: NewShop): Promise<Shop> {
  const [shop] = await db.insert(shops).values(data).returning();
  return shop;
}

export async function updateShop(
  shopId: number,
  data: Partial<NewShop>
): Promise<Shop | undefined> {
  const [shop] = await db
    .update(shops)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(shops.id, shopId))
    .returning();
  return shop;
}

export async function deleteShop(shopId: number): Promise<void> {
  await db.delete(shops).where(eq(shops.id, shopId));
}

// ============================================
// Shopify Token Queries
// ============================================

export async function getShopifyToken(shopId: number): Promise<ShopifyToken | undefined> {
  return db.query.shopifyTokens.findFirst({
    where: eq(shopifyTokens.shopId, shopId),
  });
}

export async function createShopifyToken(data: NewShopifyToken): Promise<ShopifyToken> {
  const [token] = await db.insert(shopifyTokens).values(data).returning();
  return token;
}

export async function updateShopifyToken(
  shopId: number,
  data: Partial<NewShopifyToken>
): Promise<ShopifyToken | undefined> {
  const [token] = await db
    .update(shopifyTokens)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(shopifyTokens.shopId, shopId))
    .returning();
  return token;
}

export async function deleteShopifyToken(shopId: number): Promise<void> {
  await db.delete(shopifyTokens).where(eq(shopifyTokens.shopId, shopId));
}

// ============================================
// Product Queries
// ============================================

export async function getProductsByUserId(userId: number): Promise<Product[]> {
  return db.query.products.findMany({
    where: eq(products.userId, userId),
    orderBy: [desc(products.createdAt)],
  });
}

export async function getProductsByShopId(shopId: number): Promise<Product[]> {
  return db.query.products.findMany({
    where: eq(products.shopId, shopId),
    orderBy: [desc(products.createdAt)],
  });
}

export async function getProductById(
  productId: number,
  userId: number
): Promise<Product | undefined> {
  return db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.userId, userId)),
  });
}

export async function createProduct(data: NewProduct): Promise<Product> {
  const [product] = await db.insert(products).values(data).returning();
  return product;
}

export async function updateProduct(
  productId: number,
  data: Partial<NewProduct>
): Promise<Product | undefined> {
  const [product] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, productId))
    .returning();
  return product;
}

export async function deleteProduct(productId: number): Promise<void> {
  await db.delete(products).where(eq(products.id, productId));
}

// ============================================
// AI Generation Queries
// ============================================

export async function getAIGenerationsByProductId(
  productId: number
): Promise<AIGeneration[]> {
  return db.query.aiGenerations.findMany({
    where: eq(aiGenerations.productId, productId),
    orderBy: [desc(aiGenerations.createdAt)],
  });
}

export async function getLatestAIGeneration(
  productId: number
): Promise<AIGeneration | undefined> {
  return db.query.aiGenerations.findFirst({
    where: eq(aiGenerations.productId, productId),
    orderBy: [desc(aiGenerations.createdAt)],
  });
}

export async function createAIGeneration(data: NewAIGeneration): Promise<AIGeneration> {
  const [generation] = await db.insert(aiGenerations).values(data).returning();
  return generation;
}

export async function updateAIGeneration(
  generationId: number,
  data: Partial<NewAIGeneration>
): Promise<AIGeneration | undefined> {
  const [generation] = await db
    .update(aiGenerations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(aiGenerations.id, generationId))
    .returning();
  return generation;
}

// ============================================
// Generation Job Queries
// ============================================

export async function getGenerationJobsByUserId(
  userId: number
): Promise<GenerationJob[]> {
  return db.query.generationJobs.findMany({
    where: eq(generationJobs.userId, userId),
    orderBy: [desc(generationJobs.createdAt)],
  });
}

export async function getGenerationJobsByShopId(
  shopId: number
): Promise<GenerationJob[]> {
  return db.query.generationJobs.findMany({
    where: eq(generationJobs.shopId, shopId),
    orderBy: [desc(generationJobs.createdAt)],
  });
}

export async function getGenerationJobById(
  jobId: number,
  userId: number
): Promise<GenerationJob | undefined> {
  return db.query.generationJobs.findFirst({
    where: and(eq(generationJobs.id, jobId), eq(generationJobs.userId, userId)),
  });
}

export async function createGenerationJob(
  data: NewGenerationJob
): Promise<GenerationJob> {
  const [job] = await db.insert(generationJobs).values(data).returning();
  return job;
}

export async function updateGenerationJob(
  jobId: number,
  data: Partial<NewGenerationJob>
): Promise<GenerationJob | undefined> {
  const [job] = await db
    .update(generationJobs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(generationJobs.id, jobId))
    .returning();
  return job;
}

export async function getPendingGenerationJobs(): Promise<GenerationJob[]> {
  return db.query.generationJobs.findMany({
    where: eq(generationJobs.status, 'pending'),
    orderBy: [generationJobs.createdAt],
  });
}

