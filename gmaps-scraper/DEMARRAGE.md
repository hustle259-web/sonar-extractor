# Démarrer SonarExtractor

## 1. Base de données Neon

1. Va sur **[console.neon.tech](https://console.neon.tech)** → ton projet.
2. Ouvre **SQL Editor**.
3. Copie tout le contenu de **`neon/schema.sql`** et colle-le dans l’éditeur.
4. Clique sur **Run** pour créer les tables (`users`, `sessions`, `credits`, `usage`, `scrapes`).

Si les tables existent déjà mais sans la colonne `unlimited_promo` :
- Exécute plutôt **`neon/migration-promo.sql`**.

---

## 2. Variables d’environnement

Dans **`gmaps-scraper/.env.local`** tu dois avoir au minimum :

```
DATABASE_URL=postgresql://...   # Connection string Neon (déjà fait)
GOOGLE_PLACES_API_KEY=AIza...  # Ta clé Google Places (déjà fait)
ADMIN_EMAIL=ton@email.com      # Ton email pour accéder à /admin (codes promo)
```

Pour les **paiements Stripe** (optionnel au début) :
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

---

## 3. Lancer l’app

Dans un terminal :

```bash
cd gmaps-scraper
npm install
npm run dev
```

Ouvre **http://localhost:3000**.

---

## 4. Tester

1. **S’inscrire** : `/signup` → email + mot de passe.
2. **Se connecter** : `/login` si besoin.
3. **Extraire** : section « Extraire » → métier + ville → Extraire.
4. **Code promo** : « Vous avez un code promo ? » → saisir un code → Valider → accès illimité.
5. **Admin** : connecte-toi avec l’email défini dans `ADMIN_EMAIL` → clique sur **Admin** dans le header → `/admin` pour ajouter/modifier/supprimer les codes promo.

---

## En cas d’erreur

- **`DATABASE_URL manquant`** : vérifie que `.env.local` est bien dans `gmaps-scraper/` et contient `DATABASE_URL`.
- **`relation "users" does not exist`** : exécute `neon/schema.sql` dans Neon (étape 1).
- **`column "unlimited_promo" does not exist`** : exécute `neon/migration-promo.sql` dans Neon Console > SQL Editor.
- **Impossible de créer un compte** : ouvre la console (F12 > Network), regarde la réponse de `/api/auth/signup`, puis exécute le schéma ou la migration dans Neon.
- **`GOOGLE_PLACES_API_KEY manquante`** : ajoute la clé dans `.env.local`.
- **Erreur Stripe** : normal si Stripe n’est pas configuré ; l’auth et l’extraction (avec code promo) marchent sans.
