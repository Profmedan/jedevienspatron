"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface TreasuryTensionProps {
  resultatNet: number;
  tresorerie: number;
  bfr: number;
  creancesTotal: number;
  dettesTotal: number;
  decouvert: number;
  maxDecouvert: number;
}

export default function TreasuryTension({
  resultatNet,
  tresorerie,
  bfr,
  creancesTotal,
  dettesTotal,
  decouvert,
  maxDecouvert,
}: TreasuryTensionProps) {
  // Determine tension state
  const tensionState = useMemo(() => {
    const resultatPositive = resultatNet > 0;
    const tresorerieHealthy = tresorerie > 3;
    const tresorerieNegative = tresorerie < 0;

    if (resultatPositive && !tresorerieHealthy) {
      return "tension";
    } else if (!resultatPositive && tresorerieHealthy) {
      return "paradox";
    } else if (resultatPositive && tresorerieHealthy) {
      return "balanced";
    } else {
      return "danger";
    }
  }, [resultatNet, tresorerie]);

  // Normalize values for gauge display (0-100 scale, clamped)
  const resultatGaugeValue = Math.max(0, Math.min(100, resultatNet * 5));
  const tresorerieGaugeValue = Math.max(
    0,
    Math.min(100, tresorerie > 0 ? tresorerie * 10 : 0)
  );

  // Discover danger level (0-1)
  const decouvertRatio = Math.min(1, decouvert / maxDecouvert);

  // Get color for tresorerie gauge based on health
  const getTresorerieColor = () => {
    if (tresorerie < 0) return "from-red-600 to-red-500";
    if (tresorerie < 3) return "from-orange-600 to-orange-500";
    return "from-green-600 to-green-500";
  };

  // Get color for découvert bar
  const getDecouvertColor = () => {
    const ratio = decouvertRatio;
    if (ratio <= 0.375) return "from-green-600 to-green-500";
    if (ratio <= 0.75) return "from-orange-600 to-orange-500";
    return "from-red-600 to-red-500";
  };

  // Get tension label and styling
  const getTensionDisplay = () => {
    switch (tensionState) {
      case "tension":
        return {
          icon: "⚠️",
          label: "TENSION",
          color: "text-orange-400",
          bgColor: "bg-orange-900/30",
          message: "Votre entreprise est rentable mais manque de liquidités !",
          pulse: true,
        };
      case "paradox":
        return {
          icon: "💡",
          label: "Anomalie",
          color: "text-blue-400",
          bgColor: "bg-blue-900/30",
          message: "Trésorerie solide mais résultat négatif",
          pulse: false,
        };
      case "balanced":
        return {
          icon: "✅",
          label: "Équilibre",
          color: "text-green-400",
          bgColor: "bg-green-900/30",
          message: "Situation saine et équilibrée",
          pulse: false,
        };
      case "danger":
      default:
        return {
          icon: "🚨",
          label: "DANGER",
          color: "text-red-400",
          bgColor: "bg-red-900/30",
          message: "Situation critique : résultat et trésorerie dégradés",
          pulse: true,
        };
    }
  };

  const tensionDisplay = getTensionDisplay();

  return (
    <div className="w-full space-y-6 rounded-lg border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
      {/* Dual Gauge Display */}
      <div className="flex items-end justify-center gap-12">
        {/* Résultat Gauge */}
        <div className="flex flex-col items-center gap-4">
          <label className="text-sm font-semibold text-slate-300">
            📊 Résultat
          </label>
          <div className="relative h-48 w-12 overflow-hidden rounded-full border border-slate-600 bg-slate-800/50">
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-600 to-green-500"
              style={{
                height: resultatNet >= 0 ? `${resultatGaugeValue}%` : "0%",
              }}
              animate={{
                height: resultatNet >= 0 ? `${resultatGaugeValue}%` : "0%",
              }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
            />
            {resultatNet < 0 && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600 to-red-500"
                style={{
                  height: `${Math.abs(resultatNet) * 5}%`,
                }}
                animate={{
                  height: `${Math.abs(resultatNet) * 5}%`,
                }}
                transition={{ type: "spring", damping: 15, stiffness: 100 }}
              />
            )}
          </div>
          <motion.div
            className="text-xl font-bold"
            style={{
              color: resultatNet >= 0 ? "#22c55e" : "#ef4444",
            }}
          >
            <motion.span
              key={`resultat-${resultatNet}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {resultatNet.toFixed(1)}
            </motion.span>
          </motion.div>
        </div>

        {/* Tension Indicator Center */}
        <div className="flex flex-col items-center gap-3">
          <motion.div
            className={`flex flex-col items-center gap-2 rounded-lg px-4 py-3 ${tensionDisplay.bgColor} border border-current`}
            animate={{
              scale: tensionDisplay.pulse ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: tensionDisplay.pulse ? 2 : 0,
              repeat: tensionDisplay.pulse ? Infinity : 0,
            }}
          >
            <span className="text-2xl">{tensionDisplay.icon}</span>
            <span
              className={`text-xs font-bold uppercase tracking-widest ${tensionDisplay.color}`}
            >
              {tensionDisplay.label}
            </span>
          </motion.div>
          <p className="text-center text-xs text-slate-300">
            {tensionDisplay.message}
          </p>
        </div>

        {/* Trésorerie Gauge */}
        <div className="flex flex-col items-center gap-4">
          <label className="text-sm font-semibold text-slate-300">
            💰 Trésorerie
          </label>
          <div className="relative h-48 w-12 overflow-hidden rounded-full border border-slate-600 bg-slate-800/50">
            <motion.div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getTresorerieColor()}`}
              animate={{
                height: `${tresorerieGaugeValue}%`,
              }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
            />
          </div>
          <motion.div
            className="text-xl font-bold"
            style={{
              color:
                tresorerie < 0
                  ? "#ef4444"
                  : tresorerie < 3
                    ? "#f97316"
                    : "#22c55e",
            }}
          >
            <motion.span
              key={`tresorerie-${tresorerie}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {tresorerie.toFixed(1)}
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* Explanation Panel */}
      {(creancesTotal > 0 || dettesTotal > 0 || bfr > 3) && (
        <div className="space-y-3 border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-slate-200">
            Pourquoi cette différence ?
          </h3>
          <div className="space-y-2 text-xs text-slate-400">
            {creancesTotal > 0 && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                📄 <span className="font-semibold text-slate-300">{creancesTotal}</span> de
                créances en attente d’encaissement
              </motion.p>
            )}
            {dettesTotal > 0 && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                📋 <span className="font-semibold text-slate-300">{dettesTotal}</span> de
                dettes à régler
              </motion.p>
            )}
            {bfr > 3 && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                ⏳ BFR élevé (<span className="font-semibold text-slate-300">{bfr}</span>) —
                votre argent est immobilisé dans le cycle d’exploitation
              </motion.p>
            )}
          </div>
        </div>
      )}

      {/* Découvert Danger Zone */}
      {decouvert > 0 && (
        <div className="space-y-2 border-t border-slate-700 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              🏦 Découvert bancaire
            </span>
            <span className="text-xs font-bold text-slate-300">
              {decouvert}/{maxDecouvert}
            </span>
          </div>
          <div className="overflow-hidden rounded-full bg-slate-800/50 p-1">
            <motion.div
              className={`h-2 rounded-full bg-gradient-to-r ${getDecouvertColor()}`}
              animate={{
                width: `${decouvertRatio * 100}%`,
                boxShadow:
                  decouvertRatio > 0.75
                    ? ["0 0 8px rgba(239, 68, 68, 0.5)", "0 0 12px rgba(239, 68, 68, 0.8)"]
                    : "0 0 0px rgba(0, 0, 0, 0)",
              }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 100,
                boxShadow: {
                  duration: 1,
                  repeat: decouvertRatio > 0.75 ? Infinity : 0,
                },
              }}
            />
          </div>
          {decouvertRatio > 0.75 && (
            <motion.div
              className="flex items-center gap-2 rounded-lg bg-red-900/30 px-3 py-2"
              animate={{
                x: [0, -4, 4, -4, 0],
              }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              <span className="text-base">⚠️</span>
              <span className="text-xs font-bold text-red-400">
                Faillite imminente !
              </span>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
