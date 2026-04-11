"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Clock3, Users } from "lucide-react";
import { NomEntreprise, ENTREPRISES } from "@jedevienspatron/game-engine";

export interface PlayerSetup {
  pseudo: string;
  entreprise: NomEntreprise;
}

interface SetupScreenProps {
  onStart: (players: PlayerSetup[], nbTours: number) => void;
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [nbJoueurs, setNbJoueurs] = useState(1);
  const [nbTours, setNbTours] = useState(8);

  const defaults: PlayerSetup[] = [
    { pseudo: "", entreprise: "Manufacture Belvaux" },
    { pseudo: "", entreprise: "Véloce Transports" },
    { pseudo: "", entreprise: "Azura Commerce" },
    { pseudo: "", entreprise: "Synergia Lab" },
  ];

  const [players, setPlayers] = useState<PlayerSetup[]>(defaults);
  const allEntreprises = ENTREPRISES.map((e) => e.nom);
  const usedEnts = players.slice(0, nbJoueurs).map((p) => p.entreprise);

  function update(index: number, field: "pseudo" | "entreprise", value: string) {
    const nextPlayers = [...players];
    nextPlayers[index] = { ...nextPlayers[index], [field]: value };
    setPlayers(nextPlayers);
  }

  const activePlayers = players.slice(0, nbJoueurs);
  const canStart =
    activePlayers.every((player) => player.pseudo.trim().length > 0) &&
    new Set(activePlayers.map((player) => player.entreprise)).size === nbJoueurs;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#12324a_0%,#08111f_36%,#020617_100%)] px-6 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-100 transition-colors hover:bg-white/10"
          >
            ← Retour à l&apos;accueil
          </Link>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            Préparation de la partie
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <section className="space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Étape 1
              </p>
              <h1 className="max-w-[12ch] text-4xl font-bold leading-tight text-white sm:text-5xl">
                Préparez votre entreprise avant de jouer.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                Choisissez le nombre de joueurs, attribuez un pseudo à chacun,
                sélectionnez une entreprise et fixez la durée de la partie.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <InfoTile
                icon={Users}
                label="Participants"
                value={`${nbJoueurs} joueur${nbJoueurs > 1 ? "s" : ""}`}
              />
              <InfoTile
                icon={Clock3}
                label="Durée"
                value={`${nbTours} trimestres`}
              />
              <InfoTile
                icon={Building2}
                label="Entreprises"
                value="Toutes différentes"
              />
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-6">
              <h2 className="text-lg font-bold text-white">Conseil de démarrage</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Pour une première découverte, commencez avec{" "}
                <strong className="text-slate-200">1 joueur sur 6 trimestres</strong>.
                Pour une séance plus riche en comparaison, passez à 2 ou 3 joueurs.
              </p>
            </div>
          </section>

          <section className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/35 sm:p-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">Configurer la partie</h2>
              <p className="text-sm leading-6 text-slate-400">
                Chaque joueur doit avoir un pseudo et une entreprise différente.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Nombre de joueurs
              </p>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setNbJoueurs(count)}
                    className={`inline-flex h-12 min-w-12 cursor-pointer items-center justify-center rounded-2xl px-4 text-base font-bold transition-all ${
                      nbJoueurs === count
                        ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {Array.from({ length: nbJoueurs }).map((_, index) => {
                const entreprise = ENTREPRISES.find(
                  (item) => item.nom === players[index].entreprise,
                )!;

                return (
                  <div
                    key={index}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl">
                        {entreprise.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Joueur {index + 1}
                        </p>
                        <p className="text-sm text-slate-300">{entreprise.specialite}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        value={players[index].pseudo}
                        onChange={(e) => update(index, "pseudo", e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                        placeholder="Prénom ou pseudo"
                        maxLength={20}
                        aria-label={`Pseudo du joueur ${index + 1}`}
                      />

                      <select
                        value={players[index].entreprise}
                        onChange={(e) =>
                          update(index, "entreprise", e.target.value as NomEntreprise)
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                        aria-label={`Entreprise du joueur ${index + 1}`}
                      >
                        {allEntreprises.map((nom) => (
                          <option
                            key={nom}
                            value={nom}
                            disabled={usedEnts.includes(nom) && players[index].entreprise !== nom}
                          >
                            {nom}
                            {usedEnts.includes(nom) && players[index].entreprise !== nom
                              ? " (déjà prise)"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      <strong className="text-slate-300">{entreprise.type}</strong> ·{" "}
                      {entreprise.specialite}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Durée de la partie
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { tours: 6,  label: "~1h",    note: "Découverte rapide" },
                  { tours: 8,  label: "~1h15",  note: "Format équilibré" },
                  { tours: 10, label: "~1h30",  note: "Parcours approfondi" },
                  { tours: 12, label: "~1h45",  note: "Parcours complet" },
                ].map((option) => (
                  <button
                    key={option.tours}
                    type="button"
                    onClick={() => setNbTours(option.tours)}
                    className={`cursor-pointer rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                      nbTours === option.tours
                        ? "border-cyan-300 bg-cyan-400/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-base font-bold">{option.tours} trimestres</div>
                    <div className="mt-1 text-sm">{option.label}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {option.note}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onStart(players.slice(0, nbJoueurs), nbTours)}
              disabled={!canStart}
              className="inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-6 py-4 text-base font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              aria-label="Suivant: Comprendre le bilan de départ"
            >
              Démarrer la partie
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-200">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
