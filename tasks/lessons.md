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

## L23 — 2026-03-28 : Citadel laisse parfois ses méta-commentaires dans le HTML
**Erreur** : Citadel a écrit ses notes de conception directement dans les textes visibles de `page.tsx` ("L'ancienne page empilait des arguments", "J'ai rééquilibré cette zone"...).
**Règle** : toujours relire le contenu textuel de la landing après un pass Citadel UI. Les textes visibles aux utilisateurs doivent parler du produit, pas de la démarche de refonte.

## L22 — 2026-03-26 : iCloud Drive bloque les opérations fichiers
**Contexte** : les fichiers stockés dans iCloud avec "Optimize Mac Storage" sont des stubs. `require()`, `rsync`, `sed`, `cat` peuvent tous échouer ou bloquer indéfiniment.
**Règle** : pour un projet actif, toujours garder une copie locale hors iCloud (ou un clone Git). Ne jamais dépendre d'iCloud pour le développement.

## L24 — 2026-04-03 : useMemo après early returns = React error #310
**Erreur** : un `useMemo` (ou tout hook) placé APRÈS des `if (condition) return ...` est appelé de façon conditionnelle. React exige que tous les hooks soient appelés dans le même ordre à chaque rendu.
**Symptôme** : React error #310 "Cannot update a component while rendering a different component" — déclenché lors de la transition de phase (ex: "intro" → "playing") car le hook est appelé pour la première fois.
**Stack trace** : présence de `at Object.aq [as useMemo]` dans l'appel de la fonction de rendu.
**Fix** : déplacer TOUS les hooks (useState, useEffect, useMemo, useCallback) AVANT le premier `if (...) return` dans le composant. Utiliser des gardes internes (`if (!data) return defaultValue`) plutôt que des early returns pour protéger la logique.
**Règle** : lors de tout bug React error #310, rechercher immédiatement les hooks placés après des early returns dans le composant fautif.

### Leçon — Deux versions du jeu en parallèle (2026-04-03)
- `/jeu/page.tsx` et `/jeu-v2/page.tsx` coexistent
- Pierre utilise `/jeu`, pas `/jeu-v2`
- **Toujours appliquer les correctifs sur les DEUX fichiers**
- Vérifier dans quel fichier le joueur est redirigé pour éviter de corriger le mauvais

## L25 — 2026-04-09 : Code review — erreurs détectées et corrigées

### L25a — Routes API publiques : valider TOUTES les entrées
**Erreur** : `/api/sessions/results` n'avait aucune validation des entrées (pseudo, scoreTotal, etatFinal). N'importe qui pouvait envoyer des données arbitraires.
**Règle** : chaque route API publique doit valider : types, longueurs max, format attendu. Utiliser une fonction de validation ou zod. Maximum payload size aussi (etatFinal < 100KB).

### L25b — Opérations atomiques obligatoires pour les compteurs partagés
**Erreur** : bypass codes utilisaient un pattern check-puis-update (SELECT → UPDATE) non atomique. Race condition possible sur les codes à usage limité.
**Règle** : tout compteur partagé (crédits, quotas, use_count) doit utiliser une fonction PL/pgSQL avec UPDATE ... WHERE condition atomique. Pattern validé : `consume_session_credit` et maintenant `validate_bypass_code`.

### L25c — Ne pas exposer error.message au client
**Erreur** : `creditsError.message` et `error.message` (Supabase) exposés directement dans les réponses JSON.
**Règle** : toujours logger l'erreur côté serveur (`console.error`), retourner un message générique au client.

### L25d — Vérifier les env vars avant utilisation
**Erreur** : `process.env.STRIPE_WEBHOOK_SECRET!` avec assertion `!` sans vérification d'existence.
**Règle** : toujours vérifier la présence de la variable AVANT utilisation. Retourner 500 avec message générique si manquante.

### L25e — @types/react doit matcher la version runtime
**Erreur** : `@types/react@^19` installé alors que le runtime est React 18.3.1.
**Règle** : aligner les versions @types sur la version runtime. Mismatch = risque de types fantômes (API React 19 acceptée par TS mais crash au runtime).

### L25f — calculerInterets ÷400 = taux trimestriel (intentionnel ?)
**Observation** : `empruntsTotal * taux / 400` avec `TAUX_INTERET_ANNUEL = 5`. Le /400 = /100/4 donne le taux trimestriel (1.25%). Fonction exportée mais non appelée (dead code).
**Règle** : les fonctions dead code exportées doivent être documentées ou supprimées. Ajouter un commentaire `/** @deprecated Non utilisée — taux trimestriel */` si conservée.

