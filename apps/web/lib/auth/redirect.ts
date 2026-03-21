/** Valider et normaliser les URLs de redirection — prévention Open Redirect */
export function getValidRedirectUrl(redirectTo?: string | null): string {
  if (!redirectTo) return "/dashboard";
  const trimmed = redirectTo.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/dashboard";
  return trimmed;
}
