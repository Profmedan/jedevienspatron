"use strict";
// ============================================================
// JEDEVIENSPATRON — Point d'entrée du package game-engine
// ============================================================
// API PUBLIQUE EXPLICITE
// Les fonctions internes (calculerInterets, verifierFaillite, etc.) gardent
// leur mot-clé `export` pour les imports cross-fichiers DANS le package,
// mais ne sont PAS ré-exportées ici → elles n'apparaissent pas dans
// l'API consommée par apps/web.
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.piocherDefi = exports.montantTresorerieCritique = exports.montantChargeFixe = exports.montantUnites = exports.arrondirJeu = exports.CARTES_COMMERCIAUX = exports.CARTES_EVENEMENTS = exports.CARTES_CLIENTS = exports.CARTES_DECISION = exports.ENTREPRISE_INDEX = exports.ENTREPRISES = exports.verifierEquilibreComptable = exports.calculerCapaciteLogistique = exports.demanderEmprunt = exports.obtenirCarteRecrutement = exports.cloturerAnnee = exports.verifierFinTour = exports.appliquerCarteEvenement = exports.vendreImmobilisation = exports.licencierCommercial = exports.investirCartePersonnelle = exports.acheterCarteDecision = exports.tirerCartesDecision = exports.genererClientsDepuisFlux = exports.getModeleValeurEntreprise = exports.genererClientsParCommerciaux = exports.genererClientsSpecialite = exports.basculerTresorerieSiNegative = exports.finaliserClotureExercice = exports.appliquerClotureExercice = exports.appliquerClotureTrimestre = exports.appliquerSpecialiteEntreprise = exports.appliquerEffetsRecurrents = exports.appliquerCarteClient = exports.appliquerPaiementCommerciaux = exports.appliquerAvancementCreances = exports.appliquerAchatMarchandises = exports.appliquerEtape0 = exports.avancerEtape = exports.initialiserJeu = exports.calculerScore = exports.calculerSIGSimplifie = exports.calculerSIG = exports.calculerIndicateurs = exports.getResultatNet = exports.getTotalProduits = exports.getTotalCharges = exports.getTresorerie = exports.getTotalPassif = exports.getTotalActif = void 0;
exports.estFinExercice = exports.determinerSlotsActifs = exports.determinerTimingRupture = exports.CATALOGUE_V2_INDEX = exports.CATALOGUE_V2 = exports.formatContexte = exports.resoudreConsequencesDifferees = exports.appliquerChoixDefi = void 0;
// Types et constantes : tout est public
__exportStar(require("./types"), exports);
// Calculateurs — sous-ensemble public
var calculators_1 = require("./calculators");
Object.defineProperty(exports, "getTotalActif", { enumerable: true, get: function () { return calculators_1.getTotalActif; } });
Object.defineProperty(exports, "getTotalPassif", { enumerable: true, get: function () { return calculators_1.getTotalPassif; } });
Object.defineProperty(exports, "getTresorerie", { enumerable: true, get: function () { return calculators_1.getTresorerie; } });
Object.defineProperty(exports, "getTotalCharges", { enumerable: true, get: function () { return calculators_1.getTotalCharges; } });
Object.defineProperty(exports, "getTotalProduits", { enumerable: true, get: function () { return calculators_1.getTotalProduits; } });
Object.defineProperty(exports, "getResultatNet", { enumerable: true, get: function () { return calculators_1.getResultatNet; } });
Object.defineProperty(exports, "calculerIndicateurs", { enumerable: true, get: function () { return calculators_1.calculerIndicateurs; } });
Object.defineProperty(exports, "calculerSIG", { enumerable: true, get: function () { return calculators_1.calculerSIG; } });
Object.defineProperty(exports, "calculerSIGSimplifie", { enumerable: true, get: function () { return calculators_1.calculerSIGSimplifie; } });
Object.defineProperty(exports, "calculerScore", { enumerable: true, get: function () { return calculators_1.calculerScore; } });
// Moteur — sous-ensemble public
var engine_1 = require("./engine");
Object.defineProperty(exports, "initialiserJeu", { enumerable: true, get: function () { return engine_1.initialiserJeu; } });
Object.defineProperty(exports, "avancerEtape", { enumerable: true, get: function () { return engine_1.avancerEtape; } });
Object.defineProperty(exports, "appliquerEtape0", { enumerable: true, get: function () { return engine_1.appliquerEtape0; } });
Object.defineProperty(exports, "appliquerAchatMarchandises", { enumerable: true, get: function () { return engine_1.appliquerAchatMarchandises; } });
Object.defineProperty(exports, "appliquerAvancementCreances", { enumerable: true, get: function () { return engine_1.appliquerAvancementCreances; } });
Object.defineProperty(exports, "appliquerPaiementCommerciaux", { enumerable: true, get: function () { return engine_1.appliquerPaiementCommerciaux; } });
Object.defineProperty(exports, "appliquerCarteClient", { enumerable: true, get: function () { return engine_1.appliquerCarteClient; } });
Object.defineProperty(exports, "appliquerEffetsRecurrents", { enumerable: true, get: function () { return engine_1.appliquerEffetsRecurrents; } });
Object.defineProperty(exports, "appliquerSpecialiteEntreprise", { enumerable: true, get: function () { return engine_1.appliquerSpecialiteEntreprise; } });
Object.defineProperty(exports, "appliquerClotureTrimestre", { enumerable: true, get: function () { return engine_1.appliquerClotureTrimestre; } });
Object.defineProperty(exports, "appliquerClotureExercice", { enumerable: true, get: function () { return engine_1.appliquerClotureExercice; } });
Object.defineProperty(exports, "finaliserClotureExercice", { enumerable: true, get: function () { return engine_1.finaliserClotureExercice; } });
Object.defineProperty(exports, "basculerTresorerieSiNegative", { enumerable: true, get: function () { return engine_1.basculerTresorerieSiNegative; } });
Object.defineProperty(exports, "genererClientsSpecialite", { enumerable: true, get: function () { return engine_1.genererClientsSpecialite; } });
Object.defineProperty(exports, "genererClientsParCommerciaux", { enumerable: true, get: function () { return engine_1.genererClientsParCommerciaux; } });
Object.defineProperty(exports, "getModeleValeurEntreprise", { enumerable: true, get: function () { return engine_1.getModeleValeurEntreprise; } });
Object.defineProperty(exports, "genererClientsDepuisFlux", { enumerable: true, get: function () { return engine_1.genererClientsDepuisFlux; } });
Object.defineProperty(exports, "tirerCartesDecision", { enumerable: true, get: function () { return engine_1.tirerCartesDecision; } });
Object.defineProperty(exports, "acheterCarteDecision", { enumerable: true, get: function () { return engine_1.acheterCarteDecision; } });
Object.defineProperty(exports, "investirCartePersonnelle", { enumerable: true, get: function () { return engine_1.investirCartePersonnelle; } });
Object.defineProperty(exports, "licencierCommercial", { enumerable: true, get: function () { return engine_1.licencierCommercial; } });
Object.defineProperty(exports, "vendreImmobilisation", { enumerable: true, get: function () { return engine_1.vendreImmobilisation; } });
Object.defineProperty(exports, "appliquerCarteEvenement", { enumerable: true, get: function () { return engine_1.appliquerCarteEvenement; } });
Object.defineProperty(exports, "verifierFinTour", { enumerable: true, get: function () { return engine_1.verifierFinTour; } });
Object.defineProperty(exports, "cloturerAnnee", { enumerable: true, get: function () { return engine_1.cloturerAnnee; } });
Object.defineProperty(exports, "obtenirCarteRecrutement", { enumerable: true, get: function () { return engine_1.obtenirCarteRecrutement; } });
Object.defineProperty(exports, "demanderEmprunt", { enumerable: true, get: function () { return engine_1.demanderEmprunt; } });
Object.defineProperty(exports, "calculerCapaciteLogistique", { enumerable: true, get: function () { return engine_1.calculerCapaciteLogistique; } });
Object.defineProperty(exports, "verifierEquilibreComptable", { enumerable: true, get: function () { return engine_1.verifierEquilibreComptable; } });
// Données
var entreprises_1 = require("./data/entreprises");
Object.defineProperty(exports, "ENTREPRISES", { enumerable: true, get: function () { return entreprises_1.ENTREPRISES; } });
Object.defineProperty(exports, "ENTREPRISE_INDEX", { enumerable: true, get: function () { return entreprises_1.ENTREPRISE_INDEX; } });
var cartes_1 = require("./data/cartes");
Object.defineProperty(exports, "CARTES_DECISION", { enumerable: true, get: function () { return cartes_1.CARTES_DECISION; } });
Object.defineProperty(exports, "CARTES_CLIENTS", { enumerable: true, get: function () { return cartes_1.CARTES_CLIENTS; } });
Object.defineProperty(exports, "CARTES_EVENEMENTS", { enumerable: true, get: function () { return cartes_1.CARTES_EVENEMENTS; } });
Object.defineProperty(exports, "CARTES_COMMERCIAUX", { enumerable: true, get: function () { return cartes_1.CARTES_COMMERCIAUX; } });
// ─── DÉFIS DU DIRIGEANT (Tâche 24, Vague 1) ─────────────────
// Calibrage des montants (respecte l'échelle du jeu — cf. L43).
var calibrage_1 = require("./calibrage");
Object.defineProperty(exports, "arrondirJeu", { enumerable: true, get: function () { return calibrage_1.arrondirJeu; } });
Object.defineProperty(exports, "montantUnites", { enumerable: true, get: function () { return calibrage_1.montantUnites; } });
Object.defineProperty(exports, "montantChargeFixe", { enumerable: true, get: function () { return calibrage_1.montantChargeFixe; } });
Object.defineProperty(exports, "montantTresorerieCritique", { enumerable: true, get: function () { return calibrage_1.montantTresorerieCritique; } });
// Orchestration des défis (logique pure, sans catalogue).
var defis_1 = require("./defis");
Object.defineProperty(exports, "piocherDefi", { enumerable: true, get: function () { return defis_1.piocherDefi; } });
Object.defineProperty(exports, "appliquerChoixDefi", { enumerable: true, get: function () { return defis_1.appliquerChoixDefi; } });
Object.defineProperty(exports, "resoudreConsequencesDifferees", { enumerable: true, get: function () { return defis_1.resoudreConsequencesDifferees; } });
Object.defineProperty(exports, "formatContexte", { enumerable: true, get: function () { return defis_1.formatContexte; } });
// Mini-catalogue V2 (démo Vague 2 — 4 défis sur 6 trimestres).
var catalogue_v2_1 = require("./data/defis/catalogue-v2");
Object.defineProperty(exports, "CATALOGUE_V2", { enumerable: true, get: function () { return catalogue_v2_1.CATALOGUE_V2; } });
Object.defineProperty(exports, "CATALOGUE_V2_INDEX", { enumerable: true, get: function () { return catalogue_v2_1.CATALOGUE_V2_INDEX; } });
// Timing dramaturgique (V2 minimaliste).
var timing_1 = require("./timing");
Object.defineProperty(exports, "determinerTimingRupture", { enumerable: true, get: function () { return timing_1.determinerTimingRupture; } });
Object.defineProperty(exports, "determinerSlotsActifs", { enumerable: true, get: function () { return timing_1.determinerSlotsActifs; } });
Object.defineProperty(exports, "estFinExercice", { enumerable: true, get: function () { return timing_1.estFinExercice; } });
//# sourceMappingURL=index.js.map