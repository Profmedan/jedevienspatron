"use client";

import { motion } from "framer-motion";

import type { EntryLine } from "./EntryCard";
import { nomCompte } from "./utils";

// ─── Labels narratifs par acte ──────────────────────────────────────────────

const ACT_LABELS: Record<number, { titre: string; icone: string; explicationDebit: string; explicationCredit: string }> = {
  1: {
    titre: "L'argent rentre",
    icone: "💰",
    explicationDebit: "Votre caisse augmente ↑",
    explicationCredit: "Votre créance augmente ↑",
  },
  2: {
    titre: "Le revenu est enregistré",
    icone: "📊",
    explicationDebit: "",
    explicationCredit: "Le chiffre d'affaires augmente ↑",
  },
  3: {
    titre: "La marchandise sort",
    icone: "📦",
    explicationDebit: "",
    explicationCredit: "Votre stock diminue ↓",
  },
  4: {
    titre: "Le coût est enregistré",
    icone: "📋",
    explicationDebit: "Les charges augmentent ↑",
    explicationCredit: "",
  },
};

// ─── Récit contextuel par type de client ────────────────────────────────────

function getClientNarrative(clientLabel: string, montant: number, delaiInfo: string): string {
  if (clientLabel.includes("Particulier")) {
    return `Un client particulier achète pour ${montant.toLocaleString("fr-FR")} €. Il paie comptant.`;
  }
  if (clientLabel.includes("TPE")) {
    return `Une petite entreprise commande pour ${montant.toLocaleString("fr-FR")} €. Elle paiera dans 1 trimestre ${delaiInfo}.`;
  }
  if (clientLabel.includes("Grand")) {
    return `Un grand compte commande pour ${montant.toLocaleString("fr-FR")} €. Il paiera dans 2 trimestres ${delaiInfo}.`;
  }
  return `Vente de ${montant.toLocaleString("fr-FR")} € enregistrée. ${delaiInfo}`;
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface SaleGroupCardProps {
  /** Toutes les entries de ce groupe de vente (4 lignes) */
  entries: EntryLine[];
  /** Label du client (ex: "Client Particulier") */
  clientLabel: string;
  /** Identifiant du groupe (ex: "vente-0") */
  saleGroupId: string;
  /** Numéro de la vente dans la séquence (1-based) */
  saleIndex: number;
  /** Nombre total de ventes */
  totalSales: number;
  /** Callback pour appliquer atomiquement toutes les entries du groupe */
  onApplyGroup: (saleGroupId: string) => void;
  /** Est-ce que ce groupe est déjà entièrement appliqué ? */
  isApplied: boolean;
  /** Est-ce le prochain groupe à traiter ? */
  isActive: boolean;
  /** Animation settings */
  tourActuel?: number;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export function SaleGroupCard({
  entries,
  clientLabel,
  saleGroupId,
  saleIndex,
  totalSales,
  onApplyGroup,
  isApplied,
  isActive,
  tourActuel = 0,
}: SaleGroupCardProps) {
  const shouldAnimate = tourActuel <= 3;
  const Wrapper = shouldAnimate ? motion.div : "div";
  const wrapperProps = shouldAnimate
    ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: saleIndex * 0.15, duration: 0.4, ease: "easeOut" as const },
      }
    : {};

  // Compute totals
  const debits = entries.filter(e => e.sens === "debit");
  const credits = entries.filter(e => e.sens === "credit");
  const sumDebits = debits.reduce((s, e) => s + Math.abs(e.delta), 0);
  const sumCredits = credits.reduce((s, e) => s + Math.abs(e.delta), 0);
  const isBalanced = Math.abs(sumDebits - sumCredits) < 0.01;

  // Marge brute = Ventes - CMV
  const ventesEntry = entries.find(e => e.poste === "ventes");
  const cmvEntry = entries.find(e => e.poste === "achats");
  const margeBrute = (ventesEntry?.delta ?? 0) - (cmvEntry?.delta ?? 0);

  // Montant de la vente (= entry ventes)
  const montantVente = ventesEntry?.delta ?? 0;

  // Info sur le délai (pour le récit)
  const encaissementEntry = entries.find(e => e.saleActIndex === 1);
  const delaiInfo = encaissementEntry?.poste === "tresorerie"
    ? "(paiement comptant)"
    : encaissementEntry?.poste === "creancesPlus1"
      ? "(créance C+1)"
      : "(créance C+2)";

  const narrative = getClientNarrative(clientLabel, montantVente, delaiInfo);

  // Sorted by acte index
  const sortedEntries = [...entries].sort((a, b) => (a.saleActIndex ?? 0) - (b.saleActIndex ?? 0));

  if (isApplied && !isActive) {
    // Collapsed applied card
    return (
      <Wrapper
        {...wrapperProps}
        className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-lg">
            ✅
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">
                Vente {saleIndex}/{totalSales} — {clientLabel}
              </p>
              <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Enregistrée
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {montantVente.toLocaleString("fr-FR")} € de CA · Marge brute {margeBrute.toLocaleString("fr-FR")} €
            </p>
          </div>
        </div>
      </Wrapper>
    );
  }

  // Full expanded card
  return (
    <Wrapper
      {...wrapperProps}
      className={`overflow-hidden rounded-[28px] border shadow-[0_16px_40px_rgba(2,6,23,0.18)] ${
        isActive
          ? "border-cyan-400/25 bg-cyan-500/[0.07]"
          : "border-white/10 bg-white/[0.03]"
      }`}
      role="region"
      aria-label={`Vente ${saleIndex} sur ${totalSales} — ${clientLabel}`}
    >
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950/40 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/12 text-2xl">
            🤝
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Vente {saleIndex} / {totalSales}
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">{clientLabel}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{narrative}</p>
          </div>
        </div>
      </div>

      {/* 4 actes */}
      <div className="px-4 py-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Ce qui se passe — 4 écritures en partie double
        </p>

        {sortedEntries.map((entry) => {
          const actInfo = ACT_LABELS[entry.saleActIndex ?? 0];
          const isDebit = entry.sens === "debit";
          const explication = isDebit
            ? actInfo?.explicationDebit
            : actInfo?.explicationCredit;

          return (
            <div
              key={entry.id}
              className={`rounded-2xl border px-3 py-3 ${
                isDebit
                  ? "border-sky-400/15 bg-sky-500/[0.06]"
                  : "border-amber-400/15 bg-amber-500/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{actInfo?.icone ?? "📝"}</span>
                    <p className="text-xs font-semibold text-white">
                      Acte {entry.saleActIndex} — {actInfo?.titre ?? "Écriture"}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] ${
                      isDebit ? "bg-sky-500/15 text-sky-200" : "bg-amber-500/15 text-amber-200"
                    }`}>
                      {isDebit ? "Débit" : "Crédit"}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{nomCompte(entry.poste)}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{entry.description}</p>
                  {explication && (
                    <p className={`mt-1 text-[11px] font-medium ${
                      isDebit ? "text-sky-300/80" : "text-amber-300/80"
                    }`}>
                      → {explication}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-lg font-semibold tabular-nums ${
                    isDebit ? "text-sky-200" : "text-amber-200"
                  }`}>
                    {entry.delta > 0 ? "+" : ""}{entry.delta.toLocaleString("fr-FR")} €
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vérification d'équilibre + marge */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-sky-400/15 bg-sky-500/[0.06] px-2.5 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">Σ Débits</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-sky-200">{sumDebits.toLocaleString("fr-FR")} €</p>
          </div>
          <div className="rounded-xl border border-amber-400/15 bg-amber-500/[0.06] px-2.5 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">Σ Crédits</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-amber-200">{sumCredits.toLocaleString("fr-FR")} €</p>
          </div>
          <div className={`rounded-xl border px-2.5 py-2 ${
            isBalanced ? "border-emerald-400/15 bg-emerald-500/[0.06]" : "border-orange-400/15 bg-orange-500/[0.06]"
          }`}>
            <p className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${
              isBalanced ? "text-emerald-300/80" : "text-orange-300/80"
            }`}>Équilibre</p>
            <p className={`mt-1 text-sm font-bold ${isBalanced ? "text-emerald-200" : "text-orange-200"}`}>
              {isBalanced ? "✅ OK" : "⚠️ Vérifier"}
            </p>
          </div>
        </div>

        {/* Marge brute */}
        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">Marge brute de cette vente</p>
          <p className="mt-1 text-sm font-bold text-white">
            {montantVente.toLocaleString("fr-FR")} € − {(cmvEntry?.delta ?? 0).toLocaleString("fr-FR")} € = <span className="text-emerald-300">{margeBrute.toLocaleString("fr-FR")} €</span>
          </p>
        </div>
      </div>

      {/* Bouton d'action */}
      {isActive && !isApplied && (
        <div className="border-t border-cyan-400/20 bg-slate-950/35 px-4 py-4">
          <button
            type="button"
            onClick={() => onApplyGroup(saleGroupId)}
            className="inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 active:scale-[0.98]"
            aria-label={`Enregistrer la vente ${saleIndex} — ${clientLabel}`}
          >
            J&apos;ai compris — enregistrer cette vente ✓
          </button>
        </div>
      )}
    </Wrapper>
  );
}
