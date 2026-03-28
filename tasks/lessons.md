# Leçons apprises — jedevienspatron

## Session 2025-03 (contexte résumé)

### L1 — Lire avant d'éditer
**Erreur** : tentative d'Edit sans Read préalable → erreur "File has not been read yet"
**Règle** : toujours appeler `Read` sur le fichier avant tout `Edit`, même si je pense connaître le contenu.

### L2 — Vérifier visuellement le résultat déployé
**Erreur** : après un push, l'utilisateur a constaté "rien n'a changé" car l'ancien composant `EtapeGuide` était encore visible.
**Cause** : j'avais réécrit la logique mais le rendu visuel état B restait identique.
**Règle** : après tout changement UI, décrire précisément ce qui sera visible à l'écran — pas seulement ce qui change dans le code. Si possible, demander une capture d'écran de confirmation.

### L3 — Ne pas recréer ce qui a déjà été demandé de supprimer
**Erreur** : le bandeau ACTIF = PASSIF avait été demandé supprimé dans une session précédente, mais il était encore présent (ou recréé).
**Règle** : avant d'écrire du nouveau code UI, vérifier dans l'historique git si un élément similaire a déjà été supprimé à la demande de l'utilisateur.

### L4 — Aligner les éléments symétriques dès le départ
**Erreur** : Total Actif et Total Passif n'étaient pas alignés verticalement.
**Règle** : quand deux colonnes parallèles ont des totaux en bas, utiliser `flex flex-col` + `mt-auto` dès la création, pas en correction.

### L5 — Utiliser tasks/todo.md pour chaque tâche non triviale
**Règle** : dès qu'une tâche implique plus de 2 fichiers ou 3 étapes, créer un plan dans `tasks/todo.md` avant de commencer.

### L6 — Toujours utiliser les subagents disponibles dans agency-agents/
**Erreur** : travail en mode "tout en un" alors que des agents spécialisés sont disponibles dans `/agency-agents/`.
**Règle** : pour chaque tâche, identifier et activer le bon agent :

| Type de tâche | Agent à utiliser |
|---|---|
| Composant React / UI | `engineering/engineering-frontend-developer.md` |
| Décision UX / hiérarchie visuelle | `design/design-ux-architect.md` |
| Design visuel / couleurs | `design/design-ui-designer.md` |
| Vérification avant push | `testing/testing-reality-checker.md` |
| Coordination multi-agents | `specialized/agents-orchestrator.md` |
| Architecture / refactor | `engineering/engineering-senior-developer.md` |
| Jeu / game design | `game-development/game-designer.md` |

**Workflow obligatoire** :
1. Lire le fichier `.md` de l'agent concerné
2. Lancer un subagent avec ce contexte
3. Valider avec `testing/testing-reality-checker.md` avant tout push

---

### L7 — 2026-03-21 : Agents experts uploadés = priorité absolue

**Erreur** : sur la tâche "Improve unclear game map design", implémentation directe sans consulter les agents experts uploadés par Pierre (design-ux-architect, design-ui-designer, design-whimsy-injector, etc.).

**Conséquence** : v1 du GameMap techniquement correcte mais pauvre — sans microcopy narratif, sans différenciation 6a/6b par couleur, sans "vibe" par étape.

**Règle** :
- Lire les agents uploadés EN DÉBUT de session, pas en cours de route
- Pour toute tâche design/UX : lancer ≥ 3 agents en parallèle AVANT d'écrire du code
- Les agents Design à utiliser en priorité : `design-ux-researcher`, `design-ux-architect`, `design-ui-designer`, `design-visual-storyteller`, `design-whimsy-injector`, `design-brand-guardian`

**Pattern correct validé** :
```
① Lire CLAUDE.md + agents disponibles
② Écrire tasks/todo.md (pas seulement widget TodoWrite)
③ Lancer agents en parallèle (UX Research + Visual Story + Brand/UI)
④ Consolider → specs concrètes
⑤ Implémenter selon specs
⑥ npx tsc --noEmit → 0 erreur
⑦ Commit + update tasks/lessons.md
```

### L8 — 2026-03-21 : `npm run build` échoue dans le VM Linux (SWC)

**Cause** : binaire SWC pour Linux/x64 absent dans le VM sandbox.
**Solution** : utiliser `npx tsc --noEmit` pour la validation TypeScript. Le build réel se fait sur Vercel.

