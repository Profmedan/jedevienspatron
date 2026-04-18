import { DefiDirigeant } from "../../types";
/**
 * Mini-catalogue de démo pour la Vague 2. 5 défis couvrant
 * l'arc émotionnel T1→T5 en durée 6.
 *
 * Les IDs sont stables : une partie qui mémorise un arc avec ces
 * IDs pourra être rechargée tant qu'ils existent dans le catalogue.
 */
export declare const CATALOGUE_V2: DefiDirigeant[];
/** Indexation par ID pour lookup O(1) lors de la résolution d'un arc. */
export declare const CATALOGUE_V2_INDEX: Record<string, DefiDirigeant>;
//# sourceMappingURL=catalogue-v2.d.ts.map