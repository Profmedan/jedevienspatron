"use client";

import { useState } from "react";
import { Joueur, CarteDecision } from "@/lib/game-engine/types";
import EtapeGuide from "@/components/EtapeGuide";
import CarteView from "@/components/CarteView";
import { EntryPanel, type ActiveStep } from "./EntryPanel";

interface JournalEntry {
  id: number;
  tour: number;
  etape: number;
  joueurNom: string;
  titre: string;
  entries: Array<{
    poste: string;
    delta: number;
    applied?: boolean;
  }>;
  principe: string;
}

interface LeftPanelProps {
  // État de jeu
  etapeTour: number;
  tourActuel: number;
  nbToursMax: number;
  joueur: Joueur;
  activeStep: ActiveStep | null;

  // Actions
  onApplyEntry: (id: string) => void;
  onConfirmStep: () => void;
  onCancelStep: () => void;
  onApplyEntryEffect?: (poste: string) => void;

  // Achats marchandises
  achatQte: number;
  setAchatQte: (val: number) => void;
  achatMode: "tresorerie" | "dettes";
  setAchatMode: (val: "tresorerie" | "dettes") => void;
  onLaunchAchat: () => void;
  onSkipAchat: () => void;

  // Cartes Décision
  showCartes: boolean;
  setShowCartes: (val: boolean) => void;
  selectedDecision: CarteDecision | null;
  setSelectedDecision: (val: CarteDecision | null) => void;
  cartesDisponibles: CarteDecision[];
  onLaunchDecision: () => void;
  onSkipDecision: () => void;
  decisionError: string | null;

  // Étapes générales
  onLaunchStep: () => void;

  // Journal
  journal: JournalEntry[];
}

