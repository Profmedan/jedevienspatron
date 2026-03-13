"use client";

import { useState } from "react";
import { Joueur } from "@/lib/game-engine/types";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import IndicateursPanel from "@/components/IndicateursPanel";
import { calculerIndicateurs } from "@/lib/game-engine/calculators";

interface TransitionInfo {
  from: number;
  to: number;
}

interface OverlayTransitionProps {
  transitionInfo: TransitionInfo;
  joueurs: Joueur[];
  onContinue: () => void;
}

function analyserSituationFinanciere(joueur: Joueur) {
  const ind = calculerIndicateurs(joueur);
  const msgs: Array<{ niveau: "rouge" | "jaune" | "vert"; message: string }> = [];

  // Trésorerie nette
  if (ind.tresorerieNette < 0) {
    msgs.push({
      niveau: "rouge",
      message: `⚠️ Votre trésorerie nette est négative (${ind.tresorerieNette}). Risque de rupture.`,
    });
  } else if (ind.tresorerieNette < 5) {
    msgs.push({
      niveau: "jaune",
      message: `🔶 Votre trésorerie nette est faible (${ind.tresorerieNette}).`,
    });
  } else {
    msgs.push({
      niveau: "vert",
      message: `✅ Votre trésorerie nette est positive (${ind.tresorerieNette}).`,
    });
  }

  // Fonds de roulement
  if (ind.fondsDeRoulement < 0) {
    msgs.push({
      niveau: "rouge",
      message: `⚠️ Votre fonds de roulement est négatif (${ind.fondsDeRoulement}).`,
    });
  } else if (ind.besoinFondsRoulement > ind.fondsDeRoulement) {
    msgs.push({
      niveau: "jaune",
      message: `🔶 Votre BFR (${ind.besoinFondsRoulement}) dépasse votre FR.`,
    });
  }

  // Résultat net
  if (ind.resultatNet < 0) {
    msgs.push({
      niveau: "rouge",
      message: `📉 Votre résultat est déficitaire (${ind.resultatNet}).`,
    });
  } else if (ind.resultatNet === 0) {
    msgs.push({
      niveau: "jaune",
      message: `⚖️ Votre résultat net est nul.`,
    });
  } else {
    msgs.push({
      niveau: "vert",
      message: `📈 Votre résultat net est bénéficiaire (${ind.resultatNet}).`,
    });
  }

  // Solvabilité
  if (ind.ratioSolvabilite < 20) {
    msgs.push({
      niveau: "rouge",
      message: `⚠️ Votre solvabilité est très faible (${ind.ratioSolvabilite.toFixed(0)}%).`,
    });
  } else if (ind.ratioSolvabilite < 33) {
    msgs.push({
      niveau: "jaune",
      message: `🔶 Votre solvabilité est acceptable (${ind.ratioSolvabilite.toFixed(0)}%).`,
    });
  } else {
    msgs.push({
      niveau: "vert",
      message: `✅ Votre solvabilité est solide (${ind.ratioSolvabilite.toFixed(0)}%).`,
    });
  }

  return msgs;
}

/**
 * Overlay affiché à la fin de chaque trimestre
 * Permet de visualiser le bilan, CR, indicateurs avant de commencer le nouveau trimestre
 */
