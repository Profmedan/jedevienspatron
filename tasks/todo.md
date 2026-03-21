# Tâches JE DEVIENS PATRON — 2026-03-21

## Tâche 1 : GameMap v2 ✅ TERMINÉE
Design narratif du panneau gauche avec agents experts. Déployé sur Vercel.

## Tâche 2 : Build fixes ✅ TERMINÉE
React 18 unique (plus de React 19 fantôme), ESLint ignored, Next.js 15.5.14 (CVE fix).

---

## Tâche 3 : Refonte UI dark mode + Auth + Business model sessions
**Statut** : En cours — Phase agents experts
**3 volets en parallèle** (demande Pierre)

---

### VOLET 1 — Dark mode cohérent sur toutes les pages

**Problème** : Auth (login, register) et dashboard sont en thème clair (bleu/blanc) alors que le jeu est en dark `bg-gray-950`. Texte illisible dans les formulaires.

**Fichiers à modifier** :
- `apps/web/app/auth/login/page.tsx` (155 lignes — bleu/blanc)
- `apps/web/app/auth/register/page.tsx` (292 lignes — bleu/blanc)
- `apps/web/app/dashboard/page.tsx` (239 lignes — blanc)
- `apps/web/app/dashboard/sessions/new/page.tsx` (206 lignes — blanc/indigo)
- `apps/web/app/dashboard/sessions/[id]/page.tsx` (300+ lignes — blanc)
- `apps/web/app/historique/page.tsx`

**Palette cible** (cohérente avec le jeu) :
- Root : `bg-gray-950 text-gray-100`
- Panneaux : `bg-gray-900` ou `bg-gray-800/60`
- Inputs : `bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400`
- Boutons primaires : `bg-indigo-600 hover:bg-indigo-500`
- Liens : `text-indigo-400 hover:text-indigo-300`

**Checklist** :
- [ ] Consulter agents : UI Designer + Brand Guardian
- [ ] Convertir login/page.tsx
- [ ] Convertir register/page.tsx
- [ ] Convertir dashboard/page.tsx
- [ ] Convertir sessions/new/page.tsx
- [ ] Convertir sessions/[id]/page.tsx
- [ ] Convertir historique/page.tsx
- [ ] Vérifier tsc

---

### VOLET 2 — Auth & inscription

**Problèmes** :
1. Google OAuth : bouton existe mais l'inscription échoue
2. Confirmation email → page erreur (callback redirige vers /auth/login?error=auth_callback_error)
3. Individu peut jouer sans s'inscrire → il faut forcer l'inscription

**Fichiers concernés** :
- `apps/web/app/auth/callback/route.ts` (42 lignes)
- `apps/web/app/auth/register/page.tsx`
- `apps/web/app/auth/login/page.tsx`
- `apps/web/app/jeu/page.tsx` (vérification auth avant jeu)
- Middleware auth (à créer)

**Checklist** :
- [ ] Consulter agents : Backend Architect + Security Engineer
- [ ] Diagnostiquer flow Google OAuth côté code
- [ ] Corriger callback confirmation email
- [ ] Ajouter middleware auth pour /jeu
- [ ] Page d'erreur auth en dark mode

---

### VOLET 3 — Business model sessions (Stripe)

**Architecture cible** :
- Individuel : pack 5/10/20 sessions → crédits → décompte par partie
- Organisation : pack 80/150/300/1000 sessions → crédits partagés enseignants
- Codes partagés : décomptés du pack de l'organisation
- Stripe Checkout → webhook → créditer session_credits

**Tables DB existantes** :
- `packs` (7 packs seed : individuel-5/10/20, org-80/150/300/1000)
- `session_credits` (tracking crédits par org)
- `subscriptions` (sync Stripe)
- `bypass_codes` (codes gratuits avec quota)

**Fichiers à créer/modifier** :
- `apps/web/app/api/stripe/checkout/route.ts` (nouveau)
- `apps/web/app/api/stripe/webhook/route.ts` (nouveau)
- `apps/web/app/api/sessions/route.ts` (ajouter vérif crédits)
- `apps/web/app/dashboard/packs/page.tsx` (nouveau — page achat)
- `apps/web/lib/credits.ts` (nouveau — logique décompte)

**Checklist** :
- [ ] Consulter agents : Backend Architect + Finance Tracker + Growth Hacker
- [ ] /api/stripe/checkout
- [ ] /api/stripe/webhook
- [ ] Vérif crédits dans /api/sessions
- [ ] Page /dashboard/packs
- [ ] Décompte automatique par session
- [ ] Tests

---

### Review finale
- [ ] Toutes les pages en dark mode
- [ ] Auth Google fonctionnel (côté code)
- [ ] Email confirmation OK
- [ ] Jeu bloqué sans inscription
- [ ] Crédits décomptés par session
- [ ] Codes partagés vérifiés/décomptés
- [ ] tsc --noEmit OK
- [ ] Build Vercel OK
