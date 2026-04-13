import { createServiceClient } from "@/lib/supabase/server";

/**
 * Retourne le nombre de sessions disponibles pour une organisation.
 * Lit la vue `credits_disponibles` (SUM FIFO côté SQL).
 * Retourne 0 si aucun crédit ou si la vue ne contient pas la ligne (PGRST116).
 */
export async function getAvailableCredits(orgId: string): Promise<number> {
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from("credits_disponibles")
    .select("sessions_disponibles")
    .eq("organization_id", orgId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Erreur récupération crédits disponibles:", error);
  }
  return data?.sessions_disponibles ?? 0;
}

export async function consumeCredit(orgId: string) {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient.rpc("consume_session_credit", {
    p_org_id: orgId,
  });

  if (error) {
    console.error("Erreur consommation crédit:", error);
    return null;
  }

  return data ?? null;
}

export async function releaseCredit(creditId: string) {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient.rpc("release_session_credit", {
    p_credit_id: creditId,
  });

  if (error) {
    console.error("Erreur restauration crédit:", error);
    return false;
  }

  return Boolean(data);
}
