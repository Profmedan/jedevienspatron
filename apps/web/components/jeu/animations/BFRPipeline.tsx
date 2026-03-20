"use client";

import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";

interface BFRPipelineProps {
  /** Pending invoices at each delay stage */
  creancesPlus1: number; // Amount due in 1 quarter
  creancesPlus2: number; // Amount due in 2 quarters
  tresorerie: number; // Current cash
  /** Recent sale to animate (optional) */
  newSale?: {
    clientType: string; // "particulier" | "tpe" | "grand_compte"
    amount: number;
    delai: number; // 0, 1, or 2 quarters
  };
}

interface SaleToken {
  id: string;
  amount: number;
  delai: number;
  clientType: string;
}

/** Animated number counter — one-shot spring, no infinite loop */
const AnimatedNumber: React.FC<{ value: number; isHighlight?: boolean }> = ({
  value,
  isHighlight = false,
}) => {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString("fr-FR")
  );

  useEffect(() => {
    const animation = animate(motionValue, value, {
      type: "spring",
      stiffness: 60,
      damping: 15,
      duration: 0.6,
    });
    return () => {
      animation?.stop();
    };
  }, [value, motionValue]);

  return (
    <motion.span
      className={`font-bold tabular-nums ${
        isHighlight && value > 0 ? "text-emerald-400" : "text-cyan-300"
      }`}
      key={`${value}`}
    >
      {rounded}
    </motion.span>
  );
};

/** Colored BFR value based on surplus/deficit */
const BFRValue: React.FC<{ bfr: number }> = ({ bfr }) => {
  const isPositive = bfr > 0;
  const color = isPositive ? "text-orange-400" : "text-emerald-400";
  const bgColor = isPositive ? "bg-orange-500/20" : "bg-emerald-500/20";

  return (
    <span className={`font-bold ${color} ${bgColor} px-2 py-1 rounded`}>
      <AnimatedNumber value={Math.abs(bfr)} />
    </span>
  );
};

/** Pipeline stage — static, no infinite animations */
const PipelineStage: React.FC<{
  emoji: string;
  label: string;
  amount: number;
  isDelay?: boolean;
  delayIntensity?: number;
  index: number;
}> = ({ emoji, label, amount, isDelay = false, index }) => {
  const hasValue = amount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.15,
        type: "spring",
        stiffness: 100,
        damping: 12,
      }}
      className="flex flex-col items-center gap-1 relative"
    >
      {/* Stage icon and label */}
      <div className="relative z-10 text-center">
        <div className="text-lg mb-0.5">
          {isDelay ? (
            <span className={hasValue ? "text-orange-400" : "text-gray-500"}>
              ⏳
            </span>
          ) : (
            emoji
          )}
        </div>
        <div className="text-[9px] font-medium text-gray-400 mb-1 leading-tight">{label}</div>
      </div>

      {/* Amount display */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={amount}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="text-sm"
          >
            <AnimatedNumber value={amount} isHighlight={isDelay && hasValue} />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/** Arrow connector — static, no infinite bounce */
const PipelineArrow: React.FC<{ index: number }> = ({ index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{
        delay: index * 0.15 + 0.1,
        duration: 0.4,
        ease: "easeOut",
      }}
      className="flex items-center justify-center px-0.5 origin-left"
    >
      <span className="text-xs text-cyan-400">→</span>
    </motion.div>
  );
};

/** Sale token traveling through pipeline */
const SaleToken: React.FC<{
  token: SaleToken;
  totalCreances: number;
  onComplete: () => void;
}> = ({ token, onComplete }) => {
  const getColor = () => {
    const colors = {
      particulier: "bg-blue-500",
      tpe: "bg-purple-500",
      grand_compte: "bg-pink-500",
    };
    return colors[token.clientType as keyof typeof colors] || "bg-blue-500";
  };

  const progressMap: Record<number, number> = {
    0: 1,
    1: 0.6,
    2: 0.4,
  };
  const xProgress = progressMap[token.delai] || 0;

  return (
    <motion.div
      key={token.id}
      className="absolute top-1/2 -translate-y-1/2 z-20"
      initial={{ x: "5%", opacity: 0 }}
      animate={{ x: `${xProgress * 100}%`, opacity: 1 }}
      exit={{ x: "95%", opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 500);
      }}
    >
      <div
        className={`w-2 h-2 rounded-full ${getColor()} shadow-lg`}
        style={{ width: "8px", height: "8px" }}
      />
    </motion.div>
  );
};

