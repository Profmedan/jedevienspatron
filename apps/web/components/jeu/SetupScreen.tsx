"use client";

import { useState } from "react";
import Link from "next/link";
import { NomEntreprise } from "@/lib/game-engine/types";
import { ENTREPRISES } from "@/lib/game-engine/data/entreprises";

export interface PlayerSetup {
  pseudo: string;
  entreprise: NomEntreprise;
}

interface SetupScreenProps {
  onStart: (players: PlayerSetup[], nbTours: number) => void;
}

/**
 * Écran de configuration initial
 * Sélection nombre de joueurs, pseudo, entreprise, nombre de trimestres
 */
export function SetupScreen({ onStart }: SetupScreenProps) {
  const [nbJoueurs, setNbJoueurs] = useState(1);
  const [nbTours, setNbTours] = useState(12);

  const defaults: PlayerSetup[] = [
    { pseudo: "", entreprise: "Manufacture Belvaux" },
    { pseudo: "", entreprise: "Véloce Transports" },
    { pseudo: "", entreprise: "Azura Commerce" },
    { pseudo: "", entreprise: "Synergia Lab" },
  ];

  const [players, setPlayers] = useState<PlayerSetup[]>(defaults);
  const allEntreprises = ENTREPRISES.map((e) => e.nom);
  const usedEnts = players.slice(0, nbJoueurs).map((p) => p.entreprise);

  function update(
    i: number,
    f: "pseudo" | "entreprise",
    v: string
  ) {
    const n = [...players];
    n[i] = { ...n[i], [f]: v };
    setPlayers(n);
  }

  const active = players.slice(0, nbJoueurs);
  const canStart =
    active.every((p) => p.pseudo.trim().length > 0) &&
    new Set(active.map((p) => p.entreprise)).size === nbJoueurs;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-950">
      {/* Retour */}
      <Link
        href="/"
        className="text-indigo-400 text-sm mb-6 hover:underline transition-colors"
      >
        ← Retour à l&apos;accueil
      </Link>

      {/* Titre */}
      <h2 className="text-3xl font-bold text-indigo-200 mb-2">🎮 Configuration</h2>
      <p className="text-gray-500 mb-8 text-sm">
        Choisis le nombre de joueurs et configure ton entreprise
      </p>

      {/* Sélection nombre de joueurs */}
      <div className="flex gap-2 mb-8 items-center flex-wrap justify-center">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setNbJoueurs(n)}
            className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
              nbJoueurs === n
                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-110"
                : "bg-gray-800 text-indigo-300 border-2 border-gray-600 hover:border-indigo-500 hover:bg-gray-700"
            }`}
          >
            {n}
          </button>
        ))}
        <span className="text-gray-500 text-sm ml-2">
          joueur{nbJoueurs > 1 ? "s" : ""}
        </span>
      </div>

      {/* Configuration des joueurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-8">
        {Array.from({ length: nbJoueurs }).map((_, i) => {
          const ent = ENTREPRISES.find((e) => e.nom === players[i].entreprise)!;
          return (
            <div
              key={i}
              className="bg-gray-900 rounded-2xl p-4 border border-gray-700 hover:border-indigo-700 transition-colors"
            >
              {/* Pseudo input */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{ent.icon}</span>
                <input
                  value={players[i].pseudo}
                  onChange={(e) => update(i, "pseudo", e.target.value)}
                  className="flex-1 border-b-2 border-gray-600 focus:border-indigo-500 outline-none px-1 py-0.5 font-bold text-gray-100 placeholder-gray-600 bg-transparent transition-colors"
                  placeholder="Ton prénom ou pseudo"
                  maxLength={20}
                  aria-label={`Pseudo du joueur ${i + 1}`}
                />
              </div>

              {/* Entreprise select */}
              <select
                value={players[i].entreprise}
                onChange={(e) =>
                  update(i, "entreprise", e.target.value as NomEntreprise)
                }
                className="w-full border border-gray-600 bg-gray-800 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                aria-label={`Entreprise du joueur ${i + 1}`}
              >
                {allEntreprises.map((nom) => (
                  <option
                    key={nom}
                    value={nom}
                    disabled={
                      usedEnts.includes(nom) &&
                      players[i].entreprise !== nom
                    }
                  >
                    {nom}
                    {usedEnts.includes(nom) && players[i].entreprise !== nom
                      ? " (déjà prise)"
                      : ""}
                  </option>
                ))}
              </select>

              {/* Info entreprise */}
              <div className="mt-2 text-xs text-gray-500">
                {ent.specialite} · <strong>{ent.type}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Choix du nombre de trimestres */}
      <div className="flex gap-3 mb-8 items-center flex-wrap justify-center">
        <span className="text-gray-500 text-sm font-medium">
          Durée de la partie :
        </span>
        {[6, 8, 12].map((n) => (
          <button
            key={n}
            onClick={() => setNbTours(n)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              nbTours === n
                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                : "bg-gray-800 text-indigo-300 border-2 border-gray-600 hover:border-indigo-500 hover:bg-gray-700"
            }`}
          >
            <div>{n} trimestres</div>
            <div className="text-xs font-normal opacity-70">
              {n === 6 ? "~1h30" : n === 8 ? "~2h" : "~3h ✓"}
            </div>
          </button>
        ))}
      </div>

      {/* Bouton démarrer */}
      <button
        onClick={() => onStart(players.slice(0, nbJoueurs), nbTours)}
        disabled={!canStart}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 text-white font-bold px-12 py-4 rounded-2xl text-lg shadow-lg transition-all active:scale-95"
        aria-label="Suivant: Comprendre le bilan de départ"
      >
        🚀 Suivant — Comprendre mon bilan de départ
      </button>
    </div>
  );
}
