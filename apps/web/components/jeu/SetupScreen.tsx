"use client";

import { useState, useEffect, useRef, useMemo, KeyboardEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Building2, Clock3, Check } from "lucide-react";
import { NomEntreprise, ENTREPRISES, EntrepriseTemplate } from "@jedevienspatron/game-engine";
import EntrepriseBuilder from "./EntrepriseBuilder";
import { getPitchMetier } from "@/lib/game-engine/data/pitchs-metier";

// ═════════════════════════════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════════════════════════════

export interface PlayerSetup {
  pseudo: string;
  entreprise: NomEntreprise;
}

interface SetupScreenProps {
  onStart: (
    players: PlayerSetup[],
    nbTours: number,
    adHocTemplates?: EntrepriseTemplate[],
  ) => void;
  customTemplates?: EntrepriseTemplate[] | null;
}

type WizardStep = 1 | 2 | 3 | 4;

/** Valeur spéciale du <select> pour ouvrir le wizard de création d'entreprise. */
const CREATE_ENTREPRISE_VALUE = "__create__";

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Joueurs",
  2: "Pseudos",
  3: "Entreprises",
  4: "Durée",
};

const DEFAULT_PLAYERS: PlayerSetup[] = [
  { pseudo: "", entreprise: "Manufacture Belvaux" },
  { pseudo: "", entreprise: "Véloce Transports" },
  { pseudo: "", entreprise: "Azura Commerce" },
  { pseudo: "", entreprise: "Synergia Lab" },
];

const DUREE_OPTIONS: Array<{ tours: number; label: string; note: string }> = [
  { tours: 6,  label: "~1h",    note: "Découverte rapide" },
  { tours: 8,  label: "~1h15",  note: "Format équilibré" },
  { tours: 10, label: "~1h30",  note: "Parcours approfondi" },
  { tours: 12, label: "~1h45",  note: "Parcours complet" },
];

// ═════════════════════════════════════════════════════════════════════════════
// Conseil de démarrage dynamique — s'adapte à (nbJoueurs, nbTours)
// ═════════════════════════════════════════════════════════════════════════════

function getDureeLabel(nbTours: number): string {
  const opt = DUREE_OPTIONS.find((o) => o.tours === nbTours);
  return opt ? opt.label : "";
}

