"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EtatJeu, CarteDecision } from "@/lib/game-engine/types";
import {
  initialiserJeu, avancerEtape, appliquerEtape0, appliquerAchatMarchandises,
  appliquerAvancementCreances, appliquerPaiementCommerciaux, appliquerCarteClient,
  appliquerEffetsRecurrents, tirerCartesDecision, acheterCarteDecision,
  appliquerCarteEvenement, verifierFinTour, cloturerAnnee, genererClientsParCommerciaux,
  obtenirCarteRecrutement, demanderEmprunt, ResultatFinTour, calculerCapaciteLogistique,
} from "@/lib/game-engine/engine";
import {
  calculerScore, getTresorerie, calculerIndicateurs, calculerSIGSimplifie,
  getTotalStocks,
} from "@/lib/game-engine/calculators";
import {
  HeaderJeu, LeftPanel, MainContent,
  OverlayTransition, OverlayFaillite,
  SetupScreen, CompanyIntro,
  type PlayerSetup, type ActiveStep,
  getSens, getPosteValue, applyDeltaToJoueur,
} from "@/components/jeu";
import { tirerQuestionsTrimestriel, QuestionQCM } from "@/lib/game-engine/data/pedagogie";
import { ResultatDemandePret, MONTANTS_EMPRUNT } from "@/lib/game-engine/types";
import { ImpactFlash } from "@/components/ImpactFlash";
// ── Nouveaux composants v2 — chargement dynamique (évite panic Turbopack) ────
const RightPanel = dynamic(() => import("@/components/jeu/RightPanel"), {
  ssr: false,
  loading: () => <div className="bg-gray-900 rounded-lg" />,
});
import { generatePedagogicalMessage, generateTensionAlert, type PedagogicalContext } from "@/components/jeu/pedagogicalMessages";
import AlerteDecouvert from "@/components/jeu/AlerteDecouvert";
import { useGameSession } from "./hooks/useGameSession";
import { usePedagogy } from "./hooks/usePedagogy";

// ─── UTILITAIRE ───────────────────────────────────────────────────────────────

function cloneEtat(e: EtatJeu): EtatJeu { return JSON.parse(JSON.stringify(e)); }

// ─── TYPE LOCAL ───────────────────────────────────────────────────────────────

interface JournalEntry {
  id: number;
  tour: number;
  etape: number;
  joueurNom: string;
  titre: string;
  entries: Array<{ poste: string; delta: number; applied?: boolean }>;
  principe: string;
}

// ─── INFO ÉTAPES ──────────────────────────────────────────────────────────────

