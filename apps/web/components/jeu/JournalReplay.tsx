"use client";

/**
 * JournalReplay — mode relecture read-only du journal.
 *
 * Affiche une modale plein écran avec :
 *  - à gauche : timeline des étapes groupées par trimestre,
 *  - à droite : Bilan + CR reconstitués APRÈS l'étape sélectionnée, la liste
 *    des écritures de cette étape, et le principe pédagogique.
 *
 * Fidélité historique : chaque JournalEntry embarque un `joueurSnapshot`
 * deep-cloné au moment où l'étape a été validée (cf. L40).
 *
 * Principe pédagogique : l'apprenant peut comprendre et analyser le passé,
 * mais ne peut jamais le modifier — comme en comptabilité réelle.
 */

import { useState, useEffect, useMemo } from "react";
import type { JournalEntry } from "@/app/jeu/hooks/useGameFlow";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import { nomCompte, getSens } from "./utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface JournalReplayProps {
  journal: JournalEntry[];
  onClose: () => void;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function JournalReplay({ journal, onClose }: JournalReplayProps) {
  // Journal stocké newest-first → on reconstitue l'ordre chronologique.
  const chrono = useMemo(() => [...journal].reverse(), [journal]);

  // Par défaut, on sélectionne la dernière étape jouée (la plus récente).
  const [selectedId, setSelectedId] = useState<number | null>(
    chrono.length > 0 ? chrono[chrono.length - 1].id : null,
  );

  const selected = useMemo(
    () => chrono.find((e) => e.id === selectedId) ?? null,
    [chrono, selectedId],
  );

  // Fermeture via Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Grouper par trimestre pour la timeline
  const grouped = useMemo(() => {
    const map = new Map<number, JournalEntry[]>();
    for (const entry of chrono) {
      const list = map.get(entry.tour) ?? [];
      list.push(entry);
      map.set(entry.tour, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [chrono]);

  if (chrono.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 text-center">
          <div className="text-4xl mb-3">📓</div>
          <h2 className="text-lg font-bold text-white mb-2">Journal vide</h2>
          <p className="text-sm text-slate-300 mb-4">
            Aucune étape n&apos;a encore été validée. Revenez ici après avoir joué quelques écritures.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-cyan-600 px-6 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm">
      {/* ─── Bandeau pédagogique rouge ────────────────────────────────────── */}
      <div className="border-b border-red-800/60 bg-gradient-to-r from-red-950 via-red-900/80 to-red-950 px-4 py-3 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔒</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-100">
              Mode relecture — lecture seule
            </p>
            <p className="text-xs text-red-200/90 mt-0.5">
              En gestion d&apos;entreprise, on ne peut pas annuler ni modifier les actions du passé.
              Vous pouvez les comprendre, les analyser et en tirer des leçons, mais pas les corriger
              après coup. C&apos;est un principe fondamental de la comptabilité.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            aria-label="Fermer le mode relecture"
          >
            ✕ Fermer
          </button>
        </div>
      </div>

      {/* ─── Corps : timeline + détail ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Timeline (gauche) ────────────────────────────────────────── */}
        <aside className="w-full max-w-xs shrink-0 overflow-y-auto border-r border-white/10 bg-slate-900/60 sm:max-w-sm">
          <div className="p-3 sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Chronologie
            </p>
            <p className="text-sm text-white font-medium mt-0.5">
              {chrono.length} étape{chrono.length > 1 ? "s" : ""} enregistrée{chrono.length > 1 ? "s" : ""}
            </p>
          </div>

          <nav className="p-2 space-y-3">
            {grouped.map(([tour, entries]) => (
              <div key={tour}>
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Trimestre {tour}
                </p>
                <ul className="space-y-1">
                  {entries.map((e) => {
                    const isActive = e.id === selectedId;
                    const icone = getEtapeIcone(e.etape);
                    return (
                      <li key={e.id}>
                        <button
                          onClick={() => setSelectedId(e.id)}
                          className={`w-full text-left rounded-xl px-3 py-2 transition-colors border ${
                            isActive
                              ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                              : "border-white/5 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base shrink-0">{icone}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold truncate">{e.titre}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {e.joueurNom} · {e.entries.length} écriture{e.entries.length > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Panneau détail (droite) ──────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6">
          {selected ? (
            <DetailView entry={selected} />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              Sélectionnez une étape dans la chronologie.
            </div>
          )}
        </main>
      </div>

      {/* ─── Bouton reprendre (bas) ────────────────────────────────────────── */}
      <div className="border-t border-white/10 bg-slate-900/80 px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400 hidden sm:block">
          Astuce : <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-200">Échap</kbd> pour fermer
        </p>
        <button
          onClick={onClose}
          className="ml-auto rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition-colors"
        >
          ▶ Reprendre la partie
        </button>
      </div>
    </div>
  );
}

// ─── Détail d'une étape ───────────────────────────────────────────────────────

function DetailView({ entry }: { entry: JournalEntry }) {
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0">{getEtapeIcone(entry.etape)}</div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Trimestre {entry.tour} · {entry.joueurNom}
            </p>
            <h3 className="text-lg font-bold text-white mt-0.5">{entry.titre}</h3>
          </div>
        </div>
      </header>

      {/* Écritures de l'étape */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
          Écritures passées ({entry.entries.length})
        </p>
        <ul className="divide-y divide-white/5">
          {entry.entries.map((e, i) => {
            const delta = e.delta;
            const sens = getSens(e.poste, delta);
            const isDebit = sens === "debit";
            return (
              <li key={i} className="py-2 flex items-center gap-3">
                <span className="text-xs text-slate-400 w-5 shrink-0">{i + 1}.</span>
                <span className="flex-1 min-w-0 text-sm text-white truncate">
                  {nomCompte(e.poste)}
                </span>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    isDebit
                      ? "bg-blue-500/15 text-blue-200 border border-blue-400/20"
                      : "bg-amber-500/15 text-amber-200 border border-amber-400/20"
                  }`}
                >
                  {isDebit ? "Débit" : "Crédit"}
                </span>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    delta >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta.toLocaleString("fr-FR")} €
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Principe pédagogique */}
      {entry.principe && (
        <section className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300 mb-1">
            💡 Principe pédagogique
          </p>
          <p className="text-sm text-violet-100/90 leading-relaxed">{entry.principe}</p>
        </section>
      )}

      {/* Bilan reconstitué APRÈS l'étape */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-2 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2 px-2">
          📊 Bilan APRÈS cette étape
        </p>
        <div className="rounded-xl overflow-hidden">
          <BilanPanel joueur={entry.joueurSnapshot} />
        </div>
      </section>

      {/* Compte de résultat reconstitué APRÈS l'étape */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-2 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2 px-2">
          📈 Compte de résultat APRÈS cette étape
        </p>
        <div className="rounded-xl overflow-hidden">
          <CompteResultatPanel joueur={entry.joueurSnapshot} />
        </div>
      </section>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Icône mémo locale — évite d'importer ETAPE_INFO dans un composant client lourd. */
function getEtapeIcone(etape: number): string {
  const icones: Record<number, string> = {
    0: "💼",
    1: "📦",
    2: "⏩",
    3: "👔",
    4: "🤝",
    5: "🔄",
    6: "🎯",
    7: "🎲",
    8: "✅",
    99: "🏦",
  };
  return icones[etape] ?? "•";
}
