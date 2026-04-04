"use client";

import { TrendingUp, RefreshCw, Scale, Activity, BarChart3, Wallet } from "lucide-react";
import type { ReactNode } from "react";

type Level = "fondamental" | "important" | "avancé";

interface Indicator {
  id: string;
  name: string;
  formula: string;
  interpretation: string;
  level: Level;
  icon: ReactNode;
}

const levelConfig: Record<Level, { bar: string; badge: string; border: string }> = {
  fondamental: {
    bar:    "bg-emerald-500",
    badge:  "bg-emerald-950/70 text-emerald-300 border border-emerald-700/60",
    border: "border-emerald-700/40 hover:border-emerald-600/60",
  },
  important: {
    bar:    "bg-blue-500",
    badge:  "bg-blue-950/70 text-blue-300 border border-blue-700/60",
    border: "border-blue-700/40 hover:border-blue-600/60",
  },
  avancé: {
    bar:    "bg-violet-500",
    badge:  "bg-violet-950/70 text-violet-300 border border-violet-700/60",
    border: "border-violet-700/40 hover:border-violet-600/60",
  },
};

const INDICATORS: Indicator[] = [
  {
    id: "resultat-net",
    name: "Résultat Net",
    formula: "Total Produits − Total Charges",
    interpretation:
      "C’est le bénéfice ou la perte final de votre entreprise. Positif = vous gagnez de l’argent ; négatif = vous en perdez.",
    level: "fondamental",
    icon: <TrendingUp size={22} />,
  },
  {
    id: "tresorerie-nette",
    name: "Trésorerie Nette",
    formula: "Fonds de Roulement − Besoin en Fonds de Roulement",
    interpretation:
      "L’argent réellement disponible en caisse. Même avec un bon résultat, une mauvaise trésorerie peut étrangler une entreprise.",
    level: "fondamental",
    icon: <Wallet size={22} />,
  },
  {
    id: "fonds-roulement",
    name: "Fonds de Roulement",
    formula: "Capitaux permanents − Immobilisations",
    interpretation:
      "Votre coussin financier pour financer l’exploitation quotidienne. Positif = vous avez des ressources stables au-delà de vos investissements.",
    level: "important",
    icon: <RefreshCw size={22} />,
  },
  {
    id: "ratio-liquidite",
    name: "Ratio de Liquidité",
    formula: "Actif circulant / Dettes à court terme",
    interpretation:
      "Pouvez-vous payer vos dettes à court terme ? Supérieur à 1 = bon signe. En dessous, vous risquez des difficultés de paiement.",
    level: "important",
    icon: <Activity size={22} />,
  },
  {
    id: "ratio-solvabilite",
    name: "Ratio de Solvabilité",
    formula: "(Capitaux propres + Résultat) / Total Passif × 100",
    interpretation:
      "Votre capacité à rembourser sur le long terme. Supérieur à 50 % indique une entreprise saine. La banque surveille cet indicateur avant d’accorder un prêt.",
    level: "important",
    icon: <Scale size={22} />,
  },
  {
    id: "caf",
    name: "Capacité d’Autofinancement",
    formula: "Résultat Net + Dotations aux amortissements",
    interpretation:
      "Les liquidités générées par l’activité avant tout remboursement. C’est la mesure de votre autonomie financière réelle.",
    level: "avancé",
    icon: <BarChart3 size={22} />,
  },
];

export function KeyIndicatorsSection() {
  return (
    <section className="relative w-full px-6 py-16 md:py-20 bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">

        {/* Titre */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-5 bg-blue-950/40 border border-blue-700/50 px-4 py-2 rounded-full">
            <BarChart3 size={15} className="text-blue-400" />
            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Analyse financière</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Les indicateurs clés{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              du jeu
            </span>
          </h2>
          <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            6 ratios financiers calculés en temps réel dans le jeu. Vous les verrez évoluer à chaque décision
            et les retrouverez dans les QCM pédagogiques.
          </p>
        </div>

        {/* Légende niveaux */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {(["fondamental", "important", "avancé"] as Level[]).map((level) => (
            <div key={level} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${levelConfig[level].badge}`}>
              <span className={`w-2 h-2 rounded-full ${levelConfig[level].bar}`} />
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </div>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {INDICATORS.map((ind) => {
            const cfg = levelConfig[ind.level];
            return (
              <div
                key={ind.id}
                className={`group relative rounded-2xl border ${cfg.border} bg-gray-800/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg`}
              >
                {/* Barre colorée en haut */}
                <div className={`h-1 w-full ${cfg.bar}`} />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-700/50 text-gray-300 group-hover:text-white transition-colors">
                      {ind.icon}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                      {ind.level}
                    </span>
                  </div>

                  {/* Nom */}
                  <h3 className="text-base font-black text-white mb-3">{ind.name}</h3>

                  {/* Formule */}
                  <div className="bg-gray-950/70 border border-gray-700/30 rounded-lg px-3 py-2 mb-4">
                    <code className="text-xs text-gray-400 font-mono leading-relaxed">{ind.formula}</code>
                  </div>

                  {/* Interprétation */}
                  <p className="text-sm text-gray-400 leading-relaxed">{ind.interpretation}</p>
                </div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/[0.02] to-transparent transition-opacity duration-300 pointer-events-none" />
              </div>
            );
          })}
        </div>

        <p className="text-center mt-10 text-gray-600 text-xs">
          Ces 6 indicateurs apparaissent dans le tableau de bord du formateur et dans les QCM de fin de trimestre.
        </p>

      </div>
    </section>
  );
}
