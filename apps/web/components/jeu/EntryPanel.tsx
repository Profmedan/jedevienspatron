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
 * Panneau interactif pour saisir les écritures comptables
 * Affiche les débits/crédits séparément
 * Vérifie l'équilibre du bilan en temps réel
 */
export function EntryPanel({
  activeStep,
  displayJoueur,
  onApply,
  onApplyEntry,
  onConfirm,
  onCancel,
}: EntryPanelProps) {
  const pendingCount = activeStep.entries.filter((e) => !e.applied).length;
  const allApplied = pendingCount === 0;

  const totalActif = getTotalActif(displayJoueur);
  const totalPassif = getTotalPassif(displayJoueur);
  const balanced = Math.abs(totalActif - totalPassif) < 0.01;
  const canContinue = allApplied && balanced;

  const debits = activeStep.entries.filter((e) => e.sens === "debit");
  const credits = activeStep.entries.filter((e) => e.sens === "credit");

  return (
    <div className="space-y-3">
      {/* En-tête de l'étape */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{activeStep.icone}</span>
          <span className="font-bold text-indigo-900 text-sm">{activeStep.titre}</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{activeStep.description}</p>
      </div>

      {/* Écritures à saisir */}
      {activeStep.entries.length > 0 ? (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            ✏️ Cliquez sur chaque écriture pour l'appliquer :
          </div>

          {/* Débits */}
          {debits.length > 0 && (
            <>
              <div className="text-xs text-blue-500 font-semibold mb-1">
                📤 DÉBITS (Emplois)
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
            </>
          )}

          {/* Crédits */}
          {credits.length > 0 && (
            <>
              <div className="text-xs text-orange-500 font-semibold mb-1 mt-2">
                📥 CRÉDITS (Ressources)
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
            </>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 text-center italic border border-gray-100">
          Aucune écriture à passer pour cette étape.
        </div>
      )}

      {/* Indicateur d'équilibre en temps réel */}
      <div
        className={`rounded-xl p-2.5 text-center text-xs font-bold transition-all border ${
          canContinue
            ? "bg-green-50 text-green-700 border-green-200"
            : !allApplied
              ? "bg-gray-50 text-gray-400 border-gray-100"
              : "bg-red-50 text-red-600 border-red-200"
        }`}
        role="status"
      >
        <div className="text-sm">
          ACTIF <strong>{totalActif}</strong> {balanced ? "=" : "≠"} PASSIF{" "}
          <strong>{totalPassif}</strong>
        </div>
        <div className="mt-0.5">
          {canContinue
            ? "✅ Bilan équilibré — vous pouvez continuer !"
            : !allApplied
              ? `${pendingCount} écriture(s) restante(s) à saisir`
              : "⚠️ Déséquilibre détecté — vérifie tes écritures"}
        </div>
      </div>

      {/* Principe comptable */}
      <div className="bg-indigo-50 rounded-xl p-2.5 text-xs text-indigo-800 leading-relaxed border border-indigo-100 shadow-sm">
        <span className="font-bold">📚 Principe : </span>
        {activeStep.principe}
      </div>

      {/* Conseil */}
      <div className="bg-amber-50 rounded-xl p-2.5 text-xs text-amber-800 leading-relaxed border border-amber-100 shadow-sm">
        {activeStep.conseil}
      </div>

      {/* Boutons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-500 text-xs hover:bg-gray-50 transition-colors font-medium"
          aria-label="Revenir à l'étape"
        >
          ← Revenir
        </button>
        {canContinue && (
          <button
            onClick={onConfirm}
            className="flex-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm active:scale-95"
            aria-label="Confirmer et continuer"
          >
            ✅ Continuer →
          </button>
        )}
      </div>
    </div>
  );
}
