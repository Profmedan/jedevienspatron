"use client";

import { useState } from "react";
import { Joueur } from "@/lib/game-engine/types";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import IndicateursPanel from "@/components/IndicateursPanel";
import { calculerIndicateurs } from "@/lib/game-engine/calculators";
import { QuestionQCM } from "@/lib/game-engine/data/pedagogie";

interface TransitionInfo {
  from: number;
  to: number;
}

interface AnalysisMessage {
  niveau: "rouge" | "jaune" | "vert";
  message: string;
  consequence: string;
  conseil: string;
}

interface OverlayTransitionProps {
  transitionInfo: TransitionInfo;
  joueurs: Joueur[];
  onContinue: () => void;
  /** 4 questions QCM à poser en fin de trimestre */
  qcmQuestions?: QuestionQCM[];
  /** Score QCM final (défini après que le joueur ait répondu à toutes les questions) */
  qcmScore?: number;
  /** Callback appelé quand le joueur termine le QCM */
  onQCMTermine?: (score: number) => void;
}

function analyserSituationFinanciere(joueur: Joueur): AnalysisMessage[] {
  const ind = calculerIndicateurs(joueur);
  const msgs: AnalysisMessage[] = [];

  // Trésorerie nette
  if (ind.tresorerieNette < 0) {
    msgs.push({
      niveau: "rouge",
      message: `⚠️ Votre trésorerie nette est négative (${ind.tresorerieNette}). Risque de rupture.`,
      consequence: "Vous risquez de ne plus pouvoir payer vos fournisseurs, vos salaires ou vos dettes. Au-delà d’un découvert de 5, c’est la faillite automatique.",
      conseil: "Évitez tout achat à crédit ce trimestre. Privilégiez les clients comptants (Particuliers). Si possible, ne recrutez pas.",
    });
  } else if (ind.tresorerieNette < 5) {
    msgs.push({
      niveau: "jaune",
      message: `🔶 Votre trésorerie nette est faible (${ind.tresorerieNette}).`,
      consequence: "Une charge imprévue (événement aléatoire, remboursement de dette) peut vous mettre en découvert.",
      conseil: "Constituez une réserve : limitez les achats de stocks, favorisez les clients à paiement immédiat.",
    });
  } else {
    msgs.push({
      niveau: "vert",
      message: `✅ Votre trésorerie nette est positive (${ind.tresorerieNette}).`,
      consequence: "Situation saine. Votre trésorerie absorbe les imprévus.",
      conseil: "Vous pouvez envisager un investissement ou recruter un commercial ce trimestre.",
    });
  }

  // Fonds de roulement
  if (ind.fondsDeRoulement < 0) {
    msgs.push({
      niveau: "rouge",
      message: `⚠️ Votre fonds de roulement est négatif (${ind.fondsDeRoulement}).`,
      consequence: "Vos dettes à court terme dépassent vos actifs circulants. La banque peut refuser de nouvelles lignes de crédit.",
      conseil: "Remboursez vos dettes fournisseurs en priorité. Évitez les achats à crédit.",
    });
  } else if (ind.besoinFondsRoulement > ind.fondsDeRoulement) {
    msgs.push({
      niveau: "jaune",
      message: `🔶 Votre BFR (${ind.besoinFondsRoulement}) dépasse votre FR.`,
      consequence: "Votre cycle d’exploitation consomme plus de liquidités que vous n’en avez. Risque de tension sur la trésorerie.",
      conseil: "Réduisez le délai d’encaissement (moins de clients Grand Compte à C+2) ou augmentez votre fonds de roulement (capitaux, emprunt).",
    });
  }

  // Résultat net
  if (ind.resultatNet < 0) {
    msgs.push({
      niveau: "rouge",
      message: `📉 Votre résultat est déficitaire (${ind.resultatNet}).`,
      consequence: "Vos charges dépassent vos produits. Si cette tendance se prolonge, vos Capitaux propres vont s’éroder jusqu’à devenir négatifs — insolvabilité.",
      conseil: "Analysez vos charges : amortissements élevés ? Salaires trop lourds ? Augmentez vos ventes ou réduisez vos coûts fixes.",
    });
  } else if (ind.resultatNet === 0) {
    msgs.push({
      niveau: "jaune",
      message: `⚖️ Votre résultat net est nul.`,
      consequence: "Vous couvrez vos charges mais ne créez pas de valeur. Un imprévu peut faire basculer en perte.",
      conseil: "Cherchez à augmenter votre chiffre d’affaires : recrutez un commercial ou investissez dans la publicité.",
    });
  } else {
    msgs.push({
      niveau: "vert",
      message: `📈 Votre résultat net est bénéficiaire (${ind.resultatNet}).`,
      consequence: "Situation positive. Vos revenus couvrent vos charges et dégagent un bénéfice.",
      conseil: "Renforcez votre avantage : investissez les bénéfices dans un nouvel actif ou une levée de fonds.",
    });
  }

  // Solvabilité
  if (ind.ratioSolvabilite < 20) {
    msgs.push({
      niveau: "rouge",
      message: `⚠️ Votre solvabilité est très faible (${ind.ratioSolvabilite.toFixed(0)}%).`,
      consequence: "Votre entreprise est très endettée par rapport à ses actifs. Les créanciers peuvent perdre confiance.",
      conseil: "Évitez tout nouvel emprunt. Cherchez à augmenter vos Capitaux propres (bénéfices, levée de fonds).",
    });
  } else if (ind.ratioSolvabilite < 33) {
    msgs.push({
      niveau: "jaune",
      message: `🔶 Votre solvabilité est acceptable (${ind.ratioSolvabilite.toFixed(0)}%).`,
      consequence: "Solvabilité acceptable mais fragile. Un mauvais trimestre peut dégrader ce ratio.",
      conseil: "Maintenez le cap : ne prenez pas de nouveaux emprunts sans augmenter en parallèle votre résultat.",
    });
  } else {
    msgs.push({
      niveau: "vert",
      message: `✅ Votre solvabilité est solide (${ind.ratioSolvabilite.toFixed(0)}%).`,
      consequence: "Votre structure financière est solide. Les créanciers et partenaires font confiance à votre entreprise.",
      conseil: "Vous pouvez envisager un emprunt pour financer une croissance ou un investissement rentable.",
    });
  }

  return msgs;
}

