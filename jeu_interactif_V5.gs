/**
 * ============================================================
 * JE DEVIENS PATRON — Version 5 (Google Apps Script)
 * Portage fidèle de packages/game-engine (TypeScript)
 * Auteur : Pierre Médan (profmedan@gmail.com) — Avril 2026
 * ============================================================
 *
 * DONNÉES : exactes depuis entreprises.ts, types.ts, cartes.ts
 * CONFIG  : surchargeables depuis la feuille "Paramètres"
 * ÉTAT    : persisté en JSON dans PropertiesService
 * MODE    : solo (1 formateur, 1 entreprise)
 *
 * FEUILLES :
 *   "Tableau de bord"  — Dashboard principal
 *   "Paramètres"       — Valeurs modifiables par Pierre
 *   "Historique"       — Log trimestriel
 * ============================================================
 */

// ============================================================
// § 1. CONSTANTES PAR DÉFAUT  (ne PAS modifier — source TS)
// ============================================================

var CFG_DEFAULTS = {
  // Ventes par type de client (cartes.ts — CARTES_CLIENTS)
  PARTICULIER_VENTES:         2000,  // paiement immédiat
  TPE_VENTES:                 3000,  // créance C+1
  GRAND_COMPTE_VENTES:        4000,  // créance C+2

  // Salaires commerciaux/trim (cartes.ts — CARTES_COMMERCIAUX)
  JUNIOR_SALAIRE:             1000,
  SENIOR_SALAIRE:             2000,
  DIRECTRICE_SALAIRE:         3000,

  // Charges fixes (types.ts — CHARGES_FIXES_PAR_TOUR)
  CHARGES_FIXES:              2000,

  // Bilan initial commun (entreprises.ts)
  TRESORERIE_INITIALE:        8000,
  STOCKS_INITIAUX:            4000,

  // Capacité logistique (types.ts — CAPACITE_BASE)
  CAPACITE_BASE:              4,

  // ── Constantes non modifiables (types.ts) ────────────────
  DECOUVERT_MAX:              8000,
  REMBOURSEMENT_EMPRUNT:      1000,
  TAUX_INTERET_ANNUEL:        5,      // % /an, prélevé trimestre 1, 5, 9...
  AGIOS_TAUX:                 10,     // % /trim sur découvert
  AMORTISSEMENT_PAR_BIEN:     1000,   // €/bien/trim
  REMBOURSEMENT_DECOUVERT_MAX:2000,   // max remboursement découvert/trim
};

// ============================================================
// § 2. LECTURE CONFIG DEPUIS LA FEUILLE "Paramètres"
// ============================================================

function getConfig() {
  var cfg = {};
  // Copier les defaults
  for (var k in CFG_DEFAULTS) cfg[k] = CFG_DEFAULTS[k];

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName("Paramètres");
    if (!sh) return cfg;

    // Colonne C = valeur Pierre (ligne 2 à 11)
    var MAP = {
      "PARTICULIER_VENTES":     2,
      "TPE_VENTES":             3,
      "GRAND_COMPTE_VENTES":    4,
      "JUNIOR_SALAIRE":         5,
      "SENIOR_SALAIRE":         6,
      "DIRECTRICE_SALAIRE":     7,
      "CHARGES_FIXES":          8,
      "TRESORERIE_INITIALE":    9,
      "STOCKS_INITIAUX":        10,
      "CAPACITE_BASE":          11,
    };
    for (var key in MAP) {
      var row = MAP[key];
      var val = sh.getRange(row, 3).getValue(); // colonne C = votre valeur
      if (val !== "" && !isNaN(Number(val))) {
        cfg[key] = Number(val);
      }
    }
  } catch(e) { /* feuille absente → defaults */ }
  return cfg;
}

// ============================================================
// § 3. DONNÉES ENTREPRISES  (entreprises.ts — valeurs exactes)
// ============================================================

function getEntreprises(cfg) {
  return {
    "Manufacture Belvaux": {
      icon: "🏭", couleur: "#e8751a", type: "Production",
      specialite: "⚡ Produit à chaque tour",
      description: "Industrie manufacturière. Produit 1 000€ de stock supplémentaire par trimestre.",
      actifs: [
        {nom:"Entrepôt",               valeur:8000,                   categorie:"immobilisations"},
        {nom:"Camionnette",            valeur:8000,                   categorie:"immobilisations"},
        {nom:"Autres Immobilisations", valeur:0,                      categorie:"immobilisations"},
        {nom:"Stocks",                 valeur:cfg.STOCKS_INITIAUX,    categorie:"stocks"},
        {nom:"Trésorerie",             valeur:cfg.TRESORERIE_INITIALE,categorie:"tresorerie"},
      ],
      passifs: [
        {nom:"Capitaux propres",    valeur:20000, categorie:"capitaux"},
        {nom:"Emprunts",            valeur:8000,  categorie:"emprunts"},
        {nom:"Dettes fournisseurs", valeur:0,     categorie:"dettes"},
      ],
      effetsPassifs: [
        {poste:"productionStockee", delta:1000},
        {poste:"stocks",            delta:1000},
      ],
    },

    "Véloce Transports": {
      icon: "🚚", couleur: "#7b2d8b", type: "Logistique",
      specialite: "🚀 Livraison rapide",
      description: "Transport & logistique. Encaissement accéléré : TPE→immédiat, Grand Compte→C+1.",
      actifs: [
        {nom:"Camion",                 valeur:10000,                  categorie:"immobilisations"},
        {nom:"Machine",                valeur:6000,                   categorie:"immobilisations"},
        {nom:"Autres Immobilisations", valeur:0,                      categorie:"immobilisations"},
        {nom:"Stocks",                 valeur:cfg.STOCKS_INITIAUX,    categorie:"stocks"},
        {nom:"Trésorerie",             valeur:cfg.TRESORERIE_INITIALE,categorie:"tresorerie"},
      ],
      passifs: [
        {nom:"Capitaux propres",    valeur:20000, categorie:"capitaux"},
        {nom:"Emprunts",            valeur:8000,  categorie:"emprunts"},
        {nom:"Dettes fournisseurs", valeur:0,     categorie:"dettes"},
      ],
      effetsPassifs: [], // délai -1 géré dans etape3et4()
    },

    "Azura Commerce": {
      icon: "🏪", couleur: "#1565c0", type: "Commerce",
      specialite: "👥 Attire les particuliers",
      description: "Commerce de détail. +1 client Particulier automatique par trimestre.",
      actifs: [
        {nom:"Showroom",               valeur:8000,                   categorie:"immobilisations"},
        {nom:"Voiture",                valeur:8000,                   categorie:"immobilisations"},
        {nom:"Autres Immobilisations", valeur:0,                      categorie:"immobilisations"},
        {nom:"Stocks",                 valeur:cfg.STOCKS_INITIAUX,    categorie:"stocks"},
        {nom:"Trésorerie",             valeur:cfg.TRESORERIE_INITIALE,categorie:"tresorerie"},
      ],
      passifs: [
        {nom:"Capitaux propres",    valeur:20000, categorie:"capitaux"},
        {nom:"Emprunts",            valeur:8000,  categorie:"emprunts"},
        {nom:"Dettes fournisseurs", valeur:0,     categorie:"dettes"},
      ],
      effetsPassifs: [], // +1 Particulier géré dans etape3et4()
    },

    "Synergia Lab": {
      icon: "💡", couleur: "#2e7d32", type: "Innovation",
      specialite: "💎 Revenus de licence",
      description: "Innovation & R&D. +1 000€ de produits financiers et trésorerie par trimestre.",
      actifs: [
        {nom:"Brevet",                 valeur:8000,                   categorie:"immobilisations"},
        {nom:"Matériel informatique",  valeur:5000,                   categorie:"immobilisations"},
        {nom:"Autres Immobilisations", valeur:0,                      categorie:"immobilisations"},
        {nom:"Stocks",                 valeur:cfg.STOCKS_INITIAUX,    categorie:"stocks"},
        {nom:"Trésorerie",             valeur:cfg.TRESORERIE_INITIALE,categorie:"tresorerie"},
      ],
      passifs: [
        {nom:"Capitaux propres",    valeur:17000, categorie:"capitaux"},
        {nom:"Emprunts",            valeur:8000,  categorie:"emprunts"},
        {nom:"Dettes fournisseurs", valeur:0,     categorie:"dettes"},
      ],
      effetsPassifs: [
        {poste:"produitsFinanciers", delta:1000},
        {poste:"tresorerie",         delta:1000},
      ],
    },
  };
}

// ============================================================
// § 4. CARTES COMMERCIAUX  (cartes.ts — CARTES_COMMERCIAUX)
// ============================================================

