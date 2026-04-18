// ============================================================
// JEDEVIENSPATRON — Timing dramaturgique des Défis du dirigeant
// ============================================================
// Fonctions pures qui décident :
//   - à quel trimestre un basculement narratif se produit (RuptureType)
//   - quels slots dramaturgiques sont consultables à un tour donné
//
// V2 minimaliste (cf. tasks/todo.md Tâche 24 Vague 2) :
// - T1, T2            → rien (observation silencieuse, pas de rupture)
// - T3                → "resiste"  (premier basculement)
// - Dernier trimestre → "finale"
// - Autres            → null (juge / revient / second_palier viendront
//                        avec le catalogue complet — Vague 4)
//
// La fonction est intentionnellement indépendante du contenu du catalogue.
// Son rôle est de répondre à : "où devrais-je consulter un défi ?"
// Le catalogue décide ensuite "quel défi y a-t-il effectivement ?".
// ============================================================

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
export function determinerTimingRupture(
  tour: number,
  nbToursMax: number
): RuptureType | null {
  if (tour < 1 || tour > nbToursMax) return null;
  if (tour === nbToursMax) return "finale";
  if (tour === 3) return "resiste";
  return null;
}

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
export function determinerSlotsActifs(
  tour: number,
  nbToursMax: number
): SlotDramaturgique[] {
  const slots: SlotDramaturgique[] = [];
  if (tour < 1 || tour > nbToursMax) return slots;

  // Toujours consulté : porte la résolution des arcs différés.
  slots.push("debut_tour");

  // Palier stratégique : disponible dès T3.
  if (tour >= 3) slots.push("avant_decision");

  // Finale : dernier trimestre uniquement.
  if (tour === nbToursMax) slots.push("finale");

  return slots;
}
