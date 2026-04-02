"use client";

import { useState } from "react";
import { QuestionQCM } from "@/lib/game-engine/data/pedagogie";

export function usePedagogy() {
  const [etapesPedagoVues, setEtapesPedagoVues] = useState<Set<number>>(new Set());
  const [modalEtapeEnAttente, setModalEtapeEnAttente] = useState<number | null>(null);
  
  // QCM trimestriel : 4 questions tirées à la fin de chaque trimestre
  const [qcmTrimestreQuestions, setQcmTrimestreQuestions] = useState<QuestionQCM[] | undefined>(undefined);
  const [qcmTrimestreScore, setQcmTrimestreScore] = useState<number | undefined>(undefined);

  function markEtapeVuAndShow(etape: number) {
    if (!etapesPedagoVues.has(etape)) {
      setModalEtapeEnAttente(etape);
      setEtapesPedagoVues((prev) => {
        const next = new Set(prev);
        next.add(etape);
        return next;
      });
    }
  }

  function clearModal() {
    setModalEtapeEnAttente(null);
  }

  return {
    etapesPedagoVues,
    modalEtapeEnAttente,
    qcmTrimestreQuestions,
    setQcmTrimestreQuestions,
    qcmTrimestreScore,
    setQcmTrimestreScore,
    markEtapeVuAndShow,
    clearModal,
  };
}
