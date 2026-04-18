"use strict";
// ============================================================
// JEDEVIENSPATRON — Calculateurs financiers
// Extraits de JEDEVIENSPATRON_v2.html — Pierre Médan
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalActif = getTotalActif;
exports.getTotalImmobilisations = getTotalImmobilisations;
exports.getTotalStocks = getTotalStocks;
exports.getTresorerie = getTresorerie;
exports.getTotalPassif = getTotalPassif;
exports.getTotalCharges = getTotalCharges;
exports.getTotalProduits = getTotalProduits;
exports.getResultatNet = getResultatNet;
exports.verifierEquilibre = verifierEquilibre;
exports.calculerIndicateurs = calculerIndicateurs;
exports.calculerSIGSimplifie = calculerSIGSimplifie;
exports.calculerInterets = calculerInterets;
exports.scorerDemandePret = scorerDemandePret;
exports.calculerSIG = calculerSIG;
exports.calculerScore = calculerScore;
exports.verifierFaillite = verifierFaillite;
const types_1 = require("./types");
// ─── TOTAUX BILAN ────────────────────────────────────────────
function getTotalActif(joueur) {
    const actifs = joueur.bilan.actifs.reduce((s, a) => s + a.valeur, 0);
    const creances = joueur.bilan.creancesPlus1 + joueur.bilan.creancesPlus2;
    return actifs + creances;
    // Note : le découvert est un actif négatif traité côté passif
}
function getTotalImmobilisations(joueur) {
    return joueur.bilan.actifs
        .filter((a) => a.categorie === "immobilisations")
        .reduce((s, a) => s + a.valeur, 0);
}
function getTotalStocks(joueur) {
    return joueur.bilan.actifs
        .filter((a) => a.categorie === "stocks")
        .reduce((s, a) => s + a.valeur, 0);
}
function getTresorerie(joueur) {
    const t = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie");
    return t ? t.valeur : 0;
}
function getTotalPassif(joueur) {
    // IMPORTANT : on exclut les postes passifs avec categorie "dettes" du tableau passifs[].
    // Ces entrées héritées du template initial sont STALES : le moteur écrit les dettes
    // directement dans bilan.dettes / bilan.dettesD2 / bilan.dettesFiscales (champs directs),
    // jamais dans passifs[]. Les inclure provoquerait un double-comptage.
    // Seules "capitaux" et "emprunts" vivent réellement dans passifs[].
    const passifsBruts = joueur.bilan.passifs
        .filter((p) => p.categorie !== "dettes")
        .reduce((s, p) => s + p.valeur, 0);
    const decouvert = joueur.bilan.decouvert;
    const dettes = joueur.bilan.dettes + (joueur.bilan.dettesD2 ?? 0) + joueur.bilan.dettesFiscales;
    const resultat = getResultatNet(joueur);
    return passifsBruts + decouvert + dettes + resultat;
}
// ─── COMPTE DE RÉSULTAT ─────────────────────────────────────
function getTotalCharges(charges) {
    return (charges.achats +
        charges.servicesExterieurs +
        charges.impotsTaxes +
        charges.chargesInteret +
        charges.chargesPersonnel +
        charges.chargesExceptionnelles +
        charges.dotationsAmortissements);
}
function getTotalProduits(produits) {
    return (produits.ventes +
        produits.productionStockee +
        produits.produitsFinanciers +
        produits.revenusExceptionnels);
}
function getResultatNet(joueur) {
    return (getTotalProduits(joueur.compteResultat.produits) -
        getTotalCharges(joueur.compteResultat.charges));
}
// ─── ÉQUILIBRE ───────────────────────────────────────────────
/**
 * Vérifie l'équation fondamentale :
 *   ACTIF + CHARGES = PASSIF + PRODUITS
 * (équivalent à ACTIF = PASSIF + RÉSULTAT)
 */
