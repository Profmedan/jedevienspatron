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
  DECOUVERT_MAX,
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

// ─── SIG SIMPLIFIÉ (5 indicateurs clés) ─────────────────────
export interface SIGSimplifie {
  ca: number;
  marge: number;
  ebe: number;
  resultatNet: number;
  tresorerie: number;
}

export function calculerSIGSimplifie(joueur: Joueur): SIGSimplifie {
  const ca = joueur.compteResultat.produits.ventes;
  const achats = joueur.compteResultat.charges.achats;
  const marge = ca - achats;
  const servExt = joueur.compteResultat.charges.servicesExterieurs;
  const va = marge - servExt;  // Valeur Ajoutée simplifiée
  const personnel = joueur.compteResultat.charges.chargesPersonnel;
  const impots = joueur.compteResultat.charges.impotsTaxes;
  const ebe = va - personnel - impots;
  const resultatNet = getResultatNet(joueur);
  const tresorerie = getTresorerie(joueur);
  return { ca, marge, ebe, resultatNet, tresorerie };
}

// ─── INTÉRÊTS SUR EMPRUNT ─────────────────────────────────────
export function calculerInterets(empruntsTotal: number, majore: boolean = false): number {
  const taux = majore ? TAUX_INTERET_MAJORE : TAUX_INTERET_ANNUEL;
  return Math.round(empruntsTotal * taux / 400);
}

// ─── SCORING BANCAIRE ─────────────────────────────────────────
// tourActuel : passé depuis engine.ts pour la clause de bienveillance (tours 1-2)
export function scorerDemandePret(
  joueur: Joueur,
  montantDemande: number,
  tourActuel: number = 999
): ResultatDemandePret {
  const ind = calculerIndicateurs(joueur);
  let score = 0;
  const details: string[] = [];

  // Clause de bienveillance : bonus +15 pts pour les deux premiers trimestres.
  // La banque regarde le potentiel de démarrage, pas encore les résultats.
  if (tourActuel <= 2) {
    score += 15;
    details.push("Entreprise en démarrage — bonus bienveillance banque ✓");
  }

  const solv = ind.ratioSolvabilite;
  if (solv >= 40) { score += 30; details.push("Solvabilité solide ✓"); }
  else if (solv >= 30) { score += 20; details.push("Solvabilité acceptable"); }
  else if (solv >= 20) { score += 10; details.push("Solvabilité fragile"); }
  else { details.push("Solvabilité insuffisante ✗"); }

  if (ind.resultatNet > 0) { score += 25; details.push("Résultat bénéficiaire ✓"); }
  else if (ind.resultatNet === 0) { score += 10; details.push("Résultat nul (neutre)"); }
  else { details.push("Résultat déficitaire ✗"); }

  const treso = getTresorerie(joueur);
  if (treso >= 5000) { score += 20; details.push("Trésorerie confortable ✓"); }
  else if (treso >= 2000) { score += 10; details.push("Trésorerie limitée"); }
  else if (treso >= 0) { score += 5; details.push("Trésorerie très faible"); }
  else { details.push("Découvert bancaire ✗"); }

  const emprunts = joueur.bilan.passifs
    .filter((p) => p.categorie === "emprunts")
    .reduce((s, p) => s + p.valeur, 0);
  const tauxEndettement = ind.totalActif > 0 ? (emprunts / ind.totalActif) * 100 : 100;
  if (tauxEndettement < 30) { score += 15; details.push("Endettement faible ✓"); }
  else if (tauxEndettement < 50) { score += 10; details.push("Endettement modéré"); }
  else if (tauxEndettement < 70) { score += 5; details.push("Endettement élevé"); }
  else { details.push("Endettement excessif ✗"); }

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

  return { accepte, montantAccorde: accepte ? montantDemande : 0, tauxMajore, score, raison };
}

// ─── VÉRIFICATION FAILLITE (PROGRESSIVE) ─────────────────────
export function verifierFailliteProgressive(joueur: Joueur): { enFaillite: boolean; raison?: string } {
  const capitauxPropres = joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
  const resultatNet = getResultatNet(joueur);
  const capitauxTotaux = capitauxPropres + resultatNet;
  if (capitauxTotaux < 0) {
    return { enFaillite: true, raison: "Capitaux propres négatifs — l'entreprise est insolvable" };
  }
  return { enFaillite: false };
}

// ─── SOLDES INTERMÉDIAIRES DE GESTION (SIG) ──────────────────

