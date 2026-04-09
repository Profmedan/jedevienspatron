"use client";

import { getTotalActif, getTotalPassif, CarteDecision, Joueur } from "@jedevienspatron/game-engine";
import { type ActiveStep } from "./EntryPanel";
import { nomCompte } from "./utils";

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
  setSelectedDecision?: (val: CarteDecision | null) => void;
  cartesDisponibles?: CarteDecision[];
  cartesRecrutement?: CarteDecision[];
  onSkipDecision: () => void;
  onLaunchDecision?: () => void;
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

const STEP_HELP = [
  "Charges fixes obligatoires payées depuis la trésorerie.",
  "Achat de stocks (optionnel)",
  "Vos créances clients avancent et sont encaissées.",
  "Salaires versés. Nouveaux clients générés.",
  "Clients en attente traités → ventes générées.",
  "Effets de vos cartes Décision appliqués.",
  "Sélection de carte de recrutement ou investissement",
  "Une carte Événement sera piochée.",
  "Vérification du bilan. Fin du trimestre.",
];

export function LeftPanel({
  etapeTour,
  tourActuel,
  nbToursMax,
  joueur,
  activeStep,
  onApplyEntry,
  onConfirmStep,
  achatQte,
  setAchatQte,
  achatMode,
  setAchatMode,
  onLaunchAchat,
  onSkipAchat,
  selectedDecision,
  setSelectedDecision,
  cartesDisponibles = [],
  cartesRecrutement = [],
  onSkipDecision,
  onLaunchDecision,
  onLaunchStep,
  onDemanderEmprunt,
  subEtape6,
}: LeftPanelProps) {
  const stepName = STEP_NAMES[etapeTour] || "Étape inconnue";
  const stepHelp = STEP_HELP[etapeTour] || "";
  const totalActif = getTotalActif(joueur);
  const totalPassif = getTotalPassif(joueur);
  const balanced = Math.abs(totalActif - totalPassif) < 0.01;

  if (activeStep) {
    const firstPending = activeStep.entries.find((e) => !e.applied);
    const allApplied = !firstPending;

    return (
      <div className="space-y-4">
        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
          <div className="space-y-4">
            {/* ── Titre de l’action en cours — bien visible ── */}
            <div className="rounded-xl bg-gradient-to-r from-cyan-900/40 to-slate-800/40 border border-cyan-400/20 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Écriture {activeStep.entries.filter((e) => e.applied).length + 1} / {activeStep.entries.length}
              </p>
              <h3 className="mt-1 text-lg font-bold text-white leading-snug">{activeStep.titre}</h3>
            </div>

            {firstPending ? (
              <div className="space-y-3 rounded-xl border border-cyan-400/15 bg-white/[0.04] p-3">
                {/* ── Compte + montant — gros et clair ── */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-200 mb-1">
                    {nomCompte(firstPending.poste)}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-slate-200">{firstPending.sens === "debit" ? "DÉBIT" : "CRÉDIT"}</span>
                    <span className="text-2xl font-black text-white">{firstPending.delta > 0 ? "+" : ""}{firstPending.delta}u</span>
                  </div>
                </div>
                {/* ── Description de l’écriture — lisible ── */}
                <p className="text-sm leading-relaxed text-slate-200">{firstPending.description}</p>
                {/* ── Bulle pédagogique ── */}
                <div className="rounded-lg bg-sky-500/10 border border-sky-400/20 px-3 py-2.5">
                  <p className="text-xs leading-relaxed text-sky-100">💡 {activeStep.principe}</p>
                </div>
                <button
                  onClick={() => onApplyEntry(firstPending.id)}
                  aria-label={`Appliquer l'écriture comptable : ${firstPending.id}`}
                  className="w-full rounded-xl bg-cyan-400 px-3 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  Appliquer cette écriture
                </button>
              </div>
            ) : (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 p-3">
                <p className="text-sm font-medium text-emerald-100">✅ Toutes les écritures saisies.</p>
              </div>
            )}

            {allApplied && (
              <button
                onClick={onConfirmStep}
                aria-label="Confirmer l’étape et passer à la suivante"
                className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
              >
                Confirmer l’étape ✓
              </button>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-3">Parcours</p>
          <div className="space-y-1.5">
            {STEP_NAMES.map((name, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                  idx === etapeTour ? "border border-cyan-400/20 bg-cyan-500/10 text-cyan-100 font-medium"
                  : idx < etapeTour ? "text-emerald-300"
                  : "text-slate-400"
                }`}
              >
                <span className="w-4 text-center">{idx === etapeTour ? "→" : idx < etapeTour ? "✅" : "○"}</span>
                <span>{idx + 1}. {name}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 pt-2 border-t border-white/10">
            {totalActif.toFixed(0)} = {totalPassif.toFixed(0)} {balanced && "✓"}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-3">
          <button
            onClick={onDemanderEmprunt}
            className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/75 hover:border-white/20"
          >
            Demander un emprunt
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              T{tourActuel}/{nbToursMax} · Étape {etapeTour + 1}/9
            </p>
            <h2 className="mt-1 text-base font-semibold text-white">{stepName}</h2>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-sm text-slate-300">{stepHelp}</p>

            {etapeTour === 1 && (
              <div className="space-y-2">
                <div>
                  <label htmlFor="qty" className="block text-xs font-semibold text-white mb-1">Quantité</label>
                  <input
                    id="qty"
                    type="number"
                    min="0"
                    max="10000"
                    value={achatQte}
                    onChange={(e) => setAchatQte(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white mb-1">Mode</p>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={achatMode === "tresorerie"}
                        onChange={() => setAchatMode("tresorerie")}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-slate-300">Comptant</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={achatMode === "dettes"}
                        onChange={() => setAchatMode("dettes")}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-slate-300">À crédit</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onSkipAchat}
                    aria-label="Passer l'étape d'achat de marchandises"
                    className="flex-1 rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/[0.08]"
                  >
                    Passer
                  </button>
                  <button
                    onClick={onLaunchAchat}
                    aria-label="Lancer l'achat de marchandises"
                    className="flex-1 rounded-lg bg-cyan-400 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    Lancer
                  </button>
                </div>
              </div>
            )}

            {etapeTour === 6 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  {subEtape6 === "recrutement" ? "6a — Recrutement" : "6b — Investissement"}
                </p>
                {selectedDecision ? (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 p-2">
                    <p className="text-xs font-semibold text-emerald-100">✅ {selectedDecision.titre}</p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/20 p-2">
                    <p className="text-xs text-cyan-100">👉 Choisis une carte dans le panneau central</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {etapeTour !== 1 && etapeTour !== 6 && (
            <button
              onClick={onLaunchStep}
              className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Commencer l’étape
            </button>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-3">
        <button
          onClick={onDemanderEmprunt}
          className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/75 hover:border-white/20"
        >
          Demander un emprunt
        </button>
        <div className="mt-2 text-[10px] text-slate-400 text-center">
          {totalActif.toFixed(0)} = {totalPassif.toFixed(0)} {balanced && "✓"}
        </div>
      </section>
    </div>
  );
}
