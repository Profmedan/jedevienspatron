// JEDEVIENSPATRON — Codes d'accès bypass (côté serveur uniquement)
// Ces codes permettent d'accéder au jeu complet sans passer par le paiement.
// NE PAS importer ce fichier dans des composants client.

export const BYPASS_CODES: ReadonlySet<string> = new Set([
  "56B8F74X",
  "8UQCXNEC",
  "MXFKCNUW",
  "RZYJ4SY2",
  "TX9UAT5F",
  "UF8R929T",
]);

export function isBypassCode(code: string): boolean {
  return BYPASS_CODES.has(code.trim().toUpperCase());
}
