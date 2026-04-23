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
// Réutilisé par useGameFlow, buildActiveStep et les composants (via re-export).
// Ordre B9 (8 étapes, 0..7) : activité métier puis clôture.
// L'étape 3 REALISATION_METIER est polymorphe par entreprise (B9-D) ;
// auto-skipée en V1 B9-A.
// L'étape 7 CLOTURE_BILAN fusionne narrativement clôture et bilan mais
// le moteur applique deux passes séquentielles.

export const ETAPE_INFO: Record<number, {
  icone: string; titre: string; description: string; principe: string; conseil: string;
}> = {
  0: {
    icone: "⏩", titre: "Encaissements & règlements",
    description: "Les clients règlent à échéance : les créances à 2 trimestres passent à 1, et celles à 1 trimestre entrent en trésorerie.",
    principe: "Tes clients te paient selon leur délai. Les créances à 1 trimestre entrent en trésorerie. Les créances à 2 trimestres passent à 1 trimestre restant. L'argent arrive, mais avec du retard.",
    conseil: "Un client Grand Compte est rentable mais paie en 2 trimestres. Attention au décalage : tu peux être en bénéfice et à court de cash en même temps.",
  },
  1: {
    icone: "👔", titre: "Développement commercial",
    description: "Tes commerciaux touchent leur salaire et te ramènent de nouveaux clients. Les commerciaux sont UN levier de demande parmi d'autres — d'autres sources (trafic passif, contrats, réputation) arriveront dans une phase ultérieure.",
    principe: "Tu verses les salaires de tes commerciaux : ta trésorerie baisse et tes charges de personnel augmentent. En contrepartie, chaque commercial te ramène de nouveaux clients selon son profil.",
    conseil: "Junior → 2 clients particuliers/trim. Senior → 2 TPE/trim. Directrice → 2 Grands Comptes/trim. Recrute via les cartes Décision à l'étape 5.",
  },
  2: {
    icone: "📦", titre: "Ressources & préparation",
    description: "Tu mobilises les ressources dont tu as besoin pour réaliser ton activité : achat de marchandises pour le négoce, matière première pour la production, planification des tournées pour le service, staffing des missions pour le conseil.",
    principe: "Tu engages des ressources avant de pouvoir produire ou vendre. Selon ton métier, l'impact comptable varie : achat de stock (comptant ou à crédit fournisseur), prépaiement de services externes, affectation de capacité humaine.",
    conseil: "Acheter à crédit préserve ta trésorerie, mais crée une dette à rembourser. Dans tous les cas, n'engage des ressources que pour ce que tu sais pouvoir transformer et vendre.",
  },
  3: {
    icone: "🛠️", titre: "Réalisation métier",
    description: "C'est le moment où ton entreprise crée vraiment de la valeur : Belvaux fabrique, Azura paie son canal, Véloce exécute ses tournées, Synergia livre ses missions. Les écritures comptables varient selon ton modèle économique mais le principe de partie double reste l'invariant.",
    principe: "Belvaux consomme sa matière première et constate une production stockée (2 écritures doubles). Azura paie un coût de canal fixe de 300 € (1 écriture double). Véloce et Synergia consomment des heures et constatent un en-cours de production (2 écritures doubles).",
    conseil: "Ne réalise que ce que tu peux absorber : trop produire gonfle les stocks sans générer de cash ; trop en-cours immobilise des charges non facturées. Pour Belvaux : produis en fonction de tes ventes attendues ; tu es borné par la matière achetée à l'étape 2.",
  },
  4: {
    icone: "🤝", titre: "Facturation & ventes",
    description: "Tu factures les clients servis ce trimestre. Chaque vente génère plusieurs écritures simultanées adaptées à ton métier : CA encaissé ou créancé, et contrepartie stock / production stockée / charges selon le cas.",
    principe: "Chaque vente déclenche plusieurs mouvements : ton chiffre d'affaires augmente ET ta contrepartie comptable s'ajuste. En négoce, ton stock baisse et le CMV monte. En production, tu extournes la production stockée. En service, tu ne déstockes rien.",
    conseil: "C'est le moment où tes efforts des étapes précédentes se transforment en revenus réels. Une vente mal servie (capacité dépassée) = client perdu. Anticipe ta capacité.",
  },
  5: {
    icone: "🎯", titre: "Décision du dirigeant",
    description: "Tu peux recruter un commercial (5a) puis investir dans une carte Décision (5b). Chaque carte a des effets immédiats et des effets récurrents. Ce choix est OPTIONNEL.",
    principe: "Tu peux recruter un commercial (charge de personnel) ou investir dans un équipement (immobilisation). Chaque choix a un coût immédiat et des effets à long terme sur ton entreprise.",
    conseil: "L'assurance protège des événements négatifs. La levée de fonds apporte des capitaux. Anticipe tes besoins avant d'investir.",
  },
  6: {
    icone: "🎲", titre: "Événement & ajustement",
    description: "Un événement imprévu affecte ton entreprise. Positif ou négatif : tu ne peux pas le refuser.",
    principe: "Un événement imprévu touche ton entreprise. S'il est positif, ta trésorerie ou tes revenus augmentent. S'il est négatif, tu subis une charge exceptionnelle. L'assurance peut te protéger.",
    conseil: "Avoir des réserves de trésorerie absorbe les chocs. L'assurance prévoyance annule certains événements négatifs.",
  },
  7: {
    icone: "🏛️", titre: "Clôture & bilan",
    description: "Fin du trimestre en deux temps : (1) les charges obligatoires retombent (loyer, énergie, assurances, amortissements, intérêts d'emprunt, effets récurrents des cartes actives) ; (2) on calcule ton résultat net, on vérifie l'équilibre du bilan, on contrôle la solvabilité et on met à jour ton score.",
    principe: "D'abord la clôture : ta trésorerie diminue du montant des charges obligatoires, tes équipements s'usent (amortissement), tes cartes actives déclenchent leurs effets récurrents. Puis le bilan : on calcule ton résultat (produits − charges). S'il est positif, tes capitaux propres augmentent. S'il est négatif, attention à la faillite.",
    conseil: "Ces charges sont obligatoires. L'amortissement n'est pas une sortie d'argent mais il réduit ton résultat. Résultat Net = Produits − Charges. Positif = tes capitaux propres montent. Négatif = ta solvabilité baisse.",
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
