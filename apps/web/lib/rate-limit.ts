import { createServiceClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";

// ─── Limites configurées par route ──────────────────────────────
export const RATE_LIMITS = {
  bypass: {
    windowSecs: 60,   // Fenêtre de 60 secondes
    maxHits: 10,      // Max 10 tentatives par minute par IP
  },
  "sessions/results": {
    windowSecs: 60,
    maxHits: 20,      // Max 20 soumissions de résultats par minute par IP
  },
} as const;

// ─── Extraire l'IP du client depuis les headers Vercel ──────────
export function getClientIp(request: NextRequest): string {
  // Vercel injecte l'IP réelle dans x-forwarded-for
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for peut contenir plusieurs IPs (proxies) : prendre la première
    return forwarded.split(",")[0].trim();
  }
  // Fallback : header Vercel spécifique
  return request.headers.get("x-real-ip") ?? "unknown";
}

// ─── Vérifier le rate limit via Supabase ────────────────────────
// Retourne true si la requête est autorisée, false si bloquée
export async function checkRateLimit(
  routeKey: keyof typeof RATE_LIMITS,
  ip: string
): Promise<boolean> {
  const config = RATE_LIMITS[routeKey];
  const key = `${routeKey}:${ip}`;

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_window_secs: config.windowSecs,
      p_max_hits: config.maxHits,
    });

    if (error) {
      // En cas d'erreur DB, on laisse passer (fail open) pour ne pas bloquer les utilisateurs légitimes
      console.error("Erreur rate limit check:", error);
      return true;
    }

    return Boolean(data);
  } catch {
    // Fail open : si Supabase est indisponible, ne pas bloquer les requêtes
    return true;
  }
}
