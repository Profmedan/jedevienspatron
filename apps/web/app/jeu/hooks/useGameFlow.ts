"use client";

import { useState, useEffect, useMemo, useReducer } from "react";
import {
  EtatJeu, Joueur, CarteDecision, ResultatDemandePret, MONTANTS_EMPRUNT, TrimSnapshot, EntrepriseTemplate, ETAPES,
  initialiserJeu, avancerEtape, appliquerEtape0, appliquerAchatMarchandises,
  appliquerAvancementCreances, appliquerPaiementCommerciaux, appliquerCarteClient,
  appliquerEffetsRecurrents, appliquerSpecialiteEntreprise, genererClientsSpecialite,
  tirerCartesDecision, acheterCarteDecision, investirCartePersonnelle, licencierCommercial, vendreImmobilisation,
  appliquerCarteEvenement, verifierFinTour, cloturerAnnee, genererClientsParCommerciaux,
  obtenirCarteRecrutement, demanderEmprunt, ResultatFinTour, calculerCapaciteLogistique,
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

    // 6a (recrutement) → 6b (investissement) sans avancer à l'étape 7
    if (etapeAvantAvancement === 6 && decisions.subEtape6 === "recrutement") {
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

    // 6b (investissement) → retour au panneau unifié (L33 : multi-investissements)
    if (etapeAvantAvancement === 6 && decisions.subEtape6 === "investissement") {
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

    avancerEtape(next);
    pedagogy.maybeShowPedagoModal(next.etapeTour);
    setEtat({ ...next });
    setActiveStep(null);
    setRecentModifications([]);
    if (etapeAvantAvancement === 6) decisions.setSubEtape6("recrutement");
  }

  // ─── Défis du dirigeant (Tâche 24, V2) ──────────────────────────────────
  //
  // Retourne le slot dramaturgique pertinent pour l'étape courante, ou null.
  // V2 : seuls `debut_tour` (étape CHARGES_FIXES) et `avant_decision` (étape DECISION) sont câblés.
  function slotPourEtapeCourante(e: EtatJeu): SlotDramaturgique | null {
    if (e.etapeTour === ETAPES.CHARGES_FIXES) return "debut_tour";
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
      if (workingEtat.etapeTour === ETAPES.CHARGES_FIXES && workingEtat.joueurActif === 0) {
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

    if (next.etapeTour === ETAPES.CHARGES_FIXES) {
      next.joueurs[idx].clientsPerdusCeTour = 0;
    }

    switch (next.etapeTour) {
      case ETAPES.CHARGES_FIXES: { const r = appliquerEtape0(next, idx); if (r.succes) mods = r.modifications as ModificationMoteur[]; break; }
      case ETAPES.ENCAISSEMENTS_CREANCES: { const r = appliquerAvancementCreances(next, idx); if (r.succes) mods = r.modifications as ModificationMoteur[]; break; }
      case ETAPES.COMMERCIAUX: {
        const clients = genererClientsParCommerciaux(next.joueurs[idx]);
        const clientsSpecialite = genererClientsSpecialite(next.joueurs[idx]);
        next.joueurs[idx].clientsATrait = [...next.joueurs[idx].clientsATrait, ...clients, ...clientsSpecialite];
        const r = appliquerPaiementCommerciaux(next, idx);
        if (r.succes) mods = r.modifications as ModificationMoteur[];
        break;
      }
      case ETAPES.VENTES: {
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
      case ETAPES.EFFETS_RECURRENTS: {
        const r = appliquerEffetsRecurrents(next, idx);
        if (r.succes) mods = r.modifications as ModificationMoteur[];
        const rSpec = appliquerSpecialiteEntreprise(next, idx);
        if (rSpec.succes) mods = [...mods, ...(rSpec.modifications as ModificationMoteur[])];
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
      case ETAPES.BILAN: { const fin = verifierFinTour(next, idx); confirmEndOfTurn(next, fin); return; }
      default: break;
    }

    const etapeActuelle = next.etapeTour;
    const modsFiltrees = mods.filter(m => m.nouvelleValeur !== m.ancienneValeur);
    if ((etapeActuelle === ETAPES.ENCAISSEMENTS_CREANCES || etapeActuelle === ETAPES.COMMERCIAUX) && modsFiltrees.length === 0) {
      avancerEtape(next);
      pedagogy.maybeShowPedagoModal(next.etapeTour);
      setEtat({ ...next });
      setActiveStep(null);
      return;
    }

    setRecentModifications(modsFiltrees.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));

    const AUTO_ETAPES = [0, 2, 3, 4, 5];
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
  };
}
