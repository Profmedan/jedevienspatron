"use client";

import { useState, useEffect } from "react";
import {
  getTotalActif,
  getTotalPassif,
  calculerCoutCommerciaux,
  calculerCapaciteProductionBelvaux,
  CarteDecision,
  Joueur,
  ETAPES,
  COUT_APPROCHE_VELOCE_PAR_TOUR,
  COUT_STAFFING_SYNERGIA_PAR_TOUR,
} from "@jedevienspatron/game-engine";
import { type ActiveStep } from "./EntryPanel";
import { nomCompte } from "./utils";
// NOTE (Tâche 11 Volet 1) : MiniDeckPanel retiré de LeftPanel (sous-étape Investissement).
// Les cartes du mini-deck logistique sont désormais fusionnées dans
// `InvestissementPanel`, affiché dans le panneau central (MainContent).

// B9-A (2026-04-24) — cycle 8 étapes avec insertion REALISATION_METIER(3)
// et fusion CLOTURE_BILAN(7). Ordre aligné sur ETAPES.* du moteur.
const STEP_NAMES = [
  "Paiements clients à recevoir",    // 0 — ENCAISSEMENTS_CREANCES
  "Paiement commerciaux",            // 1 — COMMERCIAUX
  "Approvisionnement",         // 2 — ACHATS_STOCK
  "Réalisation métier",        // 3 — REALISATION_METIER (B9-A placeholder)
  "Facturation & ventes",      // 4 — FACTURATION_VENTES (ex-VENTES)
  "Décisions",                 // 5 — DECISION
  "Événement",                 // 6 — EVENEMENT
  "Clôture & bilan",           // 7 — CLOTURE_BILAN (fusion ex-CLOTURE_TRIMESTRE + BILAN)
];

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
  /** B6 (2026-04-20) — Numéro de l'exercice en cours (1 pour T1-T4, 2 pour T5-T8...). */
  numeroExerciceEnCours?: number;
  /** B6 (2026-04-20) — Dernier tour où une clôture d'exercice a eu lieu (0 tant qu'aucune). */
  dernierTourClotureExercice?: number;
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
  /** B9-C (2026-04-24) — Véloce mode logistique : préparation tournée 300 € fixe */
  onLaunchPreparationVeloce?: () => void;
  /** B9-C (2026-04-24) — Synergia mode conseil : staffing mission 400 € fixe */
  onLaunchStaffingSynergia?: () => void;
  selectedDecision: CarteDecision | null;
  setSelectedDecision?: (val: CarteDecision | null) => void;
  cartesDisponibles?: CarteDecision[];
  cartesRecrutement?: CarteDecision[];
  onSkipDecision: () => void;
  onLaunchDecision?: () => void;
  decisionError: string | null;
  onLaunchStep: () => void;
  journal: JournalEntry[];
  subEtape6?: "recrutement" | "investissement";
  modeRapide?: boolean;
  setModeRapide?: (val: boolean) => void;
  modalEtapeEnAttente?: number | null;
  onCloseModal?: () => void;
  /**
   * U3 — Callback invoqué quand l'utilisateur clique sur une étape franchie
   * dans le fil d'Ariane pour en relire l'explication pédagogique.
   * Reçoit l'index (0-7) de l'étape à rouvrir.
   */
  onReviewStep?: (etape: number) => void;
  onDemanderEmprunt?: () => void;
  /** @deprecated Volet 1 Tâche 11 : le mini-deck logistique est affiché dans InvestissementPanel (MainContent). Ce prop n'est plus utilisé par LeftPanel mais reste dans l'interface pour compatibilité du call site. */
  onInvestirPersonnel?: (carteId: string) => void;
  onLicencierCommercial?: (carteId: string) => void;
  /** Applique atomiquement toutes les écritures d'un groupe de vente */
  onApplySaleGroup?: (saleGroupId: string) => void;
}

// Refonte UX (audit Pierre 2026-04-24) — Architecture pédagogique en 2 niveaux :
//  • Niveau 1 : badges chiffrés (chiffre dominant, emoji discret, label court)
//    → calculés dynamiquement depuis l'état du joueur. L'apprenant scanne en 1 sec.
//  • Niveau 2 : phrase principe (≤15 mots, pas de description procédurale)
//    → conditionnelle selon le secteur d'activité pour les étapes 2/3/4.
// La modale "?" reste l'explication détaillée (MODALES_ETAPES inchangé).

interface StepBadge {
  /** Petit pictogramme discret (1-2 caractères). */
  emoji: string;
  /** Valeur chiffrée principale (dominante visuellement). */
  value: string;
  /** Label court 1-3 mots. */
  label: string;
  /** Variante de couleur (cyan = info, amber = alerte). */
  tone?: "cyan" | "amber";
}

/** Phrases principes par étape. Indexées sur ETAPES.* (0-7). */
const STEP_PHRASES: string[] = [
  "Les créances arrivées à échéance entrent en trésorerie.",                              // 0 — ENCAISSEMENTS_CREANCES
  "Tes commerciaux paient les salaires et créent la demande du trimestre.",               // 1 — COMMERCIAUX
  "Tu achètes avant de vendre — anticipe le nombre de clients à venir.",                  // 2 — ACHATS_STOCK (override par secteur en bas)
  "Étape métier — chaque entreprise crée la valeur à sa façon.",                          // 3 — REALISATION_METIER (override par secteur)
  "Une carte client = une vente. Stock −, CA +, encaissement ou créance.",                // 4 — FACTURATION_VENTES
  "Investir, recruter, emprunter — optionnel mais stratégique.",                          // 5 — DECISION
  "L'imprévu fait partie du métier — sois prêt à réagir.",                                // 6 — EVENEMENT
  "Charges fixes + amortissements + intérêts révèlent le résultat net.",                  // 7 — CLOTURE_BILAN
];

