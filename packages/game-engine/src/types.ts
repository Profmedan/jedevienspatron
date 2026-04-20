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

/** Noms des 4 entreprises par défaut */
export type DefaultEntreprise =
  | "Manufacture Belvaux"
  | "Véloce Transports"
  | "Azura Commerce"
  | "Synergia Lab";

/** Accepte les 4 défauts + tout nom custom (string) avec autocomplétion */
export type NomEntreprise = DefaultEntreprise | (string & {});

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
  /** Taux de l'actif total pour proportionnaliser les montants (ex: 0.07 = 7%).
   *  delta_réel = sign(delta_original) × arrondi100(totalActif × tauxActif) */
  tauxActif?: number;
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
    /** Réduit le délai de paiement client de 1 trimestre */
    reducDelaiPaiement?: boolean;
    /** Génère automatiquement 1 client particulier par tour */
    clientGratuitParTour?: boolean;
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
  /**
   * Choix stratégiques mémorisés issus des Défis du dirigeant (Tâche 24).
   * Clé libre (ex: "positionnement", "politique_credit"), valeur = id du choix retenu.
   * Optionnel pour rétrocompatibilité : les parties existantes ignorent ce champ.
   */
  choixStrategiques?: Record<string, string>;
}

// ─── ÉTAT DE JEU ─────────────────────────────────────────────

/**
 * Les 8 étapes d'un tour de jeu (cycle T25.C — "activité puis clôture").
 *
 * Le cycle est ordonné de manière à ce que le trimestre commence par une
 * action visible (encaissements), fasse apparaître la vie commerciale
 * (commerciaux → achats → ventes → décision → événement), puis termine
 * par la clôture qui matérialise les charges structurelles et les effets
 * récurrents, avant le bilan de fin de trimestre.
 */
export type EtapeTour =
  | 0 // Encaissements des créances clients (ex-étape 2)
  | 1 // Paiement commerciaux + génération clients + recrutement (ex-étape 3)
  | 2 // Achats de marchandises (ex-étape 1)
  | 3 // Traitement des cartes Client (ex-étape 4)
  | 4 // Carte Décision / Investissement (ex-étape 6)
  | 5 // Carte Événement (ex-étape 7)
  | 6 // Clôture trimestre : charges fixes + amortissements + emprunt + effets récurrents (ex-étapes 0 + 5 fusionnées)
  | 7; // Bilan de fin de trimestre (ex-étape 8)

/**
 * Constantes nommées pour les étapes du tour (8 étapes depuis le Commit 3 de T25.C).
 *
 * Cycle « activité puis clôture » validé par Pierre 2026-04-19 :
 * on encaisse et on vend avant d'être assommé par les charges de fin de
 * période. Les anciennes étapes 0 (charges fixes) et 5 (effets récurrents)
 * sont fusionnées dans `CLOTURE_TRIMESTRE`.
 */
export const ETAPES = {
  ENCAISSEMENTS_CREANCES: 0,  // Avancement des créances clients
  COMMERCIAUX: 1,             // Paiement commerciaux + génération clients + recrutement
  ACHATS_STOCK: 2,            // Achats de marchandises
  VENTES: 3,                  // Traitement des cartes Client
  DECISION: 4,                // Carte Décision / Investissement
  EVENEMENT: 5,               // Carte Événement
  CLOTURE_TRIMESTRE: 6,       // Fusion : charges fixes + emprunt + amortissements + effets récurrents + spécialité
  BILAN: 7,                   // Bilan de fin de trimestre
} as const satisfies Record<string, EtapeTour>;

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
  /**
   * Défis du dirigeant (Tâche 24) — tous les champs ci-dessous sont optionnels
   * pour rétrocompatibilité : une partie démarrée avant la Vague 1 reste valide.
   */
  /** Activation globale du système de défis (défaut : false tant que la Vague 5 n'est pas branchée). */
  defisActives?: boolean;
  /** Arcs différés en cours (conséquences multi-trimestres). */
  defisActifs?: ArcDiffere[];
  /** Trace des défis déjà résolus (rapport pédagogique + évitement des répétitions). */
  defisResolus?: DefiResolu[];
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
    /** Identifiant de regroupement pour les ventes (ex: "vente-0", "vente-1") */
    saleGroupId?: string;
    /** Label du client pour l'affichage narratif (ex: "Client Particulier") */
    saleClientLabel?: string;
    /** Numéro d'acte narratif dans le groupe (1=encaissement, 2=ventes, 3=stocks, 4=CMV) */
    saleActIndex?: number;
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

