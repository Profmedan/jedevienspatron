"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { LiveState } from "@jedevienspatron/game-engine";

// ─── Types ──────────────────────────────────────────────────────

interface LivePlayer {
  id: string;
  guest_name: string | null;
  entreprise: string | null;
  live_state: LiveState | null;
  last_heartbeat: string | null;
  is_bankrupt: boolean;
  final_score: number | null;
}

interface SessionInfo {
  room_code: string;
  status: string;
  nb_tours: number;
}

// ─── Étiquette étape ─────────────────────────────────────────────

const ETAPE_LABELS: Record<number, string> = {
  0: "Charges fixes",
  1: "Achats",
  2: "Créances",
  3: "Commerciaux",
  4: "Ventes",
  5: "Effets récurrents",
  6: "Décision",
  7: "Événement",
  8: "Bilan fin trimestre",
};

// ─── Composant carte joueur ──────────────────────────────────────

function PlayerCard({ player }: { player: LivePlayer }) {
  const live = player.live_state;
  const isActive = player.last_heartbeat
    ? Date.now() - new Date(player.last_heartbeat).getTime() < 5 * 60 * 1000 // 5 min
    : false;

  // Si pas de live_state, le joueur n'a pas encore commencé
  if (!live) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 opacity-50">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-300">{player.guest_name ?? "Anonyme"}</span>
          <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">En attente</span>
        </div>
        <p className="text-xs text-gray-600">{player.entreprise ?? "—"}</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-xl border p-4 transition-all ${
      live.elimine
        ? "border-red-800/50 bg-red-950/20"
        : isActive
        ? "border-emerald-700/50"
        : "border-gray-700"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-gray-600"}`} />
          <span className="font-medium text-gray-100">{player.guest_name ?? "Anonyme"}</span>
        </div>
        {live.elimine ? (
          <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded-full">💀 Faillite</span>
        ) : (
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            T{live.tour} — {ETAPE_LABELS[live.etape] ?? `Étape ${live.etape}`}
          </span>
        )}
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-500">Trésorerie</div>
          <div className={`font-mono font-bold ${live.tresorerie < 0 ? "text-red-400" : "text-gray-100"}`}>
            {Math.round(live.tresorerie).toLocaleString("fr-FR")} €
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-500">Score</div>
          <div className="font-mono font-bold text-blue-400">
            {Math.round(live.score)}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-500">Résultat net</div>
          <div className={`font-mono font-bold ${live.resultatNet < 0 ? "text-red-400" : "text-emerald-400"}`}>
            {Math.round(live.resultatNet).toLocaleString("fr-FR")} €
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-500">Commerciaux</div>
          <div className="font-mono font-bold text-gray-100">{live.nbCommerciaux}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────

export default function LiveDashboardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données initiales
  const fetchData = useCallback(async () => {
    if (!params.id) return;
    const supabase = createClient();

    // Session info
    const { data: sess, error: sessErr } = await supabase
      .from("game_sessions")
      .select("room_code, status, nb_tours")
      .eq("id", params.id)
      .single();

    if (sessErr || !sess) {
      setError("Session introuvable ou accès refusé");
      setLoading(false);
      return;
    }
    setSession(sess as SessionInfo);

    // Joueurs
    const { data: playersData } = await supabase
      .from("game_players")
      .select("id, guest_name, entreprise, live_state, last_heartbeat, is_bankrupt, final_score")
      .eq("session_id", params.id)
      .order("created_at", { ascending: true });

    setPlayers((playersData ?? []) as unknown as LivePlayer[]);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Supabase Realtime : écouter les changements sur game_players ──
  useEffect(() => {
    if (!params.id) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`live-session-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_players",
          filter: `session_id=eq.${params.id}`,
        },
        (payload) => {
          const updated = payload.new as unknown as LivePlayer;
          setPlayers((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_players",
          filter: `session_id=eq.${params.id}`,
        },
        (payload) => {
          const inserted = payload.new as unknown as LivePlayer;
          setPlayers((prev) => {
            if (prev.find((p) => p.id === inserted.id)) return prev;
            return [...prev, inserted];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  // ── Statistiques live ──────────────────────────────────────────
  const activePlayers = players.filter((p) => p.live_state && !p.live_state.elimine);
  const eliminatedCount = players.filter((p) => p.live_state?.elimine).length;
  const avgTour = activePlayers.length > 0
    ? Math.round(activePlayers.reduce((s, p) => s + (p.live_state?.tour ?? 0), 0) / activePlayers.length)
    : 0;
  const topScore = players.reduce((m, p) => Math.max(m, p.live_state?.score ?? 0), 0);

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4">📡</div>
          <p className="text-gray-400">Connexion au live...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl">😕</div>
          <p className="text-red-400 font-semibold">{error ?? "Erreur inconnue"}</p>
          <Link href="/dashboard" className="text-blue-400 hover:underline">← Tableau de bord</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/sessions/${params.id}`} className="text-gray-400 hover:text-gray-100 text-sm">
              ← Résultats
            </Link>
            <span className="text-gray-600">|</span>
            <span className="font-mono font-bold text-gray-200 text-lg">{session.room_code}</span>
            <span className="flex items-center gap-1.5 text-xs bg-emerald-900/50 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              EN DIRECT
            </span>
          </div>
          {session.status === "finished" && (
            <Link
              href={`/rapport/${session.room_code}`}
              className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg transition font-medium"
            >
              📊 Rapport pédagogique
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats résumé */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 text-center">
            <div className="text-2xl font-black text-gray-100">{players.length}</div>
            <div className="text-xs text-gray-400">Joueurs</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 text-center">
            <div className="text-2xl font-black text-blue-400">T{avgTour}</div>
            <div className="text-xs text-gray-400">Trimestre moyen</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 text-center">
            <div className="text-2xl font-black text-emerald-400">{Math.round(topScore)}</div>
            <div className="text-xs text-gray-400">Meilleur score</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 text-center">
            <div className="text-2xl font-black text-red-400">{eliminatedCount}</div>
            <div className="text-xs text-gray-400">Faillites</div>
          </div>
        </div>

        {/* Grille joueurs */}
        {players.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-gray-400">Aucun joueur n&apos;a encore rejoint cette session.</p>
            <p className="text-gray-500 text-sm mt-2">
              Code à partager : <span className="font-mono font-bold text-blue-400">{session.room_code}</span>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players
              .sort((a, b) => (b.live_state?.score ?? 0) - (a.live_state?.score ?? 0))
              .map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
