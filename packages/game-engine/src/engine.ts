// ============================================================
// JEDEVIENSPATRON — Moteur de jeu principal (GameEngine)
// Logique 100% pure TypeScript, sans DOM, sans React
// Source : JEDEVIENSPATRON_v2.html — Pierre Médan
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
  EffetCarte,
  DECOUVERT_MAX,
  CHARGES_FIXES_PAR_TOUR,
  PRIX_UNITAIRE_MARCHANDISE,
  REMBOURSEMENT_EMPRUNT_PAR_TOUR,
  REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR,
  INTERET_EMPRUNT_FREQUENCE,
  TAUX_INTERET_ANNUEL,
  ResultatDemandePret,
  CAPACITE_BASE,
  CAPACITE_IMMOBILISATION,
  CAPACITE_IMMOBILISATION_PAR_ENTREPRISE,
} from "./types";
import { ENTREPRISES } from "./data/entreprises";
import { CARTES_DECISION, CARTES_CLIENTS, CARTES_EVENEMENTS } from "./data/cartes";
import {
  getTotalImmobilisations,
  getTotalStocks,
  getTresorerie,
  verifierEquilibre,
  verifierFaillite,
  calculerScore,
  scorerDemandePret,
} from "./calculators";

// ─── COUNTER FOR DETERMINISTIC IDS ──────────────────────────
let _nextCommercialId = 0;

// ─── CONSTANTES IDs CARTES ──────────────────────────────────
/** Constantes centralisées pour les IDs de cartes — évite les string literals éparpillés */
const CARTE_IDS = {
  COMMERCIAL_JUNIOR: "commercial-junior-dec",
  AFFACTURAGE: "affacturage",
  FORMATION: "formation",
  REMBOURSEMENT_ANTICIPE: "remboursement-anticipe",
  LEVEE_DE_FONDS: "levee-de-fonds",
  ASSURANCE_PREVOYANCE: "assurance-prevoyance",
} as const;

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
    dettesD2: 0,
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

/** Crée une closure push(poste, delta, explication, extras?) pour tracker les modifications */
function makePush(
  joueur: Joueur,
  modifications: ResultatAction["modifications"]
) {
  return (poste: EffetCarte["poste"], delta: number, explication: string, extras?: {
    saleGroupId?: string;
    saleClientLabel?: string;
    saleActIndex?: number;
  }) => {
    const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, poste, delta);
    modifications.push({
      joueurId: joueur.id,
      poste,
      ancienneValeur,
      nouvelleValeur,
      explication,
      ...extras,
    });
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
    produits[poste] = Math.max(0, old + delta); // Plancher 0 : un produit ne peut pas être négatif
    return { ancienneValeur: old, nouvelleValeur: produits[poste] };
  }

  // Bilan — postes simples (decouvert, creancesPlus1, creancesPlus2, dettes, dettesFiscales)
  if (poste in bilan && typeof bilan[poste] === "number") {
    const old = bilan[poste];
    bilan[poste] = Math.max(0, old + delta);
    return { ancienneValeur: old, nouvelleValeur: bilan[poste] };
  }

  // Bilan — actifs (chercher par catégorie)
  // Cas spécial immobilisations : les investissements (delta > 0) → "Autres Immobilisations"
  // pour ne pas altérer les biens existants (Entrepôt, Camion, etc.)
  if (poste === "immobilisations") {
    let targetActif = delta > 0
      ? bilanActifs.find((a) => a.nom === "Autres Immobilisations")
      : undefined;
    // Fallback : premier item immobilisations disponible
    if (!targetActif) targetActif = bilanActifs.find((a) => a.categorie === "immobilisations");
    if (targetActif) {
      const old = targetActif.valeur;
      targetActif.valeur = Math.max(0, old + delta);
      return { ancienneValeur: old, nouvelleValeur: targetActif.valeur };
    }
  }

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

  // Poste introuvable — erreur pour détecter les typos/IDs invalides
  throw new Error(`[GameEngine] Poste inconnu : "${poste}". Vérifiez l'ID dans types.ts ou cartes.ts.`);
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
    // Commercial Junior par défaut : -1 chargesPersonnel, -1 tresorerie, +2 clients Particuliers/tour
    cartesActives: (() => {
      const comJunior = CARTES_DECISION.find((c) => c.id === CARTE_IDS.COMMERCIAL_JUNIOR);
      const base = comJunior ? [{ ...comJunior, id: `${comJunior.id}-init-${_nextCommercialId++}` }] : [];
      return [...base, ...(template.cartesLogistiquesDepart ?? [])];
    })(),
    // 2 clients Particuliers pré-chargés dès T1 : l'entreprise avait déjà
    // quelques clients avant le début du jeu — le joueur voit immédiatement
    // une vente et son écriture sans attendre d'avoir recruté un commercial.
    clientsATrait: (() => {
      const cp = CARTES_CLIENTS.find((c) => c.id === "client-particulier");
      return cp ? [cp, cp] : [];
    })(),
    elimine: false,
    publicitéCeTour: false,
    clientsPerdusCeTour: 0,
    piochePersonnelle: template.cartesLogistiquesDisponibles ?? [],
  };
}