/** Main BFRPipeline component */
export default function BFRPipeline({
  creancesPlus1,
  creancesPlus2,
  tresorerie,
  newSale,
}: BFRPipelineProps) {
  const [tokens, setTokens] = useState<SaleToken[]>([]);
  const [displayValues, setDisplayValues] = useState({
    plus1: creancesPlus1,
    plus2: creancesPlus2,
    cash: tresorerie,
  });

  useEffect(() => {
    setDisplayValues({
      plus1: creancesPlus1,
      plus2: creancesPlus2,
      cash: tresorerie,
    });
  }, [creancesPlus1, creancesPlus2, tresorerie]);

  useEffect(() => {
    if (newSale) {
      const tokenId = `${Date.now()}-${Math.random()}`;
      const token: SaleToken = {
        id: tokenId,
        amount: newSale.amount,
        delai: newSale.delai,
        clientType: newSale.clientType,
      };
      setTokens((prev) => [...prev, token]);
      const timeout = setTimeout(() => {
        setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [newSale?.amount, newSale?.delai, newSale?.clientType]);

  const totalCreances = creancesPlus1 + creancesPlus2;
  const bfr = totalCreances - tresorerie;

  return (
    <div className="w-full">
      {/* Main Pipeline */}
      <motion.div
        className="bg-gray-800/60 rounded-lg p-2 mb-3 border border-gray-700/50 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Pipeline container */}
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-1 mb-3">
            {/* Stage 1: Vente */}
            <PipelineStage
              emoji="📦"
              label="Vente"
              amount={displayValues.plus1 + displayValues.plus2}
              index={0}
            />
            <PipelineArrow index={0} />
            {/* Stage 2: Facture */}
            <PipelineStage
              emoji="📄"
              label="Facture"
              amount={displayValues.plus1 + displayValues.plus2}
              index={1}
            />
            <PipelineArrow index={1} />
            {/* Stage 3: Délai C+1 */}
            <PipelineStage
              emoji="⏳"
              label="Délai C+1"
              amount={displayValues.plus1}
              isDelay
              delayIntensity={1}
              index={2}
            />
            <PipelineArrow index={2} />
            {/* Stage 4: Délai C+2 */}
            <PipelineStage
              emoji="⏳"
              label="Délai C+2"
              amount={displayValues.plus2}
              isDelay
              delayIntensity={2}
              index={3}
            />
            <PipelineArrow index={3} />
            {/* Stage 5: Trésorerie */}
            <PipelineStage
              emoji="💰"
              label="Trésorerie"
              amount={displayValues.cash}
              index={4}
            />
          </div>

          {/* Sale tokens animation layer */}
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <AnimatePresence>
              {tokens.map((token) => (
                <SaleToken
                  key={token.id}
                  token={token}
                  totalCreances={totalCreances}
                  onComplete={() => {
                    setTokens((prev) =>
                      prev.filter((t) => t.id !== token.id)
                    );
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* BFR Summary */}
      <motion.div
        className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* BFR Calculation Line */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 text-xs font-medium text-gray-300">
          <span>BFR&nbsp;=</span>
          <span>Créances</span>
          <span className="text-cyan-300">
            (<AnimatedNumber value={totalCreances} />)
          </span>
          <span>−</span>
          <span>Tréso.</span>
          <span className="text-emerald-300">
            (<AnimatedNumber value={displayValues.cash} />)
          </span>
          <span>=</span>
          <BFRValue bfr={bfr} />
        </div>

        {/* Status indicator — static, no infinite animation */}
        <div
          className={`text-center text-sm font-medium py-2 rounded ${
            bfr > 0
              ? "bg-orange-500/20 text-orange-300"
              : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {bfr > 0 ? (
            <>⚠️ Capital immobilisé (BFR positif)</>
          ) : (
            <>✅ BFR maîtrisé (BFR négatif ou nul)</>
          )}
        </div>
      </motion.div>
    </div>
  );
}
