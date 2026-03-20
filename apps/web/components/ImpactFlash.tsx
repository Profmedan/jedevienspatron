"use client";
/**
 * ImpactFlash — Option A du système B+A
 *
 * Overlay centré, non-bloquant, qui apparaît 2 secondes chaque fois qu'une
 * écriture est cochée. Montre de façon unmissable :
 *   - le document comptable concerné (BILAN bleu / COMPTE DE RÉSULTAT ambre)
 *   - le nom du compte
 *   - la valeur avant → après l'étape complète + le delta
 *   - une barre de décompte visuelle (2s)
 *
 * RÉVERSIBILITÉ : supprimer ce fichier + retirer les 3 blocs marqués
 * "// [IMPACT-FLASH]" dans page.tsx.
 */
import { useEffect, useRef, useState } from "react";
import { getDocumentType, nomCompte } from "./jeu/utils";
import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";

export interface FlashData {
  poste: string;
  avant: number;
  apres: number;
}

interface Props {
  data: FlashData | null;
  onDone: () => void;
}

export function ImpactFlash({ data, onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [barWidth, setBarWidth] = useState(100);
  // Clé de stabilité pour retrigguer l'animation si le même poste est flashé deux fois
  const flashKeyRef = useRef(0);

  useEffect(() => {
    if (!data) return;
    flashKeyRef.current += 1;
    setBarWidth(100);
    setVisible(false);

    // Double RAF pour forcer le navigateur à peindre l'état initial avant la transition
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
        setBarWidth(0);          // déclenche la transition CSS 2s
      });
    });

    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 350);   // laisse l'animation de sortie se terminer
    }, 2100);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.poste, data?.avant, data?.apres]);

  if (!data) return null;

  const docType  = getDocumentType(data.poste);
  const isBilan  = docType === "Bilan";
  const delta    = data.apres - data.avant;
  const bon      = isBonPourEntreprise(data.poste, delta);
  const label    = nomCompte(data.poste);

  // Couleurs selon document
  const header   = isBilan
    ? "bg-blue-700   text-white"
    : "bg-amber-600  text-white";
  const accent   = isBilan ? "text-blue-300"  : "text-amber-300";
  const barColor = bon     ? "bg-emerald-400" : "bg-red-400";

  return (
    /* Zone de positionnement : centrée horizontalement, haute dans l'écran */
    <div
      className="fixed inset-0 flex items-start justify-center z-50 pointer-events-none"
      style={{ paddingTop: "18vh" }}
    >
      <div
        className={`
          w-72 rounded-2xl overflow-hidden shadow-2xl border-2
          transition-all duration-300
          ${isBilan ? "border-blue-500" : "border-amber-500"}
          ${visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95"}
        `}
        style={{ backdropFilter: "blur(8px)", background: "rgba(10,10,20,0.92)" }}
      >
        {/* ── En-tête document ── */}
        <div className={`px-4 py-2.5 flex items-center justify-between ${header}`}>
          <span className="text-sm font-black uppercase tracking-widest">
            {isBilan ? "📋 Bilan" : "📈 Compte de Résultat"}
          </span>
          <span className="text-xs font-semibold opacity-80">mis à jour</span>
        </div>

        {/* ── Corps : compte + avant → après ── */}
        <div className="px-5 py-4 space-y-3">
          {/* Nom du compte */}
          <p className={`text-xs font-black uppercase tracking-widest ${accent}`}>{label}</p>

          {/* Avant / Après en grand */}
          <div className="flex items-center justify-center gap-4">
            {/* Avant */}
            <div className="text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Avant</div>
              <div className="text-4xl font-black tabular-nums text-gray-400">{data.avant}</div>
            </div>

            {/* Flèche animée */}
            <div className="flex flex-col items-center gap-1">
              <div className={`text-2xl ${bon ? "text-emerald-400" : "text-red-400"}`}>
                {bon ? "↗" : "↘"}
              </div>
              <span className={`text-sm font-black tabular-nums px-2 py-0.5 rounded-full ${
                bon
                  ? "bg-emerald-900/60 text-emerald-300"
                  : "bg-red-900/60 text-red-300"
              }`}>
                {delta > 0 ? `+${delta}` : `${delta}`}
              </span>
            </div>

            {/* Après */}
            <div className="text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Après</div>
              <div className={`text-4xl font-black tabular-nums ${
                bon ? "text-emerald-400" : "text-red-400"
              }`}>{data.apres}</div>
            </div>
          </div>
        </div>

        {/* ── Barre de décompte ── */}
        <div className="h-1.5 bg-gray-800">
          <div
            className={`h-full rounded-r-full ${barColor}`}
            style={{
              width: `${barWidth}%`,
              transition: barWidth === 0 ? "width 2.1s linear" : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
