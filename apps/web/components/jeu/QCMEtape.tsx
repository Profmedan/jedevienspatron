// JEDEVIENSPATRON — QCM obligatoire après chaque étape (3 questions, 3 choix)
"use client";

import { useEffect, useState } from "react";
import { QCM_ETAPES } from "@/lib/pedagogie/pedagogie";

interface Props {
  etape: number;
  tourActuel: number;
  onTermine: (score: number) => void;
}

const LETTRES = ["A", "B", "C"] as const;
const NB_QUESTIONS = 3; // questions affichées par quiz

/** Sélectionne 3 questions depuis le pool de 6, en alternant selon le tour */
function selectionnerQuestions(etape: number, tour: number) {
  const qcm = QCM_ETAPES[etape];
  if (!qcm) return null;
  const pool = qcm.questions;
  // Pool de 6 → 2 séries de 3 : série 0 = [0,1,2], série 1 = [3,4,5]
  // Au-delà, on cycle : tour 1 → série 0, tour 2 → série 1, tour 3 → série 0, etc.
  const nbSeries = Math.floor(pool.length / NB_QUESTIONS);
  const serie = (tour - 1) % nbSeries; // 0 ou 1
  const debut = serie * NB_QUESTIONS;
  return pool.slice(debut, debut + NB_QUESTIONS);
}

export default function QCMEtape({ etape, tourActuel, onTermine }: Props) {
  const questions = selectionnerQuestions(etape, tourActuel);

  const [indexQuestion, setIndexQuestion] = useState(0);
  const [reponseChoisie, setReponseChoisie] = useState<number | null>(null);
  const [aRepondu, setARepondu] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!questions) onTermine(3);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!questions) return null;

  const question = questions[indexQuestion];
  const estBonne = reponseChoisie === question.bonneReponse;
  const totalQuestions = questions.length;

  function choisir(idx: number) {
    if (aRepondu) return;
    setReponseChoisie(idx);
    setARepondu(true);
    if (idx === question.bonneReponse) setScore(s => s + 1);
  }

  function suivante() {
    if (indexQuestion + 1 >= totalQuestions) {
      onTermine(score + (estBonne ? 1 : 0));
      return;
    }
    setIndexQuestion(i => i + 1);
    setReponseChoisie(null);
    setARepondu(false);
  }

  // Couleur des boutons de réponse
  function couleurChoix(idx: number) {
    if (!aRepondu) {
      return reponseChoisie === idx
        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
        : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50";
    }
    if (idx === question.bonneReponse) return "bg-green-100 border-green-500 text-green-800";
    if (idx === reponseChoisie) return "bg-red-100 border-red-400 text-red-700";
    return "bg-gray-50 border-gray-200 text-gray-400";
  }

  // Explication de la mauvaise réponse choisie
  function explicationMauvaise(): string {
    if (reponseChoisie === null || estBonne) return "";
    // Index dans les fausses réponses (sauter la bonne)
    const faussesIdx = [0, 1, 2].filter(i => i !== question.bonneReponse);
    const pos = faussesIdx.indexOf(reponseChoisie);
    return pos >= 0 ? question.explicationFausses[pos] ?? "" : "";
  }

  const estDerniere = indexQuestion + 1 >= totalQuestions;
  // Indicateur de série (tour pair/impair)
  const nbSeries = Math.floor(QCM_ETAPES[etape]?.questions.length / NB_QUESTIONS) || 1;
  const serie = (tourActuel - 1) % nbSeries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200">

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Quiz — Étape {etape}
              {serie > 0 && <span className="ml-1 text-gray-400">(série {serie + 1})</span>}
            </span>
            <h2 className="text-base font-bold text-gray-800">
              Question {indexQuestion + 1} / {totalQuestions}
            </h2>
          </div>
          {/* Barre de progression */}
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i < indexQuestion ? "bg-green-400"
                  : i === indexQuestion ? "bg-emerald-400"
                  : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="px-6 py-5">
          <p className="text-gray-800 font-medium text-base leading-relaxed mb-5">
            {question.question}
          </p>

          {/* Choix (3 seulement) */}
          <div className="space-y-2.5">
            {question.choix.map((choix, idx) => (
              <button
                key={idx}
                onClick={() => choisir(idx)}
                disabled={aRepondu}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${couleurChoix(idx)}`}
              >
                <span className="font-bold mr-2">{LETTRES[idx]}.</span>
                {choix}
                {aRepondu && idx === question.bonneReponse && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
                {aRepondu && idx === reponseChoisie && idx !== question.bonneReponse && (
                  <span className="ml-2 text-red-500">✗</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Explication (après réponse) */}
        {aRepondu && (
          <div className="px-6 pb-4 space-y-2">
            <div className={`rounded-xl p-4 border ${estBonne ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
              <p className={`text-xs font-bold mb-1 ${estBonne ? "text-green-700" : "text-orange-700"}`}>
                {estBonne ? "✅ Bonne réponse !" : "❌ Pas tout à fait…"}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{question.explicationBonne}</p>
            </div>
            {!estBonne && explicationMauvaise() && (
              <div className="rounded-xl p-3 bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="font-semibold">Pourquoi ta réponse est incorrecte : </span>
                  {explicationMauvaise()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bouton Suivant */}
        {aRepondu && (
          <div className="px-6 pb-6">
            <button
              onClick={suivante}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors text-base"
            >
              {estDerniere ? "J’ai compris — Étape suivante →" : "Question suivante →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
