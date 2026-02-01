-- Table leads pour SonarExtractor
-- Colle ce SQL dans Supabase Dashboard > SQL Editor > Run
-- Idempotent : peut être exécuté plusieurs fois sans erreur

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT,
  location TEXT,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies : lecture publique, insertion publique (pour MVP)
-- Supprime d'abord si elles existent, puis recrée
DROP POLICY IF EXISTS "Enable read access for all users" ON leads;
CREATE POLICY "Enable read access for all users" 
  ON leads FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON leads;
CREATE POLICY "Enable insert for authenticated users" 
  ON leads FOR INSERT 
  WITH CHECK (true);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_query ON leads(query);
