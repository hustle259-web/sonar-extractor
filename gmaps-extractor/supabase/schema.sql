-- Run this in Supabase SQL Editor to create tables and RLS

-- Leads from Google Maps scrapes
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  location TEXT NOT NULL,
  max_results INT NOT NULL DEFAULT 100,
  data JSONB NOT NULL DEFAULT '[]',
  scrape_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  csv_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_scrape_date ON leads(scrape_date);
CREATE INDEX IF NOT EXISTS idx_leads_user_date ON leads(user_id, (scrape_date::date));

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Users can only access their own leads
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  USING (auth.uid() = user_id);
