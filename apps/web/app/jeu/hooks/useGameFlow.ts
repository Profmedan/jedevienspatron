"use client";

import { useState, useEffect, useMemo } from "react";
import {
  EtatJeu, CarteDecision, ResultatDemandePret, MONTANTS_EMPRUNT,
  initialiserJeu, avancerEtape, appliquerEtape0, appliquerAchatMarchandises,
  appliquerAvancementCreances, appliquerPaiementCommerciaux, appliquerCarteClient,
  appliquerEffetsRecurrents, appliquerSpecialiteEntreprise, genererClientsSpecialite,
  tirerCartesDecision, acheterCarteDecision, investirCartePersonnelle, licencierCommercial,
  appliquerCarteEvenement, verifierFinTour, cloturerAnnee, genererClientsParCommerciaux,
  obtenirCarteRecrutement, demanderEmprunt, ResultatFinTour, calculerCapaciteLogistique,
} from "@jedevienspatron/game-engine";
import {
  type PlayerSetup, type ActiveStep,
  getSens, getPosteValue, applyDeltaToJoueur,
} from "@/components/jeu";
import { tirerQuestionsTrimestriel, QuestionQCM } from "@/lib/game-engine/data/pedagogie";

// ─── Types ─────────────────────────────────────────────────────────────────

export type Phase = "setup" | "intro" | "playing" | "gameover";

export interface JournalEntry {
  id: number;
  tour: number;
  etape: number;
  joueurNom: string;
  titre: string;
  entries: Array<{ poste: string; delta: number; applied?: boolean }>;
  principe: string;
}

// ─── ETAPE_INFO (réutilisé pour le journal et les étapes actives) ────────

