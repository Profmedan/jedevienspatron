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
import { getDocumentType, getPosteValue, nomCompte, getSens, getEffetTexte, getPedagogieContexte } from "./utils";

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

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export function MainContent({
  joueur,
  displayJoueur,
  activeStep,
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

  const currentCash = getTresorerie(displayJoueur);

  // Auto-switch to impact tab when activeStep is set
  useEffect(() => {
    if (activeStep) {
      setActiveTab("impact");
    }
  }, [activeStep, setActiveTab]);

  // Tabs to show based on state
  const tabsToShow: Array<[TabType, string]> = activeStep
    ? [["impact", "⚡ Impact"]]
    : [
        ["bilan", "Bilan"],
        ["cr", "CR"],
        ["indicateurs", "Indicateurs"],
        ["glossaire", "Glossaire"],
        ["vue-ensemble", "Vue d'ensemble"],
      ];

  // Get first non-applied entry for display
  const currentEntry = activeStep?.entries.find((e) => !e.applied);
  const completedCount = activeStep?.entries.filter((e) => e.applied).length ?? 0;
  const totalCount = activeStep?.entries.length ?? 0;

  return (
    <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
      <div className="space-y-5">
        {/* FOCUS MODE: Active Step */}
        {activeStep && (
          <>
            {/* Tab bar - always visible during focus mode */}
            <div className="rounded-[24px] border border-white/10 bg-slate-950/70 px-3 py-3">
              <div className="flex gap-2" role="tablist" aria-label="Mode saisie">
                {tabsToShow.map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
                      activeTab === tab
                        ? "bg-violet-500 text-white"
                        : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact tab - focused writing entry card */}
            {activeTab === "impact" && currentEntry && (
              <AnimatePresence mode="wait">
                <motion.section
                  key={currentEntry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-[28px] border border-violet-400/20 bg-violet-500/10 px-6 py-6"
                >
                  {/* Header with count and title */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-violet-200">
                        Écriture {completedCount + 1} sur {totalCount}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{activeStep.titre}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">{formatSigned(currentEntry.delta)}</p>
                      <p className="text-xs text-slate-400">{nomCompte(currentEntry.poste)}</p>
                    </div>
                  </div>

                  {/* Debit section */}
                  <div className="mb-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
                      Débit
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold text-white">
                        {nomCompte(currentEntry.poste)}
                      </p>
                      <p className="text-xs text-slate-400">{formatSigned(currentEntry.delta)} u</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        {getSens(currentEntry.poste, currentEntry.delta) === "debit"
                          ? "Débiter un compte = augmenter un actif ou une charge"
                          : "Débiter un compte = diminuer un passif ou un produit"}
                      </p>
                    </div>
                  </div>

                  {/* Credit section */}
                  <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                      Crédit
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold text-white">Trésorerie (contrepartie)</p>
                      <p className="text-xs text-slate-400">{formatSigned(-currentEntry.delta)} u</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        Créditer un compte = augmenter un passif ou un produit · diminuer un actif
                      </p>
                    </div>
                  </div>

                  {/* Effect and pedagogy */}
                  {getEffetTexte(currentEntry.poste, currentEntry.delta) && (
                    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Effet pédagogique
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-200">
                        {getEffetTexte(currentEntry.poste, currentEntry.delta)}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        {getPedagogieContexte(
                          currentEntry.poste,
                          currentEntry.delta,
                          getSens(currentEntry.poste, currentEntry.delta) === "debit"
                        )}
                      </p>
                    </div>
                  )}

                  {/* Completed entries summary */}
                  {completedCount > 0 && (
                    <div className="mb-6 border-t border-white/10 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Écritures saisies
                      </p>
                      <div className="mt-2 space-y-1">
                        {activeStep.entries
                          .filter((e) => e.applied)
                          .map((e) => (
                            <div key={e.id} className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="text-emerald-300">✅</span>
                              <span>{nomCompte(e.poste)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="w-full rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                    >
                      Appliquer cette écriture
                    </button>

                    {completedCount === totalCount && (
                      <button
                        type="button"
                        className="w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                      >
                        Confirmer et passer à l'étape suivante
                      </button>
                    )}
                  </div>
                </motion.section>
              </AnimatePresence>
            )}

            {/* Other tabs in focus mode */}
            {activeTab === "bilan" && <BilanPanel joueur={displayJoueur} highlightedPoste={null} />}
            {activeTab === "cr" && (
              <CompteResultatPanel joueur={displayJoueur} highlightedPoste={null} etapeTour={etapeTour} hasActiveStep={true} />
            )}
            {activeTab === "indicateurs" && <IndicateursPanel joueur={displayJoueur} />}
            {activeTab === "glossaire" && <GlossairePanel />}
          </>
        )}

        {/* DASHBOARD MODE: No Active Step */}
        {!activeStep && (
          <>
            {/* Company header */}
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

            {/* Étape 6 card selection */}
            {etapeTour === 6 && (
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

                {/* Simple card list */}
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

            {/* Tab bar */}
            <div className="rounded-[24px] border border-white/10 bg-slate-950/70 px-3 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0" role="tablist">
                {tabsToShow.map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
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

            {/* Tab content */}
            {activeTab === "bilan" && (
              <BilanPanel joueur={displayJoueur} highlightedPoste={null} recentModifications={_recentModifications} />
            )}
            {activeTab === "cr" && (
              <CompteResultatPanel
                joueur={displayJoueur}
                highlightedPoste={null}
                etapeTour={etapeTour}
                hasActiveStep={false}
                recentModifications={_recentModifications}
              />
            )}
            {activeTab === "indicateurs" && <IndicateursPanel joueur={displayJoueur} />}
            {activeTab === "glossaire" && <GlossairePanel />}
            {activeTab === "vue-ensemble" && (
              <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Vue d'ensemble
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-white">État de l'entreprise</h2>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-500">Nom</p>
                        <p className="font-semibold text-white">{joueur.entreprise.nom}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Trésorerie</p>
                        <p className={`font-semibold ${currentCash >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          {currentCash} u
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Cartes actives</p>
                        <p className="font-semibold text-white">{joueur.cartesActives.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
