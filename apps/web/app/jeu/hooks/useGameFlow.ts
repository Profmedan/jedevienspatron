"use client";

import { useState, useEffect, useMemo, useReducer } from "react";
import {
  EtatJeu, Joueur, CarteDecision, ResultatDemandePret, MONTANTS_EMPRUNT, TrimSnapshot, EntrepriseTemplate, ETAPES,
  initialiserJeu, avancerEtape, appliquerClotureTrimestre, appliquerAchatMarchandises,
  appliquerAvancementCreances, appliquerPaiementCommerciaux, appliquerCarteClient,
  appliquerRealisationMetier,
  genererClientsSpecialite,
  tirerCartesDecision, acheterCarteDecision, investirCartePersonnelle, licencierCommercial, vendreImmobilisation,
  appliquerCarteEvenement, verifierFinTour, genererClientsParCommerciaux,
  obtenirCarteRecrutement, demanderEmprunt, ResultatFinTour, calculerCapaciteLogistique,
  // ─── B6 : fin d'exercice (clôture + ouverture) ─────────────────────
  appliquerClotureExercice, finaliserClotureExercice, estFinExercice,
  // ─── Défis du dirigeant (Tâche 24, Vague 2) ────────────────────────
  determinerSlotsActifs, piocherDefi, appliquerChoixDefi,
  resoudreConsequencesDifferees, formatContexte,
  CATALOGUE_V2,
  type DefiDirigeant, type SlotDramaturgique,
} from "@jedevienspatron/game-engine";
import {
  type PlayerSetup, type ActiveStep,
  getSens, getPosteValue, applyDeltaToJoueur,
} from "@/components/jeu";
import { tirerQuestionsTrimestriel, QuestionQCM } from "@/lib/pedagogie/pedagogie";
import { activeStepReducer, type ActiveStepAction } from "./useActiveStepReducer";
import { ETAPE_INFO, cloneEtat, buildActiveStep, buildTrimSnapshot, buildLiveState, type ModificationMoteur } from "./gameFlowUtils";
import { usePedagogyFlow } from "./usePedagogyFlow";
import { useLoansFlow } from "./useLoansFlow";
import { useAchatFlow } from "./useAchatFlow";
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
  selectedDecision: CarteDecision | null;
  setSelectedDecision: (v: CarteDecision | null) => void;
  showCartes: boolean;
  tourTransition: { from: number; to: number } | null;
  setTourTransition: (v: { from: number; to: number } | null) => void;
  failliteInfo: { joueurNom: string; raison: string } | null;
  setFailliteInfo: (v: { joueurNom: string; raison: string } | null) => void;
  decisionError: string | null;
  subEtape6: "recrutement" | "investissement";
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
  launchDecision: (carteArg?: CarteDecision) => void;
  skipDecision: () => void;
  handleInvestirPersonnel: (carteId: string) => void;
  handleVendreImmobilisation: (nomImmo: string, prixCession: number) => void;
  handleLicencierCommercial: (carteId: string) => void;

  // ─── Défis du dirigeant (Tâche 24, V2) ──────────────────────
  /** Défi actuellement en attente de résolution (null si aucun). */
  defiEnAttente: DefiDirigeant | null;
  /** Contexte narratif du défi, tokens déjà résolus. */
  contexteDefi: string;
  /** Applique le choix du joueur et libère le flow. Appelé par DefiDirigeantScreen. */
  resoudreDefi: (choixId: string | null) => void;

  // ─── B6 : clôture et ouverture d'exercice ────────────────────
  /** Joueur dont la clôture est en attente (null si pas en mode clôture). */
  clotureJoueur: Joueur | null;
  /** Numéro de l'exercice en cours de clôture. */
  clotureNumeroExercice: number;
  /** Premier trimestre de l'exercice à clôturer (inclusif). */
  clotureTourDebut: number;
  /** Dernier trimestre de l'exercice à clôturer (= oldTour). */
  clotureTourFin: number;
  /** Valide la clôture pour le joueur courant avec le % de dividendes choisi. */
  validerClotureExercice: (pctDividendes: number) => void;
  /** Joueur dont on affiche la photo d'ouverture (null si pas en mode ouverture). */
  ouvertureJoueur: Joueur | null;
  /** Numéro de l'exercice qui s'ouvre. */
  ouvertureNumeroExercice: number;
  /** Premier trimestre du nouvel exercice. */
  ouverturePremierTour: number;
  /** Valide l'ouverture et incrémente le tour. */
  validerOuvertureExercice: () => void;
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
  /** ─── Défis du dirigeant (Tâche 24, Vague 2) ─────────────────────
   *  `defiEnAttente` : défi consulté mais non encore résolu — bloque le flow.
   *  `contexteDefi`  : contexte narratif déjà formaté (tokens résolus). */
  const [defiEnAttente, setDefiEnAttente] = useState<DefiDirigeant | null>(null);
  const [contexteDefi, setContexteDefi]   = useState<string>("");
  /**
   * ─── B6 : clôture d'exercice en cours de résolution (bloque le flow) ──
   *
   * Quand `confirmEndOfTurn` détecte une fin d'exercice (T4 / T8 / T12 /
   * nbToursMax), il empile un `ClotureExerciceAttente` qui contient l'état
   * de jeu figé + la liste des joueurs actifs restant à faire choisir leurs
   * dividendes. La modale `ModalClotureExercice` se monte sur ce flag ; à
   * chaque validation par un joueur, on applique `appliquerClotureExercice`
   * et on dépile. Quand `joueursRestants` est vide, on appelle
   * `finaliserClotureExercice` (housekeeping) puis on ouvre
   * `ouvertureExerciceEnAttente` — sauf si c'est la fin de partie.
   */
  type ClotureExerciceAttente = {
    /** Indices (dans next.joueurs[]) des joueurs non éliminés restant à clôturer. */
    joueursRestants: number[];
    /** État figé juste après BILAN, en attente des choix de dividendes. */
    etatPendant: EtatJeu;
    /** Vrai quand `tourActuel === nbToursMax` : on skip l'ouverture, on file au gameover. */
    estFinDePartie: boolean;
    /** Premier trimestre de l'exercice qui se clôture (pour l'affichage). */
    tourDebutExercice: number;
    /** Tour qui vient de finir (pour l'incrément ultérieur). */
    oldTour: number;
  };
  const [clotureExerciceEtat, setClotureExerciceEtat] = useState<ClotureExerciceAttente | null>(null);
  /**
   * ─── B6 : modale courte d'ouverture du nouvel exercice ──────────────
   *
   * Empilée dès que tous les joueurs ont validé leur clôture et que ce
   * n'est pas la fin de partie. La modale se ferme via `validerOuvertureExercice`
   * qui incrémente enfin `tourActuel` et relance le cycle à l'étape 0.
   */
  type OuvertureExerciceAttente = {
    etatPendant: EtatJeu;
    numeroExercice: number;          // numéro de l'exercice qui S'OUVRE
    premierTourNouvelExercice: number; // tourActuel + 1
    oldTour: number;
  };
  const [ouvertureExerciceEtat, setOuvertureExerciceEtat] = useState<OuvertureExerciceAttente | null>(null);

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

    // DECISION.a (recrutement) → DECISION.b (investissement) sans avancer à l'étape suivante
    if (etapeAvantAvancement === ETAPES.DECISION && decisions.subEtape6 === "recrutement") {
      // Capturer le label de la carte recrutée pour le snapshot trimestriel
      if (decisions.selectedDecision) {
        setLastDecisionLabel(decisions.selectedDecision.titre);
      }
      decisions.setSubEtape6("investissement");
      setEtat({ ...next });
      setActiveStep(null);
      setRecentModifications([]);
      decisions.setSelectedDecision(null);
      return;
    }

    // DECISION.b (investissement) → retour au panneau unifié (L33 : multi-investissements)
    if (etapeAvantAvancement === ETAPES.DECISION && decisions.subEtape6 === "investissement") {
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

    // B9-A (2026-04-24) — CLOTURE_BILAN fusionne ex-CLOTURE_TRIMESTRE + ex-BILAN.
    // Après validation des écritures de clôture (ex-CLOTURE_TRIMESTRE),
    // on enchaîne directement la 2e passe moteur (verifierFinTour +
    // confirmEndOfTurn) au lieu d'avancerEtape, puisque CLOTURE_BILAN
    // est la dernière étape du cycle 8. Évite de passer par un state UI
    // intermédiaire pour la passe « bilan ».
    if (etapeAvantAvancement === ETAPES.CLOTURE_BILAN) {
      const fin = verifierFinTour(next, next.joueurActif);
      confirmEndOfTurn(next, fin);
      return;
    }

    avancerEtape(next);
    pedagogy.maybeShowPedagoModal(next.etapeTour);
    setEtat({ ...next });
    setActiveStep(null);
    setRecentModifications([]);
    if (etapeAvantAvancement === ETAPES.DECISION) decisions.setSubEtape6("recrutement");
  }

  // ─── Défis du dirigeant (Tâche 24, V2) ──────────────────────────────────
  //
  // Retourne le slot dramaturgique pertinent pour l'étape courante, ou null.
  // V2 : seuls `debut_tour` (étape ENCAISSEMENTS_CREANCES) et `avant_decision` (étape DECISION) sont câblés.
  function slotPourEtapeCourante(e: EtatJeu): SlotDramaturgique | null {
    if (e.etapeTour === ETAPES.ENCAISSEMENTS_CREANCES) return "debut_tour";
    if (e.etapeTour === ETAPES.DECISION) return "avant_decision";
    return null;
  }

  // Résout les effets différés dont l'échéance est atteinte (trimestreApplication ≤ tourActuel).
  // Appelé au début de chaque trimestre (étape 0, joueur 0) avant toute autre mécanique.
  // Applique silencieusement — l'UI n'affiche pas d'écran intermédiaire en V2.
  function resoudreArcsDifferes(e: EtatJeu): EtatJeu {
    const resolution = resoudreConsequencesDifferees(e);
    if (resolution.effetsAppliquer.length === 0
        && resolution.defisActifsRestants.length === (e.defisActifs?.length ?? 0)) {
      return e; // rien à faire
    }
    const next = cloneEtat(e);
    for (const appl of resolution.effetsAppliquer) {
      const j = next.joueurs.find((p) => p.id === appl.joueurId);
      if (!j) continue;
      for (const ef of appl.effets) {
        applyDeltaToJoueur(j, ef.poste, ef.delta);
      }
    }
    next.defisActifs = resolution.defisActifsRestants;
    return next;
  }

  // Résolution du défi affiché : applique le choix, trace, et libère le flow.
  // Le joueur revient sur le CenterPanel de l'étape et clique « Commencer » à nouveau.
  // L'anti-répétition dans `piocherDefi` garantit que le défi ne sera pas re-tiré.
  function resoudreDefi(choixId: string | null) {
    if (!etat || !defiEnAttente) return;
    const next = cloneEtat(etat);
    const joueur = next.joueurs[next.joueurActif];

    const choix = choixId
      ? defiEnAttente.choix.find((c) => c.id === choixId) ?? null
      : null;

    if (!choix) {
      // Observation sans interaction : trace seulement, pas d'effet.
      next.defisResolus = [
        ...(next.defisResolus ?? []),
        {
          id: `${defiEnAttente.id}-T${next.tourActuel}-J${joueur.id}`,
          defiId: defiEnAttente.id,
          joueurId: joueur.id,
          trimestre: next.tourActuel,
          slot: defiEnAttente.slot,
          choixId: null,
          conceptCible: defiEnAttente.conceptCible,
        },
      ];
    } else {
      const res = appliquerChoixDefi(defiEnAttente, choix, next, joueur);
      // Effets immédiats appliqués sur le joueur.
      for (const ef of res.effetsImmediats) {
        applyDeltaToJoueur(joueur, ef.poste, ef.delta);
      }
      if (res.arcDiffereACreer) {
        next.defisActifs = [...(next.defisActifs ?? []), res.arcDiffereACreer];
      }
      next.defisResolus = [...(next.defisResolus ?? []), res.trace];
    }

    setEtat(next);
    setDefiEnAttente(null);
    setContexteDefi("");
  }

  // ─ Lancer la prévisualisation d'une étape automatique ────────────────────
  function launchStep() {
    if (!etat) return;

    // ─── Défis du dirigeant (Tâche 24, V2) ────────────────────────────────
    // Tout ce bloc est court-circuité si le flag est OFF → comportement
    // strictement identique à la version sans défis.
    let workingEtat: EtatJeu = etat;
    if (workingEtat.defisActives) {
      // 1. Résolution des arcs différés : uniquement au tout début d'un
      //    trimestre (étape 0, premier joueur). On l'applique silencieusement.
      if (workingEtat.etapeTour === ETAPES.ENCAISSEMENTS_CREANCES && workingEtat.joueurActif === 0) {
        const resolu = resoudreArcsDifferes(workingEtat);
        if (resolu !== workingEtat) {
          workingEtat = resolu;
          setEtat(workingEtat);
        }
      }

      // 2. Consultation du slot applicable à l'étape courante.
      const slot = slotPourEtapeCourante(workingEtat);
      if (slot) {
        const slotsActifs = determinerSlotsActifs(
          workingEtat.tourActuel,
          workingEtat.nbToursMax,
        );
        if (slotsActifs.includes(slot)) {
          const joueur = workingEtat.joueurs[workingEtat.joueurActif];
          const defi = piocherDefi(workingEtat, joueur, slot, CATALOGUE_V2);
          if (defi) {
            setDefiEnAttente(defi);
            setContexteDefi(formatContexte(defi.contexte, workingEtat, joueur));
            return; // stop : le DefiDirigeantScreen prend la main via page.tsx
          }
        }
      }
    }

    // ─── Flow normal (inchangé) ────────────────────────────────────────────
    const next = cloneEtat(workingEtat);
    const idx = next.joueurActif;
    let mods: ModificationMoteur[] = [];
    let evenementCapture: { titre: string; icone?: string; description: string } | undefined;

    if (next.etapeTour === ETAPES.ENCAISSEMENTS_CREANCES) {
      next.joueurs[idx].clientsPerdusCeTour = 0;
    }

    switch (next.etapeTour) {
      case ETAPES.ENCAISSEMENTS_CREANCES: { const r = appliquerAvancementCreances(next, idx); if (r.succes) mods = r.modifications as ModificationMoteur[]; break; }
      case ETAPES.COMMERCIAUX: {
        const clients = genererClientsParCommerciaux(next.joueurs[idx]);
        const clientsSpecialite = genererClientsSpecialite(next.joueurs[idx]);
        next.joueurs[idx].clientsATrait = [...next.joueurs[idx].clientsATrait, ...clients, ...clientsSpecialite];
        const r = appliquerPaiementCommerciaux(next, idx);
        if (r.succes) mods = r.modifications as ModificationMoteur[];
        break;
      }
      case ETAPES.REALISATION_METIER: {
        // B9-A (2026-04-24) — étape placeholder. Le dispatcher polymorphe
        // `appliquerRealisationMetier` retourne un ResultatAction vide.
        // L'étape se traverse via la condition skip-auto ci-dessous.
        const r = appliquerRealisationMetier(next, idx);
        if (r.succes) mods = r.modifications as ModificationMoteur[];
        break;
      }
      case ETAPES.FACTURATION_VENTES: {
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
      case ETAPES.CLOTURE_BILAN: {
        // B9-A (2026-04-24) — 1re passe : `appliquerClotureTrimestre` (charges
        // fixes + amortissements + effets récurrents + spécialité). La 2e passe
        // (verifierFinTour + confirmEndOfTurn) est déclenchée dans
        // `confirmActiveStep` quand l'utilisateur valide les écritures de clôture.
        const r = appliquerClotureTrimestre(next, idx);
        if (r.succes) mods = r.modifications as ModificationMoteur[];
        break;
      }
      case ETAPES.EVENEMENT: {
        if (next.piocheEvenements.length > 0) {
          const carte = next.piocheEvenements[0];
          evenementCapture = { titre: carte.titre, description: carte.description };
          const r = appliquerCarteEvenement(next, idx, carte);
          next.piocheEvenements = next.piocheEvenements.slice(1);
          if (r.succes) mods = r.modifications as ModificationMoteur[];
        }
        break;
      }
      // B9-A : l'ancien `case ETAPES.BILAN` a été supprimé — la fin de tour
      // est déclenchée dans `confirmActiveStep` lorsque `etapeAvantAvancement
      // === ETAPES.CLOTURE_BILAN` (fusion des 2 passes sous un même index UI).
      default: break;
    }

    const etapeActuelle = next.etapeTour;
    const modsFiltrees = mods.filter(m => m.nouvelleValeur !== m.ancienneValeur);
    if ((etapeActuelle === ETAPES.ENCAISSEMENTS_CREANCES || etapeActuelle === ETAPES.COMMERCIAUX || etapeActuelle === ETAPES.REALISATION_METIER) && modsFiltrees.length === 0) {
      avancerEtape(next);
      pedagogy.maybeShowPedagoModal(next.etapeTour);
      setEtat({ ...next });
      setActiveStep(null);
      return;
    }

    setRecentModifications(modsFiltrees.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));

    // Étapes « automatiques » : flow accéléré en mode rapide (toutes écritures appliquées d'un coup).
    // Cycle B9-A (2026-04-24) : ENCAISSEMENTS_CREANCES(0), COMMERCIAUX(1),
    // FACTURATION_VENTES(4, ex-VENTES), CLOTURE_BILAN(7, fusion ex-CLOTURE_TRIMESTRE + BILAN).
    // REALISATION_METIER(3) n'est pas listée : en B9-A placeholder elle se traverse
    // via la condition skip-auto (modsFiltrees vide). Sera ajoutée ici en B9-D.
    const AUTO_ETAPES: number[] = [
      ETAPES.ENCAISSEMENTS_CREANCES,
      ETAPES.COMMERCIAUX,
      ETAPES.FACTURATION_VENTES,
      ETAPES.CLOTURE_BILAN,
    ];
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
      // ─── Détection fin d'exercice (B6) ────────────────────────────────
      // `estFinExercice` couvre T4 / T8 / T12 ET `tourActuel === nbToursMax`
      // (dernier trimestre, exercice potentiellement partiel).
      const finExercice = estFinExercice(next.tourActuel, next.nbToursMax);
      const estDernierTour = next.tourActuel >= next.nbToursMax;

      // Cas 1 : faillite à l'issue du bilan → overlay immédiat (priorité).
      if (fin.enFaillite) {
        setEtat({ ...next });
        setActiveStep(null);
        decisions.resetDecisionState();
        setFailliteInfo({ joueurNom, raison: fin.raisonFaillite ?? "Situation financière irrécupérable" });
        if (estDernierTour) setPhase("gameover");
        return;
      }

      // Cas 2 : fin d'exercice (T4/T8/T12 ou nbToursMax non multiple de 4)
      //         → on empile la modale ModalClotureExercice, le flow attend
      //         la validation de chaque joueur actif.
      if (finExercice) {
        const joueursActifs = next.joueurs
          .map((j, i) => (j.elimine ? -1 : i))
          .filter((i) => i >= 0);
        // Si plus aucun joueur actif (tous éliminés), on skip direct la clôture.
        if (joueursActifs.length === 0) {
          if (estDernierTour) {
            setEtat(next);
            setPhase("gameover");
            return;
          }
          // Rien à clôturer, on enchaîne l'incrément de tour normalement.
          const oldTour = next.tourActuel;
          next.tourActuel = oldTour + 1;
          next.etapeTour = ETAPES.ENCAISSEMENTS_CREANCES;
          next.joueurActif = 0;
          pedagogy.maybeShowPedagoModal(ETAPES.ENCAISSEMENTS_CREANCES);
          setEtat({ ...next });
          setActiveStep(null);
          decisions.resetDecisionState();
          pedagogy.prepareQCMNouveauTrimestre();
          setTourTransition({ from: oldTour, to: next.tourActuel });
          return;
        }
        const tourDebutExercice = (next.dernierTourClotureExercice ?? 0) + 1;
        setClotureExerciceEtat({
          joueursRestants: joueursActifs,
          etatPendant: next,
          estFinDePartie: estDernierTour,
          tourDebutExercice,
          oldTour: next.tourActuel,
        });
        // On pousse l'état figé tel quel dans `etat` pour que le LeftPanel
        // reflète le bilan de fin d'exercice sous la modale. Pas
        // d'avancement de tour : c'est `validerOuvertureExercice` qui le
        // fera à la fin du pipeline clôture → ouverture.
        setEtat({ ...next });
        setActiveStep(null);
        return;
      }

      // Cas 3 : dernier tour atteint sans être fin d'exercice (protection
      //         défensive — avec estFinExercice ce cas ne doit jamais se
      //         produire, mais on garde une sortie propre vers gameover).
      if (estDernierTour) {
        setEtat(next);
        setPhase("gameover");
        return;
      }

      // Cas 4 : trimestre normal (ni faillite, ni fin d'exercice).
      const oldTour = next.tourActuel;
      next.tourActuel = oldTour + 1;
      next.etapeTour = ETAPES.ENCAISSEMENTS_CREANCES;
      next.joueurActif = 0;
      pedagogy.maybeShowPedagoModal(ETAPES.ENCAISSEMENTS_CREANCES);
      setEtat({ ...next });
      setActiveStep(null);
      decisions.resetDecisionState();
      pedagogy.prepareQCMNouveauTrimestre();
      setTourTransition({ from: oldTour, to: next.tourActuel });
    } else {
      avancerEtape(next);
      next.joueurActif = nextJoueurIdx;
      next.etapeTour = ETAPES.ENCAISSEMENTS_CREANCES;
      pedagogy.maybeShowPedagoModal(ETAPES.ENCAISSEMENTS_CREANCES);
      setEtat({ ...next });
      setActiveStep(null);
      decisions.resetDecisionState();
    }
  }

  // ─── B6 : validation de la clôture par le joueur courant ─────────────
  //
  // Chaque appel traite 1 joueur :
  //   1. Applique `appliquerClotureExercice` avec le % de dividendes choisi.
  //   2. Si d'autres joueurs restent à clôturer : on reste en mode clôture.
  //   3. Sinon : on appelle `finaliserClotureExercice` (housekeeping), on met
  //      à jour `numeroExerciceEnCours` + `dernierTourClotureExercice`, puis :
  //      · fin de partie → setPhase("gameover")
  //      · sinon → on empile `ouvertureExerciceEtat` (modale courte).
  function validerClotureExercice(pctDividendes: number) {
    const state = clotureExerciceEtat;
    if (!state) return;
    if (state.joueursRestants.length === 0) return;

    const joueurIdx = state.joueursRestants[0];
    const reste = state.joueursRestants.slice(1);

    // `appliquerClotureExercice` mute `etatPendant` en place : on reprend
    // la même référence sans cloner (L40 n'est pas concerné ici — on est
    // dans un état transitoire avant l'ouverture du nouvel exercice).
    const res = appliquerClotureExercice(state.etatPendant, joueurIdx, pctDividendes);
    if (!res.succes) {
      console.error("Clôture d'exercice échouée :", res.messageErreur);
      // Par sécurité on ne bloque pas : on skip ce joueur pour ne pas laisser
      // la modale en impasse. Un bug éventuel remontera dans la console.
    }

    if (reste.length > 0) {
      // Il reste des joueurs à faire choisir.
      setClotureExerciceEtat({ ...state, joueursRestants: reste });
      setEtat({ ...state.etatPendant });
      return;
    }

    // Tous les joueurs ont clôturé : housekeeping + compteurs globaux.
    finaliserClotureExercice(state.etatPendant);

    if (state.estFinDePartie) {
      // Fin de partie : pas de modale d'ouverture, on file au gameover.
      setClotureExerciceEtat(null);
      setEtat({ ...state.etatPendant });
      setPhase("gameover");
      return;
    }

    // Ouverture du nouvel exercice : on empile la modale courte.
    const nouveauNumero = state.etatPendant.numeroExerciceEnCours ?? (state.oldTour >= 4 ? 2 : 1);
    setClotureExerciceEtat(null);
    setOuvertureExerciceEtat({
      etatPendant: state.etatPendant,
      numeroExercice: nouveauNumero,
      premierTourNouvelExercice: state.oldTour + 1,
      oldTour: state.oldTour,
    });
    setEtat({ ...state.etatPendant });
  }

  // ─── B6 : validation de l'ouverture → incrément du tour ───────────────
  function validerOuvertureExercice() {
    const state = ouvertureExerciceEtat;
    if (!state) return;

    const next = state.etatPendant;
    const oldTour = state.oldTour;
    next.tourActuel = oldTour + 1;
    next.etapeTour = ETAPES.ENCAISSEMENTS_CREANCES;
    next.joueurActif = 0;
    pedagogy.maybeShowPedagoModal(ETAPES.ENCAISSEMENTS_CREANCES);
    setEtat({ ...next });
    setActiveStep(null);
    decisions.resetDecisionState();
    pedagogy.prepareQCMNouveauTrimestre();
    setTourTransition({ from: oldTour, to: next.tourActuel });
    setOuvertureExerciceEtat(null);
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

    // ─ Sous-hook : achats
    ...achat,

    // ─ Sous-hook : cartes décision
    selectedDecision: decisions.selectedDecision,
    setSelectedDecision: decisions.setSelectedDecision,
    showCartes: decisions.showCartes,
    decisionError: decisions.decisionError,
    subEtape6: decisions.subEtape6,
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
    launchDecision: decisions.launchDecision,
    skipDecision: decisions.skipDecision,
    handleInvestirPersonnel: decisions.handleInvestirPersonnel,
    handleVendreImmobilisation: decisions.handleVendreImmobilisation,
    handleLicencierCommercial: decisions.handleLicencierCommercial,

    // ─── Défis du dirigeant (Tâche 24, V2) ───────────────────
    defiEnAttente,
    contexteDefi,
    resoudreDefi,

    // ─── B6 : clôture et ouverture d'exercice ────────────────
    clotureJoueur: clotureExerciceEtat
      ? clotureExerciceEtat.etatPendant.joueurs[clotureExerciceEtat.joueursRestants[0]]
      : null,
    clotureNumeroExercice: clotureExerciceEtat?.etatPendant.numeroExerciceEnCours ?? 1,
    clotureTourDebut: clotureExerciceEtat?.tourDebutExercice ?? 1,
    clotureTourFin: clotureExerciceEtat?.oldTour ?? 1,
    validerClotureExercice,
    ouvertureJoueur: ouvertureExerciceEtat
      ? ouvertureExerciceEtat.etatPendant.joueurs[0]
      : null,
    ouvertureNumeroExercice: ouvertureExerciceEtat?.numeroExercice ?? 1,
    ouverturePremierTour: ouvertureExerciceEtat?.premierTourNouvelExercice ?? 1,
    validerOuvertureExercice,
  };
}