export function initialiserJeu(
  joueursDefs: Array<{ pseudo: string; nomEntreprise: NomEntreprise }>,
  nbToursMax: number = 12 // 6 = session courte, 8 = standard, 12 = complet (3 exercices)
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
      CARTES_DECISION.filter((c) => c.categorie !== "commercial") // les commerciaux passent par obtenirCarteRecrutement
    ),
    piocheEvenements: melangerTableau([...CARTES_EVENEMENTS]),
    historiqueEvenements: [],
    messages: [
      `Bienvenue dans JEDEVIENSPATRON ! Trimestre 1/${nbToursMax} — 3 exercices comptables de ${Math.round(nbToursMax/3)} trimestres chacun. Étape 0 : Charges fixes et amortissements.`,
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
  const push = makePush(joueur, modifications);

  // 0. Agios bancaires sur découvert (AVANT remboursement)
  // Agios = 10% du découvert, arrondi à la centaine supérieure — prélevés sur la trésorerie.
  // Si la trésorerie est insuffisante, elle tombe en négatif → découvert généré automatiquement.
  if (joueur.bilan.decouvert > 0) {
    const agios = Math.ceil(joueur.bilan.decouvert * 0.10 / 100) * 100;
    push(
      "chargesInteret",
      agios,
      `Agios bancaires : 10% de ton découvert de ${joueur.bilan.decouvert} € = ${agios} € — prélevés sur ta trésorerie`
    );
    push(
      "tresorerie",
      -agios,
      `Agios bancaires débités de ta trésorerie (-${agios} €) — si elle est insuffisante, tu bascules en découvert`
    );
  }

  // 0b. Intérêts annuels sur emprunt (tous les 4 trimestres = 1 fois/an)
  // Intérêt = taux × capital, arrondi à la centaine supérieure — sans minimum artificiel.
  const empruntsPoste = joueur.bilan.passifs.find((p) => p.categorie === "emprunts");
  if (empruntsPoste && empruntsPoste.valeur > 0 && etat.tourActuel % INTERET_EMPRUNT_FREQUENCE === 1) {
    const interetEmprunt = Math.ceil(empruntsPoste.valeur * TAUX_INTERET_ANNUEL / 100 / 100) * 100;
    push(
      "chargesInteret",
      interetEmprunt,
      `Intérêts annuels sur emprunt de ${empruntsPoste.valeur} € : ${TAUX_INTERET_ANNUEL}% = ${interetEmprunt} € — la banque facture ses intérêts une fois par an`
    );
    push(
      "tresorerie",
      -interetEmprunt,
      `Paiement des intérêts d'emprunt : -${interetEmprunt} € sur ta trésorerie`
    );
  }

  // 1. Remboursement découvert PROGRESSIF (max REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR par trimestre)
  if (joueur.bilan.decouvert > 0) {
    const tresoDisponible = getTresorerie(joueur);
    const remboursementSouhaite = Math.min(joueur.bilan.decouvert, REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR);
    const remboursementEffectif = Math.min(remboursementSouhaite, Math.max(0, tresoDisponible));
    if (remboursementEffectif > 0) {
      push(
        "tresorerie",
        -remboursementEffectif,
        `Remboursement progressif du découvert : -${remboursementEffectif} (max ${REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR}/trimestre, reste ${joueur.bilan.decouvert - remboursementEffectif} après remboursement)`
      );
      push(
        "decouvert",
        -remboursementEffectif,
        `Découvert réduit de ${remboursementEffectif} — remboursement progressif pour ne pas asphyxier ta trésorerie`
      );
    } else {
      // Pas assez de trésorerie pour rembourser → message pédagogique
      modifications.push({
        joueurId: joueur.id,
        poste: "decouvert",
        ancienneValeur: joueur.bilan.decouvert,
        nouvelleValeur: joueur.bilan.decouvert,
        explication: `Découvert maintenu à ${joueur.bilan.decouvert} — trésorerie insuffisante pour rembourser ce trimestre. Attention aux agios !`,
      });
    }
  }

  // 2. Paiement dettes fournisseurs D+1
  if (joueur.bilan.dettes > 0) {
    push("tresorerie", -joueur.bilan.dettes, "Paiement dettes fournisseurs");
    push("dettes", -joueur.bilan.dettes, "Dettes fournisseurs soldées");
  }

  // 2b. Avancement dettes fournisseurs D+2 → D+1
  if (joueur.bilan.dettesD2 > 0) {
    const montantD2 = joueur.bilan.dettesD2;
    push("dettes", montantD2, `Dettes D+2 devenues D+1 : ${montantD2} € à payer au prochain trimestre`);
    push("dettesD2", -montantD2, `Dettes D+2 soldées (transférées en D+1)`);
  }

  // 3. Paiement dettes fiscales D+1
  if (joueur.bilan.dettesFiscales > 0) {
    push("tresorerie", -joueur.bilan.dettesFiscales, "Paiement dettes fiscales");
    push("dettesFiscales", -joueur.bilan.dettesFiscales, "Dettes fiscales soldées");
  }

  // 4. Remboursement emprunt (-1 000 € par tour si emprunts > 0)
  const emprunts = joueur.bilan.passifs.find((p) => p.categorie === "emprunts");
  if (emprunts && emprunts.valeur >= REMBOURSEMENT_EMPRUNT_PAR_TOUR) {
    push("tresorerie", -REMBOURSEMENT_EMPRUNT_PAR_TOUR, `Remboursement annuité emprunt : -${REMBOURSEMENT_EMPRUNT_PAR_TOUR} € par trimestre`);
    push("emprunts", -REMBOURSEMENT_EMPRUNT_PAR_TOUR, `Emprunt réduit de ${REMBOURSEMENT_EMPRUNT_PAR_TOUR} € — remboursement régulier`);
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

  // 6. Amortissement de chaque bien immobilisé (-1 par bien, Dotations = total)
  // Règle PCG : DÉBIT Dotations aux amortissements / CRÉDIT Immobilisations nettes
  // La dotation doit être ÉGALE à la somme des amortissements appliqués à chaque bien.
  // Post-amortissement (PCG) : les biens dont valeur nette = 0 restent au bilan (VNC = 0)
  // et continuent de générer leurs effets (clients, entretien) — seule la dotation s'arrête.
  const immoAmortissables = joueur.bilan.actifs.filter(
    (a) => a.categorie === "immobilisations" && a.valeur > 0
  );
  if (immoAmortissables.length > 0) {
    const totalAvant = immoAmortissables.reduce((s, a) => s + a.valeur, 0);

    // Appliquer -1 000 € directement à chaque bien (mutation directe pour éviter .find() répété)
    immoAmortissables.forEach((item) => {
      item.valeur = Math.max(0, item.valeur - 1000);
    });

    const totalApres = immoAmortissables.reduce((s, a) => s + a.valeur, 0);
    const totalDotation = totalAvant - totalApres; // = nombre de biens amortis

    // Enregistrer UNE modification agrégée pour les immobilisations (total avant/après)
    modifications.push({
      joueurId: joueur.id,
      poste: "immobilisations",
      ancienneValeur: totalAvant,
      nouvelleValeur: totalApres,
      explication: `Amortissement de ${immoAmortissables.length} bien(s) immobilisé(s) : −1 000 € par bien, valeur nette ${totalAvant} → ${totalApres}`,
    });

    // Enregistrer la dotation = total des amortissements (règle de la partie double)
    push(
      "dotationsAmortissements",
      totalDotation,
      `Dotation aux amortissements : +${totalDotation} (1 000 € par bien, ${immoAmortissables.length} bien(s) amortissable(s))`
    );
  }

  // Vérifier si trésorerie négative → découvert automatique
  const treso = getTresorerie(joueur);
  if (treso < 0) {
    const montantDecouvert = Math.abs(treso);
    push("tresorerie", montantDecouvert, "Trésorerie ramenée à 0");
    push(
      "decouvert",
      montantDecouvert,
      `Découvert bancaire automatique — ta trésorerie était négative, la banque couvre le déficit mais tu paies des agios (+${montantDecouvert})`
    );
  }

  // Vérification immédiate : si le découvert dépasse le maximum → faillite
  if (joueur.bilan.decouvert > DECOUVERT_MAX) {
    joueur.elimine = true;
    modifications.push({
      joueurId: joueur.id,
      poste: "decouvert",
      ancienneValeur: joueur.bilan.decouvert,
      nouvelleValeur: joueur.bilan.decouvert,
      explication: `⛔ FAILLITE — Découvert bancaire (${joueur.bilan.decouvert} €) dépasse le maximum autorisé (${DECOUVERT_MAX} €). Cessation de paiement.`,
    });
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
  const push = makePush(joueur, modifications);

  // 1 unité physique de marchandise = PRIX_UNITAIRE_MARCHANDISE (1 000 €) de valeur comptable
  const montant = quantite * PRIX_UNITAIRE_MARCHANDISE;

  // DÉBIT 37 Stocks de marchandises (Actif +)
  push("stocks", montant, `Achat de ${quantite} unité(s) de marchandises (${montant} €)`);

  // CRÉDIT : trésorerie (comptant) ou dettes fournisseurs (à crédit)
  if (modePaiement === "tresorerie") {
    push("tresorerie", -montant, `Paiement comptant : −${montant} €`);
  } else {
    push("dettes", montant, `Achat à crédit : dette fournisseur +${montant} €`);
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
  const push = makePush(joueur, modifications);

  // Affacturage actif : toutes créances → Trésorerie immédiatement
  const hasAffacturage = joueur.cartesActives.some((c) => c.id === CARTE_IDS.AFFACTURAGE);

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

  // Si aucune créance en attente, ajouter un message pédagogique
  if (joueur.bilan.creancesPlus1 === 0 && joueur.bilan.creancesPlus2 === 0) {
    modifications.push({
      joueurId: joueur.id,
      poste: "creancesPlus1",
      ancienneValeur: 0,
      nouvelleValeur: 0,
      explication: "Aucune créance en attente ce trimestre. Avec des clients TPE ou Grands Comptes, tu verras ici les encaissements différés.",
    });
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
  const push = makePush(joueur, modifications);

  push("chargesPersonnel", cout, `Salaires commerciaux : +${cout} charges de personnel`);
  push("tresorerie", -cout, `Paiement salaires : -${cout} trésorerie`);

  return { succes: true, modifications };
}

// ─── LICENCIEMENT D'UN COMMERCIAL ─────────────────────────────
/**
 * Licencie un commercial actif :
 *  - Indemnité = 1 trimestre de salaire → Charges exceptionnelles + Trésorerie
 *  - Retire le commercial de cartesActives (arrêt des salaires et des clients)
 *
 * Pédagogie : l'indemnité passe en Charges exceptionnelles (cpt 671),
 * pas en Charges de personnel (641) — distinction importante en comptabilité française.
 */
export function licencierCommercial(
  etat: EtatJeu,
  joueurIdx: number,
  carteId: string
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const commercial = joueur.cartesActives.find((c) => c.id === carteId && c.categorie === "commercial");

  if (!commercial) {
    return { succes: false, messageErreur: "Commercial introuvable.", modifications: [] };
  }

  // Indemnité = absolu du premier effet trésorerie dans effetsImmédiats (= 1 trimestre de salaire)
  const indemniteBrut = commercial.effetsImmédiats
    .filter((e) => e.poste === "tresorerie")
    .reduce((s, e) => s + Math.abs(e.delta), 0);

  // Si la carte ne stocke pas d'effetsImmédiats (cartes clonées sans coût), fallback sur effetsRecurrents
  const indemnite = indemniteBrut > 0
    ? indemniteBrut
    : commercial.effetsRecurrents
        .filter((e) => e.poste === "chargesPersonnel")
        .reduce((s, e) => s + Math.abs(e.delta), 0);

  const modifications: ResultatAction["modifications"] = [];
  const push = makePush(joueur, modifications);

  if (indemnite > 0) {
    push("chargesExceptionnelles", indemnite, `Indemnité de licenciement — ${commercial.titre} : +${indemnite} charges exceptionnelles`);
    push("tresorerie", -indemnite, `Indemnité de licenciement — ${commercial.titre} : -${indemnite} trésorerie`);
  }

  // Retrait du commercial de cartesActives
  joueur.cartesActives = joueur.cartesActives.filter((c) => c.id !== carteId);

  return { succes: true, modifications };
}

// ─── ÉTAPE 4 : Traitement carte Client ───────────────────────
/**
 * Comptabilisation en 4 écritures (partie double complète).
 * Ordre narratif optimisé pour la pédagogie :
 *   Acte 1 — Encaissement (Trésorerie/Créances) : le plus tangible
 *   Acte 2 — Chiffre d'affaires (Ventes)         : la contrepartie produit
 *   Acte 3 — Livraison (Stocks −1 unité)          : la sortie physique
 *   Acte 4 — Coût de revient (Achats/CMV)         : la contrepartie charge
 *
 * Chaque modification porte un saleGroupId + saleClientLabel + saleActIndex
 * pour permettre à l'UI de regrouper et narrer les ventes.
 */
export function appliquerCarteClient(
  etat: EtatJeu,
  joueurIdx: number,
  carteClient: CarteClient,
  saleGroupIndex?: number
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];
  const push = makePush(joueur, modifications);

  const stocks = getTotalStocks(joueur);
  if (stocks < PRIX_UNITAIRE_MARCHANDISE) {
    return {
      succes: false,
      messageErreur:
        "Stock insuffisant ! Vous devez acheter des marchandises (étape 1) avant de vendre.",
      modifications,
    };
  }

  const montant = carteClient.montantVentes;
  const groupId = `vente-${saleGroupIndex ?? 0}`;
  const clientLabel = carteClient.titre;

  // Spécialité Véloce Transports (Logistique) : livraison rapide → délai réduit de 1
  const delaiEffectif = joueur.entreprise.nom === "Véloce Transports"
    ? Math.max(0, carteClient.delaiPaiement - 1) as 0 | 1 | 2
    : carteClient.delaiPaiement;

  // ACTE 1 — Encaissement selon délai (le plus tangible)
  if (delaiEffectif === 0) {
    const label = carteClient.delaiPaiement > 0 && joueur.entreprise.nom === "Véloce Transports"
      ? `🚀 Livraison rapide — encaissement accéléré : +${montant} € en caisse`
      : `Le client paie comptant : +${montant} € en caisse`;
    push("tresorerie", montant, label, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 1 });
  } else if (delaiEffectif === 1) {
    const label = carteClient.delaiPaiement > 1 && joueur.entreprise.nom === "Véloce Transports"
      ? `🚀 Livraison rapide — créance accélérée : +${montant} € (C+1 au lieu de C+2)`
      : `Le client paiera dans 1 trimestre : +${montant} € en créance C+1`;
    push("creancesPlus1", montant, label, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 1 });
  } else {
    push("creancesPlus2", montant, `Le client paiera dans 2 trimestres : +${montant} € en créance C+2`, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 1 });
  }

  // ACTE 2 — Chiffre d'affaires (Ventes)
  push("ventes", montant, `Vente enregistrée au chiffre d'affaires : +${montant} €`, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 2 });

  // ACTE 3 — Sortie du stock (livraison de la marchandise)
  push("stocks", -PRIX_UNITAIRE_MARCHANDISE, `Marchandise livrée au client : −${PRIX_UNITAIRE_MARCHANDISE} € de stock`, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 3 });

  // ACTE 4 — Coût de la marchandise vendue (CMV)
  push("achats", PRIX_UNITAIRE_MARCHANDISE, `Coût de la marchandise vendue (CMV) enregistré en charges : +${PRIX_UNITAIRE_MARCHANDISE} €`, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 4 });

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

