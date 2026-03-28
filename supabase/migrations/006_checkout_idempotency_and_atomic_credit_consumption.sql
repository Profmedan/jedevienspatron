-- JEDEVIENSPATRON — Migration 006 : fiabilisation des crédits Stripe
-- Objectifs :
-- 1. empêcher le double-crédit si Stripe rejoue checkout.session.completed
-- 2. consommer/restaurer un crédit de façon atomique côté base

ALTER TABLE session_credits
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'session_credits_stripe_checkout_session_id_key'
  ) THEN
    ALTER TABLE session_credits
      ADD CONSTRAINT session_credits_stripe_checkout_session_id_key
      UNIQUE (stripe_checkout_session_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION consume_session_credit(p_org_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credit_id uuid;
BEGIN
  WITH candidate AS (
    SELECT id
    FROM session_credits
    WHERE organization_id = p_org_id
      AND sessions_used < sessions_total
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  ),
  updated AS (
    UPDATE session_credits sc
    SET sessions_used = sc.sessions_used + 1
    FROM candidate
    WHERE sc.id = candidate.id
      AND sc.sessions_used < sc.sessions_total
    RETURNING sc.id
  )
  SELECT id INTO v_credit_id FROM updated;

  RETURN v_credit_id;
END;
$$;

CREATE OR REPLACE FUNCTION release_session_credit(p_credit_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restored_id uuid;
BEGIN
  UPDATE session_credits
  SET sessions_used = sessions_used - 1
  WHERE id = p_credit_id
    AND sessions_used > 0
  RETURNING id INTO v_restored_id;

  RETURN v_restored_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION consume_session_credit(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION release_session_credit(uuid) TO authenticated, service_role;
