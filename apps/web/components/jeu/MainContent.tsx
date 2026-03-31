"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  CarteDecision,
  Joueur,
} from "@/lib/game-engine/types";
import { getTresorerie } from "@/lib/game-engine/calculators";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import IndicateursPanel from "@/components/IndicateursPanel";
import { GlossairePanel } from "@/components/GlossairePanel";

import { type ActiveStep } from "./EntryPanel";
import { nomCompte } from "./utils";

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
  joueur,
  displayJoueur,
  activeStep: _activeStep,
  highlightedPoste: _highlightedPoste,
  etapeTour,
  activeTab,
  setActiveTab,
  showCartes: _showCartes,
  selectedDecision,
  setSelectedDecision,
  cartesDisponibles,
  cartesRecrutement: cartesRecrutementProp,
  recentModifications: _recentModifications,
  subEtape6 = "recrutement",
  modeRapide: _modeRapide,
  onSkipDecision,
  onLaunchDecision,
}: MainContentProps) {
  const cartesRecrutement =
    cartesRecrutementProp ?? cartesDisponibles.filter((carte) => carte.categorie === "commercial");
  const cartesAutres = cartesDisponibles.filter((carte) => carte.categorie !== "commercial");
  const cartesInvestDisponibles = cartesAutres.filter(
    (carte) => !joueur.cartesActives.some((active) => active.id === carte.id),
  );

  // Auto-switch to CR tab when activeStep exits
  useEffect(() => {
    if (!_activeStep && activeTab === "impact") {
      setActiveTab("cr");
    }
  }, [_activeStep, activeTab, setActiveTab]);

  return (
    <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
      <div className="space-y-4">
        {/* Company header - only in non-active mode */}
        {!_activeStep && (
          <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-2xl">
                {joueur.entreprise.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Entreprise
                </p>
                <h1 className="text-lg font-semibold text-white">{joueur.pseudo}</h1>
                <p className="text-xs text-slate-400">
                  {joueur.entreprise.nom} · Étape {etapeTour + 1}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Étape 6 card selection - overlay when etapeTour === 6 && no activeStep */}
        {etapeTour === 6 && !_activeStep && (
          <section className="rounded-[28px] border border-cyan-400/20 bg-cyan-500/10 px-4 py-4">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                {subEtape6 === "recrutement" ? "Étape 6a - Recrutement" : "Étape 6b - Investissement"}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">Choisir une carte</h2>
            </div>

            {selectedDecision && (
              <div className="mb-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-3">
                <p className="text-xs text-cyan-200">Sélectionnée:</p>
                <p className="font-semibold text-white">{selectedDecision.titre}</p>
                {onLaunchDecision && (
                  <button
                    type="button"
                    onClick={onLaunchDecision}
                    className="mt-2 w-full rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
                  >
                    Exécuter
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              {subEtape6 === "recrutement"
                ? cartesRecrutement.map((carte) => (
                    <button
                      key={carte.id}
                      type="button"
                      onClick={() =>
                        setSelectedDecision(selectedDecision?.id === carte.id ? null : carte)
                      }
                      className={`w-full rounded-2xl border px-3 py-2 text-left text-xs transition-colors ${
                        selectedDecision?.id === carte.id
                          ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      <p className="font-semibold">{carte.titre}</p>
                      {carte.description && (
                        <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">
                          {carte.description}
                        </p>
                      )}
                    </button>
                  ))
                : cartesInvestDisponibles.map((carte) => (
                    <button
                      key={carte.id}
                      type="button"
                      onClick={() =>
                        setSelectedDecision(selectedDecision?.id === carte.id ? null : carte)
                      }
                      className={`w-full rounded-2xl border px-3 py-2 text-left text-xs transition-colors ${
                        selectedDecision?.id === carte.id
                          ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      <p className="font-semibold">{carte.titre}</p>
                      {carte.description && (
                        <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">
                          {carte.description}
                        </p>
                      )}
                    </button>
                  ))}
            </div>

            {onSkipDecision && (
              <button
                type="button"
                onClick={onSkipDecision}
                className="mt-3 w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.05]"
              >
                {subEtape6 === "recrutement" ? "Passer à l'investissement" : "Passer"}
              </button>
            )}
          </section>
        )}

        {/* WINDOW 1: BILAN — ALWAYS VISIBLE */}
        <BilanPanel joueur={displayJoueur} highlightedPoste={null} />

        {/* TAB BAR — switches Window 2 only */}
        <div className="rounded-[24px] border border-white/10 bg-slate-950/70 px-3 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0" role="tablist">
            {[
              ["cr", "Résultat"],
              ["indicateurs", "Indicateurs"],
              ["glossaire", "Glossaire"],
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab as TabType)}
                className={`rounded-2xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
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

        {/* WINDOW 2: DYNAMIC CONTENT — based on activeTab */}
        <AnimatePresence mode="wait">
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
                highlightedPoste={null}
                etapeTour={etapeTour}
                hasActiveStep={false}
              />
            </motion.div>
          )}

          {activeTab === "indicateurs" && (
            <motion.div
              key="indicateurs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <IndicateursPanel joueur={displayJoueur} />
            </motion.div>
          )}

          {activeTab === "glossaire" && (
            <motion.div
              key="glossaire"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <GlossairePanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
