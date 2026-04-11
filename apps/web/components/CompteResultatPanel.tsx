"use client";
import { useState, useRef, useEffect } from "react";
import { Joueur, getTotalCharges, getTotalProduits, getResultatNet } from "@jedevienspatron/game-engine";
import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";

type RecentMod = { poste: string; ancienneValeur: number; nouvelleValeur: number };

interface Props {
  joueur: Joueur;
  highlightedPoste?: string | null;
  /** Étape du tour (0=début, 1-7=en cours, 8=fin) */
  etapeTour?: number;
  /** Vrai si une étape de saisie est en cours (activeStep !== null dans le parent) */
  hasActiveStep?: boolean;
  /** Modifications récentes (avant/après) à afficher dans les lignes */
  recentModifications?: RecentMod[];
}

// ─── Règles d'or par poste du Compte de Résultat ─────────────────────────────
const TOOLTIPS_CR: Record<string, { regleOr: string; couleur: string }> = {
  achats: {
    couleur: "#f97316",
    regleOr:
      "Le CMV (Coût des Marchandises Vendues) n'est pas l'achat du trimestre — c'est la valeur comptable des marchandises qui ont quitté ton stock pour être livrées. Quand tu achètes, les Stocks ↑ (Actif). Quand tu vends, Stocks ↓ (Actif) et CMV ↑ (Charge → Résultat ↓ → Passif ↓). Les deux côtés du bilan bougent simultanément.",
  },
  servicesExterieurs: {
    couleur: "#f97316",
    regleOr:
      "Charges fixes récurrentes : loyer, énergie, assurances, télécoms… Elles réduisent le résultat (Charge ↑ = Résultat ↓) ET la trésorerie (Actif ↓). Les deux côtés du bilan bougent ensemble — le résultat diminue au CR, la trésorerie diminue au Bilan.",
  },
  impotsTaxes: {
    couleur: "#f97316",
    regleOr:
      "Prélèvements obligatoires de l'État (taxes professionnelles, TVA non récupérable…). Comme toute charge, ils réduisent le résultat net — et donc les capitaux propres à la clôture de l'exercice.",
  },
  chargesInteret: {
    couleur: "#f97316",
    regleOr:
      "Prix de l'argent emprunté. Les intérêts sont une charge (Résultat ↓) ET une sortie de trésorerie (Actif ↓). Attention : le remboursement du CAPITAL emprunté n'apparaît PAS ici — il réduit la dette au Bilan (Passif ↓) sans toucher le Résultat.",
  },
  chargesPersonnel: {
    couleur: "#f97316",
    regleOr:
      "Salaires + cotisations sociales. Tes commerciaux coûtent mais génèrent du CA. Règle de gestion : si Charges personnel > 50% du CA, les équipes coûtent plus qu'elles ne rapportent ce trimestre. La masse salariale est une charge décaissée (Résultat ↓ et Trésorerie ↓).",
  },
  chargesExceptionnelles: {
    couleur: "#f97316",
    regleOr:
      "Dépenses imprévues hors exploitation normale (amendes, pertes sur sinistre, pénalités…). Elles pèsent sur le résultat sans faire partie de l'activité régulière. À surveiller : une charge exceptionnelle récurrente n'est plus exceptionnelle.",
  },
  dotationsAmortissements: {
    couleur: "#f97316",
    regleOr:
      "L'amortissement traduit l'usure de tes équipements (−1 000 €/bien/trimestre). C'est une charge COMPTABLE qui réduit ton résultat net — mais aucun euro ne sort de ta banque. La contrepartie est la baisse de la valeur nette des immobilisations au Bilan (Actif ↓). C'est pourquoi on dit que l'amortissement est un « bouclier fiscal » : il réduit l'impôt sans coûter de trésorerie.",
  },
  ventes: {
    couleur: "#22c55e",
    regleOr:
      "Le chiffre d'affaires : montant des ventes facturées ce trimestre. L'argent n'est pas forcément en banque (certains clients paient à 1 ou 2 trimestres) mais la vente est comptabilisée dès la livraison. Produits ↑ = Résultat ↑ = Capitaux propres ↑ à la clôture.",
  },
  productionStockee: {
    couleur: "#22c55e",
    regleOr:
      "Pour les entreprises de production, les biens fabriqués mais pas encore vendus sont comptabilisés en produit dès ce trimestre. Cela reflète fidèlement l'activité réelle de l'entreprise — et augmente aussi les stocks au Bilan (Actif ↑).",
  },
  produitsFinanciers: {
    couleur: "#22c55e",
    regleOr:
      "Revenus issus de placements ou d'intérêts reçus sur créances. Ils améliorent le résultat sans être liés à l'activité commerciale. Produits ↑ = Résultat ↑.",
  },
  revenusExceptionnels: {
    couleur: "#22c55e",
    regleOr:
      "Produits hors exploitation normale : plus-values sur cessions d'actifs, subventions exceptionnelles, indemnités… Ils améliorent le résultat ponctuellement. À ne pas confondre avec une performance commerciale durable.",
  },
};

