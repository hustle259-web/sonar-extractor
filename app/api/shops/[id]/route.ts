import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { shops, shopifyTokens, products, generationJobs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import type { ApiResponse } from '@/types';

// ============================================
// GET /api/shops/[id]
// Get a single shop with details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ shop: typeof shops.$inferSelect & { hasToken: boolean } }>>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const shopId = parseInt(id, 10);
    
    if (isNaN(shopId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid shop ID' },
        { status: 400 }
      );
    }

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

    // Check if shop has a valid token
    const token = await db.query.shopifyTokens.findFirst({
      where: eq(shopifyTokens.shopId, shopId),
    });

    return NextResponse.json({
      success: true,
      data: { 
        shop: {
          ...shop,
          hasToken: !!token,
        }
      },
    });
  } catch (error) {
    console.error('Get shop error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get shop' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/shops/[id]
// Delete a shop and its associated data
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const shopId = parseInt(id, 10);
    
    if (isNaN(shopId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid shop ID' },
        { status: 400 }
      );
    }

    // Verify ownership
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

    // Delete associated data in order
    await db.delete(shopifyTokens).where(eq(shopifyTokens.shopId, shopId));
    await db.delete(generationJobs).where(eq(generationJobs.shopId, shopId));
    
    // Update products to remove shop association
    await db
      .update(products)
      .set({ shopId: null })
      .where(eq(products.shopId, shopId));
    
    // Delete the shop
    await db.delete(shops).where(eq(shops.id, shopId));

    return NextResponse.json({
      success: true,
      message: 'Shop deleted successfully',
    });
  } catch (error) {
    console.error('Delete shop error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete shop' },
      { status: 500 }
    );
  }
}

