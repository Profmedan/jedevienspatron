"use client";

import { useMemo, useState } from "react";

import { getTotalActif, getTotalPassif } from "@/lib/game-engine/calculators";
import { CarteDecision, Joueur } from "@/lib/game-engine/types";

import { type ActiveStep } from "./EntryPanel";
import { nomCompte, getSens, getDocumentType } from "./utils";

const STEP_NAMES = [
  "Charges fixes",
  "Approvisionnement",
  "Avancement créances",
  "Paiement commerciaux",
  "Traitement ventes",
  "Effets récurrents",
  "Décisions",
  "Événement",
  "Bilan trimestre",
];

interface JournalEntry {
  id: number;
  tour: number;
  etape: number;
  joueurNom: string;
  titre: string;
  entries: Array<{ poste: string; delta: number; applied?: boolean }>;
  principe: string;
}

interface LeftPanelProps {
  etapeTour: number;
  tourActuel: number;
  nbToursMax: number;
  joueur: Joueur;
  activeStep: ActiveStep | null;
  onApplyEntry: (id: string) => void;
  onConfirmStep: () => void;
  onCancelStep: () => void;
  onApplyEntryEffect?: (poste: string) => void;
  achatQte: number;
  setAchatQte: (val: number) => void;
  achatMode: "tresorerie" | "dettes";
  setAchatMode: (val: "tresorerie" | "dettes") => void;
  onLaunchAchat: () => void;
  onSkipAchat: () => void;
  selectedDecision: CarteDecision | null;
  onSkipDecision: () => void;
  decisionError: string | null;
  onLaunchStep: () => void;
  journal: JournalEntry[];
  subEtape6?: "recrutement" | "investissement";
  modeRapide?: boolean;
  setModeRapide?: (val: boolean) => void;
  modalEtapeEnAttente?: number | null;
  onCloseModal?: () => void;
  onDemanderEmprunt?: () => void;
}