// ─── ÉTAPE 5bis : Spécialité d'entreprise (effets passifs) ────

/**
 * Applique les effets passifs liés à la spécialité de l'entreprise.
 * Appelé à chaque tour, à l'étape 5, après les effets récurrents des cartes.
 *
 * ── Effets par entreprise ──────────────────────────────────────
 * • Manufacture Belvaux (Production) : +1 productionStockée, +1 stocks
 * • Véloce Transports (Logistique)   : délai encaissement -1 (géré dans appliquerCarteClient)
 * • Azura Commerce (Commerce)        : +1 client Particulier automatique (ajouté à clientsATrait)
 * • Synergia Lab (Innovation)        : +1 produitsFinanciers, +1 trésorerie
 */
export function appliquerSpecialiteEntreprise(
  etat: EtatJeu,
  joueurIdx: number
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];

  // 1. Effets passifs déclarés dans le template (Orange, Verte)
  const template = ENTREPRISES.find((e) => e.nom === joueur.entreprise.nom);
  if (template?.effetsPassifs) {
    for (const effet of template.effetsPassifs) {
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
        explication: `${template.specialite} — spécialité ${template.type}`,
      });
    }
  }

  // Note : Véloce Transports (délai -1) est géré directement dans appliquerCarteClient()
  // Note : Azura Commerce (+1 client) est géré dans genererClientsSpecialite() à l'étape 3

  return { succes: true, modifications };
}

