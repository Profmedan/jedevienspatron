import { EtatJeu, Joueur, CarteDecision, CarteClient, CarteEvenement, NomEntreprise, ResultatAction } from "./types";
export declare function creerJoueur(id: number, pseudo: string, nomEntreprise: NomEntreprise): Joueur;
export declare function initialiserJeu(joueursDefs: Array<{
    pseudo: string;
    nomEntreprise: NomEntreprise;
}>): EtatJeu;
export declare function appliquerEtape0(etat: EtatJeu, joueurIdx: number): ResultatAction;
export declare function appliquerAchatMarchandises(etat: EtatJeu, joueurIdx: number, quantite: number, modePaiement: "tresorerie" | "dettes"): ResultatAction;
export declare function appliquerAvancementCreances(etat: EtatJeu, joueurIdx: number): ResultatAction;
export declare function calculerCoutCommerciaux(joueur: Joueur): number;
export declare function appliquerPaiementCommerciaux(etat: EtatJeu, joueurIdx: number): ResultatAction;
/**
 * Comptabilisation en 4 écritures (partie double complète) :
 * 1. Ventes +X (Produit)
 * 2. Stocks -1 (Actif)
 * 3. CMV/Achats +1 (Charge)
 * 4a. Trésorerie +X (si client particulier, paiement immédiat)
 * 4b. Créances C+1 +X (si client TPE)
 * 4c. Créances C+2 +X (si client grand compte)
 */
export declare function appliquerCarteClient(etat: EtatJeu, joueurIdx: number, carteClient: CarteClient): ResultatAction;
export declare function appliquerEffetsRecurrents(etat: EtatJeu, joueurIdx: number): ResultatAction;
export declare function tirerCartesDecision(etat: EtatJeu, nb?: number): CarteDecision[];
export declare function acheterCarteDecision(etat: EtatJeu, joueurIdx: number, carte: CarteDecision): ResultatAction;
export declare function appliquerCarteEvenement(etat: EtatJeu, joueurIdx: number, carte: CarteEvenement): ResultatAction;
export interface ResultatFinTour {
    equilibre: boolean;
    enFaillite: boolean;
    raisonFaillite?: string;
    score: number;
    ecartEquilibre: number;
    message: string;
}
export declare function verifierFinTour(etat: EtatJeu, joueurIdx: number): ResultatFinTour;
export declare function cloturerAnnee(etat: EtatJeu): void;
export declare function avancerEtape(etat: EtatJeu): void;
export declare function genererClientsParCommerciaux(joueur: Joueur): CarteClient[];
//# sourceMappingURL=engine.d.ts.map