/**
 * Revenus et marges par type de client.
 * Utilisé dans l'analyse des cartes commerciales pour calculer le chiffre d'affaires
 * et la marge brute. Les délais de paiement varient par type (comptant, C+1, C+2).
 */
export const REVENU_PAR_CLIENT: Record<string, { ventes: number; marge: number; label: string; delai: string }> = {
  particulier: { ventes: 2000, marge: 1000, label: "Particulier", delai: "comptant" },
  tpe:         { ventes: 3000, marge: 2000, label: "TPE",         delai: "C+1" },
  grand_compte:{ ventes: 4000, marge: 3000, label: "Grand Compte",delai: "C+2" },
};

/**
 * Bonus de capacité de production par carte.
 * Indique combien de ventes supplémentaires par trimestre chaque carte logistique débloque.
 * Miroir des valeurs CAPACITE_IMMOBILISATION du moteur.
 */
export const BONUS_CAPACITE: Partial<Record<string, number>> = {
  // Véhicules globaux
  "camionnette":          6,   // (Manufacture/Véloce: +6 ; Azura/Synergia: +2)
  "fourgon-refrigere":    5,
  "velo-cargo":           3,
  "credit-bail":          6,
  // Investissements logistiques globaux
  "expansion":            10,  // (Manufacture/Véloce: +4 ; Azura/Synergia: +6)
  "entrepot-automatise":  10,
  // Mini-deck Manufacture Belvaux
  "belvaux-robot-n1":     2,
  "belvaux-robot-n2":     2,
  "belvaux-entrepot":     2,
  // Mini-deck Véloce Transports
  "veloce-vehicule-n2":   2,
  "veloce-dispatch-n1":   2,
  "veloce-dispatch-n2":   2,
  // Mini-deck Azura Commerce
  "azura-marketplace-n1": 4,
  "azura-marketplace-n2": 4,
  "azura-soustraitance":  4,
  // Mini-deck Synergia Lab
  "synergia-erp-n1":      4,
  "synergia-erp-n2":      4,
  "synergia-partenariat": 4,
};

/**
 * Bénéfices qualitatifs par carte.
 * Utilisé pour afficher des bénéfices textuels quand une carte n'a pas de métrique financière
 * directe (p. ex. assurance, cybersécurité, optimisation de coûts, formations).
 */
export const BENEFICE_QUALITATIF: Partial<Record<string, string>> = {
  // Protection
  "assurance-prevoyance":   "Annule incendie, grève, litige et contrôle fiscal",
  "mutuelle-collective":    "Fidélise l'équipe et réduit le risque de grève",
  "cybersecurite":          "Annule pertes de données et risques de piratage",
  "maintenance-preventive": "Annule pannes machines + réduit les amortissements de 1 000 €/trim",
  // Service
  "affacturage":            "Convertit toutes vos créances en trésorerie immédiate",
  "relance-clients":        "Avance d'un trimestre le paiement de toutes vos créances",
  // Optimisation coûts
  "optimisation-lean":      "Réduit le coût des marchandises vendues de 1 000 €/trim",
  "sous-traitance":         "Ajoute 2 000 € de stocks produits chaque trimestre",
  // Tactique ponctuelle
  "achat-urgence":          "Déblocage immédiat de 5 000 € de stocks",
  "remboursement-anticipe": "Solde l'emprunt et supprime les intérêts récurrents",
  "revision-generale":      "Prolonge la durée de vie des immobilisations",
  // Formation : client grand compte immédiat (one-shot, pas récurrent)
  "formation":              "Décroche immédiatement 1 client Grand Compte ce trimestre",
};

