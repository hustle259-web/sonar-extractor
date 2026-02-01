# Google Maps Business Extractor · MVP B2B Lead Gen

SaaS B2B pour extraire des leads depuis Google Maps (nom, adresse, téléphone, site, catégorie, note).  
Next.js 15 (App Router), Playwright, Supabase, Shadcn/ui.

## Fonctionnalités

- **Page d’accueil** : formulaire `query` (ex. dentiste), `location` (ex. Paris), `maxResults` (défaut 100).
- **API `/api/scrape`** : scrape Google Maps via Playwright (headless), user-agents rotatifs, export JSON, sauvegarde Supabase.
- **Page `/results/[id]`** : tableau des leads + **Export CSV** (PapaParse).
- **Auth Supabase** (email/mot de passe) : limite gratuite **10 scrapes/jour** par utilisateur.

## Stack

- **Frontend** : Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, React Hook Form, Zod.
- **Scraping** : Playwright (Chromium).
- **Backend** : Next.js API Routes, Supabase (Postgres + Auth).
- **Export** : PapaParse (CSV).

## Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com) (projet + Auth activé).
- **Playwright** : `npx playwright install chromium` après `npm i` (pour le scraping local).

## Installation

```bash
cd gmaps-extractor
npm i
npx playwright install chromium
cp .env.example .env.local
```

Renseignez dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Base de données Supabase

Exécutez le script SQL `supabase/schema.sql` dans **Supabase → SQL Editor**.  
Cela crée la table `leads` et les politiques RLS.

## Lancer en local

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).  
Inscrivez-vous / connectez-vous, puis lancez un scrape depuis la home.

## Déploiement Vercel

1. **Variables d’environnement** :  
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

2. **Playwright** :  
   Les API Routes qui utilisent Playwright nécessitent un runtime Node avec binaire Chromium.  
   Les **serverless Vercel** ne supportent pas Playwright tel quel. Options :
   - Exécuter `/api/scrape` sur un **service séparé** (Railway, Render, etc.) qui a Playwright installé.
   - Ou utiliser un service type [Browserless](https://www.browserless.io/) + `playwright` avec `connect`.  
   Le reste de l’app (front, auth, `/api/leads`, résultats, CSV) est déployable sur Vercel sans changement.

## Structure

```
app/
  page.tsx              # Home + formulaire
  results/[id]/page.tsx # Résultats + Export CSV
  login/ , signup/      # Auth
  api/
    scrape/route.ts     # POST scrape + sauvegarde
    leads/[id]/route.ts # GET leads par id
lib/
  supabase.ts           # Client navigateur
  supabase-server.ts    # Client serveur (cookies)
  scraper.ts            # Logique Playwright
  csv.ts                # Export CSV
  user-agents.ts        # Rotation user-agents
```

## Rate limiting

- 10 scrapes / jour / utilisateur (comptage sur `leads` par `user_id` et `scrape_date`).
- Retour **429** si quota dépassé.

## Licence

MIT.
