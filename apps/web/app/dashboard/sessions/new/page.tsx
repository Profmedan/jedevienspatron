"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSessionPage() {
  const router = useRouter();
  const [nbTours, setNbTours] = useState<4 | 6 | 8>(6);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ room_code: string; id: string } | null>(null);

  const durations: Record<number, string> = {
    4: "~1h — session courte",
    6: "~1h30 — session standard ✓",
    8: "~2h — session longue",
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nb_tours: nbTours }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Erreur lors de la création");
        return;
      }

      setResult(data.session);
    } catch {
      setError("Erreur réseau, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Écran succès : afficher le code ─────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full p-8 text-center space-y-6">
          <div>
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-black text-gray-900">Session créée !</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Donnez ce code à vos apprenants. Ils l&apos;entrent sur la page d&apos;accueil pour rejoindre la session.
            </p>
          </div>

          {/* Code affiché en grand */}
          <div className="bg-indigo-50 border-2 border-indigo-300 rounded-2xl py-8 px-6">
            <p className="text-xs text-indigo-500 font-semibold uppercase tracking-widest mb-2">Code d&apos;accès</p>
            <p className="font-mono font-black text-5xl text-indigo-700 tracking-[0.2em]">
              {result.room_code}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>💡 Instruction pour les apprenants :</strong><br />
            Allez sur <span className="font-mono font-semibold">kiclepatron.fr</span> → saisissez le code <strong className="font-mono">{result.room_code}</strong> → cliquez sur &quot;Rejoindre la session&quot;
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.room_code);
              }}
              className="flex-1 border-2 border-indigo-300 text-indigo-700 font-semibold py-3 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
            >
              📋 Copier le code
            </button>
            <Link
              href={`/dashboard/sessions/${result.id}`}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm text-center"
            >
              Voir les résultats →
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="block text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  // ─── Formulaire de création ───────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Tableau de bord
          </Link>
          <span className="text-gray-200">|</span>
          <h1 className="font-bold text-gray-900">Nouvelle session</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Créer une session de jeu</h2>
            <p className="text-gray-500 text-sm">
              Choisissez la durée, puis lancez. Vous obtiendrez un code à partager avec vos apprenants.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-8">

            {/* Nom du groupe (optionnel) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du groupe / classe <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="ex : Terminale STMG A — Mars 2026"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Pour retrouver cette session facilement dans votre historique.</p>
            </div>

            {/* Choix du nombre de trimestres */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Durée de la session
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([4, 6, 8] as const).map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNbTours(n)}
                    className={`
                      rounded-xl border-2 p-4 text-left transition-all
                      ${nbTours === n
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300 bg-white"
                      }
                    `}
                  >
                    <div className={`font-black text-2xl mb-1 ${nbTours === n ? "text-indigo-700" : "text-gray-700"}`}>
                      {n}
                    </div>
                    <div className={`font-semibold text-sm ${nbTours === n ? "text-indigo-700" : "text-gray-700"}`}>
                      trimestres
                    </div>
                    <div className={`text-xs mt-1 ${nbTours === n ? "text-indigo-500" : "text-gray-400"}`}>
                      {durations[n]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Résumé */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-600">
              <p>
                <strong className="text-gray-900">Récapitulatif :</strong>{" "}
                Session de <strong>{nbTours} trimestres</strong>
                {groupName && <> · Groupe : <strong>{groupName}</strong></>}
                {" "}· Chaque apprenant joue en autonomie sur son propre appareil
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-lg"
            >
              {loading ? "Création en cours…" : "🚀 Créer la session et obtenir le code"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
