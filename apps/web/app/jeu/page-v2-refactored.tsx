"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  EtatJeu,
  CarteDecision,
} from "@/lib/game-engine/types";
import {
  initialiserJeu,
  avancerEtape,
  appliquerEtape0,
  appliquerAchatMarchandises,
  appliquerAvancementCreances,
  appliquerPaiementCommerciaux,
  appliquerCarteClient,
  appliquerEffetsRecurrents,
  tirerCartesDecision,
  acheterCarteDecision,
  appliquerCarteEvenement,
  verifierFinTour,
  cloturerAnnee,
  genererClientsParCommerciaux,
  ResultatFinTour,
} from "@/lib/game-engine/engine";
import { calculerScore, getTresorerie } from "@/lib/game-engine/calculators";
import {
  HeaderJeu,
  LeftPanel,
  MainContent,
  OverlayTransition,
  OverlayFaillite,
  SetupScreen,
  CompanyIntro,
  type PlayerSetup,
  type ActiveStep,
  type EntryLine,
  getSens,
} from "@/components/jeu";
import { getPosteValue, applyDeltaToJoueur, cloneEtat, buildActiveStep } from "./page-v2-helpers";
import { ETAPE_INFO } from "./etape-info";

type Phase = "setup" | "intro" | "playing" | "gameover";
type TabType = "bilan" | "cr" | "indicateurs" | "glossaire";

interface JournalEntry {
  id: number;
  tour: number;
  etape: number;
  joueurNom: string;
  titre: string;
  entries: EntryLine[];
  principe: string;
}

/**
 * PAGE PRINCIPALE REFACTORISÉE
 * Logique métier inchangée, mais UI démontée en composants réutilisables
 */
