import { DefiDirigeant } from "../../types";
/**
 * Mini-catalogue de démo pour les Vagues 2 et 3. 6 défis couvrant
 * l'arc émotionnel T1→T5 en durée 6, avec 3 archétypes et 3 tonalités
 * (observation/choix_binaire/choix_arbitrage/palier_strategique/consequence_differee).
 *
 * Les IDs sont stables : une partie qui mémorise un arc avec ces
 * IDs pourra être rechargée tant qu'ils existent dans le catalogue.
 */
export declare const CATALOGUE_V2: DefiDirigeant[];
/** Indexation par ID pour lookup O(1) lors de la résolution d'un arc. */
export declare const CATALOGUE_V2_INDEX: Record<string, DefiDirigeant>;
//# sourceMappingURL=catalogue-v2.d.ts.map