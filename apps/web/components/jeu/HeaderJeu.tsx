"use client";

import Link from "next/link";
import { Joueur } from "@/lib/game-engine/types";

interface HeaderJeuProps {
  joueurs: Joueur[];
  joueurActifIdx: number;
  tourActuel: number;
  nbToursMax: number;
  etapeTour: number;
  etapeTitle: string;
}

/**
 * En-tête du jeu avec barre supérieure
 * Affiche titre, progression, et joueurs actifs
 */
export function HeaderJeu({
  joueurs,
  joueurActifIdx,
  tourActuel,
  nbToursMax,
  etapeTour,
  etapeTitle,
}: HeaderJeuProps) {
  return (
    <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-4 py-3 flex items-center justify-between shadow-lg">
      {/* Logo + Titre */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-indigo-200 hover:text-white text-sm transition-colors"
        >
          ← Accueil
        </Link>
        <span className="font-bold text-sm md:text-base flex items-center gap-2">
          <span>🎓</span>
          <span className="hidden sm:inline">JE DEVIENS PATRON</span>
        </span>
      </div>

      {/* Progression au centre */}
      <div className="hidden sm:flex flex-col items-center flex-1 gap-1">
        <div className="bg-white/20 rounded-full px-3 py-0.5 text-xs font-bold text-white tracking-wide">
          Trimestre {tourActuel}/{nbToursMax} · Étape {etapeTour + 1}/9
        </div>
        <div className="text-base font-bold text-white leading-tight">{etapeTitle}</div>
      </div>

      {/* Joueurs actifs */}
      <div className="flex items-center gap-1">
        {joueurs.map((j, i) => (
          <div
            key={j.id}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
              i === joueurActifIdx
                ? "bg-white text-indigo-700 shadow-md"
                : "text-indigo-300"
            } ${j.elimine ? "line-through opacity-40" : ""}`}
            title={j.elimine ? "Éliminé (faillite)" : "En jeu"}
          >
            {j.entreprise.icon} {j.pseudo}
          </div>
        ))}
      </div>
    </header>
  );
}
