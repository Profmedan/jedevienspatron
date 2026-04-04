import { EtatJeu, Joueur, CarteDecision, CarteClient, CarteEvenement, NomEntreprise, ResultatAction, ResultatDemandePret } from "./types";
export declare function creerJoueur(id: number, pseudo: string, nomEntreprise: NomEntreprise): Joueur;
export declare function initialiserJeu(joueursDefs: Array<{
    pseudo: string;
    nomEntreprise: NomEntreprise;
}>, nbToursMax?: number): EtatJeu;
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
/**
 * Retourne les cartes commerciales que le joueur peut encore recruter.
 * Aucun commercial n'est distribué automatiquement — le joueur choisit librement.
 * Disponible tout au long du jeu : les 3 types (Junior, Senior, Directrice) restent
 * recrutables à chaque tour, y compris en doublon (plusieurs juniors possibles, etc.).
 */
export declare function obtenirCarteRecrutement(_etat: EtatJeu, _joueurIdx: number): CarteDecision[];
/**
 * Tire nb cartes de la pioche (les cartes commerciales sont exclues :
 * elles passent par obtenirCarteRecrutement ci-dessus).
 * Le nombre minimum garanti est 4 cartes.
 */
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
/**
 * Le banquier score la situation financière du joueur sur 100 points.
 * - Score >= 65 : accepté, taux standard 5%/an
 * - Score 50-64 : accepté avec taux majoré 8%/an
 * - Score < 50  : refusé
 *
 * Si le prêt est accordé, les fonds sont versés immédiatement :
 *   DÉBIT Trésorerie / CRÉDIT Emprunts
 */
export declare function demanderEmprunt(etat: EtatJeu, joueurIdx: number, montant: number): {
    resultat: ResultatDemandePret;
    modifications: ResultatAction["modifications"];
};
/**
 * Calcule la capacité logistique maximale du joueur.
 * Formule : CAPACITE_BASE + somme des bonus des immobilisations actives
 *
 * Les immobilisations restent fonctionnelles même quand VNC = 0 (amortie).
 * On identifie les immobilisations via les cartes actives du joueur.
 */
export declare function calculerCapaciteLogistique(joueur: Joueur): number;
export declare function genererClientsParCommerciaux(joueur: Joueur): CarteClient[];
//# sourceMappingURL=engine.d.ts.map