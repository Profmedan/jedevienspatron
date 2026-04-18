import { EtatJeu, Joueur } from "./types";
/**
 * Arrondit un montant au pas de 500 € (pas de jeu).
 * Garantit des chiffres lisibles au bilan (ex: 1500, 2000, 2500).
 *
 * @example
 *   arrondirJeu(1234) // 1000
 *   arrondirJeu(1250) // 1500 (arrondi au supérieur à mi-chemin)
 *   arrondirJeu(-1234) // -1000
 */
export declare function arrondirJeu(montant: number): number;
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
export declare function montantUnites(n: number): number;
/**
 * Exprime un montant relatif aux charges fixes (2 000 € / trim).
 * Pratique pour signifier « la moitié d'un mois de charges » = `montantChargeFixe(0.5)`.
 *
 * @example
 *   montantChargeFixe(0.5) // 1000
 *   montantChargeFixe(1)   // 2000
 *   montantChargeFixe(1.5) // 3000
 */
export declare function montantChargeFixe(ratio: number): number;
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
export declare function montantTresorerieCritique(etat: EtatJeu, joueur: Joueur): number;
//# sourceMappingURL=calibrage.d.ts.map