// ============================================================
// JEDEVIENSPATRON — Types TypeScript du moteur de jeu
// Extraits fidèlement de JEDEVIENSPATRON_v2.html — Pierre Médan
// ============================================================

// ─── BILAN ───────────────────────────────────────────────────

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

// ─── COMPTE DE RÉSULTAT ──────────────────────────────────────

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

// ─── ENTREPRISE ──────────────────────────────────────────────

export type NomEntreprise =
  | "Manufacture Belvaux"
  | "Véloce Transports"
  | "Azura Commerce"
  | "Synergia Lab";

export interface EntrepriseTemplate {
  nom: NomEntreprise;
  /** Couleur thématique */
  couleur: string;
  /** Emoji icône */
  icon: string;
  /** Type d'activité affiché */
  type: string;
  specialite: string;
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

// ─── CARTES ──────────────────────────────────────────────────

export type TypeCarte =
  | "commercial"
  | "client"
  | "decision"
  | "evenement";

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
  poste:
    | "immobilisations"
    | "stocks"
    | "tresorerie"
    | "capitaux"
    | "emprunts"
    | "dettes"
    | "dettesD2"
    | "dettesFiscales"
    | "decouvert"
    | "creancesPlus1"
    | "creancesPlus2"
    | "achats"
    | "servicesExterieurs"
    | "impotsTaxes"
    | "chargesInteret"
    | "chargesPersonnel"
    | "chargesExceptionnelles"
    | "dotationsAmortissements"
    | "ventes"
    | "productionStockee"
    | "produitsFinanciers"
    | "revenusExceptionnels";
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
  categorie:
    | "commercial"
    | "vehicule"
    | "investissement"
    | "financement"
    | "tactique"
    | "service"
    | "protection";
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
}

export type Carte =
  | CarteCommercial
  | CarteClient
  | CarteDecision
  | CarteEvenement;

// ─── JOUEUR ──────────────────────────────────────────────────

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
    /** Valeurs de référence initiales (pour la phase de configuration) */
    ref: { actifs: number[]; passifs: number[] };
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

// ─── ÉTAT DE JEU ─────────────────────────────────────────────

/** Les 9 étapes d'un tour de jeu */
export type EtapeTour =
  | 0 // Remboursements obligatoires + charges fixes + amortissements
  | 1 // Achats de marchandises (optionnel)
  | 2 // Avancement des créances
  | 3 // Paiement des commerciaux (+ quiz pédagogique)
  | 4 // Traitement des cartes Client
  | 5 // Application des effets récurrents des cartes Décision
  | 6 // 6a Recrutement commercial (optionnel) + 6b Carte Décision (optionnel)
  | 7 // Pioche de la carte Événement
  | 8; // Vérification de l'équilibre + fin de tour

export interface EtatJeu {
  phase: "setup" | "playing" | "gameover";
  tourActuel: number; // 1 à nbToursMax
  etapeTour: EtapeTour;
  joueurActif: number; // index dans joueurs[]
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
  messages: string[]; // Messages pédagogiques courants
}

// ─── RÉSULTATS / ACTIONS ─────────────────────────────────────

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
  }>;
}

// ─── INDICATEURS FINANCIERS ───────────────────────────────────

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

// ─── CONSTANTES ───────────────────────────────────────────────

export const DECOUVERT_MAX = 8000; // Seuil de faillite : découvert bancaire > 8 000€ → cessation de paiement
export const CHARGES_FIXES_PAR_TOUR = 2000; // Services extérieurs +2 000€, Tréso -2 000€
/** Prix unitaire d'une marchandise : 1 unité physique = 1 000 € de valeur comptable (achat & CMV) */
export const PRIX_UNITAIRE_MARCHANDISE = 1000;
/** Remboursement du capital emprunté par trimestre (500 € — baissé de 1000 le 2026-04-10) */
export const REMBOURSEMENT_EMPRUNT_PAR_TOUR = 500;
/** Maximum de découvert remboursable par trimestre (progressif) */
export const REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR = 2000;
/** Fréquence des intérêts d'emprunt : tous les NB_TOURS_PAR_AN tours (= annuel) */
export const INTERET_EMPRUNT_FREQUENCE = 4; // Q1 de chaque année
export const NB_TOURS_PAR_AN = 4;
/** @deprecated Utiliser `nbToursMax` de `EtatJeu` — cette constante est gardée pour compatibilité */
export const NB_TOURS_MAX = 12;
export const SCORE_MULTIPLICATEUR_RESULTAT = 3;
export const SCORE_MULTIPLICATEUR_IMMO = 2;

