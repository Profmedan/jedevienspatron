"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RightPanelProps {
  joueur: any;
  ca: number;
  marge: number;
  ebe: number;
  resultatNet: number;
  tresorerie: number;
  bfr: number;
  fondsRoulement: number;
  solvabilite: number;
  highlightedPoste?: string | null;
  activeTab: "resume" | "bilan" | "cr";
  setActiveTab: (tab: "resume" | "bilan" | "cr") => void;
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
  highlightedPoste,
  activeTab,
  setActiveTab,
}) => {
  // Utility: format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return `${value.toFixed(0)}`;
  };

  // Utility: determine color based on value (green positive, red negative)
  const getValueColor = (value: number): string => {
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-gray-300";
  };

  // Utility: determine color for gauges (0-100 scale, typically solvabilité)
  const getGaugeColor = (percentage: number): string => {
    if (percentage >= 50) return "bg-green-500";
    if (percentage >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Compute bilan totals from joueur
  const bilanTotals = useMemo(() => {
    // Extract actifs from nested structure
    const tresorerie = joueur?.bilan?.actifs?.find((a: any) => a.categorie === "tresorerie")?.valeur || 0;
    const stocks = joueur?.bilan?.actifs?.find((a: any) => a.categorie === "stocks")?.valeur || 0;
    const immobilisations = joueur?.bilan?.actifs?.find((a: any) => a.categorie === "immobilisations")?.valeur || 0;
    const creancesC1 = joueur?.bilan?.creancesPlus1 || 0;
    const creancesC2 = joueur?.bilan?.creancesPlus2 || 0;

    const actif = {
      tresorerie,
      stocks,
      immobilisations,
      creancesC1,
      creancesC2,
    };

    // Extract passifs from nested structure
    const capitaux = joueur?.bilan?.passifs?.find((p: any) => p.categorie === "capitaux")?.valeur || 0;
    const emprunts = joueur?.bilan?.passifs?.find((p: any) => p.categorie === "emprunts")?.valeur || 0;
    const dettesFournisseur = joueur?.bilan?.dettes || 0;

    const passif = {
      capitaux,
      emprunts,
      dettesFournisseur,
    };

    const totalActif = Object.values(actif).reduce((a, b) => a + b, 0);
    const totalPassif = Object.values(passif).reduce((a, b) => a + b, 0);

    return { actif, passif, totalActif, totalPassif };
  }, [joueur]);

  // Compute CR totals from joueur
  const crTotals = useMemo(() => {
    // Extract produits from nested structure
    const ventes = joueur?.compteResultat?.produits?.ventes || 0;
    const prodStockee = joueur?.compteResultat?.produits?.productionStockee || 0;
    const revExceptionnels = joueur?.compteResultat?.produits?.revenusExceptionnels || 0;

    const produits = {
      ventes,
      prodStockee,
      revExceptionnels,
    };

    // Extract charges from nested structure
    const achatsCMV = joueur?.compteResultat?.charges?.achats || 0;
    const servicesExt = joueur?.compteResultat?.charges?.servicesExterieurs || 0;
    const personnel = joueur?.compteResultat?.charges?.chargesPersonnel || 0;
    const amortissements = joueur?.compteResultat?.charges?.dotationsAmortissements || 0;
    const interetsEmprunts = joueur?.compteResultat?.charges?.chargesInteret || 0;
    const chargesExceptionnels = joueur?.compteResultat?.charges?.chargesExceptionnelles || 0;

    const charges = {
      achatsCMV,
      servicesExt,
      personnel,
      amortissements,
      interetsEmprunts,
      chargesExceptionnels,
    };

    const totalProduits = Object.values(produits).reduce((a, b) => a + b, 0);
    const totalCharges = Object.values(charges).reduce((a, b) => a + b, 0);

    return { produits, charges, totalProduits, totalCharges };
  }, [joueur]);

  // --- SCORE PRINCIPAL (Sticky)
  const scoreSection = (
    <motion.div
      className="sticky top-0 z-10 bg-gray-800 rounded-xl p-3 mb-1 shadow-lg border border-gray-700"
      layout
    >
      <div className="flex gap-4">
        {/* Résultat */}
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-semibold">📊 Résultat</p>
          <motion.p
            key={resultatNet}
            className={`text-lg font-bold ${getValueColor(resultatNet)}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatCurrency(resultatNet)}
          </motion.p>
        </div>

        {/* Trésorerie */}
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-semibold">💰 Trésorerie</p>
          <motion.p
            key={tresorerie}
            className={`text-lg font-bold ${getValueColor(tresorerie)}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatCurrency(tresorerie)}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );

  // --- SIG SIMPLIFIÉ (Resume tab main content)
  const sigSection = (
    <div className="space-y-1 mb-1">
      {[
        { label: "📊 CA", value: ca },
        { label: "📊 Marge comm.", value: marge },
        { label: "📊 EBE", value: ebe },
        { label: "📊 Résultat net", value: resultatNet },
        { label: "💰 Trésorerie", value: tresorerie },
      ].map((item, idx) => (
        <motion.div
          key={idx}
          className="bg-gray-800 rounded-lg px-2 py-1.5 flex justify-between items-center text-xs"
          layout
        >
          <span className="text-gray-300 font-medium">{item.label}</span>
          <motion.span
            className={`font-bold ${getValueColor(item.value)}`}
            key={item.value}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatCurrency(item.value)}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );

  // --- SANTÉ FINANCIÈRE (Resume tab)
  // Fonction pour déterminer la couleur du découvert
  const getDecouvertColor = (decouvert: number): string => {
    if (decouvert <= 2) return "text-gray-300"; // Pas d'alerte
    if (decouvert <= 4) return "text-yellow-400"; // Alerte jaune
    if (decouvert <= 6) return "text-orange-400"; // Alerte orange
    return "text-red-400"; // Alerte rouge (7+)
  };

  const getDecouvertBgClass = (decouvert: number): string => {
    if (decouvert <= 2) return "bg-gray-700";
    if (decouvert <= 4) return "bg-yellow-900/30";
    if (decouvert <= 6) return "bg-orange-900/30";
    return "bg-red-900/40";
  };

  const getDecouvertGaugeColor = (decouvert: number): string => {
    if (decouvert <= 2) return "bg-green-500";
    if (decouvert <= 4) return "bg-yellow-500";
    if (decouvert <= 6) return "bg-orange-500";
    return "bg-red-600";
  };

  const sante = (
    <div className="space-y-1 mb-1">
      {/* Découvert bancaire — affiché seulement si > 0 */}
      {joueur?.bilan?.decouvert > 0 && (
        <div className={`rounded-lg p-1.5 ${getDecouvertBgClass(joueur.bilan.decouvert)}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Découvert bancaire</span>
            <span className={`text-xs font-bold ${getDecouvertColor(joueur.bilan.decouvert)}`}>
              {joueur.bilan.decouvert}/8
            </span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={getDecouvertGaugeColor(joueur.bilan.decouvert)}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, (joueur.bilan.decouvert / 8) * 100)}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* BFR */}
      <div className="bg-gray-800 rounded-lg p-1.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">BFR</span>
          <span className={`text-xs font-bold ${getValueColor(bfr)}`}>
            {formatCurrency(bfr)}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={getGaugeColor(Math.max(0, Math.min(100, bfr / 10000 * 100)))}
            initial={{ width: 0 }}
            animate={{
              width: `${Math.max(0, Math.min(100, (bfr / 10000) * 100))}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Fonds de Roulement */}
      <div className="bg-gray-800 rounded-lg p-1.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Fonds roulement</span>
          <span className={`text-xs font-bold ${getValueColor(fondsRoulement)}`}>
            {formatCurrency(fondsRoulement)}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={getGaugeColor(Math.max(0, Math.min(100, fondsRoulement / 10000 * 100)))}
            initial={{ width: 0 }}
            animate={{
              width: `${Math.max(0, Math.min(100, (fondsRoulement / 10000) * 100))}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Solvabilité */}
      <div className="bg-gray-800 rounded-lg p-1.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Solvabilité</span>
          <span className={`text-xs font-bold ${getGaugeColor(solvabilite)}`}>
            {solvabilite.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={getGaugeColor(solvabilite)}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, solvabilite)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );

  // --- BILAN MINI-TAB
  const bilanContent = (
    <motion.div
      className="space-y-2 text-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* ACTIF */}
      <div className="bg-gray-800 rounded-lg p-1.5">
        <p className="text-gray-400 font-semibold mb-2">─── ACTIF ───</p>
        {[
          { label: "Trésorerie", value: bilanTotals.actif.tresorerie, key: "tresorerie" },
          { label: "Stocks", value: bilanTotals.actif.stocks, key: "stocks" },
          { label: "Immobilisations", value: bilanTotals.actif.immobilisations, key: "immobilisations" },
          { label: "Créances C+1", value: bilanTotals.actif.creancesC1, key: "creancesC1" },
          { label: "Créances C+2", value: bilanTotals.actif.creancesC2, key: "creancesC2" },
        ].map((item) => (
          <motion.div
            key={item.key}
            className={`flex justify-between py-1 px-1 rounded ${
              highlightedPoste === item.key ? "bg-blue-900 bg-opacity-50" : ""
            }`}
            layout
          >
            <span className="text-gray-300">{item.label}</span>
            <span className={`font-bold ${getValueColor(item.value)}`}>
              {formatCurrency(item.value)}
            </span>
          </motion.div>
        ))}
        <div className="border-t border-gray-600 my-1" />
        <div className="flex justify-between py-1 px-1 font-bold">
          <span className="text-gray-200">Total Actif</span>
          <span className="text-green-400">{formatCurrency(bilanTotals.totalActif)}</span>
        </div>
      </div>

      {/* PASSIF */}
      <div className="bg-gray-800 rounded-lg p-1.5">
        <p className="text-gray-400 font-semibold mb-2">─── PASSIF ───</p>
        {[
          { label: "Capitaux propres", value: bilanTotals.passif.capitaux, key: "capitaux" },
          { label: "Emprunts", value: bilanTotals.passif.emprunts, key: "emprunts" },
          { label: "Dettes fournisseur", value: bilanTotals.passif.dettesFournisseur, key: "dettes" },
        ].map((item) => (
          <motion.div
            key={item.key}
            className={`flex justify-between py-1 px-1 rounded ${
              highlightedPoste === item.key ? "bg-blue-900 bg-opacity-50" : ""
            }`}
            layout
          >
            <span className="text-gray-300">{item.label}</span>
            <span className={`font-bold ${getValueColor(item.value)}`}>
              {formatCurrency(item.value)}
            </span>
          </motion.div>
        ))}
        <div className="border-t border-gray-600 my-1" />
        <div className="flex justify-between py-1 px-1 font-bold">
          <span className="text-gray-200">Total Passif + Rés.</span>
          <span className="text-green-400">
            {formatCurrency(bilanTotals.totalPassif + resultatNet)}
          </span>
        </div>
      </div>
    </motion.div>
  );

  // --- CR MINI-TAB
  const crContent = (
    <motion.div
      className="space-y-2 text-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* PRODUITS */}
      <div className="bg-gray-800 rounded-lg p-1.5">
        <p className="text-gray-400 font-semibold mb-2">─── PRODUITS ───</p>
        {[
          { label: "Ventes", value: crTotals.produits.ventes, key: "ventes" },
          { label: "Prod. stockée", value: crTotals.produits.prodStockee, key: "prodStockee" },
          { label: "Rev. exceptionnels", value: crTotals.produits.revExceptionnels, key: "revExceptionnels" },
        ].map((item) => (
          <motion.div
            key={item.key}
            className={`flex justify-between py-1 px-1 rounded ${
              highlightedPoste === item.key ? "bg-blue-900 bg-opacity-50" : ""
            }`}
            layout
          >
            <span className="text-gray-300">{item.label}</span>
            <span className={`font-bold ${getValueColor(item.value)}`}>
              {formatCurrency(item.value)}
            </span>
          </motion.div>
        ))}
        <div className="border-t border-gray-600 my-1" />
        <div className="flex justify-between py-1 px-1 font-bold">
          <span className="text-gray-200">Total Produits</span>
          <span className="text-green-400">{formatCurrency(crTotals.totalProduits)}</span>
        </div>
      </div>

      {/* CHARGES */}
      <div className="bg-gray-800 rounded-lg p-1.5">
        <p className="text-gray-400 font-semibold mb-2">─── CHARGES ───</p>
        {[
          { label: "Achats/CMV", value: crTotals.charges.achatsCMV, key: "achatsCMV" },
          { label: "Services ext.", value: crTotals.charges.servicesExt, key: "servicesExt" },
          { label: "Personnel", value: crTotals.charges.personnel, key: "personnel" },
          { label: "Amortissements", value: crTotals.charges.amortissements, key: "amortissements" },
          { label: "Int. emprunts", value: crTotals.charges.interetsEmprunts, key: "interetsEmprunts" },
          { label: "Charges except.", value: crTotals.charges.chargesExceptionnels, key: "chargesExceptionnels" },
        ].map((item) => (
          <motion.div
            key={item.key}
            className={`flex justify-between py-1 px-1 rounded ${
              highlightedPoste === item.key ? "bg-blue-900 bg-opacity-50" : ""
            }`}
            layout
          >
            <span className="text-gray-300">{item.label}</span>
            <span className={`font-bold ${getValueColor(item.value)}`}>
              {formatCurrency(item.value)}
            </span>
          </motion.div>
        ))}
        <div className="border-t border-gray-600 my-1" />
        <div className="flex justify-between py-1 px-1 font-bold">
          <span className="text-gray-200">Total Charges</span>
          <span className="text-red-400">{formatCurrency(crTotals.totalCharges)}</span>
        </div>
      </div>

      {/* RÉSULTAT NET */}
      <div className="bg-gray-900 rounded-lg p-2 border border-gray-700">
        <div className="flex justify-between font-bold">
          <span className="text-gray-200">RÉSULTAT NET</span>
          <motion.span
            className={`text-lg ${getValueColor(resultatNet)}`}
            key={resultatNet}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatCurrency(resultatNet)}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );

  // --- TAB BUTTONS
  const tabButtons = (
    <div className="flex gap-0.5 mt-1 pt-1 border-t border-gray-700">
      {(["resume", "bilan", "cr"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
            activeTab === tab
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {tab === "resume" && "Résumé"}
          {tab === "bilan" && "Bilan"}
          {tab === "cr" && "CR"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-900 rounded-lg p-2">
      {/* Score principal */}
      {scoreSection}

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === "resume" && (
            <motion.div
              key="resume"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {sigSection}
              {sante}
            </motion.div>
          )}

          {activeTab === "bilan" && (
            <motion.div
              key="bilan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {bilanContent}
            </motion.div>
          )}

          {activeTab === "cr" && (
            <motion.div
              key="cr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {crContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab buttons */}
      {tabButtons}
    </div>
  );
};

export default RightPanel;
