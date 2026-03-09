"use client";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalCharges, getTotalProduits, getResultatNet } from "@/lib/game-engine/calculators";

interface Props { joueur: Joueur; }

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between items-center px-2 py-1 text-sm rounded mb-0.5"
      style={{ backgroundColor: `${color}22`, borderLeft: `3px solid ${color}` }}>
      <span className="text-gray-600">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

function SectionTitle({ label, side }: { label: string; side: "charges" | "produits" }) {
  const colors = side === "charges"
    ? "bg-red-50 text-red-600 border-red-200"
    : "bg-green-50 text-green-600 border-green-200";
  return (
    <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg border mb-1 mt-2 ${colors}`}>
      {label}
    </div>
  );
}

function Subtotal({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className={`flex justify-between items-center px-2 py-1 rounded-lg text-xs font-bold mt-1 mb-2 ${
      positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
    }`}>
      <span>{label}</span>
      <span>{value >= 0 ? "+" : ""}{value}</span>
    </div>
  );
}

const COLOR_CHARGES = "#ef4444";
const COLOR_PRODUITS = "#22c55e";

export default function CompteResultatPanel({ joueur }: Props) {
  const { charges, produits } = joueur.compteResultat;
  const totalCharges  = getTotalCharges(charges);
  const totalProduits = getTotalProduits(produits);
  const resultat      = getResultatNet(joueur);

  // Sous-totaux par nature
  const chargesExploit  = charges.achats + charges.servicesExterieurs + charges.impotsTaxes + charges.chargesPersonnel + charges.dotationsAmortissements;
  const prodExploit     = produits.ventes + produits.productionStockee;
  const resultatExploit = prodExploit - chargesExploit;

  const chargesFin  = charges.chargesInteret;
  const prodFin     = produits.produitsFinanciers;
  const resultatFin = prodFin - chargesFin;

  const chargesExc  = charges.chargesExceptionnelles;
  const prodExc     = produits.revenusExceptionnels;
  const resultatExc = prodExc - chargesExc;

  const hasFinancier    = chargesFin > 0 || prodFin > 0;
  const hasExceptionnel = chargesExc > 0 || prodExc > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-bold text-center text-gray-800 mb-1 tracking-wide">📈 COMPTE DE RÉSULTAT</h3>
      <p className="text-center text-xs text-gray-400 mb-3">Résultat Net = Produits − Charges</p>

      <div className="grid grid-cols-2 gap-4">

        {/* ─── CHARGES ─── */}
        <div>
          <div className="text-center text-sm font-bold text-red-500 mb-2 uppercase tracking-widest border-b border-red-100 pb-1">
            Charges
          </div>

          <SectionTitle label="Exploitation" side="charges" />
          <Row label="Achats / CMV"          value={charges.achats}                   color={COLOR_CHARGES} />
          <Row label="Services extérieurs"   value={charges.servicesExterieurs}       color={COLOR_CHARGES} />
          <Row label="Impôts & taxes"         value={charges.impotsTaxes}              color={COLOR_CHARGES} />
          <Row label="Charges de personnel"  value={charges.chargesPersonnel}         color={COLOR_CHARGES} />
          <Row label="Dotations amort."      value={charges.dotationsAmortissements}  color={COLOR_CHARGES} />
          {chargesExploit === 0 && <div className="text-xs text-gray-300 italic px-2">—</div>}

          {hasFinancier && (
            <>
              <SectionTitle label="Financier" side="charges" />
              <Row label="Charges d'intérêt" value={charges.chargesInteret} color={COLOR_CHARGES} />
            </>
          )}

          {hasExceptionnel && (
            <>
              <SectionTitle label="Exceptionnel" side="charges" />
              <Row label="Charges except." value={charges.chargesExceptionnelles} color={COLOR_CHARGES} />
            </>
          )}

          <div className="flex justify-between px-2 py-1.5 border-t border-gray-200 mt-2 font-bold text-sm">
            <span>Total charges</span>
            <span className="text-red-600">{totalCharges}</span>
          </div>
        </div>

        {/* ─── PRODUITS ─── */}
        <div>
          <div className="text-center text-sm font-bold text-green-500 mb-2 uppercase tracking-widest border-b border-green-100 pb-1">
            Produits
          </div>

          <SectionTitle label="Exploitation" side="produits" />
          <Row label="Ventes"              value={produits.ventes}             color={COLOR_PRODUITS} />
          <Row label="Production stockée"  value={produits.productionStockee}  color={COLOR_PRODUITS} />
          {prodExploit === 0 && <div className="text-xs text-gray-300 italic px-2">—</div>}

          {hasFinancier && (
            <>
              <SectionTitle label="Financier" side="produits" />
              <Row label="Produits financiers" value={produits.produitsFinanciers} color={COLOR_PRODUITS} />
            </>
          )}

          {hasExceptionnel && (
            <>
              <SectionTitle label="Exceptionnel" side="produits" />
              <Row label="Revenus except."  value={produits.revenusExceptionnels} color={COLOR_PRODUITS} />
            </>
          )}

          <div className="flex justify-between px-2 py-1.5 border-t border-gray-200 mt-2 font-bold text-sm">
            <span>Total produits</span>
            <span className="text-green-600">{totalProduits}</span>
          </div>
        </div>
      </div>

      {/* ─── SOUS-TOTAUX PAR NATURE ─── */}
      {(hasFinancier || hasExceptionnel) && (
        <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Décomposition du résultat</div>
          <Subtotal label="Résultat d'exploitation" value={resultatExploit} />
          {hasFinancier    && <Subtotal label="Résultat financier"    value={resultatFin} />}
          {hasExceptionnel && <Subtotal label="Résultat exceptionnel" value={resultatExc} />}
        </div>
      )}

      {/* ─── RÉSULTAT NET ─── */}
      <div className={`mt-3 flex justify-between items-center px-4 py-3 rounded-xl font-bold text-base ${
        resultat >= 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
      }`}>
        <div>
          <div>{resultat >= 0 ? "✅ Bénéfice net" : "⚠️ Perte nette"}</div>
          <div className="text-xs font-normal opacity-70">Intégré aux Capitaux propres à la clôture</div>
        </div>
        <span className="text-xl">{resultat >= 0 ? "+" : ""}{resultat}</span>
      </div>

      {/* Équation fondamentale */}
      <div className="mt-2 text-center text-xs text-gray-300 italic">
        ACTIF + CHARGES = PASSIF + PRODUITS
      </div>
    </div>
  );
}
