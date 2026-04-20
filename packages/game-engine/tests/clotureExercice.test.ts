/**
 * JEDEVIENSPATRON — Tests B6 : Clôture d'exercice comptable
 * =========================================================
 *
 * Vérifie la logique métier arbitrée par Pierre (tasks/plan-b6-fin-exercice.md) :
 *   • IS 15 % du résultat avant IS, IS=0 sur perte.
 *   • Réserve légale 500 € tant que capitaux propres < 20 000 €.
 *   • Dividendes : 0 / 10 / 25 / 50 % au choix du dirigeant.
 *   • Équilibre comptable préservé : Actif = Passif + Résultat.
 *   • Reset du compte de résultat après clôture (exercice suivant repart à 0).
 *   • Cumul dans compteResultatCumulePartie (CA total partie).
 *   • Archive dans historiqueExercices.
 *
 * API publique uniquement (`initialiserJeu`, `appliquerClotureExercice`,
 * `finaliserClotureExercice`), pas d'accès à des helpers internes.
 */

import {
  initialiserJeu,
  appliquerClotureExercice,
  finaliserClotureExercice,
  getTotalActif,
  getTotalPassif,
  getResultatNet,
  getTresorerie,
  TAUX_IS,
  RESERVE_LEGALE_MONTANT,
  RESERVE_LEGALE_SEUIL_CAPITAUX,
} from "../src/index";
import type { EtatJeu, Joueur } from "../src/index";

// ─── HELPERS ─────────────────────────────────────────────────

/**
 * Instance par défaut pour les tests B6 : Synergia Lab.
 * Capitaux propres initiaux 19 000 € → réserve légale APPLICABLE (< seuil
 * 20 000 €). Le plus pratique pour tester les dotations à la réserve.
 */
function etatFrais(): EtatJeu {
  return initialiserJeu([{ pseudo: "Test", nomEntreprise: "Synergia Lab" }], 8);
}

/** Instance Belvaux (capitaux propres 22 000 € ≥ seuil → pas de réserve légale). */
function etatBelvaux(): EtatJeu {
  return initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }], 8);
}

function capitauxPropres(joueur: Joueur): number {
  return joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
}

/**
 * Force un bénéfice avant IS du montant donné, en simulant une vente cash.
 * Préserve l'équilibre comptable : +montant produits.ventes ET +montant trésorerie.
 * Actif +montant, Passif (via résultat) +montant.
 */
function forceBenefice(etat: EtatJeu, montant: number) {
  const j = etat.joueurs[0];
  j.compteResultat.produits.ventes += montant;
  const treso = j.bilan.actifs.find((a) => a.categorie === "tresorerie")!;
  treso.valeur += montant;
}

/**
 * Force une perte avant IS du montant donné, en simulant une charge cash.
 * Préserve l'équilibre comptable : +montant charges ET -montant trésorerie.
 * Actif -montant, Passif (via résultat) -montant.
 */
function forcePerte(etat: EtatJeu, montant: number) {
  const j = etat.joueurs[0];
  j.compteResultat.charges.servicesExterieurs += montant;
  const treso = j.bilan.actifs.find((a) => a.categorie === "tresorerie")!;
  treso.valeur -= montant;
}

// ─── 1. Squelette ─────────────────────────────────────────────

describe("appliquerClotureExercice — squelette et initialisation", () => {
  test("initialiserJeu crée un compteResultatCumulePartie vierge", () => {
    const etat = etatFrais();
    const j = etat.joueurs[0];
    expect(j.compteResultatCumulePartie).toBeDefined();
    expect(j.compteResultatCumulePartie.produits.ventes).toBe(0);
    expect(j.compteResultatCumulePartie.charges.achats).toBe(0);
  });

  test("initialiserJeu positionne numeroExerciceEnCours=1, dernierTourClotureExercice=0", () => {
    const etat = etatFrais();
    expect(etat.numeroExerciceEnCours).toBe(1);
    expect(etat.dernierTourClotureExercice).toBe(0);
  });

  test("historiqueExercices démarre vide", () => {
    const etat = etatFrais();
    expect(etat.joueurs[0].historiqueExercices).toEqual([]);
  });
});

