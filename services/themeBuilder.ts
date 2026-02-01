import type { 
  ThemeConfig, 
  FAQItem,
  AIGeneratedContent 
} from '@/types';
import type { ShopifyThemeAsset } from '@/types/shopify';

// ============================================
// Theme Builder Service
// ============================================

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  name: 'Dropifi Theme',
  colors: {
    primary: '#2563eb',
    secondary: '#1e40af',
    background: '#ffffff',
    text: '#1f2937',
    accent: '#f59e0b',
  },
  typography: {
    headingFont: 'system-ui, -apple-system, sans-serif',
    bodyFont: 'system-ui, -apple-system, sans-serif',
  },
  sections: {
    hero: {
      title: 'Welcome to Our Store',
      subtitle: 'Discover amazing products',
      ctaText: 'Shop Now',
    },
    product: {
      layout: 'featured',
      showPrice: true,
      showDescription: true,
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [],
    },
  },
};

/**
 * Build a complete Shopify theme
 */
export function buildTheme(
  config: Partial<ThemeConfig> = {},
  productContent?: AIGeneratedContent
): ShopifyThemeAsset[] {
  const mergedConfig = mergeConfig(DEFAULT_THEME_CONFIG, config);
  
  // Update FAQ from AI content if available
  if (productContent?.faq) {
    mergedConfig.sections.faq.items = productContent.faq;
  }

  const assets: ShopifyThemeAsset[] = [];

  // Layout files
  assets.push(buildThemeLayout(mergedConfig));
  
  // Template files
  assets.push(buildIndexTemplate());
  assets.push(buildProductTemplate());
  
  // Section files
  assets.push(buildHeroSection(mergedConfig));
  assets.push(buildProductSection(mergedConfig));
  assets.push(buildFAQSection(mergedConfig));
  assets.push(buildHeaderSection(mergedConfig));
  assets.push(buildFooterSection(mergedConfig));

  // Config files
  assets.push(buildSettingsSchema(mergedConfig));
  assets.push(buildSettingsData(mergedConfig));

  // Snippet files
  assets.push(buildProductCardSnippet());

  // Asset files (CSS)
  assets.push(buildMainCSS(mergedConfig));

  return assets;
}

/**
 * Build theme.liquid layout
 */
function buildThemeLayout(config: ThemeConfig): ShopifyThemeAsset {
  const value = `<!DOCTYPE html>
<html lang="{{ shop.locale }}">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <title>{{ page_title }} | {{ shop.name }}</title>
  
  {% if page_description %}
    <meta name="description" content="{{ page_description | escape }}">
  {% endif %}
  
  <link rel="canonical" href="{{ canonical_url }}">
  
  {{ 'main.css' | asset_url | stylesheet_tag }}
  
  {{ content_for_header }}
  
  <style>
    :root {
      --color-primary: ${config.colors.primary};
      --color-secondary: ${config.colors.secondary};
      --color-background: ${config.colors.background};
      --color-text: ${config.colors.text};
      --color-accent: ${config.colors.accent};
      --font-heading: ${config.typography.headingFont};
      --font-body: ${config.typography.bodyFont};
    }
  </style>
</head>

<body class="template-{{ template | replace: '.', '-' }}">
  {% section 'header' %}
  
  <main id="main-content" role="main">
    {{ content_for_layout }}
  </main>
  
  {% section 'footer' %}
</body>
</html>`;

  return { key: 'layout/theme.liquid', value };
}

/**
 * Build index.json template
 */
function buildIndexTemplate(): ShopifyThemeAsset {
  const value = JSON.stringify({
    sections: {
      hero: {
        type: 'hero',
        settings: {},
      },
      'featured-products': {
        type: 'product-section',
        settings: {},
      },
      faq: {
        type: 'faq',
        settings: {},
      },
    },
    order: ['hero', 'featured-products', 'faq'],
  }, null, 2);

  return { key: 'templates/index.json', value };
}

