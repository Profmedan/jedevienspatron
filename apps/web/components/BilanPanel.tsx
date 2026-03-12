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
    definition: "Marchandises achetées mais pas encore vendues. Augmentent à l'achat, diminuent à la vente (le coût des marchandises vendues est comptabilisé en charge).",
    exemple: "Ex : Tu achètes 4 unités → Stocks = 4. Tu en vends 2 → Stocks = 2, coût des ventes = 2.",
    couleur: "#d992b4",
  },
  tresorerie: {
    definition: "Argent disponible immédiatement (compte bancaire). Augmente aux encaissements, diminue aux décaissements. Ne peut pas être négatif (→ découvert).",
    exemple: "Ex : Trésorerie 8. Tu paies 2 de charges → Trésorerie 6.",
    couleur: "#6bc5a0",
  },
  creances: {
    definition: "Argent que vos clients vous doivent mais n'ont pas encore payé. 'Dans 1 trimestre' sera encaissé au tour suivant, 'dans 2 trimestres' dans deux tours.",
    exemple: "Ex : Vente Grand Compte = +3 Ventes +3 Créances (encaissé dans 2 trimestres).",
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
function Total({ label, value, isActif }: { label: string; value: number; isActif?: boolean }) {
  return (
    <div className={`flex justify-between items-center px-3 py-2 rounded-lg mt-3 font-bold text-base border-t-2 ${
      isActif
        ? "bg-blue-50 border-blue-300 text-blue-900"
        : "bg-orange-50 border-orange-300 text-orange-900"
    }`}>
      <span className="text-sm">{label}</span>
      <span className={`text-xl font-black tabular-nums ${value < 0 ? "text-red-600" : ""}`}>{value}</span>
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
        <span className="text-xs text-gray-400 italic">Passez la souris sur un poste ⓘ</span>
      </div>

      {/* ── Équation du bilan en haut — règle d'or ── */}
      <div className={`mb-4 rounded-2xl p-3 border-2 ${equilibre ? "border-indigo-200 bg-gradient-to-r from-blue-50 via-white to-orange-50" : "border-red-300 bg-red-50"}`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-100 rounded-xl py-2">
            <div className="font-black text-2xl text-blue-700 tabular-nums">{totalActif}</div>
            <div className="text-xs text-blue-500 font-bold uppercase tracking-wider mt-0.5">ACTIF</div>
          </div>
          <div className="flex items-center justify-center">
            <span className="font-black text-2xl text-indigo-400">=</span>
          </div>
          <div className="bg-orange-100 rounded-xl py-2">
            <div className="font-black text-2xl text-orange-700 tabular-nums">{totalPassif}</div>
            <div className="text-xs text-orange-500 font-bold uppercase tracking-wider mt-0.5">PASSIF</div>
          </div>
        </div>
        <div className={`mt-2 text-center text-xs font-bold py-1 rounded-lg ${equilibre ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
          {equilibre ? "✅ Bilan équilibré — règle d'or de la comptabilité" : `⚠️ Déséquilibre : écart ${(totalActif - totalPassif).toFixed(1)}`}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* ACTIF */}
        <div>
          <div className="text-center text-xs font-bold text-blue-600 mb-2 uppercase tracking-widest border-b border-blue-100 pb-1">
            ACTIF · Ce que vous possédez
          </div>
          <SectionHeader label="Investissements durables" />
          {immobilisations.map(a => <TooltipPoste key={a.nom} label={a.nom} value={a.valeur} color={TOOLTIPS.immobilisations.couleur} categorie="immobilisations" sub highlighted={highlightedPoste === "immobilisations"} />)}
          <SectionHeader label="Stocks" />
          {stocks.map(a => <TooltipPoste key={a.nom} label={a.nom} value={a.valeur} color={TOOLTIPS.stocks.couleur} categorie="stocks" sub highlighted={highlightedPoste === "stocks"} />)}
          {(joueur.bilan.creancesPlus1 > 0 || joueur.bilan.creancesPlus2 > 0) && (
            <>
              <SectionHeader label="Créances clients" />
              {joueur.bilan.creancesPlus1 > 0 && <TooltipPoste label="Argent à recevoir (dans 1 trim.)" value={joueur.bilan.creancesPlus1} color={TOOLTIPS.creances.couleur} categorie="creances" sub highlighted={highlightedPoste === "creancesPlus1"} />}
              {joueur.bilan.creancesPlus2 > 0 && <TooltipPoste label="Argent à recevoir (dans 2 trim.)" value={joueur.bilan.creancesPlus2} color={TOOLTIPS.creances.couleur} categorie="creances" sub highlighted={highlightedPoste === "creancesPlus2"} />}
            </>
          )}
          <SectionHeader label="Trésorerie" />
          {tresorerie && <TooltipPoste label="Trésorerie" value={tresorerie.valeur} color={TOOLTIPS.tresorerie.couleur} categorie="tresorerie" sub highlighted={highlightedPoste === "tresorerie"} />}
          <Total label="Total Actif" value={totalActif} isActif />
        </div>

        {/* PASSIF */}
        <div>
          <div className="text-center text-xs font-bold text-orange-600 mb-2 uppercase tracking-widest border-b border-orange-100 pb-1">
            PASSIF · D&apos;où vient le financement
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
              <SectionHeader label={joueur.bilan.decouvert > 5 ? "🔴 DÉCOUVERT BANCAIRE — FAILLITE !" : "⚠️ Découvert bancaire"} />
              <div className={`px-3 py-2 rounded-lg border-2 mb-1 ${
                joueur.bilan.decouvert > 5
                  ? "bg-red-100 border-red-600 animate-pulse"
                  : "bg-orange-50 border-orange-400"
              }`}>
                <TooltipPoste label="Découvert bancaire" value={joueur.bilan.decouvert} color={TOOLTIPS.decouvert.couleur} categorie="decouvert" sub highlighted={highlightedPoste === "decouvert"} />
                <div className={`text-xs mt-1 font-semibold ${joueur.bilan.decouvert > 5 ? "text-red-700" : "text-orange-700"}`}>
                  {joueur.bilan.decouvert > 5
                    ? "🚨 Découvert > 5 : faillite si non régularisé !"
                    : "Remboursez ce découvert au tour suivant."}
                </div>
              </div>
            </>
          )}
          <Total label="Total Passif" value={totalPassif} isActif={false} />
        </div>
      </div>

      {/* Équation déplacée en haut du panneau — cf. bloc au-dessus du grid */}
    </div>
  );
}
