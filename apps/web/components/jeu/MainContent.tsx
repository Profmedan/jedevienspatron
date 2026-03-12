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
  // Séparation des cartes disponibles
  const cartesRecrutement = cartesDisponibles.filter(
    (c) => c.categorie === "commercial"
  );
  const cartesAutres = cartesDisponibles.filter(
    (c) => c.categorie !== "commercial"
  );

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
      {/* 4. Portefeuille Commerciaux & Clients              */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {(() => {
        const sources = joueur.cartesActives.filter((c) => c.clientParTour);
        const clientsEnAttente = joueur.clientsATrait;

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* En-tête */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                👥 Commerciaux & Clients
              </div>
              {clientsEnAttente.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                  ⏳ {clientsEnAttente.length} client
                  {clientsEnAttente.length > 1 ? "s" : ""} à traiter
                </span>
              )}
            </div>

            <div className="p-3">
              {sources.length === 0 ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
                  <strong>Aucun commercial actif !</strong> Vous obtenez{" "}
                  <strong>0 client par trimestre</strong>. Recrutez via une{" "}
                  <span className="text-indigo-600 font-bold">Carte Décision</span> à
                  l&apos;étape 6 🎯 : Junior (+2 Particuliers/trim), Senior (+1
                  TPE/trim), Directrice (+1 Grand Compte/trim).
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sources.map((c) => {
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
                        className={`border-2 rounded-xl px-3 py-2.5 flex flex-col gap-1 min-w-[100px] ${col}`}
                      >
                        <div className="text-xs font-bold uppercase tracking-wide opacity-60">
                          🧑‍💼 Commercial
                        </div>
                        <div className="font-bold text-sm leading-tight">{c.titre}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xl">
                            {Array(nb).fill(icon).join("")}
                          </span>
                          <div className="text-xs font-semibold leading-tight">
                            <span className="font-black text-base">{nb}×</span>{" "}
                            {typeLabel}
                            <br />
                            <span className="opacity-70">
                              +{montant * nb} CA / trim
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* File d'attente clients ce trimestre */}
              {clientsEnAttente.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    📋 File clients ce trimestre (étape 4)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {clientsEnAttente.map((c, i) => {
                      const colCl =
                        c.delaiPaiement === 0
                          ? "bg-green-50 border-green-300 text-green-800"
                          : c.delaiPaiement === 1
                            ? "bg-blue-50 border-blue-300 text-blue-800"
                            : "bg-purple-50 border-purple-300 text-purple-800";
                      const ic =
                        c.id === "client-particulier"
                          ? "👤"
                          : c.id === "client-tpe"
                            ? "🏠"
                            : "🏢";
                      const dl =
                        c.delaiPaiement === 0
                          ? "💵 immédiat"
                          : c.delaiPaiement === 1
                            ? "⏰ C+1"
                            : "⏰⏰ C+2";

                      return (
                        <div
                          key={i}
                          className={`border-2 rounded-xl px-3 py-2 flex flex-col items-center gap-0.5 text-xs font-semibold ${colCl}`}
                        >
                          <span className="text-2xl">{ic}</span>
                          <span>{c.titre}</span>
                          <span className="font-black text-base">
                            +{c.montantVentes}{" "}
                            <span className="text-xs font-normal opacity-70">CA</span>
                          </span>
                          <span className="opacity-70 text-center">{dl}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 5. Cartes actives                                  */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {joueur.cartesActives.length > 0 && (
        <div>
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
            🎴 Cartes actives
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {joueur.cartesActives.map((c) => (
              <div key={c.id}>
                <CarteView carte={c} compact />
                {c.clientParTour && (
                  <div
                    className={`mt-1 text-xs text-center rounded-lg py-0.5 px-1 font-semibold ${
                      c.clientParTour === "particulier"
                        ? "bg-green-100 text-green-700"
                        : c.clientParTour === "tpe"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {c.clientParTour === "particulier"
                      ? "→ 👤 Particulier/tour"
                      : c.clientParTour === "tpe"
                        ? "→ 🏠 TPE/tour"
                        : "→ 🏢 Grand Compte/tour"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
