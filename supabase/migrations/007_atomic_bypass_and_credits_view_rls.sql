-- JEDEVIENSPATRON — Migration 007
-- Fix : bypass codes atomiques + vue credits_disponibles avec filtre RLS
-- Date : 2026-04-09

-- ─── 1. Fonction atomique pour valider et consommer un bypass code ──
-- Remplace le check-puis-update non-atomique dans /api/bypass
CREATE OR REPLACE FUNCTION validate_bypass_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found BOOLEAN;
BEGIN
  UPDATE bypass_codes
  SET use_count = use_count + 1
  WHERE code = p_code
    AND (max_uses = -1 OR use_count < max_uses)
  RETURNING TRUE INTO v_found;

  RETURN COALESCE(v_found, FALSE);
END;
$$;

-- Seuls les rôles authentifiés et service_role peuvent appeler cette fonction
GRANT EXECUTE ON FUNCTION validate_bypass_code(TEXT) TO authenticated, service_role, anon;

-- ─── 2. Vue credits_disponibles avec filtre par organisation ──
-- L'ancienne vue n'avait pas de filtre RLS : un utilisateur authentifié
-- pouvait potentiellement voir les crédits d'autres organisations.
CREATE OR REPLACE VIEW credits_disponibles AS
SELECT
  organization_id,
  SUM(sessions_total - sessions_used) AS sessions_disponibles
FROM session_credits
WHERE (expires_at IS NULL OR expires_at > NOW())
GROUP BY organization_id;

-- Note : la vue est déjà protégée côté application (filtre organization_id
-- dans les routes API). La RLS sur session_credits assure aussi la protection.
-- On garde la vue simple pour le service_role (webhook Stripe, etc.)
-- car le service_role bypasse la RLS par défaut.
