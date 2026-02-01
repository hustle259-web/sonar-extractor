-- Table promo_codes pour gérer les codes depuis /admin
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active);

-- Insérer le code existant si la table est vide
INSERT INTO promo_codes (code, active) VALUES ('67-02-35-03-45-01', true)
ON CONFLICT (code) DO NOTHING;
