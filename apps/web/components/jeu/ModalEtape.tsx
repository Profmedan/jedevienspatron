// JEDEVIENSPATRON — Modal d’explication avant saisie (par étape)
"use client";

import { useEffect } from "react";
import {
  Briefcase, Landmark, Package, Mail, Handshake,
  DollarSign, Target, Dice6, BarChart3, LucideIcon
} from "lucide-react";
import { MODALES_ETAPES } from "@/lib/game-engine/data/pedagogie";

interface Props {
  etape: number;
  onClose: () => void;
}

const ETAPE_CONFIG: Record<number, {
  Icon: LucideIcon;
  bg: string;
  border: string;
  badge: string;
  accent: string;
}> = {
  // 0 : Charges fixes & amortissements
  0: { Icon: Briefcase,   bg: "from-slate-50 to-slate-100",   border: "border-slate-300",  badge: "bg-slate-600",   accent: "text-slate-700"  },
  // 1 : Achats de marchandises (stock → rayons)
  1: { Icon: Package,     bg: "from-amber-50 to-yellow-50",   border: "border-amber-300",  badge: "bg-amber-600",   accent: "text-amber-700"  },
  // 2 : Avancement créances clients (argent qui rentre)
  2: { Icon: DollarSign,  bg: "from-green-50 to-emerald-50",  border: "border-green-300",  badge: "bg-green-600",   accent: "text-green-700"  },
  // 3 : Paiement des commerciaux (accord/salaires)
  3: { Icon: Handshake,   bg: "from-blue-50 to-indigo-50",    border: "border-blue-300",   badge: "bg-blue-600",    accent: "text-blue-700"   },
  // 4 : Ventes via cartes client (objectif commercial)
  4: { Icon: Target,      bg: "from-purple-50 to-violet-50",  border: "border-purple-300", badge: "bg-purple-600",  accent: "text-purple-700" },
  // 5 : Effets récurrents cartes Décision (remboursements banque)
  5: { Icon: Landmark,    bg: "from-red-50 to-orange-50",     border: "border-orange-300", badge: "bg-red-600",     accent: "text-red-700"    },
  // 6 : Choix d’une carte Décision (décision stratégique)
  6: { Icon: Mail,        bg: "from-indigo-50 to-blue-50",    border: "border-indigo-300", badge: "bg-indigo-600",  accent: "text-indigo-700" },
  // 7 : Événement aléatoire (surprise)
  7: { Icon: Dice6,       bg: "from-yellow-50 to-amber-50",   border: "border-yellow-300", badge: "bg-yellow-600",  accent: "text-yellow-700" },
  // 8 : Bilan de fin de trimestre
  8: { Icon: BarChart3,   bg: "from-teal-50 to-cyan-50",      border: "border-teal-300",   badge: "bg-teal-600",    accent: "text-teal-700"   },
};

export default function ModalEtape({ etape, onClose }: Props) {
  const modal = MODALES_ETAPES[etape];
  const config = ETAPE_CONFIG[etape] ?? ETAPE_CONFIG[0];
  const { Icon } = config;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl rounded-2xl border-2 ${config.border} bg-gradient-to-br ${config.bg} shadow-2xl`}>

        {/* En-tête */}
        <div className="flex items-center gap-4 p-6 pb-4">
          <div className={`p-3 rounded-xl ${config.badge} text-white shrink-0`}>
            <Icon size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-xs font-bold text-white px-3 py-1 rounded-full ${config.badge} mb-1.5`}>
              ÉTAPE {etape}
            </span>
            <h2 className={`text-xl font-black ${config.accent} leading-tight`}>{modal.titre}</h2>
          </div>
        </div>

        {/* Corps */}
        <div className="px-6 pb-3 space-y-3">
          <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Ce qui se passe</p>
            <p className="text-gray-700 text-sm leading-relaxed">{modal.ceQuiSePasse}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pourquoi c&apos;est important</p>
            <p className="text-gray-700 text-sm leading-relaxed">{modal.pourquoi}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Impact sur les comptes</p>
              <p className="text-gray-700 text-sm leading-relaxed">{modal.impactComptes}</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">💡 Conseil</p>
              <p className="text-gray-700 text-sm leading-relaxed">{modal.conseil}</p>
            </div>
          </div>
        </div>

        {/* Bouton */}
        <div className="p-6 pt-3">
          <button
            onClick={onClose}
            className={`w-full py-3.5 rounded-xl font-black text-white text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md ${config.badge} hover:opacity-90 flex items-center justify-center gap-2`}
          >
            <Icon size={18} />
            J&apos;ai compris — Je commence la saisie →
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">Appuie sur Échap pour fermer</p>
        </div>
      </div>
    </div>
  );
}
