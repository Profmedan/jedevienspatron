import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// ─── POST /api/sessions/results — Sauvegarder fin de partie ──
// Appelé par jeu/page.tsx à la fin d'une partie quand room_code présent
// NOTE : utilise le service client pour bypasser RLS —
// les apprenants jouent sans compte, donc pas d'auth.uid() côté RLS.
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const body = await request.json();
    const { room_code, joueurs } = body as {
      room_code: string;
      joueurs: Array<{
        pseudo: string;
        entreprise: string;
        scoreTotal: number;
        elimine: boolean;
        etatFinal: Record<string, unknown>;
        tourFaillite?: number;
      }>;
    };

    if (!room_code || !joueurs?.length) {
      return NextResponse.json(
        { error: "room_code et joueurs sont requis" },
        { status: 400 }
      );
    }

    // Récupère la session par room_code
    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("id, status, teacher_id")
      .eq("room_code", room_code)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session introuvable pour ce code" },
        { status: 404 }
      );
    }

    if (session.status === "finished") {
      return NextResponse.json(
        { error: "Cette session est déjà terminée" },
        { status: 409 }
      );
    }

    // Tri par score décroissant pour le classement
    const sorted = [...joueurs].sort((a, b) => b.scoreTotal - a.scoreTotal);

    // Insère les résultats des joueurs
    const playersData = sorted.map((j, index) => ({
      session_id: session.id,
      guest_name: j.pseudo,
      entreprise: j.entreprise,
      final_score: j.scoreTotal,
      rank: index + 1,
      is_bankrupt: j.elimine,
      bankrupt_at_tour: j.elimine ? (j.tourFaillite ?? null) : null,
      etat_final: j.etatFinal,
    }));

    const { error: playersError } = await supabase
      .from("game_players")
      .insert(playersData);

    if (playersError) {
      console.error("Erreur insertion game_players:", playersError);
      return NextResponse.json(
        { error: "Impossible de sauvegarder les résultats" },
        { status: 500 }
      );
    }

    // Met à jour le statut de la session
    await supabase
      .from("game_sessions")
      .update({
        status: "finished",
        finished_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return NextResponse.json({
      success: true,
      session_id: session.id,
      nb_players: playersData.length,
    });
  } catch (err) {
    console.error("Erreur API sessions/results:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
