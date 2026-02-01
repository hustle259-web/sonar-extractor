import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { products } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import type { ApiResponse, ScrapedProduct } from '@/types';

// ============================================
// GET /api/products/[id]
// Get a single product
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ product: typeof products.$inferSelect }>>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.userId, user.id)
      ),
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    console.error('Get product error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get product' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/products/[id]
// Update a product
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ product: typeof products.$inferSelect }>>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const [updatedProduct] = await db
      .update(products)
      .set({
        title: body.title,
        description: body.description,
        price: body.price?.toString(),
        currency: body.currency,
        images: body.images,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(and(
        eq(products.id, productId),
        eq(products.userId, user.id)
      ))
      .returning();

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { product: updatedProduct },
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/products/[id]
// Delete a product
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
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const [deletedProduct] = await db
      .delete(products)
      .where(and(
        eq(products.id, productId),
        eq(products.userId, user.id)
      ))
      .returning();

    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

