"use client";
import { useState } from "react";
import { Joueur } from "@/lib/game-engine/types";
import { calculerIndicateurs } from "@/lib/game-engine/calculators";

interface Props { joueur: Joueur; }

interface IndicateurInfo {
  label: string;
  formule: string;
  definition: string;
  interpretation: string;
  objetif: string;
  couleurPositive: string;
  couleurNegative: string;
}

interface GaugeZone   { from: number; to: number; color: string; label: string; }
interface GaugeConfig { min: number; max: number; zones: GaugeZone[]; unit?: string; }

const INDICATEURS_INFO: Record<string, IndicateurInfo> = {
  resultatNet: {
    label: "Résultat net",
    formule: "Produits − Charges",
    definition: "Le résultat net mesure la richesse créée (ou détruite) par l'entreprise pendant le trimestre. C'est la différence entre tout ce qu'elle a gagné et tout ce qu'elle a dépensé.",
    interpretation: "Positif → bénéfice : l'entreprise crée de la valeur. Négatif → perte : elle consomme ses réserves.",
    objetif: "Viser un résultat positif. À la clôture, il s'ajoute aux capitaux propres.",
    couleurPositive: "#22c55e",
    couleurNegative: "#ef4444",
  },
  fondsDeRoulement: {
    label: "Fonds de Roulement (FR)",
    formule: "(Capitaux propres + Résultat + Emprunts) − Immobilisations",
    definition: "Le Fonds de Roulement représente l'excédent de ressources stables (long terme) par rapport aux emplois stables (immobilisations). C'est la 'réserve de sécurité' financière.",
    interpretation: "Positif → les ressources durables financent les actifs durables ET une partie du cycle d'exploitation. Négatif → attention : les immobilisations sont partiellement financées par des dettes courtes.",
    objetif: "FR ≥ 0 est sain. Plus le FR est élevé, plus l'entreprise est solide financièrement.",
    couleurPositive: "#6366f1",
    couleurNegative: "#f97316",
  },
  besoinFondsRoulement: {
    label: "Besoin en Fonds de Roulement (BFR)",
    formule: "Stocks + Créances clients − Dettes fournisseurs",
    definition: "Le BFR représente le besoin de financement lié au cycle d'exploitation : ce que tu dois financer entre le moment où tu paies tes fournisseurs et celui où tes clients te paient.",
    interpretation: "Positif → tu as besoin de trésorerie pour financer ton cycle. Négatif → tes fournisseurs te font crédit plus longtemps que tes clients : situation favorable !",
    objetif: "Minimiser le BFR en réduisant les stocks, en accélérant les paiements clients et en négociant des délais fournisseurs.",
    couleurPositive: "#8b5cf6",
    couleurNegative: "#f59e0b",
  },
  tresorerieNette: {
    label: "Trésorerie Nette",
    formule: "Fonds de Roulement − Besoin en Fonds de Roulement",
    definition: "La trésorerie nette est la conséquence directe de l'équilibre (ou du déséquilibre) entre le FR et le BFR. Elle mesure les liquidités réelles disponibles.",
    interpretation: "Positive → l'entreprise peut faire face à ses échéances. Négative → elle dépend de crédits bancaires (découvert) pour fonctionner.",
    objetif: "Trésorerie nette ≥ 0. En cas de découvert supérieur à 5 → faillite !",
    couleurPositive: "#059669",
    couleurNegative: "#dc2626",
  },
  capaciteAutofinancement: {
    label: "Capacité d'autofinancement (CAF)",
    formule: "Résultat net + Dotations aux amortissements",
    definition: "La CAF mesure la capacité de l'entreprise à générer des ressources financières par son propre activité, sans recours à l'extérieur. Les dotations sont réintégrées car ce sont des charges sans sortie de trésorerie.",
    interpretation: "Positive et élevée → l'entreprise peut financer ses investissements, rembourser ses dettes et distribuer des dividendes sans emprunter. Négative → elle ne peut pas s'autofinancer.",
    objetif: "CAF > 0, idéalement suffisamment élevée pour couvrir le remboursement des emprunts.",
    couleurPositive: "#0891b2",
    couleurNegative: "#9333ea",
  },
  ratioLiquidite: {
    label: "Ratio de liquidité",
    formule: "Actif circulant ÷ Dettes court terme",
    definition: "Ce ratio mesure la capacité de l'entreprise à rembourser ses dettes à court terme en utilisant ses actifs circulants (stocks + créances + trésorerie). Il évalue la solvabilité à court terme.",
    interpretation: "≥ 2 : très liquide. ≥ 1 : liquidité suffisante. < 1 : risque de ne pas pouvoir payer ses dettes courantes. < 0.5 : situation critique.",
    objetif: "Maintenir un ratio ≥ 1 pour garantir la solvabilité à court terme.",
    couleurPositive: "#0284c7",
    couleurNegative: "#b45309",
  },
  ratioSolvabilite: {
    label: "Ratio de solvabilité",
    formule: "(Capitaux propres + Résultat) ÷ Total Passif × 100",
    definition: "Ce ratio mesure la part du financement de l'entreprise couverte par ses fonds propres. Il évalue la solidité financière à long terme et la dépendance vis-à-vis des créanciers.",
    interpretation: "≥ 40% : très solide. ≥ 30% : sain. 20–30% : acceptable mais fragile. < 20% : trop endetté, risque de faillite.",
    objetif: "Solvabilité ≥ 30% est la norme en France. Maximise tes capitaux propres pour améliorer ce ratio.",
    couleurPositive: "#7c3aed",
    couleurNegative: "#be123c",
  },
};

