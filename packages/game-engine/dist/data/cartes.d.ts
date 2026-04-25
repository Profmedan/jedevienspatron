import { CarteCommercial, CarteClient, CarteDecision, CarteEvenement } from "../types";
export declare const CLIENT_CARD_ID_BY_TYPE: {
    readonly particulier: "client-particulier";
    readonly tpe: "client-tpe";
    readonly grand_compte: "client-grand-compte";
};
/**
 * Mapping inverse : id de carte client → type métier.
 *
 * Construit automatiquement à partir de CLIENT_CARD_ID_BY_TYPE pour rester
 * synchronisé. Utilisé par `appliquerCarteClient` (LOT 2.2) pour appliquer
 * le `baremeRevenus` propre à chaque entreprise.
 */
export declare const TYPE_BY_CLIENT_CARD_ID: Record<string, "particulier" | "tpe" | "grand_compte">;
export declare const CARTES_COMMERCIAUX: CarteCommercial[];
export declare const CARTES_CLIENTS: CarteClient[];
export declare const CARTES_DECISION: CarteDecision[];
export declare const CARTES_EVENEMENTS: CarteEvenement[];
export declare const CARTES_LOGISTIQUES: CarteDecision[];
//# sourceMappingURL=cartes.d.ts.map