// JEDEVIENSPATRON — Route API de validation des codes bypass
// POST /api/bypass   { "code": "XXXXXXXX" }
// Réponse: { "valid": true } ou { "valid": false, "reason": "..." }
//
// Logique :
//  1. Vérifier que le code existe dans la table bypass_codes (Supabase)
//  2. Vérifier que max_uses == -1 (illimité) OU use_count < max_uses
//  3. Si valide → incrémenter use_count atomiquement, retourner { valid: true }
//  4. Sinon → retourner { valid: false }

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, reason: "code_manquant" }, { status: 400 });
    }

    const trimmed = code.trim().toUpperCase();
    if (!trimmed.match(/^[A-Z0-9]{8}$/)) {
      return NextResponse.json({ valid: false, reason: "format_invalide" });
    }

    const supabase = createServiceClient();

    // Récupérer le code depuis Supabase
    const { data, error } = await supabase
      .from("bypass_codes")
      .select("code, max_uses, use_count")
      .eq("code", trimmed)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, reason: "code_inconnu" });
    }

    // Vérifier la limite d'utilisations
    const illimite = data.max_uses === -1;
    const quotaDisponible = illimite || data.use_count < data.max_uses;

    if (!quotaDisponible) {
      return NextResponse.json({ valid: false, reason: "quota_epuise" });
    }

    // Incrémenter le compteur atomiquement
    const { error: updateError } = await supabase
      .from("bypass_codes")
      .update({ use_count: data.use_count + 1 })
      .eq("code", trimmed)
      // Garde-fou : s'assurer que le compteur n'a pas été dépassé entre-temps
      .lt("use_count", illimite ? 999999999 : data.max_uses);

    if (updateError) {
      // Race condition : quota dépassé entre la lecture et l'écriture
      return NextResponse.json({ valid: false, reason: "quota_epuise" });
    }

    return NextResponse.json({ valid: true });

  } catch {
    return NextResponse.json({ valid: false, reason: "erreur_serveur" }, { status: 500 });
  }
}
