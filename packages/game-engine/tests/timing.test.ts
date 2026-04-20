// ============================================================
// JEDEVIENSPATRON — Tests du timing dramaturgique
// ============================================================

import { determinerSlotsActifs, determinerTimingRupture, estFinExercice } from "../src/timing";

// ─── 1. determinerTimingRupture ──────────────────────────────

describe("determinerTimingRupture — points charnières du trimestre", () => {
  test("Hors plage : tour < 1 ou tour > nbToursMax → null", () => {
    expect(determinerTimingRupture(0, 6)).toBeNull();
    expect(determinerTimingRupture(-1, 6)).toBeNull();
    expect(determinerTimingRupture(7, 6)).toBeNull();
    expect(determinerTimingRupture(13, 12)).toBeNull();
  });

  test("T1 et T2 : null (observation silencieuse)", () => {
    for (const duree of [6, 8, 10, 12]) {
      expect(determinerTimingRupture(1, duree)).toBeNull();
      expect(determinerTimingRupture(2, duree)).toBeNull();
    }
  });

  test("T3 : 'resiste' sur toutes les durées", () => {
    for (const duree of [6, 8, 10, 12]) {
      expect(determinerTimingRupture(3, duree)).toBe("resiste");
    }
  });

  test("Dernier tour : 'finale' sur toutes les durées", () => {
    expect(determinerTimingRupture(6, 6)).toBe("finale");
    expect(determinerTimingRupture(8, 8)).toBe("finale");
    expect(determinerTimingRupture(10, 10)).toBe("finale");
    expect(determinerTimingRupture(12, 12)).toBe("finale");
  });

  test("Tours intermédiaires : null (V2 minimaliste)", () => {
    // V2 n'encode pas encore juge / revient / second_palier.
    expect(determinerTimingRupture(4, 6)).toBeNull();
    expect(determinerTimingRupture(5, 6)).toBeNull();
    expect(determinerTimingRupture(5, 8)).toBeNull();
    expect(determinerTimingRupture(8, 10)).toBeNull();
  });

  test("Cas particulier : durée 3 → T3 est à la fois resiste ET finale → priorité finale", () => {
    // Règle actuelle : si tour === nbToursMax, on retourne "finale" en premier.
    // Une durée 3 serait absurde pédagogiquement, mais la fonction reste cohérente.
    expect(determinerTimingRupture(3, 3)).toBe("finale");
  });
});

// ─── 2. determinerSlotsActifs ────────────────────────────────

describe("determinerSlotsActifs — slots consultables par tour", () => {
  test("Hors plage : liste vide", () => {
    expect(determinerSlotsActifs(0, 6)).toEqual([]);
    expect(determinerSlotsActifs(-1, 6)).toEqual([]);
    expect(determinerSlotsActifs(7, 6)).toEqual([]);
  });

  test("T1 et T2 : uniquement debut_tour (observation silencieuse)", () => {
    expect(determinerSlotsActifs(1, 6)).toEqual(["debut_tour"]);
    expect(determinerSlotsActifs(2, 6)).toEqual(["debut_tour"]);
    expect(determinerSlotsActifs(2, 12)).toEqual(["debut_tour"]);
  });

  test("T3 : debut_tour + avant_decision (premier palier)", () => {
    const slots = determinerSlotsActifs(3, 6);
    expect(slots).toContain("debut_tour");
    expect(slots).toContain("avant_decision");
    expect(slots).not.toContain("finale");
  });

  test("Tours intermédiaires : debut_tour + avant_decision", () => {
    // La présence d'avant_decision à tous les tours >= 3 est gérée par
    // les tourMin/tourMax du catalogue (le slot peut être consulté sans
    // résultat). On vérifie juste la liste retournée.
    const slotsT5 = determinerSlotsActifs(5, 6);
    expect(slotsT5).toContain("debut_tour");
    expect(slotsT5).toContain("avant_decision");
  });

  test("Dernier tour : debut_tour + avant_decision + finale", () => {
    const slots = determinerSlotsActifs(6, 6);
    expect(slots).toContain("debut_tour");
    expect(slots).toContain("avant_decision");
    expect(slots).toContain("finale");
    expect(slots).toHaveLength(3);
  });

  test("Dernier tour en durée 8 : idem sur T8", () => {
    const slots = determinerSlotsActifs(8, 8);
    expect(slots).toContain("finale");
    // T7 ne doit PAS contenir finale.
    expect(determinerSlotsActifs(7, 8)).not.toContain("finale");
  });

  test("Règle 1 majeur + 1 alerte : pas plus de 3 slots par tour (V2)", () => {
    // On garde une borne supérieure pour éviter une explosion en V3+.
    for (let t = 1; t <= 12; t++) {
      const slots = determinerSlotsActifs(t, 12);
      expect(slots.length).toBeLessThanOrEqual(3);
    }
  });
});

// ─── 3. estFinExercice (B6 — 2026-04-20) ─────────────────────
//
// Règle métier : clôture d'exercice à chaque multiple de 4 (T4, T8, T12)
// ET au dernier trimestre même s'il n'est pas multiple de 4 (ex: T6 pour
// une partie 6 trimestres).

describe("estFinExercice — déclenchement de la clôture d'exercice", () => {
  test("Hors plage : false", () => {
    expect(estFinExercice(0, 8)).toBe(false);
    expect(estFinExercice(-1, 8)).toBe(false);
    expect(estFinExercice(9, 8)).toBe(false);
    expect(estFinExercice(13, 12)).toBe(false);
  });

  test("Partie 12 trimestres : clôture à T4, T8, T12 uniquement", () => {
    const dureeTotale = 12;
    for (let t = 1; t <= dureeTotale; t++) {
      const attendu = t === 4 || t === 8 || t === 12;
      expect(estFinExercice(t, dureeTotale)).toBe(attendu);
    }
  });

  test("Partie 8 trimestres : clôture à T4 et T8", () => {
    const dureeTotale = 8;
    for (let t = 1; t <= dureeTotale; t++) {
      const attendu = t === 4 || t === 8;
      expect(estFinExercice(t, dureeTotale)).toBe(attendu);
    }
  });

  test("Partie 6 trimestres : clôture à T4 et T6 (dernier tour)", () => {
    const dureeTotale = 6;
    expect(estFinExercice(1, dureeTotale)).toBe(false);
    expect(estFinExercice(2, dureeTotale)).toBe(false);
    expect(estFinExercice(3, dureeTotale)).toBe(false);
    expect(estFinExercice(4, dureeTotale)).toBe(true);  // multiple de 4
    expect(estFinExercice(5, dureeTotale)).toBe(false);
    expect(estFinExercice(6, dureeTotale)).toBe(true);  // dernier trimestre
  });

  test("Partie 10 trimestres : clôture à T4, T8, T10 (dernier tour)", () => {
    const dureeTotale = 10;
    expect(estFinExercice(4, dureeTotale)).toBe(true);
    expect(estFinExercice(8, dureeTotale)).toBe(true);
    expect(estFinExercice(10, dureeTotale)).toBe(true);
    expect(estFinExercice(9, dureeTotale)).toBe(false);
    expect(estFinExercice(5, dureeTotale)).toBe(false);
  });
});
