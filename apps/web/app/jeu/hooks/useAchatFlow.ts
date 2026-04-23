/**
 * Sous-hook : Ressources & préparation (étape 2 B9, polymorphe par modeEconomique)
 * Gère l'état (quantité, mode de paiement) et les actions liées aux achats /
 * réassorts / préparations / staffing selon le modèle économique du joueur.
 */

import { useState } from "react";
import { EtatJeu, appliquerRessourcesPreparation, avancerEtape } from "@jedevienspatron/game-engine";
import { type ActiveStep } from "@/components/jeu";
import { cloneEtat, buildActiveStep, type ModificationMoteur } from "./gameFlowUtils";

// ─── Paramètres ────────────────────────────────────────────────────────────────

interface AchatFlowParams {
  etat: EtatJeu | null;
  setEtat: (e: EtatJeu | null) => void;
  setRecentModifications: (mods: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>) => void;
  setActiveStep: (s: ActiveStep | null) => void;
  maybeShowPedagoModal: (etape: number) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAchatFlow({
  etat, setEtat,
  setRecentModifications,
  setActiveStep,
  maybeShowPedagoModal,
}: AchatFlowParams) {
  const [achatQte, setAchatQte]   = useState(2);
  const [achatMode, setAchatMode] = useState<"tresorerie" | "dettes">("tresorerie");

  /** Lance la prévisualisation des écritures d'achat. */
  function launchAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const r = appliquerRessourcesPreparation(next, next.joueurActif, achatQte, achatMode);
    if (!r.succes) return;
    const modsFiltrees = (r.modifications as ModificationMoteur[]).filter(
      m => m.nouvelleValeur !== m.ancienneValeur,
    );
    setRecentModifications(modsFiltrees.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    // B9 : étape 2 RESSOURCES_PREPARATION (corrige un bug historique où
    // l'index était bloqué à 1 depuis l'ancien cycle pré-T25.C).
    setActiveStep(buildActiveStep(etat, r.modifications as ModificationMoteur[], next, 2));
  }

  /** Passe directement à l'étape suivante sans acheter. */
  function skipAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    maybeShowPedagoModal(next.etapeTour);
    setEtat(next);
  }

  return {
    // State
    achatQte, setAchatQte,
    achatMode, setAchatMode,
    // Actions
    launchAchat,
    skipAchat,
  };
}
