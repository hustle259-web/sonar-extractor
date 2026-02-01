// ============================================
// Dropifi Types
// ============================================

// Product Import Types
export interface ScrapedProduct {
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  sourceUrl: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  title: string;
  price: number;
  sku?: string;
  inventory?: number;
}

// AI Generation Types
export interface AIGeneratedContent {
  description: string;
  bulletPoints: string[];
  faq: FAQItem[];
  seoTitle: string;
  seoDescription: string;
  tags: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface AIGenerationRequest {
  productId: number;
  title: string;
  originalDescription: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'luxury' | 'playful';
}

// Shopify Types
export interface ShopifyAuthConfig {
  shopDomain: string;
  apiKey: string;
  apiSecret: string;
  scopes: string[];
  redirectUri: string;
}

export interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
}

export interface ShopifyShop {
  id: number;
  name: string;
  email: string;
  domain: string;
  myshopify_domain: string;
  currency: string;
}

export interface ShopifyProduct {
  id?: number;
  title: string;
  body_html: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

export interface ShopifyVariant {
  title: string;
  price: string;
  sku?: string;
  inventory_quantity?: number;
  requires_shipping?: boolean;
}

export interface ShopifyImage {
  src: string;
  alt?: string;
  position?: number;
}

// Theme Builder Types
export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  sections: ThemeSections;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
}

export interface ThemeSections {
  hero: HeroSection;
  product: ProductSection;
  faq: FAQSection;
}

export interface HeroSection {
  title: string;
  subtitle: string;
  ctaText: string;
  backgroundImage?: string;
}

export interface ProductSection {
  layout: 'grid' | 'list' | 'featured';
  showPrice: boolean;
  showDescription: boolean;
}

export interface FAQSection {
  title: string;
  items: FAQItem[];
}

// Generation Job Types
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationJob {
  id: number;
  userId: number;
  shopId: number;
  status: JobStatus;
  sourceUrl: string;
  steps: JobStep[];
  currentStep: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface JobStep {
  name: string;
  status: JobStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export type GenerationStepName = 
  | 'scrape'
  | 'ai_generate'
  | 'build_theme'
  | 'upload_theme'
  | 'create_product'
  | 'create_pages';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Queue Types
export interface StoreGenerationPayload {
  jobId: number;
  userId: number;
  shopId: number;
  sourceUrl: string;
  themeConfig?: Partial<ThemeConfig>;
}