const ETAPE_INFO: Record<number, { icone: string; titre: string; description: string; principe: string; conseil: string }> = {
  0: {
    icone: "💼", titre: "Charges fixes & Dotation aux amortissements",
    description: "Chaque trimestre, ton entreprise paie ses charges fixes (loyer, énergie, assurances…) et constate l'usure de chaque bien immobilisé (−1 par bien). Si tu as un emprunt, les intérêts sont prélevés une fois par an.",
    principe: "Ton entreprise paie ses charges obligatoires (loyer, énergie…) : ta trésorerie diminue. Tes équipements s'usent : leur valeur au bilan baisse, et une charge d'amortissement est enregistrée. Si tu as un emprunt, les intérêts sont aussi prélevés.",
    conseil: "Ces charges sont obligatoires. L'amortissement n'est pas une sortie d'argent réelle, mais il réduit ton résultat — et donc tes capitaux propres à terme.",
  },
  1: {
    icone: "📦", titre: "Achats de marchandises",
    description: "Tu peux acheter des stocks pour les revendre. Choisis la quantité et le mode de paiement : comptant (trésorerie immédiate) ou à crédit (dette fournisseur D+1).",
    principe: "Tu achètes des marchandises. Si tu paies comptant, ta trésorerie baisse immédiatement. Si tu achètes à crédit, tu gardes ta trésorerie aujourd'hui mais tu crées une dette à payer au trimestre suivant.",
    conseil: "Acheter à crédit préserve ta trésorerie, mais crée une dette à rembourser au prochain tour. Trouve le bon équilibre.",
  },
  2: {
    icone: "⏩", titre: "Avancement des créances clients",
    description: "Les clients règlent à échéance : les créances à 2 trimestres passent à 1, et celles à 1 trimestre entrent en trésorerie.",
    principe: "Tes clients te paient selon leur délai. Les créances à 1 trimestre entrent en trésorerie. Les créances à 2 trimestres passent à 1 trimestre restant. L'argent arrive, mais avec du retard.",
    conseil: "Un client Grand Compte est rentable mais paie en 2 trimestres. Attention au décalage : tu peux être en bénéfice et à court de cash en même temps.",
  },
  3: {
    icone: "👔", titre: "Paiement des commerciaux",
    description: "Si tu as recruté des commerciaux, leurs salaires sont versés ici et ils génèrent de nouveaux clients. Sans commercial, cette étape est vide — c'est normal au T1.",
    principe: "Tu verses les salaires de tes commerciaux : ta trésorerie baisse et tes charges de personnel augmentent. En contrepartie, chaque commercial te ramène de nouveaux clients.",
    conseil: "Junior → 2 clients particuliers/trim. Senior → 2 TPE/trim. Directrice → 2 Grands Comptes/trim. Recrute via les cartes Décision à l'étape 6.",
  },
  4: {
    icone: "🤝", titre: "Traitement des ventes (Cartes Client)",
    description: "Chaque vente génère plusieurs écritures simultanées. Au T1, 2 clients initiaux sont traités ici — sans commercial, c'est normal.",
    principe: "Chaque vente déclenche 4 mouvements : ton chiffre d'affaires augmente, ton stock diminue, le coût des marchandises vendues est enregistré, et tu encaisses (comptant ou à terme). C'est la partie double en action.",
    conseil: "C'est le cœur du jeu : une seule vente crée 4 écritures qui s'équilibrent. Plus tu as de commerciaux, plus tu vends.",
  },
  5: {
    icone: "🔄", titre: "Effets récurrents des cartes Décision",
    description: "Effets récurrents de tes cartes actives : spécialité d'entreprise (ex. production stockée), abonnements, maintenance, intérêts…",
    principe: "Chaque trimestre, tes cartes actives déclenchent automatiquement leurs effets. La production stockée (cpt 713) enregistre la valeur des marchandises que tu fabriques et mets en stock : c'est un produit qui augmente ton résultat, et un actif (stocks) qui augmente ton bilan. Une charge récurrente (abonnement, maintenance) fait l'inverse.",
    conseil: "La production stockée n'est pas de la trésorerie : tu 'gagnes' sur le papier mais l'argent n'arrive que quand tu vends. Surveille le décalage entre résultat et trésorerie.",
  },
  6: {
    icone: "🎯", titre: "Choix d'une carte Décision",
    description: "Tu peux investir dans une carte Décision ce trimestre. Chaque carte a des effets immédiats et des effets récurrents. Ce choix est OPTIONNEL.",
    principe: "Tu peux recruter un commercial (charge de personnel) ou investir dans un équipement (immobilisation). Chaque choix a un coût immédiat et des effets à long terme sur ton entreprise.",
    conseil: "L'assurance protège des événements négatifs. La levée de fonds apporte des capitaux. Anticipe tes besoins avant d'investir.",
  },
  7: {
    icone: "🎲", titre: "Événement aléatoire",
    description: "Un événement imprévu affecte ton entreprise. Positif ou négatif : tu ne peux pas le refuser.",
    principe: "Un événement imprévu touche ton entreprise. S'il est positif, ta trésorerie ou tes revenus augmentent. S'il est négatif, tu subis une charge exceptionnelle. L'assurance peut te protéger.",
    conseil: "Avoir des réserves de trésorerie absorbe les chocs. L'assurance prévoyance annule certains événements négatifs.",
  },
  8: {
    icone: "✅", titre: "Bilan de fin de trimestre",
    description: "On vérifie l'équilibre du bilan, on contrôle la solvabilité et on calcule ton score. Si c'est le dernier trimestre, on clôture l'exercice.",
    principe: "Fin du trimestre : on calcule ton résultat (produits − charges). S'il est positif, tes capitaux propres augmentent et ta solvabilité s'améliore. S'il est négatif, attention à la faillite.",
    conseil: "Résultat Net = Produits − Charges. Positif = tes capitaux propres montent. Négatif = ta solvabilité baisse.",
  },
};

export { ETAPE_INFO };

// ─── Utilitaire ────────────────────────────────────────────────────────────

function cloneEtat(e: EtatJeu): EtatJeu { return JSON.parse(JSON.stringify(e)); }

// ─── Paramètres du hook ────────────────────────────────────────────────────

