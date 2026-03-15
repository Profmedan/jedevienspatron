"use client";

import { useState } from "react";
import { Joueur, CarteDecision } from "@/lib/game-engine/types";
import CarteView from "@/components/CarteView";
import { EntryPanel, type ActiveStep } from "./EntryPanel";
import { nomCompte, getDocument } from "./utils";
import { MODALES_ETAPES } from "@/lib/game-engine/data/pedagogie";

// ─── Strip de progression compact (remplace EtapeGuide) ─────────────────────

const ETAPE_EMOJI: Record<number, string> = {
  0: "💼", 1: "📦", 2: "💰", 3: "🤝", 4: "🎯", 5: "🏛️", 6: "✉️", 7: "🎲", 8: "📊",
};

function ProgressStrip({ etapeTour, tourActuel, nbToursMax }: {
  etapeTour: number; tourActuel: number; nbToursMax: number;
}) {
  const modal = MODALES_ETAPES[etapeTour];
  return (
    <div className="bg-gray-800/60 rounded-xl border border-gray-700 px-3 py-2 space-y-1.5">
      {/* Barre tour */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
          Tour {tourActuel} / {nbToursMax}
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: nbToursMax }).map((_, i) => (
            <div key={i} className={`h-1.5 w-4 rounded-full transition-all ${i < tourActuel ? "bg-indigo-400" : "bg-gray-700"}`} />
          ))}
        </div>
      </div>
      {/* Barre étape */}
      <div className="flex gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < etapeTour ? "bg-indigo-500" : i === etapeTour ? "bg-indigo-400" : "bg-gray-700"}`} />
        ))}
      </div>
      {/* Titre étape */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{ETAPE_EMOJI[etapeTour] ?? "📋"}</span>
        <span className="text-[10px] text-gray-400 font-medium leading-tight">
          Étape {etapeTour + 1}/9 — {modal?.titre ?? ""}
        </span>
      </div>
    </div>
  );
}

// ─── Carte pédagogique persistante ──────────────────────────────────────────
// isLocked=true  → étape nouvelle : carte développée, boutons verrouillés
// isLocked=false → étape déjà lue : carte collapsée, boutons actifs

