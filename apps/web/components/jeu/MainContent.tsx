"use client";

import { Joueur, CarteDecision } from "@/lib/game-engine/types";
import { getTresorerie } from "@/lib/game-engine/calculators";
import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import IndicateursPanel from "@/components/IndicateursPanel";
import { GlossairePanel } from "@/components/GlossairePanel";
import CarteView from "@/components/CarteView";

type TabType = "bilan" | "cr" | "indicateurs" | "glossaire";

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
}

const TABS: Array<[TabType, string]> = [
  ["bilan", "📋 Bilan"],
  ["cr", "📈 Compte de résultat"],
  ["indicateurs", "📊 Indicateurs"],
  ["glossaire", "📖 Glossaire"],
];

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

      {/* ── Bandeau récapitulatif des modifications (persistant pendant la saisie) ── */}
      {activeStep && recentModifications && recentModifications.length > 0 && (
        <div className="rounded-xl border-2 border-amber-600 bg-amber-950/30 px-3 py-2.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1.5 flex items-center gap-1.5">
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
                      ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
                      : "bg-red-900/40 text-red-300 border-red-700"
                  }`}
                >
                  <span>{POSTE_LABELS[mod.poste] ?? mod.poste}</span>
                  <span className="opacity-60 line-through text-[10px] tabular-nums">{mod.ancienneValeur}</span>
                  <span className="text-[10px]">→</span>
                  <span className="font-black tabular-nums">{mod.nouvelleValeur}</span>
                  <span className={`text-[10px] font-bold ml-0.5 ${bon ? "text-emerald-400" : "text-red-400"}`}>
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
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-indigo-900/50" />
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider whitespace-nowrap">
              🧑‍💼 Commerciaux
            </div>
            <div className="h-px flex-1 bg-indigo-900/50" />
          </div>

          {cartesCommerciales.length === 0 ? (
            <div className="rounded-xl bg-amber-950/30 border border-amber-700 p-3 text-xs text-amber-300 leading-relaxed">
              <strong>Aucun commercial actif.</strong> Recrutez via une{" "}
              <span className="text-indigo-600 font-bold">Carte Décision</span> à
              l&apos;étape 6 🎯 : Junior (2 particuliers/trim),
              Senior (2 TPE/trim), Directrice (2 grands comptes/trim).
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
                    className={`border-2 ${borderCol} rounded-xl overflow-hidden bg-gray-900 min-w-[170px] shadow-md`}
                  >
                    {/* ── En-tête : titre du commercial ── */}
                    <div className={`${headerBg} text-white px-3 py-2 flex items-center gap-1.5`}>
                      <span className="text-base">🧑‍💼</span>
                      <span className="font-bold text-sm leading-tight">{c.titre}</span>
                    </div>

                    {/* ── Coûts récurrents (rouge) ── */}
                    <div className="px-3 py-2 border-b border-gray-700/60 bg-red-950/20">
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
                    <div className="px-3 py-2 border-b border-gray-700/60 bg-emerald-950/20">
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
                    <div className="px-3 py-2 bg-indigo-950/30">
                      <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide mb-1.5">
                        📊 Impact net / trimestre
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center">
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
          )}
        </div>

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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 6. Sélecteur de cartes Décision (étape 6)          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {etapeTour === 6 && showCartes && !activeStep && (
        <div className="space-y-4">

          {/* Badge de progression 6a/6b */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-3 py-1 rounded-full font-bold border ${
              subEtape6 === "recrutement"
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-gray-800 text-gray-500 border-gray-700"
            }`}>
              6a 🧑‍💼 Recrutement
            </span>
            <span className="text-gray-600">→</span>
            <span className={`px-3 py-1 rounded-full font-bold border ${
              subEtape6 === "investissement"
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-gray-800 text-gray-500 border-gray-700"
            }`}>
              6b 💡 Investissement
            </span>
          </div>

          {/* ── Section Recrutement — visible si subEtape6 === "recrutement" ─── */}
          {subEtape6 === "recrutement" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-indigo-900/50" />
              <div className="text-sm font-bold text-indigo-400 uppercase tracking-wider whitespace-nowrap">
                🧑‍💼 Recrutement
              </div>
              <div className="h-px flex-1 bg-indigo-900/50" />
            </div>
            <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-xl p-2 mb-3 text-xs text-indigo-300 leading-relaxed">
              💡 <strong>Chaque trimestre, tu peux recruter un nouveau commercial.</strong>{" "}
              La prise de poste est effective au trimestre suivant — pas d'écriture ce trimestre.
            </div>

            {cartesRecrutement.length === 0 ? (
              <div className="text-center py-4 bg-green-950/30 border border-green-800/50 rounded-xl text-sm text-green-300 font-semibold">
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
          )}

          {/* ── Section Investissements & Décisions — visible si subEtape6 === "investissement" ─────────────────── */}
          {subEtape6 === "investissement" && cartesAutres.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gray-700" />
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  💡 Investissements & Décisions
                </div>
                <div className="h-px flex-1 bg-gray-700" />
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
