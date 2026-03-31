"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

import { Joueur } from "@/lib/game-engine/types";

type RightPanelTab = "resume" | "bilan" | "cr";

interface RightPanelProps {
  joueur: Joueur;
  ca: number;
  marge: number;
  ebe: number;
  resultatNet: number;
  tresorerie: number;
  bfr: number;
  fondsRoulement: number;
  solvabilite: number;
  highlightedPoste?: string | null;
  activeTab: RightPanelTab;
  setActiveTab: (tab: RightPanelTab) => void;
}

const amountFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatAmount(value: number): string {
  return amountFormatter.format(value);
}

function getValueToneClass(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

function getSolvabilityColor(solvabilite: number): string {
  if (solvabilite >= 50) return "text-emerald-400";
  if (solvabilite >= 30) return "text-yellow-400";
  return "text-red-400";
}

const RightPanel: React.FC<RightPanelProps> = ({
  joueur,
  ca,
  marge: _marge,
  ebe: _ebe,
  resultatNet,
  tresorerie,
  bfr,
  fondsRoulement,
  solvabilite,
  highlightedPoste: _highlightedPoste,
  activeTab: _activeTab,
  setActiveTab: _setActiveTab,
}) => {
  const [tab, setTab] = useState<"overview" | "glossary">("overview");

  const kpis = [
    { label: "CA", value: ca },
    { label: "Résultat", value: resultatNet },
    { label: "Trésorerie", value: tresorerie },
    { label: "BFR", value: bfr },
    { label: "FR", value: fondsRoulement },
    { label: "Solvab.", value: solvabilite, isPercent: true },
  ];

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-gray-700 bg-gray-950 p-4 shadow-lg">
      {/* Window 1: INDICATEURS CLÉS (always visible) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0"
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Indicateurs clés
        </p>
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-gray-800/50 bg-gray-900/50 px-2.5 py-2"
            >
              <p className="text-[10px] font-medium text-gray-400">{kpi.label}</p>
              <motion.p
                key={`${kpi.label}-${kpi.value}`}
                className={`text-sm font-semibold tabular-nums ${
                  kpi.isPercent
                    ? getSolvabilityColor(kpi.value)
                    : getValueToneClass(kpi.value)
                }`}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {kpi.isPercent ? `${formatAmount(kpi.value)}%` : `${formatAmount(kpi.value)} u`}
              </motion.p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Window 2: Tabbed content (secondary) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-1 flex-col overflow-hidden"
      >
        {/* Tab bar */}
        <div className="flex gap-2 border-b border-gray-800 pb-2">
          {(["overview", "glossary"] as const).map((tabName) => (
            <button
              key={tabName}
              onClick={() => setTab(tabName)}
              className={`text-xs font-medium transition-colors ${
                tab === tabName
                  ? "border-b-2 border-emerald-500 pb-2 text-emerald-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tabName === "overview" ? "Vue d'ensemble" : "Glossaire"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-3 flex-1 overflow-y-auto">
          {tab === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 text-xs text-gray-300"
            >
              <div className="flex justify-between">
                <span className="text-gray-400">Entreprise:</span>
                <span className="font-medium">{joueur.entreprise.nom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pseudo:</span>
                <span className="font-medium">{joueur.pseudo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Actif total:</span>
                <span className="font-medium text-emerald-400">
                  {formatAmount(ca || 0)} u
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Passif total:</span>
                <span className="font-medium text-red-400">
                  {formatAmount(Math.abs(bfr) || 0)} u
                </span>
              </div>
            </motion.div>
          )}

          {tab === "glossary" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-gray-300"
            >
              <p className="text-gray-400">
                Consulte le glossaire depuis l'onglet central
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RightPanel;
