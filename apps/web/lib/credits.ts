import { createServiceClient } from "@/lib/supabase/server";

// ─── Récupère les crédits disponibles pour une organisation ───
// Retourne les packs non expirés avec des sessions restantes, triés par création (FIFO)
export async function getAvailableCredits(orgId: string) {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("session_credits")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erreur récupération crédits disponibles:", error);
    return [];
  }

  // Filtre côté client : sessions disponibles et non expiré
  return (data || []).filter((credit: Record<string, unknown>) => {
    const sessionsUsed = credit.sessions_used as number;
    const sessionsTotal = credit.sessions_total as number;
    const expiresAt = credit.expires_at as string | null;

    const hasSessionsLeft = sessionsUsed < sessionsTotal;
    const isNotExpired = expiresAt === null || new Date(expiresAt) > new Date();
    return hasSessionsLeft && isNotExpired;
  });
}

// ─── Consomme un crédit pour une organisation ───
// Trouve le plus ancien pack avec des sessions disponibles et incrémente sessions_used
// Retourne l'ID du crédit consommé, ou null si pas de crédit disponible
export async function consumeCredit(orgId: string) {
  const serviceClient = createServiceClient();

  // Récupère tous les crédits et les filtre côté client
  const available = await getAvailableCredits(orgId);

  if (available.length === 0) {
    console.warn("Aucun crédit disponible pour l'organisation:", orgId);
    return null;
  }

  // Prend le premier (le plus ancien)
  const creditToConsume = available[0];

  // Incrémente sessions_used
  const { data: updated, error: updateError } = await serviceClient
    .from("session_credits")
    .update({ sessions_used: creditToConsume.sessions_used + 1 })
    .eq("id", creditToConsume.id)
    .select()
    .single();

  if (updateError) {
    console.error("Erreur consommation crédit:", updateError);
    return null;
  }

  return updated?.id || null;
}

// ─── Vérifie rapidement si une organisation a des crédits disponibles ───
export async function hasCredits(orgId: string): Promise<boolean> {
  const available = await getAvailableCredits(orgId);
  return available.length > 0;
}
