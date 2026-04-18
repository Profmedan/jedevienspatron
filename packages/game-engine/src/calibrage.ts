// ============================================================
// JEDEVIENSPATRON — Calibrage des montants des défis
// ============================================================
// Règle absolue (cf. tasks/lessons.md L43) : les montants du jeu
// respectent une échelle précise.
//   - Charges fixes : 2 000 € / trimestre
//   - Amortissement : 1 000 € / bien / trimestre
//   - Découvert critique : 8 000 €
//   - Prix unitaire marchandise : 1 000 €
// Les défis ne doivent JAMAIS hardcoder des euros ; ils utilisent
// ces fonctions pour rester cohérents si l'échelle évolue.
// ============================================================

import {
  AMORTISSEMENT_PAR_BIEN,
  CHARGES_FIXES_PAR_TOUR,
  DECOUVERT_MAX,
  EtatJeu,
  Joueur,
  PRIX_UNITAIRE_MARCHANDISE,
} from "./types";

/**
 * Arrondit un montant au pas de 500 € (pas de jeu).
 * Garantit des chiffres lisibles au bilan (ex: 1500, 2000, 2500).
 *
 * @example
 *   arrondirJeu(1234) // 1000
 *   arrondirJeu(1250) // 1500 (arrondi au supérieur à mi-chemin)
 *   arrondirJeu(-1234) // -1000
 */
export function arrondirJeu(montant: number): number {
  const pas = 500;
  if (montant === 0) return 0;
  const signe = montant < 0 ? -1 : 1;
  const abs = Math.abs(montant);
  const arrondi = Math.round(abs / pas) * pas;
  return signe * arrondi;
}

/**
 * Convertit un nombre d'« unités de jeu » en euros au pas de 500 €.
 * 1 unité = 1 000 € (prix unitaire d'une marchandise).
 * Utile quand un défi veut exprimer un coût en « paniers » plutôt qu'en €.
 *
 * @example
 *   montantUnites(1)   // 1000
 *   montantUnites(2.5) // 2500
 *   montantUnites(0.3) // 500 (arrondi au pas)
 */
export function montantUnites(n: number): number {
  return arrondirJeu(n * PRIX_UNITAIRE_MARCHANDISE);
}

/**
 * Exprime un montant relatif aux charges fixes (2 000 € / trim).
 * Pratique pour signifier « la moitié d'un mois de charges » = `montantChargeFixe(0.5)`.
 *
 * @example
 *   montantChargeFixe(0.5) // 1000
 *   montantChargeFixe(1)   // 2000
 *   montantChargeFixe(1.5) // 3000
 */
export function montantChargeFixe(ratio: number): number {
  return arrondirJeu(ratio * CHARGES_FIXES_PAR_TOUR);
}

/**
 * Calcule un seuil de trésorerie critique contextuel, borné par le
 * découvert max (8 000 €). Utilisé par les défis pour détecter un
 * joueur en tension sans dépendre d'un chiffre brut.
 *
 * La logique : on prend la tension structurelle du joueur (charges fixes
 * + amortissements) et on borne par le découvert max. Le défi déclenché
 * sur ce seuil est intrinsèquement ajusté à la charge réelle du joueur.
 *
 * @returns Un montant en euros (arrondi au pas de 500 €).
 */
export function montantTresorerieCritique(etat: EtatJeu, joueur: Joueur): number {
  // Valeur nette des immobilisations (somme des postes de catégorie "immobilisations").
  const valeurImmos = joueur.bilan.actifs
    .filter((p) => p.categorie === "immobilisations")
    .reduce((acc, p) => acc + p.valeur, 0);
  const nbBiensAmortissables =
    valeurImmos > 0
      ? Math.max(1, Math.round(valeurImmos / PRIX_UNITAIRE_MARCHANDISE))
      : 0;
  const tensionStructurelle =
    CHARGES_FIXES_PAR_TOUR + nbBiensAmortissables * AMORTISSEMENT_PAR_BIEN;
  // On borne par le découvert max pour rester cohérent avec la limite bancaire.
  const borne = Math.min(tensionStructurelle, DECOUVERT_MAX);
  // Référence silencieuse à `etat` pour futures évolutions (saison, tour).
  void etat;
  return arrondirJeu(borne);
}
