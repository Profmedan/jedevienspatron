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
  investirCartePersonnelle,
  calculerCapaciteLogistique,
  vendreImmobilisation,
  // B8-D : helpers B8 pour les tests par mode + flux passifs
  getModeleValeurEntreprise,
  genererClientsDepuisFlux,
  genererClientsSpecialite,
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

// "joueurOrange" = Manufacture Belvaux (couleur orange, entreprise de Production)
function joueurOrange() {
  return creerJoueur(0, "Test", "Manufacture Belvaux");
}

// ─── 1. CRÉATION JOUEUR ──────────────────────────────────────

describe("Création joueur", () => {
  test("Le bilan initial est équilibré (Actif = Passif)", () => {
    const joueur = joueurOrange();
    const { equilibre, totalActif } = verifierEquilibre(joueur);
    // Tâche 25 : trésorerie +2 000 € (8 000 → 10 000) → total 30 000 €
    // Belvaux : Entrepôt(8000) + Machine de production(8000) + Stocks(4000) + Tréso(10000) = 30000
    // (Camionnette renommée en "Machine de production" en B8-C)
    expect(totalActif).toBe(30000);
    expect(equilibre).toBe(true);
  });

  test("Le compte de résultat démarre à zéro", () => {
    const joueur = joueurOrange();
    expect(getResultatNet(joueur)).toBe(0);
  });

  test("Le joueur reçoit 1 Commercial Junior d'office", () => {
    const joueur = joueurOrange();
    // Belvaux n'a pas de cartesLogistiquesDepart → seulement le Junior
    expect(joueur.cartesActives.length).toBe(1);
    expect(joueur.cartesActives[0].id).toMatch(/commercial-junior-dec/);
  });

  test("Chaque entreprise a son bilan propre", () => {
    const belvaux = creerJoueur(0, "A", "Manufacture Belvaux");
    const synergia = creerJoueur(1, "B", "Synergia Lab");
    // Belvaux a un Entrepôt, Synergia a un Brevet — différentes immobilisations
    expect(belvaux.bilan.actifs[0].nom).not.toBe(synergia.bilan.actifs[0].nom);
    // Les deux ont un bilan équilibré
    expect(verifierEquilibre(belvaux).equilibre).toBe(true);
    expect(verifierEquilibre(synergia).equilibre).toBe(true);
  });
});

// ─── 2. ÉTAPE 0 : CHARGES FIXES + AMORTISSEMENTS ─────────────

describe("Étape 0 — Charges fixes et amortissements", () => {
  test("Les charges fixes sont de +2000 Services ext. et -2000 Trésorerie", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    const tresoBefore = getTresorerie(joueur);

    appliquerEtape0(etat, 0);

    const tresoAfter = getTresorerie(joueur);
    expect(joueur.compteResultat.charges.servicesExterieurs).toBe(2000);
    // Tâche 25 : plus d'intérêts à T1 (décalés à T3).
    // T1 = -2 000 charges fixes -500 remboursement emprunt = -2 500 €
    expect(tresoAfter).toBe(tresoBefore - 2000 - 500);
  });

  test("L'amortissement réduit les immobilisations", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    const immoBefore = getTotalImmobilisations(joueur); // 8000+8000 = 16000

    appliquerEtape0(etat, 0);

    // Belvaux : 2 biens amortissables → dotation = 2000
    const immoAfter = getTotalImmobilisations(joueur);
    expect(immoAfter).toBe(immoBefore - 2000);
    expect(joueur.compteResultat.charges.dotationsAmortissements).toBe(2000);
  });

  test("Le remboursement d'emprunt réduit les emprunts de 500", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    const empruntsBefore = joueur.bilan.passifs.find((p) => p.categorie === "emprunts")!.valeur;

    appliquerEtape0(etat, 0);

    const empruntsAfter = joueur.bilan.passifs.find((p) => p.categorie === "emprunts")!.valeur;
    expect(empruntsAfter).toBe(empruntsBefore - 500);
  });
});

// ─── 3. VENTE CLIENT PARTICULIER (partie double complète) ────

