import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/sessions/[code]/start
 *
 * Marque une session comme "en cours" quand un apprenant démarre sa partie.
 * Applique la règle : 1 code = 1 partie maximum.
 *
 * Réponses :
 *   200 — session passée de 'waiting' → 'playing' : la partie peut commencer
 *   208 — session déjà 'playing'    : localStorage doit être restauré (refresh)
 *   403 — session 'finished'        : partie déjà terminée, impossible de rejouer
 *   404 — code inconnu
 *   500 — erreur serveur
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: "Code manquant" }, { status: 400 });
  }

  const service = createServiceClient();

  // Récupère la session
  const { data: session, error: fetchErr } = await service
    .from("game_sessions")
    .select("id, status")
    .eq("room_code", code.toUpperCase())
    .single();

  if (fetchErr || !session) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  // Partie déjà terminée → bloqué définitivement
  if (session.status === "finished") {
    return NextResponse.json(
      { error: "Cette session est terminée. Contactez votre formateur." },
      { status: 403 },
    );
  }

  // Partie déjà en cours → l'apprenant rafraîchit (restore depuis localStorage)
  if (session.status === "playing") {
    return NextResponse.json(
      { message: "Session déjà en cours — restauration attendue" },
      { status: 208 },
    );
  }

  // Première fois → passage waiting → playing
  const { error: updateErr } = await service
    .from("game_sessions")
    .update({
      status: "playing",
      started_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .eq("status", "waiting"); // garde-fou : mise à jour atomique si toujours waiting

  if (updateErr) {
    console.error("[start] Erreur update session:", updateErr);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ message: "Session démarrée" }, { status: 200 });
}

/**
 * PATCH /api/sessions/[code]/start
 *
 * Marque la session comme 'finished' en fin de partie.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: "Code manquant" }, { status: 400 });
  }

  const service = createServiceClient();

  const { error } = await service
    .from("game_sessions")
    .update({
      status: "finished",
      finished_at: new Date().toISOString(),
    })
    .eq("room_code", code.toUpperCase())
    .in("status", ["waiting", "playing"]);

  if (error) {
    console.error("[start PATCH] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ message: "Session terminée" }, { status: 200 });
}
