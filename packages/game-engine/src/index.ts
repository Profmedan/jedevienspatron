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
  appliquerClotureTrimestre,
  basculerTresorerieSiNegative,
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

// ─── DÉFIS DU DIRIGEANT (Tâche 24, Vague 1) ─────────────────
// Calibrage des montants (respecte l'échelle du jeu — cf. L43).
export {
  arrondirJeu,
  montantUnites,
  montantChargeFixe,
  montantTresorerieCritique,
} from "./calibrage";

// Orchestration des défis (logique pure, sans catalogue).
export {
  piocherDefi,
  appliquerChoixDefi,
  resoudreConsequencesDifferees,
  formatContexte,
  type ResultatChoixDefi,
  type ResolutionEffetsDifferes,
} from "./defis";

// Mini-catalogue V2 (démo Vague 2 — 4 défis sur 6 trimestres).
export { CATALOGUE_V2, CATALOGUE_V2_INDEX } from "./data/defis/catalogue-v2";

// Timing dramaturgique (V2 minimaliste).
export { determinerTimingRupture, determinerSlotsActifs } from "./timing";
