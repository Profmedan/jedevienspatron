// JEDEVIENSPATRON — Google Sheets interactif
// Instructions :
//   1. Ouvrez un Google Sheet vierge
//   2. Extensions > Apps Script > collez ce fichier > sauvegardez
//   3. Rechargez la page — un menu "JDP" apparaît
//   4. Cliquez "Nouvelle partie" pour commencer

// ════════════════════════════════════════════════════════════════
//  UTILITAIRE
// ════════════════════════════════════════════════════════════════

function fmt(n) {
  if (n === undefined || n === null) return "0 €";
  return n.toLocaleString("fr-FR") + " €";
}

function calcClientsParTour(s) {
  let total = 0;
  for (const c of s.commerciauxActifs) total += (c.nbClients || 1);
  for (const d of s.decisionsActives) {
    const def = DECISIONS.find(x => x.id === d.id);
    if (def && def.clientType) total += 1;
    if (def && def.id === "publicite") total += 1; // +2 au total via le double push d'etape3
  }
  if (s.entreprise === "Azura Commerce") total += 1;
  return total;
}

// ════════════════════════════════════════════════════════════════
//  DONNÉES — Entreprises  (toutes valeurs en euros)
// ════════════════════════════════════════════════════════════════

const ENTREPRISES = {
  "Manufacture Belvaux": {
    icon: "🏭", type: "Production",
    immo: 16000, stocks: 4000, tresorerie: 8000,
    capitaux: 20000, emprunts: 8000,
    specialite: "⚡ Production : +1 000 € stocks/trim",
  },
  "Véloce Transports": {
    icon: "🚚", type: "Logistique",
    immo: 16000, stocks: 4000, tresorerie: 8000,
    capitaux: 20000, emprunts: 8000,
    specialite: "🚀 Logistique : délai encaissement −1 trim",
  },
  "Azura Commerce": {
    icon: "🏪", type: "Commerce",
    immo: 16000, stocks: 4000, tresorerie: 8000,
    capitaux: 20000, emprunts: 8000,
    specialite: "🛍 Commerce : +1 client Particulier/trim",
  },
  "Synergia Lab": {
    icon: "💡", type: "Innovation",
    immo: 13000, stocks: 4000, tresorerie: 8000,
    capitaux: 17000, emprunts: 8000,
    specialite: "💰 Innovation : +1 000 € produits financiers/trim",
  },
};

// ════════════════════════════════════════════════════════════════
//  DONNÉES — Clients  (ventes en euros)
// ════════════════════════════════════════════════════════════════

const CLIENTS = {
  particulier:  { label: "Particulier",  ventes: 2000, delai: 0 },
  tpe:          { label: "TPE",          ventes: 3000, delai: 1 },
  grand_compte: { label: "Grand Compte", ventes: 4000, delai: 2 },
};

// ════════════════════════════════════════════════════════════════
//  DONNÉES — Commerciaux  (coût en euros)
// ════════════════════════════════════════════════════════════════

const COMMERCIAUX = [
  { id: "junior",     label: "Commercial Junior",      cout: 1000, clientType: "particulier",  nbClients: 2 },
  { id: "senior",     label: "Commercial Senior",      cout: 2000, clientType: "tpe",          nbClients: 2 },
  { id: "directrice", label: "Directrice Commerciale", cout: 3000, clientType: "grand_compte", nbClients: 2 },
];

// ════════════════════════════════════════════════════════════════
//  DONNÉES — Cartes Décision  (valeurs alignées sur cartes.ts)
//  Champs :
//    immImm, tresoImm, empruntsImm, capitauxImm  — effets immédiats bilan
//    servExtImm                                  — services ext. immédiats (frais dossier)
//    servRec, tresoRec, revExceptRec             — effets récurrents CR
//    clientType, clientImmediat                  — client généré
//    usageUnique, rembTotal                      — comportements spéciaux
// ════════════════════════════════════════════════════════════════

const DECISIONS = [
  // ── Véhicules ──
  { id: "camionnette", label: "Camionnette", cat: "Véhicule",
    immImm: 8000, tresoImm: -8000, empruntsImm: 0, capitauxImm: 0, servExtImm: 0,
    servRec: 1000, tresoRec: -1000, revExceptRec: 0, clientType: "particulier",
    desc: "Immo +8 000€, Tréso −8 000€. Entretien +1 000€/trim. Capacité +6 (Prod/Log) ou +2 (Com/Inn)." },
  { id: "berline", label: "Berline", cat: "Véhicule",
    immImm: 8000, tresoImm: -8000, empruntsImm: 0, capitauxImm: 0, servExtImm: 0,
    servRec: 2000, tresoRec: -2000, revExceptRec: 0, clientType: null,
    desc: "Immo +8 000€, Tréso −8 000€. Entretien +2 000€/trim. +1 carte décision disponible/trim." },
  // ── Investissements ──
  { id: "site-internet", label: "Site Internet", cat: "Investissement",
    immImm: 4000, tresoImm: -4000, empruntsImm: 0, capitauxImm: 0, servExtImm: 0,
    servRec: 1000, tresoRec: -1000, revExceptRec: 0, clientType: "particulier",
    desc: "Immo +4 000€, Tréso −4 000€. Maintenance +1 000€/trim. +1 client Particulier/trim." },
  { id: "rse", label: "RSE", cat: "Investissement",
    immImm: 2000, tresoImm: 0, empruntsImm: 2000, capitauxImm: 0, servExtImm: 0,
    servRec: 1000, tresoRec: -1000, revExceptRec: 0, clientType: "particulier",
    desc: "Immo +2 000€ financé par emprunt (tréso inchangée). Charges +1 000€/trim. +1 client Particulier/trim." },
  { id: "r-d", label: "R&D", cat: "Investissement",
    immImm: 5000, tresoImm: -5000, empruntsImm: 0, capitauxImm: 0, servExtImm: 0,
    servRec: 2000, tresoRec: -2000, revExceptRec: 1000, clientType: "tpe",
    desc: "Immo +5 000€, Tréso −5 000€. R&D +2 000€/trim. CIR : +1 000€/trim. +1 client TPE/trim." },
  { id: "expansion", label: "Expansion", cat: "Investissement",
    immImm: 8000, tresoImm: -8000, empruntsImm: 0, capitauxImm: 0, servExtImm: 0,
    servRec: 1000, tresoRec: -1000, revExceptRec: 0, clientType: "grand_compte",
    desc: "Immo +8 000€, Tréso −8 000€. Loyer +1 000€/trim. Capacité +6 (Com/Inn) ou +4 (Prod/Log). +1 Grand Compte/trim." },
  // ── Financement ──
  { id: "levee-fonds", label: "Levée de Fonds", cat: "Financement",
    immImm: 0, tresoImm: 3000, empruntsImm: 0, capitauxImm: 6000, servExtImm: 3000,
    servRec: 0, tresoRec: 0, revExceptRec: 0, clientType: null,
    usageUnique: true,
    desc: "Capitaux +6 000€, Tréso net +3 000€ (après frais dossier 3 000€). Usage unique." },
  { id: "remb-anticipe", label: "Remboursement Anticipé", cat: "Financement",
    immImm: 0, tresoImm: -1000, empruntsImm: 0, capitauxImm: 0, servExtImm: 1000,
    servRec: 0, tresoRec: 0, revExceptRec: 0, clientType: null,
    rembTotal: true, usageUnique: true,
    desc: "Frais dossier 1 000€ + remboursement intégral de l'emprunt. Économise les intérêts futurs." },
  // ── Tactique ──
  { id: "publicite", label: "Publicité", cat: "Tactique",
    immImm: 0, tresoImm: 0, empruntsImm: 0, capitauxImm: 0, servExtImm: 0,
    servRec: 2000, tresoRec: -2000, revExceptRec: 0, clientType: "particulier",
    desc: "+2 clients Particuliers/trim. Campagne : ServExt +2 000€, Tréso −2 000€/trim." },
  { id: "formation", label: "Formation", cat: "Tactique",
    immImm: 0, tresoImm: -1000, empruntsImm: 0, capitauxImm: 0, servExtImm: 1000,
    servRec: 0, tresoRec: 0, revExceptRec: 0, clientType: "grand_compte",
    clientImmediat: true, usageUnique: true,
    desc: "Frais +1 000€. Gagnez immédiatement 1 Grand Compte." },
  // ── Services ──
  { id: "affacturage", label: "Affacturage", cat: "Service",
    immImm: 0, tresoImm: 0, empruntsImm: 0, capitauxImm: 0, servExtImm: 0,
    servRec: 2000, tresoRec: -2000, revExceptRec: 0, clientType: null,
    desc: "Toutes les créances sont encaissées immédiatement. Coût +2 000€/trim." },
  // ── Protection ──
  { id: "assurance", label: "Assurance Prévoyance", cat: "Protection",
    immImm: 0, tresoImm: -1000, empruntsImm: 0, capitauxImm: 0, servExtImm: 0,
    servRec: 1000, tresoRec: -1000, revExceptRec: 0, clientType: null,
    desc: "Annule les événements négatifs couverts. Prime +1 000€/trim." },
];

