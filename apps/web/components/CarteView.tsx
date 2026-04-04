"use client";
import { CarteDecision, CarteClient, CarteEvenement, CarteCommercial } from "@jedevienspatron/game-engine";

type AnyCard = CarteDecision | CarteClient | CarteEvenement | CarteCommercial;

interface Props {
  carte: AnyCard;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

/** Labels lisibles pour les postes comptables */
const POSTE_LABELS: Record<string, string> = {
  tresorerie:              "Trésorerie",
  stocks:                  "Stocks",
  immobilisations:         "Immobilisations",
  creancesPlus1:           "Créances C+1",
  creancesPlus2:           "Créances C+2",
  capitaux:                "Capitaux propres",
  emprunts:                "Emprunts",
  dettes:                  "Dettes fourn.",
  servicesExterieurs:      "Services ext.",
  chargesPersonnel:        "Charges personnel",
  chargesInteret:          "Charges intérêt",
  dotationsAmortissements: "Dotations amort.",
  revenusExceptionnels:    "Revenus except.",
  chargesExceptionnelles:  "Charges except.",
  impotsTaxes:             "Impôts & taxes",
  produitsFinanciers:      "Produits financiers",
  ventes:                  "Ventes",
  achats:                  "Achats / CMV",
};

/** Labels lisibles pour les types de clients */
const CLIENT_LABELS: Record<string, string> = {
  particulier:  "client Particulier — paiement immédiat, Ventes +2",
  tpe:          "client TPE — paiement en C+1, Ventes +3",
  grand_compte: "client Grand Compte — paiement en C+2, Ventes +4",
};

/** Couleur de bordure par catégorie de carte Décision */
const CATEGORIE_COLORS: Record<string, string> = {
  commercial:    "#a78bfa",
  vehicule:      "#60a5fa",
  investissement:"#34d399",
  financement:   "#fbbf24",
  tactique:      "#f97316",
  service:       "#38bdf8",
  protection:    "#fb7185",
};

/** Couleur de bordure par type de carte */
const TYPE_COLORS: Record<string, string> = {
  commercial: "#a78bfa",
  client:     "#60a5fa",
  decision:   "#34d399",
  evenement:  "#f97316",
};

function formatDelta(delta: number): string {
  return delta >= 0 ? `+${delta}` : `${delta}`;
}

/** Postes où une hausse est une MAUVAISE nouvelle → rouge si positif */
const POSTES_COUT = new Set([
  "chargesPersonnel", "servicesExterieurs", "impotsTaxes",
  "chargesInteret", "chargesExceptionnelles", "dotationsAmortissements",
  "achats", "emprunts", "dettes", "dettesFiscales", "decouvert",
]);

/** Couleur dark-mode en fonction du sens économique réel */
function colorEffet(poste: string, delta: number): string {
  const estCout = POSTES_COUT.has(poste);
  const isPositive = estCout ? delta < 0 : delta > 0;
  return isPositive ? "text-emerald-400" : "text-red-400";
}

export default function CarteView({ carte, onClick, selected, disabled, compact }: Props) {
  const borderColor = carte.type === "decision"
    ? CATEGORIE_COLORS[(carte as CarteDecision).categorie] ?? "#ccc"
    : TYPE_COLORS[carte.type] ?? "#ccc";

  // Fond sombre légèrement teinté de la couleur de la carte
  const bgStyle = {
    borderColor,
    backgroundColor: `${borderColor}12`, // ~7 % opacité sur fond sombre
  };

  const isDecision   = carte.type === "decision";
  const isClient     = carte.type === "client";
  const isEvent      = carte.type === "evenement";
  const isCommercial = carte.type === "commercial";

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        rounded-xl border-2 p-3 transition-all text-sm select-none
        ${onClick && !disabled ? "cursor-pointer hover:shadow-lg hover:scale-105" : ""}
        ${selected ? "shadow-lg scale-105 ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900" : ""}
        ${disabled ? "opacity-40" : ""}
      `}
      style={bgStyle}
    >
      {/* ── Header : type / catégorie ── */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: borderColor }}>
          {isDecision    ? (carte as CarteDecision).categorie
           : isClient    ? "Client"
           : isEvent     ? "Événement"
           : isCommercial ? "Commercial"
           : (carte as CarteEvenement).type}
        </span>
        {isClient && (
          <span className="text-[10px] bg-gray-700 text-gray-200 rounded px-1.5 py-0.5 font-mono font-bold">
            D+{(carte as CarteClient).delaiPaiement}
          </span>
        )}
      </div>

      {/* ── Titre ── */}
      <div className="font-bold text-gray-100 mb-1.5 leading-tight">{carte.titre}</div>

      {!compact && (
        <>
          {/* Description textuelle (Décision + Événement) */}
          {(isDecision || isEvent) && (
            <p className="text-[11px] text-gray-400 mb-2 leading-snug">
              {(carte as CarteDecision | CarteEvenement).description}
            </p>
          )}

          {/* ── Carte Client ── */}
          {isClient && (
            <div className="space-y-0.5">
              <div className="text-xs text-gray-300">
                💰 Ventes : <strong className="text-emerald-400">+{(carte as CarteClient).montantVentes}</strong>
              </div>
              <div className="text-xs text-gray-400">
                {(carte as CarteClient).consommeStocks ? "📦 Consomme des stocks" : "🔧 Sans stocks"}
              </div>
            </div>
          )}

          {/* ── Carte Commercial (type = "commercial", pas decision) ── */}
          {isCommercial && (() => {
            const com = carte as CarteCommercial;
            const clientLabel = CLIENT_LABELS[com.typeClientRapporte] ?? com.typeClientRapporte;
            return (
              <div className="space-y-1">
                <div className="text-xs text-gray-300">
                  💼 Coût : <strong className="text-red-400">{com.coutChargesPersonnel}/trimestre</strong>
                </div>
                <div className="text-xs text-indigo-300 font-medium">
                  🤝 +{com.nbClientsParTour} {clientLabel} / trimestre
                </div>
                <div className="text-[10px] text-gray-500 italic">
                  Ce client génère une vente à chaque trimestre tant que la carte est active.
                </div>
              </div>
            );
          })()}

          {/* ── Carte Décision : effets + résumé ── */}
          {isDecision && (() => {
            const dec = carte as CarteDecision;
            const isCommercialDec = dec.categorie === "commercial";

            return (
              <div className="space-y-1.5">
                {/* Effets immédiats */}
                {dec.effetsImmédiats.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-500 mb-0.5 uppercase tracking-wide">
                      ⚡ Effets immédiats :
                    </div>
                    {dec.effetsImmédiats.map((e, i) => (
                      <div key={i} className={`text-xs font-mono ${colorEffet(e.poste, e.delta)}`}>
                        {POSTE_LABELS[e.poste] ?? e.poste} {formatDelta(e.delta)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Effets récurrents */}
                {dec.effetsRecurrents.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-500 mb-0.5 uppercase tracking-wide">
                      🔄 Par trimestre :
                    </div>
                    {dec.effetsRecurrents.map((e, i) => (
                      <div key={i} className={`text-xs font-mono ${colorEffet(e.poste, e.delta)}`}>
                        {POSTE_LABELS[e.poste] ?? e.poste} {formatDelta(e.delta)}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Résumé net : uniquement pour les cartes commerciales (catégorie commercial) ── */}
                {isCommercialDec && dec.clientParTour && (() => {
                  const clientType = dec.clientParTour!;
                  const nbClients  = dec.nbClientsParTour ?? 1;
                  const CLIENT_VENTES: Record<string, number> = { particulier: 2, tpe: 3, grand_compte: 4 };
                  const CLIENT_DELAI:  Record<string, number> = { particulier: 0, tpe: 1, grand_compte: 2 };
                  const montantVentes = CLIENT_VENTES[clientType] ?? 0;
                  const delai         = CLIENT_DELAI[clientType] ?? 0;
                  const salary        = dec.effetsRecurrents.find(e => e.poste === "chargesPersonnel")?.delta ?? 0;
                  const totalVentes   = nbClients * montantVentes;
                  const totalCMV      = nbClients * 1;
                  const resultatNet   = totalVentes - totalCMV - salary;
                  const tresoNet      = (delai === 0 ? totalVentes : 0) - salary;
                  const bfrLabel      = delai === 0
                    ? "Paiement immédiat — BFR nul"
                    : `Créances C+${delai} × ${nbClients} (+${totalVentes}) — surveiller le BFR !`;
                  const clientTypeLabel: Record<string, string> = {
                    particulier:  "client Particulier — paiement immédiat, Ventes +2",
                    tpe:          "client TPE — paiement en C+1, Ventes +3",
                    grand_compte: "client Grand Compte — paiement en C+2, Ventes +4",
                  };
                  return (
                    <div className="mt-1.5 pt-1.5 border-t border-gray-700">
                      <div className="text-xs text-indigo-300 font-semibold mb-1.5">
                        🤝 +{nbClients} {clientTypeLabel[clientType] ?? clientType} / trimestre
                      </div>
                      <div className="text-[10px] font-semibold text-indigo-300 mb-1 uppercase tracking-wide">
                        📊 Impact net / trimestre :
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center mb-1">
                        <div className="bg-indigo-950/40 border border-indigo-800/40 rounded p-1">
                          <div className="text-[9px] text-gray-500 uppercase">Résultat</div>
                          <div className={`text-sm font-black ${resultatNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {formatDelta(resultatNet)}
                          </div>
                        </div>
                        <div className="bg-indigo-950/40 border border-indigo-800/40 rounded p-1">
                          <div className="text-[9px] text-gray-500 uppercase">Tréso</div>
                          <div className={`text-sm font-black ${tresoNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {formatDelta(tresoNet)}
                          </div>
                        </div>
                        <div className="bg-indigo-950/40 border border-indigo-800/40 rounded p-1">
                          <div className="text-[9px] text-gray-500 uppercase">BFR</div>
                          <div className={`text-xs font-semibold ${delai > 0 ? "text-orange-400" : "text-emerald-400"}`}>
                            {delai === 0 ? "✓ Nul" : `⚠️ C+${delai}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 italic">{bfrLabel}</div>
                    </div>
                  );
                })()}

                {/* ── Effet client pour cartes investissement / véhicule / etc. ── */}
                {!isCommercialDec && dec.clientParTour && (
                  <div className="mt-1 pt-1 border-t border-gray-700">
                    <div className="text-xs text-indigo-300 font-medium">
                      🤝 +{dec.nbClientsParTour ?? 1}{" "}
                      {CLIENT_LABELS[dec.clientParTour] ?? dec.clientParTour}
                      {" "}/ trimestre
                    </div>
                    <div className="text-[10px] text-gray-500 italic mt-0.5">
                      Ce client supplémentaire génère une vente à chaque trimestre tant que la carte est active.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Carte Événement : effets ── */}
          {isEvent && (carte as CarteEvenement).effets.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                Effets :
              </div>
              {(carte as CarteEvenement).effets.map((e, i) => (
                <div key={i} className={`text-xs font-mono ${colorEffet(e.poste, e.delta)}`}>
                  {POSTE_LABELS[e.poste] ?? e.poste} {formatDelta(e.delta)}
                </div>
              ))}
              {(carte as CarteEvenement).annulableParAssurance && (
                <div className="text-[10px] text-purple-400 mt-1">
                  🛡️ Annulable par assurance prévoyance
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
