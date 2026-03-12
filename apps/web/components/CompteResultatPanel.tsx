"use client";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalCharges, getTotalProduits, getResultatNet } from "@/lib/game-engine/calculators";

interface Props {
  joueur: Joueur;
  highlightedPoste?: string | null;
}

function Row({ label, value, color, highlighted }: { label: string; value: number; color: string; highlighted?: boolean }) {
  if (value === 0) return null;
  return (
    <div className={`flex justify-between items-center px-2 py-0.5 text-sm rounded mb-0.5 transition-all duration-300 ${highlighted ? "ring-2 ring-yellow-400 bg-yellow-50 scale-[1.02]" : ""}`}
      style={{ backgroundColor: highlighted ? undefined : `${color}22`, borderLeft: `3px solid ${color}` }}>
      <span className="text-gray-600">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

function NoteEcritureEquilibre({ texte }: { texte: string }) {
  return (
    <div className="ml-1 mb-1.5 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 leading-snug">
      <span className="font-semibold">📚 Note pédagogique : </span>{texte}
    </div>
  );
}

export default function CompteResultatPanel({ joueur, highlightedPoste }: Props) {
  const { charges, produits } = joueur.compteResultat;
  const totalCharges = getTotalCharges(charges);
  const totalProduits = getTotalProduits(produits);
  const resultat = getResultatNet(joueur);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-bold text-center text-gray-800 mb-3 tracking-wide">📈 COMPTE DE RÉSULTAT</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* CHARGES */}
        <div className="bg-red-50 rounded-xl p-3 border-l-4 border-red-400">
          <div className="text-center text-sm font-black text-red-600 mb-2 uppercase tracking-widest">− Charges</div>
          <Row label="Coût des marchandises vendues" value={charges.achats} color="var(--color-charges)" highlighted={highlightedPoste === "achats"} />
          {charges.achats !== 0 && (
            <NoteEcritureEquilibre texte="Le Coût des Marchandises Vendues (CMV) représente le coût réel des produits que vous avez vendus ce trimestre. Il diminue vos stocks et s'enregistre en charge : chaque vente a un coût." />
          )}
          <Row label="Services extérieurs" value={charges.servicesExterieurs} color="var(--color-charges)" highlighted={highlightedPoste === "servicesExterieurs"} />
          <Row label="Impôts & taxes" value={charges.impotsTaxes} color="var(--color-charges)" highlighted={highlightedPoste === "impotsTaxes"} />
          <Row label="Charges d'intérêt" value={charges.chargesInteret} color="var(--color-charges)" highlighted={highlightedPoste === "chargesInteret"} />
          <Row label="Charges de personnel" value={charges.chargesPersonnel} color="var(--color-charges)" highlighted={highlightedPoste === "chargesPersonnel"} />
          <Row label="Charges exceptionnelles" value={charges.chargesExceptionnelles} color="var(--color-charges)" highlighted={highlightedPoste === "chargesExceptionnelles"} />
          <Row label="Amortissements des immobilisations" value={charges.dotationsAmortissements} color="var(--color-charges)" highlighted={highlightedPoste === "dotationsAmortissements"} />
          {charges.dotationsAmortissements !== 0 && (
            <NoteEcritureEquilibre texte="L'amortissement constate l'usure de vos équipements (machines, véhicules…). C'est une charge comptable, mais aucun argent ne sort de votre compte bancaire : la trésorerie n'est pas touchée." />
          )}
          <div className="flex justify-between px-2 py-2 border-t-2 border-red-300 mt-2 font-bold bg-red-100 rounded-lg">
            <span className="text-sm text-red-900">Total charges</span>
            <span className="text-lg font-black text-red-700 tabular-nums">{totalCharges}</span>
          </div>
        </div>

        {/* PRODUITS */}
        <div className="bg-green-50 rounded-xl p-3 border-l-4 border-green-400">
          <div className="text-center text-sm font-black text-green-600 mb-2 uppercase tracking-widest">+ Produits</div>
          <Row label="Ventes" value={produits.ventes} color="var(--color-produits)" highlighted={highlightedPoste === "ventes"} />
          <Row label="Production non encore vendue (stockée)" value={produits.productionStockee} color="var(--color-produits)" highlighted={highlightedPoste === "productionStockee"} />
          <Row label="Produits financiers" value={produits.produitsFinanciers} color="var(--color-produits)" highlighted={highlightedPoste === "produitsFinanciers"} />
          <Row label="Revenus exceptionnels" value={produits.revenusExceptionnels} color="var(--color-produits)" highlighted={highlightedPoste === "revenusExceptionnels"} />
          <div className="flex justify-between px-2 py-2 border-t-2 border-green-300 mt-2 font-bold bg-green-100 rounded-lg">
            <span className="text-sm text-green-900">Total produits</span>
            <span className="text-lg font-black text-green-700 tabular-nums">{totalProduits}</span>
          </div>
        </div>
      </div>

      {/* Résultat net */}
      <div className={`mt-4 rounded-xl font-bold border-2 overflow-hidden ${resultat >= 0 ? "border-green-400" : "border-red-400"}`}>
        <div className={`flex justify-between items-center px-4 py-3 ${resultat >= 0 ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          <div>
            <div className="text-base font-black">{resultat >= 0 ? "✅ BÉNÉFICE" : "❌ PERTE"}</div>
            <div className="text-xs font-normal opacity-80 mt-0.5">Produits − Charges = Résultat net</div>
          </div>
          <span className="text-3xl font-black tabular-nums ml-4">{resultat >= 0 ? "+" : ""}{resultat}</span>
        </div>
        <div className={`px-4 py-2 text-xs ${resultat >= 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {resultat >= 0
            ? "Vos produits dépassent vos charges → les capitaux propres augmentent."
            : "Vos charges dépassent vos produits → les capitaux propres diminuent."}
        </div>
      </div>
    </div>
  );
}