// ─── Badge avant → après ──────────────────────────────────────────────────────
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
      <span className={`text-[10px] font-bold px-1 rounded-full ${bon ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"}`}>
        {delta > 0 ? "+" : ""}{delta}
      </span>
    </span>
  );
}

// ─── Ligne avec tooltip règle d'or ───────────────────────────────────────────
function TooltipRow({
  label,
  value,
  poste,
  highlighted,
  recentMod,
}: {
  label: string;
  value: number;
  poste: string;
  highlighted?: boolean;
  recentMod?: RecentMod;
}) {
  const [show, setShow] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const info = TOOLTIPS_CR[poste];
  const color = info?.couleur ?? "#94a3b8";

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  if (value === 0 && !recentMod) return null;

  return (
    <div ref={rowRef} className="mb-1">
      <div
        className={`flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg transition-all duration-300 ${
          highlighted
            ? "ring-2 ring-amber-400 bg-amber-500/20 shadow-md shadow-amber-400/20 scale-[1.02] -mx-0.5 animate-pulse"
            : ""
        }`}
        style={{
          backgroundColor: highlighted ? undefined : `${color}28`,
          borderLeft: `3px solid ${color}`,
        }}
      >
        {/* Bouton ⓘ */}
        {info && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            aria-label={`Règle d'or : ${label}`}
            className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            ⓘ
          </button>
        )}
        <span className="flex-1 text-gray-300 text-xs">{label}</span>
        <div className="flex items-center shrink-0">
          {recentMod ? <BeforeAfterBadge mod={recentMod} /> : (
            <span className="font-bold tabular-nums text-sm text-gray-100">{value}</span>
          )}
        </div>
      </div>

      {/* Tooltip règle d'or */}
      {show && info && (
        <div
          className="mx-1 mt-1 mb-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed"
          style={{
            backgroundColor: `${color}18`,
            borderColor: `${color}40`,
            color: "#e2e8f0",
          }}
        >
          <p className="font-semibold mb-1" style={{ color }}>⚖️ Règle d'or</p>
          <p>{info.regleOr}</p>
        </div>
      )}
    </div>
  );
}

