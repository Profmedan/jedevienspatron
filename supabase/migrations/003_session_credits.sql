-- JEDEVIENSPATRON — Crédits de sessions
-- Migration 003 : suivi des sessions achetées et consommées

-- Table des packs disponibles (référentiel)
CREATE TABLE IF NOT EXISTS packs (
  id            TEXT PRIMARY KEY,           -- ex: "individuel-5", "org-80"
  segment       TEXT NOT NULL,              -- 'individuel' | 'organisme'
  nb_sessions   INT  NOT NULL,
  prix_cents    INT  NOT NULL,              -- en centimes EUR (TTC pour individuel, HT pour org)
  devise        TEXT NOT NULL DEFAULT 'eur',
  duree_jours   INT,                        -- NULL = pas d'expiration (organismes)
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_price_id TEXT                      -- rempli après création dans Stripe
);

-- Seed des 7 packs
INSERT INTO packs (id, segment, nb_sessions, prix_cents, duree_jours) VALUES
  ('individuel-5',   'individuel',  5,    999,   7),
  ('individuel-10',  'individuel',  10,  1999,  30),
  ('individuel-20',  'individuel',  20,  3999,  60),
  ('org-80',         'organisme',   80,  20000, NULL),
  ('org-150',        'organisme',  150,  38000, NULL),
  ('org-300',        'organisme',  300,  70000, NULL),
  ('org-1000',       'organisme', 1000, 220000, NULL)
ON CONFLICT (id) DO NOTHING;

-- Table des crédits par organisation
CREATE TABLE IF NOT EXISTS session_credits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pack_id         TEXT NOT NULL REFERENCES packs(id),
  sessions_total  INT  NOT NULL,           -- sessions achetées dans ce pack
  sessions_used   INT  NOT NULL DEFAULT 0, -- sessions déjà consommées
  stripe_payment_intent_id TEXT UNIQUE,    -- référence paiement Stripe
  expires_at      TIMESTAMPTZ,             -- NULL = pas d'expiration
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vue utile : crédits disponibles par organisation
CREATE OR REPLACE VIEW credits_disponibles AS
SELECT
  organization_id,
  SUM(sessions_total - sessions_used) AS sessions_disponibles
FROM session_credits
WHERE (expires_at IS NULL OR expires_at > NOW())
GROUP BY organization_id;

-- RLS
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_credits ENABLE ROW LEVEL SECURITY;

-- Packs : lecture publique (page tarifs)
CREATE POLICY "packs_public_read" ON packs
  FOR SELECT USING (actif = TRUE);

-- Crédits : lecture par l'organisation concernée ou super_admin
CREATE POLICY "credits_org_read" ON session_credits
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
