-- À exécuter si la table users existe déjà (sans unlimited_promo)
ALTER TABLE users ADD COLUMN IF NOT EXISTS unlimited_promo BOOLEAN NOT NULL DEFAULT FALSE;
