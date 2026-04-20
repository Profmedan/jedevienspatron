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
// B4 (2026-04-20) — palette passée en dark pour cohérence avec le reste du jeu
// (bg-slate-950, border-white/10, text-slate-*). Chaque étape garde son identité
// chromatique via la bordure + l'accent + le badge, sur fond slate.
const ETAPE_CONFIG: Record<number, {
  Icon: LucideIcon;
  bg: string;
  border: string;
  badge: string;
  accent: string;
}> = {
  // 0 : Encaissements créances (argent qui rentre)
  0: { Icon: DollarSign,  bg: "from-slate-900 via-slate-900 to-emerald-950/60",  border: "border-emerald-500/50",  badge: "bg-emerald-600",  accent: "text-emerald-300"  },
  // 1 : Paiement des commerciaux (équipe / salaires)
  1: { Icon: Handshake,   bg: "from-slate-900 via-slate-900 to-blue-950/60",     border: "border-blue-500/50",     badge: "bg-blue-600",     accent: "text-blue-300"     },
  // 2 : Achats de marchandises (stock → rayons)
  2: { Icon: Package,     bg: "from-slate-900 via-slate-900 to-amber-950/60",    border: "border-amber-500/50",    badge: "bg-amber-600",    accent: "text-amber-300"    },
  // 3 : Traitement des ventes (cartes clients → CA)
  3: { Icon: Target,      bg: "from-slate-900 via-slate-900 to-purple-950/60",   border: "border-purple-500/50",   badge: "bg-purple-600",   accent: "text-purple-300"   },
  // 4 : Décisions (recrutement, investissement, cession, licenciement)
  4: { Icon: Mail,        bg: "from-slate-900 via-slate-900 to-indigo-950/60",   border: "border-indigo-500/50",   badge: "bg-indigo-600",   accent: "text-indigo-300"   },
  // 5 : Événement aléatoire (imprévu)
  5: { Icon: Dice6,       bg: "from-slate-900 via-slate-900 to-yellow-950/60",   border: "border-yellow-500/50",   badge: "bg-yellow-600",   accent: "text-yellow-300"   },
  // 6 : Clôture trimestrielle (charges fixes, amortissements, effets récurrents)
  6: { Icon: Landmark,    bg: "from-slate-900 via-slate-900 to-rose-950/60",     border: "border-rose-500/50",     badge: "bg-rose-600",     accent: "text-rose-300"     },
  // 7 : Bilan de fin de trimestre (photo patrimoniale)
  7: { Icon: BarChart3,   bg: "from-slate-900 via-slate-900 to-teal-950/60",     border: "border-teal-500/50",     badge: "bg-teal-600",     accent: "text-teal-300"     },
};

// Briefcase conservé en fallback défensif pour un eventual etape hors borne.
const FALLBACK_ICON: LucideIcon = Briefcase;

export default function ModalEtape({ etape, onClose }: Props) {
  const modal = MODALES_ETAPES[etape];
  const config = ETAPE_CONFIG[etape] ?? {
    Icon: FALLBACK_ICON,
    bg: "from-slate-900 via-slate-900 to-slate-950",
    border: "border-slate-500/50",
    badge: "bg-slate-600",
    accent: "text-slate-300",
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
          <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Ce qui se passe</p>
            <p className="text-slate-200 text-sm leading-relaxed">{modal.ceQuiSePasse}</p>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pourquoi c&apos;est important</p>
            <p className="text-slate-200 text-sm leading-relaxed">{modal.pourquoi}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Impact sur les comptes</p>
              <p className="text-slate-200 text-sm leading-relaxed">{modal.impactComptes}</p>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">💡 Conseil</p>
              <p className="text-slate-200 text-sm leading-relaxed">{modal.conseil}</p>
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
          <p className="text-center text-xs text-slate-500 mt-2">Appuie sur Échap pour fermer</p>
        </div>
      </div>
    </div>
  );
}
