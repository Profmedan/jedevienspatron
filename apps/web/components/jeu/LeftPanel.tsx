"use client";

import { useState } from "react";
import { Joueur, CarteDecision } from "@/lib/game-engine/types";
import EtapeGuide from "@/components/EtapeGuide";
import CarteView from "@/components/CarteView";
import { EntryPanel, type ActiveStep } from "./EntryPanel";
import { nomCompte, getDocument } from "./utils";

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
      <aside className="w-72 shrink-0 flex flex-col gap-3 p-3 border-r border-gray-700 bg-gray-900 overflow-y-auto">
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
    <aside className="w-72 shrink-0 flex flex-col gap-3 p-3 border-r border-gray-700 bg-gray-900 overflow-y-auto">
      {/* Guide de l'étape */}
      <EtapeGuide etape={etapeTour} tourActuel={tourActuel} nbTours={nbToursMax} />

      {/* Panneau d'action selon l'étape */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-3 shadow-sm">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ÉTAPE 1 : Achats de marchandises */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {etapeTour === 1 && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-gray-200 flex items-center gap-2">
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
                className="w-16 border border-indigo-700 rounded-lg px-2 py-1 text-center text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-gray-800 text-gray-100"
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
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-2 rounded-xl font-medium transition-colors"
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
            <div className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <span>🎯</span>
              <span>Carte Décision</span>
            </div>

            <button
              onClick={() => setShowCartes(!showCartes)}
              className="w-full bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-sm py-2 rounded-xl font-medium transition-colors border border-indigo-700"
            >
              {showCartes ? "▲ Masquer" : "▼ Voir les cartes"}
            </button>

            {decisionError && (
              <div className="bg-red-950/40 border border-red-700 text-red-300 rounded-xl px-3 py-2 text-xs font-semibold">
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
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-2 rounded-xl font-medium transition-colors"
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
                      ? "border-green-700 bg-green-950/30 text-green-300"
                      : client.delaiPaiement === 1
                        ? "border-blue-700 bg-blue-950/30 text-blue-300"
                        : "border-purple-700 bg-purple-950/30 text-purple-300";
                  const delaiLabel =
                    client.delaiPaiement === 0
                      ? "💵 Encaissé immédiatement"
                      : client.delaiPaiement === 1
                        ? "⏰ Encaissé dans 1 trimestre"
                        : "⏰⏰ Encaissé dans 2 trimestres";

                  const delaiExplication =
                    client.delaiPaiement === 0
                      ? "L'argent arrive directement en trésorerie."
                      : client.delaiPaiement === 1
                        ? "L'argent sera encaissé au trimestre prochain."
                        : "L'argent sera encaissé dans 2 trimestres.";

                  return (
                    <div
                      key={i}
                      className={`rounded-xl border-2 overflow-hidden mb-1.5 ${colorCls}`}
                    >
                      {/* Titre + montant */}
                      <div className="px-2.5 pt-2 pb-1 flex items-center justify-between">
                        <div className="font-bold text-sm">{client.titre}</div>
                        <div className="text-right">
                          <div className="font-bold text-lg">+{client.montantVentes}</div>
                          <div className="text-[10px] opacity-60 font-medium -mt-0.5">chiffre d&apos;affaires</div>
                        </div>
                      </div>
                      {/* Timing + explication */}
                      <div className="px-2.5 pb-2 space-y-0.5">
                        <div className="text-xs font-semibold">{delaiLabel}</div>
                        <div className="text-xs opacity-65 leading-snug">{delaiExplication}</div>
                        <div className="text-[10px] opacity-50 mt-0.5 pt-0.5 border-t border-current border-opacity-20">
                          Génère 4 écritures : Ventes ↑ · Stocks ↓ · Coût des ventes ↑ · Trésorerie ou Créance ↑
                        </div>
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
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-3">
        <button
          onClick={() => setShowJournal(!showJournal)}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
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
                  className="bg-gray-900 rounded-lg p-2 border border-gray-700 text-xs space-y-1"
                >
                  <div className="font-bold text-indigo-400">
                    {e.joueurNom} — Tour {e.tour}, Étape {e.etape + 1}
                  </div>
                  <div className="text-gray-500 text-xs">{e.titre}</div>
                  {e.entries
                    .filter((en) => en.applied !== false || e.entries.length === 0)
                    .map((en, i) => {
                      const doc = getDocument(en.poste);
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between text-xs gap-2 ${
                            en.delta > 0 ? "text-blue-600" : "text-orange-600"
                          }`}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="truncate">{nomCompte(en.poste)}</span>
                            <span className={`shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded-full ${doc.badge}`}>
                              {doc.detail || doc.label}
                            </span>
                          </div>
                          <span className="shrink-0 font-bold">
                            {en.delta > 0 ? "+" : ""}
                            {en.delta}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