/**
 * Génère les clients bonus liés à la spécialité d'entreprise.
 * Appelé à l'étape 3, en même temps que genererClientsParCommerciaux.
 *
 * • Azura Commerce : +1 client Particulier automatique par tour
 */
export function genererClientsSpecialite(joueur: Joueur): CarteClient[] {
  if (joueur.entreprise.nom === "Azura Commerce") {
    const clientParticulier = CARTES_CLIENTS.find((c) => c.id === "client-particulier");
    return clientParticulier ? [clientParticulier] : [];
  }
  return [];
}

// ─── ÉTAPE 6 : Recrutement garanti (toujours disponible) ────

/**
 * Retourne les cartes commerciales que le joueur peut encore recruter.
 * Aucun commercial n'est distribué automatiquement — le joueur choisit librement.
 * Disponible tout au long du jeu : les 3 types (Junior, Senior, Directrice) restent
 * recrutables à chaque tour, y compris en doublon (plusieurs juniors possibles, etc.).
 */
export function obtenirCarteRecrutement(_etat: EtatJeu, _joueurIdx: number): CarteDecision[] {
  return CARTES_DECISION.filter((c) => c.categorie === "commercial");
}

// ─── ÉTAPE 6 : Pioche Décision (hors commerciaux) ───────────

/**
 * Tire nb cartes de la pioche (les cartes commerciales sont exclues :
 * elles passent par obtenirCarteRecrutement ci-dessus).
 * Le nombre minimum garanti est 4 cartes.
 */
