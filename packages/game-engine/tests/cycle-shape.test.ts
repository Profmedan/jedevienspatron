/**
 * JEDEVIENSPATRON — Tests de caractérisation du cycle
 * ===================================================
 *
 * Historique :
 *   • Commit 0 de T25.C (2026-04-18) : fige le cycle 9-étapes AVANT
 *     la refonte, pour distinguer les changements voulus des accidents.
 *   • Commit 2 (2026-04-20) : renommage explicite des constantes
 *     ETAPES.* (pas de changement de valeur).
 *   • Commit 3 (2026-04-20) — CE FICHIER : réorienté pour décrire le
 *     cycle **nouveau** 8-étapes « activité puis clôture » qui devient
 *     la référence. Les blocs A, B et C valident désormais cette
 *     nouvelle grille et servent de filet de sécurité pour les évolutions
 *     à venir.
 *
 * OBJECTIF — figer la FORME du cycle 8-étapes :
 *   • les valeurs numériques de `ETAPES.*` (grille T25.C)
 *   • les effets observables par étape sur un tour Belvaux au T1
 *   • l'invariant comptable Actif = Passif + Résultat après chaque étape
 *
 * Ce fichier ne teste pas l'interactivité UI (cartes Décision, événement
 * tiré au sort), qui est couverte séparément.
 */

