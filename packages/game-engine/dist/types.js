"use strict";
// ============================================================
// JEDEVIENSPATRON — Types TypeScript du moteur de jeu
// Extraits fidèlement de JEDEVIENSPATRON_v2.html — Pierre Médan
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONTANTS_EMPRUNT = exports.TAUX_INTERET_MAJORE = exports.TAUX_INTERET_ANNUEL = exports.CAPACITE_IMMOBILISATION_PAR_ENTREPRISE = exports.CAPACITE_IMMOBILISATION = exports.CAPACITE_BASE = exports.SCORE_MULTIPLICATEUR_IMMO = exports.SCORE_MULTIPLICATEUR_RESULTAT = exports.NB_TOURS_MAX = exports.NB_TOURS_PAR_AN = exports.INTERET_EMPRUNT_FREQUENCE = exports.REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR = exports.REMBOURSEMENT_EMPRUNT_PAR_TOUR = exports.CHARGES_FIXES_PAR_TOUR = exports.DECOUVERT_MAX = void 0;
// ─── CONSTANTES ───────────────────────────────────────────────
exports.DECOUVERT_MAX = 8; // Seuil de faillite : découvert bancaire > 8 → cessation de paiement
exports.CHARGES_FIXES_PAR_TOUR = 2; // Services extérieurs +2, Tréso -2
exports.REMBOURSEMENT_EMPRUNT_PAR_TOUR = 1;
/** Maximum de découvert remboursable par trimestre (progressif) */
exports.REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR = 2;
/** Fréquence des intérêts d'emprunt : tous les NB_TOURS_PAR_AN tours (= annuel) */
exports.INTERET_EMPRUNT_FREQUENCE = 4; // Q1 de chaque année
exports.NB_TOURS_PAR_AN = 4;
exports.NB_TOURS_MAX = 12; // Valeur par défaut — configurable à 6, 8 ou 12 à l'initialisation
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
//# sourceMappingURL=types.js.map