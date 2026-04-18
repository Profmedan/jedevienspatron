// ============================================================
// JEDEVIENSPATRON — Orchestration des Défis du dirigeant
// ============================================================
// Vague 1 : logique pure, sans catalogue ni intégration UI.
// Voir tasks/todo.md Tâche 24 pour le design complet.
//
// Contrat : tout est pur. Aucune mutation en place — chaque
// fonction retourne un nouvel état / une nouvelle structure.
// ============================================================

import {
  ArcDiffere,
  ChoixDefi,
  DefiDirigeant,
  DefiResolu,
  EffetCarte,
  EtatJeu,
  Joueur,
  SlotDramaturgique,
} from "./types";

// ─── PIOCHE D'UN DÉFI ────────────────────────────────────────

/**
 * Choisit un défi pour un slot donné parmi un catalogue, en tenant
 * compte de l'état du joueur et des défis déjà résolus (anti-répétition).
 *
 * Stratégie déterministe (fournir un `rng` pour un tirage reproductible) :
 *   1. Filtrer les défis du slot compatibles (tour, entreprise exclusive,
 *      condition, obligatoire, pas déjà résolu pour ce joueur).
 *   2. Prioriser les défis obligatoires (clôture, finale).
 *   3. Parmi les éligibles, tirer un défi via `rng` (défaut : Math.random).
 *
 * @returns Le défi choisi, ou `null` si aucun défi éligible.
 */
export function piocherDefi(
  etat: EtatJeu,
  joueur: Joueur,
  slot: SlotDramaturgique,
  catalogue: DefiDirigeant[],
  rng: () => number = Math.random
): DefiDirigeant | null {
  const defisResolus = etat.defisResolus ?? [];
  const idsDejaResolusParJoueur = new Set(
    defisResolus
      .filter((r) => r.joueurId === joueur.id)
      .map((r) => r.defiId)
  );

  const eligibles = catalogue.filter((defi) => {
    if (defi.slot !== slot) return false;
    if (etat.tourActuel < defi.tourMin) return false;
    if (defi.tourMax !== undefined && etat.tourActuel > defi.tourMax) return false;
    if (
      defi.entrepriseExclusive !== undefined &&
      joueur.entreprise.nom !== defi.entrepriseExclusive
    ) {
      return false;
    }
    if (idsDejaResolusParJoueur.has(defi.id)) return false;
    if (defi.condition !== undefined && !defi.condition(etat, joueur)) {
      return false;
    }
    return true;
  });

  if (eligibles.length === 0) return null;

  // Priorité aux défis obligatoires (clôture, finale).
  const obligatoires = eligibles.filter((d) => d.obligatoire);
  const pool = obligatoires.length > 0 ? obligatoires : eligibles;

  const index = Math.floor(rng() * pool.length);
  // Garde-fou : rng() peut retourner 1 dans des implémentations buggées.
  const indexSafe = Math.min(index, pool.length - 1);
  return pool[indexSafe];
}

// ─── APPLICATION D'UN CHOIX ──────────────────────────────────

/**
 * Résultat de l'application d'un choix de défi.
 * Volontairement structuré : le consommateur (engine / UI) décide
 * comment appliquer les effets immédiats au bilan, et comment
 * persister l'arc différé et la trace.
 */
export interface ResultatChoixDefi {
  /** Effets comptables à appliquer immédiatement au joueur. */
  effetsImmediats: EffetCarte[];
  /** Arc différé à ajouter à `etat.defisActifs` (null si aucun). */
  arcDiffereACreer: ArcDiffere | null;
  /** Trace à ajouter à `etat.defisResolus`. */
  trace: DefiResolu;
  /** Message pédagogique à afficher au joueur. */
  pedagogie: string;
}

/**
 * Calcule les conséquences d'un choix de défi, sans muter l'état.
 *
 * @param defi     Défi source (du catalogue).
 * @param choix    Choix retenu par le joueur.
 * @param etat     État courant (pour `tourActuel` et indexation d'arc).
 * @param joueur   Joueur concerné.
 * @returns        Un `ResultatChoixDefi` sérialisable.
 * @throws         Si le choix n'appartient pas au défi (détection de bug).
 */
export function appliquerChoixDefi(
  defi: DefiDirigeant,
  choix: ChoixDefi,
  etat: EtatJeu,
  joueur: Joueur
): ResultatChoixDefi {
  if (!defi.choix.some((c) => c.id === choix.id)) {
    throw new Error(
      `appliquerChoixDefi: choix "${choix.id}" absent du défi "${defi.id}".`
    );
  }

  // Construction de l'arc différé éventuel.
  let arcDiffereACreer: ArcDiffere | null = null;
  if (choix.effetsDiffere && choix.effetsDiffere.length > 0) {
    const effetsRestants = choix.effetsDiffere.map((e) => ({
      trimestreApplication: etat.tourActuel + e.dansNTrimestres,
      effets: e.effets,
      explication: e.explication,
    }));
    arcDiffereACreer = {
      id: `arc-${defi.id}-T${etat.tourActuel}-J${joueur.id}`,
      defiId: defi.id,
      joueurId: joueur.id,
      trimestreDeclenchement: etat.tourActuel,
      choixId: choix.id,
      effetsRestants,
    };
  }

  const trace: DefiResolu = {
    id: `defi-${defi.id}-T${etat.tourActuel}-J${joueur.id}`,
    defiId: defi.id,
    joueurId: joueur.id,
    trimestre: etat.tourActuel,
    slot: defi.slot,
    choixId: choix.id,
    conceptCible: defi.conceptCible,
  };

  return {
    effetsImmediats: choix.effetsImmediats,
    arcDiffereACreer,
    trace,
    pedagogie: choix.pedagogie,
  };
}