// ════════════════════════════════════════════════════════════════
//  DONNÉES — Événements  (toutes valeurs en euros)
// ════════════════════════════════════════════════════════════════

const EVENEMENTS = [
  { id: "client-vip", label: "Client VIP ⭐",
    ventes: 2000, treso: 2000, stocks: -2000,
    negatif: false, annulable: false,
    desc: "Buzz. Ventes +2 000€, Tréso +2 000€, Stocks −2 000€." },
  { id: "controle-fiscal", label: "Contrôle Fiscal 📋",
    impots: 2000, treso: -2000,
    negatif: true, annulable: true,
    desc: "Redressement. Impôts +2 000€, Tréso −2 000€." },
  { id: "subvention-innov", label: "Subvention Innovation 🎉",
    revExcept: 3000, treso: 3000,
    negatif: false, annulable: false,
    desc: "Subvention région. Rev. except. +3 000€, Tréso +3 000€." },
  { id: "placement", label: "Placement Financier 📈",
    prodFin: 1000, treso: 1000,
    negatif: false, annulable: false,
    desc: "Intérêts. Prod. fin. +1 000€, Tréso +1 000€." },
  { id: "crise-sanitaire", label: "Crise Sanitaire 😷",
    chargExcept: 2000, treso: -2000,
    negatif: true, annulable: true,
    desc: "Crise. Charges except. +2 000€, Tréso −2 000€." },
  { id: "incendie", label: "Incendie 🔥",
    revExcept: 2000, treso: 2000,
    negatif: false, annulable: false,
    desc: "Indemnités assurance. Rev. except. +2 000€, Tréso +2 000€." },
  { id: "greve", label: "Grève ✊",
    chargExcept: 2000, treso: -2000,
    negatif: true, annulable: true,
    desc: "Arrêt production. Charges except. +2 000€, Tréso −2 000€." },
  { id: "bouche-oreille", label: "Bouche à Oreille 📣",
    ventes: 1000, treso: 1000,
    negatif: false, annulable: false,
    desc: "Buzz clients. Ventes +1 000€, Tréso +1 000€." },
  { id: "perte-donnees", label: "Perte de Données 💾",
    chargExcept: 2000, treso: -2000,
    negatif: true, annulable: true,
    desc: "Cyberincident. Charges except. +2 000€, Tréso −2 000€." },
  { id: "dev-durable", label: "Développement Durable 🌿",
    ventes: 3000, creancesC2: 3000, stocks: -3000,
    negatif: false, annulable: false,
    desc: "Marché public. Ventes +3 000€, Créances C+2 +3 000€, Stocks −3 000€." },
];

// ════════════════════════════════════════════════════════════════
//  CONFIGURATION — Lecture de l'onglet "⚙ Config"
//  Toutes les valeurs sont modifiables dans la feuille.
//  Si l'onglet est absent, les valeurs par défaut ci-dessous s'appliquent.
// ════════════════════════════════════════════════════════════════

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("⚙ Config");
  function v(row, col, def) {
    if (!sh) return def;
    const val = sh.getRange(row, col).getValue();
    return (val !== "" && val !== null && val !== undefined && !isNaN(Number(val)) && val !== false)
      ? Number(val) : def;
  }
  const cfg = {
    // Clients
    particulierVentes:   v(4,  2, 2000),
    tpeVentes:           v(5,  2, 3000),
    gcVentes:            v(6,  2, 4000),
    // Commerciaux
    juniorCout:          v(9,  2, 1000),
    juniorNbClients:     v(9,  5, 2),
    seniorCout:          v(10, 2, 2000),
    seniorNbClients:     v(10, 5, 2),
    directriceCout:      v(11, 2, 3000),
    directriceNbClients: v(11, 5, 2),
    // Charges
    chargesFixes:        v(14, 2, 2000),
    rembEmprunt:         v(15, 2, 1000),
    // Bilan initial
    tresoInitiale:       v(18, 2, 8000),
    stocksInitiaux:      v(19, 2, 4000),
    capaciteBase:        v(20, 2, 4),
  };
  // Objets dérivés (utilisés dans etape4, appliquerDecision, churn…)
  cfg.clients = {
    particulier:  { label: "Particulier",  ventes: cfg.particulierVentes, delai: 0 },
    tpe:          { label: "TPE",          ventes: cfg.tpeVentes,         delai: 1 },
    grand_compte: { label: "Grand Compte", ventes: cfg.gcVentes,          delai: 2 },
  };
  cfg.commerciaux = [
    { id: "junior",     label: "Commercial Junior",      cout: cfg.juniorCout,     clientType: "particulier",  nbClients: cfg.juniorNbClients },
    { id: "senior",     label: "Commercial Senior",      cout: cfg.seniorCout,     clientType: "tpe",          nbClients: cfg.seniorNbClients },
    { id: "directrice", label: "Directrice Commerciale", cout: cfg.directriceCout, clientType: "grand_compte", nbClients: cfg.directriceNbClients },
  ];
  return cfg;
}

// ── Créer / réinitialiser l'onglet de configuration ─────────────

function menuCreerOngletConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  let sh = ss.getSheetByName("⚙ Config");
  if (sh) {
    const rep = ui.alert("Réinitialiser ?",
      "L'onglet ⚙ Config existe déjà. Voulez-vous le réinitialiser avec les valeurs par défaut ?",
      ui.ButtonSet.YES_NO);
    if (rep !== ui.Button.YES) return;
    ss.deleteSheet(sh);
  }
  sh = ss.insertSheet("⚙ Config");
  sh.setTabColor("#37474f");

  const data = [
    ["⚙ PARAMÈTRES DU JEU  —  Modifiez les valeurs en jaune, puis relancez une nouvelle partie.", "", "", "", ""],
    ["", "", "", "", ""],
    ["── CLIENTS ──", "", "", "", ""],
    ["Particulier — Chiffre d'affaires/trim", 2000, "€", "", ""],
    ["TPE — Chiffre d'affaires/trim",         3000, "€", "", ""],
    ["Grand Compte — Chiffre d'affaires/trim", 4000, "€", "", ""],
    ["", "", "", "", ""],
    ["── COMMERCIAUX ──", "", "", "", ""],
    ["Junior — Salaire/trim",     1000, "€", "Clients apportés/trim", 2],
    ["Senior — Salaire/trim",     2000, "€", "Clients apportés/trim", 2],
    ["Directrice — Salaire/trim", 3000, "€", "Clients apportés/trim", 2],
    ["", "", "", "", ""],
    ["── CHARGES FIXES ──", "", "", "", ""],
    ["Charges fixes/trim (loyer, téléphonie…)", 2000, "€", "", ""],
    ["Remboursement emprunt/trim",              1000, "€", "", ""],
    ["", "", "", "", ""],
    ["── BILAN INITIAL ──", "", "", "", ""],
    ["Trésorerie initiale",             8000, "€", "", ""],
    ["Stocks initiaux",                 4000, "€", "", ""],
    ["Capacité de base (clients/trim)",    4, "",  "", ""],
  ];

  sh.getRange(1, 1, data.length, 5).setValues(data);

  // Largeurs colonnes
  sh.setColumnWidth(1, 330);
  sh.setColumnWidth(2, 100);
  sh.setColumnWidth(3,  40);
  sh.setColumnWidth(4, 190);
  sh.setColumnWidth(5,  80);

  // Titre
  sh.getRange(1, 1, 1, 5).merge()
    .setBackground("#37474f").setFontColor("#ffffff")
    .setFontWeight("bold").setFontSize(11);

  // En-têtes de section
  [3, 8, 13, 17].forEach(function(r) {
    sh.getRange(r, 1, 1, 5)
      .setBackground("#eceff1").setFontWeight("bold");
  });

  // Cellules éditables — colonne B
  [4, 5, 6, 9, 10, 11, 14, 15, 18, 19, 20].forEach(function(r) {
    sh.getRange(r, 2).setBackground("#fff9c4").setFontWeight("bold");
  });
  // Colonne E (nbClients)
  [9, 10, 11].forEach(function(r) {
    sh.getRange(r, 5).setBackground("#fff9c4").setFontWeight("bold");
  });

  // Protection légère (avertissement si modification hors jaune)
  const prot = sh.protect().setDescription("Config JDP — ne modifier que les cellules jaunes");
  prot.setWarningOnly(true);

  ui.alert("✅ Onglet ⚙ Config créé !\n\nModifiez les valeurs en jaune, puis lancez une nouvelle partie pour les appliquer.");
}

// ════════════════════════════════════════════════════════════════
//  ÉTAT DU JEU
// ════════════════════════════════════════════════════════════════

function getState() {
  const raw = PropertiesService.getDocumentProperties().getProperty("etat");
  if (!raw) return null;
  return JSON.parse(raw);
}

function saveState(s) {
  PropertiesService.getDocumentProperties().setProperty("etat", JSON.stringify(s));
}

function newState(entreprise, nbTours, pseudo) {
  const e   = ENTREPRISES[entreprise];
  const cfg = getConfig();
  // Tréso et stocks depuis Config (ou valeurs par défaut de l'entreprise)
  const tresoInit   = cfg.tresoInitiale  || e.tresorerie;
  const stocksInit  = cfg.stocksInitiaux || e.stocks;
  // Recalcul des capitaux propres pour équilibrer le bilan : Actif − Emprunts
  const capitauxInit = e.immo + stocksInit + tresoInit - e.emprunts;
  return {
    pseudo, entreprise, nbTours,
    tour: 1,
    // Bilan (en euros)
    immo: e.immo, stocks: stocksInit, tresorerie: tresoInit,
    creancesC1: 0, creancesC2: 0,
    capitaux: capitauxInit, emprunts: e.emprunts,
    dettes: 0, dettesD2: 0, decouvert: 0,
    // Compte de résultat (cumulatif, en euros)
    ventes: 0, productionStockee: 0, prodFin: 0, revExcept: 0,
    cmv: 0, servExt: 0, chargesPersonnel: 0,
    dotations: 0, chargesInteret: 0, chargesExcept: 0, impots: 0,
    // Cartes
    commerciauxActifs: [{ id: "junior", label: "Commercial Junior", cout: cfg.juniorCout, clientType: "particulier", nbClients: cfg.juniorNbClients }],
    decisionsActives: [],
    capaciteBonus: 0,
    clientsServis: 0,
    clientsGeneresCeTour: 0,
    portfolio: [],          // clients fidèles retenus d'un tour à l'autre
    // Log
    journal: [],
    elimine: false,
  };
}

// ════════════════════════════════════════════════════════════════
//  LOGIQUE DE JEU
// ════════════════════════════════════════════════════════════════

function etape0(s) {
  const log = [];

  // Agios sur découvert existant (10% du découvert, min 1 000€)
  if (s.decouvert > 0) {
    const agios = Math.max(1000, Math.ceil(s.decouvert * 0.10 / 1000) * 1000);
    s.tresorerie     -= agios;
    s.chargesInteret += agios;
    log.push("Agios découvert : " + fmt(agios));
  }

  // Paiement dettes fournisseurs D+1
  if (s.dettes > 0) {
    s.tresorerie -= s.dettes;
    log.push("Paiement dettes D+1 : tréso −" + fmt(s.dettes));
    s.dettes = 0;
  }

  // Avancement D+2 → D+1
  if (s.dettesD2 > 0) {
    s.dettes  += s.dettesD2;
    log.push("Dettes D+2 → D+1 : " + fmt(s.dettesD2));
    s.dettesD2 = 0;
  }

  // Remboursement emprunt (1 000€/trim)
  if (s.emprunts >= 1000) {
    s.tresorerie -= 1000;
    s.emprunts   -= 1000;
    log.push("Remboursement emprunt : tréso −1 000€, emprunts −1 000€");
    // Intérêts annuels (5%/an) — déclenchés tous les 4 trimestres
    if (s.tour % 4 === 1 && s.emprunts > 0) {
      const interets = Math.max(1000, Math.round(s.emprunts * 0.05 / 1000) * 1000);
      s.tresorerie     -= interets;
      s.chargesInteret += interets;
      log.push("Intérêts emprunt annuels : " + fmt(interets));
    }
  }

  // Charges fixes (configurables dans ⚙ Config)
  const cfgCharges = getConfig().chargesFixes;
  s.tresorerie -= cfgCharges;
  s.servExt    += cfgCharges;
  log.push("Charges fixes : tréso −" + fmt(cfgCharges) + ", services ext. +" + fmt(cfgCharges));

  // Amortissement (1 000€/trim si immo > 0)
  if (s.immo > 0) {
    s.immo      -= 1000;
    s.dotations += 1000;
    log.push("Amortissement : immo −1 000€, dotations +1 000€");
  }

  // Découvert automatique si tréso négative
  if (s.tresorerie < 0) {
    s.decouvert += Math.abs(s.tresorerie);
    s.tresorerie = 0;
    log.push("⚠ Découvert : " + fmt(s.decouvert));
  }

  return log;
}

