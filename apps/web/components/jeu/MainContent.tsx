"use client";

// [IMPACT-B] imports — retirer si on revient en arrière
import { useEffect } from "react";
import { Joueur, CarteDecision } from "@/lib/game-engine/types";
import { getTresorerie } from "@/lib/game-engine/calculators";
import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import IndicateursPanel from "@/components/IndicateursPanel";
import { GlossairePanel } from "@/components/GlossairePanel";
import CarteView from "@/components/CarteView";
import { getPosteValue, getDocumentType, nomCompte } from "./utils";

// [IMPACT-B] "impact" ajouté au type — retirer si on revient en arrière
type TabType = "bilan" | "cr" | "indicateurs" | "glossaire" | "impact";

interface MainContentProps {
  joueur: Joueur;
  displayJoueur: Joueur;
  activeStep: any; // ActiveStep | null
  highlightedPoste: string | null;
  etapeTour: number;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  showCartes: boolean;
  selectedDecision: CarteDecision | null;
  setSelectedDecision: (val: CarteDecision | null) => void;
  cartesDisponibles: CarteDecision[];
  /** Cartes commerciales disponibles au recrutement (toujours dispo, indépendant de la pioche) */
  cartesRecrutement?: CarteDecision[];
  /** Modifications récentes (avant/après) pour affichage dans les panneaux */
  recentModifications?: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>;
  /** Sous-étape de l'étape 6 : "recrutement" (6a) ou "investissement" (6b) */
  subEtape6?: "recrutement" | "investissement";
  /** Mode Rapide : étapes auto pré-cochées à partir du T3 */
  modeRapide?: boolean;
  /** Passer l'étape 6 courante (6a → 6b, ou 6b → 7) */
  onSkipDecision?: () => void;
  /** Exécuter la carte Décision sélectionnée */
  onLaunchDecision?: () => void;
}

const TABS_BASE: Array<[TabType, string]> = [
  ["bilan", "📋 Bilan"],
  ["cr", "📈 CR"],
  ["indicateurs", "📊 Indicateurs"],
  ["glossaire", "📖 Glossaire"],
];
// [IMPACT-B] onglet Impact — retirer si on revient en arrière
const TAB_IMPACT: [TabType, string] = ["impact", "🔍 Impact"];

/**
 * Montant CA par type de client (pour l'affichage dans le portefeuille)
 */
const MONTANT_PAR_TYPE: Record<string, number> = {
  particulier: 2,
  tpe: 3,
  grand_compte: 4,
};

/** Délai d'encaissement par type de client (0 = immédiat, 1 = C+1, 2 = C+2) */
const DELAI_PAR_TYPE: Record<string, number> = {
  particulier: 0,
  tpe: 1,
  grand_compte: 2,
};

/** Labels court de risque BFR */
const BFR_LABELS: Record<number, { label: string; color: string; icon: string }> = {
  0: { label: "Aucun",    color: "text-emerald-400", icon: "✓" },
  1: { label: "Élevé",    color: "text-orange-400",  icon: "⚠️" },
  2: { label: "Critique", color: "text-red-400",     icon: "🚨" },
};

/** Labels lisibles pour les postes du moteur */
const POSTE_LABELS: Record<string, string> = {
  tresorerie: "Trésorerie",
  stocks: "Stocks",
  immobilisations: "Immobilisations",
  creancesPlus1: "Créances (1 trim.)",
  creancesPlus2: "Créances (2 trim.)",
  capitaux: "Capitaux propres",
  emprunts: "Emprunts",
  dettes: "Dettes fournisseurs",
  dettesFiscales: "Dettes fiscales",
  decouvert: "Découvert",
  ventes: "Ventes",
  achats: "Coût marchandises",
  servicesExterieurs: "Services ext.",
  impotsTaxes: "Impôts & taxes",
  chargesInteret: "Charges intérêt",
  chargesPersonnel: "Charges personnel",
  chargesExceptionnelles: "Ch. exceptionnelles",
  dotationsAmortissements: "Amortissements",
  productionStockee: "Production stockée",
  produitsFinanciers: "Produits financiers",
  revenusExceptionnels: "Revenus except.",
};

