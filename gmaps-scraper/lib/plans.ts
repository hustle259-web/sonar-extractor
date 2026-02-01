/**
 * Plans et crédits – alignés avec la grille tarifaire
 * 1 scrap = 1 recherche (jusqu'à 60 leads). Extractions = scraps * 60.
 */

export type PlanId = 'free' | 'pro' | 'startup';

export const PLANS: Record<
  PlanId,
  { name: string; scrapsPerMonth: number; extractions: number; priceUsd: number }
> = {
  free: {
    name: 'Free',
    scrapsPerMonth: 1,
    extractions: 60,
    priceUsd: 0,
  },
  pro: {
    name: 'Pro',
    scrapsPerMonth: 1000,
    extractions: 60_000,
    priceUsd: 20,
  },
  startup: {
    name: 'Startup',
    scrapsPerMonth: 5000,
    extractions: 300_000,
    priceUsd: 79,
  },
};

export type CreditPackId = 'small' | 'medium' | 'large' | 'xl';

export const CREDIT_PACKS: Record<
  CreditPackId,
  { scraps: number; extractions: number; priceUsd: number }
> = {
  small: { scraps: 100, extractions: 6_000, priceUsd: 25 },
  medium: { scraps: 500, extractions: 30_000, priceUsd: 99 },
  large: { scraps: 1000, extractions: 60_000, priceUsd: 149 },
  xl: { scraps: 5000, extractions: 300_000, priceUsd: 399 },
};

export const DEFAULT_PLAN: PlanId = 'free';
