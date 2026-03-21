import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

    // Récupère le nombre total de sessions disponibles via la vue
    const { data: creditsData, error: creditsError } = await serviceClient
      .from("credits_disponibles")
      .select("sessions_disponibles")
      .eq("organization_id", profile.organization_id)
      .single();

    if (creditsError && creditsError.code !== "PGRST116") {
      // PGRST116 = pas de ligne trouvée (c'est normal si pas de crédits)
      console.error("Erreur récupération crédits:", creditsError);
      return NextResponse.json(
        { error: creditsError.message },
        { status: 500 }
      );
    }

    const sessionsDisponibles = creditsData?.sessions_disponibles ?? 0;

    return NextResponse.json(
      { sessions_disponibles: sessionsDisponibles },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur API credits GET:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
