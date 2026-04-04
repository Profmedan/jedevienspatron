"use client";

import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Joueur } from "@jedevienspatron/game-engine";

import CompanyEvolution from "./animations/CompanyEvolution";
import BFRPipeline from "./animations/BFRPipeline";
import FlowAnimation from "./animations/FlowAnimation";
import CausalChain from "./animations/CausalChain";

export interface CenterPanelProps {
  tour: number;
  etape: number;
  joueur: Joueur;
  nbCommerciaux: number;
  nbCartesActives: number;
  tresorerie: number;
  resultatNet: number;
  ca: number;
  creancesPlus1: number;
  creancesPlus2: number;
  activeFlows?: Array<{
    id: string;
    from: string;
    to: string;
    amount: number;
    type: "cash" | "invoice" | "stock" | "charge" | "revenue";
    delay?: number;
  }>;
  onFlowsComplete?: () => void;
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
  newSale?: {
    clientType: string;
    amount: number;
    delai: number;
  };
  pedagogicalMessage?: string;
  feedbackLevel?: "immediate" | "economic" | "narrative";
}

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

const FEEDBACK_LABELS = {
  immediate: "Repère immédiat",
  economic: "Lecture économique",
  narrative: "Lecture narrative",
} as const;

function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-white text-balance">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
    </div>
  );
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
  const intro = useMemo(() => {
    if (pedagogicalMessage) {
      return "Commence par le message-clé, puis regarde comment il se traduit dans les flux et la trésorerie.";
    }

    if (causalChain) {
      return "Le jeu déroule ici la logique entre ta décision, ses effets opérationnels et son impact financier.";
    }

    if (activeFlows && activeFlows.length > 0) {
      return "Observe le trajet du cash, des créances et des charges avant de passer à l’étape suivante.";
    }

    return `Cette zone aide à comprendre comment ${joueur.entreprise.nom} transforme les décisions en activité, encaissements et résultat.`;
  }, [activeFlows, causalChain, joueur.entreprise.nom, pedagogicalMessage]);

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-3 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-sm xl:h-full xl:overflow-y-auto">
      <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              Lecture guidée
            </p>
            <h2 className="mt-2 text-base font-semibold text-white text-balance">
              Comprendre ce tour en un coup d&apos;œil
            </h2>
          </div>
          <span className="w-fit rounded-full bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
            {FEEDBACK_LABELS[feedbackLevel]}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">{intro}</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <p className="text-[11px] font-medium text-slate-400">Tour / étape</p>
            <p className="mt-2 text-lg font-semibold text-white tabular-nums">
              {tour} · {etape + 1}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <p className="text-[11px] font-medium text-slate-400">Commerciaux</p>
            <p className="mt-2 text-lg font-semibold text-white tabular-nums">
              {nbCommerciaux}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <p className="text-[11px] font-medium text-slate-400">Cartes actives</p>
            <p className="mt-2 text-lg font-semibold text-white tabular-nums">
              {nbCartesActives}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <AnimatePresence initial={false}>
          {pedagogicalMessage && (
            <motion.section
              key="pedagogical-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-4 py-4"
            >
              <SectionHeader
                eyebrow="À retenir"
                title="Le point pédagogique à garder en tête"
                description="Lis cette phrase comme une règle simple avant de relancer l’action."
              />
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-base" aria-hidden="true">
                  💡
                </span>
                <p className="text-sm leading-relaxed text-slate-200">{pedagogicalMessage}</p>
              </div>
            </motion.section>
          )}

          {causalChain && (
            <motion.section
              key="causal-chain"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <SectionHeader
                eyebrow="Cause & effet"
                title="Comment la décision produit son impact"
                description="Le jeu déroule la chaîne complète entre l’action choisie et ses conséquences."
              />
              <CausalChain
                decision={causalChain.decision}
                steps={causalChain.steps}
                visible={true}
              />
            </motion.section>
          )}

          {activeFlows && activeFlows.length > 0 && (
            <motion.section
              key="active-flows"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <SectionHeader
                eyebrow="Flux"
                title="Ce qui bouge dans les comptes"
                description="Observe le mouvement avant d’interpréter le résultat final."
              />
              <FlowAnimation
                flows={activeFlows}
                onComplete={onFlowsComplete}
              />
            </motion.section>
          )}
        </AnimatePresence>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
          <SectionHeader
            eyebrow="Trajectoire"
            title="Comment l’entreprise évolue dans le temps"
            description="Regarde l’effet cumulé des tours sur l’activité, la trésorerie et le résultat."
          />
          <CompanyEvolution
            tour={tour}
            nbCommerciaux={nbCommerciaux}
            nbCartesActives={nbCartesActives}
            tresorerie={tresorerie}
            resultatNet={resultatNet}
            ca={ca}
          />
        </section>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
          <SectionHeader
            eyebrow="Trésorerie"
            title="Quand la vente devient réellement du cash"
            description="Les créances montrent pourquoi un bon chiffre d’affaires ne se transforme pas tout de suite en trésorerie."
          />
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.04] px-3 py-2.5">
              <p className="text-[11px] font-medium text-slate-400">Créances C+1</p>
              <p className="mt-1 text-base font-semibold text-white tabular-nums">
                {creancesPlus1}
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] px-3 py-2.5">
              <p className="text-[11px] font-medium text-slate-400">Créances C+2</p>
              <p className="mt-1 text-base font-semibold text-white tabular-nums">
                {creancesPlus2}
              </p>
            </div>
          </div>
          <BFRPipeline
            creancesPlus1={creancesPlus1}
            creancesPlus2={creancesPlus2}
            tresorerie={tresorerie}
            newSale={newSale}
          />
        </section>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
          <SectionHeader
            eyebrow="Lecture rapide"
            title="Le repère simple avant de continuer"
            description="Une synthèse courte pour éviter de se perdre dans les détails."
          />
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
              <p className="text-[11px] font-medium text-slate-400">Chiffre d&apos;affaires</p>
              <p className="mt-2 text-lg font-semibold text-white tabular-nums">{ca}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
              <p className="text-[11px] font-medium text-slate-400">Résultat net</p>
              <p
                className={`mt-2 text-lg font-semibold tabular-nums ${
                  resultatNet >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {resultatNet}
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
              <p className="text-[11px] font-medium text-slate-400">Trésorerie</p>
              <p
                className={`mt-2 text-lg font-semibold tabular-nums ${
                  tresorerie >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {tresorerie}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CenterPanel;
