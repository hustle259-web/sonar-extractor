import { hash, compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sql } from '@/lib/neon';

const SESSION_COOKIE = 'sonar_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export { SESSION_COOKIE, SESSION_MAX_AGE };

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  return compare(password, hashStr);
}

function randomToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<string> {
  if (!sql) throw new Error('DATABASE_URL manquant');
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  await sql`
    INSERT INTO sessions (user_id, token, expires_at) VALUES (${userId}, ${token}, ${expiresAt})
  `;
  return token;
}

export async function getSessionUser(token: string | undefined): Promise<{
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  stripe_customer_id: string | null;
  unlimited_promo: boolean;
} | null> {
  if (!token || !sql) return null;
  const now = new Date().toISOString();
  const rows = await sql`
    SELECT u.id, u.email, u.full_name, u.plan, u.stripe_customer_id, COALESCE(u.unlimited_promo, false) AS unlimited_promo
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > ${now}
  `;
  const r = (rows as { id: string; email: string; full_name: string | null; plan: string; stripe_customer_id: string | null; unlimited_promo: boolean }[])[0];
  return r ?? null;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token || !sql) return;
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

export async function getSessionFromCookies() {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return getSessionUser(token);
}
