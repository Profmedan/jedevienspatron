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
export { DefiDirigeantScreen } from "./DefiDirigeantScreen";
export { SetupScreen, type PlayerSetup } from "./SetupScreen";
export { CompanyIntro } from "./CompanyIntro";
export { JournalReplay } from "./JournalReplay";
export { default as ModalEtape } from "./ModalEtape";
export { default as QCMEtape } from "./QCMEtape";

// Utilitaires
export {
  getSens,
  nomCompte,
  getDocument,
  getPosteValue,
  applyDeltaToJoueur,
  analyserSituationFinanciere,
  getPaletteTonalite,
  ACTIF_KEYS,
  PASSIF_KEYS,
  CHARGES_KEYS,
  PRODUITS_KEYS,
  type SensEcriture,
  type DocumentInfo,
  type MessageAnalyse,
  type TonaliteDefi,
  type PaletteTonalite,
} from "./utils";
