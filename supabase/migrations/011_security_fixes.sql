-- JEDEVIENSPATRON — Migration 011
-- Fixes du linter de sécurité Supabase (errors externes, niveau ERROR)
-- Date : 2026-04-24
--
-- Détails des erreurs corrigées :
--   1. security_definer_view sur public.credits_disponibles
--      → la vue tournait avec les permissions de son créateur (effectivement
--        SECURITY DEFINER par défaut sans option explicite), contournant
--        ainsi les RLS de session_credits sous-jacente.
--   2. rls_disabled_in_public sur public.rate_limits
--      → table publique sans RLS activé, exposée à PostgREST.
--
-- Aucune régression fonctionnelle attendue :
--   - credits_disponibles est lu uniquement par service_role (cf. lib/credits.ts
--     → createServiceClient), qui bypass RLS de toute façon.
--   - rate_limits est lu/écrit uniquement via la RPC check_rate_limit
--     (SECURITY DEFINER), qui bypass RLS automatiquement.
--   - Les utilisateurs anon/authenticated n'avaient PAS besoin d'accès direct
--     à ces 2 objets, donc leur restreindre l'accès ne casse rien.

-- ─── 1. Vue credits_disponibles : passer en security_invoker ────
-- PostgreSQL 15+ supporte cette option qui inverse la sémantique : la vue
-- applique les RLS du joueur appelant au lieu de celles du créateur.
-- Cohérent avec la RLS déjà en place sur session_credits (filtre par
-- organization_id du profil utilisateur, cf. migration 003).
ALTER VIEW credits_disponibles SET (security_invoker = true);

-- ─── 2. Activer RLS sur rate_limits sans policy ────────────────
-- Sans policy, RLS bloque par défaut tout accès anon/authenticated.
-- Les RPC SECURITY DEFINER (check_rate_limit) et le service_role
-- bypassent cette restriction → fonctionnement de l'API préservé.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Note : on n'ajoute PAS de policy explicite car aucun acteur
-- non-privilégié ne doit lire/écrire directement cette table.
-- Si on voulait permettre à un compte authentifié de voir SES PROPRES
-- limites (par ex. pour un dashboard utilisateur), on ajouterait :
--   CREATE POLICY "rate_limits_read_own_ip" ON rate_limits
--     FOR SELECT USING (key LIKE 'bypass:' || inet_client_addr());
-- Pas le cas aujourd'hui, donc table effectivement privée du serveur.