// ─── 2. Cas bénéfice ─────────────────────────────────────────

describe("appliquerClotureExercice — cas bénéfice", () => {
  test("Bénéfice 4 000 € (Synergia) + 0 % dividendes : IS=600, réserve=500, report=2 900", () => {
    const etat = etatFrais(); // Synergia : capitaux 19k < seuil → réserve s'applique
    etat.tourActuel = 4;
    const j = etat.joueurs[0];

    forceBenefice(etat, 4000);
    const tresoAvant = getTresorerie(j);
    const capAvant = capitauxPropres(j);

    const res = appliquerClotureExercice(etat, 0, 0);
    expect(res.succes).toBe(true);

    // IS = 15 % × 4 000 = 600
    // Résultat après IS = 3 400
    // Réserve = 500 (capitaux < 20 000 ✓)
    // Dividendes = 0 % × (3 400 − 500) = 0
    // Report = 3 400 − 500 − 0 = 2 900
    // Δ capitaux = 500 + 2 900 = 3 400
    // Δ trésorerie = −600 − 0 = −600

    expect(j.historiqueExercices![0]).toMatchObject({
      numero: 1,
      tourDebut: 1,
      tourFin: 4,
      resultatAvantIS: 4000,
      impotSociete: 600,
      resultatApresIS: 3400,
      reserveLegale: 500,
      tauxDividendes: 0,
      dividendesVerses: 0,
      reportANouveau: 2900,
    });

    expect(getTresorerie(j)).toBe(tresoAvant - 600);
    expect(capitauxPropres(j)).toBe(capAvant + 3400);
  });

  test("Bénéfice 10 000 € + 25 % dividendes (Synergia) : IS=1 500, réserve=500, distribuable=8 000, div=2 000, report=6 000", () => {
    const etat = etatFrais(); // Synergia : capitaux 19k < seuil → réserve s'applique
    etat.tourActuel = 4;
    const j = etat.joueurs[0];

    forceBenefice(etat, 10000);
    const tresoAvant = getTresorerie(j);
    const capAvant = capitauxPropres(j);

    appliquerClotureExercice(etat, 0, 0.25);

    const arc = j.historiqueExercices![0];
    expect(arc.impotSociete).toBe(1500);
    expect(arc.resultatApresIS).toBe(8500);
    expect(arc.reserveLegale).toBe(500);
    expect(arc.dividendesVerses).toBe(2000); // 25 % de (8 500 − 500) = 2 000
    expect(arc.reportANouveau).toBe(6000);
    // Δ trésorerie = −(1 500 + 2 000) = −3 500
    expect(getTresorerie(j)).toBe(tresoAvant - 3500);
    // Δ capitaux = 500 + 6 000 = 6 500
    expect(capitauxPropres(j)).toBe(capAvant + 6500);
  });

  test("50 % dividendes sur bénéfice 8 000 € (Synergia) : réserve 500, div 3 150, report 3 150", () => {
    const etat = etatFrais();
    etat.tourActuel = 4;
    forceBenefice(etat, 8000);

    appliquerClotureExercice(etat, 0, 0.5);
    const arc = etat.joueurs[0].historiqueExercices![0];
    // IS = 1 200 ; résultat après IS = 6 800 ; réserve = 500 ;
    // distribuable = 6 300 ; dividendes = 3 150 ; report = 3 150
    expect(arc.impotSociete).toBe(1200);
    expect(arc.reserveLegale).toBe(500);
    expect(arc.dividendesVerses).toBe(3150);
    expect(arc.reportANouveau).toBe(3150);
  });

  test("Pas de réserve légale si capitaux propres ≥ seuil (Belvaux 22k, bénéfice 5k)", () => {
    const etat = etatBelvaux();
    etat.tourActuel = 4;
    const j = etat.joueurs[0];
    expect(capitauxPropres(j)).toBeGreaterThanOrEqual(RESERVE_LEGALE_SEUIL_CAPITAUX);

    forceBenefice(etat, 5000);
    appliquerClotureExercice(etat, 0, 0);
    const arc = j.historiqueExercices![0];
    expect(arc.reserveLegale).toBe(0);
    // Résultat après IS = 5000 − 750 = 4 250
    // Tout va en report (pas de réserve, pas de dividendes) = 4 250
    expect(arc.reportANouveau).toBe(4250);
  });

  test("Bénéfice très faible (200 €, Synergia) : réserve plafonnée au résultat, pas de surflux", () => {
    const etat = etatFrais();
    etat.tourActuel = 4;
    forceBenefice(etat, 200);

    appliquerClotureExercice(etat, 0, 0);
    const arc = etat.joueurs[0].historiqueExercices![0];
    // IS = 30, résultat après IS = 170, réserve = min(500, 170) = 170, report = 0
    expect(arc.impotSociete).toBe(30);
    expect(arc.resultatApresIS).toBe(170);
    expect(arc.reserveLegale).toBe(170);
    expect(arc.reportANouveau).toBe(0);
  });
});

