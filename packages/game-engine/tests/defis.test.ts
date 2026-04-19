// ============================================================
// JEDEVIENSPATRON — Tests du module defis (orchestration)
// ============================================================
// Vague 1 : pas de catalogue réel. On teste la logique pure
// avec des défis fabriqués ad hoc.
// ============================================================

import {
  appliquerChoixDefi,
  formatContexte,
  piocherDefi,
  resoudreConsequencesDifferees,
} from "../src/defis";
import { initialiserJeu } from "../src/engine";
import {
  ArcDiffere,
  ChoixDefi,
  DefiDirigeant,
  DefiResolu,
  EtatJeu,
} from "../src/types";

// ─── HELPERS ─────────────────────────────────────────────────

function etatDeBase(): EtatJeu {
  return initialiserJeu([
    { pseudo: "Alice", nomEntreprise: "Manufacture Belvaux" },
  ]);
}

function defiMinimal(overrides: Partial<DefiDirigeant> = {}): DefiDirigeant {
  const choixParDefaut: ChoixDefi[] = [
    {
      id: "a",
      libelle: "Option A",
      effetsImmediats: [{ poste: "tresorerie", delta: -1000 }],
      pedagogie: "Explication A",
    },
    {
      id: "b",
      libelle: "Option B",
      effetsImmediats: [{ poste: "tresorerie", delta: -500 }],
      effetsDiffere: [
        {
          dansNTrimestres: 2,
          effets: [{ poste: "ventes", delta: 2000 }],
          explication: "Retour différé de B",
        },
      ],
      pedagogie: "Explication B",
    },
  ];

  return {
    id: "defi-test",
    archetype: "choix_binaire",
    tonalite: "tresorerie",
    conceptCible: "tresorerie_vs_resultat",
    slot: "avant_decision",
    tourMin: 3,
    contexte: "Un défi standard.",
    choix: choixParDefaut,
    obligatoire: false,
    ...overrides,
  };
}

// ─── 1. piocherDefi ──────────────────────────────────────────

describe("piocherDefi — sélection éligible et déterminisme", () => {
  test("Retourne null si aucun défi éligible dans le catalogue", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const choisi = piocherDefi(etat, etat.joueurs[0], "avant_decision", []);
    expect(choisi).toBeNull();
  });

  test("Retourne null si le slot ne matche pas", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const catalogue = [defiMinimal({ slot: "avant_bilan" })];
    const choisi = piocherDefi(etat, etat.joueurs[0], "avant_decision", catalogue);
    expect(choisi).toBeNull();
  });

  test("Respecte tourMin : pas de défi si tour trop précoce", () => {
    const etat = etatDeBase();
    etat.tourActuel = 2;
    const catalogue = [defiMinimal({ tourMin: 3 })];
    const choisi = piocherDefi(etat, etat.joueurs[0], "avant_decision", catalogue);
    expect(choisi).toBeNull();
  });

  test("Respecte tourMax : pas de défi après la fenêtre", () => {
    const etat = etatDeBase();
    etat.tourActuel = 6;
    const catalogue = [defiMinimal({ tourMin: 3, tourMax: 5 })];
    const choisi = piocherDefi(etat, etat.joueurs[0], "avant_decision", catalogue);
    expect(choisi).toBeNull();
  });

  test("Respecte entrepriseExclusive", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const catalogue = [defiMinimal({ entrepriseExclusive: "Synergia Lab" })];
    const choisi = piocherDefi(etat, etat.joueurs[0], "avant_decision", catalogue);
    expect(choisi).toBeNull();
  });

  test("Respecte une condition personnalisée", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const defi = defiMinimal({
      condition: (_etat, joueur) => joueur.pseudo === "Bob",
    });
    const choisi = piocherDefi(etat, etat.joueurs[0], "avant_decision", [defi]);
    expect(choisi).toBeNull();
  });

  test("Priorise les défis obligatoires lorsqu'ils coexistent", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const optionnel = defiMinimal({ id: "opt" });
    const cloture = defiMinimal({ id: "cloture", obligatoire: true });
    const rng = () => 0; // Déterministe : prend le premier du pool.
    const choisi = piocherDefi(
      etat,
      etat.joueurs[0],
      "avant_decision",
      [optionnel, cloture],
      rng
    );
    expect(choisi?.id).toBe("cloture");
  });

  test("Ne re-pioche pas un défi déjà résolu pour le même joueur", () => {
    const etat = etatDeBase();
    etat.tourActuel = 4;
    const defi = defiMinimal({ id: "deja-vu" });
    const dejaResolu: DefiResolu = {
      id: "defi-deja-vu-T3-J0",
      defiId: "deja-vu",
      joueurId: 0,
      trimestre: 3,
      slot: "avant_decision",
      choixId: "a",
      conceptCible: "tresorerie_vs_resultat",
    };
    etat.defisResolus = [dejaResolu];
    const choisi = piocherDefi(etat, etat.joueurs[0], "avant_decision", [defi]);
    expect(choisi).toBeNull();
  });

  test("Sélection déterministe avec un rng fourni", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const d1 = defiMinimal({ id: "d1" });
    const d2 = defiMinimal({ id: "d2" });
    const d3 = defiMinimal({ id: "d3" });
    // rng renvoie 0.99 : on doit tomber sur le dernier du pool.
    const choisi = piocherDefi(
      etat,
      etat.joueurs[0],
      "avant_decision",
      [d1, d2, d3],
      () => 0.99
    );
    expect(choisi?.id).toBe("d3");
  });

  test("Garde-fou : rng() = 1 ne provoque pas d'index hors bornes", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const catalogue = [defiMinimal({ id: "seul" })];
    const choisi = piocherDefi(
      etat,
      etat.joueurs[0],
      "avant_decision",
      catalogue,
      () => 1
    );
    expect(choisi?.id).toBe("seul");
  });
});

