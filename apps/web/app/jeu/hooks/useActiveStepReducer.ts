/**
 * Typed reducer for ActiveStep state management
 * Consolidates 15+ setActiveStep patterns into a single, type-safe reducer
 */

import { type ActiveStep } from "@/components/jeu";

export type ActiveStepAction =
  | { type: "SET_STEP"; step: ActiveStep | null }
  | { type: "CLEAR_STEP" }
  | { type: "APPLY_ENTRY"; entryId: string }
  | { type: "APPLY_SALE_GROUP"; saleGroupId: string }
  | { type: "SET_ALL_ENTRIES_APPLIED" };

/**
 * Reducer function for ActiveStep
 *
 * Handles all state mutations previously done with setActiveStep patterns:
 * - SET_STEP: Replace entire step (from buildActiveStep calls)
 * - CLEAR_STEP: Set to null (confirmActiveStep, skipDecision, etc.)
 * - APPLY_ENTRY: Mark single entry as applied (applyEntry)
 * - APPLY_SALE_GROUP: Mark all entries with matching saleGroupId as applied (applySaleGroup)
 * - SET_ALL_ENTRIES_APPLIED: Mark all entries applied at once (modeRapide auto-etapes)
 */
export function activeStepReducer(
  state: ActiveStep | null,
  action: ActiveStepAction
): ActiveStep | null {
  switch (action.type) {
    case "SET_STEP":
      return action.step;

    case "CLEAR_STEP":
      return null;

    case "APPLY_ENTRY":
      if (!state) return null;
      return {
        ...state,
        entries: state.entries.map(e =>
          e.id === action.entryId ? { ...e, applied: true } : e
        ),
      };

    case "APPLY_SALE_GROUP":
      if (!state) return null;
      return {
        ...state,
        entries: state.entries.map(e =>
          e.saleGroupId === action.saleGroupId ? { ...e, applied: true } : e
        ),
      };

    case "SET_ALL_ENTRIES_APPLIED":
      if (!state) return null;
      return {
        ...state,
        entries: state.entries.map(e => ({ ...e, applied: true })),
      };

    default:
      const _exhaustive: never = action;
      return _exhaustive;
  }
}
