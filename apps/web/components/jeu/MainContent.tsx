"use client";

import { Joueur, CarteDecision } from "@/lib/game-engine/types";
import { getTresorerie } from "@/lib/game-engine/calculators";
import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import IndicateursPanel from "@/components/IndicateursPanel";
import CarteView from "@/components/CarteView";

type TabType = "bilan" | "cr" | "indicateurs";

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
}

const TABS: Array<[TabType, string]> = [
  ["bilan", "📋 Bilan"],
  ["cr", "📈 Compte de résultat"],
  ["indicateurs", "📊 Indicateurs"],
];

/**
 * Montant CA par type de client (pour l'affichage dans le portefeuille)
 */
const MONTANT_PAR_TYPE: Record<string, number> = {
  particulier: 2,
  tpe: 3,
  grand_compte: 4,
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

  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. En-tête joueur                                 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-sm border border-indigo-100">
        <span className="text-3xl">{joueur.entreprise.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-xl text-gray-800">{joueur.pseudo}</div>
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
      {/* 2. Onglets Bilan / CR / Indicateurs               */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(([tab, label]) => {
          const isLive = !!activeStep && tab !== "indicateurs";
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm"
                  : isLive
                    ? "bg-white text-indigo-700 border-2 border-indigo-400 hover:border-indigo-500"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
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

      {/* ── Bandeau récapitulatif des modifications (persistant pendant la saisie) ── */}
      {activeStep && recentModifications && recentModifications.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1.5 flex items-center gap-1.5">
            <span className="inline-block animate-pulse">🔄</span>
            Modifications de cette étape
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentModifications.map((mod) => {
              const delta = mod.nouvelleValeur - mod.ancienneValeur;
              // Couleur basée sur l'impact financier réel (PCG) — pas uniquement le signe du delta
              const bon = isBonPourEntreprise(mod.poste, delta);
              return (
                <span
                  key={mod.poste}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    bon
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-red-100 text-red-800 border-red-300"
                  }`}
                >
                  <span>{POSTE_LABELS[mod.poste] ?? mod.poste}</span>
                  <span className="opacity-60 line-through text-[10px] tabular-nums">{mod.ancienneValeur}</span>
                  <span className="text-[10px]">→</span>
                  <span className="font-black tabular-nums">{mod.nouvelleValeur}</span>
                  <span className={`text-[10px] font-bold ml-0.5 ${bon ? "text-emerald-600" : "text-red-600"}`}>
                    ({delta > 0 ? "+" : ""}{delta})
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div>
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
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 4. Cartes actives : Commerciaux + Investissements  */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-3">
        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          🎴 Cartes actives
        </div>

        {/* ── Sous-section Commerciaux ─────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-indigo-100" />
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider whitespace-nowrap">
              🧑‍💼 Commerciaux
            </div>
            <div className="h-px flex-1 bg-indigo-100" />
          </div>

          {cartesCommerciales.length === 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
              <strong>Aucun commercial actif.</strong> Recrutez via une{" "}
              <span className="text-indigo-600 font-bold">Carte Décision</span> à
              l&apos;étape 6 🎯 : Junior (1 client particulier/trim),
              Senior (1 client TPE/trim), Directrice (1 grand compte/trim).
            </div>
          ) : (
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
                const typeLabel =
                  c.clientParTour === "particulier"
                    ? "client particulier"
                    : c.clientParTour === "tpe"
                      ? "client TPE"
                      : "grand compte";
                const typeLabelPluriel =
                  c.clientParTour === "particulier"
                    ? "clients particuliers"
                    : c.clientParTour === "tpe"
                      ? "clients TPE"
                      : "grands comptes";
                const montant = MONTANT_PAR_TYPE[c.clientParTour ?? ""] ?? 1;
                const caTotal = montant * nb;

                // Extraire les coûts récurrents depuis effetsRecurrents
                const coutCharges = (c.effetsRecurrents ?? [])
                  .filter((e) => e.poste === "chargesPersonnel")
                  .reduce((sum, e) => sum + e.delta, 0);
                const coutTreso = (c.effetsRecurrents ?? [])
                  .filter((e) => e.poste === "tresorerie")
                  .reduce((sum, e) => sum + e.delta, 0);

                // Couleur du header selon type de client
                const headerBg =
                  c.clientParTour === "particulier"
                    ? "bg-green-600"
                    : c.clientParTour === "tpe"
                      ? "bg-blue-600"
                      : "bg-purple-600";
                const borderCol =
                  c.clientParTour === "particulier"
                    ? "border-green-300"
                    : c.clientParTour === "tpe"
                      ? "border-blue-300"
                      : "border-purple-300";

                return (
                  <div
                    key={c.id}
                    className={`border-2 ${borderCol} rounded-xl overflow-hidden bg-white min-w-[160px] shadow-sm`}
                  >
                    {/* ── En-tête : titre du commercial ── */}
                    <div className={`${headerBg} text-white px-3 py-2 flex items-center gap-1.5`}>
                      <span className="text-base">🧑‍💼</span>
                      <span className="font-bold text-sm leading-tight">{c.titre}</span>
                    </div>

                    {/* ── Coûts par trimestre (rouge) ── */}
                    <div className="px-3 py-2 border-b border-red-100 bg-red-50">
                      <div className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">
                        💸 Coût / trimestre
                      </div>
                      <div className="space-y-0.5">
                        {coutCharges > 0 && (
                          <div className="text-xs text-red-600 flex items-center gap-1">
                            <span className="font-bold">↑</span>
                            <span>+{coutCharges} charges personnel</span>
                          </div>
                        )}
                        {coutTreso < 0 && (
                          <div className="text-xs text-red-600 flex items-center gap-1">
                            <span className="font-bold">↓</span>
                            <span>{coutTreso} trésorerie</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Bénéfices par trimestre (vert) ── */}
                    <div className="px-3 py-2 bg-green-50">
                      <div className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1">
                        📈 Revenu / trimestre
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">{Array(nb).fill(icon).join("")}</span>
                        <span className="text-xs text-green-700 font-semibold">
                          +{nb} {nb > 1 ? typeLabelPluriel : typeLabel}
                        </span>
                      </div>
                      <div className="text-xs text-green-800 font-bold flex items-center gap-1">
                        <span className="text-green-500">→</span>
                        <span>+{caTotal} de chiffre d&apos;affaires</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sous-section Investissements & Décisions ─────────── */}
        {cartesAutresActives.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gray-100" />
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                📋 Investissements & Décisions
              </div>
              <div className="h-px flex-1 bg-gray-100" />
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
      {/* 6. Sélecteur de cartes Décision (étape 6)          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {etapeTour === 6 && showCartes && !activeStep && (
        <div className="space-y-4">

          {/* ── Section Recrutement — TOUJOURS visible à l'étape 6 ─── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-indigo-200" />
              <div className="text-sm font-bold text-indigo-700 uppercase tracking-wider whitespace-nowrap">
                🧑‍💼 Recrutement
              </div>
              <div className="h-px flex-1 bg-indigo-200" />
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2 mb-3 text-xs text-indigo-700 leading-relaxed">
              💡 <strong>Chaque trimestre, tu peux recruter un nouveau commercial.</strong>{" "}
              La prise de poste est effective au trimestre suivant — pas d'écriture ce trimestre.
            </div>

            {cartesRecrutement.length === 0 ? (
              <div className="text-center py-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-semibold">
                ✅ Tous les commerciaux disponibles sont déjà dans votre équipe !
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
          </div>

          {/* ── Section Investissements & Décisions ─────────────────── */}
          {cartesAutres.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  💡 Investissements & Décisions
                </div>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cartesAutres.map((c) => {
                  const dejaActive = joueur.cartesActives.some((a) => a.id === c.id);
                  return (
                    <div key={c.id} className="relative">
                      <div className={dejaActive ? "opacity-50 pointer-events-none" : ""}>
                        <CarteView
                          carte={c}
                          onClick={() =>
                            setSelectedDecision(
                              selectedDecision?.id === c.id ? null : c
                            )
                          }
                          selected={selectedDecision?.id === c.id}
                        />
                      </div>
                      {dejaActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                            ✅ Déjà active
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </main>
  );
}
