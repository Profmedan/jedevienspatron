// ============================================================
// KICLEPATRON — Moteur de jeu principal (GameEngine)
// Logique 100% pure TypeScript, sans DOM, sans React
// Source : KICLEPATRON_v2.html — Pierre Médan
// ============================================================

import {
  EtatJeu,
  Joueur,
  Bilan,
  CompteResultat,
  CarteDecision,
  CarteClient,
  CarteEvenement,
  NomEntreprise,
  ResultatAction,
  EtapeTour,
  DECOUVERT_MAX,
  CHARGES_FIXES_PAR_TOUR,
  REMBOURSEMENT_EMPRUNT_PAR_TOUR,
} from "@/lib/game-engine/types";
import { ENTREPRISES } from "@/lib/game-engine/data/entreprises";
import { CARTES_DECISION, CARTES_CLIENTS, CARTES_EVENEMENTS } from "@/lib/game-engine/data/cartes";
import {
  getTotalImmobilisations,
  getTotalStocks,
  getTresorerie,
  verifierEquilibre,
  verifierFaillite,
  calculerScore,
} from "@/lib/game-engine/calculators";

// ─── HELPERS INTERNES ────────────────────────────────────────

function melangerTableau<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function creerBilanVierge(): Bilan {
  return {
    actifs: [],
    passifs: [],
    decouvert: 0,
    creancesPlus1: 0,
    creancesPlus2: 0,
    dettes: 0,
    dettesFiscales: 0,
  };
}

function creerCompteResultatVierge(): CompteResultat {
  return {
    charges: {
      achats: 0,
      servicesExterieurs: 0,
      impotsTaxes: 0,
      chargesInteret: 0,
      chargesPersonnel: 0,
      chargesExceptionnelles: 0,
      dotationsAmortissements: 0,
    },
    produits: {
      ventes: 0,
      productionStockee: 0,
      produitsFinanciers: 0,
      revenusExceptionnels: 0,
    },
  };
}

/** Applique un delta sur le poste d'un joueur et retourne l'ancienne valeur */
function appliquerDeltaPoste(
  joueur: Joueur,
  poste: string,
  delta: number
): { ancienneValeur: number; nouvelleValeur: number } {
  const charges = joueur.compteResultat.charges as unknown as Record<string, number>;
  const produits = joueur.compteResultat.produits as unknown as Record<string, number>;
  const bilanActifs = joueur.bilan.actifs;
  const bilanPassifs = joueur.bilan.passifs;
  const bilan = joueur.bilan as unknown as Record<string, number>;

  // Compte de résultat — charges
  if (poste in charges) {
    const old = charges[poste];
    charges[poste] = Math.max(0, old + delta);
    return { ancienneValeur: old, nouvelleValeur: charges[poste] };
  }

  // Compte de résultat — produits
  if (poste in produits) {
    const old = produits[poste];
    produits[poste] = old + delta; // Les produits peuvent théoriquement être négatifs (événement)
    return { ancienneValeur: old, nouvelleValeur: produits[poste] };
  }

  // Bilan — postes simples (decouvert, creancesPlus1, creancesPlus2, dettes, dettesFiscales)
  if (poste in bilan && typeof bilan[poste] === "number") {
    const old = bilan[poste];
    bilan[poste] = Math.max(0, old + delta);
    return { ancienneValeur: old, nouvelleValeur: bilan[poste] };
  }

  // Bilan — actifs (chercher par catégorie)
  const actif = bilanActifs.find((a) => a.categorie === poste);
  if (actif) {
    const old = actif.valeur;
    actif.valeur = poste === "tresorerie" ? old + delta : Math.max(0, old + delta);
    return { ancienneValeur: old, nouvelleValeur: actif.valeur };
  }

  // Bilan — passifs (chercher par catégorie)
  const passif = bilanPassifs.find((p) => p.categorie === poste);
  if (passif) {
    const old = passif.valeur;
    passif.valeur = Math.max(0, old + delta);
    return { ancienneValeur: old, nouvelleValeur: passif.valeur };
  }

  // Poste introuvable — cas défensif
  console.warn(`[GameEngine] Poste inconnu : ${poste}`);
  return { ancienneValeur: 0, nouvelleValeur: 0 };
}

// ─── CRÉATION DE L'ÉTAT INITIAL ──────────────────────────────