function PedagoCard({ etape, isLocked, onUnlock }: {
  etape: number;
  isLocked: boolean;
  onUnlock?: () => void;
}) {
  // Auto-open quand verrou actif, auto-close quand le joueur a dit "J'ai compris"
  const [open, setOpen] = useState(isLocked);
  const [detailOpen, setDetailOpen] = useState(false);
  const modal = MODALES_ETAPES[etape];
  if (!modal) return null;

  // Si le verrou change (nouvelle étape), rouvrir automatiquement
  // (React re-mount grâce à la key={etape} dans le parent)

  if (!open) {
    // ── Collapsed : simple reminder cliquable ──
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800/60 rounded-xl border border-gray-700 hover:border-indigo-600/60 hover:bg-gray-800 transition-all text-left"
      >
        <span className="text-base shrink-0">{ETAPE_EMOJI[etape] ?? "📋"}</span>
        <span className="flex-1 text-xs text-gray-400 font-medium leading-tight truncate">{modal.titre}</span>
        <span className="text-[10px] text-indigo-400 shrink-0">▼ Relire</span>
      </button>
    );
  }

  // ── Expanded : contenu complet ──
  return (
    <div className={`rounded-2xl border-2 p-3 space-y-2.5 shadow-xl transition-all ${
      isLocked
        ? "bg-gradient-to-br from-indigo-950 to-gray-900 border-indigo-400/70 ring-2 ring-indigo-500/20"
        : "bg-gray-800/80 border-gray-600"
    }`}>
      {/* En-tête */}
      <div className="flex items-start gap-2">
        <span className="text-2xl shrink-0">{ETAPE_EMOJI[etape] ?? "📋"}</span>
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-widest block ${isLocked ? "text-indigo-400" : "text-gray-500"}`}>
            {isLocked ? "Étape " + etape + " — À lire avant d'agir" : "Rappel — étape " + etape}
          </span>
          <h3 className="text-sm font-black text-white leading-tight">{modal.titre}</h3>
        </div>
        {/* Bouton collapse si lecture libre */}
        {!isLocked && (
          <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-300 text-xs shrink-0">▲</button>
        )}
      </div>

      {/* Ce qui se passe */}
      <div className="bg-black/30 rounded-xl p-2.5">
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLocked ? "text-indigo-400" : "text-gray-500"}`}>Ce qui se passe</p>
        <p className="text-xs text-gray-200 leading-relaxed">{modal.ceQuiSePasse}</p>
      </div>

      {/* Détails repliables */}
      {detailOpen && (
        <div className="space-y-2">
          <div className="bg-black/30 rounded-xl p-2.5">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLocked ? "text-indigo-400" : "text-gray-500"}`}>Pourquoi c&apos;est important</p>
            <p className="text-xs text-gray-200 leading-relaxed">{modal.pourquoi}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-2.5">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLocked ? "text-indigo-400" : "text-gray-500"}`}>Impact sur les comptes</p>
            <p className="text-xs text-gray-200 leading-relaxed">{modal.impactComptes}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-2.5">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">💡 Conseil</p>
            <p className="text-xs text-gray-200 leading-relaxed">{modal.conseil}</p>
          </div>
        </div>
      )}

      {/* Contrôles */}
      <div className={`space-y-2 pt-1 ${isLocked ? "border-t border-indigo-700/40" : "border-t border-gray-700/40"}`}>
        <button
          onClick={() => setDetailOpen(!detailOpen)}
          className="w-full text-xs py-2 rounded-lg bg-black/20 text-gray-400 hover:text-gray-200 hover:bg-black/40 font-medium transition-colors border border-white/10"
        >
          {detailOpen ? "▲ Réduire" : "▼ Pourquoi · Impact · Conseil"}
        </button>

        {isLocked && onUnlock && (
          <button
            onClick={() => { onUnlock(); setOpen(false); }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-sm transition-all active:scale-95 shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
          >
            ✅ J&apos;ai compris — je peux agir →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Indicateurs de santé financière ─────────────────────────────────────────

function SanteFinanciere({ joueur }: { joueur: Joueur }) {
  const treso = (joueur.bilan.actifs.find(a => a.categorie === "tresorerie")?.valeur ?? 0) - joueur.bilan.decouvert;
  const capitaux = joueur.bilan.passifs.find(p => p.categorie === "capitaux")?.valeur ?? 0;
  const cr = joueur.compteResultat;
  const totalProduits = cr.produits.ventes + cr.produits.productionStockee + cr.produits.produitsFinanciers + cr.produits.revenusExceptionnels;
  const totalCharges = cr.charges.achats + cr.charges.servicesExterieurs + cr.charges.impotsTaxes + cr.charges.chargesInteret + cr.charges.chargesPersonnel + cr.charges.chargesExceptionnelles + cr.charges.dotationsAmortissements;
  const resultat = totalProduits - totalCharges;

  const COULEUR = {
    vert:   { dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-900/20 border-emerald-700/40" },
    orange: { dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-900/20 border-amber-700/40"   },
    rouge:  { dot: "bg-red-500",     text: "text-red-300",     bg: "bg-red-900/20 border-red-700/40"       },
  };

  const indicateurs = [
    { label: "Tréso",    valeur: treso,    niveau: treso < 0 ? "rouge" : treso < 3 ? "orange" : "vert",    hint: treso < 0 ? "Découvert" : treso < 3 ? "Faible" : "Saine" },
    { label: "Résultat", valeur: resultat, niveau: resultat < -5 ? "rouge" : resultat < 0 ? "orange" : "vert", hint: resultat < 0 ? "Déficit" : resultat === 0 ? "Équilibre" : "Bénéfice" },
    { label: "Capitaux", valeur: capitaux, niveau: capitaux <= 0 ? "rouge" : capitaux < 5 ? "orange" : "vert", hint: capitaux <= 0 ? "⚠️ Faillite" : capitaux < 5 ? "Fragilisés" : "Solides" },
  ] as const;

  return (
    <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-2.5">
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Santé financière</p>
      <div className="grid grid-cols-3 gap-1">
        {indicateurs.map(({ label, valeur, niveau, hint }) => {
          const c = COULEUR[niveau];
          return (
            <div key={label} className={`rounded-lg border p-1.5 text-center ${c.bg}`}>
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
              </div>
              <div className={`text-sm font-black leading-none ${c.text}`}>{valeur > 0 ? `+${valeur}` : valeur}</div>
              <div className="text-[8px] text-gray-500 mt-0.5 truncate">{hint}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: number; tour: number; etape: number; joueurNom: string; titre: string;
  entries: Array<{ poste: string; delta: number; applied?: boolean }>;
  principe: string;
}

interface LeftPanelProps {
  etapeTour: number; tourActuel: number; nbToursMax: number;
  joueur: Joueur; activeStep: ActiveStep | null;
  onApplyEntry: (id: string) => void;
  onConfirmStep: () => void; onCancelStep: () => void;
  onApplyEntryEffect?: (poste: string) => void;
  achatQte: number; setAchatQte: (val: number) => void;
  achatMode: "tresorerie" | "dettes"; setAchatMode: (val: "tresorerie" | "dettes") => void;
  onLaunchAchat: () => void; onSkipAchat: () => void;
  showCartes: boolean; setShowCartes: (val: boolean) => void;
  selectedDecision: CarteDecision | null; setSelectedDecision: (val: CarteDecision | null) => void;
  cartesDisponibles: CarteDecision[];
  onLaunchDecision: () => void; onSkipDecision: () => void;
  decisionError: string | null;
  onLaunchStep: () => void;
  journal: JournalEntry[];
  subEtape6?: "recrutement" | "investissement";
  modeRapide?: boolean; setModeRapide?: (val: boolean) => void;
  modalEtapeEnAttente?: number | null;
  onCloseModal?: () => void;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function LeftPanel({
  etapeTour, tourActuel, nbToursMax, joueur, activeStep,
  onApplyEntry, onConfirmStep, onCancelStep, onApplyEntryEffect,
  achatQte, setAchatQte, achatMode, setAchatMode, onLaunchAchat, onSkipAchat,
  showCartes, setShowCartes, selectedDecision, setSelectedDecision,
  cartesDisponibles, onLaunchDecision, onSkipDecision, decisionError,
  onLaunchStep, journal,
  subEtape6 = "recrutement", modeRapide = false, setModeRapide,
  modalEtapeEnAttente = null, onCloseModal,
}: LeftPanelProps) {
  const [showJournal, setShowJournal] = useState(false);
  const isLocked = modalEtapeEnAttente !== null;
  // currentEtape = étape dont on affiche la carte (toujours etapeTour, même après dismiss)
  const cardEtape = etapeTour;

  // ── Branch : formulaire de saisie actif ──────────────────────────────────
  if (activeStep) {
    return (
      <aside className="w-80 shrink-0 flex flex-col gap-3 p-3 border-r border-gray-700 bg-gray-900 overflow-y-auto">
        <ProgressStrip etapeTour={etapeTour} tourActuel={tourActuel} nbToursMax={nbToursMax} />

        {/* Carte pédagogique — toujours visible, verrouillée si nouvelle étape */}
        <PedagoCard
          key={etapeTour}
          etape={cardEtape}
          isLocked={isLocked}
          onUnlock={onCloseModal}
        />

        {/* Formulaire : bloqué si carte pas lue */}
        <div className={`relative transition-opacity duration-200 ${isLocked ? "opacity-40 pointer-events-none select-none" : ""}`}>
          {isLocked && (
            <div className="absolute inset-0 z-10 rounded-xl flex items-center justify-center pointer-events-none">
              <div className="text-center bg-gray-950/80 rounded-xl px-3 py-2 border border-amber-700/40">
                <p className="text-xs font-bold text-amber-300">🔒 Lis d&apos;abord la carte ci-dessus</p>
              </div>
            </div>
          )}
          <EntryPanel
            activeStep={activeStep}
            displayJoueur={joueur}
            onApply={onApplyEntry}
            onApplyEntry={onApplyEntryEffect}
            onConfirm={onConfirmStep}
            onCancel={onCancelStep}
          />
        </div>
      </aside>
    );
  }

  // ── Branch : panneau d'action (pas de saisie en cours) ───────────────────
  return (
    <aside className="w-80 shrink-0 flex flex-col gap-3 p-3 border-r border-gray-700 bg-gray-900 overflow-y-auto">

      {/* 1. Progression */}
      <ProgressStrip etapeTour={etapeTour} tourActuel={tourActuel} nbToursMax={nbToursMax} />

      {/* 2. Santé financière */}
      <SanteFinanciere joueur={joueur} />

      {/* 3. Carte pédagogique — toujours présente */}
      <PedagoCard
        key={etapeTour}
        etape={cardEtape}
        isLocked={isLocked}
        onUnlock={onCloseModal}
      />

      {/* 4. Panneau d'action : bloqué si carte pas lue */}
      <div className={`relative transition-opacity duration-200 ${isLocked ? "opacity-40 pointer-events-none select-none" : ""}`}>
        {isLocked && (
          <div className="absolute inset-0 z-10 rounded-2xl flex items-center justify-center pointer-events-none">
            <div className="text-center bg-gray-950/80 rounded-xl px-3 py-2 border border-amber-700/40">
              <p className="text-xs font-bold text-amber-300">🔒 Lis d&apos;abord la carte ci-dessus</p>
              <p className="text-[10px] text-gray-400 mt-0.5">puis clique sur ✅ J&apos;ai compris</p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-3 shadow-sm">

          {/* ── ÉTAPE 1 : Achats ── */}
          {etapeTour === 1 && (
            <div className="space-y-3">
              <div className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <span>📦</span><span>Achats de marchandises</span>
              </div>
              <button
                onClick={onLaunchAchat}
                disabled={achatQte === 0}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-40 text-white text-sm py-3 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
              >
                📝 Exécuter & Comprendre
              </button>
              {achatQte === 0 && (
                <p className="text-[10px] text-gray-500 text-center -mt-1">Choisis une quantité pour activer</p>
              )}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">Quantité :</label>
                <input
                  type="number" min={0} max={10} value={achatQte}
                  onChange={(e) => setAchatQte(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 border border-indigo-700 rounded-lg px-2 py-1 text-center text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-gray-800 text-gray-100"
                />
              </div>
              <div className="flex gap-2">
                {(["tresorerie", "dettes"] as const).map((m) => (
                  <button key={m} onClick={() => setAchatMode(m)}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${achatMode === m ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                  >
                    {m === "tresorerie" ? "💵 Comptant" : "📋 À crédit"}
                  </button>
                ))}
              </div>
              <button onClick={onSkipAchat} className="w-full bg-gray-700 hover:bg-gray-600 text-gray-400 text-sm py-2 rounded-xl font-medium transition-colors">
                Passer cette étape
              </button>
            </div>
          )}

          {/* ── ÉTAPE 6 : Cartes Décision ── */}
          {etapeTour === 6 && (
            <div className="space-y-2">
              <div className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <span>{subEtape6 === "recrutement" ? "🧑‍💼" : "💡"}</span>
                <span>{subEtape6 === "recrutement" ? "6a — Recrutement (optionnel)" : "6b — Investissement (optionnel)"}</span>
              </div>
              <button onClick={() => setShowCartes(!showCartes)}
                className="w-full bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-sm py-2 rounded-xl font-medium transition-colors border border-indigo-700"
              >
                {showCartes ? "▲ Masquer" : "▼ Voir les cartes"}
              </button>
              {decisionError && (
                <div className="bg-red-950/40 border border-red-700 text-red-300 rounded-xl px-3 py-2 text-xs font-semibold">❌ {decisionError}</div>
              )}
              {selectedDecision && (
                <button onClick={onLaunchDecision}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white text-sm py-2 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
                >
                  📝 Exécuter & Comprendre : {selectedDecision.titre}
                </button>
              )}
              <button onClick={onSkipDecision} className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-2 rounded-xl font-medium transition-colors">
                {subEtape6 === "recrutement" ? "⏭️ Passer le recrutement → Investissement" : "⏭️ Passer (aucun investissement)"}
              </button>
            </div>
          )}

          {/* ── AUTRES ÉTAPES ── */}
          {etapeTour !== 1 && etapeTour !== 6 && (
            <div className="space-y-2">
              {/* Clients étape 4 */}
              {etapeTour === 4 && joueur.clientsATrait.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">🤝 Clients à traiter ce tour</div>
                  {joueur.clientsATrait.map((client, i) => {
                    const colorCls = client.delaiPaiement === 0
                      ? "border-green-700 bg-green-950/30 text-green-300"
                      : client.delaiPaiement === 1
                        ? "border-blue-700 bg-blue-950/30 text-blue-300"
                        : "border-purple-700 bg-purple-950/30 text-purple-300";
                    return (
                      <div key={i} className={`rounded-xl border-2 overflow-hidden mb-1.5 ${colorCls}`}>
                        <div className="px-2.5 pt-2 pb-1 flex items-center justify-between">
                          <div className="font-bold text-sm">{client.titre}</div>
                          <div className="text-right">
                            <div className="font-bold text-lg">+{client.montantVentes}</div>
                            <div className="text-[10px] opacity-60 font-medium -mt-0.5">chiffre d&apos;affaires</div>
                          </div>
                        </div>
                        <div className="px-2.5 pb-2 space-y-0.5">
                          <div className="text-xs font-semibold">
                            {client.delaiPaiement === 0 ? "💵 Encaissé immédiatement" : client.delaiPaiement === 1 ? "⏰ Encaissé dans 1 trimestre" : "⏰⏰ Encaissé dans 2 trimestres"}
                          </div>
                          <div className="text-[10px] opacity-50 mt-0.5 pt-0.5 border-t border-current border-opacity-20">
                            Génère 4 écritures : Ventes ↑ · Stocks ↓ · Coût des ventes ↑ · Trésorerie ou Créance ↑
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                onClick={onLaunchStep}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all active:scale-95"
              >
                📝 Exécuter & Comprendre cette étape
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Mode Rapide */}
      {tourActuel >= 3 && setModeRapide && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="text-xs font-bold text-gray-300">Mode Accéléré</span>
            </div>
            <button
              onClick={() => setModeRapide(!modeRapide)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${modeRapide ? "bg-amber-600" : "bg-gray-600"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${modeRapide ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <p className="text-[10px] text-gray-500 leading-tight">
            {modeRapide ? "✅ Actif — Les étapes auto seront pré-cochées. Tu valides d'un clic." : "Mode normal — coche chaque écriture une par une."}
          </p>
        </div>
      )}

      {/* 6. Journal comptable */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-3">
        <button
          onClick={() => setShowJournal(!showJournal)}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
        >
          <span>📖 Journal comptable ({journal.length})</span>
          <span className="text-lg">{showJournal ? "▲" : "▼"}</span>
        </button>
        {showJournal && (
          <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
            {journal.length === 0 ? (
              <p className="text-xs text-gray-300 italic">Aucune opération encore</p>
            ) : (
              journal.map((e) => (
                <div key={e.id} className="bg-gray-900 rounded-lg p-2 border border-gray-700 text-xs space-y-1">
                  <div className="font-bold text-indigo-400">{e.joueurNom} — Tour {e.tour}, Étape {e.etape + 1}</div>
                  <div className="text-gray-500 text-xs">{e.titre}</div>
                  {e.entries.filter((en) => en.applied !== false || e.entries.length === 0).map((en, i) => {
                    const doc = getDocument(en.poste);
                    return (
                      <div key={i} className={`flex items-center justify-between text-xs gap-2 ${en.delta > 0 ? "text-blue-600" : "text-orange-600"}`}>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="truncate">{nomCompte(en.poste)}</span>
                          <span className={`shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded-full ${doc.badge}`}>{doc.detail || doc.label}</span>
                        </div>
                        <span className="shrink-0 font-bold">{en.delta > 0 ? "+" : ""}{en.delta}</span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
