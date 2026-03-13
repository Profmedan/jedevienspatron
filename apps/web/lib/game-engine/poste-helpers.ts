/**
 * Utilitaire : impact d'une variation de poste sur la santé financière.
 *
 * Basé sur le Plan Comptable Général français :
 * - Charges (6xx) : une hausse réduit le résultat → mauvais
 * - Dettes / passif exigible : une hausse augmente l'endettement → mauvais
 * - Actifs et produits (7xx) : une hausse améliore la situation → bon
 */

/** Postes pour lesquels UNE HAUSSE est mauvaise pour l'entreprise */
export const POSTES_MAUVAIS_EN_HAUSSE = new Set<string>([
  // Charges d'exploitation
  "achats",
  "servicesExterieurs",
  "impotsTaxes",
  "chargesInteret",
  "chargesPersonnel",
  "chargesExceptionnelles",
  "dotationsAmortissements",
  // Dettes & passif exigible
  "dettes",
  "dettesFiscales",
  "decouvert",
  "emprunts",
]);

/**
 * Retourne `true` si la variation (delta) est BONNE pour la santé financière.
 *
 * @param poste  Identifiant technique du poste (ex. "tresorerie", "achats")
 * @param delta  Variation = nouvelleValeur − ancienneValeur
 */
export function isBonPourEntreprise(poste: string, delta: number): boolean {
  if (delta === 0) return true; // neutre
  return POSTES_MAUVAIS_EN_HAUSSE.has(poste) ? delta < 0 : delta > 0;
}
