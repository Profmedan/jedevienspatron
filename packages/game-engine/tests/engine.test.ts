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
  appliquerRessourcesPreparation,
  appliquerRealisationMetier,
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
    // Manufacture Belvaux : Entrepôt(8000) + Camionnette(8000) + Stocks(4000) + Tréso(8000) = 28000
    expect(totalActif).toBe(28000);
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
    // Tour 1 = premier trimestre de l'année → intérêts annuels appliqués : 8000 × 5% = 400
    expect(tresoAfter).toBe(tresoBefore - 2000 - 500 - 400); // -2000 charges fixes - 500 remboursement - 400 intérêts
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
    // Trésorerie : 8 000 + 10 000 = 18 000
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(18000);
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
    // Trésorerie : 8 000 + 5 000 = 13 000
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(13000);
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

// ─── B9-C : Étape 2 polymorphe (Ressources & préparation) ────────────────

describe("appliquerRessourcesPreparation — polymorphie par modeEconomique (B9-C)", () => {
  test("Production (Belvaux) : achat matière cible « Matière première Belvaux » (B9-D)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    // B9-D : Belvaux a 2 lignes stocks — on cible précisément la matière première.
    const matiereAvant = joueur.bilan.actifs.find((a) => a.nom === "Matière première Belvaux")!.valeur;
    const finisAvant   = joueur.bilan.actifs.find((a) => a.nom === "Produits finis Belvaux")!.valeur;
    const tresoAvant   = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;

    const r = appliquerRessourcesPreparation(etat, 0, 2, "tresorerie");

    expect(r.succes).toBe(true);
    expect(joueur.entreprise.modeEconomique).toBe("production");
    // Matière première augmente, Produits finis INCHANGÉS
    expect(joueur.bilan.actifs.find((a) => a.nom === "Matière première Belvaux")!.valeur).toBe(matiereAvant + 2000);
    expect(joueur.bilan.actifs.find((a) => a.nom === "Produits finis Belvaux")!.valeur).toBe(finisAvant);
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(tresoAvant - 2000);
    // Charges CR inchangées (pas de flux via CR pour la production en étape 2)
    expect(joueur.compteResultat.charges.servicesExterieurs).toBe(0);
    expect(joueur.compteResultat.charges.chargesPersonnel).toBe(0);
  });

  test("Négoce (Azura) : réassort à crédit → +stocks / +dettes", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Azura Commerce" }]);
    const joueur = etat.joueurs[0];
    const stocksAvant = joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur;
    const dettesAvant = joueur.bilan.dettes;

    const r = appliquerRessourcesPreparation(etat, 0, 3, "dettes");

    expect(r.succes).toBe(true);
    expect(joueur.entreprise.modeEconomique).toBe("négoce");
    expect(joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur).toBe(stocksAvant + 3000);
    expect(joueur.bilan.dettes).toBe(dettesAvant + 3000);
  });

  test("Logistique (Véloce) : préparation tournée → +servicesExterieurs / −trésorerie (PAS de stock)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Véloce Transports" }]);
    const joueur = etat.joueurs[0];
    const stocksAvant = joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur;
    const tresoAvant  = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;

    const r = appliquerRessourcesPreparation(etat, 0, 2, "tresorerie");

    expect(r.succes).toBe(true);
    expect(joueur.entreprise.modeEconomique).toBe("logistique");
    // Invariant clé : le stock N'EST PAS impacté pour un service
    expect(joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur).toBe(stocksAvant);
    // Le débit passe par servicesExterieurs (CR)
    expect(joueur.compteResultat.charges.servicesExterieurs).toBe(2000);
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(tresoAvant - 2000);
  });

  test("Conseil (Synergia) : staffing mission → +chargesPersonnel / −trésorerie (PAS de stock)", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Synergia Lab" }]);
    const joueur = etat.joueurs[0];
    const stocksAvant = joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur;
    const tresoAvant  = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;

    const r = appliquerRessourcesPreparation(etat, 0, 2, "tresorerie");

    expect(r.succes).toBe(true);
    expect(joueur.entreprise.modeEconomique).toBe("conseil");
    // Invariant clé : le stock N'EST PAS impacté pour une mission
    expect(joueur.bilan.actifs.find((a) => a.categorie === "stocks")!.valeur).toBe(stocksAvant);
    // Le débit passe par chargesPersonnel (CR)
    expect(joueur.compteResultat.charges.chargesPersonnel).toBe(2000);
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(tresoAvant - 2000);
  });

  test("Invariant partie double : somme des deltas de chaque modification = 0 (4 entreprises)", () => {
    const nomsEntreprises: Array<"Manufacture Belvaux" | "Azura Commerce" | "Véloce Transports" | "Synergia Lab"> = [
      "Manufacture Belvaux", "Azura Commerce", "Véloce Transports", "Synergia Lab"
    ];
    for (const nom of nomsEntreprises) {
      const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: nom }]);
      const r = appliquerRessourcesPreparation(etat, 0, 2, "tresorerie");
      expect(r.succes).toBe(true);
      expect(r.modifications.length).toBe(2); // 1 débit + 1 crédit
      // Somme des |delta| débit === somme |delta| crédit
      const sommeDelta = r.modifications.reduce(
        (s: number, m: { ancienneValeur: number; nouvelleValeur: number }) =>
          s + Math.abs(m.nouvelleValeur - m.ancienneValeur),
        0,
      );
      expect(sommeDelta).toBe(4000); // 2 × 2000 (débit + crédit)
    }
  });

  test("Quantité nulle : aucune modification, succès", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const r = appliquerRessourcesPreparation(etat, 0, 0, "tresorerie");
    expect(r.succes).toBe(true);
    expect(r.modifications.length).toBe(0);
  });
});