import {
  ETAPES,
  initialiserJeu,
  appliquerEtape0,
  appliquerAchatMarchandises,
  appliquerAvancementCreances,
  appliquerPaiementCommerciaux,
  appliquerCarteClient,
  appliquerRealisationBelvaux,
  appliquerEffetsRecurrents,
  appliquerSpecialiteEntreprise,
  appliquerClotureTrimestre,
  basculerTresorerieSiNegative,
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

// ─── A. ETAPES — valeurs numériques du cycle 8-étapes ────────

describe("Caractérisation A — Valeurs de ETAPES (cycle 8-étapes T25.C)", () => {
  // Grille validée par Pierre 2026-04-19 (plan T25.C §3 Q3).
  // Le cycle commence par une action VISIBLE (encaissement) plutôt que
  // par la ponction silencieuse des charges fixes, et regroupe charges +
  // effets récurrents dans une clôture unique en fin de trimestre.

  test("ETAPES.ENCAISSEMENTS_CREANCES = 0", () => {
    expect(ETAPES.ENCAISSEMENTS_CREANCES).toBe(0);
  });

  test("ETAPES.COMMERCIAUX = 1", () => {
    expect(ETAPES.COMMERCIAUX).toBe(1);
  });

  test("ETAPES.ACHATS_STOCK = 2", () => {
    expect(ETAPES.ACHATS_STOCK).toBe(2);
  });

  test("ETAPES.REALISATION_METIER = 3 (B9-A — NEW, placeholder polymorphe B9-D)", () => {
    expect(ETAPES.REALISATION_METIER).toBe(3);
  });

  test("ETAPES.FACTURATION_VENTES = 4 (ex-VENTES B8, décalée de +1 par B9-A)", () => {
    expect(ETAPES.FACTURATION_VENTES).toBe(4);
  });

  test("ETAPES.DECISION = 5 (décalée de +1 par B9-A)", () => {
    expect(ETAPES.DECISION).toBe(5);
  });

  test("ETAPES.EVENEMENT = 6 (décalée de +1 par B9-A)", () => {
    expect(ETAPES.EVENEMENT).toBe(6);
  });

  test("ETAPES.CLOTURE_BILAN = 7 (fusion B9-A des ex-CLOTURE_TRIMESTRE + BILAN, 2 passes moteur)", () => {
    expect(ETAPES.CLOTURE_BILAN).toBe(7);
  });

  test("Il y a bien 8 clés dans ETAPES (8 étapes visibles, cycle B9-A)", () => {
    expect(Object.keys(ETAPES).length).toBe(8);
  });

  test("initialiserJeu place le jeu sur la première étape (ENCAISSEMENTS_CREANCES)", () => {
    const etat = initBelvaux();
    expect(etat.etapeTour).toBe(ETAPES.ENCAISSEMENTS_CREANCES);
  });
});

// ─── B. Effets observables par étape à T1 pour Belvaux ───────

describe("Caractérisation B — Effets observables à T1 pour Manufacture Belvaux (cycle 8-étapes)", () => {
  test("État initial : Trésorerie = 10 000 €, Actif = Passif, Résultat = 0", () => {
    const etat = initBelvaux();
    const j = etat.joueurs[0];
    expect(getTresorerie(j)).toBe(10000);
    const { actif, passif, resultat, ecart } = equilibre(j);
    expect(resultat).toBe(0);
    expect(actif).toBe(passif);
    expect(ecart).toBe(0);
  });

  test("Étape 0 (ENCAISSEMENTS_CREANCES) : aucune créance au T1 → trésorerie inchangée", () => {
    const etat = initBelvaux();
    const tresoAvant = getTresorerie(etat.joueurs[0]);
    const res = appliquerAvancementCreances(etat, 0);
    expect(res.succes).toBe(true);
    expect(getTresorerie(etat.joueurs[0])).toBe(tresoAvant);
    // Invariant comptable
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);
  });

  test("Étape 1 (COMMERCIAUX) : paiement du Junior par défaut → -1 000 € trésorerie, +1 000 € charges personnel", () => {
    const etat = initBelvaux();
    const tresoAvant = getTresorerie(etat.joueurs[0]);
    const chargesPersoAvant = etat.joueurs[0].compteResultat.charges.chargesPersonnel;
    const res = appliquerPaiementCommerciaux(etat, 0);
    expect(res.succes).toBe(true);
    expect(tresoAvant - getTresorerie(etat.joueurs[0])).toBe(1000);
    expect(etat.joueurs[0].compteResultat.charges.chargesPersonnel - chargesPersoAvant).toBe(1000);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);
  });

  test("Étape 2 (ACHATS_STOCK) : no-op si quantité = 0", () => {
    const etat = initBelvaux();
    appliquerPaiementCommerciaux(etat, 0);
    const snapAvant = equilibre(etat.joueurs[0]);
    const res = appliquerAchatMarchandises(etat, 0, 0, "tresorerie");
    expect(res.succes).toBe(true);
    expect(res.modifications.length).toBe(0);
    const snapApres = equilibre(etat.joueurs[0]);
    expect(snapApres).toEqual(snapAvant);
  });

  test("Étape 4 (FACTURATION_VENTES) : traitement carte Client Particulier → +2 500 € tréso (barème Belvaux), +2 500 € ventes, PF −1 000 €", () => {
    const etat = initBelvaux();
    // B9-D post (2026-04-24) — la vente consomme maintenant uniquement les
    // produits finis. Il faut donc produire préalablement (étape 3) pour
    // avoir du PF en stock, sinon la vente est rejetée.
    appliquerRealisationBelvaux(etat, 0);
    // LOT 2.2 (2026-04-25) — Belvaux applique son barème propre via
    // `modeleValeur.baremeRevenus` : Particulier = 2 500 € (au lieu de 2 000)
    // pour refléter le positionnement industriel à valeur ajoutée.
    const particulier = CARTES_CLIENTS.find((c) => c.id === "client-particulier");
    expect(particulier).toBeDefined();
    const tresoAvant = getTresorerie(etat.joueurs[0]);
    const ventesAvant = etat.joueurs[0].compteResultat.produits.ventes;
    const pfAvant = etat.joueurs[0].bilan.actifs.find((a) => a.nom === "Stocks produits finis")!.valeur;
    const res = appliquerCarteClient(etat, 0, particulier!, 0);
    expect(res.succes).toBe(true);
    expect(getTresorerie(etat.joueurs[0]) - tresoAvant).toBe(2500);
    expect(etat.joueurs[0].compteResultat.produits.ventes - ventesAvant).toBe(2500);
    // La vente consomme du PF (1 000 € de coût matière, marge contributive 1 500 €).
    expect(pfAvant - etat.joueurs[0].bilan.actifs.find((a) => a.nom === "Stocks produits finis")!.valeur).toBe(1000);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);
  });

  // Étape 5 (DECISION) : dépend d'un choix interactif (achat de carte,
  // recrutement). Couverte séparément dans les tests d'intégration UI.

  test("Étape 6 (EVENEMENT) : une carte événement préserve l'invariant comptable", () => {
    const etat = initBelvaux();
    const carte = CARTES_EVENEMENTS[0];
    const ecartAvant = equilibre(etat.joueurs[0]).ecart;
    const res = appliquerCarteEvenement(etat, 0, carte);
    expect(res.succes).toBe(true);
    const ecartApres = equilibre(etat.joueurs[0]).ecart;
    expect(ecartApres).toBe(ecartAvant);
  });

  test("Étape 7 (CLOTURE_BILAN) : -2 000 € charges fixes, -500 € capital emprunt, +2 000 € dotations, pas d'intérêts à T1, pas de production fantôme Belvaux", () => {
    const etat = initBelvaux();
    const tresoAvant = getTresorerie(etat.joueurs[0]);
    const stocksAvant = stocksOf(etat.joueurs[0]);
    const prodStockeeAvant = etat.joueurs[0].compteResultat.produits.productionStockee;
    const res = appliquerClotureTrimestre(etat, 0);
    expect(res.succes).toBe(true);
    const tresoApres = getTresorerie(etat.joueurs[0]);
    // Bloc structurel : -2 000 (charges fixes) -500 (capital emprunt) = -2 500
    expect(tresoAvant - tresoApres).toBe(2500);
    // Charges fixes comptabilisées au CR
    expect(etat.joueurs[0].compteResultat.charges.servicesExterieurs).toBe(2000);
    // LOT 2.4 (2026-04-25) — Belvaux : Entrepôt (8 000/12 = 667) + Machine
    // (8 000/10 = 800) = 1 467 €/trim au lieu des 2 000 € de l'ancien
    // calcul fixe à −1 000 €/bien. Plus réaliste comptablement.
    expect(etat.joueurs[0].compteResultat.charges.dotationsAmortissements).toBe(1467);
    // Pas d'intérêts à T1 (gated sur tour >= 3 — T25.B)
    expect(etat.joueurs[0].compteResultat.charges.chargesInteret).toBe(0);
    // B9-D post (2026-04-24) — l'ancien `effetsPassifs` Belvaux (+1 000 € production
    // stockée + +1 000 € stocks en clôture) a été SUPPRIMÉ car il doublonnait avec
    // la réalisation métier explicite à l'étape 3. La clôture SEULE ne doit donc
    // plus produire ni ajouter de stock "fantôme" à Belvaux.
    expect(etat.joueurs[0].compteResultat.produits.productionStockee).toBe(prodStockeeAvant);
    expect(stocksOf(etat.joueurs[0])).toBe(stocksAvant);
    // Invariant comptable préservé après fusion
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);
  });

  test("Étape 7 (CLOTURE_BILAN, 2e passe) : verifierFinTour retourne un score numérique, pas de faillite à T1", () => {
    const etat = initBelvaux();
    appliquerClotureTrimestre(etat, 0);
    const res = verifierFinTour(etat, 0);
    expect(typeof res.score).toBe("number");
    expect(typeof res.equilibre).toBe("boolean");
    expect(res.enFaillite).toBe(false);
  });
});

