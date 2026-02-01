-- Auth + pricing schema for SonarExtractor
-- Run in Supabase Dashboard > SQL Editor
-- Idempotent where possible

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'startup')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Credits (packs achetés, valables à vie, consommés après quotas mensuels)
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack TEXT NOT NULL CHECK (pack IN ('small', 'medium', 'large', 'xl')),
  scraps_total INTEGER NOT NULL,
  scraps_remaining INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);

-- 3. Usage mensuel (scraps par mois pour réinitialisation)
CREATE TABLE IF NOT EXISTS usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM'
  scraps_used INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, period)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_period ON usage(user_id, period);

-- 4. Historique des scrapes (optionnel, pour déduplication / historique)
CREATE TABLE IF NOT EXISTS scrapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  location TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrapes_user_id ON scrapes(user_id);
CREATE INDEX IF NOT EXISTS idx_scrapes_created_at ON scrapes(created_at DESC);

-- 5. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrapes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own credits" ON credits;
CREATE POLICY "Users can view own credits" ON credits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own usage" ON usage;
CREATE POLICY "Users can view own usage" ON usage FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own scrapes" ON scrapes;
CREATE POLICY "Users can view own scrapes" ON scrapes FOR SELECT USING (auth.uid() = user_id);

-- Service role / API will INSERT usage, credits, scrapes via service client.

-- 6. Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