// ─── 3. Cas perte ─────────────────────────────────────────────

describe("appliquerClotureExercice — cas perte", () => {
  test("Perte 3 000 € : IS=0, pas de réserve, pas de dividendes, capitaux propres réduits", () => {
    const etat = etatFrais();
    etat.tourActuel = 4;
    const j = etat.joueurs[0];

    // 1) On simule la perte en amont (avec sa contrepartie tréso) pour garder
    //    l'équilibre comptable pré-clôture.
    forcePerte(etat, 3000);
    const tresoApresPerte = getTresorerie(j); // trésorerie après la perte cash
    const capAvant = capitauxPropres(j);

    // 2) On clôture : sur perte, IS=0, pas de dividendes même si 25 % demandés.
    appliquerClotureExercice(etat, 0, 0.25);

    const arc = j.historiqueExercices![0];
    expect(arc.resultatAvantIS).toBe(-3000);
    expect(arc.impotSociete).toBe(0);
    expect(arc.resultatApresIS).toBe(-3000);
    expect(arc.reserveLegale).toBe(0);
    expect(arc.dividendesVerses).toBe(0);
    expect(arc.reportANouveau).toBe(-3000);

    // La clôture ne touche PAS la trésorerie sur perte (IS=0, div=0).
    expect(getTresorerie(j)).toBe(tresoApresPerte);
    // Les capitaux propres absorbent la perte (−3 000 sur les 19 000 initiaux).
    expect(capitauxPropres(j)).toBe(capAvant - 3000);
  });

  test("Résultat nul : IS=0, rien ne bouge", () => {
    const etat = etatFrais();
    etat.tourActuel = 4;
    const j = etat.joueurs[0];
    const tresoAvant = getTresorerie(j);
    const capAvant = capitauxPropres(j);

    appliquerClotureExercice(etat, 0, 0.5);
    const arc = j.historiqueExercices![0];
    expect(arc.impotSociete).toBe(0);
    expect(arc.reserveLegale).toBe(0);
    expect(arc.dividendesVerses).toBe(0);
    expect(getTresorerie(j)).toBe(tresoAvant);
    expect(capitauxPropres(j)).toBe(capAvant);
  });
});

// ─── 4. Équilibre comptable préservé ──────────────────────────

