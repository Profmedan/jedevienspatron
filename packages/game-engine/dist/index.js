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
exports.CARTES_COMMERCIAUX = exports.CARTES_EVENEMENTS = exports.CARTES_CLIENTS = exports.CARTES_DECISION = exports.ENTREPRISE_INDEX = exports.ENTREPRISES = exports.verifierEquilibreComptable = exports.calculerCapaciteLogistique = exports.demanderEmprunt = exports.obtenirCarteRecrutement = exports.cloturerAnnee = exports.verifierFinTour = exports.appliquerCarteEvenement = exports.vendreImmobilisation = exports.licencierCommercial = exports.investirCartePersonnelle = exports.acheterCarteDecision = exports.tirerCartesDecision = exports.genererClientsParCommerciaux = exports.genererClientsSpecialite = exports.appliquerClotureTrimestre = exports.appliquerSpecialiteEntreprise = exports.appliquerEffetsRecurrents = exports.appliquerCarteClient = exports.appliquerPaiementCommerciaux = exports.appliquerAvancementCreances = exports.appliquerRealisationMetier = exports.appliquerRessourcesPreparation = exports.appliquerAchatMarchandises = exports.appliquerEtape0 = exports.avancerEtape = exports.initialiserJeu = exports.calculerScore = exports.calculerSIGSimplifie = exports.calculerSIG = exports.calculerIndicateurs = exports.getResultatNet = exports.getTotalProduits = exports.getTotalCharges = exports.getTresorerie = exports.getTotalPassif = exports.getTotalActif = void 0;
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
Object.defineProperty(exports, "appliquerRessourcesPreparation", { enumerable: true, get: function () { return engine_1.appliquerRessourcesPreparation; } });
Object.defineProperty(exports, "appliquerRealisationMetier", { enumerable: true, get: function () { return engine_1.appliquerRealisationMetier; } });
Object.defineProperty(exports, "appliquerAvancementCreances", { enumerable: true, get: function () { return engine_1.appliquerAvancementCreances; } });
Object.defineProperty(exports, "appliquerPaiementCommerciaux", { enumerable: true, get: function () { return engine_1.appliquerPaiementCommerciaux; } });
Object.defineProperty(exports, "appliquerCarteClient", { enumerable: true, get: function () { return engine_1.appliquerCarteClient; } });
Object.defineProperty(exports, "appliquerEffetsRecurrents", { enumerable: true, get: function () { return engine_1.appliquerEffetsRecurrents; } });
Object.defineProperty(exports, "appliquerSpecialiteEntreprise", { enumerable: true, get: function () { return engine_1.appliquerSpecialiteEntreprise; } });
Object.defineProperty(exports, "appliquerClotureTrimestre", { enumerable: true, get: function () { return engine_1.appliquerClotureTrimestre; } });
Object.defineProperty(exports, "genererClientsSpecialite", { enumerable: true, get: function () { return engine_1.genererClientsSpecialite; } });
Object.defineProperty(exports, "genererClientsParCommerciaux", { enumerable: true, get: function () { return engine_1.genererClientsParCommerciaux; } });
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
//# sourceMappingURL=index.js.map