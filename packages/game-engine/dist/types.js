"use strict";
// ============================================================
// JEDEVIENSPATRON — Types TypeScript du moteur de jeu
// Extraits fidèlement de JEDEVIENSPATRON_v2.html — Pierre Médan
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCORE_SEUIL_MAJORE = exports.SCORE_SEUIL_STANDARD = exports.AMORTISSEMENT_PAR_BIEN = exports.NOM_IMMOBILISATIONS_AUTRES = exports.TAUX_AGIOS = exports.BENEFICE_QUALITATIF = exports.BONUS_CAPACITE = exports.REVENU_PAR_CLIENT = exports.NB_TRIMESTRES_PAR_EXERCICE = exports.TAUX_DIVIDENDES_AUTORISES = exports.RESERVE_LEGALE_SEUIL_CAPITAUX = exports.RESERVE_LEGALE_MONTANT = exports.TAUX_IS = exports.MONTANTS_EMPRUNT = exports.TAUX_INTERET_MAJORE = exports.TAUX_INTERET_ANNUEL = exports.CAPACITE_IMMOBILISATION_PAR_ENTREPRISE = exports.CAPACITE_IMMOBILISATION = exports.CAPACITE_BASE = exports.SCORE_MULTIPLICATEUR_IMMO = exports.SCORE_MULTIPLICATEUR_RESULTAT = exports.NB_TOURS_MAX = exports.NB_TOURS_PAR_AN = exports.INTERET_EMPRUNT_FREQUENCE = exports.REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR = exports.REMBOURSEMENT_EMPRUNT_PAR_TOUR = exports.COUT_STAFFING_SYNERGIA_PAR_TOUR = exports.COUT_APPROCHE_VELOCE_PAR_TOUR = exports.COUT_CANAL_AZURA_PAR_TOUR = exports.PRIX_UNITAIRE_MARCHANDISE = exports.CHARGES_FIXES_PAR_TOUR = exports.DECOUVERT_MAX = exports.ETAPES = void 0;
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
exports.ETAPES = {
    ENCAISSEMENTS_CREANCES: 0, // Avancement des créances clients
    COMMERCIAUX: 1, // Paiement commerciaux + génération clients + recrutement
    ACHATS_STOCK: 2, // Achats de marchandises / ressources
    REALISATION_METIER: 3, // NEW B9-A — acte métier polymorphe par mode (activé B9-D)
    FACTURATION_VENTES: 4, // ex-VENTES — Traitement des cartes Client
    DECISION: 5, // ex-4 — Carte Décision / Investissement
    EVENEMENT: 6, // ex-5 — Carte Événement
    CLOTURE_BILAN: 7, // Fusion ex-CLOTURE_TRIMESTRE + ex-BILAN : charges fixes + amortissements + effets récurrents + spécialité, puis vérification équilibre et transition fin de tour
};
// ─── CONSTANTES ───────────────────────────────────────────────
exports.DECOUVERT_MAX = 8000; // Seuil de faillite : découvert bancaire > 8 000€ → cessation de paiement
exports.CHARGES_FIXES_PAR_TOUR = 2000; // Services extérieurs +2 000€, Tréso -2 000€
/** Prix unitaire d'une marchandise : 1 unité physique = 1 000 € de valeur comptable (achat & CMV) */
exports.PRIX_UNITAIRE_MARCHANDISE = 1000;
/**
 * B9-A (2026-04-24) : coût de canal fixe d'Azura à l'étape 3 REALISATION_METIER.
 * 300 € ≈ 15 % de la marge brute moyenne Azura — impact ressenti sans étouffer.
 * Activé en B9-D (fonction `appliquerRealisationMetier` branche négoce).
 */
