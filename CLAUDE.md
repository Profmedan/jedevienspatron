# JE DEVIENS PATRON — Guide Claude

Jeu sérieux de comptabilité/gestion d'entreprise pour enseignants et formateurs.
Auteur : Pierre Médan (profmedan@gmail.com)

---

## Architecture technique

**Monorepo npm workspaces** :
- `apps/web` — Next.js 15 App Router (port 3000)
- `packages/game-engine` — moteur de jeu TypeScript pur

**Stack** :
- Next.js 15.5.14 + React 18.3.1 (IMPORTANT : pas React 19)
- Supabase (Auth + PostgreSQL + RLS)
- Stripe Checkout (paiement unique, pas abonnement)
- Vercel (déploiement) + OVH (DNS)
- TypeScript strict

**Domaine** : `https://jedevienspatron.fr`
**Repo Vercel** : `jedevienspatron-web`

---

## Règles critiques React (lire avant tout fix build)

1. **Ne jamais** ajouter `overrides` React dans `package.json` racine → crée une 2ème instance
2. **Ne jamais** aliaser `react`/`react-dom` dans webpack → casse `react/cache`, `react/jsx-runtime`
3. React 18.3.1 déclaré dans **root** `package.json` comme dépendance directe → npm le hisse partout
4. Pour valider TypeScript : `npx tsc --noEmit` (pas `npm run build` — SWC absent dans le VM)

---

## Business model

### Flux B2C (individuel/professeur)
1. S'inscrit → organisation créée automatiquement (trigger Supabase)
2. Achète un pack → Stripe Checkout → webhook → crédits en base
3. Crée une session → 1 crédit consommé → code room généré
4. Distribue le code aux apprenants → ils jouent sans inscription

### Flux B2B (organisme)
- Même flux mais packs plus grands (80/150/300/1000 sessions)
- Les crédits sont partagés par `organization_id`

### Bypass codes
- Format : exactement 8 caractères A-Z/0-9 (ex: `TEST0001`)
- Permettent de jouer sans inscription ni crédit
- Table `bypass_codes` : `code`, `max_uses` (-1 = illimité), `use_count`
- Validés via `/api/bypass`

---

## Packs et tarifs

| Pack | Sessions | Prix | Durée | stripe_price_id |
|---|---|---|---|---|
| individuel-5 | 5 | 4,99€ | 30j | price_1TDnDyH4Fo7tnyRinRFczDVK |
| individuel-10 | 10 | 8,99€ | 60j | price_1TDnEeH4Fo7tnyRiGw4p1yOM |
| individuel-20 | 20 | 14,99€ | 90j | price_1TDnFHH4Fo7tnyRibatDoZmw |
| org-80 | 80 | 120€ | 365j | price_1TDnFvH4Fo7tnyRildBX1uG2 |
| org-150 | 150 | 195€ | 365j | price_1TDnGZH4Fo7tnyRiA8f3atBE |
| org-300 | 300 | 330€ | 365j | price_1TDnH7H4Fo7tnyRi6XiWyvGm |
| org-1000 | 1000 | 900€ | 365j | price_1TDnHgH4Fo7tnyRi58mBwb58 |

---

## Variables d'environnement requises (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=           # commence par sk_live_
STRIPE_WEBHOOK_SECRET=       # commence par whsec_
NEXT_PUBLIC_APP_URL=https://jedevienspatron.fr
```

**Règle** : ne jamais utiliser `window.location.origin` pour les URLs auth → toujours `NEXT_PUBLIC_APP_URL`.

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `apps/web/lib/stripe.ts` | Lazy init Stripe (évite crash build) |
| `apps/web/lib/credits.ts` | getAvailableCredits, consumeCredit (FIFO) |
| `apps/web/app/api/stripe/checkout/route.ts` | Crée session Stripe |
| `apps/web/app/api/stripe/webhook/route.ts` | checkout.session.completed → crédits |
| `apps/web/app/api/bypass/route.ts` | Valide les bypass codes |
| `apps/web/app/api/sessions/route.ts` | Crée une session de jeu (consomme 1 crédit) |
| `apps/web/middleware.ts` | Protège /dashboard et /historique |
| `apps/web/next.config.ts` | ignoreBuildErrors: true (ESLint + TS) |
| `supabase/migrations/` | Migrations numérotées 001→005 |
| `tasks/todo.md` | Plan de travail en cours |
| `tasks/lessons.md` | Leçons apprises — LIRE EN DÉBUT DE SESSION |

---

## Sessions de jeu

- Durées proposées : **6 / 8 / 10 / 12 trimestres**
- Minimum 6 trimestres (effets économiques visibles)
- Durées estimées : 6=1h, 8=1h15, 10=1h30, 12=1h45
- Les apprenants rejoignent avec un `room_code` (pas d'inscription requise)

---

## Commandes utiles

```bash
# Depuis apps/web
npx tsc --noEmit          # Validation TypeScript
npm run dev               # Dev local (port 3000)

# Depuis la racine
git add [fichiers]
git commit -m "type: description"
# Push depuis le Mac de Pierre (pas depuis le VM)
```

---

## Workflow obligatoire (instructions Pierre)

1. **Lire** `tasks/lessons.md` en début de session
2. **Planifier** dans `tasks/todo.md` avant toute implémentation non triviale
3. **Subagents** pour research, exploration, analyse parallèle
4. **Vérifier** avec `npx tsc --noEmit` avant tout commit
5. **Mettre à jour** `tasks/todo.md` et `tasks/lessons.md` après chaque correction

---

## Superpowers Skills

### Déclencheurs automatiques

| Situation | Skill à invoquer |
|---|---|
| Nouvelle fonctionnalité / mécanique de jeu | `brainstorming` en premier |
| Bug / comportement inattendu | `systematic-debugging` en premier |
| Tâche non triviale (> 2 fichiers modifiés) | `writing-plans` avant le code |
| Avant d'affirmer "c'est corrigé" / "c'est fait" | `verification-before-completion` |
| Exécuter un plan existant | `executing-plans` |

### Cohabitation avec le workflow existant

Les skills s'intercalent sans remplacer les règles actuelles :

```
1. Lire tasks/lessons.md                          ← inchangé
2. [brainstorming ou writing-plans si applicable] ← superpowers
3. Planifier dans tasks/todo.md                   ← inchangé
4. Implémenter
5. [verification-before-completion]               ← superpowers
6. npx tsc --noEmit                               ← inchangé
7. Mettre à jour todo.md + lessons.md             ← inchangé
```

---

## Supabase — tables principales

- `profiles` : utilisateurs (organization_id, display_name, org_name, org_type)
- `organizations` : créée automatiquement au signup (trigger handle_new_user)
- `packs` : 7 packs avec stripe_price_id
- `session_credits` : crédits achetés par organisation (FIFO consumption)
- `game_sessions` : sessions créées par les formateurs (room_code, nb_tours)
- `bypass_codes` : codes d'accès gratuits avec quota
- Vue `credits_disponibles` : sum des crédits restants par organization_id

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