### L25h — Rate limiting sans dépendance externe : utiliser Supabase
**Approche** : table `rate_limits` + fonction PL/pgSQL `check_rate_limit(key, window_secs, max_hits)` atomique (INSERT ... ON CONFLICT DO UPDATE). Backing store dans Supabase déjà présent.
**Avantages** : zéro dépendance ajoutée, fonctionne sur toutes les instances Vercel (stateless safe), purge automatique des entrées expirées dans la même transaction.
**Pattern** : helper `lib/rate-limit.ts` → `checkRateLimit(routeKey, ip)` retourne `boolean`. IP extraite de `x-forwarded-for` (header injecté par Vercel).
**Fail open** : si Supabase indisponible, on laisse passer (ne jamais bloquer les utilisateurs légitimes à cause d'une erreur de rate limit).

### L25i — CSRF : vérifier l'origin dans le middleware, pas dans chaque route
**Approche** : centraliser la protection CSRF dans `middleware.ts` pour les routes POST sensibles. Un seul endroit à maintenir, appliqué avant même que la route s'exécute.
**Localhost** : toujours autoriser `localhost` et `127.0.0.1` pour le dev local. Sans ça, `npm run dev` est bloqué.
**Fail safe** : si `origin` est absent (ex: requête serveur-à-serveur), on laisse passer — seules les requêtes avec un origin non autorisé sont bloquées.

### L25j — Open redirect : tronquer query string et fragment, valider le chemin
**Erreur** : `redirectTo.startsWith("/")` insuffisant — `?redirectTo=/dashboard?next=https://evil.com` passait la validation.
**Fix** : `split("?")[0].split("#")[0]` pour ne garder que le chemin, puis regex `/^\/[a-zA-Z0-9/_\-.]*$/` pour valider les caractères.

### L25k — Accessibilité : aria-live="assertive" pour les erreurs d'achat
**Règle** : `aria-live="polite"` attend une pause pour annoncer. Pour les erreurs critiques (paiement, quota), utiliser `aria-live="assertive"` pour une annonce immédiate aux lecteurs d'écran.

### L25g — Operator precedence : || vs Math.max
**Erreur** : `dettes + joueur.bilan.decouvert || 1` — le `||` opère sur le résultat de l'addition, pas sur `decouvert` seul. Si la somme vaut 0, on obtient 1 (correct), mais si `decouvert` est NaN, `NaN || 1 = 1` masque le bug.
**Fix** : toujours utiliser `Math.max(1, expr)` pour les diviseurs qui ne doivent pas être 0.

## L26 — 2026-04-10 : Unités silencieuses — stocks 1 € vs stocks 1 000 €
**Erreur** : `appliquerAchatMarchandises` et `appliquerCarteClient` travaillaient en unités à 1 € (ex: `push("stocks", quantite)` où quantite=2 → 2 € de stock), alors que le bilan initial (`Belvaux stocks 4 000 €`) et les cartes décision (`+5000`, `+2000` sur stocks) utilisaient déjà l'euro comme unité. Résultat : 1 achat de 2 unités coûtait 2 € au joueur mais ajoutait 2 € (= 0,002 unité "carte") au bilan. Incohérence silencieuse — aucun test ne l'attrapait car les 4 tests de vente vérifiaient `Stocks-1`/`CMV+1` en cohérence interne.
**Fix** : constante `PRIX_UNITAIRE_MARCHANDISE = 1000` dans `types.ts`, multiplier par elle dans les deux fonctions, mettre à jour les 4 tests.
**Règle** : quand une même constante (ici le stock) est manipulée dans plusieurs fichiers, **toujours vérifier l'unité** en comparant les valeurs réelles. Si un bilan initial a 4 000 et qu'un achat ajoute 2, il y a un bug silencieux. Chercher aussi tous les `push("stocks", ...)` et s'assurer que les nombres sont du même ordre de grandeur (milliers ou unités, pas un mélange).

## L27 — 2026-04-10 : Doubler les tests sur les tests "cohérence interne"
**Observation** : les 4 tests de vente vérifiaient que `Stocks -1` et `CMV +1` → ça passait parce que c'était interne à une seule fonction. Aucun test ne faisait `achat puis vente` pour vérifier que les unités matchaient entre fonctions.
**Règle** : pour chaque domaine (stock, trésorerie, capitaux), ajouter au moins un test d'intégration qui enchaîne deux fonctions et vérifie que les unités sont cohérentes.

## L28 — 2026-04-11 : Atomicité comptable dans l'affichage progressif des écritures
**Erreur** : `applyEntry` marquait une seule écriture à la fois. Quand la transaction "remboursement" avait deux entrées (trésorerie −500 PUIS emprunts −500), appliquer la première créait un déséquilibre visible de −500 entre les deux clics.
**Cause profonde** : en partie double, une transaction est toujours composée de ≥2 écritures. Afficher un état intermédiaire entre deux écritures d'une même transaction crée un bilan non-équilibré, ce qui est pédagogiquement trompeur.
**Fix** : après avoir marqué l'écriture cliquée, auto-appliquer les suivantes en boucle jusqu'à ce que `getTotalActif === getTotalPassif`. Condition d'arrêt : équilibre atteint OU plus d'entrée en attente. Comme le moteur est correct, la convergence est garantie en ≤ N itérations.
**Règle** : dans un affichage pédagogique progressif de la partie double, ne jamais laisser l'apprenant voir un état non-équilibré. Grouper atomiquement toutes les écritures d'une même transaction.

## L29 — 2026-04-11 : Badges "avant → après" — filtrage par index, pas par poste
**Erreur** : `effectiveRecentMods` filtrait `recentModifications` par poste (Set of applied postes). Quand tresorerie est modifiée 3 fois dans la même étape (intérêts, remboursement, charges), `findMod(..., "tresorerie")` retournait le PREMIER mod (8000→7600) même après avoir appliqué le remboursement (7600→7100).
**Fix** : (1) filtrer `recentModifications` par INDEX (`recentModifications[i]` ↔ `activeStep.entries[i]` — même filtre, même ordre), (2) changer `findMod` pour retourner le DERNIER match, (3) ajouter `setRecentModifications` dans `launchAchat`, `launchDecision`, `handleInvestirPersonnel`.
**Règle** : quand on construit une liste de mods et une liste d'entries à partir du même filtre dans le même ordre, utiliser le filtrage par INDEX (pas par valeur de champ) pour conserver la correspondance 1:1 dans l'affichage progressif.

## L30 — 2026-04-11 : Badge amortissement par bien — ne jamais diviser totalDelta / nItems
**Erreur** : BilanPanel calculait `perItemDelta = Math.round(totalDelta / nItems)` pour afficher le badge "avant → après" par bien immobilisé. Avec 3 items (Entrepôt, Camionnette, Autres Immobilisations) et un totalDelta de -2 000 €, le calcul donnait -667 appliqué à "Autres Immobilisations" (valeur 0), affichant un delta fictif sur un bien jamais amorti.
**Cause** : la division égale suppose que tous les items ont la même variation, ce qui est faux quand certains sont à 0.
**Fix** : utiliser le taux fixe PCG de 1 000 €/bien. Pour l'amortissement (totalDelta < 0), n'afficher le badge QUE sur les biens avec `a.valeur > 0`. Pour un investissement (totalDelta > 0), n'afficher le badge QUE sur "Autres Immobilisations".
**Règle** : quand un delta total est distribué selon une règle non-uniforme (ici : ignorer les biens à 0), ne jamais diviser égalementparmi tous les items. Utiliser la règle de distribution effective (taux fixe, cible unique, etc.).

## L31 — 2026-04-11 : Rebuild du package game-engine après ajout d'export
**Erreur** : après avoir ajouté `vendreImmobilisation` dans `packages/game-engine/src/engine.ts` et l'avoir importée dans `apps/web/app/jeu/hooks/useGameFlow.ts`, `npx tsc --noEmit` côté web a renvoyé `TS2305 Module '@jedevienspatron/game-engine' has no exported member 'vendreImmobilisation'` + des erreurs en cascade `TS7006 Parameter implicitly has any type` (parce que `ResultatAction` devenait `any`).
**Cause** : `apps/web` consomme le package via son `dist/` (`"main": "dist/index.js"`, `"types": "dist/index.d.ts"`), pas via les sources. Ajouter une fonction au `src/` ne suffit pas — il faut rebuild.
**Fix** : `cd packages/game-engine && npm run build` pour régénérer `dist/`. Les erreurs disparaissent.
**Règle** : à chaque ajout/modification d'un export dans `packages/game-engine/src/`, **toujours** lancer `npm run build` dans le package avant de valider tsc côté `apps/web`. Les erreurs `TS2305` + `TS7006` en cascade après un ajout d'export = signal certain qu'il faut rebuild.

## L32 — 2026-04-11 : Pioche de l'étape 6b doit être stable entre clics (pas re-rendue)
**Erreur** : `cartesDisponibles` était calculé à chaque render via `tirerCartesDecision(cloneEtat(etat), 4)`. À l'étape 6b "investissement", chaque setState (validation d'une carte) déclenchait un re-render → 4 nouvelles cartes piochées au hasard → l'apprenant voyait disparaître ses choix entre deux investissements.
**Cause** : `tirerCartesDecision` est non-pure côté affichage (random), et React n'avait aucune raison de mémoriser le résultat sans `useState` ou `useMemo` stable sur une dépendance immuable.
**Fix** : ajouter `pioche6b: CarteDecision[] | null` en `useState`. `useEffect` initialise la pioche quand on entre en 6b et la reset à `null` quand on en sort. Quand on investit une carte, retirer manuellement la carte du state via `setPioche6b(prev => prev?.filter(c => c.id !== carteUsed.id) ?? null)`. `cartesDisponibles` lit `pioche6b ?? []` en 6b et garde le calcul live ailleurs.
**Règle** : tout tirage aléatoire ou dérivation non-pure servant à un panneau persistant doit être stabilisé en state, pas calculé inline en render. Critère de détection : si l'utilisateur peut interagir plusieurs fois avec le panneau et que les options doivent rester identiques entre les interactions, alors c'est du state.

## L33 — 2026-04-11 : Étape multi-actions — confirmActiveStep doit revenir au panneau, pas avancer
**Erreur** : avant la Tâche 11 Volet 2, `confirmActiveStep` appelait toujours `avancerEtape(next)` à la fin d'une écriture comptable validée. Pour 6b investissement, cela enchaînait directement à l'étape 7 après la première carte → impossible d'investir plusieurs fois dans le même trimestre.
**Fix** : ajouter un branch explicite `if (etapeAvantAvancement === 6 && subEtape6 === "investissement")` qui fait `setEtat({ ...next })` + `setActiveStep(null)` mais SANS appeler `avancerEtape`. Le passage à l'étape 7 se fait uniquement via le bouton "Terminer →" qui appelle `skipDecision()`.
**Règle** : quand une étape autorise plusieurs actions consécutives, `confirmActiveStep` doit retourner au panneau de sélection, pas avancer. Le passage à l'étape suivante doit être un acte explicite de l'utilisateur (bouton "Terminer").

## L34 — 2026-04-11 : Cession d'immobilisation — ne pas utiliser appliquerDeltaPoste pour cibler un bien nommé
**Contexte** : implémentation de `vendreImmobilisation` (Volet 3 Tâche 11). Tentation initiale : utiliser `appliquerDeltaPoste(joueur, "immobilisations", -vnc)` pour décrémenter le bien.
**Problème** : `appliquerDeltaPoste` route les deltas négatifs sur le PREMIER actif catégorie "immobilisations" trouvé (souvent "Entrepôt"), pas sur le bien nommé qu'on veut vendre. De plus, vendre = retirer définitivement le bien, pas le ramener à 0.
**Fix** : manipulation directe de `joueur.bilan.actifs` :
1. `findIndex` par `nom` ET `categorie === "immobilisations"`
2. Lire la VNC = `actif.valeur`
3. Encaisser via mutation directe de l'actif tresorerie (logger une modification poste "tresorerie")
4. Logger une modification poste "immobilisations" avec ancienneValeur=VNC et nouvelleValeur=0
5. `joueur.bilan.actifs.splice(idx, 1)` pour retirer le bien
6. Plus/moins-value au CR via mutation directe de `compteResultat.produits.revenusExceptionnels` ou `compteResultat.charges.chargesExceptionnelles`
**Règle** : `appliquerDeltaPoste` est utile pour les effets génériques de cartes. Pour toute opération qui cible un bien nommé du bilan (cession, transfert, échange), manipuler directement le tableau `joueur.bilan.actifs` et logger des modifications avec le poste générique le plus proche (`immobilisations`, `tresorerie`).

## L35 — 2026-04-13 : Décomposition de hooks React avec interdépendances

**Contexte** : `useGameFlow.ts` (810 lignes) a été décomposé en 4 sous-hooks + 1 utilitaire.

**Clé architecturale** :
- Les fonctions pures (sans état React) vont dans un fichier utilitaire importé par tous → évite la dépendance circulaire
- Les sous-hooks reçoivent leurs dépendances partagées (`etat`, `setEtat`, `setRecentModifications`, callbacks) en paramètres — pas de contexte React nécessaire
- Les fonctions déclarées (`function foo()`) sont hoistées dans la portée d'un hook → on peut les passer en paramètre à un sous-hook même si elles sont déclarées plus bas dans le fichier
- Le hook principal définit `setActiveStep` (wrapper autour de `dispatchActiveStep`) et le passe aux sous-hooks — un seul point de dispatch
- `maybeShowPedagoModal` extrait du pattern répété 6× `if (!etapesPedagoVues.has(e)) { setModal(e); setVues(...) }` → DRY significatif
- `resetDecisionState()` exposé par `useDecisionCards` pour que `confirmEndOfTurn` (orchestrateur) puisse reset l'étape 6 proprement