## L9 — Monorepo npm workspaces : dual React instance
**Contexte** : Next.js 15 dans un monorepo npm workspaces avec `apps/web`.
**Symptômes** : `useContext null` (styled-jsx) ou `ReactCurrentDispatcher undefined` au build Vercel.
**Cause** : npm hisse `styled-jsx` en root `node_modules` ; il importe `react` depuis root, mais `react-dom` de l'app importe son propre `react` → 2 instances distinctes.
**Fix complet (2 couches)** :
1. Root `package.json` → `"overrides": { "react": "^18.3.1", "react-dom": "^18.3.1" }` — déduplique à l'install
2. `apps/web/next.config.ts` → webpack alias `react` et `react-dom` → `path.resolve(__dirname, "node_modules/react")` — déduplique au bundle
**Important** : dans next.config.ts ESM, utiliser `fileURLToPath(import.meta.url)` pour obtenir `__dirname`.

## L10 — ESLint flat config incompatible avec Next.js 15 build Vercel
**Symptôme** : `Cannot find module 'eslint-config-next/core-web-vitals'` au build.
**Fix** : ajouter `eslint: { ignoreDuringBuilds: true }` dans `next.config.ts`. Pattern identique à `typescript.ignoreBuildErrors`.

## L11 — webpack alias React : utiliser require.resolve, pas __dirname
**Erreur** : `path.resolve(__dirname, "node_modules/react")` pointe vers `apps/web/node_modules/react` qui n'existe pas si npm a hissé React à la racine du monorepo.
**Symptôme Vercel** : `Module not found: Can't resolve 'react'` et `Can't resolve 'react/jsx-runtime'`.
**Fix correct** :
```ts
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const reactDir = path.dirname(require.resolve("react/package.json"));
```
`require.resolve` suit la résolution Node.js réelle (hissage npm workspaces inclus) → portable localement et sur Vercel.

## L12 — npm overrides React dans un monorepo : contre-productif
**Erreur commise** : ajouter `"overrides": { "react": "^18.3.1" }` dans le root `package.json` pour "dédupliquer" React.
**Effet réel** : npm installe React AUSSI à la racine (`/node_modules/react`) EN PLUS de `apps/web/node_modules/react` → crée exactement le dual instance qu'on voulait éviter.
**Diagnostic** : `git diff commit-ok HEAD -- package.json next.config.ts` → repérer immédiatement l'overrides comme coupable probable.
**Règle** : dans un monorepo npm workspaces, ne PAS utiliser `overrides` pour React. Utiliser uniquement le webpack alias dans `next.config.ts`.

## L13 — webpack alias React : NE PAS faire
**Erreur** : aliaser `react` et `react-dom` dans `next.config.ts` webpack casse les exports conditionnels de React.
**Symptôme** : `(0, r.cache) is not a function` — `react/cache`, `react/jsx-runtime`, etc. ne se résolvent plus correctement car l'alias bypasse le champ `exports` du `package.json` React.
**Règle** : Ne jamais ajouter de webpack alias pour React dans Next.js. Next.js gère déjà la déduplication React en interne.

## L14 — Cause racine : React 19 fantôme dans le monorepo
**Diagnostic définitif** : `package-lock.json` contenait React 19.2.3 à `node_modules/react` (racine) et React 18.3.1 à `apps/web/node_modules/react`. Cause : `framer-motion`, `lucide-react`, `styled-jsx` sont hissés à la racine et acceptent React 18 OU 19. npm résolvait vers React 19 pour ces packages racine.
**Symptôme** : `styled-jsx` (racine) → `useContext` via React 19, `react-dom` (apps/web) → React 18 → `null` retourné par useContext (deux dispatchers React distincts).
**Fix correct** : ajouter `"react": "^18.3.1"` et `"react-dom": "^18.3.1"` au root `package.json` + régénérer `package-lock.json`. Résultat : une seule instance React 18 dans tout le monorepo.
**Erreurs précédentes** : `overrides` et `webpack alias` étaient tous deux contre-productifs — le premier ajoutait React 19 en parallèle, le second cassait les exports conditionnels.
**Commande de vérification** : `python3 -c "import json; [print(k,v['version']) for k,v in json.load(open('package-lock.json'))['packages'].items() if k.endswith('/react') and 'react-' not in k.split('/')[-1]]"`

## L15 — 2026-03-22 : window.location.origin en production = localhost
**Erreur** : `window.location.origin` utilisé dans les pages auth pour construire `redirectTo` et `emailRedirectTo`.
**Effet** : en local → `http://localhost:3000` ; sur Vercel → `https://jedevienspatron-web.vercel.app`. Mais si l'utilisateur avait saisi son email depuis la prod, le lien de confirmation renvoyait vers localhost.
**Fix** : `process.env.NEXT_PUBLIC_APP_URL || window.location.origin` — NEXT_PUBLIC_APP_URL est défini sur Vercel et prend la priorité.
**Règle** : toujours utiliser NEXT_PUBLIC_APP_URL pour construire des URLs absolues dans le code client. Ne jamais dépendre de window.location.origin pour des redirections auth.