// ─── Analyse dynamique (repliable) ───────────────────────────────────────────
function CRAnalyse({ joueur }: { joueur: Joueur }) {
  const [open, setOpen] = useState(false);
  const cr = joueur.compteResultat;
  const ca = cr.produits?.ventes ?? 0;
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
    rouge: "text-red-300 bg-red-500/10 border-red-500/30",
    jaune: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    vert: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  };

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest py-1 hover:text-slate-200 transition-colors"
      >
        <span>🔍 Analyse & Conseils</span>
        <span className="text-slate-600 font-normal normal-case">{open ? "▲ masquer" : "▼ afficher"}</span>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function findMod(mods: RecentMod[] | undefined, poste: string): RecentMod | undefined {
  // Retourne le DERNIER mod pour ce poste (cohérence avec BilanPanel)
  const matches = mods?.filter(m => m.poste === poste);
  return matches && matches.length > 0 ? matches[matches.length - 1] : undefined;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function CompteResultatPanel({
  joueur,
  highlightedPoste,
  etapeTour,
  hasActiveStep,
  recentModifications,
}: Props) {
  const { charges, produits } = joueur.compteResultat;
  const totalCharges  = getTotalCharges(charges);
  const totalProduits = getTotalProduits(produits);
  const resultat      = getResultatNet(joueur);

  const isProvisoire =
    hasActiveStep === true ||
    (etapeTour !== undefined && etapeTour >= 1 && etapeTour <= 7);

  return (
    <div className="bg-gray-900 rounded-2xl shadow-md border border-gray-700 flex flex-col max-h-full">

      {/* ── En-tête ── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex-shrink-0 flex items-center justify-between gap-4">
        <h3 className="font-black text-white text-base tracking-widest uppercase">
          📈 Compte de Résultat
        </h3>
        <span className="text-xs text-slate-400 italic hidden sm:block">
          Clique sur ⓘ pour la règle d&apos;or de chaque poste
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 min-w-0">

          {/* ── CHARGES ── */}
          <div className="bg-orange-950/20 rounded-xl p-3 border border-orange-900/50">
            <div className="text-center text-xs font-black text-white mb-2.5 uppercase tracking-widest bg-orange-600 rounded-lg py-1.5">
              − Charges
            </div>

            <TooltipRow
              label="Coût des marchandises vendues"
              value={charges.achats}
              poste="achats"
              highlighted={highlightedPoste === "achats"}
              recentMod={findMod(recentModifications, "achats")}
            />
            <TooltipRow
              label="Services extérieurs"
              value={charges.servicesExterieurs}
              poste="servicesExterieurs"
              highlighted={highlightedPoste === "servicesExterieurs"}
              recentMod={findMod(recentModifications, "servicesExterieurs")}
            />
            <TooltipRow
              label="Impôts & taxes"
              value={charges.impotsTaxes}
              poste="impotsTaxes"
              highlighted={highlightedPoste === "impotsTaxes"}
              recentMod={findMod(recentModifications, "impotsTaxes")}
            />
            <TooltipRow
              label="Charges d'intérêt"
              value={charges.chargesInteret}
              poste="chargesInteret"
              highlighted={highlightedPoste === "chargesInteret"}
              recentMod={findMod(recentModifications, "chargesInteret")}
            />
            <TooltipRow
              label="Charges de personnel"
              value={charges.chargesPersonnel}
              poste="chargesPersonnel"
              highlighted={highlightedPoste === "chargesPersonnel"}
              recentMod={findMod(recentModifications, "chargesPersonnel")}
            />
            <TooltipRow
              label="Charges exceptionnelles"
              value={charges.chargesExceptionnelles}
              poste="chargesExceptionnelles"
              highlighted={highlightedPoste === "chargesExceptionnelles"}
              recentMod={findMod(recentModifications, "chargesExceptionnelles")}
            />
            <TooltipRow
              label="Dotation aux amortissements"
              value={charges.dotationsAmortissements}
              poste="dotationsAmortissements"
              highlighted={highlightedPoste === "dotationsAmortissements"}
              recentMod={findMod(recentModifications, "dotationsAmortissements")}
            />

            <div className="flex justify-between px-2.5 py-2 border-t-2 border-orange-800 mt-2 font-bold bg-orange-900/20 rounded-lg">
              <span className="text-xs text-orange-200 uppercase tracking-wide">Total charges</span>
              <span className="text-xl font-black text-orange-400 tabular-nums">{totalCharges}</span>
            </div>
          </div>

          {/* ── PRODUITS ── */}
          <div className="bg-emerald-950/20 rounded-xl p-3 border border-emerald-900/50">
            <div className="text-center text-xs font-black text-white mb-2.5 uppercase tracking-widest bg-emerald-600 rounded-lg py-1.5">
              + Produits
            </div>

            <TooltipRow
              label="Ventes"
              value={produits.ventes}
              poste="ventes"
              highlighted={highlightedPoste === "ventes"}
              recentMod={findMod(recentModifications, "ventes")}
            />
            <TooltipRow
              label="Production non encore vendue"
              value={produits.productionStockee}
              poste="productionStockee"
              highlighted={highlightedPoste === "productionStockee"}
              recentMod={findMod(recentModifications, "productionStockee")}
            />
            <TooltipRow
              label="Produits financiers"
              value={produits.produitsFinanciers}
              poste="produitsFinanciers"
              highlighted={highlightedPoste === "produitsFinanciers"}
              recentMod={findMod(recentModifications, "produitsFinanciers")}
            />
            <TooltipRow
              label="Revenus exceptionnels"
              value={produits.revenusExceptionnels}
              poste="revenusExceptionnels"
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
                {resultat >= 0 ? "+" : ""}{resultat}
              </span>
            </div>
            <div className="px-4 py-2 bg-amber-950/30 text-xs text-amber-300">
              💡 Les charges et produits sont enregistrés au fur et à mesure de la saisie.
              Le résultat final sera affiché une fois tous les postes saisis.
            </div>
          </div>
        ) : (
          <div className={`mt-4 rounded-xl border-2 overflow-hidden ${resultat >= 0 ? "border-emerald-400" : "border-red-400"}`}>
            <div className={`flex justify-between items-center px-4 py-3 ${resultat >= 0 ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
              <div>
                <div className="text-base font-black">
                  {resultat >= 0 ? "✅ BÉNÉFICE" : "❌ PERTE"}
                </div>
                <div className="text-xs font-normal opacity-80 mt-0.5">
                  Produits − Charges = Résultat net
                </div>
              </div>
              <span className="text-3xl font-black tabular-nums ml-4">
                {resultat >= 0 ? "+" : ""}{resultat}
              </span>
            </div>
            <div className={`px-4 py-2 text-xs ${resultat >= 0 ? "bg-emerald-950/30 text-emerald-300" : "bg-red-950/30 text-red-300"}`}>
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