function etape2(s) {
  const log = [];
  const hasAffacturage = s.decisionsActives.some(c => c.id === "affacturage");
  if (hasAffacturage) {
    if (s.creancesC1 > 0) { s.tresorerie += s.creancesC1; log.push("Affacturage C+1 : +" + fmt(s.creancesC1)); s.creancesC1 = 0; }
    if (s.creancesC2 > 0) { s.tresorerie += s.creancesC2; log.push("Affacturage C+2 : +" + fmt(s.creancesC2)); s.creancesC2 = 0; }
  } else {
    if (s.creancesC1 > 0) {
      s.tresorerie += s.creancesC1;
      log.push("Encaissement C+1 : +" + fmt(s.creancesC1));
      s.creancesC1 = 0;
    }
    if (s.creancesC2 > 0) {
      s.creancesC1 += s.creancesC2;
      log.push("Avancement C+2 → C+1 : " + fmt(s.creancesC2));
      s.creancesC2 = 0;
    }
  }
  if (log.length === 0) log.push("Pas de créances.");
  return log;
}

function etape3(s) {
  const log = [];

  // Partir du portefeuille fidèle du tour précédent
  const portfolio = s.portfolio || [];
  const clients = [...portfolio];
  if (portfolio.length > 0)
    log.push("Portfolio fidèle : " + portfolio.length + " client(s) reconduit(s)");

  // Nouveaux clients des commerciaux actifs
  for (const c of s.commerciauxActifs) {
    s.tresorerie      -= c.cout;
    s.chargesPersonnel += c.cout;
    const nb = c.nbClients || 1;
    for (let i = 0; i < nb; i++) clients.push(c.clientType);
    log.push(c.label + " : salaire −" + fmt(c.cout) + ", +" + nb + " " + c.clientType + "(s)");
  }

  // Décisions générant des clients récurrents
  for (const d of s.decisionsActives) {
    const def = DECISIONS.find(x => x.id === d.id);
    if (def && def.clientType) {
      clients.push(def.clientType);
      log.push(def.label + " : +1 " + def.clientType);
    }
    if (def && def.id === "publicite") {
      clients.push("particulier");
      log.push("Publicité : +1 Particulier bonus");
    }
  }

  // Spécialité Azura Commerce
  if (s.entreprise === "Azura Commerce") {
    clients.push("particulier");
    log.push("Azura Commerce (spécialité) : +1 Particulier");
  }

  s.clientsGeneresCeTour = clients.length;
  if (log.length === 0) log.push("Pas de commercial actif.");
  return { log, clients };
}

function etape4(s, clientsATrait) {
  const log = [];
  const newPortfolio = [];
  const cfg4 = getConfig();
  const capacite = cfg4.capaciteBase + s.capaciteBonus;
  const traites  = clientsATrait.slice(0, capacite);
  const perdus   = clientsATrait.slice(capacite);  // dépassement capacité → perdus

  for (const type of traites) {
    const c = cfg4.clients[type];
    if (!c) continue;
    if (s.stocks < 1000) {
      log.push("⚠ Stock insuffisant — " + c.label + " perdu");
      continue; // pas de stock → client perdu (pas ajouté au portfolio)
    }
    s.ventes   += c.ventes;
    s.stocks   -= 1000;
    s.cmv      += 1000;
    s.clientsServis = (s.clientsServis || 0) + 1;
    newPortfolio.push(type); // client servi → reste dans le portfolio
    if (c.delai === 0)      { s.tresorerie  += c.ventes; log.push(c.label + " : +" + fmt(c.ventes) + " (tréso)"); }
    else if (c.delai === 1) { s.creancesC1  += c.ventes; log.push(c.label + " : +" + fmt(c.ventes) + " (C+1)"); }
    else                    { s.creancesC2  += c.ventes; log.push(c.label + " : +" + fmt(c.ventes) + " (C+2)"); }
  }

  s.portfolio = newPortfolio; // mise à jour du portfolio

  if (perdus.length > 0) log.push("⚠ " + perdus.length + " client(s) perdu(s) — capacité max " + capacite);
  if (clientsATrait.length === 0) log.push("Pas de clients.");
  return log;
}

function etape5(s) {
  const log = [];

  // Effets récurrents des cartes décision
  for (const d of s.decisionsActives) {
    const def = DECISIONS.find(x => x.id === d.id);
    if (!def) continue;
    if (def.servRec) {
      s.servExt    += def.servRec;
      if (def.tresoRec) s.tresorerie += def.tresoRec;
      log.push(def.label + " : servExt +" + fmt(def.servRec));
    }
    if (def.revExceptRec) {
      s.revExcept  += def.revExceptRec;
      s.tresorerie += def.revExceptRec;
      log.push(def.label + " CIR : rev. except. +" + fmt(def.revExceptRec));
    }
  }

  // Spécialité Manufacture Belvaux : +1 000€ production stockée + stocks
  if (s.entreprise === "Manufacture Belvaux") {
    s.productionStockee += 1000;
    s.stocks            += 1000;
    log.push("Manufacture Belvaux (spécialité) : production stockée +1 000€, stocks +1 000€");
  }

  // Spécialité Synergia Lab : +1 000€ produits financiers
  if (s.entreprise === "Synergia Lab") {
    s.prodFin    += 1000;
    s.tresorerie += 1000;
    log.push("Synergia Lab (spécialité) : produits financiers +1 000€, tréso +1 000€");
  }

  // Churn : tous les 4 trimestres, −1 client par commercial (départ à la concurrence)
  if (s.tour % 4 === 0 && s.portfolio && s.portfolio.length > 0) {
    const nbChurn = Math.min(s.commerciauxActifs.length, s.portfolio.length);
    for (let i = 0; i < nbChurn; i++) {
      // Le client particulier part en premier (le moins fidèle)
      let idx = s.portfolio.findIndex(t => t === "particulier");
      if (idx < 0) idx = s.portfolio.findIndex(t => t === "tpe");
      if (idx < 0) idx = 0;
      const removed = s.portfolio.splice(idx, 1)[0];
      const cl5 = getConfig().clients;
      log.push("Churn T" + s.tour + " : 1 " + (cl5[removed] ? cl5[removed].label : removed) + " perdu (concurrence)");
    }
  }

  if (log.length === 0) log.push("Pas d'effets récurrents.");
  return log;
}