// Importe les infos pédagogiques depuis le fichier partagé (une seule source de vérité)
import { ETAPE_INFO } from "./etape-info";

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function JeuPage() {
  type Phase = "setup" | "intro" | "playing" | "gameover";

  const [phase, setPhase]                 = useState<Phase>("setup");
  const [etat, setEtat]                   = useState<EtatJeu | null>(null);
  const [activeStep, setActiveStep]       = useState<ActiveStep | null>(null);
  const [journal, setJournal]             = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab]         = useState<"bilan" | "cr" | "indicateurs" | "glossaire" | "vue-ensemble" | "impact">("bilan");
  const [highlightedPoste, setHighlightedPoste] = useState<string | null>(null);
  const [recentModifications, setRecentModifications] = useState<Array<{
    poste: string; ancienneValeur: number; nouvelleValeur: number;
  }>>([]);
  const [achatQte, setAchatQte]           = useState(2);
  const [achatMode, setAchatMode]         = useState<"tresorerie" | "dettes">("tresorerie");
  const [selectedDecision, setSelectedDecision] = useState<CarteDecision | null>(null);
  const [showCartes, setShowCartes]       = useState(false);
  const [tourTransition, setTourTransition] = useState<{ from: number; to: number } | null>(null);
  const [failliteInfo, setFailliteInfo]   = useState<{ joueurNom: string; raison: string } | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Sous-étape 6 : recrutement commercial (6a) puis carte décision/investissement (6b)
  const [subEtape6, setSubEtape6] = useState<"recrutement" | "investissement">("recrutement");
  // Mode Rapide : les étapes automatiques (0,2,3,4,5) pré-cochent toutes leurs écritures
  const [modeRapide, setModeRapide] = useState(false);

  // ─ Pédagogie : modal d'explication + QCM fin de trimestre ──────────────────
  const {
    modalEtapeEnAttente,
    qcmTrimestreQuestions,
    setQcmTrimestreQuestions,
    qcmTrimestreScore,
    setQcmTrimestreScore,
    markEtapeVuAndShow,
    clearModal,
  } = usePedagogy();

  const [flashData, setFlashData] = useState<{ poste: string; avant: number; apres: number } | null>(null);

  // ── Nouveaux states v2 : panneau droit ──────────────────────────────────
  const [rightTab, setRightTab] = useState<"resume" | "bilan" | "cr">("resume");

  // ─ Emprunt bancaire ───────────────────────────────────────────────────────
  const [showDemandeEmprunt, setShowDemandeEmprunt] = useState(false);
  const [montantEmpruntChoisi, setMontantEmpruntChoisi] = useState<number>(MONTANTS_EMPRUNT[1]);
  const [reponseEmprunt, setReponseEmprunt] = useState<ResultatDemandePret | null>(null);

  const {
    roomCode, isSolo, savedToDb, setSavedToDb,
    soloLoading, soloError, setSoloError, createSoloSession
  } = useGameSession(phase, etat);

  // Auto-ouvre les cartes dès que le joueur arrive à l'étape 6
  useEffect(() => {
    if (etat?.etapeTour === 6 && !activeStep) {
      setShowCartes(true);
    }
  }, [etat?.etapeTour, subEtape6, activeStep]);

  // ─ Joueur affiché (avec écritures partiellement appliquées si étape active) ─
  function getDisplayJoueur() {
    if (!etat) return null;
    if (!activeStep) return etat.joueurs[etat.joueurActif];
    const cloned = cloneEtat(activeStep.baseEtat);
    const j = cloned.joueurs[etat.joueurActif];
    for (const entry of activeStep.entries.filter(e => e.applied)) {
      applyDeltaToJoueur(j, entry.poste, entry.delta);
    }
    return j;
  }

  // ─ Journal ────────────────────────────────────────────────────────────────
  function addToJournal(e: EtatJeu, entries: ActiveStep["entries"], etape: number) {
    const info = ETAPE_INFO[etape];
    setJournal(prev => [{
      id: prev.length + 1,
      tour: e.tourActuel,
      etape,
      joueurNom: e.joueurs[e.joueurActif].pseudo,
      titre: info?.titre ?? `Étape ${etape}`,
      entries,
      principe: info?.principe ?? "",
    }, ...prev.slice(0, 29)]);
  }

  // ─ Auto-switch onglet + surlignage au clic sur une écriture ──────────────
  function handleApplyEntry(poste: string) {
    const mod = recentModifications.find((m) => m.poste === poste);
    if (mod) {
      setFlashData({ poste, avant: mod.ancienneValeur, apres: mod.nouvelleValeur });
    }
    // L'onglet "impact" est désormais géré par le useEffect dans MainContent.
    // On garde setHighlightedPoste pour l'auto-scroll dans Bilan/CR quand le joueur change d'onglet.
    setHighlightedPoste(poste);
    setTimeout(() => setHighlightedPoste(null), 5000);
  }

  // ─ Démarrer une partie ────────────────────────────────────────────────────
  async function handleStart(players: PlayerSetup[], nbTours: number = 6) {
    const success = await createSoloSession(nbTours);
    if (!success) return;

    const joueursDefs = players.map(p => ({ pseudo: p.pseudo, nomEntreprise: p.entreprise }));
    setEtat(initialiserJeu(joueursDefs, nbTours));
    setPhase("intro");
  }

  // ─ Construire l'étape active à partir des modifications du moteur ─────────
  function buildActiveStep(
    baseEtat: EtatJeu,
    mods: Array<{ joueurId: number; poste: string; ancienneValeur: number; nouvelleValeur: number; explication: string }>,
    previewEtat: EtatJeu,
    etape: number,
    override?: { titre?: string; icone?: string; description?: string },
  ): ActiveStep {
    const info = ETAPE_INFO[etape];
    const entries = mods
      .filter(m => m.nouvelleValeur !== m.ancienneValeur)
      .map((m, i) => ({
        id: `e${i}`,
        poste: m.poste,
        delta: m.nouvelleValeur - m.ancienneValeur,
        description: m.explication,
        applied: false,
        sens: getSens(m.poste, m.nouvelleValeur - m.ancienneValeur) as "debit" | "credit",
      }));
    return {
      titre:       override?.titre       ?? info.titre,
      icone:       override?.icone       ?? info.icone,
      description: override?.description ?? info.description,
      principe:    info.principe,
      conseil:     info.conseil,
      entries,
      baseEtat: cloneEtat(baseEtat),
      previewEtat,
    };
  }

  // ─ Appliquer une écriture (côté UI) ─────────────────────────────────────
  function applyEntry(entryId: string) {
    setActiveStep(prev =>
      prev ? { ...prev, entries: prev.entries.map(e => e.id === entryId ? { ...e, applied: true } : e) } : null
    );
  }

  // ─ Valider l'étape (toutes écritures cochées + bilan équilibré) ──────────
  function confirmActiveStep() {
    if (!activeStep || !etat) return;
    const next = activeStep.previewEtat;
    addToJournal(next, activeStep.entries, next.etapeTour);
    const etapeAvantAvancement = next.etapeTour;

    // Sous-étape 6a (recrutement) → passer à 6b (investissement) sans avancer à l'étape 7
    if (etapeAvantAvancement === 6 && subEtape6 === "recrutement") {
      setSubEtape6("investissement");
      setEtat({ ...next });
      setActiveStep(null);
      setRecentModifications([]);
      setSelectedDecision(null);
      setShowCartes(false);
      return;
    }

    avancerEtape(next);
    // Montrer la modal de la PROCHAINE étape dans le MÊME batch que setEtat+setActiveStep(null)
    // → la modal s'affiche dès le 1er rendu de la nouvelle étape (avant que l'utilisateur
    //   puisse cliquer sur quoi que ce soit dans le LeftPanel)
    const prochEtape = next.etapeTour;
    markEtapeVuAndShow(prochEtape);
    setEtat({ ...next });
    setActiveStep(null);
    setRecentModifications([]);
    // Réinitialiser la sous-étape après la validation de l'investissement (6b)
    if (etapeAvantAvancement === 6) setSubEtape6("recrutement");

    // ── Message pédagogique automatique après validation ──
    const nextJoueur = next.joueurs[next.joueurActif];
    const nextSig = calculerSIGSimplifie(nextJoueur);
    const nextIndic = calculerIndicateurs(nextJoueur);
    const ctx: PedagogicalContext = {
      tour: next.tourActuel, etape: next.etapeTour,
      resultatNet: nextSig.resultatNet, tresorerie: nextSig.tresorerie,
      bfr: nextIndic.besoinFondsRoulement,
      creancesPlus1: nextJoueur.bilan.creancesPlus1,
      creancesPlus2: nextJoueur.bilan.creancesPlus2,
      ca: nextSig.ca, stocks: getTotalStocks(nextJoueur),
      nbCommerciaux: nextJoueur.cartesActives?.filter(
        (c: { categorie?: string }) => c.categorie === "commercial"
      ).length ?? 0,
      decouvert: nextJoueur.bilan.decouvert,
    };
    generatePedagogicalMessage(ctx); // Message is no longer displayed with CenterPanel removed
  }

  // ─ Lancer la prévisualisation d'une étape automatique ────────────────────
  function launchStep() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const idx = next.joueurActif;
    let mods: Array<{ joueurId: number; poste: string; ancienneValeur: number; nouvelleValeur: number; explication: string }> = [];
    let evenementCapture: { titre: string; icone?: string; description: string } | undefined;

    // Réinitialiser clientsPerdusCeTour au début de chaque tour (étape 0)
    if (next.etapeTour === 0) {
      next.joueurs[idx].clientsPerdusCeTour = 0;
    }

    switch (next.etapeTour) {
      case 0: { const r = appliquerEtape0(next, idx); if (r.succes) mods = r.modifications; break; }
      case 2: { const r = appliquerAvancementCreances(next, idx); if (r.succes) mods = r.modifications; break; }
      case 3: {
        const clients = genererClientsParCommerciaux(next.joueurs[idx]);
        next.joueurs[idx].clientsATrait = [...next.joueurs[idx].clientsATrait, ...clients];
        const r = appliquerPaiementCommerciaux(next, idx);
        if (r.succes) mods = r.modifications;
        break;
      }
      case 4: {
        const joueur = next.joueurs[idx];
        const capacite = calculerCapaciteLogistique(joueur);
        const clientsAtrait = joueur.clientsATrait;
        let clientsPerdusPrise = 0;

        // Trier par rentabilité : Grand Compte (delaiPaiement 2) > TPE (1) > Particulier (0)
        clientsAtrait.sort((a, b) => {
          const rentabilitéA = b.delaiPaiement - a.delaiPaiement; // Plus haut d'abord
          if (rentabilitéA !== 0) return rentabilitéA;
          return b.montantVentes - a.montantVentes; // Puis par montant
        });

        // Traiter les clients jusqu'à atteindre la capacité
        const clientsTraites = clientsAtrait.slice(0, capacite);
        const clientsPerdus = clientsAtrait.slice(capacite);

        for (const c of clientsTraites) {
          const r = appliquerCarteClient(next, idx, c);
          if (r.succes) mods = [...mods, ...r.modifications];
        }

        clientsPerdusPrise = clientsPerdus.length;
        joueur.clientsPerdusCeTour = clientsPerdusPrise;
        joueur.clientsATrait = [];

        // Ajouter un message d'alerte si clients perdus
        if (clientsPerdusPrise > 0) {
          mods.push({
            joueurId: joueur.id,
            poste: "ventes",
            ancienneValeur: 0,
            nouvelleValeur: 0,
            explication: `⚠️ Capacité logistique dépassée ! ${clientsPerdusPrise} client(s) perdu(s) faute de capacité (max ${capacite}, ${clientsAtrait.length} en attente).`,
          });
        }
        break;
      }
      case 5: { const r = appliquerEffetsRecurrents(next, idx); if (r.succes) mods = r.modifications; break; }
      case 7: {
        if (next.piocheEvenements.length > 0) {
          const carte = next.piocheEvenements[0];
          evenementCapture = { titre: carte.titre, description: carte.description };
          const r = appliquerCarteEvenement(next, idx, carte);
          next.piocheEvenements = next.piocheEvenements.slice(1);
          if (r.succes) mods = r.modifications;
        }
        break;
      }
      case 8: { const fin = verifierFinTour(next, idx); confirmEndOfTurn(next, fin); return; }
      default: break;
    }
    // Auto-skip étapes vides : créances (2) sans créances, commerciaux (3) sans commercial
    const etapeActuelle = next.etapeTour;
    const modsFiltrees = mods.filter(m => m.nouvelleValeur !== m.ancienneValeur);
    if ((etapeActuelle === 2 || etapeActuelle === 3) && modsFiltrees.length === 0) {
      avancerEtape(next);
      const prochEtapeAuto = next.etapeTour;
      markEtapeVuAndShow(prochEtapeAuto);
      setEtat({ ...next });
      setActiveStep(null);
      return;
    }

    // Stocker les modifications pour affichage avant/après dans les panneaux
    setRecentModifications(modsFiltrees.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    // NB: recentModifications est effacé dans confirmActiveStep (persiste tant que la saisie est active)

    const AUTO_ETAPES = [0, 2, 3, 4, 5]; // étapes automatisables en mode rapide
    const step = buildActiveStep(etat, mods, next, next.etapeTour, evenementCapture);
    if (modeRapide && AUTO_ETAPES.includes(next.etapeTour)) {
      // Mode rapide : toutes les écritures pré-cochées, l'étudiant voit tout d'un coup
      setActiveStep({
        ...step,
        entries: step.entries.map(e => ({ ...e, applied: true })),
      });
    } else {
      setActiveStep(step);
    }
  }

  // ─ Fin de tour ────────────────────────────────────────────────────────────
  function confirmEndOfTurn(next: EtatJeu, fin: ResultatFinTour) {
    const idx = next.joueurActif;
    const joueurNom = next.joueurs[idx].pseudo;
    if (fin.enFaillite) next.joueurs[idx].elimine = true;

    const nextJoueurIdx = (idx + 1) % next.nbJoueurs;
    if (nextJoueurIdx === 0) {
      if (next.tourActuel >= next.nbToursMax) {
        setEtat(next);
        if (fin.enFaillite) setFailliteInfo({ joueurNom, raison: fin.raisonFaillite ?? "Situation financière irrécupérable" });
        setPhase("gameover");
        return;
      }
      if (fin.enFaillite) {
        setEtat({ ...next }); setActiveStep(null); setSelectedDecision(null); setShowCartes(false); setSubEtape6("recrutement");
        setFailliteInfo({ joueurNom, raison: fin.raisonFaillite ?? "Situation financière irrécupérable" });
        return;
      }
      const oldTour = next.tourActuel;
      if (oldTour % 4 === 0) cloturerAnnee(next);
      next.tourActuel = oldTour + 1;
      next.etapeTour = 0;
      next.joueurActif = 0;
      // Montrer la modal d'étape 0 au début de chaque nouveau tour (si pas encore vue)
      markEtapeVuAndShow(0);
      setEtat({ ...next }); setActiveStep(null); setSelectedDecision(null); setShowCartes(false); setSubEtape6("recrutement");
      // Tirer 4 questions QCM pour ce trimestre et les passer à l'overlay
      const questions = tirerQuestionsTrimestriel();
      setQcmTrimestreQuestions(questions);
      setQcmTrimestreScore(undefined);
      setTourTransition({ from: oldTour, to: next.tourActuel });
    } else {
      avancerEtape(next);
      next.joueurActif = nextJoueurIdx;
      next.etapeTour = 0;
      // Montrer la modal d'étape 0 pour le prochain joueur (si pas encore vue)
      markEtapeVuAndShow(0);
      setEtat({ ...next }); setActiveStep(null); setSelectedDecision(null); setShowCartes(false); setSubEtape6("recrutement");
    }
  }

  // ─ QCM trimestriel : bonus / malus ───────────────────────────────────────
  // PARTIE DOUBLE obligatoire : toute écriture sur le bilan (trésorerie) doit
  // avoir une contrepartie au CR pour que Actif = Passif + Capitaux + RésultatNet.
  //   Bonus → Débit Trésorerie (Actif ↑) / Crédit Revenus exceptionnels (CR Produits ↑)
  //   Malus → Débit Charges exceptionnelles (CR Charges ↑) / Crédit Trésorerie (Actif ↓)
  function handleQCMTermine(score: number) {
    if (!etat) return;
    setQcmTrimestreScore(score);

    const next = cloneEtat(etat);
    const joueurBonus = next.joueurs[next.joueurActif];
    const tresoActif = joueurBonus.bilan.actifs.find(a => a.categorie === "tresorerie");

    if (score === 4) {
      // Score parfait : +1 Trésorerie / +1 Revenus exceptionnels
      if (tresoActif) tresoActif.valeur += 1;
      joueurBonus.compteResultat.produits.revenusExceptionnels += 1;
      console.log("[QCM 4/4] Bonus +1 : Trésorerie +1 / Revenus exceptionnels +1 (partie double ✓)");
    } else if (score === 3) {
      // 3/4 : +1 Trésorerie / +1 Revenus exceptionnels
      if (tresoActif) tresoActif.valeur += 1;
      joueurBonus.compteResultat.produits.revenusExceptionnels += 1;
      console.log("[QCM 3/4] Bonus +1 : Trésorerie +1 / Revenus exceptionnels +1 (partie double ✓)");
    } else if (score < 2) {
      // 0 ou 1/4 : −1 Trésorerie / +1 Charges exceptionnelles
      if (tresoActif) tresoActif.valeur -= 1;
      joueurBonus.compteResultat.charges.chargesExceptionnelles += 1;
      console.log("[QCM <2] Malus −1 : Trésorerie −1 / Charges exceptionnelles +1 (partie double ✓)");
    }
    // score === 2 : neutre, aucune écriture

    setEtat({ ...next });
  }

  // ─ Emprunt bancaire ───────────────────────────────────────────────────────
  function handleDemanderEmprunt() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const { resultat, modifications } = demanderEmprunt(next, next.joueurActif, montantEmpruntChoisi);
    setReponseEmprunt(resultat);
    if (resultat.accepte) {
      setEtat({ ...next });
      // Ajouter au journal
      addToJournal(next, modifications.map((m, i) => ({
        id: `emprunt_${i}`,
        poste: m.poste,
        delta: m.nouvelleValeur - m.ancienneValeur,
        description: m.explication,
        applied: true,
        sens: m.nouvelleValeur - m.ancienneValeur > 0 ? "credit" as const : "debit" as const,
      })), 99);
    }
  }

  // ─ Achats de marchandises ─────────────────────────────────────────────────
  function launchAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const r = appliquerAchatMarchandises(next, next.joueurActif, achatQte, achatMode);
    if (!r.succes) return;
    setActiveStep(buildActiveStep(etat, r.modifications, next, 1));
  }

  function skipAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    const prochEtape = next.etapeTour;
    markEtapeVuAndShow(prochEtape);
    setEtat(next);
  }

  // ─ Cartes Décision ────────────────────────────────────────────────────────
  function launchDecision() {
    if (!etat || !selectedDecision) return;
    const next = cloneEtat(etat);
    const r = acheterCarteDecision(next, next.joueurActif, selectedDecision);
    if (!r.succes) {
      setDecisionError(r.messageErreur ?? "Impossible d'activer cette carte");
      return;
    }
    setDecisionError(null);
    let mods = r.modifications;

    // Cartes sans effets immédiats : appliquer les effets récurrents dès l'activation
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
    // Sous-étape 6a : passer le recrutement → aller directement à 6b (investissement)
    if (etat.etapeTour === 6 && subEtape6 === "recrutement") {
      setSubEtape6("investissement");
      setShowCartes(false);
      setSelectedDecision(null);
      setDecisionError(null);
      return;
    }
    // Sous-étape 6b : passer l'investissement → avancer à l'étape 7
    const next = cloneEtat(etat);
    avancerEtape(next);
    const prochEtape = next.etapeTour;
    markEtapeVuAndShow(prochEtape);
    setEtat(next);
    setShowCartes(false);
    setSelectedDecision(null);
    setDecisionError(null);
    setSubEtape6("recrutement"); // reset pour le prochain tour
  }

  // ─── RENDU ────────────────────────────────────────────────────────────────

  if (soloLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-6">
      <div className="text-5xl animate-bounce">🎮</div>
      <p className="text-gray-300 font-semibold text-lg">Création de votre session en cours…</p>
      <p className="text-gray-500 text-sm">1 crédit sera consommé</p>
    </div>
  );

  if (soloError) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4 p-8">
      <div className="text-5xl">⚠️</div>
      <p className="text-red-400 font-semibold text-lg text-center">{soloError}</p>
      <button
        onClick={() => setSoloError(null)}
        className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-colors"
      >
        Réessayer
      </button>
    </div>
  );

  if (phase === "setup") return <SetupScreen onStart={handleStart} />;
  if (phase === "intro" && etat) return (
    <CompanyIntro
      joueurs={etat.joueurs}
      onStart={() => {
        // Montrer la modal de l'étape 0 dans le MÊME batch que le passage en "playing"
        // → 1er rendu du jeu = modal déjà visible, jamais de flash des boutons d'action
        markEtapeVuAndShow(0);
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
        {failliteInfo && (
          <OverlayFaillite
            joueurNom={failliteInfo.joueurNom}
            raison={failliteInfo.raison}
            onRestart={() => { setPhase("setup"); setEtat(null); setJournal([]); setSavedToDb(false); setFailliteInfo(null); }}
            onContinue={() => setFailliteInfo(null)}
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
        {savedToDb && roomCode && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-6 py-3 text-green-700 text-sm font-medium flex items-center gap-2">
            <span>✅</span>
            <span>{isSolo ? "Résultats sauvegardés dans votre compte" : "Résultats sauvegardés dans le tableau de bord enseignant"}</span>
          </div>
        )}
        {!roomCode && (
          <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-6 py-3 text-indigo-700 text-sm flex items-center gap-2">
            <span>📊</span>
            <span>Partie enregistrée dans votre historique local —{" "}
              <Link href="/historique" className="font-semibold underline hover:text-indigo-900">voir mon historique</Link>
            </span>
          </div>
        )}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => { setPhase("setup"); setEtat(null); setJournal([]); setSavedToDb(false); }}
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

  const joueur        = etat.joueurs[etat.joueurActif];
  const displayJoueur = getDisplayJoueur() ?? joueur;
  const cartesDisponibles  = tirerCartesDecision(cloneEtat(etat), 4);
  const cartesRecrutement  = obtenirCarteRecrutement(cloneEtat(etat), etat.joueurActif);
  const etapeInfo     = ETAPE_INFO[etat.etapeTour];

  // ── Métriques v2 ──────────────────────────────────────────────
  const sig           = calculerSIGSimplifie(displayJoueur);
  const indicateurs   = calculerIndicateurs(displayJoueur);
  const nbCommerciaux = displayJoueur.cartesActives?.filter(
    (c: { categorie?: string }) => c.categorie === "commercial"
  ).length ?? 0;
  const nbCartesActives = displayJoueur.cartesActives?.length ?? 0;
  const pedaCtx: PedagogicalContext = {
    tour: etat.tourActuel, etape: etat.etapeTour,
    resultatNet: sig.resultatNet, tresorerie: sig.tresorerie,
    bfr: indicateurs.besoinFondsRoulement,
    creancesPlus1: displayJoueur.bilan.creancesPlus1,
    creancesPlus2: displayJoueur.bilan.creancesPlus2,
    ca: sig.ca, stocks: getTotalStocks(displayJoueur),
    nbCommerciaux, decouvert: displayJoueur.bilan.decouvert,
  };
  const tensionAlert = generateTensionAlert(pedaCtx);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ─── OVERLAY TRANSITION (fin de trimestre) ─── */}
      {tourTransition && (
        <OverlayTransition
          transitionInfo={tourTransition}
          joueurs={etat.joueurs}
          qcmQuestions={qcmTrimestreQuestions}
          qcmScore={qcmTrimestreScore}
          onQCMTermine={handleQCMTermine}
          onContinue={() => {
            setTourTransition(null);
            setQcmTrimestreQuestions(undefined);
            setQcmTrimestreScore(undefined);
          }}
        />
      )}

      {/* ─── MODAL EMPRUNT BANCAIRE ─── */}
      {showDemandeEmprunt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full border border-amber-600 p-6">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">🏦</div>
              <h2 className="text-xl font-black text-white">Demande de prêt bancaire</h2>
              <p className="text-sm text-gray-400 mt-1">Le banquier évalue votre situation financière</p>
            </div>

            {!reponseEmprunt ? (
              <>
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Montant souhaité
                  </label>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {MONTANTS_EMPRUNT.map(m => (
                      <button
                        key={m}
                        onClick={() => setMontantEmpruntChoisi(m)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                          montantEmpruntChoisi === m
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
                    onClick={() => { setShowDemandeEmprunt(false); setReponseEmprunt(null); }}
                    className="flex-1 py-2.5 border border-gray-600 rounded-xl text-gray-400 text-sm hover:bg-gray-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDemanderEmprunt}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
                  >
                    🏦 Soumettre la demande
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className={`rounded-2xl p-4 text-center border-2 ${
                  reponseEmprunt.accepte ? "bg-emerald-950/40 border-emerald-600" : "bg-red-950/40 border-red-600"
                }`}>
                  <div className="text-3xl mb-2">{reponseEmprunt.accepte ? "✅" : "❌"}</div>
                  <div className="text-lg font-black text-white mb-1">
                    {reponseEmprunt.accepte
                      ? `Prêt accordé : +${reponseEmprunt.montantAccorde} trésorerie`
                      : "Prêt refusé"}
                  </div>
                  <div className="text-xs text-gray-300">{reponseEmprunt.raison}</div>
                  {reponseEmprunt.accepte && reponseEmprunt.tauxMajore && (
                    <div className="mt-2 bg-amber-950/40 border border-amber-600 rounded-xl px-3 py-2 text-amber-300 text-xs">
                      ⚠️ Taux majoré (8%/an) appliqué — situation financière fragile
                    </div>
                  )}
                </div>
                <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
                  <span className="text-xs text-gray-400">Score bancaire : </span>
                  <span className={`text-sm font-black ${reponseEmprunt.score >= 65 ? "text-emerald-400" : reponseEmprunt.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                    {reponseEmprunt.score} / 100
                  </span>
                </div>
                <button
                  onClick={() => { setShowDemandeEmprunt(false); setReponseEmprunt(null); }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-sm transition-all"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {failliteInfo && (
        <OverlayFaillite
          joueurNom={failliteInfo.joueurNom}
          raison={failliteInfo.raison}
          onRestart={() => { setPhase("setup"); setEtat(null); setJournal([]); setFailliteInfo(null); }}
          onContinue={() => setFailliteInfo(null)}
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
            selectedDecision={selectedDecision}
            setSelectedDecision={setSelectedDecision}
            cartesDisponibles={cartesDisponibles}
            cartesRecrutement={cartesRecrutement}
            onSkipDecision={skipDecision}
            onLaunchDecision={launchDecision}
            decisionError={decisionError}
            onLaunchStep={launchStep}
            journal={journal}
            subEtape6={subEtape6}
            modeRapide={modeRapide}
            setModeRapide={setModeRapide}
            modalEtapeEnAttente={modalEtapeEnAttente}
            onCloseModal={clearModal}
            onDemanderEmprunt={() => { setReponseEmprunt(null); setShowDemandeEmprunt(true); }}
          />
        </div>

        {/* ── COLONNE CENTRALE : Contenu Principal ── */}
        <div className="order-2 min-w-0 xl:min-h-0">
          {/* Contenu existant : sélection cartes, onglets, écritures */}
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
            cartesRecrutement={cartesRecrutement}
            recentModifications={recentModifications}
            subEtape6={subEtape6}
            modeRapide={modeRapide}
            onSkipDecision={skipDecision}
            onLaunchDecision={launchDecision}
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
            highlightedPoste={highlightedPoste}
            activeTab={rightTab}
            setActiveTab={setRightTab}
          />
        </div>
      </div>

      <ImpactFlash
        data={flashData}
        onDone={() => setFlashData(null)}
      />
    </div>
  );
}