export function LeftPanel({
  etapeTour,
  tourActuel,
  nbToursMax,
  joueur,
  activeStep,
  onApplyEntry,
  onConfirmStep,
  onCancelStep,
  achatQte,
  setAchatQte,
  achatMode,
  setAchatMode,
  onLaunchAchat,
  onSkipAchat,
  onLaunchStep,
  onDemanderEmprunt,
}: LeftPanelProps) {
  const [navTab, setNavTab] = useState<"steps" | "achat">("steps");

  const pctTour = Math.round(((tourActuel - 1) / nbToursMax) * 100);
  const stepName = STEP_NAMES[etapeTour] || "Étape inconnue";
  const isAchatStep = etapeTour === 1;

  const totalActif = getTotalActif(joueur);
  const totalPassif = getTotalPassif(joueur);
  const balanced = Math.abs(totalActif - totalPassif) < 0.01;

  // Saisie mode: show writing + progress
  if (activeStep) {
    const firstPending = activeStep.entries.find((e) => !e.applied);
    const allApplied = !firstPending;

    return (
      <div className="space-y-4">
        {/* Window 1: Current entry being written */}
        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Écriture {activeStep.entries.filter((e) => e.applied).length + 1} sur{" "}
                {activeStep.entries.length}
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">{activeStep.titre}</h3>
            </div>

            {firstPending ? (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">
                    {nomCompte(firstPending.poste)}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">
                      {firstPending.sens === "debit" ? "DÉBIT" : "CRÉDIT"}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {firstPending.delta > 0 ? "+" : ""}{firstPending.delta} u
                    </span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {firstPending.description}
                </p>

                <div className="rounded-lg bg-sky-500/10 border border-sky-400/20 px-2 py-2">
                  <p className="text-[10px] leading-relaxed text-sky-100">
                    💡 {activeStep.principe}
                  </p>
                </div>

                <button
                  onClick={() => onApplyEntry(firstPending.id)}
                  className="w-full mt-2 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  Appliquer cette écriture
                </button>
              </div>
            ) : (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 p-3">
                <p className="text-sm font-medium text-emerald-100">
                  ✅ Toutes les écritures saisies.
                </p>
              </div>
            )}

            {allApplied && (
              <button
                onClick={onConfirmStep}
                className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
              >
                Confirmer l'étape ✓
              </button>
            )}
          </div>
        </section>

        {/* Window 2: Progression */}
        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-3">
            Parcours du trimestre
          </p>
          <div className="space-y-2">
            {STEP_NAMES.map((name, index) => {
              const isDone = index < etapeTour;
              const isCurrent = index === etapeTour;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                    isCurrent
                      ? "border border-cyan-400/20 bg-cyan-500/10 text-cyan-100 font-medium"
                      : isDone
                        ? "text-emerald-300"
                        : "text-slate-400"
                  }`}
                >
                  <span className="w-5 text-center flex-shrink-0">
                    {isDone ? "✅" : isCurrent ? "→" : "○"}
                  </span>
                  <span>{index + 1}. {name}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[11px] text-slate-400 pt-2 border-t border-white/10">
            Partie double: {totalActif.toFixed(0)} = {totalPassif.toFixed(0)}{" "}
            {balanced && "✓"}
          </div>
        </section>
      </div>
    );
  }

  // Planning mode: show navigation + actions
  return (
    <div className="space-y-4">
      {/* Window 1: Navigation */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Trimestre {tourActuel}/{nbToursMax} · Étape {etapeTour + 1}/9
            </p>
            <h2 className="mt-1 text-base font-semibold text-white">{stepName}</h2>
          </div>

          {/* Tabs: Steps | Achat (if step 1) */}
          <div className="flex gap-2 border-b border-white/10">
            <button
              onClick={() => setNavTab("steps")}
              className={`pb-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                navTab === "steps"
                  ? "text-cyan-100 border-b-2 border-cyan-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Étapes
            </button>
            {isAchatStep && (
              <button
                onClick={() => setNavTab("achat")}
                className={`pb-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                  navTab === "achat"
                    ? "text-cyan-100 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Achat*
              </button>
            )}
          </div>

          {/* Tab content */}
          {navTab === "steps" ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {STEP_NAMES.map((name, index) => {
                const isDone = index < etapeTour;
                const isCurrent = index === etapeTour;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                      isCurrent
                        ? "border border-cyan-400/20 bg-cyan-500/10 text-cyan-100 font-medium"
                        : isDone
                          ? "text-emerald-300"
                          : "text-slate-400"
                    }`}
                  >
                    <span className="w-5 text-center flex-shrink-0">
                      {isDone ? "✅" : isCurrent ? "→" : "○"}
                    </span>
                    <span>{index + 1}. {name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="achat-qte" className="block text-xs font-semibold text-white mb-2">
                  Quantité
                </label>
                <input
                  id="achat-qte"
                  type="number"
                  min="0"
                  max="10000"
                  value={achatQte}
                  onChange={(e) => setAchatQte(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-white mb-2">Mode</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="achat-mode"
                      value="tresorerie"
                      checked={achatMode === "tresorerie"}
                      onChange={(e) => setAchatMode(e.target.value as "tresorerie" | "dettes")}
                      className="w-3 h-3"
                    />
                    <span className="text-xs text-slate-300">Trésorerie</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="achat-mode"
                      value="dettes"
                      checked={achatMode === "dettes"}
                      onChange={(e) => setAchatMode(e.target.value as "tresorerie" | "dettes")}
                      className="w-3 h-3"
                    />
                    <span className="text-xs text-slate-300">À crédit</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onSkipAchat}
                  className="flex-1 rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-white/[0.08]"
                >
                  Sauter
                </button>
                <button
                  type="button"
                  onClick={onLaunchAchat}
                  className="flex-1 rounded-lg bg-cyan-400 px-2 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  Lancer
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLaunchStep}
            className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            Commencer l'étape
          </button>
        </div>
      </section>

      {/* Window 2: Secondary action */}
      <button
        type="button"
        onClick={onDemanderEmprunt}
        className="w-full rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-950/90 hover:border-white/20"
      >
        Demander un emprunt
      </button>
    </div>
  );
}
