import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// ─── GET /api/rapport/[room_code] ───────────────────────────────
// Récupère les données d'une session terminée pour le rapport pédagogique.
// Public (pas d'auth requise) — les apprenants jouent sans compte.

const ROOM_CODE_REGEX = /^[A-Z0-9]{4,12}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ room_code: string }> },
) {
  try {
    const { room_code } = await params;

    if (!room_code || !ROOM_CODE_REGEX.test(room_code.trim().toUpperCase())) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("id, room_code, nb_tours, status, created_at, finished_at")
      .eq("room_code", room_code.toUpperCase())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    if (session.status !== "finished") {
      return NextResponse.json({ error: "Session pas encore terminée" }, { status: 409 });
    }

    // 2. Récupérer les joueurs (triés par rang)
    const { data: players, error: playersError } = await supabase
      .from("game_players")
      .select("id, guest_name, entreprise, final_score, rank, is_bankrupt, bankrupt_at_tour, snapshots")
      .eq("session_id", session.id)
      .order("rank", { ascending: true });

    if (playersError) {
      console.error("Erreur récupération game_players:", playersError);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({
      session: {
        room_code: session.room_code,
        nb_tours: session.nb_tours,
        created_at: session.created_at,
        finished_at: session.finished_at,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      players: (players ?? []).map((p: any) => ({
        id: p.id,
        pseudo: p.guest_name,
        entreprise: p.entreprise,
        score: p.final_score,
        rank: p.rank,
        isBankrupt: p.is_bankrupt,
        bankruptAtTour: p.bankrupt_at_tour,
        snapshots: p.snapshots ?? [],
      })),
    });
  } catch (err) {
    console.error("Erreur API rapport:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
