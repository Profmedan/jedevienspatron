// ============================================================
// KICLEPATRON — Calculateurs financiers
// Extraits de KICLEPATRON_v2.html — Pierre Médan
// ============================================================

import {
  Joueur,
  IndicateursFinanciers,
  Charges,
  Produits,
} from "@/lib/game-engine/types";

// ─── TOTAUX BILAN ────────────────────────────────────────────

export function getTotalActif(joueur: Joueur): number {
  const actifs = joueur.bilan.actifs.reduce((s, a) => s + a.valeur, 0);
  const creances = joueur.bilan.creancesPlus1 + joueur.bilan.creancesPlus2;
  return actifs + creances;
  // Note : le découvert est un actif négatif traité côté passif
}

export function getTotalImmobilisations(joueur: Joueur): number {
  return joueur.bilan.actifs
    .filter((a) => a.categorie === "immobilisations")
    .reduce((s, a) => s + a.valeur, 0);
}

export function getTotalStocks(joueur: Joueur): number {
  return joueur.bilan.actifs
    .filter((a) => a.categorie === "stocks")
    .reduce((s, a) => s + a.valeur, 0);
}

export function getTresorerie(joueur: Joueur): number {
  const t = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie");
  return t ? t.valeur : 0;
}

export function getTotalPassif(joueur: Joueur): number {
  const passifs = joueur.bilan.actifs
    .filter((a) => a.categorie !== "tresorerie") // hors tréso
    .reduce((s) => s, 0); // placeholder
  const passifsBruts = joueur.bilan.passifs.reduce((s, p) => s + p.valeur, 0);
  const decouvert = joueur.bilan.decouvert;
  const dettes = joueur.bilan.dettes + joueur.bilan.dettesFiscales;
  const resultat = getResultatNet(joueur);
  return passifsBruts + decouvert + dettes + resultat;
}

// ─── COMPTE DE RÉSULTAT ─────────────────────────────────────

export function getTotalCharges(charges: Charges): number {
  return (
    charges.achats +
    charges.servicesExterieurs +
    charges.impotsTaxes +
    charges.chargesInteret +
    charges.chargesPersonnel +
    charges.chargesExceptionnelles +
    charges.dotationsAmortissements
  );
}

export function getTotalProduits(produits: Produits): number {
  return (
    produits.ventes +
    produits.productionStockee +
    produits.produitsFinanciers +
    produits.revenusExceptionnels
  );
}

export function getResultatNet(joueur: Joueur): number {
  return (
    getTotalProduits(joueur.compteResultat.produits) -
    getTotalCharges(joueur.compteResultat.charges)
  );
}

// ─── ÉQUILIBRE ───────────────────────────────────────────────
/**
 * Vérifie l'équation fondamentale :
 *   ACTIF + CHARGES = PASSIF + PRODUITS
 * (équivalent à ACTIF = PASSIF + RÉSULTAT)
 */
export function verifierEquilibre(joueur: Joueur): {
  equilibre: boolean;
  totalActif: number;
  totalPassif: number;
  ecart: number;
} {
  const totalActif = getTotalActif(joueur);
  const totalPassif = joueur.bilan.passifs.reduce((s, p) => s + p.valeur, 0) +
    joueur.bilan.decouvert + joueur.bilan.dettes + joueur.bilan.dettesFiscales;
  const ecart = totalActif - totalPassif - getResultatNet(joueur);
  return {
    equilibre: Math.abs(ecart) < 0.001,
    totalActif,
    totalPassif: totalPassif + getResultatNet(joueur),
    ecart,
  };
}

// ─── INDICATEURS FINANCIERS ───────────────────────────────────