/**
 * Build product.json template
 */
function buildProductTemplate(): ShopifyThemeAsset {
  const value = JSON.stringify({
    sections: {
      main: {
        type: 'product-section',
        settings: {
          show_vendor: false,
        },
      },
      faq: {
        type: 'faq',
        settings: {},
      },
    },
    order: ['main', 'faq'],
  }, null, 2);

  return { key: 'templates/product.json', value };
}

/**
 * Build hero section
 */
function buildHeroSection(config: ThemeConfig): ShopifyThemeAsset {
  const { hero } = config.sections;
  
  const value = `{% schema %}
{
  "name": "Hero",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "${hero.title}"
    },
    {
      "type": "text",
      "id": "subtitle",
      "label": "Subtitle",
      "default": "${hero.subtitle}"
    },
    {
      "type": "text",
      "id": "cta_text",
      "label": "Button Text",
      "default": "${hero.ctaText}"
    },
    {
      "type": "url",
      "id": "cta_link",
      "label": "Button Link"
    },
    {
      "type": "image_picker",
      "id": "background_image",
      "label": "Background Image"
    }
  ]
}
{% endschema %}

<section class="hero">
  {% if section.settings.background_image %}
    <div class="hero__background">
      {{ section.settings.background_image | image_url: width: 1920 | image_tag }}
    </div>
  {% endif %}
  
  <div class="hero__content container">
    <h1 class="hero__title">{{ section.settings.title }}</h1>
    <p class="hero__subtitle">{{ section.settings.subtitle }}</p>
    
    {% if section.settings.cta_link %}
      <a href="{{ section.settings.cta_link }}" class="btn btn--primary">
        {{ section.settings.cta_text }}
      </a>
    {% endif %}
  </div>
</section>`;

  return { key: 'sections/hero.liquid', value };
}

/**
 * Build product section
 */
function buildProductSection(config: ThemeConfig): ShopifyThemeAsset {
  const { product: productConfig } = config.sections;
  
  const value = `{% schema %}
{
  "name": "Product Section",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_price",
      "label": "Show Price",
      "default": ${productConfig.showPrice}
    },
    {
      "type": "checkbox",
      "id": "show_description",
      "label": "Show Description",
      "default": ${productConfig.showDescription}
    },
    {
      "type": "checkbox",
      "id": "show_vendor",
      "label": "Show Vendor",
      "default": false
    }
  ]
}
{% endschema %}

{% if template contains 'product' %}
  <section class="product-section">
    <div class="container">
      <div class="product-section__grid">
        <div class="product-section__images">
          {% if product.featured_image %}
            <div class="product-section__main-image">
              {{ product.featured_image | image_url: width: 800 | image_tag: class: 'product-image' }}
            </div>
          {% endif %}
          
          {% if product.images.size > 1 %}
            <div class="product-section__thumbnails">
              {% for image in product.images %}
                <button class="product-section__thumbnail" data-image-id="{{ image.id }}">
                  {{ image | image_url: width: 100 | image_tag }}
                </button>
              {% endfor %}
            </div>
          {% endif %}
        </div>
        
        <div class="product-section__info">
          {% if section.settings.show_vendor and product.vendor %}
            <p class="product-section__vendor">{{ product.vendor }}</p>
          {% endif %}
          
          <h1 class="product-section__title">{{ product.title }}</h1>
          
          {% if section.settings.show_price %}
            <p class="product-section__price">
              {{ product.price | money }}
              {% if product.compare_at_price > product.price %}
                <span class="product-section__compare-price">{{ product.compare_at_price | money }}</span>
              {% endif %}
            </p>
          {% endif %}
          
          {% if section.settings.show_description %}
            <div class="product-section__description">
              {{ product.description }}
            </div>
          {% endif %}
          
          {% form 'product', product %}
            {% if product.variants.size > 1 %}
              <div class="product-section__variants">
                {% for variant in product.variants %}
                  <label class="variant-option">
                    <input type="radio" name="id" value="{{ variant.id }}" {% if forloop.first %}checked{% endif %}>
                    <span>{{ variant.title }} - {{ variant.price | money }}</span>
                  </label>
                {% endfor %}
              </div>
            {% else %}
              <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
            {% endif %}
            
            <div class="product-section__quantity">
              <label for="quantity">Quantity</label>
              <input type="number" id="quantity" name="quantity" value="1" min="1">
            </div>
            
            <button type="submit" class="btn btn--primary btn--full-width">
              Add to Cart
            </button>
          {% endform %}
        </div>
      </div>
    </div>
  </section>
{% else %}
  <section class="featured-products">
    <div class="container">
      <h2 class="section-title">Featured Products</h2>
      <div class="product-grid">
        {% for product in collections.all.products limit: 4 %}
          {% render 'product-card', product: product, show_price: section.settings.show_price %}
        {% endfor %}
      </div>
    </div>
  </section>
{% endif %}`;

  return { key: 'sections/product-section.liquid', value };
}

