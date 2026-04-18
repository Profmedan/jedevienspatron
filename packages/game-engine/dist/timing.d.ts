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