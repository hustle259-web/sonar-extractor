-- Ajouter le code promo 67023503
-- À exécuter dans Neon Console > SQL Editor
INSERT INTO promo_codes (code, active) VALUES ('67023503', true) ON CONFLICT (code) DO NOTHING;
