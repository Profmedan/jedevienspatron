import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type RecentSession = {
  id: string;
  room_code: string;
  status: string;
  nb_tours: number;
  created_at: string;
  finished_at: string | null;
  classes: { name: string } | null;
  game_players: { id: string; final_score: number | null; is_bankrupt: boolean }[];
};

type ClassSummary = {
  id: string;
  name: string;
  created_at: string;
  class_members: { id: string }[];
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(name)")
    .eq("id", user.id)
    .single();

  const { data: recentSessions } = await supabase
    .from("game_sessions")
    .select(`id, room_code, status, nb_tours, created_at, finished_at, classes(name), game_players(id, final_score, is_bankrupt)`)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: classes } = await supabase
    .from("classes")
    .select(`id, name, created_at, class_members(id)`)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const { count: totalSessions } = await supabase
    .from("game_sessions")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", user.id);

  const { count: totalPlayers } = await supabase
    .from("game_players")
    .select("*, game_sessions!inner(teacher_id)", { count: "exact", head: true })
    .eq("game_sessions.teacher_id", user.id);

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Utilisateur";
  const orgName = (profile?.organizations as { name?: string } | null)?.name ?? "";

  const typedSessions = (recentSessions ?? []) as RecentSession[];
  const typedClasses = (classes ?? []) as ClassSummary[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h1 className="font-black text-gray-900 text-lg leading-none">JE DEVIENS PATRON</h1>
              {orgName && <p className="text-xs text-gray-400">{orgName}</p>}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Bienvenue */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bonjour, {displayName} 👋</h2>
            <p className="text-gray-500 mt-1">Tableau de bord JE DEVIENS PATRON</p>
          </div>
          <Link
            href="/dashboard/sessions/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <span>▶</span> Nouvelle session
          </Link>
        </div>

        {/* Explication du fonctionnement */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 text-lg mb-3">💡 Comment ça fonctionne ?</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-2xl mb-2">1️⃣</div>
              <div className="font-bold mb-1">Lancez une partie</div>
              <div className="text-blue-600">Cliquez sur &quot;Lancer une partie&quot;. Vous obtenez un code unique (ex: KIC-4A2B).</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-2xl mb-2">2️⃣</div>
              <div className="font-bold mb-1">Partagez le code</div>
              <div className="text-blue-600">Donnez ce code à vos apprenants. Ils l&apos;entrent sur le site pour rejoindre la session.</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-2xl mb-2">3️⃣</div>
              <div className="font-bold mb-1">Suivez les résultats</div>
              <div className="text-blue-600">Les scores s&apos;enregistrent automatiquement ici à la fin de chaque partie.</div>
            </div>
          </div>
          <p className="text-blue-700 text-xs mt-4">
            💬 <strong>Astuce :</strong> les apprenants jouent sur leur propre appareil en saisissant le code sur la page d&apos;accueil. Aucun compte nécessaire pour eux.
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="🎮" label="Sessions total" value={totalSessions ?? 0} />
          <StatCard icon="👥" label="Joueurs total" value={totalPlayers ?? 0} />
          <StatCard icon="🏫" label="Classes" value={typedClasses.length} />
          <StatCard icon="✅" label="Sessions terminées" value={typedSessions.filter(s => s.status === "finished").length} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sessions récentes */}
          <section>
            <h3 className="font-bold text-gray-900 mb-4">Sessions récentes</h3>
            {typedSessions.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                <div className="text-3xl mb-2">🎮</div>
                <p className="text-gray-500 text-sm mb-4">Aucune session pour l&apos;instant</p>
                <Link href="/dashboard/sessions/new" className="text-sm text-blue-600 font-semibold hover:underline">
                  Créer votre première session →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {typedSessions.map(session => (
                  <Link key={session.id} href={`/dashboard/sessions/${session.id}`}>
                    <SessionCard session={session} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Classes */}
          <section>
            <h3 className="font-bold text-gray-900 mb-4">Mes groupes / classes</h3>
            {typedClasses.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                <div className="text-3xl mb-2">🏫</div>
                <p className="text-gray-500 text-sm">Aucun groupe créé pour l&apos;instant.</p>
                <p className="text-gray-400 text-xs mt-2">La gestion des groupes sera disponible prochainement.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {typedClasses.map(cls => <ClassCard key={cls.id} cls={cls} />)}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function SessionCard({ session }: { session: RecentSession }) {
  const statusColors: Record<string, string> = {
    waiting: "bg-yellow-100 text-yellow-700",
    playing: "bg-green-100 text-green-700",
    finished: "bg-gray-100 text-gray-500",
  };
  const statusLabels: Record<string, string> = {
    waiting: "En attente",
    playing: "En cours",
    finished: "Terminée",
  };

  const nbPlayers = session.game_players?.length ?? 0;
  const date = new Date(session.created_at).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-gray-900 text-sm">{session.room_code}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[session.status] ?? ""}`}>
          {statusLabels[session.status] ?? session.status}
        </span>
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-3">
        <span>📅 {date}</span>
        <span>👥 {nbPlayers} joueur{nbPlayers > 1 ? "s" : ""}</span>
        {session.classes && <span>🏫 {session.classes.name}</span>}
      </div>
    </div>
  );
}

function ClassCard({ cls }: { cls: ClassSummary }) {
  const nbStudents = cls.class_members?.length ?? 0;
  return (
    <div className="block bg-white border border-gray-100 rounded-xl p-4">
      <div className="font-semibold text-gray-900 text-sm">{cls.name}</div>
      <div className="text-xs text-gray-500 mt-1">
        👤 {nbStudents} participant{nbStudents > 1 ? "s" : ""}
      </div>
    </div>
  );
}