/**
 * Overlay affiché à la fin de chaque trimestre
 * Permet de visualiser le bilan, CR, indicateurs avant de commencer le nouveau trimestre
 */
// ─── Composant QCM Inline ────────────────────────────────────────────────────
const LETTRES_QCM = ["A", "B", "C"] as const;

function QCMInline({
  questions,
  onTermine,
}: {
  questions: QuestionQCM[];
  onTermine: (score: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [reponse, setReponse] = useState<number | null>(null);
  const [aRepondu, setARepondu] = useState(false);
  const [score, setScore] = useState(0);
  const [termine, setTermine] = useState(false);
  const [scoreFinale, setScoreFinale] = useState(0);

  if (termine) {
    const bonus = scoreFinale === 4
      ? "🎁 +1 Revenu exceptionnel (score parfait !)"
      : scoreFinale === 3
      ? "💰 +1 Trésorerie (3 bonnes réponses)"
      : null;
    return (
      <div className="space-y-4">
        <div className={`rounded-2xl p-5 text-center border-2 ${
          scoreFinale >= 3 ? "bg-emerald-950/30 border-emerald-600" : "bg-gray-800 border-gray-600"
        }`}>
          <div className="text-4xl mb-2">{scoreFinale === 4 ? "🏆" : scoreFinale === 3 ? "🎉" : scoreFinale === 2 ? "😐" : "📚"}</div>
          <div className="text-2xl font-black text-white mb-1">{scoreFinale} / 4</div>
          <div className="text-sm text-gray-300">
            {scoreFinale === 4 && "Score parfait — excellent !"}
            {scoreFinale === 3 && "Très bien — presque parfait !"}
            {scoreFinale === 2 && "Correct — continuez à apprendre !"}
            {scoreFinale < 2 && "Entraînez-vous encore — vous pouvez y arriver !"}
          </div>
          {bonus && (
            <div className="mt-3 bg-amber-950/40 border border-amber-500 rounded-xl px-3 py-2 text-amber-300 text-sm font-bold">
              {bonus}
            </div>
          )}
        </div>
      </div>
    );
  }

  const q = questions[index];
  const estBonne = reponse === q.bonneReponse;
  const estDerniere = index + 1 >= questions.length;

  function choisir(idx: number) {
    if (aRepondu) return;
    setReponse(idx);
    setARepondu(true);
  }

  function suivante() {
    const newScore = score + (estBonne ? 1 : 0);
    if (estDerniere) {
      setTermine(true);
      setScoreFinale(newScore);
      onTermine(newScore);
      return;
    }
    setScore(newScore);
    setIndex(i => i + 1);
    setReponse(null);
    setARepondu(false);
  }

  function couleur(idx: number) {
    if (!aRepondu) {
      return reponse === idx
        ? "bg-indigo-900/60 border-indigo-400 text-indigo-200"
        : "bg-gray-800 border-gray-600 text-gray-300 hover:border-indigo-500 hover:bg-indigo-950/30";
    }
    if (idx === q.bonneReponse) return "bg-emerald-900/60 border-emerald-500 text-emerald-200";
    if (idx === reponse) return "bg-red-900/60 border-red-500 text-red-300";
    return "bg-gray-800/50 border-gray-700 text-gray-500";
  }

  function explicationFausse(): string {
    if (reponse === null || estBonne) return "";
    const fausses = [0, 1, 2].filter(i => i !== q.bonneReponse);
    const pos = fausses.indexOf(reponse);
    return pos >= 0 ? q.explicationFausses[pos] ?? "" : "";
  }

  return (
    <div className="space-y-4">
      {/* Progression */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          🧠 Quiz trimestriel
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-2 w-7 rounded-full transition-colors ${
              i < index ? "bg-emerald-500" : i === index ? "bg-indigo-400" : "bg-gray-700"
            }`} />
          ))}
        </div>
        <span className="text-xs font-black text-indigo-300">{index + 1} / {questions.length}</span>
      </div>

      {/* Question */}
      <p className="text-sm text-white leading-relaxed font-medium">{q.question}</p>

      {/* Choix */}
      <div className="space-y-2">
        {q.choix.map((choix, idx) => (
          <button
            key={idx}
            onClick={() => choisir(idx)}
            disabled={aRepondu}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${couleur(idx)}`}
          >
            <span className="font-black mr-2 text-indigo-300">{LETTRES_QCM[idx]}.</span>
            {choix}
            {aRepondu && idx === q.bonneReponse && <span className="ml-2 text-emerald-400">✓</span>}
            {aRepondu && idx === reponse && idx !== q.bonneReponse && <span className="ml-2 text-red-400">✗</span>}
          </button>
        ))}
      </div>

      {/* Explication */}
      {aRepondu && (
        <div className={`rounded-xl p-3 border text-xs ${estBonne ? "bg-emerald-950/40 border-emerald-700 text-emerald-200" : "bg-red-950/40 border-red-700 text-red-200"}`}>
          <p className="font-bold mb-1">{estBonne ? "✅ Bonne réponse !" : "❌ Pas tout à fait…"}</p>
          <p className="leading-relaxed text-gray-300">{q.explicationBonne}</p>
          {!estBonne && explicationFausse() && (
            <p className="mt-1 text-gray-500 italic">{explicationFausse()}</p>
          )}
        </div>
      )}

      {/* Bouton suivant */}
      {aRepondu && (
        <button
          onClick={suivante}
          className="w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-sm"
        >
          {estDerniere ? "Voir mon score →" : "Question suivante →"}
        </button>
      )}
    </div>
  );
}

