/**
 * Utilitaires pour le jeu sérieux
 * - Classification des postes comptables
 * - Noms et labels standardisés
 * - Sens des écritures (débit/crédit)
 */

export const ACTIF_KEYS = [
  "tresorerie",
  "stocks",
  "immobilisations",
  "creancesPlus1",
  "creancesPlus2",
  "decouvert",
];

export const PASSIF_KEYS = [
  "capitaux",
  "emprunts",
  "dettes",
  "dettesFiscales",
];

export const CHARGES_KEYS = [
  "achats",
  "servicesExterieurs",
  "impotsTaxes",
  "chargesInteret",
  "chargesPersonnel",
  "chargesExceptionnelles",
  "dotationsAmortissements",
];

export const PRODUITS_KEYS = [
  "ventes",
  "productionStockee",
  "produitsFinanciers",
  "revenusExceptionnels",
];

export type SensEcriture = "debit" | "credit";

export function getSens(poste: string, delta: number): SensEcriture {
  const p = poste.toLowerCase();
  const isActif = ACTIF_KEYS.some((k) => p.includes(k));
  const isCharge = CHARGES_KEYS.some((k) => p.includes(k));
  const isPassif = PASSIF_KEYS.some((k) => p.includes(k));
  const isProduit = PRODUITS_KEYS.some((k) => p.includes(k));

  if ((isActif || isCharge) && delta >= 0) return "debit";
  if ((isActif || isCharge) && delta < 0) return "credit";
  if ((isPassif || isProduit) && delta >= 0) return "credit";
  return "debit";
}

export function nomCompte(poste: string): string {
  const map: Record<string, string> = {
    tresorerie: "Trésorerie",
    stocks: "Stocks de marchandises",
    immobilisations: "Immobilisations",
    creancesPlus1: "Créances clients C+1",
    creancesPlus2: "Créances clients C+2",
    decouvert: "Découvert bancaire",
    capitaux: "Capitaux propres",
    emprunts: "Emprunts",
    dettes: "Dettes fournisseurs",
    dettesFiscales: "Dettes fiscales",
    achats: "Achats (CMV)",
    servicesExterieurs: "Services extérieurs",
    impotsTaxes: "Impôts & taxes",
    chargesInteret: "Charges d'intérêt",
    chargesPersonnel: "Charges de personnel",
    chargesExceptionnelles: "Charges exceptionnelles",
    dotationsAmortissements: "Dotations aux amortissements",
    ventes: "Ventes",
    productionStockee: "Production stockée",
    produitsFinanciers: "Produits financiers",
    revenusExceptionnels: "Revenus exceptionnels",
  };

  for (const [k, v] of Object.entries(map)) {
    if (poste.toLowerCase().includes(k)) return v;
  }
  return poste;
}

export interface DocumentInfo {
  label: string;
  detail: string;
  badge: string;
}

export function getDocument(poste: string): DocumentInfo {
  if (ACTIF_KEYS.includes(poste))
    return { label: "Bilan", detail: "Actif", badge: "bg-blue-100 text-blue-700" };
  if (PASSIF_KEYS.includes(poste))
    return { label: "Bilan", detail: "Passif", badge: "bg-orange-100 text-orange-700" };
  if (CHARGES_KEYS.includes(poste))
    return { label: "Compte de résultat", detail: "Charge", badge: "bg-red-100 text-red-700" };
  if (PRODUITS_KEYS.includes(poste))
    return { label: "Compte de résultat", detail: "Produit", badge: "bg-green-100 text-green-700" };

  return { label: "?", detail: "", badge: "bg-gray-100 text-gray-500" };
}