// ─── RÉSOLUTION DES CONSÉQUENCES DIFFÉRÉES ───────────────────

/**
 * Résultat de la résolution des conséquences différées pour un trimestre.
 * Toujours renvoyé par joueur, pour que l'engine sache où appliquer.
 */
export interface ResolutionEffetsDifferes {
  /** Effets à appliquer au joueur ciblé ce trimestre. */
  effetsAppliquer: Array<{
    joueurId: number;
    effets: EffetCarte[];
    explication: string;
    arcId: string;
  }>;
  /** Arcs mis à jour (avec effets restants réduits) — remplace `etat.defisActifs`. */
  defisActifsRestants: ArcDiffere[];
}

/**
 * Filtre les arcs actifs pour sortir les effets dont le trimestre
 * d'application est atteint (≤ tourActuel), et retourne un nouvel
 * ensemble d'arcs avec uniquement les effets restants.
 *
 * Les arcs vidés sont automatiquement retirés.
 */
export function resoudreConsequencesDifferees(etat: EtatJeu): ResolutionEffetsDifferes {
  const defisActifs = etat.defisActifs ?? [];
  const effetsAppliquer: ResolutionEffetsDifferes["effetsAppliquer"] = [];
  const defisActifsRestants: ArcDiffere[] = [];

  for (const arc of defisActifs) {
    const dus = arc.effetsRestants.filter(
      (e) => e.trimestreApplication <= etat.tourActuel
    );
    const futurs = arc.effetsRestants.filter(
      (e) => e.trimestreApplication > etat.tourActuel
    );

    for (const echeance of dus) {
      effetsAppliquer.push({
        joueurId: arc.joueurId,
        effets: echeance.effets,
        explication: echeance.explication,
        arcId: arc.id,
      });
    }

    // On ne garde l'arc que s'il reste des effets futurs.
    if (futurs.length > 0) {
      defisActifsRestants.push({
        ...arc,
        effetsRestants: futurs,
      });
    }
  }

  return { effetsAppliquer, defisActifsRestants };
}

// ─── FORMATAGE DU CONTEXTE NARRATIF ──────────────────────────

/** Détermine la saison (approximative) selon le numéro de trimestre. */
function saisonDeTour(tour: number): string {
  const saisons = ["Printemps", "Été", "Automne", "Hiver"];
  // tour 1 -> Printemps (index 0) ; les trimestres se suivent.
  const idx = ((tour - 1) % 4 + 4) % 4;
  return saisons[idx];
}

/** Renvoie la trésorerie nette (tresorerie - découvert) à partir du bilan. */
function tresorerieNette(joueur: Joueur): number {
  const tresorerie = joueur.bilan.actifs
    .filter((p) => p.categorie === "tresorerie")
    .reduce((acc, p) => acc + p.valeur, 0);
  return tresorerie - joueur.bilan.decouvert;
}

/**
 * Remplace les tokens d'un contexte narratif par les valeurs réelles
 * du joueur / de l'état. Tokens supportés :
 *   - `{pseudo}`     : pseudo du joueur (ou "dirigeant" si vide)
 *   - `{entreprise}` : nom de l'entreprise
 *   - `{saison}`     : saison déduite du trimestre (Printemps/Été/Automne/Hiver)
 *   - `{tresorerie}` : trésorerie nette formatée (ex: "3 000 €")
 *   - `{tour}`       : numéro du trimestre (1..nbToursMax)
 *
 * Les tokens inconnus sont laissés tels quels (visible = bug à corriger).
 */
export function formatContexte(
  template: string,
  etat: EtatJeu,
  joueur: Joueur
): string {
  const pseudo = joueur.pseudo && joueur.pseudo.trim().length > 0
    ? joueur.pseudo
    : "dirigeant";
  const tresorerieFmt = formaterEuros(tresorerieNette(joueur));
  const remplacements: Record<string, string> = {
    "{pseudo}": pseudo,
    "{entreprise}": joueur.entreprise.nom,
    "{saison}": saisonDeTour(etat.tourActuel),
    "{tresorerie}": tresorerieFmt,
    "{tour}": String(etat.tourActuel),
  };

  let resultat = template;
  for (const [token, valeur] of Object.entries(remplacements)) {
    resultat = resultat.split(token).join(valeur);
  }
  return resultat;
}

/** Formate un montant en euros avec séparateur milliers (espace insécable). */
function formaterEuros(montant: number): string {
  const signe = montant < 0 ? "-" : "";
  const abs = Math.abs(montant);
  // Séparateur milliers = espace fine insécable (U+202F).
  const entier = abs.toLocaleString("fr-FR").replace(/\u00A0/g, "\u202F");
  return `${signe}${entier}\u202F€`;
}