/** Taux d'agios sur le découvert bancaire (10%/trimestre) */
export const TAUX_AGIOS = 0.10;
/** Nom exact de la ligne immobilisation cible pour les nouveaux investissements */
export const NOM_IMMOBILISATIONS_AUTRES = "Autres Immobilisations";
/** Amortissement comptable d'une immobilisation par trimestre (1 000€) */
export const AMORTISSEMENT_PAR_BIEN = 1000;
/** Score de crédit minimum pour obtenir un emprunt au taux standard */
export const SCORE_SEUIL_STANDARD = 65;
/** Score de crédit minimum pour obtenir un emprunt au taux majoré */
export const SCORE_SEUIL_MAJORE = 50;

/** Résultat d'une demande de prêt bancaire */
export interface ResultatDemandePret {
  accepte: boolean;
  montantAccorde: number;
  tauxMajore: boolean;
  score: number;
  raison: string;
}

// ─── DASHBOARD FORMATEUR + RAPPORT PÉDAGOGIQUE ─────────────────

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

// ─── DÉFIS DU DIRIGEANT (Tâche 24) ────────────────────────────
// Nouveaux types — pas d'accents dans les identifiants (cf. L44).
// Voir tasks/todo.md Tâche 24 pour le design complet.
// ─────────────────────────────────────────────────────────────

/** Slots où un défi peut s'attacher dans le pipeline du trimestre. */
export type SlotDramaturgique =
  | "debut_tour"       // Météo, arc différé qui revient, tension annoncée
  | "apres_ventes"     // Capacité, stock, BFR, clients perdus
  | "avant_decision"   // Arbitrage de dirigeant, palier stratégique
  | "avant_bilan"      // Conséquence immédiate, défi court
  | "fin_exercice"     // Clôture, IS, affectation du résultat
  | "finale";          // Palier irréversible, sortie

/** Nature dramaturgique d'un trimestre charnière. */
export type RuptureType =
  | "resiste"          // Le marché oppose une contrainte nouvelle (T3)
  | "juge"             // La comptabilité révèle la vérité de la trajectoire
  | "revient"          // Une décision passée produit une conséquence différée
  | "second_palier"    // Relance stratégique au milieu (durée 10)
  | "finale";          // Le joueur doit assumer une stratégie

/** Tonalité thématique d'un défi (catalogue narratif). */
export type TonaliteDefi =
  | "tresorerie"       // Trésorerie, BFR
  | "capacite"         // Capacité, production, stock
  | "financement"      // Banque, dette
  | "risque"           // Protection, juridique
  | "positionnement";  // Stratégie, marché

/** Format mécanique d'un défi. */
export type ArchetypeDefi =
  | "observation"           // T1/T2 — pas d'effet comptable, pas de sanction
  | "choix_binaire"         // 2 options, effet immédiat
  | "choix_arbitrage"       // 3 options avec trade-offs
  | "consequence_differee"  // Effet étalé sur 2-4 trim
  | "cloture"               // Automatique, non évitable (IS, affectation)
  | "palier_strategique"    // Choix irréversible, modifie paramètres globaux
  | "conditionnel";         // Déclenché par état du joueur (alerte courte)

/** Concept comptable ciblé par un défi — pour débrief pédagogique. */
export type ConceptComptable =
  | "bilan_actif_passif"
  | "tresorerie_vs_resultat"
  | "creances_clients"
  | "dettes_fournisseurs"
  | "bfr"
  | "amortissement"
  | "capacite_production"
  | "marge_commerciale"
  | "emprunt_bancaire"
  | "levee_de_fonds"
  | "impot_societes"
  | "affectation_resultat"
  | "reserve_legale"
  | "creance_douteuse"
  | "provision"
  | "resultat_exceptionnel"
  | "positionnement_strategique"
  | "transmission_entreprise";

