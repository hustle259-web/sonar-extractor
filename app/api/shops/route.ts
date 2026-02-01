import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { shops } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import type { ApiResponse } from '@/types';

// ============================================
// GET /api/shops
// Get all shops for the current user
// ============================================

export async function GET(): Promise<NextResponse<ApiResponse<{ shops: typeof shops.$inferSelect[] }>>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userShops = await db.query.shops.findMany({
      where: eq(shops.userId, user.id),
      orderBy: (shops, { desc }) => [desc(shops.createdAt)],
    });

    return NextResponse.json({
      success: true,
      data: { shops: userShops },
    });
  } catch (error) {
    console.error('Get shops error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get shops' },
      { status: 500 }
    );
  }
}

