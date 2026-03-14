-- JEDEVIENSPATRON — Codes d'accès bypass
-- Migration 002 : table bypass_codes avec compteur d'utilisations

CREATE TABLE IF NOT EXISTS bypass_codes (
  code       TEXT PRIMARY KEY,          -- code 8 caractères
  max_uses   INT  NOT NULL DEFAULT -1,  -- -1 = illimité
  use_count  INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed des 6 codes
-- Ordre : 50 / 100 / 150 / 200 / 250 / illimité
INSERT INTO bypass_codes (code, max_uses) VALUES
  ('56B8F74X',  50),
  ('8UQCXNEC', 100),
  ('MXFKCNUW', 150),
  ('RZYJ4SY2', 200),
  ('TX9UAT5F', 250),
  ('UF8R929T',  -1)   -- illimité
ON CONFLICT (code) DO NOTHING;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_bypass_codes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bypass_codes_updated_at
  BEFORE UPDATE ON bypass_codes
  FOR EACH ROW EXECUTE FUNCTION update_bypass_codes_updated_at();

-- RLS : table accessible uniquement via service_role (jamais en client-side)
ALTER TABLE bypass_codes ENABLE ROW LEVEL SECURITY;
-- Aucune policy publique → seul le service_role (backend) peut lire/modifier
