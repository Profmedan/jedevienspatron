"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EtatJeu, CarteDecision } from "@/lib/game-engine/types";
import {
  initialiserJeu, avancerEtape, appliquerEtape0, appliquerAchatMarchandises,
  appliquerAvancementCreances, appliquerPaiementCommerciaux, appliquerCarteClient,
  appliquerEffetsRecurrents, tirerCartesDecision, acheterCarteDecision,
  appliquerCarteEvenement, verifierFinTour, cloturerAnnee, genererClientsParCommerciaux,
  obtenirCarteRecrutement, demanderEmprunt, ResultatFinTour,
} from "@/lib/game-engine/engine";
import {
  calculerScore, getTresorerie, calculerIndicateurs,
} from "@/lib/game-engine/calculators";
import {
  HeaderJeu, LeftPanel, MainContent,
  OverlayTransition, OverlayFaillite,
  SetupScreen, CompanyIntro,
  type PlayerSetup, type ActiveStep,
  getSens, getPosteValue, applyDeltaToJoueur,
  ACTIF_KEYS, PASSIF_KEYS, CHARGES_KEYS, PRODUITS_KEYS,
} from "@/components/jeu";
import { tirerQuestionsTrimestriel, QuestionQCM } from "@/lib/game-engine/data/pedagogie";
import { ResultatDemandePret, MONTANTS_EMPRUNT } from "@/lib/game-engine/types";

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

