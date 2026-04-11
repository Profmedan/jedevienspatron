# Tâches JE DEVIENS PATRON — mis à jour 2026-04-11

---

## Tâche 10 : Déséquilibre bilan + badges avant/après — 2026-04-11

### Contexte
Pierre signale deux bugs UX dans l'affichage progressif des écritures comptables :
1. **Déséquilibre intermédiaire** : entre l'écriture "trésorerie −500" et "emprunts −500" du remboursement, le bilan affiche "⚠️ Déséquilibre : écart −500" car les deux demi-écritures d'une transaction sont appliquées séparément.
2. **Badges avant/après manquants ou erronés** : le badge "7600 → 7100" n'apparaît pas toujours (absent pour achat et décisions, ou montre le premier mouvement au lieu du dernier quand un poste est modifié plusieurs fois).

### Corrections

#### 10.1 — Atomicité comptable (`applyEntry` dans useGameFlow.ts)
- [x] Importer `getTotalActif`, `getTotalPassif` depuis `@jedevienspatron/game-engine`
- [x] Modifier `applyEntry` : après avoir marqué l'écriture cliquée, auto-appliquer les suivantes jusqu'à ce que `getTotalActif === getTotalPassif` (bilan équilibré)
- [x] Le moteur étant correct, le bilan est toujours équilibré en état final → toute transaction multi-ligne converge en ≤ N itérations

#### 10.2 — Badges précis (`effectiveRecentMods` dans useGameFlow.ts)
- [x] Filtrer `recentModifications` par INDEX (pas par poste) : `recentModifications.filter((_, i) => activeStep.entries[i]?.applied === true)`
- [x] Garantit que le badge reflète l'écriture EXACTE la plus récente (ex : "7600→7100" pour le remboursement, pas "8000→7600" pour les intérêts)

#### 10.3 — `findMod` retourne le dernier match (`BilanPanel.tsx`)
- [x] Changer `mods?.find(...)` → `.filter(...).at(-1)` pour retourner le DERNIER mod d'un poste
- [x] Couvre le cas où tresorerie est modifiée 3 fois dans l'étape 0

#### 10.4 — Badges absents pour achat et décisions
- [x] Ajouter `setRecentModifications(modsFiltrees.map(...))` dans `launchAchat`
- [x] Ajouter `setRecentModifications(modsFiltrees.map(...))` dans `launchDecision`
- [x] Ajouter `setRecentModifications(modsFiltrees.map(...))` dans `handleInvestirPersonnel`

#### 10.5 — Badge immobilisations (BilanPanel.tsx)
- [x] Supprimer la division `totalDelta / nItems` (donne -667 sur des items à 0)
- [x] Amortissement (totalDelta < 0) : badge UNIQUEMENT sur items avec `a.valeur > 0`, taux fixe −1 000 €/bien
- [x] Investissement (totalDelta > 0) : badge UNIQUEMENT sur "Autres Immobilisations"

#### 10.6 — Validation
- [x] `npx tsc --noEmit` dans `apps/web` → 0 erreur (vérifié après chaque groupe de corrections)

---

## Tâche 9 : Achat stock en milliers + baisse remboursement emprunt — 2026-04-10

### Contexte
Pierre signale deux soucis dans le moteur de jeu :
1. **Achat stock** : ligne 470 `push("stocks", quantite)` + `push("tresorerie", -quantite)` → 1 unité coûte 1€ au lieu de 1000€. Bug silencieux préexistant car les cartes (+5000, +2000) et le bilan initial (stocks 4000€) travaillaient déjà en euros → incohérence vente/cartes.
2. **Remboursement emprunt** : 1000€/trim trop lourd en charges fixes → baisser à 500€/trim.

### Décisions validées par Pierre
- Prix unitaire marchandise = **1 000 €** (constante `PRIX_UNITAIRE_MARCHANDISE`)
- Remboursement emprunt = **500 €/trimestre**
- UI achat = stepper +/− avec affichage total en direct

