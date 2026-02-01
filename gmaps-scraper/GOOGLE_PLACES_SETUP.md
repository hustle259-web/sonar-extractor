# 🗺️ Setup Google Places API - Guide Complet

## 📋 Étape 1 : Créer un compte Google Cloud

1. Va sur https://console.cloud.google.com/
2. Connecte-toi avec ton compte Google
3. Crée un nouveau projet (ou sélectionne un existant)
   - Nom du projet : `sonar-extractor` (ou autre)
   - Note le **Project ID** (ex: `sonar-extractor-123456`)

## 📋 Étape 2 : Activer l'API Places

1. Dans Google Cloud Console, va dans **APIs & Services** → **Library**
2. Recherche "Places API (New)"
3. Clique sur **Places API (New)** → **Enable**
4. ⚠️ **Important** : Active aussi **Places API** (l'ancienne version) si nécessaire

## 📋 Étape 3 : Créer une clé API

1. Va dans **APIs & Services** → **Credentials**
2. Clique sur **+ CREATE CREDENTIALS** → **API Key**
3. Une clé API est créée (ex: `AIzaSy...`)
4. **Sécurise ta clé** :
   - Clique sur la clé pour l'éditer
   - **Application restrictions** : Choisis **"None"**  
     - ⚠️ **Pas "HTTP referrers"** : les appels sont faits depuis le serveur Next.js (API route), donc pas de referer → Google bloque avec "Requests from referer &lt;empty&gt; are blocked".
   - **API restrictions** : Sélectionne "Restrict key" → Coche uniquement **"Places API (New)"**
   - Clique **Save**  
   La clé reste côté serveur (`.env.local`), jamais exposée au navigateur.

## 📋 Étape 4 : Configurer la facturation

⚠️ **Google Cloud nécessite une carte bancaire** (même pour le crédit gratuit)

1. Va dans **Billing** → **Link a billing account**
2. Ajoute ta carte bancaire
3. **Bon à savoir** :
   - Tu reçois **200$ de crédit gratuit** (valable 3 mois)
   - Après, c'est **pay-as-you-go**
   - Text Search : ~0.017$ par requête
   - Avec 200$ : ~11 700 requêtes gratuites

## 📋 Étape 5 : Ajouter la clé dans .env.local

Ouvre `.env.local` dans `gmaps-scraper/` et ajoute :

```bash
# Google Places API
GOOGLE_PLACES_API_KEY=AIzaSy...  # Ta clé API complète
```

## 📋 Étape 6 : Tester

```bash
cd /Users/rachidabenayad/Desktop/dropifi/gmaps-scraper
npm run dev
```

Va sur http://localhost:3000 et teste un scrape. Ça devrait fonctionner ! 🎉

---

## 💰 Coûts estimés

- **Gratuit** : 200$ de crédit (3 mois) = ~11 700 requêtes
- **Après** : ~0.017$ par requête
- **Exemple** : 1000 scrapes = 17$ (hors crédit gratuit)

## 🔒 Sécurité

- Ne commite JAMAIS ta clé API dans Git (`.env.local` est dans `.gitignore`)
- Restriction par **API** : limite la clé à "Places API (New)" uniquement
- La clé n’est utilisée que côté serveur (API route), jamais envoyée au navigateur

---

## ✅ Checklist

- [ ] Compte Google Cloud créé
- [ ] Projet créé
- [ ] Places API (New) activée
- [ ] Clé API créée et sécurisée
- [ ] Facturation configurée (carte bancaire)
- [ ] Clé ajoutée dans `.env.local`
- [ ] Test réussi sur localhost

---

## ❌ "Requests from referer &lt;empty&gt; are blocked" (403)

Si tu as toujours cette erreur après avoir mis **Application restrictions = None** :

1. **Crée une NOUVELLE clé API** (ne modifie pas l’ancienne) :
   - **Credentials** → **+ CREATE CREDENTIALS** → **API key**
   - Dès la création : **Edit** → **Application restrictions** = **None** → **API restrictions** = **Restrict key** → uniquement **Places API (New)** → **Save**
2. Copie la **nouvelle** clé dans `.env.local` (`GOOGLE_PLACES_API_KEY=...`).
3. Redémarre le serveur (`npm run dev`) et réessaie.

**Option « HTTP referrers » :** si tu préfères restreindre par referer, garde **HTTP referrers** et ajoute :
- `http://localhost:3000/*`
- `http://localhost:3004/*`
(et ton domaine de prod plus tard). L’app transmet déjà le Referer du navigateur à Google.
