import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { shops, shopifyTokens } from '@/lib/db/schema';
import { 
  exchangeCodeForToken, 
  verifyHmac, 
  createShopifyClient 
} from '@/services/shopify';
import type { ApiResponse } from '@/types';

// ============================================
// GET /api/shopify/auth/callback
// Handle Shopify OAuth callback
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse> | NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract OAuth parameters
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    // Validate required parameters
    if (!code || !shop || !state || !hmac) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_params', request.url)
      );
    }

    // Get stored state from cookie
    const cookieStore = await cookies();
    const storedState = cookieStore.get('shopify_oauth_state')?.value;
    const storedShop = cookieStore.get('shopify_oauth_shop')?.value;
    const storedUserId = cookieStore.get('shopify_oauth_user')?.value;

    // Verify state
    if (state !== storedState) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_state', request.url)
      );
    }

    // Verify shop matches
    if (shop !== storedShop) {
      return NextResponse.redirect(
        new URL('/dashboard?error=shop_mismatch', request.url)
      );
    }

    if (!storedUserId) {
      return NextResponse.redirect(
        new URL('/dashboard?error=no_user', request.url)
      );
    }

    const userId = parseInt(storedUserId, 10);

    // Verify HMAC
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'hmac') {
        queryParams[key] = value;
      }
    });

    const isValidHmac = verifyHmac(queryParams, hmac);
    if (!isValidHmac) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_hmac', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(shop, code);

    // Get shop info from Shopify
    const client = createShopifyClient(shop, tokenResponse.access_token);
    const shopInfo = await client.getShop();

    // Check if shop already exists
    let existingShop = await db.query.shops.findFirst({
      where: eq(shops.myshopifyDomain, shop),
    });

    if (existingShop) {
      // Update existing shop
      await db
        .update(shops)
        .set({
          name: shopInfo.name,
          domain: shopInfo.domain,
          userId,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(shops.id, existingShop.id));

      // Update token
      await db
        .update(shopifyTokens)
        .set({
          accessToken: tokenResponse.access_token,
          scope: tokenResponse.scope,
          updatedAt: new Date(),
        })
        .where(eq(shopifyTokens.shopId, existingShop.id));
    } else {
      // Create new shop
      const [newShop] = await db
        .insert(shops)
        .values({
          userId,
          name: shopInfo.name,
          domain: shopInfo.domain,
          myshopifyDomain: shop,
          isActive: true,
        })
        .returning();

      existingShop = newShop;

      // Create token record
      await db
        .insert(shopifyTokens)
        .values({
          shopId: newShop.id,
          accessToken: tokenResponse.access_token,
          scope: tokenResponse.scope,
        });
    }

    // Clear OAuth cookies
    cookieStore.delete('shopify_oauth_state');
    cookieStore.delete('shopify_oauth_shop');
    cookieStore.delete('shopify_oauth_user');

    // Redirect to dashboard with success
    return NextResponse.redirect(
      new URL(`/dashboard?shopify_connected=true&shop_id=${existingShop.id}`, request.url)
    );
  } catch (error) {
    console.error('Shopify auth callback error:', error);
    
    const message = error instanceof Error ? error.message : 'Authentication failed';
    
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}