describe("Vente — Client Particulier (paiement immédiat)", () => {
  test("4 écritures correctes : Ventes+2000, Stocks−1000, CMV+1000, Tréso+2000", () => {
    // B8-D : passé de "Manufacture Belvaux" (production) → "Azura Commerce"
    // (négoce) pour préserver le sens comptable du test (CMV via `achats`).
    // En production, la contrepartie est `productionStockée −`, pas `achats +`.
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Azura Commerce" }]);
    const joueur = etat.joueurs[0];
    const client = CARTES_CLIENTS.find((c) => c.id === "client-particulier")!;

    const tresoBefore = getTresorerie(joueur);
    const stocksBefore = joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur;

    const resultat = appliquerCarteClient(etat, 0, client);

    expect(resultat.succes).toBe(true);
    expect(joueur.compteResultat.produits.ventes).toBe(2000); // montantVentes = 2000€
    expect(joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur).toBe(stocksBefore - 1000);
    expect(joueur.compteResultat.charges.achats).toBe(1000); // CMV = 1 unité × 1000 €
    expect(getTresorerie(joueur)).toBe(tresoBefore + 2000); // encaissement immédiat
  });
});

// ─── 4. VENTE CLIENT TPE (créance C+1) ───────────────────────

describe("Vente — Client TPE (paiement différé C+1)", () => {
  test("4 écritures correctes : Ventes+3000, Stocks−1000, CMV+1000, Créances C+1 +3000", () => {
    // B8-D : Azura (négoce) pour tester explicitement la branche CMV via `achats`.
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Azura Commerce" }]);
    const joueur = etat.joueurs[0];
    const client = CARTES_CLIENTS.find((c) => c.id === "client-tpe")!;

    appliquerCarteClient(etat, 0, client);

    expect(joueur.compteResultat.produits.ventes).toBe(3000); // montantVentes = 3000€
    expect(joueur.bilan.creancesPlus1).toBe(3000); // créance C+1 = 3000€
    expect(joueur.compteResultat.charges.achats).toBe(1000); // CMV = 1 unité × 1000 €
    // La trésorerie NE change PAS (paiement différé)
  });
});

// ─── 5. VENTE CLIENT GRAND COMPTE (créance C+2) ──────────────

describe("Vente — Client Grand Compte (paiement différé C+2)", () => {
  test("4 écritures : Ventes+4000, Stocks−1000, CMV+1000, Créances C+2 +4000", () => {
    // B8-D : Azura (négoce) pour tester explicitement la branche CMV via `achats`.
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Azura Commerce" }]);
    const joueur = etat.joueurs[0];
    const client = CARTES_CLIENTS.find((c) => c.id === "client-grand-compte")!;

    appliquerCarteClient(etat, 0, client);

    expect(joueur.compteResultat.produits.ventes).toBe(4000); // montantVentes = 4000€
    expect(joueur.bilan.creancesPlus2).toBe(4000); // créance C+2 = 4000€
    expect(joueur.compteResultat.charges.achats).toBe(1000); // CMV = 1 unité × 1000 €
  });
});

// ─── 6. AVANCEMENT CRÉANCES ───────────────────────────────────

describe("Avancement des créances", () => {
  test("C+1 → Trésorerie au tour suivant", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    joueur.bilan.creancesPlus1 = 5;

    const tresoBefore = getTresorerie(joueur);
    appliquerAvancementCreances(etat, 0);

    expect(getTresorerie(joueur)).toBe(tresoBefore + 5);
    expect(joueur.bilan.creancesPlus1).toBe(0);
  });

  test("C+2 → C+1 au tour suivant", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
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
  test("calculerCoutCommerciaux = 1000 pour un joueur avec le Commercial Junior par défaut", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    // B8-D : `creerJoueur` embauche par défaut un Commercial Junior (cf. engine.ts ligne 288).
    // `calculerCoutCommerciaux` additionne les `effetsImmédiats.chargesPersonnel` de
    // chaque carte commerciale active — Junior = 1 000 € / trim.
    const cout = calculerCoutCommerciaux(joueur);
    expect(cout).toBe(1000);
  });

  test("calculerCoutCommerciaux = 0 si aucun commercial actif", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    // Retirer tous les commerciaux actifs → coût 0
    joueur.cartesActives = joueur.cartesActives.filter((c) => c.categorie !== "commercial");
    expect(calculerCoutCommerciaux(joueur)).toBe(0);
  });
});

