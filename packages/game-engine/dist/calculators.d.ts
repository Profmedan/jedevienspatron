import { Joueur, IndicateursFinanciers, Charges, Produits, ResultatDemandePret } from "./types";
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
export interface SIGSimplifie {
    ca: number;
    marge: number;
    ebe: number;
    resultatNet: number;
    tresorerie: number;
}
export declare function calculerSIGSimplifie(joueur: Joueur): SIGSimplifie;
export declare function calculerInterets(empruntsTotal: number, majore?: boolean): number;
export declare function scorerDemandePret(joueur: Joueur, montantDemande: number, tourActuel?: number): ResultatDemandePret;
export interface SIG {
    chiffreAffaires: number;
    achats: number;
    servicesExterieurs: number;
    valeurAjoutee: number;
    chargesPersonnel: number;
    impotsTaxes: number;
    ebe: number;
    dotations: number;
    resultatExploitation: number;
    produitsFinanciers: number;
    chargesInteret: number;
    rcai: number;
    revenusExceptionnels: number;
    chargesExceptionnelles: number;
    resultatExceptionnel: number;
    resultatNet: number;
    tauxMargeNette: number;
    tauxMargeEBE: number;
    roe: number;
    rentabiliteEconomique: number;
    delaiClients: number;
}
export declare function calculerSIG(joueur: Joueur): SIG;
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