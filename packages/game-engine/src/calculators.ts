// ============================================================
// JEDEVIENSPATRON — Calculateurs financiers
// Extraits de JEDEVIENSPATRON_v2.html — Pierre Médan
// ============================================================

import {
  Joueur,
  IndicateursFinanciers,
  Charges,
  Produits,
  ResultatDemandePret,
  TAUX_INTERET_ANNUEL,
  TAUX_INTERET_MAJORE,
} from "./types";

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
  const passifsBruts = joueur.bilan.passifs.reduce((s, p) => s + p.valeur, 0);
  const decouvert = joueur.bilan.decouvert;
  const dettes = joueur.bilan.dettes + (joueur.bilan.dettesD2 ?? 0) + joueur.bilan.dettesFiscales;
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
    joueur.bilan.decouvert + joueur.bilan.dettes + (joueur.bilan.dettesD2 ?? 0) + joueur.bilan.dettesFiscales;
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
  const dettes = joueur.bilan.dettes + (joueur.bilan.dettesD2 ?? 0) + joueur.bilan.dettesFiscales;
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

// ─── INTÉRÊTS SUR EMPRUNT ─────────────────────────────────────
/**
 * Calcule les intérêts trimestriels sur le capital restant dû.
 * Formule : ROUND(empruntsTotal × taux_annuel / 400)
 * Taux standard 5%/an → 1.25%/trimestre
 * Taux majoré 8%/an (situation fragile) → 2%/trimestre
 */
export function calculerInterets(empruntsTotal: number, majore: boolean = false): number {
  const taux = majore ? TAUX_INTERET_MAJORE : TAUX_INTERET_ANNUEL;
  return Math.round(empruntsTotal * taux / 400);
}

// ─── SCORING BANCAIRE ─────────────────────────────────────────
/**
 * Score bancaire sur 100 points — 5 critères :
 * 1. Solvabilité (30 pts)
 * 2. Résultat net (25 pts)
 * 3. Trésorerie disponible (20 pts)
 * 4. Taux d'endettement / actif (15 pts)
 * 5. Montant demandé / actif (10 pts)
 *
 * Accepté si score >= 50
 * Taux majoré (8%/an) si score < 65 mais >= 50
 */
export function scorerDemandePret(
  joueur: Joueur,
  montantDemande: number
): ResultatDemandePret {
  const ind = calculerIndicateurs(joueur);
  let score = 0;
  const details: string[] = [];

  // ── Critère 1 : Solvabilité (30 pts) ──
  const solv = ind.ratioSolvabilite;
  if (solv >= 40) { score += 30; details.push("Solvabilité solide ✓"); }
  else if (solv >= 30) { score += 20; details.push("Solvabilité acceptable"); }
  else if (solv >= 20) { score += 10; details.push("Solvabilité fragile"); }
  else { details.push("Solvabilité insuffisante ✗"); }

  // ── Critère 2 : Résultat net (25 pts) ──
  if (ind.resultatNet > 0) { score += 25; details.push("Résultat bénéficiaire ✓"); }
  else if (ind.resultatNet === 0) { score += 10; details.push("Résultat nul (neutre)"); }
  else { details.push("Résultat déficitaire ✗"); }

  // ── Critère 3 : Trésorerie (20 pts) ──
  const treso = getTresorerie(joueur);
  if (treso >= 5) { score += 20; details.push("Trésorerie confortable ✓"); }
  else if (treso >= 2) { score += 10; details.push("Trésorerie limitée"); }
  else if (treso >= 0) { score += 5; details.push("Trésorerie très faible"); }
  else { details.push("Découvert bancaire ✗"); }

  // ── Critère 4 : Taux d'endettement / Actif total (15 pts) ──
  const emprunts = joueur.bilan.passifs
    .filter((p) => p.categorie === "emprunts")
    .reduce((s, p) => s + p.valeur, 0);
  const tauxEndettement = ind.totalActif > 0 ? (emprunts / ind.totalActif) * 100 : 100;
  if (tauxEndettement < 30) { score += 15; details.push("Endettement faible ✓"); }
  else if (tauxEndettement < 50) { score += 10; details.push("Endettement modéré"); }
  else if (tauxEndettement < 70) { score += 5; details.push("Endettement élevé"); }
  else { details.push("Endettement excessif ✗"); }

  // ── Critère 5 : Montant demandé / Actif total (10 pts) ──
  const ratioPret = ind.totalActif > 0 ? (montantDemande / ind.totalActif) * 100 : 100;
  if (ratioPret <= 10) { score += 10; details.push("Montant raisonnable ✓"); }
  else if (ratioPret <= 20) { score += 5; details.push("Montant acceptable"); }
  else { details.push("Montant trop élevé ✗"); }

  const accepte = score >= 50;
  const tauxMajore = accepte && score < 65;

  let raison: string;
  if (!accepte) {
    raison = `Score ${score}/100 — insuffisant (min 50). ${details.filter(d => d.includes("✗")).join(", ")}.`;
  } else if (tauxMajore) {
    raison = `Score ${score}/100 — accordé avec taux majoré (8%/an). ${details.filter(d => !d.includes("✓")).join(", ")}.`;
  } else {
    raison = `Score ${score}/100 — accordé au taux standard (5%/an). ${details.filter(d => d.includes("✓")).join(", ")}.`;
  }

  return {
    accepte,
    montantAccorde: accepte ? montantDemande : 0,
    tauxMajore,
    score,
    raison,
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
  const capitauxPropres = joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
  const resultatNet = getResultatNet(joueur);
  const capitauxTotaux = capitauxPropres + resultatNet;

  // Faillite absolue : capitaux propres négatifs = insolvabilité irrémédiable
  if (capitauxTotaux < 0) {
    return { enFaillite: true, raison: "Capitaux propres négatifs — l'entreprise est insolvable" };
  }

  // Note : le découvert > 5 est traité en amont comme un déclencheur de demande de prêt.
  // La faillite sur découvert n'intervient que si la banque refuse ET que les capitaux sont
  // négatifs (condition ci-dessus). Le jeu laisse le joueur tenter un emprunt en urgence.

  return { enFaillite: false };
}
