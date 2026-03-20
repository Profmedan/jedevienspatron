"use client";

import { motion } from "framer-motion";
import { nomCompte } from "./utils";
import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";
import type { EntryLine } from "./EntryCard";

interface DoubleEntrySalesCardProps {
  /** Groupe de 4 écritures de vente */
  entries: EntryLine[];
  /** Titre de l'opération (description du client) */
  operationTitre?: string;
  /** Callback pour appliquer toutes les 4 écritures */
  onApplyAll: () => void;
  /** Index pour animation */
  index?: number;
  /** Tour actuel du jeu */
  tourActuel?: number;
}

/**
 * Carte synthétique "partie double" pour les ventes (étape 4).
 * Affiche les 4 écritures groupées dans un mini-tableau DÉBIT | CRÉDIT
 * avec un seul bouton pour tout saisir d'un coup.
 */
export function DoubleEntrySalesCard({
  entries,
  operationTitre,
  onApplyAll,
  index = 0,
  tourActuel = 0,
}: DoubleEntrySalesCardProps) {
  const shouldAnimate = tourActuel <= 3;

  // Séparer débits et crédits
  const debits = entries.filter((e) => e.sens === "debit");
  const credits = entries.filter((e) => e.sens === "credit");

  // Calculer les montants
  const sumDebits = debits.reduce((s, e) => s + Math.abs(e.delta), 0);
  const sumCredits = credits.reduce((s, e) => s + Math.abs(e.delta), 0);

  const Wrapper = shouldAnimate ? motion.div : "div";
  const wrapperProps = shouldAnimate
    ? {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { delay: index * 0.15, duration: 1.5, type: "spring" as const, damping: 15 },
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="mb-3 rounded-xl border-2 border-indigo-600 bg-gradient-to-br from-indigo-950/40 to-indigo-900/20 shadow-lg overflow-hidden"
      role="region"
      aria-label={`Vente groupée : ${operationTitre || "sans titre"}`}
    >
      {/* En-tête */}
      <div className="px-3 py-2 bg-indigo-900/60 border-b border-indigo-700">
        <div className="text-xs font-black uppercase tracking-wide text-indigo-200 mb-1">
          🤝 Vente client — Partie double
        </div>
        {operationTitre && (
          <div className="text-sm font-semibold text-indigo-100">
            {operationTitre}
          </div>
        )}
      </div>

      {/* Tableau partie double */}
      <div className="px-3 py-3">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* COLONNE GAUCHE : DÉBITS (Emplois) */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-blue-300 mb-1.5 flex items-center gap-1">
              <span>📤</span> Débits
              <span className="text-[10px] font-normal text-blue-400">(emplois)</span>
            </div>
            <div className="space-y-1.5">
              {debits.map((entry, idx) => {
                const bon = isBonPourEntreprise(entry.poste, entry.delta);
                return (
                  <div key={idx} className="bg-blue-950/40 rounded-lg px-2.5 py-1.5 border border-blue-700/30">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-blue-100 leading-tight truncate">
                          {nomCompte(entry.poste)}
                        </div>
                      </div>
                      <div className={`text-sm font-black tabular-nums shrink-0 ${bon ? "text-emerald-400" : "text-red-400"}`}>
                        +{entry.delta}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLONNE DROITE : CRÉDITS (Ressources) */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-orange-300 mb-1.5 flex items-center gap-1">
              <span>📥</span> Crédits
              <span className="text-[10px] font-normal text-orange-400">(ressources)</span>
            </div>
            <div className="space-y-1.5">
              {credits.map((entry, idx) => {
                const bon = isBonPourEntreprise(entry.poste, entry.delta);
                return (
                  <div key={idx} className="bg-orange-950/40 rounded-lg px-2.5 py-1.5 border border-orange-700/30">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-orange-100 leading-tight truncate">
                          {nomCompte(entry.poste)}
                        </div>
                      </div>
                      <div className={`text-sm font-black tabular-nums shrink-0 ${bon ? "text-emerald-400" : "text-red-400"}`}>
                        +{entry.delta}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Équilibre partie double */}
        <div className="bg-indigo-950/50 rounded-lg px-2.5 py-1.5 border border-indigo-600 flex items-center justify-center gap-2 text-xs font-bold">
          <span className="text-blue-400">Σ Débits: {sumDebits}</span>
          <span className={`text-base ${Math.abs(sumDebits - sumCredits) < 0.01 ? "text-emerald-400" : "text-amber-500"}`}>
            {Math.abs(sumDebits - sumCredits) < 0.01 ? "=" : "≠"}
          </span>
          <span className="text-orange-400">Σ Crédits: {sumCredits}</span>
        </div>
      </div>

      {/* Bouton unique "Saisir tout" */}
      <div className="px-3 py-2.5 bg-indigo-950/30 border-t border-indigo-700">
        <button
          onClick={onApplyAll}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 text-white text-xs font-black py-3 rounded-lg transition-all shadow-sm"
          aria-label="Saisir toutes les écritures de cette vente"
        >
          ✅ J&apos;ai compris — Saisir tout →
        </button>
      </div>
    </Wrapper>
  );
}
