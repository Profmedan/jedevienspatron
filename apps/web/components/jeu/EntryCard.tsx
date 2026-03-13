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
  /** Accordion : fenêtre actuellement ouverte */
  isExpanded: boolean;
  /** Callback pour ouvrir/fermer manuellement */
  onToggle: () => void;
}

/**
 * Carte de saisie d'une écriture comptable — 3 états visuels :
 *
 * 1. APPLIED   : bandeau compact vert célébratoire (non cliquable)
 * 2. COLLAPSED : header compact avec chevron — clic pour ouvrir
 * 3. EXPANDED  : carte complète avec bouton Saisir
 *
 * Design pédagogique :
 *  - Header coloré (bleu=débit / orange=crédit)
 *  - Montant coloré selon l'impact financier réel
 *  - Badge "document" + badge impact résultat
 *  - Effet mémoire : ce que ça fait concrètement
 */
export function EntryCard({ entry, onApply, isExpanded, onToggle }: EntryCardProps) {
  const isDebit = entry.sens === "debit";
  const bon     = isBonPourEntreprise(entry.poste, entry.delta);
  const doc     = getDocument(entry.poste);
  const effetTexte      = getEffetTexte(entry.poste, entry.delta);
  const sensExplication = getSensExplication(entry.sens);

  // ── 1. État APPLIED ─────────────────────────────────────────────────────
  if (entry.applied) {
    // 1a. Déplié → mode lecture seule (revue pédagogique, sans bouton Saisir)
    if (isExpanded) {
      return (
        <div
          className="mb-1.5 rounded-xl border-2 border-emerald-700 bg-emerald-950/20 shadow-sm transition-all duration-200"
          role="region"
          aria-label={`Écriture déjà saisie (lecture) : ${nomCompte(entry.poste)}`}
        >
          {/* En-tête cliquable pour replier */}
          <button
            onClick={onToggle}
            className="w-full rounded-t-[10px] px-3 py-2 flex items-center justify-between gap-2 bg-emerald-900/40"
            aria-expanded={true}
            aria-label={`Replier la revue : ${nomCompte(entry.poste)}`}
          >
            <span className="text-xs font-black uppercase tracking-wide text-emerald-300">
              ✅ Déjà saisi — lecture seule
            </span>
            <span className="text-xs text-emerald-500 rotate-180 inline-block">▼</span>
          </button>

          {/* Corps en lecture seule */}
          <div className="flex items-start p-2.5 gap-2">
            <div className="flex-1 min-w-0">

              {/* Nom du compte */}
              <div className="font-bold text-sm text-gray-100 mb-1.5 leading-tight">
                {nomCompte(entry.poste)}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${doc.badge}`}>
                  {doc.label === "Bilan" ? "📋" : "📈"} {doc.label} · {doc.detail}
                </span>
                {(doc.detail === "Charge" || doc.detail === "Produit") && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    doc.detail === "Charge"
                      ? "bg-red-900/50 text-red-300"
                      : "bg-emerald-900/50 text-emerald-300"
                  }`}>
                    {doc.detail === "Charge" ? "↓ résultat net" : "↑ résultat net"}
                  </span>
                )}
              </div>

              {/* Montant */}
              <div className={`text-2xl font-black tabular-nums mb-1.5 ${bon ? "text-emerald-400" : "text-red-400"}`}>
                {entry.delta > 0 ? "+" : ""}{entry.delta}
              </div>

              {/* Effet mémoire */}
              {effetTexte && (
                <div className={`text-[11px] font-semibold mb-1.5 leading-tight rounded-lg px-2 py-1 ${
                  bon ? "bg-emerald-900/40 text-emerald-300" : "bg-red-950/30 text-red-400"
                }`}>
                  {effetTexte}
                </div>
              )}

              {/* Description technique */}
              <div className="text-xs text-gray-500 leading-snug italic">
                {entry.description}
              </div>
            </div>

            {/* Badge Déjà saisi (remplace le bouton Saisir) */}
            <div className="shrink-0 mt-1">
              <span className="inline-block bg-emerald-900/50 text-emerald-400 text-xs font-bold px-2.5 py-2 rounded-lg border border-emerald-700">
                ✅ Saisi
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 1b. Replié → bandeau compact cliquable pour rouvrir
    return (
      <button
        onClick={onToggle}
        className="w-full mb-1.5 rounded-xl border-2 border-emerald-700 bg-emerald-950/30 flex items-center gap-2.5 px-3 py-2 hover:bg-emerald-950/50 hover:border-emerald-500 transition-all duration-200 text-left"
        aria-label={`Revoir la saisie : ${nomCompte(entry.poste)}`}
      >
        <span className="text-lg shrink-0">✅</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-emerald-300 text-sm leading-tight truncate">
            {nomCompte(entry.poste)}
          </div>
          {effetTexte && (
            <div className="text-[10px] text-emerald-400 leading-tight mt-0.5">{effetTexte}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-sm font-black tabular-nums ${bon ? "text-emerald-400" : "text-red-400"}`}>
            {entry.delta > 0 ? "+" : ""}{entry.delta}
          </span>
          <span className="text-[10px] text-emerald-600 opacity-70">▼</span>
        </div>
      </button>
    );
  }

  // ── 2. État COLLAPSED — fenêtre fermée ──────────────────────────────────
  if (!isExpanded) {
    return (
      <button
        onClick={onToggle}
        className={`w-full mb-1.5 rounded-xl border-2 px-3 py-2.5 flex items-center justify-between gap-2
          transition-all duration-200 hover:shadow-md text-left
          ${isDebit
            ? "bg-blue-950/20 border-blue-800/40 hover:border-blue-500 hover:bg-blue-950/30"
            : "bg-orange-950/20 border-orange-800/40 hover:border-orange-500 hover:bg-orange-950/30"
          }`}
        aria-expanded={false}
        aria-label={`Ouvrir la saisie : ${nomCompte(entry.poste)}`}
      >
        {/* Gauche : icône sens + nom */}
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-base shrink-0 ${isDebit ? "text-blue-400" : "text-orange-400"}`}>
            {isDebit ? "📤" : "📥"}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-200 truncate leading-tight">
              {nomCompte(entry.poste)}
            </div>
            <div className={`text-[10px] font-medium ${isDebit ? "text-blue-400" : "text-orange-400"}`}>
              {isDebit ? "Débit — Emploi" : "Crédit — Ressource"}
            </div>
          </div>
        </div>
        {/* Droite : montant + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-black tabular-nums text-sm ${bon ? "text-emerald-400" : "text-red-400"}`}>
            {entry.delta > 0 ? "+" : ""}{entry.delta}
          </span>
          <span className={`text-xs ${isDebit ? "text-blue-500" : "text-orange-500"}`}>▼</span>
        </div>
      </button>
    );
  }

  // ── 3. État EXPANDED — fenêtre ouverte avec Saisir ──────────────────────
  return (
    <div
      className={`mb-1.5 rounded-xl border-2 shadow-md transition-all duration-200
        ${isDebit
          ? "bg-blue-950/30 border-blue-600 shadow-blue-900/30"
          : "bg-orange-950/30 border-orange-600 shadow-orange-900/30"
        }`}
      role="region"
      aria-label={`Écriture ouverte : ${nomCompte(entry.poste)}`}
    >
      {/* ── En-tête cliquable (permet de replier) ── */}
      <button
        onClick={onToggle}
        className={`w-full rounded-t-[10px] px-3 py-2 flex items-center justify-between gap-2
          ${isDebit ? "bg-blue-900/50" : "bg-orange-900/50"}`}
        aria-expanded={true}
        aria-label={`Replier : ${nomCompte(entry.poste)}`}
      >
        <span className={`text-xs font-black uppercase tracking-wide ${isDebit ? "text-blue-200" : "text-orange-200"}`}>
          {isDebit ? "📤 DÉBIT — Emploi" : "📥 CRÉDIT — Ressource"}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-normal opacity-75 hidden sm:block ${isDebit ? "text-blue-300" : "text-orange-300"}`}>
            {sensExplication}
          </span>
          <span className={`text-xs rotate-180 inline-block ${isDebit ? "text-blue-400" : "text-orange-400"}`}>▼</span>
        </div>
      </button>

      {/* ── Corps de la carte ── */}
      <div className="flex items-start p-2.5 gap-2">
        <div className="flex-1 min-w-0">

          {/* Nom du compte */}
          <div className="font-bold text-sm text-gray-100 mb-1.5 leading-tight">
            {nomCompte(entry.poste)}
          </div>

          {/* Badges : document + impact résultat */}
          <div className="flex flex-wrap gap-1 mb-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${doc.badge}`}>
              {doc.label === "Bilan" ? "📋" : "📈"} {doc.label} · {doc.detail}
            </span>
            {(doc.detail === "Charge" || doc.detail === "Produit") && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                doc.detail === "Charge"
                  ? "bg-red-900/50 text-red-300"
                  : "bg-emerald-900/50 text-emerald-300"
              }`}>
                {doc.detail === "Charge" ? "↓ résultat net" : "↑ résultat net"}
              </span>
            )}
          </div>

          {/* Montant */}
          <div className={`text-2xl font-black tabular-nums mb-1.5 ${bon ? "text-emerald-400" : "text-red-400"}`}>
            {entry.delta > 0 ? "+" : ""}{entry.delta}
          </div>

          {/* Effet mémoire */}
          {effetTexte && (
            <div className={`text-[11px] font-semibold mb-1.5 leading-tight rounded-lg px-2 py-1 ${
              bon ? "bg-emerald-900/40 text-emerald-300" : "bg-red-950/30 text-red-400"
            }`}>
              {effetTexte}
            </div>
          )}

          {/* Description technique */}
          <div className="text-xs text-gray-500 leading-snug italic">
            {entry.description}
          </div>
        </div>

        {/* Bouton Saisir */}
        <div className="shrink-0 mt-1">
          <button
            onClick={onApply}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3 py-2.5 rounded-lg whitespace-nowrap transition-all shadow-sm"
            aria-label={`Saisir l'écriture : ${nomCompte(entry.poste)}`}
          >
            Saisir →
          </button>
        </div>
      </div>
    </div>
  );
}