### Implémentation
#### 9.1 — Constantes (types.ts x2)
- [x] `packages/game-engine/src/types.ts` : `export const PRIX_UNITAIRE_MARCHANDISE = 1000`
- [x] `packages/game-engine/src/types.ts` : `REMBOURSEMENT_EMPRUNT_PAR_TOUR = 500` (au lieu de 1000)
- [x] `apps/web/lib/game-engine/types.ts` : mêmes changements (duplicat)

#### 9.2 — Engine : achat (engine.ts x2)
- [x] `appliquerAchatMarchandises` : `push("stocks", quantite * PRIX_UNITAIRE_MARCHANDISE)` + `push("tresorerie", -quantite * PRIX_UNITAIRE_MARCHANDISE)` (ou `dettes` +même montant)
- [x] Libellé : "Achat de N unité(s) de marchandises (N × 1000 €)"
- [x] Idem dans `apps/web/lib/game-engine/engine.ts`

#### 9.3 — Engine : vente (cohérence comptable)
- [x] `appliquerCarteClient` : `push("stocks", -PRIX_UNITAIRE_MARCHANDISE)` au lieu de `-1`
- [x] `appliquerCarteClient` : `push("achats", PRIX_UNITAIRE_MARCHANDISE)` au lieu de `+1`
- [x] Vérification stock : `if (stocks < PRIX_UNITAIRE_MARCHANDISE)` au lieu de `< 1`
- [x] Idem dans `apps/web/lib/game-engine/engine.ts`

#### 9.4 — Tests unitaires à mettre à jour
- [x] Test "charges fixes" ligne 83 : `- 1000` → `- 500` (remboursement)
- [x] Test "remboursement d'emprunt" ligne 107 : `- 1000` → `- 500`
- [x] Test "Vente Particulier" ligne 126 : `stocksBefore - 1` → `stocksBefore - 1000`
- [x] Test "Vente Particulier" ligne 127 : `charges.achats === 1` → `=== 1000`
- [x] Test "Vente TPE" ligne 144 : `charges.achats === 1` → `=== 1000`
- [x] Test "Vente Grand Compte" ligne 161 : `charges.achats === 1` → `=== 1000`
- [x] Libellés des describe() mis à jour (cosmétique)

#### 9.5 — UI : stepper d'achat (LeftPanel.tsx)
- [x] Remplacer `<input type="number">` par un stepper `− [qte] +` dans `apps/web/components/jeu/LeftPanel.tsx`
- [x] Afficher sous le stepper : "Coût : {qte × 1000} €"
- [x] Clamper qte à [0, 10]
- [x] Conserver l'accessibilité (aria-label, keyboard)

#### 9.6 — Validation
- [x] `npm test` dans packages/game-engine → 32/32 verts
- [x] `npx tsc --noEmit` dans apps/web → 0 erreur
- [x] Mise à jour `tasks/lessons.md` avec leçon L26 (incohérence unités/euros silencieuse)

### Risques identifiés
- Les cartes décision existantes utilisent déjà des deltas 1000/2000/5000 sur `stocks` → OK, cohérent avec la nouvelle unité
- `entreprises.ts:58` : +1000 stocks à l'init d'une entreprise → OK, c'est 1 unité dans la nouvelle échelle
- Éventuels tests de simulation (`simulate.js`, `scripts/simulate-codex.ts`) à vérifier si utilisés

---

# Tâches historiques — mis à jour 2026-03-22

## Tâches précédentes ✅ TERMINÉES
- Tâche 1 : GameMap v2 — déployé
- Tâche 2 : Build fixes (React 18, ESLint, CVE Next.js)
- Tâche 3 : Dark mode + Auth + Business model Stripe (volets 1/2/3)

---

## Tâche 4 : Stripe + Domaine + Corrections UX — 2026-03-22

### 4.1 — Stripe ✅
- [x] 7 produits Stripe créés (individuel-5/10/20, org-80/150/300/1000)
- [x] Migration 005 : stripe_price_id pour les 7 packs en base Supabase
- [x] Route /api/stripe/checkout (lazy Stripe client)
- [x] Route /api/stripe/webhook (checkout.session.completed → crédits)
- [x] Page /dashboard/packs avec boutons Acheter + messages succès/erreur
- [x] STRIPE_WEBHOOK_SECRET configuré sur Vercel
- [x] NEXT_PUBLIC_APP_URL = https://jedevienspatron.fr sur Vercel

