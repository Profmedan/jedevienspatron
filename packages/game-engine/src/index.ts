// ============================================================
// JEDEVIENSPATRON — Point d'entrée du package game-engine
// ============================================================
// API PUBLIQUE EXPLICITE
// Les fonctions internes (calculerInterets, verifierFaillite, etc.) gardent
// leur mot-clé `export` pour les imports cross-fichiers DANS le package,
// mais ne sont PAS ré-exportées ici → elles n'apparaissent pas dans
// l'API consommée par apps/web.
// ============================================================

// Types et constantes : tout est public
export * from "./types";

// Calculateurs — sous-ensemble public
export {
  getTotalActif,
  getTotalPassif,
  getTresorerie,
  getTotalCharges,
  getTotalProduits,
  getResultatNet,
  calculerIndicateurs,
  calculerSIG,
  calculerSIGSimplifie,
  calculerScore,
  type SIGSimplifie,
  type SIG,
} from "./calculators";

// Moteur — sous-ensemble public
export {
  initialiserJeu,
  avancerEtape,
  appliquerEtape0,
  appliquerAchatMarchandises,
  appliquerAvancementCreances,
  appliquerPaiementCommerciaux,
  appliquerCarteClient,
  appliquerEffetsRecurrents,
  appliquerSpecialiteEntreprise,
  genererClientsSpecialite,
  genererClientsParCommerciaux,
  tirerCartesDecision,
  acheterCarteDecision,
  investirCartePersonnelle,
  licencierCommercial,
  vendreImmobilisation,
  appliquerCarteEvenement,
  verifierFinTour,
  cloturerAnnee,
  obtenirCarteRecrutement,
  demanderEmprunt,
  calculerCapaciteLogistique,
  verifierEquilibreComptable,
  type ResultatFinTour,
} from "./engine";

// Données
export { ENTREPRISES, ENTREPRISE_INDEX } from "./data/entreprises";
export { CARTES_DECISION, CARTES_CLIENTS, CARTES_EVENEMENTS, CARTES_COMMERCIAUX } from "./data/cartes";