function appliquerDecision(s, decisionId) {
  // Recrutement commercial
  const comm = COMMERCIAUX.find(c => c.id === decisionId);
  if (comm) {
    s.commerciauxActifs.push({ ...comm });
    s.tresorerie       -= comm.cout;
    s.chargesPersonnel += comm.cout;
    return comm.label + " recruté(e). Tréso −" + fmt(comm.cout);
  }

  const def = DECISIONS.find(d => d.id === decisionId);
  if (!def) return "Carte introuvable.";

  // Effets immédiats bilan
  if (def.immImm)      s.immo      += def.immImm;
  if (def.tresoImm)    s.tresorerie += def.tresoImm;
  if (def.empruntsImm) s.emprunts  += def.empruntsImm;
  if (def.capitauxImm) s.capitaux  += def.capitauxImm;
  // Frais de dossier immédiats (services ext.)
  if (def.servExtImm)  s.servExt   += def.servExtImm;

  // Remboursement anticipé
  let extra = "";
  if (def.rembTotal && s.emprunts > 0) {
    s.tresorerie -= s.emprunts;
    extra = " Emprunt soldé (" + fmt(s.emprunts) + ").";
    s.emprunts = 0;
  }

  // Client immédiat (Formation)
  if (def.clientImmediat && def.clientType) {
    const c = getConfig().clients[def.clientType];
    s.ventes += c.ventes;
    if (s.stocks >= 1000) { s.stocks -= 1000; s.cmv += 1000; }
    if (c.delai === 0)      s.tresorerie += c.ventes;
    else if (c.delai === 1) s.creancesC1 += c.ventes;
    else                    s.creancesC2 += c.ventes;
    extra += " +1 " + def.clientType + " immédiat (" + fmt(c.ventes) + ").";
  }

  // Bonus capacité logistique — différencié par type d'entreprise
  if (def.id === "camionnette" || def.id === "expansion") {
    const type = (ENTREPRISES[s.entreprise] || {}).type || "";
    const isPhysique = type === "Production" || type === "Logistique";
    let bonus = 0;
    if (def.id === "camionnette") bonus = isPhysique ? 6 : 2;
    if (def.id === "expansion")   bonus = isPhysique ? 4 : 6;
    s.capaciteBonus += bonus;
    extra += " Capacité +" + bonus + " → " + (4 + s.capaciteBonus) + ".";
  }

  if (!def.usageUnique) s.decisionsActives.push({ id: def.id, label: def.label });

  return def.label + " activé(e)." + extra;
}

function appliquerEvenement(s, evId) {
  const ev = EVENEMENTS.find(e => e.id === evId);
  if (!ev) return "Événement introuvable.";

  const hasAssurance = s.decisionsActives.some(d => d.id === "assurance");
  if (ev.negatif && ev.annulable && hasAssurance) {
    return ev.label + " — ANNULÉ par l'assurance prévoyance 🛡";
  }

  if (ev.ventes)      s.ventes         += ev.ventes;
  if (ev.treso)       s.tresorerie      += ev.treso;
  if (ev.stocks)      s.stocks          += ev.stocks;
  if (ev.cmv)         s.cmv             += ev.cmv;
  if (ev.impots)      { s.impots        += ev.impots; s.tresorerie += ev.impots; }
  if (ev.revExcept)   s.revExcept       += ev.revExcept;
  if (ev.prodFin)     s.prodFin         += ev.prodFin;
  if (ev.chargExcept) s.chargesExcept   += ev.chargExcept;
  if (ev.creancesC2)  s.creancesC2      += ev.creancesC2;

  if (s.tresorerie < 0) {
    s.decouvert += Math.abs(s.tresorerie);
    s.tresorerie = 0;
  }

  return ev.label + " — " + ev.desc;
}

function getResultatNet(s) {
  const produits = s.ventes + s.productionStockee + s.prodFin + s.revExcept;
  const charges  = s.cmv + s.servExt + s.chargesPersonnel + s.dotations +
                   s.chargesInteret + s.chargesExcept + s.impots;
  return produits - charges;
}

function checkFaillite(s) {
  const resultat = getResultatNet(s);
  if (s.capitaux + resultat < 0)
    return "Capitaux propres négatifs — insolvabilité.";
  if (s.decouvert > 8000)
    return "Découvert bancaire dépassé (" + fmt(s.decouvert) + " > 8 000€).";
  return null;
}

// ════════════════════════════════════════════════════════════════
//  AFFICHAGE — Google Sheet
// ════════════════════════════════════════════════════════════════

