"use client";

import { Joueur } from "@jedevienspatron/game-engine";

interface MiniDeckPanelProps {
  joueur: Joueur;
  onInvestir: (carteId: string) => void;
  disabled?: boolean; // true si pas étape 6
}

export function MiniDeckPanel({ joueur, onInvestir, disabled }: MiniDeckPanelProps) {
  if (joueur.piochePersonnelle.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <h3 className="mb-2 text-sm font-semibold text-amber-800">
        Investissements logistiques
      </h3>
      <div className="flex flex-col gap-2">
        {joueur.piochePersonnelle.map((carte) => {
          const prerequisOk =
            !carte.prerequis ||
            joueur.cartesActives.some((c) => c.id === carte.prerequis);
          const peutInvestir = !disabled && prerequisOk;

          return (
            <div
              key={carte.id}
              className={`rounded border p-2 text-xs ${
                prerequisOk
                  ? "border-amber-300 bg-white"
                  : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-800">{carte.titre}</p>
                  {!prerequisOk && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      Nécessite :{" "}
                      {joueur.piochePersonnelle.find((c) => c.id === carte.prerequis)
                        ?.titre ?? carte.prerequis}
                    </p>
                  )}
                  {prerequisOk && (
                    <p className="mt-0.5 text-gray-500">
                      {carte.description.split("—")[1]?.trim().split(".")[0]}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onInvestir(carte.id)}
                  disabled={!peutInvestir}
                  className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    peutInvestir
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "cursor-not-allowed bg-gray-200 text-gray-400"
                  }`}
                >
                  Investir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
