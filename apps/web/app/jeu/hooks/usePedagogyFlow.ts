/**
 * Sous-hook : pédagogie
 * Gère l'état lié aux modales d'explication par étape et au QCM trimestriel.
 */

import { useState } from "react";
import { EtatJeu } from "@jedevienspatron/game-engine";
import { tirerQuestionsTrimestriel, QuestionQCM } from "@/lib/game-engine/data/pedagogie";
import { cloneEtat } from "./gameFlowUtils";

// ─── Paramètres ────────────────────────────────────────────────────────────────

interface PedagogyFlowParams {
  etat: EtatJeu | null;
  setEtat: (e: EtatJeu | null) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePedagogyFlow({ etat, setEtat }: PedagogyFlowParams) {
  const [etapesPedagoVues, setEtapesPedagoVues] = useState<Set<number>>(new Set());
  const [modalEtapeEnAttente, setModalEtapeEnAttente] = useState<number | null>(null);
  const [qcmTrimestreQuestions, setQcmTrimestreQuestions] = useState<QuestionQCM[] | undefined>(undefined);
  const [qcmTrimestreScore, setQcmTrimestreScore] = useState<number | undefined>(undefined);

  /**
   * Affiche la modale pédagogique pour l'étape donnée si elle n'a jamais été vue.
   * DRY : remplace 6 occurrences du pattern if (!etapesPedagoVues.has(etape)) { ... }
   */
  function maybeShowPedagoModal(etape: number) {
    if (!etapesPedagoVues.has(etape)) {
      setModalEtapeEnAttente(etape);
      setEtapesPedagoVues(prev => new Set(prev).add(etape));
    }
  }

  /**
   * Prépare les questions QCM pour le prochain trimestre (appelé par confirmEndOfTurn).
   */
  function prepareQCMNouveauTrimestre() {
    const questions = tirerQuestionsTrimestriel();
    setQcmTrimestreQuestions(questions);
    setQcmTrimestreScore(undefined);
  }

  /**
   * Applique le bonus/malus QCM en trésorerie et en compte de résultat.
   * score=4 ou 3 → +1 000 € tréso ; score<2 → −1 000 € tréso
   */
  function handleQCMTermine(score: number) {
    if (!etat) return;
    setQcmTrimestreScore(score);

    const next = cloneEtat(etat);
    const joueurBonus = next.joueurs[next.joueurActif];
    const tresoActif = joueurBonus.bilan.actifs.find(a => a.categorie === "tresorerie");

    if (score === 4) {
      if (tresoActif) tresoActif.valeur += 1;
      joueurBonus.compteResultat.produits.revenusExceptionnels += 1;
    } else if (score === 3) {
      if (tresoActif) tresoActif.valeur += 1;
      joueurBonus.compteResultat.produits.revenusExceptionnels += 1;
    } else if (score < 2) {
      if (tresoActif) tresoActif.valeur -= 1;
      joueurBonus.compteResultat.charges.chargesExceptionnelles += 1;
    }

    setEtat({ ...next });
  }

  return {
    // State
    etapesPedagoVues, setEtapesPedagoVues,
    modalEtapeEnAttente, setModalEtapeEnAttente,
    qcmTrimestreQuestions, setQcmTrimestreQuestions,
    qcmTrimestreScore, setQcmTrimestreScore,
    // Actions
    maybeShowPedagoModal,
    prepareQCMNouveauTrimestre,
    handleQCMTermine,
  };
}