function updateSheet(s) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("JDP");
  if (!sh) sh = ss.insertSheet("JDP");
  sh.clearContents();
  sh.clearFormats();

  const e = ENTREPRISES[s.entreprise] || {};
  const resultat = getResultatNet(s);

  // ── Indicateurs calculés ──────────────────────────────────────
  const totalPassif   = s.capitaux + s.emprunts + s.decouvert + resultat;
  const solvabilite   = totalPassif > 0 ? Math.round((s.capitaux + resultat) / totalPassif * 100) : 0;
  const margeB        = s.ventes - s.cmv;
  const margePct      = s.ventes > 0 ? Math.round(margeB / s.ventes * 100) : 0;
  const ebe           = margeB - s.servExt - s.chargesPersonnel;
  const reExp         = ebe - s.dotations - s.chargesInteret;
  const fr            = (s.capitaux + resultat + s.emprunts) - s.immo;
  const bfr           = (s.stocks + s.creancesC1 + s.creancesC2) - (s.dettes + s.dettesD2);
  const tresoNette    = fr - bfr;
  const cpTotal       = s.capitaux + resultat;
  const tauxEndet     = cpTotal > 0 ? Math.round(s.emprunts / cpTotal * 100) + "%" : s.emprunts > 0 ? "∞" : "0%";

  const data = [
    // [0] row 1
    ["🎮 JEDEVIENSPATRON", "", "TRIMESTRE", s.tour + " / " + s.nbTours, "", s.elimine ? "💀 ÉLIMINÉ" : "✅ En jeu"],
    // [1] row 2
    [(e.icon || "") + " " + s.entreprise + "  —  " + s.pseudo + "   " + (e.specialite || ""), "", "", "", "", ""],
    // [2] row 3
    ["", "", "", "", "", ""],

    // [3] row 4 — BILAN
    ["═══ BILAN ═══", "", "", "", "", ""],
    // [4] row 5
    ["ACTIF", "Valeur (€)", "", "PASSIF", "Valeur (€)", ""],
    // [5] row 6
    ["Immobilisations",   s.immo,       "", "Capitaux propres", s.capitaux,            ""],
    // [6] row 7
    ["Stocks",            s.stocks,     "", "Résultat net",     resultat,               ""],
    // [7] row 8
    ["Créances C+1",      s.creancesC1, "", "Emprunts",         s.emprunts,             ""],
    // [8] row 9
    ["Créances C+2",      s.creancesC2, "", "Découvert",        s.decouvert,            ""],
    // [9] row 10
    ["Trésorerie",        s.tresorerie, "", "Dettes fourn.",    s.dettes + s.dettesD2,  ""],
    // [10] row 11
    ["", "", "", "", "", ""],

    // [11] row 12 — COMPTE DE RÉSULTAT
    ["═══ COMPTE DE RÉSULTAT ═══", "", "", "", "", ""],
    // [12] row 13
    ["CHARGES", "Valeur (€)", "", "PRODUITS", "Valeur (€)", ""],
    // [13] row 14
    ["Coût marchandises (CMV)",  s.cmv,              "", "Ventes",                s.ventes,            ""],
    // [14] row 15
    ["Services extérieurs",      s.servExt,          "", "Prod. stockée",         s.productionStockee, ""],
    // [15] row 16
    ["Charges personnel",        s.chargesPersonnel, "", "Produits financiers",   s.prodFin,           ""],
    // [16] row 17
    ["Dotations amortissements", s.dotations,        "", "Revenus exceptionnels", s.revExcept,         ""],
    // [17] row 18
    ["Charges intérêts",         s.chargesInteret,   "", "", "", ""],
    // [18] row 19
    ["Charges exceptionnelles",  s.chargesExcept,    "", "", "", ""],
    // [19] row 20
    ["Impôts & taxes",           s.impots,           "", "", "", ""],
    // [20] row 21
    ["", "", "", "RÉSULTAT NET", resultat, ""],
    // [21] row 22
    ["", "", "", "", "", ""],

    // [22] row 23 — INDICATEURS
    ["═══ INDICATEURS ═══", "", "", "", "", ""],
    // [23] row 24
    ["Portfolio (clients fidèles)", (s.portfolio || []).length, "", "Nouveaux clients/trim",    calcClientsParTour(s),       ""],
    // [24] row 25
    ["Clients servis ce trim.",     s.clientsServis || 0,       "", "Capacité max clients/trim", 4 + s.capaciteBonus,         ""],
    // [25b] row 26
    ["Clients perdus ce trim.",     Math.max(0, (s.clientsGeneresCeTour || 0) - (s.clientsServis || 0)), "", "Churn (tous les 4 trim.)", s.commerciauxActifs.length + "/trim", ""],
    // [25] row 26
    ["Marge brute (€)",        margeB,               "", "Marge brute (%)",         margePct + "%",         ""],
    // [26] row 27
    ["EBE",                    ebe,                  "", "Résultat d'exploitation", reExp,                  ""],
    // [27] row 28
    ["Fonds de Roulement (FR)", fr,                  "", "Besoin en FR (BFR)",      bfr,                    ""],
    // [28] row 29
    ["Trésorerie nette",        tresoNette,           "", "Taux d'endettement",      tauxEndet,              ""],
    // [29] row 30
    ["Solvabilité",             solvabilite + "%",    "", "", "", ""],
    // [29] row 30
    ["", "", "", "", "", ""],

    // [30] row 31 — CARTES ACTIVES
    ["═══ CARTES ACTIVES ═══", "", "", "", "", ""],
    // [31] row 32
    ["Commerciaux", s.commerciauxActifs.map(c => c.label).join(", ") || "—",
     "", "Décisions", s.decisionsActives.map(d => d.label).join(", ") || "—", ""],
    // [32] row 33
    ["", "", "", "", "", ""],

    // [33] row 34 — JOURNAL
    ["═══ JOURNAL DU TRIMESTRE ═══", "", "", "", "", ""],
    ...s.journal.map(entry => [entry, "", "", "", "", ""]),
  ];

  sh.getRange(1, 1, data.length, 6).setValues(data);

  // Format monétaire sur colonnes valeurs
  const eurFormat = '#,##0 "€"';
  sh.getRange(5, 2, 6, 1).setNumberFormat(eurFormat);
  sh.getRange(5, 5, 6, 1).setNumberFormat(eurFormat);
  sh.getRange(13, 2, 9, 1).setNumberFormat(eurFormat);
  sh.getRange(13, 5, 4, 1).setNumberFormat(eurFormat);
  sh.getRange(21, 5, 1, 1).setNumberFormat(eurFormat);
  sh.getRange(24, 2, 5, 1).setNumberFormat(eurFormat);
  sh.getRange(24, 5, 4, 1).setNumberFormat(eurFormat);

  // Styles sections
  sh.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor("#1a73e8");
  sh.getRange("A4").setFontWeight("bold").setBackground("#e8f0fe");
  sh.getRange("A12").setFontWeight("bold").setBackground("#e8f0fe");
  sh.getRange("A23").setFontWeight("bold").setBackground("#fef9e7");
  sh.getRange("A31").setFontWeight("bold").setBackground("#e8f0fe");
  sh.getRange("A34").setFontWeight("bold").setBackground("#e8f0fe");
  sh.setColumnWidth(1, 240);
  sh.setColumnWidth(2, 110);
  sh.setColumnWidth(4, 240);
  sh.setColumnWidth(5, 110);

  // Couleurs résultat net (row 21)
  sh.getRange(21, 5).setFontWeight("bold")
    .setFontColor(resultat >= 0 ? "#137333" : "#c0392b");
  // Couleurs EBE / Résultat exploitation (row 26)
  sh.getRange(27, 2).setFontColor(ebe  >= 0 ? "#137333" : "#c0392b");
  sh.getRange(27, 5).setFontColor(reExp >= 0 ? "#137333" : "#c0392b");
  // Couleurs FR / BFR (row 28)
  sh.getRange(28, 2).setFontColor(fr  >= 0 ? "#137333" : "#c0392b");
  sh.getRange(28, 5).setFontColor(bfr >= 0 ? "#e37400" : "#137333");
  // Trésorerie nette (row 29)
  sh.getRange(29, 2).setFontColor(tresoNette >= 0 ? "#137333" : "#c0392b");

  // Alerte découvert
  if (s.decouvert > 0) sh.getRange("A1:F1").setBackground("#fce8e6");

  sh.activate();
}

// ════════════════════════════════════════════════════════════════
//  MENU
// ════════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎮 JDP")
    .addItem("🆕 Nouvelle partie",             "menuNouvellePartie")
    .addSeparator()
    .addItem("▶ Lancer le trimestre",          "menuLancerTrimestre")
    .addSeparator()
    .addItem("📦 [1] Acheter des stocks",       "menuAcheterStocks")
    .addItem("🏦 [1] Demander un emprunt",      "menuDemanderEmprunt")
    .addItem("👔 [6a] Recruter un commercial",  "menuRecruterCommercial")
    .addItem("🎯 [6b] Carte décision",          "menuCarteDecision")
    .addItem("🎲 [7] Choisir l'événement",      "menuEvenement")
    .addSeparator()
    .addItem("⏭ Trimestre suivant",             "menuTrimestreSuivant")
    .addSeparator()
    .addItem("⚙ Paramètres du jeu",            "menuCreerOngletConfig")
    .addToUi();
}

// ── Achats de stock (hors flux automatique) ──────────────────────

function menuAcheterStocks() {
  const ui = SpreadsheetApp.getUi();
  const s  = getState();
  if (!s) { ui.alert("Lancez d'abord une nouvelle partie."); return; }

  const r = ui.prompt(
    "📦 Achats de marchandises",
    "Stocks : " + fmt(s.stocks) + "   Tréso : " + fmt(s.tresorerie) + "\n\nQuantité à acheter (0 = passer) :",
    ui.ButtonSet.OK_CANCEL
  );
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const qte = parseInt(r.getResponseText());
  if (isNaN(qte) || qte <= 0) return;

  const rMode = ui.prompt(
    "Mode de paiement",
    "1. Comptant (trésorerie)\n2. À crédit (dette fournisseur)\n\nNuméro :",
    ui.ButtonSet.OK_CANCEL
  );
  if (rMode.getSelectedButton() !== ui.Button.OK) return;
  const mode    = rMode.getResponseText().trim() === "2" ? "dettes" : "tresorerie";
  const montant = qte * 1000;

  if (mode === "tresorerie") {
    s.tresorerie -= montant;
  } else {
    if (Math.random() < 0.4) s.dettesD2 += montant; else s.dettes += montant;
  }
  s.stocks += montant;
  s.journal.push("[1] Achats : +" + qte + " unités (" + fmt(montant) + ") — " + (mode === "tresorerie" ? "comptant" : "crédit"));

  saveState(s); updateSheet(s);
  ui.alert("✅ +" + qte + " unités achetées (" + fmt(montant) + ").");
}

