import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// ─── Validation des entrées ──────────────────────────────────
const ROOM_CODE_REGEX = /^[A-Z0-9]{4,12}$/;
const MAX_JOUEURS = 30;
const MAX_PSEUDO_LENGTH = 50;
const MAX_ENTREPRISE_LENGTH = 100;
const MAX_ETAT_FINAL_SIZE = 100_000; // 100 KB max

function validateJoueurs(
  joueurs: unknown
): joueurs is Array<{
  pseudo: string;
  entreprise: string;
  scoreTotal: number;
  elimine: boolean;
  etatFinal: Record<string, unknown>;
  tourFaillite?: number;
}> {
  if (!Array.isArray(joueurs) || joueurs.length === 0 || joueurs.length > MAX_JOUEURS) {
    return false;
  }
  return joueurs.every(
    (j) =>
      typeof j === "object" &&
      j !== null &&
      typeof j.pseudo === "string" &&
      j.pseudo.length > 0 &&
      j.pseudo.length <= MAX_PSEUDO_LENGTH &&
      typeof j.entreprise === "string" &&
      j.entreprise.length <= MAX_ENTREPRISE_LENGTH &&
      typeof j.scoreTotal === "number" &&
      Number.isFinite(j.scoreTotal) &&
      typeof j.elimine === "boolean" &&
      (j.tourFaillite === undefined ||
        j.tourFaillite === null ||
        (typeof j.tourFaillite === "number" && Number.isInteger(j.tourFaillite))) &&
      (j.etatFinal === undefined ||
        j.etatFinal === null ||
        (typeof j.etatFinal === "object" &&
          JSON.stringify(j.etatFinal).length <= MAX_ETAT_FINAL_SIZE))
  );
}

// ─── POST /api/sessions/results — Sauvegarder fin de partie ──
// Appelé par jeu/page.tsx à la fin d'une partie quand room_code présent
// NOTE : utilise le service client pour bypasser RLS —
// les apprenants jouent sans compte, donc pas d'auth.uid() côté RLS.
export async function POST(request: NextRequest) {
  try {
    // ─── Rate limiting : 20 soumissions par minute par IP ─────
    const ip = getClientIp(request);
    const allowed = await checkRateLimit("sessions/results", ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes, veuillez patienter" },
        { status: 429 }
      );
    }

    const supabase = createServiceClient();

    const body = await request.json();
    const { room_code, joueurs } = body as {
      room_code: string;
      joueurs: unknown;
    };

    // Validation du room_code
    if (!room_code || typeof room_code !== "string" || !ROOM_CODE_REGEX.test(room_code.trim().toUpperCase())) {
      return NextResponse.json(
        { error: "room_code invalide" },
        { status: 400 }
      );
    }

    // Validation des joueurs (types, longueurs, taille max)
    if (!validateJoueurs(joueurs)) {
      return NextResponse.json(
        { error: "Données joueurs invalides" },
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
