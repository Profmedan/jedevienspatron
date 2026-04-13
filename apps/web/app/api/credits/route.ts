import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAvailableCredits } from "@/lib/credits";

// ─── GET /api/credits — Récupère les crédits de l'utilisateur ───
export async function GET() {
  try {
    const supabase = await createClient();

    // Vérifie l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Récupère le profil pour l'organisation
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: "Profil incomplet — organization_id manquant" },
        { status: 400 }
      );
    }

    const sessionsDisponibles = await getAvailableCredits(profile.organization_id);

    return NextResponse.json(
      { sessions_disponibles: sessionsDisponibles },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur API credits GET:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