// ── Demande d'emprunt (hors flux automatique) ────────────────────

function menuDemanderEmprunt() {
  const ui = SpreadsheetApp.getUi();
  const s  = getState();
  if (!s) { ui.alert("Lancez d'abord une nouvelle partie."); return; }

  const montants = [5000, 8000, 12000, 16000, 20000];
  const r = ui.prompt(
    "🏦 Demande d'emprunt bancaire",
    "Tréso : " + fmt(s.tresorerie) + "   Emprunts : " + fmt(s.emprunts) + "\n\n" +
    montants.map((m, i) => (i+1) + ". " + fmt(m)).join("\n") + "\n\nNuméro :",
    ui.ButtonSet.OK_CANCEL
  );
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const idx = parseInt(r.getResponseText()) - 1;
  if (isNaN(idx) || idx < 0 || idx >= montants.length) { ui.alert("Choix invalide."); return; }

  const montant = montants[idx];
  const score   = s.capitaux > 0 && s.tresorerie >= 0 ? 70 : s.capitaux > 0 ? 52 : 30;
  if (score >= 50) {
    const taux = score < 65 ? "8%/an (majoré)" : "5%/an";
    s.tresorerie += montant;
    s.emprunts   += montant;
    s.journal.push("[1] Emprunt accordé : +" + fmt(montant) + " (" + taux + ")");
    ui.alert("✅ Prêt de " + fmt(montant) + " accordé.\nTaux : " + taux + "\nScore : " + score + "/100");
  } else {
    s.journal.push("[1] Emprunt refusé (score " + score + "/100)");
    ui.alert("❌ Prêt refusé\nScore : " + score + "/100");
  }

  saveState(s); updateSheet(s);
}

// ── Nouvelle partie ──────────────────────────────────────────────

function menuNouvellePartie() {
  const ui = SpreadsheetApp.getUi();

  const rNom = ui.prompt("Nouvelle partie", "Votre prénom :", ui.ButtonSet.OK_CANCEL);
  if (rNom.getSelectedButton() !== ui.Button.OK) return;
  const pseudo = rNom.getResponseText() || "Joueur";

  const entreprises = Object.keys(ENTREPRISES);
  const rEnt = ui.prompt(
    "Choisir l'entreprise",
    entreprises.map((en, i) =>
      (i+1) + ". " + ENTREPRISES[en].icon + " " + en + " (" + ENTREPRISES[en].type + ")\n   " + ENTREPRISES[en].specialite
    ).join("\n\n") + "\n\nNuméro :",
    ui.ButtonSet.OK_CANCEL
  );
  if (rEnt.getSelectedButton() !== ui.Button.OK) return;
  const idxEnt = parseInt(rEnt.getResponseText()) - 1;
  if (isNaN(idxEnt) || idxEnt < 0 || idxEnt >= entreprises.length) { ui.alert("Choix invalide."); return; }

  const rTours = ui.prompt(
    "Durée de la partie",
    "1. 6 trimestres (~1h)\n2. 8 trimestres (~1h15)\n3. 10 trimestres (~1h30)\n4. 12 trimestres (~1h45)\n\nNuméro :",
    ui.ButtonSet.OK_CANCEL
  );
  if (rTours.getSelectedButton() !== ui.Button.OK) return;
  const nbTours = [6, 8, 10, 12][parseInt(rTours.getResponseText()) - 1] || 6;

  const s = newState(entreprises[idxEnt], nbTours, pseudo);
  s.journal.push("🎮 Partie démarrée — " + entreprises[idxEnt] + " — " + nbTours + " trimestres");
  s.journal.push("💼 Commercial Junior attribué d'office — salaire prélevé dès T1, 2 clients Particuliers générés.");
  saveState(s);
  updateSheet(s);
  ui.alert("✅ Partie démarrée !\n\n" + pseudo + " — " + entreprises[idxEnt] + "\n" + nbTours + " trimestres\n\nCliquez \"▶ Lancer le trimestre\" pour démarrer le T1.");
}

// ── Lancer le trimestre (étapes 0 → 5) ──────────────────────────
// Étapes 0-5 s'exécutent ici. Les étapes 6a/6b/7 sont optionnelles
// (menu séparé). "Trimestre suivant" ne fait que clore et avancer.

function menuLancerTrimestre() {
  const ui = SpreadsheetApp.getUi();
  const s  = getState();
  if (!s) { ui.alert("Lancez d'abord une nouvelle partie."); return; }
  if (s.elimine) { ui.alert("Partie terminée — faillite déclarée."); return; }

  s.journal              = ["── TRIMESTRE " + s.tour + "/" + s.nbTours + " ──"];
  s.clientsServis        = 0;
  s.clientsGeneresCeTour = 0;

  // ── Étape 0 : charges + remboursements + amortissements ─────────
  const log0 = etape0(s);
  s.journal.push("[0] Charges : " + log0.join(" | "));

  // ── Vérification faillite immédiate (découvert > 8 000€) ────────
  const failliteImm = checkFaillite(s);
  if (failliteImm) {
    s.elimine = true;
    s.journal.push("💀 FAILLITE (étape 0) : " + failliteImm);
    saveState(s); updateSheet(s);
    ui.alert("💀 FAILLITE\n" + failliteImm);
    return;
  }

  // ── Étape 1 : achats de stock (interactif) ───────────────────────
  const rQte = ui.prompt(
    "📦 [1] Achats — T" + s.tour + "/" + s.nbTours,
    "Stocks : " + fmt(s.stocks) + "   Tréso : " + fmt(s.tresorerie) + "\n\nQuantité à acheter (0 = passer) :",
    ui.ButtonSet.OK_CANCEL
  );
  if (rQte.getSelectedButton() === ui.Button.OK) {
    const qte = parseInt(rQte.getResponseText());
    if (!isNaN(qte) && qte > 0) {
      const rMode = ui.prompt("Mode de paiement", "1. Comptant\n2. À crédit (dette fournisseur)\n\nNuméro :", ui.ButtonSet.OK_CANCEL);
      const mode  = rMode.getSelectedButton() === ui.Button.OK && rMode.getResponseText().trim() === "2" ? "dettes" : "tresorerie";
      const montant = qte * 1000;
      if (mode === "tresorerie") {
        s.tresorerie -= montant;
      } else {
        if (Math.random() < 0.4) s.dettesD2 += montant; else s.dettes += montant;
      }
      s.stocks += montant;
      s.journal.push("[1] Achats : +" + qte + " unités (" + fmt(montant) + ") — " + (mode === "tresorerie" ? "comptant" : "crédit"));
    }
  }

  // ── Emprunt si tréso faible ──────────────────────────────────────
  if (s.tresorerie < 3000 || s.decouvert > 0) {
    const montants = [5000, 8000, 12000, 16000, 20000];
    const rEmprunt = ui.prompt(
      "🏦 Trésorerie faible — Demander un emprunt ?",
      "Montants disponibles :\n" + montants.map((m, i) => (i+1) + ". " + fmt(m)).join("\n") + "\n\n0. Passer",
      ui.ButtonSet.OK_CANCEL
    );
    if (rEmprunt.getSelectedButton() === ui.Button.OK) {
      const idx = parseInt(rEmprunt.getResponseText()) - 1;
      if (idx >= 0 && idx < montants.length) {
        const m     = montants[idx];
        const score = s.capitaux > 0 && s.tresorerie >= 0 ? 70 : s.capitaux > 0 ? 52 : 30;
        if (score >= 50) {
          s.tresorerie += m; s.emprunts += m;
          s.journal.push("[1] Emprunt accordé : +" + fmt(m) + " (score " + score + "/100)");
          ui.alert("✅ Prêt de " + fmt(m) + " accordé.");
        } else {
          ui.alert("❌ Prêt refusé (score " + score + "/100).");
        }
      }
    }
  }

  // ── Étapes 2 → 5 ────────────────────────────────────────────────
  const log2 = etape2(s);
  s.journal.push("[2] Créances : " + log2.join(" | "));

  const { log: log3, clients } = etape3(s);
  s.journal.push("[3] Commerciaux : " + log3.join(" | "));

  const log4 = etape4(s, clients);
  s.journal.push("[4] Ventes : " + log4.join(" | "));

  const log5 = etape5(s);
  s.journal.push("[5] Récurrents : " + log5.join(" | "));

  saveState(s);
  updateSheet(s);
  ui.alert(
    "✅ Étapes 0→5 appliquées.\n\n" +
    "Tréso : " + fmt(s.tresorerie) + "   Stocks : " + fmt(s.stocks) + "   Ventes : " + fmt(s.ventes) + "\n\n" +
    "Options :\n• [6a] Recruter un commercial\n• [6b] Carte décision\n• [7] Choisir l'événement\n• Puis \"⏭ Trimestre suivant\""
  );
}