/** Un effet comptable différé, appliqué N trimestres plus tard. */
export interface EffetDiffere {
  /** Nombre de trimestres avant l'application (1 = trimestre suivant). */
  dansNTrimestres: number;
  /** Effets comptables à appliquer. */
  effets: EffetCarte[];
  /** Explication pédagogique affichée au joueur lors de la résolution. */
  explication: string;
}

/** Arc différé actif — un défi dont les conséquences se déroulent sur plusieurs trimestres. */
export interface ArcDiffere {
  /** Identifiant unique (ex: "arc-creance-douteuse-T3-J0"). */
  id: string;
  /** Identifiant du défi source dans le catalogue. */
  defiId: string;
  /** ID du joueur concerné. */
  joueurId: number;
  /** Trimestre de déclenchement (absolu dans la partie). */
  trimestreDeclenchement: number;
  /** ID du choix effectué parmi ceux du défi. */
  choixId: string;
  /** Effets restant à appliquer, avec leur échéance absolue. */
  effetsRestants: Array<{
    /** Trimestre absolu d'application (1..nbToursMax). */
    trimestreApplication: number;
    effets: EffetCarte[];
    explication: string;
  }>;
}

/** Un choix proposé dans un défi. */
export interface ChoixDefi {
  /** Identifiant unique dans le défi (ex: "a", "b", "c"). */
  id: string;
  /** Libellé affiché au joueur. */
  libelle: string;
  /** Description/implication courte (optionnelle). */
  description?: string;
  /** Effets immédiats appliqués au choix. */
  effetsImmediats: EffetCarte[];
  /** Effet(s) différé(s) éventuel(s). */
  effetsDiffere?: EffetDiffere[];
  /** Explication pédagogique affichée après le choix. */
  pedagogie: string;
}

/** Un défi du dirigeant. */
export interface DefiDirigeant {
  /** Identifiant unique. */
  id: string;
  /** Archétype mécanique. */
  archetype: ArchetypeDefi;
  /** Tonalité thématique (null pour systémiques : observation/cloture/palier). */
  tonalite: TonaliteDefi | null;
  /** Concept comptable ciblé pour le débrief. */
  conceptCible: ConceptComptable;
  /** Slot dramaturgique où ce défi apparaît. */
  slot: SlotDramaturgique;
  /** Tour minimum de déclenchement (inclusif). */
  tourMin: number;
  /** Tour maximum de déclenchement (inclusif ; undefined = pas de plafond). */
  tourMax?: number;
  /** Condition supplémentaire de déclenchement (archétype "conditionnel"). */
  condition?: (etat: EtatJeu, joueur: Joueur) => boolean;
  /** Contexte narratif brut (avant formatContexte). Supporte {pseudo}, {entreprise}, {saison}, {tresorerie}, {tour}. */
  contexte: string;
  /** Choix possibles (0 pour observation, 1-3 pour les autres). */
  choix: ChoixDefi[];
  /** Défi obligatoire (ne peut être sauté) — vrai pour clôture et finale. */
  obligatoire: boolean;
  /** Entreprise exclusive éventuelle (format "avancé"). */
  entrepriseExclusive?: NomEntreprise;
}

/** Trace d'un défi résolu dans la partie. */
export interface DefiResolu {
  /** Identifiant unique d'instance. */
  id: string;
  /** Identifiant du défi source dans le catalogue. */
  defiId: string;
  /** ID du joueur concerné. */
  joueurId: number;
  /** Trimestre où le défi a été déclenché. */
  trimestre: number;
  /** Slot utilisé. */
  slot: SlotDramaturgique;
  /** ID du choix effectué (null si pas de choix, ex: observation sans interaction). */
  choixId: string | null;
  /** Concept comptable visé (pour rapport pédagogique post-session). */
  conceptCible: ConceptComptable;
}
