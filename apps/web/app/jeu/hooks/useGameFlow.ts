"use client";

import { useState, useEffect, useMemo, useReducer } from "react";
import {
  EtatJeu, Joueur, CarteDecision, ResultatDemandePret, MONTANTS_EMPRUNT, TrimSnapshot, EntrepriseTemplate,
  initialiserJeu, avancerEtape, appliquerAchatMarchandises,
  appliquerAvancementCreances, appliquerPaiementCommerciaux, appliquerCarteClient,
  appliquerClotureTrimestre, genererClientsSpecialite,
  tirerCartesDecision, acheterCarteDecision, investirCartePersonnelle, licencierCommercial, vendreImmobilisation,
  appliquerCarteEvenement, verifierFinTour, cloturerAnnee, genererClientsParCommerciaux,
  obtenirCarteRecrutement, demanderEmprunt, ResultatFinTour, calculerCapaciteLogistique,
} from "@jedevienspatron/game-engine";
import {
  type PlayerSetup, type ActiveStep,
  getSens, getPosteValue, applyDeltaToJoueur,
} from "@/components/jeu";
import { tirerQuestionsTrimestriel, QuestionQCM } from "@/lib/game-engine/data/pedagogie";
import { activeStepReducer, type ActiveStepAction } from "./useActiveStepReducer";
import { ETAPE_INFO, cloneEtat, buildActiveStep, buildTrimSnapshot, buildLiveState, type ModificationMoteur } from "./gameFlowUtils";
import { usePedagogyFlow } from "./usePedagogyFlow";
import { useLoansFlow } from "./useLoansFlow";
import { useAchatFlow } from "./useAchatFlow";
import { useRealisationFlow } from "./useRealisationFlow";
import { useDecisionCards } from "./useDecisionCards";

// ─── Types ─────────────────────────────────────────────────────────────────

export type Phase = "setup" | "intro" | "playing" | "gameover";

export interface JournalEntry {
  id: number;
  tour: number;
  etape: number;
  joueurNom: string;
  titre: string;
  entries: Array<{ poste: string; delta: number; applied?: boolean }>;
  principe: string;
  /**
   * Snapshot deep-cloné du joueur APRÈS application complète de cette étape.
   * Permet d'afficher un Bilan/CR fidèle à la réalité historique en mode
   * relecture (read-only). Cf. L40.
   */
  joueurSnapshot: Joueur;
}

// Re-export pour rétrocompatibilité (page.tsx importe ETAPE_INFO depuis ici)
export { ETAPE_INFO };

// ─── Paramètres du hook ────────────────────────────────────────────────────

interface UseGameFlowParams {
  /** Phase et état partagés avec useGamePersistence (vivent dans page.tsx) */
  phase: Phase;
  setPhase: (p: Phase) => void;
  etat: EtatJeu | null;
  setEtat: (e: EtatJeu | null) => void;
  /** Setters UI nécessaires pour les cross-cutting effects */
  modeRapide: boolean;
  setActiveTab: (tab: "bilan" | "cr" | "indicateurs" | "glossaire" | "vue-ensemble" | "impact") => void;
  setHighlightedPoste: (v: string | null) => void;
  setFlashData: (v: { poste: string; avant: number; apres: number } | null) => void;
  /** Crée une session solo (consomme 1 crédit) — depuis useGamePersistence */
  createSoloSession: (nbTours: number) => Promise<boolean>;
  /** room_code de la session (null si solo sans code) — pour le heartbeat */
  roomCode: string | null;
  /** Templates d'entreprises personnalisées (chargées depuis la session) */
  customTemplates?: EntrepriseTemplate[] | null;
}

// ─── Retour du hook ────────────────────────────────────────────────────────