// ── Recrutement commercial ───────────────────────────────────────

function menuRecruterCommercial() {
  const ui = SpreadsheetApp.getUi();
  const s  = getState();
  if (!s) { ui.alert("Lancez d'abord une nouvelle partie."); return; }

  const cfgR = getConfig();
  const options = cfgR.commerciaux.map((c, i) =>
    (i+1) + ". " + c.label + " — " + fmt(c.cout) + "/trim → " + c.nbClients + " " + c.clientType + "(s)/trim"
  ).join("\n");

  const r = ui.prompt("👔 [6a] Recruter un commercial", options + "\n0. Passer\n\nNuméro :", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const choix = r.getResponseText().trim();
  if (choix === "0" || choix === "") return;

  const idx = parseInt(choix) - 1;
  if (isNaN(idx) || idx < 0 || idx >= cfgR.commerciaux.length) { ui.alert("Choix invalide."); return; }

  const comm = cfgR.commerciaux[idx];
  s.commerciauxActifs.push({ ...comm });
  // Pas de déduction immédiate : etape3 du prochain tour gère le salaire
  s.journal.push("[6a] Recrutement : " + comm.label + " — actif dès T" + (s.tour + 1));

  saveState(s); updateSheet(s);
  ui.alert("✅ " + comm.label + " recruté(e) !");
}

// ── Carte décision ───────────────────────────────────────────────

function menuCarteDecision() {
  const ui = SpreadsheetApp.getUi();
  const s  = getState();
  if (!s) { ui.alert("Lancez d'abord une nouvelle partie."); return; }

  const options = DECISIONS.map((d, i) =>
    (i+1) + ". [" + d.cat + "] " + d.label + "\n   " + d.desc
  ).join("\n\n");

  const r = ui.prompt("🎯 [6b] Carte décision", options + "\n\n0. Passer\n\nNuméro :", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const choix = r.getResponseText().trim();
  if (choix === "0" || choix === "") return;

  const idx = parseInt(choix) - 1;
  if (isNaN(idx) || idx < 0 || idx >= DECISIONS.length) { ui.alert("Choix invalide."); return; }

  const msg = appliquerDecision(s, DECISIONS[idx].id);
  s.journal.push("[6b] Décision : " + msg);

  saveState(s); updateSheet(s);
  ui.alert("✅ " + msg);
}

// ── Événement ────────────────────────────────────────────────────

function menuEvenement() {
  const ui = SpreadsheetApp.getUi();
  const s  = getState();
  if (!s) { ui.alert("Lancez d'abord une nouvelle partie."); return; }

  const options = ["0. 🎲 Pioche aléatoire"]
    .concat(EVENEMENTS.map((e, i) => (i+1) + ". " + e.label + "\n   " + e.desc + (e.annulable ? " 🛡" : "")))
    .join("\n\n");

  const r = ui.prompt("🎲 [7] Événement du trimestre", options + "\n\nNuméro :", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const choix = r.getResponseText().trim();

  let evId;
  if (choix === "0" || choix === "") {
    evId = EVENEMENTS[Math.floor(Math.random() * EVENEMENTS.length)].id;
  } else {
    const idx = parseInt(choix) - 1;
    if (isNaN(idx) || idx < 0 || idx >= EVENEMENTS.length) { ui.alert("Choix invalide."); return; }
    evId = EVENEMENTS[idx].id;
  }

  const msg = appliquerEvenement(s, evId);
  s.journal.push("[7] Événement : " + msg);

  saveState(s); updateSheet(s);
  ui.alert("🎲 " + msg);
}

// ── Trimestre suivant ────────────────────────────────────────────
// Uniquement : vérification faillite, clôture annuelle, avancement tour.
// Les étapes 0-5 ont déjà été exécutées par menuLancerTrimestre().

function menuTrimestreSuivant() {
  const ui = SpreadsheetApp.getUi();
  const s  = getState();
  if (!s) { ui.alert("Lancez d'abord une nouvelle partie."); return; }
  if (s.elimine) { ui.alert("Partie terminée."); return; }

  // Vérification faillite (étape 8)
  const raison = checkFaillite(s);
  if (raison) {
    s.elimine = true;
    s.journal.push("💀 FAILLITE : " + raison);
    saveState(s); updateSheet(s);
    ui.alert("💀 FAILLITE\n" + raison);
    return;
  }

  // Clôture annuelle tous les 4 trimestres
  if (s.tour % 4 === 0) {
    const resultat = getResultatNet(s);
    s.capitaux += resultat;
    s.ventes = s.productionStockee = s.prodFin = s.revExcept = 0;
    s.cmv = s.servExt = s.chargesPersonnel = s.dotations = 0;
    s.chargesInteret = s.chargesExcept = s.impots = 0;
    s.journal.push("📅 Clôture — résultat " + fmt(resultat) + " intégré aux capitaux.");
  }

  const resultatNet = getResultatNet(s);
  const recap = "T" + s.tour + " terminé.\n\nTréso : " + fmt(s.tresorerie) +
    "   Stocks : " + fmt(s.stocks) + "\nRésultat : " + fmt(resultatNet) +
    "   Capitaux : " + fmt(s.capitaux);

  s.tour++;

  if (s.tour > s.nbTours) {
    s.journal.push("🏁 Fin de partie !");
    saveState(s); updateSheet(s);
    ui.alert("🏁 FIN DE PARTIE\n\n" + recap + "\n\nBravo, vous avez survécu !");
    return;
  }

  saveState(s); updateSheet(s);
  ui.alert(recap + "\n\n→ Cliquez \"▶ Lancer le trimestre\" pour démarrer le T" + s.tour + ".");
}