/**
 * Panneau gauche : guide, actions interactives, journal
 * S'adapte selon l'étape actuelle du jeu
 */
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
  showCartes,
  setShowCartes,
  selectedDecision,
  setSelectedDecision,
  cartesDisponibles,
  onLaunchDecision,
  onSkipDecision,
  decisionError,
  onLaunchStep,
  journal,
}: LeftPanelProps) {
  const [showJournal, setShowJournal] = useState(false);

  // Si une étape est active, afficher EntryPanel
  if (activeStep) {
    return (
      <aside className="w-72 shrink-0 flex flex-col gap-3 p-3 border-r border-gray-200 bg-white overflow-y-auto">
        <EntryPanel
          activeStep={activeStep}
          displayJoueur={joueur}
          onApply={onApplyEntry}
          onApplyEntry={onApplyEntryEffect}
          onConfirm={onConfirmStep}
          onCancel={onCancelStep}
        />
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 flex flex-col gap-3 p-3 border-r border-gray-200 bg-white overflow-y-auto">
      {/* Guide de l'étape */}
      <EtapeGuide etape={etapeTour} tourActuel={tourActuel} nbTours={nbToursMax} />

      {/* Panneau d'action selon l'étape */}
      <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl border border-gray-100 p-3 shadow-sm">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ÉTAPE 1 : Achats de marchandises */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {etapeTour === 1 && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span>📦</span>
              <span>Achats de marchandises</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">Quantité :</label>
              <input
                type="number"
                min={0}
                max={10}
                value={achatQte}
                onChange={(e) =>
                  setAchatQte(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-16 border border-indigo-200 rounded-lg px-2 py-1 text-center text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                aria-label="Quantité à acheter"
              />
            </div>

            <div className="flex gap-2">
              {(["tresorerie", "dettes"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setAchatMode(m)}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    achatMode === m
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  aria-pressed={achatMode === m}
                >
                  {m === "tresorerie" ? "💵 Comptant" : "📋 À crédit"}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onLaunchAchat}
                disabled={achatQte === 0}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-40 text-white text-sm py-2 rounded-xl font-bold transition-all active:scale-95"
                aria-label="Exécuter et comprendre cet achat"
              >
                📝 Exécuter & Comprendre
              </button>
              <button
                onClick={onSkipAchat}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-2 rounded-xl font-medium transition-colors"
              >
                Passer
              </button>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ÉTAPE 6 : Cartes Décision */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {etapeTour === 6 && (
          <div className="space-y-2">
            <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span>🎯</span>
              <span>Carte Décision</span>
            </div>

            <button
              onClick={() => setShowCartes(!showCartes)}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm py-2 rounded-xl font-medium transition-colors border border-indigo-200"
            >
              {showCartes ? "▲ Masquer" : "▼ Voir les cartes"}
            </button>

            {decisionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs font-semibold">
                ❌ {decisionError}
              </div>
            )}

            {selectedDecision && (
              <button
                onClick={onLaunchDecision}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white text-sm py-2 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
              >
                📝 Exécuter & Comprendre : {selectedDecision.titre}
              </button>
            )}

            <button
              onClick={onSkipDecision}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-2 rounded-xl font-medium transition-colors"
            >
              ⏭️ Passer (aucune carte)
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* AUTRES ÉTAPES */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {etapeTour !== 1 && etapeTour !== 6 && (
          <div className="space-y-2">
            {/* Clients à traiter (étape 4) */}
            {etapeTour === 4 && joueur.clientsATrait.length > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  🤝 Clients à traiter ce tour
                </div>
                {joueur.clientsATrait.map((client, i) => {
                  const colorCls =
                    client.delaiPaiement === 0
                      ? "border-green-200 bg-green-50 text-green-800"
                      : client.delaiPaiement === 1
                        ? "border-blue-200 bg-blue-50 text-blue-800"
                        : "border-purple-200 bg-purple-50 text-purple-800";
                  const delaiLabel =
                    client.delaiPaiement === 0
                      ? "💵 Paiement immédiat"
                      : client.delaiPaiement === 1
                        ? "⏰ Paiement C+1"
                        : "⏰⏰ Paiement C+2";

                  return (
                    <div
                      key={i}
                      className={`rounded-xl border-2 p-2.5 flex items-center justify-between mb-1.5 ${colorCls}`}
                    >
                      <div>
                        <div className="font-bold text-sm">{client.titre}</div>
                        <div className="text-xs opacity-75">
                          {delaiLabel} · 4 écritures
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">+{client.montantVentes}</div>
                        <div className="text-xs opacity-60 font-medium">de CA</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bouton principal */}
            <button
              onClick={onLaunchStep}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all active:scale-95"
            >
              📝 Exécuter & Comprendre cette étape
            </button>
          </div>
        )}
      </div>

      {/* Journal comptable */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
        <button
          onClick={() => setShowJournal(!showJournal)}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
        >
          <span>📖 Journal comptable ({journal.length})</span>
          <span className="text-lg">{showJournal ? "▲" : "▼"}</span>
        </button>

        {showJournal && (
          <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
            {journal.length === 0 ? (
              <p className="text-xs text-gray-300 italic">Aucune opération encore</p>
            ) : (
              journal.map((e) => (
                <div
                  key={e.id}
                  className="bg-white rounded-lg p-2 border border-gray-100 text-xs space-y-1"
                >
                  <div className="font-bold text-indigo-700">
                    {e.joueurNom} — Tour {e.tour}, Étape {e.etape + 1}
                  </div>
                  <div className="text-gray-500 text-xs">{e.titre}</div>
                  {e.entries
                    .filter((en) => en.applied !== false || e.entries.length === 0)
                    .map((en, i) => (
                      <div
                        key={i}
                        className={`flex justify-between text-xs ${
                          en.delta > 0 ? "text-blue-600" : "text-orange-600"
                        }`}
                      >
                        <span>{en.poste}</span>
                        <span>
                          {en.delta > 0 ? "+" : ""}
                          {en.delta}
                        </span>
                      </div>
                    ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
