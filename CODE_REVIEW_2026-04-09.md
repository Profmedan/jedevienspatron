# Code Review — Je Deviens Patron
**Date** : 9 avril 2026  
**Périmètre** : Ensemble du codebase (API, moteur de jeu, frontend React, config, Supabase)  
**Verdict** : 🟡 **Request Changes** — 5 issues critiques/élevées à corriger avant mise en production complète

---

## Résumé

Le projet est globalement bien structuré : TypeScript strict, RLS Supabase complètes, idempotence Stripe via UNIQUE constraints, consommation de crédits atomique (FIFO avec `FOR UPDATE SKIP LOCKED`). La qualité est estimée à ~85% production-ready.

Les problèmes identifiés se concentrent sur 3 axes : race conditions sur les bypass codes, absence de validation/authentification sur `/api/sessions/results`, et une vue Supabase sans filtre RLS.

---

## Issues Critiques

### #  | Fichier | Ligne | Issue | Sévérité
| --- | --- | --- | --- | --- |
| 1 | `app/api/sessions/results/route.ts` | 10-23 | **Aucune authentification ni validation des entrées.** N'importe qui peut terminer une session et injecter des scores falsifiés. Pas de limite de taille sur `etatFinal` (DoS possible). | 🔴 Critical |
| 2 | `app/api/bypass/route.ts` | 28-58 | **Race condition : double-dépense bypass codes.** Le check-puis-update n'est pas atomique. Deux requêtes simultanées sur un code à 1 usage restant peuvent toutes les deux réussir. | 🟠 High |
| 3 | `supabase/migrations/003_session_credits.sql` | Vue `credits_disponibles` | **Vue SQL sans filtre RLS.** Un utilisateur authentifié pourrait potentiellement voir les crédits d'autres organisations via cette vue. | 🟠 High |
| 4 | Toutes les routes publiques | — | **Aucun rate limiting.** `/api/bypass` est vulnérable au brute-force (format 8 chars A-Z0-9 = espace fini). `/api/sessions/results` vulnérable au spam. | 🟠 High |
| 5 | `packages/game-engine/src/calculators.ts` | ~191 | **Division par 400 au lieu de 100** dans `calculerInterets()`. Donne un taux effectif de 1.25% au lieu de 5%. Fonction exportée mais actuellement non appelée (dead code ou futur bug). | 🟠 High |

---

## Issues Modérées

| # | Fichier | Issue | Sévérité |
| --- | --- | --- | --- |
| 6 | `app/api/stripe/checkout/route.ts` | Pas de vérification `actif = true` sur le pack avant checkout. Un pack désactivé peut être acheté. | 🟡 Medium |
| 7 | Toutes routes POST | **Pas de protection CSRF.** Les routes acceptent les requêtes de n'importe quel origin. | 🟡 Medium |
| 8 | Plusieurs routes API | **Error disclosure** : `creditsError.message` exposé directement au client (détails Supabase internes). | 🟡 Medium |
| 9 | `apps/web/package.json` | **Types React désalignés** : `@types/react@^19` installé mais runtime React 18.3.1. Risque d'incohérence des types. | 🟡 Medium |
| 10 | `apps/web/next.config.ts` | `ignoreBuildErrors: true` masque une erreur TS sur `jeu-v2/page.js` manquant. Erreur silencieuse en production Vercel. | 🟡 Medium |
| 11 | `packages/game-engine/src/calculators.ts` | ~140 | `dettes + joueur.bilan.decouvert || 1` — le `||` opère sur le résultat de l'addition, pas sur `decouvert` seul. Si la somme vaut 0, elle est remplacée par 1 (correct par accident), mais si elle vaut NaN, le fallback masque le bug. Utiliser `Math.max(1, ...)`. | 🟡 Medium |
| 12 | `lib/auth/redirect.ts` | Validation open redirect basique : ne filtre pas les query strings ou fragments. `?redirectTo=/dashboard?next=https://attacker.com` passe la validation. | 🟡 Medium |

---

## Issues Basses

