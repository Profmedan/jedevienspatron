"use client";

import { analyserSnapshots, type DiagnosticResult, type DiagnosticCategory } from "@/lib/diagnostic";
import type { TrimSnapshot } from "@jedevienspatron/game-engine";

// ─── Styles par catégorie ────────────────────────────────────────

const CATEGORY_STYLES: Record<DiagnosticCategory, { bg: string; border: string; badge: string; label: string }> = {
  alerte: {
    bg: "bg-red-950/40",
    border: "border-red-800/50",
    badge: "bg-red-900 text-red-200",
    label: "Alerte",
  },
  conseil: {
    bg: "bg-amber-950/40",
    border: "border-amber-800/50",
    badge: "bg-amber-900 text-amber-200",
    label: "Conseil",
  },
  force: {
    bg: "bg-emerald-950/40",
    border: "border-emerald-800/50",
    badge: "bg-emerald-900 text-emerald-200",
    label: "Point fort",
  },
};

// ─── Composant ───────────────────────────────────────────────────

interface DiagnosticPanelProps {
  pseudo: string;
  snapshots: TrimSnapshot[];
  /** Couleur du joueur (utilisée pour le header) */
  color: string;
}

export default function DiagnosticPanel({ pseudo, snapshots, color }: DiagnosticPanelProps) {
  const results = analyserSnapshots(snapshots);

  if (results.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-3">
          <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
          Diagnostic — {pseudo}
        </h3>
        <p className="text-gray-500">Pas assez de données pour générer un diagnostic (minimum 3 trimestres).</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-4">
        <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
        Diagnostic — {pseudo}
      </h3>
      <div className="space-y-3">
        {results.map((r) => {
          const style = CATEGORY_STYLES[r.category];
          return (
            <div key={r.id} className={`${style.bg} ${style.border} border rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                  {style.label}
                </span>
                <span className="text-sm font-medium text-gray-300">{r.label}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{r.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
