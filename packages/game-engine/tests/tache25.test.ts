/**
 * JEDEVIENSPATRON — Tests Tâche 25 (courbe de difficulté)
 * =========================================================
 *
 * Vérifie deux ajustements d'équilibrage décidés le 2026-04-18 par
 * Pierre après qu'il ait lui-même fait faillite au T6 :
 *
 *   • T25.A — Trésorerie initiale +2 000 € ET capitaux propres +2 000 €
 *             sur les 4 entreprises (bilans restent équilibrés).
 *   • T25.B — Intérêts d'emprunt décalés : pas d'intérêts à T1/T2,
 *             première facturation annuelle à T3, puis T7, T11…
 *             Le remboursement du capital (-500 €/trim.) reste inchangé.
 *
 * Ces tests utilisent uniquement l'API PUBLIQUE du package — donc
 * `initialiserJeu` plutôt que `creerJoueur` (retiré du public dans d8571b4).
 * Ils vivent dans un fichier dédié pour ne pas subir la dette de typage
 * de `engine.test.ts` (suite cassée en compile depuis d8571b4 — non
 * réparée dans ce commit pour rester minimaliste).
 */

import {
  ENTREPRISES,
  initialiserJeu,
  appliquerEtape0,
  getTresorerie,
  getTotalActif,
  getTotalPassif,
  getResultatNet,
} from "../src/index";

// ─── Helpers ────────────────────────────────────────────────

const NOMS_ENTREPRISES: string[] = [
  "Manufacture Belvaux",
  "Véloce Transports",
  "Azura Commerce",
  "Synergia Lab",
];

function etatPour(nom: string) {
  return initialiserJeu([{ pseudo: "Test", nomEntreprise: nom }]);
}

function tresorerie(etat: ReturnType<typeof initialiserJeu>) {
  return getTresorerie(etat.joueurs[0]);
}

function capitaux(etat: ReturnType<typeof initialiserJeu>): number {
  return etat.joueurs[0].bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
}

function emprunts(etat: ReturnType<typeof initialiserJeu>): number {
  return etat.joueurs[0].bilan.passifs
    .find((p) => p.categorie === "emprunts")!.valeur;
}

// ─── T25.A : trésorerie et capitaux ─────────────────────────

describe("Tâche 25.A — Trésorerie +2 000 € et capital +2 000 €", () => {
  test("Trésorerie initiale = 10 000 € pour les 4 entreprises", () => {
    for (const nom of NOMS_ENTREPRISES) {
      const etat = etatPour(nom);
      expect(tresorerie(etat)).toBe(10000);
    }
  });

  test("Capitaux propres initiaux : Belvaux/Véloce/Azura = 22 000 €", () => {
    for (const nom of ["Manufacture Belvaux", "Véloce Transports", "Azura Commerce"]) {
      const etat = etatPour(nom);
      expect(capitaux(etat)).toBe(22000);
    }
  });

  test("Capitaux propres initiaux : Synergia Lab = 19 000 €", () => {
    const etat = etatPour("Synergia Lab");
    expect(capitaux(etat)).toBe(19000);
  });

  test("Bilan initial équilibré (Actif = Passif + Résultat) pour les 4 entreprises", () => {
    // Invariant comptable : Actif = Passif + Résultat net.
    // Au T1 avant toute opération, résultat net = 0, donc Actif = Passif.
    for (const nom of NOMS_ENTREPRISES) {
      const etat = etatPour(nom);
      const joueur = etat.joueurs[0];
      const actif = getTotalActif(joueur);
      const passif = getTotalPassif(joueur);
      const resultat = getResultatNet(joueur);
      expect(resultat).toBe(0);
      expect(actif).toBe(passif);
    }
  });

  test("Le template `ENTREPRISES` lui-même a été mis à jour (pas juste une dérivée)", () => {
    // Lecture directe du template (source de vérité) pour éviter qu'un
    // bug dans `creerJoueur` nous cache une régression silencieuse.
    for (const ent of ENTREPRISES) {
      const treso = ent.actifs.find((a) => a.nom === "Trésorerie")!.valeur;
      const capi = ent.passifs.find((p) => p.nom === "Capitaux propres")!.valeur;
      expect(treso).toBe(10000);
      if (ent.nom === "Synergia Lab") {
        expect(capi).toBe(19000);
      } else {
        expect(capi).toBe(22000);
      }
    }
  });
});

// ─── T25.B : intérêts retardés à T3 ─────────────────────────

describe("Tâche 25.B — Intérêts d'emprunt décalés à T3", () => {
  test("T1 : pas d'intérêts (grâce 2 trimestres)", () => {
    const etat = etatPour("Manufacture Belvaux");
    expect(etat.tourActuel).toBe(1);
    appliquerEtape0(etat, 0);
    expect(etat.joueurs[0].compteResultat.charges.chargesInteret).toBe(0);
  });

  test("T2 : pas d'intérêts", () => {
    const etat = etatPour("Manufacture Belvaux");
    etat.tourActuel = 2;
    appliquerEtape0(etat, 0);
    expect(etat.joueurs[0].compteResultat.charges.chargesInteret).toBe(0);
  });

  test("T3 : première facturation annuelle (400 € sur 8 000 € d'emprunt)", () => {
    const etat = etatPour("Manufacture Belvaux");
    etat.tourActuel = 3;
    appliquerEtape0(etat, 0);
    // 8 000 € × 5 % = 400 € (arrondi centaine sup.)
    expect(etat.joueurs[0].compteResultat.charges.chargesInteret).toBe(400);
  });

  test("T4/T5/T6 : pas d'intérêts (cadence annuelle T3 → T7)", () => {
    for (const tour of [4, 5, 6]) {
      const etat = etatPour("Manufacture Belvaux");
      etat.tourActuel = tour;
      appliquerEtape0(etat, 0);
      expect(etat.joueurs[0].compteResultat.charges.chargesInteret).toBe(0);
    }
  });

  test("T7 : deuxième facturation annuelle (cadence annuelle depuis T3)", () => {
    // On force tourActuel=7 sans exécuter T1..T6 : l'emprunt est intact
    // à 8 000 €. L'intérêt est donc à nouveau 400 €.
    const etat = etatPour("Manufacture Belvaux");
    etat.tourActuel = 7;
    appliquerEtape0(etat, 0);
    expect(etat.joueurs[0].compteResultat.charges.chargesInteret).toBe(400);
  });

  test("Remboursement du capital -500 € dès T1 (inchangé)", () => {
    const etat = etatPour("Manufacture Belvaux");
    expect(etat.tourActuel).toBe(1);
    const empAvant = emprunts(etat);
    appliquerEtape0(etat, 0);
    // Le capital de l'emprunt a baissé — seule la charge d'intérêt est suspendue.
    expect(empAvant - emprunts(etat)).toBe(500);
  });

  test("Trésorerie à T1 : impact = -2 500 € (charges fixes -2 000 + capital -500)", () => {
    // Invariant combiné T25.A + T25.B :
    // - Trésorerie de départ : 10 000 € (T25.A)
    // - Après Étape 0 au T1 : 10 000 - 2 000 - 500 = 7 500 €
    // - (pas d'intérêts à T1 : T25.B)
    const etat = etatPour("Manufacture Belvaux");
    expect(tresorerie(etat)).toBe(10000);
    appliquerEtape0(etat, 0);
    expect(tresorerie(etat)).toBe(7500);
  });
});