// ─── C. Invariant comptable sur un cycle complet ─────────────

describe("Caractérisation C — L'invariant Actif = Passif tient sur un T1 complet (cycle 8-étapes)", () => {
  test("Séquence nouvelle 0 → 3 + 5 (décision 4 sautée) → 6 → 7 reste équilibrée", () => {
    const etat = initBelvaux();
    const particulier = CARTES_CLIENTS.find((c) => c.id === "client-particulier");
    expect(particulier).toBeDefined();

    // Ordre canonique T25.C : encaissements → commerciaux → achats → ventes → (décision sautée) → événement → clôture → bilan
    appliquerAvancementCreances(etat, 0);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    appliquerPaiementCommerciaux(etat, 0);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    // Étape 2 (ACHATS_STOCK) : pas d'achat ce T1.
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    appliquerCarteClient(etat, 0, particulier!, 0);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    // Étape 4 (DECISION) : sautée — pas d'achat de carte.

    appliquerCarteEvenement(etat, 0, CARTES_EVENEMENTS[0]);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    appliquerClotureTrimestre(etat, 0);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);

    const finTour = verifierFinTour(etat, 0);
    expect(finTour.enFaillite).toBe(false);
    expect(equilibre(etat.joueurs[0]).ecart).toBe(0);
  });

  test("La fusion dans appliquerClotureTrimestre produit le même résultat global que les appels séparés (appliquerEtape0 + appliquerEffetsRecurrents + appliquerSpecialiteEntreprise)", () => {
    const a = initBelvaux();
    const b = initBelvaux();

    // a : clôture fusionnée
    appliquerClotureTrimestre(a, 0);

    // b : anciens appels individuels dans l'ordre Commit 2 + rebascule finale
    // (alignée sur le bugfix T25.C du 2026-04-20 : la clôture doit toujours
    // s'achever sur trésorerie ≥ 0, donc on applique la même rebascule).
    appliquerEtape0(b, 0);
    appliquerEffetsRecurrents(b, 0);
    appliquerSpecialiteEntreprise(b, 0);
    basculerTresorerieSiNegative(b, 0);

    expect(getTresorerie(a.joueurs[0])).toBe(getTresorerie(b.joueurs[0]));
    expect(getTotalActif(a.joueurs[0])).toBe(getTotalActif(b.joueurs[0]));
    expect(getTotalPassif(a.joueurs[0])).toBe(getTotalPassif(b.joueurs[0]));
    expect(getResultatNet(a.joueurs[0])).toBe(getResultatNet(b.joueurs[0]));

    // Invariant fort post-clôture : la trésorerie ne doit jamais rester
    // négative à l'issue d'appliquerClotureTrimestre.
    expect(getTresorerie(a.joueurs[0])).toBeGreaterThanOrEqual(0);
  });
});
