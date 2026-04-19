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
 * ⚠️ Tests qui DOIVENT casser après le refactor :
 *    • Les tests du bloc A qui affirment `ETAPES.INIT === 0`, etc.
 *      (Commit 2 renomme les clés ; Commit 3 passe à 8 étapes).
 *    • Les tests du bloc B qui nomment une étape par son nom actuel
 *      divergent (ex. "Étape 2 (COMMERCIAUX — nom) = avancement
 *      des créances (réalité)") : après Commit 2 ils perdent leur
 *      raison d'être et seront supprimés ou mis à jour dans Commit 3.
 *
 * Ces tests n'ont pas vocation à survivre à T25.C — leur seul job est
 * de rester verts entre Commit 0 et Commit 2 comme « constantes vitales »
 * du cycle actuel.
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

describe("Caractérisation A — Valeurs actuelles de ETAPES (nomenclature divergente)", () => {
  // Ces tests documentent la divergence nom ↔ réalité héritée :
  //  - ETAPES.COMMERCIAUX = 2, mais étape 2 = avancement des créances
  //  - ETAPES.VENTES = 3, mais étape 3 = paiement des commerciaux
  //  - ETAPES.CHARGES = 4, mais étape 4 = cartes Client (= vraies ventes)
  //  - ETAPES.BILAN = 5, mais étape 5 = effets récurrents + spécialité
  // La refonte (Commit 2) renommera ces constantes pour coller à la réalité.

  test("ETAPES.INIT = 0", () => {
    expect(ETAPES.INIT).toBe(0);
  });

  test("ETAPES.ACHATS = 1", () => {
    expect(ETAPES.ACHATS).toBe(1);
  });

  test("ETAPES.COMMERCIAUX = 2 (nom trompeur — étape 2 = créances)", () => {
    expect(ETAPES.COMMERCIAUX).toBe(2);
  });

  test("ETAPES.VENTES = 3 (nom trompeur — étape 3 = paiement commerciaux)", () => {
    expect(ETAPES.VENTES).toBe(3);
  });

  test("ETAPES.CHARGES = 4 (nom trompeur — étape 4 = cartes Client = vraies ventes)", () => {
    expect(ETAPES.CHARGES).toBe(4);
  });

  test("ETAPES.BILAN = 5 (nom trompeur — étape 5 = effets récurrents + spécialité)", () => {
    expect(ETAPES.BILAN).toBe(5);
  });

  test("ETAPES.INVESTISSEMENT = 6", () => {
    expect(ETAPES.INVESTISSEMENT).toBe(6);
  });

  test("ETAPES.EVENEMENT = 7", () => {
    expect(ETAPES.EVENEMENT).toBe(7);
  });

  test("ETAPES.CLOTURE = 8", () => {
    expect(ETAPES.CLOTURE).toBe(8);
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

  test("Étape 0 (INIT) : -2 000 € charges fixes et -500 € capital emprunt, pas d'intérêts à T1", () => {
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

  test("Étape 1 (ACHATS) : no-op si quantité = 0", () => {
    const etat = initBelvaux();
    appliquerEtape0(etat, 0);
    const snapAvant = equilibre(etat.joueurs[0]);
    const res = appliquerAchatMarchandises(etat, 0, 0, "tresorerie");
    expect(res.succes).toBe(true);
    expect(res.modifications.length).toBe(0);
    const snapApres = equilibre(etat.joueurs[0]);
    expect(snapApres).toEqual(snapAvant);
  });

  test("Étape 2 (COMMERCIAUX — nom) = avancement des créances (réalité)", () => {
    const etat = initBelvaux();
    appliquerEtape0(etat, 0);
    // T1 : aucune créance C+1/C+2 → tréso inchangée, message pédagogique.
    const tresoAvant = getTresorerie(etat.joueurs[0]);
    const res = appliquerAvancementCreances(etat, 0);
    expect(res.succes).toBe(true);
    expect(getTresorerie(etat.joueurs[0])).toBe(tresoAvant);
  });

  test("Étape 3 (VENTES — nom) = paiement des commerciaux (réalité) : -1 000 € (Junior par défaut)", () => {
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

  test("Étape 4 (CHARGES — nom) = carte Client (réalité = vraie vente) : +2 000 € tréso, +2 000 € ventes, -1 000 € stocks", () => {
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

  test("Étape 5 (BILAN — nom) = effets récurrents + spécialité (réalité) : Belvaux = +1 000 € productionStockee, +1 000 € stocks", () => {
    const etat = initBelvaux();
    const stocksAvant = stocksOf(etat.joueurs[0]);
    appliquerEffetsRecurrents(etat, 0);
    appliquerSpecialiteEntreprise(etat, 0);
    expect(stocksOf(etat.joueurs[0]) - stocksAvant).toBe(1000);
    expect(etat.joueurs[0].compteResultat.produits.productionStockee).toBe(1000);
  });

  // Étape 6 (INVESTISSEMENT) : pas de caractérisation ici — l'étape dépend
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

  test("Étape 8 (CLOTURE) : verifierFinTour retourne score numérique, pas de faillite à T1", () => {
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

    // Étape 1 (ACHATS) : pas d'achat ce T1.
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

    // Étape 6 (INVESTISSEMENT) : sautée — pas d'achat de carte.

    appliquerCarteEvenement(etat, 0, CARTES_EVENEMENTS[0]);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    const finTour = verifierFinTour(etat, 0);
    expect(finTour.enFaillite).toBe(false);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);
  });
});