export interface SIG {
  // Cascade de formation du résultat
  chiffreAffaires: number;
  achats: number;
  servicesExterieurs: number;
  valeurAjoutee: number;
  chargesPersonnel: number;
  impotsTaxes: number;
  ebe: number;
  dotations: number;
  resultatExploitation: number;
  produitsFinanciers: number;
  chargesInteret: number;
  rcai: number;
  revenusExceptionnels: number;
  chargesExceptionnelles: number;
  resultatExceptionnel: number;
  resultatNet: number;
  // Indicateurs de rentabilité
  tauxMargeNette: number;       // Résultat net / CA × 100
  tauxMargeEBE: number;         // EBE / CA × 100
  roe: number;                  // Résultat net / Capitaux propres × 100
  rentabiliteEconomique: number; // Résultat exploitation / Total actif × 100
  // Ratios de gestion (en jours, annualisés ×4 pour les trimestres)
  delaiClients: number;         // Créances × 360 / (CA annualisé)
}

export function calculerSIG(joueur: Joueur): SIG {
  const cr  = joueur.compteResultat;
  const ca  = cr.produits.ventes;
  const achats = cr.charges.achats;
  const servExt = cr.charges.servicesExterieurs;

  // 1. Valeur Ajoutée = CA − Achats − Services extérieurs
  const valeurAjoutee = ca - achats - servExt;

  // 2. EBE = VA − Charges de personnel − Impôts & taxes
  const chargesPerso = cr.charges.chargesPersonnel;
  const impots       = cr.charges.impotsTaxes;
  const ebe          = valeurAjoutee - chargesPerso - impots;

  // 3. Résultat d'exploitation = EBE − Dotations aux amortissements
  const dotations           = cr.charges.dotationsAmortissements;
  const resultatExploitation = ebe - dotations;

  // 4. RCAI = Résultat exploitation + Produits financiers − Charges d'intérêt
  const prodFin       = cr.produits.produitsFinanciers;
  const chargesInt    = cr.charges.chargesInteret;
  const rcai          = resultatExploitation + prodFin - chargesInt;

  // 5. Résultat exceptionnel = Revenus exceptionnels − Charges exceptionnelles
  const revExc    = cr.produits.revenusExceptionnels;
  const chargExc  = cr.charges.chargesExceptionnelles;
  const resultatExceptionnel = revExc - chargExc;

  // 6. Résultat net = RCAI + Résultat exceptionnel (pas d'IS dans le jeu)
  const resultatNet = rcai + resultatExceptionnel;

  // Capitaux propres (sans résultat inclus dans passifsBruts)
  const capitauxPropres = joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
  const capitalAvecResultat = capitauxPropres + resultatNet;

  const totalActif = getTotalActif(joueur);
  const creances   = joueur.bilan.creancesPlus1 + joueur.bilan.creancesPlus2;

  // Indicateurs de rentabilité
  const tauxMargeNette       = ca > 0 ? (resultatNet / ca) * 100 : 0;
  const tauxMargeEBE         = ca > 0 ? (ebe / ca) * 100 : 0;
  const roe                  = capitalAvecResultat > 0 ? (resultatNet / capitalAvecResultat) * 100 : 0;
  const rentabiliteEconomique = totalActif > 0 ? (resultatExploitation / totalActif) * 100 : 0;

  // Délai clients en jours (créances × 360 / CA annualisé)
  const delaiClients = ca > 0 ? (creances * 360) / (ca * 4) : 0;

  return {
    chiffreAffaires: ca,
    achats,
    servicesExterieurs: servExt,
    valeurAjoutee,
    chargesPersonnel: chargesPerso,
    impotsTaxes: impots,
    ebe,
    dotations,
    resultatExploitation,
    produitsFinanciers: prodFin,
    chargesInteret: chargesInt,
    rcai,
    revenusExceptionnels: revExc,
    chargesExceptionnelles: chargExc,
    resultatExceptionnel,
    resultatNet,
    tauxMargeNette,
    tauxMargeEBE,
    roe,
    rentabiliteEconomique,
    delaiClients,
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
  const dettesTotales = joueur.bilan.dettes + (joueur.bilan.dettesD2 ?? 0) + joueur.bilan.dettesFiscales + emprunts;

  if (decouvert > DECOUVERT_MAX) {
    return { enFaillite: true, raison: `Découvert bancaire excessif (${decouvert} > ${DECOUVERT_MAX} maximum)` };
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
