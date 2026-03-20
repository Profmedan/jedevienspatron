"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DECOUVERT_MAX } from "@/lib/game-engine/types";

interface AlerteDecouvertProps {
  decouvert: number;
}

type NiveauAlerte = "none" | "jaune" | "orange" | "rouge";

interface ConfigAlerte {
  niveau: NiveauAlerte;
  couleur: string;
  emoji: string;
  titre: string;
  message: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

const AlerteDecouvert: React.FC<AlerteDecouvertProps> = ({ decouvert }) => {
  const config = useMemo((): ConfigAlerte => {
    if (decouvert <= 2) {
      return {
        niveau: "none",
        couleur: "",
        emoji: "",
        titre: "",
        message: "",
        bgClass: "",
        borderClass: "",
        textClass: "",
      };
    } else if (decouvert <= 4) {
      return {
        niveau: "jaune",
        couleur: "yellow",
        emoji: "⚠️",
        titre: "Attention, ton découvert augmente",
        message: `Découvert ${decouvert}/${DECOUVERT_MAX}. Les agios grignotent ta trésorerie.`,
        bgClass: "bg-yellow-950/40",
        borderClass: "border-yellow-700",
        textClass: "text-yellow-300",
      };
    } else if (decouvert <= 6) {
      return {
        niveau: "orange",
        couleur: "orange",
        emoji: "🔶",
        titre: "Découvert élevé",
        message: `Découvert ${decouvert}/${DECOUVERT_MAX} ! Demande un prêt ou réduis tes charges.`,
        bgClass: "bg-orange-950/40",
        borderClass: "border-orange-700",
        textClass: "text-orange-300",
      };
    } else if (decouvert === 7) {
      return {
        niveau: "rouge",
        couleur: "red",
        emoji: "🔴",
        titre: "Découvert critique",
        message: `Découvert critique (${decouvert}/${DECOUVERT_MAX}) ! Un point de plus = faillite.`,
        bgClass: "bg-red-950/50",
        borderClass: "border-red-700",
        textClass: "text-red-300",
      };
    } else {
      // 8+ — ce cas ne devrait pas se produire car faillite immédiate
      return {
        niveau: "rouge",
        couleur: "red",
        emoji: "💀",
        titre: "FAILLITE",
        message: `Découvert dépassé (${decouvert}/${DECOUVERT_MAX}) — cessation de paiement !`,
        bgClass: "bg-red-950/60",
        borderClass: "border-red-600",
        textClass: "text-red-400",
      };
    }
  }, [decouvert]);

  return (
    <AnimatePresence>
      {config.niveau !== "none" && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`rounded-lg border-2 ${config.borderClass} ${config.bgClass} px-4 py-3 mb-3`}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">{config.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${config.textClass}`}>
                {config.titre}
              </p>
              <p className={`text-xs ${config.textClass} opacity-90 mt-0.5`}>
                {config.message}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlerteDecouvert;
