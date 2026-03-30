"use client";

import React from "react";
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
  marge,
  ebe,
  resultatNet,
  tresorerie,
  bfr,
  fondsRoulement,
  solvabilite,
  highlightedPoste,
  activeTab,
  setActiveTab,
}) => {
  const kpis = [
    { label: "CA", value: ca, isPercentage: false },
    { label: "Résultat net", value: resultatNet, isPercentage: false },
    { label: "Trésorerie", value: tresorerie, isPercentage: false },
    { label: "BFR", value: bfr, isPercentage: false },
    { label: "Fonds de roulement", value: fondsRoulement, isPercentage: false },
    { label: "Solvabilité", value: solvabilite, isPercentage: true },
  ];

  return (
    <div className="h-full overflow-y-auto rounded-2xl border border-gray-700 bg-gray-950 p-4 shadow-lg">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Indicateurs clés
        </p>
      </div>

      <div className="space-y-3">
        {kpis.map((kpi) => {
          const isLastKpi = kpi.label === "Solvabilité";
          const isSolvabilite = kpi.isPercentage;

          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0.5, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between rounded-lg bg-gray-900/50 px-3 py-2.5 border border-gray-800/50"
            >
              <span className="text-xs font-medium text-gray-300">{kpi.label}</span>
              <motion.span
                key={`${kpi.label}-${kpi.value}`}
                className={`text-sm font-semibold tabular-nums ${
                  isSolvabilite
                    ? getSolvabilityColor(kpi.value)
                    : getValueToneClass(kpi.value)
                }`}
                initial={{ opacity: 0.45, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {isSolvabilite ? `${formatAmount(kpi.value)}%` : `${formatAmount(kpi.value)} u`}
              </motion.span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RightPanel;