**Pattern de composition** :
```
useGameFlow (orchestrateur)
├── usePedagogyFlow    → retourne maybeShowPedagoModal (partagé)
├── useLoansFlow       → reçoit addToJournal en param
├── useAchatFlow       → reçoit maybeShowPedagoModal en param
└── useDecisionCards   → reçoit maybeShowPedagoModal + activeStep en param
```

**Résultat** : useGameFlow 810L → ~290L + 5 fichiers ciblés. `npx tsc --noEmit` → 0 erreur.
**Règle** : pour tout hook >300L, identifier les groupes d'état cohérents (pédagogie, emprunts, achats, décisions), extraire en sous-hooks avec dépendances explicites en paramètres. Valider TSC à chaque étape.

## L36 — 2026-04-13 : Dépendance circulaire hooks → useRef pour partage croisé
**Problème** : `useGamePersistence` (appelé en premier) a besoin de `snapshots` produits par `useGameFlow` (appelé en second), mais `useGameFlow` a besoin de `createSoloSession` de `useGamePersistence`. Dépendance circulaire entre hooks.
**Fix** : utiliser un `useRef<TrimSnapshot[]>([])` dans le composant parent (`page.tsx`), passé en `MutableRefObject` à `useGamePersistence`. Le flow écrit `snapshotsRef.current = flow.snapshots` à chaque render. Le ref est lu dans les `useEffect` de persistence (qui se déclenchent quand `phase === "gameover"`, à ce moment les snapshots sont complets).
**Règle** : quand deux hooks ont une dépendance circulaire via les données (pas les callbacks), briser le cycle avec un `useRef` dans le parent. Le ref est la seule valeur React qui peut être écrite par un hook et lue par un autre sans causer de re-render ni violer l'ordre des hooks.

## L37 — 2026-04-13 : CarteDecision.categorie (pas .type) pour filtrer commerciaux
**Erreur** : dans `buildTrimSnapshot()`, filtrage `c.type === "commercial"` → erreur TS2367 car `CarteDecision.type` est littéralement `"decision"`. Les commerciaux sont identifiés par `c.categorie === "commercial"`.
**Règle** : toujours vérifier le type TS de la propriété discriminante avant de filtrer. `type` et `categorie` sont deux champs distincts sur les interfaces de cartes — `type` discrimine le KIND de carte (`"decision"`, `"commercial"`, `"client"`, `"evenement"`), `categorie` discrimine la CATÉGORIE fonctionnelle au sein des `CarteDecision`.

## L39 — 2026-04-14 : Onboarding = wizard séquentiel, pas page monolithique
**Contexte** : l'écran "Configurer la partie" présentait d'un coup tous les paramètres (nombre de joueurs, pseudos, entreprises, durée, conseil) → surcharge cognitive pour un primo-utilisateur. Le bouton "Créer ma propre entreprise" placé en dehors du dropdown semblait "spécial" sans raison apparente pour un débutant.
**Règle pour tout onboarding** :
1. **Une décision par étape** : nombre de joueurs → pseudos → entreprises → durée. Progression linéaire avec `AnimatePresence mode="wait"` + slide horizontal (`x: direction * 60`).
2. **Barre de progression visible en haut** : pastilles numérotées + labels, état actif/fait/à faire clairement distingué (cyan / emerald / slate).
3. **Option "créer/personnaliser"** : intégrée en DERNIÈRE position du dropdown avec icône ✏️ et valeur sentinel `__create__` dans le `<select>`. À la sélection, ouvrir le builder sans changer l'état du select (le `value` reste contrôlé sur la valeur précédente).
4. **Conseil dynamique** : reformuler selon les choix courants `(nbJoueurs, nbTours)` pour éviter les contradictions ("1 joueur sur 6" alors que 8 est choisi). Ne JAMAIS laisser un conseil statique périmer.
5. **Focus auto** : à chaque transition d'étape, focus sur le 1er élément interactif (bouton actif pour étape 1, premier input pour étape 2, etc.).
6. **Raccourci clavier** : `Enter` = Suivant (sauf dans `<select>` ou `<textarea>`).
7. **Validation par étape** : bouton "Suivant" désactivé si l'étape courante est invalide. Erreurs affichées inline.
**Fichier concerné** : `apps/web/components/jeu/SetupScreen.tsx` — pattern à réutiliser pour tout wizard pédagogique du projet.

## L38 — 2026-04-14 : Panneau central UN SEUL document — auto-switch obligatoire en modeDouble
**Contexte** : quand une écriture comptable touche à la fois le Bilan ET le Compte de Résultat (ex. achat immobilisation avec TVA), la tentation est d'afficher les deux documents en grille (2/3 + 1/3). C'est illisible sur fenêtre non-maximisée : les deux panneaux se chevauchent, le joueur ne comprend pas ce qu'il voit.
**Règle** : le panneau central n'affiche JAMAIS deux documents simultanément. Il affiche toujours UN SEUL document (Bilan OU CR). Quand une opération touche les deux :
1. L'auto-switch `useEffect` bascule automatiquement vers le document de l'écriture courante (dernier poste appliqué, sinon premier poste en attente).
2. Les mini-cartes sous la barre d'onglets montrent les impacts sur CHAQUE document (résumé condensé des 3 premières entrées + delta €) et servent d'override manuel pour basculer d'onglet.
3. Le badge visuel "● affiché" (vert) marque la mini-carte correspondant au document visible ; un pastille colorée sur l'autre onglet signale l'impact non-affiché.
**Anti-règle** : ne JAMAIS réintroduire un layout `grid md:grid-cols-3` avec `BilanPanel` + `CompteResultatPanel` côte à côte dans `MainContent.tsx`. Le cas ayant été tranché par l'utilisateur, c'est une décision UX définitive.
**Fichier concerné** : `apps/web/components/jeu/MainContent.tsx` — useEffect lignes ~90-110 (sans guard `modeDouble`), AnimatePresence `mode="wait"` unique, mini-cartes avec `isCurrentTab` + `handleTabChange`.

## L40 — 2026-04-14 : Mode relecture pédagogique = snapshots deep-clone par étape, jamais de re-simulation
**Contexte** : Pierre souhaitait que l'apprenant puisse revenir sur une écriture passée pour la comprendre, sans pouvoir la modifier (principe comptable : on ne corrige pas rétroactivement le passé, on l'analyse). Deux approches possibles :
- **V1** : afficher juste le résumé écritures → insuffisant en formation (les chiffres du Bilan/CR du moment ne sont pas visibles).
- **V2** : reconstituer Bilan/CR fidèles du moment → besoin de données exactes.

Deux stratégies V2 envisagées :
- **A** : à chaque étape validée, deep-cloner le `Joueur` (`structuredClone`) et le stocker dans `JournalEntry.joueurSnapshot`.
- **B** : rejouer le journal depuis l'état initial → danger de divergence si les règles changent entre versions.

**Choix retenu** : A (snapshot). ~1 Mo max en RAM pour 30 étapes × 2–4 joueurs, zéro risque de divergence, lecture O(1).

**Granularité** : par **étape**, pas par écriture. Raisonnement pédagogique : le principe de partie double impose que `Actif = Passif` SEULEMENT à la fin d'une opération complète (une étape). Entre deux écritures d'une même étape, le bilan est volontairement déséquilibré. Afficher cet état intermédiaire à un apprenant lui ferait croire à un bug comptable. L'étape est donc l'unité pédagogique indivisible.

**Règle** :
1. Pour tout mode relecture / historique pédagogique : stocker un snapshot deep-cloné (`structuredClone`) de l'entité métier (Joueur, Compte…) au moment où l'opération est **complète et équilibrée**. Jamais au milieu d'une transaction.
2. Ne jamais rejouer l'historique depuis un état de départ — les règles du moteur peuvent évoluer entre deux versions et casser silencieusement les données historiques.
3. La modale replay est **fullscreen + read-only** : bandeau rouge explicitant l'impossibilité de modifier le passé, bouton vert "Reprendre la partie" en bas à droite, raccourci `Échap` pour fermer.
4. Raccourci clavier (`Backspace`) pour ouvrir : **toujours guarder** avec un test sur `tagName === "INPUT" | "TEXTAREA"` ou `isContentEditable`, sinon on casse la saisie dans les formulaires.
5. Le bouton d'ouverture doit être **désactivé** tant que le journal est vide (`journal.length === 0`) — éviter une modale creuse qui déroute l'apprenant.

**Fichiers concernés** :
- `apps/web/app/jeu/hooks/useGameFlow.ts` : `JournalEntry.joueurSnapshot: Joueur`, capture via `structuredClone` dans `addToJournal`.
- `apps/web/components/jeu/JournalReplay.tsx` : modale plein écran avec timeline (gauche) + détail Bilan/CR + écritures + principe (droite).
- `apps/web/components/jeu/HeaderJeu.tsx` : bouton `⏮ Revoir` avec état désactivé.
- `apps/web/app/jeu/page.tsx` : state `showReplay` + `useEffect` raccourci Backspace avec guard input/textarea.

