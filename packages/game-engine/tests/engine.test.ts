// ============================================================
// JEDEVIENSPATRON — Tests unitaires du moteur de jeu
// ============================================================

import {
  creerJoueur,
  initialiserJeu,
  appliquerEtape0,
  appliquerCarteClient,
  appliquerPaiementCommerciaux,
  appliquerAvancementCreances,
  verifierFinTour,
  calculerCoutCommerciaux,
  genererClientsParCommerciaux,
} from "../src/engine";
import {
  verifierEquilibre,
  getResultatNet,
  calculerIndicateurs,
  getTresorerie,
  getTotalImmobilisations,
  verifierFaillite,
  calculerScore,
} from "../src/calculators";
import { CARTES_CLIENTS } from "../src/data/cartes";

// ─── HELPERS ─────────────────────────────────────────────────

function joueurOrange() {
  return creerJoueur(0, "Test", "Entreprise Orange");
}

// ─── 1. CRÉATION JOUEUR ──────────────────────────────────────

describe("Création joueur", () => {
  test("Le bilan initial est équilibré (Actif = Passif = 16)", () => {
    const joueur = joueurOrange();
    const { equilibre, totalActif, totalPassif } = verifierEquilibre(joueur);
    // Actif initial : Usine(3) + Camionnette(1) + Stocks(4) + Tréso(8) = 16
    // Passif initial : Capitaux(12) + Emprunts(4) = 16
    // Résultat = 0 → Actif(16) = Passif(16) + Résultat(0) ✓
    expect(totalActif).toBe(16);
    expect(equilibre).toBe(true);
  });

  test("Le compte de résultat démarre à zéro", () => {
    const joueur = joueurOrange();
    expect(getResultatNet(joueur)).toBe(0);
  });

  test("Le joueur reçoit 1 Commercial Junior d'office", () => {
    const joueur = joueurOrange();
    expect(joueur.cartesActives.length).toBe(1);
    expect(joueur.cartesActives[0].id).toBe("commercial-junior-dec");
  });

  test("Chaque entreprise a son bilan propre", () => {
    const orange = creerJoueur(0, "A", "Entreprise Orange");
    const verte = creerJoueur(1, "B", "Entreprise Verte");
    // Orange a une Usine, Verte a un Brevet — différentes immobilisations
    expect(orange.bilan.actifs[0].nom).not.toBe(verte.bilan.actifs[0].nom);
    // Mais les deux ont Actif total = 16
    expect(verifierEquilibre(orange).totalActif).toBe(16);
    expect(verifierEquilibre(verte).totalActif).toBe(16);
  });
});

// ─── 2. ÉTAPE 0 : CHARGES FIXES + AMORTISSEMENTS ─────────────

describe("Étape 0 — Charges fixes et amortissements", () => {
  test("Les charges fixes sont de +2 Services ext. et -2 Trésorerie", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    const tresoBefore = getTresorerie(joueur);

    appliquerEtape0(etat, 0);

    const tresoAfter = getTresorerie(joueur);
    expect(joueur.compteResultat.charges.servicesExterieurs).toBe(2);
    expect(tresoAfter).toBe(tresoBefore - 2 - 1); // -2 charges fixes - 1 remboursement emprunt
  });

  test("L'amortissement réduit les immobilisations de 1", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    const immoBefore = getTotalImmobilisations(joueur); // 4 (Usine 3 + Camionnette 1)

    appliquerEtape0(etat, 0);

    const immoAfter = getTotalImmobilisations(joueur);
    expect(immoAfter).toBe(immoBefore - 1);
    expect(joueur.compteResultat.charges.dotationsAmortissements).toBe(1);
  });

  test("Le remboursement d'emprunt réduit les emprunts de 1", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    const empruntsBefore = joueur.bilan.passifs.find((p) => p.categorie === "emprunts")!.valeur;

    appliquerEtape0(etat, 0);

    const empruntsAfter = joueur.bilan.passifs.find((p) => p.categorie === "emprunts")!.valeur;
    expect(empruntsAfter).toBe(empruntsBefore - 1);
  });
});

// ─── 3. VENTE CLIENT PARTICULIER (partie double complète) ────

describe("Vente — Client Particulier (paiement immédiat)", () => {
  test("4 écritures correctes : Ventes+1, Stocks-1, CMV+1, Tréso+1", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    const client = CARTES_CLIENTS.find((c) => c.id === "client-particulier")!;

    const tresoBefore = getTresorerie(joueur);
    const stocksBefore = joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur;

    const resultat = appliquerCarteClient(etat, 0, client);

    expect(resultat.succes).toBe(true);
    expect(joueur.compteResultat.produits.ventes).toBe(1);
    expect(joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur).toBe(stocksBefore - 1);
    expect(joueur.compteResultat.charges.achats).toBe(1); // CMV
    expect(getTresorerie(joueur)).toBe(tresoBefore + 1);
  });
});

// ─── 4. VENTE CLIENT TPE (créance C+1) ───────────────────────

describe("Vente — Client TPE (paiement différé C+1)", () => {
  test("4 écritures correctes : Ventes+2, Stocks-1, CMV+1, Créances C+1 +2", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    const client = CARTES_CLIENTS.find((c) => c.id === "client-tpe")!;

    appliquerCarteClient(etat, 0, client);

    expect(joueur.compteResultat.produits.ventes).toBe(2);
    expect(joueur.bilan.creancesPlus1).toBe(2);
    expect(joueur.compteResultat.charges.achats).toBe(1);
    // La trésorerie NE change PAS (paiement différé)
  });
});

