"use client";

import Link from "next/link";
import { Joueur } from "@jedevienspatron/game-engine";

interface HeaderJeuProps {
  joueurs: Joueur[];
  joueurActifIdx: number;
  tourActuel: number;
  nbToursMax: number;
  etapeTour: number;
  etapeTitle: string;
  /** Callback d'ouverture du mode relecture (undefined = bouton masqué) */
  onOpenReplay?: () => void;
  /** Vrai si le journal contient au moins une étape → bouton actif */
  canReplay?: boolean;
}

export function HeaderJeu({
  joueurs,
  joueurActifIdx,
  tourActuel,
  nbToursMax,
  etapeTour,
  etapeTitle,
  onOpenReplay,
  canReplay,
}: HeaderJeuProps) {
  const joueurActif = joueurs[joueurActifIdx];

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[linear-gradient(90deg,#0f172a_0%,#172554_48%,#0f172a_100%)] px-3 py-2 text-white shadow-lg shadow-slate-950/35 sm:px-4 sm:py-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-cyan-100 transition-colors hover:bg-white/10"
          >
            ← Accueil
          </Link>
          <div className="min-w-0">
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:block">
              JE DEVIENS PATRON
            </p>
            <p className="truncate text-sm font-semibold text-white">{etapeTitle}</p>
          </div>
        </div>

        {onOpenReplay && (
          <button
            type="button"
            onClick={onOpenReplay}
            disabled={!canReplay}
            title={canReplay ? "Revoir les étapes passées (Retour arrière)" : "Aucune étape à relire pour l'instant"}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              canReplay
                ? "border-violet-400/30 bg-violet-400/10 text-violet-100 hover:bg-violet-400/20"
                : "border-white/5 bg-white/5 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>⏮ Revoir</span>
          </button>
        )}

        <div className="order-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-center sm:px-4 sm:py-2">
          <div className="text-[11px] font-semibold text-cyan-100 sm:hidden">
            T{tourActuel}/{nbToursMax} · E{etapeTour + 1}/9
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100 sm:text-xs sm:tracking-[0.18em]">
            <span className="hidden sm:inline">Trimestre {tourActuel}/{nbToursMax}</span>
          </div>
          <div className="hidden text-xs text-slate-200 sm:block sm:text-sm">Étape {etapeTour + 1}/9</div>
        </div>

        <div className="order-3 hidden flex-wrap items-center gap-2 sm:flex sm:justify-end">
          {joueurs.map((joueur) => (
            <div
              key={joueur.id}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                joueur.id === joueurActif.id
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-300"
              } ${joueur.elimine ? "line-through opacity-40" : ""}`}
              title={joueur.elimine ? "Éliminé (faillite)" : "En jeu"}
            >
              {joueur.entreprise.icon} {joueur.pseudo}
            </div>
          ))}
        </div>

        <div
          className={`order-1 shrink-0 rounded-full px-3 py-1 text-xs font-semibold sm:hidden ${
            joueurActif.elimine
              ? "line-through bg-white/5 text-slate-400"
              : "bg-white text-slate-950"
          }`}
          title={joueurActif.elimine ? "Éliminé (faillite)" : "En jeu"}
        >
          {joueurActif.entreprise.icon} {joueurActif.pseudo}
        </div>
      </div>
    </header>
  );
}
