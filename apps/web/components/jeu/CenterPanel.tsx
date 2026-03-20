"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import CompanyEvolution from "./animations/CompanyEvolution";
import BFRPipeline from "./animations/BFRPipeline";
import FlowAnimation from "./animations/FlowAnimation";
import CausalChain from "./animations/CausalChain";

export interface CenterPanelProps {
  // Game state
  tour: number;
  etape: number;
  joueur: any;

  // Company metrics
  nbCommerciaux: number;
  nbCartesActives: number;
  tresorerie: number;
  resultatNet: number;
  ca: number;

  // BFR data
  creancesPlus1: number;
  creancesPlus2: number;

  // Active flow animations
  activeFlows?: Array<{
    id: string;
    from: string;
    to: string;
    amount: number;
    type: "cash" | "invoice" | "stock" | "charge" | "revenue";
    delay?: number;
  }>;
  onFlowsComplete?: () => void;

  // Causal chain (shows when decision applied)
  causalChain?: {
    decision: string;
    steps: Array<{
      icon: string;
      label: string;
      type: "operational" | "financial" | "result";
      value?: string;
      isPositive?: boolean;
    }>;
  };

  // New sale animation for BFR
  newSale?: {
    clientType: string;
    amount: number;
    delai: number;
  };

  // Pedagogical message (auto-generated after turn events)
  pedagogicalMessage?: string;

  // Feedback level
  feedbackLevel?: "immediate" | "economic" | "narrative";
}

const CenterPanel: React.FC<CenterPanelProps> = ({
  tour,
  etape,
  joueur,
  nbCommerciaux,
  nbCartesActives,
  tresorerie,
  resultatNet,
  ca,
  creancesPlus1,
  creancesPlus2,
  activeFlows,
  onFlowsComplete,
  causalChain,
  newSale,
  pedagogicalMessage,
  feedbackLevel = "economic",
}) => {
  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto bg-gray-900">
      {/* Company Evolution Section */}
      <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-2">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          📊 Évolution de l&apos;entreprise
        </h2>
        <CompanyEvolution
          tour={tour}
          nbCommerciaux={nbCommerciaux}
          nbCartesActives={nbCartesActives}
          tresorerie={tresorerie}
          resultatNet={resultatNet}
          ca={ca}
        />
      </div>

      {/* BFR Pipeline Section */}
      <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-2">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          ⏳ Cycle des encaissements
        </h2>
        <BFRPipeline
          creancesPlus1={creancesPlus1}
          creancesPlus2={creancesPlus2}
          tresorerie={tresorerie}
          newSale={newSale}
        />
      </div>

      {/* Flow Animations Section */}
      <AnimatePresence>
        {activeFlows && activeFlows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-2"
          >
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              🔄 Flux comptables
            </h2>
            <FlowAnimation
              flows={activeFlows}
              onComplete={onFlowsComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Causal Chain Section */}
      <AnimatePresence>
        {causalChain && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-2"
          >
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              ⛓️ Chaîne de causalité
            </h2>
            <CausalChain
              decision={causalChain.decision}
              steps={causalChain.steps}
              visible={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pedagogical Message Section */}
      <AnimatePresence>
        {pedagogicalMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-amber-900/20 via-gray-800/40 to-indigo-900/20 rounded-xl border border-amber-700/30 p-2"
          >
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5 flex-shrink-0">💡</span>
              <p className="text-xs text-gray-200 leading-relaxed">
                {pedagogicalMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CenterPanel;
