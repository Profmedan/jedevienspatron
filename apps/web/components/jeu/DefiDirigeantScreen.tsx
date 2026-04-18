"use client";

/**
 * DefiDirigeantScreen — écran plein écran pour les « Défis du dirigeant »
 * (Tâche 24, Vague 2 minimaliste).
 *
 * Objectif V2 : valider le cœur émotionnel du système — un seul rendu,
 * sobre, lisible. Les 3 variantes (courte / longue / clôture) et les 5
 * palettes par tonalité viendront en Vague 3.
 *
 * Flow :
 *   1. Affichage du contexte narratif + boutons de choix.
 *   2. Après clic : affichage de la pédagogie du choix + bouton « Continuer ».
 *
 * Rétrocompatibilité : l'écran ne se monte que si `defisActives === true`
 * côté page.tsx. Hors du flag, le composant n'est jamais rendu.
 */

import { useState } from "react";
import type { DefiDirigeant } from "@jedevienspatron/game-engine";

interface DefiDirigeantScreenProps {
  /** Défi à présenter. */
  defi: DefiDirigeant;
  /** Contexte formaté (tokens {pseudo}, {saison}, etc. déjà résolus). */
  contexteFormate: string;
  /** Callback appelé quand le joueur valide son choix (ou le « Continuer » de l'observation). */
  onChoix: (choixId: string | null) => void;
}

export function DefiDirigeantScreen({
  defi,
  contexteFormate,
  onChoix,
}: DefiDirigeantScreenProps) {
  const [choixId, setChoixId] = useState<string | null>(null);

  const estObservation = defi.archetype === "observation";
  const choixSelectionne = choixId
    ? defi.choix.find((c) => c.id === choixId) ?? null
    : null;

  function choisir(id: string) {
    setChoixId(id);
  }

  function valider() {
    // Observation sans choix : on remonte null.
    onChoix(choixId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* ─── En-tête ───────────────────────────────────────── */}
        <div className="px-6 py-4 text-white text-center bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="text-4xl mb-1">🎭</div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-75 mb-0.5">
            Défi du dirigeant
          </div>
          <h2 className="text-xl font-bold">
            {estObservation ? "Observation" : "Une décision à prendre"}
          </h2>
        </div>

        {/* ─── Contenu ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Contexte narratif */}
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
            {contexteFormate}
          </p>

          {/* Observation : pas de choix, juste un bouton « Continuer » */}
          {estObservation && (
            <div className="bg-indigo-950/30 border border-indigo-700/50 rounded-xl p-3 text-sm text-indigo-200 leading-relaxed">
              💡 À ce stade, rien à décider. Observez et continuez.
            </div>
          )}

          {/* Choix proposés (avant sélection) */}
          {!estObservation && !choixSelectionne && (
            <div className="space-y-2">
              {defi.choix.map((c) => (
                <button
                  key={c.id}
                  onClick={() => choisir(c.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all bg-gray-800 border-gray-600 text-gray-200 hover:border-indigo-500 hover:bg-indigo-950/40"
                >
                  <div className="font-bold text-indigo-200 mb-0.5">
                    {c.libelle}
                  </div>
                  {c.description && (
                    <div className="text-xs text-gray-400 leading-snug">
                      {c.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Résultat après choix : pédagogie */}
          {choixSelectionne && (
            <div className="bg-emerald-950/30 border border-emerald-700/50 rounded-xl p-4 text-sm text-emerald-100 leading-relaxed space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                ✅ Choix : {choixSelectionne.libelle}
              </div>
              <p className="text-gray-200">{choixSelectionne.pedagogie}</p>
            </div>
          )}
        </div>

        {/* ─── Pied : bouton valider ─────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-700 shrink-0">
          {estObservation ? (
            <button
              onClick={valider}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 rounded-xl text-lg shadow-sm transition-all active:scale-95"
            >
              Continuer →
            </button>
          ) : choixSelectionne ? (
            <button
              onClick={valider}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3 rounded-xl text-lg shadow-sm transition-all active:scale-95"
            >
              Appliquer ce choix →
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-700 text-gray-400 font-bold py-3 rounded-xl text-lg cursor-not-allowed"
            >
              Choisissez une option ci-dessus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
