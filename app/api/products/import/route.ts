import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { products } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { scrapeProduct } from '@/services/scraper';
import type { ApiResponse, ScrapedProduct } from '@/types';

// ============================================
// POST /api/products/import
// Scrape product from URL
// ============================================

const importSchema = z.object({
  url: z.string().url('Invalid URL provided'),
  shopId: z.number().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ product: ScrapedProduct; productId: number }>>> {
  try {
    // Get authenticated user
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = importSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { url, shopId } = validation.data;

    // Scrape the product
    const scrapedProduct = await scrapeProduct(url);

    // Save to database
    const [savedProduct] = await db
      .insert(products)
      .values({
        userId: user.id,
        shopId: shopId || null,
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

    return NextResponse.json({
      success: true,
      data: {
        product: scrapedProduct,
        productId: savedProduct.id,
      },
      message: 'Product imported successfully',
    });
  } catch (error) {
    console.error('Product import error:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to import product';
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

