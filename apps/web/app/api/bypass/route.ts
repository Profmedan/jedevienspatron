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
// SEC-bypass (2026-04-24) : cookie HttpOnly signé remplace le query param URL.
// Cf. tasks/sec-bypass-arbitrages.md et commit 0d27695.
import {
  signBypassCookie,
  BYPASS_COOKIE_NAME,
  BYPASS_COOKIE_OPTIONS,
} from "@/lib/bypass-cookie";

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

    // SEC-bypass (2026-04-24) — Code validé : on pose un cookie HttpOnly
    // signé pour autoriser l'accès à /jeu. Le middleware vérifie ce cookie
    // au lieu du query param (qui était exploitable à l'infini). Durée : 4h.
    const response = NextResponse.json({ valid: true });
    try {
      const cookieValue = signBypassCookie(trimmed);
      response.cookies.set(BYPASS_COOKIE_NAME, cookieValue, BYPASS_COOKIE_OPTIONS);
    } catch (signError) {
      // Sécurité préservée : si la signature échoue (secret absent), on refuse
      // l'accès plutôt que de valider sans cookie. L'incrément use_count est
      // déjà fait ; le joueur devra re-saisir son code (ou contacter le support).
      console.error("[bypass] signature cookie impossible:", signError);
      return NextResponse.json(
        { valid: false, reason: "erreur_signature" },
        { status: 500 }
      );
    }
    return response;

  } catch {
    return NextResponse.json({ valid: false, reason: "erreur_serveur" }, { status: 500 });
  }
}
