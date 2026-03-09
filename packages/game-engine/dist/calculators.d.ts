import { Joueur, IndicateursFinanciers, Charges, Produits } from "./types";
export declare function getTotalActif(joueur: Joueur): number;
export declare function getTotalImmobilisations(joueur: Joueur): number;
export declare function getTotalStocks(joueur: Joueur): number;
export declare function getTresorerie(joueur: Joueur): number;
export declare function getTotalPassif(joueur: Joueur): number;
export declare function getTotalCharges(charges: Charges): number;
export declare function getTotalProduits(produits: Produits): number;
export declare function getResultatNet(joueur: Joueur): number;
/**
 * Vérifie l'équation fondamentale :
 *   ACTIF + CHARGES = PASSIF + PRODUITS
 * (équivalent à ACTIF = PASSIF + RÉSULTAT)
 */
export declare function verifierEquilibre(joueur: Joueur): {
    equilibre: boolean;
    totalActif: number;
    totalPassif: number;
    ecart: number;
};
export declare function calculerIndicateurs(joueur: Joueur): IndicateursFinanciers;
/**
 * Score = (Résultat Net × 3) + (Immobilisations × 2) + Trésorerie + Solvabilité
 */
export declare function calculerScore(joueur: Joueur): number;
export interface ResultatVerifFaillite {
    enFaillite: boolean;
    raison?: string;
}
export declare function verifierFaillite(joueur: Joueur): ResultatVerifFaillite;
//# sourceMappingURL=calculators.d.ts.map