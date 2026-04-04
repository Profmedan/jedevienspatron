"use client";

import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface UseGameUIStateReturn {
  /** Onglet actif dans le panneau central */
  activeTab: "bilan" | "cr" | "indicateurs" | "glossaire" | "vue-ensemble" | "impact";
  setActiveTab: (tab: "bilan" | "cr" | "indicateurs" | "glossaire" | "vue-ensemble" | "impact") => void;
  /** Onglet actif dans le panneau droit (RightPanel) */
  rightTab: string;
  setRightTab: (tab: string) => void;
  /** Poste comptable surligné temporairement */
  highlightedPoste: string | null;
  setHighlightedPoste: (v: string | null) => void;
  /** Mode rapide : écritures auto-cochées */
  modeRapide: boolean;
  setModeRapide: (v: boolean) => void;
  /** Données flash pour l'animation ImpactFlash */
  flashData: { poste: string; avant: number; apres: number } | null;
  setFlashData: (v: { poste: string; avant: number; apres: number } | null) => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useGameUIState(): UseGameUIStateReturn {
  const [activeTab, setActiveTab] = useState<"bilan" | "cr" | "indicateurs" | "glossaire" | "vue-ensemble" | "impact">("bilan");
  const [rightTab, setRightTab] = useState<string>("resume");
  const [highlightedPoste, setHighlightedPoste] = useState<string | null>(null);
  const [modeRapide, setModeRapide] = useState(false);
  const [flashData, setFlashData] = useState<{ poste: string; avant: number; apres: number } | null>(null);

  return {
    activeTab,
    setActiveTab,
    rightTab,
    setRightTab,
    highlightedPoste,
    setHighlightedPoste,
    modeRapide,
    setModeRapide,
    flashData,
    setFlashData,
  };
}
