-- JEDEVIENSPATRON — Migration 008
-- Rate limiting via Supabase (backing store)
-- Fenêtre glissante par IP : max N requêtes sur T secondes
-- Date : 2026-04-09

-- ─── Table des compteurs de rate limiting ──────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id          BIGSERIAL PRIMARY KEY,
  key         TEXT        NOT NULL,  -- ex: "bypass:<ip>"
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count   INT         NOT NULL DEFAULT 1,
  UNIQUE (key, window_start)
);

-- Index pour les lookups par clé + purge des entrées expirées
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits (key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);

-- Pas de RLS sur cette table : accès uniquement via service_role (routes API)
-- (ne pas activer RLS ici — les apprenants sans compte doivent aussi être ratés)

-- ─── Fonction atomique de rate limiting ────────────────────────
-- Retourne TRUE si la requête est autorisée (sous la limite)
-- Retourne FALSE si la limite est dépassée
-- Paramètres :
--   p_key         : clé unique (ex: "bypass:1.2.3.4")
--   p_window_secs : durée de la fenêtre en secondes (ex: 60)
--   p_max_hits    : nombre max de requêtes dans la fenêtre (ex: 10)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key         TEXT,
  p_window_secs INT,
  p_max_hits    INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count        INT;
BEGIN
  -- Calculer le début de la fenêtre courante (arrondie au window_secs)
  v_window_start := date_trunc('second', NOW())
    - (EXTRACT(EPOCH FROM NOW())::INT % p_window_secs) * INTERVAL '1 second';

  -- Purger les entrées trop vieilles (> 2 fenêtres) pour éviter la croissance infinie
  DELETE FROM rate_limits
  WHERE key = p_key
    AND window_start < NOW() - (p_window_secs * 2 * INTERVAL '1 second');

  -- Compter les hits dans la fenêtre courante (INSERT ou UPDATE atomique)
  INSERT INTO rate_limits (key, window_start, hit_count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET hit_count = rate_limits.hit_count + 1
  RETURNING hit_count INTO v_count;

  -- Autoriser si sous la limite
  RETURN v_count <= p_max_hits;
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) TO service_role, anon, authenticated;