export function LeftPanel({
  etapeTour,
  tourActuel,
  nbToursMax,
  numeroExerciceEnCours = 1,
  dernierTourClotureExercice = 0,
  joueur,
  activeStep,
  onApplyEntry,
  onConfirmStep,
  onCancelStep,
  achatQte,
  setAchatQte,
  achatMode,
  setAchatMode,
  onLaunchAchat,
  onSkipAchat,
  onLaunchPreparationVeloce,
  onLaunchStaffingSynergia,
  selectedDecision,
  setSelectedDecision,
  cartesDisponibles = [],
  cartesRecrutement = [],
  onSkipDecision,
  onLaunchDecision,
  onLaunchStep,
  onDemanderEmprunt,
  // onInvestirPersonnel retiré du destructuring : plus utilisé dans ce composant (voir interface)
  onLicencierCommercial,
  onApplySaleGroup,
  onReviewStep,
  subEtape6,
}: LeftPanelProps) {
  const [pendingConfirm, setPendingConfirm] = useState(false);

  // LOT 5 (2026-04-25) — Achat dynamique : permet à l'apprenant de révéler
  // explicitement le panneau Quantité même quand le stock suffit déjà aux
  // clients attendus (constitution d'un stock de sécurité). Reset à false
  // à chaque entrée dans une nouvelle étape ou nouveau tour.
  const [acheterQuandMeme, setAcheterQuandMeme] = useState(false);
  useEffect(() => {
    setAcheterQuandMeme(false);
  }, [etapeTour, tourActuel]);

  const stepName = STEP_NAMES[etapeTour] || "Étape inconnue";

  // ─── Refonte UX 2026-04-24 — Calcul des indicateurs pour les badges ───────
  // Tous les chiffres dérivés de l'état du joueur, recalculés à chaque rendu.
  const commerciauxActifs = joueur.cartesActives.filter((c) => c.categorie === "commercial");
  const nbCommerciaux = commerciauxActifs.length;
  // `calculerCoutCommerciaux` somme les coûts trésorerie de tous les commerciaux
  // actifs en passant par le mapping des cartes commerciales (CarteDecision n'expose
  // pas `coutTresorerie` directement — c'est sur CarteCommercial dans le moteur).
  const totalSalairesCommerciaux = calculerCoutCommerciaux(joueur);
  const fluxPassifs = joueur.entreprise.clientsPassifsParTour ?? [];
  const nbPassifs = fluxPassifs.reduce((s, f) => s + f.nbParTour, 0);
  const totalClientsAttendus =
    commerciauxActifs.reduce((s, c) => s + (c.nbClientsParTour ?? 0), 0) + nbPassifs;
  const secteur = joueur.entreprise.secteurActivite;
  const treso = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")?.valeur ?? 0;
  const stockMP = joueur.bilan.actifs.find((a) => a.nom === "Stocks matières premières")?.valeur ?? 0;
  const stockMdse = joueur.bilan.actifs.find((a) => a.nom === "Stocks marchandises")?.valeur ?? 0;
  const stockPF = joueur.bilan.actifs.find((a) => a.nom === "Stocks produits finis")?.valeur ?? 0;
  const creancesPlus1 = joueur.bilan.creancesPlus1 ?? 0;
  const creancesPlus2 = joueur.bilan.creancesPlus2 ?? 0;

  // LOT 5 (2026-04-25) — Calcul dynamique du besoin d'achat conseillé.
  // Production : MP nécessaires = clients attendus (1 MP = 1 PF = 1 client)
  // Négoce : marchandises nécessaires = clients attendus (1 unité = 1 client)
  // Logistique/conseil : pas de stock physique à acheter.
  const stockUnitesActuel = secteur === "production"
    ? Math.floor(stockMP / 1000)
    : secteur === "negoce"
      ? Math.floor(stockMdse / 1000)
      : 0;
  const besoinAchat = (secteur === "production" || secteur === "negoce")
    ? Math.max(0, totalClientsAttendus - stockUnitesActuel)
    : 0;
  // Reset achatQte au besoin recommandé à chaque arrivée sur l'étape
  // ACHATS_STOCK (changement de tour OU bascule depuis une autre étape).
  // Évite le piège ergonomique : avant LOT 5, le champ était pré-rempli à 2
  // même quand le stock suffisait → l'apprenant achetait par défaut sans
  // raison, brûlait 2 000 € de tréso à perte.
  useEffect(() => {
    if (etapeTour === ETAPES.ACHATS_STOCK && (secteur === "production" || secteur === "negoce")) {
      setAchatQte(besoinAchat);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapeTour, tourActuel]);

  // ─── Badges par étape (max 3, chiffre dominant) ────────────────────────────
  function getStepBadges(etape: number): StepBadge[] {
    switch (etape) {
      case ETAPES.ENCAISSEMENTS_CREANCES: {
        const total = creancesPlus1 + creancesPlus2;
        return [
          { emoji: "💰", value: `${creancesPlus1.toLocaleString("fr-FR")} €`, label: "à encaisser (C+1)", tone: "cyan" },
          { emoji: "⏳", value: `${creancesPlus2.toLocaleString("fr-FR")} €`, label: "en attente (C+2)", tone: "cyan" },
          { emoji: "📅", value: total === 0 ? "—" : `${total.toLocaleString("fr-FR")} €`, label: "total créances", tone: total === 0 ? "amber" : "cyan" },
        ];
      }
      case ETAPES.COMMERCIAUX:
        return [
          { emoji: "👔", value: String(nbCommerciaux), label: "commerciaux", tone: "cyan" },
          { emoji: "🤝", value: String(totalClientsAttendus), label: "clients attendus", tone: totalClientsAttendus === 0 ? "amber" : "cyan" },
          { emoji: "💸", value: `${totalSalairesCommerciaux.toLocaleString("fr-FR")} €`, label: "salaires", tone: "cyan" },
        ];
      case ETAPES.ACHATS_STOCK: {
        if (secteur === "production") {
          return [
            { emoji: "🤝", value: String(totalClientsAttendus), label: "clients attendus", tone: "cyan" },
            { emoji: "📦", value: `${(stockMP / 1000).toFixed(0)}`, label: "matières en stock", tone: stockMP < totalClientsAttendus * 1000 ? "amber" : "cyan" },
            { emoji: "🎯", value: String(Math.max(0, totalClientsAttendus - Math.floor(stockMP / 1000))), label: "à acheter (mini)", tone: "amber" },
          ];
        }
        if (secteur === "negoce") {
          return [
            { emoji: "🤝", value: String(totalClientsAttendus), label: "clients attendus", tone: "cyan" },
            { emoji: "📦", value: `${(stockMdse / 1000).toFixed(0)}`, label: "marchandises", tone: stockMdse < totalClientsAttendus * 1000 ? "amber" : "cyan" },
            { emoji: "🎯", value: String(Math.max(0, totalClientsAttendus - Math.floor(stockMdse / 1000))), label: "à acheter (mini)", tone: "amber" },
          ];
        }
        // logistique / conseil / service legacy : pas de stock physique
        return [
          { emoji: "🤝", value: String(totalClientsAttendus), label: "clients attendus", tone: "cyan" },
          { emoji: "🚚", value: secteur === "logistique" ? "300 €" : "400 €", label: "coût d'approche fixe", tone: "cyan" },
        ];
      }
      case ETAPES.REALISATION_METIER:
        if (secteur === "production") {
          // LOT 2.3 (2026-04-25) — capacité production dynamique : base 2 + 2/robot.
          const capProd = calculerCapaciteProductionBelvaux(joueur);
          return [
            { emoji: "📦", value: `${Math.min(capProd, Math.floor(stockMP / 1000))}`, label: "matières → PF", tone: "cyan" },
            { emoji: "🎯", value: String(capProd), label: "capacité / trim", tone: "cyan" },
          ];
        }
        if (secteur === "negoce") {
          return [{ emoji: "💳", value: "300 €", label: "coût canal", tone: "cyan" }];
        }
        return [{ emoji: "🚚", value: secteur === "logistique" ? "300 €" : "400 €", label: "en-cours constaté", tone: "cyan" }];
      case ETAPES.FACTURATION_VENTES: {
        const clientsATraiter = joueur.clientsATrait?.length ?? 0;
        const stockDispo = secteur === "production" ? stockPF : secteur === "negoce" ? stockMdse : Infinity;
        const pertesPossibles = secteur === "production" || secteur === "negoce"
          ? Math.max(0, clientsATraiter - Math.floor(stockDispo / 1000))
          : 0;
        return [
          { emoji: "🤝", value: String(clientsATraiter), label: "clients à facturer", tone: "cyan" },
          ...(secteur === "production" || secteur === "negoce"
            ? [{ emoji: "📦", value: `${(stockDispo / 1000).toFixed(0)}`, label: secteur === "production" ? "PF dispo" : "marchandises dispo", tone: pertesPossibles > 0 ? ("amber" as const) : ("cyan" as const) }]
            : []),
          ...(pertesPossibles > 0
            ? [{ emoji: "⚠️", value: String(pertesPossibles), label: "client(s) perdu(s)", tone: "amber" as const }]
            : []),
        ];
      }
      case ETAPES.DECISION:
        return [
          { emoji: "🃏", value: String(cartesDisponibles.length + cartesRecrutement.length), label: "cartes dispo", tone: "cyan" },
          { emoji: "💰", value: `${treso.toLocaleString("fr-FR")} €`, label: "trésorerie", tone: treso < 0 ? "amber" : "cyan" },
        ];
      case ETAPES.EVENEMENT:
        return [{ emoji: "🎲", value: "1", label: "carte aléatoire", tone: "cyan" }];
      case ETAPES.CLOTURE_BILAN: {
        const intsActifs = tourActuel >= 3;
        return [
          { emoji: "💸", value: "2 000 €", label: "charges fixes", tone: "cyan" },
          { emoji: "📉", value: "amortis.", label: "dotations", tone: "cyan" },
          { emoji: "💰", value: intsActifs ? "intérêts" : "—", label: intsActifs ? "à partir T3" : "pas avant T3", tone: "cyan" },
        ];
      }
      default:
        return [];
    }
  }

  // ─── Phrase principe (override par secteur pour étapes 2 / 3 / 4) ──────────
  function getStepPhrase(etape: number): string {
    if (etape === ETAPES.ACHATS_STOCK) {
      if (secteur === "production") return "1 matière achetée = 1 produit fini = 1 client servi.";
      if (secteur === "negoce") return "1 marchandise achetée = 1 client servi.";
      return "Coût d'approche fixe + frais variables à la facturation.";
    }
    if (etape === ETAPES.REALISATION_METIER) {
      if (secteur === "production") return "Tu transformes la matière en produits finis.";
      if (secteur === "negoce") return "Tu paies tes coûts marketplace e-commerce.";
      if (secteur === "logistique") return "Tu prépares ta tournée. En-cours constaté.";
      if (secteur === "conseil" || secteur === "service") return "Tu lances ta mission. En-cours constaté.";
    }
    if (etape === ETAPES.COMMERCIAUX && nbCommerciaux === 0 && nbPassifs === 0) {
      return "Aucun commercial actif. Recrute à l'étape Décisions.";
    }
    return STEP_PHRASES[etape] || "";
  }

  const stepBadges = getStepBadges(etapeTour);
  const stepPhrase = getStepPhrase(etapeTour);
  const hasCommerciaux = nbCommerciaux > 0;
  const totalActif = getTotalActif(joueur);
  const totalPassif = getTotalPassif(joueur);
  const balanced = Math.abs(totalActif - totalPassif) < 0.01;

  if (activeStep) {
    const firstPending = activeStep.entries.find((e) => !e.applied);
    const allApplied   = !firstPending;

    // ── Données pour la modale de confirmation ────────────────────────────────
    const isDecisionStep    = etapeTour === ETAPES.DECISION;
    const isFirstEntry      = isDecisionStep && activeStep.entries.every((e) => !e.applied);
    const tresorerieActuelle = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")?.valeur ?? 0;
    const deltasTresorerie  = activeStep.entries
      .filter((e) => e.poste.toLowerCase().includes("tresorerie"))
      .reduce((sum, e) => sum + e.delta, 0);
    const tresorerieFuture  = tresorerieActuelle + deltasTresorerie;

    return (
      <div className="space-y-4">

        {/* ── MODALE DE CONFIRMATION (carte Décision) ── */}
        {pendingConfirm && firstPending && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full p-5 space-y-4">

              {/* En-tête */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300">
                  Confirmer la décision
                </p>
                <h3 className="mt-1 text-lg font-bold text-white leading-snug">
                  {activeStep.titre}
                </h3>
              </div>

              {/* Résumé de la transaction */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                  Écritures comptables
                </p>
                {activeStep.entries.map((e) => (
                  <div key={e.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">{nomCompte(e.poste)}</span>
                    <span className={`font-bold tabular-nums ${e.delta >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {e.delta > 0 ? "+" : ""}{e.delta.toLocaleString("fr-FR")} €
                    </span>
                  </div>
                ))}
              </div>

              {/* Trésorerie avant / après */}
              <div className={`rounded-xl border px-3 py-3 space-y-1.5 ${
                tresorerieFuture < 0 ? "border-red-400/40 bg-red-900/20" : "border-white/10 bg-white/[0.03]"
              }`}>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Trésorerie actuelle</span>
                  <span className="font-semibold text-white tabular-nums">
                    {tresorerieActuelle.toLocaleString("fr-FR")} €
                  </span>
                </div>
                {deltasTresorerie !== 0 && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Impact de la décision</span>
                      <span className={`font-semibold tabular-nums ${deltasTresorerie < 0 ? "text-red-300" : "text-emerald-300"}`}>
                        {deltasTresorerie > 0 ? "+" : ""}{deltasTresorerie.toLocaleString("fr-FR")} €
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-1.5 border-t border-white/10">
                      <span className="font-medium text-slate-300">Trésorerie après</span>
                      <span className={`font-bold tabular-nums ${tresorerieFuture < 0 ? "text-red-400" : "text-emerald-300"}`}>
                        {tresorerieFuture.toLocaleString("fr-FR")} €
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Avertissement découvert */}
              {tresorerieFuture < 0 && (
                <div className="rounded-lg border border-red-400/30 bg-red-900/20 px-3 py-2 text-xs text-red-300 leading-relaxed">
                  ⚠️ Cette décision mettrait votre trésorerie en négatif ({tresorerieFuture.toLocaleString("fr-FR")} €). Vérifiez votre capacité de financement.
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // B7-B (2026-04-21) — Annuler doit libérer l'état de la
                    // décision en entier, pas juste la modale locale :
                    //  1) cacher la modale de confirmation,
                    //  2) dé-sélectionner la carte décision (useDecisionCards),
                    //  3) vider la file d'EntryCard (activeStep → null).
                    // Sans (2) et (3), l'utilisateur se retrouvait coincé sur
                    // l'écran « Écriture 1/x — Vérifier et confirmer » sans
                    // moyen de revenir au choix de carte.
                    setPendingConfirm(false);
                    setSelectedDecision?.(null);
                    onCancelStep();
                  }}
                  className="flex-1 cursor-pointer py-3 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-white/5 transition-colors font-medium"
                >
                  ← Annuler
                </button>
                <button
                  onClick={() => {
                    setPendingConfirm(false);
                    onApplyEntry(firstPending.id);
                  }}
                  className="flex-1 cursor-pointer bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  Confirmer ✓
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
          <div className="space-y-4">
            {(() => {
              // ── MODE VENTES GROUPÉES (étape FACTURATION_VENTES avec saleGroupId) ──
              const hasSaleGroups = etapeTour === ETAPES.FACTURATION_VENTES && activeStep.entries.some(e => e.saleGroupId);
              if (hasSaleGroups && onApplySaleGroup) {
                // Constantes d’affichage pédagogique
                const DISPLAY_POS: Record<number, number> = { 2: 1, 1: 2, 3: 3, 4: 4 };
                const DOC_LABEL: Record<number, { doc: string; cat: string }> = {
                  2: { doc: "Compte de Résultat", cat: "Produits" },
                  1: { doc: "Bilan",              cat: "Actif" },
                  3: { doc: "Bilan",              cat: "Actif" },
                  4: { doc: "Compte de Résultat", cat: "Charges" },
                };

                // Regrouper par saleGroupId (ordre stable)
                const groupIds = [...new Set(activeStep.entries.filter(e => e.saleGroupId).map(e => e.saleGroupId!))];
                const groupsApplied = groupIds.filter(gid => activeStep.entries.filter(e => e.saleGroupId === gid).every(e => e.applied));
                const currentGroupId = groupIds.find(gid => !activeStep.entries.filter(e => e.saleGroupId === gid).every(e => e.applied));
                const allGroupsApplied = groupsApplied.length === groupIds.length;

                // Numérotation des doublons : si plusieurs clients du même label,
                // chacun reçoit un suffixe "(1/2)", "(2/2)" etc.
                const labelCount: Record<string, number> = {};
                const labelIndex: Record<string, number> = {};
                groupIds.forEach(gid => {
                  const label = activeStep.entries.find(e => e.saleGroupId === gid)?.saleClientLabel ?? "Client";
                  labelCount[label] = (labelCount[label] ?? 0) + 1;
                });
                const clientDisplayLabel = (gid: string): string => {
                  const raw = activeStep.entries.find(e => e.saleGroupId === gid)?.saleClientLabel ?? "Client";
                  if ((labelCount[raw] ?? 1) <= 1) return raw;
                  labelIndex[raw] = (labelIndex[raw] ?? 0) + 1;
                  return `${raw} (${labelIndex[raw]}/${labelCount[raw]})`;
                };
                // Pré-calculer les labels dans l’ordre des groupIds
                const groupLabels: Record<string, string> = {};
                groupIds.forEach(gid => { groupLabels[gid] = clientDisplayLabel(gid); });

                return (
                  <>
                    {/* En-tête : titre de l’étape */}
                    <div className="rounded-xl bg-gradient-to-r from-cyan-900/40 to-slate-800/40 border border-cyan-400/20 px-3 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                        {allGroupsApplied
                          ? `${groupIds.length} / ${groupIds.length} ventes enregistrées`
                          : `Vente ${groupsApplied.length + 1} / ${groupIds.length}`}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-white leading-snug">{activeStep.titre}</h3>
                    </div>

                    {/* Progression */}
                    <div className="flex gap-1.5">
                      {groupIds.map((gid) => (
                        <div
                          key={gid}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            groupsApplied.includes(gid) ? "bg-emerald-400" : gid === currentGroupId ? "bg-cyan-400" : "bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Liste de toutes les ventes avec statut */}
                    <div className="space-y-2">
                      {groupIds.map((gid, idx) => {
                        const isApplied = groupsApplied.includes(gid);
                        const isCurrent = gid === currentGroupId;
                        const groupEntries = activeStep.entries.filter(e => e.saleGroupId === gid);
                        const ventesEntry = groupEntries.find(e => e.poste === "ventes");
                        const montant = ventesEntry?.delta ?? 0;
                        const label = groupLabels[gid];

                        // ── Vente déjà traitée ─────────────────────────
                        if (isApplied) {
                          return (
                            <div key={gid} className="flex items-center gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] px-3 py-2">
                              <span className="text-base shrink-0">✅</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-emerald-200">
                                  Vente {idx + 1} — {label}
                                </p>
                                <p className="text-[10px] text-emerald-300/70">
                                  +{montant.toLocaleString("fr-FR")} € de CA · traitée
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // ── Vente en attente (pas encore la courante) ──
                        if (!isCurrent) {
                          return (
                            <div key={gid} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 opacity-60">
                              <span className="text-base shrink-0">○</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-400">
                                  Vente {idx + 1} — {label}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  +{montant.toLocaleString("fr-FR")} € de CA · à venir
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // ── Vente en cours (expandée) ──────────────────
                        return (
                          <div key={gid} className="space-y-3 rounded-xl border border-cyan-400/20 bg-white/[0.04] p-3">
                            {/* Client + montant */}
                            <div className="flex items-center gap-2">
                              <span className="text-xl shrink-0">🤝</span>
                              <div>
                                <p className="text-xs font-bold text-cyan-200">{label}</p>
                                <p className="text-base font-black text-white">+{montant.toLocaleString("fr-FR")} € de CA</p>
                              </div>
                            </div>

                            {/* 4 écritures — ordre pédagogique */}
                            <div className="space-y-1.5">
                              {[...groupEntries]
                                .sort((a, b) => (DISPLAY_POS[a.saleActIndex ?? 0] ?? 99) - (DISPLAY_POS[b.saleActIndex ?? 0] ?? 99))
                                .map(entry => {
                                  const docMeta = DOC_LABEL[entry.saleActIndex ?? 0];
                                  return (
                                    <div key={entry.id} className={`rounded-lg px-2.5 py-1.5 text-xs ${
                                      entry.sens === "debit" ? "bg-sky-500/[0.08]" : "bg-amber-500/[0.08]"
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-slate-200">{nomCompte(entry.poste)}</span>
                                        <span className={`font-semibold tabular-nums ${entry.sens === "debit" ? "text-sky-200" : "text-amber-200"}`}>
                                          {entry.delta > 0 ? "+" : ""}{entry.delta.toLocaleString("fr-FR")} €
                                        </span>
                                      </div>
                                      {docMeta && (
                                        <p className={`mt-0.5 text-[10px] ${
                                          docMeta.doc === "Compte de Résultat" ? "text-violet-400" : "text-cyan-400"
                                        }`}>
                                          {docMeta.doc} · {docMeta.cat}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>

                            <div className="rounded-lg bg-sky-500/10 border border-sky-400/20 px-3 py-2.5">
                              <p className="text-xs leading-relaxed text-sky-100">
                                💡 Les 4 écritures de cette vente seront enregistrées ensemble — le bilan reste toujours équilibré.
                              </p>
                            </div>

                            <button
                              onClick={() => onApplySaleGroup(gid)}
                              className="w-full cursor-pointer rounded-xl bg-cyan-400 px-3 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
                            >
                              Enregistrer cette vente ✓
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Toutes les ventes enregistrées */}
                    {allGroupsApplied && (
                      <>
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 p-3">
                          <p className="text-sm font-medium text-emerald-100">✅ Toutes les ventes enregistrées.</p>
                        </div>
                        <button
                          onClick={onConfirmStep}
                          aria-label="Confirmer l’étape et passer à la suivante"
                          className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                        >
                          Confirmer l&apos;étape ✓
                        </button>
                      </>
                    )}
                  </>
                );
              }

              // ── MODE CLASSIQUE (toutes les autres étapes) ──
              return (
                <>
                  <div className="rounded-xl bg-gradient-to-r from-cyan-900/40 to-slate-800/40 border border-cyan-400/20 px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                      Écriture {Math.min(activeStep.entries.filter((e) => e.applied).length + 1, activeStep.entries.length)} / {activeStep.entries.length}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-white leading-snug">{activeStep.titre}</h3>
                  </div>

                  {firstPending ? (
                    <div className="space-y-3 rounded-xl border border-cyan-400/15 bg-white/[0.04] p-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-cyan-200 mb-1">
                          {nomCompte(firstPending.poste)}
                        </p>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-slate-200">{firstPending.sens === "debit" ? "DÉBIT" : "CRÉDIT"}</span>
                          <span className="text-2xl font-black text-white">{firstPending.delta > 0 ? "+" : ""}{firstPending.delta.toLocaleString("fr-FR")} €</span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-200">{firstPending.description}</p>
                      <div className="rounded-lg bg-sky-500/10 border border-sky-400/20 px-3 py-2.5">
                        <p className="text-xs leading-relaxed text-sky-100">💡 {activeStep.principe}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (isFirstEntry) {
                            setPendingConfirm(true);
                          } else {
                            onApplyEntry(firstPending.id);
                          }
                        }}
                        aria-label={`Appliquer l’écriture comptable : ${firstPending.id}`}
                        className="w-full cursor-pointer rounded-xl bg-cyan-400 px-3 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
                      >
                        {isFirstEntry ? "Vérifier et confirmer →" : "Appliquer cette écriture"}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 p-3">
                      <p className="text-sm font-medium text-emerald-100">✅ Toutes les écritures saisies.</p>
                    </div>
                  )}

                  {allApplied && (
                    <button
                      onClick={onConfirmStep}
                      aria-label="Confirmer l’étape et passer à la suivante"
                      className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                    >
                      Confirmer l&apos;étape ✓
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-3">Parcours</p>
          <div className="space-y-1.5">
            {STEP_NAMES.map((name, idx) => {
              // U2 — Fil d'Ariane : hiérarchie visuelle forte.
              // • En cours : cyan saillant (ring + bg + bordure + semibold).
              // • Franchie : émeraude saillante (bg + bordure + medium) → distinguable au premier coup d'œil.
              // • À venir : slate discret (bordure transparente pour que la hauteur reste uniforme).
              // U3 — Les étapes franchies deviennent des boutons : un clic rouvre la modale
              //      pédagogique correspondante pour relire l'explication.
              const status: "current" | "done" | "upcoming" =
                idx === etapeTour ? "current" : idx < etapeTour ? "done" : "upcoming";
              const rowClass =
                status === "current"
                  ? "border border-cyan-400/40 bg-cyan-500/15 text-cyan-100 font-semibold ring-1 ring-cyan-400/30"
                  : status === "done"
                  ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 font-medium"
                  : "border border-transparent text-slate-500";
              const icon = status === "current" ? "→" : status === "done" ? "✅" : "○";
              const baseClass = `flex items-center gap-2 rounded-lg px-2 py-1 text-xs tabular-nums transition-colors ${rowClass}`;

              if (status === "done" && onReviewStep) {
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => onReviewStep(idx)}
                    aria-label={`Revoir l'explication de l'étape ${idx + 1} : ${name}`}
                    title="Cliquer pour relire l'explication pédagogique"
                    className={`${baseClass} w-full text-left cursor-pointer hover:bg-emerald-500/20 hover:border-emerald-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400`}
                  >
                    <span className="w-4 text-center">{icon}</span>
                    <span>{idx + 1}. {name}</span>
                    <span className="ml-auto text-[10px] text-emerald-300/70">↻</span>
                  </button>
                );
              }

              return (
                <div
                  key={idx}
                  aria-current={status === "current" ? "step" : undefined}
                  className={baseClass}
                >
                  <span className="w-4 text-center">{icon}</span>
                  <span>{idx + 1}. {name}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 pt-2 border-t border-white/10">
            {totalActif.toFixed(0)} = {totalPassif.toFixed(0)} {balanced && "✓"}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-3">
          <button
            onClick={onDemanderEmprunt}
            className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/75 hover:border-white/20"
          >
            Demander un emprunt
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerte capacité logistique insuffisante */}
      {joueur.clientsPerdusCeTour > 0 && (
        <div className="rounded-lg border border-red-500/40 bg-red-900/30 px-3 py-2 text-sm text-red-200">
          ⚠️ Capacité insuffisante — {joueur.clientsPerdusCeTour} client(s) perdu(s) ce trimestre
        </div>
      )}

      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              T{tourActuel}/{nbToursMax} · Étape {etapeTour + 1}/8
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/80">
              Exercice N°{numeroExerciceEnCours} · T{dernierTourClotureExercice + 1}
              {tourActuel > dernierTourClotureExercice + 1 ? `–T${tourActuel}` : ""}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
              CA total partie : {joueur.compteResultatCumulePartie.produits.ventes.toLocaleString("fr-FR")} €
            </p>
            <h2 className="mt-1 text-base font-semibold text-white">{stepName}</h2>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            {/* Refonte UX 2026-04-24 — Badges chiffrés (chiffre dominant)
                + phrase principe ≤15 mots. La modale "?" reste l'explication
                détaillée pour qui veut creuser (MODALES_ETAPES). */}
            {stepBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {stepBadges.map((b, i) => {
                  const colorClass = b.tone === "amber"
                    ? "border-amber-400/40 bg-amber-500/10"
                    : "border-cyan-400/30 bg-cyan-500/10";
                  const valueColor = b.tone === "amber" ? "text-amber-200" : "text-cyan-200";
                  return (
                    <div
                      key={i}
                      className={`flex items-baseline gap-1.5 rounded-md border px-2 py-1 ${colorClass}`}
                    >
                      <span className="text-[10px] opacity-60" aria-hidden="true">{b.emoji}</span>
                      <span className={`text-base font-bold tabular-nums leading-tight ${valueColor}`}>
                        {b.value}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {stepPhrase && (
              <p className="text-xs leading-relaxed text-slate-300">
                <span className="text-amber-300/80 mr-1" aria-hidden="true">💡</span>
                {stepPhrase}
              </p>
            )}

            {etapeTour === ETAPES.ACHATS_STOCK && (
              // B9-C (2026-04-24) — Étape 2 polymorphe par mode :
              //   logistique (Véloce) → bouton "Préparer la tournée (−300 €)"
              //   conseil (Synergia) → bouton "Staffer la mission (−400 €)"
              //   service (legacy) → bouton Passer (rétro-compat saves v3)
              //   negoce / production → input quantité (B8 conservé)
              joueur.entreprise.secteurActivite === "logistique" ? (
                <div className="space-y-2">
                  <div className="rounded-lg bg-sky-500/10 border border-sky-400/20 px-3 py-2.5">
                    <p className="text-xs leading-relaxed text-sky-100">
                      💡 Véloce prépare sa tournée : un coût d'approche fixe (carburant, préparation véhicule, cotisations chauffeur) est engagé ce trimestre. La tournée sera exécutée à l'étape 4 (Facturation & ventes).
                    </p>
                  </div>
                  <button
                    onClick={onLaunchPreparationVeloce}
                    autoFocus
                    className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition-colors"
                  >
                    Préparer la tournée (−{COUT_APPROCHE_VELOCE_PAR_TOUR.toLocaleString("fr-FR")} €) →
                  </button>
                </div>
              ) : joueur.entreprise.secteurActivite === "conseil" ? (
                <div className="space-y-2">
                  <div className="rounded-lg bg-sky-500/10 border border-sky-400/20 px-3 py-2.5">
                    <p className="text-xs leading-relaxed text-sky-100">
                      💡 Synergia cadre et staffe sa mission : un coût fixe (sous-traitance consultants, licences outil, kickoff) est engagé ce trimestre. La mission sera réalisée à l'étape 4 (Facturation & ventes).
                    </p>
                  </div>
                  <button
                    onClick={onLaunchStaffingSynergia}
                    autoFocus
                    className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition-colors"
                  >
                    Staffer la mission (−{COUT_STAFFING_SYNERGIA_PAR_TOUR.toLocaleString("fr-FR")} €) →
                  </button>
                </div>
              ) : joueur.entreprise.secteurActivite === "service" ? (
                // Legacy "service" (saves v3 / templates custom) — pas d'écriture dédiée, on passe
                <div className="space-y-2">
                  <div className="rounded-lg bg-sky-500/10 border border-sky-400/20 px-3 py-2.5">
                    <p className="text-xs leading-relaxed text-sky-100">
                      💡 Votre entreprise ne constitue pas de stocks de marchandises à cette étape. L'activité métier aura lieu à l'étape 3 (Réalisation métier).
                    </p>
                  </div>
                  <button
                    onClick={onSkipAchat}
                    autoFocus
                    className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition-colors"
                  >
                    Passer cette étape →
                  </button>
                </div>
              ) : besoinAchat === 0 && !acheterQuandMeme ? (
                // LOT 5 (2026-04-25) — Cas "Stock suffisant" : on ne pousse pas
                // l'apprenant à acheter par défaut. Il peut quand même
                // constituer un stock de sécurité s'il le souhaite via le
                // bouton secondaire.
                <div className="space-y-2">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/30 px-3 py-3 text-center">
                    <p className="text-sm font-bold text-emerald-100">
                      ✓ Stock suffisant
                    </p>
                    <p className="mt-1 text-xs text-emerald-200/80">
                      {stockUnitesActuel} {secteur === "production" ? "matière(s)" : "marchandise(s)"} en stock pour {totalClientsAttendus} client(s) attendu(s).
                    </p>
                  </div>
                  <button
                    onClick={onSkipAchat}
                    autoFocus
                    aria-label="Passer l'étape d'achat — stock déjà suffisant"
                    className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition-colors"
                  >
                    Passer cette étape →
                  </button>
                  <button
                    onClick={() => setAcheterQuandMeme(true)}
                    aria-label="Constituer un stock de sécurité supplémentaire"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Acheter quand même (stock de sécurité)
                  </button>
                </div>
              ) : (
              <div className="space-y-2">
                <div>
                  <label htmlFor="qty" className="block text-xs font-semibold text-white mb-1">
                    Quantité <span className="text-slate-400 font-normal">(1 unité = 1 000 €)</span>
                  </label>
                  {/* LOT 5 (2026-04-25) — Calcul du besoin affiché en clair pour
                      la pédagogie : l'apprenant comprend POURQUOI cette quantité
                      est conseillée. */}
                  {besoinAchat > 0 && (
                    <p className="mb-2 text-[11px] text-cyan-200/80">
                      💡 {totalClientsAttendus} client(s) − {stockUnitesActuel} en stock = <span className="font-bold text-cyan-200">{besoinAchat}</span> à acheter (mini)
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Retirer une unité"
                      onClick={() => setAchatQte(Math.max(0, achatQte - 1))}
                      disabled={achatQte <= 0}
                      className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-lg font-bold text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <input
                      id="qty"
                      type="number"
                      min="0"
                      max="10"
                      value={achatQte}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setAchatQte(Math.max(0, Math.min(10, v)));
                      }}
                      aria-label="Quantité de marchandises à acheter"
                      className="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
                    />
                    <button
                      type="button"
                      aria-label="Ajouter une unité"
                      onClick={() => setAchatQte(Math.min(10, achatQte + 1))}
                      disabled={achatQte >= 10}
                      className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-lg font-bold text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  <p
                    className="mt-2 text-xs font-semibold text-cyan-200"
                    aria-live="polite"
                  >
                    Coût total : {(achatQte * 1000).toLocaleString("fr-FR")} €
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white mb-1">Mode</p>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={achatMode === "tresorerie"}
                        onChange={() => setAchatMode("tresorerie")}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-slate-300">Comptant</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={achatMode === "dettes"}
                        onChange={() => setAchatMode("dettes")}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-slate-300">À crédit (payé au trimestre suivant)</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onSkipAchat}
                    aria-label="Passer l'étape d'achat de marchandises"
                    className="flex-1 cursor-pointer rounded-lg border border-amber-300/60 bg-amber-500 px-2 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300/50 transition-colors hover:bg-amber-400"
                  >
                    Passer cette étape →
                  </button>
                  <button
                    onClick={onLaunchAchat}
                    aria-label="Lancer l'achat de marchandises"
                    className="flex-1 rounded-lg bg-cyan-400 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    Lancer
                  </button>
                </div>
              </div>
              )
            )}

            {etapeTour === ETAPES.DECISION && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  {subEtape6 === "recrutement" ? "Recrutement" : "Investissement"}
                </p>
                {selectedDecision ? (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 p-2">
                    <p className="text-xs font-semibold text-emerald-100">✅ {selectedDecision.titre}</p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/20 p-2">
                    <p className="text-xs text-cyan-100">👉 Choisis une carte dans le panneau central</p>
                  </div>
                )}
                {/* Mini-deck logistique déplacé vers InvestissementPanel (MainContent) sur la sous-étape Investissement */}
                {/* Licenciement — visible sur la sous-étape Recrutement si des commerciaux sont actifs */}
                {subEtape6 === "recrutement" && joueur.cartesActives.some(c => c.categorie === "commercial") && (
                  <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-2 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-300">
                      📤 Licencier un commercial
                    </p>
                    <p className="text-[10px] text-rose-200/70">
                      Indemnité = 1 trimestre de salaire (charges exceptionnelles)
                    </p>
                    {joueur.cartesActives
                      .filter(c => c.categorie === "commercial")
                      .map(c => {
                        const salaire = c.effetsImmédiats
                          .filter(e => e.poste === "tresorerie")
                          .reduce((s, e) => s + Math.abs(e.delta), 0);
                        return (
                          <div key={c.id} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-200">{c.titre}</span>
                            <button
                              onClick={() => onLicencierCommercial?.(c.id)}
                              className="rounded px-2 py-0.5 text-[10px] font-semibold bg-rose-600/80 hover:bg-rose-500 text-white"
                              title={`Indemnité : ${salaire} €`}
                            >
                              Licencier −{salaire} €
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* T25.C : les étapes manuelles (ACHATS_STOCK + DECISION) ont leur propre
              panneau d'interaction — pas de bouton générique « Commencer l'étape ». */}
          {etapeTour !== ETAPES.ACHATS_STOCK && etapeTour !== ETAPES.DECISION && (
            <button
              onClick={onLaunchStep}
              className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Commencer l’étape
            </button>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-3">
        <button
          onClick={onDemanderEmprunt}
          className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/75 hover:border-white/20"
        >
          Demander un emprunt
        </button>
        <div className="mt-2 text-[10px] text-slate-400 text-center">
          {totalActif.toFixed(0)} = {totalPassif.toFixed(0)} {balanced && "✓"}
        </div>
      </section>
    </div>
  );
}