function verifierEquilibre(joueur) {
    // Utilise getTotalPassif (source unique de vérité) pour éviter toute divergence.
    const totalActif = getTotalActif(joueur);
    const totalPassif = getTotalPassif(joueur);
    const ecart = totalActif - totalPassif;
    return {
        equilibre: Math.abs(ecart) < 0.001,
        totalActif,
        totalPassif,
        ecart,
    };
}
// ─── INDICATEURS FINANCIERS ───────────────────────────────────
function calculerIndicateurs(joueur) {
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
    // Source unique de vérité : getTotalPassif (filtre les stales dettes passifs[]).
    const totalPassif = getTotalPassif(joueur);
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
    const dettesCourtTerme = Math.max(1, dettes + joueur.bilan.decouvert);
    const ratioLiquidite = actifCirculant / dettesCourtTerme;
    // Solvabilité = (Capitaux propres + Résultat) / Total Passif × 100
    const ratioSolvabilite = totalPassif > 0
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
function calculerSIGSimplifie(joueur) {
    const ca = joueur.compteResultat.produits.ventes;
    const achats = joueur.compteResultat.charges.achats;
    const marge = ca - achats;
    const servExt = joueur.compteResultat.charges.servicesExterieurs;
    const va = marge - servExt; // Valeur Ajoutée simplifiée
    const personnel = joueur.compteResultat.charges.chargesPersonnel;
    const impots = joueur.compteResultat.charges.impotsTaxes;
    const ebe = va - personnel - impots;
    const resultatNet = getResultatNet(joueur);
    const tresorerie = getTresorerie(joueur);
    return { ca, marge, ebe, resultatNet, tresorerie };
}
// ─── INTÉRÊTS SUR EMPRUNT ─────────────────────────────────────
function calculerInterets(empruntsTotal, majore = false) {
    const taux = majore ? types_1.TAUX_INTERET_MAJORE : types_1.TAUX_INTERET_ANNUEL;
    return Math.round(empruntsTotal * taux / 400);
}
// ─── SCORING BANCAIRE ─────────────────────────────────────────
// tourActuel : passé depuis engine.ts pour la clause de bienveillance (tours 1-2)
function scorerDemandePret(joueur, montantDemande, tourActuel = 999) {
    const ind = calculerIndicateurs(joueur);
    let score = 0;
    const details = [];
    // Clause de bienveillance : bonus +15 pts pour les deux premiers trimestres.
    // La banque regarde le potentiel de démarrage, pas encore les résultats.
    if (tourActuel <= 2) {
        score += 15;
        details.push("Entreprise en démarrage — bonus bienveillance banque ✓");
    }
    const solv = ind.ratioSolvabilite;
    if (solv >= 40) {
        score += 30;
        details.push("Solvabilité solide ✓");
    }
    else if (solv >= 30) {
        score += 20;
        details.push("Solvabilité acceptable");
    }
    else if (solv >= 20) {
        score += 10;
        details.push("Solvabilité fragile");
    }
    else {
        details.push("Solvabilité insuffisante ✗");
    }
    if (ind.resultatNet > 0) {
        score += 25;
        details.push("Résultat bénéficiaire ✓");
    }
    else if (ind.resultatNet === 0) {
        score += 10;
        details.push("Résultat nul (neutre)");
    }
    else {
        details.push("Résultat déficitaire ✗");
    }
    const treso = getTresorerie(joueur);
    if (treso >= 5000) {
        score += 20;
        details.push("Trésorerie confortable ✓");
    }
    else if (treso >= 2000) {
        score += 10;
        details.push("Trésorerie limitée");
    }
    else if (treso >= 0) {
        score += 5;
        details.push("Trésorerie très faible");
    }
    else {
        details.push("Découvert bancaire ✗");
    }
    const emprunts = joueur.bilan.passifs
        .filter((p) => p.categorie === "emprunts")
        .reduce((s, p) => s + p.valeur, 0);
    const tauxEndettement = ind.totalActif > 0 ? (emprunts / ind.totalActif) * 100 : 100;
    if (tauxEndettement < 30) {
        score += 15;
        details.push("Endettement faible ✓");
    }
    else if (tauxEndettement < 50) {
        score += 10;
        details.push("Endettement modéré");
    }
    else if (tauxEndettement < 70) {
        score += 5;
        details.push("Endettement élevé");
    }
    else {
        details.push("Endettement excessif ✗");
    }
    const ratioPret = ind.totalActif > 0 ? (montantDemande / ind.totalActif) * 100 : 100;
    if (ratioPret <= 10) {
        score += 10;
        details.push("Montant raisonnable ✓");
    }
    else if (ratioPret <= 20) {
        score += 5;
        details.push("Montant acceptable");
    }
    else {
        details.push("Montant trop élevé ✗");
    }
    const accepte = score >= types_1.SCORE_SEUIL_MAJORE;
    const tauxMajore = accepte && score < types_1.SCORE_SEUIL_STANDARD;
    let raison;
    if (!accepte) {
        raison = `Score ${score}/100 — insuffisant (min 50). ${details.filter(d => d.includes("✗")).join(", ")}.`;
    }
    else if (tauxMajore) {
        raison = `Score ${score}/100 — accordé avec taux majoré (8%/an). ${details.filter(d => !d.includes("✓")).join(", ")}.`;
    }
    else {
        raison = `Score ${score}/100 — accordé au taux standard (5%/an). ${details.filter(d => d.includes("✓")).join(", ")}.`;
    }
    return { accepte, montantAccorde: accepte ? montantDemande : 0, tauxMajore, score, raison };
}
function calculerSIG(joueur) {
    const cr = joueur.compteResultat;
    const ca = cr.produits.ventes;
    const achats = cr.charges.achats;
    const servExt = cr.charges.servicesExterieurs;
    // 1. Valeur Ajoutée = CA − Achats − Services extérieurs
    const valeurAjoutee = ca - achats - servExt;
    // 2. EBE = VA − Charges de personnel − Impôts & taxes
    const chargesPerso = cr.charges.chargesPersonnel;
    const impots = cr.charges.impotsTaxes;
    const ebe = valeurAjoutee - chargesPerso - impots;
    // 3. Résultat d'exploitation = EBE − Dotations aux amortissements
    const dotations = cr.charges.dotationsAmortissements;
    const resultatExploitation = ebe - dotations;
    // 4. RCAI = Résultat exploitation + Produits financiers − Charges d'intérêt
    const prodFin = cr.produits.produitsFinanciers;
    const chargesInt = cr.charges.chargesInteret;
    const rcai = resultatExploitation + prodFin - chargesInt;
    // 5. Résultat exceptionnel = Revenus exceptionnels − Charges exceptionnelles
    const revExc = cr.produits.revenusExceptionnels;
    const chargExc = cr.charges.chargesExceptionnelles;
    const resultatExceptionnel = revExc - chargExc;
    // 6. Résultat net = RCAI + Résultat exceptionnel (pas d'IS dans le jeu)
    const resultatNet = rcai + resultatExceptionnel;
    // Capitaux propres (sans résultat inclus dans passifsBruts)
    const capitauxPropres = joueur.bilan.passifs
        .filter((p) => p.categorie === "capitaux")
        .reduce((s, p) => s + p.valeur, 0);
    const capitalAvecResultat = capitauxPropres + resultatNet;
    const totalActif = getTotalActif(joueur);
    const creances = joueur.bilan.creancesPlus1 + joueur.bilan.creancesPlus2;
    // Indicateurs de rentabilité
    const tauxMargeNette = ca > 0 ? (resultatNet / ca) * 100 : 0;
    const tauxMargeEBE = ca > 0 ? (ebe / ca) * 100 : 0;
    const roe = capitalAvecResultat > 0 ? (resultatNet / capitalAvecResultat) * 100 : 0;
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
function calculerScore(joueur) {
    const indicateurs = calculerIndicateurs(joueur);
    const resultat = indicateurs.resultatNet;
    const immo = getTotalImmobilisations(joueur);
    const tresorerie = getTresorerie(joueur);
    const solvabilite = indicateurs.ratioSolvabilite;
    return (resultat * 3 +
        immo * 2 +
        tresorerie +
        Math.round(solvabilite));
}
function verifierFaillite(joueur) {
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
    if (decouvert > types_1.DECOUVERT_MAX) {
        return { enFaillite: true, raison: `Découvert bancaire excessif (${decouvert} > ${types_1.DECOUVERT_MAX} maximum)` };
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
//# sourceMappingURL=calculators.js.map