/**
 * Contenu principal : affichage du bilan, CR, indicateurs, cartes actives et sélecteur de cartes.
 *
 * Ordre des sections :
 *   1. En-tête joueur
 *   2. Onglets Bilan / CR / Indicateurs
 *   3. Contenu de l'onglet actif
 *   4. Portefeuille Commerciaux & Clients (toujours visible)
 *   5. Cartes actives
 *   6. Sélecteur de cartes Décision (étape 6 uniquement)
 */
export function MainContent({
  joueur,
  displayJoueur,
  activeStep,
  highlightedPoste,
  etapeTour,
  activeTab,
  setActiveTab,
  showCartes,
  selectedDecision,
  setSelectedDecision,
  cartesDisponibles,
  cartesRecrutement: cartesRecrutementProp,
  recentModifications,
  subEtape6 = "recrutement",
  modeRapide = false,
  onSkipDecision,
  onLaunchDecision,
}: MainContentProps) {
  // Les cartes de recrutement viennent de la prop dédiée (obtenirCarteRecrutement)
  // Si non fournie (rétrocompat), on filtre depuis cartesDisponibles
  const cartesRecrutement = cartesRecrutementProp
    ?? cartesDisponibles.filter((c) => c.categorie === "commercial");

  // La pioche ne contient plus de commerciaux — uniquement investissements
  const cartesAutres = cartesDisponibles.filter(
    (c) => c.categorie !== "commercial"
  );

  // Séparation des cartes ACTIVES (déjà achetées)
  const cartesCommerciales = joueur.cartesActives.filter((c) => c.clientParTour);
  const cartesAutresActives = joueur.cartesActives.filter((c) => !c.clientParTour);

  // [IMPACT-B] Auto-switch vers "impact" quand une étape commence — retirer si on revient en arrière
  useEffect(() => {
    if (activeStep) {
      setActiveTab("impact");
    } else {
      // Quand l'étape se termine, revenir au Bilan si on était sur l'onglet impact
      if (activeTab === "impact") setActiveTab("bilan");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!activeStep]);

  // [IMPACT-B] Onglets dynamiques : "impact" apparaît uniquement pendant une étape active
  const TABS = activeStep
    ? [TAB_IMPACT, ...TABS_BASE]
    : TABS_BASE;

  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. En-tête joueur                                 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-sm border border-gray-700">
        <span className="text-3xl">{joueur.entreprise.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-xl text-gray-100">{joueur.pseudo}</div>
          <div className="text-sm text-gray-400">
            {joueur.entreprise.nom} · {joueur.entreprise.specialite}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 font-medium">Trésorerie</div>
          <div
            className={`font-bold text-lg transition-colors ${
              getTresorerie(displayJoueur) < 0 ? "text-red-600" : "text-green-700"
            }`}
          >
            {getTresorerie(displayJoueur)}
          </div>
          {activeStep && (
            <div className="text-xs text-indigo-500 font-medium mt-0.5 flex items-center gap-1">
              <span className="inline-block animate-pulse">🔴</span>
              <span>Saisie en cours…</span>
            </div>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1b. ÉTAPE 6 — Zone d'action principale (EN HAUT)  */}
      {/* Affichée AVANT les onglets pour que le joueur voit*/}
      {/* immédiatement ce qu'il peut / doit faire.         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {etapeTour === 6 && !activeStep && (
        <div className="rounded-2xl border-2 border-indigo-700 bg-indigo-950/40 overflow-hidden">

          {/* ── Header de l'étape 6 ── */}
          <div className={`px-4 py-3 flex items-center gap-3 ${
            subEtape6 === "recrutement"
              ? "bg-indigo-900/60 border-b border-indigo-700"
              : "bg-amber-900/60 border-b border-amber-700"
          }`}>
            <span className="text-2xl">{subEtape6 === "recrutement" ? "🧑‍💼" : "💡"}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  subEtape6 === "recrutement"
                    ? "bg-indigo-600 text-white"
                    : "bg-amber-600 text-white"
                }`}>
                  {subEtape6 === "recrutement" ? "ÉTAPE 6a" : "ÉTAPE 6b"}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  subEtape6 === "recrutement"
                    ? "border-indigo-500 text-indigo-300 bg-gray-800/50"
                    : "border-amber-500 text-amber-300 bg-gray-800/50"
                }`}>
                  {subEtape6 === "recrutement" ? "6b Investissement →" : "← 6a Recrutement ✓"}
                </span>
              </div>
              <div className={`font-bold text-base mt-0.5 ${
                subEtape6 === "recrutement" ? "text-indigo-100" : "text-amber-100"
              }`}>
                {subEtape6 === "recrutement"
                  ? "Recrute un Commercial (optionnel)"
                  : "Investis dans ton Entreprise (optionnel)"}
              </div>
            </div>
          </div>

          {/* ── Instruction claire ── */}
          <div className={`px-4 py-2 text-sm leading-relaxed ${
            subEtape6 === "recrutement"
              ? "text-indigo-300 bg-indigo-950/30"
              : "text-amber-300 bg-amber-950/30"
          }`}>
            {subEtape6 === "recrutement" ? (
              <>
                👇 <strong>Clique sur une carte</strong> pour recruter, puis tape sur{" "}
                <strong className="text-white">Exécuter</strong> dans le panneau gauche.
                Un commercial génère des clients <em>dès le tour suivant</em>.
              </>
            ) : (
              <>
                👇 <strong>Clique sur une carte</strong> pour investir, puis tape sur{" "}
                <strong className="text-white">Exécuter</strong> dans le panneau gauche.
                Chaque investissement génère des <em>clients récurrents</em> et des{" "}
                <em>amortissements</em>.
              </>
            )}
          </div>

          {/* ── Cartes ── */}
          <div className="px-4 py-3 space-y-3">

            {/* Section Recrutement */}
            {subEtape6 === "recrutement" && (
              <>
                {cartesRecrutement.length === 0 ? (
                  <div className="text-center py-4 bg-green-950/30 border border-green-800/50 rounded-xl text-sm text-green-300 font-semibold">
                    ✅ Tous les commerciaux sont déjà dans ton équipe !
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {cartesRecrutement.map((c) => (
                      <CarteView
                        key={c.id}
                        carte={c}
                        onClick={() =>
                          setSelectedDecision(selectedDecision?.id === c.id ? null : c)
                        }
                        selected={selectedDecision?.id === c.id}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Section Investissement */}
            {subEtape6 === "investissement" && (
              <>
                {/* Filtrer les cartes déjà actives : PCG — un compte ne se duplique pas */}
                {(() => {
                  const cartesDispos = cartesAutres.filter(
                    (c) => !joueur.cartesActives.some((a) => a.id === c.id)
                  );
                  return cartesDispos.length === 0 ? (
                    <div className="text-center py-4 bg-green-950/30 border border-green-800/50 rounded-xl text-sm text-green-300 font-semibold">
                      ✅ Tous les investissements disponibles sont déjà actifs !
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cartesDispos.map((c) => (
                        <CarteView
                          key={c.id}
                          carte={c}
                          onClick={() =>
                            setSelectedDecision(selectedDecision?.id === c.id ? null : c)
                          }
                          selected={selectedDecision?.id === c.id}
                        />
                      ))}
                    </div>
                  );
                })()}
              </>
            )}

          </div>

          {/* ── CTAs en bas du bloc ── */}
          <div className="px-4 py-3 border-t border-gray-700/50 bg-gray-900/30 flex flex-col gap-2">
            {selectedDecision && onLaunchDecision && (
              <button
                onClick={onLaunchDecision}
                className={`w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                  subEtape6 === "recrutement"
                    ? "bg-indigo-600 hover:bg-indigo-500"
                    : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                <span>📝</span>
                <span>Exécuter — {selectedDecision.titre}</span>
              </button>
            )}
            {onSkipDecision && (
              <button
                onClick={onSkipDecision}
                className="w-full py-2.5 rounded-xl font-semibold text-gray-300 text-sm border border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center gap-2 transition-colors"
              >
                {subEtape6 === "recrutement" ? (
                  <><span>⏭️</span><span>Passer le recrutement → Investissement</span></>
                ) : (
                  <><span>⏭️</span><span>Passer — aucun investissement ce trimestre</span></>
                )}
              </button>
            )}
          </div>

        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. Onglets Bilan / CR / Indicateurs               */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(([tab, label]) => {
          const isImpact = tab === "impact";
          const isLive   = !!activeStep && !isImpact && tab !== "indicateurs";
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                // [IMPACT-B] styles spéciaux pour l'onglet impact
                isImpact && activeTab === "impact"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40 ring-2 ring-violet-400/30"
                  : isImpact
                    ? "bg-violet-900/40 text-violet-300 border-2 border-violet-500 hover:border-violet-400 animate-pulse"
                    : activeTab === tab
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm"
                      : isLive
                        ? "bg-gray-800 text-indigo-300 border-2 border-indigo-400 hover:border-indigo-500"
                        : "bg-gray-800 text-gray-300 border border-gray-600 hover:border-indigo-400"
              }`}
              aria-pressed={activeTab === tab}
            >
              {label}
              {isLive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. Bandeau modifications + Contenu de l'onglet    */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Bandeau modifications supprimé — remplacé par le panneau Impact sticky dans le panneau de gauche */}

      <div>
        {/* [IMPACT-B] Onglet Impact — retirer ce bloc si on revient en arrière */}
        {activeTab === "impact" && activeStep && (() => {
          const baseJoueur = activeStep.baseEtat?.joueurs?.[activeStep.baseEtat?.joueurActif] as Joueur | undefined;
          // Dédoublonnage par poste
          const seen = new Set<string>();
          const rows: Array<{
            poste: string; label: string; docType: "Bilan" | "CR";
            avant: number; actuel: number; delta: number;
            applied: boolean;
          }> = [];
          for (const e of activeStep.entries) {
            if (seen.has(e.poste)) continue;
            seen.add(e.poste);
            const avant  = baseJoueur ? getPosteValue(baseJoueur, e.poste) : 0;
            const actuel = getPosteValue(displayJoueur, e.poste);
            const allForPoste = activeStep.entries.filter((en: { poste: string; applied?: boolean }) => en.poste === e.poste);
            const applied = allForPoste.every((en: { applied?: boolean }) => en.applied);
            rows.push({
              poste: e.poste,
              label: nomCompte(e.poste),
              docType: getDocumentType(e.poste),
              avant, actuel,
              delta: actuel - avant,
              applied,
            });
          }
          const bilanRows = rows.filter(r => r.docType === "Bilan");
          const crRows    = rows.filter(r => r.docType === "CR");
          const totalRows = rows.length;
          const doneRows  = rows.filter(r => r.applied).length;

          return (
            <div className="rounded-2xl border border-violet-700/50 bg-gray-900 overflow-hidden shadow-lg">
              {/* En-tête */}
              <div className="bg-gradient-to-r from-violet-900 to-indigo-900 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeStep.icone}</span>
                  <div>
                    <div className="text-xs font-black text-violet-300 uppercase tracking-widest">Impact de l&apos;étape</div>
                    <div className="text-sm font-bold text-white leading-tight">{activeStep.titre}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black tabular-nums ${doneRows === totalRows ? "text-emerald-400" : "text-violet-300"}`}>
                    {doneRows}/{totalRows}
                  </div>
                  <div className="text-[10px] text-violet-400">saisies</div>
                </div>
              </div>
              {/* Barre progression */}
              <div className="h-1.5 bg-gray-800">
                <div
                  className={`h-full transition-all duration-500 ${doneRows === totalRows ? "bg-emerald-500" : "bg-violet-500"}`}
                  style={{ width: `${totalRows > 0 ? (doneRows / totalRows) * 100 : 0}%` }}
                />
              </div>
              {/* Grille Bilan | CR */}
              <div className="grid grid-cols-2 divide-x divide-gray-700/50">
                {/* Colonne Bilan */}
                <div className="p-3">
                  <div className="text-center text-[10px] font-black text-blue-300 uppercase tracking-widest bg-blue-900/30 rounded-lg py-1 mb-3">
                    📋 Bilan
                  </div>
                  {bilanRows.length === 0 ? (
                    <p className="text-xs text-gray-600 italic text-center py-2">Aucun poste bilan</p>
                  ) : bilanRows.map((row) => {
                    const changed = row.actuel !== row.avant;
                    const bon = row.delta > 0
                      ? !["emprunts","dettes","decouvert","dettesFiscales","dettesD2"].includes(row.poste)
                      : ["emprunts","dettes","decouvert","dettesFiscales","dettesD2"].includes(row.poste);
                    return (
                      <div key={row.poste} className={`mb-3 rounded-xl p-2.5 border transition-all duration-500 ${
                        row.applied
                          ? changed
                            ? "bg-gray-800/60 border-gray-600"
                            : "bg-gray-800/30 border-gray-700 opacity-50"
                          : "bg-blue-950/20 border-blue-800/40"
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-blue-300 truncate">{row.label}</span>
                          {row.applied
                            ? <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                            : <span className="text-[10px] text-blue-500 animate-pulse">⋯</span>
                          }
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl font-black tabular-nums text-gray-400">{row.avant}</span>
                          <span className="text-gray-600 text-sm">→</span>
                          <span className={`text-2xl font-black tabular-nums ${
                            !changed ? "text-gray-500" : bon ? "text-emerald-400" : "text-red-400"
                          }`}>{row.actuel}</span>
                        </div>
                        {changed && (
                          <div className={`text-center text-xs font-black mt-1 tabular-nums ${bon ? "text-emerald-500" : "text-red-500"}`}>
                            {row.delta > 0 ? `+${row.delta}` : `${row.delta}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Colonne CR */}
                <div className="p-3">
                  <div className="text-center text-[10px] font-black text-amber-300 uppercase tracking-widest bg-amber-900/30 rounded-lg py-1 mb-3">
                    📈 Compte de Résultat
                  </div>
                  {crRows.length === 0 ? (
                    <p className="text-xs text-gray-600 italic text-center py-2">Aucun poste CR</p>
                  ) : crRows.map((row) => {
                    const changed = row.actuel !== row.avant;
                    const bon = ["ventes","productionStockee","produitsFinanciers","revenusExceptionnels"].includes(row.poste)
                      ? row.delta > 0 : row.delta < 0;
                    return (
                      <div key={row.poste} className={`mb-3 rounded-xl p-2.5 border transition-all duration-500 ${
                        row.applied
                          ? changed
                            ? "bg-gray-800/60 border-gray-600"
                            : "bg-gray-800/30 border-gray-700 opacity-50"
                          : "bg-amber-950/20 border-amber-800/40"
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-amber-300 truncate">{row.label}</span>
                          {row.applied
                            ? <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                            : <span className="text-[10px] text-amber-500 animate-pulse">⋯</span>
                          }
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl font-black tabular-nums text-gray-400">{row.avant}</span>
                          <span className="text-gray-600 text-sm">→</span>
                          <span className={`text-2xl font-black tabular-nums ${
                            !changed ? "text-gray-500" : bon ? "text-emerald-400" : "text-red-400"
                          }`}>{row.actuel}</span>
                        </div>
                        {changed && (
                          <div className={`text-center text-xs font-black mt-1 tabular-nums ${bon ? "text-emerald-500" : "text-red-500"}`}>
                            {row.delta > 0 ? `+${row.delta}` : `${row.delta}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Message fin */}
              {doneRows === totalRows && (
                <div className="mx-3 mb-3 py-2 rounded-xl bg-emerald-900/30 border border-emerald-700/50 text-center text-xs font-bold text-emerald-300">
                  ✅ Toutes les écritures saisies — bilan et CR mis à jour !
                </div>
              )}
            </div>
          );
        })()}
        {/* Fin [IMPACT-B] */}

        {activeTab === "bilan" && (
          <BilanPanel
            joueur={displayJoueur}
            highlightedPoste={highlightedPoste}
            recentModifications={recentModifications}
          />
        )}
        {activeTab === "cr" && (
          <CompteResultatPanel
            joueur={displayJoueur}
            highlightedPoste={highlightedPoste}
            etapeTour={etapeTour}
            hasActiveStep={!!activeStep}
            recentModifications={recentModifications}
          />
        )}
        {activeTab === "indicateurs" && (
          <IndicateursPanel joueur={displayJoueur} />
        )}
        {activeTab === "glossaire" && (
          <GlossairePanel />
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 4. Cartes actives : Commerciaux + Investissements  */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-3">
        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          🎴 Cartes actives
        </div>

        {/* ── Sous-section Commerciaux ─────────────────────────── */}
        {cartesCommerciales.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-indigo-900/50" />
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider whitespace-nowrap">
                🧑‍💼 Commerciaux
              </div>
              <div className="h-px flex-1 bg-indigo-900/50" />
            </div>

            <div className="flex flex-wrap gap-3">
              {cartesCommerciales.map((c) => {
                const icon =
                  c.clientParTour === "particulier"
                    ? "👤"
                    : c.clientParTour === "tpe"
                      ? "🏠"
                      : "🏢";
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const nb = (c as any).nbClientsParTour ?? 1;
                const typeLabelPluriel =
                  c.clientParTour === "particulier"
                    ? "clients particuliers"
                    : c.clientParTour === "tpe"
                      ? "clients TPE"
                      : "grands comptes";
                const montant    = MONTANT_PAR_TYPE[c.clientParTour ?? ""] ?? 1;
                const caTotal    = montant * nb;
                const delai      = DELAI_PAR_TYPE[c.clientParTour ?? ""] ?? 0;

                // Extraire les coûts récurrents depuis effetsRecurrents
                const coutCharges = (c.effetsRecurrents ?? [])
                  .filter((e) => e.poste === "chargesPersonnel")
                  .reduce((sum, e) => sum + e.delta, 0);
                const coutTreso = (c.effetsRecurrents ?? [])
                  .filter((e) => e.poste === "tresorerie")
                  .reduce((sum, e) => sum + e.delta, 0);

                // Calcul du bilan net (logique des agents)
                const cmvTotal    = nb * 1;                                    // 1 stock consommé par vente
                const resultatNet = caTotal - cmvTotal - coutCharges;          // résultat net/trim
                const tresoNette  = (delai === 0 ? caTotal : 0) + coutTreso;  // encaissé imméd. − salaire
                const bfrInfo     = BFR_LABELS[delai] ?? BFR_LABELS[0];

                // Couleur du header selon type de client
                const headerBg =
                  c.clientParTour === "particulier"
                    ? "bg-green-700"
                    : c.clientParTour === "tpe"
                      ? "bg-blue-700"
                      : "bg-purple-700";
                const borderCol =
                  c.clientParTour === "particulier"
                    ? "border-green-500/60"
                    : c.clientParTour === "tpe"
                      ? "border-blue-500/60"
                      : "border-purple-500/60";

                // Label délai
                const delaiLabel =
                  delai === 0 ? "comptant C+0" : `créance C+${delai}`;

                return (
                  <div
                    key={c.id}
                    className={`border-2 ${borderCol} rounded-xl overflow-hidden bg-gray-900 min-w-[180px] shadow-md`}
                  >
                    {/* ── En-tête : titre du commercial ── */}
                    <div className={`${headerBg} text-white px-3 py-2.5 flex items-center gap-1.5`}>
                      <span className="text-base">🧑‍💼</span>
                      <span className="font-bold text-sm leading-tight">{c.titre}</span>
                    </div>

                    {/* ── Coûts récurrents (rouge) ── */}
                    <div className="px-3 py-2.5 border-b border-gray-700/60 bg-red-950/20">
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1">
                        💸 Coût / trimestre
                      </div>
                      <div className="space-y-0.5">
                        {coutCharges > 0 && (
                          <div className="text-xs text-red-300 flex items-center gap-1">
                            <span className="font-bold">↑</span>
                            <span>+{coutCharges} charges personnel</span>
                          </div>
                        )}
                        {coutTreso < 0 && (
                          <div className="text-xs text-red-300 flex items-center gap-1">
                            <span className="font-bold">↓</span>
                            <span>{coutTreso} trésorerie</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Revenus générés (vert) ── */}
                    <div className="px-3 py-2.5 border-b border-gray-700/60 bg-emerald-950/20">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1">
                        📈 Revenu / trimestre
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">{Array(nb).fill(icon).join("")}</span>
                        <span className="text-xs text-emerald-300 font-semibold">
                          +{nb} {typeLabelPluriel}
                        </span>
                      </div>
                      <div className="text-xs text-emerald-200 font-bold flex items-center gap-1">
                        <span className="text-emerald-400">→</span>
                        <span>+{caTotal} CA ({delaiLabel})</span>
                      </div>
                    </div>

                    {/* ── Bilan net / agents (indigo) ── */}
                    <div className="px-3 py-2.5 bg-indigo-950/30">
                      <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide mb-1.5">
                        📊 Impact net / trimestre
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {/* Résultat net */}
                        <div className="bg-gray-800 border border-gray-700 rounded p-1">
                          <div className="text-[9px] text-gray-500 uppercase leading-tight">Résultat</div>
                          <div className={`text-sm font-black leading-tight ${resultatNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {resultatNet >= 0 ? "+" : ""}{resultatNet}
                          </div>
                        </div>
                        {/* Trésorerie nette */}
                        <div className="bg-gray-800 border border-gray-700 rounded p-1">
                          <div className="text-[9px] text-gray-500 uppercase leading-tight">Tréso</div>
                          <div className={`text-sm font-black leading-tight ${tresoNette >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {tresoNette >= 0 ? "+" : ""}{tresoNette}
                          </div>
                        </div>
                        {/* BFR */}
                        <div className="bg-gray-800 border border-gray-700 rounded p-1">
                          <div className="text-[9px] text-gray-500 uppercase leading-tight">BFR</div>
                          <div className={`text-xs font-bold leading-tight ${bfrInfo.color}`}>
                            {bfrInfo.icon} {bfrInfo.label}
                          </div>
                        </div>
                      </div>
                      {delai > 0 && (
                        <div className="mt-1.5 text-[10px] text-gray-500 italic leading-tight">
                          ⚠️ CA encaissé en C+{delai} → décalage tréso, gérez votre BFR !
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Sous-section Investissements & Décisions ─────────── */}
        {cartesAutresActives.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gray-700" />
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                📋 Investissements & Décisions
              </div>
              <div className="h-px flex-1 bg-gray-700" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cartesAutresActives.map((c) => (
                <CarteView key={c.id} carte={c} compact />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Badge Mode Rapide actif */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {modeRapide && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-950/30 border border-amber-700 rounded-xl text-xs text-amber-300">
          <span className="text-base">⚡</span>
          <div>
            <span className="font-bold">Mode Accéléré actif</span>
            <span className="text-amber-400 ml-1">— étapes comptables pré-cochées, tu n'as qu'à valider</span>
          </div>
        </div>
      )}

    </main>
  );
}
