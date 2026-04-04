"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CompanyEvolutionProps {
  tour: number;
  nbCommerciaux: number;
  nbCartesActives: number;
  tresorerie: number;
  resultatNet: number;
  ca: number;
}

interface StageConfig {
  label: string;
  ambiance: string;
  emoji: string;
  colors: {
    bg: string;
    border: string;
    accent: string;
  };
}

const STAGES: Record<number, StageConfig> = {
  1: {
    label: "Démarrage — Petit bureau",
    ambiance: "L’aventure commence...",
    emoji: "🏠",
    colors: {
      bg: "bg-slate-800",
      border: "border-slate-600",
      accent: "text-slate-400",
    },
  },
  2: {
    label: "Croissance — Bureau animé",
    ambiance: "L’équipe grandit !",
    emoji: "🏢",
    colors: {
      bg: "bg-slate-700",
      border: "border-blue-500",
      accent: "text-blue-400",
    },
  },
  3: {
    label: "Expansion — Open space",
    ambiance: "L’entreprise prend de l’ampleur.",
    emoji: "🏗️",
    colors: {
      bg: "bg-slate-700",
      border: "border-purple-500",
      accent: "text-purple-400",
    },
  },
  4: {
    label: "Maturité — Siège social",
    ambiance: "Votre empire se consolide.",
    emoji: "🏛️",
    colors: {
      bg: "bg-slate-600",
      border: "border-amber-500",
      accent: "text-amber-400",
    },
  },
};

function getStageNumber(tour: number): number {
  if (tour <= 3) return 1;
  if (tour <= 6) return 2;
  if (tour <= 9) return 3;
  return 4;
}

function getHealthIndicator(
  resultatNet: number,
  tresorerie: number
): { emoji: string; label: string } {
  if (resultatNet > 0 && tresorerie > 5) {
    return { emoji: "💚", label: "Excellent" };
  }
  if (tresorerie < 0 || resultatNet < -3) {
    return { emoji: "🔴", label: "Critique" };
  }
  return { emoji: "🟡", label: "Attention" };
}

function renderStageScene(
  stageNumber: number,
  nbCommerciaux: number,
  nbCartesActives: number
): React.ReactNode {
  const desks = "🪑";
  const coffee = "☕";
  const person = "👤";

  switch (stageNumber) {
    case 1:
      return (
        <div className="space-y-2">
          <div className="text-3xl">
            {desks} {desks}
          </div>
          <div className="text-xl opacity-60">Calme</div>
        </div>
      );

    case 2:
      return (
        <div className="space-y-2">
          <div className="text-3xl">
            {desks} {desks} {desks}
          </div>
          <div className="text-2xl">{coffee}</div>
          <div className="text-sm opacity-60">Animé</div>
        </div>
      );

    case 3:
      return (
        <div className="space-y-2">
          <div className="text-3xl flex justify-center gap-1">
            {desks} {desks} {desks} {desks}
          </div>
          <div className="flex justify-center gap-2 text-2xl">
            {person} {coffee} {person}
          </div>
          <div className="text-sm opacity-60">Dynamique</div>
        </div>
      );

    case 4:
      return (
        <div className="space-y-2">
          <div className="text-4xl">🏢</div>
          <div className="text-3xl flex justify-center gap-1">
            {desks} {desks} {desks} {desks}
          </div>
          <div className="flex justify-center gap-2 text-2xl">
            {person} {person} {coffee} {person} {person}
          </div>
          <div className="text-sm opacity-60">Prestigieux</div>
        </div>
      );

    default:
      return <div>{STAGES[stageNumber]?.emoji ?? "🏢"}</div>;
  }
}

export default function CompanyEvolution({
  tour,
  nbCommerciaux,
  nbCartesActives,
  tresorerie,
  resultatNet,
  ca,
}: CompanyEvolutionProps): React.ReactElement {
  const stageNumber = useMemo(() => getStageNumber(tour), [tour]);
  const health = useMemo(
    () => getHealthIndicator(resultatNet, tresorerie),
    [resultatNet, tresorerie]
  );
  const stageConfig = STAGES[stageNumber];

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={stageNumber}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            type: "spring",
            damping: 15,
            stiffness: 100,
          }}
          className={`rounded-lg border-2 p-5 ${stageConfig.colors.bg} ${stageConfig.colors.border}`}
        >
          {/* Stage label and emoji */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              {stageConfig.label}
            </h3>
            <span className="text-4xl">{stageConfig.emoji}</span>
          </div>

          {/* Scene visualization */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className={`mb-3 flex flex-col items-center justify-center rounded p-3 bg-slate-900/50 ${stageConfig.colors.accent}`}
          >
            {renderStageScene(stageNumber, nbCommerciaux, nbCartesActives)}
          </motion.div>

          {/* Ambiance text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`mb-3 text-center text-sm italic ${stageConfig.colors.accent}`}
          >
            {stageConfig.ambiance}
          </motion.p>

          {/* Metrics grid */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="grid grid-cols-4 gap-1"
          >
            {/* Commerciaux */}
            <div className="rounded border border-slate-700 bg-slate-900/50 p-1.5 text-center overflow-hidden">
              <div className="text-base">👤</div>
              <div className="text-[9px] font-semibold text-slate-400 leading-tight truncate">
                Comm.
              </div>
              <div className="text-sm font-bold text-white">
                {nbCommerciaux}
              </div>
            </div>

            {/* Cartes actives */}
            <div className="rounded border border-slate-700 bg-slate-900/50 p-1.5 text-center overflow-hidden">
              <div className="text-base">📦</div>
              <div className="text-[9px] font-semibold text-slate-400 leading-tight truncate">
                Actives
              </div>
              <div className="text-sm font-bold text-white">
                {nbCartesActives}
              </div>
            </div>

            {/* Santé */}
            <div className="rounded border border-slate-700 bg-slate-900/50 p-1.5 text-center overflow-hidden">
              <div className="text-base">{health.emoji}</div>
              <div className="text-[9px] font-semibold text-slate-400 leading-tight truncate">
                Santé
              </div>
              <div className="text-[9px] font-bold text-white leading-tight truncate">
                {health.label}
              </div>
            </div>

            {/* CA */}
            <div className="rounded border border-slate-700 bg-slate-900/50 p-1.5 text-center overflow-hidden">
              <div className="text-base">💰</div>
              <div className="text-[9px] font-semibold text-slate-400 leading-tight truncate">
                Chiffre
              </div>
              <div className="text-xs font-bold text-white">
                {(ca / 1000).toFixed(0)}k
              </div>
            </div>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-3"
          >
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Trimestre {tour}/12</span>
              <span>
                {stageNumber === 4
                  ? "100%"
                  : `${Math.round(((tour % 3) / 3) * 100)}%`}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-900">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(tour / 12) * 100}%` }}
                transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