/**
 * Build FAQ section
 */
function buildFAQSection(config: ThemeConfig): ShopifyThemeAsset {
  const { faq } = config.sections;
  
  // Build blocks from FAQ items
  const blocks = faq.items.map((item, index) => ({
    type: 'faq_item',
    settings: {
      question: item.question,
      answer: item.answer,
    },
  }));

  const value = `{% schema %}
{
  "name": "FAQ",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "${faq.title}"
    }
  ],
  "blocks": [
    {
      "type": "faq_item",
      "name": "FAQ Item",
      "settings": [
        {
          "type": "text",
          "id": "question",
          "label": "Question"
        },
        {
          "type": "richtext",
          "id": "answer",
          "label": "Answer"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "FAQ",
      "blocks": ${JSON.stringify(blocks)}
    }
  ]
}
{% endschema %}

<section class="faq-section">
  <div class="container">
    <h2 class="section-title">{{ section.settings.title }}</h2>
    
    <div class="faq-list">
      {% for block in section.blocks %}
        <details class="faq-item" {{ block.shopify_attributes }}>
          <summary class="faq-item__question">
            {{ block.settings.question }}
            <span class="faq-item__icon">+</span>
          </summary>
          <div class="faq-item__answer">
            {{ block.settings.answer }}
          </div>
        </details>
      {% endfor %}
    </div>
  </div>
</section>`;

  return { key: 'sections/faq.liquid', value };
}

/**
 * Build header section
 */
function buildHeaderSection(config: ThemeConfig): ShopifyThemeAsset {
  const value = `{% schema %}
{
  "name": "Header",
  "settings": [
    {
      "type": "image_picker",
      "id": "logo",
      "label": "Logo"
    }
  ]
}
{% endschema %}

<header class="header">
  <div class="container header__container">
    <a href="/" class="header__logo">
      {% if section.settings.logo %}
        {{ section.settings.logo | image_url: width: 200 | image_tag }}
      {% else %}
        {{ shop.name }}
      {% endif %}
    </a>
    
    <nav class="header__nav">
      {% for link in linklists.main-menu.links %}
        <a href="{{ link.url }}" class="header__nav-link">{{ link.title }}</a>
      {% endfor %}
    </nav>
    
    <div class="header__actions">
      <a href="/cart" class="header__cart">
        Cart ({{ cart.item_count }})
      </a>
    </div>
  </div>
</header>`;

  return { key: 'sections/header.liquid', value };
}

/**
 * Build footer section
 */