export default function JeuPageRefactored() {
  // ──────────────────────────────────────────────────────────────────
  // État global
  // ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("setup");
  const [etat, setEtat] = useState<EtatJeu | null>(null);
  const [activeStep, setActiveStep] = useState<ActiveStep | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  // ──────────────────────────────────────────────────────────────────
  // État UI
  // ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>("bilan");
  const [highlightedPoste, setHighlightedPoste] = useState<string | null>(null);
  const [showJournal, setShowJournal] = useState(false);

  // ──────────────────────────────────────────────────────────────────
  // Overlays
  // ──────────────────────────────────────────────────────────────────
  const [tourTransition, setTourTransition] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [failliteInfo, setFailliteInfo] = useState<{
    joueurNom: string;
    raison: string;
  } | null>(null);

  // ──────────────────────────────────────────────────────────────────
  // Étape 1 : Achats
  // ──────────────────────────────────────────────────────────────────
  const [achatQte, setAchatQte] = useState(2);
  const [achatMode, setAchatMode] = useState<"tresorerie" | "dettes">(
    "tresorerie"
  );

  // ──────────────────────────────────────────────────────────────────
  // Étape 6 : Cartes Décision
  // ──────────────────────────────────────────────────────────────────
  const [selectedDecision, setSelectedDecision] = useState<CarteDecision | null>(
    null
  );
  const [showCartes, setShowCartes] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────────────
  // Sauvegarde DB (Supabase)
  // ──────────────────────────────────────────────────────────────────
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);

  // Lit le code de session depuis l'URL (?code=KIC-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) setRoomCode(code);
  }, []);

  // Sauvegarde historique solo dans localStorage
  useEffect(() => {
    if (phase !== "gameover" || !etat || roomCode) return;
    const j = etat.joueurs[0];
    const partie = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      pseudo: j.pseudo,
      entreprise: j.entreprise.nom,
      score: calculerScore(j),
      trimestresJoues: etat.tourActuel,
      faillite: j.elimine,
    };
    try {
      const existant = JSON.parse(
        localStorage.getItem("jdp_historique_solo") ?? "[]"
      );
      localStorage.setItem(
        "jdp_historique_solo",
        JSON.stringify([partie, ...existant].slice(0, 20))
      );
    } catch {
      // localStorage indisponible
    }
  }, [phase, etat, roomCode]);

  // Sauvegarde Supabase quand la partie est terminée
  useEffect(() => {
    if (phase !== "gameover" || !etat || !roomCode || savedToDb) return;
    const joueurs = etat.joueurs.map((j) => ({
      pseudo: j.pseudo,
      entreprise: j.entreprise.nom,
      scoreTotal: calculerScore(j),
      elimine: j.elimine,
      etatFinal: j,
    }));
    fetch("/api/sessions/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_code: roomCode, joueurs }),
    })
      .then(() => {
        setSavedToDb(true);
      })
      .catch((err) => console.error("Erreur save résultats:", err));
  }, [phase, etat, roomCode, savedToDb]);

  // ──────────────────────────────────────────────────────────────────
  // Joueur affiché (avec écritures partiellement appliquées)
  // ──────────────────────────────────────────────────────────────────
  function getDisplayJoueur() {
    if (!etat) return null;
    if (!activeStep) return etat.joueurs[etat.joueurActif];

    const cloned = cloneEtat(activeStep.baseEtat);
    const j = cloned.joueurs[etat.joueurActif];

    for (const entry of activeStep.entries.filter((e) => e.applied)) {
      applyDeltaToJoueur(j, entry.poste, entry.delta);
    }
    return j;
  }

  // ──────────────────────────────────────────────────────────────────
  // Journal comptable
  // ──────────────────────────────────────────────────────────────────
  function addToJournal(
    e: EtatJeu,
    entries: EntryLine[],
    etape: number
  ) {
    const info = ETAPE_INFO[etape];
    setJournal((prev) => [
      {
        id: prev.length + 1,
        tour: e.tourActuel,
        etape,
        joueurNom: e.joueurs[e.joueurActif].pseudo,
        titre: info?.titre ?? `Étape ${etape}`,
        entries,
        principe: info?.principe ?? "",
      },
      ...prev.slice(0, 29),
    ]);
  }

  // ──────────────────────────────────────────────────────────────────
  // Auto-switch onglet + surlignage
  // ──────────────────────────────────────────────────────────────────
  function handleApplyEntry(poste: string) {
    // Logic from original code to switch tabs
    setHighlightedPoste(poste);
    setTimeout(() => setHighlightedPoste(null), 2000);
  }

  // ──────────────────────────────────────────────────────────────────
  // Démarrer une partie
  // ──────────────────────────────────────────────────────────────────
  function handleStart(players: PlayerSetup[], nbTours: number = 6) {
    const joueursDefs = players.map((p) => ({
      pseudo: p.pseudo,
      nomEntreprise: p.entreprise,
    }));
    const newEtat = initialiserJeu(joueursDefs, nbTours);
    setEtat(newEtat);
    setPhase("intro");
  }

  // ──────────────────────────────────────────────────────────────────
  // Appliquer une écriture
  // ──────────────────────────────────────────────────────────────────
  function applyEntry(entryId: string) {
    setActiveStep((prev) =>
      prev
        ? {
            ...prev,
            entries: prev.entries.map((e) =>
              e.id === entryId ? { ...e, applied: true } : e
            ),
          }
        : null
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Valider l'étape
  // ──────────────────────────────────────────────────────────────────
  function confirmActiveStep() {
    if (!activeStep || !etat) return;
    const next = activeStep.previewEtat;
    addToJournal(next, activeStep.entries, next.etapeTour);
    avancerEtape(next);
    setEtat({ ...next });
    setActiveStep(null);
  }

  // ──────────────────────────────────────────────────────────────────
  // Lancer l'étape
  // ──────────────────────────────────────────────────────────────────
  function launchStep() {
    if (!etat) return;

    const next = cloneEtat(etat);
    const idx = next.joueurActif;
    let mods: Array<{
      joueurId: number;
      poste: string;
      ancienneValeur: number;
      nouvelleValeur: number;
      explication: string;
    }> = [];
    let evenementCapture:
      | { titre: string; icone?: string; description: string }
      | undefined;

    // Logique d'exécution selon l'étape (inchangée du fichier original)
    switch (next.etapeTour) {
      case 0:
        {
          const r = appliquerEtape0(next, idx);
          if (r.succes) mods = r.modifications;
        }
        break;
      case 2:
        {
          const r = appliquerAvancementCreances(next, idx);
          if (r.succes) mods = r.modifications;
        }
        break;
      case 3:
        {
          const clients = genererClientsParCommerciaux(next.joueurs[idx]);
          next.joueurs[idx].clientsATrait = [
            ...next.joueurs[idx].clientsATrait,
            ...clients,
          ];
          const r = appliquerPaiementCommerciaux(next, idx);
          if (r.succes) mods = r.modifications;
        }
        break;
      case 4:
        {
          const cs = next.joueurs[idx].clientsATrait;
          for (const c of cs) {
            const r = appliquerCarteClient(next, idx, c);
            if (r.succes) mods = [...mods, ...r.modifications];
          }
          next.joueurs[idx].clientsATrait = [];
        }
        break;
      case 5:
        {
          const r = appliquerEffetsRecurrents(next, idx);
          if (r.succes) mods = r.modifications;
        }
        break;
      case 7:
        {
          if (next.piocheEvenements.length > 0) {
            const carte = next.piocheEvenements[0];
            evenementCapture = {
              titre: carte.titre,
              description: carte.description,
            };
            const r = appliquerCarteEvenement(next, idx, carte);
            next.piocheEvenements = next.piocheEvenements.slice(1);
            if (r.succes) mods = r.modifications;
          }
        }
        break;
      case 8:
        {
          const fin = verifierFinTour(next, idx);
          confirmEndOfTurn(next, fin);
          return;
        }
      default:
        break;
    }

    setActiveStep(
      buildActiveStep(etat, mods, next, next.etapeTour, evenementCapture)
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Fin de tour
  // ──────────────────────────────────────────────────────────────────
  function confirmEndOfTurn(next: EtatJeu, fin: ResultatFinTour) {
    const idx = next.joueurActif;
    const joueurNom = next.joueurs[idx].pseudo;

    // Marquer comme éliminé si faillite
    if (fin.enFaillite) {
      next.joueurs[idx].elimine = true;
    }

    const nextJoueurIdx = (idx + 1) % next.nbJoueurs;

    if (nextJoueurIdx === 0) {
      // Fin du tour
      if (next.tourActuel >= next.nbToursMax) {
        setEtat(next);
        if (fin.enFaillite) {
          setFailliteInfo({
            joueurNom,
            raison: fin.raisonFaillite ?? "Situation financière irrécupérable",
          });
        }
        setPhase("gameover");
        return;
      }

      // Faillite en cours de partie
      if (fin.enFaillite) {
        setEtat({ ...next });
        setActiveStep(null);
        setSelectedDecision(null);
        setShowCartes(false);
        setFailliteInfo({
          joueurNom,
          raison: fin.raisonFaillite ?? "Situation financière irrécupérable",
        });
        return;
      }

      const oldTour = next.tourActuel;

      // Clôture fiscale tous les 4 trimestres
      if (oldTour % 4 === 0) {
        cloturerAnnee(next);
      }

      next.tourActuel = oldTour + 1;
      next.etapeTour = 0;
      next.joueurActif = 0;

      setEtat({ ...next });
      setActiveStep(null);
      setSelectedDecision(null);
      setShowCartes(false);
      setTourTransition({ from: oldTour, to: next.tourActuel });
      return;
    } else {
      avancerEtape(next);
      next.joueurActif = nextJoueurIdx;
      next.etapeTour = 0;
    }

    setEtat(next);
    setActiveStep(null);
    setSelectedDecision(null);
    setShowCartes(false);
  }

  // ──────────────────────────────────────────────────────────────────
  // Achats de marchandises (étape 1)
  // ──────────────────────────────────────────────────────────────────
  function launchAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const r = appliquerAchatMarchandises(
      next,
      next.joueurActif,
      achatQte,
      achatMode
    );
    if (!r.succes) return;

    setActiveStep(buildActiveStep(etat, r.modifications, next, 1));
  }

  function skipAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    setEtat(next);
  }

  // ──────────────────────────────────────────────────────────────────
  // Cartes Décision (étape 6)
  // ──────────────────────────────────────────────────────────────────
  function launchDecision() {
    if (!etat || !selectedDecision) return;
    const next = cloneEtat(etat);
    const r = acheterCarteDecision(
      next,
      next.joueurActif,
      selectedDecision
    );

    if (!r.succes) {
      setDecisionError(r.messageErreur ?? "Impossible d'activer cette carte");
      return;
    }

    setDecisionError(null);

    let mods = r.modifications;

    // Cartes sans effets immédiats : appliquer les effets récurrents
    if (mods.length === 0 && selectedDecision.effetsRecurrents.length > 0) {
      const joueur = next.joueurs[next.joueurActif];
      const syntheticMods: typeof mods = [];

      for (const effet of selectedDecision.effetsRecurrents) {
        const ancienneValeur = getPosteValue(joueur, effet.poste);
        applyDeltaToJoueur(joueur, effet.poste, effet.delta);
        syntheticMods.push({
          joueurId: joueur.id,
          poste: effet.poste,
          ancienneValeur,
          nouvelleValeur: ancienneValeur + effet.delta,
          explication: `${selectedDecision.titre} — 1ʳᵉ activation (effet récurrent chaque trimestre)`,
        });
      }

      mods = syntheticMods;
    }

    setActiveStep(buildActiveStep(etat, mods, next, 6));
  }

  function skipDecision() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    setEtat(next);
    setShowCartes(false);
    setSelectedDecision(null);
    setDecisionError(null);
  }

  // ──────────────────────────────────────────────────────────────────
  // RENDU
  // ──────────────────────────────────────────────────────────────────

  if (phase === "setup") return <SetupScreen onStart={handleStart} />;

  if (phase === "intro" && etat)
    return (
      <CompanyIntro
        joueurs={etat.joueurs}
        onStart={() => setPhase("playing")}
      />
    );

  if (phase === "gameover" && etat) {
    const classement = [...etat.joueurs]
      .map((j) => ({ ...j, score: calculerScore(j) }))
      .sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 to-purple-100">
        <h2 className="text-4xl font-bold text-indigo-900 mb-2">🏁 Fin de partie !</h2>

        <div className="space-y-3 w-full max-w-md my-8">
          {classement.map((j, rank) => (
            <div
              key={j.id}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-indigo-100"
            >
              <span className="text-2xl">
                {["🥇", "🥈", "🥉", "4️⃣"][rank]}
              </span>
              <div className="flex-1">
                <div className="font-bold">{j.pseudo}</div>
                <div className="text-sm text-gray-400">{j.entreprise.nom}</div>
              </div>
              <div
                className={`text-2xl font-bold ${
                  j.elimine
                    ? "text-red-400 line-through"
                    : "text-indigo-700"
                }`}
              >
                {j.elimine ? "💀" : j.score}
              </div>
            </div>
          ))}
        </div>

        {savedToDb && roomCode && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-6 py-3 text-green-700 text-sm font-medium flex items-center gap-2">
            <span>✅</span>
            <span>Résultats sauvegardés dans le tableau de bord</span>
          </div>
        )}

        {!roomCode && (
          <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-6 py-3 text-indigo-700 text-sm flex items-center gap-2">
            <span>📊</span>
            <span>
              Partie enregistrée dans votre historique local —{" "}
              <Link href="/historique" className="font-semibold underline">
                voir mon historique
              </Link>
            </span>
          </div>
        )}

        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => {
              setPhase("setup");
              setEtat(null);
              setJournal([]);
              setSavedToDb(false);
            }}
            className="bg-indigo-600 text-white font-bold px-10 py-3 rounded-2xl shadow"
          >
            🔄 Nouvelle partie
          </button>
          {!roomCode && (
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

  const joueur = etat.joueurs[etat.joueurActif];
  const displayJoueur = getDisplayJoueur() ?? joueur;
  const cartesDisponibles = tirerCartesDecision(cloneEtat(etat), 4);
  const etapeInfo = ETAPE_INFO[etat.etapeTour];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Overlays */}
      {tourTransition && (
        <OverlayTransition
          transitionInfo={tourTransition}
          joueurs={etat.joueurs}
          onContinue={() => {
            setTourTransition(null);
          }}
        />
      )}

      {failliteInfo && (
        <OverlayFaillite
          joueurNom={failliteInfo.joueurNom}
          raison={failliteInfo.raison}
          onRestart={() => {
            setPhase("setup");
            setEtat(null);
            setJournal([]);
          }}
          onContinue={() => setFailliteInfo(null)}
          canContinue={etat.joueurs.filter((j) => !j.elimine).length > 0}
        />
      )}

      {/* En-tête */}
      <HeaderJeu
        joueurs={etat.joueurs}
        joueurActifIdx={etat.joueurActif}
        tourActuel={etat.tourActuel}
        nbToursMax={etat.nbToursMax}
        etapeTour={etat.etapeTour}
        etapeTitle={etapeInfo?.titre ?? ""}
      />

      {/* Contenu principal */}
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel
          etapeTour={etat.etapeTour}
          tourActuel={etat.tourActuel}
          nbToursMax={etat.nbToursMax}
          joueur={joueur}
          activeStep={activeStep}
          onApplyEntry={applyEntry}
          onConfirmStep={confirmActiveStep}
          onCancelStep={() => setActiveStep(null)}
          onApplyEntryEffect={handleApplyEntry}
          achatQte={achatQte}
          setAchatQte={setAchatQte}
          achatMode={achatMode}
          setAchatMode={setAchatMode}
          onLaunchAchat={launchAchat}
          onSkipAchat={skipAchat}
          showCartes={showCartes}
          setShowCartes={setShowCartes}
          selectedDecision={selectedDecision}
          setSelectedDecision={setSelectedDecision}
          cartesDisponibles={cartesDisponibles}
          onLaunchDecision={launchDecision}
          onSkipDecision={skipDecision}
          decisionError={decisionError}
          onLaunchStep={launchStep}
          journal={journal}
        />

        <MainContent
          joueur={joueur}
          displayJoueur={displayJoueur}
          activeStep={activeStep}
          highlightedPoste={highlightedPoste}
          etapeTour={etat.etapeTour}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showCartes={showCartes}
          selectedDecision={selectedDecision}
          setSelectedDecision={setSelectedDecision}
          cartesDisponibles={cartesDisponibles}
        />
      </div>
    </div>
  );
}
