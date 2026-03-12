"use client";

import { Joueur, CarteDecision } from "@/lib/game-engine/types";
import { getTresorerie } from "@/lib/game-engine/calculators";
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
}: MainContentProps) {
  // Séparation des cartes disponibles (sélecteur étape 6)
  const cartesRecrutement = cartesDisponibles.filter(
    (c) => c.categorie === "commercial"
  );
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
      {/* 3. Contenu de l'onglet actif                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div>
        {activeTab === "bilan" && (
          <BilanPanel joueur={displayJoueur} highlightedPoste={highlightedPoste} />
        )}
        {activeTab === "cr" && (
          <CompteResultatPanel
            joueur={displayJoueur}
            highlightedPoste={highlightedPoste}
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
              l&apos;étape 6 🎯 : Junior (+2 Particuliers/trim), Senior (+1
              TPE/trim), Directrice (+1 Grand Compte/trim).
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cartesCommerciales.map((c) => {
                const icon =
                  c.clientParTour === "particulier"
                    ? "👤"
                    : c.clientParTour === "tpe"
                      ? "🏠"
                      : "🏢";
                const nb = c.nbClientsParTour ?? 1;
                const col =
                  c.clientParTour === "particulier"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : c.clientParTour === "tpe"
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-purple-50 border-purple-200 text-purple-800";
                const typeLabel =
                  c.clientParTour === "particulier"
                    ? "Particulier"
                    : c.clientParTour === "tpe"
                      ? "TPE"
                      : "Grand Compte";
                const montant = MONTANT_PAR_TYPE[c.clientParTour ?? ""] ?? 1;
                return (
                  <div
                    key={c.id}
                    className={`border-2 rounded-xl px-3 py-2.5 flex flex-col gap-1 min-w-[110px] ${col}`}
                  >
                    <div className="font-bold text-sm leading-tight">{c.titre}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-lg">{Array(nb).fill(icon).join("")}</span>
                      <div className="text-xs font-semibold leading-tight">
                        <span className="font-black">{nb}×</span> {typeLabel}
                        <br />
                        <span className="opacity-70">+{montant * nb} CA / trim</span>
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

          {/* ── Section Recrutement ─────────────────────────────────── */}
          {cartesRecrutement.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-indigo-200" />
                <div className="text-sm font-bold text-indigo-700 uppercase tracking-wider whitespace-nowrap">
                  🧑‍💼 Recrutement
                </div>
                <div className="h-px flex-1 bg-indigo-200" />
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2 mb-3 text-xs text-indigo-700 leading-relaxed">
                💡 <strong>Effet différé :</strong> le recrutement est immédiat mais la prise de poste n'est effective qu'au <strong>trimestre suivant</strong>. Aucune écriture ce trimestre.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cartesRecrutement.map((c) => {
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
