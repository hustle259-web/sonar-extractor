import { setTimeout } from 'node:timers/promises';
import type { LeadItem } from '@/types/leads';
import { getRandomUserAgent } from './user-agents';

const TIMEOUT_MS = 30_000;
const RETRIES = 3;
const SCROLL_DELAY_MS = 2000;

export interface ScraperOptions {
  query: string;
  location: string;
  maxResults: number;
  proxyUrl?: string;
}

export async function scrapeGoogleMaps(options: ScraperOptions): Promise<LeadItem[]> {
  const { query, location, maxResults, proxyUrl } = options;
  const searchQuery = `${query} ${location}`.trim().replace(/\s+/g, ' ');
  const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const { chromium } = await import('playwright');
      const launchOptions: Parameters<typeof chromium.launch>[0] = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      };
      if (proxyUrl) {
        launchOptions.proxy = { server: proxyUrl };
      }

      const browser = await chromium.launch(launchOptions);
      const context = await browser.newContext({
        userAgent: getRandomUserAgent(),
        viewport: { width: 1280, height: 800 },
        locale: 'fr-FR',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(TIMEOUT_MS);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });

      // Wait for results: feed, .Nv2PK cards, or place links
      await page
        .waitForSelector('div[role="feed"], .Nv2PK, a[href*="/maps/place"]', { timeout: 15_000 })
        .catch(() => {});

      const results: LeadItem[] = [];
      const seen = new Set<string>();

      const feed = page.locator('div[role="feed"]').first();
      const cardSelector = '.Nv2PK a[href*="/maps/place"], a[href*="/maps/place"]';

      for (let scroll = 0; scroll < Math.ceil(maxResults / 10) + 2; scroll++) {
        const cards = page.locator(cardSelector);
        const count = await cards.count();

        for (let i = 0; i < count && results.length < maxResults; i++) {
          const card = cards.nth(i);
          try {
            const href = await card.getAttribute('href');
            if (!href) continue;
            const placeId =
              href.match(/!1s(0x[0-9a-f]+:[0-9a-f]+|[\w-]+)/)?.[1] ?? href;
            if (seen.has(placeId)) continue;
            seen.add(placeId);

            const nameEl = card.locator(
              '.fontHeadlineSmall, .NrDZNb, [class*="fontHeadline"]'
            ).first();
            const name =
              (await nameEl.textContent().catch(() => ''))?.trim() ||
              (await card.textContent().catch(() => ''))?.trim() ||
              '';

            const addrEl = card.locator('.W4Efsd').first();
            const address = (await addrEl.textContent().catch(() => ''))?.trim() || '';

            const ratingEl = card.locator('span[role="img"]').first();
            const ratingAttr = await ratingEl.getAttribute('aria-label').catch(() => '');
            const rating = ratingAttr?.replace(/[^\d,.]/g, '').trim() || '';

            let site = '';
            const links = await card.locator('a[href^="http"]').evaluateAll((els) =>
              els.map((a) => (a as HTMLAnchorElement).href).filter((h) => !h.includes('google.com'))
            ).catch(() => []);
            if (Array.isArray(links) && links.length) site = links[0] ?? '';

            if (!name) continue;

            results.push({
              name,
              address,
              phone: '',
              site,
              category: '',
              rating,
            });
          } catch {
            /* skip card */
          }
        }

        if (results.length >= maxResults) break;

        await feed.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        }).catch(() => {});
        await setTimeout(SCROLL_DELAY_MS);
      }

      await browser.close();
      return results;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error('Scraping failed after retries');
}
