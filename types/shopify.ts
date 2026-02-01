// ============================================
// Shopify API Types
// ============================================

export interface ShopifyRestClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, data: unknown): Promise<T>;
  put<T>(path: string, data: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}

export interface ShopifyThemeAsset {
  key: string;
  value: string;
  content_type?: string;
}

export interface ShopifyTheme {
  id: number;
  name: string;
  role: 'main' | 'unpublished' | 'demo';
  created_at: string;
  updated_at: string;
}

export interface ShopifyPage {
  id?: number;
  title: string;
  body_html: string;
  handle?: string;
  published?: boolean;
}

export interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export interface ShopifyWebhook {
  id?: number;
  topic: string;
  address: string;
  format: 'json' | 'xml';
}

// Shopify Admin API Response wrappers
export interface ShopifyProductResponse {
  product: ShopifyProductFull;
}

export interface ShopifyProductsResponse {
  products: ShopifyProductFull[];
}

export interface ShopifyProductFull {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string | null;
  template_suffix: string | null;
  published_scope: string;
  tags: string;
  status: 'active' | 'archived' | 'draft';
  admin_graphql_api_id: string;
  variants: ShopifyVariantFull[];
  options: ShopifyOption[];
  images: ShopifyImageFull[];
  image: ShopifyImageFull | null;
}

export interface ShopifyVariantFull {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string | null;
  grams: number;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

export interface ShopifyOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyImageFull {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
  admin_graphql_api_id: string;
}

export interface ShopifyThemeResponse {
  theme: ShopifyTheme;
}

export interface ShopifyThemesResponse {
  themes: ShopifyTheme[];
}

export interface ShopifyAssetResponse {
  asset: ShopifyThemeAsset;
}

export interface ShopifyPageResponse {
  page: ShopifyPage;
}

export interface ShopifyPagesResponse {
  pages: ShopifyPage[];
}

