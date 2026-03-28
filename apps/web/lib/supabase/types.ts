// ─── Types générés depuis le schéma Supabase ─────────────────────────────────
// Ce fichier pourra être remplacé par `supabase gen types typescript`.

export type OrgType =
  | "lycee"
  | "college"
  | "cci"
  | "france_travail"
  | "ecole_privee"
  | "universite"
  | "rectorat"
  | "education_nationale"
  | "individuel"
  | "autre";

export type PlanType =
  | "free"
  | "individual"
  | "etablissement"
  | "rectorat"
  | "national";

export type UserRole = "super_admin" | "org_admin" | "teacher" | "student";

export type SessionStatus = "waiting" | "playing" | "finished";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: OrgType;
          plan_type?: PlanType;
          plan_expires_at?: string | null;
          max_teachers?: number;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };

      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          role: UserRole;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          role?: UserRole;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };

      classes: {
        Row: {
          id: string;
          teacher_id: string;
          organization_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          organization_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
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
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
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
          nb_joueurs: number;
          created_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          class_id?: string | null;
          organization_id: string;
          room_code: string;
          status?: SessionStatus;
          nb_tours?: number;
          nb_joueurs?: number;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["game_sessions"]["Insert"]>;
      };

      game_players: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          guest_name: string | null;
          entreprise: string | null;
          final_score: number | null;
          rank: number | null;
          is_bankrupt: boolean;
          bankrupt_at_tour: number | null;
          etat_final: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          guest_name?: string | null;
          entreprise?: string | null;
          final_score?: number | null;
          rank?: number | null;
          is_bankrupt?: boolean;
          bankrupt_at_tour?: number | null;
          etat_final?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_players"]["Insert"]>;
      };

      packs: {
        Row: {
          id: string;
          segment: "individuel" | "organisme";
          nb_sessions: number;
          prix_cents: number;
          devise: string;
          duree_jours: number | null;
          actif: boolean;
          stripe_price_id: string | null;
        };
        Insert: {
          id: string;
          segment: "individuel" | "organisme";
          nb_sessions: number;
          prix_cents: number;
          devise?: string;
          duree_jours?: number | null;
          actif?: boolean;
          stripe_price_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["packs"]["Insert"]>;
      };

      session_credits: {
        Row: {
          id: string;
          organization_id: string;
          pack_id: string;
          sessions_total: number;
          sessions_used: number;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          pack_id: string;
          sessions_total: number;
          sessions_used?: number;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["session_credits"]["Insert"]>;
      };

      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_type: PlanType;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_type: PlanType;
          status: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
    };

    Views: {
      credits_disponibles: {
        Row: {
          organization_id: string;
          sessions_disponibles: number | null;
        };
      };
    };

    Functions: {
      consume_session_credit: {
        Args: { p_org_id: string };
        Returns: string | null;
      };
      release_session_credit: {
        Args: { p_credit_id: string };
        Returns: boolean;
      };
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

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Class = Database["public"]["Tables"]["classes"]["Row"];
export type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];
export type GamePlayer = Database["public"]["Tables"]["game_players"]["Row"];
export type Pack = Database["public"]["Tables"]["packs"]["Row"];