interface UseGameFlowReturn {
  activeStep: ActiveStep | null;
  setActiveStep: (s: ActiveStep | null) => void;
  journal: JournalEntry[];
  setJournal: (j: JournalEntry[]) => void;
  recentModifications: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>;
  setRecentModifications: (m: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>) => void;
  effectiveRecentMods: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>;
  /** Snapshots trimestriels accumulés pendant la partie (rapport pédagogique) */
  snapshots: TrimSnapshot[];
  achatQte: number;
  setAchatQte: (v: number) => void;
  achatMode: "tresorerie" | "dettes";
  setAchatMode: (v: "tresorerie" | "dettes") => void;
  realisationQte: number;
  setRealisationQte: (v: number) => void;
  realisationMode: "tresorerie" | "dettes";
  setRealisationMode: (v: "tresorerie" | "dettes") => void;
  selectedDecision: CarteDecision | null;
  setSelectedDecision: (v: CarteDecision | null) => void;
  showCartes: boolean;
  tourTransition: { from: number; to: number } | null;
  setTourTransition: (v: { from: number; to: number } | null) => void;
  failliteInfo: { joueurNom: string; raison: string } | null;
  setFailliteInfo: (v: { joueurNom: string; raison: string } | null) => void;
  decisionError: string | null;
  subEtapeDecision: "recrutement" | "investissement";
  etapesPedagoVues: Set<number>;
  setEtapesPedagoVues: (v: Set<number>) => void;
  modalEtapeEnAttente: number | null;
  setModalEtapeEnAttente: (v: number | null) => void;
  qcmTrimestreQuestions: QuestionQCM[] | undefined;
  setQcmTrimestreQuestions: (v: QuestionQCM[] | undefined) => void;
  qcmTrimestreScore: number | undefined;
  setQcmTrimestreScore: (v: number | undefined) => void;
  showDemandeEmprunt: boolean;
  setShowDemandeEmprunt: (v: boolean) => void;
  montantEmpruntChoisi: number;
  setMontantEmpruntChoisi: (v: number) => void;
  reponseEmprunt: ResultatDemandePret | null;
  setReponseEmprunt: (v: ResultatDemandePret | null) => void;

  // ─ Derived / computed ─
  getDisplayJoueur: () => import("@jedevienspatron/game-engine").Joueur | null;
  cartesDisponibles: CarteDecision[];
  cartesRecrutement: CarteDecision[];