export function creerJoueur(
  id: number,
  pseudo: string,
  nomEntreprise: NomEntreprise
): Joueur {
  const template = ENTREPRISES.find((e) => e.nom === nomEntreprise);
  if (!template) throw new Error(`Entreprise inconnue : ${nomEntreprise}`);

  const bilan = creerBilanVierge();

  // Actifs avec catégories
  bilan.actifs = template.actifs.map((a) => ({
    nom: a.nom,
    valeur: a.valeur,
    categorie: a.nom.toLowerCase().includes("trésorerie")
      ? "tresorerie"
      : a.nom.toLowerCase().includes("stock")
      ? "stocks"
      : "immobilisations",
  }));

  // Passifs avec catégories
  bilan.passifs = template.passifs.map((p) => ({
    nom: p.nom,
    valeur: p.valeur,
    categorie: p.nom.toLowerCase().includes("capitaux") || p.nom.toLowerCase().includes("propres")
      ? "capitaux"
      : p.nom.toLowerCase().includes("emprunt")
      ? "emprunts"
      : "dettes",
  }));

  // Le Commercial Junior est distribué d'office à chaque joueur
  const commercialJunior = CARTES_DECISION.find(
    (c) => c.id === "commercial-junior-dec"
  );

  return {
    id,
    pseudo,
    entreprise: {
      nom: template.nom,
      couleur: template.couleur,
      icon: template.icon,
      type: template.type,
      specialite: template.specialite,
      ref: {
        actifs: template.actifs.map((a) => a.valeur),
        passifs: template.passifs.map((p) => p.valeur),
      },
    },
    bilan,
    compteResultat: creerCompteResultatVierge(),
    cartesActives: commercialJunior ? [commercialJunior] : [],
    clientsATrait: [],
    elimine: false,
    publicitéCeTour: false,
  };
}

export function initialiserJeu(
  joueursDefs: Array<{ pseudo: string; nomEntreprise: NomEntreprise }>,
  nbToursMax: number = 6 // 4 = session courte, 6 = standard (défaut), 8 = session longue
): EtatJeu {
  const joueurs = joueursDefs.map((def, i) =>
    creerJoueur(i, def.pseudo, def.nomEntreprise)
  );

  return {
    phase: "playing",
    tourActuel: 1,
    etapeTour: 0,
    joueurActif: 0,
    joueurs,
    nbJoueurs: joueurs.length,
    nbToursMax, // configurable : 4, 6 ou 8 trimestres
    piocheDecision: melangerTableau(
      CARTES_DECISION.filter((c) => c.id !== "commercial-junior-dec")
    ),
    piocheEvenements: melangerTableau([...CARTES_EVENEMENTS]),
    historiqueEvenements: [],
    messages: [
      `Bienvenue dans KICLEPATRON ! Trimestre 1/${nbToursMax} — Étape 1 : Remboursements et charges fixes.`,
    ],
  };
}

// ─── ÉTAPE 0 : Remboursements obligatoires + charges fixes + amortissements ──

