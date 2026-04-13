"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  base_enterprise: string;
  totalActif: number;
  actifs?: Array<{ nom: string; valeur: number }>;
  passifs?: Array<{ nom: string; valeur: number }>;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [nbTours, setNbTours] = useState<6 | 8 | 10 | 12>(6);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ room_code: string; id: string } | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [expandTemplates, setExpandTemplates] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const durations: Record<number, string> = {
    6:  "~1h — session standard ✓",
    8:  "~1h15 — session approfondie",
    10: "~1h30 — session complète",
    12: "~1h45 — session longue",
  };

  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates");
        const data = await res.json();
        if (res.ok && data.templates) {
          // Calculate total assets and liabilities for display
          const templatesWithTotals = (data.templates as any[]).map((t: any) => ({
            id: t.id,
            name: t.name,
            base_enterprise: t.base_enterprise,
            totalActif: (t.immo1_valeur || 0) + (t.immo2_valeur || 0) + (t.autres_immo || 0) + (t.stocks || 0) + (t.tresorerie || 0),
          }));
          setTemplates(templatesWithTotals);
        }
      } catch (err) {
        console.error("Erreur chargement templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body: any = { nb_tours: nbTours };
      if (selectedTemplateIds.size > 0) {
        body.template_ids = Array.from(selectedTemplateIds);
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900 rounded-2xl shadow-lg shadow-black/20 border border-gray-700 max-w-md w-full p-8 text-center space-y-6">
          <div>
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-black text-gray-100">Session créée !</h2>
            <p className="text-gray-400 mt-2 text-sm">
              Donnez ce code à vos apprenants. Ils l&apos;entrent sur la page d&apos;accueil pour rejoindre la session.
            </p>
          </div>

          {/* Code affiché en grand */}
          <div className="bg-indigo-950/30 border-2 border-indigo-800 rounded-2xl py-8 px-6">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">Code d&apos;accès</p>
            <p className="font-mono font-black text-5xl text-indigo-300 tracking-[0.2em]">
              {result.room_code}
            </p>
          </div>

          <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4 text-sm text-amber-200">
            <strong>💡 Instruction pour les apprenants :</strong><br />
            Allez sur <span className="font-mono font-semibold">jedevienspatron.fr</span> → saisissez le code <strong className="font-mono">{result.room_code}</strong> → cliquez sur &quot;Rejoindre la session&quot;
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.room_code);
              }}
              className="flex-1 border-2 border-indigo-800 text-indigo-300 font-semibold py-3 rounded-xl hover:bg-indigo-950/30 transition-colors text-sm"
            >
              📋 Copier le code
            </button>
            <Link
              href={`/dashboard/sessions/${result.id}`}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm text-center"
            >
              Voir les résultats →
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="block text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  // ─── Formulaire de création ───────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-100 transition-colors"
          >
            ← Tableau de bord
          </Link>
          <span className="text-gray-600">|</span>
          <h1 className="font-bold text-gray-100">Nouvelle session</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-gray-900 rounded-2xl shadow-lg shadow-black/20 border border-gray-700 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-100 mb-2">Créer une session de jeu</h2>
            <p className="text-gray-400 text-sm">
              Choisissez la durée, puis lancez. Vous obtiendrez un code à partager avec vos apprenants.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-8">

            {/* Nom du groupe (optionnel) */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Nom du groupe / classe <span className="text-gray-500 font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="ex : Terminale STMG A — Mars 2026"
                className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-xl focus:outline-none focus:border-indigo-600 text-sm text-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Pour retrouver cette session facilement dans votre historique.</p>
            </div>

            {/* Choix du nombre de trimestres */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                Durée de la session
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([6, 8, 10, 12] as const).map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNbTours(n)}
                    className={`
                      rounded-xl border-2 p-4 text-left transition-all
                      ${nbTours === n
                        ? "border-indigo-600 bg-indigo-950/30"
                        : "border-gray-700 hover:border-indigo-700 bg-gray-800"
                      }
                    `}
                  >
                    <div className={`font-black text-2xl mb-1 ${nbTours === n ? "text-indigo-300" : "text-gray-300"}`}>
                      {n}
                    </div>
                    <div className={`font-semibold text-sm ${nbTours === n ? "text-indigo-300" : "text-gray-300"}`}>
                      trimestres
                    </div>
                    <div className={`text-xs mt-1 ${nbTours === n ? "text-indigo-400" : "text-gray-500"}`}>
                      {durations[n]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scénario personnalisé (optionnel) */}
            <div className="border border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandTemplates(!expandTemplates)}
                className="w-full bg-gray-800 hover:bg-gray-750 px-4 py-3 flex items-center justify-between transition-colors"
              >
                <span className="font-semibold text-gray-200">
                  🎨 Scénario personnalisé <span className="text-xs text-gray-500 font-normal">(optionnel)</span>
                </span>
                <span className={`text-gray-400 transition-transform ${expandTemplates ? "rotate-180" : ""}`}>▼</span>
              </button>

              {expandTemplates && (
                <div className="bg-gray-900/50 border-t border-gray-700 p-4 space-y-3">
                  {loadingTemplates ? (
                    <p className="text-sm text-gray-400">Chargement des scénarios…</p>
                  ) : templates.length === 0 ? (
                    <div className="text-sm text-gray-400 space-y-2">
                      <p>Aucun scénario personnalisé disponible.</p>
                      <Link
                        href="/dashboard/templates"
                        className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        ➕ Créer un scénario personnalisé
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map(template => (
                        <label key={template.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedTemplateIds.has(template.id)}
                            onChange={e => {
                              const newSet = new Set(selectedTemplateIds);
                              if (e.target.checked) {
                                newSet.add(template.id);
                              } else {
                                newSet.delete(template.id);
                              }
                              setSelectedTemplateIds(newSet);
                            }}
                            className="mt-1 w-4 h-4 rounded accent-indigo-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-100 text-sm">{template.name}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Type: <span className="font-mono">{template.base_enterprise}</span>
                              {template.totalActif > 0 && (
                                <> · Bilan: <span className="font-mono">{template.totalActif.toLocaleString("fr-FR")}€</span></>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                      <p className="text-xs text-gray-500 mt-3">
                        Les scénarios sélectionnés remplaceront les 4 entreprises standard.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Résumé */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-sm text-gray-300">
              <p>
                <strong className="text-gray-100">Récapitulatif :</strong>{" "}
                Session de <strong>{nbTours} trimestres</strong>
                {groupName && <> · Groupe : <strong>{groupName}</strong></>}
                {selectedTemplateIds.size > 0 && <> · <strong>{selectedTemplateIds.size}</strong> scénario{selectedTemplateIds.size > 1 ? "s" : ""} personnalisé{selectedTemplateIds.size > 1 ? "s" : ""}</>}
                {" "}· Chaque apprenant joue en autonomie sur son propre appareil
              </p>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-800 rounded-xl p-4 text-sm text-red-200">
                <p>⚠️ {error}</p>
                {error.toLowerCase().includes("crédit") && (
                  <Link
                    href="/dashboard/packs"
                    className="inline-block mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    💳 Acheter des sessions →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-lg"
            >
              {loading ? "Création en cours…" : "🚀 Créer la session et obtenir le code"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
