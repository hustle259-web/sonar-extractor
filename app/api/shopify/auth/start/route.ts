import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { generateAuthUrl, generateState } from '@/services/shopify';
import { getUser } from '@/lib/db/queries';
import type { ApiResponse } from '@/types';

// ============================================
// GET /api/shopify/auth/start
// Start Shopify OAuth flow
// ============================================

const querySchema = z.object({
  shop: z.string().min(1, 'Shop domain is required'),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ authUrl: string }>> | NextResponse> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get shop domain from query params
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    
    const validation = querySchema.safeParse({ shop });
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Normalize shop domain
    let shopDomain = validation.data.shop;
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }
    shopDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Generate state for CSRF protection
    const state = generateState();

    // Store state and user info in cookie for callback verification
    const cookieStore = await cookies();
    cookieStore.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
    
    cookieStore.set('shopify_oauth_shop', shopDomain, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });
    
    cookieStore.set('shopify_oauth_user', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });

    // Generate authorization URL
    const authUrl = generateAuthUrl(shopDomain, state);

    // Redirect to Shopify
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Shopify auth start error:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to start authentication';
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

