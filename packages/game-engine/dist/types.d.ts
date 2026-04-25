export interface PosteActif {
    nom: string;
    valeur: number;
    /** Catégorie comptable pour le rendu */
    categorie: "immobilisations" | "stocks" | "creances" | "tresorerie";
    /**
     * LOT 2.1 (2026-04-25) — Durée d'amortissement en trimestres.
     *
     * Si présente sur une immobilisation, la dotation trimestrielle vaut
     * `valeurInitiale / dureeAmortissement` (lecture de `bilan.ref` pour
     * la valeur initiale). Sinon, le moteur applique le fallback
     * historique de −1 000 €/trim par bien.
     *
     * Permet d'étaler l'amortissement (Belvaux Entrepôt 12T au lieu
     * de 8T par défaut) sans changer la valeur d'inscription au bilan
     * — la valeur initiale au bilan reste la valeur d'achat conformément
     * au PCG, seule la cadence de dotation change.
     */
    dureeAmortissement?: number;
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
/** Noms des 4 entreprises par défaut */
export type DefaultEntreprise = "Manufacture Belvaux" | "Véloce Transports" | "Azura Commerce" | "Synergia Lab";
/** Accepte les 4 défauts + tout nom custom (string) avec autocomplétion */
export type NomEntreprise = DefaultEntreprise | (string & {});
/**
 * Secteur d'activité — pilote la branche du switch dans `appliquerCarteClient`
 * et les libellés pédagogiques.
 *
 * Depuis B9-A (2026-04-24), le mode historique "service" est décliné en
 * "logistique" (Véloce) et "conseil" (Synergia) pour que les 4 entreprises
 * canoniques aient chacune leur propre mode. "service" reste un literal valide
 * pour compat avec les saves v3 (B6/B7/B8) et les templates custom antérieurs.
 * Les switches moteur traitent "service" comme un alias de "logistique" +
 * "conseil" (même comportement en B9-A, polymorphie divergente en B9-D/E).
 */
export type SecteurActivite = "negoce" | "service" | "production" | "logistique" | "conseil";
export type TypeClientEntreprise = "particulier" | "tpe" | "grand_compte";
/**
 * Flux de clients récurrent ou initial, attaché à une entreprise.
 * Utilisé pour :
 *   - clientsPassifsParTour : demande récurrente hors commerciaux (ex : trafic boutique d'Azura)
 *   - clientsDeDepart       : carnet de commandes matérialisé au T1 (désactivé côté main)
 */
export interface FluxClientsEntreprise {
    typeClient: TypeClientEntreprise;
    nbParTour: number;
    /** Libellé pédagogique affiché dans l'UI ("Flux boutique et web", "Maintenance"…) */
    source: string;
}
/**
 * Modèle de création de valeur d'une entreprise (palier 1 — Tâche B8).
 * Pilote le comportement comptable de `appliquerCarteClient` et les libellés pédagogiques.
 *
 * B8 supportait trois modes (negoce/production/service).
 * B9-A (2026-04-24) ajoute "logistique" et "conseil" pour splitter "service"
 * et permettre des écritures moteur différentes entre Véloce et Synergia en
 * B9-D/E. "service" reste un literal valide (saves v3 + templates custom).
 *
 * Modes supportés :
 *   • "negoce"     : stocks − / achats + (CMV classique — Azura)
 *   • "production" : stocks − / productionStockee − (déstockage produit fini — Belvaux)
 *   • "service"    : alias historique (équivalent logistique + conseil en B9-A)
 *   • "logistique" : servicesExterieurs + / dettes + (Véloce, B9-A) — divergera en B9-D/E avec en-cours tournée
 *   • "conseil"    : servicesExterieurs + / dettes + (Synergia, B9-A) — divergera en B9-D/E avec en-cours mission + licences
 *
 * Les champs textuels (`ceQueJeVends`, `dOuVientLaValeur`, `goulotPrincipal`,
 * `libelleExecution`, `libelleContrepartie`) alimentent l'intro d'entreprise et
 * les explications attachées aux écritures de l'acte 3 / acte 4.
 */
export interface ModeleValeurEntreprise {
    /** Famille économique principale */
    mode: "negoce" | "production" | "service" | "logistique" | "conseil";
    /** Ce que l'entreprise vend réellement */
    ceQueJeVends: string;
    /** Ce qui crée la valeur avant la vente */
    dOuVientLaValeur: string;
    /** Ressource critique / goulot de croissance */
    goulotPrincipal: string;
    /** Coût variable unitaire par vente (utilisé pour la vérification de stock et les écritures) */
    coutVariable: number;
    /** Libellé pédagogique de l'acte 3 (sortie physique / réalisation) */
    libelleExecution: string;
    /** Libellé pédagogique de l'acte 4 (contrepartie charge / dette) */
    libelleContrepartie: string;
    /**
     * LOT 2.2 (2026-04-25) — Barème de prix de vente spécifique à l'entreprise.
     *
     * Si présent, override `REVENU_PAR_CLIENT` (constante globale) pour cette
     * entreprise uniquement. Permet à Belvaux (production) de vendre un peu
     * plus cher que les négoces standard (positionnement industriel à valeur
     * ajoutée), sans toucher à la grille de prix d'Azura/Véloce/Synergia.
     *
     * Chaque type de client peut être surchargé individuellement (les non
     * surchargés gardent la valeur globale). `ventes` = CA brut, `marge` =
     * marge contributive après déduction du coût matière (information
     * pédagogique, le moteur recalcule lui-même la marge à partir du coût
     * variable).
     */
    baremeRevenus?: Partial<Record<TypeClientEntreprise, {
        ventes: number;
        marge: number;
    }>>;
}
export interface EntrepriseTemplate {
    nom: NomEntreprise;
    /** Couleur thématique */
    couleur: string;
    /** Emoji icône */
    icon: string;
    /** Type d'activité affiché */
    type: string;
    /** Le secteur dicte la façon dont la marge brute est réalisée (avec ou sans stock) */
    secteurActivite: SecteurActivite;
    specialite: string;
    /** Surcharge de la capacité logistique de base (défaut: 4). Utile pour brider les services. */
    capaciteBase?: number;
    /** Réduit le délai de paiement client de 1 trimestre (spécialité Véloce Transports) */
    reducDelaiPaiement?: boolean;
    /** Génère automatiquement 1 client particulier par tour (spécialité Azura Commerce) */
    clientGratuitParTour?: boolean;
    /** Effets passifs appliqués automatiquement à chaque tour (spécialité entreprise) */
    effetsPassifs?: EffetCarte[];
    /** Demande récurrente générée hors commerciaux (Tâche B8) */
    clientsPassifsParTour?: FluxClientsEntreprise[];
    /** Clients déjà présents au démarrage (champ gardé pour usage futur — vide en main) */
    clientsDeDepart?: FluxClientsEntreprise[];
    /** Ce que l'entreprise vend et comment la valeur est créée (Tâche B8) */
    modeleValeur?: ModeleValeurEntreprise;
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
        secteurActivite: SecteurActivite;
        specialite: string;
        capaciteBase?: number;
        /** Réduit le délai de paiement client de 1 trimestre */
        reducDelaiPaiement?: boolean;
        /** Génère automatiquement 1 client particulier par tour */
        clientGratuitParTour?: boolean;
        /** Demande récurrente hors commerciaux (Tâche B8) */
        clientsPassifsParTour?: FluxClientsEntreprise[];
        /** Moteur de création de valeur de l'entreprise (Tâche B8) */
        modeleValeur?: ModeleValeurEntreprise;
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
    /**
     * Choix stratégiques mémorisés issus des Défis du dirigeant (Tâche 24).
     * Clé libre (ex: "positionnement", "politique_credit"), valeur = id du choix retenu.
     * Optionnel pour rétrocompatibilité : les parties existantes ignorent ce champ.
     */
    choixStrategiques?: Record<string, string>;
    /**
     * Compte de résultat cumulatif de la partie entière (B6 — 2026-04-20).
     * Alimenté par `compteResultat` lors de chaque clôture d'exercice, puis
     * `compteResultat` est remis à zéro. Sert à afficher le CA total partie,
     * rédiger le rapport pédagogique, et présenter la progression de l'élève.
     */
    compteResultatCumulePartie: CompteResultat;
    /**
     * Historique des exercices déjà clôturés (B6 — 2026-04-20).
     * Chaque entrée capture l'IS payé, la réserve dotée, les dividendes versés
     * et le report à nouveau pour pédagogie et traçabilité.
     * Optionnel : les parties antérieures (SAVE_VERSION < 3) n'ont pas ce champ.
     */
    historiqueExercices?: ExerciceArchive[];
}
/**
 * Les 8 étapes d'un tour de jeu (cycle B9 — « activité métier puis clôture »).
 *
 * B9-A (2026-04-24) insère une étape 3 REALISATION_METIER visible entre
 * ACHATS_STOCK (2) et FACTURATION_VENTES (4) — ex-VENTES. Décale DECISION
 * (4→5), EVENEMENT (5→6) et fusionne ex-CLOTURE_TRIMESTRE + ex-BILAN
 * en un seul CLOTURE_BILAN (7) avec deux passes moteur séquentielles.
 *
 * Le cycle devient : encaissements → commerciaux → ressources → RÉALISATION
 * métier (NEW) → facturation → décision → événement → clôture+bilan.
 */
export type EtapeTour = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
/**
 * Constantes nommées pour les étapes du tour (8 étapes, cycle B9 depuis 2026-04-24).
 *
 * Cycle « activité métier puis clôture » :
 * on encaisse, on paie les commerciaux, on approvisionne, on réalise le
 * cœur métier (B9), on facture, on décide, un événement, puis la clôture
 * (charges fixes + amortissements + effets récurrents + bilan) fusionnée.
 *
 * Migration B8 → B9-A :
 *   - VENTES (3) → FACTURATION_VENTES (4) : renommage + décalage
 *   - DECISION : 4 → 5
 *   - EVENEMENT : 5 → 6
 *   - CLOTURE_TRIMESTRE (6) + BILAN (7) → CLOTURE_BILAN (7, fusion)
 *   - REALISATION_METIER (3) : NEW
 */
export declare const ETAPES: {
    readonly ENCAISSEMENTS_CREANCES: 0;
    readonly COMMERCIAUX: 1;
    readonly ACHATS_STOCK: 2;
    readonly REALISATION_METIER: 3;
    readonly FACTURATION_VENTES: 4;
    readonly DECISION: 5;
    readonly EVENEMENT: 6;
    readonly CLOTURE_BILAN: 7;
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
    /**
     * Numéro de l'exercice comptable en cours (B6 — 2026-04-20).
     * Commence à 1 (T1-T4), passe à 2 (T5-T8), etc. Incrémenté au moment où
     * l'on valide la clôture d'un exercice. Optionnel pour rétrocompatibilité.
     */
    numeroExerciceEnCours?: number;
    /**
     * Dernier trimestre où une clôture d'exercice a eu lieu (B6 — 2026-04-20).
     * 0 tant qu'aucune clôture n'a été validée. Permet au pipeline de savoir
     * quand déclencher la modale de clôture (après BILAN d'un Tn multiple de 4
     * ou du dernier trimestre).
     */
    dernierTourClotureExercice?: number;
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
        /**
         * B9 post (2026-04-24) — Nom EXACT de la ligne de bilan touchée (ex.
         * "Stocks matières premières" vs "Stocks produits finis"). Nécessaire
         * pour que l'UI cible le bon badge dans le BilanPanel quand plusieurs
         * lignes partagent la même catégorie (ex. Belvaux a 2 lignes "stocks").
         * Alimenté automatiquement par `pushByName` côté moteur. Absent pour
         * les modifications passées via `push(categorie, ...)` classique —
         * l'UI se replie alors sur le filtrage par catégorie historique.
         */
        ligneNom?: string;
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
/**
 * B9-A (2026-04-24) : coût de canal fixe d'Azura à l'étape 3 REALISATION_METIER.
 * 300 € ≈ 15 % de la marge brute moyenne Azura — impact ressenti sans étouffer.
 * Activé en B9-D (fonction `appliquerRealisationMetier` branche négoce).
 */
export declare const COUT_CANAL_AZURA_PAR_TOUR = 300;
/**
 * B9-C (2026-04-24) — Coût d'approche tournée pour Véloce (mode logistique)
 * à l'étape 2 (ACHATS_STOCK / Approvisionnement).
 *
 * Véloce ne constitue pas de stock de marchandises mais engage un coût
 * d'approche (carburant, préparation véhicule, cotisation chauffeur) AVANT
 * la réalisation de la tournée. Comptabilisation :
 *   Services extérieurs   +300  (charge, CR)
 *   Dettes fournisseurs   +300  (passif, bilan)
 *
 * V1 de playtest (2026-04-24) : 300 € / trim — visible sans être punitif,
 * différencie déjà du métier stock, laisse place à l'étape 3 et 4.
 * Recalibrage prévu après partie manuelle.
 */
export declare const COUT_APPROCHE_VELOCE_PAR_TOUR = 300;
/**
 * B9-C (2026-04-24) — Coût de staffing mission pour Synergia (mode conseil)
 * à l'étape 2 (ACHATS_STOCK / Approvisionnement).
 *
 * Synergia cadre et staffe sa mission AVANT la réalisation : allocation
 * consultants, kickoff, licences outil ponctuelles. Comptabilisation :
 *   Charges de sous-traitance   +400  (charge, CR)
 *   Dettes fournisseurs         +400  (passif, bilan)
 *
 * V1 de playtest (2026-04-24) : 400 € / trim — légèrement supérieur à
 * Véloce car la valeur d'une heure consultant > d'une heure chauffeur.
 * Recalibrage prévu après partie manuelle.
 */
export declare const COUT_STAFFING_SYNERGIA_PAR_TOUR = 400;
/**
 * B9-D post (2026-04-24) — Capacité de production automatique de Belvaux
 * à l'étape 3 (REALISATION_METIER).
 *
 * Belvaux fabrique jusqu'à N produits finis par trimestre, dans la limite
 * de ses matières premières disponibles (coûtVariable × quantité).
 * Production partielle si MP insuffisante (ex. 1 PF si 1 000 € de MP,
 * 0 PF si aucune MP) avec message pédagogique explicite.
 *
 * V1 (2026-04-24) : 2 PF/trim. Aligné avec le Commercial Junior de départ
 * (2 clients/trim) pour ne pas créer de frustration systématique au T1.
 * Le goulot apparaît quand le joueur recrute un 2e commercial, subit un
 * événement réduisant les MP, ou oublie de racheter à l'étape 2.
 *
 * NB : cette capacité est VOLONTAIREMENT distincte de `calculerCapaciteLogistique`
 * (combien l'entreprise peut livrer/traiter de clients). La capacité de
 * PRODUCTION (combien elle peut fabriquer) et la capacité LOGISTIQUE
 * (combien elle peut livrer) sont deux notions différentes. Les futures
 * cartes Décision (Robot Belvaux N1/N2) augmenteront cette capacité de
 * production sans toucher à la capacité logistique.
 */
export declare const PRODUCTION_BELVAUX_PAR_TOUR = 2;
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
/** Taux de l'impôt sur les sociétés PME simplifié (15 % du résultat avant IS). */
export declare const TAUX_IS = 0.15;
/** Dotation forfaitaire à la réserve légale tant que capitaux propres < seuil. */
export declare const RESERVE_LEGALE_MONTANT = 500;
/** Seuil au-delà duquel la réserve légale n'est plus obligatoire. */
export declare const RESERVE_LEGALE_SEUIL_CAPITAUX = 20000;
/** Taux de distribution de dividendes proposés au joueur à la clôture. */
export declare const TAUX_DIVIDENDES_AUTORISES: readonly [0, 0.1, 0.25, 0.5];
/** Durée standard d'un exercice comptable (en trimestres). */
export declare const NB_TRIMESTRES_PAR_EXERCICE = 4;
/**
 * Archive d'un exercice clôturé : photographie pédagogique conservée pour
 * le rapport post-partie et l'écran de clôture.
 */
export interface ExerciceArchive {
    /** Numéro d'exercice (1, 2, 3...). */
    numero: number;
    /** Trimestre de début (inclusif). */
    tourDebut: number;
    /** Trimestre de fin (inclusif) — celui où la clôture s'opère. */
    tourFin: number;
    /** Compte de résultat figé juste avant la clôture (avant passage IS). */
    compteResultat: CompteResultat;
    /** Résultat avant impôt (= produits − charges au moment de la clôture). */
    resultatAvantIS: number;
    /** Montant d'impôt sur les sociétés effectivement payé (0 si perte). */
    impotSociete: number;
    /** Résultat après IS (= résultatAvantIS − impotSociete). */
    resultatApresIS: number;
    /** Dotation à la réserve légale (0 si seuil atteint ou perte). */
    reserveLegale: number;
    /** Pourcentage de dividendes choisi par le dirigeant (0, 0.10, 0.25, 0.50). */
    tauxDividendes: number;
    /** Dividendes effectivement versés en trésorerie. */
    dividendesVerses: number;
    /** Report à nouveau ajouté aux capitaux propres. */
    reportANouveau: number;
}
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
/** Slots où un défi peut s'attacher dans le pipeline du trimestre. */
export type SlotDramaturgique = "debut_tour" | "apres_ventes" | "avant_decision" | "avant_bilan" | "fin_exercice" | "finale";
/** Nature dramaturgique d'un trimestre charnière. */
export type RuptureType = "resiste" | "juge" | "revient" | "second_palier" | "finale";
/** Tonalité thématique d'un défi (catalogue narratif). */
export type TonaliteDefi = "tresorerie" | "capacite" | "financement" | "risque" | "positionnement";
/** Format mécanique d'un défi. */
export type ArchetypeDefi = "observation" | "choix_binaire" | "choix_arbitrage" | "consequence_differee" | "cloture" | "palier_strategique" | "conditionnel";
/** Concept comptable ciblé par un défi — pour débrief pédagogique. */
export type ConceptComptable = "bilan_actif_passif" | "tresorerie_vs_resultat" | "creances_clients" | "dettes_fournisseurs" | "bfr" | "amortissement" | "capacite_production" | "marge_commerciale" | "emprunt_bancaire" | "levee_de_fonds" | "impot_societes" | "affectation_resultat" | "reserve_legale" | "creance_douteuse" | "provision" | "resultat_exceptionnel" | "positionnement_strategique" | "transmission_entreprise";
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
//# sourceMappingURL=types.d.ts.map