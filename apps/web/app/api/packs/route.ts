import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// ─── GET /api/packs — Récupère tous les packs actifs ───
export async function GET() {
  try {
    const serviceClient = createServiceClient();

    const { data: packs, error } = await serviceClient
      .from("packs")
      .select("*")
      .eq("actif", true)
      .order("segment", { ascending: true })
      .order("nb_sessions", { ascending: true });

    if (error) {
      console.error("Erreur récupération packs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ packs }, { status: 200 });
  } catch (err) {
    console.error("Erreur API packs GET:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