export function tirerCartesDecision(etat: EtatJeu, nb: number = 3): CarteDecision[] {
  // Recharger la pioche AVANT le tirage si insuffisante
  if (etat.piocheDecision.length < nb) {
    etat.piocheDecision.push(
      ...melangerTableau(CARTES_DECISION.filter((c) => c.categorie !== "commercial"))
    );
  }
  return etat.piocheDecision.splice(0, nb);
}

export function acheterCarteDecision(
  etat: EtatJeu,
  joueurIdx: number,
  carte: CarteDecision
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const modifications: ResultatAction["modifications"] = [];

  // Garde anti-doublon uniquement pour les cartes non-commerciales
  // Les commerciaux peuvent être recrutés plusieurs fois (plusieurs juniors, etc.)
  if (carte.categorie !== "commercial" && joueur.cartesActives.some((a) => a.id === carte.id)) {
    return {
      succes: false,
      messageErreur: `Vous avez déjà la carte "${carte.titre}" active.`,
      modifications: [],
    };
  }

  // Pour les commerciaux, cloner la carte avec un ID unique afin de tracer chaque recrue
  if (carte.categorie === "commercial") {
    carte = { ...carte, id: `${carte.id}-${_nextCommercialId++}` };
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
  if (carte.id === CARTE_IDS.FORMATION) {
    const clientGC = CARTES_CLIENTS.find((c) => c.id === "client-grand-compte");
    if (clientGC) joueur.clientsATrait.push(clientGC);
  }

  // Remboursement anticipé : solder les emprunts restants
  if (carte.id === CARTE_IDS.REMBOURSEMENT_ANTICIPE) {
    const emprunts = joueur.bilan.passifs.find((p) => p.categorie === "emprunts");
    if (emprunts && emprunts.valeur > 0) {
      const { ancienneValeur: tresoAncienne, nouvelleValeur: tresoNouvelle } = appliquerDeltaPoste(
        joueur, "tresorerie", -emprunts.valeur
      );
      modifications.push({
        joueurId: joueur.id, poste: "tresorerie",
        ancienneValeur: tresoAncienne, nouvelleValeur: tresoNouvelle,
        explication: `Remboursement anticipé : trésorerie −${emprunts.valeur} (capital restant dû)`,
      });
      const { ancienneValeur: empruntAncien, nouvelleValeur: empruntNouveau } = appliquerDeltaPoste(
        joueur, "emprunts", -emprunts.valeur
      );
      modifications.push({
        joueurId: joueur.id, poste: "emprunts",
        ancienneValeur: empruntAncien, nouvelleValeur: empruntNouveau,
        explication: `Remboursement anticipé : dette financière soldée −${emprunts.valeur}`,
      });
    }
    // Retirer la carte (usage unique)
    joueur.cartesActives = joueur.cartesActives.filter((c) => c.id !== CARTE_IDS.REMBOURSEMENT_ANTICIPE);
  }

  // Levée de fonds : usage unique
  if (carte.id === CARTE_IDS.LEVEE_DE_FONDS) {
    joueur.cartesActives = joueur.cartesActives.filter((c) => c.id !== CARTE_IDS.LEVEE_DE_FONDS);
  }

  return { succes: true, modifications };
}

// ─── INVESTISSEMENT MINI-DECK LOGISTIQUE ─────────────────────

/**
 * Investit dans une carte du mini-deck logistique personnel du joueur.
 * Vérifie le prérequis, retire la carte de piochePersonnelle, applique les effets immédiats.
 */
export function investirCartePersonnelle(
  etat: EtatJeu,
  joueurIdx: number,
  carteId: string
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const carteIdx = joueur.piochePersonnelle.findIndex((c) => c.id === carteId);

  if (carteIdx === -1) {
    return {
      succes: false,
      messageErreur: `Carte "${carteId}" introuvable dans votre mini-deck.`,
      modifications: [],
    };
  }

  const carte = joueur.piochePersonnelle[carteIdx];

  // Vérification du prérequis
  if (carte.prerequis && !joueur.cartesActives.some((c) => c.id === carte.prerequis)) {
    const carteRequise = joueur.piochePersonnelle.find((c) => c.id === carte.prerequis);
    const nomRequis = carteRequise?.titre ?? carte.prerequis;
    return {
      succes: false,
      messageErreur: `Prérequis non atteint : investissez d'abord dans "${nomRequis}".`,
      modifications: [],
    };
  }

  const modifications: ResultatAction["modifications"] = [];

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
      explication: `${carte.titre} — investissement logistique`,
    });
  }

  // Retirer de piochePersonnelle, ajouter à cartesActives
  joueur.piochePersonnelle = joueur.piochePersonnelle.filter((_, i) => i !== carteIdx);
  joueur.cartesActives.push(carte);

  return { succes: true, modifications };
}

