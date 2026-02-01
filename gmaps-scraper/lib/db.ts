import { sql } from '@/lib/neon';
import type { PlanId } from '@/lib/plans';

function requireSql() {
  if (!sql) throw new Error('DATABASE_URL manquant');
  return sql;
}

export type DbUser = {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  unlimited_promo: boolean;
};

export async function getUser(userId: string): Promise<DbUser | null> {
  const s = requireSql();
  const rows = await s`
    SELECT id, email, full_name, plan, stripe_customer_id, stripe_subscription_id, COALESCE(unlimited_promo, false) AS unlimited_promo FROM users WHERE id = ${userId}
  `;
  return (rows as DbUser[])[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<(DbUser & { password_hash: string }) | null> {
  const s = requireSql();
  const rows = await s`
    SELECT id, email, full_name, plan, stripe_customer_id, stripe_subscription_id, COALESCE(unlimited_promo, false) AS unlimited_promo, password_hash FROM users WHERE email = ${email}
  `;
  return (rows as (DbUser & { password_hash: string })[])[0] ?? null;
}

export async function setUnlimitedPromo(userId: string): Promise<void> {
  const s = requireSql();
  const now = new Date().toISOString();
  await s`UPDATE users SET unlimited_promo = true, updated_at = ${now} WHERE id = ${userId}`;
}

export async function createUser(email: string, passwordHash: string, fullName?: string): Promise<string> {
  const s = requireSql();
  const rows = await s`
    INSERT INTO users (email, password_hash, full_name, plan)
    VALUES (${email}, ${passwordHash}, ${fullName ?? null}, 'free')
    RETURNING id
  `;
  const r = (rows as { id: string }[])[0];
  if (!r) throw new Error('Create user failed');
  return r.id;
}

export async function updateUserStripeCustomer(userId: string, stripeCustomerId: string) {
  const s = requireSql();
  const now = new Date().toISOString();
  await s`UPDATE users SET stripe_customer_id = ${stripeCustomerId}, updated_at = ${now} WHERE id = ${userId}`;
}

export async function updateUserPlan(userId: string, plan: PlanId, stripeSubscriptionId?: string | null) {
  const s = requireSql();
  const now = new Date().toISOString();
  await s`
    UPDATE users SET plan = ${plan}, stripe_subscription_id = ${stripeSubscriptionId ?? null}, updated_at = ${now} WHERE id = ${userId}
  `;
}

export async function getUsage(userId: string, period: string) {
  const s = requireSql();
  const rows = await s`SELECT scraps_used FROM usage WHERE user_id = ${userId} AND period = ${period}`;
  return (rows as { scraps_used: number }[])[0] ?? null;
}

export async function incrementUsage(userId: string, period: string) {
  const s = requireSql();
  const u = await getUsage(userId, period);
  if (u) {
    await s`UPDATE usage SET scraps_used = scraps_used + 1 WHERE user_id = ${userId} AND period = ${period}`;
  } else {
    await s`INSERT INTO usage (user_id, period, scraps_used) VALUES (${userId}, ${period}, 1)`;
  }
}

export async function getCredits(userId: string) {
  const s = requireSql();
  const rows = await s`
    SELECT id, scraps_remaining FROM credits WHERE user_id = ${userId} AND scraps_remaining > 0 ORDER BY purchased_at ASC
  `;
  return rows as { id: string; scraps_remaining: number }[];
}

export async function deductCredit(creditId: string, amount: number) {
  const s = requireSql();
  await s`UPDATE credits SET scraps_remaining = scraps_remaining - ${amount} WHERE id = ${creditId}`;
}

export async function addCredits(userId: string, pack: string, scrapsTotal: number) {
  const s = requireSql();
  await s`
    INSERT INTO credits (user_id, pack, scraps_total, scraps_remaining) VALUES (${userId}, ${pack}, ${scrapsTotal}, ${scrapsTotal})
  `;
}

export async function insertScrape(userId: string, query: string, location: string, resultCount: number) {
  const s = requireSql();
  await s`
    INSERT INTO scrapes (user_id, query, location, result_count) VALUES (${userId}, ${query}, ${location}, ${resultCount})
  `;
}

// Promo codes (admin)
export type PromoCode = { id: string; code: string; active: boolean; created_at: string };

export async function isValidPromoCode(code: string): Promise<boolean> {
  const s = requireSql();
  const rows = await s`
    SELECT id FROM promo_codes WHERE code = ${code.trim()} AND active = true
  `;
  return (rows as { id: string }[]).length > 0;
}

export async function getPromoCodes(): Promise<PromoCode[]> {
  const s = requireSql();
  const rows = await s`SELECT id, code, active, created_at FROM promo_codes ORDER BY created_at DESC`;
  return rows as PromoCode[];
}

export async function addPromoCode(code: string): Promise<void> {
  const s = requireSql();
  await s`INSERT INTO promo_codes (code, active) VALUES (${code.trim()}, true)`;
}

export async function togglePromoCode(id: string, active: boolean): Promise<void> {
  const s = requireSql();
  await s`UPDATE promo_codes SET active = ${active} WHERE id = ${id}`;
}

export async function deletePromoCode(id: string): Promise<void> {
  const s = requireSql();
  await s`DELETE FROM promo_codes WHERE id = ${id}`;
}
