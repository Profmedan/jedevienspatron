"use client";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalCharges, getTotalProduits, getResultatNet } from "@/lib/game-engine/calculators";

interface Props {
  joueur: Joueur;
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between items-center px-2 py-0.5 text-sm rounded mb-0.5"
      style={{ backgroundColor: `${color}22`, borderLeft: `3px solid ${color}` }}>
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

export default function CompteResultatPanel({ joueur }: Props) {
  const { charges, produits } = joueur.compteResultat;
  const totalCharges = getTotalCharges(charges);
  const totalProduits = getTotalProduits(produits);
  const resultat = getResultatNet(joueur);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-bold text-center text-gray-800 mb-3 tracking-wide">📈 COMPTE DE RÉSULTAT</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* CHARGES */}
        <div>
          <div className="text-center text-sm font-bold text-red-400 mb-2 uppercase tracking-widest">Charges</div>
          <Row label="Achats (CMV)" value={charges.achats} color="var(--color-charges)" />
          {charges.achats !== 0 && (
            <NoteEcritureEquilibre texte="Le CMV (Coût des Marchandises Vendues) est calculé à partir de vos achats et de la variation de stock. C'est une écriture de régularisation qui permet de n'imputer en charges que ce qui a réellement été vendu." />
          )}
          <Row label="Services extérieurs" value={charges.servicesExterieurs} color="var(--color-charges)" />
          <Row label="Impôts & taxes" value={charges.impotsTaxes} color="var(--color-charges)" />
          <Row label="Charges d'intérêt" value={charges.chargesInteret} color="var(--color-charges)" />
          <Row label="Charges de personnel" value={charges.chargesPersonnel} color="var(--color-charges)" />
          <Row label="Charges exceptionnelles" value={charges.chargesExceptionnelles} color="var(--color-charges)" />
          <Row label="Dotations amortissements" value={charges.dotationsAmortissements} color="var(--color-charges)" />
          {charges.dotationsAmortissements !== 0 && (
            <NoteEcritureEquilibre texte="Les dotations aux amortissements ne correspondent à aucun décaissement réel. Ce sont des charges calculées qui constatent la perte de valeur des immobilisations dans le temps. Elles réduisent le résultat sans affecter la trésorerie." />
          )}
          <div className="flex justify-between px-2 py-1.5 border-t border-gray-200 mt-2 font-bold">
            <span>Total charges</span>
            <span className="text-red-600">{totalCharges}</span>
          </div>
        </div>

        {/* PRODUITS */}
        <div>
          <div className="text-center text-sm font-bold text-green-500 mb-2 uppercase tracking-widest">Produits</div>
          <Row label="Ventes" value={produits.ventes} color="var(--color-produits)" />
          <Row label="Production stockée" value={produits.productionStockee} color="var(--color-produits)" />
          <Row label="Produits financiers" value={produits.produitsFinanciers} color="var(--color-produits)" />
          <Row label="Revenus exceptionnels" value={produits.revenusExceptionnels} color="var(--color-produits)" />
          <div className="flex justify-between px-2 py-1.5 border-t border-gray-200 mt-2 font-bold">
            <span>Total produits</span>
            <span className="text-green-600">{totalProduits}</span>
          </div>
        </div>
      </div>

      {/* Résultat net */}
      <div className={`mt-3 flex justify-between items-center px-4 py-2 rounded-xl font-bold text-base ${resultat >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
        <span>{resultat >= 0 ? "✅ Bénéfice" : "⚠️ Perte"}</span>
        <span className="text-lg">{resultat >= 0 ? "+" : ""}{resultat}</span>
      </div>
    </div>
  );
}
