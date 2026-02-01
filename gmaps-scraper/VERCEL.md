# Déployer SonarExtractor sur Vercel

## 1. Préparer le dépôt Git

Si `gmaps-scraper` est dans le dossier `dropifi` :

```bash
cd dropifi
git add .
git commit -m "Deploy SonarExtractor"
git push origin main
```

## 2. Créer le projet sur Vercel

1. Va sur **[vercel.com](https://vercel.com)** → **Add New** → **Project**
2. Importe ton dépôt GitHub/GitLab/Bitbucket
3. **Important** : si `gmaps-scraper` est dans un sous-dossier, configure :
   - **Root Directory** : `gmaps-scraper` (clique sur Edit, sélectionne le dossier)
4. **Framework Preset** : Next.js (détecté automatiquement)
5. Clique sur **Deploy** (le premier build peut échouer sans les variables d’env)

## 3. Variables d'environnement

Dans Vercel → ton projet → **Settings** → **Environment Variables**, ajoute :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `DATABASE_URL` | `postgresql://neondb_owner:...@ep-floral-thunder-ahwlqfvz-pooler...` | Production, Preview |
| `GOOGLE_PLACES_API_KEY` | Ta clé Google Places | Production, Preview |
| `ADMIN_EMAIL` | `anassgaming667@gmail.com` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://ton-projet.vercel.app` | Production, Preview |

**Stripe** (si tu utilises les paiements) :

| Variable | Valeur |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (ou `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (secret du webhook de prod) |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` |
| `STRIPE_PRICE_STARTUP_MONTHLY` | `price_...` |
| `STRIPE_PRICE_CREDIT_SMALL` | `price_...` |
| etc. | |

## 4. Mettre à jour NEXT_PUBLIC_APP_URL

Après le premier déploiement, Vercel te donne une URL (ex. `https://sonar-extractor.vercel.app`).

1. Mets à jour `NEXT_PUBLIC_APP_URL` dans les variables d’env avec cette URL
2. Redéploie (Deployments → ⋮ → Redeploy)

## 5. Stripe Webhook (si tu utilises Stripe)

1. Va sur **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint**
3. URL : `https://ton-projet.vercel.app/api/stripe/webhook`
4. Événements : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copie le **Signing secret** (`whsec_...`) et ajoute-le dans Vercel comme `STRIPE_WEBHOOK_SECRET`

## 6. Redéployer

Après avoir ajouté les variables d’environnement :

- **Deployments** → **⋮** sur le dernier déploiement → **Redeploy**

---

## Checklist rapide

- [ ] Code poussé sur Git
- [ ] Projet Vercel créé avec Root Directory = `gmaps-scraper`
- [ ] `DATABASE_URL` configuré
- [ ] `GOOGLE_PLACES_API_KEY` configuré
- [ ] `ADMIN_EMAIL` configuré
- [ ] `NEXT_PUBLIC_APP_URL` = URL Vercel finale
- [ ] (Optionnel) Stripe configuré + webhook pointant vers l’URL de prod
