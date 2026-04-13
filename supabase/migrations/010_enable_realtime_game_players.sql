-- ============================================================
-- 010 — Activer Supabase Realtime sur game_players
--       Permet au dashboard formateur de recevoir les mises à jour
--       live_state en temps réel via postgres_changes.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