function buildFooterSection(config: ThemeConfig): ShopifyThemeAsset {
  const value = `{% schema %}
{
  "name": "Footer",
  "settings": [
    {
      "type": "text",
      "id": "copyright",
      "label": "Copyright Text",
      "default": "All rights reserved."
    }
  ]
}
{% endschema %}

<footer class="footer">
  <div class="container footer__container">
    <div class="footer__content">
      <p class="footer__copyright">
        &copy; {{ 'now' | date: '%Y' }} {{ shop.name }}. {{ section.settings.copyright }}
      </p>
      
      <nav class="footer__nav">
        {% for link in linklists.footer.links %}
          <a href="{{ link.url }}" class="footer__link">{{ link.title }}</a>
        {% endfor %}
      </nav>
    </div>
  </div>
</footer>`;

  return { key: 'sections/footer.liquid', value };
}

/**
 * Build product card snippet
 */
function buildProductCardSnippet(): ShopifyThemeAsset {
  const value = `<article class="product-card">
  <a href="{{ product.url }}" class="product-card__link">
    {% if product.featured_image %}
      <div class="product-card__image">
        {{ product.featured_image | image_url: width: 400 | image_tag: loading: 'lazy' }}
      </div>
    {% endif %}
    
    <div class="product-card__info">
      <h3 class="product-card__title">{{ product.title }}</h3>
      
      {% if show_price %}
        <p class="product-card__price">{{ product.price | money }}</p>
      {% endif %}
    </div>
  </a>
</article>`;

  return { key: 'snippets/product-card.liquid', value };
}

/**
 * Build settings_schema.json
 */
function buildSettingsSchema(config: ThemeConfig): ShopifyThemeAsset {
  const value = JSON.stringify([
    {
      name: 'theme_info',
      theme_name: config.name,
      theme_version: '1.0.0',
      theme_author: 'Dropifi',
      theme_documentation_url: 'https://dropifi.com/docs',
      theme_support_url: 'https://dropifi.com/support',
    },
    {
      name: 'Colors',
      settings: [
        {
          type: 'color',
          id: 'color_primary',
          label: 'Primary Color',
          default: config.colors.primary,
        },
        {
          type: 'color',
          id: 'color_secondary',
          label: 'Secondary Color',
          default: config.colors.secondary,
        },
        {
          type: 'color',
          id: 'color_background',
          label: 'Background Color',
          default: config.colors.background,
        },
        {
          type: 'color',
          id: 'color_text',
          label: 'Text Color',
          default: config.colors.text,
        },
        {
          type: 'color',
          id: 'color_accent',
          label: 'Accent Color',
          default: config.colors.accent,
        },
      ],
    },
    {
      name: 'Typography',
      settings: [
        {
          type: 'font_picker',
          id: 'font_heading',
          label: 'Heading Font',
          default: 'assistant_n4',
        },
        {
          type: 'font_picker',
          id: 'font_body',
          label: 'Body Font',
          default: 'assistant_n4',
        },
      ],
    },
  ], null, 2);

  return { key: 'config/settings_schema.json', value };
}

/**
 * Build settings_data.json
 */
function buildSettingsData(config: ThemeConfig): ShopifyThemeAsset {
  const value = JSON.stringify({
    current: {
      color_primary: config.colors.primary,
      color_secondary: config.colors.secondary,
      color_background: config.colors.background,
      color_text: config.colors.text,
      color_accent: config.colors.accent,
    },
  }, null, 2);

  return { key: 'config/settings_data.json', value };
}

/**
 * Build main CSS file
 */
