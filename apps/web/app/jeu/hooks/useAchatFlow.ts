/**
 * Sous-hook : achats de marchandises
 * Gère l'état (quantité, mode de paiement) et les actions liées aux achats.
 */

import { useState } from "react";
import {
  EtatJeu,
  appliquerAchatMarchandises,
  appliquerApprovisionnementVeloce,
  appliquerApprovisionnementSynergia,
  avancerEtape,
  ETAPES,
} from "@jedevienspatron/game-engine";
import { type ActiveStep } from "@/components/jeu";
import { cloneEtat, buildActiveStep, type ModificationMoteur } from "./gameFlowUtils";

// ─── Paramètres ────────────────────────────────────────────────────────────────

interface AchatFlowParams {
  etat: EtatJeu | null;
  setEtat: (e: EtatJeu | null) => void;
  setRecentModifications: (mods: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number; ligneNom?: string }>) => void;
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
    const r = appliquerAchatMarchandises(next, next.joueurActif, achatQte, achatMode);
    if (!r.succes) return;
    const modsFiltrees = (r.modifications as ModificationMoteur[]).filter(
      m => m.nouvelleValeur !== m.ancienneValeur,
    );
    setRecentModifications(modsFiltrees.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur, ligneNom: m.ligneNom,
    })));
    // T25.C bugfix (2026-04-20) : l'ancien cycle indexait les Achats à 1.
    // Dans le nouveau cycle 8 étapes, ACHATS_STOCK vaut 2. On passe la
    // constante ETAPES.ACHATS_STOCK pour que le titre/principe affichés
    // correspondent bien à l'étape en cours.
    setActiveStep(buildActiveStep(etat, r.modifications as ModificationMoteur[], next, ETAPES.ACHATS_STOCK));
  }

  /** Passe directement à l'étape suivante sans acheter. */
  function skipAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    maybeShowPedagoModal(next.etapeTour);
    setEtat(next);
  }

  /**
   * B9-C (2026-04-24) — Véloce (mode logistique) : prévisualise le coût
   * d'approche tournée (300 € fixe). Comportement identique à `launchAchat`
   * mais avec une fonction moteur dédiée qui ne prend pas de quantité.
   */
  function launchPreparationVeloce() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const r = appliquerApprovisionnementVeloce(next, next.joueurActif);
    if (!r.succes) return;
    const modsFiltrees = (r.modifications as ModificationMoteur[]).filter(
      (m) => m.nouvelleValeur !== m.ancienneValeur,
    );
    setRecentModifications(
      modsFiltrees.map((m) => ({
        poste: m.poste,
        ancienneValeur: m.ancienneValeur,
        nouvelleValeur: m.nouvelleValeur,
      })),
    );
    setActiveStep(
      buildActiveStep(etat, r.modifications as ModificationMoteur[], next, ETAPES.ACHATS_STOCK, {
        titre: "Préparation de la tournée",
        icone: "🚚",
        description:
          "Coût d'approche fixe (carburant, préparation véhicule, cotisations chauffeur) engagé avant la tournée.",
      }),
    );
  }

  /**
   * B9-C (2026-04-24) — Synergia (mode conseil) : prévisualise le coût de
   * staffing mission (400 € fixe). Même pattern que `launchPreparationVeloce`.
   */
  function launchStaffingSynergia() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const r = appliquerApprovisionnementSynergia(next, next.joueurActif);
    if (!r.succes) return;
    const modsFiltrees = (r.modifications as ModificationMoteur[]).filter(
      (m) => m.nouvelleValeur !== m.ancienneValeur,
    );
    setRecentModifications(
      modsFiltrees.map((m) => ({
        poste: m.poste,
        ancienneValeur: m.ancienneValeur,
        nouvelleValeur: m.nouvelleValeur,
      })),
    );
    setActiveStep(
      buildActiveStep(etat, r.modifications as ModificationMoteur[], next, ETAPES.ACHATS_STOCK, {
        titre: "Staffing de la mission",
        icone: "👥",
        description:
          "Coût fixe d'allocation consultants, kickoff et licences outil engagé avant la réalisation.",
      }),
    );
  }

  return {
    // State
    achatQte, setAchatQte,
    achatMode, setAchatMode,
    // Actions
    launchAchat,
    skipAchat,
    launchPreparationVeloce,
    launchStaffingSynergia,
  };
}
