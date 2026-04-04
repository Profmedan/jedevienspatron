"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  CarteDecision,
  Joueur,
} from "@jedevienspatron/game-engine";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";

import { type ActiveStep } from "./EntryPanel";
import { getDocumentType } from "./utils";

type TabType = "bilan" | "cr" | "indicateurs" | "glossaire" | "vue-ensemble" | "impact";

interface MainContentProps {
  joueur: Joueur;
  displayJoueur: Joueur;
  activeStep: ActiveStep | null;
  highlightedPoste: string | null;
  etapeTour: number;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  showCartes: boolean;
  selectedDecision: CarteDecision | null;
  setSelectedDecision: (val: CarteDecision | null) => void;
  cartesDisponibles: CarteDecision[];
  cartesRecrutement?: CarteDecision[];
  recentModifications?: Array<{
    poste: string;
    ancienneValeur: number;
    nouvelleValeur: number;
  }>;
  subEtape6?: "recrutement" | "investissement";
  modeRapide?: boolean;
  onSkipDecision?: () => void;
  onLaunchDecision?: () => void;
}

export function MainContent({
  joueur: _joueur,
  displayJoueur,
  activeStep: _activeStep,
  highlightedPoste: _highlightedPoste,
  etapeTour,
  activeTab: initialTab,
  setActiveTab,
  showCartes: _showCartes,
  selectedDecision,
  setSelectedDecision,
  cartesDisponibles,
  cartesRecrutement = [],
  recentModifications: _recentModifications,
  subEtape6,
  modeRapide: _modeRapide,
  onSkipDecision,
  onLaunchDecision,
}: MainContentProps) {
  const [activeTab, setLocalActiveTab] = useState<TabType>(initialTab === "bilan" || initialTab === "cr" ? initialTab : "bilan");

  const handleTabChange = (tab: TabType) => {
    setLocalActiveTab(tab);
    setActiveTab(tab);
  };

  // Auto-switch to the tab matching the current entry’s document type (Bilan or CR)
  // When an entry is applied → show its document so the user sees the impact.
  // On first load (nothing applied yet) → show the first pending entry’s document.
  const appliedCount = _activeStep?.entries.filter(e => e.applied).length ?? 0;
  useEffect(() => {
    if (!_activeStep) return;
    const appliedEntries = _activeStep.entries.filter(e => e.applied);
    let poste: string | undefined;
    if (appliedEntries.length > 0) {
      // Show the document for the entry that was just applied
      poste = appliedEntries[appliedEntries.length - 1].poste;
    } else {
      // Initial load: show the first pending entry’s document
      const firstPending = _activeStep.entries.find(e => !e.applied);
      poste = firstPending?.poste;
    }
    if (!poste) return;
    const docType = getDocumentType(poste);
    const target: TabType = docType === "CR" ? "cr" : "bilan";
    setLocalActiveTab(target);
    setActiveTab(target);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCount, _activeStep?.titre]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-white/10 bg-slate-950 px-4 py-3">
        <div className="flex gap-2" role="tablist">
          {[
            ["bilan", "Bilan"],
            ["cr", "Compte de Résultat"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => handleTabChange(tab as TabType)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
                activeTab === tab
                  ? "bg-cyan-500 text-white"
                  : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 6 card selection — shown in center panel */}
      {etapeTour === 6 && !_activeStep && (
        <div className="flex-shrink-0 border-b border-white/10 px-4 py-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {subEtape6 === "recrutement" ? "6a — Recrutement" : "6b — Investissement"}
            </p>

            {/* Card list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(subEtape6 === "recrutement" ? cartesRecrutement : cartesDisponibles).map((carte) => (
                <button
                  key={carte.id}
                  onClick={() => setSelectedDecision(selectedDecision?.id === carte.id ? null : carte)}
                  className={`w-full text-left rounded-lg border p-2 transition-colors ${
                    selectedDecision?.id === carte.id
                      ? "border-cyan-400/40 bg-cyan-500/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{carte.titre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{carte.description}</p>
                  {carte.effetsImmédiats.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {carte.effetsImmédiats.map((e, i) => (
                        <span key={i} className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                          {e.poste}: {e.delta > 0 ? "+" : ""}{e.delta}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {(subEtape6 === "recrutement" ? cartesRecrutement : cartesDisponibles).length === 0 && (
                <p className="text-xs text-slate-500 italic">Aucune carte disponible</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={onSkipDecision}
                className="flex-1 rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/[0.08]"
              >
                Passer
              </button>
              {selectedDecision && onLaunchDecision && (
                <button
                  onClick={onLaunchDecision}
                  className="flex-1 rounded-lg bg-cyan-400 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Exécuter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <AnimatePresence mode="wait">
          {activeTab === "bilan" && (
            <motion.div
              key="bilan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <BilanPanel joueur={displayJoueur} highlightedPoste={_highlightedPoste} recentModifications={_recentModifications} />
            </motion.div>
          )}

          {activeTab === "cr" && (
            <motion.div
              key="cr"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <CompteResultatPanel
                joueur={displayJoueur}
                highlightedPoste={_highlightedPoste}
                recentModifications={_recentModifications}
                etapeTour={etapeTour}
                hasActiveStep={!!_activeStep}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
