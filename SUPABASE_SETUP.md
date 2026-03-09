# Guide de setup Supabase — KICLEPATRON

## Étape 1 — Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → **New Project**
2. Nom du projet : `kiclepatron`
3. Choisir la région : **West EU (Paris)** — pour la RGPD
4. Définir un mot de passe de base de données (le noter)
5. Cliquer **Create new project** (attendre ~2 minutes)

---

## Étape 2 — Récupérer les clés API

Dans le dashboard Supabase :
**Project Settings → API**

Copier :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` *(ne JAMAIS exposer côté client)*

---

## Étape 3 — Créer le fichier .env.local

Dans le dossier `apps/web/` :

```bash
cp .env.local.example .env.local
# Puis remplir les valeurs avec les clés récupérées à l'étape 2
```

---

## Étape 4 — Exécuter le schéma SQL

Dans le dashboard Supabase : **SQL Editor → New query**

Copier-coller le contenu du fichier :
```
supabase/migrations/001_initial_schema.sql
```

Cliquer **Run** (le bouton vert).

> ✅ Si tout se passe bien : 6 tables créées, pas d'erreur rouge

---

## Étape 5 — Configurer l'authentification

Dans le dashboard Supabase : **Authentication → Settings**

### URL de redirection (important !)
Dans **Redirect URLs**, ajouter :
- `http://localhost:3000/auth/callback` (développement)
- `https://votre-domaine.fr/auth/callback` (production)

### Activer Google OAuth (optionnel mais recommandé)
1. **Authentication → Providers → Google**
2. Activer **Enable**
3. Créer des identifiants OAuth sur [Google Cloud Console](https://console.cloud.google.com)
4. Renseigner `Client ID` et `Client Secret`

---

## Étape 6 — Installer les dépendances

Dans le terminal, depuis `apps/web/` :

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Étape 7 — Promouvoir votre compte super_admin

Après vous être inscrit sur l'application (via `/auth/register`), exécuter dans le **SQL Editor** de Supabase :

```sql
-- Remplacer par votre email
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'profmedan@gmail.com';

UPDATE organizations
SET plan_type = 'national', max_teachers = -1
WHERE id = (SELECT organization_id FROM profiles WHERE email = 'profmedan@gmail.com');
```

---

## Étape 8 — Lancer l'application

```bash
# Depuis la racine du projet
npm run dev
```

Aller sur [http://localhost:3000/auth/register](http://localhost:3000/auth/register) pour créer votre compte.

---

## Flux d'utilisation (enseignant)

```
1. Enseignant s'inscrit → /auth/register
2. Connexion → /auth/login
3. Dashboard → /dashboard
4. Crée une session → POST /api/sessions → reçoit room_code (ex: KIC-4A2B)
5. Donne le code aux élèves → ils jouent à /jeu?code=KIC-4A2B
6. Fin de partie → résultats sauvegardés automatiquement dans Supabase
7. Enseignant voit les scores → /dashboard/sessions/{id}
```

---

## Vérification — checklist

- [ ] Projet Supabase créé
- [ ] Fichier `.env.local` rempli avec les vraies clés
- [ ] Schéma SQL exécuté sans erreur (6 tables visibles dans Table Editor)
- [ ] `npm install @supabase/supabase-js @supabase/ssr` exécuté
- [ ] URL de callback configurée dans Supabase Auth
- [ ] Application lancée (`npm run dev`)
- [ ] Inscription sur `/auth/register` fonctionne
- [ ] Dashboard `/dashboard` accessible après connexion
- [ ] SQL de promotion super_admin exécuté

---

## Structure des fichiers créés

```
apps/web/
├── .env.local.example          # Template variables d'environnement
├── middleware.ts                # Protection routes /dashboard/** et /admin/**
├── lib/supabase/
│   ├── client.ts               # Client browser (composants client)
│   ├── server.ts               # Client server (RSC + API routes)
│   └── types.ts                # Types TypeScript générés
├── app/
│   ├── auth/
│   │   ├── login/page.tsx      # Page connexion (email + Google + magic link)
│   │   ├── register/page.tsx   # Page inscription (2 étapes)
│   │   └── callback/route.ts   # Handler OAuth Supabase
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard enseignant (stats + sessions + classes)
│   ├── api/
│   │   └── sessions/
│   │       ├── route.ts        # POST créer session / GET lister
│   │       └── results/
│   │           └── route.ts    # POST sauvegarder résultats de fin de partie
│   └── jeu/page.tsx            # ← Modifié : +useEffect save résultats si room_code
supabase/
└── migrations/
    └── 001_initial_schema.sql  # Schéma complet (tables + RLS + triggers)
```
