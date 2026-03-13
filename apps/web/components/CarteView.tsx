"use client";
import { CarteDecision, CarteClient, CarteEvenement, CarteCommercial } from "@/lib/game-engine/types";

type AnyCard = CarteDecision | CarteClient | CarteEvenement | CarteCommercial;

interface Props {
  carte: AnyCard;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

/** Labels lisibles pour les postes comptables (remplace les noms bruts) */
const POSTE_LABELS: Record<string, string> = {
  tresorerie: "Trésorerie",
  stocks: "Stocks",
  immobilisations: "Autres Immos",
  creancesPlus1: "Créances C+1",
  creancesPlus2: "Créances C+2",
  capitaux: "Capitaux propres",
  emprunts: "Emprunts",
  dettes: "Dettes fourn.",
  servicesExterieurs: "Services ext.",
  chargesPersonnel: "Charges personnel",
  chargesInteret: "Charges intérêt",
  dotationsAmortissements: "Dotations amort.",
  revenusExceptionnels: "Revenus except.",
  ventes: "Ventes",
};

/** Labels lisibles pour les types de clients */
const CLIENT_LABELS: Record<string, string> = {
  particulier: "Particulier (tréso +2)",
  tpe: "TPE (créance C+1 +3)",
  grand_compte: "Grand Compte (créance C+2 +4)",
};

const CATEGORIE_COLORS: Record<string, string> = {
  commercial: "#a78bfa",
  vehicule: "#60a5fa",
  investissement: "#34d399",
  financement: "#fbbf24",
  tactique: "#f97316",
  service: "#38bdf8",
  protection: "#fb7185",
};

const TYPE_COLORS: Record<string, string> = {
  commercial: "#a78bfa",
  client: "#60a5fa",
  decision: "#34d399",
  evenement: "#f97316",
};

function formatDelta(delta: number): string {
  return delta >= 0 ? `+${delta}` : `${delta}`;
}

/** Postes où une hausse est une MAUVAISE nouvelle (charges, dettes) → affichés en rouge si positif */
const POSTES_COUT = new Set([
  "chargesPersonnel", "servicesExterieurs", "impotsTaxes",
  "chargesInteret", "chargesExceptionnelles", "dotationsAmortissements",
  "achats", "emprunts", "dettes", "dettesFiscales", "decouvert",
]);

/** Retourne la classe CSS de couleur en fonction du sens économique réel (pas juste le signe) */
function colorEffet(poste: string, delta: number): string {
  const estCout = POSTES_COUT.has(poste);
  const isPositive = estCout ? delta < 0 : delta > 0; // hausse d'une charge = mauvais
  return isPositive ? "text-emerald-700" : "text-red-700";
}

export default function CarteView({ carte, onClick, selected, disabled, compact }: Props) {
  const borderColor = carte.type === "decision"
    ? CATEGORIE_COLORS[(carte as CarteDecision).categorie] ?? "#ccc"
    : TYPE_COLORS[carte.type] ?? "#ccc";

  const bgColor = `${borderColor}15`;

  const isDecision = carte.type === "decision";
  const isClient = carte.type === "client";
  const isEvent = carte.type === "evenement";
  const isCommercial = carte.type === "commercial";

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`rounded-xl border-2 p-3 transition-all text-sm select-none ${onClick && !disabled ? "cursor-pointer hover:shadow-md hover:scale-105" : ""} ${selected ? "shadow-lg scale-105 ring-2 ring-offset-1" : ""} ${disabled ? "opacity-40" : ""}`}
      style={{
        borderColor,
        backgroundColor: bgColor,

      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: borderColor }}>
          {isDecision ? (carte as CarteDecision).categorie
            : isClient ? "Client"
            : isEvent ? "Événement"
            : isCommercial ? "Commercial"
            : (carte as CarteEvenement).type}
        </span>
        {isClient && (
          <span className="text-xs bg-white rounded px-1 font-mono">
            D+{(carte as CarteClient).delaiPaiement}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="font-bold text-gray-800 mb-1 leading-tight">{carte.titre}</div>

      {!compact && (
        <>
          {/* Description */}
          {(isDecision || isEvent) && (
            <p className="text-xs text-gray-500 mb-2 leading-snug">
              {(carte as CarteDecision | CarteEvenement).description}
            </p>
          )}

          {/* Client details */}
          {isClient && (
            <div className="space-y-0.5">
              <div className="text-xs text-gray-600">
                💰 Ventes : <strong>+{(carte as CarteClient).montantVentes}</strong>
              </div>
              <div className="text-xs text-gray-600">
                {(carte as CarteClient).consommeStocks ? "📦 Consomme des stocks" : "🔧 Sans stocks"}
              </div>
            </div>
          )}

          {/* Commercial details */}
          {isCommercial && (
            <div className="space-y-0.5">
              <div className="text-xs text-gray-600">
                💼 Coût : <strong>{(carte as CarteCommercial).coutChargesPersonnel}/tour</strong>
              </div>
              <div className="text-xs text-gray-600">
                🎯 Rapporte : <strong>{(carte as CarteCommercial).nbClientsParTour} {(carte as CarteCommercial).typeClientRapporte}</strong>/tour
              </div>
            </div>
          )}

          {/* Decision effects */}
          {isDecision && (
            <div className="space-y-1">
              {(carte as CarteDecision).effetsImmédiats.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-0.5">⚡ Effets immédiats :</div>
                  {(carte as CarteDecision).effetsImmédiats.map((e, i) => (
                    <div key={i} className={`text-xs font-mono ${colorEffet(e.poste, e.delta)}`}>
                      {POSTE_LABELS[e.poste] ?? e.poste} {formatDelta(e.delta)}
                    </div>
                  ))}
                </div>
              )}
              {(carte as CarteDecision).effetsRecurrents.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-0.5">🔄 Par trimestre :</div>
                  {(carte as CarteDecision).effetsRecurrents.map((e, i) => (
                    <div key={i} className={`text-xs font-mono ${colorEffet(e.poste, e.delta)}`}>
                      {POSTE_LABELS[e.poste] ?? e.poste} {formatDelta(e.delta)}
                    </div>
                  ))}
                </div>
              )}
              {/* Résumé net pour cartes commerciales */}
              {(carte as CarteDecision).clientParTour && (() => {
                const dec = carte as CarteDecision;
                const clientType = dec.clientParTour!;
                const nbClients = dec.nbClientsParTour ?? 1;
                const CLIENT_VENTES: Record<string, number> = { particulier: 2, tpe: 3, grand_compte: 4 };
                const CLIENT_DELAI: Record<string, number>  = { particulier: 0, tpe: 1, grand_compte: 2 };
                const montantVentes = CLIENT_VENTES[clientType] ?? 0;
                const delai = CLIENT_DELAI[clientType] ?? 0;
                const salary = dec.effetsRecurrents.find(e => e.poste === "chargesPersonnel")?.delta ?? 0;
                const totalVentes = nbClients * montantVentes;
                const totalCMV    = nbClients * 1;
                const resultatNet = totalVentes - totalCMV - salary;
                const tresoNet    = (delai === 0 ? totalVentes : 0) - salary;
                const bfrLabel    = delai === 0
                  ? "Aucun (paiement immédiat)"
                  : `Créances C+${delai} × ${nbClients} (+${totalVentes})`;
                return (
                  <div className="mt-1 pt-1 border-t border-gray-200">
                    <div className="text-xs font-semibold text-indigo-600 mb-1">📊 Impact net / trimestre :</div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div className="bg-indigo-50 rounded p-1">
                        <div className="text-xs text-gray-500">Résultat</div>
                        <div className={`text-sm font-black ${resultatNet >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {formatDelta(resultatNet)}
                        </div>
                      </div>
                      <div className="bg-indigo-50 rounded p-1">
                        <div className="text-xs text-gray-500">Tréso</div>
                        <div className={`text-sm font-black ${tresoNet >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {formatDelta(tresoNet)}
                        </div>
                      </div>
                      <div className="bg-indigo-50 rounded p-1">
                        <div className="text-xs text-gray-500">BFR</div>
                        <div className={`text-xs font-semibold ${delai > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                          {delai === 0 ? "✓ Aucun" : `⚠️ C+${delai}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 italic">{bfrLabel}</div>
                  </div>
                );
              })()}
              {/* Chaîne de valeur pour les cartes NON commerciales (investissements) */}
              {(carte as CarteDecision).clientParTour && (carte as CarteDecision).categorie !== "commercial" && (
                <div className="mt-1">
                  <div className="text-xs text-indigo-700 font-medium">
                    🤝 +{(carte as CarteDecision).nbClientsParTour ?? 1}{" "}
                    {CLIENT_LABELS[(carte as CarteDecision).clientParTour!] ?? (carte as CarteDecision).clientParTour}
                    /trim → ventes ↑ → stocks ↑
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event effects */}
          {isEvent && (carte as CarteEvenement).effets.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-0.5">Effets :</div>
              {(carte as CarteEvenement).effets.map((e, i) => (
                <div key={i} className="text-xs font-mono text-gray-700">
                  {e.poste} {formatDelta(e.delta)}
                </div>
              ))}
              {(carte as CarteEvenement).annulableParAssurance && (
                <div className="text-xs text-purple-500 mt-1">🛡️ Annulable par assurance prévoyance</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