// ─── 2. appliquerChoixDefi ───────────────────────────────────

describe("appliquerChoixDefi — pureté et structure du résultat", () => {
  test("Retourne les effets immédiats du choix", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const defi = defiMinimal();
    const choix = defi.choix[0]; // option A
    const resultat = appliquerChoixDefi(defi, choix, etat, etat.joueurs[0]);
    expect(resultat.effetsImmediats).toEqual([{ poste: "tresorerie", delta: -1000 }]);
  });

  test("Ne mute pas l'état ni le joueur passés en entrée", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const defisActifsAvant = [...(etat.defisActifs ?? [])];
    const defisResolusAvant = [...(etat.defisResolus ?? [])];
    const defi = defiMinimal();
    appliquerChoixDefi(defi, defi.choix[0], etat, etat.joueurs[0]);
    expect(etat.defisActifs ?? []).toEqual(defisActifsAvant);
    expect(etat.defisResolus ?? []).toEqual(defisResolusAvant);
  });

  test("Construit un ArcDiffere lorsqu'il y a des effets différés", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const defi = defiMinimal();
    const resultat = appliquerChoixDefi(defi, defi.choix[1], etat, etat.joueurs[0]);
    expect(resultat.arcDiffereACreer).not.toBeNull();
    const arc = resultat.arcDiffereACreer as ArcDiffere;
    expect(arc.defiId).toBe("defi-test");
    expect(arc.joueurId).toBe(0);
    expect(arc.trimestreDeclenchement).toBe(3);
    expect(arc.choixId).toBe("b");
    expect(arc.effetsRestants).toHaveLength(1);
    // Effet dansNTrimestres=2 + tourActuel=3 → application au trim 5.
    expect(arc.effetsRestants[0].trimestreApplication).toBe(5);
  });

  test("Pas d'ArcDiffere si le choix n'a pas d'effetsDiffere", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const defi = defiMinimal();
    const resultat = appliquerChoixDefi(defi, defi.choix[0], etat, etat.joueurs[0]);
    expect(resultat.arcDiffereACreer).toBeNull();
  });

  test("Produit une trace DefiResolu cohérente", () => {
    const etat = etatDeBase();
    etat.tourActuel = 5;
    const defi = defiMinimal();
    const resultat = appliquerChoixDefi(defi, defi.choix[0], etat, etat.joueurs[0]);
    expect(resultat.trace.defiId).toBe("defi-test");
    expect(resultat.trace.joueurId).toBe(0);
    expect(resultat.trace.trimestre).toBe(5);
    expect(resultat.trace.slot).toBe("avant_decision");
    expect(resultat.trace.choixId).toBe("a");
    expect(resultat.trace.conceptCible).toBe("tresorerie_vs_resultat");
  });

  test("Lève une erreur si le choix n'appartient pas au défi", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const defi = defiMinimal();
    const faux: ChoixDefi = {
      id: "x",
      libelle: "fausse option",
      effetsImmediats: [],
      pedagogie: "",
    };
    expect(() => appliquerChoixDefi(defi, faux, etat, etat.joueurs[0])).toThrow();
  });

  test("Transmet la pédagogie du choix", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const defi = defiMinimal();
    const resultat = appliquerChoixDefi(defi, defi.choix[0], etat, etat.joueurs[0]);
    expect(resultat.pedagogie).toBe("Explication A");
  });
});

// ─── 3. resoudreConsequencesDifferees ────────────────────────