export function OverlayTransition({
  transitionInfo,
  joueurs,
  onContinue,
}: OverlayTransitionProps) {
  const [activeTab, setActiveTab] = useState<
    "analyse" | "indicateurs" | "bilan" | "cr"
  >("analyse");
  const estClotureFiscale = transitionInfo.from % 4 === 0;
  const joueur = joueurs[0]; // Pour affichage bilan/CR

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* En-tête coloré */}
        <div
          className={`px-6 py-4 text-white text-center ${
            estClotureFiscale
              ? "bg-gradient-to-r from-purple-600 to-indigo-700"
              : "bg-gradient-to-r from-indigo-600 to-purple-600"
          }`}
        >
          <div className="text-4xl mb-1">
            {estClotureFiscale ? "🏁" : "🔔"}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-75 mb-0.5">
            {estClotureFiscale
              ? `Clôture de l'exercice ${Math.floor(transitionInfo.from / 4)}`
              : `Fin du Trimestre ${transitionInfo.from}`}
          </div>
          <h2 className="text-xl font-bold">
            {estClotureFiscale
              ? `✅ Résultat intégré aux capitaux — Exercice ${Math.ceil(transitionInfo.to / 4)} démarre`
              : `Trimestre ${transitionInfo.to} — Prêt à démarrer !`}
          </h2>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-700 bg-gray-800 px-4 gap-0.5 overflow-x-auto shrink-0">
          {(
            [
              ["analyse", "📊 Analyse"],
              ["indicateurs", "📊 Indicateurs"],
              ["bilan", "📋 Bilan"],
              ["cr", "📈 Compte de résultat"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-300 bg-gray-900"
                  : "border-transparent text-gray-400 hover:text-indigo-400 hover:border-indigo-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "analyse" && (
            <div className="space-y-3">
              {/* Message contextuel */}
              {estClotureFiscale ? (
                <div className="bg-purple-950/30 border border-purple-700/50 rounded-xl p-3 text-sm text-purple-200 leading-relaxed">
                  <strong>🏁 Clôture de l&apos;exercice fiscal :</strong> Le résultat net
                  a été intégré aux Capitaux propres. Le Compte de résultat repart à zéro.
                </div>
              ) : (
                <div className="bg-indigo-950/30 border border-indigo-700/50 rounded-xl p-3 text-sm text-indigo-200 leading-relaxed">
                  <strong>📅 Fin du Trimestre {transitionInfo.from} :</strong> Le Compte
                  de résultat continue à s&apos;accumuler.
                </div>
              )}

              <div className="bg-blue-950/30 border border-blue-700/50 rounded-xl p-3 text-sm text-blue-200 leading-relaxed">
                <strong>🎯 Ce trimestre :</strong> Vous pouvez choisir une nouvelle{" "}
                <strong>Carte Décision</strong>.
              </div>

              {/* Analyse financière */}
              <div className="border-t border-gray-700 pt-3 space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  📊 Analyse de votre situation
                </div>
                {joueurs.map((j) => {
                  const analyse = analyserSituationFinanciere(j);
                  const colors = {
                    rouge: "bg-red-950/30 border-red-700/50 text-red-300",
                    jaune: "bg-amber-950/30 border-amber-700/50 text-amber-300",
                    vert: "bg-emerald-950/30 border-emerald-700/50 text-emerald-300",
                  };

                  return (
                    <div
                      key={j.id}
                      className="rounded-xl overflow-hidden border border-gray-700"
                    >
                      <div className="bg-indigo-950/40 px-3 py-2 flex items-center gap-2">
                        <span>{j.entreprise.icon}</span>
                        <span className="font-bold text-indigo-200 text-sm">
                          {j.pseudo}
                        </span>
                        {j.elimine && (
                          <span className="ml-auto text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">
                            💀 Faillite
                          </span>
                        )}
                      </div>
                      <div className="p-2 space-y-1.5">
                        {j.elimine ? (
                          <p className="text-xs text-gray-400 italic px-1">
                            Cette entreprise est éliminée.
                          </p>
                        ) : (
                          analyse.map((m, i) => (
                            <div
                              key={i}
                              className={`border rounded-lg px-2.5 py-1.5 text-xs leading-snug ${colors[m.niveau]}`}
                            >
                              {m.message}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "indicateurs" && <IndicateursPanel joueur={joueur} />}
          {activeTab === "bilan" && <BilanPanel joueur={joueur} highlightedPoste={null} />}
          {activeTab === "cr" && (
            <CompteResultatPanel joueur={joueur} highlightedPoste={null} />
          )}
        </div>

        {/* Bouton démarrer */}
        <div className="px-6 py-4 border-t border-gray-700 shrink-0">
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 rounded-xl text-lg shadow-sm transition-all active:scale-95"
          >
            🚀 Démarrer le Trimestre {transitionInfo.to}
          </button>
        </div>
      </div>
    </div>
  );
}