function getCartesCommerciaux(cfg) {
  return [
    {
      id:"junior", titre:"Commercial Junior",
      salaire:cfg.JUNIOR_SALAIRE,
      typeClient:"particulier", nbClients:2,
      description:"Salaire "+cfg.JUNIOR_SALAIRE+"€/trim — génère 2 clients Particuliers/trim",
    },
    {
      id:"senior", titre:"Commercial Senior",
      salaire:cfg.SENIOR_SALAIRE,
      typeClient:"tpe", nbClients:2,
      description:"Salaire "+cfg.SENIOR_SALAIRE+"€/trim — génère 2 clients TPE/trim (C+1)",
    },
    {
      id:"directrice", titre:"Directrice Commerciale",
      salaire:cfg.DIRECTRICE_SALAIRE,
      typeClient:"grand_compte", nbClients:2,
      description:"Salaire "+cfg.DIRECTRICE_SALAIRE+"€/trim — génère 2 Grands Comptes/trim (C+2)",
    },
  ];
}

// ============================================================
// § 5. CARTES DÉCISION  (sélection principale — cartes.ts)
// ============================================================

function getCartesDecision() {
  return [
    // ── VÉHICULES ────────────────────────────────────────────
    {id:"camionnette", titre:"Camionnette", categorie:"vehicule",
     description:"Immos +8 000€, Tréso -8 000€. Entretien +1 000€/trim. +1 Particulier/trim. Capacité +6.",
     effetsImmediat:[{poste:"immobilisations",delta:8000},{poste:"tresorerie",delta:-8000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"particulier", nbClientsParTour:1, bonusCapacite:6},

    {id:"berline", titre:"Berline", categorie:"vehicule",
     description:"Immos +8 000€, Tréso -8 000€. Entretien +2 000€/trim. +1 carte Décision piochée/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:8000},{poste:"tresorerie",delta:-8000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:2000},{poste:"tresorerie",delta:-2000}],
     bonusCartesDecision:1},

    {id:"velo-cargo", titre:"Vélo Cargo Électrique", categorie:"vehicule",
     description:"Immos +3 000€, Tréso -3 000€. Aucune charge récurrente. +1 Particulier/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:3000},{poste:"tresorerie",delta:-3000}],
     effetsRecurrents:[],
     clientParTour:"particulier", nbClientsParTour:1},

    {id:"fourgon-refrigere", titre:"Fourgon Réfrigéré", categorie:"vehicule",
     description:"Immos +6 000€, Tréso -6 000€. Entretien +2 000€/trim. +1 TPE/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:6000},{poste:"tresorerie",delta:-6000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:2000},{poste:"tresorerie",delta:-2000}],
     clientParTour:"tpe", nbClientsParTour:1},

    // ── INVESTISSEMENTS ──────────────────────────────────────
    {id:"site-internet", titre:"Site Internet", categorie:"investissement",
     description:"Immos +4 000€, Tréso -4 000€. Maintenance +1 000€/trim. +1 Particulier/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:4000},{poste:"tresorerie",delta:-4000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"particulier", nbClientsParTour:1},

    {id:"application-mobile", titre:"Application Mobile", categorie:"investissement",
     description:"Immos +4 000€, Tréso -4 000€. Hébergement +1 000€/trim. +2 Particuliers/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:4000},{poste:"tresorerie",delta:-4000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"particulier", nbClientsParTour:2},

    {id:"expansion", titre:"Expansion", categorie:"investissement",
     description:"Immos +8 000€, Tréso -8 000€. Maintenance +1 000€/trim. +1 Grand Compte/trim. Capacité +4.",
     effetsImmediat:[{poste:"immobilisations",delta:8000},{poste:"tresorerie",delta:-8000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"grand_compte", nbClientsParTour:1, bonusCapacite:4},

    {id:"certification-iso", titre:"Certification ISO 9001", categorie:"investissement",
     description:"Immos +5 000€, Tréso -5 000€. Maintien +1 000€/trim. +1 Grand Compte/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:5000},{poste:"tresorerie",delta:-5000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"grand_compte", nbClientsParTour:1},

    {id:"rse", titre:"RSE", categorie:"investissement",
     description:"Immos +2 000€, Emprunts +2 000€ (sans sortie tréso). Charges RSE +1 000€/trim. +1 Particulier/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:2000},{poste:"emprunts",delta:2000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"particulier", nbClientsParTour:1},

    {id:"entrepot-automatise", titre:"Entrepôt Automatisé", categorie:"investissement",
     description:"Immos +8 000€, Tréso -8 000€. Énergie +1 000€/trim. +1 Grand Compte/trim. Capacité +10.",
     effetsImmediat:[{poste:"immobilisations",delta:8000},{poste:"tresorerie",delta:-8000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"grand_compte", nbClientsParTour:1, bonusCapacite:10},

    {id:"erp", titre:"ERP / Logiciel de Gestion", categorie:"investissement",
     description:"Immos +5 000€, Tréso -5 000€. Maintenance +1 000€/trim. +1 Grand Compte/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:5000},{poste:"tresorerie",delta:-5000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"grand_compte", nbClientsParTour:1},

    {id:"label-qualite", titre:"Label Qualité / Bio", categorie:"investissement",
     description:"Immos +4 000€, Tréso -4 000€. Audits +1 000€/trim. +1 TPE/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:4000},{poste:"tresorerie",delta:-4000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"tpe", nbClientsParTour:1},

    {id:"marketplace", titre:"Marketplace en Ligne", categorie:"investissement",
     description:"Immos +4 000€, Tréso -4 000€. Commissions +1 000€/trim. +2 Particuliers/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:4000},{poste:"tresorerie",delta:-4000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"particulier", nbClientsParTour:2},

    // ── FINANCEMENT ──────────────────────────────────────────
    {id:"pret-bancaire", titre:"Prêt Bancaire", categorie:"financement",
     description:"Tréso +5 000€, Emprunts +5 000€. Intérêts +1 000€/trim.",
     effetsImmediat:[{poste:"tresorerie",delta:5000},{poste:"emprunts",delta:5000}],
     effetsRecurrents:[{poste:"chargesInteret",delta:1000},{poste:"tresorerie",delta:-1000}]},

    {id:"levee-de-fonds", titre:"Levée de Fonds", categorie:"financement",
     description:"Tréso +6 000€, Capitaux +6 000€. Frais dossier 3 000€. Carte unique.",
     effetsImmediat:[
       {poste:"servicesExterieurs",delta:3000},{poste:"tresorerie",delta:-3000},
       {poste:"tresorerie",delta:6000},{poste:"capitaux",delta:6000},
     ],
     effetsRecurrents:[], unique:true},

    {id:"crowdfunding", titre:"Crowdfunding", categorie:"financement",
     description:"Tréso +4 000€, Capitaux +4 000€. Frais plateforme +1 000€/trim.",
     effetsImmediat:[{poste:"tresorerie",delta:4000},{poste:"capitaux",delta:4000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}]},

    {id:"credit-bail", titre:"Crédit-Bail (Leasing)", categorie:"financement",
     description:"Immos +6 000€, Emprunts +6 000€ (sans apport). Loyers +2 000€/trim. +1 TPE/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:6000},{poste:"emprunts",delta:6000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:2000},{poste:"tresorerie",delta:-2000}],
     clientParTour:"tpe", nbClientsParTour:1},

    // ── TACTIQUE ─────────────────────────────────────────────
    {id:"publicite", titre:"Publicité", categorie:"tactique",
     description:"Campagne publicitaire. Coût +2 000€/trim. +2 clients Particuliers/trim.",
     effetsImmediat:[],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:2000},{poste:"tresorerie",delta:-2000}],
     clientParTour:"particulier", nbClientsParTour:2},

    {id:"programme-fidelite", titre:"Programme de Fidélité", categorie:"tactique",
     description:"Immos +3 000€, Tréso -3 000€. Gestion +1 000€/trim. +1 Particulier/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:3000},{poste:"tresorerie",delta:-3000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     clientParTour:"particulier", nbClientsParTour:1},

    {id:"export-international", titre:"Export International", categorie:"tactique",
     description:"Immos +5 000€, Tréso -5 000€. Déplacements +2 000€/trim. +1 Grand Compte/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:5000},{poste:"tresorerie",delta:-5000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:2000},{poste:"tresorerie",delta:-2000}],
     clientParTour:"grand_compte", nbClientsParTour:1},

    {id:"sous-traitance", titre:"Sous-traitance", categorie:"tactique",
     description:"Stocks +2 000€/trim livrés. Coût : Tréso -4 000€ + Services ext. +2 000€.",
     effetsImmediat:[],
     effetsRecurrents:[{poste:"stocks",delta:2000},{poste:"tresorerie",delta:-4000},{poste:"servicesExterieurs",delta:2000}]},

    {id:"optimisation-lean", titre:"Optimisation Lean", categorie:"tactique",
     description:"Immos +3 000€, Tréso -3 000€. CMV réduit -1 000€/trim. Stocks préservés +1 000€/trim.",
     effetsImmediat:[{poste:"immobilisations",delta:3000},{poste:"tresorerie",delta:-3000}],
     effetsRecurrents:[{poste:"achats",delta:-1000},{poste:"stocks",delta:1000}]},

    // ── SERVICE ──────────────────────────────────────────────
    {id:"affacturage", titre:"Affacturage", categorie:"service",
     description:"Toutes créances converties en trésorerie immédiatement. Coût +2 000€/trim.",
     effetsImmediat:[],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:2000},{poste:"tresorerie",delta:-2000}],
     affacturage:true},

    {id:"maintenance-preventive", titre:"Maintenance Préventive", categorie:"service",
     description:"Tréso -2 000€ initial. Abonnement +1 000€/trim. Amortissements réduits -1 000€/trim.",
     effetsImmediat:[{poste:"tresorerie",delta:-2000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000},{poste:"dotationsAmortissements",delta:-1000}]},

    // ── PROTECTION ───────────────────────────────────────────
    {id:"assurance-prevoyance", titre:"Assurance Prévoyance", categorie:"protection",
     description:"Immos +2 000€, Tréso -2 000€. Prime +1 000€/trim. Annule événements négatifs assurables.",
     effetsImmediat:[{poste:"immobilisations",delta:2000},{poste:"tresorerie",delta:-2000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}],
     annuleEvenements:true},

    {id:"cybersecurite", titre:"Cybersécurité", categorie:"protection",
     description:"Immos +3 000€, Tréso -3 000€. Abonnement +1 000€/trim. Protège données.",
     effetsImmediat:[{poste:"immobilisations",delta:3000},{poste:"tresorerie",delta:-3000}],
     effetsRecurrents:[{poste:"servicesExterieurs",delta:1000},{poste:"tresorerie",delta:-1000}]},

    {id:"mutuelle-collective", titre:"Mutuelle Collective", categorie:"protection",
     description:"Immos +2 000€, Tréso -2 000€. Cotisation patronale +1 000€/trim (charges personnel).",
     effetsImmediat:[{poste:"immobilisations",delta:2000},{poste:"tresorerie",delta:-2000}],
     effetsRecurrents:[{poste:"chargesPersonnel",delta:1000},{poste:"tresorerie",delta:-1000}]},
  ];
}

// ============================================================
// § 6. CARTES ÉVÉNEMENTS  (cartes.ts — CARTES_EVENEMENTS)
// ============================================================

function getCartesEvenements() {
  return [
    // ── POSITIFS ─────────────────────────────────────────────
    {id:"client-vip",    titre:"Client VIP ⭐",         positif:true,  annulableParAssurance:false,
     description:"Un grand client vous contacte ! Ventes +4 000€, Trésorerie +4 000€.",
     effets:[{poste:"ventes",delta:4000},{poste:"tresorerie",delta:4000}]},

    {id:"subvention",    titre:"Subvention publique 🏛️", positif:true,  annulableParAssurance:false,
     description:"Aide publique obtenue. Revenus exceptionnels +3 000€, Tréso +3 000€.",
     effets:[{poste:"revenusExceptionnels",delta:3000},{poste:"tresorerie",delta:3000}]},

    {id:"bouche-oreille",titre:"Bouche-à-oreille 📣",   positif:true,  annulableParAssurance:false,
     description:"Vos clients parlent de vous ! Ventes +2 000€, Tréso +2 000€.",
     effets:[{poste:"ventes",delta:2000},{poste:"tresorerie",delta:2000}]},

    {id:"prime-qualite", titre:"Prime Qualité 🏆",       positif:true,  annulableParAssurance:false,
     description:"Récompense qualité. Revenus exceptionnels +2 000€, Tréso +2 000€.",
     effets:[{poste:"revenusExceptionnels",delta:2000},{poste:"tresorerie",delta:2000}]},

    // ── NÉGATIFS ─────────────────────────────────────────────
    {id:"incendie",      titre:"Incendie 🔥",            positif:false, annulableParAssurance:true,
     description:"Sinistre dans vos locaux. Charges exceptionnelles +4 000€, Tréso -4 000€.",
     effets:[{poste:"chargesExceptionnelles",delta:4000},{poste:"tresorerie",delta:-4000}]},

    {id:"contr-fiscal",  titre:"Contrôle fiscal 🔍",     positif:false, annulableParAssurance:true,
     description:"Régularisation fiscale. Impôts & taxes +3 000€, Tréso -3 000€.",
     effets:[{poste:"impotsTaxes",delta:3000},{poste:"tresorerie",delta:-3000}]},

    {id:"greve",         titre:"Grève 🪧",               positif:false, annulableParAssurance:true,
     description:"Mouvement social. Charges exceptionnelles +2 000€, Tréso -2 000€.",
     effets:[{poste:"chargesExceptionnelles",delta:2000},{poste:"tresorerie",delta:-2000}]},

    {id:"panne-machine", titre:"Panne machine ⚙️",       positif:false, annulableParAssurance:true,
     description:"Équipement en panne. Charges exceptionnelles +2 000€, Tréso -2 000€.",
     effets:[{poste:"chargesExceptionnelles",delta:2000},{poste:"tresorerie",delta:-2000}]},

    {id:"litige-client", titre:"Litige client ⚖️",       positif:false, annulableParAssurance:true,
     description:"Contestation facture. Charges exceptionnelles +1 500€, Tréso -1 500€.",
     effets:[{poste:"chargesExceptionnelles",delta:1500},{poste:"tresorerie",delta:-1500}]},

    {id:"crise-economique",titre:"Crise économique 📉",  positif:false, annulableParAssurance:false,
     description:"Ralentissement marché. Charges exceptionnelles +2 000€, Tréso -2 000€.",
     effets:[{poste:"chargesExceptionnelles",delta:2000},{poste:"tresorerie",delta:-2000}]},

    {id:"hausse-matieres",titre:"Hausse matières 📦",    positif:false, annulableParAssurance:false,
     description:"Coût approvisionnement en hausse. Achats (CMV) +2 000€, Tréso -2 000€.",
     effets:[{poste:"achats",delta:2000},{poste:"tresorerie",delta:-2000}]},

    {id:"rien",          titre:"Trimestre calme 😌",     positif:true,  annulableParAssurance:false,
     description:"Aucun événement exceptionnel. Continuez sur votre lancée !",
     effets:[]},
  ];
}

// ============================================================
// § 7. GESTION DE L'ÉTAT (PropertiesService)
// ============================================================

function getState() {
  var raw = PropertiesService.getScriptProperties().getProperty("GAME_STATE_V5");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch(e) { return null; }
}

function saveState(state) {
  PropertiesService.getScriptProperties().setProperty("GAME_STATE_V5", JSON.stringify(state));
}

function resetState() {
  PropertiesService.getScriptProperties().deleteProperty("GAME_STATE_V5");
}

// ============================================================
// § 8. INITIALISATION D'UNE PARTIE
// ============================================================

function initialiserPartie(nomEntreprise, nbTrimestres) {
  var cfg = getConfig();
  var entreprises = getEntreprises(cfg);
  var tmpl = entreprises[nomEntreprise];
  if (!tmpl) throw new Error("Entreprise inconnue : " + nomEntreprise);

  var state = {
    version: 5,
    cfg: cfg,
    entreprise: {
      nom: nomEntreprise,
      icon: tmpl.icon,
      type: tmpl.type,
      specialite: tmpl.specialite,
      effetsPassifs: tmpl.effetsPassifs,
    },
    // Bilan (copie profonde du template)
    actifs:  JSON.parse(JSON.stringify(tmpl.actifs)),
    passifs: JSON.parse(JSON.stringify(tmpl.passifs)),
    decouvert:0, creancesPlus1:0, creancesPlus2:0,
    dettes:0, dettesD2:0, dettesFiscales:0,

    // Compte de résultat (remis à 0 chaque trimestre)
    cr:{
      ventes:0, productionStockee:0, produitsFinanciers:0, revenusExceptionnels:0,
      achats:0, servicesExterieurs:0, impotsTaxes:0, chargesInteret:0,
      chargesPersonnel:0, chargesExceptionnelles:0, dotationsAmortissements:0,
    },

    // 1 Commercial Junior par défaut (moteur TS — creerJoueur)
    commerciaux:[
      {id:"junior", titre:"Commercial Junior",
       salaire:cfg.JUNIOR_SALAIRE, typeClient:"particulier", nbClients:2}
    ],
    cartesActives:[],

    // Pioche événements mélangée
    piocheEvenements: melangerTableau(getCartesEvenements().map(function(c){return c.id;})),

    trimestre:1, nbTrimestres:Number(nbTrimestres),
    phase:"playing", elimine:false,
    historique:[], journal:[],

    // 2 clients Particuliers pré-chargés T1 (moteur TS)
    clientsPrecharges:2,
  };

  saveState(state);
  return state;
}

// ============================================================
// § 9. HELPERS BILAN / CR
// ============================================================

function appliquerDelta(state, poste, delta, explication) {
  // CR — produits
  if (["ventes","productionStockee","produitsFinanciers","revenusExceptionnels"].indexOf(poste) >= 0) {
    state.cr[poste] = Math.max(0, (state.cr[poste]||0) + delta);
  }
  // CR — charges
  else if (["achats","servicesExterieurs","impotsTaxes","chargesInteret","chargesPersonnel","chargesExceptionnelles","dotationsAmortissements"].indexOf(poste) >= 0) {
    state.cr[poste] = Math.max(0, (state.cr[poste]||0) + delta);
  }
  // Bilan — postes simples
  else if (["decouvert","creancesPlus1","creancesPlus2","dettes","dettesD2","dettesFiscales"].indexOf(poste) >= 0) {
    state[poste] = Math.max(0, (state[poste]||0) + delta);
  }
  // Bilan — actifs par catégorie
  else if (poste === "immobilisations") {
    var immoActif = delta > 0 ? trouverActif(state,"Autres Immobilisations") : null;
    if (!immoActif) immoActif = trouverActifParCategorie(state,"immobilisations");
    if (immoActif) immoActif.valeur = Math.max(0, immoActif.valeur + delta);
  }
  else if (poste === "stocks") {
    var s = trouverActifParCategorie(state,"stocks");
    if (s) s.valeur = Math.max(0, s.valeur + delta);
  }
  else if (poste === "tresorerie") {
    var t = trouverActifParCategorie(state,"tresorerie");
    if (t) t.valeur = t.valeur + delta; // peut être négatif (découvert auto)
  }
  // Bilan — passifs par catégorie
  else if (poste === "capitaux") {
    var c = trouverPassifParCategorie(state,"capitaux");
    if (c) c.valeur = Math.max(0, c.valeur + delta);
  }
  else if (poste === "emprunts") {
    var e = trouverPassifParCategorie(state,"emprunts");
    if (e) e.valeur = Math.max(0, e.valeur + delta);
  }

  state.journal.push({poste:poste, delta:delta, explication:explication});
}

function trouverActif(state, nom) {
  for (var i=0;i<state.actifs.length;i++) if(state.actifs[i].nom===nom) return state.actifs[i];
  return null;
}
function trouverActifParCategorie(state, cat) {
  for (var i=0;i<state.actifs.length;i++) if(state.actifs[i].categorie===cat) return state.actifs[i];
  return null;
}
function trouverPassifParCategorie(state, cat) {
  for (var i=0;i<state.passifs.length;i++) if(state.passifs[i].categorie===cat) return state.passifs[i];
  return null;
}
function getTresorerie(state) {
  var t=trouverActifParCategorie(state,"tresorerie"); return t?t.valeur:0;
}
function getTotalImmo(state) {
  var s=0; state.actifs.forEach(function(a){if(a.categorie==="immobilisations")s+=a.valeur;}); return s;
}
function getTotalStocks(state) {
  var t=trouverActifParCategorie(state,"stocks"); return t?t.valeur:0;
}
function getEmprunts(state) {
  var e=trouverPassifParCategorie(state,"emprunts"); return e?e.valeur:0;
}
function getCapitaux(state) {
  var c=trouverPassifParCategorie(state,"capitaux"); return c?c.valeur:0;
}
function getTotalActif(state) {
  var total=0;
  state.actifs.forEach(function(a){total+=a.valeur;});
  return total + state.creancesPlus1 + state.creancesPlus2;
}
function getResultatNet(state) {
  var p=state.cr.ventes+state.cr.productionStockee+state.cr.produitsFinanciers+state.cr.revenusExceptionnels;
  var c=state.cr.achats+state.cr.servicesExterieurs+state.cr.impotsTaxes+state.cr.chargesInteret+state.cr.chargesPersonnel+state.cr.chargesExceptionnelles+state.cr.dotationsAmortissements;
  return p-c;
}
function calculerScore(state) {
  var r=getResultatNet(state), im=getTotalImmo(state), t=getTresorerie(state);
  var cap=getCapitaux(state), tot=getTotalActif(state);
  var solv=tot>0?Math.round((cap+r)/tot*100):0;
  return (r*3)+(im*2)+t+solv;
}

// ============================================================
// § 10. LES 9 ÉTAPES DU TRIMESTRE
// ============================================================

/** ÉTAPE 0 : Remboursements + charges fixes + amortissements */
function etape0(state) {
  var cfg=state.cfg;

  // 0a. Agios sur découvert
  if (state.decouvert > 0) {
    var agios = Math.ceil(state.decouvert * cfg.AGIOS_TAUX / 100 / 100) * 100;
    appliquerDelta(state,"chargesInteret", agios,  "Agios bancaires ("+cfg.AGIOS_TAUX+"% × "+state.decouvert+"€)");
    appliquerDelta(state,"tresorerie",    -agios,  "Agios débités de la trésorerie");
  }

  // 0b. Intérêts emprunt annuels (T1, T5, T9...)
  if ((state.trimestre - 1) % 4 === 0) {
    var emp = getEmprunts(state);
    if (emp > 0) {
      var int_ = Math.ceil(emp * cfg.TAUX_INTERET_ANNUEL / 100 / 100) * 100;
      appliquerDelta(state,"chargesInteret", int_,  "Intérêts annuels emprunt ("+cfg.TAUX_INTERET_ANNUEL+"% × "+emp+"€)");
      appliquerDelta(state,"tresorerie",    -int_,  "Paiement intérêts emprunt");
    }
  }

  // 1. Remboursement découvert progressif
  if (state.decouvert > 0) {
    var rmb = Math.min(Math.min(state.decouvert, cfg.REMBOURSEMENT_DECOUVERT_MAX), Math.max(0, getTresorerie(state)));
    if (rmb > 0) {
      appliquerDelta(state,"tresorerie", -rmb, "Remboursement progressif découvert");
      appliquerDelta(state,"decouvert",  -rmb, "Découvert réduit de "+rmb+"€");
    }
  }

  // 2. Paiement dettes fournisseurs D+1
  if (state.dettes > 0) {
    var d=state.dettes;
    appliquerDelta(state,"tresorerie", -d, "Paiement dettes fournisseurs D+1");
    appliquerDelta(state,"dettes",     -d, "Dettes fournisseurs soldées");
  }

  // 2b. Avancement D+2 → D+1
  if (state.dettesD2 > 0) {
    var d2=state.dettesD2;
    appliquerDelta(state,"dettes",   d2, "Dettes D+2 devenues D+1");
    appliquerDelta(state,"dettesD2",-d2, "Dettes D+2 transférées en D+1");
  }

  // 3. Dettes fiscales
  if (state.dettesFiscales > 0) {
    var df=state.dettesFiscales;
    appliquerDelta(state,"tresorerie",    -df, "Paiement dettes fiscales");
    appliquerDelta(state,"dettesFiscales",-df, "Dettes fiscales soldées");
  }

  // 4. Remboursement emprunt (-1 000€/trim)
  if (getEmprunts(state) >= cfg.REMBOURSEMENT_EMPRUNT) {
    appliquerDelta(state,"tresorerie",-cfg.REMBOURSEMENT_EMPRUNT,"Remboursement annuité emprunt");
    appliquerDelta(state,"emprunts",  -cfg.REMBOURSEMENT_EMPRUNT,"Emprunt réduit de "+cfg.REMBOURSEMENT_EMPRUNT+"€");
  }

  // 5. Charges fixes (loyer, téléphonie…)
  appliquerDelta(state,"servicesExterieurs", cfg.CHARGES_FIXES, "Charges fixes (loyer, téléphonie…)");
  appliquerDelta(state,"tresorerie",        -cfg.CHARGES_FIXES, "Paiement charges fixes");

  // 6. Amortissement : -1 000€/bien/trim
  var totalDot=0;
  state.actifs.forEach(function(a){
    if (a.categorie==="immobilisations" && a.valeur>0) {
      var am=Math.min(cfg.AMORTISSEMENT_PAR_BIEN, a.valeur);
      a.valeur -= am; totalDot += am;
    }
  });
  if (totalDot > 0) {
    appliquerDelta(state,"dotationsAmortissements", totalDot,
      "Amortissement "+(totalDot/cfg.AMORTISSEMENT_PAR_BIEN)+" bien(s) × "+cfg.AMORTISSEMENT_PAR_BIEN+"€");
  }

  // 7. Trésorerie négative → découvert
  gererDecouvert(state);
}

/** ÉTAPE 1 : Achats stocks */
function etape1(state, montant, aCredit) {
  if (!montant || montant <= 0) return;
  appliquerDelta(state,"stocks", montant, "Achat stocks : +"+montant+"€");
  if (aCredit) {
    appliquerDelta(state,"dettes", montant, "Achat à crédit — dette fournisseur D+1");
  } else {
    appliquerDelta(state,"tresorerie", -montant, "Paiement immédiat des achats");
    gererDecouvert(state);
  }
}

/** ÉTAPE 2 : Avancement créances */
function etape2(state) {
  var hasAff = state.cartesActives.some(function(c){return c.id==="affacturage";});
  if (hasAff) {
    if (state.creancesPlus1>0){appliquerDelta(state,"tresorerie",state.creancesPlus1,"Affacturage : créances C+1 encaissées");appliquerDelta(state,"creancesPlus1",-state.creancesPlus1,"C+1 cédées au factor");}
    if (state.creancesPlus2>0){appliquerDelta(state,"tresorerie",state.creancesPlus2,"Affacturage : créances C+2 encaissées");appliquerDelta(state,"creancesPlus2",-state.creancesPlus2,"C+2 cédées au factor");}
  } else {
    if (state.creancesPlus1>0){appliquerDelta(state,"tresorerie",state.creancesPlus1,"Encaissement créances C+1");appliquerDelta(state,"creancesPlus1",-state.creancesPlus1,"Créances C+1 encaissées");}
    if (state.creancesPlus2>0){appliquerDelta(state,"creancesPlus1",state.creancesPlus2,"Avancement C+2 → C+1");appliquerDelta(state,"creancesPlus2",-state.creancesPlus2,"Créances C+2 avancées");}
  }
}

/** ÉTAPES 3+4 : Génération et traitement des clients */
function etape3et4(state) {
  var cfg=state.cfg;

  // a) Clients pré-chargés T1 (moteur TS)
  var clients=[];
  if (state.trimestre===1 && state.clientsPrecharges>0) {
    for(var i=0;i<state.clientsPrecharges;i++) clients.push("particulier");
  }

  // b) Clients par commerciaux
  state.commerciaux.forEach(function(com){
    for(var i=0;i<com.nbClients;i++) clients.push(com.typeClient);
  });

  // c) Clients par cartes Décision actives
  state.cartesActives.forEach(function(carte){
    if(carte.clientParTour && carte.nbClientsParTour){
      for(var i=0;i<carte.nbClientsParTour;i++) clients.push(carte.clientParTour);
    }
  });

  // d) Spécialité Azura Commerce : +1 Particulier auto/trim
  if (state.entreprise.nom==="Azura Commerce") clients.push("particulier");

  // e) Paiement salaires commerciaux (étape 3)
  state.commerciaux.forEach(function(com){
    appliquerDelta(state,"chargesPersonnel", com.salaire, "Salaire "+com.titre+" : +"+com.salaire+"€");
    appliquerDelta(state,"tresorerie",      -com.salaire, "Paiement salaire "+com.titre);
  });

  // f) Capacité = base + bonus cartes
  var capacite = cfg.CAPACITE_BASE;
  state.cartesActives.forEach(function(c){if(c.bonusCapacite) capacite+=c.bonusCapacite;});

  // g) Traitement clients
  var traites=0, perdus=0;
  clients.forEach(function(type){
    if (traites >= capacite) { perdus++; return; }
    if (getTotalStocks(state) < 1) { perdus++; return; }

    var montant = type==="particulier" ? cfg.PARTICULIER_VENTES
                : type==="tpe"        ? cfg.TPE_VENTES
                :                       cfg.GRAND_COMPTE_VENTES;

    // Délai encaissement (Véloce Transports : -1)
    var delai = type==="particulier"?0:type==="tpe"?1:2;
    if (state.entreprise.nom==="Véloce Transports") delai=Math.max(0,delai-1);

    appliquerDelta(state,"ventes",  montant, "Vente "+type+" : +"+montant+"€");
    appliquerDelta(state,"stocks",  -1,      "Sortie de stock -1€ (CMV)");
    appliquerDelta(state,"achats",  1,       "CMV +1€");

    if      (delai===0) appliquerDelta(state,"tresorerie",    montant,"Encaissement immédiat client "+type);
    else if (delai===1) appliquerDelta(state,"creancesPlus1", montant,"Créance C+1 client "+type);
    else                appliquerDelta(state,"creancesPlus2", montant,"Créance C+2 client "+type);

    traites++;
  });

  state.clientsTraitesCeTrimestre = traites;
  state.clientsPerdusCeTrimestre  = perdus;
  gererDecouvert(state);
}

/** ÉTAPE 5 : Effets récurrents cartes + spécialité entreprise */
function etape5(state) {
  state.cartesActives.forEach(function(carte){
    (carte.effetsRecurrents||[]).forEach(function(e){
      appliquerDelta(state, e.poste, e.delta, carte.titre+" — effet récurrent");
    });
  });
  // Spécialité (effetsPassifs)
  (state.entreprise.effetsPassifs||[]).forEach(function(e){
    appliquerDelta(state, e.poste, e.delta, state.entreprise.specialite);
  });
  gererDecouvert(state);
}

/** ÉTAPE 6 : Carte Décision */
function etape6(state, idCarte) {
  if (!idCarte) return null;
  var carte=null;
  getCartesDecision().forEach(function(c){if(c.id===idCarte)carte=c;});
  if (!carte) return null;

  (carte.effetsImmediat||[]).forEach(function(e){
    appliquerDelta(state, e.poste, e.delta, carte.titre+" — effet immédiat");
  });

  // Ajouter aux cartes actives si effet récurrent ou génère clients
  var ajouter = (carte.effetsRecurrents && carte.effetsRecurrents.length>0)
             || carte.clientParTour || carte.bonusCapacite
             || carte.affacturage   || carte.annuleEvenements;
  if (ajouter) state.cartesActives.push(JSON.parse(JSON.stringify(carte)));

  gererDecouvert(state);
  return carte;
}

/** ÉTAPE 6b : Recrutement commercial */
function etape6b(state, idCom) {
  if (!idCom) return null;
  var com=null;
  getCartesCommerciaux(state.cfg).forEach(function(c){if(c.id===idCom)com=c;});
  if (!com) return null;

  appliquerDelta(state,"chargesPersonnel",  com.salaire, com.titre+" recruté");
  appliquerDelta(state,"tresorerie",       -com.salaire, "Paiement recrutement "+com.titre);
  state.commerciaux.push(JSON.parse(JSON.stringify(com)));
  gererDecouvert(state);
  return com;
}

/** ÉTAPE 7 : Événement */
function etape7(state) {
  if (state.piocheEvenements.length===0) {
    state.piocheEvenements = melangerTableau(getCartesEvenements().map(function(c){return c.id;}));
  }
  var id=state.piocheEvenements.shift();
  var evn=null;
  getCartesEvenements().forEach(function(e){if(e.id===id)evn=e;});
  if (!evn) return null;

  var hasAss=state.cartesActives.some(function(c){return c.id==="assurance-prevoyance";});
  if (evn.annulableParAssurance && hasAss) {
    state.journal.push({poste:"evenement",delta:0,explication:"\""+evn.titre+"\" annulé par l'Assurance Prévoyance 🛡️"});
    return {evn:evn, annule:true};
  }

  evn.effets.forEach(function(e){appliquerDelta(state,e.poste,e.delta,evn.titre+" — "+evn.description);});
  gererDecouvert(state);
  return {evn:evn, annule:false};
}

/** ÉTAPE 8 : Vérification faillite + fin de trimestre */
function etape8(state) {
  var r=getResultatNet(state), cap=getCapitaux(state), capTot=cap+r;
  var emp=getEmprunts(state);
  var dettesTot=state.dettes+state.dettesD2+state.dettesFiscales+emp;
  var raison=null;

  if (state.decouvert > state.cfg.DECOUVERT_MAX)
    raison="Découvert ("+state.decouvert+"€) > max ("+state.cfg.DECOUVERT_MAX+"€) — cessation de paiement";
  else if (capTot < 0)
    raison="Capitaux propres négatifs ("+capTot+"€) — insolvable";
  else if (dettesTot>0 && capTot>0 && dettesTot>capTot*2)
    raison="Surendettement : dettes ("+dettesTot+"€) > 2× capitaux ("+capTot+"€)";

  if (raison) { state.elimine=true; state.phase="gameover"; state.raisonFaillite=raison; }

  // Sauvegarder historique
  state.historique.push({
    trimestre:state.trimestre,
    treso:getTresorerie(state),
    resultat:getResultatNet(state),
    decouvert:state.decouvert,
    journal:state.journal.slice(),
  });

  // Sauvegarder CR du trimestre passé
  state.crPrecedent=JSON.parse(JSON.stringify(state.cr));

  // Remettre CR à zéro
  state.cr={
    ventes:0,productionStockee:0,produitsFinanciers:0,revenusExceptionnels:0,
    achats:0,servicesExterieurs:0,impotsTaxes:0,chargesInteret:0,
    chargesPersonnel:0,chargesExceptionnelles:0,dotationsAmortissements:0,
  };
  state.journal=[];

  if (!state.elimine) {
    if (state.trimestre >= state.nbTrimestres) state.phase="gameover";
    else state.trimestre++;
  }
}

/** Gestion automatique trésorerie négative → découvert */
function gererDecouvert(state) {
  var t=getTresorerie(state);
  if (t < 0) {
    var m=Math.abs(t);
    appliquerDelta(state,"tresorerie",  m,"Trésorerie ramenée à 0");
    appliquerDelta(state,"decouvert",   m,"Découvert bancaire automatique ("+m+"€)");
  }
}

// ============================================================
// § 11. JOUER UN TRIMESTRE (appelé depuis le dialog HTML)
// ============================================================

function jouerTrimestre(decisions) {
  var state=getState();
  if (!state || state.phase!=="playing") return {erreur:"Pas de partie en cours."};

  state.journal=[];
  etape0(state);
  etape1(state, decisions.montantAchats||0, decisions.aCredit||false);
  etape2(state);
  etape3et4(state);
  etape5(state);
  var carteRes = decisions.idCarteDecision ? etape6(state,decisions.idCarteDecision) : null;
  var comRes   = decisions.idCommercial    ? etape6b(state,decisions.idCommercial)   : null;
  var evtRes   = etape7(state);
  etape8(state);

  saveState(state);
  updateDashboard(state);

  var lastHist=state.historique[state.historique.length-1];
  return {
    ok:true,
    trimestre: lastHist.trimestre,
    phase: state.phase,
    treso: lastHist.treso,
    resultat: lastHist.resultat,
    decouvert: lastHist.decouvert,
    elimine: state.elimine,
    raisonFaillite: state.raisonFaillite||null,
    evenement: evtRes ? {titre:evtRes.evn.titre,description:evtRes.evn.description,annule:evtRes.annule,positif:evtRes.evn.positif} : null,
    clientsTraites: state.clientsTraitesCeTrimestre||0,
    clientsPerdus:  state.clientsPerdusCeTrimestre||0,
    journal: lastHist.journal,
  };
}

// ============================================================
// § 12. MISE À JOUR DU DASHBOARD
// ============================================================

function updateDashboard(state) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // "🎮 Tableau de Bord" = feuille V5 du dashboard (gid=0)
  // Fallback vers "📊 Tableau de bord" (ancienne feuille V3/V4) si absente
  var sh = ss.getSheetByName("🎮 Tableau de Bord") || ss.getSheetByName("📊 Tableau de bord");
  if (!sh) return;

  // === TITRE & STATUT ===
  sh.getRange("A1").setValue("🎮 JE DEVIENS PATRON — " + state.entreprise.nom);

  var statut;
  if (state.phase === "playing") {
    statut = "⏱️ Trimestre " + state.trimestre + " / " + state.nbTrimestres + " — " + state.entreprise.specialite;
  } else if (state.elimine) {
    statut = "🔴 FAILLITE — " + (state.raisonFaillite || "Cessation de paiement");
  } else {
    statut = "🏁 Partie terminée — Score final : " + calculerScore(state).toLocaleString("fr-FR") + " pts";
  }
  sh.getRange("A2").setValue(statut);

  // === BILAN — ACTIF (lignes 5-9) ===
  sh.getRange("B5").setValue(getTresorerie(state));
  sh.getRange("B6").setValue(getTotalStocks(state));
  sh.getRange("B7").setValue(state.creancesPlus1 || 0);
  sh.getRange("B8").setValue(state.creancesPlus2 || 0);
  sh.getRange("B9").setValue(getTotalImmo(state));

  // === BILAN — PASSIF (lignes 13-16) ===
  sh.getRange("B13").setValue(getCapitaux(state));
  sh.getRange("B14").setValue(getEmprunts(state));
  sh.getRange("B15").setValue(state.decouvert || 0);
  sh.getRange("B16").setValue((state.dettes || 0) + (state.dettesD2 || 0));

  // === COMPTE DE RÉSULTAT — PRODUITS (lignes 20-22) ===
  sh.getRange("B20").setValue(state.cr.ventes || 0);
  sh.getRange("B21").setValue(state.cr.productionStockee || 0);
  sh.getRange("B22").setValue(state.cr.produitsFinanciers || 0);

  // === COMPTE DE RÉSULTAT — CHARGES (lignes 25-29) ===
  sh.getRange("B25").setValue(state.cr.achats || 0);
  sh.getRange("B26").setValue(state.cr.servicesExterieurs || 0);
  sh.getRange("B27").setValue(state.cr.chargesPersonnel || 0);
  sh.getRange("B28").setValue(state.cr.chargesInteret || 0);
  sh.getRange("B29").setValue(state.cr.dotationsAmortissements || 0);

  // === RÉSULTAT NET (ligne 32) ===
  sh.getRange("B32").setValue(getResultatNet(state));

  // Historique trimestriel
  updateHistorique(state);
}

function updateHistorique(state) {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName("Historique");
  if (!sh) return;
  var lastH=state.historique[state.historique.length-1];
  if (!lastH) return;
  var row=sh.getLastRow()+1;
  sh.getRange(row,1).setValue(lastH.trimestre);
  sh.getRange(row,2).setValue(lastH.treso);
  sh.getRange(row,3).setValue(lastH.resultat);
  sh.getRange(row,4).setValue(lastH.decouvert);
}

// ============================================================
// § 13. MENU ET DÉCLENCHEURS
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎮 Je Deviens Patron")
    .addItem("🆕 Nouvelle partie",          "dialog_NouvellePartie")
    .addItem("▶ Jouer le trimestre suivant","dialog_JouerTrimestre")
    .addItem("📊 Actualiser le tableau de bord","actualiserDashboard")
    .addItem("🏆 Voir les résultats finaux", "dialog_ResultatsFinaux")
    .addSeparator()
    .addItem("⚙️ Créer la feuille Paramètres","createParametresSheet")
    .addItem("🗑️ Réinitialiser la partie",   "confirmerReinitialisation")
    .addToUi();
  // Toujours afficher la feuille V5 au démarrage
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName("🎮 Tableau de Bord")||ss.getSheetByName("📊 Tableau de bord");
  if(sh) ss.setActiveSheet(sh);
}
function onOpen_V5() { onOpen(); }

// ============================================================
// § 14. DIALOGS HTML
// ============================================================

function dialog_NouvellePartie() {
  var cfg=getConfig();
  var html=HtmlService.createHtmlOutput(getHtmlNouvellePartie(cfg))
    .setWidth(720).setHeight(620).setTitle("🆕 Nouvelle partie — Je Deviens Patron V5");
  SpreadsheetApp.getUi().showModalDialog(html,"🆕 Nouvelle partie — Je Deviens Patron V5");
}

function demarrerPartie(nomEntreprise, nbTrimestres) {
  var state=initialiserPartie(nomEntreprise, Number(nbTrimestres));
  updateDashboard(state);
  // Amener l'utilisateur sur la feuille V5 (et non l'ancienne "Tableau de Bord")
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName("🎮 Tableau de Bord")||ss.getSheetByName("📊 Tableau de bord");
  if(sh) ss.setActiveSheet(sh);
  return {ok:true, entreprise:nomEntreprise, nbTrimestres:state.nbTrimestres};
}

function dialog_JouerTrimestre() {
  var state=getState();
  if (!state) { SpreadsheetApp.getUi().alert("Aucune partie en cours. Lancez une nouvelle partie."); return; }
  if (state.phase!=="playing") { SpreadsheetApp.getUi().alert("La partie est terminée. Consultez les résultats."); return; }
  var html=HtmlService.createHtmlOutput(
    getHtmlJouerTrimestre(state,state.cfg,getCartesDecision(),getCartesCommerciaux(state.cfg))
  ).setWidth(760).setHeight(660).setTitle("▶ Trimestre "+state.trimestre);
  SpreadsheetApp.getUi().showModalDialog(html,"▶ Trimestre "+state.trimestre+" / "+state.nbTrimestres);
}

function dialog_ResultatsFinaux() {
  var state=getState();
  if (!state) { SpreadsheetApp.getUi().alert("Aucune partie en cours."); return; }
  var html=HtmlService.createHtmlOutput(getHtmlResultats(state))
    .setWidth(720).setHeight(620).setTitle("🏆 Résultats — Je Deviens Patron V5");
  SpreadsheetApp.getUi().showModalDialog(html,"🏆 Résultats finaux");
}

function actualiserDashboard() { var s=getState(); if(s) updateDashboard(s); }

function confirmerReinitialisation() {
  var ui=SpreadsheetApp.getUi();
  if (ui.alert("Réinitialiser ?","Toutes les données seront perdues.",ui.ButtonSet.YES_NO)===ui.Button.YES) {
    resetState(); ui.alert("Partie réinitialisée.");
  }
}

// ============================================================
// § 15. FEUILLE PARAMÈTRES
// ============================================================

function createParametresSheet() {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName("Paramètres") || ss.insertSheet("Paramètres");
  sh.clearContents();
  sh.setColumnWidth(1, 240);
  sh.setColumnWidth(2, 160);
  sh.setColumnWidth(3, 160);
  sh.setColumnWidth(4, 380);

  var rows=[
    ["Paramètre","Valeur par défaut","Votre valeur","Description"],
    ["Ventes — Particulier",     2000,"","Montant des ventes par client Particulier (paiement immédiat)"],
    ["Ventes — TPE",             3000,"","Montant des ventes par client TPE (créance C+1)"],
    ["Ventes — Grand Compte",    4000,"","Montant des ventes par Grand Compte (créance C+2)"],
    ["Salaire — Junior",         1000,"","Salaire trimestriel du Commercial Junior"],
    ["Salaire — Senior",         2000,"","Salaire trimestriel du Commercial Senior"],
    ["Salaire — Directrice",     3000,"","Salaire trimestriel de la Directrice Commerciale"],
    ["Charges fixes",            2000,"","Services extérieurs fixes par trimestre (loyer, téléphonie…)"],
    ["Trésorerie initiale",      8000,"","Trésorerie de départ (toutes les entreprises)"],
    ["Stocks initiaux",          4000,"","Stocks de départ (toutes les entreprises)"],
    ["Capacité de base",            4,"","Nombre maximum de clients par trimestre sans investissement logistique"],
  ];

  sh.getRange(1,1,rows.length,4).setValues(rows);
  sh.getRange(1,1,1,4).setBackground("#1a73e8").setFontColor("white").setFontWeight("bold");
  sh.getRange(2,1,rows.length-1,1).setBackground("#f8f9fa").setFontWeight("bold");
  sh.getRange(2,2,rows.length-1,1).setBackground("#fce8b2").setHorizontalAlignment("center").setNumberFormat("#,##0 \"€\"");
  sh.getRange(2,3,rows.length-1,1).setBackground("#e6f4ea").setHorizontalAlignment("center").setNumberFormat("#,##0 \"€\"");
  sh.getRange("C11").setNumberFormat("0"); // Capacité : entier sans €

  sh.getRange("A1").setNote("Laissez 'Votre valeur' vide pour utiliser la valeur par défaut du moteur de jeu.\nCes valeurs sont lues au démarrage de chaque nouvelle partie.");

  try { SpreadsheetApp.getUi().alert("✅ Feuille 'Paramètres' créée avec succès !"); } catch(e) {}
}

// ============================================================
// § 16. HTML — NOUVELLE PARTIE
// ============================================================

function getHtmlNouvellePartie(cfg) {
  var f=function(n){return n.toLocaleString("fr-FR")+" €";};
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
'*{box-sizing:border-box}body{font-family:Google Sans,Arial,sans-serif;margin:0;padding:20px;background:#f8f9fa;color:#202124}' +
'h2{color:#1a73e8;margin-top:0;font-size:20px}p{color:#5f6368;font-size:13px;margin-top:-8px}' +
'h3{font-size:14px;color:#202124;margin-bottom:8px}' +
'.ent{border:2px solid #e0e0e0;border-radius:12px;padding:14px;margin:8px 0;cursor:pointer;background:white;transition:all .2s}' +
'.ent:hover{border-color:#1a73e8;box-shadow:0 2px 8px rgba(26,115,232,.2)}' +
'.ent.sel{border-color:#1a73e8;background:#e8f0fe}' +
'.row{display:flex;align-items:center;gap:8px}' +
'.ico{font-size:28px}.nom{font-size:16px;font-weight:600}.tag{font-size:11px;padding:2px 8px;border-radius:10px;color:white}' +
'.spec{font-size:12px;color:#1a73e8;margin:4px 0}' +
'.desc{font-size:12px;color:#5f6368}' +
'.bil{font-size:11px;color:#5f6368;margin-top:6px;background:#f8f9fa;padding:5px 8px;border-radius:6px}' +
'.dur{display:flex;gap:10px;margin:12px 0}' +
'.dur label{flex:1;text-align:center;border:2px solid #e0e0e0;border-radius:8px;padding:10px;cursor:pointer;background:white;font-size:13px}' +
'.dur label:hover{border-color:#1a73e8}' +
'.dur input[type=radio]{display:none}' +
'.dur label.chk{border-color:#1a73e8;background:#e8f0fe;font-weight:700;color:#1a73e8}' +
'#msg{color:#d93025;font-size:12px;min-height:16px;margin-bottom:8px}' +
'button{background:#1a73e8;color:white;border:none;border-radius:6px;padding:12px 24px;font-size:15px;cursor:pointer;width:100%;margin-top:4px}' +
'button:hover{background:#1557b0}button:disabled{background:#dadce0;cursor:not-allowed}' +
'</style></head><body>' +
'<h2>🎮 Je Deviens Patron — V5</h2>' +
'<p>Données exactes du moteur TypeScript. Paramètres lisibles dans la feuille "Paramètres".</p>' +
'<h3>① Choisissez votre entreprise</h3>' +

eHtml("Manufacture Belvaux","🏭","#e8751a","Production","⚡ Produit à chaque tour — +1 000€ stocks/trim",
  "Industrie manufacturière. Stocks, capacité de production, amortissements.",
  f(cfg.TRESORERIE_INITIALE),f(cfg.STOCKS_INITIAUX),"16 000 €","8 000 €") +

eHtml("Véloce Transports","🚚","#7b2d8b","Logistique","🚀 Livraison rapide — encaissement accéléré (-1 délai)",
  "Transport & logistique. TPE encaissé immédiatement, Grand Compte en C+1.",
  f(cfg.TRESORERIE_INITIALE),f(cfg.STOCKS_INITIAUX),"16 000 €","8 000 €") +

eHtml("Azura Commerce","🏪","#1565c0","Commerce","👥 Attire les particuliers — +1 client Particulier auto/trim",
  "Commerce de détail. Client Particulier supplémentaire chaque trimestre.",
  f(cfg.TRESORERIE_INITIALE),f(cfg.STOCKS_INITIAUX),"16 000 €","8 000 €") +

eHtml("Synergia Lab","💡","#2e7d32","Innovation","💎 Revenus de licence — +1 000€ tréso/trim",
  "Innovation & R&D. Produits financiers récurrents. Bilan initial 25 000€.",
  f(cfg.TRESORERIE_INITIALE),f(cfg.STOCKS_INITIAUX),"13 000 €","8 000 €") +

'<h3>② Durée de la simulation</h3>' +
'<div class="dur">' +
'<label id="d6" class="chk" onclick="selDuree(6)"><input type="radio" name="dur" value="6" checked>6 trimestres<br><small>≈ 1 h · 1,5 exercice</small></label>' +
'<label id="d8"            onclick="selDuree(8)"><input type="radio" name="dur" value="8">8 trimestres<br><small>≈ 1 h 15 · 2 exercices</small></label>' +
'<label id="d12"           onclick="selDuree(12)"><input type="radio" name="dur" value="12">12 trimestres<br><small>≈ 1 h 45 · 3 exercices</small></label>' +
'</div>' +

'<div id="msg"></div>' +
'<button id="btn" onclick="demarrer()" disabled>Sélectionnez une entreprise</button>' +

'<script>var nom="",dur=6;' +
'function esel(el,n){document.querySelectorAll(".ent").forEach(function(e){e.classList.remove("sel");});el.classList.add("sel");nom=n;document.getElementById("btn").disabled=false;document.getElementById("btn").textContent="▶ Démarrer — "+n;}' +
'function selDuree(d){dur=d;["d6","d8","d12"].forEach(function(id){document.getElementById(id).classList.remove("chk");});document.getElementById("d"+d).classList.add("chk");}' +
'function demarrer(){if(!nom)return;var btn=document.getElementById("btn");btn.disabled=true;btn.textContent="Initialisation…";' +
'google.script.run.withSuccessHandler(function(){google.script.host.close();}).withFailureHandler(function(e){document.getElementById("msg").textContent="Erreur : "+e.message;btn.disabled=false;btn.textContent="▶ Démarrer — "+nom;}).demarrerPartie(nom,dur);}' +
'<\/script></body></html>';
}

function eHtml(nom,ico,couleur,type,spec,desc,treso,stocks,immo,emp) {
  return '<div class="ent" onclick="esel(this,\''+nom+'\')">' +
    '<div class="row"><span class="ico">'+ico+'</span><span class="nom">'+nom+'</span>' +
    '<span class="tag" style="background:'+couleur+'">'+type+'</span></div>' +
    '<div class="spec">'+spec+'</div>' +
    '<div class="desc">'+desc+'</div>' +
    '<div class="bil">💰 Tréso : '+treso+' · 📦 Stocks : '+stocks+' · 🏗️ Immos : '+immo+' · 🏦 Emprunts : '+emp+'</div>' +
    '</div>';
}

// ============================================================
// § 17. HTML — JOUER LE TRIMESTRE
// ============================================================

function getHtmlJouerTrimestre(state, cfg, cartesDecision, cartesCommerciaux) {
  var treso  = getTresorerie(state);
  var stocks = getTotalStocks(state);
  var emprunts = getEmprunts(state);
  var capacite = cfg.CAPACITE_BASE;
  state.cartesActives.forEach(function(c){if(c.bonusCapacite)capacite+=c.bonusCapacite;});

  var activesIds=state.cartesActives.map(function(c){return c.id;});
  var categories=["vehicule","investissement","financement","tactique","service","protection"];
  var labCat={vehicule:"🚗 Véhicules",investissement:"🏗️ Investissements",financement:"💳 Financement",tactique:"🎯 Tactique",service:"🛠️ Services",protection:"🛡️ Protection"};

  var optC='<option value="">— Pas de carte —</option>';
  categories.forEach(function(cat){
    var filtered=cartesDecision.filter(function(c){
      return c.categorie===cat && !(c.unique && activesIds.indexOf(c.id)>=0);
    });
    if(!filtered.length) return;
    optC+='<optgroup label="'+labCat[cat]+'">';
    filtered.forEach(function(c){
      var cout=(c.effetsImmediat||[]).filter(function(e){return e.poste==="tresorerie"&&e.delta<0;}).reduce(function(s,e){return s+Math.abs(e.delta);},0);
      optC+='<option value="'+c.id+'">'+(cout?"(−"+cout.toLocaleString("fr-FR")+"€) ":"")+c.titre+'</option>';
    });
    optC+='</optgroup>';
  });

  var optCom='<option value="">— Pas de recrutement —</option>';
  cartesCommerciaux.forEach(function(c){
    optCom+='<option value="'+c.id+'">'+c.titre+' ('+c.salaire.toLocaleString("fr-FR")+'€/trim → '+c.nbClients+'× '+c.typeClient+')</option>';
  });

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
'*{box-sizing:border-box}body{font-family:Google Sans,Arial,sans-serif;margin:0;padding:18px;background:#f8f9fa;color:#202124;font-size:13px}' +
'h2{color:#1a73e8;margin-top:0;font-size:17px}' +
'.kpis{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}' +
'.kpi{background:white;border-radius:8px;padding:10px 14px;flex:1;min-width:90px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}' +
'.kv{font-size:17px;font-weight:700;color:#1a73e8}.kl{font-size:11px;color:#5f6368;margin-top:2px}' +
'.card{background:white;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.1)}' +
'label{font-weight:600;display:block;margin-bottom:4px}' +
'.inf{font-size:11px;color:#5f6368;margin-top:3px}' +
'select,input[type=number]{width:100%;padding:7px;border:1px solid #dadce0;border-radius:6px;font-size:13px;margin-bottom:6px}' +
'input[type=checkbox]{margin-right:4px}' +
'#msg{color:#d93025;font-size:12px;min-height:16px;margin-bottom:6px}' +
'button{background:#1a73e8;color:white;border:none;border-radius:6px;padding:11px;font-size:14px;cursor:pointer;width:100%}' +
'button:hover{background:#1557b0}button:disabled{background:#dadce0;cursor:not-allowed}' +
'</style></head><body>' +
'<h2>▶ T'+state.trimestre+'/'+state.nbTrimestres+' — '+state.entreprise.icon+' '+state.entreprise.nom+'</h2>' +

'<div class="kpis">' +
'<div class="kpi"><div class="kv">'+treso.toLocaleString("fr-FR")+'€</div><div class="kl">💰 Trésorerie</div></div>' +
'<div class="kpi"><div class="kv">'+stocks.toLocaleString("fr-FR")+'€</div><div class="kl">📦 Stocks</div></div>' +
'<div class="kpi"><div class="kv">'+emprunts.toLocaleString("fr-FR")+'€</div><div class="kl">🏦 Emprunts</div></div>' +
(state.decouvert>0?'<div class="kpi" style="background:#fce8e6"><div class="kv" style="color:#d93025">'+state.decouvert.toLocaleString("fr-FR")+'€</div><div class="kl">⚠️ Découvert</div></div>':'') +
'<div class="kpi"><div class="kv">'+capacite+'</div><div class="kl">👥 Capacité</div></div>' +
'</div>' +

'<div class="card">' +
'<label>📦 Achats de stocks (étape 1)</label>' +
'<input type="number" id="ach" min="0" step="1000" value="0" placeholder="0 = pas d\'achat"/>' +
'<div><input type="checkbox" id="cred"><label style="display:inline;font-weight:400">Achat à crédit (dette fournisseur D+1)</label></div>' +
'<div class="inf">Stocks actuels : '+stocks.toLocaleString("fr-FR")+'€ — Capacité : '+capacite+' clients max/trim</div>' +
'</div>' +

'<div class="card">' +
'<label>👤 Recrutement commercial (étape 6b)</label>' +
'<select id="com">'+optCom+'</select>' +
'<div class="inf">Commerciaux actifs : '+state.commerciaux.map(function(c){return c.titre;}).join(", ")+'</div>' +
'</div>' +

'<div class="card">' +
'<label>🃏 Carte Décision (étape 6)</label>' +
'<select id="carte">'+optC+'</select>' +
'<div class="inf">Cartes actives : '+(state.cartesActives.length?state.cartesActives.map(function(c){return c.titre;}).join(", "):"Aucune")+'</div>' +
'</div>' +

'<div id="msg"></div>' +
'<button id="btn" onclick="jouer()">▶ Jouer le trimestre</button>' +
'<script>function jouer(){' +
'var btn=document.getElementById("btn");btn.disabled=true;btn.textContent="Calcul en cours…";' +
'var d={montantAchats:parseInt(document.getElementById("ach").value)||0,aCredit:document.getElementById("cred").checked,' +
'idCommercial:document.getElementById("com").value||null,idCarteDecision:document.getElementById("carte").value||null};' +
'google.script.run.withSuccessHandler(function(r){if(r.erreur){document.getElementById("msg").textContent=r.erreur;btn.disabled=false;btn.textContent="▶ Jouer le trimestre";return;}google.script.host.close();})'  +
'.withFailureHandler(function(e){document.getElementById("msg").textContent="Erreur : "+e.message;btn.disabled=false;btn.textContent="▶ Jouer le trimestre";})'  +
'.jouerTrimestre(d);}<\/script></body></html>';
}

// ============================================================
// § 18. HTML — RÉSULTATS FINAUX
// ============================================================

function getHtmlResultats(state) {
  var score=calculerScore(state);
  var treso=getTresorerie(state), immo=getTotalImmo(state);
  var resultat=getResultatNet(state), capitaux=getCapitaux(state);
  var totalA=getTotalActif(state);
  var solv=totalA>0?Math.round((capitaux+resultat)/totalA*100):0;

  var mention=score>100000?"🥇 Excellent — Gestion financière maîtrisée"
    :score>50000?"🥈 Bon résultat — Encore des progrès possibles"
    :score>0?"🥉 Résultat correct — Approfondissez le BFR et la trésorerie"
    :"📚 À retravailler — Revoir la gestion de trésorerie";

  var hist="";
  state.historique.forEach(function(h){
    hist+='<tr><td>T'+h.trimestre+'</td><td>'+h.treso.toLocaleString("fr-FR")+'€</td>' +
      '<td style="color:'+(h.resultat>=0?"#1e8e3e":"#d93025")+'">'+h.resultat.toLocaleString("fr-FR")+'€</td>' +
      '<td>'+(h.decouvert>0?'<b style="color:#d93025">'+h.decouvert.toLocaleString("fr-FR")+'€</b>':"—")+'</td></tr>';
  });

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
'*{box-sizing:border-box}body{font-family:Google Sans,Arial,sans-serif;margin:0;padding:22px;background:#f8f9fa;color:#202124;font-size:13px}' +
'h2{color:#1a73e8;margin-top:0}.score{text-align:center;background:white;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 2px 6px rgba(0,0,0,.12)}' +
'.sv{font-size:44px;font-weight:700;color:#1a73e8}.mention{font-size:16px;margin-top:6px}' +
'.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}' +
'.kpi{background:white;border-radius:8px;padding:11px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}' +
'.kv{font-size:18px;font-weight:700;color:#1a73e8}.kl{font-size:11px;color:#5f6368;margin-top:2px}' +
'table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}' +
'th{background:#1a73e8;color:white;padding:8px;text-align:left;font-size:12px}' +
'td{padding:7px 8px;border-bottom:1px solid #f0f0f0;font-size:12px}' +
'.note{font-size:11px;color:#5f6368;margin-top:10px}' +
'button{background:#1a73e8;color:white;border:none;border-radius:6px;padding:9px 18px;font-size:13px;cursor:pointer;margin-top:12px}' +
'</style></head><body>' +
'<h2>🏆 Résultats — '+state.entreprise.icon+' '+state.entreprise.nom+'</h2>' +
'<div class="score"><div class="sv">'+score.toLocaleString("fr-FR")+'</div><div style="color:#5f6368">points</div><div class="mention">'+mention+'</div></div>' +
'<div class="grid">' +
'<div class="kpi"><div class="kv">'+treso.toLocaleString("fr-FR")+'€</div><div class="kl">💰 Trésorerie finale</div></div>' +
'<div class="kpi"><div class="kv">'+immo.toLocaleString("fr-FR")+'€</div><div class="kl">🏗️ Immobilisations nettes</div></div>' +
'<div class="kpi"><div class="kv" style="color:'+(resultat>=0?"#1e8e3e":"#d93025")+'">'+resultat.toLocaleString("fr-FR")+'€</div><div class="kl">📈 Résultat net cumulé</div></div>' +
'<div class="kpi"><div class="kv">'+solv+'%</div><div class="kl">📊 Solvabilité</div></div>' +
'</div>' +
'<table><thead><tr><th>Trim.</th><th>Trésorerie</th><th>Résultat</th><th>Découvert</th></tr></thead><tbody>'+hist+'</tbody></table>' +
'<p class="note">Score = Résultat net ×3 + Immobilisations nettes ×2 + Trésorerie + Solvabilité (%)<br>Formule exacte du moteur TypeScript (calculators.ts — calculerScore)</p>' +
'<button onclick="google.script.host.close()">Fermer</button>' +
'</body></html>';
}

// ============================================================
// § 19. UTILITAIRES
// ============================================================

function melangerTableau(arr) {
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}