export function calculerIndicateurs(joueur: Joueur): IndicateursFinanciers {
  const totalActif = getTotalActif(joueur);
  const immo = getTotalImmobilisations(joueur);
  const stocks = getTotalStocks(joueur);
  const tresorerie = getTresorerie(joueur);
  const creances = joueur.bilan.creancesPlus1 + joueur.bilan.creancesPlus2;
  const capitauxPropres = joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
  const emprunts = joueur.bilan.passifs
    .filter((p) => p.categorie === "emprunts")
    .reduce((s, p) => s + p.valeur, 0);
  const dettes = joueur.bilan.dettes + joueur.bilan.dettesFiscales;
  const resultatNet = getResultatNet(joueur);
  const totalPassif =
    capitauxPropres + emprunts + dettes + joueur.bilan.decouvert + resultatNet;
  const dotations = joueur.compteResultat.charges.dotationsAmortissements;

  // Fonds de Roulement = Capitaux permanents - Immobilisations
  const capitauxPermanents = capitauxPropres + resultatNet + emprunts;
  const fondsDeRoulement = capitauxPermanents - immo;

  // Besoin Fonds de Roulement = Stocks + Créances - Dettes exploitation
  const besoinFondsRoulement = stocks + creances - dettes;

  // Trésorerie Nette = FR - BFR
  const tresorerieNette = fondsDeRoulement - besoinFondsRoulement;

  // CAF = Résultat net + Dotations amortissements
  const capaciteAutofinancement = resultatNet + dotations;

  // Liquidité = Actif circulant / Dettes court terme
  const actifCirculant = stocks + creances + tresorerie;
  const dettesCourtTerme = dettes + joueur.bilan.decouvert || 1;
  const ratioLiquidite = actifCirculant / dettesCourtTerme;

  // Solvabilité = (Capitaux propres + Résultat) / Total Passif × 100
  const ratioSolvabilite =
    totalPassif > 0
      ? ((capitauxPropres + resultatNet) / totalPassif) * 100
      : 0;

  const { equilibre } = verifierEquilibre(joueur);

  return {
    totalActif,
    totalPassif,
    resultatNet,
    fondsDeRoulement,
    besoinFondsRoulement,
    tresorerieNette,
    capaciteAutofinancement,
    ratioLiquidite,
    ratioSolvabilite,
    equilibre,
  };
}

// ─── SCORE FINAL ─────────────────────────────────────────────
/**
 * Score = (Résultat Net × 3) + (Immobilisations × 2) + Trésorerie + Solvabilité
 */
export function calculerScore(joueur: Joueur): number {
  const indicateurs = calculerIndicateurs(joueur);
  const resultat = indicateurs.resultatNet;
  const immo = getTotalImmobilisations(joueur);
  const tresorerie = getTresorerie(joueur);
  const solvabilite = indicateurs.ratioSolvabilite;

  return (
    resultat * 3 +
    immo * 2 +
    tresorerie +
    Math.round(solvabilite)
  );
}

// ─── VÉRIFICATION FAILLITE ───────────────────────────────────

export interface ResultatVerifFaillite {
  enFaillite: boolean;
  raison?: string;
}

export function verifierFaillite(joueur: Joueur): ResultatVerifFaillite {
  const { decouvert } = joueur.bilan;
  const capitauxPropres = joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
  const emprunts = joueur.bilan.passifs
    .filter((p) => p.categorie === "emprunts")
    .reduce((s, p) => s + p.valeur, 0);
  const resultatNet = getResultatNet(joueur);
  const capitauxTotaux = capitauxPropres + resultatNet;
  const dettesTotales = joueur.bilan.dettes + joueur.bilan.dettesFiscales + emprunts;

  if (decouvert > 5) {
    return { enFaillite: true, raison: `Découvert bancaire excessif (${decouvert} > 5 maximum)` };
  }
  if (capitauxTotaux < 0) {
    return { enFaillite: true, raison: "Capitaux propres négatifs — l'entreprise est insolvable" };
  }
  if (dettesTotales > 0 && dettesTotales > capitauxTotaux * 2) {
    return {
      enFaillite: true,
      raison: `Surendettement : dettes (${dettesTotales}) > 2× capitaux (${capitauxTotaux})`,
    };
  }

  return { enFaillite: false };
}
