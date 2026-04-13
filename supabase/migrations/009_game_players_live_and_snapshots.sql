-- ============================================================
-- 009 — Ajout live_state, last_heartbeat, snapshots
--       sur game_players pour :
--   A) Dashboard formateur temps réel (live_state + heartbeat)
--   B) Rapport pédagogique post-session (snapshots trimestriels)
-- ============================================================

-- Snapshot léger envoyé en temps réel pendant la partie
-- ~200 octets, mis à jour 1× par trimestre par joueur
ALTER TABLE game_players
  ADD COLUMN IF NOT EXISTS live_state jsonb DEFAULT NULL;

-- Dernier signe de vie du joueur (détection inactivité)
ALTER TABLE game_players
  ADD COLUMN IF NOT EXISTS last_heartbeat timestamptz DEFAULT NULL;

-- Historique trimestriel pour le rapport pédagogique
-- Array de TrimSnapshot (~100 octets × 12 trimestres = ~1.2 KB)
ALTER TABLE game_players
  ADD COLUMN IF NOT EXISTS snapshots jsonb DEFAULT '[]'::jsonb;

-- Index pour le dashboard formateur : filtrer les joueurs actifs d'une session
CREATE INDEX IF NOT EXISTS idx_game_players_session_heartbeat
  ON game_players (session_id, last_heartbeat)
  WHERE last_heartbeat IS NOT NULL;