// ─── CONFIGS JAUGES ─────────────────────────────────────────────────────────

const GAUGE_CONFIGS: Record<string, GaugeConfig> = {
  resultatNet: {
    min: -10, max: 20,
    zones: [
      { from: -10, to:  0, color: "#ef4444", label: "Perte" },
      { from:   0, to:  5, color: "#f59e0b", label: "Bénéfice faible" },
      { from:   5, to: 20, color: "#22c55e", label: "Bénéfice solide" },
    ],
  },
  fondsDeRoulement: {
    min: -10, max: 20,
    zones: [
      { from: -10, to:  0, color: "#ef4444", label: "Dangereux" },
      { from:   0, to:  5, color: "#f59e0b", label: "Acceptable" },
      { from:   5, to: 20, color: "#22c55e", label: "Confortable" },
    ],
  },
  besoinFondsRoulement: {
    min: -5, max: 15,
    zones: [
      { from:  -5, to:  0, color: "#22c55e", label: "Favorable" },
      { from:   0, to:  5, color: "#f59e0b", label: "Gérable" },
      { from:   5, to: 15, color: "#ef4444", label: "Besoin fort" },
    ],
  },
  tresorerieNette: {
    min: -8, max: 15,
    zones: [
      { from:  -8, to: -5, color: "#7f1d1d", label: "\u26a0\ufe0f Faillite" },
      { from:  -5, to:  0, color: "#ef4444", label: "Découvert" },
      { from:   0, to:  3, color: "#f59e0b", label: "Limite" },
      { from:   3, to: 15, color: "#22c55e", label: "Saine" },
    ],
  },
  capaciteAutofinancement: {
    min: -10, max: 20,
    zones: [
      { from: -10, to:  0, color: "#ef4444", label: "Négative" },
      { from:   0, to:  3, color: "#f59e0b", label: "Faible" },
      { from:   3, to: 20, color: "#22c55e", label: "Bonne" },
    ],
  },
  ratioLiquidite: {
    min: 0, max: 3,
    zones: [
      { from: 0,   to: 0.5, color: "#7f1d1d", label: "Critique" },
      { from: 0.5, to: 1,   color: "#ef4444", label: "Insuffisant" },
      { from: 1,   to: 1.5, color: "#f59e0b", label: "Correct" },
      { from: 1.5, to: 3,   color: "#22c55e", label: "Bon" },
    ],
  },
  ratioSolvabilite: {
    min: 0, max: 80, unit: "%",
    zones: [
      { from:  0, to: 20, color: "#ef4444", label: "Fragile" },
      { from: 20, to: 30, color: "#f59e0b", label: "Acceptable" },
      { from: 30, to: 80, color: "#22c55e", label: "Solide" },
    ],
  },
};

// ─── COMPOSANT JAUGE ─────────────────────────────────────────────────────────