interface UseGameFlowParams {
  /** Phase et état partagés avec useGamePersistence (vivent dans page.tsx) */
  phase: Phase;
  setPhase: (p: Phase) => void;
  etat: EtatJeu | null;
  setEtat: (e: EtatJeu | null) => void;
  /** Setters UI nécessaires pour les cross-cutting effects */
  modeRapide: boolean;
  setActiveTab: (tab: "bilan" | "cr" | "indicateurs" | "glossaire" | "vue-ensemble" | "impact") => void;
  setHighlightedPoste: (v: string | null) => void;
  setFlashData: (v: { poste: string; avant: number; apres: number } | null) => void;
  /** Crée une session solo (consomme 1 crédit) — depuis useGamePersistence */
  createSoloSession: (nbTours: number) => Promise<boolean>;
}

// ─── Retour du hook ────────────────────────────────────────────────────────

interface UseGameFlowReturn {
  activeStep: ActiveStep | null;
  setActiveStep: (s: ActiveStep | null) => void;
  journal: JournalEntry[];
  setJournal: (j: JournalEntry[]) => void;
  recentModifications: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>;
  setRecentModifications: (m: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>) => void;
  effectiveRecentMods: Array<{ poste: string; ancienneValeur: number; nouvelleValeur: number }>;
  achatQte: number;
  setAchatQte: (v: number) => void;
  achatMode: "tresorerie" | "dettes";
  setAchatMode: (v: "tresorerie" | "dettes") => void;
  selectedDecision: CarteDecision | null;
  setSelectedDecision: (v: CarteDecision | null) => void;
  showCartes: boolean;
  tourTransition: { from: number; to: number } | null;
  setTourTransition: (v: { from: number; to: number } | null) => void;
  failliteInfo: { joueurNom: string; raison: string } | null;
  setFailliteInfo: (v: { joueurNom: string; raison: string } | null) => void;
  decisionError: string | null;
  subEtape6: "recrutement" | "investissement";
  etapesPedagoVues: Set<number>;
  setEtapesPedagoVues: (v: Set<number>) => void;
  modalEtapeEnAttente: number | null;
  setModalEtapeEnAttente: (v: number | null) => void;
  qcmTrimestreQuestions: QuestionQCM[] | undefined;
  setQcmTrimestreQuestions: (v: QuestionQCM[] | undefined) => void;
  qcmTrimestreScore: number | undefined;
  setQcmTrimestreScore: (v: number | undefined) => void;
  showDemandeEmprunt: boolean;
  setShowDemandeEmprunt: (v: boolean) => void;
  montantEmpruntChoisi: number;
  setMontantEmpruntChoisi: (v: number) => void;
  reponseEmprunt: ResultatDemandePret | null;
  setReponseEmprunt: (v: ResultatDemandePret | null) => void;

  // ─ Derived / computed ─
  getDisplayJoueur: () => import("@jedevienspatron/game-engine").Joueur | null;
  cartesDisponibles: CarteDecision[];
  cartesRecrutement: CarteDecision[];

