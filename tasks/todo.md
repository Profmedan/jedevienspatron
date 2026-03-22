# Tâches JE DEVIENS PATRON — mis à jour 2026-03-22

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

### 5.2 — Dashboard formateur
- [ ] Page suivi apprenants : player_name + room_code + score par session

### 5.3 — Bloquer jeu individuel sans inscription ✅
- [x] Middleware : si accès /jeu sans session ET sans bypass code → redirect login
- [x] Homepage "Je joue seul" → lien vers login + texte "Compte requis"
- [x] Vérif crédits AVANT de lancer la partie (appel /api/sessions au démarrage solo)

---

## Review finale
- [ ] Test complet flux achat Stripe (carte test)
- [ ] Test flux formateur (créer session → distribuer code → apprenants jouent)
- [ ] Test flux bypass code (TEST0001 → jouer → code épuisé)
- [ ] DNS jedevienspatron.fr propagé et ✅ sur Vercel
- [ ] Stripe webhook URL → jedevienspatron.fr