export function appliquerEtape0(
  etat: EtatJeu,
  joueurIdx: number
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];

  const push = (poste: string, delta: number, explication: string) => {
    const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(
      joueur,
      poste,
      delta
    );
    modifications.push({
      joueurId: joueur.id,
      poste: poste as any,
      ancienneValeur,
      nouvelleValeur,
      explication,
    });
  };

  // 0. Agios bancaires sur découvert (AVANT remboursement : les intérêts s'ajoutent au découvert)
  if (joueur.bilan.decouvert > 0) {
    push(
      "chargesInteret",
      1,
      `Agios bancaires : intérêts sur découvert de ${joueur.bilan.decouvert} → Charges d'intérêt +1`
    );
    push("decouvert", 1, "Agios ajoutés au découvert bancaire (+1)");
  }

  // 1. Remboursement découvert (trésorerie absorbe d'abord le découvert, puis les dettes)
  if (joueur.bilan.decouvert > 0) {
    push("tresorerie", -joueur.bilan.decouvert, "Remboursement du découvert bancaire (priorité sur les dettes)");
    push("decouvert", -joueur.bilan.decouvert, "Solde découvert remis à zéro");
  }

  // 2. Paiement dettes fournisseurs D+1
  if (joueur.bilan.dettes > 0) {
    push("tresorerie", -joueur.bilan.dettes, "Paiement dettes fournisseurs");
    push("dettes", -joueur.bilan.dettes, "Dettes fournisseurs soldées");
  }

  // 3. Paiement dettes fiscales D+1
  if (joueur.bilan.dettesFiscales > 0) {
    push("tresorerie", -joueur.bilan.dettesFiscales, "Paiement dettes fiscales");
    push("dettesFiscales", -joueur.bilan.dettesFiscales, "Dettes fiscales soldées");
  }

  // 4. Remboursement emprunt (-1 par tour si emprunts > 0)
  const emprunts = joueur.bilan.passifs.find((p) => p.categorie === "emprunts");
  if (emprunts && emprunts.valeur >= REMBOURSEMENT_EMPRUNT_PAR_TOUR) {
    push("tresorerie", -REMBOURSEMENT_EMPRUNT_PAR_TOUR, "Remboursement annuité emprunt");
    push("emprunts", -REMBOURSEMENT_EMPRUNT_PAR_TOUR, "Emprunt réduit d'1 unité");
  }

  // 5. Charges fixes obligatoires (+2 Services ext., -2 Trésorerie)
  push(
    "servicesExterieurs",
    CHARGES_FIXES_PAR_TOUR,
    `Charges fixes trimestrielles (loyer, électricité…) : +${CHARGES_FIXES_PAR_TOUR}`
  );
  push(
    "tresorerie",
    -CHARGES_FIXES_PAR_TOUR,
    `Paiement charges fixes : -${CHARGES_FIXES_PAR_TOUR} Trésorerie`
  );

  // 6. Amortissement outil productif (-1 Immo, +1 Dotations)
  const immoTotale = getTotalImmobilisations(joueur);
  if (immoTotale > 0) {
    push("immobilisations", -1, "Amortissement des immobilisations : usure normale");
    push("dotationsAmortissements", 1, "Dotation aux amortissements enregistrée");
  }

  // Vérifier si trésorerie négative → découvert automatique
  const treso = getTresorerie(joueur);
  if (treso < 0) {
    const montantDecouvert = Math.abs(treso);
    push("tresorerie", montantDecouvert, "Trésorerie ramenée à 0");
    push("decouvert", montantDecouvert, `Découvert bancaire ouvert : ${montantDecouvert}`);
  }

  return { succes: true, modifications };
}

// ─── ÉTAPE 1 : Achats de marchandises (optionnel) ────────────

export function appliquerAchatMarchandises(
  etat: EtatJeu,
  joueurIdx: number,
  quantite: number,
  modePaiement: "tresorerie" | "dettes"
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];

  if (quantite <= 0) return { succes: true, modifications };

  const push = (poste: string, delta: number, explication: string) => {
    const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, poste, delta);
    modifications.push({ joueurId: joueur.id, poste: poste as any, ancienneValeur, nouvelleValeur, explication });
  };

  // Stocks +quantite
  push("stocks", quantite, `Achat de ${quantite} unité(s) de marchandises`);

  // Paiement
  if (modePaiement === "tresorerie") {
    push("tresorerie", -quantite, "Paiement immédiat des achats");
  } else {
    push("dettes", quantite, "Achat à crédit : dette fournisseur D+1");
  }

  return { succes: true, modifications };
}

// ─── ÉTAPE 2 : Avancement des créances ──────────────────────

export function appliquerAvancementCreances(
  etat: EtatJeu,
  joueurIdx: number
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];
  const push = (poste: string, delta: number, explication: string) => {
    const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, poste, delta);
    modifications.push({ joueurId: joueur.id, poste: poste as any, ancienneValeur, nouvelleValeur, explication });
  };

  // Affacturage actif : toutes créances → Trésorerie immédiatement
  const hasAffacturage = joueur.cartesActives.some((c) => c.id === "affacturage");

  if (hasAffacturage) {
    if (joueur.bilan.creancesPlus1 > 0) {
      push("tresorerie", joueur.bilan.creancesPlus1, "Affacturage : créances C+1 encaissées");
      push("creancesPlus1", -joueur.bilan.creancesPlus1, "Créances C+1 cédées au factor");
    }
    if (joueur.bilan.creancesPlus2 > 0) {
      push("tresorerie", joueur.bilan.creancesPlus2, "Affacturage : créances C+2 encaissées");
      push("creancesPlus2", -joueur.bilan.creancesPlus2, "Créances C+2 cédées au factor");
    }
  } else {
    // C+1 → Trésorerie (encaissement)
    if (joueur.bilan.creancesPlus1 > 0) {
      push("tresorerie", joueur.bilan.creancesPlus1, "Encaissement créances clients arrivées à échéance");
      push("creancesPlus1", -joueur.bilan.creancesPlus1, "Créances C+1 encaissées");
    }
    // C+2 → C+1 (un trimestre de plus)
    if (joueur.bilan.creancesPlus2 > 0) {
      push("creancesPlus1", joueur.bilan.creancesPlus2, "Avancement créances C+2 → C+1");
      push("creancesPlus2", -joueur.bilan.creancesPlus2, "Créances C+2 avancées d'un trimestre");
    }
  }

  return { succes: true, modifications };
}