// ─── VENTE D'IMMOBILISATION (CESSION D'OCCASION) ─────────────

/**
 * Vend une immobilisation nommée du bilan du joueur (cession d'occasion).
 * Calcule la plus ou moins-value comptable et l'enregistre au compte de résultat.
 *
 * Règles comptables (PCG simplifié) :
 *  - Le bien "Autres Immobilisations" est un poste agrégé non vendable individuellement.
 *  - VNC = valeur nette comptable = valeur actuelle au bilan
 *    (les amortissements la décrémentent directement à chaque tour).
 *  - Vente autorisée même si VNC = 0 (bien totalement amorti).
 *  - Plus-value (prixCession > VNC) → +revenusExceptionnels (produit exceptionnel).
 *  - Moins-value (prixCession < VNC) → +chargesExceptionnelles (charge exceptionnelle).
 *  - Le bien est retiré définitivement du bilan après cession.
 *
 * @param prixCession Prix de vente accepté par l'apprenant (proposé par défaut à 80% VNC).
 */
export function vendreImmobilisation(
  etat: EtatJeu,
  joueurIdx: number,
  nomImmo: string,
  prixCession: number
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];

  if (nomImmo === "Autres Immobilisations") {
    return {
      succes: false,
      messageErreur: `"Autres Immobilisations" est un poste agrégé et ne peut pas être vendu individuellement.`,
      modifications: [],
    };
  }

  if (prixCession < 0 || !Number.isFinite(prixCession)) {
    return {
      succes: false,
      messageErreur: `Le prix de cession doit être un nombre positif ou nul.`,
      modifications: [],
    };
  }

  const idx = joueur.bilan.actifs.findIndex(
    (a) => a.nom === nomImmo && a.categorie === "immobilisations"
  );
  if (idx === -1) {
    return {
      succes: false,
      messageErreur: `Immobilisation "${nomImmo}" introuvable au bilan.`,
      modifications: [],
    };
  }

  const actif = joueur.bilan.actifs[idx];
  const vnc = actif.valeur;
  const plusValue = prixCession - vnc;

  const modifications: ResultatAction["modifications"] = [];

  // 1. Encaissement du prix de cession en trésorerie (DÉBIT 512 Banque)
  const tresoActif = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie");
  if (tresoActif) {
    const old = tresoActif.valeur;
    tresoActif.valeur = old + prixCession;
    modifications.push({
      joueurId: joueur.id,
      poste: "tresorerie",
      ancienneValeur: old,
      nouvelleValeur: tresoActif.valeur,
      explication: `Cession ${nomImmo} : encaissement ${prixCession} €`,
    });
  }

  // 2. Sortie du bien du bilan (CRÉDIT 21x Immobilisations — VNC effacée)
  modifications.push({
    joueurId: joueur.id,
    poste: "immobilisations",
    ancienneValeur: vnc,
    nouvelleValeur: 0,
    explication: `Cession ${nomImmo} : sortie du bilan, VNC ${vnc} € effacée`,
  });
  joueur.bilan.actifs.splice(idx, 1);

  // 3. Plus ou moins-value comptable au compte de résultat
  if (plusValue > 0) {
    const old = joueur.compteResultat.produits.revenusExceptionnels;
    joueur.compteResultat.produits.revenusExceptionnels = old + plusValue;
    modifications.push({
      joueurId: joueur.id,
      poste: "revenusExceptionnels",
      ancienneValeur: old,
      nouvelleValeur: joueur.compteResultat.produits.revenusExceptionnels,
      explication: `Plus-value de cession ${nomImmo} : +${plusValue} € (prix ${prixCession} − VNC ${vnc})`,
    });
  } else if (plusValue < 0) {
    const moinsValue = Math.abs(plusValue);
    const old = joueur.compteResultat.charges.chargesExceptionnelles;
    joueur.compteResultat.charges.chargesExceptionnelles = old + moinsValue;
    modifications.push({
      joueurId: joueur.id,
      poste: "chargesExceptionnelles",
      ancienneValeur: old,
      nouvelleValeur: joueur.compteResultat.charges.chargesExceptionnelles,
      explication: `Moins-value de cession ${nomImmo} : +${moinsValue} € en charges exceptionnelles (prix ${prixCession} < VNC ${vnc})`,
    });
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
  const hasAssurance = joueur.cartesActives.some((c) => c.id === CARTE_IDS.ASSURANCE_PREVOYANCE);
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
  // Écriture en partie double :
  //   DÉBIT  661 Charges d'intérêts    → réduit le Résultat net (PASSIF−)
  //   CRÉDIT 5191 Découvert bancaire   → augmente le découvert  (PASSIF+)
  // Les deux effets se compensent : l'équilibre ACTIF = PASSIF + RÉSULTAT est préservé.
  if (joueur.bilan.decouvert > DECOUVERT_MAX) {
    const pénalité = joueur.bilan.decouvert - DECOUVERT_MAX;
    appliquerDeltaPoste(joueur, "chargesInteret", pénalité); // DÉBIT charges
    appliquerDeltaPoste(joueur, "decouvert", pénalité);      // CRÉDIT découvert (contrepartie)
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
      : `⚠️ Bilan déséquilibré de ${Math.abs(ecart).toFixed(0)} €. Vérifiez vos écritures.`,
  };
}