describe("resoudreConsequencesDifferees — échéancement multi-trimestres", () => {
  test("État sans défis actifs : rien à appliquer", () => {
    const etat = etatDeBase();
    const res = resoudreConsequencesDifferees(etat);
    expect(res.effetsAppliquer).toEqual([]);
    expect(res.defisActifsRestants).toEqual([]);
  });

  test("Applique uniquement les effets dont l'échéance est atteinte", () => {
    const etat = etatDeBase();
    etat.tourActuel = 5;
    etat.defisActifs = [
      {
        id: "arc-1",
        defiId: "d",
        joueurId: 0,
        trimestreDeclenchement: 3,
        choixId: "b",
        effetsRestants: [
          {
            trimestreApplication: 5,
            effets: [{ poste: "ventes", delta: 2000 }],
            explication: "Échéance ce tour",
          },
          {
            trimestreApplication: 7,
            effets: [{ poste: "ventes", delta: 1000 }],
            explication: "Échéance future",
          },
        ],
      },
    ];
    const res = resoudreConsequencesDifferees(etat);
    expect(res.effetsAppliquer).toHaveLength(1);
    expect(res.effetsAppliquer[0].joueurId).toBe(0);
    expect(res.effetsAppliquer[0].effets[0].delta).toBe(2000);
    expect(res.defisActifsRestants).toHaveLength(1);
    expect(res.defisActifsRestants[0].effetsRestants).toHaveLength(1);
    expect(res.defisActifsRestants[0].effetsRestants[0].trimestreApplication).toBe(7);
  });

  test("Retire l'arc entier quand toutes ses échéances sont consommées", () => {
    const etat = etatDeBase();
    etat.tourActuel = 6;
    etat.defisActifs = [
      {
        id: "arc-fini",
        defiId: "d",
        joueurId: 0,
        trimestreDeclenchement: 3,
        choixId: "a",
        effetsRestants: [
          {
            trimestreApplication: 4,
            effets: [{ poste: "ventes", delta: 500 }],
            explication: "passé 1",
          },
          {
            trimestreApplication: 5,
            effets: [{ poste: "ventes", delta: 500 }],
            explication: "passé 2",
          },
        ],
      },
    ];
    const res = resoudreConsequencesDifferees(etat);
    expect(res.effetsAppliquer).toHaveLength(2);
    expect(res.defisActifsRestants).toEqual([]);
  });

  test("Ne mute pas l'état d'entrée", () => {
    const etat = etatDeBase();
    etat.tourActuel = 5;
    const arc: ArcDiffere = {
      id: "arc-immutable",
      defiId: "d",
      joueurId: 0,
      trimestreDeclenchement: 3,
      choixId: "a",
      effetsRestants: [
        {
          trimestreApplication: 5,
          effets: [{ poste: "ventes", delta: 1000 }],
          explication: "test",
        },
      ],
    };
    etat.defisActifs = [arc];
    const snapshot = JSON.stringify(etat.defisActifs);
    resoudreConsequencesDifferees(etat);
    expect(JSON.stringify(etat.defisActifs)).toBe(snapshot);
  });
});

// ─── 4. formatContexte ───────────────────────────────────────

describe("formatContexte — substitution de tokens narratifs", () => {
  test("Remplace {pseudo} par le pseudo du joueur", () => {
    const etat = etatDeBase();
    const res = formatContexte("Bonjour {pseudo}", etat, etat.joueurs[0]);
    expect(res).toBe("Bonjour Alice");
  });

  test("Remplace {entreprise} par le nom de l'entreprise", () => {
    const etat = etatDeBase();
    const res = formatContexte("Dans {entreprise}", etat, etat.joueurs[0]);
    expect(res).toBe("Dans Manufacture Belvaux");
  });

  test("Remplace {tour} par le numéro de trimestre", () => {
    const etat = etatDeBase();
    etat.tourActuel = 4;
    const res = formatContexte("T{tour}", etat, etat.joueurs[0]);
    expect(res).toBe("T4");
  });

  test("Dérive la saison à partir du trimestre", () => {
    const etat = etatDeBase();
    etat.tourActuel = 1;
    expect(formatContexte("{saison}", etat, etat.joueurs[0])).toBe("Printemps");
    etat.tourActuel = 2;
    expect(formatContexte("{saison}", etat, etat.joueurs[0])).toBe("Été");
    etat.tourActuel = 3;
    expect(formatContexte("{saison}", etat, etat.joueurs[0])).toBe("Automne");
    etat.tourActuel = 4;
    expect(formatContexte("{saison}", etat, etat.joueurs[0])).toBe("Hiver");
    etat.tourActuel = 5;
    expect(formatContexte("{saison}", etat, etat.joueurs[0])).toBe("Printemps");
  });

  test("Replace {tresorerie} avec un montant formaté en euros", () => {
    const etat = etatDeBase();
    const res = formatContexte("{tresorerie}", etat, etat.joueurs[0]);
    // Tâche 25 : Manufacture Belvaux démarre avec 10 000 € de trésorerie, découvert 0.
    expect(res).toContain("10");
    expect(res).toContain("€");
  });

  test("Gère plusieurs tokens dans la même chaîne", () => {
    const etat = etatDeBase();
    etat.tourActuel = 3;
    const res = formatContexte(
      "{pseudo} dirige {entreprise} au T{tour}.",
      etat,
      etat.joueurs[0]
    );
    expect(res).toBe("Alice dirige Manufacture Belvaux au T3.");
  });

  test("Utilise 'dirigeant' comme fallback si pseudo vide", () => {
    const etat = etatDeBase();
    etat.joueurs[0].pseudo = "";
    const res = formatContexte("Bonjour {pseudo}", etat, etat.joueurs[0]);
    expect(res).toBe("Bonjour dirigeant");
  });

  test("Laisse les tokens inconnus tels quels", () => {
    const etat = etatDeBase();
    const res = formatContexte("Inconnu: {xxx}", etat, etat.joueurs[0]);
    expect(res).toBe("Inconnu: {xxx}");
  });
});
