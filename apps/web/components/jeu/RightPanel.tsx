"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

import { Joueur } from "@jedevienspatron/game-engine";
import IndicateursPanel from "@/components/IndicateursPanel";
import { GlossairePanel } from "@/components/GlossairePanel";

type RightPanelTab = "cartes" | "indicateurs" | "glossaire" | "analyse" | "progression" | "resume" | "bilan" | "cr";

interface RightPanelProps {
  joueur: Joueur;
  ca: number;
  marge: number;
  ebe: number;
  resultatNet: number;
  tresorerie: number;
  bfr: number;
  fondsRoulement: number;
  solvabilite: number;
  highlightedPoste?: string | null;
  activeTab?: string | null;
  setActiveTab?: (tab: RightPanelTab) => void;
}

const amountFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatAmount(value: number): string {
  return amountFormatter.format(value);
}

function getValueToneClass(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

function getSolvabilityColor(solvabilite: number): string {
  if (solvabilite >= 50) return "text-emerald-400";
  if (solvabilite >= 30) return "text-yellow-400";
  return "text-red-400";
}

const RightPanel: React.FC<RightPanelProps> = ({
  joueur,
  ca,
  marge,
  ebe,
  resultatNet,
  tresorerie,
  bfr,
  fondsRoulement,
  solvabilite,
  highlightedPoste: _highlightedPoste,
  activeTab,
  setActiveTab,
}) => {
  const [localTab, setLocalTab] = useState<RightPanelTab>("cartes");

  // Map old tab names to new ones
  const mapTabName = (tab?: string | null): RightPanelTab => {
    if (!tab) return localTab;
    if (tab === "resume" || tab === "bilan" || tab === "cr") return "cartes";
    return tab as RightPanelTab;
  };

  const currentTab = mapTabName(activeTab);
  const handleTabChange = (tab: RightPanelTab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      setLocalTab(tab);
    }
  };

  const kpis = [
    { label: "CA", value: ca },
    { label: "Résultat", value: resultatNet },
    { label: "Trésorerie", value: tresorerie },
    { label: "BFR", value: bfr },
    { label: "FR", value: fondsRoulement },
    { label: "Solvab.", value: solvabilite, isPercent: true },
  ];

  // Tab definitions
  const tabs: Array<{ id: RightPanelTab; icon: string; label: string }> = [
    { id: "cartes", icon: "🃏", label: "Cartes" },
    { id: "indicateurs", icon: "📊", label: "Indicateurs" },
    { id: "glossaire", icon: "📖", label: "Glossaire" },
    { id: "analyse", icon: "💡", label: "Analyse" },
    { id: "progression", icon: "📈", label: "Progression" },
  ];

  // Compute card stats
  const cartesCommerciales = joueur.cartesActives.filter((c) =>
    c.categorie === "commercial"
  );
  const countByType = {
    junior: cartesCommerciales.filter((c) => c.titre.includes("Junior")).length,
    senior: cartesCommerciales.filter((c) => c.titre.includes("Senior")).length,
    directeur: cartesCommerciales.filter(
      (c) => c.titre.includes("Directeur") || c.titre.includes("Directrice")
    ).length,
  };
  const totalCommercials = countByType.junior + countByType.senior + countByType.directeur;
  const autresCartes = joueur.cartesActives.filter((c) =>
    c.categorie !== "commercial"
  );

  // Compute clients per tour per commercial type
  const clientsParTourParType = {
    junior: cartesCommerciales
      .filter((c) => c.titre.includes("Junior"))
      .reduce((sum, c) => sum + (c.nbClientsParTour ?? 1), 0),
    senior: cartesCommerciales
      .filter((c) => c.titre.includes("Senior"))
      .reduce((sum, c) => sum + (c.nbClientsParTour ?? 1), 0),
    directeur: cartesCommerciales
      .filter((c) => c.titre.includes("Directeur") || c.titre.includes("Directrice"))
      .reduce((sum, c) => sum + (c.nbClientsParTour ?? 1), 0),
  };

  // Compute expected clients for next tour (for empty clientsATrait display)
  const clientsAttendusProchainTour = {
    particulier: 0,
    tpe: 0,
    grand_compte: 0,
  };
  cartesCommerciales.forEach((c) => {
    const nbClients = c.nbClientsParTour ?? 1;
    if (c.clientParTour === "particulier") {
      clientsAttendusProchainTour.particulier += nbClients;
    } else if (c.clientParTour === "tpe") {
      clientsAttendusProchainTour.tpe += nbClients;
    } else if (c.clientParTour === "grand_compte") {
      clientsAttendusProchainTour.grand_compte += nbClients;
    }
  });
  // Bonus pour Azura Commerce
  if (joueur.entreprise.clientGratuitParTour) {
    clientsAttendusProchainTour.particulier += 1;
  }
  const totalClientsAttendus =
    clientsAttendusProchainTour.particulier +
    clientsAttendusProchainTour.tpe +
    clientsAttendusProchainTour.grand_compte;

  // Render tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case "cartes":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 text-xs text-gray-300"
          >
            <div>
              <h3 className="font-semibold text-emerald-400 mb-2">Commerciaux actifs</h3>
              <div className="space-y-1 bg-gray-900/40 rounded-lg p-2">
                <div>🧑‍💼 Junior × {countByType.junior} ({clientsParTourParType.junior} particulier{clientsParTourParType.junior > 1 ? "s" : ""}/tour)</div>
                <div>👔 Senior × {countByType.senior} ({clientsParTourParType.senior} TPE/tour{clientsParTourParType.senior > 1 ? "s" : ""})</div>
                <div>👑 Directeur × {countByType.directeur} ({clientsParTourParType.directeur} grand{clientsParTourParType.directeur > 1 ? "s" : ""} compte{clientsParTourParType.directeur > 1 ? "s" : ""}/tour)</div>
                <div className="border-t border-gray-700 mt-2 pt-2 font-medium">
                  Total: {totalCommercials} commercial{totalCommercials > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div>
              {joueur.clientsATrait.length > 0 ? (
                <>
                  <h3 className="font-semibold text-yellow-400 mb-2">
                    Clients à traiter ({joueur.clientsATrait.length})
                  </h3>
                  <div className="space-y-1 bg-gray-900/40 rounded-lg p-2">
                    {joueur.clientsATrait.map((client, idx) => (
                      <div key={idx}>
                        {client.titre}{" "}
                        {client.delaiPaiement === 0 && "(paiement immédiat)"}
                        {client.delaiPaiement === 1 && "(paiement C+1)"}
                        {client.delaiPaiement === 2 && "(paiement C+2)"}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-blue-400 mb-2">
                    Clients attendus au prochain tour
                  </h3>
                  {totalClientsAttendus > 0 ? (
                    <div className="space-y-1 bg-gray-900/40 rounded-lg p-2 text-gray-300">
                      <div className="text-sm font-medium mb-2">Total : {totalClientsAttendus} client{totalClientsAttendus > 1 ? "s" : ""}</div>
                      {clientsAttendusProchainTour.particulier > 0 && (
                        <div className="text-xs">→ {clientsAttendusProchainTour.particulier} Particulier{clientsAttendusProchainTour.particulier > 1 ? "s" : ""}</div>
                      )}
                      {clientsAttendusProchainTour.tpe > 0 && (
                        <div className="text-xs">→ {clientsAttendusProchainTour.tpe} TPE</div>
                      )}
                      {clientsAttendusProchainTour.grand_compte > 0 && (
                        <div className="text-xs">→ {clientsAttendusProchainTour.grand_compte} Grand Compte{clientsAttendusProchainTour.grand_compte > 1 ? "s" : ""}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">Aucun client attendu — embauchez des commerciaux</div>
                  )}
                </>
              )}
            </div>

            {autresCartes.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Autres cartes actives</h3>
                <div className="space-y-1 bg-gray-900/40 rounded-lg p-2">
                  {autresCartes.map((carte) => (
                    <div key={carte.id}>{carte.titre}</div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );

      case "indicateurs":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            <IndicateursPanel joueur={joueur} />
          </motion.div>
        );

      case "glossaire":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            <GlossairePanel />
          </motion.div>
        );

      case "analyse":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 text-xs text-gray-300"
          >
            {tresorerie < 0 && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-2">
                <div className="font-semibold text-red-300">⚠️ Trésorerie négative</div>
                <div className="text-gray-400 mt-1">
                  Risque de découvert. Encaissez rapidement ou réduisez les charges.
                </div>
              </div>
            )}
            {bfr > fondsRoulement && (
              <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg p-2">
                <div className="font-semibold text-yellow-300">⚠️ BFR &gt; FR</div>
                <div className="text-gray-400 mt-1">
                  Tension de trésorerie. Réduisez les délais de paiement clients.
                </div>
              </div>
            )}
            {solvabilite < 30 && (
              <div className="bg-orange-950/30 border border-orange-800/40 rounded-lg p-2">
                <div className="font-semibold text-orange-300">⚠️ Solvabilité faible</div>
                <div className="text-gray-400 mt-1">
                  Situation fragile face aux chocs. Consolidez vos capitaux propres.
                </div>
              </div>
            )}
            {resultatNet < 0 && (
              <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2">
                <div className="font-semibold text-blue-300">💡 Résultat négatif</div>
                <div className="text-gray-400 mt-1">
                  Les charges dépassent les produits. Augmentez ventes ou réduisez coûts.
                </div>
              </div>
            )}
            {tresorerie >= 0 &&
              bfr <= fondsRoulement &&
              solvabilite >= 30 &&
              resultatNet >= 0 && (
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2">
                  <div className="font-semibold text-emerald-300">✅ Situation saine</div>
                  <div className="text-gray-400 mt-1">
                    Continue sur cette lancée. Maintenez l’équilibre et investissez stratégiquement.
                  </div>
                </div>
              )}
          </motion.div>
        );

      case "progression":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 text-xs text-gray-300"
          >
            <ProgressBar label="CA" value={ca} max={Math.max(ca, 100)} />
            <ProgressBar
              label="Résultat"
              value={resultatNet}
              max={Math.max(Math.abs(resultatNet), 50)}
            />
            <ProgressBar
              label="Trésorerie"
              value={tresorerie}
              max={Math.max(Math.abs(tresorerie), 50)}
            />
            <ProgressBar label="BFR" value={bfr} max={Math.max(bfr, 50)} />
            <ProgressBar label="FR" value={fondsRoulement} max={Math.max(fondsRoulement, 50)} />
            <ProgressBar label="Solvabilité" value={solvabilite} max={100} isPercent />
            <ProgressBar label="Marge" value={marge} max={Math.max(Math.abs(marge), 50)} />
            <ProgressBar label="EBE" value={ebe} max={Math.max(Math.abs(ebe), 50)} />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-gray-700 bg-gray-950 p-4 shadow-lg">
      {/* Window 1: INDICATEURS CLÉS (always visible) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0"
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Indicateurs clés
        </p>
        <div className="grid grid-cols-3 gap-2">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-gray-800/50 bg-gray-900/50 px-2.5 py-2"
            >
              <p className="text-[10px] font-medium text-gray-400">{kpi.label}</p>
              <motion.p
                key={`${kpi.label}-${kpi.value}`}
                className={`text-sm font-semibold tabular-nums ${
                  kpi.isPercent
                    ? getSolvabilityColor(kpi.value)
                    : getValueToneClass(kpi.value)
                }`}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {kpi.isPercent ? `${formatAmount(kpi.value)}%` : `${formatAmount(kpi.value)} €`}
              </motion.p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Window 2: Tabbed content (secondary) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-1 flex-col overflow-hidden"
      >
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-800 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`whitespace-nowrap text-xs font-medium transition-colors px-2 py-1 rounded-t-lg ${
                currentTab === tab.id
                  ? "border-b-2 border-emerald-500 text-emerald-400 bg-gray-800/50"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-3 flex-1 overflow-y-auto">{renderTabContent()}</div>
      </motion.div>
    </div>
  );
};

function ProgressBar({
  label,
  value,
  max,
  isPercent,
}: {
  label: string;
  value: number;
  max: number;
  isPercent?: boolean;
}) {
  const percentage = Math.min(Math.abs(value) / Math.max(max, 1), 1) * 100;
  const isNegative = value < 0;
  const barColor = value > 0 ? "bg-emerald-600" : value < 0 ? "bg-red-600" : "bg-gray-600";

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-left text-gray-400">{label}</span>
      <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="w-12 text-right text-gray-400">
        {isPercent ? `${formatAmount(value)}%` : `${formatAmount(value)} €`}
      </span>
    </div>
  );
}

export default RightPanel;