function getConseil(nbJoueurs: number, nbTours: number): { highlight: string; texte: string } {
  const joueursLabel = `${nbJoueurs} joueur${nbJoueurs > 1 ? "s" : ""} sur ${nbTours} trimestres`;
  const duree = getDureeLabel(nbTours);

  // Cas 1 — configuration idéale pour un démarrage solo rapide
  if (nbJoueurs === 1 && nbTours === 6) {
    return {
      highlight: joueursLabel,
      texte: ` — la configuration idéale pour une première découverte (${duree}). Pour une séance plus riche en comparaison, passez à 2, 3 ou 4 joueurs.`,
    };
  }
  // Cas 2 — solo approfondi
  if (nbJoueurs === 1) {
    return {
      highlight: joueursLabel,
      texte: ` — un parcours solo approfondi (${duree}). Pour plus de dynamisme, essayez à 2, 3 ou 4 joueurs la prochaine fois.`,
    };
  }
  // Cas 3 — multi rapide
  if (nbTours === 6) {
    return {
      highlight: joueursLabel,
      texte: ` — format rapide et convivial (${duree}). La comparaison des stratégies sera l'intérêt principal de la fin de partie.`,
    };
  }
  // Cas 4 — multi approfondi
  return {
    highlight: joueursLabel,
    texte: ` — excellente configuration (${duree}) pour comparer les stratégies des joueurs en profondeur.`,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Composant principal
// ═════════════════════════════════════════════════════════════════════════════

export function SetupScreen({ onStart, customTemplates }: SetupScreenProps) {
  // ─── État du wizard ────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  // ─── État fonctionnel ──────────────────────────────────────────
  const [nbJoueurs, setNbJoueurs] = useState(1);
  const [nbTours, setNbTours] = useState(8);
  const [players, setPlayers] = useState<PlayerSetup[]>(DEFAULT_PLAYERS);
  const [adHocTemplates, setAdHocTemplates] = useState<EntrepriseTemplate[]>([]);
  const [builderOpenForPlayer, setBuilderOpenForPlayer] = useState<number | null>(null);

  // ─── Entreprises disponibles ───────────────────────────────────
  const allEntreprises = useMemo(() => ENTREPRISES.map((e) => e.nom), []);
  const customEntrepriseNames = useMemo(
    () => customTemplates?.map((t) => t.nom) ?? [],
    [customTemplates],
  );
  const adHocEntrepriseNames = useMemo(
    () => adHocTemplates.map((t) => t.nom),
    [adHocTemplates],
  );
  const allAvailableEnts = useMemo(
    () => [...allEntreprises, ...customEntrepriseNames, ...adHocEntrepriseNames],
    [allEntreprises, customEntrepriseNames, adHocEntrepriseNames],
  );

  const usedEnts = players.slice(0, nbJoueurs).map((p) => p.entreprise);
  const activePlayers = players.slice(0, nbJoueurs);

  // ─── Validation par étape ──────────────────────────────────────
  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return nbJoueurs >= 1 && nbJoueurs <= 4;
      case 2:
        return activePlayers.every((p) => p.pseudo.trim().length > 0);
      case 3:
        return new Set(usedEnts).size === nbJoueurs;
      case 4:
        return DUREE_OPTIONS.some((o) => o.tours === nbTours);
    }
  };

  // ─── Navigation ────────────────────────────────────────────────
  const handleNext = () => {
    if (!canAdvance()) return;
    if (step < 4) {
      setDirection(1);
      setStep((step + 1) as WizardStep);
    } else {
      // Démarrage : ne transmettre que les ad-hoc utilisés
      const usedNames = new Set(activePlayers.map((p) => p.entreprise));
      const usedAdHoc = adHocTemplates.filter((t) => usedNames.has(t.nom));
      onStart(activePlayers, nbTours, usedAdHoc.length > 0 ? usedAdHoc : undefined);
    }
  };

  const handleBack = () => {
    if (step <= 1) return;
    setDirection(-1);
    setStep((step - 1) as WizardStep);
  };

  // ─── Mise à jour d'un joueur ──────────────────────────────────
  const updatePlayer = (index: number, field: "pseudo" | "entreprise", value: string) => {
    const next = [...players];
    next[index] = { ...next[index], [field]: value };
    setPlayers(next);
  };

  // ─── Gestion du <select> avec option spéciale "Créer ma propre entreprise" ──
  const handleEntrepriseChange = (index: number, value: string) => {
    if (value === CREATE_ENTREPRISE_VALUE) {
      setBuilderOpenForPlayer(index);
      // On ne change PAS l'entreprise sélectionnée : le <select> reste sur la valeur
      // courante (contrôlé via `value={currentEntreprise}`), l'utilisateur récupère
      // son choix si jamais il annule le builder.
      return;
    }
    updatePlayer(index, "entreprise", value);
  };

  // ─── Raccourci clavier Enter = Suivant ─────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Ne pas déclencher sur Enter à l'intérieur d'un <select> ou <textarea>
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
    if (e.key === "Enter" && canAdvance()) {
      e.preventDefault();
      handleNext();
    }
  };

  // ─── Conseil dynamique ────────────────────────────────────────
  const conseil = getConseil(nbJoueurs, nbTours);

  // ─── Rendu ─────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,#12324a_0%,#08111f_36%,#020617_100%)] px-6 py-10 text-white sm:px-8"
      onKeyDown={handleKeyDown}
    >
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-100 transition-colors hover:bg-white/10"
          >
            ← Retour à l&apos;accueil
          </Link>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            Préparation de la partie
          </div>
        </div>

        {/* Barre de progression */}
        <ProgressBar step={step} />

        {/* Bandeau conseil dynamique */}
        <div
          className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] px-5 py-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            💡 Conseil de démarrage
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Vous avez choisi <strong className="text-white">{conseil.highlight}</strong>
            {conseil.texte}
          </p>
        </div>

        {/* Contenu wizard animé */}
        <section
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/35 sm:p-8"
          aria-live="polite"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ x: direction * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -60, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {step === 1 && (
                <StepNbJoueurs
                  nbJoueurs={nbJoueurs}
                  onChange={setNbJoueurs}
                />
              )}
              {step === 2 && (
                <StepPseudos
                  players={activePlayers}
                  onChange={(index, pseudo) => updatePlayer(index, "pseudo", pseudo)}
                />
              )}
              {step === 3 && (
                <StepEntreprises
                  players={activePlayers}
                  allPlayers={players}
                  nbJoueurs={nbJoueurs}
                  allAvailableEnts={allAvailableEnts}
                  onEntrepriseChange={handleEntrepriseChange}
                />
              )}
              {step === 4 && (
                <StepDureeRecap
                  nbTours={nbTours}
                  onNbToursChange={setNbTours}
                  players={activePlayers}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Retour
          </button>

          <p className="text-xs text-slate-500 sm:text-center">
            Étape {step} / 4 — {STEP_LABELS[step]}
          </p>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {step === 4 ? "Démarrer la partie" : "Suivant →"}
          </button>
        </div>
      </div>

      {/* Wizard de création d'entreprise personnalisée (modale imbriquée) */}
      <EntrepriseBuilder
        isOpen={builderOpenForPlayer !== null}
        onClose={() => setBuilderOpenForPlayer(null)}
        onComplete={(template: EntrepriseTemplate) => {
          // Assurer l'unicité du nom
          let uniqueName = template.nom;
          let counter = 2;
          const existingNames = new Set([
            ...allEntreprises,
            ...customEntrepriseNames,
            ...adHocTemplates.map((t) => t.nom),
          ]);
          while (existingNames.has(uniqueName)) {
            uniqueName = `${template.nom} (${counter})`;
            counter++;
          }
          const finalTemplate = { ...template, nom: uniqueName };

          setAdHocTemplates((prev) => [...prev, finalTemplate]);

          // Assigner automatiquement au joueur qui a ouvert le wizard
          if (builderOpenForPlayer !== null) {
            const nextPlayers = [...players];
            nextPlayers[builderOpenForPlayer] = {
              ...nextPlayers[builderOpenForPlayer],
              entreprise: uniqueName,
            };
            setPlayers(nextPlayers);
          }
          setBuilderOpenForPlayer(null);
        }}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Sous-composants — Barre de progression
// ═════════════════════════════════════════════════════════════════════════════

function ProgressBar({ step }: { step: WizardStep }) {
  const steps: WizardStep[] = [1, 2, 3, 4];
  return (
    <div className="flex items-center gap-2 sm:gap-3" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
      {steps.map((s, i) => {
        const isActive = s === step;
        const isDone = s < step;
        return (
          <div key={s} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                isActive
                  ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/30"
                  : isDone
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-white/15 bg-white/[0.03] text-slate-500"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : s}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate ${
                  isActive ? "text-cyan-200" : isDone ? "text-emerald-300" : "text-slate-500"
                }`}
              >
                {STEP_LABELS[s]}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 transition-colors ${isDone ? "bg-emerald-400/50" : "bg-white/10"}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Étape 1 — Nombre de joueurs
// ═════════════════════════════════════════════════════════════════════════════

function StepNbJoueurs({
  nbJoueurs,
  onChange,
}: {
  nbJoueurs: number;
  onChange: (n: number) => void;
}) {
  const options: Array<{ count: number; label: string }> = [
    { count: 1, label: "Solo" },
    { count: 2, label: "Duo" },
    { count: 3, label: "Trio" },
    { count: 4, label: "Quatuor" },
  ];

  // Focus auto sur le bouton actif à l'entrée de l'étape
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeBtnRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
          <Users className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Étape 1
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Combien de joueurs ?</h2>
        <p className="text-sm leading-6 text-slate-400">
          Chaque joueur pilotera sa propre entreprise pendant toute la partie.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((opt) => {
          const isActive = nbJoueurs === opt.count;
          return (
            <button
              key={opt.count}
              ref={isActive ? activeBtnRef : undefined}
              type="button"
              onClick={() => onChange(opt.count)}
              className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border p-4 transition-all ${
                isActive
                  ? "border-cyan-300 bg-cyan-400/10 text-white shadow-lg shadow-cyan-950/30"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]"
              }`}
              aria-pressed={isActive}
            >
              <span className="text-3xl font-bold">{opt.count}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Étape 2 — Pseudos
// ═════════════════════════════════════════════════════════════════════════════

function StepPseudos({
  players,
  onChange,
}: {
  players: PlayerSetup[];
  onChange: (index: number, pseudo: string) => void;
}) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
          Étape 2
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {players.length === 1 ? "Quel est votre prénom ?" : "Prénom de chaque joueur"}
        </h2>
        <p className="text-sm leading-6 text-slate-400">
          {players.length === 1
            ? "Ce prénom (ou pseudo) identifiera votre entreprise durant la partie."
            : "Un prénom (ou pseudo) par joueur, pour les distinguer durant la partie."}
        </p>
      </header>

      <div className="space-y-3">
        {players.map((p, index) => (
          <div key={index} className="space-y-2">
            <label
              htmlFor={`pseudo-${index}`}
              className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Joueur {index + 1}
            </label>
            <input
              id={`pseudo-${index}`}
              ref={index === 0 ? firstInputRef : undefined}
              type="text"
              value={p.pseudo}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder="Prénom ou pseudo"
              maxLength={20}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-semibold text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Étape 3 — Entreprises
// ═════════════════════════════════════════════════════════════════════════════

function StepEntreprises({
  players,
  allPlayers,
  nbJoueurs,
  allAvailableEnts,
  onEntrepriseChange,
}: {
  players: PlayerSetup[];
  allPlayers: PlayerSetup[];
  nbJoueurs: number;
  allAvailableEnts: string[];
  onEntrepriseChange: (index: number, value: string) => void;
}) {
  const firstSelectRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    firstSelectRef.current?.focus();
  }, []);

  const usedEnts = allPlayers.slice(0, nbJoueurs).map((p) => p.entreprise);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
          <Building2 className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Étape 3
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {players.length === 1 ? "Choisissez votre entreprise" : "Une entreprise par joueur"}
        </h2>
        <p className="text-sm leading-6 text-slate-400">
          Chaque entreprise a sa spécialité. Vous pouvez aussi en créer une sur mesure.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {players.map((p, index) => {
          const currentEntreprise = p.entreprise;
          const entrepriseDefault = ENTREPRISES.find((item) => item.nom === currentEntreprise);
          const entreprise = entrepriseDefault; // affichage minimal (nom, icône, spécialité)

          return (
            <div
              key={index}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl">
                  {entreprise?.icon ?? "🏢"}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Joueur {index + 1} · {p.pseudo || "—"}
                  </p>
                  <p className="text-sm text-slate-300">
                    {entreprise?.specialite ?? "Entreprise personnalisée"}
                  </p>
                </div>
              </div>

              <select
                ref={index === 0 ? firstSelectRef : undefined}
                value={currentEntreprise}
                onChange={(e) => onEntrepriseChange(index, e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                aria-label={`Entreprise du joueur ${index + 1}`}
              >
                {allAvailableEnts.map((nom) => (
                  <option
                    key={nom}
                    value={nom}
                    disabled={usedEnts.includes(nom) && currentEntreprise !== nom}
                  >
                    {nom}
                    {usedEnts.includes(nom) && currentEntreprise !== nom ? " (déjà prise)" : ""}
                  </option>
                ))}
                {/* Séparateur visuel + option "Créer ma propre entreprise" en dernière position */}
                <option disabled>────────────</option>
                <option value={CREATE_ENTREPRISE_VALUE}>
                  ✏️ Créer ma propre entreprise…
                </option>
              </select>

              {entreprise && (() => {
                const pitch = getPitchMetier(entreprise.modeEconomique);
                return (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs leading-5 text-slate-500">
                      <strong className="text-slate-300">{entreprise.type}</strong> ·{" "}
                      {entreprise.specialite}
                    </p>
                    <div
                      className="rounded-xl border border-white/10 bg-slate-950/60 p-3 space-y-2.5"
                      style={{ borderLeftWidth: "3px", borderLeftColor: pitch.couleurAccent }}
                    >
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                          Modèle
                        </p>
                        <p className="text-xs text-white mt-0.5">{pitch.modele}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                          Ce que tu vends
                        </p>
                        <p className="text-xs text-slate-200 mt-0.5 leading-snug">{pitch.offre}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                          D&apos;où vient la valeur
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5 leading-snug">{pitch.sourceValeur}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">
                          ⚠️ Point de vigilance
                        </p>
                        <p className="text-xs text-amber-200/90 mt-0.5 leading-snug">{pitch.goulot}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80">
                          🔄 Cycle métier (étapes 2→3→4)
                        </p>
                        <p className="text-xs text-cyan-100/90 mt-0.5 leading-snug">{pitch.cycleType}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Étape 4 — Durée + récap
// ═════════════════════════════════════════════════════════════════════════════

function StepDureeRecap({
  nbTours,
  onNbToursChange,
  players,
}: {
  nbTours: number;
  onNbToursChange: (n: number) => void;
  players: PlayerSetup[];
}) {
  const firstBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    firstBtnRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
          <Clock3 className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Étape 4
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Durée de la partie</h2>
        <p className="text-sm leading-6 text-slate-400">
          Plus le nombre de trimestres est élevé, plus les effets économiques sont visibles.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DUREE_OPTIONS.map((option, i) => {
          const isActive = nbTours === option.tours;
          return (
            <button
              key={option.tours}
              ref={i === 0 ? firstBtnRef : undefined}
              type="button"
              onClick={() => onNbToursChange(option.tours)}
              className={`cursor-pointer rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                isActive
                  ? "border-cyan-300 bg-cyan-400/10 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              aria-pressed={isActive}
            >
              <div className="text-base font-bold">{option.tours} trimestres</div>
              <div className="mt-1 text-sm">{option.label}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                {option.note}
              </div>
            </button>
          );
        })}
      </div>

      {/* Récapitulatif */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Récapitulatif
        </p>
        <ul className="mt-3 space-y-1.5">
          {players.map((p, index) => {
            const ent = ENTREPRISES.find((e) => e.nom === p.entreprise);
            return (
              <li key={index} className="flex items-center gap-2 text-sm text-slate-200">
                <span className="text-lg" aria-hidden="true">
                  {ent?.icon ?? "🏢"}
                </span>
                <span className="font-semibold text-white">{p.pseudo || `Joueur ${index + 1}`}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">{p.entreprise}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
