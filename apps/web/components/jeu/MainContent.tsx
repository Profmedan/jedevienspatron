"use client";

import { useEffect, type ReactNode } from "react";

import {
  CarteDecision,
  Joueur,
  type DelaiPaiement,
} from "@/lib/game-engine/types";
import { getTresorerie } from "@/lib/game-engine/calculators";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import IndicateursPanel from "@/components/IndicateursPanel";
import { GlossairePanel } from "@/components/GlossairePanel";
import CarteView from "@/components/CarteView";

import { type ActiveStep } from "./EntryPanel";
import { getDocumentType, getPosteValue, nomCompte } from "./utils";

type TabType = "bilan" | "cr" | "indicateurs" | "glossaire" | "impact";

interface MainContentProps {
  joueur: Joueur;
  displayJoueur: Joueur;
  activeStep: ActiveStep | null;
  highlightedPoste: string | null;
  etapeTour: number;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  showCartes: boolean;
  selectedDecision: CarteDecision | null;
  setSelectedDecision: (val: CarteDecision | null) => void;
  cartesDisponibles: CarteDecision[];
  cartesRecrutement?: CarteDecision[];
  recentModifications?: Array<{
    poste: string;
    ancienneValeur: number;
    nouvelleValeur: number;
  }>;
  subEtape6?: "recrutement" | "investissement";
  modeRapide?: boolean;
  onSkipDecision?: () => void;
  onLaunchDecision?: () => void;
}

