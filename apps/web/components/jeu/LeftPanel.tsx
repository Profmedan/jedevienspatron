"use client";

import { useState } from "react";

import { calculerCapaciteLogistique } from "@/lib/game-engine/engine";
import { MODALES_ETAPES } from "@/lib/game-engine/data/pedagogie";
import { CarteDecision, Joueur } from "@/lib/game-engine/types";

import { EntryPanel, type ActiveStep } from "./EntryPanel";
import { getDocument, nomCompte } from "./utils";

const ETAPES_MAP = [
  { icone: "💼", label: "Charges fixes", court: "Charges", vibe: "Coûts obligatoires à payer" },
  { icone: "📦", label: "Achats de stocks", court: "Achats", vibe: "Comptant ou à crédit ?" },
  { icone: "⏩", label: "Créances clients", court: "Créances", vibe: "L'argent rentre enfin" },
  { icone: "👔", label: "Paiement commerciaux", court: "Commerciaux", vibe: "On paie ceux qui vendent" },
  { icone: "🤝", label: "Ventes & clients", court: "Ventes", vibe: "Le cœur du trimestre" },
  { icone: "🔄", label: "Effets récurrents", court: "Récurrents", vibe: "Les décisions se répercutent" },
  { icone: "🎯", label: "Carte décision", court: "Décision", vibe: "Un choix stratégique" },
  { icone: "🎲", label: "Événement aléatoire", court: "Événement", vibe: "Une surprise arrive" },
  { icone: "📊", label: "Bilan trimestriel", court: "Bilan", vibe: "Le verdict du trimestre" },
];

const MICROCOPY: Record<number, string> = {
  0: "Charges fixes et amortissements : une étape obligatoire qui teste ta discipline.",
  1: "Achète le bon volume et choisis un mode de financement cohérent avec ta trésorerie.",
  2: "Les créances avancent : la vente devient enfin du cash.",
  3: "Tu rémunères ceux qui génèrent l'activité commerciale.",
  4: "Les clients de ce tour font bouger à la fois le chiffre d'affaires, les stocks et la trésorerie.",
  5: "Les cartes déjà actives continuent de produire leurs effets.",
  6: "Moment de choix : recrutement ou investissement, selon ce que l'entreprise peut absorber.",
  7: "Un aléa peut accélérer ou fragiliser ton trimestre.",
  8: "Relis ce que tu as construit avant de passer au tour suivant.",
};

interface JournalEntry {
  id: number;
  tour: number;
  etape: number;
  joueurNom: string;
  titre: string;
  entries: Array<{ poste: string; delta: number; applied?: boolean }>;
  principe: string;
}

interface LeftPanelProps {
  etapeTour: number;
  tourActuel: number;
  nbToursMax: number;
  joueur: Joueur;
  activeStep: ActiveStep | null;
  onApplyEntry: (id: string) => void;
  onConfirmStep: () => void;
  onCancelStep: () => void;
  onApplyEntryEffect?: (poste: string) => void;
  achatQte: number;
  setAchatQte: (val: number) => void;
  achatMode: "tresorerie" | "dettes";
  setAchatMode: (val: "tresorerie" | "dettes") => void;
  onLaunchAchat: () => void;
  onSkipAchat: () => void;
  selectedDecision: CarteDecision | null;
  onSkipDecision: () => void;
  decisionError: string | null;
  onLaunchStep: () => void;
  journal: JournalEntry[];
  subEtape6?: "recrutement" | "investissement";
  modeRapide?: boolean;
  setModeRapide?: (val: boolean) => void;
  modalEtapeEnAttente?: number | null;
  onCloseModal?: () => void;
  onDemanderEmprunt?: () => void;
}

interface StepHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