  // ─ Actions ─
  handleStart: (
    players: PlayerSetup[],
    nbTours?: number,
    adHocTemplates?: EntrepriseTemplate[],
  ) => Promise<void>;
  applyEntry: (entryId: string) => void;
  applySaleGroup: (saleGroupId: string) => void;
  confirmActiveStep: () => void;
  launchStep: () => void;
  handleApplyEntry: (poste: string) => void;
  handleQCMTermine: (score: number) => void;
  handleDemanderEmprunt: () => void;
  launchAchat: () => void;
  skipAchat: () => void;
  launchRealisation: () => void;
  skipRealisation: () => void;
  realisationError: string | null;
  launchDecision: (carteArg?: CarteDecision) => void;
  skipDecision: () => void;
  handleInvestirPersonnel: (carteId: string) => void;
  handleVendreImmobilisation: (nomImmo: string, prixCession: number) => void;
  handleLicencierCommercial: (carteId: string) => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useGameFlow({
  phase, setPhase, etat, setEtat,
  modeRapide,
  setActiveTab,
  setHighlightedPoste,
  setFlashData,
  createSoloSession,
  roomCode,
  customTemplates,
}: UseGameFlowParams): UseGameFlowReturn {

  // ─ État de base ────────────────────────────────────────────────────────────
  const [activeStep, dispatchActiveStep] = useReducer(activeStepReducer, null);
  const [journal, setJournal]             = useState<JournalEntry[]>([]);
  const [recentModifications, setRecentModifications] = useState<Array<{
    poste: string; ancienneValeur: number; nouvelleValeur: number;
  }>>([]);
  const [tourTransition, setTourTransition] = useState<{ from: number; to: number } | null>(null);
  const [failliteInfo, setFailliteInfo]   = useState<{ joueurNom: string; raison: string } | null>(null);
  /** Snapshots trimestriels pour le rapport pédagogique post-session */
  const [snapshots, setSnapshots]         = useState<TrimSnapshot[]>([]);
  /** Label de la dernière décision prise ce trimestre (reset à chaque tour) */
  const [lastDecisionLabel, setLastDecisionLabel] = useState<string | null>(null);

  // Wrapper setActiveStep → dispatch (API publique stable)
  function setActiveStep(s: ActiveStep | null) {
    dispatchActiveStep({ type: "SET_STEP", step: s });
  }

  // ─ Sous-hooks ──────────────────────────────────────────────────────────────
  // Note : les déclarations de fonctions (addToJournal, etc.) sont hoistées
  // donc disponibles comme arguments ici même si déclarées plus bas.

  const pedagogy = usePedagogyFlow({ etat, setEtat });

  const loans = useLoansFlow({
    etat, setEtat,
    setRecentModifications,
    addToJournal,
    setActiveTab, setHighlightedPoste, setFlashData,
  });

  const achat = useAchatFlow({
    etat, setEtat,
    setRecentModifications,
    setActiveStep,
    maybeShowPedagoModal: pedagogy.maybeShowPedagoModal,
  });

  const realisation = useRealisationFlow({
    etat, setEtat,
    setRecentModifications,
    setActiveStep,
    maybeShowPedagoModal: pedagogy.maybeShowPedagoModal,
  });

  const decisions = useDecisionCards({
    etat, setEtat,
    setRecentModifications,
    setActiveStep,
    activeStep,
    maybeShowPedagoModal: pedagogy.maybeShowPedagoModal,
  });

  // ── Affichage progressif des badges avant/après ─────────────────────────
  // Filtrage par INDEX (pas par poste) — L29
  const effectiveRecentMods = useMemo(() => {
    if (!activeStep) return recentModifications;
    return recentModifications.filter((_, i) => activeStep.entries[i]?.applied === true);
  }, [activeStep, recentModifications]);

  // ─ Journal ────────────────────────────────────────────────────────────────
  function addToJournal(e: EtatJeu, entries: ActiveStep["entries"], etape: number) {
    const info = ETAPE_INFO[etape];
    // Snapshot deep-cloné du joueur au moment où l'étape est validée —
    // indispensable au mode relecture read-only (L40).
    const joueurSnapshot: Joueur = structuredClone(e.joueurs[e.joueurActif]);
    setJournal(prev => [{
      id: prev.length + 1,
      tour: e.tourActuel,
      etape,
      joueurNom: e.joueurs[e.joueurActif].pseudo,
      titre: info?.titre ?? `Étape ${etape}`,
      entries,
      principe: info?.principe ?? "",
      joueurSnapshot,
    }, ...prev.slice(0, 29)]);
  }

  // ─ Joueur affiché (avec écritures partiellement appliquées) ───────────────
  function getDisplayJoueur() {
    if (!etat) return null;
    if (!activeStep) return etat.joueurs[etat.joueurActif];
    const cloned = cloneEtat(activeStep.baseEtat);
    const j = cloned.joueurs[etat.joueurActif];
    for (const entry of activeStep.entries.filter(e => e.applied)) {
      applyDeltaToJoueur(j, entry.poste, entry.delta);
    }
    return j;
  }

  // ─ Auto-switch onglet + surlignage au clic sur une écriture ──────────────
  function handleApplyEntry(poste: string) {
    const mod = recentModifications.find((m) => m.poste === poste);
    if (mod) {
      setFlashData({ poste, avant: mod.ancienneValeur, apres: mod.nouvelleValeur });
    }
    setHighlightedPoste(poste);
    setTimeout(() => setHighlightedPoste(null), 4000);
  }

  // ─ Démarrer une partie ────────────────────────────────────────────────────
  async function handleStart(
    players: PlayerSetup[],
    nbTours: number = 6,
    adHocTemplates?: EntrepriseTemplate[],
  ) {
    const ok = await createSoloSession(nbTours);
    if (!ok) return;

    // Fusion : formateur (customTemplates) + joueur (adHocTemplates)
    const mergedTemplates: EntrepriseTemplate[] = [
      ...(customTemplates ?? []),
      ...(adHocTemplates ?? []),
    ];

    const joueursDefs = players.map(p => ({ pseudo: p.pseudo, nomEntreprise: p.entreprise }));
    setEtat(initialiserJeu(joueursDefs, nbTours, mergedTemplates.length > 0 ? mergedTemplates : undefined));
    setPhase("intro");
  }

  // ─ Appliquer une écriture (côté UI) ─────────────────────────────────────
  function applyEntry(entryId: string) {
    dispatchActiveStep({ type: "APPLY_ENTRY", entryId });
  }

  // ─ Appliquer un groupe de vente ATOMIQUEMENT ─────────────────────────────
  function applySaleGroup(saleGroupId: string) {
    dispatchActiveStep({ type: "APPLY_SALE_GROUP", saleGroupId });
  }

  // ─ Valider l'étape (toutes écritures cochées + bilan équilibré) ──────────
  function confirmActiveStep() {
    if (!activeStep || !etat) return;
    const next = activeStep.previewEtat;
    addToJournal(next, activeStep.entries, next.etapeTour);
    const etapeAvantAvancement = next.etapeTour;

    // B9 étape 5 DECISION — sous-phase 5a (recrutement) → 5b (investissement)
    // sans avancer à l'étape 6.
    if (etapeAvantAvancement === 5 && decisions.subEtapeDecision === "recrutement") {
      // Capturer le label de la carte recrutée pour le snapshot trimestriel
      if (decisions.selectedDecision) {
        setLastDecisionLabel(decisions.selectedDecision.titre);
      }
      decisions.setSubEtapeDecision("investissement");
      setEtat({ ...next });
      setActiveStep(null);
      setRecentModifications([]);
      decisions.setSelectedDecision(null);
      return;
    }

    // 5b (investissement) → retour au panneau unifié (L33 : multi-investissements)
    if (etapeAvantAvancement === 5 && decisions.subEtapeDecision === "investissement") {
      // Capturer le label de la carte investie pour le snapshot trimestriel
      if (decisions.selectedDecision) {
        setLastDecisionLabel(decisions.selectedDecision.titre);
      }
      setEtat({ ...next });
      setActiveStep(null);
      setRecentModifications([]);
      decisions.setSelectedDecision(null);
      return;
    }

    // B9 étape 7 CLOTURE_BILAN — fusion côté UI : après validation des
    // écritures de clôture, enchaîner directement la seconde passe
    // (verifierFinTour + transition fin de tour) sans avancer d'étape,
    // car c'est la dernière. Le moteur applique donc ses deux passes
    // séquentielles à l'intérieur de la même étape 7 visible.
    if (etapeAvantAvancement === 7) {
      const fin = verifierFinTour(next, next.joueurActif);
      confirmEndOfTurn(next, fin);
      return;
    }

    avancerEtape(next);
    pedagogy.maybeShowPedagoModal(next.etapeTour);
    setEtat({ ...next });
    setActiveStep(null);
    setRecentModifications([]);
    if (etapeAvantAvancement === 5) decisions.setSubEtapeDecision("recrutement");
  }

  // ─ Lancer la prévisualisation d'une étape automatique ────────────────────
  function launchStep() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const idx = next.joueurActif;
    let mods: ModificationMoteur[] = [];
    let evenementCapture: { titre: string; icone?: string; description: string } | undefined;

    // Début de trimestre = étape 0 (ENCAISSEMENTS, B9) : on remet à zéro
    // le compteur de clients perdus accumulés au trimestre précédent.
    if (next.etapeTour === 0) {
      next.joueurs[idx].clientsPerdusCeTour = 0;
    }

    // Switch B9 — cycle 0..7
    //   0 ENCAISSEMENTS · 1 DEVELOPPEMENT_COMMERCIAL · 2 RESSOURCES_PREPARATION (user-driven, pas de case)
    //   3 REALISATION_METIER (polymorphe B9-D, auto-skip V1 via modsFiltrees vide)
    //   4 FACTURATION_VENTES · 5 DECISION (user-driven, pas de case) · 6 EVENEMENT
    //   7 CLOTURE_BILAN (deux passes moteur : appliquerClotureTrimestre puis verifierFinTour)
    switch (next.etapeTour) {
      case 0: { const r = appliquerAvancementCreances(next, idx); if (r.succes) mods = r.modifications as ModificationMoteur[]; break; }
      case 1: {
        const clients = genererClientsParCommerciaux(next.joueurs[idx]);
        const clientsSpecialite = genererClientsSpecialite(next.joueurs[idx]);
        next.joueurs[idx].clientsATrait = [...next.joueurs[idx].clientsATrait, ...clients, ...clientsSpecialite];
        const r = appliquerPaiementCommerciaux(next, idx);
        if (r.succes) mods = r.modifications as ModificationMoteur[];
        break;
      }
      // case 3 REALISATION_METIER : auto-skip en V1 (aucune modification → géré par la
      // condition skip-auto plus bas). La polymorphie par modeEconomique arrive en B9-D.
      case 4: {
        // B9 FACTURATION_VENTES — traitement des cartes Client (était le case 3 en T25.C)
        const joueur = next.joueurs[idx];
        const capacite = calculerCapaciteLogistique(joueur);
        const clientsAtrait = joueur.clientsATrait;
        let clientsPerdusPrise = 0;

        clientsAtrait.sort((a, b) => {
          const rentabilitéA = b.delaiPaiement - a.delaiPaiement;
          if (rentabilitéA !== 0) return rentabilitéA;
          return b.montantVentes - a.montantVentes;
        });

        const clientsTraites = clientsAtrait.slice(0, capacite);
        const clientsPerdus = clientsAtrait.slice(capacite);

        for (let si = 0; si < clientsTraites.length; si++) {
          const r = appliquerCarteClient(next, idx, clientsTraites[si], si);
          if (r.succes) mods = [...mods, ...(r.modifications as ModificationMoteur[])];
        }

        clientsPerdusPrise = clientsPerdus.length;
        joueur.clientsPerdusCeTour = clientsPerdusPrise;
        joueur.clientsATrait = [];

        if (clientsPerdusPrise > 0) {
          mods.push({
            joueurId: joueur.id,
            poste: "ventes",
            ancienneValeur: 0,
            nouvelleValeur: 0,
            explication: `⚠️ Capacité logistique dépassée ! ${clientsPerdusPrise} client(s) perdu(s) faute de capacité (max ${capacite}, ${clientsAtrait.length} en attente).`,
          });
        }
        break;
      }
      case 6: {
        // B9 EVENEMENT (était le case 5 en T25.C)
        if (next.piocheEvenements.length > 0) {
          const carte = next.piocheEvenements[0];
          evenementCapture = { titre: carte.titre, description: carte.description };
          const r = appliquerCarteEvenement(next, idx, carte);
          next.piocheEvenements = next.piocheEvenements.slice(1);
          if (r.succes) mods = r.modifications as ModificationMoteur[];
        }
        break;
      }
      case 7: {
        // B9 CLOTURE_BILAN — première passe : écritures de clôture
        // (charges fixes + amortissements + remboursement emprunt + intérêts T3+
        // + effets récurrents + spécialité entreprise). La seconde passe
        // (verifierFinTour + transition fin de tour) est déclenchée dans
        // confirmActiveStep après validation par l'utilisateur.
        const r = appliquerClotureTrimestre(next, idx);
        if (r.succes) mods = r.modifications as ModificationMoteur[];
        break;
      }
      default: break;
    }

    const etapeActuelle = next.etapeTour;
    const modsFiltrees = mods.filter(m => m.nouvelleValeur !== m.ancienneValeur);
    // Skip auto des étapes sans impact :
    //   - 0 ENCAISSEMENTS si aucune créance ne vient à échéance,
    //   - 1 DEVELOPPEMENT_COMMERCIAL si aucun commercial n'est actif.
    // B9-D : l'étape 3 REALISATION_METIER n'est plus dans la liste —
    // elle est désormais user-driven (comme l'étape 2), avec son propre
    // bloc UI + hook `useRealisationFlow`. Un joueur qui ne veut rien
    // réaliser ce trimestre clique explicitement « Passer ».
    if ((etapeActuelle === 0 || etapeActuelle === 1) && modsFiltrees.length === 0) {
      avancerEtape(next);
      pedagogy.maybeShowPedagoModal(next.etapeTour);
      setEtat({ ...next });
      setActiveStep(null);
      return;
    }

    setRecentModifications(modsFiltrees.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));