// ─── FIN D'ANNÉE (après 4 tours) ─────────────────────────────
//
// ⚠️ NOTE PÉDAGOGIQUE : le découvert bancaire n'est PAS remis à zéro en clôture annuelle.
// C'est un choix intentionnel : en comptabilité réelle, un découvert est une dette bancaire
// qui persiste tant qu'elle n'est pas remboursée. Les étudiants doivent comprendre que
// le découvert s'accumule d'un exercice à l'autre et génère des agios croissants.

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

    // Clôture exercice : garder les commerciaux + investissements long terme actifs
    // Supprimer uniquement les cartes tactiques (usage court terme) et financement (usage unique)
    joueur.cartesActives = joueur.cartesActives.filter(
      (c) => c.categorie !== "tactique" && c.categorie !== "financement"
    );

    // Réinitialiser clients à traiter et clients perdus ce tour
    joueur.clientsATrait = [];
    joueur.clientsPerdusCeTour = 0;
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

// ─── DEMANDE D'EMPRUNT BANCAIRE ──────────────────────────────

/**
 * Le banquier score la situation financière du joueur sur 100 points.
 * - Score >= 65 : accepté, taux standard 5%/an
 * - Score 50-64 : accepté avec taux majoré 8%/an
 * - Score < 50  : refusé
 *
 * Si le prêt est accordé, les fonds sont versés immédiatement :
 *   DÉBIT Trésorerie / CRÉDIT Emprunts
 */
