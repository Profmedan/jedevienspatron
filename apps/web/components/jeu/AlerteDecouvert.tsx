"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DECOUVERT_MAX } from "@jedevienspatron/game-engine";

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

// Seuils dérivés de DECOUVERT_MAX (8 000 €) pour robustesse si la constante évolue.
// 25 % / 50 % / 75 % / 90 % — au-delà de 90 %, la faillite est imminente ;
// à partir de 100 % (DECOUVERT_MAX atteint), le moteur déclenche elimine=true
// et l'OverlayFaillite plein écran prend le relais.
const SEUIL_JAUNE  = DECOUVERT_MAX * 0.25;   //  2 000 €
const SEUIL_ORANGE = DECOUVERT_MAX * 0.50;   //  4 000 €
const SEUIL_ROUGE  = DECOUVERT_MAX * 0.75;   //  6 000 €
const SEUIL_IMMINENT = DECOUVERT_MAX * 0.90; //  7 200 €

const AlerteDecouvert: React.FC<AlerteDecouvertProps> = ({ decouvert }) => {
  const config = useMemo((): ConfigAlerte => {
    if (decouvert <= 0) {
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
    } else if (decouvert <= SEUIL_JAUNE) {
      return {
        niveau: "jaune",
        couleur: "yellow",
        emoji: "⚠️",
        titre: "Attention, ton découvert augmente",
        message: `Découvert ${decouvert} € / ${DECOUVERT_MAX} €. Les agios grignotent ta trésorerie.`,
        bgClass: "bg-yellow-950/40",
        borderClass: "border-yellow-700",
        textClass: "text-yellow-300",
      };
    } else if (decouvert <= SEUIL_ORANGE) {
      return {
        niveau: "orange",
        couleur: "orange",
        emoji: "🔶",
        titre: "Découvert élevé",
        message: `Découvert ${decouvert} € / ${DECOUVERT_MAX} €. Demande un prêt ou réduis tes charges.`,
        bgClass: "bg-orange-950/40",
        borderClass: "border-orange-700",
        textClass: "text-orange-300",
      };
    } else if (decouvert <= SEUIL_ROUGE) {
      return {
        niveau: "rouge",
        couleur: "red",
        emoji: "🔴",
        titre: "Découvert critique",
        message: `Découvert critique (${decouvert} € / ${DECOUVERT_MAX} €). Redresse la situation vite.`,
        bgClass: "bg-red-950/50",
        borderClass: "border-red-700",
        textClass: "text-red-300",
      };
    } else if (decouvert < DECOUVERT_MAX) {
      // Zone rouge foncé : faillite anticipable mais pas encore prononcée
      return {
        niveau: "rouge",
        couleur: "red",
        emoji: "⚠️",
        titre: "FAILLITE PRÉVISIBLE",
        message: `Découvert ${decouvert} € / ${DECOUVERT_MAX} €. Si tu dépasses le maximum, la banque coupe les paiements.`,
        bgClass: "bg-red-950/60",
        borderClass: "border-red-600",
        textClass: "text-red-400",
      };
    } else {
      // decouvert >= DECOUVERT_MAX — le moteur a déjà mis elimine=true,
      // l'OverlayFaillite plein écran s'affiche. Ce bandeau reste un fallback.
      return {
        niveau: "rouge",
        couleur: "red",
        emoji: "💀",
        titre: "FAILLITE",
        message: `Découvert dépassé (${decouvert} € / ${DECOUVERT_MAX} €) — cessation de paiement.`,
        bgClass: "bg-red-950/70",
        borderClass: "border-red-500",
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
