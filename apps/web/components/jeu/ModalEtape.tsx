// JEDEVIENSPATRON — Modal d’explication avant saisie (par étape)
"use client";

import { useEffect } from "react";
import {
  Briefcase, Landmark, Package, Mail, Handshake,
  DollarSign, Target, Dice6, BarChart3, LucideIcon
} from "lucide-react";
import { MODALES_ETAPES } from "@/lib/pedagogie/pedagogie";

interface Props {
  etape: number;
  onClose: () => void;
}

// T25.C (2026-04-19) — Mapping aligné sur le cycle 8 étapes.
// Clé = etat.etapeTour (0-7), cohérente avec MODALES_ETAPES dans pedagogie.ts.
// Chaque entrée associe un icône Lucide et une palette gradient/bordure/accent.
const ETAPE_CONFIG: Record<number, {
  Icon: LucideIcon;
  bg: string;
  border: string;
  badge: string;
  accent: string;
}> = {
  // 0 : Encaissements créances (argent qui rentre)
  0: { Icon: DollarSign,  bg: "from-green-50 to-emerald-50",  border: "border-green-300",  badge: "bg-green-600",   accent: "text-green-700"  },
  // 1 : Paiement des commerciaux (équipe / salaires)
  1: { Icon: Handshake,   bg: "from-blue-50 to-indigo-50",    border: "border-blue-300",   badge: "bg-blue-600",    accent: "text-blue-700"   },
  // 2 : Achats de marchandises (stock → rayons)
  2: { Icon: Package,     bg: "from-amber-50 to-yellow-50",   border: "border-amber-300",  badge: "bg-amber-600",   accent: "text-amber-700"  },
  // 3 : Traitement des ventes (cartes clients → CA)
  3: { Icon: Target,      bg: "from-purple-50 to-violet-50",  border: "border-purple-300", badge: "bg-purple-600",  accent: "text-purple-700" },
  // 4 : Décisions (recrutement, investissement, cession, licenciement)
  4: { Icon: Mail,        bg: "from-indigo-50 to-blue-50",    border: "border-indigo-300", badge: "bg-indigo-600",  accent: "text-indigo-700" },
  // 5 : Événement aléatoire (imprévu)
  5: { Icon: Dice6,       bg: "from-yellow-50 to-amber-50",   border: "border-yellow-300", badge: "bg-yellow-600",  accent: "text-yellow-700" },
  // 6 : Clôture trimestrielle (charges fixes, amortissements, effets récurrents)
  6: { Icon: Landmark,    bg: "from-rose-50 to-pink-50",      border: "border-rose-300",   badge: "bg-rose-600",    accent: "text-rose-700"   },
  // 7 : Bilan de fin de trimestre (photo patrimoniale)
  7: { Icon: BarChart3,   bg: "from-teal-50 to-cyan-50",      border: "border-teal-300",   badge: "bg-teal-600",    accent: "text-teal-700"   },
};

// Briefcase conservé en fallback défensif pour un eventual etape hors borne.
const FALLBACK_ICON: LucideIcon = Briefcase;

export default function ModalEtape({ etape, onClose }: Props) {
  const modal = MODALES_ETAPES[etape];
  const config = ETAPE_CONFIG[etape] ?? {
    Icon: FALLBACK_ICON,
    bg: "from-slate-50 to-slate-100",
    border: "border-slate-300",
    badge: "bg-slate-600",
    accent: "text-slate-700",
  };
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
              ÉTAPE {etape + 1}/8
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
