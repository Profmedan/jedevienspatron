/**
 * Sous-hook : Réalisation métier (étape 3 B9, polymorphe par modeEconomique)
 * Pilote l'étape 3 — production Belvaux, coût canal Azura, exécution Véloce,
 * réalisation Synergia. Comme `useAchatFlow` (étape 2), l'étape est
 * user-driven : le joueur saisit une quantité (sauf Azura — montant fixe)
 * et choisit un mode de paiement (comptant / crédit) pour les charges
 * monétaires.
 */

import { useState } from "react";
import { EtatJeu, appliquerRealisationMetier, avancerEtape } from "@jedevienspatron/game-engine";
import { type ActiveStep } from "@/components/jeu";
import { cloneEtat, buildActiveStep, type ModificationMoteur } from "./gameFlowUtils";

// ─── Paramètres ────────────────────────────────────────────────────────────

interface RealisationFlowParams {
  etat: EtatJeu | null;
  setEtat: (e: EtatJeu | null) => void;
  setRecentModifications: (mods: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>) => void;
  setActiveStep: (s: ActiveStep | null) => void;
  maybeShowPedagoModal: (etape: number) => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useRealisationFlow({
  etat, setEtat,
  setRecentModifications,
  setActiveStep,
  maybeShowPedagoModal,
}: RealisationFlowParams) {
  // Par défaut 2 unités (transformation / exécution / livraison) — sauf
  // Azura qui ignore ce paramètre (montant fixe 300 €).
  const [realisationQte, setRealisationQte]   = useState(2);
  const [realisationMode, setRealisationMode] = useState<"tresorerie" | "dettes">("tresorerie");
  const [realisationError, setRealisationError] = useState<string | null>(null);

  /** Lance la prévisualisation des écritures de réalisation métier. */
  function launchRealisation() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const r = appliquerRealisationMetier(next, next.joueurActif, realisationQte, realisationMode);
    if (!r.succes) {
      setRealisationError(r.messageErreur ?? "Impossible d'exécuter la réalisation");
      return;
    }
    setRealisationError(null);
    const modsFiltrees = (r.modifications as ModificationMoteur[]).filter(
      m => m.nouvelleValeur !== m.ancienneValeur,
    );
    setRecentModifications(modsFiltrees.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    // Étape 3 REALISATION_METIER (B9)
    setActiveStep(buildActiveStep(etat, r.modifications as ModificationMoteur[], next, 3));
  }

  /** Passe directement à l'étape suivante sans réaliser (option zéro coût). */
  function skipRealisation() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    maybeShowPedagoModal(next.etapeTour);
    setEtat(next);
    setRealisationError(null);
  }

  return {
    // State
    realisationQte, setRealisationQte,
    realisationMode, setRealisationMode,
    realisationError,
    // Actions
    launchRealisation,
    skipRealisation,
  };
}