// ─── 8. GÉNÉRATION CLIENTS PAR COMMERCIAUX ───────────────────

describe("Génération clients par commerciaux", () => {
  test("Un Commercial Junior génère 2 Clients Particuliers par tour (nbClientsParTour = 2)", () => {
    // B8-D : `creerJoueur` embauche un Junior par défaut (cf. engine.ts ligne 288) ;
    // la carte `commercial-junior-dec` a `nbClientsParTour: 2` (cf. data/cartes.ts).
    const joueur = joueurOrange();
    const clients = genererClientsParCommerciaux(joueur);
    expect(clients).toHaveLength(2);
    expect(clients.every((c) => c.id === "client-particulier")).toBe(true);
  });

  test("Sans commercial actif, aucun client n'est généré", () => {
    const joueur = joueurOrange();
    joueur.cartesActives = joueur.cartesActives.filter((c) => c.categorie !== "commercial");
    expect(genererClientsParCommerciaux(joueur)).toHaveLength(0);
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

    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
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
      { pseudo: "Alice", nomEntreprise: "Manufacture Belvaux" },
      { pseudo: "Bob", nomEntreprise: "Azura Commerce" },
    ]);
    expect(etat.joueurs.length).toBe(2);
    expect(etat.joueurs[0].entreprise.nom).toBe("Manufacture Belvaux");
    expect(etat.joueurs[1].entreprise.nom).toBe("Azura Commerce");
    expect(etat.tourActuel).toBe(1);
    expect(etat.etapeTour).toBe(0);
  });
});

// ─── MINI-DECK LOGISTIQUE ─────────────────────────────────────

describe("piochePersonnelle — initialisation", () => {
  test("Manufacture Belvaux démarre avec 3 cartes dans piochePersonnelle", () => {
    const joueur = creerJoueur(0, "Test", "Manufacture Belvaux");
    expect(joueur.piochePersonnelle).toHaveLength(3);
    expect(joueur.piochePersonnelle.map((c) => c.id)).toContain("belvaux-robot-n1");
  });

  test("Azura Commerce démarre avec 2 cartes dans piochePersonnelle (N1 est dans cartesActives)", () => {
    const joueur = creerJoueur(0, "Test", "Azura Commerce");
    expect(joueur.piochePersonnelle).toHaveLength(2);
    expect(joueur.cartesActives.some((c) => c.id === "azura-marketplace-n1")).toBe(true);
  });

  test("Azura Commerce démarre à capacité 8 grâce à marketplace N1", () => {
    const joueur = creerJoueur(0, "Test", "Azura Commerce");
    expect(calculerCapaciteLogistique(joueur)).toBe(8);
  });

  test("Synergia Lab démarre à capacité 8 grâce à ERP N1", () => {
    const joueur = creerJoueur(0, "Test", "Synergia Lab");
    expect(calculerCapaciteLogistique(joueur)).toBe(8);
  });

  test("Manufacture Belvaux démarre à capacité 4 (base — pas de cartes logistiques initiales)", () => {
    const joueur = creerJoueur(0, "Test", "Manufacture Belvaux");
    expect(calculerCapaciteLogistique(joueur)).toBe(4); // CAPACITE_BASE uniquement, cartesLogistiquesDepart: []
  });
});

describe("investirCartePersonnelle — prérequis", () => {
  test("Investir dans N1 réussit et retire la carte de piochePersonnelle", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = investirCartePersonnelle(etat, 0, "belvaux-robot-n1");
    expect(result.succes).toBe(true);
    expect(etat.joueurs[0].piochePersonnelle.find((c) => c.id === "belvaux-robot-n1")).toBeUndefined();
    expect(etat.joueurs[0].cartesActives.some((c) => c.id === "belvaux-robot-n1")).toBe(true);
  });

  test("Investir dans N2 sans N1 échoue avec message prérequis", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = investirCartePersonnelle(etat, 0, "belvaux-robot-n2");
    expect(result.succes).toBe(false);
    expect(result.messageErreur).toContain("Prérequis");
  });

  test("Investir dans N2 après N1 réussit et augmente la capacité", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    investirCartePersonnelle(etat, 0, "belvaux-robot-n1");
    const result = investirCartePersonnelle(etat, 0, "belvaux-robot-n2");
    expect(result.succes).toBe(true);
    expect(calculerCapaciteLogistique(etat.joueurs[0])).toBe(8); // 4 (base) + 2 (N1) + 2 (N2)
  });

  test("Carte introuvable dans piochePersonnelle retourne erreur", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = investirCartePersonnelle(etat, 0, "id-inexistant");
    expect(result.succes).toBe(false);
    expect(result.messageErreur).toContain("introuvable");
  });

  test("Investir dans N1 débite 5 000€ de trésorerie", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const tresoAvant = etat.joueurs[0].bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;
    investirCartePersonnelle(etat, 0, "belvaux-robot-n1");
    const tresoApres = etat.joueurs[0].bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;
    expect(tresoApres).toBe(tresoAvant - 5000);
  });
});

