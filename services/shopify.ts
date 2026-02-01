import crypto from 'crypto';
import type {
  ShopifyAuthConfig,
  ShopifyTokenResponse,
  ShopifyShop,
  ShopifyProduct,
} from '@/types';
import type {
  ShopifyTheme,
  ShopifyThemeAsset,
  ShopifyPage,
  ShopifyProductResponse,
  ShopifyThemeResponse,
  ShopifyThemesResponse,
  ShopifyAssetResponse,
  ShopifyPageResponse,
} from '@/types/shopify';

// ============================================
// Shopify Service
// ============================================

const SHOPIFY_API_VERSION = '2024-01';
const REQUIRED_SCOPES = [
  'write_products',
  'write_themes',
  'write_content',
  'read_products',
  'read_themes',
  'read_content',
];

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(
  shopDomain: string,
  state: string
): string {
  const config = getShopifyConfig();
  const scopes = REQUIRED_SCOPES.join(',');
  
  const params = new URLSearchParams({
    client_id: config.apiKey,
    scope: scopes,
    redirect_uri: config.redirectUri,
    state,
  });

  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Generate a secure state parameter for OAuth
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  shopDomain: string,
  code: string
): Promise<ShopifyTokenResponse> {
  const config = getShopifyConfig();

  const response = await fetch(
    `https://${shopDomain}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.apiKey,
        client_secret: config.apiSecret,
        code,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Verify HMAC signature from Shopify
 */
export function verifyHmac(
  query: Record<string, string>,
  hmac: string
): boolean {
  const config = getShopifyConfig();
  
  // Remove hmac from query params
  const { hmac: _, ...params } = query;
  
  // Sort and encode params
  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const generatedHmac = crypto
    .createHmac('sha256', config.apiSecret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(generatedHmac)
  );
}

/**
 * Create a Shopify REST API client
 */
export function createShopifyClient(shopDomain: string, accessToken: string) {
  const baseUrl = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}`;

  async function request<T>(
    method: string,
    path: string,
    data?: unknown
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    
    return JSON.parse(text);
  }

  return {
    // Shop
    async getShop(): Promise<ShopifyShop> {
      const response = await request<{ shop: ShopifyShop }>('GET', '/shop.json');
      return response.shop;
    },

    // Products
    async createProduct(product: ShopifyProduct): Promise<ShopifyProductResponse> {
      return request<ShopifyProductResponse>('POST', '/products.json', { product });
    },

    async updateProduct(
      productId: number,
      product: Partial<ShopifyProduct>
    ): Promise<ShopifyProductResponse> {
      return request<ShopifyProductResponse>(
        'PUT',
        `/products/${productId}.json`,
        { product }
      );
    },

    async deleteProduct(productId: number): Promise<void> {
      await request<void>('DELETE', `/products/${productId}.json`);
    },

    // Themes
    async getThemes(): Promise<ShopifyTheme[]> {
      const response = await request<ShopifyThemesResponse>('GET', '/themes.json');
      return response.themes;
    },

    async createTheme(name: string, role: 'main' | 'unpublished' = 'unpublished'): Promise<ShopifyTheme> {
      const response = await request<ShopifyThemeResponse>('POST', '/themes.json', {
        theme: { name, role },
      });
      return response.theme;
    },

    async deleteTheme(themeId: number): Promise<void> {
      await request<void>('DELETE', `/themes/${themeId}.json`);
    },

    // Theme Assets
    async getAsset(themeId: number, key: string): Promise<ShopifyThemeAsset> {
      const response = await request<ShopifyAssetResponse>(
        'GET',
        `/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`
      );
      return response.asset;
    },

    async uploadAsset(
      themeId: number,
      asset: ShopifyThemeAsset
    ): Promise<ShopifyThemeAsset> {
      const response = await request<ShopifyAssetResponse>(
        'PUT',
        `/themes/${themeId}/assets.json`,
        { asset }
      );
      return response.asset;
    },

    async deleteAsset(themeId: number, key: string): Promise<void> {
      await request<void>(
        'DELETE',
        `/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`
      );
    },

    // Pages
    async createPage(page: ShopifyPage): Promise<ShopifyPage> {
      const response = await request<ShopifyPageResponse>('POST', '/pages.json', { page });
      return response.page;
    },

    async updatePage(pageId: number, page: Partial<ShopifyPage>): Promise<ShopifyPage> {
      const response = await request<ShopifyPageResponse>(
        'PUT',
        `/pages/${pageId}.json`,
        { page }
      );
      return response.page;
    },

    async deletePage(pageId: number): Promise<void> {
      await request<void>('DELETE', `/pages/${pageId}.json`);
    },
  };
}

/**
 * Upload a complete theme to Shopify
 */
export async function uploadTheme(
  shopDomain: string,
  accessToken: string,
  themeName: string,
  assets: ShopifyThemeAsset[]
): Promise<ShopifyTheme> {
  const client = createShopifyClient(shopDomain, accessToken);

  // Create new theme
  const theme = await client.createTheme(themeName, 'unpublished');

  // Upload all assets
  for (const asset of assets) {
    await client.uploadAsset(theme.id, asset);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return theme;
}

/**
 * Create a product on Shopify from scraped data
 */
export async function createProductFromScraped(
  shopDomain: string,
  accessToken: string,
  product: ShopifyProduct
): Promise<number> {
  const client = createShopifyClient(shopDomain, accessToken);
  
  const response = await client.createProduct(product);
  
  return response.product.id;
}

/**
 * Get Shopify configuration from environment
 */
function getShopifyConfig(): ShopifyAuthConfig {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI;

  if (!apiKey || !apiSecret || !redirectUri) {
    throw new Error('Missing Shopify configuration in environment variables');
  }

  return {
    shopDomain: '', // Set per request
    apiKey,
    apiSecret,
    scopes: REQUIRED_SCOPES,
    redirectUri,
  };
}

export default {
  generateAuthUrl,
  generateState,
  exchangeCodeForToken,
  verifyHmac,
  createShopifyClient,
  uploadTheme,
  createProductFromScraped,
};