// ─── CAPACITÉ LOGISTIQUE ──────────────────────────────────────

/** Capacité de base sans immobilisation (ventes/trimestre) */
export const CAPACITE_BASE = 4;

/** Bonus de capacité par type d'immobilisation active */
export const CAPACITE_IMMOBILISATION: Record<string, number> = {
  // Véhicules
  "camionnette": 6,        // 8 unités immo → +6 ventes
  "berline": 0,            // 8 unités immo → +0 ventes (commercial, non logistique)
  "fourgon-refrigere": 5,  // 6 unités immo → +5 ventes
  "velo-cargo": 3,         // 3 unités immo → +3 ventes

  // Investissements logistiques
  "expansion": 10,         // 8 unités immo → +10 ventes (augmentation capacité d'accueil)
  "entrepot-automatise": 10, // 8 unités immo → +10 ventes (capacité de stockage doublée)

  // Autres (non logistiques)
  "site-internet": 0,
  "rse": 0,
  "recherche-developpement": 0,
  "berline-repr": 0,
  "certification-iso": 0,
  "application-mobile": 0,
  "assurance-prevoyance": 0,
  "pret-bancaire": 0,
  "levee-de-fonds": 0,
  "publicite": 0,
  "relance-clients": 0,
  "formation": 0,
  "affacturage": 0,
  "remboursement-anticipe": 0,
  "credit-bail": 6,        // 6 unités immo en crédit-bail → +6 ventes
  "crowdfunding": 0,
  "programme-fidelite": 0,
  "export-international": 0,
  "partenariat-commercial": 0,
  "maintenance-preventive": 0,
  "mutuelle-collective": 0,
  "cybersecurite": 0,
  "erp": 0,
  "marketplace": 0,
  "label-qualite": 0,
  "commercial-junior-dec": 0,
  "commercial-senior-dec": 0,
  "directrice-commerciale-dec": 0,
  "achat-urgence": 0,
  "revision-generale": 0,
  "optimisation-lean": 0,
  "sous-traitance": 0,

  // Mini-deck Manufacture Belvaux (Production)
  "belvaux-robot-n1": 2,
  "belvaux-robot-n2": 2,
  "belvaux-entrepot": 2,

  // Mini-deck Véloce Transports (Logistique)
  "veloce-vehicule-n2": 2,
  "veloce-dispatch-n1": 2,
  "veloce-dispatch-n2": 2,

  // Mini-deck Azura Commerce (Commerce)
  "azura-marketplace-n1": 4,
  "azura-marketplace-n2": 4,
  "azura-soustraitance": 4,

  // Mini-deck Synergia Lab (Innovation)
  "synergia-erp-n1": 4,
  "synergia-erp-n2": 4,
  "synergia-partenariat": 4,
};

/** Bonus de capacité spécifiques par entreprise (surcharge CAPACITE_IMMOBILISATION) */
export const CAPACITE_IMMOBILISATION_PAR_ENTREPRISE: Record<string, Partial<Record<string, number>>> = {
  "camionnette": {
    "Manufacture Belvaux": 6,
    "Véloce Transports": 6,
    "Azura Commerce": 2,
    "Synergia Lab": 2,
  },
  "expansion": {
    "Manufacture Belvaux": 4,
    "Véloce Transports": 4,
    "Azura Commerce": 6,
    "Synergia Lab": 6,
  },
};

/** Taux d'intérêt annuel sur les emprunts (5%) */
export const TAUX_INTERET_ANNUEL = 5;
/** Taux majoré appliqué si situation financière fragile (8%/an) */
export const TAUX_INTERET_MAJORE = 8;
/** Montants disponibles pour un emprunt bancaire */
export const MONTANTS_EMPRUNT = [5000, 8000, 12000, 16000, 20000] as const;

/** Résultat d'une demande de prêt bancaire */
export interface ResultatDemandePret {
  accepte: boolean;
  montantAccorde: number;
  tauxMajore: boolean;
  score: number;
  raison: string;
}
