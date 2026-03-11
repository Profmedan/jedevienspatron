"use client";

import { nomCompte, getDocument, type SensEcriture } from "./utils";

export interface EntryLine {
  id: string;
  poste: string;
  delta: number;
  description: string;
  applied: boolean;
  sens: SensEcriture;
}

interface EntryCardProps {
  entry: EntryLine;
  onApply: () => void;
}

/**
 * Affiche une écriture comptable avec bouton d'application
 * Auto-coloration selon le sens (débit/crédit)
 * Animation au clic
 */
export function EntryCard({ entry, onApply }: EntryCardProps) {
  const isDebit = entry.sens === "debit";

  const bgColor = entry.applied
    ? "bg-green-50 border-green-300"
    : isDebit
      ? "bg-blue-50 border-blue-200 hover:border-blue-400"
      : "bg-orange-50 border-orange-200 hover:border-orange-400";

  const textColor = entry.applied
    ? "text-green-600"
    : isDebit
      ? "text-blue-600"
      : "text-orange-600";

  const doc = getDocument(entry.poste);

  return (
    <div
      className={`mb-2 rounded-xl border-2 transition-all ${bgColor}`}
      role="region"
      aria-label={`Écriture: ${nomCompte(entry.poste)}`}
    >
      <div className="flex items-start justify-between p-2.5 gap-2">
        <div className="flex-1 min-w-0">
          {/* Sens */}
          <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${textColor}`}>
            {isDebit ? "📤 DÉBIT — Emploi" : "📥 CRÉDIT — Ressource"}
          </div>

          {/* Compte */}
          <div className="font-medium text-sm text-gray-800">{nomCompte(entry.poste)}</div>

          {/* Badge document */}
          <span
            className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${doc.badge}`}
          >
            {doc.label === "Bilan" ? "📋" : "📈"} {doc.label}
            {doc.detail ? ` · ${doc.detail}` : ""}
          </span>

          {/* Montant */}
          <div className={`text-base font-bold ${entry.delta > 0 ? "text-blue-700" : "text-red-600"}`}>
            {entry.delta > 0 ? "+" : ""}
            {entry.delta}
          </div>

          {/* Description */}
          <div className="text-sm text-gray-700 font-semibold mt-1.5 leading-snug">
            {entry.description}
          </div>
        </div>

        {/* Bouton ou checkmark */}
        <div className="shrink-0 mt-1">
          {entry.applied ? (
            <span className="text-green-500 text-2xl" role="status">
              ✓
            </span>
          ) : (
            <button
              onClick={onApply}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap transition-all"
              aria-label={`Saisir l'écriture: ${nomCompte(entry.poste)}`}
            >
              Saisir →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