// ─── 11. VENTE D'IMMOBILISATION (CESSION D'OCCASION) ─────────

describe("vendreImmobilisation — cession d'occasion d'un bien immobilisé", () => {
  test("Plus-value : prix de cession > VNC → +revenusExceptionnels", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    // Belvaux : Machine de production VNC = 8 000 € (renommée en B8-C, ex-« Camionnette »)
    const result = vendreImmobilisation(etat, 0, "Machine de production", 10000);
    expect(result.succes).toBe(true);

    const joueur = etat.joueurs[0];
    // Tâche 25 : trésorerie initiale 10 000 € + cession 10 000 € = 20 000 €
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(20000);
    // Machine de production retirée du bilan
    expect(joueur.bilan.actifs.find((a) => a.nom === "Machine de production")).toBeUndefined();
    // Plus-value de 2 000 € en revenus exceptionnels
    expect(joueur.compteResultat.produits.revenusExceptionnels).toBe(2000);
    expect(joueur.compteResultat.charges.chargesExceptionnelles).toBe(0);
  });

  test("Moins-value : prix de cession < VNC → +chargesExceptionnelles", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    // Belvaux : Entrepôt VNC = 8 000 €
    const result = vendreImmobilisation(etat, 0, "Entrepôt", 5000);
    expect(result.succes).toBe(true);

    const joueur = etat.joueurs[0];
    // Tâche 25 : trésorerie initiale 10 000 € + cession 5 000 € = 15 000 €
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(15000);
    // Entrepôt retiré
    expect(joueur.bilan.actifs.find((a) => a.nom === "Entrepôt")).toBeUndefined();
    // Moins-value de 3 000 € en charges exceptionnelles
    expect(joueur.compteResultat.charges.chargesExceptionnelles).toBe(3000);
    expect(joueur.compteResultat.produits.revenusExceptionnels).toBe(0);
  });

  test("Cession à la VNC exacte : aucune plus ni moins-value", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = vendreImmobilisation(etat, 0, "Machine de production", 8000);
    expect(result.succes).toBe(true);

    const joueur = etat.joueurs[0];
    expect(joueur.compteResultat.produits.revenusExceptionnels).toBe(0);
    expect(joueur.compteResultat.charges.chargesExceptionnelles).toBe(0);
    expect(joueur.bilan.actifs.find((a) => a.nom === "Machine de production")).toBeUndefined();
  });

  test("Refuse la vente de \"Autres Immobilisations\" (poste agrégé)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = vendreImmobilisation(etat, 0, "Autres Immobilisations", 1000);
    expect(result.succes).toBe(false);
    expect(result.messageErreur).toContain("agrégé");
  });

  test("Refuse une immobilisation introuvable", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = vendreImmobilisation(etat, 0, "Yacht de luxe", 50000);
    expect(result.succes).toBe(false);
    expect(result.messageErreur).toContain("introuvable");
  });

  test("Refuse un prix de cession négatif", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = vendreImmobilisation(etat, 0, "Machine de production", -1000);
    expect(result.succes).toBe(false);
    expect(result.messageErreur).toContain("positif");
  });

  test("Vente d'un bien totalement amorti (VNC = 0) → tout est plus-value", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    // Forcer la VNC à zéro (simulation amortissement total)
    const machine = joueur.bilan.actifs.find((a) => a.nom === "Machine de production")!;
    machine.valeur = 0;
    const tresoAvant = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;

    const result = vendreImmobilisation(etat, 0, "Machine de production", 1500);
    expect(result.succes).toBe(true);
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(tresoAvant + 1500);
    expect(joueur.compteResultat.produits.revenusExceptionnels).toBe(1500);
    expect(joueur.bilan.actifs.find((a) => a.nom === "Machine de production")).toBeUndefined();
  });
});

