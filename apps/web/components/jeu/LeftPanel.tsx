"use client";

import { useState } from "react";
import { getTotalActif, getTotalPassif, CarteDecision, Joueur } from "@jedevienspatron/game-engine";
import { type ActiveStep } from "./EntryPanel";
import { nomCompte } from "./utils";
import { MiniDeckPanel } from "./MiniDeckPanel";

const STEP_NAMES = [
  "Charges fixes",
  "Approvisionnement",
  "Avancement créances",
  "Paiement commerciaux",
  "Traitement ventes",
  "Effets récurrents",
  "Décisions",
  "Événement",
  "Bilan trimestre",
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
  onDemanderEmprunt?: () => void;
  onInvestirPersonnel?: (carteId: string) => void;
  onLicencierCommercial?: (carteId: string) => void;
}

const STEP_HELP = [
  "Charges fixes obligatoires payées depuis la trésorerie.",
  "Achat de stocks (optionnel)",
  "Vos créances clients avancent et sont encaissées.",
  "Salaires versés. Nouveaux clients générés.",
  "Tes clients passent en caisse : pour chacun, une vente est enregistrée au Compte de Résultat, une marchandise sort du stock, et tu encaisses immédiatement ou crées une créance selon son délai de paiement.",
  "Effets de vos cartes de décision à appliquer.",
  "Sélection de carte de recrutement ou investissement",
  "Une carte Événement sera piochée.",
  "Vérification du bilan. Fin du trimestre.",
];

export function LeftPanel({
  etapeTour,
  tourActuel,
  nbToursMax,
  joueur,
  activeStep,
  onApplyEntry,
  onConfirmStep,
  achatQte,
  setAchatQte,
  achatMode,
  setAchatMode,
  onLaunchAchat,
  onSkipAchat,
  selectedDecision,
  setSelectedDecision,
  cartesDisponibles = [],
  cartesRecrutement = [],
  onSkipDecision,
  onLaunchDecision,
  onLaunchStep,
  onDemanderEmprunt,
  onInvestirPersonnel,
  onLicencierCommercial,
  subEtape6,
}: LeftPanelProps) {
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const stepName = STEP_NAMES[etapeTour] || "Étape inconnue";
  const hasCommerciaux = joueur.cartesActives.some((c) => c.categorie === "commercial");
  const stepHelp =
    etapeTour === 3
      ? hasCommerciaux
        ? "Les salaires de vos commerciaux seront versés et de nouveaux clients seront générés."
        : "Aucun commercial actif — cette étape est vide. Recrutez à l'étape 6 pour générer de nouveaux clients."
      : STEP_HELP[etapeTour] || "";
  const totalActif = getTotalActif(joueur);
  const totalPassif = getTotalPassif(joueur);
  const balanced = Math.abs(totalActif - totalPassif) < 0.01;

  if (activeStep) {
    const firstPending = activeStep.entries.find((e) => !e.applied);
    const allApplied   = !firstPending;

    // ── Données pour la modale de confirmation ────────────────────────────────
    const isDecisionStep    = etapeTour === 6;
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
                      {e.delta > 0 ? "+" : ""}{e.delta.toLocaleString("fr-FR")} u
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
                  onClick={() => setPendingConfirm(false)}
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
            {/* ── Titre de l’action en cours — bien visible ── */}
            <div className="rounded-xl bg-gradient-to-r from-cyan-900/40 to-slate-800/40 border border-cyan-400/20 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Écriture {Math.min(activeStep.entries.filter((e) => e.applied).length + 1, activeStep.entries.length)} / {activeStep.entries.length}
              </p>
              <h3 className="mt-1 text-lg font-bold text-white leading-snug">{activeStep.titre}</h3>
            </div>

            {firstPending ? (
              <div className="space-y-3 rounded-xl border border-cyan-400/15 bg-white/[0.04] p-3">
                {/* ── Compte + montant — gros et clair ── */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-200 mb-1">
                    {nomCompte(firstPending.poste)}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-slate-200">{firstPending.sens === "debit" ? "DÉBIT" : "CRÉDIT"}</span>
                    <span className="text-2xl font-black text-white">{firstPending.delta > 0 ? "+" : ""}{firstPending.delta}u</span>
                  </div>
                </div>
                {/* ── Description de l’écriture — lisible ── */}
                <p className="text-sm leading-relaxed text-slate-200">{firstPending.description}</p>
                {/* ── Bulle pédagogique ── */}
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
                  aria-label={`Appliquer l'écriture comptable : ${firstPending.id}`}
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
                Confirmer l’étape ✓
              </button>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-3">Parcours</p>
          <div className="space-y-1.5">
            {STEP_NAMES.map((name, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                  idx === etapeTour ? "border border-cyan-400/20 bg-cyan-500/10 text-cyan-100 font-medium"
                  : idx < etapeTour ? "text-emerald-300"
                  : "text-slate-400"
                }`}
              >
                <span className="w-4 text-center">{idx === etapeTour ? "→" : idx < etapeTour ? "✅" : "○"}</span>
                <span>{idx + 1}. {name}</span>
              </div>
            ))}
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
              T{tourActuel}/{nbToursMax} · Étape {etapeTour + 1}/9
            </p>
            <h2 className="mt-1 text-base font-semibold text-white">{stepName}</h2>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-sm text-slate-300">{stepHelp}</p>

            {etapeTour === 1 && (
              <div className="space-y-2">
                <div>
                  <label htmlFor="qty" className="block text-xs font-semibold text-white mb-1">
                    Quantité <span className="text-slate-400 font-normal">(1 unité = 1 000 €)</span>
                  </label>
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
                      <span className="text-xs text-slate-300">À crédit</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onSkipAchat}
                    aria-label="Passer l'étape d'achat de marchandises"
                    className="flex-1 rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/[0.08]"
                  >
                    Passer
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
            )}

            {etapeTour === 6 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  {subEtape6 === "recrutement" ? "6a — Recrutement" : "6b — Investissement"}
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
                {/* Mini-deck logistique personnel — visible à l'étape 6b */}
                {subEtape6 === "investissement" && (
                  <MiniDeckPanel
                    joueur={joueur}
                    onInvestir={(carteId) => onInvestirPersonnel?.(carteId)}
                    disabled={false}
                  />
                )}
                {/* Licenciement — visible à l'étape 6a si des commerciaux sont actifs */}
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

          {etapeTour !== 1 && etapeTour !== 6 && (
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
