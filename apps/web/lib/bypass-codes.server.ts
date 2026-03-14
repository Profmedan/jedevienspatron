// JEDEVIENSPATRON — Codes d'accès bypass (documentation)
// Les codes et leurs limites sont gérés dans Supabase (table bypass_codes).
// Ce fichier sert de référence — NE PAS importer dans des composants client.
//
// Migration : supabase/migrations/002_bypass_codes.sql
//
// Code       | Limite      | Usage prévu
// -----------|-------------|---------------------------
// 56B8F74X   |  50 parties | Démonstrations ponctuelles
// 8UQCXNEC   | 100 parties | Classe / petit groupe
// MXFKCNUW   | 150 parties | Formation courte
// RZYJ4SY2   | 200 parties | Établissement scolaire
// TX9UAT5F   | 250 parties | CCI / organisme de formation
// UF8R929T   | Illimité    | Usage personnel Pierre Médan

export const BYPASS_CODE_PATTERN = /^[A-Z0-9]{8}$/;

export function looksLikeBypassCode(code: string): boolean {
  return BYPASS_CODE_PATTERN.test(code.trim().toUpperCase());
}
