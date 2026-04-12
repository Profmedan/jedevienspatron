"use client";

// ─────────────────────────────────────────────────────────────
// InvestissementPanel — Panneau unifié étape 6b (Tâche 11, Volet 1)
// ─────────────────────────────────────────────────────────────
// Fusionne :
//  • piochePersonnelle (mini-deck logistique de l'entreprise)
//  • cartesDisponibles (4 cartes globales piochées par tour)
// … en un seul panneau organisé par catégories pédagogiques.
//
// Remplace à la fois `MiniDeckPanel` (dans LeftPanel) et le bloc
// de sélection inline de `MainContent` à l'étape 6b.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { CarteDecision, Joueur } from "@jedevienspatron/game-engine";
import {
  Factory,
  Truck,
  Globe,
  Coins,
  Shield,
  Lock,
  AlertTriangle,
  Tag,
  Plus,
  Minus,
} from "lucide-react";

// ── Format monétaire français ───────────────────────────────
function fmt(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

// ── Impact trésorerie immédiat d'une carte ──────────────────
// On somme uniquement les effets IMMÉDIATS sur le poste `tresorerie`.
// Un delta négatif = sortie d'argent ; positif = apport (ex. Levée de fonds).
function impactTresorerieImmediat(carte: CarteDecision): number {
  return carte.effetsImmédiats
    .filter((e) => e.poste === "tresorerie")
    .reduce((sum, e) => sum + e.delta, 0);
}

// ── Trésorerie actuelle du joueur ───────────────────────────
function getTresorerie(joueur: Joueur): number {
  return (
    joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")?.valeur ?? 0
  );
}

// ─────────────────────────────────────────────────────────────
// Mapping des catégories moteur → groupes visuels pédagogiques
// ─────────────────────────────────────────────────────────────
type GroupeVisuel =
  | "logistique"
  | "vehicules"
  | "commerce"
  | "financement"
  | "protection";

interface GroupeMeta {
  id: GroupeVisuel;
  titre: string;
  description: string;
  icone: React.ComponentType<{ className?: string }>;
  // Classes tailwind pour l'accent de la section
  accent: string;
  border: string;
  bg: string;
}

const GROUPES: GroupeMeta[] = [
  {
    id: "logistique",
    titre: "Logistique & Innovation",
    description: "Capacité de production, R&D, outils numériques",
    icone: Factory,
    accent: "text-amber-300",
    border: "border-amber-400/30",
    bg: "bg-amber-500/5",
  },
  {
    id: "vehicules",
    titre: "Véhicules",
    description: "Flotte de livraison et véhicules commerciaux",
    icone: Truck,
    accent: "text-sky-300",
    border: "border-sky-400/30",
    bg: "bg-sky-500/5",
  },
  {
    id: "commerce",
    titre: "Commerce & Services",
    description: "Force de vente et partenariats externes",
    icone: Globe,
    accent: "text-emerald-300",
    border: "border-emerald-400/30",
    bg: "bg-emerald-500/5",
  },
  {
    id: "financement",
    titre: "Financement",
    description: "Levées de fonds, affacturage, crédits",
    icone: Coins,
    accent: "text-violet-300",
    border: "border-violet-400/30",
    bg: "bg-violet-500/5",
  },
  {
    id: "protection",
    titre: "Protection & Tactique",
    description: "Assurances et manœuvres conjoncturelles",
    icone: Shield,
    accent: "text-rose-300",
    border: "border-rose-400/30",
    bg: "bg-rose-500/5",
  },
];

// piochePersonnelle = mini-deck logistique de l'entreprise → toujours Logistique
function categorieVers(groupe: CarteDecision["categorie"]): GroupeVisuel {
  switch (groupe) {
    case "investissement":
      return "logistique";
    case "vehicule":
      return "vehicules";
    case "commercial":
    case "service":
      return "commerce";
    case "financement":
      return "financement";
    case "protection":
    case "tactique":
      return "protection";
  }
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────
interface InvestissementPanelProps {
  joueur: Joueur;
  cartesDisponibles: CarteDecision[];
  /** Appelé quand l'apprenant clique "Investir" sur une carte du mini-deck logistique */
  onInvestirPersonnel: (carteId: string) => void;
  /** Appelé quand l'apprenant clique "Investir" sur une carte globale — passe la carte complète */
  onInvestirGlobal: (carte: CarteDecision) => void;
  /** Tâche 11 Volet 3 — Appelé quand l'apprenant vend un bien immobilisé d'occasion */
  onVendreImmobilisation?: (nomImmo: string, prixCession: number) => void;
  /** Ferme l'étape et passe à la suivante */
  onTerminer: () => void;
  /** True si un activeStep est en cours (écriture comptable à valider) — grise les boutons */
  disabled?: boolean;
}

interface CarteEnrichie {
  carte: CarteDecision;
  source: "personnel" | "global";
  groupe: GroupeVisuel;
  impactTreso: number;
  prerequisOk: boolean;
}

export function InvestissementPanel({
  joueur,
  cartesDisponibles,
  onInvestirPersonnel,
  onInvestirGlobal,
  onVendreImmobilisation,
  onTerminer,
  disabled = false,
}: InvestissementPanelProps) {
  const tresorerie = getTresorerie(joueur);

  // Tâche 11 Volet 3 : liste des immobilisations cessibles
  // (toutes celles avec un nom propre, sauf "Autres Immobilisations" qui est agrégé)
  const immosCessibles = joueur.bilan.actifs.filter(
    (a) => a.categorie === "immobilisations" && a.nom !== "Autres Immobilisations"
  );

  // ── Construire la liste unifiée avec métadonnées ──────────
  const toutes: CarteEnrichie[] = [];

  // 1. Mini-deck logistique personnel (piochePersonnelle)
  for (const carte of joueur.piochePersonnelle) {
    const prerequisOk =
      !carte.prerequis ||
      joueur.cartesActives.some((c) => c.id === carte.prerequis);
    toutes.push({
      carte,
      source: "personnel",
      // Les cartes du mini-deck sont toujours en logistique (capacité entreprise)
      groupe: "logistique",
      impactTreso: impactTresorerieImmediat(carte),
      prerequisOk,
    });
  }

  // 2. Cartes globales piochées
  for (const carte of cartesDisponibles) {
    toutes.push({
      carte,
      source: "global",
      groupe: categorieVers(carte.categorie),
      impactTreso: impactTresorerieImmediat(carte),
      prerequisOk: true, // pas de prérequis sur les cartes globales
    });
  }

  // ── Grouper par groupe visuel ─────────────────────────────
  const parGroupe = new Map<GroupeVisuel, CarteEnrichie[]>();
  for (const item of toutes) {
    const bucket = parGroupe.get(item.groupe) ?? [];
    bucket.push(item);
    parGroupe.set(item.groupe, bucket);
  }

  const aucuneCarte = toutes.length === 0;

  return (
    <div className="space-y-4">
      {/* ── En-tête de l'étape ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
            6b — Investissement
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            Faites grandir votre entreprise
          </p>
          <p className="mt-0.5 text-xs text-cyan-100/80">
            Trésorerie disponible :{" "}
            <span className="font-semibold text-white">{fmt(tresorerie)}</span>{" "}
            — Vous pouvez enchaîner plusieurs investissements dans le même
            trimestre.
          </p>
        </div>
        <button
          type="button"
          onClick={onTerminer}
          disabled={disabled}
          className="shrink-0 cursor-pointer rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Terminer l'étape investissement et passer à la suivante"
        >
          Terminer →
        </button>
      </div>

      {/* ── Cas : aucune carte disponible ──────────────────── */}
      {aucuneCarte && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-center">
          <p className="text-sm text-slate-300">
            Aucune opportunité d&apos;investissement ce trimestre.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Cliquez sur &laquo; Terminer &raquo; pour passer à l&apos;étape
            suivante.
          </p>
        </div>
      )}

      {/* ── Section : Vente d'occasion (cession d'immobilisation) ── */}
      {onVendreImmobilisation && immosCessibles.length > 0 && (
        <section
          className="rounded-xl border border-orange-400/30 bg-orange-500/5 p-3"
          aria-labelledby="groupe-cession"
        >
          <header className="mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-orange-300" />
            <h3
              id="groupe-cession"
              className="text-xs font-semibold uppercase tracking-wider text-orange-300"
            >
              Vente d&apos;occasion
            </h3>
            <span className="text-[10px] text-slate-500">
              Céder un bien existant — encaissement immédiat + plus/moins-value au CR
            </span>
          </header>

          <div className="space-y-2">
            {immosCessibles.map((immo) => (
              <CarteCession
                key={immo.nom}
                nom={immo.nom}
                vnc={immo.valeur}
                disabled={disabled}
                onVendre={(prix) => onVendreImmobilisation(immo.nom, prix)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Sections par catégorie ─────────────────────────── */}
      {GROUPES.map((groupe) => {
        const cartes = parGroupe.get(groupe.id);
        if (!cartes || cartes.length === 0) return null;
        const Icone = groupe.icone;

        return (
          <section
            key={groupe.id}
            className={`rounded-xl border ${groupe.border} ${groupe.bg} p-3`}
            aria-labelledby={`groupe-${groupe.id}`}
          >
            {/* En-tête de catégorie */}
            <header className="mb-2 flex items-center gap-2">
              <Icone className={`h-4 w-4 ${groupe.accent}`} />
              <h3
                id={`groupe-${groupe.id}`}
                className={`text-xs font-semibold uppercase tracking-wider ${groupe.accent}`}
              >
                {groupe.titre}
              </h3>
              <span className="text-[10px] text-slate-500">
                {groupe.description}
              </span>
            </header>

            {/* Cartes de la catégorie */}
            <div className="space-y-2">
              {cartes.map((item) => (
                <CarteInvestissement
                  key={`${item.source}-${item.carte.id}`}
                  item={item}
                  tresorerie={tresorerie}
                  disabled={disabled}
                  onInvestirPersonnel={onInvestirPersonnel}
                  onInvestirGlobal={onInvestirGlobal}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composant : une carte d'investissement
// ─────────────────────────────────────────────────────────────
interface CarteInvestissementProps {
  item: CarteEnrichie;
  tresorerie: number;
  disabled: boolean;
  onInvestirPersonnel: (carteId: string) => void;
  onInvestirGlobal: (carte: CarteDecision) => void;
}

function CarteInvestissement({
  item,
  tresorerie,
  disabled,
  onInvestirPersonnel,
  onInvestirGlobal,
}: CarteInvestissementProps) {
  const { carte, source, impactTreso, prerequisOk } = item;

  // Description synthétique : première phrase seulement
  const descCourte =
    carte.description.split(/[.—]/)[0]?.trim() ?? carte.description;

  // Trésorerie insuffisante si l'impact immédiat est négatif ET > dispo
  const coutImmediat = impactTreso < 0 ? Math.abs(impactTreso) : 0;
  const tresorerieInsuffisante = coutImmediat > tresorerie;

  // Conditions d'activation
  const peutInvestir = !disabled && prerequisOk && !tresorerieInsuffisante;

  // Handler : on route selon la source
  function handleInvestir() {
    if (source === "personnel") {
      onInvestirPersonnel(carte.id);
    } else {
      onInvestirGlobal(carte);
    }
  }

  return (
    <div
      className={`rounded-lg border p-2.5 transition-colors ${
        peutInvestir
          ? "border-white/15 bg-white/[0.04] hover:bg-white/[0.07]"
          : "border-white/10 bg-white/[0.02] opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Ligne 1 : titre + badge source */}
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">
              {carte.titre}
            </p>
            {source === "personnel" && (
              <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                Mini-deck
              </span>
            )}
          </div>

          {/* Ligne 2 : description synthétique */}
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
            {descCourte}
          </p>

          {/* Ligne 3 : coût / apport trésorerie */}
          {impactTreso !== 0 && (
            <p
              className={`mt-1 text-[11px] font-medium ${
                impactTreso < 0 ? "text-rose-300" : "text-emerald-300"
              }`}
            >
              {impactTreso < 0
                ? `Coût immédiat : ${fmt(Math.abs(impactTreso))}`
                : `Apport immédiat : +${fmt(impactTreso)}`}
            </p>
          )}

          {/* Ligne 4 : messages de blocage */}
          {!prerequisOk && carte.prerequis && (
            <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
              <Lock className="h-3 w-3" />
              Nécessite d&apos;abord : {carte.prerequis}
            </p>
          )}
          {prerequisOk && tresorerieInsuffisante && (
            <p className="mt-1 flex items-center gap-1 text-[10px] text-rose-400">
              <AlertTriangle className="h-3 w-3" />
              Trésorerie insuffisante ({fmt(tresorerie)} disponible)
            </p>
          )}
        </div>

        {/* Bouton investir */}
        <button
          type="button"
          onClick={handleInvestir}
          disabled={!peutInvestir}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            peutInvestir
              ? "cursor-pointer bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              : "cursor-not-allowed bg-white/10 text-slate-500"
          }`}
          aria-label={`Investir dans ${carte.titre}`}
        >
          Investir
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composant : carte de cession d'une immobilisation (Volet 3)
// ─────────────────────────────────────────────────────────────
interface CarteCessionProps {
  nom: string;
  vnc: number;
  disabled: boolean;
  onVendre: (prixCession: number) => void;
}

/** Pas de modification du prix par incréments (€) */
const CESSION_STEP = 500;

function CarteCession({ nom, vnc, disabled, onVendre }: CarteCessionProps) {
  // Prix proposé par défaut : 80% de la VNC, arrondi au pas de 500 €.
  // Quand VNC = 0, défaut = 0 (l'apprenant peut monter avec le stepper).
  const prixDefaut = Math.max(0, Math.round((vnc * 0.8) / CESSION_STEP) * CESSION_STEP);

  const [prix, setPrix] = useState<number>(prixDefaut);

  const plusValue = prix - vnc;
  const peutVendre = !disabled && prix >= 0;

  function increment() {
    setPrix((p) => p + CESSION_STEP);
  }
  function decrement() {
    setPrix((p) => Math.max(0, p - CESSION_STEP));
  }
  function handleSubmit() {
    onVendre(prix);
  }

  return (
    <div className="rounded-lg border border-orange-400/20 bg-white/[0.03] p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{nom}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            VNC actuelle :{" "}
            <span className="font-medium text-slate-200">{fmt(vnc)}</span>
            <span className="ml-2 text-slate-500">
              (défaut proposé : 80% VNC = {fmt(prixDefaut)})
            </span>
          </p>

          {/* Stepper prix de cession */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              Prix de cession :
            </span>
            <div className="flex items-center rounded-md border border-white/15 bg-slate-900/60">
              <button
                type="button"
                onClick={decrement}
                disabled={disabled || prix === 0}
                className="px-2 py-1 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                aria-label="Diminuer le prix"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-2 py-1 text-xs font-semibold text-white tabular-nums">
                {fmt(prix)}
              </span>
              <button
                type="button"
                onClick={increment}
                disabled={disabled}
                className="px-2 py-1 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                aria-label="Augmenter le prix"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Plus / moins-value en temps réel */}
          {plusValue !== 0 && (
            <p
              className={`mt-1 text-[11px] font-medium ${
                plusValue > 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {plusValue > 0
                ? `Plus-value : +${fmt(plusValue)} en revenus exceptionnels`
                : `Moins-value : ${fmt(Math.abs(plusValue))} en charges exceptionnelles`}
            </p>
          )}
          {plusValue === 0 && vnc > 0 && (
            <p className="mt-1 text-[11px] text-slate-500">
              Cession à la VNC : aucune plus ni moins-value.
            </p>
          )}
        </div>

        {/* Bouton vendre */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!peutVendre}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            peutVendre
              ? "cursor-pointer bg-orange-400 text-slate-950 hover:bg-orange-300"
              : "cursor-not-allowed bg-white/10 text-slate-500"
          }`}
          aria-label={`Vendre ${nom} pour ${fmt(prix)}`}
        >
          Vendre
        </button>
      </div>
    </div>
  );
}
