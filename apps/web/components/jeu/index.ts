/**
 * Composants refactorisés pour le jeu sérieux
 * Exports publics
 */

export { HeaderJeu } from "./HeaderJeu";
export { LeftPanel } from "./LeftPanel";
export { MainContent } from "./MainContent";
export { EntryPanel, type ActiveStep } from "./EntryPanel";
export { EntryCard, type EntryLine } from "./EntryCard";
export { OverlayTransition } from "./OverlayTransition";
export { OverlayFaillite } from "./OverlayFaillite";
export { SetupScreen, type PlayerSetup } from "./SetupScreen";
export { CompanyIntro } from "./CompanyIntro";

// Utilitaires
export {
  getSens,
  nomCompte,
  getDocument,
  getPosteValue,
  applyDeltaToJoueur,
  analyserSituationFinanciere,
  ACTIF_KEYS,
  PASSIF_KEYS,
  CHARGES_KEYS,
  PRODUITS_KEYS,
  type SensEcriture,
  type DocumentInfo,
  type MessageAnalyse,
} from "./utils";
