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

1. **Ne jamais** ajouter `overrides` sur `react` / `react-dom` dans `package.json` racine → crée une 2ème instance qui casse `useState`, `react/cache`, `react/jsx-runtime`.
2. **En revanche**, un `overrides` sur `@types/react` / `@types/react-dom` à la racine est SAFE et RECOMMANDÉ quand une dépendance transitive tire des types React 19 (ex. `recharts → react-redux` → `@types/react@19`). Sans cet override, `tsc apps/web` remonte des erreurs TS2786/TS2322 fantômes. Les `@types` sont des types TS sans runtime — pas de 2ème instance.
3. **Ne jamais** aliaser `react`/`react-dom` dans webpack → casse `react/cache`, `react/jsx-runtime`.
4. React 18.3.1 déclaré dans **root** `package.json` comme dépendance directe → npm le hisse partout.

**Override actuel (depuis B9-E post, commit `05f347e`)** :
```json
"overrides": {
  "@types/react": "^18.3.1",
  "@types/react-dom": "^18.3.1"
}
```
Supprime les 165 erreurs TS2786 fantômes et rend `tsc apps/web` utilisable comme garde-fou fiable (EXIT=0 si le code est propre).
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

## Comportements Claude — règles transverses

Ces règles complètent le workflow obligatoire ci-dessus. Elles s'appliquent à chaque étape et visent à réduire les erreurs fréquentes en codage assisté. Source d'inspiration : karpathy-skills (forrestchang/andrej-karpathy-skills), points retenus après dédoublonnage avec le reste du guide.

### 1. Exposer les alternatives au lieu de choisir seul

Quand une demande admet plusieurs interprétations raisonnables, les présenter toutes à Pierre avant de coder — ne pas trancher silencieusement. Même règle pour les choix d'architecture : si j'hésite entre 2 approches, les nommer explicitement et demander laquelle.

C'est le prolongement pratique de « NE JAMAIS inventer, extrapoler ou deviner » du CLAUDE.md global : non seulement ne pas halluciner, mais aussi ne pas trancher dans l'ombre un arbitrage qui appartient à Pierre.

### 2. Respecter le style existant

Quand je touche à un fichier, matcher son style existant même si je ferais autrement par défaut (indentation, nommage, pattern de structuration, conventions JSDoc…). Exception : si le style est franchement cassé ET que le fix fait partie de la tâche, le signaler avant de corriger — pas le corriger en silence au passage.

### 3. Nettoyer MES résidus, pas le dead code pré-existant

Quand mes changements rendent un import, une variable ou une fonction inutile, je la supprime dans le même commit. Mais je ne supprime PAS le dead code pré-existant qui ne vient pas de moi — j'en prends note dans le message de commit ou dans `tasks/lessons.md`, et je laisse Pierre décider.

Règle dérivée : chaque ligne que je change doit pouvoir se rattacher directement à la demande en cours.

### 4. Transformer les tâches floues en objectifs vérifiables

Avant d'implémenter, convertir la demande en critère de réussite testable :

- « Ajoute une validation » → « Écrire d'abord le test qui échoue sur input invalide, puis rendre le test vert »
- « Corrige ce bug » → « Écrire d'abord le test qui reproduit le bug, puis le rendre vert »
- « Refactor X » → « Vérifier que les tests passent avant, refactorer, vérifier que les tests passent après »

Un critère fort (« tests verts ») permet de boucler seul. Un critère faible (« que ça marche ») demande de solliciter Pierre à chaque doute — à éviter.

### 5. Indicateurs de succès de ces règles

Ces comportements fonctionnent si, au fil des sessions, on observe :

- moins de diffs inutiles (lignes changées sans rapport direct avec la demande)
- moins de ré-écritures dues à une sur-complication
- plus de questions de clarification AVANT implémentation (et moins après, une fois le code écrit)

Si ces signaux se dégradent, relire cette section et `tasks/lessons.md` pour recalibrer.

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
