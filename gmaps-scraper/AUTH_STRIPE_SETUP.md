# Auth + Stripe – configuration

## 1. Dépendances

```bash
npm install
```

Assure-toi que `@supabase/ssr` et `stripe` sont bien installés.

## 2. Supabase

### Schéma

Exécute le script SQL dans **Supabase Dashboard > SQL Editor** :

- `supabase/schema-auth-pricing.sql`

Cela crée `profiles`, `credits`, `usage`, `scrapes` et le trigger de création de profil à l’inscription.

### Auth

- **Authentication > Providers** : active **Email**.
- **Authentication > URL Configuration** :
  - **Site URL** : `http://localhost:3000` (ou ton domaine de prod).
  - **Redirect URLs** : ajoute  
    `http://localhost:3000/auth/callback`  
    et en prod `https://ton-domaine.com/auth/callback`.

### Variables d’environnement

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Dashboard > API > service_role)

## 3. Stripe

### Produits et prix

Crée dans **Stripe Dashboard > Produits** :

| Produit     | Prix   | Type        | ID env                          |
|------------|--------|-------------|----------------------------------|
| Pro        | $20/mois | Récurrent | `STRIPE_PRICE_PRO_MONTHLY`      |
| Startup    | $79/mois | Récurrent | `STRIPE_PRICE_STARTUP_MONTHLY`  |
| Crédits Small  | $25   | Paiement unique | `STRIPE_PRICE_CREDIT_SMALL`  |
| Crédits Medium | $99   | Paiement unique | `STRIPE_PRICE_CREDIT_MEDIUM` |
| Crédits Large | $149  | Paiement unique | `STRIPE_PRICE_CREDIT_LARGE`  |
| Crédits XL    | $399  | Paiement unique | `STRIPE_PRICE_CREDIT_XL`     |

### Webhook

1. **Developers > Webhooks > Add endpoint**
2. URL : `https://ton-domaine.com/api/stripe/webhook` (ou `http://localhost:3000/api/stripe/webhook` en dev avec Stripe CLI).
3. Événements : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copie le **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Variables d’environnement

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_STARTUP_MONTHLY`
- `STRIPE_PRICE_CREDIT_SMALL`
- `STRIPE_PRICE_CREDIT_MEDIUM`
- `STRIPE_PRICE_CREDIT_LARGE`
- `STRIPE_PRICE_CREDIT_XL`

## 4. App

- `NEXT_PUBLIC_APP_URL` : URL de l’app (ex. `http://localhost:3000` ou `https://...`).

## 5. Test en local

```bash
npm run dev
```

- Inscription : `/signup`
- Connexion : `/login`
- Extraction : formulaire sur `/` (réservé aux utilisateurs connectés).

Pour tester les webhooks Stripe en local :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Utilise le **Signing secret** fourni par la CLI pour `STRIPE_WEBHOOK_SECRET` en dev.
