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
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // ─── Rate limiting : 10 tentatives par minute par IP ──────
    const ip = getClientIp(req);
    const allowed = await checkRateLimit("bypass", ip);
    if (!allowed) {
      return NextResponse.json(
        { valid: false, reason: "trop_de_requetes" },
        { status: 429 }
      );
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, reason: "code_manquant" }, { status: 400 });
    }

    const trimmed = code.trim().toUpperCase();
    if (!trimmed.match(/^[A-Z0-9]{8}$/)) {
      return NextResponse.json({ valid: false, reason: "format_invalide" });
    }

    const supabase = createServiceClient();

    // Validation atomique via fonction PL/pgSQL (évite les race conditions)
    const { data: isValid, error } = await supabase.rpc("validate_bypass_code", {
      p_code: trimmed,
    });

    if (error) {
      console.error("Erreur validation bypass code:", error);
      // Vérifier si le code existe pour donner une raison précise
      const { data: codeExists } = await supabase
        .from("bypass_codes")
        .select("code")
        .eq("code", trimmed)
        .single();

      if (!codeExists) {
        return NextResponse.json({ valid: false, reason: "code_inconnu" });
      }
      return NextResponse.json({ valid: false, reason: "erreur_serveur" }, { status: 500 });
    }

    if (!isValid) {
      // Le code existe mais quota épuisé (ou code inconnu pour la RPC)
      // Distinguer les deux cas
      const { data: codeData } = await supabase
        .from("bypass_codes")
        .select("code, max_uses, use_count")
        .eq("code", trimmed)
        .single();

      if (!codeData) {
        return NextResponse.json({ valid: false, reason: "code_inconnu" });
      }
      return NextResponse.json({ valid: false, reason: "quota_epuise" });
    }

    return NextResponse.json({ valid: true });

  } catch {
    return NextResponse.json({ valid: false, reason: "erreur_serveur" }, { status: 500 });
  }
}
