"use client";

import { Joueur } from "@/lib/game-engine/types";
import { getTotalActif, getTotalPassif } from "@/lib/game-engine/calculators";
import { EntryCard, type EntryLine } from "./EntryCard";

export interface ActiveStep {
  titre: string;
  icone: string;
  description: string;
  principe: string;
  conseil: string;
  entries: EntryLine[];
  baseEtat: any; // EtatJeu snapshot
  previewEtat: any; // EtatJeu preview
}

interface EntryPanelProps {
  activeStep: ActiveStep;
  displayJoueur: Joueur;
  onApply: (id: string) => void;
  onApplyEntry?: (poste: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Panneau interactif de saisie des écritures comptables.
 *
 * Améliorations pédagogiques :
 *  - Compteur de progression (N/M écritures saisies) avec barre de progrès
 *  - Visualisation de la règle de la partie double : Σ Débits = Σ Crédits
 *  - Indicateur d'équilibre du bilan en temps réel
 *  - Principe comptable + conseil mis en valeur
 */
export function EntryPanel({
  activeStep,
  displayJoueur,
  onApply,
  onApplyEntry,
  onConfirm,
  onCancel,
}: EntryPanelProps) {
  const totalCount   = activeStep.entries.length;
  const appliedCount = activeStep.entries.filter((e) => e.applied).length;
  const pendingCount = totalCount - appliedCount;
  const allApplied   = pendingCount === 0;

  const totalActif  = getTotalActif(displayJoueur);
  const totalPassif = getTotalPassif(displayJoueur);
  const balanced    = Math.abs(totalActif - totalPassif) < 0.01;
  const canContinue = allApplied && balanced;

  const debits  = activeStep.entries.filter((e) => e.sens === "debit");
  const credits = activeStep.entries.filter((e) => e.sens === "credit");

  // Somme des valeurs absolues pour visualiser la règle Σ Débits = Σ Crédits
  const sumDebits  = debits.reduce((s, e) => s + Math.abs(e.delta), 0);
  const sumCredits = credits.reduce((s, e) => s + Math.abs(e.delta), 0);
  const partieDoubleOk = Math.abs(sumDebits - sumCredits) < 0.01;

  const progressPct = totalCount > 0 ? Math.round((appliedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-3">

      {/* ── En-tête de l'étape ── */}
      <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/30 rounded-xl p-3 border border-indigo-700 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{activeStep.icone}</span>
          <span className="font-bold text-indigo-200 text-sm leading-tight">{activeStep.titre}</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">{activeStep.description}</p>
      </div>

      {/* ── Bloc écritures ── */}
      {activeStep.entries.length > 0 ? (
        <div>
          {/* Barre de progression */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                ✏️ Écritures à saisir
              </span>
              <span className={`text-xs font-black tabular-nums ${allApplied ? "text-emerald-600" : "text-indigo-600"}`}>
                {appliedCount}/{totalCount}
                {allApplied ? " ✅" : ` — encore ${pendingCount}`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allApplied ? "bg-emerald-500" : "bg-indigo-500"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Débits */}
          {debits.length > 0 && (
            <div className="mb-1">
              <div className="text-xs font-black text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 bg-blue-400 rounded" />
                📤 Débits (Emplois)
                <span className="font-normal text-blue-400 normal-case tracking-normal text-[10px]">
                  — ce qu&apos;on utilise / ce qui augmente
                </span>
              </div>
              {debits.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  onApply={() => {
                    onApply(e.id);
                    onApplyEntry?.(e.poste);
                  }}
                />
              ))}
            </div>
          )}

          {/* Crédits */}
          {credits.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-black text-orange-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 bg-orange-400 rounded" />
                📥 Crédits (Ressources)
                <span className="font-normal text-orange-400 normal-case tracking-normal text-[10px]">
                  — d&apos;où vient le financement
                </span>
              </div>
              {credits.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  onApply={() => {
                    onApply(e.id);
                    onApplyEntry?.(e.poste);
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Règle de la partie double : Σ Débits = Σ Crédits ── */}
          {debits.length > 0 && credits.length > 0 && (
            <div
              className={`mt-2 rounded-xl px-3 py-2 border flex items-center justify-between text-xs font-bold ${
                partieDoubleOk
                  ? "bg-indigo-950/50 border-indigo-700 text-indigo-300"
                  : "bg-amber-950/40 border-amber-600 text-amber-300"
              }`}
            >
              <span>
                <span className="text-blue-400">Σ Débits</span>{" "}
                <span className="font-black tabular-nums">{sumDebits}</span>
              </span>
              <span className={`text-base ${partieDoubleOk ? "text-indigo-500" : "text-amber-500"}`}>
                {partieDoubleOk ? "=" : "≠"}
              </span>
              <span>
                <span className="text-orange-400">Σ Crédits</span>{" "}
                <span className="font-black tabular-nums">{sumCredits}</span>
              </span>
              <span className="text-[10px] font-normal opacity-70 ml-1">
                {partieDoubleOk ? "✓ partie double respectée" : "à vérifier"}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-400 text-center italic border border-gray-700">
          Aucune écriture à passer pour cette étape.
        </div>
      )}

      {/* ── Équilibre du bilan en temps réel ── */}
      <div
        className={`rounded-xl p-2.5 text-center text-xs font-bold transition-all border ${
          canContinue
            ? "bg-emerald-950/40 text-emerald-300 border-emerald-700"
            : !allApplied
              ? "bg-gray-800 text-gray-400 border-gray-700"
              : "bg-red-950/40 text-red-400 border-red-700"
        }`}
        role="status"
      >
        <div className="text-sm">
          ACTIF <strong className="tabular-nums">{totalActif}</strong>{" "}
          <span className={balanced ? "text-emerald-400" : "text-red-400"}>{balanced ? "=" : "≠"}</span>{" "}
          PASSIF <strong className="tabular-nums">{totalPassif}</strong>
        </div>
        <div className="mt-0.5 font-medium">
          {canContinue
            ? "✅ Bilan équilibré — vous pouvez continuer !"
            : !allApplied
              ? `⏳ Encore ${pendingCount} écriture${pendingCount > 1 ? "s" : ""} à saisir`
              : "⚠️ Déséquilibre — vérifiez vos écritures"}
        </div>
      </div>

      {/* ── Principe comptable ── */}
      <div className="bg-indigo-950/40 rounded-xl p-2.5 border border-indigo-800/50 shadow-sm">
        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
          📚 Principe comptable
        </div>
        <p className="text-xs text-indigo-200 leading-relaxed">{activeStep.principe}</p>
      </div>

      {/* ── Conseil ── */}
      <div className="bg-amber-950/30 rounded-xl p-2.5 border border-amber-800/50 shadow-sm">
        <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
          💡 Conseil
        </div>
        <p className="text-xs text-amber-300 leading-relaxed">{activeStep.conseil}</p>
      </div>

      {/* ── Boutons d'action ── */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-600 rounded-xl text-gray-400 text-xs hover:bg-gray-800 transition-colors font-medium"
          aria-label="Revenir à l'étape"
        >
          ← Revenir
        </button>
        {canContinue && (
          <button
            onClick={onConfirm}
            className="flex-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-sm active:scale-95"
            aria-label="Confirmer et continuer"
          >
            ✅ Continuer →
          </button>
        )}
      </div>
    </div>
  );
}