const ETAPE_INFO: Record<number, { icone: string; titre: string; description: string; principe: string; conseil: string }> = {
  0: {
    icone: "💼", titre: "Charges fixes & Dotation aux amortissements",
    description: "Chaque trimestre, ton entreprise paie ses charges fixes (loyer, énergie, assurances…) et constate l'usure de chaque bien immobilisé (-1 par bien). La dotation enregistrée = total des usures individuelles.",
    principe: "Charges fixes → DÉBIT Services extérieurs / CRÉDIT Trésorerie. Amortissements → DÉBIT Dotation aux amortissements (+N) / CRÉDIT Immobilisations nettes (−N). Règle PCG : Σ dotation = Σ amortissements individuels.",
    conseil: "⚠️ Ces charges sont OBLIGATOIRES. La dotation aux amortissements est une charge calculée : aucune sortie de trésorerie, mais elle réduit le résultat (et donc les capitaux propres à terme).",
  },
  1: {
    icone: "📦", titre: "Achats de marchandises",
    description: "Tu peux acheter des stocks pour les revendre. Choisis la quantité et le mode de paiement : comptant (trésorerie immédiate) ou à crédit (dette fournisseur D+1).",
    principe: "Comptant : DÉBIT Stocks / CRÉDIT Trésorerie. À crédit : DÉBIT Stocks / CRÉDIT Dettes fournisseurs. Dans les deux cas, l'Actif est modifié mais le Passif l'est aussi → équilibre maintenu.",
    conseil: "💡 Acheter à crédit préserve ta trésorerie aujourd'hui mais crée une dette à rembourser au prochain tour. C'est le mécanisme du délai fournisseur.",
  },
  2: {
    icone: "⏩", titre: "Avancement des créances clients",
    description: "Les clients règlent à échéance : les Créances C+2 deviennent C+1, et les Créances C+1 entrent en trésorerie.",
    principe: "Encaissement C+1 : DÉBIT Trésorerie / CRÉDIT Créances C+1. Avancement C+2→C+1 : DÉBIT Créances C+1 / CRÉDIT Créances C+2. Mouvement interne à l'Actif.",
    conseil: "💡 Un client Grand Compte paie en C+2 : la vente est faite aujourd'hui mais encaissée dans 2 trimestres. Attention au décalage de trésorerie !",
  },
  3: {
    icone: "👔", titre: "Paiement des commerciaux",
    description: "Si tu as recruté des commerciaux, leurs salaires sont versés ici (charges personnel ↑, trésorerie ↓) et ils génèrent de nouveaux clients. Sans commercial, cette étape est vide — c'est normal au T1 avant tout recrutement.",
    principe: "DÉBIT Charges de personnel / CRÉDIT Trésorerie. Les salaires sont une charge d'exploitation qui réduit le résultat.",
    conseil: "🤝 Junior → 1 Particulier/trim, Senior → 1 TPE/trim, Directrice → 1 Grand Compte/trim. Recruter via Carte Décision étape 6a.",
  },
  4: {
    icone: "🤝", titre: "Traitement des ventes (Cartes Client)",
    description: "Chaque vente génère 4 écritures : vente (produit ↑), stock consommé (charge ↑), et encaissement comptant ou créance selon le délai. Au T1, 2 clients initiaux (portefeuille de démarrage) sont traités ici — sans commercial, c'est normal.",
    principe: "① Ventes + (Produit) ② Stocks − (marchandises livrées) ③ Achats/CMV + (Coût de revient) ④ Tréso + ou Créance + (selon délai).",
    conseil: "🔑 C'est LE cœur de la partie double : une seule vente génère 4 écritures qui s'équilibrent. Recrute des commerciaux (étape 6a) pour en avoir plus !",
  },
  5: {
    icone: "🔄", titre: "Effets récurrents des cartes Décision",
    description: "Certaines de tes cartes Décision actives ont des effets qui se répètent chaque trimestre (abonnements, maintenance, intérêts…).",
    principe: "Ces charges récurrentes : DÉBIT compte de charge / CRÉDIT Trésorerie. Elles réduisent le résultat d'exploitation à chaque tour.",
    conseil: "💡 Vérifie que tes revenus récurrents couvrent tes charges récurrentes.",
  },
  6: {
    icone: "🎯", titre: "Choix d'une carte Décision",
    description: "Tu peux investir dans une carte Décision ce trimestre. Chaque carte a des effets immédiats et des effets récurrents. Ce choix est OPTIONNEL.",
    principe: "Un investissement : DÉBIT Immobilisations / CRÉDIT Trésorerie. Un recrutement : DÉBIT Charges personnel / CRÉDIT Trésorerie.",
    conseil: "🛡️ La carte Assurance Prévoyance protège des événements négatifs. La Levée de Fonds apporte des capitaux. Anticipe tes besoins !",
  },
  7: {
    icone: "🎲", titre: "Événement aléatoire",
    description: "Un événement imprévu affecte ton entreprise. Positif (subvention, client VIP) ou négatif (contrôle fiscal, crise sanitaire) : tu ne peux pas le refuser.",
    principe: "Les événements positifs sont des Produits exceptionnels (CRÉDIT Produits exceptionnels / DÉBIT Trésorerie). Les négatifs sont des Charges exceptionnelles.",
    conseil: "🎲 L'Assurance Prévoyance peut annuler certains événements négatifs. Avoir des réserves de trésorerie absorbe les chocs.",
  },
  8: {
    icone: "✅", titre: "Bilan de fin de trimestre",
    description: "On vérifie l'équilibre du bilan, on contrôle la solvabilité et on calcule ton score. Si c'est le dernier trimestre, on clôture l'exercice.",
    principe: "Clôture : le Résultat Net est intégré aux Capitaux propres. Le compte de résultat est remis à zéro.",
    conseil: "📊 Résultat Net = Produits − Charges. S'il est positif, ta solvabilité s'améliore.",
  },
};

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function JeuPage() {
  type Phase = "setup" | "intro" | "playing" | "gameover";

  const [phase, setPhase]                 = useState<Phase>("setup");
  const [etat, setEtat]                   = useState<EtatJeu | null>(null);
  const [activeStep, setActiveStep]       = useState<ActiveStep | null>(null);
  const [journal, setJournal]             = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab]         = useState<"bilan" | "cr" | "indicateurs" | "glossaire">("bilan");
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
  const [etapesPedagoVues, setEtapesPedagoVues] = useState<Set<number>>(new Set());
  const [modalEtapeEnAttente, setModalEtapeEnAttente] = useState<number | null>(null);
  // QCM trimestriel : 4 questions tirées à la fin de chaque trimestre
  const [qcmTrimestreQuestions, setQcmTrimestreQuestions] = useState<QuestionQCM[] | undefined>(undefined);
  const [qcmTrimestreScore, setQcmTrimestreScore] = useState<number | undefined>(undefined);

  // ─ Emprunt bancaire ───────────────────────────────────────────────────────
  const [showDemandeEmprunt, setShowDemandeEmprunt] = useState(false);
  const [montantEmpruntChoisi, setMontantEmpruntChoisi] = useState<number>(MONTANTS_EMPRUNT[1]);
  const [reponseEmprunt, setReponseEmprunt] = useState<ResultatDemandePret | null>(null);

  // ─ Supabase / room code ───────────────────────────────────────────────────
  const [roomCode, setRoomCode]   = useState<string | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) setRoomCode(code);
  }, []);

  // Sauvegarde historique solo dans localStorage
  useEffect(() => {
    if (phase !== "gameover" || !etat || roomCode) return;
    const j = etat.joueurs[0];
    const indicateurs = calculerIndicateurs(j);
    const partie = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      pseudo: j.pseudo,
      entreprise: j.entreprise.nom,
      score: calculerScore(j),
      resultatNet: indicateurs.resultatNet,
      tresorerie: getTresorerie(j),
      trimestresJoues: etat.tourActuel,
      faillite: j.elimine,
    };
    try {
      const existant = JSON.parse(localStorage.getItem("jdp_historique_solo") ?? "[]");
      localStorage.setItem("jdp_historique_solo", JSON.stringify([partie, ...existant].slice(0, 20)));
    } catch { /* localStorage indisponible (mode privé strict) */ }
  }, [phase, etat, roomCode]);

  // Sauvegarde Supabase si room_code présent
  useEffect(() => {
    if (phase !== "gameover" || !etat || !roomCode || savedToDb) return;
    const joueurs = etat.joueurs.map(j => ({
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
      .then(r => r.json())
      .then(() => { setSavedToDb(true); console.log("✅ Résultats sauvegardés dans Supabase"); })
      .catch(err => console.error("❌ Erreur save résultats:", err));
  }, [phase, etat, roomCode, savedToDb]);

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
    if (ACTIF_KEYS.includes(poste) || PASSIF_KEYS.includes(poste)) setActiveTab("bilan");
    else if (CHARGES_KEYS.includes(poste) || PRODUITS_KEYS.includes(poste)) setActiveTab("cr");
    setHighlightedPoste(poste);
    // Durée augmentée à 4s pour laisser l'étudiant bien voir la modification
    setTimeout(() => setHighlightedPoste(null), 4000);
  }

  // ─ Démarrer une partie ────────────────────────────────────────────────────
  function handleStart(players: PlayerSetup[], nbTours: number = 6) {
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
    if (!etapesPedagoVues.has(prochEtape)) {
      setModalEtapeEnAttente(prochEtape);
      setEtapesPedagoVues(prev => new Set(prev).add(prochEtape));
    }
    setEtat({ ...next });
    setActiveStep(null);
    setRecentModifications([]);
    // Réinitialiser la sous-étape après la validation de l'investissement (6b)
    if (etapeAvantAvancement === 6) setSubEtape6("recrutement");
  }

  // ─ Lancer la prévisualisation d'une étape automatique ────────────────────
  function launchStep() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const idx = next.joueurActif;
    let mods: Array<{ joueurId: number; poste: string; ancienneValeur: number; nouvelleValeur: number; explication: string }> = [];
    let evenementCapture: { titre: string; icone?: string; description: string } | undefined;

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
        const cs = next.joueurs[idx].clientsATrait;
        for (const c of cs) {
          const r = appliquerCarteClient(next, idx, c);
          if (r.succes) mods = [...mods, ...r.modifications];
        }
        next.joueurs[idx].clientsATrait = [];
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
      if (!etapesPedagoVues.has(prochEtapeAuto)) {
        setModalEtapeEnAttente(prochEtapeAuto);
        setEtapesPedagoVues(prev => new Set(prev).add(prochEtapeAuto));
      }
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
      if (!etapesPedagoVues.has(0)) {
        setModalEtapeEnAttente(0);
        setEtapesPedagoVues(prev => new Set(prev).add(0));
      }
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
      if (!etapesPedagoVues.has(0)) {
        setModalEtapeEnAttente(0);
        setEtapesPedagoVues(prev => new Set(prev).add(0));
      }
      setEtat({ ...next }); setActiveStep(null); setSelectedDecision(null); setShowCartes(false); setSubEtape6("recrutement");
    }
  }

  // ─ QCM trimestriel : bonus ────────────────────────────────────────────────
  function handleQCMTermine(score: number) {
    if (!etat) return;
    setQcmTrimestreScore(score);
    // Appliquer bonus selon le score
    if (score >= 3) {
      const next = cloneEtat(etat);
      const idx = next.joueurActif;
      const joueurBonus = next.joueurs[idx];
      if (score === 4) {
        // Score parfait : +1 Revenu exceptionnel
        const { ancienneValeur, nouvelleValeur } = { ancienneValeur: joueurBonus.compteResultat.produits.revenusExceptionnels, nouvelleValeur: joueurBonus.compteResultat.produits.revenusExceptionnels + 1 };
        joueurBonus.compteResultat.produits.revenusExceptionnels += 1;
        console.log(`[QCM 4/4] Bonus +1 revenu exceptionnel (${ancienneValeur} → ${nouvelleValeur})`);
      } else {
        // 3/4 : +1 Trésorerie
        const tresoActif = joueurBonus.bilan.actifs.find(a => a.categorie === "tresorerie");
        if (tresoActif) {
          tresoActif.valeur += 1;
          console.log(`[QCM 3/4] Bonus +1 trésorerie`);
        }
      }
      setEtat({ ...next });
    }
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
    if (!etapesPedagoVues.has(prochEtape)) {
      setModalEtapeEnAttente(prochEtape);
      setEtapesPedagoVues(prev => new Set(prev).add(prochEtape));
    }
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
    if (!etapesPedagoVues.has(prochEtape)) {
      setModalEtapeEnAttente(prochEtape);
      setEtapesPedagoVues(prev => new Set(prev).add(prochEtape));
    }
    setEtat(next);
    setShowCartes(false);
    setSelectedDecision(null);
    setDecisionError(null);
    setSubEtape6("recrutement"); // reset pour le prochain tour
  }

  // ─── RENDU ────────────────────────────────────────────────────────────────

  if (phase === "setup") return <SetupScreen onStart={handleStart} />;
  if (phase === "intro" && etat) return (
    <CompanyIntro
      joueurs={etat.joueurs}
      onStart={() => {
        // Montrer la modal de l'étape 0 dans le MÊME batch que le passage en "playing"
        // → 1er rendu du jeu = modal déjà visible, jamais de flash des boutons d'action
        if (!etapesPedagoVues.has(0)) {
          setModalEtapeEnAttente(0);
          setEtapesPedagoVues(prev => new Set(prev).add(0));
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
            <span>✅</span><span>Résultats sauvegardés dans le tableau de bord enseignant</span>
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

      {/* ─── CORPS ─── */}
      <div className="flex flex-1 overflow-hidden">
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
          subEtape6={subEtape6}
          modeRapide={modeRapide}
          setModeRapide={setModeRapide}
          modalEtapeEnAttente={modalEtapeEnAttente}
          onCloseModal={() => setModalEtapeEnAttente(null)}
          onDemanderEmprunt={() => { setReponseEmprunt(null); setShowDemandeEmprunt(true); }}
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
          cartesRecrutement={cartesRecrutement}
          recentModifications={recentModifications}
          subEtape6={subEtape6}
          modeRapide={modeRapide}
          onSkipDecision={skipDecision}
          onLaunchDecision={launchDecision}
        />
      </div>
    </div>
  );
}
