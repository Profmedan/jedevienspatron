"use client";

import { nomCompte, getDocument, getEffetTexte, getSensExplication, type SensEcriture } from "./utils";
import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";

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
 * Carte de saisie d'une écriture comptable.
 *
 * Design pédagogique :
 *  - Header coloré (bleu = débit, orange = crédit) avec explication de la règle
 *  - Montant coloré selon l'impact financier réel (isBonPourEntreprise)
 *  - Badge "document" (Bilan Actif / CR Charge…) + badge impact résultat
 *  - Ligne "effet mémoire" : ce que ça fait concrètement pour l'entreprise
 *  - État "saisi" compact et visuel
 */
export function EntryCard({ entry, onApply }: EntryCardProps) {
  const isDebit = entry.sens === "debit";
  const bon = isBonPourEntreprise(entry.poste, entry.delta);
  const doc = getDocument(entry.poste);
  const effetTexte = getEffetTexte(entry.poste, entry.delta);
  const sensExplication = getSensExplication(entry.sens);

  // ── État "saisi" — compact et célébratoire ────────────────────────────────
  if (entry.applied) {
    return (
      <div className="mb-2 rounded-xl border-2 border-emerald-700 bg-emerald-950/30 flex items-center gap-2.5 px-3 py-2">
        <span className="text-xl shrink-0">✅</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-emerald-300 text-sm leading-tight">{nomCompte(entry.poste)}</div>
          {effetTexte && (
            <div className="text-[10px] text-emerald-400 leading-tight mt-0.5">{effetTexte}</div>
          )}
        </div>
        <span
          className={`text-base font-black tabular-nums shrink-0 ${
            bon ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {entry.delta > 0 ? "+" : ""}
          {entry.delta}
        </span>
      </div>
    );
  }

  // ── État "à saisir" ───────────────────────────────────────────────────────
  return (
    <div
      className={`mb-2 rounded-xl border-2 transition-all hover:shadow-md ${
        isDebit
          ? "bg-blue-950/30 border-blue-800/60 hover:border-blue-500"
          : "bg-orange-950/30 border-orange-800/60 hover:border-orange-500"
      }`}
      role="region"
      aria-label={`Écriture: ${nomCompte(entry.poste)}`}
    >
      {/* ── En-tête : sens + règle de la partie double ── */}
      <div
        className={`rounded-t-[10px] px-3 py-1.5 flex items-center justify-between gap-2 ${
          isDebit ? "bg-blue-900/50" : "bg-orange-900/50"
        }`}
      >
        <span className={`text-xs font-black uppercase tracking-wide ${isDebit ? "text-blue-200" : "text-orange-200"}`}>
          {isDebit ? "📤 DÉBIT — Emploi" : "📥 CRÉDIT — Ressource"}
        </span>
        <span className={`text-[10px] font-normal opacity-75 text-right leading-tight hidden sm:block ${isDebit ? "text-blue-300" : "text-orange-300"}`}>
          {sensExplication}
        </span>
      </div>

      <div className="flex items-start p-2.5 gap-2">
        <div className="flex-1 min-w-0">

          {/* ── Nom du compte ── */}
          <div className="font-bold text-sm text-gray-100 mb-1.5 leading-tight">
            {nomCompte(entry.poste)}
          </div>

          {/* ── Badges : document + impact résultat ── */}
          <div className="flex flex-wrap gap-1 mb-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${doc.badge}`}>
              {doc.label === "Bilan" ? "📋" : "📈"} {doc.label} · {doc.detail}
            </span>
            {(doc.detail === "Charge" || doc.detail === "Produit") && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  doc.detail === "Charge"
                    ? "bg-red-900/50 text-red-300"
                    : "bg-emerald-900/50 text-emerald-300"
                }`}
              >
                {doc.detail === "Charge" ? "↓ résultat net" : "↑ résultat net"}
              </span>
            )}
          </div>

          {/* ── Montant : coloré selon l'impact financier réel ── */}
          <div
            className={`text-2xl font-black tabular-nums mb-1.5 ${
              bon ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {entry.delta > 0 ? "+" : ""}
            {entry.delta}
          </div>

          {/* ── Effet mémoire : ce que ça fait pour l'entreprise ── */}
          {effetTexte && (
            <div
              className={`text-[11px] font-semibold mb-1.5 leading-tight rounded-lg px-2 py-1 ${
                bon
                  ? "bg-emerald-900/40 text-emerald-300"
                  : "bg-red-950/30 text-red-400"
              }`}
            >
              {effetTexte}
            </div>
          )}

          {/* ── Description technique (explication du moteur) ── */}
          <div className="text-xs text-gray-500 leading-snug italic">
            {entry.description}
          </div>
        </div>

        {/* ── Bouton Saisir ── */}
        <div className="shrink-0 mt-1">
          <button
            onClick={onApply}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap transition-all shadow-sm"
            aria-label={`Saisir l'écriture: ${nomCompte(entry.poste)}`}
          >
            Saisir →
          </button>
        </div>
      </div>
    </div>
  );
}
