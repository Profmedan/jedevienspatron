"use client";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalActif, getTotalPassif, getResultatNet } from "@/lib/game-engine/calculators";
import { useState } from "react";

interface Props { joueur: Joueur; highlightedPoste?: string | null; }

const TOOLTIPS: Record<string, { definition: string; exemple: string; couleur: string }> = {
  immobilisations: {
    definition: "Biens durables achetés par l'entreprise (machines, véhicules, brevets…). Ils se déprécient chaque trimestre = amortissements.",
    exemple: "Ex : Une usine à 3, une camionnette à 1 = 4 d'immobilisations.",
    couleur: "#dfa66a",
  },
  stocks: {
    definition: "Marchandises achetées mais pas encore vendues. Augmentent à l'achat, diminuent à la vente (CMV).",
    exemple: "Ex : Tu achètes 4 unités → Stocks = 4. Tu en vends 2 → Stocks = 2, CMV = 2.",
    couleur: "#d992b4",
  },
  tresorerie: {
    definition: "Argent disponible immédiatement (compte bancaire). Augmente aux encaissements, diminue aux décaissements. Ne peut pas être négatif (→ découvert).",
    exemple: "Ex : Trésorerie 8. Tu paies 2 de charges → Trésorerie 6.",
    couleur: "#6bc5a0",
  },
  creances: {
    definition: "Créances clients : ventes effectuées mais pas encore encaissées. C+1 sera payé au tour prochain, C+2 dans deux tours.",
    exemple: "Ex : Vente Grand Compte = +3 Ventes +3 Créances C+2 (payé dans 2 tours).",
    couleur: "#7ba7d4",
  },
  capitaux: {
    definition: "Capitaux propres : argent investi par les propriétaires + résultats accumulés. Augmentent avec les bénéfices, diminuent avec les pertes.",
    exemple: "Ex : Capital 12. Bénéfice de 2 → Capitaux 14 à la clôture.",
    couleur: "#a78bfa",
  },
  emprunts: {
    definition: "Dettes à long terme envers la banque. Remboursées progressivement (-1 par tour). Génèrent des charges d'intérêt.",
    exemple: "Ex : Emprunt 4, remboursement 1/tour → Tour 1: 3, Tour 2: 2…",
    couleur: "#f97316",
  },
  dettes: {
    definition: "Dettes à court terme : fournisseurs (achats à crédit, payables au tour suivant) ou fiscales (impôts à payer).",
    exemple: "Ex : Achat à crédit de 3 → Dettes fournisseurs +3 (payé au tour suivant).",
    couleur: "#fb7185",
  },
  decouvert: {
    definition: "⚠️ Découvert bancaire : trésorerie négative. Si le découvert dépasse 5, des pénalités s'appliquent. Au-delà, c'est la faillite.",
    exemple: "Ex : Tréso = 0, tu paies 3 → Tréso = 0, Découvert = 3 (dangereux !).",
    couleur: "#ef4444",
  },
};