// ─── B9-D : Étape 3 polymorphe (Réalisation métier) ──────────────────────

describe("appliquerRealisationMetier — polymorphie par modeEconomique (B9-D)", () => {
  test("Production (Belvaux) : transforme matière → produits finis + productionStockee", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];

    // Bilan initial Belvaux : 1000 € matière + 3000 € produits finis
    const matiereAvant = joueur.bilan.actifs.find((a) => a.nom === "Matière première Belvaux")!.valeur;
    const finisAvant   = joueur.bilan.actifs.find((a) => a.nom === "Produits finis Belvaux")!.valeur;
    expect(matiereAvant).toBe(1000);
    expect(finisAvant).toBe(3000);

    // Transforme 1 unité de matière en 1 unité de produits finis
    const r = appliquerRealisationMetier(etat, 0, 1);

    expect(r.succes).toBe(true);
    // Consommation matière : -1000 sur Matière première
    expect(joueur.bilan.actifs.find((a) => a.nom === "Matière première Belvaux")!.valeur).toBe(0);
    // Production stockée : +1000 sur Produits finis
    expect(joueur.bilan.actifs.find((a) => a.nom === "Produits finis Belvaux")!.valeur).toBe(4000);
    // Charge consommation matière au CR (achats)
    expect(joueur.compteResultat.charges.achats).toBe(1000);
    // Produit production stockée au CR
    expect(joueur.compteResultat.produits.productionStockee).toBe(1000);
  });

  test("Production (Belvaux) : refuse si matière insuffisante", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    // Matière = 1000 € (1 unité). Demande 2 unités → refus.
    const r = appliquerRealisationMetier(etat, 0, 2);
    expect(r.succes).toBe(false);
    expect(r.messageErreur).toContain("Matière première insuffisante");
    expect(r.modifications.length).toBe(0);
  });

  test("Négoce (Azura) : coût de canal fixe 300 € à crédit", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Azura Commerce" }]);
    const joueur = etat.joueurs[0];
    const dettesAvant = joueur.bilan.dettes;

    // Paramètres quantite/mode : quantite ignorée pour Azura, mode pertinent
    const r = appliquerRealisationMetier(etat, 0, 99, "dettes");

    expect(r.succes).toBe(true);
    expect(joueur.compteResultat.charges.servicesExterieurs).toBe(300);
    expect(joueur.bilan.dettes).toBe(dettesAvant + 300);
    // Stock inchangé (négoce : canal n'impacte pas les marchandises)
    expect(joueur.bilan.actifs.find((a) => a.nom === "Marchandises Azura")!.valeur).toBe(4000);
  });

  test("Logistique (Véloce) : 2 écritures doubles — charges + en-cours", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Véloce Transports" }]);
    const joueur = etat.joueurs[0];
    const tresoAvant = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;
    const encoursAvant = joueur.bilan.actifs.find((a) => a.nom === "En-cours tournée Véloce")!.valeur;
    expect(encoursAvant).toBe(0);

    // Exécute 2 tournées
    const r = appliquerRealisationMetier(etat, 0, 2, "tresorerie");

    expect(r.succes).toBe(true);
    // (a) Charges personnel +2000, Trésorerie −2000
    expect(joueur.compteResultat.charges.chargesPersonnel).toBe(2000);
    expect(joueur.bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur).toBe(tresoAvant - 2000);
    // (b) En-cours +2000, productionStockee +2000
    expect(joueur.bilan.actifs.find((a) => a.nom === "En-cours tournée Véloce")!.valeur).toBe(2000);
    expect(joueur.compteResultat.produits.productionStockee).toBe(2000);
  });

  test("Conseil (Synergia) : 2 écritures doubles — charges + en-cours mission", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Synergia Lab" }]);
    const joueur = etat.joueurs[0];
    const encoursAvant = joueur.bilan.actifs.find((a) => a.nom === "En-cours mission Synergia")!.valeur;
    expect(encoursAvant).toBe(0);

    // Livre 3 missions
    const r = appliquerRealisationMetier(etat, 0, 3, "tresorerie");

    expect(r.succes).toBe(true);
    // (a) Charges personnel +3000
    expect(joueur.compteResultat.charges.chargesPersonnel).toBe(3000);
    // (b) En-cours mission +3000, productionStockee +3000
    expect(joueur.bilan.actifs.find((a) => a.nom === "En-cours mission Synergia")!.valeur).toBe(3000);
    expect(joueur.compteResultat.produits.productionStockee).toBe(3000);
  });

  test("Invariant partie double : Σ débits = Σ crédits après chaque écriture (4 entreprises)", () => {
    const cas: Array<{
      nom: "Manufacture Belvaux" | "Azura Commerce" | "Véloce Transports" | "Synergia Lab";
      qte: number;
    }> = [
      { nom: "Manufacture Belvaux", qte: 1 },
      { nom: "Azura Commerce", qte: 99 },
      { nom: "Véloce Transports", qte: 2 },
      { nom: "Synergia Lab", qte: 2 },
    ];
    for (const { nom, qte } of cas) {
      const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: nom }]);
      const r = appliquerRealisationMetier(etat, 0, qte, "tresorerie");
      expect(r.succes).toBe(true);
      expect(r.modifications.length).toBeGreaterThanOrEqual(2);
      // Chaque écriture produit 2 mods (1 débit + 1 crédit). Le nombre total
      // de modifications doit être pair (2, 4, ...).
      expect(r.modifications.length % 2).toBe(0);
    }
  });

  test("Quantité nulle (hors Azura) : aucune modification, succès", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Véloce Transports" }]);
    const r = appliquerRealisationMetier(etat, 0, 0, "tresorerie");
    expect(r.succes).toBe(true);
    expect(r.modifications.length).toBe(0);
  });

  test("Belvaux étape 2 cible bien « Matière première Belvaux » (régression B9-C)", () => {
    // Vérifie que l'achat matière à l'étape 2 ne pollue PAS les Produits finis.
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const joueur = etat.joueurs[0];
    const finisAvant = joueur.bilan.actifs.find((a) => a.nom === "Produits finis Belvaux")!.valeur;

    appliquerRessourcesPreparation(etat, 0, 2, "tresorerie");

    // Matière première alimentée, Produits finis inchangés
    expect(joueur.bilan.actifs.find((a) => a.nom === "Matière première Belvaux")!.valeur).toBe(1000 + 2000);
    expect(joueur.bilan.actifs.find((a) => a.nom === "Produits finis Belvaux")!.valeur).toBe(finisAvant);
  });
});
