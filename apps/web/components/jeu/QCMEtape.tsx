// JEDEVIENSPATRON — QCM obligatoire après chaque étape (5 questions)
"use client";

import { useState } from "react";
import { QCM_ETAPES } from "@/lib/game-engine/data/pedagogie";

interface Props {
  etape: number;
  onTermine: (score: number) => void;
}

const LETTRES = ["A", "B", "C", "D"] as const;

export default function QCMEtape({ etape, onTermine }: Props) {
  const qcm = QCM_ETAPES[etape];
  const [indexQuestion, setIndexQuestion] = useState(0);
  const [reponseChoisie, setReponseChoisie] = useState<number | null>(null);
  const [aRepondu, setARepondu] = useState(false);
  const [score, setScore] = useState(0);

  if (!qcm) {
    onTermine(5);
    return null;
  }

  const question = qcm.questions[indexQuestion];
  const estBonne = reponseChoisie === question.bonneReponse;
  const totalQuestions = qcm.questions.length;

  function choisir(idx: number) {
    if (aRepondu) return;
    setReponseChoisie(idx);
    setARepondu(true);
    if (idx === question.bonneReponse) setScore(s => s + 1);
  }

  function suivante() {
    if (indexQuestion + 1 >= totalQuestions) {
      onTermine(score + (estBonne ? 0 : 0)); // score déjà mis à jour
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
        ? "bg-indigo-100 border-indigo-500 text-indigo-800"
        : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50";
    }
    if (idx === question.bonneReponse) return "bg-green-100 border-green-500 text-green-800";
    if (idx === reponseChoisie) return "bg-red-100 border-red-400 text-red-700";
    return "bg-gray-50 border-gray-200 text-gray-400";
  }

  // Explication de la mauvaise réponse choisie
  function explicationMauvaise(): string {
    if (reponseChoisie === null || estBonne) return "";
    const mauvaiseIdx = [0, 1, 2, 3]
      .filter(i => i !== question.bonneReponse)
      .indexOf(reponseChoisie);
    return mauvaiseIdx >= 0 ? question.explicationFausses[mauvaiseIdx] ?? "" : "";
  }

  const estDerniere = indexQuestion + 1 >= totalQuestions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200">

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
              Quiz — Étape {etape}
            </span>
            <h2 className="text-base font-bold text-gray-800">
              Question {indexQuestion + 1} / {totalQuestions}
            </h2>
          </div>
          {/* Barre de progression */}
          <div className="flex gap-1.5">
            {qcm.questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i < indexQuestion ? "bg-green-400"
                  : i === indexQuestion ? "bg-indigo-400"
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

          {/* Choix */}
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
              className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-base"
            >
              {estDerniere ? "J'ai compris — Étape suivante →" : "Question suivante →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