  // ─ Actions ─
  handleStart: (players: PlayerSetup[], nbTours?: number) => Promise<void>;
  applyEntry: (entryId: string) => void;
  confirmActiveStep: () => void;
  launchStep: () => void;
  handleApplyEntry: (poste: string) => void;
  handleQCMTermine: (score: number) => void;
  handleDemanderEmprunt: () => void;
  launchAchat: () => void;
  skipAchat: () => void;
  launchDecision: () => void;
  skipDecision: () => void;
  handleInvestirPersonnel: (carteId: string) => void;
  handleLicencierCommercial: (carteId: string) => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useGameFlow({
  phase, setPhase, etat, setEtat,
  modeRapide,
  setActiveTab,
  setHighlightedPoste,
  setFlashData,
  createSoloSession,
}: UseGameFlowParams): UseGameFlowReturn {

  const [activeStep, setActiveStep]       = useState<ActiveStep | null>(null);
  const [journal, setJournal]             = useState<JournalEntry[]>([]);
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

  // ─ Pédagogie : modal d'explication + QCM fin de trimestre ──────────────────
  const [etapesPedagoVues, setEtapesPedagoVues] = useState<Set<number>>(new Set());
  const [modalEtapeEnAttente, setModalEtapeEnAttente] = useState<number | null>(null);
  const [qcmTrimestreQuestions, setQcmTrimestreQuestions] = useState<QuestionQCM[] | undefined>(undefined);
  const [qcmTrimestreScore, setQcmTrimestreScore] = useState<number | undefined>(undefined);

  // ─ Emprunt bancaire ───────────────────────────────────────────────────────
  const [showDemandeEmprunt, setShowDemandeEmprunt] = useState(false);
  const [montantEmpruntChoisi, setMontantEmpruntChoisi] = useState<number>(MONTANTS_EMPRUNT[1]);
  const [reponseEmprunt, setReponseEmprunt] = useState<ResultatDemandePret | null>(null);

  // ── Auto-ouvre les cartes dès que le joueur arrive à l'étape 6 ──────────
  useEffect(() => {
    if (etat?.etapeTour === 6 && !activeStep) {
      setShowCartes(true);
    }
  }, [etat?.etapeTour, subEtape6, activeStep]);

  // ── Affichage progressif des badges avant/après ─────────────────────────
  // On filtre recentModifications par INDEX (pas par poste) pour que :
  //  • le badge reflète l'écriture EXACTE qui vient d'être appliquée
  //  • si tresorerie est modifiée 3 fois (intérêts, remboursement, charges),
  //    le badge montre bien "7600 → 7100" après le remboursement, pas "8000 → 7600"
  // Note : recentModifications[i] ↔ activeStep.entries[i] — même filtre, même ordre.
  const effectiveRecentMods = useMemo(() => {
    if (!activeStep) return recentModifications;
    return recentModifications.filter((_, i) => activeStep.entries[i]?.applied === true);
  }, [activeStep, recentModifications]);

  // ── Cartes disponibles (computed) ───────────────────────────────────────
  const cartesDisponibles = etat ? tirerCartesDecision(cloneEtat(etat), 4) : [];
  const cartesRecrutement = etat ? obtenirCarteRecrutement(cloneEtat(etat), etat.joueurActif) : [];

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
    setHighlightedPoste(poste);
    setTimeout(() => setHighlightedPoste(null), 4000);
  }

  // ─ Démarrer une partie ────────────────────────────────────────────────────
  async function handleStart(players: PlayerSetup[], nbTours: number = 6) {
    const ok = await createSoloSession(nbTours);
    if (!ok) return;

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
  // Une seule écriture à la fois : l'apprenant voit l'impact de chaque ligne
  // sur le Bilan OU le Compte de Résultat avant de passer à la suivante.
  // Le bilan peut être temporairement déséquilibré entre deux lignes d'une même
  // transaction — c'est affiché comme "Saisie en cours…" (pas une erreur).
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
    const prochEtape = next.etapeTour;
    if (!etapesPedagoVues.has(prochEtape)) {
      setModalEtapeEnAttente(prochEtape);
      setEtapesPedagoVues(prev => new Set(prev).add(prochEtape));
    }
    setEtat({ ...next });
    setActiveStep(null);
    setRecentModifications([]);
    if (etapeAvantAvancement === 6) setSubEtape6("recrutement");
  }

  // ─ Lancer la prévisualisation d'une étape automatique ────────────────────
  function launchStep() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const idx = next.joueurActif;
    let mods: Array<{ joueurId: number; poste: string; ancienneValeur: number; nouvelleValeur: number; explication: string }> = [];
    let evenementCapture: { titre: string; icone?: string; description: string } | undefined;

    if (next.etapeTour === 0) {
      next.joueurs[idx].clientsPerdusCeTour = 0;
    }

