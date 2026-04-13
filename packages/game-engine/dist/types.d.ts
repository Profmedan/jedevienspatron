export interface PosteActif {
    nom: string;
    valeur: number;
    /** Catégorie comptable pour le rendu */
    categorie: "immobilisations" | "stocks" | "creances" | "tresorerie";
}
export interface PostePassif {
    nom: string;
    valeur: number;
    categorie: "capitaux" | "emprunts" | "dettes";
}
export interface Bilan {
    actifs: PosteActif[];
    passifs: PostePassif[];
    /** Découvert bancaire (max DECOUVERT_MAX = 8) */
    decouvert: number;
    /** Créances clients à encaisser dans 1 tour */
    creancesPlus1: number;
    /** Créances clients à encaisser dans 2 tours */
    creancesPlus2: number;
    /** Dettes fournisseurs D+1 (payables au prochain trimestre) */
    dettes: number;
    /** Dettes fournisseurs D+2 (payables dans 2 trimestres, 40% des achats à crédit) */
    dettesD2: number;
    /** Dettes fiscales D+1 */
    dettesFiscales: number;
}
export interface Charges {
    /** Coût des marchandises vendues (CMV) */
    achats: number;
    /** Loyer, électricité, téléphone… (+2 par tour obligatoire) */
    servicesExterieurs: number;
    impotsTaxes: number;
    chargesInteret: number;
    /** Salaires des commerciaux */
    chargesPersonnel: number;
    chargesExceptionnelles: number;
    /** Usure des immobilisations (-1 Immo, +1 Dotation par tour) */
    dotationsAmortissements: number;
}
export interface Produits {
    ventes: number;
    /** Production de l'outil productif stockée */
    productionStockee: number;
    produitsFinanciers: number;
    revenusExceptionnels: number;
}
export interface CompteResultat {
    charges: Charges;
    produits: Produits;
}
export type NomEntreprise = "Manufacture Belvaux" | "Véloce Transports" | "Azura Commerce" | "Synergia Lab";
export interface EntrepriseTemplate {
    nom: NomEntreprise;
    /** Couleur thématique */
    couleur: string;
    /** Emoji icône */
    icon: string;
    /** Type d'activité affiché */
    type: string;
    specialite: string;
    /** Réduit le délai de paiement client de 1 trimestre (spécialité Véloce Transports) */
    reducDelaiPaiement?: boolean;
    /** Génère automatiquement 1 client particulier par tour (spécialité Azura Commerce) */
    clientGratuitParTour?: boolean;
    /** Effets passifs appliqués automatiquement à chaque tour (spécialité entreprise) */
    effetsPassifs?: EffetCarte[];
    /** Bilan de départ (Actif = Passif = 16 toujours) */
    actifs: Omit<PosteActif, "categorie">[];
    passifs: Omit<PostePassif, "categorie">[];
    /** Cartes logistiques actives dès T1 (ajoutées à cartesActives à l'initialisation) */
    cartesLogistiquesDepart?: CarteDecision[];
    /** Mini-deck logistique personnel — peuple piochePersonnelle à l'initialisation */
    cartesLogistiquesDisponibles?: CarteDecision[];
}
export type TypeCarte = "commercial" | "client" | "decision" | "evenement";
export type DelaiPaiement = 0 | 1 | 2;
export interface CarteCommercial {
    type: "commercial";
    id: string;
    titre: string;
    /** Coût en charges de personnel par tour */
    coutChargesPersonnel: number;
    /** Coût en trésorerie par tour */
    coutTresorerie: number;
    /** Type de client rapporté par tour */
    typeClientRapporte: "particulier" | "tpe" | "grand_compte";
    /** Nombre de clients rapportés par tour */
    nbClientsParTour: number;
}
export interface CarteClient {
    type: "client";
    id: string;
    titre: string;
    /** Montant des ventes générées */
    montantVentes: number;
    /** Délai d'encaissement : 0=immédiat, 1=C+1, 2=C+2 */
    delaiPaiement: DelaiPaiement;
    /** Consomme des stocks ? Oui pour les clients nécessitant des marchandises */
    consommeStocks: boolean;
}
/** Effet immédiat ou récurrent d'une carte Décision */
export interface EffetCarte {
    /** Poste impacté (bilan ou CR) */
    poste: "immobilisations" | "stocks" | "tresorerie" | "capitaux" | "emprunts" | "dettes" | "dettesD2" | "dettesFiscales" | "decouvert" | "creancesPlus1" | "creancesPlus2" | "achats" | "servicesExterieurs" | "impotsTaxes" | "chargesInteret" | "chargesPersonnel" | "chargesExceptionnelles" | "dotationsAmortissements" | "ventes" | "productionStockee" | "produitsFinanciers" | "revenusExceptionnels";
    delta: number;
}
export interface CarteDecision {
    type: "decision";
    id: string;
    titre: string;
    description: string;
    /** Effets appliqués une seule fois à l'achat */
    effetsImmédiats: EffetCarte[];
    /** Effets appliqués à chaque tour tant que la carte est active */
    effetsRecurrents: EffetCarte[];
    /** La carte rapporte-t-elle un client chaque tour ? */
    clientParTour?: "particulier" | "tpe" | "grand_compte";
    /** Combien de clients générés par tour (défaut : 1) */
    nbClientsParTour?: number;
    /** Nombre de cartes Décision bonus par tour (carte Berline) */
    carteDecisionBonus?: number;
    /** Catégorie pour l'affichage */
    categorie: "commercial" | "vehicule" | "investissement" | "financement" | "tactique" | "service" | "protection";
    /** ID de la carte qui doit être dans cartesActives avant d'investir dans celle-ci */
    prerequis?: string;
    /** Si défini, cette carte n'est proposée qu'à cette entreprise */
    entrepriseExclusive?: NomEntreprise;
}
export interface CarteEvenement {
    type: "evenement";
    id: string;
    titre: string;
    description: string;
    effets: EffetCarte[];
    /** Vrai si l'assurance prévoyance annule cet événement */
    annulableParAssurance: boolean;
    /** Taux de l'actif total pour proportionnaliser les montants (ex: 0.07 = 7%).
     *  delta_réel = sign(delta_original) × arrondi100(totalActif × tauxActif) */
    tauxActif?: number;
}
export type Carte = CarteCommercial | CarteClient | CarteDecision | CarteEvenement;
export interface Joueur {
    id: number;
    pseudo: string;
    /** Entreprise choisie */
    entreprise: {
        nom: NomEntreprise;
        couleur: string;
        icon: string;
        type: string;
        specialite: string;
        /** Réduit le délai de paiement client de 1 trimestre */
        reducDelaiPaiement?: boolean;
        /** Génère automatiquement 1 client particulier par tour */
        clientGratuitParTour?: boolean;
        /** Valeurs de référence initiales (pour la phase de configuration) */
        ref: {
            actifs: number[];
            passifs: number[];
        };
    };
    bilan: Bilan;
    compteResultat: CompteResultat;
    /** Cartes Décision actives (commerciaux + investissements) */
    cartesActives: CarteDecision[];
    /** Cartes Client en attente de traitement ce tour */
    clientsATrait: CarteClient[];
    elimine: boolean;
    /** Publicité activée ce tour ? */
    publicitéCeTour: boolean;
    /** Nombre de clients perdus faute de capacité ce trimestre */
    clientsPerdusCeTour: number;
    /** Mini-deck logistique personnel — cartes disponibles à l'investissement */
    piochePersonnelle: CarteDecision[];
}
/** Les 9 étapes d'un tour de jeu */
export type EtapeTour = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
/** Constantes nommées pour les étapes du tour — utilisez ces noms plutôt que les chiffres */
export declare const ETAPES: {
    readonly INIT: 0;
    readonly ACHATS: 1;
    readonly COMMERCIAUX: 2;
    readonly VENTES: 3;
    readonly CHARGES: 4;
    readonly BILAN: 5;
    readonly INVESTISSEMENT: 6;
    readonly EVENEMENT: 7;
    readonly CLOTURE: 8;
};
export interface EtatJeu {
    phase: "setup" | "playing" | "gameover";
    tourActuel: number;
    etapeTour: EtapeTour;
    joueurActif: number;
    joueurs: Joueur[];
    nbJoueurs: number;
    /** Nombre de trimestres configuré pour cette partie (4, 6 ou 8) */
    nbToursMax: number;
    /** Cartes Décision disponibles au centre de la table */
    piocheDecision: CarteDecision[];
    /** Cartes Événement restantes dans la pioche */
    piocheEvenements: CarteEvenement[];
    /** Événements appliqués ce tour (historique) */
    historiqueEvenements: Array<{
        tour: number;
        joueurId: number;
        carte: CarteEvenement;
    }>;
    messages: string[];
}
export interface ResultatAction {
    succes: boolean;
    messageErreur?: string;
    /** Modifications appliquées au bilan / CR pour l'animation */
    modifications: Array<{
        joueurId: number;
        poste: EffetCarte["poste"];
        ancienneValeur: number;
        nouvelleValeur: number;
        explication: string;
        /** Identifiant de regroupement pour les ventes (ex: "vente-0", "vente-1") */
        saleGroupId?: string;
        /** Label du client pour l'affichage narratif (ex: "Client Particulier") */
        saleClientLabel?: string;
        /** Numéro d'acte narratif dans le groupe (1=encaissement, 2=ventes, 3=stocks, 4=CMV) */
        saleActIndex?: number;
    }>;
}
export interface IndicateursFinanciers {
    totalActif: number;
    totalPassif: number;
    resultatNet: number;
    /** Capitaux permanents - Immobilisations */
    fondsDeRoulement: number;
    /** Stocks + Créances - Dettes exploitation */
    besoinFondsRoulement: number;
    /** FR - BFR */
    tresorerieNette: number;
    /** Résultat net + Dotations amortissements */
    capaciteAutofinancement: number;
    /** Actif circulant / Dettes court terme */
    ratioLiquidite: number;
    /** (Capitaux propres + Résultat) / Total Passif × 100 */
    ratioSolvabilite: number;
    equilibre: boolean;
}
export declare const DECOUVERT_MAX = 8000;
export declare const CHARGES_FIXES_PAR_TOUR = 2000;
/** Prix unitaire d'une marchandise : 1 unité physique = 1 000 € de valeur comptable (achat & CMV) */
export declare const PRIX_UNITAIRE_MARCHANDISE = 1000;
/** Remboursement du capital emprunté par trimestre (500 € — baissé de 1000 le 2026-04-10) */
export declare const REMBOURSEMENT_EMPRUNT_PAR_TOUR = 500;
/** Maximum de découvert remboursable par trimestre (progressif) */
export declare const REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR = 2000;
/** Fréquence des intérêts d'emprunt : tous les NB_TOURS_PAR_AN tours (= annuel) */
export declare const INTERET_EMPRUNT_FREQUENCE = 4;
export declare const NB_TOURS_PAR_AN = 4;
/** @deprecated Utiliser `nbToursMax` de `EtatJeu` — cette constante est gardée pour compatibilité */
export declare const NB_TOURS_MAX = 12;
export declare const SCORE_MULTIPLICATEUR_RESULTAT = 3;
export declare const SCORE_MULTIPLICATEUR_IMMO = 2;
/** Capacité de base sans immobilisation (ventes/trimestre) */
export declare const CAPACITE_BASE = 4;
/** Bonus de capacité par type d'immobilisation active */
export declare const CAPACITE_IMMOBILISATION: Record<string, number>;
/** Bonus de capacité spécifiques par entreprise (surcharge CAPACITE_IMMOBILISATION) */
export declare const CAPACITE_IMMOBILISATION_PAR_ENTREPRISE: Record<string, Partial<Record<string, number>>>;
/** Taux d'intérêt annuel sur les emprunts (5%) */
export declare const TAUX_INTERET_ANNUEL = 5;
/** Taux majoré appliqué si situation financière fragile (8%/an) */
export declare const TAUX_INTERET_MAJORE = 8;
/** Montants disponibles pour un emprunt bancaire */
export declare const MONTANTS_EMPRUNT: readonly [5000, 8000, 12000, 16000, 20000];
/**
 * Revenus et marges par type de client.
 * Utilisé dans l'analyse des cartes commerciales pour calculer le chiffre d'affaires
 * et la marge brute. Les délais de paiement varient par type (comptant, C+1, C+2).
 */
