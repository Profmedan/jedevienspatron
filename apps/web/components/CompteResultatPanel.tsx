"use client";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalCharges, getTotalProduits, getResultatNet } from "@/lib/game-engine/calculators";

type RecentMod = { poste: string; ancienneValeur: number; nouvelleValeur: number };

interface Props {
  joueur: Joueur;
  highlightedPoste?: string | null;
  /** Étape du tour (0=début, 1-7=en cours, 8=fin) */
  etapeTour?: number;
  /** Modifications récentes (avant/après) à afficher dans les lignes */
  recentModifications?: RecentMod[];
}

/** Badge avant → après affiché à la place de la valeur courante */
function BeforeAfterBadge({ mod }: { mod: RecentMod }) {
  const delta = mod.nouvelleValeur - mod.ancienneValeur;
  const up = delta > 0;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="line-through text-gray-400 text-xs tabular-nums">{mod.ancienneValeur}</span>
      <span className="text-gray-400 text-[10px]">→</span>
      <span className={`font-black text-sm tabular-nums ${up ? "text-emerald-600" : "text-red-600"}`}>
        {mod.nouvelleValeur}
      </span>
      <span
        className={`text-[10px] font-bold px-1 rounded-full ${
          up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        }`}
      >
        {up ? "+" : ""}
        {delta}
      </span>
    </span>
  );
}

