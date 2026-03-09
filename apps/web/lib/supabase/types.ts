// ─── Types générés depuis le schéma Supabase ─────────────────────────────────
// Ce fichier sera remplacé par `supabase gen types typescript` une fois le projet Supabase créé.
// En attendant, les types sont définis manuellement pour correspondre exactement au schéma SQL.

export type OrgType =
  | "lycee"
  | "cci"
  | "france_travail"
  | "ecole_privee"
  | "rectorat"
  | "education_nationale"
  | "individuel";

export type PlanType = "free" | "individual" | "etablissement" | "rectorat" | "national";

export type UserRole = "super_admin" | "org_admin" | "teacher" | "student";

export type SessionStatus = "waiting" | "playing" | "finished";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          type: OrgType;
          plan_type: PlanType;
          plan_expires_at: string | null;
          max_teachers: number;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };

      profiles: {
        Row: {
          id: string;
          organization_id: string;
          role: UserRole;
          display_name: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };

      classes: {
        Row: {
          id: string;
          teacher_id: string;
          organization_id: string;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["classes"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
      };

      class_members: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          joined_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["class_members"]["Row"], "id" | "joined_at"> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["class_members"]["Insert"]>;
      };

      game_sessions: {
        Row: {
          id: string;
          teacher_id: string;
          class_id: string | null;
          organization_id: string;
          room_code: string;
          status: SessionStatus;
          nb_tours: number;
          created_at: string;
          finished_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["game_sessions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_sessions"]["Insert"]>;
      };

      game_players: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          guest_name: string | null;
          entreprise: string;
          final_score: number | null;
          is_bankrupt: boolean;
          etat_final: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["game_players"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_players"]["Insert"]>;
      };
    };

    Functions: {
      get_teacher_dashboard: {
        Args: { p_teacher_id: string };
        Returns: {
          total_sessions: number;
          total_players: number;
          avg_score: number;
          last_session_at: string | null;
        }[];
      };
    };
  };
}

// Helpers de typage pratiques
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Class = Database["public"]["Tables"]["classes"]["Row"];
export type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];
export type GamePlayer = Database["public"]["Tables"]["game_players"]["Row"];