// ─── 5. VENTE CLIENT GRAND COMPTE (créance C+2) ──────────────

describe("Vente — Client Grand Compte (paiement différé C+2)", () => {
  test("4 écritures : Ventes+3, Stocks-1, CMV+1, Créances C+2 +3", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    const client = CARTES_CLIENTS.find((c) => c.id === "client-grand-compte")!;

    appliquerCarteClient(etat, 0, client);

    expect(joueur.compteResultat.produits.ventes).toBe(3);
    expect(joueur.bilan.creancesPlus2).toBe(3);
    expect(joueur.compteResultat.charges.achats).toBe(1);
  });
});

// ─── 6. AVANCEMENT CRÉANCES ───────────────────────────────────

describe("Avancement des créances", () => {
  test("C+1 → Trésorerie au tour suivant", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    joueur.bilan.creancesPlus1 = 5;

    const tresoBefore = getTresorerie(joueur);
    appliquerAvancementCreances(etat, 0);

    expect(getTresorerie(joueur)).toBe(tresoBefore + 5);
    expect(joueur.bilan.creancesPlus1).toBe(0);
  });

  test("C+2 → C+1 au tour suivant", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    joueur.bilan.creancesPlus2 = 3;
    joueur.bilan.creancesPlus1 = 0;

    appliquerAvancementCreances(etat, 0);

    expect(joueur.bilan.creancesPlus1).toBe(3);
    expect(joueur.bilan.creancesPlus2).toBe(0);
  });
});

// ─── 7. PAIEMENT COMMERCIAUX ─────────────────────────────────

describe("Paiement des commerciaux", () => {
  test("Commercial Junior coûte 1 en charges personnel et 1 en trésorerie", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    const cout = calculerCoutCommerciaux(joueur);
    expect(cout).toBe(1); // 1 Junior

    const tresoBefore = getTresorerie(joueur);
    appliquerPaiementCommerciaux(etat, 0);
    expect(joueur.compteResultat.charges.chargesPersonnel).toBe(1);
    expect(getTresorerie(joueur)).toBe(tresoBefore - 1);
  });
});

// ─── 8. GÉNÉRATION CLIENTS PAR COMMERCIAUX ───────────────────

describe("Génération clients par commerciaux", () => {
  test("Un Commercial Junior génère 1 Client Particulier par tour", () => {
    const joueur = joueurOrange();
    const clients = genererClientsParCommerciaux(joueur);
    expect(clients.length).toBe(1);
    expect(clients[0].id).toBe("client-particulier");
  });
});

// ─── 9. VÉRIFICATION FAILLITE ────────────────────────────────

describe("Vérification faillite", () => {
  test("Découvert > DECOUVERT_MAX seul ne cause pas la faillite", () => {
    const joueur = joueurOrange();
    joueur.bilan.decouvert = 9;
    const { enFaillite } = verifierFaillite(joueur);
    expect(enFaillite).toBe(false);
  });

  test("Découvert = 8 → pas de faillite", () => {
    const joueur = joueurOrange();
    joueur.bilan.decouvert = 8;
    const { enFaillite } = verifierFaillite(joueur);
    expect(enFaillite).toBe(false);
  });

  test("Capitaux propres négatifs → faillite", () => {
    const joueur = joueurOrange();
    const capitaux = joueur.bilan.passifs.find((p) => p.categorie === "capitaux")!;
    capitaux.valeur = -1;
    const { enFaillite } = verifierFaillite(joueur);
    expect(enFaillite).toBe(true);
  });
});

// ─── 10. INDICATEURS FINANCIERS ──────────────────────────────

describe("Indicateurs financiers", () => {
  test("Taux de solvabilité > 0 sur bilan équilibré initial", () => {
    const joueur = joueurOrange();
    const { ratioSolvabilite } = calculerIndicateurs(joueur);
    expect(ratioSolvabilite).toBeGreaterThan(0);
  });

  test("Résultat net = 0 en début de partie", () => {
    const joueur = joueurOrange();
    expect(getResultatNet(joueur)).toBe(0);
  });
});

// ─── 11. SCORE ───────────────────────────────────────────────

describe("Score final", () => {
  test("Le score dépend du résultat net, des immobilisations et de la trésorerie", () => {
    const joueur = joueurOrange();
    // Score de départ : Résultat(0×3) + Immo(4×2) + Tréso(8) + Solvabilité(%)
    const score = calculerScore(joueur);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test("Une vente améliore le score", () => {
    const scoreBefore = calculerScore(joueurOrange());

    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Entreprise Orange" }]);
    const joueur = etat.joueurs[0];
    const client = CARTES_CLIENTS.find((c) => c.id === "client-particulier")!;
    appliquerCarteClient(etat, 0, client);

    const scoreAfter = calculerScore(joueur);
    expect(scoreAfter).toBeGreaterThan(scoreBefore);
  });
});

// ─── 12. INITIALISATION MULTIJOUEUR ──────────────────────────

describe("Initialisation multijoueur", () => {
  test("2 joueurs avec entreprises différentes", () => {
    const etat = initialiserJeu([
      { pseudo: "Alice", nomEntreprise: "Entreprise Orange" },
      { pseudo: "Bob", nomEntreprise: "Entreprise Bleue" },
    ]);
    expect(etat.joueurs.length).toBe(2);
    expect(etat.joueurs[0].entreprise.nom).toBe("Entreprise Orange");
    expect(etat.joueurs[1].entreprise.nom).toBe("Entreprise Bleue");
    expect(etat.tourActuel).toBe(1);
    expect(etat.etapeTour).toBe(0);
  });
});