| # | Fichier | Issue | Sévérité |
| --- | --- | --- | --- |
| 13 | `app/api/stripe/webhook/route.ts` | `process.env.STRIPE_WEBHOOK_SECRET!` sans vérification d'existence. Crash cryptique si la var manque. | 🔵 Low |
| 14 | `supabase/migrations/002_bypass_codes.sql` | Pas de colonne `expires_at`. Les codes n'expirent jamais. | 🔵 Low |
| 15 | `packages/game-engine/src/engine.ts` | `_nextCommercialId` (compteur global) non réinitialisé entre appels à `initialiserJeu()`. | 🔵 Low |
| 16 | `app/jeu/hooks/useGamePersistence.ts` | Erreur de sauvegarde Supabase uniquement loggée en console — pas de feedback utilisateur. | 🔵 Low |
| 17 | `app/auth/login/page.tsx` | Cookie OAuth `post_auth_redirect` avec `Max-Age=600` peut expirer si le flow Google est lent. Préférer un URL param. | 🔵 Low |
| 18 | `components/jeu/ImpactFlash.tsx` | `eslint-disable-next-line` sur les dépendances du useEffect — `onDone` exclu sans commentaire justificatif. | 🔵 Low |
| 19 | Plusieurs fichiers | 4 `console.log`/`console.error` en production (useGamePersistence). | 🔵 Low |

---

## Ce qui est bien fait ✅

- **RLS Supabase complètes** : toutes les tables protégées, policies cohérentes avec helpers `auth_user_org_id()` et `auth_is_super_admin()`
- **Consommation de crédits atomique** : `consume_session_credit` utilise `FOR UPDATE SKIP LOCKED` — aucune race condition possible
- **Idempotence Stripe** : UNIQUE constraint sur `stripe_checkout_session_id` + gestion du code erreur 23505
- **Rollback de crédit** : si l'insertion de session échoue, le crédit est relibéré (`releaseCredit`)
- **TypeScript strict** : activé, quasi aucun `any`, types bien définis
- **Moteur de jeu synchronisé** : les deux copies (packages/ et apps/web/) sont identiques en logique (seuls les imports diffèrent)
- **Hooks React corrects** : aucun hook après early return (leçon L24 bien appliquée)
- **Pas de XSS** : zéro `dangerouslySetInnerHTML` dans le projet
- **Lazy init Stripe** : évite les crashes au build Vercel
- **Logique comptable** : équilibre actif/passif vérifié, amortissements et agios correctement calculés

---

## Recommandations prioritaires (par ordre d'impact)

### 1. Sécuriser `/api/sessions/results` (Issues #1)
Ajouter validation zod + vérification que la session n'est pas déjà terminée :
```typescript
const schema = z.object({
  room_code: z.string().length(8),
  joueurs: z.array(z.object({
    pseudo: z.string().max(50),
    scoreTotal: z.number().int().min(0),
    etatFinal: z.unknown().refine(v => JSON.stringify(v).length < 100_000),
  })),
});
```

### 2. Atomiser les bypass codes (Issue #2)
Créer une function Supabase :
```sql
CREATE FUNCTION validate_bypass_code(p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE bypass_codes
  SET use_count = use_count + 1
  WHERE code = p_code AND (max_uses = -1 OR use_count < max_uses);
  RETURN FOUND;
END; $$;
```

### 3. Protéger la vue `credits_disponibles` (Issue #3)
```sql
CREATE OR REPLACE VIEW credits_disponibles AS
SELECT organization_id, SUM(sessions_total - sessions_used) AS sessions_disponibles
FROM session_credits
WHERE (expires_at IS NULL OR expires_at > NOW())
  AND organization_id = auth_user_org_id()
GROUP BY organization_id;
```

### 4. Ajouter rate limiting (Issue #4)
Utiliser Upstash Ratelimit ou Vercel Edge Middleware sur les routes publiques.

### 5. Corriger `calculerInterets` (Issue #5)
```typescript
// Avant : return Math.round(empruntsTotal * taux / 400);
return Math.round((empruntsTotal * taux) / 100);
```

### 6. Aligner les types React (Issue #9)
```bash
npm install --save-dev @types/react@^18 @types/react-dom@^18
```

---

## Verdict

🟡 **Request Changes** — Le code est de bonne qualité globale (8/10), mais les 5 issues critiques/élevées doivent être adressées avant toute mise en production avec des vrais utilisateurs payants. Les fixes #1 à #3 sont les plus urgents (sécurité des données et intégrité financière).