### 4.2 — Domaine jedevienspatron.fr ✅
- [x] Domaine ajouté sur Vercel (projet jedevienspatron-web)
- [x] DNS OVH configurés : A @ → 76.76.21.21, www CNAME → cname.vercel-dns.com.
- [x] Supabase Site URL + Redirect URLs mis à jour
- [ ] Vérifier propagation DNS (attendre ✅ verts sur Vercel)

### 4.3 — Corrections bugs ✅
- [x] Fix email redirect : window.location.origin → NEXT_PUBLIC_APP_URL
- [x] Fix trimestres : 4/6/8 → 6/8/10/12 (+15 min par tranche de 2)
- [x] Fix navigation : bouton "Acheter des sessions" dans dashboard
- [x] Fix lien "Acheter des sessions" quand crédits insuffisants

### 4.4 — Bypass codes ✅
- [x] Codes TEST0001–TEST0010 créés (1 utilisation chacun)
- [x] Code AIRWEEK1 illimité (usage interne Pierre)
- [x] Code CLASSE01 (5 utilisations) + DEMO2026 (1 utilisation)

---

## Tâche 5 : À faire — priorités restantes

### 5.1 — Test Stripe end-to-end
- [ ] Tester achat avec carte 4242 4242 4242 4242
- [ ] Vérifier crédits incrémentés après paiement
- [ ] Mettre à jour URL webhook Stripe → https://jedevienspatron.fr/api/stripe/webhook

### 5.2 — Dashboard formateur ✅
- [x] Page suivi apprenants : player_name + room_code + score par session (déjà existante : /dashboard/sessions/[id]/page.tsx)

### 5.3 — Bloquer jeu individuel sans inscription ✅
- [x] Middleware : si accès /jeu sans session ET sans bypass code → redirect login
- [x] Homepage "Je joue seul" → lien vers login + texte "Compte requis"
- [x] Vérif crédits AVANT de lancer la partie (appel /api/sessions au démarrage solo)

---

## Tâche 6 : Corrections Citadel engine.ts — 2026-03-26

### 6.1 — CRITICAL ✅
- [x] `verifierFinTour` : supprimé `appliquerDeltaPoste(joueur, "decouvert", pénalité)` (spirale exponentielle découvert)
- [x] Appliqué dans `packages/game-engine/src/engine.ts` ET `apps/web/lib/game-engine/engine.ts`

### 6.2 — WARNING ✅
- [x] `tirerCartesDecision` : recharge pioche AVANT splice (évite retour incomplet)
- [x] `appliquerDeltaPoste` : throw Error au lieu de console.warn silencieux pour poste inconnu
- [x] `makePush()` helper : extraction de la closure dupliquée dans 6 fonctions
- [x] `CARTE_IDS` : constantes centralisées, 6 IDs remplacés (commercial-junior, affacturage, formation, remboursement-anticipe, levee-de-fonds, assurance-prevoyance)
- [x] Appliqué dans les 2 fichiers engine.ts

### 6.3 — INFO ✅
- [x] Suppression boucle `for (let i = 0; i < 1; i++)` dans `genererClientsParCommerciaux`

### 6.4 — SKIPPED (trop risqué)
- [ ] Renommage propriétés accentuées (`effetsImmédiats`, `publicitéCeTour`) — 50+ occurrences, impact cross-file

### 6.5 — Vérification ✅
- [x] `npx tsc --noEmit` game-engine : 0 erreur
- [x] `npx tsc --noEmit` apps/web : erreurs pré-existantes uniquement (stripe.ts, utils.ts, supabase)

---

## Review finale
- [ ] Test complet flux achat Stripe (carte test)
- [ ] Test flux formateur (créer session → distribuer code → apprenants jouent)
- [ ] Test flux bypass code (TEST0001 → jouer → code épuisé)
- [ ] DNS jedevienspatron.fr propagé et ✅ sur Vercel
- [ ] Stripe webhook URL → jedevienspatron.fr
