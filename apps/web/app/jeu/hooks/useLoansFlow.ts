/**
 * Sous-hook : emprunts bancaires
 * Gère l'état et la logique de demande d'emprunt.
 */

import { useState } from "react";
import {
  EtatJeu, ResultatDemandePret, MONTANTS_EMPRUNT, demanderEmprunt,
} from "@jedevienspatron/game-engine";
import { type ActiveStep } from "@/components/jeu";
import { cloneEtat, type ModificationMoteur } from "./gameFlowUtils";
import type { JournalEntry } from "./useGameFlow";

// ─── Paramètres ────────────────────────────────────────────────────────────────

interface LoansFlowParams {
  etat: EtatJeu | null;
  setEtat: (e: EtatJeu | null) => void;
  setRecentModifications: (mods: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number; ligneNom?: string }>) => void;
  addToJournal: (e: EtatJeu, entries: ActiveStep["entries"], etape: number) => void;
  setActiveTab: (tab: "bilan" | "cr" | "indicateurs" | "glossaire" | "vue-ensemble" | "impact") => void;
  setHighlightedPoste: (v: string | null) => void;
  setFlashData: (v: { poste: string; avant: number; apres: number } | null) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLoansFlow({
  etat, setEtat,
  setRecentModifications,
  addToJournal,
  setActiveTab, setHighlightedPoste, setFlashData,
}: LoansFlowParams) {
  const [showDemandeEmprunt, setShowDemandeEmprunt] = useState(false);
  const [montantEmpruntChoisi, setMontantEmpruntChoisi] = useState<number>(MONTANTS_EMPRUNT[1]);
  const [reponseEmprunt, setReponseEmprunt] = useState<ResultatDemandePret | null>(null);

  function handleDemanderEmprunt() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const { resultat, modifications } = demanderEmprunt(next, next.joueurActif, montantEmpruntChoisi);
    setReponseEmprunt(resultat);
    if (resultat.accepte) {
      const mods = modifications.map((m: ModificationMoteur) => ({
        poste: m.poste,
        ancienneValeur: m.ancienneValeur,
        nouvelleValeur: m.nouvelleValeur,
      }));
      setEtat({ ...next });
      setRecentModifications(mods);
      const firstMod = mods[0];
      if (firstMod) {
        setActiveTab("bilan");
        setFlashData({ poste: firstMod.poste, avant: firstMod.ancienneValeur, apres: firstMod.nouvelleValeur });
        setHighlightedPoste(firstMod.poste);
        setTimeout(() => setHighlightedPoste(null), 5000);
      }
      addToJournal(next, modifications.map((m: ModificationMoteur, i: number) => ({
        id: `emprunt_${i}`,
        poste: m.poste,
        delta: m.nouvelleValeur - m.ancienneValeur,
        description: m.explication,
        applied: true,
        sens: m.nouvelleValeur - m.ancienneValeur > 0 ? "credit" as const : "debit" as const,
      })), 99);
    }
  }

  return {
    // State
    showDemandeEmprunt, setShowDemandeEmprunt,
    montantEmpruntChoisi, setMontantEmpruntChoisi,
    reponseEmprunt, setReponseEmprunt,
    // Actions
    handleDemanderEmprunt,
  };
}
