import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// ─── POST /api/sessions/heartbeat ────────────────────────────────
// Appelé par le client jeu à chaque fin de trimestre.
// Met à jour live_state + last_heartbeat pour le joueur actif.
// Utilise le service client car les joueurs guest n'ont pas d'auth.

const ROOM_CODE_REGEX = /^[A-Z0-9]{4,12}$/;
const MAX_LIVE_STATE_SIZE = 1_000; // 1 KB max (attendu ~200B)

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit("sessions/heartbeat", ip);
    if (!allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const body = await request.json();
    const { room_code, guest_name, live_state } = body as {
      room_code: string;
      guest_name: string;
      live_state: unknown;
    };

    // Validations
    if (!room_code || typeof room_code !== "string" || !ROOM_CODE_REGEX.test(room_code.trim().toUpperCase())) {
      return NextResponse.json({ error: "room_code invalide" }, { status: 400 });
    }
    if (!guest_name || typeof guest_name !== "string" || guest_name.length > 50) {
      return NextResponse.json({ error: "guest_name invalide" }, { status: 400 });
    }
    if (!live_state || typeof live_state !== "object" || JSON.stringify(live_state).length > MAX_LIVE_STATE_SIZE) {
      return NextResponse.json({ error: "live_state invalide" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Trouver la session
    const { data: session } = await supabase
      .from("game_sessions")
      .select("id")
      .eq("room_code", room_code.toUpperCase())
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    // Mettre à jour le joueur (match par session_id + guest_name)
    const { error: updateError } = await supabase
      .from("game_players")
      .update({
        live_state,
        last_heartbeat: new Date().toISOString(),
      })
      .eq("session_id", session.id)
      .eq("guest_name", guest_name);

    if (updateError) {
      console.error("Erreur update heartbeat:", updateError);
      return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur API heartbeat:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
