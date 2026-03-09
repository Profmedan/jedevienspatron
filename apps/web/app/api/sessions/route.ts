import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// ─── POST /api/sessions — Créer une session ───────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupère le profil via le service client (bypass RLS) pour garantir la lecture
    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "Profil incomplet — organization_id manquant" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { class_id, nb_tours = 6 } = body as {
      class_id?: string;
      nb_tours?: number;
    };

    // Vérifie la limite du plan gratuit
    const { data: org } = await supabase
      .from("organizations")
      .select("plan_type")
      .eq("id", profile.organization_id)
      .single();

    if (org?.plan_type === "free") {
      const { count: sessionCount } = await supabase
        .from("game_sessions")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", user.id);

      if ((sessionCount ?? 0) >= 3) {
        return NextResponse.json(
          {
            error: "limit_reached",
            message:
              "Limite du plan gratuit atteinte (3 sessions). Passez à la version payante.",
          },
          { status: 403 }
        );
      }
    }

    // Génère un room code unique via la fonction SQL
    const { data: codeResult } = await supabase.rpc("generate_room_code");
    const roomCode = codeResult as string;

    // Crée la session
    const { data: session, error: insertError } = await supabase
      .from("game_sessions")
      .insert({
        teacher_id: user.id,
        organization_id: profile.organization_id,
        class_id: class_id ?? null,
        room_code: roomCode,
        status: "waiting",
        nb_tours,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erreur création session:", insertError);
      return NextResponse.json(
        { error: "Impossible de créer la session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("Erreur API sessions POST:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── GET /api/sessions — Lister les sessions de l'enseignant ──
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from("game_sessions")
      .select(`
        id, room_code, status, nb_tours, created_at, finished_at,
        classes(id, name),
        game_players(id, guest_name, entreprise, final_score, is_bankrupt, rank)
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("Erreur API sessions GET:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
