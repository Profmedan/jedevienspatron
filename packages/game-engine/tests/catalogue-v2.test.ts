// ============================================================
// JEDEVIENSPATRON — Tests du mini-catalogue V2
// ============================================================
// Objectif : garantir que le parcours émotionnel visé par Pierre
// se produit bien en durée 6.
//   T1 obs → T2 obs → T3 début (marché change) → T3 avant_decision
//   (palier positionnement) → T5 (conséquence différée qui revient)
// ============================================================

import { CATALOGUE_V2, CATALOGUE_V2_INDEX } from "../src/data/defis/catalogue-v2";
import {
  appliquerChoixDefi,
  piocherDefi,
  resoudreConsequencesDifferees,
} from "../src/defis";
import { initialiserJeu } from "../src/engine";
import {
  ArcDiffere,
  DefiResolu,
  EtatJeu,
  SlotDramaturgique,
} from "../src/types";

// ─── HELPERS ─────────────────────────────────────────────────

function etatNeuf(): EtatJeu {
  return initialiserJeu([
    { pseudo: "Pierre", nomEntreprise: "Manufacture Belvaux" },
  ]);
}

/** Simule la consultation d'un slot pour le joueur 0. Rng déterministe. */
function piocherAuTour(
  tour: number,
  slot: SlotDramaturgique,
  etat: EtatJeu
) {
  etat.tourActuel = tour;
  return piocherDefi(etat, etat.joueurs[0], slot, CATALOGUE_V2, () => 0);
}

// ─── 1. STRUCTURE DU CATALOGUE ───────────────────────────────

