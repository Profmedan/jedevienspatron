"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  CarteDecision,
  Joueur,
} from "@jedevienspatron/game-engine";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";

import { type ActiveStep } from "./EntryPanel";
import { getDocumentType } from "./utils";
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

  const handleTabChange = (tab: TabType) => {
    setLocalActiveTab(tab);
    setActiveTab(tab);
  };

  // ── Détecter si l’étape active touche les deux documents (Bilan ET CR) ──────
  // → dans ce cas on affiche les deux côte à côte (mode split)
  // → sinon on garde le système d’onglets classique avec auto-switch
  const modeDouble = !!_activeStep && (() => {
    const postes = _activeStep.entries.map(e => e.poste);
    const hasBilan = postes.some(p => getDocumentType(p) === "Bilan");
    const hasCR    = postes.some(p => getDocumentType(p) === "CR");
    return hasBilan && hasCR;
  })();

  // Auto-switch vers l’onglet du dernier poste appliqué (uniquement en mode onglet simple)
  const appliedCount = _activeStep?.entries.filter(e => e.applied).length ?? 0;
  useEffect(() => {
    if (!_activeStep || modeDouble) return; // en mode split, pas besoin de switcher
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCount, _activeStep?.titre, modeDouble]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Tab bar — masquée en mode split (les deux docs sont déjà visibles) */}
      <div className="flex-shrink-0 border-b border-white/10 bg-slate-950 px-4 py-3">
        {modeDouble ? (
          /* Bandeau indicateur en mode split */
          <div className="flex items-center gap-2">
            <span className="rounded-2xl bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 tracking-wide">
              📊 Bilan
            </span>
            <span className="text-slate-600 text-xs">+</span>
            <span className="rounded-2xl bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-300 tracking-wide">
              📈 Compte de Résultat
            </span>
            <span className="ml-2 text-xs text-slate-500 italic">— affichés ensemble (cette opération touche les deux documents)</span>
          </div>
        ) : (
          <div className="flex gap-2" role="tablist">
            {[
              ["bilan", "Bilan"],
              ["cr", "Compte de Résultat"],
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => handleTabChange(tab as TabType)}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
                  activeTab === tab
                    ? "bg-cyan-500 text-white"
                    : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Étape 6a — Sélection recrutement (flux classique) ─────────── */}
      {etapeTour === 6 && subEtape6 === "recrutement" && !_activeStep && (
        <div className="flex-shrink-0 border-b border-white/10 px-4 py-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              6a — Recrutement
            </p>

            {/* Card list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cartesRecrutement.map((carte) => (
                <button
                  key={carte.id}
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
              ))}
              {cartesRecrutement.length === 0 && (
                <p className="text-xs text-slate-500 italic">Aucun candidat disponible</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={onSkipDecision}
                className="flex-1 rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/[0.08]"
              >
                Passer
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
      )}

      {/* ─── Étape 6b — Investissement (panneau unifié catégorisé) ─────── */}
      {etapeTour === 6 && subEtape6 === "investissement" && !_activeStep && (
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

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {modeDouble ? (
          /* ── MODE SPLIT : Bilan + CR côte à côte ──────────────────────────────
             Affiché quand l'étape active touche les deux documents comptables.
             L'apprenant voit simultanément l'impact sur chaque document au fur
             et à mesure qu'il applique ses écritures. */
          <div className="flex flex-col gap-4 xl:flex-row xl:gap-6">
            {/* Bilan (côté gauche en xl, en haut sur mobile) */}
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
                  📊 Bilan
                </span>
              </div>
              <BilanPanel
                joueur={displayJoueur}
                highlightedPoste={_highlightedPoste}
                recentModifications={_recentModifications}
              />
            </div>

            {/* Séparateur visible en xl */}
            <div className="hidden xl:block w-px bg-white/10 self-stretch" />

            {/* Compte de Résultat (côté droit en xl, en bas sur mobile) */}
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-violet-300">
                  📈 Compte de Résultat
                </span>
              </div>
              <CompteResultatPanel
                joueur={displayJoueur}
                highlightedPoste={_highlightedPoste}
                recentModifications={_recentModifications}
                etapeTour={etapeTour}
                hasActiveStep={!!_activeStep}
              />
            </div>
          </div>
        ) : (
          /* ── MODE ONGLETS : affichage classique avec auto-switch ─────────── */
          <AnimatePresence mode="wait">
            {activeTab === "bilan" && (
              <motion.div
                key="bilan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <BilanPanel joueur={displayJoueur} highlightedPoste={_highlightedPoste} recentModifications={_recentModifications} />
              </motion.div>
            )}

            {activeTab === "cr" && (
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
        )}
      </div>
    </main>
  );
}