    switch (next.etapeTour) {
      case 0: { const r = appliquerEtape0(next, idx); if (r.succes) mods = r.modifications; break; }
      case 2: { const r = appliquerAvancementCreances(next, idx); if (r.succes) mods = r.modifications; break; }
      case 3: {
        const clients = genererClientsParCommerciaux(next.joueurs[idx]);
        const clientsSpecialite = genererClientsSpecialite(next.joueurs[idx]);
        next.joueurs[idx].clientsATrait = [...next.joueurs[idx].clientsATrait, ...clients, ...clientsSpecialite];
        const r = appliquerPaiementCommerciaux(next, idx);
        if (r.succes) mods = r.modifications;
        break;
      }
      case 4: {
        const joueur = next.joueurs[idx];
        const capacite = calculerCapaciteLogistique(joueur);
        const clientsAtrait = joueur.clientsATrait;
        let clientsPerdusPrise = 0;

        clientsAtrait.sort((a, b) => {
          const rentabilitéA = b.delaiPaiement - a.delaiPaiement;
          if (rentabilitéA !== 0) return rentabilitéA;
          return b.montantVentes - a.montantVentes;
        });

        const clientsTraites = clientsAtrait.slice(0, capacite);
        const clientsPerdus = clientsAtrait.slice(capacite);

        for (const c of clientsTraites) {
          const r = appliquerCarteClient(next, idx, c);
          if (r.succes) mods = [...mods, ...r.modifications];
        }

        clientsPerdusPrise = clientsPerdus.length;
        joueur.clientsPerdusCeTour = clientsPerdusPrise;
        joueur.clientsATrait = [];

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
      case 5: {
        const r = appliquerEffetsRecurrents(next, idx);
        if (r.succes) mods = r.modifications;
        const rSpec = appliquerSpecialiteEntreprise(next, idx);
        if (rSpec.succes) mods = [...mods, ...rSpec.modifications];
        break;
      }
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

    setRecentModifications(modsFiltrees.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));

    const AUTO_ETAPES = [0, 2, 3, 4, 5];
    const step = buildActiveStep(etat, mods, next, next.etapeTour, evenementCapture);
    if (modeRapide && AUTO_ETAPES.includes(next.etapeTour)) {
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
      if (!etapesPedagoVues.has(0)) {
        setModalEtapeEnAttente(0);
        setEtapesPedagoVues(prev => new Set(prev).add(0));
      }
      setEtat({ ...next }); setActiveStep(null); setSelectedDecision(null); setShowCartes(false); setSubEtape6("recrutement");
      const questions = tirerQuestionsTrimestriel();
      setQcmTrimestreQuestions(questions);
      setQcmTrimestreScore(undefined);
      setTourTransition({ from: oldTour, to: next.tourActuel });
    } else {
      avancerEtape(next);
      next.joueurActif = nextJoueurIdx;
      next.etapeTour = 0;
      if (!etapesPedagoVues.has(0)) {
        setModalEtapeEnAttente(0);
        setEtapesPedagoVues(prev => new Set(prev).add(0));
      }
      setEtat({ ...next }); setActiveStep(null); setSelectedDecision(null); setShowCartes(false); setSubEtape6("recrutement");
    }
  }

  // ─ QCM trimestriel : bonus / malus ───────────────────────────────────────
  function handleQCMTermine(score: number) {
    if (!etat) return;
    setQcmTrimestreScore(score);

    const next = cloneEtat(etat);
    const joueurBonus = next.joueurs[next.joueurActif];
    const tresoActif = joueurBonus.bilan.actifs.find(a => a.categorie === "tresorerie");

    if (score === 4) {
      if (tresoActif) tresoActif.valeur += 1;
      joueurBonus.compteResultat.produits.revenusExceptionnels += 1;
    } else if (score === 3) {
      if (tresoActif) tresoActif.valeur += 1;
      joueurBonus.compteResultat.produits.revenusExceptionnels += 1;
    } else if (score < 2) {
      if (tresoActif) tresoActif.valeur -= 1;
      joueurBonus.compteResultat.charges.chargesExceptionnelles += 1;
    }

    setEtat({ ...next });
  }

