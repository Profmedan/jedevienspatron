-- ============================================================
-- 011 — Scénarios personnalisés (enterprise templates)
--       Un formateur peut dupliquer une entreprise par défaut
--       et modifier son bilan initial (6 postes).
-- ============================================================

-- Table des templates custom
CREATE TABLE custom_enterprise_templates (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by       uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,

  -- Nom affiché dans l'éditeur et la sélection de session
  name             text NOT NULL,

  -- Entreprise de base dont on hérite les cartes + effets + spécialité mécanique
  base_enterprise  text NOT NULL,  -- ex: "Manufacture Belvaux"

  -- Métadonnées visuelles (modifiables)
  couleur          text NOT NULL,
  icon             text NOT NULL,

  -- Bilan initial (6 postes en milliers d'euros)
  immo1_nom        text NOT NULL,
  immo1_valeur     integer NOT NULL DEFAULT 8000,
  immo2_nom        text NOT NULL,
  immo2_valeur     integer NOT NULL DEFAULT 8000,
  autres_immo      integer NOT NULL DEFAULT 0,
  stocks           integer NOT NULL DEFAULT 4000,
  tresorerie       integer NOT NULL DEFAULT 8000,
  capitaux_propres integer NOT NULL DEFAULT 20000,
  emprunts         integer NOT NULL DEFAULT 8000,
  dettes           integer NOT NULL DEFAULT 0,

  -- Toggles mécaniques
  reduc_delai_paiement   boolean NOT NULL DEFAULT false,
  client_gratuit_par_tour boolean NOT NULL DEFAULT false,

  -- Spécialité textuelle (affichage)
  specialite_label text NOT NULL DEFAULT '',

  -- Lifecycle
  is_archived      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_templates_org ON custom_enterprise_templates(organization_id)
  WHERE NOT is_archived;

-- RLS
ALTER TABLE custom_enterprise_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_own_org"
  ON custom_enterprise_templates FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "templates_insert_own_org"
  ON custom_enterprise_templates FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "templates_update_own_org"
  ON custom_enterprise_templates FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "templates_delete_own_org"
  ON custom_enterprise_templates FOR DELETE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Colonne sur game_sessions pour stocker le snapshot des templates au moment de la création
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS enterprise_templates jsonb DEFAULT NULL;