// ─── ÉTAPE 3 : Paiement des commerciaux ──────────────────────

export function calculerCoutCommerciaux(joueur: Joueur): number {
  return joueur.cartesActives
    .filter((c) => c.categorie === "commercial")
    .reduce((sum, c) => {
      const cout = c.effetsRecurrents
        .filter((e) => e.poste === "chargesPersonnel")
        .reduce((s, e) => s + Math.abs(e.delta), 0);
      return sum + cout;
    }, 0);
}

export function appliquerPaiementCommerciaux(
  etat: EtatJeu,
  joueurIdx: number
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];
  const cout = calculerCoutCommerciaux(joueur);

  if (cout === 0) return { succes: true, modifications };

  const push = (poste: string, delta: number, explication: string) => {
    const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, poste, delta);
    modifications.push({ joueurId: joueur.id, poste: poste as any, ancienneValeur, nouvelleValeur, explication });
  };

  push("chargesPersonnel", cout, `Salaires commerciaux : +${cout} charges de personnel`);
  push("tresorerie", -cout, `Paiement salaires : -${cout} trésorerie`);

  return { succes: true, modifications };
}

// ─── ÉTAPE 4 : Traitement carte Client ───────────────────────
/**
 * Comptabilisation en 4 écritures (partie double complète) :
 * 1. Ventes +X (Produit)
 * 2. Stocks -1 (Actif)
 * 3. CMV/Achats +1 (Charge)
 * 4a. Trésorerie +X (si client particulier, paiement immédiat)
 * 4b. Créances C+1 +X (si client TPE)
 * 4c. Créances C+2 +X (si client grand compte)
 */
export function appliquerCarteClient(
  etat: EtatJeu,
  joueurIdx: number,
  carteClient: CarteClient
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];
  const push = (poste: string, delta: number, explication: string) => {
    const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, poste, delta);
    modifications.push({ joueurId: joueur.id, poste: poste as any, ancienneValeur, nouvelleValeur, explication });
  };

  const stocks = getTotalStocks(joueur);
  if (stocks < 1) {
    return {
      succes: false,
      messageErreur:
        "Stock insuffisant ! Vous devez acheter des marchandises (étape 1) avant de vendre.",
      modifications,
    };
  }

  const montant = carteClient.montantVentes;

  // 1. Produit : Ventes
  push("ventes", montant, `Vente enregistrée : +${montant} Ventes`);

  // 2. Actif : Stocks diminuent
  push("stocks", -1, "Sortie de stock : -1 marchandise livrée");

  // 3. Charge : CMV (coût de la marchandise vendue)
  push("achats", 1, "Coût de la marchandise vendue (CMV) : +1 Achats");

  // 4. Encaissement selon délai
  if (carteClient.delaiPaiement === 0) {
    push("tresorerie", montant, `Encaissement immédiat : +${montant} Trésorerie`);
  } else if (carteClient.delaiPaiement === 1) {
    push("creancesPlus1", montant, `Créance client TPE enregistrée : +${montant} C+1`);
  } else {
    push("creancesPlus2", montant, `Créance grand compte enregistrée : +${montant} C+2`);
  }

  return { succes: true, modifications };
}

// ─── ÉTAPE 5 : Effets récurrents des cartes Décision ────────

export function appliquerEffetsRecurrents(
  etat: EtatJeu,
  joueurIdx: number
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];

  for (const carte of joueur.cartesActives) {
    if (carte.categorie === "commercial") continue; // les commerciaux sont traités étape 3

    for (const effet of carte.effetsRecurrents) {
      const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(
        joueur,
        effet.poste,
        effet.delta
      );
      modifications.push({
        joueurId: joueur.id,
        poste: effet.poste,
        ancienneValeur,
        nouvelleValeur,
        explication: `${carte.titre} — effet récurrent`,
      });
    }
  }

  return { succes: true, modifications };
}

