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
  type LiveState,
} from "@jedevienspatron/game-engine";
import { type ActiveStep, getSens } from "@/components/jeu";

// ─── Défis du dirigeant (Tâche 24, Vague 2) ─────────────────────────────────
// Les 2 fonctions de timing vivent dans game-engine (logique pure,
// testée en Jest). On les ré-expose ici pour que les hooks web aient
// un point d'import local cohérent.

export {
  determinerTimingRupture,
  determinerSlotsActifs,
} from "@jedevienspatron/game-engine";

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
  /**
   * B9 post (2026-04-24) — Nom exact de la ligne de bilan touchée, propagé
   * depuis `pushByName` côté moteur (cf. types.ts `ResultatAction`). Permet
   * au BilanPanel de cibler le bon badge quand plusieurs lignes partagent
   * la même catégorie (Belvaux : "Stocks matières premières" et "Stocks
   * produits finis", tous deux categorie "stocks").
   */
  ligneNom?: string;
};

// ─── ETAPE_INFO ───────────────────────────────────────────────────────────────
// Réutilisé par useGameFlow, buildActiveStep et les composants (via re-export)

// ─── B9-A (2026-04-24) — Cycle 8 étapes, insertion REALISATION_METIER(3), fusion CLOTURE_BILAN(7) ─────
// Ordre : encaissements → commerciaux → achats → réalisation métier → facturation ventes → décision → événement → clôture&bilan
// Contenu court pour ActiveStep + Journal. Le fond pédagogique détaillé
// vit dans `apps/web/lib/pedagogie/pedagogie.ts` (MODALES_ETAPES).
export const ETAPE_INFO: Record<number, {
  icone: string; titre: string; description: string; principe: string; conseil: string;
}> = {
  0: {
    icone: "⏩", titre: "Encaissements des créances clients",
    description: "Les créances arrivées à échéance entrent en trésorerie. Les créances à 2 trimestres passent à 1 trimestre restant.",
    principe: "Tes clients te paient selon leur délai. La trésorerie augmente, les créances clients diminuent du même montant. Le chiffre d'affaires ne bouge pas : il avait été enregistré au moment de la vente.",
    conseil: "Une entreprise peut être rentable et pourtant manquer de trésorerie si ses clients paient trop tard. Surveille tes délais d'encaissement.",
  },
  1: {
    icone: "👔", titre: "Paiement des commerciaux",
    description: "Les commerciaux en poste sont payés ce trimestre et ramènent de nouveaux clients. Sans commercial, cette étape est vide — c'est normal au T1.",
    principe: "Charges de personnel +, trésorerie −. C'est une charge d'exploitation courante — pas une immobilisation, même si l'effet sur les ventes est durable.",
    conseil: "Les commerciaux coûtent avant de rapporter. Dimensionne ton équipe à ta marge prévue, pas à ton ambition.",
  },
  2: {
    icone: "📦", titre: "Approvisionnement",
    description: "Tu achètes marchandises ou matières (selon ton métier). Choisis la quantité et le mode de paiement : comptant (trésorerie immédiate) ou à crédit (dette fournisseur D+1).",
    principe: "Stocks +, et soit trésorerie −, soit dettes fournisseurs +. Pas de charge à ce stade : le coût d'achat ne devient charge qu'au moment de la vente.",
    conseil: "Le stock est de l'argent transformé en marchandises. Trop de stock immobilise la trésorerie, trop peu fait rater des ventes.",
  },
  3: {
    icone: "🛠️", titre: "Réalisation métier",
    description: "Étape propre à votre entreprise : production, logistique, conseil, négoce pur. Les écritures spécifiques (coût de fabrication, coût de canal, livraison, mission) sont appliquées ici.",
    principe: "Selon le métier : transformation de stock, consommation de ressources, comptabilisation d'en-cours. Cette étape rend visibles les coûts métier que l'étape Facturation ne peut pas porter seule.",
    conseil: "Chaque entreprise crée de la valeur différemment. Comprends ton modèle : ce qui distingue ta marge de celle du voisin.",
  },
  4: {
    icone: "🤝", titre: "Facturation & ventes (Cartes Client)",
    description: "Chaque carte Client déclenche les écritures : chiffre d'affaires, sortie de stock (si applicable), coût des marchandises vendues, encaissement ou créance.",
    principe: "Produits d'exploitation +, stocks −, trésorerie ou créances clients +. La marge brute se révèle à cette étape ; c'est elle qui conditionne la capacité à absorber les charges fixes de la clôture.",
    conseil: "Vendre beaucoup ne suffit pas : ce qui compte, c'est ce qu'il reste quand on a retiré le coût du produit. La marge, pas le volume.",
  },
  5: {
    icone: "🎯", titre: "Carte Décision",
    description: "Tu peux jouer une carte Décision — investissement, recrutement, emprunt, carte logistique, protection. Ce choix est OPTIONNEL.",
    principe: "Selon la carte : immobilisation + et trésorerie − (investissement), emprunt + et trésorerie + (crédit), charges de personnel + (recrutement). Beaucoup de cartes embarquent un effet récurrent.",
    conseil: "C'est toi qui décides : mais le marché ne te dira pas si tu as eu raison avant plusieurs trimestres. Regarde toujours la sortie de cash d'aujourd'hui ET le coût récurrent cumulé.",
  },
  6: {
    icone: "🎲", titre: "Carte Événement",
    description: "Une carte Événement est tirée automatiquement. Elle peut affecter la trésorerie, le stock, les clients, les dettes — ou plusieurs postes à la fois.",
    principe: "Variable selon l'événement. Un incident augmente les charges exceptionnelles ou réduit un actif ; une opportunité gonfle le CA ou les produits.",
    conseil: "Tu n'as pas choisi ce moment : ta responsabilité, c'est la lecture, pas la panique. Un coussin de trésorerie absorbe les chocs.",
  },
  7: {
    icone: "💼", titre: "Clôture & bilan",
    description: "Tout ce qui a permis à l'entreprise de fonctionner ce trimestre arrive dans les comptes : charges fixes, remboursement d'emprunt, intérêts (à partir du T3), dotations aux amortissements et effets récurrents. Le résultat net est affecté aux capitaux propres, le bilan est vérifié.",
    principe: "La trésorerie baisse avec les paiements exigibles. Les amortissements augmentent les charges sans impacter la banque. Capitaux propres +/− selon le résultat, actif et passif équilibrés par construction.",
    conseil: "Respire : c'est ici que tu vois si ta stratégie tient. Regarde d'abord la trésorerie après clôture, puis le résultat net et la tendance sur trois bilans.",
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

// ─── Live state (dashboard formateur) ────────────────────────────────────────

/**
 * Construit un LiveState léger (~200B) pour le dashboard formateur temps réel.
 * Appelé à chaque fin de trimestre pour envoyer un heartbeat.
 */
export function buildLiveState(
  etat: EtatJeu,
  joueurIdx: number,
): LiveState {
  const joueur = etat.joueurs[joueurIdx];

  const capitauxPropres = joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);

  const nbCommerciaux = joueur.cartesActives.filter(
    (c) => c.categorie === "commercial",
  ).length;

  return {
    tour: etat.tourActuel,
    etape: etat.etapeTour,
    tresorerie: getTresorerie(joueur),
    resultatNet: getResultatNet(joueur),
    score: calculerScore(joueur),
    capitauxPropres,
    nbCommerciaux,
    elimine: joueur.elimine,
  };
}
