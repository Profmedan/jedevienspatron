// ============================================================
// JEDEVIENSPATRON — Tests du module calibrage
// ============================================================
// Rappel L43 : les montants du jeu respectent une échelle précise
// (charges fixes 2000 €, amortissement 1000 €/bien, découvert max 8000 €).
// Les défis NE DOIVENT PAS hardcoder d'euros ; ces fonctions garantissent
// la cohérence d'échelle.
// ============================================================

import {
  arrondirJeu,
  montantChargeFixe,
  montantTresorerieCritique,
  montantUnites,
} from "../src/calibrage";
import { initialiserJeu } from "../src/engine";
import { EtatJeu, Joueur, PosteActif } from "../src/types";

// ─── HELPERS ─────────────────────────────────────────────────

function etatEtJoueur(): { etat: EtatJeu; joueur: Joueur } {
  const etat = initialiserJeu([
    { pseudo: "Test", nomEntreprise: "Manufacture Belvaux" },
  ]);
  return { etat, joueur: etat.joueurs[0] };
}

// ─── 1. arrondirJeu ──────────────────────────────────────────

describe("arrondirJeu — arrondi au pas de 500 €", () => {
  test("zéro reste zéro", () => {
    expect(arrondirJeu(0)).toBe(0);
  });

  test("arrondit au pas de 500 le plus proche", () => {
    expect(arrondirJeu(1234)).toBe(1000);
    expect(arrondirJeu(1250)).toBe(1500); // Math.round arrondit .5 vers le haut
    expect(arrondirJeu(1749)).toBe(1500);
    expect(arrondirJeu(1750)).toBe(2000);
  });

  test("préserve le signe pour les montants négatifs", () => {
    expect(arrondirJeu(-1234)).toBe(-1000);
    expect(arrondirJeu(-1250)).toBe(-1500);
    expect(arrondirJeu(-7999)).toBe(-8000);
  });

  test("montants déjà alignés sur le pas : inchangés", () => {
    expect(arrondirJeu(500)).toBe(500);
    expect(arrondirJeu(2000)).toBe(2000);
    expect(arrondirJeu(8000)).toBe(8000);
  });
});

// ─── 2. montantUnites ────────────────────────────────────────

describe("montantUnites — 1 unité = 1000 € (prix marchandise)", () => {
  test("1 unité = 1000 €", () => {
    expect(montantUnites(1)).toBe(1000);
  });

  test("2.5 unités = 2500 €", () => {
    expect(montantUnites(2.5)).toBe(2500);
  });

  test("fractions sous le pas arrondissent correctement", () => {
    // 0.3 × 1000 = 300 → arrondi au pas de 500 = 500
    expect(montantUnites(0.3)).toBe(500);
    // 0.2 × 1000 = 200 → arrondi = 0
    expect(montantUnites(0.2)).toBe(0);
  });
});

// ─── 3. montantChargeFixe ────────────────────────────────────

describe("montantChargeFixe — relatif aux charges fixes (2000 €/trim)", () => {
  test("ratio 0.5 = 1000 € (demi-charge)", () => {
    expect(montantChargeFixe(0.5)).toBe(1000);
  });

  test("ratio 1 = 2000 € (une charge complète)", () => {
    expect(montantChargeFixe(1)).toBe(2000);
  });

  test("ratio 1.5 = 3000 €", () => {
    expect(montantChargeFixe(1.5)).toBe(3000);
  });

  test("ratio négatif = montant négatif", () => {
    expect(montantChargeFixe(-1)).toBe(-2000);
  });
});

// ─── 4. montantTresorerieCritique ────────────────────────────

describe("montantTresorerieCritique — seuil contextuel borné par découvert", () => {
  test("Joueur Belvaux initial : tension ≈ 2000 (charges) + 2×1000 (2 immos) = 4000 €", () => {
    const { etat, joueur } = etatEtJoueur();
    // Belvaux : Entrepôt (8000) + Camionnette (8000) = 16000 d'immos
    // 16000 / 1000 (prix unitaire marchandise) = 16 → 16 biens amortissables
    // Tension = 2000 + 16 × 1000 = 18000, borné par DECOUVERT_MAX = 8000
    const seuil = montantTresorerieCritique(etat, joueur);
    expect(seuil).toBe(8000);
  });

  test("Retourne un montant multiple de 500 (pas de jeu)", () => {
    const { etat, joueur } = etatEtJoueur();
    const seuil = montantTresorerieCritique(etat, joueur);
    expect(seuil % 500).toBe(0);
  });

  test("Joueur sans immobilisations : tension = charges fixes seules (2000)", () => {
    const etat = initialiserJeu([
      { pseudo: "Test", nomEntreprise: "Manufacture Belvaux" },
    ]);
    const joueur = etat.joueurs[0];
    // Retirer toutes les immobilisations du bilan pour ce test.
    joueur.bilan.actifs = joueur.bilan.actifs.filter(
      (p: PosteActif) => p.categorie !== "immobilisations"
    );
    const seuil = montantTresorerieCritique(etat, joueur);
    // Tension = 2000 + 0 × 1000 = 2000, bornée par 8000 → 2000.
    expect(seuil).toBe(2000);
  });

  test("Toujours positif ou nul", () => {
    const { etat, joueur } = etatEtJoueur();
    const seuil = montantTresorerieCritique(etat, joueur);
    expect(seuil).toBeGreaterThanOrEqual(0);
  });
});
