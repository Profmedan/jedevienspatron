/**
 * Sous-hook : cartes Décision (étape 6)
 * Gère l'état, les effets React et les actions liées aux investissements,
 * recrutements, cessions et licenciements.
 */

import { useState, useEffect } from "react";
import {
  EtatJeu, CarteDecision, ETAPES,
  acheterCarteDecision, investirCartePersonnelle, licencierCommercial, vendreImmobilisation,
  tirerCartesDecision, obtenirCarteRecrutement, avancerEtape,
} from "@jedevienspatron/game-engine";
import { type ActiveStep, getPosteValue, applyDeltaToJoueur } from "@/components/jeu";
import { cloneEtat, buildActiveStep, type ModificationMoteur } from "./gameFlowUtils";

// ─── Paramètres ────────────────────────────────────────────────────────────────

interface DecisionCardsParams {
  etat: EtatJeu | null;
  setEtat: (e: EtatJeu | null) => void;
  setRecentModifications: (mods: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>) => void;
  setActiveStep: (s: ActiveStep | null) => void;
  activeStep: ActiveStep | null;
  maybeShowPedagoModal: (etape: number) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDecisionCards({
  etat, setEtat,
  setRecentModifications,
  setActiveStep,
  activeStep,
  maybeShowPedagoModal,
}: DecisionCardsParams) {
  const [selectedDecision, setSelectedDecision] = useState<CarteDecision | null>(null);
  const [showCartes, setShowCartes]             = useState(false);
  const [decisionError, setDecisionError]       = useState<string | null>(null);
  const [subEtape6, setSubEtape6]               = useState<"recrutement" | "investissement">("recrutement");

  // ── Pioche d'investissement stable du tour (L32) ─────────────────────────
  // À l'étape 6b, on tire une fois 4 cartes globales et on les conserve pendant
  // tout le séjour sur cette sous-étape. Les cartes investies sont retirées
  // explicitement dans `launchDecision`. Reset à null à la sortie.
  const [pioche6b, setPioche6b] = useState<CarteDecision[] | null>(null);

  // ── Auto-ouvre les cartes dès que le joueur arrive à l'étape Décision ────
  useEffect(() => {
    if (etat?.etapeTour === ETAPES.DECISION && !activeStep) {
      setShowCartes(true);
    }
  }, [etat?.etapeTour, subEtape6, activeStep]);

  // ── Init / reset de la pioche stable de l'étape 6b ───────────────────────
  useEffect(() => {
    if (!etat) return;
    const enInvestissement = etat.etapeTour === ETAPES.DECISION && subEtape6 === "investissement";
    if (enInvestissement && pioche6b === null) {
      setPioche6b(tirerCartesDecision(cloneEtat(etat), 4));
    } else if (!enInvestissement && pioche6b !== null) {
      setPioche6b(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat?.etapeTour, etat?.tourActuel, etat?.joueurActif, subEtape6]);

  // ── Cartes disponibles (computed) ────────────────────────────────────────
  const cartesDisponibles: CarteDecision[] = etat
    ? (etat.etapeTour === ETAPES.DECISION && subEtape6 === "investissement"
        ? (pioche6b ?? [])
        : tirerCartesDecision(cloneEtat(etat), 4))
    : [];
  const cartesRecrutement = etat ? obtenirCarteRecrutement(cloneEtat(etat), etat.joueurActif) : [];

  // ─ Actions ─────────────────────────────────────────────────────────────────

  /**
   * Lance la prévisualisation d'une carte Décision.
   * Accepte une carte en paramètre (flux InvestissementPanel) ou utilise
   * `selectedDecision` (ancien flux via setState).
   */
  function launchDecision(carteArg?: CarteDecision) {
    if (!etat) return;
    const carteUsed = carteArg ?? selectedDecision;
    if (!carteUsed) return;

    const next = cloneEtat(etat);
    const r = acheterCarteDecision(next, next.joueurActif, carteUsed);
    if (!r.succes) {
      setDecisionError(r.messageErreur ?? "Impossible d'activer cette carte");
      return;
    }
    setDecisionError(null);
    let mods: ModificationMoteur[] = r.modifications as ModificationMoteur[];

    if (mods.length === 0 && carteUsed.effetsRecurrents.length > 0) {
      const joueur = next.joueurs[next.joueurActif];
      const syntheticMods: ModificationMoteur[] = [];
      for (const effet of carteUsed.effetsRecurrents) {
        const ancienneValeur = getPosteValue(joueur, effet.poste);
        applyDeltaToJoueur(joueur, effet.poste, effet.delta);
        syntheticMods.push({
          joueurId: joueur.id,
          poste: effet.poste,
          ancienneValeur,
          nouvelleValeur: ancienneValeur + effet.delta,
          explication: `${carteUsed.titre} — 1ʳᵉ activation (effet récurrent chaque trimestre)`,
        });
      }
      mods = syntheticMods;
    }

    const modsDecisionFiltres = mods.filter(m => m.nouvelleValeur !== m.ancienneValeur);
    setRecentModifications(modsDecisionFiltres.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    setActiveStep(buildActiveStep(etat, mods, next, 6));

    // L32 : retirer la carte achetée de la pioche stable du tour
    setPioche6b(prev => prev?.filter(c => c.id !== carteUsed.id) ?? null);
  }

  /** Active une carte logistique (investissement personnel). */
  function handleInvestirPersonnel(carteId: string) {
    if (!etat) return;
    const next = cloneEtat(etat);
    const result = investirCartePersonnelle(next, next.joueurActif, carteId);
    if (!result.succes) {
      setDecisionError(result.messageErreur ?? "Erreur investissement logistique");
      return;
    }
    setDecisionError(null);
    const modsFiltrés = (result.modifications as ModificationMoteur[]).filter(
      m => m.nouvelleValeur !== m.ancienneValeur,
    );
    setRecentModifications(modsFiltrés.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    setActiveStep(buildActiveStep(etat, result.modifications as ModificationMoteur[], next, 6));
  }

  /** Vend une immobilisation d'occasion (L34 — cession). */
  function handleVendreImmobilisation(nomImmo: string, prixCession: number) {
    if (!etat) return;
    const next = cloneEtat(etat);
    const result = vendreImmobilisation(next, next.joueurActif, nomImmo, prixCession);
    if (!result.succes) {
      setDecisionError(result.messageErreur ?? "Impossible de vendre cette immobilisation.");
      return;
    }
    setDecisionError(null);
    const modsFiltres = (result.modifications as ModificationMoteur[]).filter(
      m => m.nouvelleValeur !== m.ancienneValeur,
    );
    setRecentModifications(modsFiltres.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    setActiveStep(buildActiveStep(etat, result.modifications as ModificationMoteur[], next, 6, {
      titre: `Cession d'occasion — ${nomImmo}`,
      icone: "💸",
      description: `Vous vendez "${nomImmo}" sur le marché de l'occasion. Le prix de cession est encaissé en trésorerie, le bien sort du bilan à sa VNC, et l'écart est enregistré au CR (plus ou moins-value exceptionnelle).`,
    }));
  }

  /** Licencie un commercial (indemnité légale + sortie du roster). */
  function handleLicencierCommercial(carteId: string) {
    if (!etat) return;
    const next = cloneEtat(etat);
    const result = licencierCommercial(next, next.joueurActif, carteId);
    if (!result.succes) {
      setDecisionError(result.messageErreur ?? "Impossible de licencier ce commercial.");
      return;
    }
    setDecisionError(null);
    const modsFiltrés = (result.modifications as ModificationMoteur[]).filter(
      m => m.nouvelleValeur !== m.ancienneValeur,
    );
    setRecentModifications(modsFiltrés.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    setActiveStep(buildActiveStep(etat, result.modifications as ModificationMoteur[], next, 6, {
      titre: "Licenciement",
      icone: "📤",
      description: "Vous licenciez un commercial. L'indemnité légale est versée immédiatement. Ce commercial ne génèrera plus de clients ni de salaires à partir du prochain trimestre.",
    }));
  }

  /**
   * Skip l'étape 6 (ou bascule 6a → 6b, puis avance à l'étape 7).
   * L33 : le passage à l'étape 7 est toujours explicite (bouton "Terminer →").
   */
  function skipDecision() {
    if (!etat) return;
    if (etat.etapeTour === ETAPES.DECISION && subEtape6 === "recrutement") {
      setSubEtape6("investissement");
      setShowCartes(false);
      setSelectedDecision(null);
      setDecisionError(null);
      return;
    }
    const next = cloneEtat(etat);
    avancerEtape(next);
    maybeShowPedagoModal(next.etapeTour);
    setEtat(next);
    setShowCartes(false);
    setSelectedDecision(null);
    setDecisionError(null);
    setSubEtape6("recrutement");
  }

  /** Remet à zéro l'état de l'étape 6 (appelé depuis confirmEndOfTurn). */
  function resetDecisionState() {
    setSelectedDecision(null);
    setShowCartes(false);
    setSubEtape6("recrutement");
    setDecisionError(null);
  }

  return {
    // State
    selectedDecision, setSelectedDecision,
    showCartes,
    decisionError,
    subEtape6, setSubEtape6,
    // Computed
    cartesDisponibles,
    cartesRecrutement,
    // Actions
    launchDecision,
    skipDecision,
    handleInvestirPersonnel,
    handleVendreImmobilisation,
    handleLicencierCommercial,
    resetDecisionState,
  };
}