## L16 — 2026-03-22 : Pages orphelines = fonctionnalités invisibles
**Erreur** : /dashboard/packs entièrement fonctionnelle mais aucun lien n'y menait depuis le dashboard ou la page de création de session.
**Conséquence** : l'utilisateur voyait "crédits insuffisants" sans savoir où acheter.
**Règle** : toute nouvelle page doit avoir au moins un point d'entrée visible depuis les pages adjacentes. Checklist à la création d'une page :
1. Y a-t-il un lien depuis le dashboard principal ?
2. Y a-t-il un lien depuis les pages qui en ont besoin (ex: page erreur → page achat) ?
3. La page est-elle dans la navigation globale si pertinent ?

## L17 — 2026-03-22 : Supabase Redirect URLs à configurer dès le début
**Erreur** : Supabase bloque les redirections vers des URLs non whitelistées. En développement, localhost est accepté par défaut. En production, l'URL de prod doit être ajoutée manuellement dans Authentication → URL Configuration.
**Règle** : à chaque nouveau domaine de déploiement (Vercel, domaine custom), ajouter immédiatement l'URL dans Supabase Redirect URLs. Ne pas attendre le premier bug utilisateur.

## L18 — 2026-03-22 : Options pédagogiques = décision métier, pas technique
**Erreur** : les options 4/6/8 trimestres avaient été fixées sans validation pédagogique. Pierre a indiqué que 4 trimestres est insuffisant pour observer les effets économiques du jeu.
**Règle** : les paramètres liés au contenu pédagogique (nombre de tours, durée, niveaux) doivent être validés par Pierre avant implémentation. Ne pas inventer de valeurs par défaut sur du contenu métier.

## L19 — 2026-03-22 : Bloquer l'accès solo = middleware + page + API
**Erreur initiale** : le bloc "Je joue seul" sur la homepage renvoyait directement à `/jeu` sans aucune vérification d'auth ni de crédit.
**Fix en 3 couches complémentaires** :
1. **Middleware** (`middleware.ts`) : `/jeu` sans `?code=` ni `?access=bypass` → redirige vers login si non authentifié
2. **Homepage** (`app/page.tsx`) : lien "Je joue seul" → `/auth/login?redirectTo=/jeu` + texte "Compte requis — 1 crédit par partie"
3. **Page jeu** (`app/jeu/page.tsx`) : si `isSolo`, appel `/api/sessions` avant de lancer → consomme 1 crédit, récupère `room_code` → résultats sauvegardés en Supabase
**Règle** : pour tout accès protégé, vérifier les 3 niveaux. Le middleware seul ne suffit pas (pas de vérification de crédits). La page seule ne suffit pas (contournable). Les deux ensemble = défense en profondeur.

## L20 — 2026-03-26 : Fichiers dupliqués engine.ts = double maintenance
**Erreur** : le moteur de jeu existe en double — `packages/game-engine/src/engine.ts` et `apps/web/lib/game-engine/engine.ts`. Les corrections Citadel devaient être appliquées aux DEUX.
**Règle** : toute modification d'engine.ts doit être synchronisée dans les deux emplacements. À terme, supprimer le duplicat et importer depuis le package.

## L21 — 2026-03-26 : IDs hardcodés = dette technique silencieuse
**Erreur** : les IDs de cartes (`"commercial-junior-dec"`, `"affacturage"`, etc.) étaient hardcodés en strings dans le code. Toute typo passait silencieusement (le `console.warn` ne bloquait pas l'exécution).
**Fix** : constantes `CARTE_IDS` + `throw Error` sur poste inconnu dans `appliquerDeltaPoste`.
**Règle** : centraliser tout ID/constante réutilisé ≥2 fois. Préférer `throw` à `console.warn` pour les erreurs de programmation.

## L22 — 2026-03-26 : iCloud Drive bloque les opérations fichiers
**Contexte** : les fichiers stockés dans iCloud avec "Optimize Mac Storage" sont des stubs. `require()`, `rsync`, `sed`, `cat` peuvent tous échouer ou bloquer indéfiniment.
**Règle** : pour un projet actif, toujours garder une copie locale hors iCloud (ou un clone Git). Ne jamais dépendre d'iCloud pour le développement.