// ─── ÉTAPE 6 : Choix carte Décision ─────────────────────────

export function tirerCartesDecision(etat: EtatJeu, nb: number = 3): CarteDecision[] {
  const tirees = etat.piocheDecision.splice(0, nb);
  if (etat.piocheDecision.length < nb) {
    // Recharger la pioche si vide (idem : exclure le Junior déjà distribué d'office)
    etat.piocheDecision.push(
      ...melangerTableau(CARTES_DECISION.filter((c) => c.id !== "commercial-junior-dec"))
    );
  }
  return tirees;
}

export function acheterCarteDecision(
  etat: EtatJeu,
  joueurIdx: number,
  carte: CarteDecision
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];

  // Garde anti-doublon : impossible d'activer deux fois la même carte
  if (joueur.cartesActives.some((a) => a.id === carte.id)) {
    return {
      succes: false,
      messageErreur: `Vous avez déjà la carte "${carte.titre}" active.`,
      modifications: [],
    };
  }

  // Appliquer les effets immédiats
  for (const effet of carte.effetsImmédiats) {
    const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(
      joueur,
      effet.poste,
      effet.delta
    );
    modifications.push({
      joueurId: joueur.id,
      poste: effet.poste,
      ancienneValeur,
      nouvelleValeur,
      explication: `${carte.titre} — effet immédiat`,
    });
  }

  // Ajouter la carte aux actives
  joueur.cartesActives.push(carte);

  // Carte Formation : bonus d'1 client grand compte immédiat
  if (carte.id === "formation") {
    const clientGC = CARTES_CLIENTS.find((c) => c.id === "client-grand-compte");
    if (clientGC) joueur.clientsATrait.push(clientGC);
  }

  // Remboursement anticipé : solder les emprunts restants
  if (carte.id === "remboursement-anticipe") {
    const emprunts = joueur.bilan.passifs.find((p) => p.categorie === "emprunts");
    if (emprunts && emprunts.valeur > 0) {
      const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(
        joueur, "tresorerie", -emprunts.valeur
      );
      modifications.push({
        joueurId: joueur.id, poste: "tresorerie",
        ancienneValeur, nouvelleValeur,
        explication: "Remboursement anticipé intégral de l'emprunt",
      });
      appliquerDeltaPoste(joueur, "emprunts", -emprunts.valeur);
    }
    // Retirer la carte (usage unique)
    joueur.cartesActives = joueur.cartesActives.filter((c) => c.id !== "remboursement-anticipe");
  }

  // Levée de fonds : usage unique
  if (carte.id === "levee-de-fonds") {
    joueur.cartesActives = joueur.cartesActives.filter((c) => c.id !== "levee-de-fonds");
  }

  return { succes: true, modifications };
}

// ─── ÉTAPE 7 : Carte Événement ───────────────────────────────

export function appliquerCarteEvenement(
  etat: EtatJeu,
  joueurIdx: number,
  carte: CarteEvenement
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];

  // Assurance prévoyance annule les événements négatifs
  const hasAssurance = joueur.cartesActives.some((c) => c.id === "assurance-prevoyance");
  const estNegatif = carte.effets.some((e) => e.delta < 0);

  if (hasAssurance && carte.annulableParAssurance && estNegatif) {
    modifications.push({
      joueurId: joueur.id,
      poste: "tresorerie",
      ancienneValeur: getTresorerie(joueur),
      nouvelleValeur: getTresorerie(joueur),
      explication: `${carte.titre} — ANNULÉ par l'Assurance Prévoyance 🛡️`,
    });
    etat.historiqueEvenements.push({ tour: etat.tourActuel, joueurId: joueur.id, carte });
    return { succes: true, modifications };
  }

  for (const effet of carte.effets) {
    const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(
      joueur, effet.poste, effet.delta
    );
    modifications.push({
      joueurId: joueur.id, poste: effet.poste,
      ancienneValeur, nouvelleValeur,
      explication: `${carte.titre} : ${effet.delta > 0 ? "+" : ""}${effet.delta} ${effet.poste}`,
    });
  }

  etat.historiqueEvenements.push({ tour: etat.tourActuel, joueurId: joueur.id, carte });
  return { succes: true, modifications };
}