// ─── 12. APPLIQUER CARTE CLIENT — COUVERTURE PAR MODE (B8-D) ─
// Vérifie que chaque mode (négoce / production / service) enregistre
// les écritures comptables attendues. Source : engine.ts — branches
// "ACTE 3 & 4 — Réalisation de la valeur selon le modèle".

describe("appliquerCarteClient — couverture par modèle de valeur", () => {
  const CLIENT_PARTICULIER = CARTES_CLIENTS.find((c) => c.id === "client-particulier")!;

  test("Négoce (Azura) : stocks − / achats + du coût variable", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Azura Commerce" }]);
    const joueur = etat.joueurs[0];
    const modele = getModeleValeurEntreprise(joueur.entreprise);
    expect(modele.mode).toBe("negoce");

    const stocksAvant = joueur.bilan.actifs.find((a) => a.nom === "Stocks")!.valeur;
    const achatsAvant = joueur.compteResultat.charges.achats;
    const productionStockeeAvant = joueur.compteResultat.produits.productionStockee;
    const servicesAvant = joueur.compteResultat.charges.servicesExterieurs;

    const result = appliquerCarteClient(etat, 0, CLIENT_PARTICULIER);
    expect(result.succes).toBe(true);

    // Acte 3 : stocks − coutVariable
    expect(joueur.bilan.actifs.find((a) => a.nom === "Stocks")!.valeur).toBe(stocksAvant - modele.coutVariable);
    // Acte 4 : achats (CMV) + coutVariable
    expect(joueur.compteResultat.charges.achats).toBe(achatsAvant + modele.coutVariable);
    // Les autres branches (production, service) ne sont PAS empruntées
    expect(joueur.compteResultat.produits.productionStockee).toBe(productionStockeeAvant);
    expect(joueur.compteResultat.charges.servicesExterieurs).toBe(servicesAvant);
  });

  test("Production (Belvaux) : stocks − / productionStockée − (Option A, PCG)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    const modele = getModeleValeurEntreprise(joueur.entreprise);
    expect(modele.mode).toBe("production");

    const stocksAvant = joueur.bilan.actifs.find((a) => a.nom === "Stocks")!.valeur;
    const productionStockeeAvant = joueur.compteResultat.produits.productionStockee;
    const achatsAvant = joueur.compteResultat.charges.achats;
    const servicesAvant = joueur.compteResultat.charges.servicesExterieurs;

    const result = appliquerCarteClient(etat, 0, CLIENT_PARTICULIER);
    expect(result.succes).toBe(true);

    // Acte 3 : stocks − coutVariable (déstockage du produit fini)
    expect(joueur.bilan.actifs.find((a) => a.nom === "Stocks")!.valeur).toBe(stocksAvant - modele.coutVariable);
    // Acte 4 : productionStockée − coutVariable (variation négative, produit signé)
    expect(joueur.compteResultat.produits.productionStockee).toBe(productionStockeeAvant - modele.coutVariable);
    // Les autres branches (négoce achats, service) ne sont PAS empruntées
    expect(joueur.compteResultat.charges.achats).toBe(achatsAvant);
    expect(joueur.compteResultat.charges.servicesExterieurs).toBe(servicesAvant);
  });

  test("Service (Synergia) : servicesExterieurs + / dettes + du coût variable", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Synergia Lab" }]);
    const joueur = etat.joueurs[0];
    const modele = getModeleValeurEntreprise(joueur.entreprise);
    expect(modele.mode).toBe("service");

    const servicesAvant = joueur.compteResultat.charges.servicesExterieurs;
    const dettesAvant = joueur.bilan.dettes;
    const stocksActif = joueur.bilan.actifs.find((a) => a.nom === "Stocks");
    const stocksAvant = stocksActif ? stocksActif.valeur : 0;
    const achatsAvant = joueur.compteResultat.charges.achats;
    const productionStockeeAvant = joueur.compteResultat.produits.productionStockee;

    const result = appliquerCarteClient(etat, 0, CLIENT_PARTICULIER);
    expect(result.succes).toBe(true);

    // Acte 3 : servicesExterieurs + coutVariable (sous-traitance, consommables, etc.)
    expect(joueur.compteResultat.charges.servicesExterieurs).toBe(servicesAvant + modele.coutVariable);
    // Acte 4 : dettes + coutVariable (facture fournisseur à régler)
    expect(joueur.bilan.dettes).toBe(dettesAvant + modele.coutVariable);
    // Les autres branches (stocks, achats, productionStockée) ne sont PAS empruntées
    const stocksActifApres = joueur.bilan.actifs.find((a) => a.nom === "Stocks");
    expect(stocksActifApres ? stocksActifApres.valeur : 0).toBe(stocksAvant);
    expect(joueur.compteResultat.charges.achats).toBe(achatsAvant);
    expect(joueur.compteResultat.produits.productionStockee).toBe(productionStockeeAvant);
  });

  test("Service (Synergia) : la marge brute n'est plus 100 % (régression bug B8)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Synergia Lab" }]);
    const joueur = etat.joueurs[0];
    const modele = getModeleValeurEntreprise(joueur.entreprise);

    const result = appliquerCarteClient(etat, 0, CLIENT_PARTICULIER);
    expect(result.succes).toBe(true);

    // Avant B8 : ventes +2000 / aucun coût → marge = 100 %.
    // Après B8 : ventes +2000 / servicesExterieurs +coutVariable → marge < 100 %.
    const ventes = joueur.compteResultat.produits.ventes;
    const cout = joueur.compteResultat.charges.servicesExterieurs;
    expect(ventes).toBeGreaterThan(0);
    expect(cout).toBe(modele.coutVariable);
    expect(cout).toBeGreaterThan(0);
    expect(cout / ventes).toBeLessThan(1);
  });
});

