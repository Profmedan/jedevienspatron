import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// ─── GET /api/sessions/[code]/templates ──────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: "Code de session manquant" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Récupérer la session et ses templates
    const { data: session, error } = await serviceClient
      .from("game_sessions")
      .select("enterprise_templates")
      .eq("room_code", code)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 }
      );
    }

    // Retourner les templates (peut être null si aucun template personnalisé)
    return NextResponse.json({
      templates: session.enterprise_templates || [],
    });
  } catch (err) {
    console.error("Erreur API templates:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