    // Étapes éligibles au mode rapide (auto-cochage de toutes les écritures) :
    // toutes celles qui ne demandent aucun input utilisateur.
    //   0 ENCAISSEMENTS · 1 DEVELOPPEMENT_COMMERCIAL · 4 FACTURATION_VENTES
    //   6 EVENEMENT · 7 CLOTURE_BILAN
    // B9-D : étape 3 REALISATION_METIER retirée de la liste — elle est
    // user-driven (stepper quantité) comme l'étape 2 ACHATS_STOCK.
    const AUTO_ETAPES = [0, 1, 4, 6, 7];
    const step = buildActiveStep(etat, mods, next, next.etapeTour, evenementCapture);
    if (modeRapide && AUTO_ETAPES.includes(next.etapeTour)) {
      dispatchActiveStep({ type: "SET_STEP", step });
      dispatchActiveStep({ type: "SET_ALL_ENTRIES_APPLIED" });
    } else {
      dispatchActiveStep({ type: "SET_STEP", step });
    }
  }

  // ─ Fin de tour ────────────────────────────────────────────────────────────
  function confirmEndOfTurn(next: EtatJeu, fin: ResultatFinTour) {
    const idx = next.joueurActif;
    const joueurNom = next.joueurs[idx].pseudo;
    if (fin.enFaillite) next.joueurs[idx].elimine = true;

    // ── Snapshot trimestriel (AVANT transition de tour) ───────────────────
    const snap = buildTrimSnapshot(next, idx, lastDecisionLabel);
    setSnapshots(prev => [...prev, snap]);
    setLastDecisionLabel(null);

    // ── Heartbeat : envoyer le live_state au dashboard formateur ─────────
    if (roomCode) {
      const liveState = buildLiveState(next, idx);
      fetch("/api/sessions/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_code: roomCode,
          guest_name: joueurNom,
          live_state: liveState,
        }),
      }).catch(() => { /* heartbeat non critique — on ignore les erreurs réseau */ });
    }

    const nextJoueurIdx = (idx + 1) % next.nbJoueurs;
    if (nextJoueurIdx === 0) {
      if (next.tourActuel >= next.nbToursMax) {
        setEtat(next);
        if (fin.enFaillite) setFailliteInfo({ joueurNom, raison: fin.raisonFaillite ?? "Situation financière irrécupérable" });
        setPhase("gameover");
        return;
      }
      if (fin.enFaillite) {
        setEtat({ ...next });
        setActiveStep(null);
        decisions.resetDecisionState();
        setFailliteInfo({ joueurNom, raison: fin.raisonFaillite ?? "Situation financière irrécupérable" });
        return;
      }
      const oldTour = next.tourActuel;
      if (oldTour % 4 === 0) cloturerAnnee(next);
      next.tourActuel = oldTour + 1;
      next.etapeTour = 0;
      next.joueurActif = 0;
      pedagogy.maybeShowPedagoModal(0);
      setEtat({ ...next });
      setActiveStep(null);
      decisions.resetDecisionState();
      pedagogy.prepareQCMNouveauTrimestre();
      setTourTransition({ from: oldTour, to: next.tourActuel });
    } else {
      avancerEtape(next);
      next.joueurActif = nextJoueurIdx;
      next.etapeTour = 0;
      pedagogy.maybeShowPedagoModal(0);
      setEtat({ ...next });
      setActiveStep(null);
      decisions.resetDecisionState();
    }
  }

  // ─ Retour ─────────────────────────────────────────────────────────────────
  return {
    // ─ activeStep (géré par reducer)
    activeStep, setActiveStep,

    // ─ État de base
    journal, setJournal,
    recentModifications, setRecentModifications,
    effectiveRecentMods,
    snapshots,
    tourTransition, setTourTransition,
    failliteInfo, setFailliteInfo,

    // ─ Sous-hook : achats (étape 2)
    ...achat,

    // ─ Sous-hook : réalisation métier (étape 3)
    ...realisation,

    // ─ Sous-hook : cartes décision
    selectedDecision: decisions.selectedDecision,
    setSelectedDecision: decisions.setSelectedDecision,
    showCartes: decisions.showCartes,
    decisionError: decisions.decisionError,
    subEtapeDecision: decisions.subEtapeDecision,
    cartesDisponibles: decisions.cartesDisponibles,
    cartesRecrutement: decisions.cartesRecrutement,

    // ─ Sous-hook : pédagogie
    etapesPedagoVues: pedagogy.etapesPedagoVues,
    setEtapesPedagoVues: pedagogy.setEtapesPedagoVues,
    modalEtapeEnAttente: pedagogy.modalEtapeEnAttente,
    setModalEtapeEnAttente: pedagogy.setModalEtapeEnAttente,
    qcmTrimestreQuestions: pedagogy.qcmTrimestreQuestions,
    setQcmTrimestreQuestions: pedagogy.setQcmTrimestreQuestions,
    qcmTrimestreScore: pedagogy.qcmTrimestreScore,
    setQcmTrimestreScore: pedagogy.setQcmTrimestreScore,

    // ─ Sous-hook : emprunts
    showDemandeEmprunt: loans.showDemandeEmprunt,
    setShowDemandeEmprunt: loans.setShowDemandeEmprunt,
    montantEmpruntChoisi: loans.montantEmpruntChoisi,
    setMontantEmpruntChoisi: loans.setMontantEmpruntChoisi,
    reponseEmprunt: loans.reponseEmprunt,
    setReponseEmprunt: loans.setReponseEmprunt,

    // ─ Derived
    getDisplayJoueur,

    // ─ Actions principales
    handleStart,
    applyEntry,
    applySaleGroup,
    confirmActiveStep,
    launchStep,
    handleApplyEntry,

    // ─ Actions sous-hooks
    handleQCMTermine: pedagogy.handleQCMTermine,
    handleDemanderEmprunt: loans.handleDemanderEmprunt,
    launchAchat: achat.launchAchat,
    skipAchat: achat.skipAchat,
    launchRealisation: realisation.launchRealisation,
    skipRealisation: realisation.skipRealisation,
    realisationError: realisation.realisationError,
    launchDecision: decisions.launchDecision,
    skipDecision: decisions.skipDecision,
    handleInvestirPersonnel: decisions.handleInvestirPersonnel,
    handleVendreImmobilisation: decisions.handleVendreImmobilisation,
    handleLicencierCommercial: decisions.handleLicencierCommercial,
  };
}