describe("appliquerClotureExercice — invariant Actif = Passif", () => {
  const cas: Array<[string, (etat: EtatJeu) => void, number]> = [
    ["Bénéfice 4 000, 0 % div",    (e) => forceBenefice(e, 4000),  0],
    ["Bénéfice 4 000, 50 % div",   (e) => forceBenefice(e, 4000),  0.5],
    ["Bénéfice 12 000, 25 % div",  (e) => forceBenefice(e, 12000), 0.25],
    ["Perte 3 000, 50 % div",      (e) => forcePerte(e, 3000),     0.5],
    ["Nul, 10 % div",              () => {},                        0.1],
  ];

  test.each(cas)(
    "%s : Actif reste = Passif après clôture",
    (_libelle, mutateur, pct) => {
      const etat = etatFrais();
      etat.tourActuel = 4;
      const j = etat.joueurs[0];
      mutateur(etat);

      appliquerClotureExercice(etat, 0, pct);

      const actif = getTotalActif(j);
      const passif = getTotalPassif(j);
      expect(Math.abs(actif - passif)).toBeLessThanOrEqual(1);
    }
  );
});

// ─── 5. Reset compteResultat + cumul compteResultatCumulePartie ───

describe("appliquerClotureExercice — cumul + reset", () => {
  test("Le compteResultat est remis à zéro après clôture", () => {
    const etat = etatFrais();
    etat.tourActuel = 4;
    const j = etat.joueurs[0];
    forceBenefice(etat, 5000);

    expect(j.compteResultat.produits.ventes).toBe(5000);
    appliquerClotureExercice(etat, 0, 0);
    expect(getResultatNet(j)).toBe(0);
    expect(j.compteResultat.produits.ventes).toBe(0);
  });

  test("compteResultatCumulePartie capture le CA des exercices clos", () => {
    const etat = etatFrais();
    const j = etat.joueurs[0];

    // Exercice 1 : CA = 8 000
    etat.tourActuel = 4;
    forceBenefice(etat, 8000);
    appliquerClotureExercice(etat, 0, 0);
    finaliserClotureExercice(etat);
    expect(j.compteResultatCumulePartie.produits.ventes).toBe(8000);
    // Le CA de l'exercice en cours est reparti à 0
    expect(j.compteResultat.produits.ventes).toBe(0);

    // Exercice 2 : CA = 6 000
    etat.tourActuel = 8;
    forceBenefice(etat, 6000);
    appliquerClotureExercice(etat, 0, 0);
    finaliserClotureExercice(etat);
    expect(j.compteResultatCumulePartie.produits.ventes).toBe(14000); // 8 + 6
    expect(j.historiqueExercices!.length).toBe(2);
  });
});

// ─── 6. Meta + enchaînement ───────────────────────────────────

describe("appliquerClotureExercice — archive et compteurs", () => {
  test("tourDebut et tourFin sont corrects après deux clôtures successives", () => {
    const etat = etatFrais();
    const j = etat.joueurs[0];

    etat.tourActuel = 4;
    appliquerClotureExercice(etat, 0, 0);
    finaliserClotureExercice(etat);
    expect(j.historiqueExercices![0]).toMatchObject({ numero: 1, tourDebut: 1, tourFin: 4 });

    etat.tourActuel = 8;
    appliquerClotureExercice(etat, 0, 0);
    finaliserClotureExercice(etat);
    expect(j.historiqueExercices![1]).toMatchObject({ numero: 2, tourDebut: 5, tourFin: 8 });

    expect(etat.numeroExerciceEnCours).toBe(3);
    expect(etat.dernierTourClotureExercice).toBe(8);
  });

  test("Joueur éliminé : appel noop, pas de modification ni archive", () => {
    const etat = etatFrais();
    const j = etat.joueurs[0];
    j.elimine = true;
    forceBenefice(etat, 5000);

    const res = appliquerClotureExercice(etat, 0, 0.25);
    expect(res.succes).toBe(true);
    expect(res.modifications).toHaveLength(0);
    expect(j.historiqueExercices).toEqual([]);
  });

  test("Taux de dividendes non autorisé : échec contrôlé", () => {
    const etat = etatFrais();
    etat.tourActuel = 4;
    forceBenefice(etat, 2000);

    const res = appliquerClotureExercice(etat, 0, 0.33);
    expect(res.succes).toBe(false);
    expect(res.messageErreur).toMatch(/invalide/i);
  });
});

