/**
 * JEDEVIENSPATRON — Tests de caractérisation du cycle actuel
 * ==========================================================
 *
 * Commit 0 de la Tâche 25.C (2026-04-18 → 2026-04-19).
 *
 * OBJECTIF — figer la FORME ACTUELLE du cycle de jeu (9 étapes) AVANT
 * la refonte 9 → 8, pour distinguer après la chirurgie ce qui a été
 * cassé volontairement de ce qui a été cassé par accident.
 *
 * Ce fichier ne juge PAS si le cycle est pédagogiquement juste — c'est
 * précisément tout l'objet de T25.C. Il fige simplement :
 *   • les valeurs numériques actuelles de `ETAPES.*`
 *   • la divergence "nom vs réalité" constatée dans l'enum (plusieurs
 *     noms ne correspondent pas à ce que la fonction associée fait)
 *   • l'invariant comptable Actif = Passif + Résultat après chaque étape
 *   • les effets observables par étape (quel poste bouge de combien)
 *     sur une partie Belvaux au T1
 *
 * ⚠️ Évolution attendue au fil des commits de T25.C :
 *    • Commit 0 (état initial) : nomenclature divergente — les noms de
 *      `ETAPES.*` ne correspondent pas à ce que la fonction moteur associée
 *      fait (ex. ETAPES.COMMERCIAUX = 2 mais étape 2 = créances).
 *    • Commit 2 (2026-04-20) : nomenclature alignée sur la réalité exécutée,
 *      sans changement de valeur. Les constantes passent à
 *      CHARGES_FIXES / ACHATS_STOCK / ENCAISSEMENTS_CREANCES / COMMERCIAUX /
 *      VENTES / EFFETS_RECURRENTS / DECISION / EVENEMENT / BILAN — les
 *      numéros restent 0-8. Le bloc A teste désormais ces noms avec les
 *      valeurs actuelles.
 *    • Commit 3 (à venir) : passage à 8 étapes ; le bloc A sera recalé
 *      ou supprimé selon la nouvelle grille.
 *
 * Ces tests n'ont pas vocation à survivre entièrement à T25.C — leur
 * seul job est de figer les constantes vitales du cycle entre chaque
 * étape de la refonte.
 */

import {
  ETAPES,
  initialiserJeu,
  appliquerEtape0,
  appliquerAchatMarchandises,
  appliquerAvancementCreances,
  appliquerPaiementCommerciaux,
  appliquerCarteClient,
  appliquerEffetsRecurrents,
  appliquerSpecialiteEntreprise,
  appliquerCarteEvenement,
  verifierFinTour,
  getTotalActif,
  getTotalPassif,
  getResultatNet,
  getTresorerie,
  CARTES_CLIENTS,
  CARTES_EVENEMENTS,
} from "../src/index";

// ─── Helpers ────────────────────────────────────────────────

function initBelvaux() {
  return initialiserJeu([{ pseudo: "Pierre", nomEntreprise: "Manufacture Belvaux" }]);
}

type Joueur = ReturnType<typeof initBelvaux>["joueurs"][0];

// Rappel de l'API du package (cf. calculators.ts L45-57) :
// `getTotalPassif()` INCLUT DÉJÀ le résultat net → l'invariant à vérifier
// est `Actif === Passif`, pas `Actif === Passif + Résultat`. On expose
// `resultat` séparément pour documenter l'état, mais on ne l'ajoute pas
// à `passif` dans le calcul de l'écart.
function equilibre(joueur: Joueur) {
  const actif = getTotalActif(joueur);
  const passif = getTotalPassif(joueur);
  const resultat = getResultatNet(joueur);
  return {
    actif,
    passif,
    resultat,
    ecart: actif - passif,
  };
}

function stocksOf(joueur: Joueur): number {
  return joueur.bilan.actifs
    .filter((a) => a.categorie === "stocks")
    .reduce((s, a) => s + a.valeur, 0);
}

// ─── A. ETAPES — valeurs numériques actuelles ────────────────

