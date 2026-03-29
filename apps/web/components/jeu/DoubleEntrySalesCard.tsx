"use client";

import { motion } from "framer-motion";

import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";

import type { EntryLine } from "./EntryCard";
import { nomCompte } from "./utils";

interface DoubleEntrySalesCardProps {
  entries: EntryLine[];
  operationTitre?: string;
  onApplyAll: () => void;
  index?: number;
  tourActuel?: number;
}

function SummaryBox({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "neutral" | "emerald" | "amber";
}) {
  const toneClass = {
    neutral: "border-white/10 bg-white/[0.04] text-white",
    emerald: "border-emerald-400/15 bg-emerald-500/10 text-emerald-100",
    amber: "border-amber-400/15 bg-amber-500/10 text-amber-100",
  }[tone];

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-white/70">{helper}</p>
    </div>
  );
}

export function DoubleEntrySalesCard({
  entries,
  operationTitre,
  onApplyAll,
  index = 0,
  tourActuel = 0,
}: DoubleEntrySalesCardProps) {
  const shouldAnimate = tourActuel <= 3;
  const debits = entries.filter((entry) => entry.sens === "debit");
  const credits = entries.filter((entry) => entry.sens === "credit");
  const sumDebits = debits.reduce((sum, entry) => sum + Math.abs(entry.delta), 0);
  const sumCredits = credits.reduce((sum, entry) => sum + Math.abs(entry.delta), 0);
  const isBalanced = Math.abs(sumDebits - sumCredits) < 0.01;

  const Wrapper = shouldAnimate ? motion.div : "div";
  const wrapperProps = shouldAnimate
    ? {
        initial: { opacity: 0, x: -18 },
        animate: { opacity: 1, x: 0 },
        transition: {
          delay: index * 0.1,
          duration: 0.45,
          ease: "easeOut" as const,
        },
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="overflow-hidden rounded-[28px] border border-cyan-400/20 bg-cyan-500/10 shadow-[0_16px_40px_rgba(2,6,23,0.18)]"
      role="region"
      aria-label={`Vente groupée : ${operationTitre || "sans titre"}`}
    >
      <div className="border-b border-cyan-400/20 bg-slate-950/40 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/12 text-2xl">
            🤝
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
              Vente groupée
            </p>
            <h3 className="mt-1 text-base font-semibold text-white text-balance">
              {operationTitre || "Écritures de vente"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Cette opération déclenche plusieurs lignes à la fois. Tu peux les saisir ensemble pour garder la logique complète de la partie double.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-[24px] border border-sky-400/20 bg-sky-500/10 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-100">
              Débits
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Ce qui s&apos;enregistre comme emploi ou comme augmentation.
            </p>
            <div className="mt-3 space-y-2">
              {debits.map((entry) => {
                const bon = isBonPourEntreprise(entry.poste, entry.delta);
                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {nomCompte(entry.poste)}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                          {entry.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-lg font-semibold tabular-nums ${
                          bon ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        +{entry.delta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
              Crédits
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Ce qui enregistre la ressource, le financement ou la contrepartie.
            </p>
            <div className="mt-3 space-y-2">
              {credits.map((entry) => {
                const bon = isBonPourEntreprise(entry.poste, entry.delta);
                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {nomCompte(entry.poste)}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                          {entry.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-lg font-semibold tabular-nums ${
                          bon ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        +{entry.delta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <SummaryBox
            label="Somme des débits"
            value={`${sumDebits}`}
            helper="Total des emplois enregistrés."
            tone="neutral"
          />
          <SummaryBox
            label="Somme des crédits"
            value={`${sumCredits}`}
            helper="Total des contreparties."
            tone="neutral"
          />
          <SummaryBox
            label="Équilibre"
            value={isBalanced ? "Équilibré" : "À vérifier"}
            helper={
              isBalanced
                ? "Les deux côtés se compensent parfaitement."
                : "Débits et crédits ne se compensent pas encore."
            }
            tone={isBalanced ? "emerald" : "amber"}
          />
        </div>
      </div>

      <div className="border-t border-cyan-400/20 bg-slate-950/35 px-4 py-4">
        <button
          type="button"
          onClick={onApplyAll}
          className="inline-flex w-full items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
          aria-label="Saisir toutes les écritures de cette vente"
        >
          J&apos;ai compris, saisir toute la vente
        </button>
      </div>
    </Wrapper>
  );
}
