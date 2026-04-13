import { EtatJeu, Joueur, CarteDecision, CarteClient, CarteEvenement, NomEntreprise, ResultatAction, ResultatDemandePret, EntrepriseTemplate } from "./types";
export declare function initialiserJeu(joueursDefs: Array<{
    pseudo: string;
    nomEntreprise: NomEntreprise;
}>, nbToursMax?: number, // 6 = session courte, 8 = standard, 12 = complet (3 exercices)
customTemplates?: EntrepriseTemplate[]): EtatJeu;
export declare function appliquerEtape0(etat: EtatJeu, joueurIdx: number): ResultatAction;
/**
 * Vérifie l'invariant comptable ACTIF = PASSIF + RÉSULTAT après chaque étape.
 * En développement, log un avertissement si l'équilibre est rompu (tolérance ±1€ pour arrondis).
 * Ne lève pas d'erreur pour ne pas bloquer le jeu en production.
 */
export declare function verifierEquilibreComptable(joueur: Joueur, contexte: string): void;
export declare function appliquerAchatMarchandises(etat: EtatJeu, joueurIdx: number, quantite: number, modePaiement: "tresorerie" | "dettes"): ResultatAction;
export declare function appliquerAvancementCreances(etat: EtatJeu, joueurIdx: number): ResultatAction;
export declare function appliquerPaiementCommerciaux(etat: EtatJeu, joueurIdx: number): ResultatAction;
/**
 * Licencie un commercial actif :
 *  - Indemnité = 1 trimestre de salaire → Charges exceptionnelles + Trésorerie
 *  - Retire le commercial de cartesActives (arrêt des salaires et des clients)
 *
 * Pédagogie : l'indemnité passe en Charges exceptionnelles (cpt 671),
 * pas en Charges de personnel (641) — distinction importante en comptabilité française.
 */
export declare function licencierCommercial(etat: EtatJeu, joueurIdx: number, carteId: string): ResultatAction;
/**
 * Comptabilisation en 4 écritures (partie double complète).
 * Ordre narratif optimisé pour la pédagogie :
 *   Acte 1 — Encaissement (Trésorerie/Créances) : le plus tangible
 *   Acte 2 — Chiffre d'affaires (Ventes)         : la contrepartie produit
 *   Acte 3 — Livraison (Stocks −1 unité)          : la sortie physique
 *   Acte 4 — Coût de revient (Achats/CMV)         : la contrepartie charge
 *
 * Chaque modification porte un saleGroupId + saleClientLabel + saleActIndex
 * pour permettre à l'UI de regrouper et narrer les ventes.
 */
export declare function appliquerCarteClient(etat: EtatJeu, joueurIdx: number, carteClient: CarteClient, saleGroupIndex?: number): ResultatAction;
export declare function appliquerEffetsRecurrents(etat: EtatJeu, joueurIdx: number): ResultatAction;
/**
 * Applique les effets passifs liés à la spécialité de l'entreprise.
 * Appelé à chaque tour, à l'étape 5, après les effets récurrents des cartes.
 *
 * ── Effets par entreprise ──────────────────────────────────────
 * • Manufacture Belvaux (Production) : +1 productionStockée, +1 stocks
 * • Véloce Transports (Logistique)   : délai encaissement -1 (géré dans appliquerCarteClient)
 * • Azura Commerce (Commerce)        : +1 client Particulier automatique (ajouté à clientsATrait)
 * • Synergia Lab (Innovation)        : +1 produitsFinanciers, +1 trésorerie
 */
export declare function appliquerSpecialiteEntreprise(etat: EtatJeu, joueurIdx: number): ResultatAction;
/**
 * Génère les clients bonus liés à la spécialité d'entreprise.
 * Appelé à l'étape 3, en même temps que genererClientsParCommerciaux.
 *
 * • Azura Commerce : +1 client Particulier automatique par tour
 */
export declare function genererClientsSpecialite(joueur: Joueur): CarteClient[];
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
/**
 * Investit dans une carte du mini-deck logistique personnel du joueur.
 * Vérifie le prérequis, retire la carte de piochePersonnelle, applique les effets immédiats.
 */
export declare function investirCartePersonnelle(etat: EtatJeu, joueurIdx: number, carteId: string): ResultatAction;
/**
 * Vend une immobilisation nommée du bilan du joueur (cession d'occasion).
 * Calcule la plus ou moins-value comptable et l'enregistre au compte de résultat.
 *
 * Règles comptables (PCG simplifié) :
 *  - Le bien "Autres Immobilisations" est un poste agrégé non vendable individuellement.
 *  - VNC = valeur nette comptable = valeur actuelle au bilan
 *    (les amortissements la décrémentent directement à chaque tour).
 *  - Vente autorisée même si VNC = 0 (bien totalement amorti).
 *  - Plus-value (prixCession > VNC) → +revenusExceptionnels (produit exceptionnel).
 *  - Moins-value (prixCession < VNC) → +chargesExceptionnelles (charge exceptionnelle).
 *  - Le bien est retiré définitivement du bilan après cession.
 *
 * @param prixCession Prix de vente accepté par l'apprenant (proposé par défaut à 80% VNC).
 */
export declare function vendreImmobilisation(etat: EtatJeu, joueurIdx: number, nomImmo: string, prixCession: number): ResultatAction;
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