function Gauge({ value, config }: { value: number; config: GaugeConfig }) {
  const { min, max, zones, unit = "" } = config;
  const clamped = Math.max(min, Math.min(max, value));
  const pct     = ((clamped - min) / (max - min)) * 100;
  const outOfRange = value < min || value > max;

  return (
    <div className="mt-2 select-none">
      {/* Barre + aiguille */}
      <div className="relative mb-3">
        {/* Zones colorées */}
        <div className="flex h-5 rounded-lg overflow-hidden border border-gray-200">
          {zones.map((z, i) => {
            const from = Math.max(z.from, min);
            const to   = Math.min(z.to,   max);
            const w    = ((to - from) / (max - min)) * 100;
            return <div key={i} style={{ width: `${w}%`, backgroundColor: z.color }} />;
          })}
        </div>
        {/* Aiguille verticale */}
        <div
          className="absolute top-0 h-5 w-0.5 bg-gray-900 rounded"
          style={{ left: `calc(${pct}% - 1px)` }}
        />
        {/* Triangle pointeur sous la barre */}
        <div
          className="absolute w-0 h-0"
          style={{
            left: `calc(${pct}% - 5px)`,
            bottom: "-7px",
            borderLeft:   "5px solid transparent",
            borderRight:  "5px solid transparent",
            borderTop:    "7px solid #111827",
          }}
        />
      </div>

      {/* Valeur actuelle centrée sous la barre */}
      <div className="text-center text-xs font-bold text-gray-800 mb-1">
        Valeur : 
        <span className="font-mono">
          {value > 0 && "+"}{value.toFixed(value % 1 === 0 ? 0 : 1)}{unit}
        </span>
        {outOfRange && <span className="text-gray-400 font-normal"> (hors échelle)</span>}
      </div>

      {/* Repaires min / max */}
      <div className="flex justify-between text-xs text-gray-400 px-0.5">
        <span>{min > 0 ? "+" : ""}{min}{unit}</span>
        <span>+{max}{unit}</span>
      </div>

      {/* Chips des zones */}
      <div className="flex gap-1 flex-wrap mt-1.5">
        {zones.map((z, i) => (
          <span
            key={i}
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: z.color + "22", color: z.color, border: `1px solid ${z.color}55` }}
          >
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── COMPOSANT INDICATEUR ────────────────────────────────────────────────────

function Indicateur({
  id, value, unit, positive,
}: {
  id: string;
  value: number;
  unit?: string;
  positive?: boolean;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const info = INDICATEURS_INFO[id];
  if (!info) return null;

  const bgPositive = positive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";

  return (
    <div className="relative">
      <div
        className={`bg-gray-50 rounded-xl p-3 border border-gray-100 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50 transition-all ${showDetail ? "ring-2 ring-indigo-300" : ""}`}
        onClick={() => setShowDetail(s => !s)}
        title="Cliquer pour l'explication détaillée"
      >
        <div className="flex items-start justify-between gap-1">
          <div className="text-xs text-gray-500 leading-tight flex-1">{info.label}</div>
          <span className="text-xs text-gray-300">ⓘ</span>
        </div>
        <div className={`text-lg font-bold tabular-nums mt-1 ${
          positive === undefined
            ? "text-gray-800"
            : positive
            ? "text-green-700"
            : "text-red-600"
        }`}>
          {value >= 0 ? "+" : ""}{value.toFixed(1)}{unit ?? ""}
        </div>
      </div>

      {showDetail && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 text-xs space-y-2"
          style={{ minWidth: "280px" }}>
          <div className="flex items-start justify-between gap-2">
            <div className="font-bold text-indigo-700 text-sm">{info.label}</div>
            <button onClick={e => { e.stopPropagation(); setShowDetail(false); }}
              className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
          </div>

          <div className="bg-indigo-50 rounded-lg p-2 font-mono text-indigo-800 text-xs">
            = {info.formule}
          </div>

          {/* Jauge de position */}
          {GAUGE_CONFIGS[id] && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">📍 Position actuelle</div>
              <Gauge value={value} config={GAUGE_CONFIGS[id]} />
            </div>
          )}

          <div>
            <div className="font-semibold text-gray-600 mb-0.5">📖 Définition</div>
            <p className="text-gray-600 leading-relaxed">{info.definition}</p>
          </div>

          <div>
            <div className="font-semibold text-gray-600 mb-0.5">🔍 Interprétation</div>
            <p className="text-gray-600 leading-relaxed">{info.interpretation}</p>
          </div>

          <div className={`rounded-lg p-2 border ${positive === undefined ? "bg-gray-50 border-gray-200" : bgPositive}`}>
            <div className="font-semibold mb-0.5">🎯 Objectif</div>
            <p className="leading-relaxed">{info.objetif}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IndicateursPanel({ joueur }: Props) {
  const ind = calculerIndicateurs(joueur);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-bold text-center text-gray-800 mb-1 tracking-wide">📊 INDICATEURS FINANCIERS</h3>
      <p className="text-center text-xs text-gray-400 mb-3">Clique sur un indicateur pour son explication détaillée ⓘ</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Indicateur id="resultatNet"           value={ind.resultatNet}           positive={ind.resultatNet >= 0} />
        <Indicateur id="fondsDeRoulement"       value={ind.fondsDeRoulement}       positive={ind.fondsDeRoulement >= 0} />
        <Indicateur id="besoinFondsRoulement"   value={ind.besoinFondsRoulement}   positive={ind.besoinFondsRoulement <= 0} />
        <Indicateur id="tresorerieNette"        value={ind.tresorerieNette}        positive={ind.tresorerieNette >= 0} />
        <Indicateur id="capaciteAutofinancement" value={ind.capaciteAutofinancement} positive={ind.capaciteAutofinancement >= 0} />
        <Indicateur id="ratioLiquidite"         value={ind.ratioLiquidite}         positive={ind.ratioLiquidite >= 1} />
        <Indicateur id="ratioSolvabilite"       value={ind.ratioSolvabilite}       unit="%" positive={ind.ratioSolvabilite >= 30} />
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Total Actif</div>
          <div className="text-lg font-bold text-gray-800">{ind.totalActif}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Total Passif</div>
          <div className="text-lg font-bold text-gray-800">{ind.totalPassif}</div>
        </div>
      </div>

      <div className={`mt-3 text-center text-xs font-bold py-1.5 rounded-lg ${
        ind.equilibre ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
      }`}>
        {ind.equilibre
          ? "✅ Bilan équilibré (Actif = Passif)"
          : "⚠️ Bilan déséquilibré — vérifiez vos écritures"}
      </div>
    </div>
  );
}
