/**
 * Utilitaires partagés entre useGameFlow et ses sous-hooks.
 * Contient les types, constantes et fonctions pures qui ne dépendent
 * d'aucun état React.
 */

import {
  EtatJeu,
  getTresorerie,
  getResultatNet,
  calculerScore,
  type TrimSnapshot,
} from "@jedevienspatron/game-engine";
import { type ActiveStep, getSens } from "@/components/jeu";

// ─── Type partagé : modification renvoyée par le moteur ──────────────────────

export type ModificationMoteur = {
  joueurId: number;
  poste: string;
  ancienneValeur: number;
  nouvelleValeur: number;
  explication: string;
  saleGroupId?: string;
  saleClientLabel?: string;
  saleActIndex?: number;
};

// ─── ETAPE_INFO ───────────────────────────────────────────────────────────────
// Réutilisé par useGameFlow, buildActiveStep et les composants (via re-export)

export const ETAPE_INFO: Record<number, {
  icone: string; titre: string; description: string; principe: string; conseil: string;
}> = {
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

// ─── Utilitaires purs ─────────────────────────────────────────────────────────

export function cloneEtat(e: EtatJeu): EtatJeu {
  return JSON.parse(JSON.stringify(e));
}

/**
 * Construit un ActiveStep (prévisualisation UI) à partir des modifications
 * renvoyées par le moteur de jeu.
 */
export function buildActiveStep(
  baseEtat: EtatJeu,
  mods: ModificationMoteur[],
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
      saleGroupId: m.saleGroupId,
      saleClientLabel: m.saleClientLabel,
      saleActIndex: m.saleActIndex,
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

// ─── Snapshot trimestriel ────────────────────────────────────────────────────

/**
 * Construit un TrimSnapshot à partir de l'état courant d'un joueur.
 * Appelé à la fin de chaque trimestre (étape 8) pour stocker l'historique
 * utilisé par le rapport pédagogique post-session.
 *
 * @param etat   État de jeu courant (contient le joueur à l'index 0 en solo)
 * @param joueurIdx  Index du joueur dans etat.joueurs (0 en solo)
 * @param decision   Label de la dernière décision prise ce trimestre (null si aucune)
 */
export function buildTrimSnapshot(
  etat: EtatJeu,
  joueurIdx: number,
  decision: string | null,
): TrimSnapshot {
  const joueur = etat.joueurs[joueurIdx];

  const capitauxPropres = joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);

  const nbCommerciaux = joueur.cartesActives.filter(
    (c) => c.categorie === "commercial",
  ).length;

  // Nombre total de clients ce trimestre = ceux traités (clientsATrait)
  // En fin de tour clientsATrait est vide (déjà traité), on compte via les commerciaux actifs
  // + les clients initiaux. On utilise nbClientsParTour des cartes actives commerciales.
  const nbClients = joueur.cartesActives
    .filter((c) => c.categorie === "commercial")
    .reduce((sum, c) => sum + (c.nbClientsParTour ?? 0), 0)
    + (joueur.entreprise.clientGratuitParTour ? 1 : 0);

  return {
    tour: etat.tourActuel,
    tresorerie: getTresorerie(joueur),
    resultatNet: getResultatNet(joueur),
    capitauxPropres,
    chiffreAffaires: joueur.compteResultat.produits.ventes,
    score: calculerScore(joueur),
    nbClients,
    nbCommerciaux,
    decision,
  };
}