// ─── 7. Housekeeping via finaliserClotureExercice (B6-B) ──────
//
// Hérite du comportement de l'ancien `cloturerAnnee` désormais supplanté :
// purge des cartes tactiques + financement, reset des files clients
// trimestrielles. La partie comptable est déjà gérée par
// `appliquerClotureExercice` appelé individuellement par joueur.

// Helper : construit une CarteDecision minimale typée (effets vides).
function carteDecision(
  id: string,
  categorie:
    | "commercial"
    | "vehicule"
    | "investissement"
    | "financement"
    | "tactique"
    | "service"
    | "protection"
): import("../src/types").CarteDecision {
  return {
    type: "decision",
    id,
    titre: id,
    description: "",
    categorie,
    effetsImmédiats: [],
    effetsRecurrents: [],
  };
}

// Helper : construit une CarteClient minimale typée.
function carteClient(id: string): import("../src/types").CarteClient {
  return {
    type: "client",
    id,
    titre: id,
    montantVentes: 100,
    delaiPaiement: 0,
    consommeStocks: false,
  };
}

describe("finaliserClotureExercice — housekeeping par joueur", () => {
  test("Retire les cartes tactiques et financement, garde commercial + investissement + service", () => {
    const etat = etatFrais();
    const j = etat.joueurs[0];
    etat.tourActuel = 4;

    // On pose des cartes de chaque catégorie pour vérifier le filtre.
    j.cartesActives = [
      carteDecision("tac-1", "tactique"),
      carteDecision("fin-1", "financement"),
      carteDecision("com-1", "commercial"),
      carteDecision("inv-1", "investissement"),
      carteDecision("srv-1", "service"),
    ];

    appliquerClotureExercice(etat, 0, 0);
    finaliserClotureExercice(etat);

    const ids = j.cartesActives.map((c) => c.id).sort();
    expect(ids).toEqual(["com-1", "inv-1", "srv-1"]);
  });

  test("Reset clientsATrait et clientsPerdusCeTour à 0", () => {
    const etat = etatFrais();
    const j = etat.joueurs[0];
    etat.tourActuel = 4;

    j.clientsATrait = [carteClient("c1")];
    j.clientsPerdusCeTour = 3;

    appliquerClotureExercice(etat, 0, 0);
    finaliserClotureExercice(etat);

    expect(j.clientsATrait).toEqual([]);
    expect(j.clientsPerdusCeTour).toBe(0);
  });

  test("Joueur éliminé : housekeeping noop (ne touche pas ses cartes)", () => {
    const etat = etatFrais();
    const j = etat.joueurs[0];
    etat.tourActuel = 4;

    j.elimine = true;
    const cartesAvant = [carteDecision("tac-1", "tactique")];
    j.cartesActives = [...cartesAvant];
    j.clientsPerdusCeTour = 5;

    finaliserClotureExercice(etat);

    // Les cartes et clientsPerdusCeTour du joueur éliminé sont intacts.
    expect(j.cartesActives).toEqual(cartesAvant);
    expect(j.clientsPerdusCeTour).toBe(5);
  });
});

// ─── 8. Calibrage des constantes ──────────────────────────────

describe("Constantes B6 — valeurs arbitrées par Pierre", () => {
  test("TAUX_IS = 15 %", () => {
    expect(TAUX_IS).toBe(0.15);
  });

  test("RESERVE_LEGALE_MONTANT = 500 €", () => {
    expect(RESERVE_LEGALE_MONTANT).toBe(500);
  });

  test("RESERVE_LEGALE_SEUIL_CAPITAUX = 20 000 €", () => {
    expect(RESERVE_LEGALE_SEUIL_CAPITAUX).toBe(20000);
  });
});
