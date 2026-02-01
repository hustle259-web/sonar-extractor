-- Schema Neon pour SonarExtractor
-- Auth + données. À exécuter dans Neon Console > SQL Editor

-- 1. Users (auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'startup')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  unlimited_promo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Sessions (auth)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 3. Credits
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack TEXT NOT NULL CHECK (pack IN ('small', 'medium', 'large', 'xl')),
  scraps_total INTEGER NOT NULL,
  scraps_remaining INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);

-- 4. Usage
CREATE TABLE IF NOT EXISTS usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  scraps_used INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, period)
);
CREATE INDEX IF NOT EXISTS idx_usage_user_period ON usage(user_id, period);

-- 5. Promo codes (gérés depuis /admin)
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active);
INSERT INTO promo_codes (code, active) VALUES ('67-02-35-03-45-01', true) ON CONFLICT (code) DO NOTHING;

-- 6. Scrapes
CREATE TABLE IF NOT EXISTS scrapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  location TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scrapes_user_id ON scrapes(user_id);
CREATE INDEX IF NOT EXISTS idx_scrapes_created_at ON scrapes(created_at DESC);
