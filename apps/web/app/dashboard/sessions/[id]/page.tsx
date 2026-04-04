import { redirect, notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Player = {
  id: string;
  guest_name: string | null;
  entreprise: string | null;
  final_score: number | null;
  is_bankrupt: boolean;
  rank: number | null;
  etat_final: Record<string, unknown> | null;
  created_at: string;
};

type Session = {
  id: string;
  room_code: string;
  status: "waiting" | "playing" | "finished";
  nb_tours: number;
  created_at: string;
  finished_at: string | null;
  classes: { name: string } | null;
  game_players: Player[];
};

export default async function SessionResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: session } = await serviceClient
    .from("game_sessions")
    .select(
      `id, room_code, status, nb_tours, created_at, finished_at,
       classes(name),
       game_players(id, guest_name, entreprise, final_score, is_bankrupt, rank, etat_final, created_at)`
    )
    .eq("id", id)
    .eq("teacher_id", user.id) // Sécurité : seul le créateur voit ses sessions
    .single();

  if (!session) notFound();

  const typedSession = session as unknown as Session;
  const players = [...(typedSession.game_players ?? [])].sort(
    (a, b) => (a.rank ?? 99) - (b.rank ?? 99)
  );

  const statusLabels: Record<string, string> = {
    waiting: "⏳ En attente des joueurs",
    playing: "🎮 En cours",
    finished: "✅ Terminée",
  };
  const statusColors: Record<string, string> = {
    waiting: "bg-yellow-900/30 text-yellow-300 border-yellow-800",
    playing: "bg-emerald-900/30 text-emerald-300 border-emerald-800",
    finished: "bg-gray-800 text-gray-400 border-gray-700",
  };

  const dateCreation = new Date(typedSession.created_at).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const nbBankrupts = players.filter((p) => p.is_bankrupt).length;
  const nbPlayers = players.length;
  const avgScore =
    nbPlayers > 0
      ? Math.round(
          players.reduce((sum, p) => sum + (p.final_score ?? 0), 0) / nbPlayers
        )
      : 0;
  const maxScore = players.reduce((m, p) => Math.max(m, p.final_score ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-100 transition-colors text-sm"
            >
              ← Tableau de bord
            </Link>
            <span className="text-gray-600">|</span>
            <span className="font-mono font-bold text-gray-200 text-lg">
              {typedSession.room_code}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusColors[typedSession.status] ?? ""}`}
            >
              {statusLabels[typedSession.status] ?? typedSession.status}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Infos session */}
        <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-100 mb-1">
                Résultats de la session
              </h1>
              {typedSession.classes && (
                <p className="text-indigo-400 font-semibold text-sm">
                  🏫 {typedSession.classes.name}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-1">{dateCreation}</p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-black text-gray-100">{typedSession.nb_tours}</div>
                <div className="text-xs text-gray-400">trimestres</div>
              </div>
              <div>
                <div className="text-2xl font-black text-indigo-400">{nbPlayers}</div>
                <div className="text-xs text-gray-400">joueur{nbPlayers > 1 ? "s" : ""}</div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-400">{nbBankrupts}</div>
                <div className="text-xs text-gray-400">faillite{nbBankrupts > 1 ? "s" : ""}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Code d’accès si session encore active */}
        {typedSession.status !== "finished" && (
          <div className="bg-indigo-950/30 border border-indigo-800 rounded-2xl p-6 flex items-center justify-between gap-6">
            <div>
              <p className="font-semibold text-indigo-200 mb-1">Session en cours — partagez le code :</p>
              <p className="text-indigo-400 text-sm">
                Les apprenants entrent ce code sur la page d&apos;accueil pour rejoindre.
              </p>
            </div>
            <div className="text-center">
              <div className="font-mono font-black text-4xl text-indigo-300 tracking-[0.2em] bg-gray-800 border-2 border-indigo-800 rounded-xl px-6 py-3">
                {typedSession.room_code}
              </div>
            </div>
          </div>
        )}

        {/* Statistiques globales */}
        {nbPlayers > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-5 text-center">
              <div className="text-3xl font-black text-gray-100">{avgScore.toLocaleString("fr-FR")} €</div>
              <div className="text-xs text-gray-400 mt-1">Score moyen</div>
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-5 text-center">
              <div className="text-3xl font-black text-emerald-400">{maxScore.toLocaleString("fr-FR")} €</div>
              <div className="text-xs text-gray-400 mt-1">Meilleur score</div>
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-5 text-center">
              <div className="text-3xl font-black text-red-400">
                {nbPlayers > 0 ? Math.round((nbBankrupts / nbPlayers) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-400 mt-1">Taux de faillite</div>
            </div>
          </div>
        )}

        {/* Tableau des joueurs */}
        <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-bold text-gray-100">Classement des apprenants</h2>
            {nbPlayers === 0 && (
              <span className="text-xs text-gray-500">En attente des joueurs…</span>
            )}
          </div>

          {nbPlayers === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-gray-400 text-sm">Aucun apprenant n&apos;a encore rejoint cette session.</p>
              <p className="text-gray-500 text-xs mt-2">
                Partagez le code <span className="font-mono font-bold">{typedSession.room_code}</span> pour commencer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Rang
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Apprenant
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Entreprise
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Score final
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Résultat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {players.map((player, idx) => {
                    const isFirst = idx === 0 && !player.is_bankrupt;
                    return (
                      <tr
                        key={player.id}
                        className={`hover:bg-gray-800 transition-colors ${
                          player.is_bankrupt ? "opacity-60" : ""
                        } ${isFirst ? "bg-yellow-950/30" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              isFirst
                                ? "bg-yellow-500 text-white"
                                : idx === 1
                                ? "bg-gray-600 text-gray-100"
                                : idx === 2
                                ? "bg-amber-700 text-white"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {player.rank ?? idx + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-100">
                          {player.guest_name ?? "Anonyme"}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {player.entreprise ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-gray-100">
                          {player.final_score != null
                            ? `${player.final_score.toLocaleString("fr-FR")} €`
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {player.is_bankrupt ? (
                            <span className="inline-flex items-center gap-1 bg-red-950/30 text-red-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                              💥 Faillite
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-950/30 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                              ✅ Actif
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Message pédagogique */}
        {nbPlayers > 0 && nbBankrupts > 0 && (
          <div className="bg-amber-950/30 border border-amber-800 rounded-2xl p-5 text-sm text-amber-200">
            <strong>💡 Point pédagogique :</strong> {nbBankrupts} apprenant{nbBankrupts > 1 ? "s ont" : " a"} fait
            faillite — c&apos;est une excellente occasion d&apos;analyser ensemble les causes :
            trésorerie négative, endettement excessif, charges trop élevées par rapport aux produits…
          </div>
        )}

      </main>
    </div>
  );
}
