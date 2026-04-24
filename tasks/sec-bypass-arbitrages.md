# SEC-bypass — Arbitrage sécurité `/jeu?access=bypass` — 2026-04-24

**Problème signalé par Pierre** : l'URL `https://jedevienspatron.fr/jeu?access=bypass` donne directement accès au jeu sans payer ni valider de code bypass. Quiconque connaît l'URL peut jouer infiniment et ne consomme aucun `use_count` en base.

## Diagnostic

**Flux actuel** :
1. Client tape un code 8 caractères → `POST /api/bypass`
2. L'API valide le code, incrémente `use_count` atomiquement, renvoie `{valid: true}`
3. Client `router.push("/jeu?access=bypass")`
4. `middleware.ts:35` : `const isBypassOrRoomCode = (code !== null) || (access === "bypass")` → autorise `/jeu`

**Faille** : l'autorisation à l'étape 4 repose UNIQUEMENT sur la présence du query param. Aucune vérification serveur que l'utilisateur vient réellement de valider un code. Donc :
- URL partageable à l'infini (Twitter, forums, etc.)
- Pas de consommation de `use_count` pour les accès directs
- Potentiellement indexable par Googlebot

## Fix proposé

**Remplacer le query param par un cookie HttpOnly signé** posé par `/api/bypass` lors d'une validation réussie. Le middleware vérifie le cookie au lieu du query param.

### Architecture cible

```
1. POST /api/bypass { code: "TEST0001" }
   ↓ validation + incrément use_count
   ↓ pose cookie jdp_bypass_session = sign(code, exp)
                 HttpOnly, Secure, SameSite=Lax, maxAge=4h
   → { valid: true }

2. Client → router.push("/jeu")   (plus besoin de ?access=bypass)

3. Middleware lit cookie jdp_bypass_session
   ↓ vérifie HMAC + exp non dépassée
   → autorise /jeu OU redirect / si invalide
```

### Secret de signature

HMAC-SHA256 avec `BYPASS_SIGNING_SECRET` (nouvelle env var à ajouter sur Vercel). 32 octets random hex, généré une fois.

Format du cookie : `base64(payload).base64(sig)` où `payload = {code, exp}` et `sig = HMAC-SHA256(payload, secret)`. Plus simple qu'un JWT complet, pas de lib externe nécessaire (`crypto` natif Node).

## 5 questions à trancher

### Q1 — Durée de validité du cookie
- **Option A** : 4 heures (une session de cours maximum)
- **Option B** : 24 heures
- **Option C** : 7 jours

**Ma recommandation : A (4h)**. Un cours dure ~1-2 h. 4h couvre largement (pause, reprise). Au-delà, l'utilisateur re-saisit son code, ce qui re-incrémente le compteur (cohérence business).

### Q2 — Secret de signature
- **Option A** : réutiliser `STRIPE_WEBHOOK_SECRET` (déjà en place)
- **Option B** : nouvelle env var `BYPASS_SIGNING_SECRET` (32 octets random)

**Ma recommandation : B**. Principe de moindre couplage : la compromission d'un secret ne doit pas en affecter d'autres. Ajout simple sur Vercel.

### Q3 — UX quand le cookie expire
- **Option A** : redirect silencieux vers `/` (retour à la saisie du code, sans message)
- **Option B** : redirect vers `/` avec paramètre `?expired=bypass`, affichage d'un message "Votre session a expiré, ressaisissez votre code"

**Ma recommandation : B**. Le message explicite évite la frustration d'un utilisateur qui reviendrait sur un bookmark et se demanderait pourquoi le jeu ne charge plus.

### Q4 — Compat arrière bookmarks `/jeu?access=bypass`
- **Option A** : redirect vers `/` (casse les bookmarks existants)
- **Option B** : garder le query param accepté pendant 1 mois, puis déprécier

**Ma recommandation : A**. La faille est de sécurité business active, il faut la fermer immédiatement. Les utilisateurs légitimes ressaisiront leur code (1 clic).

### Q5 — Indexation Google
- **Option A** : ajouter `<meta name="robots" content="noindex, nofollow">` sur `/jeu`
- **Option B** : ajouter `Disallow: /jeu` dans `robots.txt`
- **Option C** : les deux

**Ma recommandation : C**. Ceinture + bretelles. Peu de coût, empêche toute indexation future.

### Q6 (bonus, pour plus tard) — Room code
Le paramètre `?code=KIC-XXXX` souffre d'une faille moins grave (codes aléatoires 8 caractères, session vérifiée côté client via `/api/sessions/:code/start`). Mais un code connu reste exploitable à l'infini.

**Ma recommandation** : laisser pour plus tard. Le risque est moindre (codes non devinables, partagés en classe fermée). À traiter quand on ajoutera l'expiration automatique des sessions.

## Plan d'implémentation (si validation)

### Commit 1 — Ajout env var + util de signature
- `lib/bypass-cookie.ts` : `signBypassCookie(code)` / `verifyBypassCookie(value)` avec HMAC-SHA256.
- Nouvelle env var `BYPASS_SIGNING_SECRET` documentée dans `CLAUDE.md`.

### Commit 2 — Route API `/api/bypass` pose le cookie
- Après `validate_bypass_code` réussi, pose `jdp_bypass_session` HttpOnly/Secure/SameSite=Lax/maxAge=4h.

### Commit 3 — Middleware vérifie le cookie
- Retirer `access === "bypass"` de la logique d'autorisation.
- Vérifier présence + signature + exp du cookie `jdp_bypass_session`.
- Si invalide et pathname = `/jeu` sans `?code` → redirect vers `/?expired=bypass`.

### Commit 4 — Client cleanup + robots noindex
- `app/page.tsx` : `router.push("/jeu")` (sans query param).
- `app/jeu/page.tsx` : ajouter `metadata.robots = { index: false }` (Next.js App Router).
- `public/robots.txt` : ajouter `Disallow: /jeu`.
- `app/jeu/hooks/useGamePersistence.ts` : adapter la détection mode bypass (via cookie côté serveur via endpoint dédié OU via une variable exposée dans le HTML initial — à trancher).

### Commit 5 — Message "session expirée" sur `/`
- `app/page.tsx` : lire `searchParams.expired`, afficher toast/banner "Votre session bypass a expiré, ressaisissez votre code."

### Garde-fous
- `tsc apps/web` EXIT=0.
- Test manuel end-to-end : saisie code → cookie posé → accès `/jeu` → refresh → encore accès. Attendre 4h ou forger un cookie expiré → redirect `/?expired=bypass`.
- Test accès direct `/jeu?access=bypass` sans avoir validé de code → redirect login (ou `/`).
- Test accès direct `/jeu` sans rien → redirect login (comportement actuel maintenu).

## Estimation

3-4 heures de dev + test manuel. 4-5 commits. Plus léger que B9-D/E mais plus sensible (on touche à de la sécurité business).

## À côté

Côté Vercel, Pierre doit ajouter la variable `BYPASS_SIGNING_SECRET` avant que le fix soit fonctionnel en prod. Commande pour générer le secret :
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

**Si tu valides les 5 recommandations (A, B, B, A, C)**, j'attaque directement les 5 commits. Sinon, dis-moi ce que tu modifies.