## L41 — 2026-04-14 : Double-comptage passifs — template stale vs champs directs bilan
**Problème** : Total Passif affiché dans le panneau droit (Indicateurs) ≠ Total Passif dans le panneau central (Bilan), malgré le même objet `joueur`. Le badge "Bilan équilibré" s'affichait en faux positif.

**Cause racine** : `joueur.bilan.passifs[]` contient une entrée héritée du template initial avec `categorie: "dettes"` (ex. "Dettes fournisseurs: 2000"). Le moteur de jeu n'écrit JAMAIS dans cette entrée — il écrit dans les champs directs `bilan.dettes`, `bilan.dettesD2`, `bilan.dettesFiscales`. L'entrée restait donc à la valeur initiale du template (stale). `getTotalPassif()` faisait un `passifs.reduce()` sans filtre → double-comptage.

**3 implémentations divergentes** existaient :
1. `getTotalPassif()` — reduce ALL passifs + champs dettes séparés → **trop grand** (double-compte)
2. `calculerIndicateurs()` — filtre "capitaux" + "emprunts" + champs dettes → **correct**
3. `verifierEquilibre()` — sa propre formule → **encore différente**

**Fix** :
1. `getTotalPassif()` → filtre `p.categorie !== "dettes"` avant reduce (exclut les stales)
2. `verifierEquilibre()` → utilise `getTotalPassif()` directement (source unique)
3. `calculerIndicateurs()` → `totalPassif = getTotalPassif(joueur)` (source unique)

**Règle** : tout calcul de total dans un modèle métier doit avoir **une seule fonction source de vérité**. Ne jamais dupliquer la formule de total dans plusieurs endroits. Si une structure de données a des champs "directs" (ex. `bilan.dettes`) ET des entrées dans un tableau (ex. `passifs[]`) représentant la même notion, l'un des deux est stale — il faut explicitement choisir lequel fait foi et documenter pourquoi (commentaire dans le code).

**Fichier concerné** : `packages/game-engine/src/calculators.ts` — fonctions `getTotalPassif`, `verifierEquilibre`, `calculerIndicateurs`.

## L42 — 2026-04-14 : Persistence localStorage + sécurité session (1 code = 1 partie)

### Contexte
Business model corrigé : 1 crédit = 1 code unique = 1 apprenant = 1 partie. Un refresh de page ne doit pas permettre de recommencer.

### Architecture retenue

**Persistence localStorage** :
- `SavedGame { version, savedAt, roomCode, phase, etat }` avec TTL 24h et version invalidation
- Clés : `jdp_game_room_${code}` (apprenant), `jdp_game_solo_${code}` (formateur), `jdp_solo_pending_code` (code solo entre createSession et handleStart)
- Écrit à chaque changement d'`etat` pendant `playing`/`intro`
- Nettoyé en `gameover` côté localStorage + PATCH `/api/sessions/[code]/start` côté DB

**Sécurité session (route POST /api/sessions/[code]/start)** :
- `waiting → playing` (200) : première fois, atomic update avec `.eq("status", "waiting")` guard
- `playing` (208) : refresh probable → attendre restauration localStorage
- `finished` (403) : partie terminée, blocage définitif
- Fail-open sur erreur réseau (pour ne pas bloquer un cours)

**Initialisation dans `useGamePersistence`** :
- `persistenceReady` : booléen exporté, true seulement après la fin de l'Effect 1 (localStorage lu + éventuel fetch répondu)
- `restoredGame` : exporté, consommé par `useEffect` dans `page.tsx` pour setter `phase` et `etat`
- `sessionBlocked` : exporté, déclenche des écrans d'erreur dédiés dans `page.tsx`

**Règle spinner** : ne jamais afficher l'écran de setup tant que `persistenceReady === false` — évite le flash de "setup → jeu" lors d'une restauration.

**Règle solo refresh** : stocker le roomCode dans `localStorage.setItem("jdp_solo_pending_code", code)` après `createSoloSession()`, car il n'y a pas de code dans l'URL en mode solo.

### Fichiers modifiés
- `apps/web/app/jeu/hooks/useGamePersistence.ts` — complet rewrite
- `apps/web/app/api/sessions/[code]/start/route.ts` — nouveau (POST + PATCH)
- `apps/web/app/jeu/page.tsx` — useEffect restauration + écrans blocked/loading

---

## L43 — 2026-04-18 : Échelle des montants du moteur

### Erreur
Lors de la conception du système « Défis du dirigeant X » (Tâche 24), j'ai proposé plusieurs fois des chiffres à l'échelle 1-10€ en lisant littéralement les valeurs `CHARGES_FIXES_PAR_TOUR = 2000`, `DECOUVERT_MAX = 8000`, `AMORTISSEMENT_PAR_BIEN = 1000`. Pierre a dû corriger à deux reprises avant que je vérifie effectivement les unités dans le code.

### Cause
Les constantes de `packages/game-engine/src/types.ts:344-528` sont en **euros réels** (pas en milliers, pas en unités symboliques), mais la déclaration ne le précise ni par suffixe, ni par commentaire explicite. L'échelle n'est confirmée que par :
- les explications utilisateur (`engine.ts:453` : "1 000 € par bien")
- les composants d'affichage (`BilanPanel.tsx:266-271` utilisent `toLocaleString("fr-FR")` avec seuils à 3 000€)
- le formateur `formatEuro` dans `ReportCharts.tsx:38` qui convertit en `K€` quand `>= 1000`

### Règle
**Avant toute proposition de chiffres pour ce jeu** :
1. Lire les constantes dans `packages/game-engine/src/types.ts:344-528`
2. Vérifier l'échelle dans un composant d'affichage (`BilanPanel.tsx`, `CompteResultatPanel.tsx`) qui formate avec `€`
3. Retenir les ordres de grandeur suivants :
   - Montants trimestriels : 500 à 5 000€
   - Bilan cumulé mid-partie : 10 000 à 40 000€
   - Résultat annuel plausible : 5 000 à 20 000€
   - Seuil faillite : 8 000€ de découvert
4. **Ne jamais calquer la fiscalité réelle sans rescaler** (ex. seuil IS PME à 42 500€ n'a aucun sens ici — l'IS doit être un pourcentage du bénéfice du jeu, pas un barème progressif réel)
5. **Préférer les pourcentages aux montants absolus** dans les propositions de design, car les % restent cohérents quelle que soit l'échelle

### Fichiers concernés
- `packages/game-engine/src/types.ts:344-528` (constantes économiques)
- `apps/web/components/BilanPanel.tsx:266-271` (seuils diagnostic)
- `apps/web/components/CompteResultatPanel.tsx:54` (amortissement 1 000€/bien confirmé)
- `apps/web/components/rapport/ReportCharts.tsx:38` (formateur K€)

---

## L44 — 2026-04-18 : Pas d'accents dans les nouveaux types TypeScript

### Décision Pierre (Tâche 24)
Le code existant a des accents historiques (`effetsImmédiats`, `publicitéCeTour` — cf. Tâche 6.4 skipped pour risque cross-file). Mais pour tout **nouveau** type, propriété, fonction : **pas d'accent**.

### Règle
- `EffetDiffere` et non `EffetDifferé`
- `ArcDiffere` et non `ArcDifferé`
- `defisResolus` et non `defisRésolus`
- `cloture` et non `clôture`

