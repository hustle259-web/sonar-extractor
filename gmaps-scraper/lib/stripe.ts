import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
export const stripe = key
  ? new Stripe(key, { apiVersion: '2025-02-24.acacia', typescript: true })
  : (null as unknown as Stripe);

/** Price IDs from Stripe Dashboard. Set in .env.local */
export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  startup_monthly: process.env.STRIPE_PRICE_STARTUP_MONTHLY!,
  credit_small: process.env.STRIPE_PRICE_CREDIT_SMALL!,
  credit_medium: process.env.STRIPE_PRICE_CREDIT_MEDIUM!,
  credit_large: process.env.STRIPE_PRICE_CREDIT_LARGE!,
  credit_xl: process.env.STRIPE_PRICE_CREDIT_XL!,
} as const;

export type CheckoutMode = 'subscription_pro' | 'subscription_startup' | 'credits_small' | 'credits_medium' | 'credits_large' | 'credits_xl';
