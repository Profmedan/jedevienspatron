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
    // Belvaux : Entrepôt(8000) + Camionnette(8000) + Stocks(4000) + Tréso(10000) = 30000
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
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
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
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
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
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
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
  test("calculerCoutCommerciaux = 0 pour Commercial Junior (salaire prélevé à l'embauche via effetsImmédiats)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    // commercial-junior-dec a effetsRecurrents: [] — le salaire est prélevé une seule fois
    // via effetsImmédiats lors du recrutement, pas chaque trimestre via calculerCoutCommerciaux
    const cout = calculerCoutCommerciaux(joueur);
    expect(cout).toBe(0);
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
    // Belvaux : Camionnette VNC = 8 000 €
    const result = vendreImmobilisation(etat, 0, "Camionnette", 10000);
    expect(result.succes).toBe(true);

    const joueur = etat.joueurs[0];
    // Tâche 25 : trésorerie initiale 10 000 € + cession 10 000 € = 20 000 €
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(20000);
    // Camionnette retirée du bilan
    expect(joueur.bilan.actifs.find((a) => a.nom === "Camionnette")).toBeUndefined();
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
    const result = vendreImmobilisation(etat, 0, "Camionnette", 8000);
    expect(result.succes).toBe(true);

    const joueur = etat.joueurs[0];
    expect(joueur.compteResultat.produits.revenusExceptionnels).toBe(0);
    expect(joueur.compteResultat.charges.chargesExceptionnelles).toBe(0);
    expect(joueur.bilan.actifs.find((a) => a.nom === "Camionnette")).toBeUndefined();
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
    const result = vendreImmobilisation(etat, 0, "Camionnette", -1000);
    expect(result.succes).toBe(false);
    expect(result.messageErreur).toContain("positif");
  });

  test("Vente d'un bien totalement amorti (VNC = 0) → tout est plus-value", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    // Forcer la VNC à zéro (simulation amortissement total)
    const camionnette = joueur.bilan.actifs.find((a) => a.nom === "Camionnette")!;
    camionnette.valeur = 0;
    const tresoAvant = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;

    const result = vendreImmobilisation(etat, 0, "Camionnette", 1500);
    expect(result.succes).toBe(true);
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(tresoAvant + 1500);
    expect(joueur.compteResultat.produits.revenusExceptionnels).toBe(1500);
    expect(joueur.bilan.actifs.find((a) => a.nom === "Camionnette")).toBeUndefined();
  });
});
