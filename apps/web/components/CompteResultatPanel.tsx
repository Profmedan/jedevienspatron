"use client";
import { useState } from "react";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalCharges, getTotalProduits, getResultatNet } from "@/lib/game-engine/calculators";
import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";

type RecentMod = { poste: string; ancienneValeur: number; nouvelleValeur: number };

interface Props {
  joueur: Joueur;
  highlightedPoste?: string | null;
  /** Étape du tour (0=début, 1-7=en cours, 8=fin) */
  etapeTour?: number;
  /** Vrai si une étape de saisie est en cours (activeStep !== null) */
  hasActiveStep?: boolean;
  /** Modifications récentes (avant/après) à afficher dans les lignes */
  recentModifications?: RecentMod[];
}

/** Badge avant → après affiché à la place de la valeur courante.
 *  Couleur basée sur l'impact financier réel (PCG français) :
 *  - charges en hausse → rouge (appauvrissement)
 *  - produits en hausse → vert (enrichissement)
 */
function BeforeAfterBadge({ mod }: { mod: RecentMod }) {
  const delta = mod.nouvelleValeur - mod.ancienneValeur;
  const bon = isBonPourEntreprise(mod.poste, delta);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="line-through text-gray-500 text-xs tabular-nums">{mod.ancienneValeur}</span>
      <span className="text-gray-500 text-[10px]">→</span>
      <span className={`font-black text-sm tabular-nums ${bon ? "text-emerald-400" : "text-red-400"}`}>
        {mod.nouvelleValeur}
      </span>
      <span
        className={`text-[10px] font-bold px-1 rounded-full ${
          bon ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"
        }`}
      >
        {delta > 0 ? "+" : ""}
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
        highlighted ? "ring-2 ring-amber-400 bg-amber-500/20 shadow-md shadow-amber-400/20 scale-[1.02] -mx-0.5" : ""
      }`}
      style={{
        backgroundColor: highlighted ? undefined : `${color}28`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <span className="text-gray-300 text-xs">{label}</span>
      <div className="flex items-center">
        {recentMod ? (
          <BeforeAfterBadge mod={recentMod} />
        ) : (
          <span className="font-bold tabular-nums text-sm text-gray-100">{value}</span>
        )}
      </div>
    </div>
  );
}

function NoteEcritureEquilibre({ texte }: { texte: string }) {
  return (
    <div className="ml-1 mb-2 px-2.5 py-1.5 bg-blue-950/40 border border-blue-900/50 rounded-lg text-xs text-blue-300 leading-snug">
      <span className="font-semibold">📚 Note pédagogique : </span>
      {texte}
    </div>
  );
}

function findMod(mods: RecentMod[] | undefined, poste: string): RecentMod | undefined {
  return mods?.find((m) => m.poste === poste);
}

function CRAnalyse({ joueur }: { joueur: Joueur }) {
  const [open, setOpen] = useState(false);
  const cr = joueur.compteResultat;
  const ca = cr.produits?.ventes ?? 0;
  const charges = (cr.charges?.achats ?? 0) + (cr.charges?.servicesExterieurs ?? 0) + (cr.charges?.chargesPersonnel ?? 0) + (cr.charges?.dotationsAmortissements ?? 0);
  const resultat = getResultatNet(joueur);

  const points: Array<{ niveau: "rouge" | "jaune" | "vert"; texte: string }> = [];

  if (ca === 0) {
    points.push({ niveau: "rouge", texte: "Aucune vente enregistrée ce trimestre. Recrutez un commercial dès l'étape 6 pour générer du chiffre d'affaires." });
  } else {
    const tauxMarge = Math.round((resultat / ca) * 100);
    if (tauxMarge < -20) points.push({ niveau: "rouge", texte: `Taux de marge nette très négatif (${tauxMarge}%). Vos charges sont disproportionnées par rapport à votre CA (${ca}). Priorité : augmenter les ventes.` });
    else if (tauxMarge < 0) points.push({ niveau: "jaune", texte: `Légère perte (marge ${tauxMarge}%). Quelques clients supplémentaires suffiraient à équilibrer. Recrutez un Junior.` });
    else if (tauxMarge < 15) points.push({ niveau: "jaune", texte: `Marge positive mais faible (${tauxMarge}%). Consolidez avant d'investir davantage.` });
    else points.push({ niveau: "vert", texte: `Bonne marge nette (${tauxMarge}%). Vous pouvez investir dans un actif ou recruter un profil plus senior.` });
  }

  if ((cr.charges?.dotationsAmortissements ?? 0) > ca * 0.3 && ca > 0) {
    points.push({ niveau: "jaune", texte: `Amortissements élevés (${cr.charges?.dotationsAmortissements}) — ils pèsent plus de 30% de votre CA. Ils diminuent le bénéfice mais pas la trésorerie.` });
  }

  if ((cr.charges?.chargesPersonnel ?? 0) > ca * 0.5 && ca > 0) {
    points.push({ niveau: "rouge", texte: `Masse salariale (${cr.charges?.chargesPersonnel}) > 50% du CA. Vos commerciaux coûtent plus qu'ils ne rapportent ce trimestre. Attendez la montée en puissance.` });
  }

  const colors = {
    rouge: "text-red-600 bg-red-50 border-red-200",
    jaune: "text-amber-700 bg-amber-50 border-amber-200",
    vert: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-3 mx-4 pb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-xs font-bold text-indigo-700 uppercase tracking-wider py-1 hover:text-indigo-900 transition-colors"
      >
        <span>🔍 Analyse & Conseils</span>
        <span className="text-gray-400 font-normal normal-case">{open ? "▲ Masquer" : "▼ Afficher"}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {points.map((p, i) => (
            <div key={i} className={`border rounded-lg px-2.5 py-1.5 text-xs leading-snug ${colors[p.niveau]}`}>
              {p.texte}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CompteResultatPanel({
  joueur,
  highlightedPoste,
  etapeTour,
  hasActiveStep,
  recentModifications,
}: Props) {
  const { charges, produits } = joueur.compteResultat;
  const totalCharges = getTotalCharges(charges);
  const totalProduits = getTotalProduits(produits);
  const resultat = getResultatNet(joueur);

  // Résultat provisoire si saisie en cours (activeStep !== null dans le parent)
  // NB: etapeTour=0 correspond aux charges fixes (step 0), donc on ne peut pas se fier
  // uniquement à etapeTour >= 1. On utilise hasActiveStep comme signal principal.
  const isProvisoire =
    hasActiveStep === true ||
    (etapeTour !== undefined && etapeTour >= 1 && etapeTour <= 7);

  return (
    <div className="bg-gray-900 rounded-2xl shadow-md border border-gray-700 overflow-hidden">
      {/* ── En-tête ── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
        <h3 className="font-black text-white text-base tracking-widest uppercase text-center">
          📈 Compte de Résultat
        </h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* ── CHARGES ── */}
          <div className="bg-red-950/20 rounded-xl p-3 border border-red-900/50">
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
              label="Dotation aux amortissements"
              value={charges.dotationsAmortissements}
              color="#ef4444"
              highlighted={highlightedPoste === "dotationsAmortissements"}
              recentMod={findMod(recentModifications, "dotationsAmortissements")}
            />
            {charges.dotationsAmortissements !== 0 && (
              <NoteEcritureEquilibre texte="L'amortissement réduit ton bénéfice ici (compte de résultat), mais aucun euro ne quitte ta banque — c'est une charge comptable, pas un paiement. Ta trésorerie, elle, est enregistrée dans les comptes de bilan." />
            )}

            <div className="flex justify-between px-2.5 py-2 border-t-2 border-red-800 mt-2 font-bold bg-red-900/40 rounded-lg">
              <span className="text-xs text-red-200 uppercase tracking-wide">Total charges</span>
              <span className="text-xl font-black text-red-400 tabular-nums">{totalCharges}</span>
            </div>
          </div>

          {/* ── PRODUITS ── */}
          <div className="bg-emerald-950/20 rounded-xl p-3 border border-emerald-900/50">
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

            <div className="flex justify-between px-2.5 py-2 border-t-2 border-emerald-800 mt-2 font-bold bg-emerald-900/40 rounded-lg">
              <span className="text-xs text-emerald-200 uppercase tracking-wide">Total produits</span>
              <span className="text-xl font-black text-emerald-400 tabular-nums">{totalProduits}</span>
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
            <div className="px-4 py-2 bg-amber-950/30 text-xs text-amber-300">
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
                resultat >= 0 ? "bg-emerald-950/30 text-emerald-300" : "bg-red-950/30 text-red-300"
              }`}
            >
              {resultat >= 0
                ? "Vos produits dépassent vos charges → les capitaux propres augmentent."
                : "Vos charges dépassent vos produits → les capitaux propres diminuent."}
            </div>
          </div>
        )}

        <CRAnalyse joueur={joueur} />
      </div>
    </div>
  );
}
