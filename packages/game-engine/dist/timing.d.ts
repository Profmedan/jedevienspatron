import { RuptureType, SlotDramaturgique } from "./types";
/**
 * Décrit la nature dramaturgique d'un trimestre.
 * V2 : uniquement "resiste" (T3) et "finale" (dernier trim). Les
 * autres ruptures restent à câbler avec le catalogue complet.
 *
 * @param tour        Trimestre courant (1..nbToursMax).
 * @param nbToursMax  Durée totale de la partie (6, 8, 10 ou 12).
 * @returns           Le type de rupture, ou null si trimestre "calme".
 */
export declare function determinerTimingRupture(tour: number, nbToursMax: number): RuptureType | null;
/**
 * Détermine si le trimestre courant doit déclencher une clôture d'exercice.
 *
 * Règle arbitrée par Pierre (cf. tasks/plan-b6-fin-exercice.md §1) :
 *  - Tout trimestre multiple de `NB_TRIMESTRES_PAR_EXERCICE` (4) clôture
 *    un exercice comptable (T4, T8, T12...).
 *  - Le dernier trimestre de la partie clôture également — même s'il n'est
 *    pas un multiple de 4, on doit fermer les comptes avant la fin.
 *
 * Conséquence : une partie 6 trimestres déclenche la clôture à T4 puis à T6
 * (exercice court de 2 trimestres). Une partie 8 trimestres la déclenche à
 * T4 puis T8. Une partie 12 trimestres : T4, T8, T12.
 *
 * @param tourActuel  Trimestre courant (1..nbToursMax).
 * @param nbToursMax  Durée totale de la partie (6, 8, 10 ou 12).
 * @returns           true si une clôture d'exercice doit être proposée.
 */
export declare function estFinExercice(tourActuel: number, nbToursMax: number): boolean;
/**
 * Liste les slots dramaturgiques consultables à ce tour.
 * Toujours retourne au moins `debut_tour` (qui sert aussi à la
 * résolution des arcs différés — le pipeline a besoin de le consulter
 * à chaque ouverture de trimestre).
 *
 * V2 minimaliste :
 *  - `debut_tour`     : toujours (pour arcs différés + défis de tour)
 *  - `avant_decision` : à partir de T3 (premier palier stratégique)
 *  - `finale`         : dernier trimestre
 *
 * V3+ ajoutera `apres_ventes`, `avant_bilan`, `fin_exercice`.
 */
export declare function determinerSlotsActifs(tour: number, nbToursMax: number): SlotDramaturgique[];
//# sourceMappingURL=timing.d.ts.map