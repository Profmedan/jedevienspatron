import { createServiceClient } from "@/lib/supabase/server";

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
