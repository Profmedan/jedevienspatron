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

## L38 — 2026-04-14 : Panneau central UN SEUL document — auto-switch obligatoire en modeDouble
**Contexte** : quand une écriture comptable touche à la fois le Bilan ET le Compte de Résultat (ex. achat immobilisation avec TVA), la tentation est d'afficher les deux documents en grille (2/3 + 1/3). C'est illisible sur fenêtre non-maximisée : les deux panneaux se chevauchent, le joueur ne comprend pas ce qu'il voit.
**Règle** : le panneau central n'affiche JAMAIS deux documents simultanément. Il affiche toujours UN SEUL document (Bilan OU CR). Quand une opération touche les deux :
1. L'auto-switch `useEffect` bascule automatiquement vers le document de l'écriture courante (dernier poste appliqué, sinon premier poste en attente).
2. Les mini-cartes sous la barre d'onglets montrent les impacts sur CHAQUE document (résumé condensé des 3 premières entrées + delta €) et servent d'override manuel pour basculer d'onglet.
3. Le badge visuel "● affiché" (vert) marque la mini-carte correspondant au document visible ; un pastille colorée sur l'autre onglet signale l'impact non-affiché.
**Anti-règle** : ne JAMAIS réintroduire un layout `grid md:grid-cols-3` avec `BilanPanel` + `CompteResultatPanel` côte à côte dans `MainContent.tsx`. Le cas ayant été tranché par l'utilisateur, c'est une décision UX définitive.
**Fichier concerné** : `apps/web/components/jeu/MainContent.tsx` — useEffect lignes ~90-110 (sans guard `modeDouble`), AnimatePresence `mode="wait"` unique, mini-cartes avec `isCurrentTab` + `handleTabChange`.