// ─── ÉTAPE 8 : Vérification fin de tour ──────────────────────

export interface ResultatFinTour {
  equilibre: boolean;
  enFaillite: boolean;
  raisonFaillite?: string;
  score: number;
  ecartEquilibre: number;
  message: string;
}

export function verifierFinTour(
  etat: EtatJeu,
  joueurIdx: number
): ResultatFinTour {
  const joueur = etat.joueurs[joueurIdx];
  const { equilibre, ecart } = verifierEquilibre(joueur);
  const { enFaillite, raison } = verifierFaillite(joueur);
  const score = calculerScore(joueur);

  // Découvert > DECOUVERT_MAX → pénalité d'intérêts bancaires
  // (enregistrée en Charges d'intérêt, prélevée sur la trésorerie du prochain tour via le découvert)
  if (joueur.bilan.decouvert > DECOUVERT_MAX) {
    const pénalité = joueur.bilan.decouvert - DECOUVERT_MAX;
    // CORRECTION BUG : la pénalité s'enregistre en Charges d'intérêt (CR)
    // et augmente le découvert (le joueur devra rembourser encore plus au prochain tour)
    // Note : c'est intentionnellement pénalisé pour pousser à résorber le découvert
    appliquerDeltaPoste(joueur, "chargesInteret", pénalité);
    // Pas de nouveau delta sur le découvert ici — il sera recalculé à l'étape 0 du prochain tour
  }

  if (enFaillite) {
    joueur.elimine = true;
  }

  return {
    equilibre,
    enFaillite,
    raisonFaillite: raison,
    score,
    ecartEquilibre: ecart,
    message: equilibre
      ? "✅ Bilan équilibré ! Vous maîtrisez la partie double."
      : `⚠️ Bilan déséquilibré de ${Math.abs(ecart).toFixed(0)} unité(s). Vérifiez vos écritures.`,
  };
}

// ─── FIN D'ANNÉE (après 4 tours) ─────────────────────────────

export function cloturerAnnee(etat: EtatJeu): void {
  for (const joueur of etat.joueurs) {
    if (joueur.elimine) continue;

    // Résultat net → Capitaux propres
    const resultatNet =
      Object.values(joueur.compteResultat.produits).reduce((s, v) => s + v, 0) -
      Object.values(joueur.compteResultat.charges).reduce((s, v) => s + v, 0);

    const capitaux = joueur.bilan.passifs.find((p) => p.categorie === "capitaux");
    if (capitaux) capitaux.valeur += resultatNet;

    // Réinitialiser compte de résultat
    joueur.compteResultat = creerCompteResultatVierge();

    // Ne garder que Commercial Junior + cartes d'investissement long terme
    joueur.cartesActives = joueur.cartesActives.filter(
      (c) => c.categorie !== "tactique" && c.categorie !== "financement"
    );

    // Réinitialiser clients à traiter
    joueur.clientsATrait = [];
  }

  etat.tourActuel = 1;
  etat.etapeTour = 0;
  etat.joueurActif = 0;
}

// ─── AVANCEMENT DU TOUR ─────────────────────────────────────

export function avancerEtape(etat: EtatJeu): void {
  const maxEtape = 8;
  if (etat.etapeTour < maxEtape) {
    etat.etapeTour = (etat.etapeTour + 1) as EtapeTour;
  } else {
    // Fin du tour pour ce joueur — passer au joueur suivant
    etat.joueurActif++;
    if (etat.joueurActif >= etat.nbJoueurs) {
      // Fin du tour pour tous → incrémenter le tour
      etat.joueurActif = 0;
      etat.tourActuel++;
    }
    etat.etapeTour = 0;
  }
}

// ─── PIOCHE CLIENTS (générée par les commerciaux) ───────────

export function genererClientsParCommerciaux(joueur: Joueur): CarteClient[] {
  const clients: CarteClient[] = [];
  for (const carte of joueur.cartesActives) {
    if (!carte.clientParTour) continue;
    const clientCarte = CARTES_CLIENTS.find(
      (c) => c.id === `client-${carte.clientParTour}`
    );
    if (clientCarte) {
      const nb = carte.nbClientsParTour ?? 1;
      for (let i = 0; i < nb; i++) {
        clients.push(clientCarte);
      }
    }
  }
  return clients;
}