export function demanderEmprunt(
  etat: EtatJeu,
  joueurIdx: number,
  montant: number
): { resultat: ResultatDemandePret; modifications: ResultatAction["modifications"] } {
  const joueur = etat.joueurs[joueurIdx];
  const resultat = scorerDemandePret(joueur, montant, etat.tourActuel);
  const modifications: ResultatAction["modifications"] = [];

  if (!resultat.accepte) {
    return { resultat, modifications };
  }

  const push = makePush(joueur, modifications);

  const tauxLabel = resultat.tauxMajore ? "8%/an (taux majoré)" : "5%/an (taux standard)";
  push("tresorerie", montant, `Versement emprunt bancaire : +${montant} trésorerie`);
  push("emprunts", montant, `Nouvel emprunt bancaire de ${montant} — taux ${tauxLabel}`);

  return { resultat, modifications };
}

// ─── CAPACITÉ LOGISTIQUE ──────────────────────────────────────

/**
 * Calcule la capacité logistique maximale du joueur.
 * Formule : CAPACITE_BASE + somme des bonus des immobilisations actives
 *
 * Les immobilisations restent fonctionnelles même quand VNC = 0 (amortie).
 * On identifie les immobilisations via les cartes actives du joueur.
 */
export function calculerCapaciteLogistique(joueur: Joueur): number {
  let capacite = CAPACITE_BASE;
  const nomEntreprise = joueur.entreprise.nom;

  for (const carte of joueur.cartesActives) {
    // Vérifier s'il existe un bonus spécifique à l'entreprise
    const bonusParEntreprise = CAPACITE_IMMOBILISATION_PAR_ENTREPRISE[carte.id];
    if (bonusParEntreprise && bonusParEntreprise[nomEntreprise] !== undefined) {
      capacite += bonusParEntreprise[nomEntreprise]!;
    } else {
      const bonus = CAPACITE_IMMOBILISATION[carte.id] ?? 0;
      capacite += bonus;
    }
  }

  return capacite;
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
      clients.push(clientCarte);
    }
  }
  return clients;
}