  // ─ Emprunt bancaire ───────────────────────────────────────────────────────
  function handleDemanderEmprunt() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const { resultat, modifications } = demanderEmprunt(next, next.joueurActif, montantEmpruntChoisi);
    setReponseEmprunt(resultat);
    if (resultat.accepte) {
      const mods = modifications.map(m => ({
        poste: m.poste,
        ancienneValeur: m.ancienneValeur,
        nouvelleValeur: m.nouvelleValeur,
      }));
      setEtat({ ...next });
      setRecentModifications(mods);
      const firstMod = mods[0];
      if (firstMod) {
        setActiveTab("bilan");
        setFlashData({ poste: firstMod.poste, avant: firstMod.ancienneValeur, apres: firstMod.nouvelleValeur });
        setHighlightedPoste(firstMod.poste);
        setTimeout(() => setHighlightedPoste(null), 5000);
      }
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
    const modsFiltrees = r.modifications.filter(m => m.nouvelleValeur !== m.ancienneValeur);
    setRecentModifications(modsFiltrees.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
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
    const modsDecisionFiltres = mods.filter(m => m.nouvelleValeur !== m.ancienneValeur);
    setRecentModifications(modsDecisionFiltres.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    setActiveStep(buildActiveStep(etat, mods, next, 6));
  }

  function handleInvestirPersonnel(carteId: string) {
    if (!etat) return;
    const next = cloneEtat(etat);
    const result = investirCartePersonnelle(next, next.joueurActif, carteId);
    if (!result.succes) {
      setDecisionError(result.messageErreur ?? "Erreur investissement logistique");
      return;
    }
    setDecisionError(null);
    const modsInvestFiltres = result.modifications.filter(m => m.nouvelleValeur !== m.ancienneValeur);
    setRecentModifications(modsInvestFiltres.map(m => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    setActiveStep(buildActiveStep(etat, result.modifications, next, 6));
  }

  function handleLicencierCommercial(carteId: string) {
    if (!etat) return;
    const next = cloneEtat(etat);
    const result = licencierCommercial(next, next.joueurActif, carteId);
    if (!result.succes) {
      setDecisionError(result.messageErreur ?? "Impossible de licencier ce commercial.");
      return;
    }
    setDecisionError(null);
    const modsFiltrés = result.modifications.filter((m: { nouvelleValeur: number; ancienneValeur: number }) => m.nouvelleValeur !== m.ancienneValeur);
    setRecentModifications(modsFiltrés.map((m: { poste: string; ancienneValeur: number; nouvelleValeur: number }) => ({
      poste: m.poste, ancienneValeur: m.ancienneValeur, nouvelleValeur: m.nouvelleValeur,
    })));
    setActiveStep(buildActiveStep(etat, result.modifications, next, 6, {
      titre: "Licenciement",
      icone: "📤",
      description: "Vous licenciez un commercial. L'indemnité légale est versée immédiatement. Ce commercial ne génèrera plus de clients ni de salaires à partir du prochain trimestre.",
    }));
  }

  function skipDecision() {
    if (!etat) return;
    if (etat.etapeTour === 6 && subEtape6 === "recrutement") {
      setSubEtape6("investissement");
      setShowCartes(false);
      setSelectedDecision(null);
      setDecisionError(null);
      return;
    }
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
    setSubEtape6("recrutement");
  }

  return {
    activeStep, setActiveStep,
    journal, setJournal,
    recentModifications, setRecentModifications,
    effectiveRecentMods,
    achatQte, setAchatQte,
    achatMode, setAchatMode,
    selectedDecision, setSelectedDecision,
    showCartes,
    tourTransition, setTourTransition,
    failliteInfo, setFailliteInfo,
    decisionError,
    subEtape6,
    etapesPedagoVues, setEtapesPedagoVues,
    modalEtapeEnAttente, setModalEtapeEnAttente,
    qcmTrimestreQuestions, setQcmTrimestreQuestions,
    qcmTrimestreScore, setQcmTrimestreScore,
    showDemandeEmprunt, setShowDemandeEmprunt,
    montantEmpruntChoisi, setMontantEmpruntChoisi,
    reponseEmprunt, setReponseEmprunt,
    getDisplayJoueur,
    cartesDisponibles,
    cartesRecrutement,
    handleStart,
    applyEntry,
    confirmActiveStep,
    launchStep,
    handleApplyEntry,
    handleQCMTermine,
    handleDemanderEmprunt,
    launchAchat,
    skipAchat,
    launchDecision,
    skipDecision,
    handleInvestirPersonnel,
    handleLicencierCommercial,
  };
}
