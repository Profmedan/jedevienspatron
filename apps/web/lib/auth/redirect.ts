/** Valider et normaliser les URLs de redirection — prévention Open Redirect
 *
 * Règles :
 *  - Doit commencer par "/" (chemin relatif uniquement)
 *  - Ne doit pas commencer par "//" (évite //evil.com)
 *  - On tronque après "?" et "#" pour éviter les injections en query/fragment
 *  - Seuls les caractères de chemin valides sont acceptés
 */
export function getValidRedirectUrl(redirectTo?: string | null): string {
  if (!redirectTo) return "/dashboard";

  const trimmed = redirectTo.trim();

  // Doit être un chemin relatif
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/dashboard";

  // Extraire uniquement le chemin (sans query string ni fragment)
  const pathOnly = trimmed.split("?")[0].split("#")[0];

  // Vérifier que le chemin ne contient que des caractères valides
  // (lettres, chiffres, /, -, _, .)
  if (!/^\/[a-zA-Z0-9/_\-.]*$/.test(pathOnly)) return "/dashboard";

  return pathOnly;
}