exports.COUT_CANAL_AZURA_PAR_TOUR = 300;
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
exports.COUT_APPROCHE_VELOCE_PAR_TOUR = 300;
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
exports.COUT_STAFFING_SYNERGIA_PAR_TOUR = 400;
/** Remboursement du capital emprunté par trimestre (500 € — baissé de 1000 le 2026-04-10) */
exports.REMBOURSEMENT_EMPRUNT_PAR_TOUR = 500;
/** Maximum de découvert remboursable par trimestre (progressif) */
exports.REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR = 2000;
/** Fréquence des intérêts d'emprunt : tous les NB_TOURS_PAR_AN tours (= annuel) */
exports.INTERET_EMPRUNT_FREQUENCE = 4; // Q1 de chaque année
exports.NB_TOURS_PAR_AN = 4;
/** @deprecated Utiliser `nbToursMax` de `EtatJeu` — cette constante est gardée pour compatibilité */
exports.NB_TOURS_MAX = 12;
exports.SCORE_MULTIPLICATEUR_RESULTAT = 3;
exports.SCORE_MULTIPLICATEUR_IMMO = 2;
// ─── CAPACITÉ LOGISTIQUE ──────────────────────────────────────
/** Capacité de base sans immobilisation (ventes/trimestre) */
exports.CAPACITE_BASE = 4;
/** Bonus de capacité par type d'immobilisation active */
exports.CAPACITE_IMMOBILISATION = {
    // Véhicules
    "camionnette": 6, // 8 unités immo → +6 ventes
    "berline": 0, // 8 unités immo → +0 ventes (commercial, non logistique)
    "fourgon-refrigere": 5, // 6 unités immo → +5 ventes
    "velo-cargo": 3, // 3 unités immo → +3 ventes
    // Investissements logistiques
    "expansion": 10, // 8 unités immo → +10 ventes (augmentation capacité d'accueil)
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
    "credit-bail": 6, // 6 unités immo en crédit-bail → +6 ventes
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
exports.CAPACITE_IMMOBILISATION_PAR_ENTREPRISE = {
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
exports.TAUX_INTERET_ANNUEL = 5;
/** Taux majoré appliqué si situation financière fragile (8%/an) */
exports.TAUX_INTERET_MAJORE = 8;
/** Montants disponibles pour un emprunt bancaire */
exports.MONTANTS_EMPRUNT = [5000, 8000, 12000, 16000, 20000];
// ─── CLÔTURE D'EXERCICE (B6 — 2026-04-20) ─────────────────────
//
// Règles métier arbitrées par Pierre (cf. tasks/plan-b6-fin-exercice.md §1) :
// • IS PME : 15 % du résultat avant impôt (IS = 0 sur perte — pas de carry-back).
// • Charge : impotsTaxes (compte 695 simplifié) + décaissement immédiat
//   (pas de dette d'IS portée au trimestre suivant).
// • Réserve légale : dotation obligatoire de 500 € tant que les capitaux
//   propres sont < 20 000 € (seuil pédagogique simplifié ; en comptabilité
//   française, la réserve légale est 5 % du bénéfice jusqu'à atteindre
//   10 % du capital social — ici on fige un forfait pour ne pas complexifier).
// • Dividendes : choix du dirigeant parmi 0 % / 10 % / 25 % / 50 % du
//   résultat distribuable (résultat après IS − réserve légale).
// • Report à nouveau : ce qui reste (non distribué, non mis en réserve)
//   est ajouté aux capitaux propres.
// ──────────────────────────────────────────────────────────────
/** Taux de l'impôt sur les sociétés PME simplifié (15 % du résultat avant IS). */
exports.TAUX_IS = 0.15;
/** Dotation forfaitaire à la réserve légale tant que capitaux propres < seuil. */
exports.RESERVE_LEGALE_MONTANT = 500;
/** Seuil au-delà duquel la réserve légale n'est plus obligatoire. */
exports.RESERVE_LEGALE_SEUIL_CAPITAUX = 20000;
/** Taux de distribution de dividendes proposés au joueur à la clôture. */
exports.TAUX_DIVIDENDES_AUTORISES = [0, 0.10, 0.25, 0.50];
/** Durée standard d'un exercice comptable (en trimestres). */
exports.NB_TRIMESTRES_PAR_EXERCICE = 4;
/**
 * Revenus et marges par type de client.
 * Utilisé dans l'analyse des cartes commerciales pour calculer le chiffre d'affaires
 * et la marge brute. Les délais de paiement varient par type (comptant, C+1, C+2).
 */
exports.REVENU_PAR_CLIENT = {
    particulier: { ventes: 2000, marge: 1000, label: "Particulier", delai: "comptant" },
    tpe: { ventes: 3000, marge: 2000, label: "TPE", delai: "C+1" },
    grand_compte: { ventes: 4000, marge: 3000, label: "Grand Compte", delai: "C+2" },
};
/**
 * Bonus de capacité de production par carte.
 * Indique combien de ventes supplémentaires par trimestre chaque carte logistique débloque.
 * Miroir des valeurs CAPACITE_IMMOBILISATION du moteur.
 */
exports.BONUS_CAPACITE = {
    // Véhicules globaux
    "camionnette": 6, // (Manufacture/Véloce: +6 ; Azura/Synergia: +2)
    "fourgon-refrigere": 5,
    "velo-cargo": 3,
    "credit-bail": 6,
    // Investissements logistiques globaux
    "expansion": 10, // (Manufacture/Véloce: +4 ; Azura/Synergia: +6)
    "entrepot-automatise": 10,
    // Mini-deck Manufacture Belvaux
    "belvaux-robot-n1": 2,
    "belvaux-robot-n2": 2,
    "belvaux-entrepot": 2,
    // Mini-deck Véloce Transports
    "veloce-vehicule-n2": 2,
    "veloce-dispatch-n1": 2,
    "veloce-dispatch-n2": 2,
    // Mini-deck Azura Commerce
    "azura-marketplace-n1": 4,
    "azura-marketplace-n2": 4,
    "azura-soustraitance": 4,
    // Mini-deck Synergia Lab
    "synergia-erp-n1": 4,
    "synergia-erp-n2": 4,
    "synergia-partenariat": 4,
};
/**
 * Bénéfices qualitatifs par carte.
 * Utilisé pour afficher des bénéfices textuels quand une carte n'a pas de métrique financière
 * directe (p. ex. assurance, cybersécurité, optimisation de coûts, formations).
 */
exports.BENEFICE_QUALITATIF = {
    // Protection
    "assurance-prevoyance": "Annule incendie, grève, litige et contrôle fiscal",
    "mutuelle-collective": "Fidélise l'équipe et réduit le risque de grève",
    "cybersecurite": "Annule pertes de données et risques de piratage",
    "maintenance-preventive": "Annule pannes machines + réduit les amortissements de 1 000 €/trim",
    // Service
    "affacturage": "Convertit toutes vos créances en trésorerie immédiate",
    "relance-clients": "Avance d'un trimestre le paiement de toutes vos créances",
    // Optimisation coûts
    "optimisation-lean": "Réduit le coût des marchandises vendues de 1 000 €/trim",
    "sous-traitance": "Ajoute 2 000 € de stocks produits chaque trimestre",
    // Tactique ponctuelle
    "achat-urgence": "Déblocage immédiat de 5 000 € de stocks",
    "remboursement-anticipe": "Solde l'emprunt et supprime les intérêts récurrents",
    "revision-generale": "Prolonge la durée de vie des immobilisations",
    // Formation : client grand compte immédiat (one-shot, pas récurrent)
    "formation": "Décroche immédiatement 1 client Grand Compte ce trimestre",
};
/** Taux d'agios sur le découvert bancaire (10%/trimestre) */
exports.TAUX_AGIOS = 0.10;
/** Nom exact de la ligne immobilisation cible pour les nouveaux investissements */
exports.NOM_IMMOBILISATIONS_AUTRES = "Autres Immobilisations";
/** Amortissement comptable d'une immobilisation par trimestre (1 000€) */
exports.AMORTISSEMENT_PAR_BIEN = 1000;
/** Score de crédit minimum pour obtenir un emprunt au taux standard */
exports.SCORE_SEUIL_STANDARD = 65;
/** Score de crédit minimum pour obtenir un emprunt au taux majoré */
exports.SCORE_SEUIL_MAJORE = 50;
//# sourceMappingURL=types.js.map