import { ArcDiffere, ChoixDefi, DefiDirigeant, DefiResolu, EffetCarte, EtatJeu, Joueur, SlotDramaturgique } from "./types";
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
export declare function piocherDefi(etat: EtatJeu, joueur: Joueur, slot: SlotDramaturgique, catalogue: DefiDirigeant[], rng?: () => number): DefiDirigeant | null;
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
export declare function appliquerChoixDefi(defi: DefiDirigeant, choix: ChoixDefi, etat: EtatJeu, joueur: Joueur): ResultatChoixDefi;
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
export declare function resoudreConsequencesDifferees(etat: EtatJeu): ResolutionEffetsDifferes;
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
export declare function formatContexte(template: string, etat: EtatJeu, joueur: Joueur): string;
//# sourceMappingURL=defis.d.ts.map