export declare const REVENU_PAR_CLIENT: Record<string, {
    ventes: number;
    marge: number;
    label: string;
    delai: string;
}>;
/**
 * Bonus de capacité de production par carte.
 * Indique combien de ventes supplémentaires par trimestre chaque carte logistique débloque.
 * Miroir des valeurs CAPACITE_IMMOBILISATION du moteur.
 */
export declare const BONUS_CAPACITE: Partial<Record<string, number>>;
/**
 * Bénéfices qualitatifs par carte.
 * Utilisé pour afficher des bénéfices textuels quand une carte n'a pas de métrique financière
 * directe (p. ex. assurance, cybersécurité, optimisation de coûts, formations).
 */
export declare const BENEFICE_QUALITATIF: Partial<Record<string, string>>;
/** Taux d'agios sur le découvert bancaire (10%/trimestre) */
export declare const TAUX_AGIOS = 0.1;
/** Nom exact de la ligne immobilisation cible pour les nouveaux investissements */
export declare const NOM_IMMOBILISATIONS_AUTRES = "Autres Immobilisations";
/** Amortissement comptable d'une immobilisation par trimestre (1 000€) */
export declare const AMORTISSEMENT_PAR_BIEN = 1000;
/** Score de crédit minimum pour obtenir un emprunt au taux standard */
export declare const SCORE_SEUIL_STANDARD = 65;
/** Score de crédit minimum pour obtenir un emprunt au taux majoré */
export declare const SCORE_SEUIL_MAJORE = 50;
/** Résultat d'une demande de prêt bancaire */
export interface ResultatDemandePret {
    accepte: boolean;
    montantAccorde: number;
    tauxMajore: boolean;
    score: number;
    raison: string;
}
/**
 * Snapshot léger envoyé au dashboard formateur en temps réel.
 * ~200 octets — mis à jour 1× par trimestre par joueur.
 */
export interface LiveState {
    tour: number;
    etape: number;
    tresorerie: number;
    resultatNet: number;
    score: number;
    capitauxPropres: number;
    nbCommerciaux: number;
    elimine: boolean;
}
/**
 * Snapshot trimestriel pour le rapport pédagogique post-session.
 * ~100 octets × 12 trimestres max = ~1.2 KB par joueur.
 */
export interface TrimSnapshot {
    tour: number;
    tresorerie: number;
    resultatNet: number;
    capitauxPropres: number;
    chiffreAffaires: number;
    score: number;
    nbClients: number;
    nbCommerciaux: number;
    /** Dernière décision prise ce trimestre (ex: "Recruté Junior", "Investi Camionnette") */
    decision: string | null;
}
//# sourceMappingURL=types.d.ts.map