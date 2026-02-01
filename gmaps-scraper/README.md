# SonarExtractor · Google Maps B2B Leads avec Google Places API

## 🚀 Setup Rapide

### 1. Installer les dépendances

```bash
cd /Users/rachidabenayad/Desktop/dropifi/gmaps-scraper
npm install
```

### 2. Configurer Google Places API

**📖 Voir le guide complet : [GOOGLE_PLACES_SETUP.md](./GOOGLE_PLACES_SETUP.md)**

**Résumé rapide :**
1. Va sur https://console.cloud.google.com/
2. Crée un projet
3. Active **Places API (New)**
4. Crée une **clé API**
5. Colle la clé dans `.env.local` :

```bash
GOOGLE_PLACES_API_KEY=AIzaSy...  # Ta clé complète
```

### 3. Configurer Supabase (optionnel - pour sauvegarder)

**Supabase Dashboard → Settings → API** :
- URL : `https://xchnudpqutfkgrmwjdjf.supabase.co`
- anon key : `eyJ...` (clé complète)

Colle dans `.env.local` :
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xchnudpqutfkgrmwjdjf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Créer la table `leads` dans Supabase (optionnel)

**Supabase Dashboard → SQL Editor** → Colle et exécute :

```sql
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT,
  location TEXT,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON leads;
CREATE POLICY "Enable read access for all users" 
  ON leads FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON leads;
CREATE POLICY "Enable insert for authenticated users" 
  ON leads FOR INSERT 
  WITH CHECK (true);
```

### 5. Lancer le serveur

```bash
npm run dev
```

Ouvre http://localhost:3000 → Teste un scrape !

---

## ✅ Avantages de Google Places API vs Scraping

- ✅ **Fiable** : Pas de blocage, pas de captcha
- ✅ **Légal** : API officielle Google
- ✅ **Rapide** : ~1-2 secondes vs 30-40 secondes
- ✅ **Données structurées** : Nom, adresse, téléphone, site, rating
- ✅ **Pas de maintenance** : Pas besoin d'ajuster les sélecteurs CSS

## 💰 Coûts

- **Gratuit** : 200$ de crédit (3 mois) = ~11 700 requêtes
- **Après** : ~0.017$ par requête
- **Exemple** : 1000 scrapes = 17$ (hors crédit gratuit)

---

## 🔧 Dépannage

### ❌ "GOOGLE_PLACES_API_KEY manquante"

1. Vérifie que `.env.local` existe dans `gmaps-scraper/`
2. Vérifie que la variable `GOOGLE_PLACES_API_KEY=...` est présente
3. Redémarre le serveur (`npm run dev`)

### ❌ "Google Places API error: 403"

- Ta clé API n'est pas activée ou restreinte
- Vérifie dans Google Cloud Console que **Places API (New)** est activée
- Vérifie les restrictions de ta clé API

### ❌ "Google Places API error: 400"

- Format de requête invalide
- Vérifie les logs du serveur pour plus de détails

---

## 📊 Vérifier les résultats

**Supabase Dashboard → Table Editor > leads** → Tu verras les scrapes avec `query`, `location`, `data` (JSONB des leads).
