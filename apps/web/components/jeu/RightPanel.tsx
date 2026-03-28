"use client";

import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { DECOUVERT_MAX, Joueur } from "@/lib/game-engine/types";

type RightPanelTab = "resume" | "bilan" | "cr";
type InsightTone = "emerald" | "amber" | "rose" | "sky";

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

interface Insight {
  tone: InsightTone;
  badge: string;
  title: string;
  description: string;
}

interface MetricRowProps {
  label: string;
  value: number;
  highlight?: boolean;
}

interface GaugeRowProps {
  label: string;
  valueLabel: string;
  helper: string;
  width: number;
  textClass: string;
  barClass: string;
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

const amountFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

const TAB_LABELS: Record<RightPanelTab, string> = {
  resume: "Vue d'ensemble",
  bilan: "Bilan",
  cr: "Résultat",
};

const INSIGHT_STYLES: Record<
  InsightTone,
  {
    surface: string;
    badge: string;
    title: string;
  }
> = {
  emerald: {
    surface: "border-emerald-400/20 bg-emerald-500/10",
    badge: "bg-emerald-400/15 text-emerald-200",
    title: "text-emerald-100",
  },
  amber: {
    surface: "border-amber-400/20 bg-amber-500/10",
    badge: "bg-amber-400/15 text-amber-100",
    title: "text-amber-50",
  },
  rose: {
    surface: "border-rose-400/20 bg-rose-500/10",
    badge: "bg-rose-400/15 text-rose-100",
    title: "text-rose-50",
  },
  sky: {
    surface: "border-sky-400/20 bg-sky-500/10",
    badge: "bg-sky-400/15 text-sky-100",
    title: "text-sky-50",
  },
};

function formatAmount(value: number): string {
  return amountFormatter.format(value);
}

function getValueToneClass(value: number): string {
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-slate-200";
}

function getGaugeBarClass(percentage: number): string {
  if (percentage >= 50) return "bg-emerald-400";
  if (percentage >= 30) return "bg-amber-400";
  return "bg-rose-400";
}

function getGaugeTextClass(percentage: number): string {
  if (percentage >= 50) return "text-emerald-300";
  if (percentage >= 30) return "text-amber-300";
  return "text-rose-300";
}

function getRelativeGaugeWidth(value: number, reference: number): number {
  if (value === 0 || reference <= 0) return 0;
  return Math.max(12, Math.min(100, (Math.abs(value) / reference) * 100));
}

function getBfrTone(bfr: number, fondsRoulement: number) {
  if (bfr <= 0) {
    return {
      textClass: "text-emerald-300",
      barClass: "bg-emerald-400",
      helper: "Le cycle d'exploitation soulage la trésorerie.",
    };
  }

  if (fondsRoulement > 0 && bfr <= fondsRoulement) {
    return {
      textClass: "text-emerald-300",
      barClass: "bg-emerald-400",
      helper: "Le BFR reste couvert par tes ressources stables.",
    };
  }

  if (fondsRoulement > 0 && bfr <= fondsRoulement * 1.25) {
    return {
      textClass: "text-amber-300",
      barClass: "bg-amber-400",
      helper: "Le cash se tend : surveille créances et stocks.",
    };
  }

  return {
    textClass: "text-rose-300",
    barClass: "bg-rose-400",
    helper: "Le BFR dépasse trop le FR : risque de tension de trésorerie.",
  };
}

function getFondsRoulementTone(fondsRoulement: number) {
  if (fondsRoulement > 0) {
    return {
      textClass: "text-emerald-300",
      barClass: "bg-emerald-400",
      helper: "Tes ressources longues couvrent une partie du cycle.",
    };
  }

  if (fondsRoulement === 0) {
    return {
      textClass: "text-amber-300",
      barClass: "bg-amber-400",
      helper: "L'entreprise n'a plus de coussin structurel.",
    };
  }

  return {
    textClass: "text-rose-300",
    barClass: "bg-rose-400",
    helper: "Structure fragile : les investissements pèsent trop lourd.",
  };
}

function buildInsight(
  joueur: Joueur,
  tresorerie: number,
  resultatNet: number,
  bfr: number,
  fondsRoulement: number,
  solvabilite: number,
): Insight {
  if (joueur.bilan.decouvert >= Math.floor(DECOUVERT_MAX * 0.75)) {
    return {
      tone: "rose",
      badge: "Priorité",
      title: "Le découvert devient critique",
      description: `Tu es à ${joueur.bilan.decouvert}/${DECOUVERT_MAX}. Il faut reconstituer du cash dès ce tour.`,
    };
  }

  if (tresorerie < 0) {
    return {
      tone: "rose",
      badge: "Alerte cash",
      title: "La trésorerie est passée sous zéro",
      description: "Ralentis les dépenses immédiates et sécurise les encaissements à venir.",
    };
  }

  if (bfr > fondsRoulement) {
    return {
      tone: "amber",
      badge: "Sous tension",
      title: "Le cycle d'exploitation absorbe trop de ressources",
      description: "Tes créances et ton stock consomment plus que ton fonds de roulement.",
    };
  }

  if (resultatNet < 0) {
    return {
      tone: "amber",
      badge: "À corriger",
      title: "L'activité détruit de la valeur",
      description: "Relis les charges et les décisions récurrentes avant de développer l'entreprise.",
    };
  }

  if (solvabilite < 30) {
    return {
      tone: "sky",
      badge: "Vigilance",
      title: "La structure reste fragile",
      description: "L'entreprise tourne, mais le niveau de fonds propres reste encore faible.",
    };
  }

  return {
    tone: "emerald",
    badge: "Cap clair",
    title: "Les fondamentaux sont maîtrisés",
    description: "Tu peux continuer à te développer sans perdre de vue la trésorerie.",
  };
}

function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-white text-balance">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function MetricRow({ label, value, highlight = false }: MetricRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-3 py-2.5 ${
        highlight
          ? "bg-sky-400/10 ring-1 ring-inset ring-sky-300/30"
          : "bg-white/[0.03]"
      }`}
    >
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${getValueToneClass(value)}`}>
        {formatAmount(value)}
      </span>
    </div>
  );
}

