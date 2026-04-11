"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { EtatJeu, Joueur, getTotalActif, getTotalPassif } from "@jedevienspatron/game-engine";

import { DoubleEntrySalesCard } from "./DoubleEntrySalesCard";
import { EntryCard, type EntryLine } from "./EntryCard";
import { getDocumentType, getPosteValue, nomCompte } from "./utils";

export interface ActiveStep {
  titre: string;
  icone: string;
  description: string;
  principe: string;
  conseil: string;
  entries: EntryLine[];
  baseEtat: EtatJeu;
  previewEtat: EtatJeu;
}

interface EntryPanelProps {
  activeStep: ActiveStep;
  displayJoueur: Joueur;
  baseJoueur?: Joueur;
  onApply: (id: string) => void;
  onApplyEntry?: (poste: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  tourActuel?: number;
  etapeTour?: number;
}

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "emerald" | "rose" | "amber" | "sky";
}

interface ImpactPreviewRow {
  poste: string;
  label: string;
  docType: "Bilan" | "CR";
  avant: number;
  actuel: number;
  delta: number;
  pending: boolean;
}

function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-base font-semibold text-white text-balance">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone = "neutral",
}: StatCardProps) {
  const toneClass = {
    neutral: "border-white/10 bg-white/[0.04] text-white",
    emerald: "border-emerald-400/15 bg-emerald-500/10 text-emerald-100",
    rose: "border-rose-400/15 bg-rose-500/10 text-rose-100",
    amber: "border-amber-400/15 bg-amber-500/10 text-amber-100",
    sky: "border-sky-400/15 bg-sky-500/10 text-sky-100",
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

function getImpactTone(row: ImpactPreviewRow) {
  const debtPostes = new Set(["emprunts", "dettes", "decouvert", "dettesFiscales", "dettesD2"]);
  const revenuePostes = new Set([
    "ventes",
    "productionStockee",
    "produitsFinanciers",
    "revenusExceptionnels",
  ]);

  if (row.delta === 0) return "text-slate-400";

  if (row.docType === "Bilan") {
    const positiveIsGood = !debtPostes.has(row.poste);
    return positiveIsGood
      ? row.delta > 0
        ? "text-emerald-300"
        : "text-rose-300"
      : row.delta > 0
        ? "text-rose-300"
        : "text-emerald-300";
  }

  const positiveIsGood = revenuePostes.has(row.poste);
  return positiveIsGood
    ? row.delta > 0
      ? "text-emerald-300"
      : "text-rose-300"
    : row.delta > 0
      ? "text-rose-300"
      : "text-emerald-300";
}

export function EntryPanel({
  activeStep,
  displayJoueur,
  baseJoueur,
  onApply,
  onApplyEntry,
  onConfirm,
  onCancel,
  tourActuel = 0,
  etapeTour = -1,
}: EntryPanelProps) {
  const [activeEntryId, setActiveEntryId] = useState<string | null>(() => {
    const firstPending = activeStep.entries.find((entry) => !entry.applied);
    return firstPending?.id ?? null;
  });

  const prevTitreRef = useRef(activeStep.titre);
  useEffect(() => {
    if (prevTitreRef.current !== activeStep.titre) {
      prevTitreRef.current = activeStep.titre;
      const firstPending = activeStep.entries.find((entry) => !entry.applied);
      setActiveEntryId(firstPending?.id ?? null);
    }
  }, [activeStep.titre, activeStep.entries]);

  const entries = activeStep.entries;
  const totalCount = entries.length;

  const pendingEntries = useMemo(
    () => entries.filter((entry) => !entry.applied),
    [entries],
  );
  const debits = useMemo(
    () => entries.filter((entry) => entry.sens === "debit"),
    [entries],
  );
  const credits = useMemo(
    () => entries.filter((entry) => entry.sens === "credit"),
    [entries],
  );

  const appliedCount = totalCount - pendingEntries.length;
  const pendingCount = pendingEntries.length;
  const allApplied = pendingCount === 0;

  const totalActif = getTotalActif(displayJoueur);
  const totalPassif = getTotalPassif(displayJoueur);
  const balanced = Math.abs(totalActif - totalPassif) < 0.01;
  const canContinue = allApplied && balanced;

  const sumDebits = debits.reduce((sum, entry) => sum + Math.abs(entry.delta), 0);
  const sumCredits = credits.reduce((sum, entry) => sum + Math.abs(entry.delta), 0);
  const partieDoubleOk = Math.abs(sumDebits - sumCredits) < 0.01;

  const impactRows = useMemo<ImpactPreviewRow[]>(() => {
    const seen = new Set<string>();

    return entries.reduce<ImpactPreviewRow[]>((rows, entry) => {
      if (seen.has(entry.poste)) return rows;
      seen.add(entry.poste);

      const avant = baseJoueur ? getPosteValue(baseJoueur, entry.poste) : 0;
      const actuel = getPosteValue(displayJoueur, entry.poste);
      const pending = entries
        .filter((candidate) => candidate.poste === entry.poste)
        .some((candidate) => !candidate.applied);

      rows.push({
        poste: entry.poste,
        label: nomCompte(entry.poste),
        docType: getDocumentType(entry.poste),
        avant,
        actuel,
        delta: actuel - avant,
        pending,
      });

      return rows;
    }, []);
  }, [baseJoueur, displayJoueur, entries]);

  const impactApplied = impactRows.filter((row) => row.delta !== 0).length;
  const nextEntry = pendingEntries[0];

  const isSalesStep = etapeTour === 4;
  const displayAsSalesGroup = useMemo(() => {
    if (!isSalesStep) return false;

    const hasVentes = entries.some((entry) => entry.poste === "ventes");
    const hasStocks = entries.some((entry) => entry.poste === "stocks");
    const hasAchats = entries.some((entry) => entry.poste === "achats");
    const hasCashOrCreance = entries.some(
      (entry) =>
        entry.poste === "tresorerie"
        || entry.poste === "creancesPlus1"
        || entry.poste === "creancesPlus2",
    );

    return hasVentes && hasStocks && hasAchats && hasCashOrCreance;
  }, [entries, isSalesStep]);

  function handleApply(entryId: string, poste: string) {
    onApply(entryId);
    onApplyEntry?.(poste);
    const remaining = entries.filter((entry) => !entry.applied && entry.id !== entryId);
    setActiveEntryId(remaining[0]?.id ?? null);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl">
            {activeStep.icone}
          </div>
          <div className="min-w-0 flex-1">
            <SectionHeader
              eyebrow="Saisie comptable"
              title={activeStep.titre}
              description={activeStep.description}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Principe
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{activeStep.principe}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-500/10 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
              Conseil
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{activeStep.conseil}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-2 md:grid-cols-4">
        <StatCard
          label="Progression"
          value={`${appliedCount}/${totalCount}`}
          helper={
            allApplied
              ? "Toutes les écritures sont cochées."
              : `${pendingCount} écriture${pendingCount > 1 ? "s" : ""} restante${pendingCount > 1 ? "s" : ""}.`
          }
          tone={allApplied ? "emerald" : "sky"}
        />
        <StatCard
          label="Prochaine ligne"
          value={nextEntry ? nomCompte(nextEntry.poste) : "Terminé"}
          helper={
            nextEntry
              ? "C’est la prochaine écriture utile à ouvrir."
              : "La saisie est terminée, il reste à valider."
          }
          tone={nextEntry ? "neutral" : "emerald"}
        />
        <StatCard
          label="Partie double"
          value={`${sumDebits} = ${sumCredits}`}
          helper={
            partieDoubleOk
              ? "Débits et crédits se compensent bien."
              : "Les montants ne se répondent pas encore."
          }
          tone={partieDoubleOk ? "emerald" : "amber"}
        />
        <StatCard
          label="Équilibre"
          value={`${totalActif} ${balanced ? "=" : "≠"} ${totalPassif}`}
          helper={
            balanced
              ? "Le bilan reste équilibré en temps réel."
              : "Le bilan n’est pas encore équilibré."
          }
          tone={balanced ? "emerald" : allApplied ? "rose" : "neutral"}
        />
      </section>

      {impactRows.length > 0 && (
        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
          <SectionHeader
            eyebrow="Avant / après"
            title="Impact sur les comptes"
            description="Cette vue montre immédiatement quels postes ont déjà bougé et lesquels attendent encore une saisie."
          />

          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {impactRows.map((row) => (
              <div
                key={row.poste}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                          row.docType === "Bilan"
                            ? "bg-sky-500/10 text-sky-100"
                            : "bg-amber-500/10 text-amber-100"
                        }`}
                      >
                        {row.docType}
                      </span>
                      <span className="truncate text-xs font-medium text-slate-300">
                        {row.label}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      row.pending
                        ? "bg-white/[0.05] text-slate-300"
                        : "bg-emerald-500/10 text-emerald-100"
                    }`}
                  >
                    {row.pending ? "En attente" : "Saisi"}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <StatCard label="Avant" value={`${row.avant}`} helper="Valeur de départ." />
                  <StatCard
                    label="Après"
                    value={`${row.actuel}`}
                    helper="Valeur après saisie."
                    tone={row.delta > 0 ? "emerald" : row.delta < 0 ? "rose" : "neutral"}
                  />
                  <StatCard
                    label="Écart"
                    value={row.delta > 0 ? `+${row.delta}` : `${row.delta}`}
                    helper="Variation visible."
                    tone={
                      row.delta === 0
                        ? "neutral"
                        : getImpactTone(row).includes("emerald")
                          ? "emerald"
                          : "rose"
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Postes déjà bougés</p>
              <span className={`text-sm font-semibold ${impactApplied === impactRows.length ? "text-emerald-300" : "text-cyan-200"}`}>
                {impactApplied}/{impactRows.length}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${impactApplied === impactRows.length ? "bg-emerald-400" : "bg-cyan-400"}`}
                style={{
                  width: `${impactRows.length > 0 ? (impactApplied / impactRows.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
        {entries.length > 0 ? (
          <>
            {displayAsSalesGroup ? (
              <div className="space-y-4">
                <SectionHeader
                  eyebrow="Saisie guidée"
                  title="Séquence de vente regroupée"
                  description="Cette vente déclenche plusieurs lignes en même temps. Tu peux la saisir d’un seul geste pour garder la logique de la partie double."
                />
                <DoubleEntrySalesCard
                  entries={entries}
                  operationTitre={activeStep.titre}
                  onApplyAll={() => {
                    entries.forEach((entry) => {
                      onApply(entry.id);
                      onApplyEntry?.(entry.poste);
                    });
                    setActiveEntryId(null);
                  }}
                  index={0}
                  tourActuel={tourActuel}
                />
              </div>
            ) : (
              <div className="space-y-5">
                <SectionHeader
                  eyebrow="Saisie guidée"
                  title="Passe les écritures dans l’ordre"
                  description="Débits d’abord, crédits ensuite. Chaque ligne ouverte explique ce qu’elle représente avant d’être cochée."
                />

                {debits.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200">
                          1. Débits
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400">
                          Les débits représentent ici les emplois ou ce qui augmente.
                        </p>
                      </div>
                      {debits.every((entry) => entry.applied) && (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                          Terminé
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {debits.map((entry, index) => (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          operationTitre={activeStep.titre}
                          isExpanded={activeEntryId === entry.id}
                          onToggle={() =>
                            setActiveEntryId(activeEntryId === entry.id ? null : entry.id)
                          }
                          onApply={() => handleApply(entry.id, entry.poste)}
                          index={index}
                          tourActuel={tourActuel}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {credits.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                          2. Crédits
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400">
                          Les crédits montrent d&apos;où vient la ressource ou le financement.
                        </p>
                      </div>
                      {credits.every((entry) => entry.applied) && (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                          Terminé
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {credits.map((entry, index) => (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          operationTitre={activeStep.titre}
                          isExpanded={activeEntryId === entry.id}
                          onToggle={() =>
                            setActiveEntryId(activeEntryId === entry.id ? null : entry.id)
                          }
                          onApply={() => handleApply(entry.id, entry.poste)}
                          index={debits.length + index}
                          tourActuel={tourActuel}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-center">
            <p className="text-sm font-medium text-slate-300">Aucune écriture à passer</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Cette étape n&apos;ajoute pas de saisie comptable particulière.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
        <SectionHeader
          eyebrow="Validation"
          title="Vérifier avant de continuer"
          description="Pour confirmer l’étape, toutes les écritures doivent être passées et le bilan doit rester équilibré."
        />

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <StatCard
            label="Partie double"
            value={`${sumDebits} ${partieDoubleOk ? "=" : "≠"} ${sumCredits}`}
            helper={
              partieDoubleOk
                ? "Les deux côtés de l’écriture se répondent."
                : "Il reste un écart entre débits et crédits."
            }
            tone={partieDoubleOk ? "emerald" : "amber"}
          />
          <StatCard
            label="Bilan"
            value={
              canContinue
                ? `${totalActif} = ${totalPassif}`
                : !allApplied
                  // Saisie en cours : l'écart intermédiaire est normal en partie double
                  ? "⏳ Saisie en cours…"
                  : `${totalActif} ≠ ${totalPassif}`
            }
            helper={
              canContinue
                ? "Tout est prêt : tu peux confirmer."
                : !allApplied
                  ? `Passe encore ${pendingCount} écriture${pendingCount > 1 ? "s" : ""} — le bilan se rééquilibrera à la fin.`
                  : "Le bilan doit être rééquilibré avant de poursuivre."
            }
            tone={canContinue ? "emerald" : !allApplied ? "neutral" : "rose"}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-500/10 px-3 py-3">
          <p className="text-sm font-medium text-cyan-100">Besoin d&apos;un repère ?</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-200">
            Le glossaire reste accessible dans la zone centrale si un terme comptable te bloque.
          </p>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
          >
            Revenir
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canContinue}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
          >
            Confirmer & continuer
          </button>
        </div>
      </section>
    </div>
  );
}