function buildMainCSS(config: ThemeConfig): ShopifyThemeAsset {
  const value = `/* Dropifi Theme - Main Styles */

/* Reset & Base */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-background);
  line-height: 1.6;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: 1.2;
  margin-bottom: 1rem;
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.5rem; }

.section-title {
  text-align: center;
  margin-bottom: 2rem;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  background-color: var(--color-primary);
  color: white;
}

.btn--primary:hover {
  background-color: var(--color-secondary);
}

.btn--full-width {
  width: 100%;
  text-align: center;
}

/* Header */
.header {
  background-color: var(--color-background);
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header__logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  text-decoration: none;
}

.header__nav {
  display: flex;
  gap: 2rem;
}

.header__nav-link {
  color: var(--color-text);
  text-decoration: none;
  transition: color 0.2s;
}

.header__nav-link:hover {
  color: var(--color-primary);
}

.header__cart {
  color: var(--color-text);
  text-decoration: none;
}

/* Hero */
.hero {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  overflow: hidden;
}

.hero__background {
  position: absolute;
  inset: 0;
  opacity: 0.3;
}

.hero__background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__content {
  position: relative;
  z-index: 1;
  max-width: 800px;
}

.hero__title {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero__subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* Product Section */
.product-section {
  padding: 4rem 0;
}

.product-section__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

@media (max-width: 768px) {
  .product-section__grid {
    grid-template-columns: 1fr;
  }
}

.product-section__main-image img {
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

.product-section__thumbnails {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.product-section__thumbnail {
  border: 2px solid transparent;
  border-radius: 0.25rem;
  padding: 0;
  cursor: pointer;
  background: none;
}

.product-section__thumbnail:hover,
.product-section__thumbnail.active {
  border-color: var(--color-primary);
}

.product-section__thumbnail img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 0.25rem;
}

.product-section__vendor {
  color: #6b7280;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.product-section__title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.product-section__price {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.product-section__compare-price {
  text-decoration: line-through;
  color: #9ca3af;
  font-size: 1rem;
  margin-left: 0.5rem;
}

.product-section__description {
  margin-bottom: 2rem;
  color: #4b5563;
}

.product-section__variants {
  margin-bottom: 1.5rem;
}

.variant-option {
  display: block;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  cursor: pointer;
}

.variant-option:has(input:checked) {
  border-color: var(--color-primary);
  background-color: #f0f9ff;
}

.variant-option input {
  margin-right: 0.5rem;
}

.product-section__quantity {
  margin-bottom: 1.5rem;
}

.product-section__quantity label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.product-section__quantity input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 1rem;
}

/* Featured Products */
.featured-products {
  padding: 4rem 0;
  background-color: #f9fafb;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

/* Product Card */
.product-card {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-card__link {
  text-decoration: none;
  color: inherit;
}

.product-card__image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-card__info {
  padding: 1rem;
}

.product-card__title {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.product-card__price {
  font-weight: 600;
  color: var(--color-primary);
}

/* FAQ */
.faq-section {
  padding: 4rem 0;
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  border-bottom: 1px solid #e5e7eb;
}

.faq-item__question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  cursor: pointer;
  font-weight: 600;
  list-style: none;
}

.faq-item__question::-webkit-details-marker {
  display: none;
}

.faq-item__icon {
  font-size: 1.5rem;
  transition: transform 0.2s;
}

.faq-item[open] .faq-item__icon {
  transform: rotate(45deg);
}

.faq-item__answer {
  padding-bottom: 1.5rem;
  color: #4b5563;
}

/* Footer */
.footer {
  background-color: #1f2937;
  color: white;
  padding: 2rem 0;
}

.footer__container {
  text-align: center;
}

.footer__copyright {
  margin-bottom: 1rem;
  opacity: 0.8;
}

.footer__nav {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.footer__link {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.footer__link:hover {
  opacity: 1;
}

/* Utilities */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;

  return { key: 'assets/main.css', value };
}

/**
 * Deep merge theme configs
 */
function mergeConfig(
  defaults: ThemeConfig,
  overrides: Partial<ThemeConfig>
): ThemeConfig {
  return {
    name: overrides.name || defaults.name,
    colors: { ...defaults.colors, ...overrides.colors },
    typography: { ...defaults.typography, ...overrides.typography },
    sections: {
      hero: { ...defaults.sections.hero, ...overrides.sections?.hero },
      product: { ...defaults.sections.product, ...overrides.sections?.product },
      faq: { ...defaults.sections.faq, ...overrides.sections?.faq },
    },
  };
}

export default {
  buildTheme,
  DEFAULT_THEME_CONFIG,
};