describe("Caractérisation A — Valeurs de ETAPES (nomenclature alignée sur la réalité)", () => {
  // Depuis le Commit 2 de T25.C (2026-04-20), les clés de ETAPES portent
  // désormais le nom de ce que la fonction moteur associée exécute. Les
  // valeurs numériques restent celles du cycle 9-étapes actuel ; le Commit 3
  // les réassignera et fusionnera CHARGES_FIXES + EFFETS_RECURRENTS dans un
  // nouveau CLOTURE_TRIMESTRE.

  test("ETAPES.CHARGES_FIXES = 0", () => {
    expect(ETAPES.CHARGES_FIXES).toBe(0);
  });

  test("ETAPES.ACHATS_STOCK = 1", () => {
    expect(ETAPES.ACHATS_STOCK).toBe(1);
  });

  test("ETAPES.ENCAISSEMENTS_CREANCES = 2", () => {
    expect(ETAPES.ENCAISSEMENTS_CREANCES).toBe(2);
  });

  test("ETAPES.COMMERCIAUX = 3", () => {
    expect(ETAPES.COMMERCIAUX).toBe(3);
  });

  test("ETAPES.VENTES = 4 (= traitement des cartes Client)", () => {
    expect(ETAPES.VENTES).toBe(4);
  });

  test("ETAPES.EFFETS_RECURRENTS = 5", () => {
    expect(ETAPES.EFFETS_RECURRENTS).toBe(5);
  });

  test("ETAPES.DECISION = 6", () => {
    expect(ETAPES.DECISION).toBe(6);
  });

  test("ETAPES.EVENEMENT = 7", () => {
    expect(ETAPES.EVENEMENT).toBe(7);
  });

  test("ETAPES.BILAN = 8", () => {
    expect(ETAPES.BILAN).toBe(8);
  });

  test("Il y a bien 9 clés dans ETAPES (le Commit 3 passera à 8)", () => {
    expect(Object.keys(ETAPES).length).toBe(9);
  });
});

// ─── B. Effets observables par étape à T1 pour Belvaux ───────