### Pourquoi
- Les chaînes accentuées dans les noms d'identifiants compliquent les refactos automatiques (certains outils IDE/grep les traitent mal).
- Incohérence cross-file (certains modules en ont, d'autres non) → lecture difficile.
- Coût d'une migration complète (Tâche 6.4) jugé trop élevé. Donc : ne plus en ajouter.

### Exception
Les **chaînes affichées à l'utilisateur** (libellés de défis, explications, messages pédagogiques) conservent tous leurs accents français. La règle ne porte que sur les **identifiants de code**.

### Fichiers concernés
- `packages/game-engine/src/types.ts` (pour tout nouvel ajout)
- Toute nouvelle fonction pure ou type dans `game-engine/` ou `apps/web/`

---

## L45 — 2026-04-18 : Workspace link manquant dans le VM Cowork

### Erreur
Après un `git pull` propre sur le VM, `npx tsc --noEmit` dans `apps/web` échouait avec :
```
Module '"@jedevienspatron/game-engine"' has no exported member 'determinerTimingRupture'.
```

### Cause
`apps/web/node_modules/@jedevienspatron/game-engine` n'existe pas dans le VM. Les `npm install`
précédents ont été lancés depuis le Mac de Pierre, donc les symlinks de workspace npm sont
présents localement mais n'ont pas été propagés au VM.

### Règle
Avant toute première validation TypeScript dans `apps/web/` sur le VM, vérifier :
```
ls apps/web/node_modules/@jedevienspatron/game-engine
```

Si absent, deux options :
1. `npm install` à la racine (peut timeout en 2 min dans le VM).
2. **Fallback rapide** (préféré pour validation seule) :
   ```
   mkdir -p apps/web/node_modules/@jedevienspatron
   ln -s ../../../../packages/game-engine apps/web/node_modules/@jedevienspatron/game-engine
   ```

### Prérequis au fallback
- `packages/game-engine/dist/` doit être à jour (`npm run build --workspace=packages/game-engine`).
- Le package est consommé via `main: "dist/index.js"` dans `package.json`, donc **tout changement
  dans `src/`** nécessite un rebuild avant validation d'`apps/web`.

### Ce que ça confirme
- L'API publique de `game-engine` doit exporter tout ce qui est importé côté `apps/web`,
  sinon la résolution via dist/ échoue silencieusement.
- Le symlink local suffit pour `tsc --noEmit` ; pour un `npm run dev` ou `build`, préférer
  le vrai `npm install` depuis le Mac.

---

## L46 — 2026-04-19 : Pré-chargement redondant = doublement des ventes au T1

### Symptôme rapporté par Pierre
Au T1, avec un Commercial Junior par défaut (qui génère 2 clients Particuliers/trimestre),
**4 ventes distinctes apparaissaient à l'étape 4 au lieu de 2**, pour toutes les entreprises
(Belvaux production confirmée). Bug antérieur, pas une régression Vague 2 Défis.

### Cause racine
`packages/game-engine/src/engine.ts` L272-275 pré-chargeait 2 clients Particuliers dans
`clientsATrait` à la création du joueur (`creerJoueur`). À l'étape 3 du T1,
`genererClientsParCommerciaux` AJOUTAIT (avec spread) 2 clients supplémentaires du Commercial
Junior par défaut → **2 pré-chargés + 2 junior = 4 clients**, traités à l'étape 4 comme
4 ventes distinctes.

Le pré-chargement était un artefact historique d'une version antérieure **sans** Commercial
Junior par défaut : il donnait de la visibilité aux 1ères ventes. Depuis l'ajout du Commercial
Junior en dotation initiale (L265-266), il fait doublon.

### Fix
Remplacer L272-275 par `clientsATrait: []` — le Commercial Junior génère déjà les 2 clients à
l'étape 3. Commentaire explicatif inline pour prévenir une régression future.

### Règle
**Toujours vérifier si une initialisation "de confort" reste nécessaire après un changement
d'architecture.** Ici, la dotation initiale (cartesActives avec Commercial Junior) rendait
le pré-chargement de clientsATrait redondant — mais sans test dédié, le bug est passé inaperçu.

### À retenir
- Quand une entité a plusieurs sources d'alimentation (`clientsATrait` = pré-chargement +
  commerciaux + spécialité), toute addition doit documenter qui alimente quoi, et quand.
- Le test `engine.test.ts:210-215` attendait 1 client (valeur obsolète depuis le passage à
  `nbClientsParTour: 2`). La suite est déjà cassée à la compilation (erreur pré-existante),
  donc ce test faux ne ralentit personne — mais il faudrait le corriger un jour.

---

## L47 — 2026-04-19 : CTA secondaire "Passer" doit rester visible sans confusion hiérarchique

### Symptôme rapporté par Pierre
À l'étape 6b (Investissement), les boutons "Passer →" (en-tête) et "Passer cette étape →"
(bas de section) étaient stylés `bg-white/10` / `bg-white/[0.06]` — ils se confondaient
avec le fond sombre et le joueur ne voyait pas l'option pour skipper.

### Fix
Appliquer la palette **amber** déjà utilisée dans la section Logistique & Innovation
(cohérence sémantique : amber = secondaire important) :
```
bg-amber-500 text-slate-950 font-bold
border border-amber-300/60 ring-2 ring-amber-300/50 shadow-lg shadow-amber-500/40
hover:bg-amber-400
```

Deux boutons modifiés dans `apps/web/components/jeu/InvestissementPanel.tsx` (L390-398 et L491-500).

### Règle
Un CTA secondaire **nécessaire mais non-principal** ("Passer", "Skip") doit :
1. **Contraster avec le fond** : éviter `bg-white/*` sur fond sombre pour les actions utiles.
2. **Ne pas rivaliser avec le CTA principal** : choisir une teinte différente (ici amber vs cyan
   pour "Investir").
3. **Rester cohérent avec la sémantique de section** : la section Investissement utilise déjà
   amber pour "Logistique & Innovation" → le bouton Passer s'intègre naturellement.

### À retenir
- Les boutons "neutres" sur fond sombre (`bg-white/10`) sont invisibles pour les utilisateurs
  non habitués au design du produit. Toujours tester l'affichage avec un œil neuf.
- Avant de styler, chercher les palettes amber/yellow déjà utilisées dans le même composant
  pour garantir la cohérence — pas créer une 6ème teinte.

---

## L48 — 2026-04-19 : Variantes d'un écran de défi — routage par archétype, pas par tonalité

### Contexte
Dans `DefiDirigeantScreen.tsx` (Vague 3), j'avais deux axes de différenciation disponibles :
l'**archétype** (structure dramaturgique du défi : observation, choix_binaire, palier, etc.)
et la **tonalité** (thème comptable : trésorerie, risque, positionnement, etc.).

### Décision
- **Archétype** détermine la **variante structurelle** (courte vs longue vs clôture) — c'est
  lui qui dicte *quelle* UI on montre.
- **Tonalité** détermine la **palette visuelle** — elle dicte *comment* on la colore.

Deux fonctions pures dédiées :
```ts
function variantePourArchetype(archetype): "courte" | "longue" | "cloture"
function getPaletteTonalite(tonalite): PaletteTonalite
```

Chaque fonction a une seule responsabilité et un seul `switch` exhaustif. Aucun couplage
croisé : un défi « palier_strategique » peut avoir n'importe quelle tonalité, ça ne change
que la palette, pas la variante.

### Règle
Quand une entité a plusieurs dimensions orthogonales (archétype × tonalité × slot...),
**une fonction pure par dimension**. Ne jamais concaténer archétype + tonalité dans une
clef unique — ça fige les combinaisons et empêche d'en ajouter.

### À retenir sur Tailwind JIT
Les classes Tailwind **doivent être des littéraux statiques** détectables par le JIT. Interdit :
```ts
// ❌ JIT ne verra JAMAIS ces classes
const palette = `bg-${couleur}-900/80 border-${couleur}-700`;
```
Écrire 6 objets constants complets avec classes en dur (comme `PALETTE_EMERALD`, `PALETTE_ROSE`...)
et mapper via un switch explicite. Plus verbeux, mais fiable.

### Tests sans framework quand la partie UI n'a pas jest
`apps/web` n'a pas jest. Pour tester le palette helper, j'ai créé un script d'assertion
autonome `__tests__/palette.verify.ts` qui :
1. Passe `npx tsc --noEmit` (type-safe)
2. Se compile + exécute ponctuellement via `node` pour vérifier les invariants runtime
3. Documente sa procédure d'exécution en commentaire (pas de magie cachée)

Mieux qu'un test jest absent, plus léger que d'installer jest juste pour un helper.

### À retenir
- Un helper pur de 50 lignes avec switch + string literals est mieux couvert par tsc que par
  un test qui réaffirme les valeurs constantes. Tester plutôt **les invariants structurels**
  (distinctness, complétude des champs) que les chaînes elles-mêmes.
- Préférer 6 constantes dupliquées en apparence à 1 constante dynamique : le JIT Tailwind
  n'a pas d'autre choix.

---

## L49 — 2026-04-19 : Blocs shell pour Pierre — zéro placeholder, zéro `#` inline

### Symptôme
J'ai proposé à Pierre ce bloc copy-paste après un commit :
```
cd /chemin/vers/jedevienspatron-github
git pull       # récupère le commit 758f247 du VM
git log --oneline -3   # confirme que 758f247 est présent
git push origin main
```

Deux erreurs sur son Mac (zsh) :
1. `cd: no such file or directory: /chemin/vers/jedevienspatron-github` — placeholder bidon.
2. `zsh: command not found: #` + `fatal: '#' does not appear to be a git repository` — **zsh interactif ne traite PAS `#` comme commentaire par défaut** (contrairement à bash, ou zsh en mode script). Il faut `setopt INTERACTIVE_COMMENTS` pour ça.

Le push final a fini par passer, mais c'est de la chance — le bloc a été exécuté à moitié en erreur.

### Règle
Quand je propose un bloc de commandes shell pour copy-paste à Pierre :

1. **Zéro placeholder inventé** (`/chemin/vers/...`, `<ton-fichier>`, etc.). Si je ne connais
   pas le chemin exact, j'écris la consigne en français (« dans ton dossier du repo ») au
   lieu d'un faux chemin. Pierre connaît son filesystem mieux que moi.

2. **Zéro `#` inline dans les commandes**. Les explications vont AVANT ou APRÈS le bloc,
   pas dedans. Si une explication est essentielle, je l'écris hors code.

3. **Un bloc = une intention exécutable** sans édition manuelle. Pierre doit pouvoir faire
   ⌘C / ⌘V sans relire.

### Exemple correct
Au lieu de :
```
cd /chemin/vers/jedevienspatron-github    # ton repo
git pull       # récupère le commit
git push origin main   # push
```

