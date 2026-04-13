"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────

interface PlayerSnapshots {
  pseudo: string;
  color: string;
  snapshots: Array<{
    tour: number;
    tresorerie: number;
    chiffreAffaires: number;
    score: number;
  }>;
}

interface ReportChartsProps {
  players: PlayerSnapshots[];
}

// Couleurs pour distinguer les joueurs en multi
const PLAYER_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

export function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

// ─── Formateur d'axe Y (K€) ─────────────────────────────────────

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}K€`;
  return `${Math.round(value)}€`;
}

// ─── Tooltip personnalisé ────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm">
      <p className="text-gray-400 font-medium mb-1">Trimestre {label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{formatEuro(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────

export default function ReportCharts({ players }: ReportChartsProps) {
  if (!players.length || !players[0].snapshots.length) {
    return <p className="text-gray-500 text-center py-8">Aucune donnée de snapshots disponible.</p>;
  }

  // Construire les données fusionnées pour Recharts
  // Format : [{ tour: 1, "Alice_tresorerie": 5000, "Bob_tresorerie": 4000, ... }]
  const allTours = new Set<number>();
  for (const p of players) {
    for (const s of p.snapshots) allTours.add(s.tour);
  }
  const tours = Array.from(allTours).sort((a, b) => a - b);

  function buildChartData(field: "tresorerie" | "chiffreAffaires" | "score") {
    return tours.map((tour) => {
      const point: Record<string, number | string> = { tour: `T${tour}` };
      for (const p of players) {
        const snap = p.snapshots.find((s) => s.tour === tour);
        point[p.pseudo] = snap ? snap[field] : 0;
      }
      return point;
    });
  }

  const tresoData = buildChartData("tresorerie");
  const caData = buildChartData("chiffreAffaires");
  const scoreData = buildChartData("score");

  const charts: Array<{ title: string; data: typeof tresoData; format: (v: number) => string }> = [
    { title: "📈 Évolution de la trésorerie", data: tresoData, format: formatEuro },
    { title: "💰 Évolution du chiffre d'affaires", data: caData, format: formatEuro },
    { title: "🏆 Évolution du score", data: scoreData, format: (v: number) => String(Math.round(v)) },
  ];

  return (
    <div className="space-y-8">
      {charts.map((chart) => (
        <div key={chart.title} className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">{chart.title}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="tour" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={chart.format} />
              <Tooltip content={<CustomTooltip />} />
              {players.length > 1 && <Legend />}
              {players.map((p) => (
                <Line
                  key={p.pseudo}
                  type="monotone"
                  dataKey={p.pseudo}
                  stroke={p.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={p.pseudo}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