function GaugeRow({
  label,
  valueLabel,
  helper,
  width,
  textClass,
  barClass,
}: GaugeRowProps) {
  return (
    <div className="rounded-2xl bg-white/[0.03] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${textClass}`}>
          {valueLabel}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{helper}</p>
    </div>
  );
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
  const bilanTotals = useMemo(() => {
    const tresorerieActif =
      joueur.bilan.actifs.find((actif) => actif.categorie === "tresorerie")?.valeur ?? 0;
    const stocks =
      joueur.bilan.actifs.find((actif) => actif.categorie === "stocks")?.valeur ?? 0;
    const immobilisations =
      joueur.bilan.actifs.find((actif) => actif.categorie === "immobilisations")?.valeur ?? 0;

    const actif = {
      tresorerie: tresorerieActif,
      stocks,
      immobilisations,
      creancesC1: joueur.bilan.creancesPlus1,
      creancesC2: joueur.bilan.creancesPlus2,
    };

    const capitaux =
      joueur.bilan.passifs.find((passif) => passif.categorie === "capitaux")?.valeur ?? 0;
    const emprunts =
      joueur.bilan.passifs.find((passif) => passif.categorie === "emprunts")?.valeur ?? 0;

    const passif = {
      capitaux,
      emprunts,
      dettesFournisseur: joueur.bilan.dettes,
    };

    const totalActif = Object.values(actif).reduce((sum, value) => sum + value, 0);
    const totalPassif = Object.values(passif).reduce((sum, value) => sum + value, 0);

    return { actif, passif, totalActif, totalPassif };
  }, [joueur]);

  const crTotals = useMemo(() => {
    const produits = {
      ventes: joueur.compteResultat.produits.ventes,
      prodStockee: joueur.compteResultat.produits.productionStockee,
      revExceptionnels: joueur.compteResultat.produits.revenusExceptionnels,
    };

    const charges = {
      achatsCMV: joueur.compteResultat.charges.achats,
      servicesExt: joueur.compteResultat.charges.servicesExterieurs,
      personnel: joueur.compteResultat.charges.chargesPersonnel,
      amortissements: joueur.compteResultat.charges.dotationsAmortissements,
      interetsEmprunts: joueur.compteResultat.charges.chargesInteret,
      chargesExceptionnels: joueur.compteResultat.charges.chargesExceptionnelles,
    };

    const totalProduits = Object.values(produits).reduce((sum, value) => sum + value, 0);
    const totalCharges = Object.values(charges).reduce((sum, value) => sum + value, 0);

    return { produits, charges, totalProduits, totalCharges };
  }, [joueur]);

  const focusInsight = useMemo(
    () => buildInsight(joueur, tresorerie, resultatNet, bfr, fondsRoulement, solvabilite),
    [joueur, tresorerie, resultatNet, bfr, fondsRoulement, solvabilite],
  );

  const structureScale = useMemo(
    () => Math.max(Math.abs(bfr), Math.abs(fondsRoulement), 1),
    [bfr, fondsRoulement],
  );

  const insightStyle = INSIGHT_STYLES[focusInsight.tone];
  const bfrTone = getBfrTone(bfr, fondsRoulement);
  const fondsRoulementTone = getFondsRoulementTone(fondsRoulement);
  const decouvertWidth = (joueur.bilan.decouvert / DECOUVERT_MAX) * 100;
  const scoreMetrics = [
    { label: "Résultat net", value: resultatNet },
    { label: "Trésorerie", value: tresorerie },
  ];

  return (
    <div className="h-full overflow-y-auto rounded-[28px] border border-white/10 bg-slate-950/80 p-3 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-sm">
      <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
          Repères financiers
        </p>
        <h2 className="mt-2 text-base font-semibold text-white text-balance">
          Lire les chiffres sans quitter la partie
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Cette colonne t&apos;aide à identifier ce qui mérite ton attention avant de prendre la
          prochaine décision.
        </p>

        <div className={`mt-4 rounded-[22px] border px-4 py-4 ${insightStyle.surface}`}>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${insightStyle.badge}`}
          >
            {focusInsight.badge}
          </span>
          <h3 className={`mt-3 text-sm font-semibold text-balance ${insightStyle.title}`}>
            {focusInsight.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            {focusInsight.description}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {scoreMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3"
            >
              <p className="text-[11px] font-medium text-slate-400">{metric.label}</p>
              <motion.p
                key={`${metric.label}-${metric.value}`}
                className={`mt-2 text-xl font-semibold tabular-nums ${getValueToneClass(metric.value)}`}
                initial={{ opacity: 0.45, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {formatAmount(metric.value)}
              </motion.p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-white/[0.04] p-1"
        role="tablist"
        aria-label="Vues financières"
      >
        {(Object.keys(TAB_LABELS) as RightPanelTab[]).map((tab) => (
          <button
            key={tab}
            id={`right-panel-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`right-panel-panel-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
              activeTab === tab
                ? "bg-cyan-400 text-slate-950"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === "resume" && (
            <motion.div
              key="resume"
              id="right-panel-panel-resume"
              role="tabpanel"
              aria-labelledby="right-panel-tab-resume"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <section className="rounded-[24px] bg-white/[0.03] px-3 py-3">
                <SectionHeading
                  eyebrow="Performance"
                  title="Ce que l'activité produit ce tour"
                  description="Surveille d'abord la création de valeur avant d'accélérer."
                />
                <div className="space-y-2">
                  <MetricRow label="Chiffre d'affaires" value={ca} />
                  <MetricRow label="Marge commerciale" value={marge} />
                  <MetricRow label="EBE" value={ebe} />
                  <MetricRow label="Résultat net" value={resultatNet} />
                  <MetricRow label="Trésorerie" value={tresorerie} />
                </div>
              </section>

              <section className="rounded-[24px] bg-white/[0.03] px-3 py-3">
                <SectionHeading
                  eyebrow="Solidité"
                  title="Ce qui protège ou fragilise l'entreprise"
                  description="Lis ces trois indicateurs ensemble pour comprendre la pression sur le cash."
                />
                <div className="space-y-2">
                  {joueur.bilan.decouvert > 0 && (
                    <GaugeRow
                      label="Découvert bancaire"
                      valueLabel={`${joueur.bilan.decouvert}/${DECOUVERT_MAX}`}
                      width={decouvertWidth}
                      textClass={
                        joueur.bilan.decouvert <= 2
                          ? "text-slate-200"
                          : joueur.bilan.decouvert <= 4
                            ? "text-amber-300"
                            : "text-rose-300"
                      }
                      barClass={
                        joueur.bilan.decouvert <= 2
                          ? "bg-emerald-400"
                          : joueur.bilan.decouvert <= 4
                            ? "bg-amber-400"
                            : "bg-rose-400"
                      }
                      helper="Au-delà de 8, la partie bascule vers la faillite."
                    />
                  )}

                  <GaugeRow
                    label="BFR"
                    valueLabel={formatAmount(bfr)}
                    width={getRelativeGaugeWidth(bfr, structureScale)}
                    textClass={bfrTone.textClass}
                    barClass={bfrTone.barClass}
                    helper={bfrTone.helper}
                  />

                  <GaugeRow
                    label="Fonds de roulement"
                    valueLabel={formatAmount(fondsRoulement)}
                    width={getRelativeGaugeWidth(fondsRoulement, structureScale)}
                    textClass={fondsRoulementTone.textClass}
                    barClass={fondsRoulementTone.barClass}
                    helper={fondsRoulementTone.helper}
                  />

                  <GaugeRow
                    label="Solvabilité"
                    valueLabel={`${percentageFormatter.format(solvabilite)}%`}
                    width={Math.min(100, Math.max(0, solvabilite))}
                    textClass={getGaugeTextClass(solvabilite)}
                    barClass={getGaugeBarClass(solvabilite)}
                    helper="Plus ce ratio monte, plus tes fonds propres absorbent les chocs."
                  />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "bilan" && (
            <motion.div
              key="bilan"
              id="right-panel-panel-bilan"
              role="tabpanel"
              aria-labelledby="right-panel-tab-bilan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <section className="rounded-[24px] bg-white/[0.03] px-3 py-3">
                <SectionHeading
                  eyebrow="Actif"
                  title="Ce que l'entreprise possède ou doit encaisser"
                  description="Les créances et la trésorerie racontent ce que tu peux mobiliser rapidement."
                />
                <div className="space-y-2">
                  <MetricRow
                    label="Trésorerie"
                    value={bilanTotals.actif.tresorerie}
                    highlight={highlightedPoste === "tresorerie"}
                  />
                  <MetricRow
                    label="Stocks"
                    value={bilanTotals.actif.stocks}
                    highlight={highlightedPoste === "stocks"}
                  />
                  <MetricRow
                    label="Immobilisations"
                    value={bilanTotals.actif.immobilisations}
                    highlight={highlightedPoste === "immobilisations"}
                  />
                  <MetricRow
                    label="Créances C+1"
                    value={bilanTotals.actif.creancesC1}
                    highlight={highlightedPoste === "creancesC1"}
                  />
                  <MetricRow
                    label="Créances C+2"
                    value={bilanTotals.actif.creancesC2}
                    highlight={highlightedPoste === "creancesC2"}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs font-medium text-slate-400">Total actif</span>
                  <span className="text-sm font-semibold text-emerald-300 tabular-nums">
                    {formatAmount(bilanTotals.totalActif)}
                  </span>
                </div>
              </section>

              <section className="rounded-[24px] bg-white/[0.03] px-3 py-3">
                <SectionHeading
                  eyebrow="Passif"
                  title="Ce qui finance ton activité"
                  description="Capitaux, emprunts et dettes montrent comment l'entreprise tient debout."
                />
                <div className="space-y-2">
                  <MetricRow
                    label="Capitaux propres"
                    value={bilanTotals.passif.capitaux}
                    highlight={highlightedPoste === "capitaux"}
                  />
                  <MetricRow
                    label="Emprunts"
                    value={bilanTotals.passif.emprunts}
                    highlight={highlightedPoste === "emprunts"}
                  />
                  <MetricRow
                    label="Dettes fournisseur"
                    value={bilanTotals.passif.dettesFournisseur}
                    highlight={highlightedPoste === "dettes"}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs font-medium text-slate-400">Total passif + résultat</span>
                  <span className="text-sm font-semibold text-emerald-300 tabular-nums">
                    {formatAmount(bilanTotals.totalPassif + resultatNet)}
                  </span>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "cr" && (
            <motion.div
              key="cr"
              id="right-panel-panel-cr"
              role="tabpanel"
              aria-labelledby="right-panel-tab-cr"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <section className="rounded-[24px] bg-white/[0.03] px-3 py-3">
                <SectionHeading
                  eyebrow="Produits"
                  title="Ce qui fait entrer de la valeur"
                  description="Les ventes restent ton moteur principal, les autres lignes l'accompagnent."
                />
                <div className="space-y-2">
                  <MetricRow
                    label="Ventes"
                    value={crTotals.produits.ventes}
                    highlight={highlightedPoste === "ventes"}
                  />
                  <MetricRow
                    label="Production stockée"
                    value={crTotals.produits.prodStockee}
                    highlight={highlightedPoste === "prodStockee"}
                  />
                  <MetricRow
                    label="Revenus exceptionnels"
                    value={crTotals.produits.revExceptionnels}
                    highlight={highlightedPoste === "revExceptionnels"}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs font-medium text-slate-400">Total produits</span>
                  <span className="text-sm font-semibold text-emerald-300 tabular-nums">
                    {formatAmount(crTotals.totalProduits)}
                  </span>
                </div>
              </section>

              <section className="rounded-[24px] bg-white/[0.03] px-3 py-3">
                <SectionHeading
                  eyebrow="Charges"
                  title="Ce qui consomme ta marge"
                  description="Repère vite les postes qui grossissent d'un tour à l'autre."
                />
                <div className="space-y-2">
                  <MetricRow
                    label="Achats / CMV"
                    value={crTotals.charges.achatsCMV}
                    highlight={highlightedPoste === "achatsCMV"}
                  />
                  <MetricRow
                    label="Services extérieurs"
                    value={crTotals.charges.servicesExt}
                    highlight={highlightedPoste === "servicesExt"}
                  />
                  <MetricRow
                    label="Personnel"
                    value={crTotals.charges.personnel}
                    highlight={highlightedPoste === "personnel"}
                  />
                  <MetricRow
                    label="Amortissements"
                    value={crTotals.charges.amortissements}
                    highlight={highlightedPoste === "amortissements"}
                  />
                  <MetricRow
                    label="Intérêts d'emprunts"
                    value={crTotals.charges.interetsEmprunts}
                    highlight={highlightedPoste === "interetsEmprunts"}
                  />
                  <MetricRow
                    label="Charges exceptionnelles"
                    value={crTotals.charges.chargesExceptionnels}
                    highlight={highlightedPoste === "chargesExceptionnels"}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs font-medium text-slate-400">Total charges</span>
                  <span className="text-sm font-semibold text-rose-300 tabular-nums">
                    {formatAmount(crTotals.totalCharges)}
                  </span>
                </div>
              </section>

              <section className="rounded-[24px] border border-white/10 bg-white/[0.04] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Lecture finale
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-white">Résultat net</h3>
                  </div>
                  <motion.span
                    key={`resultat-net-${resultatNet}`}
                    className={`text-2xl font-semibold tabular-nums ${getValueToneClass(resultatNet)}`}
                    initial={{ opacity: 0.45, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {formatAmount(resultatNet)}
                  </motion.span>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RightPanel;