describe("Structure du catalogue V2", () => {
  test("Contient exactement 4 défis", () => {
    expect(CATALOGUE_V2).toHaveLength(4);
  });

  test("Tous les IDs sont uniques", () => {
    const ids = CATALOGUE_V2.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("Index par ID est cohérent", () => {
    for (const d of CATALOGUE_V2) {
      expect(CATALOGUE_V2_INDEX[d.id]).toBe(d);
    }
  });

  test("Chaque défi a au moins un choix", () => {
    for (const d of CATALOGUE_V2) {
      expect(d.choix.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("Les IDs des choix sont uniques au sein de chaque défi", () => {
    for (const d of CATALOGUE_V2) {
      const ids = d.choix.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

// ─── 2. PARCOURS T1 → T3 (dramaturgie garantie) ──────────────

describe("Parcours émotionnel T1 → T3 (défis obligatoires)", () => {
  test("T1 slot debut_tour : observation T1 tirée", () => {
    const etat = etatNeuf();
    const defi = piocherAuTour(1, "debut_tour", etat);
    expect(defi?.id).toBe("obs-t1");
    expect(defi?.archetype).toBe("observation");
  });

  test("T2 slot debut_tour : observation T2 tirée", () => {
    const etat = etatNeuf();
    const defi = piocherAuTour(2, "debut_tour", etat);
    expect(defi?.id).toBe("obs-t2");
  });

  test("T3 slot debut_tour : défi « Le marché change » tiré", () => {
    const etat = etatNeuf();
    const defi = piocherAuTour(3, "debut_tour", etat);
    expect(defi?.id).toBe("defi-t3-marche");
    expect(defi?.archetype).toBe("choix_binaire");
    expect(defi?.choix).toHaveLength(2);
  });

  test("T3 slot avant_decision : palier positionnement tiré", () => {
    const etat = etatNeuf();
    const defi = piocherAuTour(3, "avant_decision", etat);
    expect(defi?.id).toBe("palier-t3-positionnement");
    expect(defi?.archetype).toBe("palier_strategique");
    expect(defi?.choix).toHaveLength(3);
  });

  test("T4/T5/T6 slot debut_tour : plus de défi tiré (catalogue court)", () => {
    const etat = etatNeuf();
    expect(piocherAuTour(4, "debut_tour", etat)).toBeNull();
    expect(piocherAuTour(5, "debut_tour", etat)).toBeNull();
    expect(piocherAuTour(6, "debut_tour", etat)).toBeNull();
  });

  test("Anti-répétition : un même défi ne se retire pas au joueur qui l'a déjà résolu", () => {
    const etat = etatNeuf();
    const traceT1: DefiResolu = {
      id: "defi-obs-t1-T1-J0",
      defiId: "obs-t1",
      joueurId: 0,
      trimestre: 1,
      slot: "debut_tour",
      choixId: "continuer",
      conceptCible: "bilan_actif_passif",
    };
    etat.defisResolus = [traceT1];
    // Même si on revient au T1 (cas théorique), obs-t1 ne doit pas être re-tiré.
    const defi = piocherAuTour(1, "debut_tour", etat);
    expect(defi).toBeNull();
  });
});

// ─── 3. ARC DIFFÉRÉ DU PALIER — CŒUR DE LA DRAMATURGIE ───────

describe("Arc différé du palier positionnement (T3 → T5)", () => {
  test("Chaque choix du palier déclenche un effet différé à T5", () => {
    const etat = etatNeuf();
    etat.tourActuel = 3;
    const palier = CATALOGUE_V2_INDEX["palier-t3-positionnement"];

    for (const choix of palier.choix) {
      const res = appliquerChoixDefi(palier, choix, etat, etat.joueurs[0]);
      expect(res.arcDiffereACreer).not.toBeNull();
      const arc = res.arcDiffereACreer as ArcDiffere;
      // 3 + 2 = 5
      expect(arc.effetsRestants[0].trimestreApplication).toBe(5);
    }
  });

  test("Low-cost déclenche +ventes et +achats à T5", () => {
    const etat = etatNeuf();
    etat.tourActuel = 3;
    const palier = CATALOGUE_V2_INDEX["palier-t3-positionnement"];
    const choix = palier.choix.find((c) => c.id === "low_cost")!;
    const res = appliquerChoixDefi(palier, choix, etat, etat.joueurs[0]);
    const effets = res.arcDiffereACreer!.effetsRestants[0].effets;
    const ventes = effets.find((e) => e.poste === "ventes")!;
    const achats = effets.find((e) => e.poste === "achats")!;
    expect(ventes.delta).toBeGreaterThan(0);
    expect(achats.delta).toBeGreaterThan(0);
  });

  test("Premium a un coût immédiat en trésorerie", () => {
    const etat = etatNeuf();
    etat.tourActuel = 3;
    const palier = CATALOGUE_V2_INDEX["palier-t3-positionnement"];
    const choix = palier.choix.find((c) => c.id === "premium")!;
    const res = appliquerChoixDefi(palier, choix, etat, etat.joueurs[0]);
    const tresorerie = res.effetsImmediats.find((e) => e.poste === "tresorerie")!;
    expect(tresorerie.delta).toBeLessThan(0);
  });

  test("L'arc est bien résolu au T5 via resoudreConsequencesDifferees", () => {
    const etat = etatNeuf();
    etat.tourActuel = 3;
    const palier = CATALOGUE_V2_INDEX["palier-t3-positionnement"];
    const choix = palier.choix.find((c) => c.id === "milieu")!;
    const res = appliquerChoixDefi(palier, choix, etat, etat.joueurs[0]);
    // On enregistre l'arc dans l'état.
    etat.defisActifs = [res.arcDiffereACreer!];

    // T4 : pas encore l'échéance.
    etat.tourActuel = 4;
    let resolution = resoudreConsequencesDifferees(etat);
    expect(resolution.effetsAppliquer).toHaveLength(0);
    expect(resolution.defisActifsRestants).toHaveLength(1);

    // T5 : échéance atteinte.
    etat.tourActuel = 5;
    resolution = resoudreConsequencesDifferees(etat);
    expect(resolution.effetsAppliquer).toHaveLength(1);
    expect(resolution.effetsAppliquer[0].joueurId).toBe(0);
    expect(resolution.defisActifsRestants).toHaveLength(0);
  });
});

// ─── 4. CALIBRAGE : AUCUN MONTANT HARDCODÉ ──────────────────

describe("Respect de l'échelle de jeu (L43)", () => {
  test("Tous les deltas sont des multiples de 500 (pas arrondirJeu)", () => {
    // Note : on passe par Math.abs pour éviter le piège -0 vs 0 en JS.
    for (const defi of CATALOGUE_V2) {
      for (const choix of defi.choix) {
        for (const e of choix.effetsImmediats) {
          expect(Math.abs(e.delta) % 500).toBe(0);
        }
        for (const diff of choix.effetsDiffere ?? []) {
          for (const e of diff.effets) {
            expect(Math.abs(e.delta) % 500).toBe(0);
          }
        }
      }
    }
  });

  test("Aucun delta n'excède 2 mois de charges fixes (4000 €)", () => {
    // Règle de cohérence : les défis V2 restent modestes pour ne pas
    // déstabiliser le bilan avant les vrais leviers pédagogiques.
    const SEUIL = 4000;
    for (const defi of CATALOGUE_V2) {
      for (const choix of defi.choix) {
        for (const e of choix.effetsImmediats) {
          expect(Math.abs(e.delta)).toBeLessThanOrEqual(SEUIL);
        }
        for (const diff of choix.effetsDiffere ?? []) {
          for (const e of diff.effets) {
            expect(Math.abs(e.delta)).toBeLessThanOrEqual(SEUIL);
          }
        }
      }
    }
  });
});