// ─── OverlayTransition ───────────────────────────────────────────────────────
export function OverlayTransition({
  transitionInfo,
  joueurs,
  onContinue,
  qcmQuestions,
  qcmScore,
  onQCMTermine,
}: OverlayTransitionProps) {
  const [activeTab, setActiveTab] = useState<
    "analyse" | "indicateurs" | "bilan" | "cr" | "quiz"
  >(qcmQuestions && qcmQuestions.length > 0 ? "quiz" : "analyse");
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
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
              ? `Clôture de l’exercice ${Math.floor(transitionInfo.from / 4)}`
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
              ...(qcmQuestions && qcmQuestions.length > 0
                ? [["quiz", qcmScore !== undefined ? `🧠 Quiz ${qcmScore}/4` : "🧠 Quiz"]] as const
                : []),
              ["analyse", "📊 Analyse"],
              ["indicateurs", "📊 Indicateurs"],
              ["bilan", "📋 Bilan"],
              ["cr", "📈 Compte de résultat"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
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
                  <strong>📅 Fin du Trimestre {transitionInfo.from} :</strong> Les charges et produits de ce trimestre s&apos;ajoutent à ceux des trimestres précédents. À la clôture annuelle (fin du trimestre 4, 8, 12…), le résultat net sera intégré aux Capitaux propres et le Compte de résultat remis à zéro.
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
                          analyse.map((m, i) => {
                            const msgKey = `${j.id}-${i}`;
                            const isExpanded = expandedMsg === msgKey;
                            return (
                              <div
                                key={msgKey}
                                className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${colors[m.niveau]}`}
                                onClick={() => setExpandedMsg(isExpanded ? null : msgKey)}
                              >
                                <div className="px-2.5 py-1.5 text-xs leading-snug flex items-center justify-between gap-2">
                                  <span>{m.message}</span>
                                  <span className="text-[10px] shrink-0 opacity-60">
                                    {isExpanded ? "▲" : "▼ Détails"}
                                  </span>
                                </div>
                                {isExpanded && (
                                  <div className="px-3 pb-2.5 pt-1 border-t border-current/20 space-y-1.5">
                                    <p className="text-xs leading-relaxed opacity-90">
                                      <span className="font-bold">⚠️ Risque : </span>
                                      {m.consequence}
                                    </p>
                                    <p className="text-xs leading-relaxed opacity-90">
                                      <span className="font-bold">💡 Conseil : </span>
                                      {m.conseil}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "quiz" && qcmQuestions && qcmQuestions.length > 0 && (
            <QCMInline
              questions={qcmQuestions}
              onTermine={(score) => {
                onQCMTermine?.(score);
              }}
            />
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
