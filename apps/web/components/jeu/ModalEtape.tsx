// JEDEVIENSPATRON — Modal d'explication avant saisie (par étape)
"use client";

import { useEffect } from "react";
import { MODALES_ETAPES } from "@/lib/game-engine/data/pedagogie";

interface Props {
  etape: number;
  onClose: () => void;
}

const COULEURS: Record<number, { bg: string; border: string; badge: string; icon: string }> = {
  0: { bg: "from-slate-50 to-slate-100",   border: "border-slate-300",  badge: "bg-slate-600",   icon: "💼" },
  1: { bg: "from-red-50 to-orange-50",     border: "border-orange-300", badge: "bg-orange-600",  icon: "🏦" },
  2: { bg: "from-amber-50 to-yellow-50",   border: "border-amber-300",  badge: "bg-amber-600",   icon: "📦" },
  3: { bg: "from-blue-50 to-indigo-50",    border: "border-blue-300",   badge: "bg-blue-600",    icon: "📨" },
  4: { bg: "from-purple-50 to-violet-50",  border: "border-purple-300", badge: "bg-purple-600",  icon: "🤝" },
  5: { bg: "from-green-50 to-emerald-50",  border: "border-green-300",  badge: "bg-green-600",   icon: "💰" },
  6: { bg: "from-indigo-50 to-blue-50",    border: "border-indigo-300", badge: "bg-indigo-600",  icon: "🎯" },
  7: { bg: "from-yellow-50 to-amber-50",   border: "border-yellow-300", badge: "bg-yellow-600",  icon: "🎲" },
  8: { bg: "from-teal-50 to-cyan-50",      border: "border-teal-300",   badge: "bg-teal-600",    icon: "📊" },
};

export default function ModalEtape({ etape, onClose }: Props) {
  const modal = MODALES_ETAPES[etape];
  const couleur = COULEURS[etape] ?? COULEURS[0];

  // Fermer avec Echap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl rounded-2xl border-2 ${couleur.border} bg-gradient-to-br ${couleur.bg} shadow-2xl`}>

        {/* En-tête */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <span className="text-4xl">{couleur.icon}</span>
          <div className="flex-1">
            <span className={`inline-block text-xs font-bold text-white px-2 py-0.5 rounded-full ${couleur.badge} mb-1`}>
              ÉTAPE {etape}
            </span>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">{modal.titre}</h2>
          </div>
        </div>

        {/* Corps */}
        <div className="px-6 pb-2 space-y-4">

          <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Ce qui se passe</p>
            <p className="text-gray-700 text-sm leading-relaxed">{modal.ceQuiSePasse}</p>
          </div>

          <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pourquoi c&apos;est important</p>
            <p className="text-gray-700 text-sm leading-relaxed">{modal.pourquoi}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Impact sur les comptes</p>
              <p className="text-gray-700 text-sm leading-relaxed">{modal.impactComptes}</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">💡 Conseil</p>
              <p className="text-gray-700 text-sm leading-relaxed">{modal.conseil}</p>
            </div>
          </div>
        </div>

        {/* Bouton */}
        <div className="p-6 pt-4">
          <button
            onClick={onClose}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md ${couleur.badge} hover:opacity-90`}
          >
            J&apos;ai compris — Je commence la saisie →
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">Appuie sur Échap pour fermer</p>
        </div>
      </div>
    </div>
  );
}
