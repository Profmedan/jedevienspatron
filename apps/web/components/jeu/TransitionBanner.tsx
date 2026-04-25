"use client";

/**
 * Bandeau de transition pédagogique entre 2 étapes du cycle de jeu.
 *
 * Objectif (validé par Pierre, 2026-04-25) :
 *   À chaque fin d'étape, l'apprenant comprend en 1 lecture rapide :
 *     1. ce qui vient de se passer ("✓ X € encaissés. Y € restent à recevoir.")
 *     2. quelle est l'étape suivante ("Étape suivante : Paiement commerciaux")
 *     3. quand passer (auto-close 2.5 s OU clic sur la flèche).
 *
 * Le composant est délibérément silencieux : pas de modale, pas d'overlay
 * full-screen — un bandeau coloré inséré au-dessus du panneau actif.
 *
 * Props
 *   - message       : texte court (≤ 80 caractères en moyenne) construit par
 *                     `buildTransitionSummary` côté hook.
 *   - nextStepName  : nom long de l'étape suivante (depuis STEP_NAMES).
 *   - severity      : "info" (succès, vert) | "alert" (attention, ambre).
 *   - autoCloseMs   : ms avant auto-confirm (default 2500). 0 = désactivé.
 *   - onConfirm     : appelé soit par le timer, soit au clic sur la flèche.
 *
 * Le timer est géré localement avec un setInterval qui rafraîchit la barre
 * de progression visuelle puis appelle `onConfirm()` exactement une fois.
 */

import { useEffect, useRef, useState } from "react";

interface TransitionBannerProps {
  message: string;
  nextStepName: string;
  severity?: "info" | "alert";
  autoCloseMs?: number;
  onConfirm: () => void;
}

export function TransitionBanner({
  message,
  nextStepName,
  severity = "info",
  autoCloseMs = 2500,
  onConfirm,
}: TransitionBannerProps) {
  const [progress, setProgress] = useState(0);
  // Garde-fou : on ne doit jamais appeler `onConfirm` deux fois (timer + clic).
  const firedRef = useRef(false);

  function fireOnce() {
    if (firedRef.current) return;
    firedRef.current = true;
    onConfirm();
  }

  useEffect(() => {
    if (autoCloseMs <= 0) return;
    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / autoCloseMs);
      setProgress(ratio);
      if (ratio >= 1) {
        window.clearInterval(interval);
        fireOnce();
      }
    }, 50);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCloseMs]);

  const isAlert = severity === "alert";
  const containerClass = isAlert
    ? "border-amber-400/40 bg-amber-500/10"
    : "border-emerald-400/30 bg-emerald-500/10";
  const iconColor = isAlert ? "text-amber-300" : "text-emerald-300";
  const buttonClass = isAlert
    ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
    : "bg-emerald-400 text-slate-950 hover:bg-emerald-300";
  const progressColor = isAlert ? "bg-amber-300/50" : "bg-emerald-300/50";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative overflow-hidden rounded-2xl border px-4 py-3 ${containerClass}`}
    >
      {/* Barre de progression auto-close */}
      {autoCloseMs > 0 && (
        <div
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-0.5 transition-[width] duration-75 ${progressColor}`}
          style={{ width: `${progress * 100}%` }}
        />
      )}

      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 text-base leading-none ${iconColor}`}
          aria-hidden="true"
        >
          {isAlert ? "⚠" : "✓"}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-slate-100">
            {message}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Étape suivante :{" "}
            <span className="font-semibold text-slate-200">{nextStepName}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={fireOnce}
          aria-label={`Passer immédiatement à l'étape ${nextStepName}`}
          title="Passer immédiatement"
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold leading-none transition-colors ${buttonClass}`}
        >
          →
        </button>
      </div>
    </div>
  );
}