// ─── 13. FLUX CLIENTS PASSIFS (clientsPassifsParTour) — B8-D ──
// Vérifie que le nouveau mécanisme unifié `clientsPassifsParTour`
// est correctement câblé via `genererClientsDepuisFlux` et qu'il
// remplace proprement l'ancien flag `clientGratuitParTour` côté Azura.

describe("genererClientsDepuisFlux & clientsPassifsParTour", () => {
  test("genererClientsDepuisFlux retourne [] pour un flux undefined ou vide", () => {
    expect(genererClientsDepuisFlux(undefined)).toEqual([]);
    expect(genererClientsDepuisFlux([])).toEqual([]);
  });

  test("genererClientsDepuisFlux mappe chaque type vers la bonne carte CARTES_CLIENTS", () => {
    const clients = genererClientsDepuisFlux([
      { typeClient: "particulier", nbParTour: 2, source: "test" },
      { typeClient: "tpe", nbParTour: 1, source: "test" },
      { typeClient: "grand_compte", nbParTour: 1, source: "test" },
    ]);
    expect(clients).toHaveLength(4);
    expect(clients.filter((c) => c.id === "client-particulier")).toHaveLength(2);
    expect(clients.filter((c) => c.id === "client-tpe")).toHaveLength(1);
    expect(clients.filter((c) => c.id === "client-grand-compte")).toHaveLength(1);
  });

  test("Azura : 1 Particulier/tour via clientsPassifsParTour (migration propre de clientGratuitParTour)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Azura Commerce" }]);
    const clients = genererClientsSpecialite(etat.joueurs[0]);
    const particuliers = clients.filter((c) => c.id === "client-particulier");
    expect(particuliers).toHaveLength(1);
  });

  test("Véloce : 1 Particulier/tour via clientsPassifsParTour (livraisons courtes récurrentes)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Véloce Transports" }]);
    const clients = genererClientsSpecialite(etat.joueurs[0]);
    expect(clients.filter((c) => c.id === "client-particulier")).toHaveLength(1);
  });

  test("Synergia : 1 Particulier/tour via clientsPassifsParTour (abonnements individuels)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Synergia Lab" }]);
    const clients = genererClientsSpecialite(etat.joueurs[0]);
    expect(clients.filter((c) => c.id === "client-particulier")).toHaveLength(1);
  });

  test("Belvaux : aucun flux passif (la production ne capte pas de demande sans action)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const clients = genererClientsSpecialite(etat.joueurs[0]);
    expect(clients).toHaveLength(0);
  });
});
