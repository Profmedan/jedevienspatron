"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { TrimSnapshot } from "@jedevienspatron/game-engine";
import { getPlayerColor } from "@/components/rapport/ReportCharts";

// Lazy-load Recharts (heavy) — no SSR
const ReportCharts = dynamic(() => import("@/components/rapport/ReportCharts"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-900/50 rounded-xl animate-pulse" />,
});
const DiagnosticPanel = dynamic(() => import("@/components/rapport/DiagnosticPanel"), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />,
});

// ─── Types API ──────────────────────────────────────────────────

interface PlayerData {
  id: string;
  pseudo: string;
  entreprise: string;
  score: number;
  rank: number;
  isBankrupt: boolean;
  bankruptAtTour: number | null;
  snapshots: TrimSnapshot[];
}

interface SessionData {
  room_code: string;
  nb_tours: number;
  created_at: string;
  finished_at: string;
}

interface RapportData {
  session: SessionData;
  players: PlayerData[];
}

// ─── Médailles ───────────────────────────────────────────────────

const MEDALS = ["🥇", "🥈", "🥉"];

// ─── Page ────────────────────────────────────────────────────────

export default function RapportPage() {
  const params = useParams<{ room_code: string }>();
  const [data, setData] = useState<RapportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.room_code) return;
    fetch(`/api/rapport/${params.room_code}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Session introuvable" : "Erreur serveur");
        return r.json();
      })
      .then((d: RapportData) => setData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.room_code]);

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4">📊</div>
          <p className="text-gray-400">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  // ── Erreur ─────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl">😕</div>
          <p className="text-red-400 font-semibold">{error ?? "Données introuvables"}</p>
          <Link href="/jeu" className="text-blue-400 hover:underline">← Retour au jeu</Link>
        </div>
      </div>
    );
  }

  const { session, players } = data;
  const isMulti = players.length > 1;
  const dateFormatted = new Date(session.finished_at).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // Préparer les données pour les graphiques
  const chartPlayers = players.map((p, i) => ({
    pseudo: p.pseudo,
    color: getPlayerColor(i),
    snapshots: p.snapshots,
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold">📊 Rapport pédagogique</h1>
          <p className="text-gray-400">
            Session <span className="font-mono text-blue-400">{session.room_code}</span> —{" "}
            {session.nb_tours} trimestres — {dateFormatted}
          </p>
        </header>

        {/* ── Classement ──────────────────────────────────────────── */}
        <section className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">
            {isMulti ? "🏆 Classement final" : "🏆 Résultat"}
          </h2>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">
                    {p.isBankrupt ? "💀" : (MEDALS[i] ?? `${i + 1}.`)}
                  </span>
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPlayerColor(i) }}
                  />
                  <div>
                    <span className="font-medium">{p.pseudo}</span>
                    <span className="text-gray-500 text-sm ml-2">({p.entreprise})</span>
                  </div>
                </div>
                <div className="text-right">
                  {p.isBankrupt ? (
                    <span className="text-red-400 text-sm">Faillite T{p.bankruptAtTour}</span>
                  ) : (
                    <span className="text-2xl font-bold text-blue-400">{p.score}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Graphiques ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold mb-4">📈 Évolutions trimestrielles</h2>
          <ReportCharts players={chartPlayers} />
        </section>

        {/* ── Diagnostics ─────────────────────────────────────────── */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">🔍 Diagnostic pédagogique</h2>
          {players.map((p, i) => (
            <DiagnosticPanel
              key={p.id}
              pseudo={p.pseudo}
              snapshots={p.snapshots}
              color={getPlayerColor(i)}
            />
          ))}
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="text-center pt-4 pb-8 space-y-3">
          <div className="flex justify-center gap-4">
            <Link
              href="/jeu"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition font-medium"
            >
              🔄 Nouvelle partie
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
            >
              📋 Tableau de bord
            </Link>
          </div>
          <p className="text-gray-600 text-xs">
            Je Deviens Patron — Jeu sérieux de comptabilité/gestion
          </p>
        </footer>
      </div>
    </div>
  );
}
