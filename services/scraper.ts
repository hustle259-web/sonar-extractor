import * as cheerio from 'cheerio';
import type { ScrapedProduct, ProductVariant } from '@/types';

// ============================================
// Product Scraper Service
// ============================================

interface ScraperConfig {
  timeout?: number;
  userAgent?: string;
}

const DEFAULT_CONFIG: ScraperConfig = {
  timeout: 10000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/**
 * Scrape product information from a URL
 */
export async function scrapeProduct(
  url: string, 
  config: ScraperConfig = {}
): Promise<ScrapedProduct> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': mergedConfig.userAgent!,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(mergedConfig.timeout!),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Detect platform and use appropriate scraper
    const platform = detectPlatform(url, $);
    
    switch (platform) {
      case 'aliexpress':
        return scrapeAliExpress($, url);
      case 'amazon':
        return scrapeAmazon($, url);
      case 'shopify':
        return scrapeShopify($, url);
      default:
        return scrapeGeneric($, url);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Scraping failed: ${error.message}`);
    }
    throw new Error('Scraping failed: Unknown error');
  }
}

/**
 * Detect the e-commerce platform from URL or page content
 */
function detectPlatform(url: string, $: cheerio.CheerioAPI): string {
  const hostname = new URL(url).hostname.toLowerCase();
  
  if (hostname.includes('aliexpress')) return 'aliexpress';
  if (hostname.includes('amazon')) return 'amazon';
  if ($('meta[name="shopify-checkout-api-token"]').length > 0) return 'shopify';
  if ($('link[href*="cdn.shopify.com"]').length > 0) return 'shopify';
  
  return 'generic';
}

/**
 * Scrape AliExpress product page
 */
function scrapeAliExpress($: cheerio.CheerioAPI, url: string): ScrapedProduct {
  const title = $('h1[data-pl="product-title"]').text().trim() ||
                $('h1.product-title-text').text().trim() ||
                $('meta[property="og:title"]').attr('content') || '';

  const description = $('div.product-description').text().trim() ||
                      $('meta[property="og:description"]').attr('content') || '';

  const images = extractImages($, [
    'img.magnifier-image',
    'div.images-view-item img',
    'meta[property="og:image"]',
  ]);

  const priceText = $('span.product-price-value').text().trim() ||
                    $('div.product-price-current').text().trim() ||
                    $('meta[property="product:price:amount"]').attr('content') || '0';

  const price = parsePrice(priceText);
  const currency = $('meta[property="product:price:currency"]').attr('content') || 'USD';

  return {
    title,
    description,
    images,
    price,
    currency,
    sourceUrl: url,
  };
}

/**
 * Scrape Amazon product page
 */
function scrapeAmazon($: cheerio.CheerioAPI, url: string): ScrapedProduct {
  const title = $('#productTitle').text().trim() ||
                $('meta[property="og:title"]').attr('content') || '';

  const description = $('#productDescription').text().trim() ||
                      $('#feature-bullets').text().trim() ||
                      $('meta[name="description"]').attr('content') || '';

  const images = extractImages($, [
    '#imgTagWrapperId img',
    '#landingImage',
    'img.a-dynamic-image',
    'meta[property="og:image"]',
  ]);

  const priceText = $('span.a-price-whole').first().text().trim() ||
                    $('#priceblock_ourprice').text().trim() ||
                    $('#priceblock_dealprice').text().trim() ||
                    $('span.a-offscreen').first().text().trim() || '0';

  const price = parsePrice(priceText);

  return {
    title,
    description,
    images,
    price,
    currency: 'USD',
    sourceUrl: url,
  };
}

/**
 * Scrape Shopify product page
 */
function scrapeShopify($: cheerio.CheerioAPI, url: string): ScrapedProduct {
  // Try to get product JSON data first
  const productJsonScript = $('script[type="application/json"][data-product-json]').text() ||
                            $('script:contains("var product =")').text();

  let productData: Record<string, unknown> | null = null;
  
  try {
    if (productJsonScript) {
      const jsonMatch = productJsonScript.match(/\{[\s\S]*"title"[\s\S]*\}/);
      if (jsonMatch) {
        productData = JSON.parse(jsonMatch[0]);
      }
    }
  } catch {
    // Fall back to HTML scraping
  }

  const title = (productData?.title as string) ||
                $('h1.product-title').text().trim() ||
                $('h1.product__title').text().trim() ||
                $('meta[property="og:title"]').attr('content') || '';

  const description = (productData?.description as string) ||
                      $('div.product-description').html() ||
                      $('div.product__description').html() ||
                      $('meta[property="og:description"]').attr('content') || '';

  const images = extractImages($, [
    'img.product-featured-image',
    'img.product__media-image',
    'div.product-gallery img',
    'meta[property="og:image"]',
  ]);

  // Add images from product data
  if (productData?.images && Array.isArray(productData.images)) {
    const productImages = productData.images as string[];
    productImages.forEach(img => {
      if (!images.includes(img)) {
        images.push(img);
      }
    });
  }

  const priceText = $('span.price').first().text().trim() ||
                    $('span.product__price').first().text().trim() ||
                    $('meta[property="product:price:amount"]').attr('content') || '0';

  const price = parsePrice(priceText);
  const currency = $('meta[property="product:price:currency"]').attr('content') || 'USD';

  // Extract variants
  const variants: ProductVariant[] = [];
  if (productData?.variants && Array.isArray(productData.variants)) {
    const productVariants = productData.variants as Array<{
      title?: string;
      price?: number | string;
      sku?: string;
    }>;
    productVariants.forEach(v => {
      variants.push({
        title: v.title || '',
        price: typeof v.price === 'number' ? v.price / 100 : parsePrice(String(v.price || 0)),
        sku: v.sku,
      });
    });
  }

  return {
    title,
    description: cleanHtml(description),
    images,
    price,
    currency,
    sourceUrl: url,
    variants: variants.length > 0 ? variants : undefined,
  };
}

/**
 * Generic scraper for unknown platforms
 */
function scrapeGeneric($: cheerio.CheerioAPI, url: string): ScrapedProduct {
  // Try common selectors and meta tags
  const title = $('h1').first().text().trim() ||
                $('meta[property="og:title"]').attr('content') ||
                $('meta[name="title"]').attr('content') ||
                $('title').text().trim() || '';

  const description = $('meta[property="og:description"]').attr('content') ||
                      $('meta[name="description"]').attr('content') ||
                      $('[class*="description"]').first().text().trim() || '';

  const images = extractImages($, [
    'meta[property="og:image"]',
    '[class*="product"] img',
    '[class*="gallery"] img',
    'main img',
  ]);

  const priceText = $('[class*="price"]').first().text().trim() ||
                    $('meta[property="product:price:amount"]').attr('content') || '0';

  const price = parsePrice(priceText);
  const currency = $('meta[property="product:price:currency"]').attr('content') || 'USD';

  return {
    title,
    description,
    images,
    price,
    currency,
    sourceUrl: url,
  };
}

/**
 * Extract images from multiple possible selectors
 */
function extractImages($: cheerio.CheerioAPI, selectors: string[]): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      let src: string | undefined;
      
      if (el.type === 'tag') {
        if (el.name === 'meta') {
          src = $(el).attr('content');
        } else if (el.name === 'img') {
          src = $(el).attr('data-src') || 
                $(el).attr('data-lazy-src') || 
                $(el).attr('src');
        }
      }

      if (src && !seen.has(src) && isValidImageUrl(src)) {
        seen.add(src);
        images.push(normalizeImageUrl(src));
      }
    });
  }

  return images.slice(0, 10); // Limit to 10 images
}

/**
 * Parse price string to number
 */
function parsePrice(priceText: string): number {
  // Remove currency symbols and whitespace
  const cleaned = priceText.replace(/[^\d.,]/g, '').trim();
  
  // Handle different number formats (1,234.56 vs 1.234,56)
  let normalized = cleaned;
  
  // If there's both comma and period, determine which is decimal separator
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastPeriod = cleaned.lastIndexOf('.');
    
    if (lastComma > lastPeriod) {
      // European format: 1.234,56
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Could be either format, check position
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      // Likely decimal: 123,45
      normalized = cleaned.replace(',', '.');
    } else {
      // Likely thousands separator: 1,234
      normalized = cleaned.replace(/,/g, '');
    }
  }

  const price = parseFloat(normalized);
  return isNaN(price) ? 0 : Math.round(price * 100) / 100;
}

/**
 * Validate image URL
 */
function isValidImageUrl(url: string): boolean {
  if (!url || url.startsWith('data:')) return false;
  
  try {
    const parsed = new URL(url, 'https://example.com');
    const ext = parsed.pathname.toLowerCase();
    return ext.includes('.jpg') || 
           ext.includes('.jpeg') || 
           ext.includes('.png') || 
           ext.includes('.webp') ||
           ext.includes('.gif') ||
           !ext.includes('.'); // Allow URLs without extensions
  } catch {
    return false;
  }
}

/**
 * Normalize image URL to absolute
 */
function normalizeImageUrl(url: string): string {
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
}

/**
 * Clean HTML content to plain text
 */
function cleanHtml(html: string): string {
  const $ = cheerio.load(html);
  return $.text().trim().replace(/\s+/g, ' ');
}

export default {
  scrapeProduct,
};

