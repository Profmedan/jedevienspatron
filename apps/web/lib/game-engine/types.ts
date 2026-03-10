// ============================================================
// KICLEPATRON — Types TypeScript du moteur de jeu
// Extraits fidèlement de KICLEPATRON_v2.html — Pierre Médan
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
  /** Découvert bancaire (max DECOUVERT_MAX = 5) */
  decouvert: number;
  /** Créances clients à encaisser dans 1 tour */
  creancesPlus1: number;
  /** Créances clients à encaisser dans 2 tours */
  creancesPlus2: number;
  /** Dettes fournisseurs D+1 */
  dettes: number;
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
  | "Entreprise Orange"
  | "Entreprise Violette"
  | "Entreprise Bleue"
  | "Entreprise Verte";

export interface EntrepriseTemplate {
  nom: NomEntreprise;
  /** Couleur thématique */
  couleur: string;
  /** Emoji icône */
  icon: string;
  /** Type d'activité affiché */
  type: string;
  specialite: string;
  /** Bilan de départ (Actif = Passif = 16 toujours) */
  actifs: Omit<PosteActif, "categorie">[];
  passifs: Omit<PostePassif, "categorie">[];
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
  | 6 // Choix d'une nouvelle carte Décision
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

export const DECOUVERT_MAX = 8; // Seuil de faillite : découvert bancaire > 8 → cessation de paiement
export const CHARGES_FIXES_PAR_TOUR = 2; // Services extérieurs +2, Tréso -2
export const REMBOURSEMENT_EMPRUNT_PAR_TOUR = 1;
export const NB_TOURS_PAR_AN = 4;
export const NB_TOURS_MAX = 6; // Valeur par défaut — configurable à 4, 6 ou 8 à l'initialisation
export const SCORE_MULTIPLICATEUR_RESULTAT = 3;
export const SCORE_MULTIPLICATEUR_IMMO = 2;
