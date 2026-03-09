-- ============================================================
-- KICLEPATRON SaaS — Schéma initial Supabase
-- Migration 001 : Multi-tenant B2B avec RLS
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────
-- 2. ENUMS
-- ─────────────────────────────────────────────────────────────

CREATE TYPE org_type AS ENUM (
  'lycee',
  'college',
  'cci',
  'france_travail',
  'ecole_privee',
  'universite',
  'rectorat',
  'education_nationale',
  'individuel',
  'autre'
);

CREATE TYPE plan_type AS ENUM (
  'free',
  'individual',
  'etablissement',
  'rectorat',
  'national'
);

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'org_admin',
  'teacher',
  'student'
);

CREATE TYPE session_status AS ENUM (
  'waiting',
  'playing',
  'finished'
);


-- ─────────────────────────────────────────────────────────────
-- 3. TABLE : organizations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE organizations (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                text NOT NULL,
  type                org_type NOT NULL DEFAULT 'individuel',
  plan_type           plan_type NOT NULL DEFAULT 'free',
  plan_expires_at     timestamptz,
  max_teachers        int NOT NULL DEFAULT 1,   -- -1 = illimité
  stripe_customer_id  text UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE organizations IS 'Un tenant = un établissement, une CCI, une academie, etc.';
COMMENT ON COLUMN organizations.max_teachers IS '-1 signifie illimité (plans rectorat/national)';


-- ─────────────────────────────────────────────────────────────
-- 4. TABLE : profiles
-- Étend auth.users de Supabase Auth
-- ─────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  uuid REFERENCES organizations(id) ON DELETE SET NULL,
  role             user_role NOT NULL DEFAULT 'student',
  display_name     text,
  email            text,
  avatar_url       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Profil étendu lié à auth.users. Créé automatiquement par trigger.';


-- ─────────────────────────────────────────────────────────────
-- 5. TABLE : classes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE classes (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             text NOT NULL,  -- ex: "Terminale STMG 2025-2026"
  description      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- 6. TABLE : class_members
-- ─────────────────────────────────────────────────────────────
CREATE TABLE class_members (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id    uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);


-- ─────────────────────────────────────────────────────────────
-- 7. TABLE : game_sessions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE game_sessions (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id         uuid REFERENCES classes(id) ON DELETE SET NULL,
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_code        text NOT NULL UNIQUE,  -- ex: "KIC-42A"
  status           session_status NOT NULL DEFAULT 'waiting',
  nb_tours         int NOT NULL DEFAULT 6,
  nb_joueurs       int NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now(),
  started_at       timestamptz,
  finished_at      timestamptz
);

COMMENT ON COLUMN game_sessions.room_code IS 'Code court que les élèves saisissent pour rejoindre la session';


-- ─────────────────────────────────────────────────────────────
-- 8. TABLE : game_players
-- ─────────────────────────────────────────────────────────────
CREATE TABLE game_players (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  guest_name     text,           -- si non connecté
  entreprise     text,           -- nom de l'entreprise dans le jeu
  final_score    int,            -- score final calculé
  rank           int,            -- classement dans la session
  is_bankrupt    boolean NOT NULL DEFAULT false,
  bankrupt_at_tour int,          -- tour où la faillite est survenue
  etat_final     jsonb,          -- snapshot complet EtatJoueur à la fin
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_player_identity CHECK (
    user_id IS NOT NULL OR guest_name IS NOT NULL
  )
);

COMMENT ON COLUMN game_players.etat_final IS 'Snapshot JSON de EtatJoueur (FR, BFR, trésorerie, cartes, etc.)';


-- ─────────────────────────────────────────────────────────────
-- 9. TABLE : subscriptions (sync Stripe)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id   text NOT NULL UNIQUE,
  stripe_customer_id       text NOT NULL,
  stripe_price_id          text NOT NULL,
  plan_type                plan_type NOT NULL,
  status                   text NOT NULL,  -- active, canceled, past_due, trialing...
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  canceled_at              timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- 10. INDEX DE PERFORMANCE
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_organization ON classes(organization_id);
CREATE INDEX idx_class_members_class ON class_members(class_id);
CREATE INDEX idx_class_members_student ON class_members(student_id);
CREATE INDEX idx_game_sessions_teacher ON game_sessions(teacher_id);
CREATE INDEX idx_game_sessions_organization ON game_sessions(organization_id);
CREATE INDEX idx_game_sessions_room_code ON game_sessions(room_code);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_players_session ON game_players(session_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);


-- ─────────────────────────────────────────────────────────────
-- 11. FONCTIONS UTILITAIRES
-- ─────────────────────────────────────────────────────────────

-- Génère un code unique de session (format: KIC-XXXX)
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code   text;
  exists bool;
BEGIN
  LOOP
    -- Génère 4 caractères aléatoires
    code := 'KIC-' || 
      substring(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substring(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substring(chars, floor(random() * length(chars) + 1)::int, 1) ||
      substring(chars, floor(random() * length(chars) + 1)::int, 1);
    
    -- Vérifie l'unicité
    SELECT EXISTS (
      SELECT 1 FROM game_sessions WHERE room_code = code AND status != 'finished'
    ) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Met à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 12. TRIGGERS updated_at
-- ─────────────────────────────────────────────────────────────
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 13. TRIGGER : création automatique profil + org au signup
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  user_display_name text;
  user_role_val user_role;
BEGIN
  -- Détermine le rôle (super_admin pour Pierre)
  IF NEW.email = 'profmedan@gmail.com' THEN
    user_role_val := 'super_admin';
  ELSE
    user_role_val := 'teacher';  -- Par défaut, les inscrits sont enseignants
  END IF;

  -- Récupère le nom depuis les metadata (Google OAuth ou formulaire)
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Crée une organisation individuelle par défaut
  INSERT INTO organizations (name, type, plan_type, max_teachers)
  VALUES (
    user_display_name || '''s Organization',
    'individuel',
    'free',
    1
  )
  RETURNING id INTO new_org_id;

  -- Crée le profil lié à auth.users
  INSERT INTO profiles (id, organization_id, role, display_name, email)
  VALUES (
    NEW.id,
    new_org_id,
    user_role_val,
    user_display_name,
    NEW.email
  );

  RETURN NEW;
END;
$$;

-- Attache le trigger à auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 14. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────

-- Active RLS sur toutes les tables
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;


-- ── Helper : récupère l'org_id du user courant ──
CREATE OR REPLACE FUNCTION auth_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

-- ── Helper : vérifie si le user courant est super_admin ──
CREATE OR REPLACE FUNCTION auth_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
$$;

-- ── Helper : vérifie si le user courant est teacher ou admin ──
CREATE OR REPLACE FUNCTION auth_is_teacher_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('teacher', 'org_admin', 'super_admin')
  )
$$;


-- ─── POLICIES : organizations ───
CREATE POLICY "org_select_own"
  ON organizations FOR SELECT
  USING (id = auth_user_org_id() OR auth_is_super_admin());

CREATE POLICY "org_update_own"
  ON organizations FOR UPDATE
  USING (id = auth_user_org_id() AND auth_is_teacher_or_admin())
  WITH CHECK (id = auth_user_org_id());

-- Super admin peut tout voir/modifier
CREATE POLICY "org_super_admin_all"
  ON organizations FOR ALL
  USING (auth_is_super_admin());


-- ─── POLICIES : profiles ───
CREATE POLICY "profile_select_same_org"
  ON profiles FOR SELECT
  USING (
    organization_id = auth_user_org_id()
    OR id = auth.uid()
    OR auth_is_super_admin()
  );

CREATE POLICY "profile_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profile_super_admin_all"
  ON profiles FOR ALL
  USING (auth_is_super_admin());


-- ─── POLICIES : classes ───
CREATE POLICY "classes_select_same_org"
  ON classes FOR SELECT
  USING (
    organization_id = auth_user_org_id()
    OR auth_is_super_admin()
  );

CREATE POLICY "classes_insert_teacher"
  ON classes FOR INSERT
  WITH CHECK (
    organization_id = auth_user_org_id()
    AND auth_is_teacher_or_admin()
  );

CREATE POLICY "classes_update_own"
  ON classes FOR UPDATE
  USING (teacher_id = auth.uid() OR auth_is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR auth_is_super_admin());

CREATE POLICY "classes_delete_own"
  ON classes FOR DELETE
  USING (teacher_id = auth.uid() OR auth_is_super_admin());


-- ─── POLICIES : class_members ───
CREATE POLICY "class_members_select"
  ON class_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c 
      WHERE c.id = class_id AND c.organization_id = auth_user_org_id()
    )
    OR student_id = auth.uid()
    OR auth_is_super_admin()
  );

CREATE POLICY "class_members_insert_teacher"
  ON class_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c 
      WHERE c.id = class_id AND c.teacher_id = auth.uid()
    )
    OR auth_is_super_admin()
  );

CREATE POLICY "class_members_delete_teacher"
  ON class_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classes c 
      WHERE c.id = class_id AND c.teacher_id = auth.uid()
    )
    OR auth_is_super_admin()
  );


-- ─── POLICIES : game_sessions ───
CREATE POLICY "sessions_select_same_org"
  ON game_sessions FOR SELECT
  USING (
    organization_id = auth_user_org_id()
    OR auth_is_super_admin()
  );

CREATE POLICY "sessions_insert_teacher"
  ON game_sessions FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    AND organization_id = auth_user_org_id()
    AND auth_is_teacher_or_admin()
  );

CREATE POLICY "sessions_update_own"
  ON game_sessions FOR UPDATE
  USING (teacher_id = auth.uid() OR auth_is_super_admin());


-- ─── POLICIES : game_players ───
CREATE POLICY "players_select_session"
  ON game_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions s 
      WHERE s.id = session_id AND s.organization_id = auth_user_org_id()
    )
    OR user_id = auth.uid()
    OR auth_is_super_admin()
  );

CREATE POLICY "players_insert_session"
  ON game_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions s 
      WHERE s.id = session_id AND (
        s.teacher_id = auth.uid() OR s.organization_id = auth_user_org_id()
      )
    )
    OR auth_is_super_admin()
  );

CREATE POLICY "players_update_own"
  ON game_players FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM game_sessions s 
      WHERE s.id = session_id AND s.teacher_id = auth.uid()
    )
    OR auth_is_super_admin()
  );


-- ─── POLICIES : subscriptions ───
CREATE POLICY "subscriptions_select_own_org"
  ON subscriptions FOR SELECT
  USING (
    organization_id = auth_user_org_id()
    OR auth_is_super_admin()
  );

-- Seul le service role (webhooks Stripe) peut modifier les subscriptions
-- Pas de policy INSERT/UPDATE/DELETE pour les users normaux


-- ─────────────────────────────────────────────────────────────
-- 15. DONNÉES INITIALES (optionnel — organisation Pierre)
-- ─────────────────────────────────────────────────────────────
-- NOTE : À exécuter APRÈS que Pierre se soit inscrit via Supabase Auth
-- Le trigger handle_new_user() créera automatiquement son profil.
-- Pour le promouvoir super_admin, exécuter :
--
-- UPDATE profiles 
-- SET role = 'super_admin' 
-- WHERE email = 'profmedan@gmail.com';
--
-- UPDATE organizations
-- SET plan_type = 'national', max_teachers = -1
-- WHERE id = (SELECT organization_id FROM profiles WHERE email = 'profmedan@gmail.com');
