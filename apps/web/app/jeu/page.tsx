"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  EtatJeu, MONTANTS_EMPRUNT, TrimSnapshot,
  calculerScore, calculerIndicateurs, calculerSIGSimplifie,
} from "@jedevienspatron/game-engine";
import {
  HeaderJeu, LeftPanel, MainContent,
  OverlayTransition, OverlayFaillite,
  SetupScreen, CompanyIntro,
} from "@/components/jeu";
import { ImpactFlash } from "@/components/ImpactFlash";
const RightPanel = dynamic(() => import("@/components/jeu/RightPanel"), {
  ssr: false,
  loading: () => <div className="bg-gray-900 rounded-lg" />,
});
import AlerteDecouvert from "@/components/jeu/AlerteDecouvert";

import { useGamePersistence } from "./hooks/useGamePersistence";
import { useGameUIState } from "./hooks/useGameUIState";
import { useGameFlow, type Phase, ETAPE_INFO } from "./hooks/useGameFlow";

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function JeuPage() {
  // phase et etat vivent ici car partagés entre persistence et flow
  const [phase, setPhase] = useState<Phase>("setup");
  const [etat, setEtat]   = useState<EtatJeu | null>(null);

  // Ref partagée : snapshots trimestriels (remplie par flow, lue par persistence)
  const snapshotsRef = useRef<TrimSnapshot[]>([]);

  // ── UI state (onglets, highlight, mode rapide, flash) ─────────────────────
  const ui = useGameUIState();

  // ── Persistence (room code, sauvegarde Supabase / localStorage) ───────────
  const persistence = useGamePersistence({ phase, etat, snapshotsRef });

  // ── Game flow (toute la logique de jeu + states associés) ─────────────────
  const flow = useGameFlow({
    phase, setPhase, etat, setEtat,
    modeRapide: ui.modeRapide,
    setActiveTab: ui.setActiveTab,
    setHighlightedPoste: ui.setHighlightedPoste,
    setFlashData: ui.setFlashData,
    createSoloSession: persistence.createSoloSession,
    roomCode: persistence.roomCode,
    customTemplates: persistence.customTemplates,
  });

  // Synchroniser la ref snapshots avec l'état du flow (pour persistence)
  snapshotsRef.current = flow.snapshots;

  // ─── EARLY RETURNS ──────────────────────────────────────────────────────────

  if (persistence.soloLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-6">
      <div className="text-5xl animate-bounce">🎮</div>
      <p className="text-gray-300 font-semibold text-lg">Création de votre session en cours…</p>
      <p className="text-gray-500 text-sm">1 crédit sera consommé</p>
    </div>
  );

  if (persistence.soloError) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4 p-8">
      <div className="text-5xl">⚠️</div>
      <p className="text-red-400 font-semibold text-lg text-center">{persistence.soloError}</p>
      <button
        onClick={() => persistence.setSoloError(null)}
        className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-colors"
      >
        Réessayer
      </button>
    </div>
  );

  if (phase === "setup") return <SetupScreen onStart={flow.handleStart} customTemplates={persistence.customTemplates} />;
  if (phase === "intro" && etat) return (
    <CompanyIntro
      joueurs={etat.joueurs}
      onStart={() => {
        if (!flow.etapesPedagoVues.has(0)) {
          flow.setModalEtapeEnAttente(0);
          flow.setEtapesPedagoVues(new Set(flow.etapesPedagoVues).add(0));
        }
        setPhase("playing");
      }}
    />
  );

  if (phase === "gameover" && etat) {
    const classement = [...etat.joueurs]
      .map(j => ({ ...j, score: calculerScore(j) }))
      .sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 to-purple-100">
        {flow.failliteInfo && (
          <OverlayFaillite
            joueurNom={flow.failliteInfo.joueurNom}
            raison={flow.failliteInfo.raison}
            onRestart={() => { setPhase("setup"); setEtat(null); flow.setJournal([]); persistence.setSavedToDb(false); flow.setFailliteInfo(null); }}
            onContinue={() => flow.setFailliteInfo(null)}
            canContinue={false}
          />
        )}
        <h2 className="text-4xl font-bold text-indigo-900 mb-2">🏁 Fin de partie !</h2>
        <div className="space-y-3 w-full max-w-md my-8">
          {classement.map((j, rank) => (
            <div key={j.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <span className="text-2xl">{["🥇", "🥈", "🥉", "4️⃣"][rank]}</span>
              <div className="flex-1">
                <div className="font-bold">{j.pseudo}</div>
                <div className="text-sm text-gray-400">{j.entreprise.nom}</div>
              </div>
              <div className={`text-2xl font-bold ${j.elimine ? "text-red-400 line-through" : "text-indigo-700"}`}>
                {j.elimine ? "💀" : j.score}
              </div>
            </div>
          ))}
        </div>
        {persistence.savedToDb && persistence.roomCode && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-6 py-3 text-green-700 text-sm font-medium flex items-center gap-2">
            <span>✅</span>
            <span>{persistence.isSolo ? "Résultats sauvegardés dans votre compte" : "Résultats sauvegardés dans le tableau de bord enseignant"}</span>
          </div>
        )}
        {!persistence.roomCode && (
          <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-6 py-3 text-indigo-700 text-sm flex items-center gap-2">
            <span>📊</span>
            <span>Partie enregistrée dans votre historique local —{" "}
              <Link href="/historique" className="font-semibold underline hover:text-indigo-900">voir mon historique</Link>
            </span>
          </div>
        )}
        <div className="flex gap-3 flex-wrap justify-center">
          {persistence.roomCode && (
            <Link
              href={`/rapport/${persistence.roomCode}`}
              className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-2xl shadow hover:bg-emerald-500 transition-colors"
            >
              📊 Voir le rapport pédagogique
            </Link>
          )}
          <button
            onClick={() => { setPhase("setup"); setEtat(null); flow.setJournal([]); persistence.setSavedToDb(false); }}
            className="bg-indigo-600 text-white font-bold px-10 py-3 rounded-2xl shadow"
          >
            🔄 Nouvelle partie
          </button>
          {!persistence.roomCode && (
            <Link
              href="/historique"
              className="bg-white border-2 border-indigo-300 text-indigo-700 font-bold px-6 py-3 rounded-2xl shadow hover:bg-indigo-50 transition-colors"
            >
              📊 Mon historique
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!etat) return null;

  const joueur        = etat.joueurs[etat.joueurActif];
  const displayJoueur = flow.getDisplayJoueur() ?? joueur;
  const etapeInfo     = ETAPE_INFO[etat.etapeTour];

  // ── Métriques v2 ──────────────────────────────────────────────
  const sig           = calculerSIGSimplifie(displayJoueur);
  const indicateurs   = calculerIndicateurs(displayJoueur);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ─── OVERLAY TRANSITION (fin de trimestre) ─── */}
      {flow.tourTransition && (
        <OverlayTransition
          transitionInfo={flow.tourTransition}
          joueurs={etat.joueurs}
          qcmQuestions={flow.qcmTrimestreQuestions}
          qcmScore={flow.qcmTrimestreScore}
          onQCMTermine={flow.handleQCMTermine}
          onContinue={() => {
            flow.setTourTransition(null);
            flow.setQcmTrimestreQuestions(undefined);
            flow.setQcmTrimestreScore(undefined);
          }}
        />
      )}

      {/* ─── MODAL EMPRUNT BANCAIRE ─── */}
      {flow.showDemandeEmprunt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full border border-amber-600 p-6">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">🏦</div>
              <h2 className="text-xl font-black text-white">Demande de prêt bancaire</h2>
              <p className="text-sm text-gray-400 mt-1">Le banquier évalue votre situation financière</p>
            </div>

            {!flow.reponseEmprunt ? (
              <>
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Montant souhaité
                  </label>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {MONTANTS_EMPRUNT.map(m => (
                      <button
                        key={m}
                        onClick={() => flow.setMontantEmpruntChoisi(m)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                          flow.montantEmpruntChoisi === m
                            ? "bg-amber-600 border-amber-400 text-white"
                            : "bg-gray-800 border-gray-600 text-gray-300 hover:border-amber-500"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-amber-950/40 border border-amber-800 rounded-xl p-3 mb-4 text-xs text-amber-300">
                  <p>📊 Le banquier analyse : solvabilité, résultat, trésorerie, taux d&apos;endettement, montant demandé.</p>
                  <p className="mt-1">✅ Score ≥ 65 → taux standard (5%/an) · Score 50-64 → taux majoré (8%/an) · Score &lt; 50 → refus</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { flow.setShowDemandeEmprunt(false); flow.setReponseEmprunt(null); }}
                    className="flex-1 py-2.5 border border-gray-600 rounded-xl text-gray-400 text-sm hover:bg-gray-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={flow.handleDemanderEmprunt}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
                  >
                    🏦 Soumettre la demande
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className={`rounded-2xl p-4 text-center border-2 ${
                  flow.reponseEmprunt.accepte ? "bg-emerald-950/40 border-emerald-600" : "bg-red-950/40 border-red-600"
                }`}>
                  <div className="text-3xl mb-2">{flow.reponseEmprunt.accepte ? "✅" : "❌"}</div>
                  <div className="text-lg font-black text-white mb-1">
                    {flow.reponseEmprunt.accepte
                      ? `Prêt accordé : +${flow.reponseEmprunt.montantAccorde} trésorerie`
                      : "Prêt refusé"}
                  </div>
                  <div className="text-xs text-gray-300">{flow.reponseEmprunt.raison}</div>
                  {flow.reponseEmprunt.accepte && flow.reponseEmprunt.tauxMajore && (
                    <div className="mt-2 bg-amber-950/40 border border-amber-600 rounded-xl px-3 py-2 text-amber-300 text-xs">
                      ⚠️ Taux majoré (8%/an) appliqué — situation financière fragile
                    </div>
                  )}
                </div>
                <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
                  <span className="text-xs text-gray-400">Score bancaire : </span>
                  <span className={`text-sm font-black ${flow.reponseEmprunt.score >= 65 ? "text-emerald-400" : flow.reponseEmprunt.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                    {flow.reponseEmprunt.score} / 100
                  </span>
                </div>
                <button
                  onClick={() => { flow.setShowDemandeEmprunt(false); flow.setReponseEmprunt(null); }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-sm transition-all"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {flow.failliteInfo && (
        <OverlayFaillite
          joueurNom={flow.failliteInfo.joueurNom}
          raison={flow.failliteInfo.raison}
          onRestart={() => { setPhase("setup"); setEtat(null); flow.setJournal([]); flow.setFailliteInfo(null); }}
          onContinue={() => flow.setFailliteInfo(null)}
          canContinue={true}
        />
      )}

      {/* ─── HEADER ─── */}
      <HeaderJeu
        joueurs={etat.joueurs}
        joueurActifIdx={etat.joueurActif}
        tourActuel={etat.tourActuel}
        nbToursMax={etat.nbToursMax}
        etapeTour={etat.etapeTour}
        etapeTitle={etapeInfo?.titre ?? ""}
      />

      {/* ─── ALERTE DÉCOUVERT BANCAIRE ─── */}
      <div className="px-4 py-2 sm:px-6">
        <AlerteDecouvert decouvert={displayJoueur.bilan.decouvert} />
      </div>

      {/* ─── CORPS RESPONSIVE : mobile empilé | laptop 2 colonnes | desktop 3 colonnes ─── */}
      <div className="grid flex-1 gap-4 px-4 pb-4 sm:px-6 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] xl:min-h-0 xl:grid-cols-[minmax(300px,25%)_minmax(420px,50%)_minmax(280px,25%)] xl:overflow-hidden">

        {/* ── COLONNE GAUCHE : Décisions & Actions ── */}
        <div className="order-1 min-w-0 xl:min-h-0">
          <LeftPanel
            etapeTour={etat.etapeTour}
            tourActuel={etat.tourActuel}
            nbToursMax={etat.nbToursMax}
            joueur={displayJoueur}
            activeStep={flow.activeStep}
            onApplyEntry={flow.applyEntry}
            onConfirmStep={flow.confirmActiveStep}
            onCancelStep={() => flow.setActiveStep(null)}
            onApplyEntryEffect={flow.handleApplyEntry}
            achatQte={flow.achatQte}
            setAchatQte={flow.setAchatQte}
            achatMode={flow.achatMode}
            setAchatMode={flow.setAchatMode}
            onLaunchAchat={flow.launchAchat}
            onSkipAchat={flow.skipAchat}
            selectedDecision={flow.selectedDecision}
            setSelectedDecision={flow.setSelectedDecision}
            cartesDisponibles={flow.cartesDisponibles}
            cartesRecrutement={flow.cartesRecrutement}
            onSkipDecision={flow.skipDecision}
            onLaunchDecision={flow.launchDecision}
            decisionError={flow.decisionError}
            onLaunchStep={flow.launchStep}
            journal={flow.journal}
            subEtape6={flow.subEtape6}
            modeRapide={ui.modeRapide}
            setModeRapide={ui.setModeRapide}
            modalEtapeEnAttente={flow.modalEtapeEnAttente}
            onCloseModal={() => flow.setModalEtapeEnAttente(null)}
            onDemanderEmprunt={() => { flow.setReponseEmprunt(null); flow.setShowDemandeEmprunt(true); }}
            onInvestirPersonnel={flow.handleInvestirPersonnel}
            onLicencierCommercial={flow.handleLicencierCommercial}
            onApplySaleGroup={flow.applySaleGroup}
          />
        </div>

        {/* ── COLONNE CENTRALE : Contenu Principal ── */}
        <div className="order-2 min-w-0 xl:min-h-0">
          <MainContent
            joueur={joueur}
            displayJoueur={displayJoueur}
            activeStep={flow.activeStep}
            highlightedPoste={ui.highlightedPoste}
            etapeTour={etat.etapeTour}
            activeTab={ui.activeTab}
            setActiveTab={ui.setActiveTab}
            showCartes={flow.showCartes}
            selectedDecision={flow.selectedDecision}
            setSelectedDecision={flow.setSelectedDecision}
            cartesDisponibles={flow.cartesDisponibles}
            cartesRecrutement={flow.cartesRecrutement}
            recentModifications={flow.effectiveRecentMods}
            subEtape6={flow.subEtape6}
            modeRapide={ui.modeRapide}
            onSkipDecision={flow.skipDecision}
            onLaunchDecision={flow.launchDecision}
            onInvestirPersonnel={flow.handleInvestirPersonnel}
            onVendreImmobilisation={flow.handleVendreImmobilisation}
          />
        </div>

        {/* ── COLONNE DROITE : Indicateurs & SIG ── */}
        <div className="order-3 flex min-w-0 flex-col gap-4 lg:col-span-2 xl:col-span-1 xl:min-h-0 xl:overflow-y-auto">
          <RightPanel
            joueur={displayJoueur}
            ca={sig.ca}
            marge={sig.marge}
            ebe={sig.ebe}
            resultatNet={sig.resultatNet}
            tresorerie={sig.tresorerie}
            bfr={indicateurs.besoinFondsRoulement}
            fondsRoulement={indicateurs.fondsDeRoulement}
            solvabilite={indicateurs.ratioSolvabilite}
            highlightedPoste={ui.highlightedPoste}
            activeTab={ui.rightTab}
            setActiveTab={ui.setRightTab}
          />
        </div>
      </div>

      <ImpactFlash
        data={ui.flashData}
        onDone={() => ui.setFlashData(null)}
      />
    </div>
  );
}
