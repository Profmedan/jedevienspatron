import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hasCredits, consumeCredit } from "@/lib/credits";

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

    // Service client pour bypasser RLS (route serveur de confiance)
    const serviceClient = createServiceClient();

    // Récupère le profil
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

    // ───────────────────────────────────────────────────────────────────────
    // Vérification et consommation des crédits AVANT création de session
    // ───────────────────────────────────────────────────────────────────────
    const creditsAvailable = await hasCredits(profile.organization_id);
    if (!creditsAvailable) {
      return NextResponse.json(
        { error: "Crédits insuffisants" },
        { status: 403 }
      );
    }

    const creditId = await consumeCredit(profile.organization_id);
    if (!creditId) {
      return NextResponse.json(
        { error: "Impossible de consommer un crédit" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { class_id, nb_tours = 6 } = body as {
      class_id?: string;
      nb_tours?: number;
    };

    // Génère un room code unique via la fonction SQL
    const { data: codeResult } = await serviceClient.rpc("generate_room_code");
    const roomCode = codeResult as string;

    // Crée la session
    const { data: session, error: insertError } = await serviceClient
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
