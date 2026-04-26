"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  CarteDecision,
  Joueur,
  ETAPES,
  calculerCapaciteLogistique,
  calculerCapaciteProductionBelvaux,
} from "@jedevienspatron/game-engine";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";

import { type ActiveStep } from "./EntryPanel";
import { getDocumentType, getSens, nomCompte } from "./utils";
import { InvestissementPanel } from "./InvestissementPanel";

type TabType = "bilan" | "cr" | "indicateurs" | "glossaire" | "vue-ensemble" | "impact";

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
  onLaunchDecision?: (carte?: CarteDecision) => void;
  /** Callback pour les cartes du mini-deck logistique (piochePersonnelle). */
  onInvestirPersonnel?: (carteId: string) => void;
  /** Callback pour vendre une immobilisation d'occasion (Tâche 11 Volet 3). */
  onVendreImmobilisation?: (nomImmo: string, prixCession: number) => void;
}

export function MainContent({
  joueur: _joueur,
  displayJoueur,
  activeStep: _activeStep,
  highlightedPoste: _highlightedPoste,
  etapeTour,
  activeTab: initialTab,
  setActiveTab,
  showCartes: _showCartes,
  selectedDecision,
  setSelectedDecision,
  cartesDisponibles,
  cartesRecrutement = [],
  recentModifications: _recentModifications,
  subEtape6,
  modeRapide: _modeRapide,
  onSkipDecision,
  onLaunchDecision,
  onInvestirPersonnel,
  onVendreImmobilisation,
}: MainContentProps) {
  const [activeTab, setLocalActiveTab] = useState<TabType>(initialTab === "bilan" || initialTab === "cr" ? initialTab : "bilan");
  const [tabVisibleState, setTabVisibleState] = useState<TabType | null>(initialTab === "bilan" || initialTab === "cr" ? initialTab : "bilan");

  const handleTabChange = (tab: TabType) => {
    // Toggle: si l'onglet cliqué est déjà visible, le fermer ; sinon l'ouvrir
    if (tabVisibleState === tab) {
      setTabVisibleState(null);
    } else {
      setLocalActiveTab(tab);
      setActiveTab(tab);
      setTabVisibleState(tab);
    }
  };

  // ── Détecter si l'étape active touche les deux documents (Bilan ET CR) ──────
  // → `modeDouble` est conservé pour l'indicateur visuel (dot) sur les onglets
  //   non actifs, qui signale "l'autre document est aussi touché".
  // → `showPartieDouble` (B9-UI.2 — 2026-04-24) pilote l'affichage du cadre
  //   pédagogique Partie double. Il se déclenche dès qu'une écriture contient
  //   au moins 2 lignes, MÊME si elles restent dans un seul document
  //   (ex. Approvisionnement comptant : stocks + / trésorerie −, toutes deux
  //   dans le Bilan mais toujours une partie double Débit = Crédit).
  const entriesBilan = _activeStep?.entries.filter((e) => getDocumentType(e.poste) === "Bilan") ?? [];
  const entriesCR    = _activeStep?.entries.filter((e) => getDocumentType(e.poste) === "CR")    ?? [];
  const modeDouble   = entriesBilan.length > 0 && entriesCR.length > 0;
  const showPartieDouble = (entriesBilan.length + entriesCR.length) >= 2;

  // Auto-switch vers l’onglet du document impacté par l’écriture courante.
  // Fonctionne aussi en modeDouble : on affiche TOUJOURS un seul document,
  // et on bascule automatiquement sur le bon document pour chaque écriture.
  const appliedCount = _activeStep?.entries.filter(e => e.applied).length ?? 0;
  useEffect(() => {
    if (!_activeStep) return;
    const appliedEntries = _activeStep.entries.filter(e => e.applied);
    let poste: string | undefined;
    if (appliedEntries.length > 0) {
      // Dernier poste appliqué → afficher son document
      poste = appliedEntries[appliedEntries.length - 1].poste;
    } else {
      // Arrivée sur l’étape : montrer le document de la première écriture en attente
      const firstPending = _activeStep.entries.find(e => !e.applied);
      poste = firstPending?.poste;
    }
    if (!poste) return;
    const docType = getDocumentType(poste);
    const target: TabType = docType === "CR" ? "cr" : "bilan";
    setLocalActiveTab(target);
    setActiveTab(target);
    setTabVisibleState(target);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCount, _activeStep?.titre]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Tab bar — toujours des onglets cliquables, avec mini-aperçus en modeDouble */}
      <div className="flex-shrink-0 border-b border-white/10 bg-slate-950 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist">
          {[
            { tab: "bilan" as TabType, label: "Bilan",              accent: "cyan"   },
            { tab: "cr"    as TabType, label: "Compte de Résultat", accent: "violet" },
          ].map(({ tab, label, accent }) => {
            const isActive  = tabVisibleState === tab;
            const isTouched = modeDouble;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab)}
                className={`relative rounded-2xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
                  isActive
                    ? accent === "cyan"
                      ? "bg-cyan-500 text-white"
                      : "bg-violet-500 text-white"
                    : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"
                }`}
              >
                {label}
                {isTouched && !isActive && (
                  <span
                    className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${
                      accent === "cyan" ? "bg-cyan-400" : "bg-violet-400"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Cadre PARTIE DOUBLE — visible dès qu'une écriture a ≥ 2 lignes ──
            La partie double est une règle PCG universelle : Σ Débits = Σ Crédits
            pour toute écriture, MÊME si toutes les lignes restent dans un seul
            document (ex. Approvisionnement comptant : stocks + / trésorerie −,
            deux lignes du Bilan mais toujours débit = crédit).
            Le cadre s'adapte au contexte :
              - Si les 2 documents sont touchés : 2 mini-cartes côte à côte
                (Bilan cyan + CR violet), utiles aussi pour basculer d'onglet.
              - Si un seul document est touché : 1 mini-carte pleine largeur.
              - Footer Σ Débits = Σ Crédits TOUJOURS affiché — c'est le message.
            Le titre est cliquable et ouvre le glossaire sur l'entrée "partie-double".
        */}
        <AnimatePresence>
          {showPartieDouble && (
            <motion.div
              key="mini-previews"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {(() => {
                // Calcul des totaux débit / crédit de l'écriture en cours.
                // getSens() mappe (poste, delta) → "debit" | "credit" selon PCG.
                const allEntries = [...entriesBilan, ...entriesCR];
                let totalDebit = 0;
                let totalCredit = 0;
                for (const e of allEntries) {
                  const amount = Math.abs(e.delta);
                  if (getSens(e.poste, e.delta) === "debit") totalDebit += amount;
                  else totalCredit += amount;
                }
                const equilibre = Math.abs(totalDebit - totalCredit) < 0.01;
                // Layout adaptatif : 1 colonne si un seul document touché, 2 si les deux.
                const gridCols = modeDouble ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
                return (
                  <div className="mt-3 rounded-2xl border-2 border-amber-400/30 bg-amber-500/[0.04] p-3 shadow-lg shadow-amber-500/5">
                    {/* Header cliquable : ouvre le glossaire sur "Partie double" */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("glossaire")}
                      aria-label="Voir la fiche Partie double dans le glossaire"
                      className="group w-full flex items-center justify-between mb-2.5 px-1"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-amber-300 text-base" aria-hidden="true">⚖️</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 group-hover:text-amber-200 transition-colors">
                          Partie double
                        </span>
                        <span className="text-[10px] text-slate-400 italic">
                          — chaque écriture touche au moins 2 comptes
                        </span>
                      </span>
                      <span className="text-[10px] text-amber-400/70 group-hover:text-amber-300 italic transition-colors">
                        ? glossaire →
                      </span>
                    </button>

                    {/* Mini-carte(s) Bilan / Compte de Résultat — affichage conditionnel
                        selon les documents touchés par l'écriture courante. */}
                    <div className={`grid ${gridCols} gap-2`}>
                      {entriesBilan.length > 0 && (
                        <ImpactMiniCard
                          accent="cyan"
                          label="📊 Bilan"
                          entries={entriesBilan}
                          isCurrentTab={tabVisibleState === "bilan"}
                          onClick={() => handleTabChange("bilan")}
                        />
                      )}
                      {entriesCR.length > 0 && (
                        <ImpactMiniCard
                          accent="violet"
                          label="📈 Compte de Résultat"
                          entries={entriesCR}
                          isCurrentTab={tabVisibleState === "cr"}
                          onClick={() => handleTabChange("cr")}
                        />
                      )}
                    </div>

                    {/* Footer — Σ Débits = Σ Crédits (équilibre comptable). */}
                    <div className={`mt-2.5 flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-mono tabular-nums ${
                      equilibre
                        ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-200"
                        : "bg-red-500/10 border border-red-400/30 text-red-200"
                    }`}>
                      <span className="text-slate-400">Σ Débits</span>
                      <span className="font-bold">{totalDebit.toLocaleString("fr-FR")} €</span>
                      <span className="text-slate-500">{equilibre ? "=" : "≠"}</span>
                      <span className="text-slate-400">Σ Crédits</span>
                      <span className="font-bold">{totalCredit.toLocaleString("fr-FR")} €</span>
                      <span aria-hidden="true" className="ml-1">{equilibre ? "✓" : "⚠️"}</span>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Sous-étape Recrutement (flux classique de l'étape Décisions) ─── */}
      {etapeTour === ETAPES.DECISION && subEtape6 === "recrutement" && !_activeStep && (() => {
        // LOT 6 (2026-04-25) — Alerte capacité non-bloquante.
        // Pour Belvaux (production), la capacité limitante est la PRODUCTION
        // (pas la capacité commerciale). Pour les 3 autres, c'est la capacité
        // logistique (calculerCapaciteLogistique). On compte les clients déjà
        // attendus (commerciaux actifs + flux passifs) et on signale chaque
        // carte de recrutement qui ferait franchir le plafond.
        const secteur = displayJoueur.entreprise.secteurActivite;
        const capaciteMax = secteur === "production"
          ? calculerCapaciteProductionBelvaux(displayJoueur)
          : calculerCapaciteLogistique(displayJoueur);
        const clientsCommerciaux = displayJoueur.cartesActives
          .filter((c) => c.categorie === "commercial")
          .reduce((s, c) => s + (c.nbClientsParTour ?? 0), 0);
        const clientsPassifs = (displayJoueur.entreprise.clientsPassifsParTour ?? [])
          .reduce((s, f) => s + f.nbParTour, 0);
        const clientsDejaAttendus = clientsCommerciaux + clientsPassifs;
        const capaciteLabel = secteur === "production"
          ? `${clientsDejaAttendus}/${capaciteMax} produits/trim (production)`
          : `${clientsDejaAttendus}/${capaciteMax} clients/trim (capacité logistique)`;

        return (
        <div className="flex-shrink-0 border-b border-white/10 px-4 py-3">
          {/* B9 post-audit (2026-04-24) — panneau Recrutement renforcé :
              bordure cyan marquée + accent vertical gauche + titre coloré + emoji,
              pour compenser la discrétion visuelle précédente (slate-500 sur fond
              quasi transparent) signalée par Pierre. */}
          <div className="rounded-xl border-2 border-cyan-500/30 bg-cyan-500/[0.05] p-3 space-y-3 border-l-4 border-l-cyan-400 shadow-lg shadow-cyan-500/5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300 flex items-center gap-2">
                <span aria-hidden="true">👔</span>
                Recrutement
              </p>
              {/* LOT 6 — jauge synthétique permanente */}
              <p className="text-[10px] text-slate-400 tabular-nums">
                {capaciteLabel}
              </p>
            </div>

            {/* Card list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cartesRecrutement.map((carte) => {
                // LOT 6 — Détecter si ce recrutement ferait dépasser la capacité.
                const apport = carte.nbClientsParTour ?? 0;
                const totalApresRecrutement = clientsDejaAttendus + apport;
                const ferraitDepasser = totalApresRecrutement > capaciteMax;
                const cartouche = secteur === "production"
                  ? "Investis dans des Robots avant pour augmenter la production."
                  : "Investis dans une carte logistique avant pour augmenter la capacité.";
                return (
                <div key={carte.id}>
                  <button
                    onClick={() => setSelectedDecision(selectedDecision?.id === carte.id ? null : carte)}
                    className={`w-full text-left rounded-lg border p-2 transition-colors ${
                      selectedDecision?.id === carte.id
                        ? "border-cyan-400/40 bg-cyan-500/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{carte.titre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{carte.description}</p>
                    {carte.effetsImmédiats.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {carte.effetsImmédiats.map((e, i) => (
                          <span key={i} className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                            {e.poste}: {e.delta > 0 ? "+" : ""}{e.delta.toLocaleString("fr-FR")} €
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                  {ferraitDepasser && (
                    <div className="mt-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-100 leading-snug">
                      <span className="font-semibold">⚠ Capacité saturée</span> — ramener
                      {" "}{totalApresRecrutement} clients avec une capacité de {capaciteMax} fera
                      perdre {totalApresRecrutement - capaciteMax} client(s)/trim. {cartouche}
                    </div>
                  )}
                </div>
                );
              })}
              {cartesRecrutement.length === 0 && (
                <p className="text-xs text-slate-500 italic">Aucun candidat disponible</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={onSkipDecision}
                aria-label="Passer la sous-étape recrutement et continuer"
                className="flex-1 cursor-pointer rounded-lg border border-amber-300/60 bg-amber-500 px-2 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300/50 transition-colors hover:bg-amber-400"
              >
                Passer cette étape →
              </button>
              {selectedDecision && onLaunchDecision && (
                <button
                  onClick={() => onLaunchDecision()}
                  className="flex-1 rounded-lg bg-cyan-400 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Exécuter
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ─── Sous-étape Investissement (panneau unifié catégorisé) ─────── */}
      {etapeTour === ETAPES.DECISION && subEtape6 === "investissement" && !_activeStep && (
        <div className="flex-shrink-0 border-b border-white/10 px-4 py-3 max-h-[65vh] overflow-y-auto">
          <InvestissementPanel
            joueur={displayJoueur}
            cartesDisponibles={cartesDisponibles}
            onInvestirPersonnel={(carteId) => onInvestirPersonnel?.(carteId)}
            onInvestirGlobal={(carte) => onLaunchDecision?.(carte)}
            onVendreImmobilisation={(nomImmo, prix) => onVendreImmobilisation?.(nomImmo, prix)}
            onTerminer={() => onSkipDecision?.()}
            disabled={false}
          />
        </div>
      )}

      {/* Scrollable content area — UN SEUL document à la fois.
          Quand l'écriture touche les deux documents, l'auto-switch bascule
          automatiquement vers le bon document pour chaque entrée. */}
      <div className="flex-1 overflow-y-auto px-2 pb-6 pt-3 md:px-4">
        <AnimatePresence mode="wait">
          {tabVisibleState === "bilan" && (
            <motion.div
              key="bilan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <BilanPanel
                joueur={displayJoueur}
                highlightedPoste={_highlightedPoste}
                recentModifications={_recentModifications}
              />
            </motion.div>
          )}

          {tabVisibleState === "cr" && (
            <motion.div
              key="cr"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <CompteResultatPanel
                joueur={displayJoueur}
                highlightedPoste={_highlightedPoste}
                recentModifications={_recentModifications}
                etapeTour={etapeTour}
                hasActiveStep={!!_activeStep}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// ─── Mini-carte d'aperçu d'impact (Pattern 3) ──────────────────────────────────
// Affiche les 2-3 premiers postes impactés d'un document comptable.
// Cliquable pour basculer vers le document correspondant.
interface ImpactMiniCardProps {
  accent: "cyan" | "violet";
  label: string;
  entries: Array<{ poste: string; delta: number; applied: boolean }>;
  /** True si ce document est actuellement affiché dans le panneau central. */
  isCurrentTab?: boolean;
  onClick: () => void;
}

function ImpactMiniCard({
  accent,
  label,
  entries,
  isCurrentTab = false,
  onClick,
}: ImpactMiniCardProps) {
  const MAX_VISIBLE = 3;
  const visible = entries.slice(0, MAX_VISIBLE);
  const remaining = entries.length - visible.length;

  const borderClass = accent === "cyan"
    ? "border-cyan-500/30 bg-cyan-500/[0.05] hover:bg-cyan-500/[0.10]"
    : "border-violet-500/30 bg-violet-500/[0.05] hover:bg-violet-500/[0.10]";

  const labelClass = accent === "cyan" ? "text-cyan-300" : "text-violet-300";

  // Onglet actif = affiché dans le panneau central → indicateur visuel, non désactivé
  // (le bouton reste cliquable pour relancer une navigation si besoin).
  const hint = isCurrentTab
    ? <span className="text-[9px] text-emerald-400 italic">● affiché</span>
    : <span className="text-[9px] text-slate-500 italic">cliquer pour voir →</span>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Voir ${label}`}
      aria-pressed={isCurrentTab}
      className={`w-full text-left rounded-xl border p-2.5 transition-colors ${borderClass} ${isCurrentTab ? "ring-2 ring-offset-2 ring-offset-slate-950 " + (accent === "cyan" ? "ring-cyan-400/60" : "ring-violet-400/60") : ""} cursor-pointer`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>
          {label}
        </p>
        {hint}
      </div>
      <div className="space-y-0.5">
        {visible.map((entry, idx) => {
          const isPositive = entry.delta > 0;
          const color = entry.applied
            ? "text-slate-500 line-through"
            : isPositive
              ? "text-emerald-300"
              : "text-rose-300";
          const sign = isPositive ? "+" : "";
          return (
            <div key={idx} className="flex items-center justify-between text-[11px] gap-2">
              <span className="flex items-center gap-1 text-slate-300 truncate">
                {entry.applied && <span className="text-emerald-400 flex-shrink-0">✓</span>}
                <span className="truncate">{nomCompte(entry.poste)}</span>
              </span>
              <span className={`font-mono font-semibold flex-shrink-0 ${color}`}>
                {sign}{entry.delta.toLocaleString("fr-FR")}&nbsp;€
              </span>
            </div>
          );
        })}
        {remaining > 0 && (
          <p className="text-[9px] text-slate-500 italic pt-0.5">
            + {remaining} autre{remaining > 1 ? "s" : ""} poste{remaining > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </button>
  );
}