function Row({
  label,
  value,
  color,
  highlighted,
  recentMod,
}: {
  label: string;
  value: number;
  color: string;
  highlighted?: boolean;
  recentMod?: RecentMod;
}) {
  if (value === 0 && !recentMod) return null;
  return (
    <div
      className={`flex justify-between items-center px-2.5 py-1.5 text-sm rounded-lg mb-1 transition-all duration-300 ${
        highlighted ? "ring-2 ring-amber-400 bg-amber-50 shadow-md scale-[1.02] -mx-0.5" : ""
      }`}
      style={{
        backgroundColor: highlighted ? undefined : `${color}18`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <span className="text-gray-600 text-xs">{label}</span>
      <div className="flex items-center">
        {recentMod ? (
          <BeforeAfterBadge mod={recentMod} />
        ) : (
          <span className="font-bold tabular-nums text-sm">{value}</span>
        )}
      </div>
    </div>
  );
}

function NoteEcritureEquilibre({ texte }: { texte: string }) {
  return (
    <div className="ml-1 mb-2 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 leading-snug">
      <span className="font-semibold">📚 Note pédagogique : </span>
      {texte}
    </div>
  );
}

function findMod(mods: RecentMod[] | undefined, poste: string): RecentMod | undefined {
  return mods?.find((m) => m.poste === poste);
}

export default function CompteResultatPanel({
  joueur,
  highlightedPoste,
  etapeTour,
  recentModifications,
}: Props) {
  const { charges, produits } = joueur.compteResultat;
  const totalCharges = getTotalCharges(charges);
  const totalProduits = getTotalProduits(produits);
  const resultat = getResultatNet(joueur);

  // Résultat provisoire si saisie en cours (étape 1 à 7)
  const isProvisoire =
    etapeTour !== undefined && etapeTour >= 1 && etapeTour <= 7;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* ── En-tête ── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
        <h3 className="font-black text-white text-base tracking-widest uppercase text-center">
          📈 Compte de Résultat
        </h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* ── CHARGES ── */}
          <div className="bg-red-50 rounded-xl p-3 border border-red-200">
            <div className="text-center text-xs font-black text-white mb-2.5 uppercase tracking-widest bg-red-600 rounded-lg py-1.5">
              − Charges
            </div>

            <Row
              label="Coût des marchandises vendues"
              value={charges.achats}
              color="#ef4444"
              highlighted={highlightedPoste === "achats"}
              recentMod={findMod(recentModifications, "achats")}
            />
            {charges.achats !== 0 && (
              <NoteEcritureEquilibre texte="Le CMV représente le coût réel des produits vendus ce trimestre. Il diminue les stocks et s'enregistre en charge." />
            )}

            <Row
              label="Services extérieurs"
              value={charges.servicesExterieurs}
              color="#ef4444"
              highlighted={highlightedPoste === "servicesExterieurs"}
              recentMod={findMod(recentModifications, "servicesExterieurs")}
            />
            <Row
              label="Impôts & taxes"
              value={charges.impotsTaxes}
              color="#ef4444"
              highlighted={highlightedPoste === "impotsTaxes"}
              recentMod={findMod(recentModifications, "impotsTaxes")}
            />
            <Row
              label="Charges d'intérêt"
              value={charges.chargesInteret}
              color="#ef4444"
              highlighted={highlightedPoste === "chargesInteret"}
              recentMod={findMod(recentModifications, "chargesInteret")}
            />
            <Row
              label="Charges de personnel"
              value={charges.chargesPersonnel}
              color="#ef4444"
              highlighted={highlightedPoste === "chargesPersonnel"}
              recentMod={findMod(recentModifications, "chargesPersonnel")}
            />
            <Row
              label="Charges exceptionnelles"
              value={charges.chargesExceptionnelles}
              color="#ef4444"
              highlighted={highlightedPoste === "chargesExceptionnelles"}
              recentMod={findMod(recentModifications, "chargesExceptionnelles")}
            />
            <Row
              label="Amortissements"
              value={charges.dotationsAmortissements}
              color="#ef4444"
              highlighted={highlightedPoste === "dotationsAmortissements"}
              recentMod={findMod(recentModifications, "dotationsAmortissements")}
            />
            {charges.dotationsAmortissements !== 0 && (
              <NoteEcritureEquilibre texte="L'amortissement constate l'usure de vos équipements. Aucun argent ne sort : la trésorerie n'est pas touchée." />
            )}

            <div className="flex justify-between px-2.5 py-2 border-t-2 border-red-300 mt-2 font-bold bg-red-100 rounded-lg">
              <span className="text-xs text-red-900 uppercase tracking-wide">Total charges</span>
              <span className="text-xl font-black text-red-700 tabular-nums">{totalCharges}</span>
            </div>
          </div>

          {/* ── PRODUITS ── */}
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
            <div className="text-center text-xs font-black text-white mb-2.5 uppercase tracking-widest bg-emerald-600 rounded-lg py-1.5">
              + Produits
            </div>

            <Row
              label="Ventes"
              value={produits.ventes}
              color="#22c55e"
              highlighted={highlightedPoste === "ventes"}
              recentMod={findMod(recentModifications, "ventes")}
            />
            <Row
              label="Production non encore vendue"
              value={produits.productionStockee}
              color="#22c55e"
              highlighted={highlightedPoste === "productionStockee"}
              recentMod={findMod(recentModifications, "productionStockee")}
            />
            <Row
              label="Produits financiers"
              value={produits.produitsFinanciers}
              color="#22c55e"
              highlighted={highlightedPoste === "produitsFinanciers"}
              recentMod={findMod(recentModifications, "produitsFinanciers")}
            />
            <Row
              label="Revenus exceptionnels"
              value={produits.revenusExceptionnels}
              color="#22c55e"
              highlighted={highlightedPoste === "revenusExceptionnels"}
              recentMod={findMod(recentModifications, "revenusExceptionnels")}
            />

            <div className="flex justify-between px-2.5 py-2 border-t-2 border-emerald-300 mt-2 font-bold bg-emerald-100 rounded-lg">
              <span className="text-xs text-emerald-900 uppercase tracking-wide">Total produits</span>
              <span className="text-xl font-black text-emerald-700 tabular-nums">{totalProduits}</span>
            </div>
          </div>
        </div>

        {/* ── Résultat net ── */}
        {isProvisoire ? (
          /* Résultat provisoire : saisie en cours, ne pas afficher PERTE de manière alarmante */
          <div className="mt-4 rounded-xl border-2 border-amber-400 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-500 text-white">
              <span className="text-2xl">⏳</span>
              <div className="flex-1">
                <div className="text-base font-black">Résultat provisoire</div>
                <div className="text-xs font-normal opacity-90 mt-0.5">
                  Saisie en cours — attendez la fin du tour pour le résultat définitif
                </div>
              </div>
              <span className="text-3xl font-black tabular-nums ml-4">
                {resultat >= 0 ? "+" : ""}
                {resultat}
              </span>
            </div>
            <div className="px-4 py-2 bg-amber-50 text-xs text-amber-800">
              💡 Les charges et produits sont enregistrés au fur et à mesure de la saisie.
              Le résultat final sera affiché une fois tous les postes saisis.
            </div>
          </div>
        ) : (
          /* Résultat définitif */
          <div
            className={`mt-4 rounded-xl border-2 overflow-hidden ${
              resultat >= 0 ? "border-emerald-400" : "border-red-400"
            }`}
          >
            <div
              className={`flex justify-between items-center px-4 py-3 ${
                resultat >= 0 ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              <div>
                <div className="text-base font-black">
                  {resultat >= 0 ? "✅ BÉNÉFICE" : "❌ PERTE"}
                </div>
                <div className="text-xs font-normal opacity-80 mt-0.5">
                  Produits − Charges = Résultat net
                </div>
              </div>
              <span className="text-3xl font-black tabular-nums ml-4">
                {resultat >= 0 ? "+" : ""}
                {resultat}
              </span>
            </div>
            <div
              className={`px-4 py-2 text-xs ${
                resultat >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              }`}
            >
              {resultat >= 0
                ? "Vos produits dépassent vos charges → les capitaux propres augmentent."
                : "Vos charges dépassent vos produits → les capitaux propres diminuent."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
