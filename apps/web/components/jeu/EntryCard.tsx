"use client";

import { motion } from "framer-motion";

import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";

import {
  getDocument,
  getEffetTexte,
  getPedagogieContexte,
  nomCompte,
  type SensEcriture,
} from "./utils";

export interface EntryLine {
  id: string;
  poste: string;
  delta: number;
  description: string;
  applied: boolean;
  sens: SensEcriture;
}

interface EntryCardProps {
  entry: EntryLine;
  onApply: () => void;
  operationTitre?: string;
  isExpanded: boolean;
  onToggle: () => void;
  index?: number;
  tourActuel?: number;
}

interface AccentTheme {
  surface: string;
  surfaceSoft: string;
  border: string;
  badge: string;
  badgeSoft: string;
  title: string;
  icon: string;
  iconLabel: string;
  ring: string;
}

function formatSigned(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

function getAccentTheme(isDebit: boolean): AccentTheme {
  return isDebit
    ? {
        surface: "bg-sky-500/10",
        surfaceSoft: "bg-sky-500/[0.08]",
        border: "border-sky-400/20",
        badge: "text-sky-100",
        badgeSoft: "bg-sky-500/12",
        title: "text-sky-100",
        icon: "📤",
        iconLabel: "Débit",
        ring: "focus-visible:ring-sky-200",
      }
    : {
        surface: "bg-amber-500/10",
        surfaceSoft: "bg-amber-500/[0.08]",
        border: "border-amber-400/20",
        badge: "text-amber-100",
        badgeSoft: "bg-amber-500/12",
        title: "text-amber-100",
        icon: "📥",
        iconLabel: "Crédit",
        ring: "focus-visible:ring-amber-200",
      };
}

export function EntryCard({
  entry,
  onApply,
  operationTitre,
  isExpanded,
  onToggle,
  index = 0,
  tourActuel = 0,
}: EntryCardProps) {
  const isDebit = entry.sens === "debit";
  const doc = getDocument(entry.poste);
  const bon = isBonPourEntreprise(entry.poste, entry.delta);
  const effetTexte = getEffetTexte(entry.poste, entry.delta);
  const contexte = getPedagogieContexte(entry.poste, entry.delta, isDebit);
  const shouldAnimate = tourActuel <= 3;
  const theme = getAccentTheme(isDebit);

  const MotionButton = shouldAnimate ? motion.button : "button";
  const MotionDiv = shouldAnimate ? motion.div : "div";
  const entryName = nomCompte(entry.poste);
  const statusTone = bon ? "text-emerald-300" : "text-rose-300";

  const initialProps = shouldAnimate
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

  if (entry.applied && !isExpanded) {
    return (
      <MotionButton
        {...initialProps}
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full items-center gap-3 rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-left transition-colors hover:bg-emerald-500/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        aria-label={`Revoir l’écriture saisie : ${entryName}`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-lg">
          ✅
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">{entryName}</p>
            <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
              Saisi
            </span>
          </div>
          <p className="mt-1 truncate text-[11px] leading-relaxed text-slate-400">
            {effetTexte ?? "Tu peux rouvrir cette ligne pour relire son explication."}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-lg font-semibold tabular-nums ${statusTone}`}>{formatSigned(entry.delta)}</p>
          <p className="text-[11px] text-slate-500">Relire</p>
        </div>
      </MotionButton>
    );
  }

  if (!entry.applied && !isExpanded) {
    return (
      <MotionButton
        {...initialProps}
        type="button"
        onClick={onToggle}
        className={`mb-2 flex w-full items-center gap-3 rounded-[24px] border px-4 py-3 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 ${theme.border} ${theme.surfaceSoft} ${theme.ring}`}
        aria-expanded={false}
        aria-label={`Ouvrir la saisie : ${entryName}`}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${theme.badgeSoft} text-lg`}>
          {theme.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">{entryName}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.badgeSoft} ${theme.badge}`}>
              {theme.iconLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-[11px] leading-relaxed text-slate-400">
            Ouvre la ligne pour comprendre puis la saisir.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-lg font-semibold tabular-nums ${statusTone}`}>{formatSigned(entry.delta)}</p>
          <p className="text-[11px] text-slate-500">Ouvrir</p>
        </div>
      </MotionButton>
    );
  }

  return (
    <MotionDiv
      {...initialProps}
      className={`mb-2 rounded-[28px] border px-4 py-4 shadow-[0_16px_40px_rgba(2,6,23,0.18)] ${entry.applied ? "border-emerald-400/20 bg-emerald-500/10" : `${theme.border} ${theme.surface}`}`}
      role="region"
      aria-label={`${entry.applied ? "Écriture déjà saisie" : "Écriture à saisir"} : ${entryName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              entry.applied ? "bg-emerald-500/12" : theme.badgeSoft
            } text-2xl`}
          >
            {entry.applied ? "✅" : theme.icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  entry.applied
                    ? "bg-emerald-500/12 text-emerald-100"
                    : `${theme.badgeSoft} ${theme.badge}`
                }`}
              >
                {entry.applied ? "Saisi" : theme.iconLabel}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${doc.badge}`}>
                {doc.label} · {doc.detail}
              </span>
            </div>
            <h4 className="mt-2 text-base font-semibold text-white text-balance">{entryName}</h4>
            {operationTitre && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Opération : {operationTitre}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className={`text-2xl font-semibold tabular-nums ${statusTone}`}>
            {formatSigned(entry.delta)}
          </p>
          <button
            type="button"
            onClick={onToggle}
            className={`mt-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-slate-200 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 ${theme.ring}`}
          >
            Réduire
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <InfoBlock title="Pourquoi cette ligne existe">{entry.description}</InfoBlock>
        <InfoBlock title="Ce que ça provoque">
          {contexte ?? "Cette ligne enregistre l’impact comptable immédiat de l’opération."}
        </InfoBlock>
      </div>

      {effetTexte && (
        <div
          className={`mt-4 rounded-2xl border px-3 py-3 ${
            bon
              ? "border-emerald-400/15 bg-emerald-500/10"
              : "border-rose-400/15 bg-rose-500/10"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Repère mémoire
          </p>
          <p className={`mt-2 text-sm font-medium ${statusTone}`}>{effetTexte}</p>
        </div>
      )}

      {!entry.applied && (
        <button
          type="button"
          onClick={onApply}
          className={`mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 ${theme.ring} ${isDebit ? "bg-sky-300" : "bg-amber-300"}`}
          aria-label={`Saisir l’écriture : ${entryName}`}
        >
          J&apos;ai compris, saisir cette ligne
        </button>
      )}
    </MotionDiv>
  );
}