function TooltipPoste({ label, value, color, categorie, sub, highlighted }: {
  label: string; value: number; color?: string; categorie?: string; sub?: boolean; highlighted?: boolean;
}) {
  const [show, setShow] = useState(false);
  const info = categorie ? TOOLTIPS[categorie] : null;

  return (
    <div className="relative">
      <div
        className={`flex justify-between items-center px-2 py-1 rounded mb-0.5 cursor-help transition-all duration-300 ${sub ? "text-sm" : "font-medium"} ${highlighted ? "ring-2 ring-yellow-400 bg-yellow-50 scale-[1.02]" : ""}`}
        style={{ backgroundColor: highlighted ? undefined : (color ? `${color}22` : undefined), borderLeft: color ? `3px solid ${color}` : undefined }}
        onMouseEnter={() => info && setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => info && setShow(s => !s)}
      >
        <span className="text-gray-700 flex items-center gap-1">
          {label}
          {info && <span className="text-xs text-gray-300 hover:text-gray-500">ⓘ</span>}
        </span>
        <span className={`font-bold tabular-nums ${value < 0 ? "text-red-600" : "text-gray-900"}`}>
          {value >= 0 ? value : `(${Math.abs(value)})`}
        </span>
      </div>
      {show && info && (
        <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-xs">
          <div className="font-bold text-gray-700 mb-1" style={{ color: info.couleur }}>{label}</div>
          <p className="text-gray-600 mb-2 leading-relaxed">{info.definition}</p>
          <p className="text-gray-400 italic border-t border-gray-100 pt-1">{info.exemple}</p>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-3 mb-1 px-1">{label}</div>;
}
function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center px-2 py-1.5 border-t border-gray-200 mt-2 font-bold text-base">
      <span>{label}</span>
      <span className={value < 0 ? "text-red-600" : "text-indigo-700"}>{value}</span>
    </div>
  );
}

export default function BilanPanel({ joueur, highlightedPoste }: Props) {
  const totalActif = getTotalActif(joueur);
  const resultat = getResultatNet(joueur);
  const totalPassif = getTotalPassif(joueur);
  const equilibre = Math.abs(totalActif - totalPassif) < 0.01;

  const immobilisations = joueur.bilan.actifs.filter(a => a.categorie === "immobilisations");
  const stocks = joueur.bilan.actifs.filter(a => a.categorie === "stocks");
  const tresorerie = joueur.bilan.actifs.find(a => a.categorie === "tresorerie");
  const capitaux = joueur.bilan.passifs.filter(p => p.categorie === "capitaux");
  const emprunts = joueur.bilan.passifs.filter(p => p.categorie === "emprunts");
  const dettes = joueur.bilan.passifs.filter(p => p.categorie === "dettes");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 tracking-wide">📋 BILAN</h3>
        <span className="text-xs text-gray-400 italic">Passez la souris sur un poste pour l'explication ⓘ</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* ACTIF */}
        <div>
          <div className="text-center text-xs font-bold text-blue-600 mb-2 uppercase tracking-widest border-b border-blue-100 pb-1">
            📤 ACTIF — Emplois
          </div>
          <SectionHeader label="Investissements durables" />
          {immobilisations.map(a => <TooltipPoste key={a.nom} label={a.nom} value={a.valeur} color={TOOLTIPS.immobilisations.couleur} categorie="immobilisations" sub highlighted={highlightedPoste === "immobilisations"} />)}
          <SectionHeader label="Stocks" />
          {stocks.map(a => <TooltipPoste key={a.nom} label={a.nom} value={a.valeur} color={TOOLTIPS.stocks.couleur} categorie="stocks" sub highlighted={highlightedPoste === "stocks"} />)}
          {(joueur.bilan.creancesPlus1 > 0 || joueur.bilan.creancesPlus2 > 0) && (
            <>
              <SectionHeader label="Créances clients" />
              {joueur.bilan.creancesPlus1 > 0 && <TooltipPoste label="Créances C+1" value={joueur.bilan.creancesPlus1} color={TOOLTIPS.creances.couleur} categorie="creances" sub highlighted={highlightedPoste === "creancesPlus1"} />}
              {joueur.bilan.creancesPlus2 > 0 && <TooltipPoste label="Créances C+2" value={joueur.bilan.creancesPlus2} color={TOOLTIPS.creances.couleur} categorie="creances" sub highlighted={highlightedPoste === "creancesPlus2"} />}
            </>
          )}
          <SectionHeader label="Trésorerie" />
          {tresorerie && <TooltipPoste label="Trésorerie" value={tresorerie.valeur} color={TOOLTIPS.tresorerie.couleur} categorie="tresorerie" sub highlighted={highlightedPoste === "tresorerie"} />}
          <Total label="Total Actif" value={totalActif} />
        </div>

        {/* PASSIF */}
        <div>
          <div className="text-center text-xs font-bold text-orange-600 mb-2 uppercase tracking-widest border-b border-orange-100 pb-1">
            📥 PASSIF — Ressources
          </div>
          <SectionHeader label="Capitaux propres" />
          {capitaux.map(p => <TooltipPoste key={p.nom} label={p.nom} value={p.valeur} color={TOOLTIPS.capitaux.couleur} categorie="capitaux" sub highlighted={highlightedPoste === "capitaux"} />)}
          {resultat !== 0 && (
            <TooltipPoste label="Résultat net" value={resultat}
              color={resultat >= 0 ? "#22c55e" : "#ef4444"} sub />
          )}
          <SectionHeader label="Emprunts" />
          {emprunts.map(p => <TooltipPoste key={p.nom} label={p.nom} value={p.valeur} color={TOOLTIPS.emprunts.couleur} categorie="emprunts" sub highlighted={highlightedPoste === "emprunts"} />)}
          {(dettes.length > 0 || joueur.bilan.dettes > 0 || joueur.bilan.dettesFiscales > 0) && (
            <>
              <SectionHeader label="Dettes (court terme)" />
              {dettes.map(p => <TooltipPoste key={p.nom} label={p.nom} value={p.valeur} color={TOOLTIPS.dettes.couleur} categorie="dettes" sub highlighted={highlightedPoste === "dettes"} />)}
              {joueur.bilan.dettes > 0 && <TooltipPoste label="Dettes fournisseurs" value={joueur.bilan.dettes} color={TOOLTIPS.dettes.couleur} categorie="dettes" sub highlighted={highlightedPoste === "dettes"} />}
              {joueur.bilan.dettesFiscales > 0 && <TooltipPoste label="Dettes fiscales" value={joueur.bilan.dettesFiscales} color={TOOLTIPS.dettes.couleur} categorie="dettes" sub highlighted={highlightedPoste === "dettesFiscales"} />}
            </>
          )}
          {joueur.bilan.decouvert > 0 && (
            <>
              <SectionHeader label="⚠️ Découvert bancaire" />
              <TooltipPoste label="Découvert bancaire" value={joueur.bilan.decouvert} color={TOOLTIPS.decouvert.couleur} categorie="decouvert" sub highlighted={highlightedPoste === "decouvert"} />
            </>
          )}
          <Total label="Total Passif" value={totalPassif} />
        </div>
      </div>

      {/* Equation */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-blue-50 rounded-lg py-2">
          <div className="font-bold text-blue-700 text-base">{totalActif}</div>
          <div className="text-blue-400">ACTIF</div>
        </div>
        <div className="flex items-center justify-center font-bold text-gray-400 text-lg">=</div>
        <div className="bg-orange-50 rounded-lg py-2">
          <div className="font-bold text-orange-700 text-base">{totalPassif}</div>
          <div className="text-orange-400">PASSIF</div>
        </div>
      </div>
      <div className={`mt-2 text-center text-xs font-bold py-1 rounded-lg ${equilibre ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
        {equilibre ? "✅ Bilan équilibré (Actif = Passif)" : `⚠️ Déséquilibre : écart ${(totalActif - totalPassif).toFixed(1)}`}
      </div>
    </div>
  );
}