Écrire :
> Dans le dossier du repo sur ton Mac :
> ```
> git pull
> git push origin main
> ```
> (Le `git pull` n'est pas toujours nécessaire — seulement si quelqu'un d'autre a pushé entre-temps.)

### À retenir
- `zsh` interactif est plus strict que `bash` : pas de commentaires inline sans opt-in explicite.
- Un placeholder est une **source de honte et de bruit** dans une réponse à un utilisateur :
  il signale que je n'ai pas vérifié son environnement avant de proposer la commande.
- Règle absolue : je ne donne PAS de commande avec un chemin que je n'ai pas vu moi-même.

---

## L50 — 2026-04-19 : Cartographier le scope AVANT de planifier, pas pendant l'implémentation

### Symptôme
Tâche 25 avait été planifiée en 3 sous-tâches "simples" (trésorerie, intérêts, ordre des étapes). J'ai démarré T25.C (réordonner les 9 étapes) sur cette base. En ouvrant le code, j'ai découvert :
1. **Deux copies du moteur de jeu** coexistent (`packages/game-engine/src/engine.ts` canonique + `apps/web/lib/game-engine/` legacy encore utilisé par l'app). Réordonner dans une seule casse l'autre silencieusement.
2. **~170 lignes de contenu pédagogique** (`MODALES_ETAPES` — 9 entrées, `QCM_ETAPES` — 10 entrées) sont **indexées par numéro d'étape**. Passer de 9 à 8 étapes n'est pas une renumérotation, c'est un **re-mapping sémantique** ("l'étape 5 signifie maintenant décision, pas fin-période — donc la modale doit changer, pas juste se décaler").
3. Tâche 24 (défis du dirigeant) a câblé des **slots dramaturgiques** (`debut_tour`, `avant_decision`, etc.) sur l'ordre actuel. Les déplacer invalide les ancrages narratifs en cours d'implémentation.

Si j'avais continué sur l'élan "les 3 sous-tâches sont approuvées, j'exécute", j'aurais livré une régression silencieuse OU fait exploser le scope du commit.

### Règle
Pour toute tâche qui touche une **structure transversale** (numéro d'étape, signature d'API publique, identifiant stable utilisé dans les données), je dois exécuter un **inventaire du scope** AVANT de dire "approuvé, j'y vais" :

1. `grep` sur les utilisateurs de la structure (ici : tous les endroits qui font `etapeTour === N` ou indexent par `N`).
2. Recenser les copies de fichiers qui devraient être en sync (`apps/web/lib/game-engine/` vs `packages/game-engine/`).
3. Repérer les données indexées par la structure (`MODALES_ETAPES[0..8]`, `QCM_ETAPES[0..9]`).
4. Vérifier les fonctionnalités récemment câblées qui en dépendent (Tâche 24 slots).

Si l'inventaire révèle un scope très supérieur à ce qui avait été envisagé : **STOP, re-plan immédiatement**, ne pas "juste livrer la version light et on verra plus tard" — parce que "plus tard" part avec une dette mal documentée.

### Application dans Tâche 25
J'ai livré T25.A + T25.B (changements localisés, testables) et **reporté T25.C** avec une note explicite dans `tasks/todo.md` décrivant les 3 surfaces de code à coordonner. Pierre aura un plan propre pour décider du séquencement (faire T25.C en même temps que la suppression du moteur dupliqué ? en même temps que le re-mapping pédagogique ?) au lieu d'une demi-livraison.

### À retenir
- **Un scope qui grossit pendant l'implémentation est un signal d'arrêt**, pas d'accélération.
- Les "petites refontes d'ordre" sont souvent les plus toxiques : elles touchent des indexations implicites partout.
- Documenter un report est une livraison à part entière — pas un échec.

---

## L51 — 2026-04-20 : Cycle 9→8 étapes — un test de parité vaut mille assertions

### Symptôme
Commit 3 de T25.C fusionne deux étapes (`CHARGES_FIXES` + `EFFETS_RECURRENTS`) en une seule (`CLOTURE_TRIMESTRE`) via une nouvelle fonction `appliquerClotureTrimestre()`. Risque latent : l'orchestration enchaînée dans l'ancien pipeline (`appliquerEtape0` puis `appliquerEffetsRecurrents` puis `appliquerSpecialiteEntreprise`) se reproduit-elle à l'identique dans la nouvelle fonction ? Un écart d'un centime, un ordre inversé, un `specialiteAppliqueeTour` qui n'incrémente plus — et la régression serait silencieuse.

### Ce qui a sauvé la livraison
Le Commit 0 (`b630856`) avait ajouté un test de **parité** dans `cycle-shape.test.ts` : « le nouveau `appliquerClotureTrimestre` doit produire exactement le même `EtatJeu` final que la séquence historique `appliquerEtape0 ∘ appliquerEffetsRecurrents ∘ appliquerSpecialiteEntreprise` ». Un seul `expect(etatNouveau).toEqual(etatHistorique)` couvre :
- la trésorerie après charges fixes + intérêts + remboursement,
- l'état des cartes récurrentes (compteurs `nbAppliquee`, flag `consommee`),
- les effets de spécialité (bonus/malus + incrémentation `specialiteAppliqueeTour`),
- l'équilibre du bilan (actif = passif + résultat),
- le journal et les modifications attendues.

Quand j'ai implémenté `appliquerClotureTrimestre()`, j'ai écrit la version "évidente" (les 3 appels enchaînés en interne) et le test a immédiatement validé que la parité tenait. Sans ce test, j'aurais dû re-vérifier manuellement 5 champs d'`EtatJeu` × 4 entreprises × plusieurs scénarios — fatigue garantie → angle mort garanti.

### Règle
Avant toute fusion/split de fonctions qui orchestrent un pipeline d'effets métiers, **écrire un test de parité comme premier livrable du refactor**. Formule :
```
expect(nouvelleFonction(etat)).toEqual(ancienPipelineSequentiel(etat));
```
Ce test doit passer sur `main` (avec l'ancienne impl) et continuer à passer après la fusion. Il rend le refactor « boring » — exactement ce qu'on veut pour un refactor.

### Corollaire : `toEqual` sur un `EtatJeu` complet > 20 `toBe` ciblés
Quand l'état testé est un objet imbriqué (joueurs, cartes, bilan, journal), `toEqual` sur la racine attrape des champs qu'on n'aurait pas pensé à assert manuellement. Coût : il faut aussi tester les cas limites (effets récurrents vides, premier tour, spécialité déjà appliquée) — mais chacun reste un simple `toEqual`.

### Effet de bord bienvenu : bump `SAVE_VERSION`
Réordonner les valeurs de `ETAPES.*` invalide toutes les saves localStorage de l'ancien cycle : les numéros d'étape stockés ne correspondent plus au même contenu. Bump `SAVE_VERSION` 1→2 dans `useGamePersistence.ts` → les saves v1 sont rejetées au chargement, les apprenants repartent sur le nouveau cycle sans bug d'hydration.

### À retenir
- Un refactor de pipeline = un test de parité d'abord, puis le refactor.
- `toEqual` sur l'état complet capture les régressions dans les champs oubliés.
- Toute re-signification d'un champ stocké impose un bump de version de save.

---

## L52 — 2026-04-20 : L50 confirmée en conditions réelles — il manquait un tableau indexé

### Symptôme
Partie manuelle Phase 4 du T25.C, Belvaux, T1. Le titre du bandeau supérieur et le titre de l'encart gauche étaient corrects (cycle 8 étapes, *"Encaissements des créances clients"* à l'étape 1/8). Mais la **description sous le titre** affichait *"Charges fixes obligatoires payées depuis la trésorerie."* — texte de l'ancienne étape 0. Même symptôme croisé à l'étape 3/8 (*"Achats de marchandises"*) qui affichait *"Vos créances clients avancent et sont encaissées."*. Deux contenus pédagogiques décalés.

### Cause racine
Dans `apps/web/components/jeu/LeftPanel.tsx`, il existe **deux** tableaux indexés par numéro d'étape :
- `STEP_NAMES` (ligne 13) — titres courts, **remappé correctement** en Commit 3.
- `STEP_HELP` (ligne 72) — descriptions sous le titre, **oublié**, toujours dans l'ordre 9 étapes de l'ancien cycle.

Les 9 entrées dans l'ancien ordre + indexation par `etapeTour` du nouveau cycle = rotation silencieuse des textes :
- `etapeTour === 0` (ENCAISSEMENTS) lisait `STEP_HELP[0]` = ancienne entrée "Charges fixes"
- `etapeTour === 2` (ACHATS) lisait `STEP_HELP[2]` = ancienne entrée "Encaissements"

Aucune erreur TypeScript : le tableau reste un `string[]` valide, l'indexation marche, TS ne sait pas que la sémantique est cassée.

### Pourquoi L50 n'a pas suffi à éviter ça
L50 dit : "avant toute refonte d'une structure transversale, faire un inventaire des données indexées par cette structure". J'ai fait cet inventaire et j'ai trouvé `MODALES_ETAPES` et `QCM_ETAPES`. J'ai raté `STEP_HELP` et `STEP_NAMES` (inventaire incomplet) — ma recherche a cherché `MODALES_ETAPES[N]` et `QCM_ETAPES[N]` mais pas le pattern plus générique "tableau de N strings à côté d'un autre tableau de N strings indexé par `etapeTour`".

J'ai heureusement remappé `STEP_NAMES` parce que Pierre voyait *"Encaissements créances"* à l'étape 1/8 et me l'avait pointé. Mais j'ai raté `STEP_HELP` 10 lignes plus bas.

### Règle renforcée
Pour tout refactor d'une structure transversale, l'inventaire doit inclure une recherche **morphologique** (pas juste par nom connu) :
```
grep -rn "= \[$" <composants UI>   # tableaux littéraux suivis d'entrées
grep -rn "const.*NAMES\|const.*HELP\|const.*INFO\|const.*LABELS"
```
Et vérifier **à l'intérieur de chaque fichier touché** si d'autres tableaux du même type vivent à proximité. Un fichier qui a un tableau indexé par étape en contient souvent d'autres juste à côté.

### Ce qui aurait attrapé le bug avant la prod
Un test de rendu qui monte `<LeftPanel etapeTour={0} .../>` et vérifie que la description contient bien "créance" ou "encaisse" aurait sauté. Mais le premier filet reste la **partie manuelle** — exactement celle que Pierre vient de faire. Phase 4 vient de prouver qu'elle n'est pas optionnelle.

### À retenir
- L50 était juste mais incomplète : l'inventaire doit être morphologique, pas seulement par nom.
- Deux tableaux indexés par la même structure cohabitent souvent à 10 lignes d'écart. Ne pas s'arrêter au premier.

---

## L53 — 2026-04-20 : `DECOUVERT_MAX` est en euros — dériver les seuils, pas les dupliquer

### Symptôme
`AlerteDecouvert.tsx` déclenchait le bandeau "FAILLITE" dès que la trésorerie passait sous `-5` (valeur brute, supposée être en "parts" ou "unités internes"). Au T2 de Belvaux, trésorerie à −380 € → bandeau FAILLITE pendant 30 s jusqu'à l'encaissement de l'étape suivante, alors que le mécanisme de faillite réel ne se déclenche qu'à la clôture (étape 6) avec un seuil de −900 €. Double erreur : (1) confusion d'unité, (2) usage d'une constante ad-hoc au lieu de `DECOUVERT_MAX` exporté par le moteur.

### Cause racine
Le moteur exporte `DECOUVERT_MAX = 900` (en euros, vérifié `engine.ts`). Le composant UI avait recopié "le chiffre 5" en pensant que c'était en parts, mais le moteur stocke la trésorerie en euros depuis le Commit 3 de T25.C. Le chiffre 5 n'avait plus aucune sémantique — artefact d'un ancien prototype jamais nettoyé.

### Règle
Quand un composant UI doit afficher un seuil lié à une règle métier, **dériver depuis la constante exportée par le moteur, jamais recopier un chiffre**. Pattern :
```ts
import { DECOUVERT_MAX } from "@jedevienspatron/game-engine";
const SEUIL_ALERTE   = Math.round(DECOUVERT_MAX * 0.33); // ~300 €
const SEUIL_DANGER   = Math.round(DECOUVERT_MAX * 0.66); // ~600 €
const SEUIL_FAILLITE = DECOUVERT_MAX;                    // 900 €
```
Coût : une ligne d'import. Bénéfice : toute évolution du moteur (ajustement du découvert autorisé) se propage automatiquement à l'UI.

### Corollaire — libellé défensif
Tant que le bandeau s'affiche **avant** la clôture (donc avant que la faillite soit réelle), le titre doit rester prédictif : **"FAILLITE PRÉVISIBLE"**, pas "FAILLITE". Le mot "prévisible" préserve le contrat pédagogique : l'apprenant comprend qu'il peut encore corriger avant la fin du trimestre.

### À retenir
- Un chiffre magique dans un composant UI est un signal d'alarme : cherche la constante exportée.
- Le moteur est la source de vérité des unités. L'UI dérive, ne redéfinit pas.
- Les libellés qui anticipent un événement (faillite, rupture de stock, etc.) doivent se préfixer "prévisible" / "imminent" tant que l'événement n'est pas encore matérialisé dans le moteur.

---

## L54 — 2026-04-20 : Un composant exporté n'est pas un composant monté

### Symptôme
Pendant l'audit U3 ("rendre les modales pédago consultables"), j'allais ajouter une prop `onReviewStep` pour rouvrir les modales des étapes franchies. En parcourant le wiring `usePedagogyFlow` → `ModalEtape`, j'ai découvert que **`<ModalEtape>` n'était monté nulle part dans le JSX**. Le composant existait, était exporté, `usePedagogyFlow` exposait `modalEtapeEnAttente` + `setModalEtapeEnAttente`, `maybeShowPedagoModal` settait bien l'état à chaque première visite d'étape — mais aucun composant ne lisait cet état pour rendre la modale. La modale de première visite n'avait donc jamais été affichée aux apprenants depuis T25.C (peut-être même avant).

### Cause racine
Refactor de T25.C : déplacement du contenu pédago vers `lib/pedagogie/pedagogie.ts`, création du hook `usePedagogyFlow`, mais le mount dans `page.tsx` a été oublié dans le split de commits. Aucune erreur TypeScript : un composant React exporté et non utilisé ne déclenche ni warning TS ni warning ESLint (sauf règle `no-unused-vars` stricte qui n'est pas activée). Aucun test de rendu de `page.tsx` qui aurait attrapé "modalEtapeEnAttente set mais <ModalEtape> jamais dans l'arbre".

### Règle
Pour tout composant qui **devrait** être rendu (ModalX, OverlayY, BannerZ…), après tout refactor qui touche son propriétaire, vérifier explicitement :
```bash
grep -rn "<ModalEtape" apps/web/         # mount effectif dans le JSX
grep -rn "import.*ModalEtape" apps/web/  # import côté propriétaire
```
Les deux doivent exister. Le test exporté-mais-pas-monté s'applique aussi aux hooks qui exposent un setter (`setModalX`) : si personne ne lit l'état via un `<ModalX>` dans le JSX, le setter est du code mort silencieux.

### Corollaire — checklist "wire-up" après déplacement d'un composant
Quand on déplace un composant de location A vers location B (ou qu'on crée un hook qui remplace une logique inline), la checklist doit être :
1. Le composant est-il exporté correctement ? (`grep "export default"`)
2. Le nouveau propriétaire l'importe-t-il ? (`grep "import"`)
3. Le nouveau propriétaire le **rend**-il ? (`grep "<ComponentName"`) ← étape la plus souvent oubliée
4. L'état qui devrait le déclencher est-il bien lu quelque part ?

### À retenir
- Exporté ≠ monté. Monté ≠ rendu visible (conditions React peuvent le masquer).
- Un setter sans lecteur est du code mort que TS ne signale pas.
- Après déplacement d'un composant, la question est toujours "qui le rend ?", pas "où est-il défini ?".

---

## L55 — 2026-04-20 : Remapper les mappings visuels, pas seulement les libellés

### Symptôme
`ModalEtape.tsx` contenait un objet `ETAPE_CONFIG` qui associait chaque numéro d'étape (0 à 8 dans l'ancien cycle) à un icône Lucide et une palette Tailwind. Après T25.C (cycle 9→8, resémantisé), j'ai remappé `MODALES_ETAPES` (contenu textuel : titres, descriptions, conseils) **mais oublié `ETAPE_CONFIG`**. Résultat, une fois la modale enfin montée (U3-B) : l'étape 0 "Encaissements des créances" affichait l'icône `Briefcase` + palette slate de l'ancienne étape 0 "Charges fixes". L'étape 6 "Clôture" affichait les couleurs teal/BarChart3 de l'ancien bilan. Modale livrée avec le thème visuel décalé de son contenu.

### Cause racine
Même famille de bug que L52 (`STEP_HELP` oublié à côté de `STEP_NAMES`) : **plusieurs structures indexées par le même numéro d'étape cohabitent**, et un refactor qui renumérote doit les remapper **toutes**, pas seulement celle(s) qu'on a en tête.

Liste des structures indexées par etapeTour recensées à ce jour (à maintenir) :
- `STEP_NAMES` (LeftPanel) — titres courts
- `STEP_HELP` (LeftPanel) — descriptions courtes
- `MODALES_ETAPES` (pedagogie.ts) — contenu pédago long
- `ETAPE_CONFIG` (ModalEtape) — icône + palette
- `QCM_ETAPES` (pedagogie.ts) — questions par étape (neutralisées jusqu'à Commit 4)

### Règle
Avant tout refactor de cycle, exécuter une recherche morphologique **exhaustive** pour recenser toutes les structures indexées :
```bash
grep -rnE "Record<number" apps/web/       # Record<number, X>
grep -rnE "\[0\]:\s|\[1\]:\s" apps/web/   # objets avec clés numériques littérales
grep -rnE "const\s+[A-Z_]+\s*[:=]\s*\[" apps/web/ | grep -iE "etape|step|tour"
```
Puis maintenir la liste dans `tasks/todo.md` ou dans un commentaire au-dessus de la première occurrence, pour que le prochain refactor n'en rate aucune.

### Garde-fou : fallback défensif
Pour les mappings `Record<number, X>`, toujours prévoir un **fallback** :
```ts
const config = ETAPE_CONFIG[etape] ?? {
  Icon: FALLBACK_ICON,
  bg: "from-slate-50 to-slate-100",
  // ...
};
```
Le fallback transforme "index hors borne" d'un crash runtime en rendu dégradé mais cohérent — utile si un prochain refactor oublie de remapper cette structure.

### À retenir
- Un cycle renumeroté entraîne autant de remappings qu'il y a de structures indexées.
- Les mappings visuels (icônes, couleurs) sont aussi indexés que les libellés — et autant à risque.
- Tenir à jour la liste des structures indexées est moins coûteux que les retrouver à chaque refactor.
- Un fallback défensif ne remplace pas le remappage, mais évite l'effet "pire" (crash vs rendu décalé).

---

## L56 — 2026-04-20 : Ne pas hardcoder `cd <répertoire>` sans vérifier la cwd actuelle

### Symptôme
Commande shell proposée à l'utilisateur après 3 commits faits depuis le VM :
```
cd jedevienspatron-github
git pull --ff-only      # récupère les 3 commits du VM
git push origin main
```
L'utilisateur était déjà dans le répertoire (prompt shell : `ph@iMac-de-ph jedevienspatron-github %`). Résultat : `cd: no such file or directory: jedevienspatron-github`, puis `fatal: '#' does not appear to be a git repository` (le `#` absorbé comme argument par `git pull --ff-only`). Deux lignes perdues. L'utilisateur a rattrapé en refaisant juste `git push origin main`.

### Cause racine
Commande générée sans lire l'état visible du prompt shell. Le `cd jedevienspatron-github` ne marche que si la cwd de départ est le *parent* du répertoire cible — condition non satisfaite ici. Bonus : les commentaires `#` sur la même ligne qu'une commande `git pull` chaînée sont interprétés comme arguments, pas comme commentaires, parce que `git` les absorbe via son parser avant que le shell ne les voie comme fin de ligne.

### Règle
1. Lire le prompt shell visible (`user@host cwd %`) avant toute commande shell destinée à l'utilisateur. Si la bonne cwd est déjà active, ne pas injecter `cd`.
2. Ne jamais inliner un commentaire `#` sur la même ligne qu'une commande git chaînée. Mettre les commentaires sur une ligne séparée ou formuler « depuis ton clone du repo » et laisser l'utilisateur gérer son contexte.

### À retenir
- Prompt shell = source de vérité sur la cwd actuelle. L'exploiter avant de supposer.
- `#` n'est pas universellement un commentaire dans une commande chaînée — un parser d'arguments peut l'absorber.
- « Depuis ton clone du repo » est plus robuste qu'un `cd` hardcodé.
- Tester mentalement la cwd supposée avant de proposer une commande à copier-coller.

---

## L57 — 2026-04-20 : Invoquer les subagents et skills du CLAUDE.md en amont, pas après coup

### Symptôme
Session de 7 chantiers (20 fichiers modifiés, nouvelle logique métier dans `appliquerClotureTrimestre`, refonte UX transverse) exécutée sans déclencher un seul subagent ni un seul skill, malgré les triggers définis dans `CLAUDE.md` du projet : « > 2 fichiers » → `writing-plans` ; « bug / comportement inattendu » → `systematic-debugging` ; « avant d'affirmer c'est fait » → `verification-before-completion`. Découverte tardive en U3 : `<ModalEtape>` n'était montée nulle part dans le JSX, et `ETAPE_CONFIG` conservait le mapping de l'ancien cycle 9 étapes. Récidive directe de L52 (l'inventaire morphologique doit précéder le code).

### Cause racine
Confiance excessive dans la compréhension intuitive du problème, alors que les skills du `CLAUDE.md` existent précisément pour éviter que je juge seul si mon travail est « suffisamment compris » ou « suffisamment vérifié ». Phase d'Explore/Plan sautée parce qu'elle paraissait « évidente » — exactement la situation où les garde-fous externes ont le plus de valeur.

### Règle
Pour toute tâche touchant plus de 2 fichiers ou introduisant une nouvelle logique métier, déléguer en amont une phase d'Explore/Plan à un subagent : grep morphologique des `Record<number>`, `<ComponentName`, imports sans consommateur, indexations par même clé. Invoquer explicitement :
- `writing-plans` avant de coder
- `systematic-debugging` sur les bugs à reproduire
- `verification-before-completion` avant d'affirmer qu'une correction est livrée

### À retenir
- Subagents de research et skills de vérification sont complémentaires, pas substituables — les deux doivent être actifs.
- L'inventaire morphologique précède le code, toujours. Aucune exception, même sur des tâches « évidentes ».
- Les skills du `CLAUDE.md` sont un garde-fou externe : les invoquer évite une auto-évaluation biaisée.
- Découvrir un piège après coup = preuve que la phase d'Explore a manqué. Ne pas laisser passer.
- **La partie manuelle Phase 4 a capturé en 3 minutes ce que le test de parité `toEqual` sur l'EtatJeu ne voit pas** (tests moteur ≠ tests UI).

---

## Session 2026-04-21 (B7 — bugs post test-play)

### L-B7-A — Un poste bloqué silencieusement à 0 en aval masque un bug « le bouton ne fait rien »
**Cas concret** : Pierre clique sur « Investir » pour la relance client → rien ne se passe. Le moteur (`acheterCarteDecision` engine.ts L1224) refuse les doublons non-commerciaux et renvoie `messageErreur`, mais l'UI n'affiche pas l'erreur — résultat : silent fail.
**Règle** :
- Quand une action utilisateur peut échouer silencieusement côté moteur, filtrer EN AMONT dans l'UI pour que l'option ne soit pas cliquable (défense en profondeur).
- Chaque fois qu'un `messageErreur` sort d'un handler moteur, vérifier qu'un canal UI le rend visible (toast, bannière). Sinon, prévenir la condition en aval.

### L-B7-B — Le bouton « Annuler » doit libérer TOUT l'état de l'étape, pas juste la modale locale
**Cas concret** : Annuler une décision fermait la modale de confirmation mais laissait `selectedDecision` + `activeStep` intacts → le joueur retombait sur « Vérifier et confirmer » au prochain clic.
**Règle** : pour toute action `onCancel` d'une étape multi-état, enchaîner systématiquement les resets : `setPendingConfirm(false)` → `setSelectedDecision(null)` → `onCancelStep()` (vide `activeStep`). Tout reset partiel est un bug latent.

### L-B7-C — `appliquerDeltaPoste` plafonne les passifs à 0 (`Math.max(0, old + delta)`) — inadapté aux capitaux propres lors d'une perte massive
**Cas concret** : Pierre observe un bilan déséquilibré après clôture d'exercice avec une grosse perte. Cause : `push("capitaux", deltaCapitaux)` passe par `appliquerDeltaPoste` qui écrase `capitaux` à 0 quand `old + delta < 0`. La partie non imputée crée un écart `|perte| − capitaux_initial` exactement égal à l'écart Actif/Passif observé.
**Règle** :
- Les capitaux propres PEUVENT et DOIVENT pouvoir devenir négatifs (réalité comptable : procédure d'alerte art. L.223-42 Code de commerce).
- Ne jamais router une mutation « affectation du résultat » via `appliquerDeltaPoste` tel quel : il est calibré pour des deltas d'exploitation (jamais négatifs au-delà du solde). Pour les postes structurels (capitaux propres, comptes courants d'associés, subventions d'investissement en consommation), muter directement avec contrepartie explicite en `modifications`.
- Test de reproduction obligatoire pour tout invariant comptable : `Actif = Passif` doit tenir aussi sur le cas limite (|perte| > capitaux_initial). Le test `"Perte 3 000 € / Synergia 19k"` passait par chance parce que 3 < 19.
- **Mantra** : un test qui passe parce qu'on n'a pas testé le cas qui casse = test inutile. Penser « cas limite > cas moyen ».

### L-B7-D — Documenter l'ambivalence des postes (positif/négatif) dans le glossaire
**Règle** : tout poste comptable pouvant prendre les deux signes doit avoir une entrée glossaire qui explicite (a) ce que ça signifie économiquement, (b) le traitement comptable, (c) les conséquences légales/stratégiques. Le joueur apprend en rencontrant le cas limite, pas dans un manuel abstrait.

### Meta — Ne pas se laisser convaincre par un diagnostic erroné d'un subagent
**Cas concret** : un subagent Explore a prétendu que le bug 3 venait du reset de `compteResultat` qui « efface » la perte du passif. Vérification mathématique manuelle : faux. Le résultat net dans `getTotalPassif` est dynamique, le reset compense exactement le push capitaux.
**Règle** : chaque diagnostic de subagent doit être vérifié numériquement avant implémentation d'un fix. Un test de reproduction qui REPRODUIT avant le fix et PASSE après est la seule preuve acceptable.
