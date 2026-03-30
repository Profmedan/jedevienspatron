"use client";

import { useMemo } from "react";

import { getTotalActif, getTotalPassif } from "@/lib/game-engine/calculators";
import { CarteDecision, Joueur } from "@/lib/game-engine/types";

import { EntryPanel, type ActiveStep } from "./EntryPanel";

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
  onApplyEntryEffect,
  achatQte,
  setAchatQte,
  achatMode,
  setAchatMode,
  onLaunchAchat,
  onSkipAchat,
  onLaunchStep,
  onDemanderEmprunt,
}: LeftPanelProps) {
  const pctTour = Math.round(((tourActuel - 1) / nbToursMax) * 100);
  const stepName = STEP_NAMES[etapeTour] || "Étape inconnue";
  const isAchatStep = etapeTour === 1;
  const isDecisionStep = etapeTour === 6;

  const totalActif = getTotalActif(joueur);
  const totalPassif = getTotalPassif(joueur);
  const balanced = Math.abs(totalActif - totalPassif) < 0.01;

  // If EntryPanel is active, delegate to it
  if (activeStep) {
    return (
      <EntryPanel
        activeStep={activeStep}
        displayJoueur={joueur}
        baseJoueur={joueur}
        onApply={onApplyEntry}
        onApplyEntry={onApplyEntryEffect}
        onConfirm={onConfirmStep}
        onCancel={onCancelStep}
        tourActuel={tourActuel}
        etapeTour={etapeTour}
      />
    );
  }

  // Planning mode: show step list and action
  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Trimestre {tourActuel}/{nbToursMax}
            </p>
            <h2 className="mt-1 text-base font-semibold text-white">
              Étape {etapeTour + 1} sur 9
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-medium text-slate-400">Progression</span>
              <span className="text-sm font-semibold text-cyan-100">{pctTour}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: `${Math.max(8, pctTour)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Current step title and description */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {stepName}
          </p>
          <h3 className="text-base font-semibold text-white">Planification</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Prépare cette étape avant de commencer la saisie comptable.
          </p>
        </div>
      </section>

      {/* Step-specific UI */}
      {isAchatStep && (
        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4 space-y-4">
          <div>
            <label htmlFor="achat-qte" className="block text-sm font-medium text-white mb-2">
              Quantité à acheter
            </label>
            <input
              id="achat-qte"
              type="number"
              min="0"
              max="10000"
              value={achatQte}
              onChange={(e) => setAchatQte(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Mode de financement</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="achat-mode"
                  value="tresorerie"
                  checked={achatMode === "tresorerie"}
                  onChange={(e) => setAchatMode(e.target.value as "tresorerie" | "dettes")}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-300">Trésorerie (comptant)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="achat-mode"
                  value="dettes"
                  checked={achatMode === "dettes"}
                  onChange={(e) => setAchatMode(e.target.value as "tresorerie" | "dettes")}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-300">Dettes (à crédit)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onSkipAchat}
              className="flex-1 rounded-lg border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.08]"
            >
              Sauter
            </button>
            <button
              type="button"
              onClick={onLaunchAchat}
              className="flex-1 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Lancer achat
            </button>
          </div>
        </section>
      )}

      {isDecisionStep && (
        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
          <p className="text-sm text-slate-300">Choix d'une carte dans la zone centrale.</p>
        </section>
      )}

      {/* Steps list */}
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
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isCurrent
                    ? "border border-cyan-400/20 bg-cyan-500/10 text-cyan-100 font-medium"
                    : isDone
                      ? "text-emerald-300"
                      : "text-slate-400"
                }`}
              >
                <span className="w-6 text-center flex-shrink-0">
                  {isDone ? "✅" : isCurrent ? "→" : "○"}
                </span>
                <span>{index + 1}. {name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Launch button */}
      <button
        type="button"
        onClick={onLaunchStep}
        className="w-full rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
      >
        Commencer l'étape
      </button>

      {/* Loan link */}
      <button
        type="button"
        onClick={onDemanderEmprunt}
        className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.05]"
      >
        Demander un emprunt
      </button>
    </div>
  );
}