interface TabMeta {
  label: string;
  title: string;
  description: string;
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

interface SummaryTileProps {
  label: string;
  value: string;
  tone?: "neutral" | "emerald" | "rose" | "sky" | "amber";
}

interface CommercialCardProps {
  carte: CarteDecision;
}

interface ImpactRow {
  poste: string;
  label: string;
  docType: "Bilan" | "CR";
  avant: number;
  actuel: number;
  delta: number;
  applied: boolean;
}

const TABS_BASE: Array<[TabType, string]> = [
  ["bilan", "Bilan"],
  ["cr", "Résultat"],
  ["indicateurs", "Indicateurs"],
  ["glossaire", "Glossaire"],
];

const TAB_IMPACT: [TabType, string] = ["impact", "Impact"];

const TAB_META: Record<TabType, TabMeta> = {
  bilan: {
    label: "Bilan",
    title: "Lire la structure de l'entreprise",
    description: "Actif et passif montrent ce que l'entreprise possède et comment elle se finance.",
  },
  cr: {
    label: "Compte de résultat",
    title: "Comprendre ce qui crée ou détruit de la valeur",
    description: "Repère l'effet des ventes, des charges et des événements sur le résultat du trimestre.",
  },
  indicateurs: {
    label: "Indicateurs",
    title: "Relier les comptes aux grands équilibres",
    description: "Les ratios aident à prendre du recul sur la trésorerie, le BFR et la solvabilité.",
  },
  glossaire: {
    label: "Glossaire",
    title: "Retrouver une définition sans quitter la partie",
    description: "Garde ce repère à portée de main si un terme comptable te bloque pendant le tour.",
  },
  impact: {
    label: "Impact",
    title: "Suivre l'avant / après pendant la saisie",
    description: "Cette vue montre immédiatement quels postes bougent au fur et à mesure des écritures.",
  },
};

const MONTANT_PAR_TYPE: Record<string, number> = {
  particulier: 2,
  tpe: 3,
  grand_compte: 4,
};

const DELAI_PAR_TYPE: Record<string, DelaiPaiement> = {
  particulier: 0,
  tpe: 1,
  grand_compte: 2,
};

const BFR_LABELS: Record<number, { label: string; tone: string }> = {
  0: { label: "Paiement immédiat", tone: "text-emerald-300" },
  1: { label: "BFR élevé", tone: "text-amber-300" },
  2: { label: "BFR critique", tone: "text-rose-300" },
};

const CLIENT_META: Record<
  string,
  { icon: string; label: string; accent: string; accentSoft: string }
> = {
  particulier: {
    icon: "👤",
    label: "Clients particuliers",
    accent: "text-emerald-200",
    accentSoft: "border-emerald-400/30 bg-emerald-500/10",
  },
  tpe: {
    icon: "🏠",
    label: "Clients TPE",
    accent: "text-sky-200",
    accentSoft: "border-sky-400/30 bg-sky-500/10",
  },
  grand_compte: {
    icon: "🏢",
    label: "Grands comptes",
    accent: "text-violet-200",
    accentSoft: "border-violet-400/30 bg-violet-500/10",
  },
};

function formatSignedValue(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function getToneClass(tone: SummaryTileProps["tone"]) {
  switch (tone) {
    case "emerald":
      return "text-emerald-300";
    case "rose":
      return "text-rose-300";
    case "sky":
      return "text-sky-300";
    case "amber":
      return "text-amber-300";
    default:
      return "text-white";
  }
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-base font-semibold text-white text-balance">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

function SummaryTile({ label, value, tone = "neutral" }: SummaryTileProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-semibold tabular-nums ${getToneClass(tone)}`}>
        {value}
      </p>
    </div>
  );
}

function TabShell({
  meta,
  children,
}: {
  meta: TabMeta;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-4">
        <SectionHeading
          eyebrow={meta.label}
          title={meta.title}
          description={meta.description}
        />
      </div>
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/60 p-2">
        {children}
      </div>
    </section>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-5 text-center">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function CommercialCard({ carte }: CommercialCardProps) {
  const clientType = carte.clientParTour ?? "particulier";
  const meta = CLIENT_META[clientType] ?? CLIENT_META.particulier;
  const nbClients = carte.nbClientsParTour ?? 1;
  const montant = MONTANT_PAR_TYPE[clientType] ?? 1;
  const delai = DELAI_PAR_TYPE[clientType] ?? 0;
  const typeLabel = meta.label;
  const caTotal = montant * nbClients;

  const coutCharges = (carte.effetsRecurrents ?? [])
    .filter((effet) => effet.poste === "chargesPersonnel")
    .reduce((sum, effet) => sum + effet.delta, 0);

  const coutTreso = (carte.effetsRecurrents ?? [])
    .filter((effet) => effet.poste === "tresorerie")
    .reduce((sum, effet) => sum + effet.delta, 0);

  const cmvTotal = nbClients;
  const resultatNet = caTotal - cmvTotal - coutCharges;
  const tresoNette = (delai === 0 ? caTotal : 0) + coutTreso;
  const bfrInfo = BFR_LABELS[delai] ?? BFR_LABELS[0];

  return (
    <article className={`rounded-[24px] border px-4 py-4 ${meta.accentSoft}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Commercial actif
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white">{carte.titre}</h3>
          <p className={`mt-1 text-xs ${meta.accent}`}>
            {meta.icon} {nbClients} {typeLabel.toLowerCase()} / trimestre
          </p>
        </div>
        <span className="rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
          C+{delai}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-black/15 px-3 py-3">
          <p className="text-[11px] font-medium text-slate-300">Ce que cette carte apporte</p>
          <p className="mt-2 text-sm font-semibold text-emerald-300">+{caTotal} de CA</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            {delai === 0
              ? "Le chiffre d'affaires devient immédiatement du cash."
              : `Le CA sera encaissé en C+${delai}, donc avec un décalage de trésorerie.`}
          </p>
        </div>
        <div className="rounded-2xl bg-black/15 px-3 py-3">
          <p className="text-[11px] font-medium text-slate-300">Ce que cette carte coûte</p>
          <p className="mt-2 text-sm font-semibold text-rose-300">
            {coutCharges > 0 ? `+${coutCharges} charges personnel` : "Pas de charge personnel"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            {coutTreso < 0 ? `${coutTreso} de trésorerie chaque trimestre.` : "Pas de sortie de cash directe."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <SummaryTile
          label="Résultat"
          value={formatSignedValue(resultatNet)}
          tone={resultatNet >= 0 ? "emerald" : "rose"}
        />
        <SummaryTile
          label="Trésorerie"
          value={formatSignedValue(tresoNette)}
          tone={tresoNette >= 0 ? "emerald" : "rose"}
        />
        <SummaryTile label="BFR" value={bfrInfo.label} tone={delai === 0 ? "emerald" : delai === 1 ? "amber" : "rose"} />
      </div>
    </article>
  );
}

function getImpactTone(row: ImpactRow) {
  const debtPostes = new Set(["emprunts", "dettes", "decouvert", "dettesFiscales", "dettesD2"]);
  const revenuePostes = new Set([
    "ventes",
    "productionStockee",
    "produitsFinanciers",
    "revenusExceptionnels",
  ]);

  if (row.docType === "Bilan") {
    if (row.delta === 0) return "text-slate-500";
    const positiveIsGood = !debtPostes.has(row.poste);
    return positiveIsGood
      ? row.delta > 0
        ? "text-emerald-300"
        : "text-rose-300"
      : row.delta > 0
        ? "text-rose-300"
        : "text-emerald-300";
  }

  if (row.delta === 0) return "text-slate-500";
  const positiveIsGood = revenuePostes.has(row.poste);
  return positiveIsGood
    ? row.delta > 0
      ? "text-emerald-300"
      : "text-rose-300"
    : row.delta > 0
      ? "text-rose-300"
      : "text-emerald-300";
}

export function MainContent({
  joueur,
  displayJoueur,
  activeStep,
  highlightedPoste,
  etapeTour,
  activeTab,
  setActiveTab,
  showCartes,
  selectedDecision,
  setSelectedDecision,
  cartesDisponibles,
  cartesRecrutement: cartesRecrutementProp,
  recentModifications,
  subEtape6 = "recrutement",
  modeRapide = false,
  onSkipDecision,
  onLaunchDecision,
}: MainContentProps) {
  const cartesRecrutement =
    cartesRecrutementProp ?? cartesDisponibles.filter((carte) => carte.categorie === "commercial");
  const cartesAutres = cartesDisponibles.filter((carte) => carte.categorie !== "commercial");

  const cartesCommerciales = joueur.cartesActives.filter((carte) => carte.clientParTour);
  const cartesAutresActives = joueur.cartesActives.filter((carte) => !carte.clientParTour);

  const cartesInvestDisponibles = cartesAutres.filter(
    (carte) => !joueur.cartesActives.some((active) => active.id === carte.id),
  );

  const currentCash = getTresorerie(displayJoueur);
  const currentTabMeta = TAB_META[activeTab];
  const tabs = activeStep ? [TAB_IMPACT, ...TABS_BASE] : TABS_BASE;

  useEffect(() => {
    if (activeStep) {
      setActiveTab("impact");
      return;
    }

    if (activeTab === "impact") {
      setActiveTab("bilan");
    }
  }, [activeStep, activeTab, setActiveTab]);

  const actionState = activeStep
    ? {
        badge: "Écriture en cours",
        description: "Complète les saisies comptables avant de passer à l'étape suivante.",
        tone: "bg-violet-500/10 text-violet-100 border-violet-400/20",
      }
    : etapeTour === 6 && selectedDecision
      ? {
          badge: "Carte prête",
          description: `Tu as sélectionné ${selectedDecision.titre}. Il reste à l'exécuter.`,
          tone: "bg-cyan-500/10 text-cyan-100 border-cyan-400/20",
        }
      : etapeTour === 6 || showCartes
        ? {
            badge: "Choix stratégique",
            description: "Choisis une carte utile ou passe l'étape si rien n'est pertinent maintenant.",
            tone: "bg-amber-500/10 text-amber-100 border-amber-400/20",
          }
        : {
            badge: "Lecture libre",
            description: "Tu peux relire les comptes, les indicateurs et les cartes déjà actives.",
            tone: "bg-white/[0.05] text-slate-100 border-white/10",
          };

  const impactRows: ImpactRow[] =
    activeStep?.entries.reduce<ImpactRow[]>((rows, entry) => {
      if (rows.some((row) => row.poste === entry.poste)) {
        return rows;
      }

      const baseJoueur = activeStep.baseEtat?.joueurs?.[activeStep.baseEtat?.joueurActif] as
        | Joueur
        | undefined;
      const avant = baseJoueur ? getPosteValue(baseJoueur, entry.poste) : 0;
      const actuel = getPosteValue(displayJoueur, entry.poste);
      const applied = activeStep.entries
        .filter((candidate) => candidate.poste === entry.poste)
        .every((candidate) => candidate.applied);

      rows.push({
        poste: entry.poste,
        label: nomCompte(entry.poste),
        docType: getDocumentType(entry.poste),
        avant,
        actuel,
        delta: actuel - avant,
        applied,
      });

      return rows;
    }, []) ?? [];

  const bilanRows = impactRows.filter((row) => row.docType === "Bilan");
  const crRows = impactRows.filter((row) => row.docType === "CR");
  const appliedImpactRows = impactRows.filter((row) => row.applied).length;

  return (
    <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4 shadow-[0_24px_80px_rgba(2,6,23,0.26)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/[0.06] text-3xl shadow-inner shadow-white/5">
                {joueur.entreprise.icon}
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                    Entreprise active
                  </p>
                  <h1 className="mt-1 text-xl font-semibold text-white">{joueur.pseudo}</h1>
                  <p className="mt-1 text-sm text-slate-400">
                    {joueur.entreprise.nom} · {joueur.entreprise.specialite}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                    Étape {etapeTour + 1}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${actionState.tone}`}
                  >
                    {actionState.badge}
                  </span>
                  {modeRapide && (
                    <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100">
                      Mode accéléré
                    </span>
                  )}
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
                  {actionState.description}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:w-[380px]">
              <SummaryTile label="Trésorerie" value={`${currentCash}`} tone={currentCash >= 0 ? "emerald" : "rose"} />
              <SummaryTile label="Commerciaux" value={`${cartesCommerciales.length}`} tone="sky" />
              <SummaryTile
                label="Cartes actives"
                value={`${joueur.cartesActives.length}`}
                tone="neutral"
              />
            </div>
          </div>
        </section>

        {modeRapide && (
          <section className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-base" aria-hidden="true">
                ⚡
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-100">Mode accéléré actif</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-50/80">
                  Certaines étapes comptables sont déjà pré-cochées pour aller plus vite. Il reste surtout à valider et à interpréter ce qui change.
                </p>
              </div>
            </div>
          </section>
        )}

        {etapeTour === 6 && !activeStep && (
          <section className="rounded-[28px] border border-cyan-400/20 bg-cyan-500/10 px-4 py-4">
            <SectionHeading
              eyebrow={subEtape6 === "recrutement" ? "Étape 6a" : "Étape 6b"}
              title={
                subEtape6 === "recrutement"
                  ? "Choisir un recrutement utile maintenant"
                  : "Choisir un investissement qui renforce l'entreprise"
              }
              description={
                subEtape6 === "recrutement"
                  ? "Choisis un commercial si tu veux générer plus de clients à partir du prochain tour, sinon passe simplement à l'investissement."
                  : "Choisis une carte qui améliore durablement ton activité, ou passe cette étape si aucun investissement n'est pertinent."
              }
              action={
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-100">
                  {selectedDecision ? "1 carte sélectionnée" : "Aucune carte sélectionnée"}
                </span>
              }
            />

            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/55 px-4 py-4">
              {selectedDecision ? (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                      Carte prête
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{selectedDecision.titre}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      Vérifie son effet dans le panneau de gauche, puis exécute-la si elle sert bien ta stratégie du trimestre.
                    </p>
                  </div>
                  {onLaunchDecision && (
                    <button
                      type="button"
                      onClick={onLaunchDecision}
                      className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    >
                      Exécuter {selectedDecision.titre}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-slate-300">
                  Commence par cliquer sur une carte ci-dessous pour afficher une option claire à exécuter.
                </p>
              )}
            </div>

            <div className="mt-4">
              {subEtape6 === "recrutement" ? (
                cartesRecrutement.length === 0 ? (
                  <EmptyState
                    title="Tous les commerciaux sont déjà disponibles"
                    description="Tu peux passer directement à l'investissement si tu veux avancer sans recruter davantage."
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {cartesRecrutement.map((carte) => (
                      <CarteView
                        key={carte.id}
                        carte={carte}
                        onClick={() =>
                          setSelectedDecision(selectedDecision?.id === carte.id ? null : carte)
                        }
                        selected={selectedDecision?.id === carte.id}
                      />
                    ))}
                  </div>
                )
              ) : cartesInvestDisponibles.length === 0 ? (
                <EmptyState
                  title="Tous les investissements disponibles sont déjà actifs"
                  description="L'entreprise tourne déjà avec tout son éventail d'investissements. Tu peux passer cette étape sans perdre d'opportunité."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {cartesInvestDisponibles.map((carte) => (
                    <CarteView
                      key={carte.id}
                      carte={carte}
                      onClick={() =>
                        setSelectedDecision(selectedDecision?.id === carte.id ? null : carte)
                      }
                      selected={selectedDecision?.id === carte.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {onSkipDecision && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onSkipDecision}
                  className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/[0.05] px-5 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                >
                  {subEtape6 === "recrutement"
                    ? "Passer au volet investissement"
                    : "Passer sans investir ce trimestre"}
                </button>
              </div>
            )}
          </section>
        )}

        <section className="space-y-3">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/70 px-3 py-3">
            <div
              className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0"
              role="tablist"
              aria-label="Lectures comptables"
            >
              {tabs.map(([tab, label]) => {
                const isActive = activeTab === tab;
                const isImpact = tab === "impact";

                return (
                  <button
                    key={tab}
                    id={`main-tab-${tab}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`main-tab-panel-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`relative min-w-[112px] shrink-0 rounded-2xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:min-w-0 sm:shrink ${
                      isActive
                        ? "bg-cyan-400 text-slate-950"
                        : isImpact
                          ? "bg-violet-500/10 text-violet-100 hover:bg-violet-500/15"
                          : "bg-white/[0.04] text-slate-200 hover:bg-white/[0.07]"
                    }`}
                  >
                    <span>{label}</span>
                    {isImpact && !isActive && activeStep && (
                      <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-70" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-200" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div id={`main-tab-panel-${activeTab}`} role="tabpanel" aria-labelledby={`main-tab-${activeTab}`}>
            {activeTab === "impact" && activeStep && (
              <section className="space-y-3">
                <div className="rounded-[24px] border border-violet-400/20 bg-violet-500/10 px-4 py-4">
                  <SectionHeading
                    eyebrow="Impact"
                    title={activeStep.titre}
                    description="Relis cette vue comme un avant / après. Dès qu'un poste change, tu vois si l'effet va dans le bon sens."
                    action={
                      <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-100">
                        {appliedImpactRows}/{impactRows.length} postes saisis
                      </span>
                    }
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {[
                    {
                      key: "bilan",
                      title: "Bilan",
                      description: "Ce que l'entreprise possède ou doit.",
                      rows: bilanRows,
                      accent: "text-sky-200",
                      background: "bg-sky-500/10 border-sky-400/20",
                    },
                    {
                      key: "cr",
                      title: "Compte de résultat",
                      description: "Ce que l'activité gagne ou consomme.",
                      rows: crRows,
                      accent: "text-amber-200",
                      background: "bg-amber-500/10 border-amber-400/20",
                    },
                  ].map((column) => (
                    <section
                      key={column.key}
                      className={`rounded-[24px] border px-4 py-4 ${column.background}`}
                    >
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${column.accent}`}>
                        {column.title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        {column.description}
                      </p>
                      <div className="mt-4 space-y-3">
                        {column.rows.length === 0 ? (
                          <EmptyState
                            title={`Aucun mouvement dans ${column.title.toLowerCase()}`}
                            description="Cette étape ne modifie pas cette partie des comptes."
                          />
                        ) : (
                          column.rows.map((row) => {
                            const changed = row.delta !== 0;
                            return (
                              <div
                                key={row.poste}
                                className={`rounded-[22px] border px-3 py-3 ${
                                  row.applied
                                    ? "border-white/10 bg-slate-950/60"
                                    : "border-white/10 bg-white/[0.03]"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold text-white">{row.label}</p>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                      {row.applied
                                        ? "Écriture saisie"
                                        : "En attente de saisie"}
                                    </p>
                                  </div>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                                      row.applied
                                        ? "bg-emerald-500/10 text-emerald-100"
                                        : "bg-white/[0.05] text-slate-300"
                                    }`}
                                  >
                                    {row.applied ? "Saisi" : "À faire"}
                                  </span>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2">
                                  <SummaryTile label="Avant" value={`${row.avant}`} tone="neutral" />
                                  <SummaryTile label="Après" value={`${row.actuel}`} tone={changed ? (row.delta > 0 ? "emerald" : "rose") : "neutral"} />
                                  <SummaryTile
                                    label="Écart"
                                    value={formatSignedValue(row.delta)}
                                    tone={
                                      changed
                                        ? getImpactTone(row).includes("emerald")
                                          ? "emerald"
                                          : "rose"
                                        : "neutral"
                                    }
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "bilan" && (
              <TabShell meta={currentTabMeta}>
                <BilanPanel
                  joueur={displayJoueur}
                  highlightedPoste={highlightedPoste}
                  recentModifications={recentModifications}
                />
              </TabShell>
            )}

            {activeTab === "cr" && (
              <TabShell meta={currentTabMeta}>
                <CompteResultatPanel
                  joueur={displayJoueur}
                  highlightedPoste={highlightedPoste}
                  etapeTour={etapeTour}
                  hasActiveStep={!!activeStep}
                  recentModifications={recentModifications}
                />
              </TabShell>
            )}

            {activeTab === "indicateurs" && (
              <TabShell meta={currentTabMeta}>
                <IndicateursPanel joueur={displayJoueur} />
              </TabShell>
            )}

            {activeTab === "glossaire" && (
              <TabShell meta={currentTabMeta}>
                <GlossairePanel />
              </TabShell>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4 shadow-[0_24px_80px_rgba(2,6,23,0.2)]">
          <SectionHeading
            eyebrow="Ressources actives"
            title="Ce qui travaille déjà pour l'entreprise"
            description="Retrouve ici les commerciaux et les investissements déjà en place, sans devoir chercher dans plusieurs zones."
            action={
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                {joueur.cartesActives.length} cartes actives
              </span>
            }
          />

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <SummaryTile label="Commerciaux" value={`${cartesCommerciales.length}`} tone="sky" />
            <SummaryTile
              label="Investissements"
              value={`${cartesAutresActives.length}`}
              tone="neutral"
            />
            <SummaryTile
              label="Trésorerie actuelle"
              value={`${currentCash}`}
              tone={currentCash >= 0 ? "emerald" : "rose"}
            />
          </div>

          <div className="mt-5 space-y-5">
            {cartesCommerciales.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Commerciaux
                </p>
                <div className="grid gap-3 xl:grid-cols-2">
                  {cartesCommerciales.map((carte) => (
                    <CommercialCard key={carte.id} carte={carte} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="Aucun commercial actif pour l'instant"
                description="Quand tu recrutes un commercial, son effet récurrent apparaîtra ici pour t'aider à mesurer sa rentabilité."
              />
            )}

            {cartesAutresActives.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Investissements & décisions récurrentes
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {cartesAutresActives.map((carte) => (
                    <CarteView key={carte.id} carte={carte} compact />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="Aucun investissement actif pour l'instant"
                description="Les cartes d'investissement achetées apparaîtront ici pour rappeler ce qu'elles continuent de produire tour après tour."
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