describe("Caractérisation B — Effets observables à T1 pour Manufacture Belvaux", () => {
  test("État initial : Trésorerie = 10 000 €, Actif = Passif, Résultat = 0", () => {
    const etat = initBelvaux();
    const j = etat.joueurs[0];
    expect(getTresorerie(j)).toBe(10000);
    const { actif, passif, resultat, ecart } = equilibre(j);
    expect(resultat).toBe(0);
    expect(actif).toBe(passif);
    expect(ecart).toBe(0);
  });

  test("Étape 0 (CHARGES_FIXES) : -2 000 € charges fixes et -500 € capital emprunt, pas d'intérêts à T1", () => {
    const etat = initBelvaux();
    const tresoAvant = getTresorerie(etat.joueurs[0]);
    appliquerEtape0(etat, 0);
    const tresoApres = getTresorerie(etat.joueurs[0]);
    // T1 post-Tâche 25.B : pas d'intérêts (premiers à T3).
    // Impact T1 : -2 000 (charges fixes) -500 (capital emprunt) = -2 500.
    expect(tresoAvant - tresoApres).toBe(2500);
    expect(etat.joueurs[0].compteResultat.charges.chargesInteret).toBe(0);
    // Charges fixes enregistrées au compte de résultat
    expect(etat.joueurs[0].compteResultat.charges.servicesExterieurs).toBe(2000);
    // Dotations aux amortissements : 2 biens amortissables (Entrepôt + Camionnette)
    // → 2 × 1 000 € = 2 000 €
    expect(etat.joueurs[0].compteResultat.charges.dotationsAmortissements).toBe(2000);
    // Invariant comptable préservé
    const { ecart } = equilibre(etat.joueurs[0]);
    expect(ecart).toBe(0);
  });

  test("Étape 1 (ACHATS_STOCK) : no-op si quantité = 0", () => {
    const etat = initBelvaux();
    appliquerEtape0(etat, 0);
    const snapAvant = equilibre(etat.joueurs[0]);
    const res = appliquerAchatMarchandises(etat, 0, 0, "tresorerie");
    expect(res.succes).toBe(true);
    expect(res.modifications.length).toBe(0);
    const snapApres = equilibre(etat.joueurs[0]);
    expect(snapApres).toEqual(snapAvant);
  });

  test("Étape 2 (ENCAISSEMENTS_CREANCES) = avancement des créances clients", () => {
    const etat = initBelvaux();
    appliquerEtape0(etat, 0);
    // T1 : aucune créance C+1/C+2 → tréso inchangée, message pédagogique.
    const tresoAvant = getTresorerie(etat.joueurs[0]);
    const res = appliquerAvancementCreances(etat, 0);
    expect(res.succes).toBe(true);
    expect(getTresorerie(etat.joueurs[0])).toBe(tresoAvant);
  });

  test("Étape 3 (COMMERCIAUX) = paiement des commerciaux : -1 000 € (Junior par défaut)", () => {
    const etat = initBelvaux();
    appliquerEtape0(etat, 0);
    // Commercial Junior par défaut : 1 000 €/trimestre en salaire.
    const tresoAvant = getTresorerie(etat.joueurs[0]);
    const chargesPersoAvant = etat.joueurs[0].compteResultat.charges.chargesPersonnel;
    const res = appliquerPaiementCommerciaux(etat, 0);
    expect(res.succes).toBe(true);
    expect(tresoAvant - getTresorerie(etat.joueurs[0])).toBe(1000);
    expect(etat.joueurs[0].compteResultat.charges.chargesPersonnel - chargesPersoAvant).toBe(1000);
  });

  test("Étape 4 (VENTES) = traitement carte Client : +2 000 € tréso, +2 000 € ventes, -1 000 € stocks", () => {
    const etat = initBelvaux();
    // Particulier : 2 000 € comptant, consomme 1 unité (1 000 € de stock).
    const particulier = CARTES_CLIENTS.find((c) => c.id === "client-particulier");
    expect(particulier).toBeDefined();
    const tresoAvant = getTresorerie(etat.joueurs[0]);
    const ventesAvant = etat.joueurs[0].compteResultat.produits.ventes;
    const stocksAvant = stocksOf(etat.joueurs[0]);
    const res = appliquerCarteClient(etat, 0, particulier!, 0);
    expect(res.succes).toBe(true);
    expect(getTresorerie(etat.joueurs[0]) - tresoAvant).toBe(2000);
    expect(etat.joueurs[0].compteResultat.produits.ventes - ventesAvant).toBe(2000);
    expect(stocksAvant - stocksOf(etat.joueurs[0])).toBe(1000);
  });

  test("Étape 5 (EFFETS_RECURRENTS) = effets récurrents + spécialité : Belvaux = +1 000 € productionStockee, +1 000 € stocks", () => {
    const etat = initBelvaux();
    const stocksAvant = stocksOf(etat.joueurs[0]);
    appliquerEffetsRecurrents(etat, 0);
    appliquerSpecialiteEntreprise(etat, 0);
    expect(stocksOf(etat.joueurs[0]) - stocksAvant).toBe(1000);
    expect(etat.joueurs[0].compteResultat.produits.productionStockee).toBe(1000);
  });

  // Étape 6 (DECISION) : pas de caractérisation ici — l'étape dépend
  // d'un choix interactif (achat de carte, recrutement). Couvert séparément
  // dans les tests d'intégration UI.

  test("Étape 7 (EVENEMENT) : une carte événement préserve l'invariant comptable", () => {
    const etat = initBelvaux();
    appliquerEtape0(etat, 0);
    const carte = CARTES_EVENEMENTS[0];
    const ecartAvant = equilibre(etat.joueurs[0]).ecart;
    const res = appliquerCarteEvenement(etat, 0, carte);
    expect(res.succes).toBe(true);
    const ecartApres = equilibre(etat.joueurs[0]).ecart;
    expect(ecartApres).toBe(ecartAvant);
  });

  test("Étape 8 (BILAN) : verifierFinTour retourne score numérique, pas de faillite à T1", () => {
    const etat = initBelvaux();
    appliquerEtape0(etat, 0);
    const res = verifierFinTour(etat, 0);
    expect(typeof res.score).toBe("number");
    expect(typeof res.equilibre).toBe("boolean");
    expect(res.enFaillite).toBe(false);
  });
});

// ─── C. Invariant comptable sur un cycle complet ─────────────

describe("Caractérisation C — L'invariant Actif = Passif + Résultat tient sur un T1 complet", () => {
  test("Séquence actuelle 0 → 5 + 7 (investissement 6 sauté) → 8 reste équilibrée", () => {
    const etat = initBelvaux();
    const particulier = CARTES_CLIENTS.find((c) => c.id === "client-particulier");
    expect(particulier).toBeDefined();

    // Ordre actuel, linéaire, identique à celui de avancerEtape().
    appliquerEtape0(etat, 0);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    // Étape 1 (ACHATS_STOCK) : pas d'achat ce T1.
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    appliquerAvancementCreances(etat, 0);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    appliquerPaiementCommerciaux(etat, 0);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    appliquerCarteClient(etat, 0, particulier!, 0);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    appliquerEffetsRecurrents(etat, 0);
    appliquerSpecialiteEntreprise(etat, 0);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    // Étape 6 (DECISION) : sautée — pas d'achat de carte.

    appliquerCarteEvenement(etat, 0, CARTES_EVENEMENTS[0]);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    const finTour = verifierFinTour(etat, 0);
    expect(finTour.enFaillite).toBe(false);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);
  });
});
