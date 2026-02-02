# Pousser sur GitHub — Authentification

Le push échoue car Git demande une authentification. Voici 2 solutions :

---

## Option 1 : GitHub CLI (recommandé)

1. **Installer GitHub CLI** (si pas déjà fait) :
   ```bash
   brew install gh
   ```

2. **Se connecter** :
   ```bash
   gh auth login
   ```
   - Choisis **GitHub.com**
   - Choisis **HTTPS**
   - Suis les instructions (login via navigateur)

3. **Pousser** :
   ```bash
   cd /Users/rachidabenayad/Desktop/dropifi
   git push origin main
   ```

---

## Option 2 : Token d'accès personnel (PAT)

1. **Créer un token** sur GitHub :
   - Va sur [github.com/settings/tokens](https://github.com/settings/tokens)
   - **Generate new token (classic)**
   - Donne un nom, coche **repo**
   - Génère et **copie le token** (tu ne le reverras qu'une fois)

2. **Pousser** dans ton terminal :
   ```bash
   cd /Users/rachidabenayad/Desktop/dropifi
   git push origin main
   ```
   - **Username** : ton pseudo GitHub (ex: `hustle259-web`)
   - **Password** : colle le **token** (pas ton mot de passe GitHub)

3. macOS Keychain mémorisera le token pour les prochains push.

---

## Option 3 : SSH (si tu préfères)

1. **Générer une clé SSH** :
   ```bash
   ssh-keygen -t ed25519 -C "ton@email.com" -f ~/.ssh/id_ed25519 -N ""
   ```

2. **Afficher la clé publique** et l'ajouter sur GitHub :
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   - Copie le contenu
   - Va sur [github.com/settings/keys](https://github.com/settings/keys)
   - **New SSH key** → colle la clé

3. **Changer le remote** :
   ```bash
   cd /Users/rachidabenayad/Desktop/dropifi
   git remote set-url origin git@github.com:hustle259-web/sonar-extractor.git
   git push origin main
   ```