function StepHeader({ eyebrow, title, description }: StepHeaderProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="text-base font-semibold text-white text-balance">{title}</h2>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function LockedOverlay({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-slate-950/35 backdrop-blur-[1px]">
      <div
        className={`rounded-2xl border border-amber-400/20 bg-slate-950/85 text-center ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
      >
        <p className="text-xs font-semibold text-amber-100">Lis d&apos;abord la carte pédagogique</p>
        {!compact && (
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Déverrouille l&apos;action avec le bouton “J&apos;ai compris”.
          </p>
        )}
      </div>
    </div>
  );
}

function GameMap({
  etapeTour,
  tourActuel,
  nbToursMax,
  subEtape6 = "recrutement",
}: {
  etapeTour: number;
  tourActuel: number;
  nbToursMax: number;
  subEtape6?: "recrutement" | "investissement";
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  const currentEtape = ETAPES_MAP[etapeTour];
  const pctTour = Math.round(((tourActuel - 1) / nbToursMax) * 100);
  const pctEtape = Math.round(((etapeTour + 1) / ETAPES_MAP.length) * 100);
  const isEtape6 = etapeTour === 6;
  const is6b = isEtape6 && subEtape6 === "investissement";
  const accent = is6b
    ? {
        solid: "bg-amber-400",
        soft: "bg-amber-500/10",
        border: "border-amber-400/20",
        text: "text-amber-100",
        subtle: "text-amber-200/70",
      }
    : {
        solid: "bg-cyan-400",
        soft: "bg-cyan-500/10",
        border: "border-cyan-400/20",
        text: "text-cyan-100",
        subtle: "text-cyan-200/70",
      };

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 shadow-[0_20px_60px_rgba(2,6,23,0.26)]">
      <div className="border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
              Navigation du trimestre
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">
              {currentEtape?.label ?? "Étape en cours"}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:hidden">
              {currentEtape?.vibe ?? MICROCOPY[etapeTour]}
            </p>
            <p className="mt-2 hidden max-w-xs text-sm leading-relaxed text-slate-400 sm:block">
              {MICROCOPY[etapeTour]}
            </p>
          </div>
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accent.border} ${accent.soft} text-2xl`}
          >
            {currentEtape?.icone ?? "📋"}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-400">Tour</span>
              <span className={`text-sm font-semibold ${accent.text}`}>
                {tourActuel}/{nbToursMax}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${accent.solid}`}
                style={{ width: `${Math.max(8, pctTour)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{pctTour}% du parcours global</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-400">Étape</span>
              <span className={`text-sm font-semibold ${accent.text}`}>
                {isEtape6
                  ? subEtape6 === "investissement"
                    ? "6b"
                    : "6a"
                  : `${etapeTour + 1}/9`}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${accent.solid}`}
                style={{ width: `${pctEtape}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {etapeTour < 8
                ? `Ensuite : ${ETAPES_MAP[etapeTour + 1]?.court}`
                : "Fin du trimestre après cette étape"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="grid grid-cols-9 gap-1">
          {ETAPES_MAP.map((etape, index) => {
            const done = index < etapeTour;
            const current = index === etapeTour;
            const isCurrent6b = current && is6b;

            return (
              <div key={etape.label} className="flex flex-col items-center gap-1 text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-all ${
                    done
                      ? "border-transparent bg-emerald-500/15 text-emerald-300"
                      : current
                        ? isCurrent6b
                          ? "border-amber-300/40 bg-amber-500/20 text-white ring-2 ring-amber-300/30"
                          : "border-cyan-300/40 bg-cyan-500/20 text-white ring-2 ring-cyan-300/30"
                        : "border-white/10 bg-white/[0.03] text-slate-500"
                  }`}
                >
                  {done ? "✓" : etape.icone}
                </div>
                <span
                  className={`text-[9px] font-medium ${
                    current ? accent.subtle : done ? "text-slate-500" : "text-slate-600"
                  }`}
                >
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setDetailOpen((value) => !value)}
          aria-expanded={detailOpen}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          <span>Parcours détaillé</span>
          <span className={`text-base transition-transform ${detailOpen ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>

        {detailOpen && (
          <div className="mt-2 space-y-2">
            {ETAPES_MAP.map((etape, index) => {
              const done = index < etapeTour;
              const current = index === etapeTour;
              const isCurrent6b = current && is6b;

              return (
                <div
                  key={`${etape.label}-${index}`}
                  className={`rounded-2xl border px-3 py-3 ${
                    current
                      ? isCurrent6b
                        ? "border-amber-300/20 bg-amber-500/10"
                        : "border-cyan-300/20 bg-cyan-500/10"
                      : done
                        ? "border-white/8 bg-white/[0.02]"
                        : "border-white/8 bg-slate-950/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{etape.icone}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">
                        {index + 1}. {etape.label}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        {current ? etape.vibe : done ? "Étape déjà passée." : "Étape à venir."}
                      </p>
                    </div>
                    <span
                      className={`ml-auto shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        current
                          ? isCurrent6b
                            ? "bg-amber-500/10 text-amber-100"
                            : "bg-cyan-500/10 text-cyan-100"
                          : done
                            ? "bg-emerald-500/10 text-emerald-100"
                            : "bg-white/[0.05] text-slate-400"
                      }`}
                    >
                      {current ? "Maintenant" : done ? "Fait" : "Après"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

const ProgressStrip = GameMap;

function PedagoCard({
  etape,
  isLocked,
  onUnlock,
}: {
  etape: number;
  isLocked: boolean;
  onUnlock?: () => void;
}) {
  const [open, setOpen] = useState(isLocked);
  const [detailOpen, setDetailOpen] = useState(false);
  const modal = MODALES_ETAPES[etape];

  if (!modal) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-[24px] border border-white/10 bg-slate-950/75 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
      >
        <span className="text-2xl">{ETAPES_MAP[etape]?.icone ?? "📋"}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Rappel pédagogique
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-200">{modal.titre}</p>
        </div>
        <span className="text-xs font-medium text-cyan-200">Relire</span>
      </button>
    );
  }

  return (
    <section
      className={`rounded-[28px] border px-4 py-4 shadow-[0_20px_60px_rgba(2,6,23,0.22)] ${
        isLocked
          ? "border-cyan-300/20 bg-cyan-500/10"
          : "border-white/10 bg-slate-950/75"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            isLocked ? "bg-cyan-500/12" : "bg-white/[0.05]"
          } text-2xl`}
        >
          {ETAPES_MAP[etape]?.icone ?? "📋"}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${isLocked ? "text-cyan-100" : "text-slate-500"}`}>
            {isLocked ? `Étape ${etape + 1} · à lire avant d’agir` : `Rappel · étape ${etape + 1}`}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white text-balance">{modal.titre}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{modal.ceQuiSePasse}</p>
        </div>
        {!isLocked && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            Réduire
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDetailOpen((value) => !value)}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-200 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
      >
        <span>{detailOpen ? "Masquer les détails" : "Voir pourquoi & comment"}</span>
      </button>

      {detailOpen && (
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Pourquoi c&apos;est important
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{modal.pourquoi}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Impact sur les comptes
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{modal.impactComptes}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-500/10 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
              Conseil
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{modal.conseil}</p>
          </div>
        </div>
      )}

      {isLocked && onUnlock && (
        <button
          type="button"
          onClick={() => {
            onUnlock();
            setOpen(false);
          }}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          J&apos;ai compris, je peux agir
        </button>
      )}
    </section>
  );
}

function SanteFinanciere({ joueur }: { joueur: Joueur }) {
  const tresorerie = (joueur.bilan.actifs.find((actif) => actif.categorie === "tresorerie")?.valeur ?? 0)
    - joueur.bilan.decouvert;
  const capitaux = joueur.bilan.passifs.find((passif) => passif.categorie === "capitaux")?.valeur ?? 0;
  const cr = joueur.compteResultat;
  const totalProduits =
    cr.produits.ventes
    + cr.produits.productionStockee
    + cr.produits.produitsFinanciers
    + cr.produits.revenusExceptionnels;
  const totalCharges =
    cr.charges.achats
    + cr.charges.servicesExterieurs
    + cr.charges.impotsTaxes
    + cr.charges.chargesInteret
    + cr.charges.chargesPersonnel
    + cr.charges.chargesExceptionnelles
    + cr.charges.dotationsAmortissements;
  const resultat = totalProduits - totalCharges;

  const metrics = [
    {
      label: "Cash",
      value: tresorerie,
      helper: tresorerie < 0 ? "Découvert en cours" : tresorerie < 3 ? "Trésorerie tendue" : "Marge de manœuvre",
      tone: tresorerie < 0 ? "rose" : tresorerie < 3 ? "amber" : "emerald",
    },
    {
      label: "Résultat",
      value: resultat,
      helper: resultat < 0 ? "Le trimestre détruit de la valeur" : resultat === 0 ? "Équilibre" : "Le trimestre crée de la valeur",
      tone: resultat < 0 ? "rose" : resultat === 0 ? "amber" : "emerald",
    },
    {
      label: "Capitaux",
      value: capitaux,
      helper: capitaux <= 0 ? "Risque critique" : capitaux < 5 ? "Structure fragile" : "Base solide",
      tone: capitaux <= 0 ? "rose" : capitaux < 5 ? "amber" : "sky",
    },
  ] as const;

  const toneClasses = {
    emerald: "border-emerald-400/15 bg-emerald-500/10 text-emerald-100",
    amber: "border-amber-400/15 bg-amber-500/10 text-amber-100",
    rose: "border-rose-400/15 bg-rose-500/10 text-rose-100",
    sky: "border-sky-400/15 bg-sky-500/10 text-sky-100",
  } as const;

  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/75 px-4 py-4">
      <StepHeader
        eyebrow="Lecture rapide"
        title="Santé financière"
        description="Trois repères pour sentir immédiatement si l'entreprise peut encaisser la suite du trimestre."
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border px-3 py-3 ${toneClasses[metric.tone]}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">
              {metric.label}
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums">
              {metric.value > 0 ? `+${metric.value}` : metric.value}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/70">{metric.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PurchaseAction({
  achatQte,
  setAchatQte,
  achatMode,
  setAchatMode,
  onLaunchAchat,
  onSkipAchat,
}: {
  achatQte: number;
  setAchatQte: (value: number) => void;
  achatMode: "tresorerie" | "dettes";
  setAchatMode: (value: "tresorerie" | "dettes") => void;
  onLaunchAchat: () => void;
  onSkipAchat: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
      <StepHeader
        eyebrow="Action"
        title="Acheter des marchandises"
        description="Choisis le volume et le mode de paiement, puis lance l'étape pour voir son effet comptable."
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <label
            htmlFor="achat-quantite"
            className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500"
          >
            Quantité
          </label>
          <input
            id="achat-quantite"
            name="achat_quantite"
            type="number"
            min={0}
            max={10}
            inputMode="numeric"
            autoComplete="off"
            value={achatQte}
            onChange={(event) => setAchatQte(Math.max(0, Number.parseInt(event.target.value, 10) || 0))}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-center text-lg font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Mets `0` si tu veux passer l&apos;étape sans achat.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Mode de paiement
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {([
              {
                value: "tresorerie",
                label: "Comptant",
                description: "La sortie de cash est immédiate.",
              },
              {
                value: "dettes",
                label: "À crédit",
                description: "Tu repousses la sortie de cash, mais tu crées une dette fournisseur.",
              },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAchatMode(option.value)}
                className={`rounded-2xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
                  achatMode === option.value
                    ? "border-cyan-300/20 bg-cyan-500/10 text-white"
                    : "border-white/10 bg-slate-950/60 text-slate-300 hover:bg-white/[0.05]"
                }`}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
          {achatMode === "dettes" && achatQte > 0 && (
            <div className="mt-3 rounded-2xl border border-amber-400/15 bg-amber-500/10 px-3 py-3">
              <p className="text-sm font-semibold text-amber-100">Dette fournisseur créée</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">
                Une dette de <strong>{achatQte}</strong> sera à rembourser au trimestre prochain.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onLaunchAchat}
          disabled={achatQte === 0}
          className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          Exécuter & comprendre
        </button>
        <button
          type="button"
          onClick={onSkipAchat}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          Passer cette étape
        </button>
      </div>
    </section>
  );
}

function DecisionAction({
  subEtape6,
  selectedDecision,
  onSkipDecision,
  decisionError,
}: {
  subEtape6: "recrutement" | "investissement";
  selectedDecision: CarteDecision | null;
  onSkipDecision: () => void;
  decisionError: string | null;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
      <StepHeader
        eyebrow={subEtape6 === "recrutement" ? "Étape 6a" : "Étape 6b"}
        title={
          subEtape6 === "recrutement"
            ? "Validation du recrutement"
            : "Validation de l'investissement"
        }
        description={
          selectedDecision
            ? "La carte est sélectionnée. Exécute-la depuis la zone centrale quand tu es certain de ton choix."
            : "Choisis une carte dans la zone centrale, ou passe simplement si tu ne veux rien engager ce tour."
        }
      />

      {decisionError && (
        <div className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-500/10 px-3 py-3">
          <p className="text-sm font-semibold text-rose-100">Action impossible</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-200">{decisionError}</p>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Sélection actuelle
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          {selectedDecision ? selectedDecision.titre : "Aucune carte choisie"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {selectedDecision
            ? "Lis son effet dans le panneau de gauche puis confirme-la depuis la zone centrale."
            : "Le choix reste optionnel : tu peux aussi poursuivre sans recruter ou investir."}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSkipDecision}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          {subEtape6 === "recrutement"
            ? "Passer au volet investissement"
            : "Passer sans investir"}
        </button>
      </div>
    </section>
  );
}

function OperationalAction({
  etapeTour,
  joueur,
  onLaunchStep,
}: {
  etapeTour: number;
  joueur: Joueur;
  onLaunchStep: () => void;
}) {
  const isSalesStep = etapeTour === 4;
  const capacite = isSalesStep ? calculerCapaciteLogistique(joueur) : 0;
  const nbClients = isSalesStep ? joueur.clientsATrait.length : 0;
  const clientsPerdus = isSalesStep ? joueur.clientsPerdusCeTour ?? 0 : 0;
  const capaciteUtilisee = Math.min(nbClients, capacite);
  const isExceeded = isSalesStep && nbClients > capacite;

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
      <StepHeader
        eyebrow="Action"
        title="Lancer l'étape courante"
        description="Le bouton ci-dessous déclenche l'explication et l'exécution de cette séquence comptable."
      />

      {isSalesStep && (
        <div className="mt-4 space-y-3">
          <div
            className={`rounded-2xl border px-3 py-3 ${
              isExceeded
                ? "border-rose-400/15 bg-rose-500/10"
                : "border-amber-400/15 bg-amber-500/10"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Capacité logistique</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  {capaciteUtilisee} client{capaciteUtilisee > 1 ? "s" : ""} traité
                  {capacite > 1 ? "s" : ""} sur {capacite}.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                  isExceeded ? "bg-rose-500/10 text-rose-100" : "bg-amber-500/10 text-amber-100"
                }`}
              >
                {isExceeded ? "Sous tension" : "À surveiller"}
              </span>
            </div>
            {clientsPerdus > 0 && (
              <p className="mt-3 text-sm leading-relaxed text-rose-100">
                {clientsPerdus} client{clientsPerdus > 1 ? "s" : ""} ne pourra
                pas être traité{clientsPerdus > 1 ? "s" : ""} ce tour.
              </p>
            )}
          </div>

          <div className="space-y-2">
            {joueur.clientsATrait.length > 0 ? (
              joueur.clientsATrait.map((client, index) => {
                const tone =
                  client.delaiPaiement === 0
                    ? "border-emerald-400/15 bg-emerald-500/10"
                    : client.delaiPaiement === 1
                      ? "border-sky-400/15 bg-sky-500/10"
                      : "border-violet-400/15 bg-violet-500/10";

                return (
                  <div key={`${client.titre}-${index}`} className={`rounded-2xl border px-3 py-3 ${tone}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{client.titre}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-300">
                          {client.delaiPaiement === 0
                            ? "Encaissement immédiat"
                            : client.delaiPaiement === 1
                              ? "Encaissement en C+1"
                              : "Encaissement en C+2"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                        +{client.montantVentes} CA
                      </span>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                      Cette vente fera bouger les ventes, les stocks, le coût des ventes et la trésorerie ou les créances.
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-center">
                <p className="text-sm font-medium text-slate-300">Aucun client à traiter ce tour</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  L&apos;étape peut quand même être exécutée pour faire avancer le trimestre.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onLaunchStep}
          className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        >
          Exécuter & comprendre cette étape
        </button>
      </div>
    </section>
  );
}

function ModeRapideCard({
  modeRapide,
  setModeRapide,
}: {
  modeRapide: boolean;
  setModeRapide: (value: boolean) => void;
}) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/75 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Confort de jeu
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white">Mode accéléré</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Pré-coche les étapes répétitives à partir du troisième tour pour se concentrer sur la lecture des impacts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModeRapide(!modeRapide)}
          aria-pressed={modeRapide}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
            modeRapide ? "bg-cyan-400" : "bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              modeRapide ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </section>
  );
}

function JournalPanel({
  journal,
  showJournal,
  setShowJournal,
}: {
  journal: JournalEntry[];
  showJournal: boolean;
  setShowJournal: (value: boolean) => void;
}) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/75 px-4 py-4">
      <button
        type="button"
        onClick={() => setShowJournal(!showJournal)}
        aria-expanded={showJournal}
        className="flex w-full items-center justify-between gap-3 text-left transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Traçabilité
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white">
            Journal comptable ({journal.length})
          </h3>
        </div>
        <span className={`text-lg text-slate-400 transition-transform ${showJournal ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {showJournal && (
        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
          {journal.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-center">
              <p className="text-sm font-medium text-slate-300">Aucune opération pour l&apos;instant</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Le journal se remplira au fur et à mesure des étapes.
              </p>
            </div>
          ) : (
            journal.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {entry.joueurNom} · Tour {entry.tour} · Étape {entry.etape + 1}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{entry.titre}</p>
                  </div>
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    {entry.entries.length} lignes
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {entry.entries
                    .filter((item) => item.applied !== false || entry.entries.length === 0)
                    .map((item, index) => {
                      const document = getDocument(item.poste);
                      return (
                        <div
                          key={`${item.poste}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/70 px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-slate-200">{nomCompte(item.poste)}</p>
                            <span
                              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${document.badge}`}
                            >
                              {document.detail || document.label}
                            </span>
                          </div>
                          <span className={`shrink-0 font-semibold tabular-nums ${item.delta >= 0 ? "text-sky-300" : "text-amber-300"}`}>
                            {item.delta > 0 ? "+" : ""}
                            {item.delta}
                          </span>
                        </div>
                      );
                    })}
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                  Principe : {entry.principe}
                </p>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function LoanButton({
  onDemanderEmprunt,
  emphasized = false,
}: {
  onDemanderEmprunt: () => void;
  emphasized?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onDemanderEmprunt}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${
        emphasized
          ? "border border-amber-400/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
          : "border border-white/12 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
      }`}
    >
      <span aria-hidden="true">🏦</span>
      <span>Demander un prêt bancaire</span>
    </button>
  );
}

export function LeftPanel({
  etapeTour,
  tourActuel,
  nbToursMax,
  joueur,
  activeStep,
  onApplyEntry,
  onConfirmStep,
  onCancelStep,
  onApplyEntryEffect,
  achatQte,
  setAchatQte,
  achatMode,
  setAchatMode,
  onLaunchAchat,
  onSkipAchat,
  selectedDecision,
  onSkipDecision,
  decisionError,
  onLaunchStep,
  journal,
  subEtape6 = "recrutement",
  modeRapide = false,
  setModeRapide,
  modalEtapeEnAttente = null,
  onCloseModal,
  onDemanderEmprunt,
}: LeftPanelProps) {
  const [showJournal, setShowJournal] = useState(false);
  const isLocked = modalEtapeEnAttente !== null;

  if (activeStep) {
    return (
      <aside className="w-full overflow-y-auto bg-slate-950/60 p-3">
        <div className="space-y-4">
          <ProgressStrip
            etapeTour={etapeTour}
            tourActuel={tourActuel}
            nbToursMax={nbToursMax}
            subEtape6={subEtape6}
          />

          <PedagoCard
            key={etapeTour}
            etape={etapeTour}
            isLocked={isLocked}
            onUnlock={onCloseModal}
          />

          <div className={`relative transition-opacity ${isLocked ? "pointer-events-none select-none opacity-40" : ""}`}>
            {isLocked && <LockedOverlay compact />}
            <div className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
              <StepHeader
                eyebrow="Saisie"
                title={activeStep.titre}
                description="Complète les écritures ci-dessous. L'impact apparaît au fur et à mesure dans la zone centrale."
              />
              <div className="mt-4">
                <EntryPanel
                  activeStep={activeStep}
                  displayJoueur={joueur}
                  baseJoueur={
                    activeStep.baseEtat?.joueurs?.[activeStep.baseEtat?.joueurActif] as Joueur | undefined
                  }
                  onApply={onApplyEntry}
                  onApplyEntry={onApplyEntryEffect}
                  onConfirm={onConfirmStep}
                  onCancel={onCancelStep}
                  tourActuel={tourActuel}
                  etapeTour={etapeTour}
                />
              </div>
            </div>
          </div>

          {etapeTour === 6 && subEtape6 === "investissement" && onDemanderEmprunt && (
            <LoanButton onDemanderEmprunt={onDemanderEmprunt} emphasized />
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full overflow-y-auto bg-slate-950/60 p-3">
      <div className="space-y-4">
        <ProgressStrip
          etapeTour={etapeTour}
          tourActuel={tourActuel}
          nbToursMax={nbToursMax}
          subEtape6={subEtape6}
        />

        {!isLocked && <SanteFinanciere joueur={joueur} />}

        <PedagoCard
          key={etapeTour}
          etape={etapeTour}
          isLocked={isLocked}
          onUnlock={onCloseModal}
        />

        <div className={`relative transition-opacity ${isLocked ? "pointer-events-none select-none opacity-40" : ""}`}>
          {isLocked && <LockedOverlay />}

          {etapeTour === 1 && (
            <PurchaseAction
              achatQte={achatQte}
              setAchatQte={setAchatQte}
              achatMode={achatMode}
              setAchatMode={setAchatMode}
              onLaunchAchat={onLaunchAchat}
              onSkipAchat={onSkipAchat}
            />
          )}

          {etapeTour === 6 && (
            <DecisionAction
              subEtape6={subEtape6}
              selectedDecision={selectedDecision}
              onSkipDecision={onSkipDecision}
              decisionError={decisionError}
            />
          )}

          {etapeTour !== 1 && etapeTour !== 6 && (
            <OperationalAction
              etapeTour={etapeTour}
              joueur={joueur}
              onLaunchStep={onLaunchStep}
            />
          )}
        </div>

        {tourActuel >= 3 && setModeRapide && (
          <ModeRapideCard modeRapide={modeRapide} setModeRapide={setModeRapide} />
        )}

        <JournalPanel
          journal={journal}
          showJournal={showJournal}
          setShowJournal={setShowJournal}
        />

        {onDemanderEmprunt && <LoanButton onDemanderEmprunt={onDemanderEmprunt} />}
      </div>
    </aside>
  );
}
