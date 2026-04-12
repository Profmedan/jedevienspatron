/**
 * ============================================================
 * JE DEVIENS PATRON — Google Apps Script v4
 * ============================================================
 * Jeu sérieux de gestion d'entreprise
 * Auteur : Pierre Médan (profmedan@gmail.com)
 *
 * OBJECTIF PÉDAGOGIQUE :
 * Comprendre la logique entrepreneuriale des flux monétaires
 * SANS écriture comptable. Chaque décision business génère
 * des flux : entrées (ventes, emprunts) et sorties (achats,
 * charges, remboursements). L'apprenant développe son instinct
 * financier par la simulation.
 *
 * UX : Dialogs HTML modaux (HtmlService) — boutons, cartes
 * cliquables, choix expliqués avec impact financier.
 *
 * ARCHITECTURE :
 *  1. CONSTANTES & CONFIG
 *  2. GESTION D'ÉTAT (PropertiesService)
 *  3. LOGIQUE DE JEU (flux monétaires)
 *  4. DIALOGS HTML (UX interactif)
 *  5. AFFICHAGE DASHBOARD (Google Sheet)
 *  6. MENU
 */

// ============================================================
// 1. CONSTANTES & CONFIG
// ============================================================

const ENTREPRISES_V4 = {
  belvaux: {
    nom: 'Belvaux Saveurs',
    secteur: 'Épicerie fine bio',
    emoji: '🌿',
    description: 'Marché porteur mais concurrence forte. Clientèle fidèle si qualité maintenue.',
    profil: 'Idéale pour apprendre les achats/stocks et la politique tarifaire.',
    capital: 20000,
    emprunts: 8000,
    tresorerie: 8000,
    stocks: 4000,
    clients: 15,
    prixVente: 45,
    coutAchat: 28,
    chargesFixes: 3200,
    couleur: '#2d7d46'
  },
  veloce: {
    nom: 'Véloce Express',
    secteur: 'Livraison urbaine à vélo',
    emoji: '🚲',
    description: 'Croissance rapide, trésorerie tendue. Gestion des flux critiques.',
    profil: 'Idéale pour apprendre la gestion de trésorerie sous pression.',
    capital: 20000,
    emprunts: 8000,
    tresorerie: 8000,
    stocks: 4000,
    clients: 20,
    prixVente: 35,
    coutAchat: 20,
    chargesFixes: 2800,
    couleur: '#1565c0'
  },
  azura: {
    nom: 'Azura Design',
    secteur: 'Studio de design & communication',
    emoji: '🎨',
    description: 'Marges élevées, peu de clients. Fidélisation et prospection essentielles.',
    profil: 'Idéale pour apprendre la stratégie commerciale et le pricing.',
    capital: 20000,
    emprunts: 8000,
    tresorerie: 8000,
    stocks: 4000,
    clients: 8,
    prixVente: 120,
    coutAchat: 60,
    chargesFixes: 4500,
    couleur: '#6a1b9a'
  },
  synergia: {
    nom: 'Synergia Tech',
    secteur: 'Services informatiques (SSII)',
    emoji: '💻',
    description: 'Forte croissance, besoins en fonds de roulement importants.',
    profil: 'Idéale pour apprendre le financement et les cycles longs.',
    capital: 20000,
    emprunts: 8000,
    tresorerie: 8000,
    stocks: 4000,
    clients: 12,
    prixVente: 85,
    coutAchat: 45,
    chargesFixes: 5000,
    couleur: '#e65100'
  }
};

// Décisions par catégorie — chaque choix a un id, un label, une description pédagogique et des paramètres de jeu
const DECISIONS_V4 = {
  // DÉCISION 1 : Politique d'achats/production
  achats: {
    titre: '📦 Politique d\'achats / production',
    aide: 'Combien investissez-vous dans vos stocks ce trimestre ?',
    options: [
      {
        id: 'stop',
        emoji: '🛑',
        label: 'Aucun achat',
        explication: 'J\'écoule les stocks existants. Zéro dépense d\'achat ce trimestre.',
        impact: 'Trésorerie préservée. Risque de rupture si stocks faibles.',
        coutFactor: 0
      },
      {
        id: 'prudent',
        emoji: '🟡',
        label: 'Achats prudents (×0,5)',
        explication: 'Je renouvelle la moitié des stocks. Stratégie de précaution.',
        impact: 'Faible dépense. Volume de ventes potentiellement limité.',
        coutFactor: 0.5
      },
      {
        id: 'equilibre',
        emoji: '🟢',
        label: 'Achats équilibrés (×1)',
        explication: 'Je renouvelle l\'intégralité des stocks. Stratégie standard.',
        impact: 'Bonne capacité de vente. Investissement maîtrisé.',
        coutFactor: 1.0
      },
      {
        id: 'ambitieux',
        emoji: '🔵',
        label: 'Achats ambitieux (×2)',
        explication: 'Je double mes stocks pour capter la demande maximale.',
        impact: 'Forte dépense. Gros potentiel de ventes si la demande suit.',
        coutFactor: 2.0
      }
    ]
  },

  // DÉCISION 2 : Stratégie tarifaire
  prix: {
    titre: '💰 Stratégie tarifaire',
    aide: 'À quel prix vendez-vous vos produits/services ?',
    options: [
      {
        id: 'discount',
        emoji: '🏷️',
        label: 'Prix cassés (−20%)',
        explication: 'Je vends moins cher que le marché pour attirer plus de clients.',
        impact: 'Volume de ventes +30%. Marge unitaire réduite. Risque de guerre des prix.',
        prixFactor: 0.8,
        demandeFactor: 1.3
      },
      {
        id: 'marche',
        emoji: '⚖️',
        label: 'Prix du marché (standard)',
        explication: 'Je m\'aligne sur les prix habituels de mon secteur.',
        impact: 'Équilibre volume/marge. Stratégie sûre et lisible.',
        prixFactor: 1.0,
        demandeFactor: 1.0
      },
      {
        id: 'premium',
        emoji: '💎',
        label: 'Prix premium (+20%)',
        explication: 'Je me positionne haut de gamme pour maximiser ma marge.',
        impact: 'Marge +20%. Volume −20%. Fonctionne si la qualité est reconnue.',
        prixFactor: 1.2,
        demandeFactor: 0.8
      }
    ]
  },

  // DÉCISION 3 : Action commerciale
  commercial: {
    titre: '📣 Action commerciale',
    aide: 'Comment développez-vous votre clientèle ce trimestre ?',
    options: [
      {
        id: 'aucune',
        emoji: '😶',
        label: 'Pas d\'action commerciale',
        explication: 'Je me concentre sur les clients existants. Pas de budget marketing.',
        impact: 'Économie de trésorerie. Risque de perdre 1 client (attrition naturelle).',
        cout: 0,
        deltaClients: -1
      },
      {
        id: 'telephone',
        emoji: '📞',
        label: 'Démarchage téléphonique — 500€',
        explication: 'Mon équipe contacte des prospects directement.',
        impact: '+2 clients. Coût faible. Effet progressif.',
        cout: 500,
        deltaClients: 2
      },
      {
        id: 'locale',
        emoji: '📰',
        label: 'Publicité locale — 1 500€',
        explication: 'Affichage, presse locale, radio. Visibilité dans ma zone.',
        impact: '+5 clients. Bon rapport qualité/prix local.',
        cout: 1500,
        deltaClients: 5
      },
      {
        id: 'digitale',
        emoji: '📱',
        label: 'Campagne digitale — 3 000€',
        explication: 'Réseaux sociaux, SEA, email. Fort impact, audience large.',
        impact: '+10 clients. Investissement significatif.',
        cout: 3000,
        deltaClients: 10
      }
    ]
  },

  // DÉCISION 4 : Financement
  financement: {
    titre: '🏦 Gestion du financement',
    aide: 'Que faites-vous de votre structure financière ce trimestre ?',
    options: [
      {
        id: 'rembourser',
        emoji: '💸',
        label: 'Rembourser 5 000€ d\'emprunt',
        explication: 'Je rembourse une partie de ma dette bancaire.',
        impact: 'Trésorerie −5 000€. Emprunts −5 000€. Intérêts futurs réduits.',
        delta: -5000
      },
      {
        id: 'statu',
        emoji: '⏸️',
        label: 'Statu quo — pas de changement',
        explication: 'Je conserve ma structure financière actuelle.',
        impact: 'Aucun flux de financement ce trimestre.',
        delta: 0
      },
      {
        id: 'emprunter10',
        emoji: '🏦',
        label: 'Emprunter 10 000€',
        explication: 'Je contracte un crédit bancaire pour financer ma croissance.',
        impact: 'Trésorerie +10 000€. Emprunts +10 000€. Intérêts : 125€/trimestre.',
        delta: 10000
      },
      {
        id: 'emprunter20',
        emoji: '🏗️',
        label: 'Emprunter 20 000€',
        explication: 'Emprunt important pour un investissement majeur.',
        impact: 'Trésorerie +20 000€. Emprunts +20 000€. Intérêts : 250€/trimestre.',
        delta: 20000
      }
    ]
  }
};

const EVENEMENTS_V4 = [
  { id: 'boom', emoji: '📈', label: 'Boom sectoriel', desc: 'La demande explose dans votre secteur !', demandeFactor: 1.4, coutFactor: 1.0 },
  { id: 'crise', emoji: '📉', label: 'Ralentissement économique', desc: 'La demande recule. Les clients se font prudents.', demandeFactor: 0.65, coutFactor: 1.0 },
  { id: 'fournisseur', emoji: '🚚', label: 'Pénurie fournisseurs', desc: 'Vos fournisseurs augmentent leurs prix. Coûts d\'achat +15%.', demandeFactor: 1.0, coutFactor: 1.15 },
  { id: 'concurrent', emoji: '⚔️', label: 'Nouveau concurrent agressif', desc: 'Un concurrent casse les prix. Votre part de marché est menacée.', demandeFactor: 0.8, coutFactor: 1.0 },
  { id: 'opportunite', emoji: '🎯', label: 'Opportunité de marché', desc: 'Un nouveau segment s\'ouvre. La demande augmente.', demandeFactor: 1.25, coutFactor: 1.0 },
  { id: 'qualite', emoji: '⭐', label: 'Retour qualité positif', desc: 'Bouche-à-oreille excellent ! Clients supplémentaires.', demandeFactor: 1.15, coutFactor: 1.0 }
];


// ============================================================
// 2. GESTION D'ÉTAT
// ============================================================

function getStateV4() {
  const raw = PropertiesService.getScriptProperties().getProperty('gameStateV4');
  return raw ? JSON.parse(raw) : null;
}

function saveStateV4(state) {
  PropertiesService.getScriptProperties().setProperty('gameStateV4', JSON.stringify(state));
}

function newStateV4(entrepriseKey, nbTours) {
  const e = ENTREPRISES_V4[entrepriseKey];
  return {
    version: 4,
    entrepriseKey: entrepriseKey,
    entreprise: e.nom,
    secteur: e.secteur,
    emoji: e.emoji,
    couleur: e.couleur,
    prixVente: e.prixVente,
    coutAchat: e.coutAchat,
    chargesFixes: e.chargesFixes,
    tour: 0,
    nbTours: parseInt(nbTours),
    // Flux monétaires (trésorerie = nerf de la guerre)
    tresorerie: e.tresorerie,
    stocks: e.stocks,
    clients: e.clients,
    emprunts: e.emprunts,
    capitaux: e.capital,
    immobilisations: 0,
    // Cumuls
    caTotal: 0,
    chargesTotal: 0,
    decouvert: 0,
    score: 100,
    historique: [],
    evenement: null,
    gameOver: false,
    partieTerminee: false,
    // Dernier tour pour affichage
    dernierTour: null
  };
}


// ============================================================
// 3. LOGIQUE DE JEU — FLUX MONÉTAIRES
// ============================================================

function traiterTrimestre(state, decisions) {
  const cfgAchats = DECISIONS_V4.achats.options.find(o => o.id === decisions.achats);
  const cfgPrix = DECISIONS_V4.prix.options.find(o => o.id === decisions.prix);
  const cfgCommercial = DECISIONS_V4.commercial.options.find(o => o.id === decisions.commercial);
  const cfgFinancement = DECISIONS_V4.financement.options.find(o => o.id === decisions.financement);

  // Événement aléatoire (35% de chance, pas au 1er tour)
  let evenement = null;
  if (state.tour > 1 && Math.random() < 0.35) {
    evenement = EVENEMENTS_V4[Math.floor(Math.random() * EVENEMENTS_V4.length)];
  }
  state.evenement = evenement;

  const demandeFactor = cfgPrix.demandeFactor * (evenement ? evenement.demandeFactor : 1.0);
  const coutFactor = evenement ? evenement.coutFactor : 1.0;
  const coutAchatEffectif = Math.round(state.coutAchat * coutFactor);

  const log = {
    tour: state.tour,
    fluxDetailles: [],
    evenement: evenement ? evenement.label : null
  };

  // ── FLUX 1 : FINANCEMENT (entrée ou sortie selon choix) ──────────────────
  const deltaFinancement = cfgFinancement.delta;
  if (deltaFinancement > 0) {
    // Emprunter
    state.tresorerie += deltaFinancement;
    state.emprunts += deltaFinancement;
    log.fluxDetailles.push({ type: 'entree', label: 'Emprunt bancaire', montant: deltaFinancement });
  } else if (deltaFinancement < 0) {
    // Rembourser (seulement si emprunts suffisants et tréso disponible)
    const remb = Math.abs(deltaFinancement);
    if (state.emprunts >= remb && state.tresorerie >= remb) {
      state.tresorerie -= remb;
      state.emprunts -= remb;
      log.fluxDetailles.push({ type: 'sortie', label: 'Remboursement emprunt', montant: remb });
    } else {
      log.fluxDetailles.push({ type: 'info', label: 'Remboursement impossible (emprunts ou tréso insuffisants)', montant: 0 });
    }
  }

  // ── FLUX 2 : ACHATS / PRODUCTION ──────────────────────────────────────────
  const valeurStocksBase = state.stocks > 0 ? state.stocks : coutAchatEffectif * 80;
  const montantAchats = Math.round(valeurStocksBase * cfgAchats.coutFactor);
  if (montantAchats > 0) {
    state.stocks += montantAchats;
    state.tresorerie -= montantAchats;
    state.chargesTotal += montantAchats;
    log.fluxDetailles.push({ type: 'sortie', label: 'Achats / production', montant: montantAchats });
  }

  // ── FLUX 3 : ACTION COMMERCIALE ───────────────────────────────────────────
  const coutCommercial = cfgCommercial.cout;
  if (coutCommercial > 0) {
    if (state.tresorerie >= coutCommercial) {
      state.tresorerie -= coutCommercial;
      state.chargesTotal += coutCommercial;
      state.clients = Math.max(1, state.clients + cfgCommercial.deltaClients);
      log.fluxDetailles.push({ type: 'sortie', label: cfgCommercial.label, montant: coutCommercial });
      log.fluxDetailles.push({ type: 'info', label: 'Nouveaux clients', montant: cfgCommercial.deltaClients });
    } else {
      log.fluxDetailles.push({ type: 'alerte', label: 'Action commerciale annulée (trésorerie insuffisante)', montant: 0 });
    }
  } else {
    // Attrition naturelle si pas d'action
    state.clients = Math.max(1, state.clients + cfgCommercial.deltaClients);
    if (cfgCommercial.deltaClients < 0) {
      log.fluxDetailles.push({ type: 'info', label: 'Attrition clients (pas d\'action)', montant: cfgCommercial.deltaClients });
    }
  }

  // ── FLUX 4 : VENTES (recettes) ────────────────────────────────────────────
  const prixEffectif = Math.round(state.prixVente * cfgPrix.prixFactor);
  // Demande = clients × facteur aléatoire × prix/demande
  const demandeUnites = Math.max(1, Math.round(state.clients * demandeFactor * (8 + Math.random() * 6)));
  // Capacité = stocks disponibles en unités
  const unitesDisponibles = coutAchatEffectif > 0 ? Math.floor(state.stocks / coutAchatEffectif) : 0;
  const unitesVendues = Math.min(demandeUnites, unitesDisponibles);
  const caVentes = unitesVendues * prixEffectif;
  const coutVentes = unitesVendues * coutAchatEffectif;
  state.stocks = Math.max(0, state.stocks - coutVentes);
  state.tresorerie += caVentes;
  state.caTotal += caVentes;
  log.fluxDetailles.push({ type: 'entree', label: `Ventes (${unitesVendues} u. × ${prixEffectif}€)`, montant: caVentes });
  log.unitesVendues = unitesVendues;
  log.caVentes = caVentes;
  log.prixEffectif = prixEffectif;
  log.demandUnites = demandeUnites;

  // ── FLUX 5 : CHARGES FIXES (loyer, salaires, assurances...) ───────────────
  state.tresorerie -= state.chargesFixes;
  state.chargesTotal += state.chargesFixes;
  log.fluxDetailles.push({ type: 'sortie', label: 'Charges fixes (loyer, salaires...)', montant: state.chargesFixes });

  // ── FLUX 6 : INTÉRÊTS SUR EMPRUNTS (5% annuel = 1,25% / trimestre) ────────
  if (state.emprunts > 0) {
    const interets = Math.round(state.emprunts * 0.0125);
    state.tresorerie -= interets;
    state.chargesTotal += interets;
    log.fluxDetailles.push({ type: 'sortie', label: `Intérêts bancaires (1,25% sur ${formatMontant(state.emprunts)})`, montant: interets });
  }

  // ── FLUX 7 : AGIOS si découvert bancaire ──────────────────────────────────
  if (state.tresorerie < 0) {
    state.decouvert = Math.abs(state.tresorerie);
    const agios = Math.round(state.decouvert * 0.10); // 10% du découvert
    state.tresorerie -= agios;
    state.chargesTotal += agios;
    log.fluxDetailles.push({ type: 'alerte', label: `⚠️ Agios découvert (10% de ${formatMontant(state.decouvert)})`, montant: agios });
  } else {
    state.decouvert = 0;
  }

  // ── SCORING ───────────────────────────────────────────────────────────────
  log.tresorerieFinTour = state.tresorerie;
  log.stocksFinTour = state.stocks;
  log.clientsFinTour = state.clients;
  log.empruntsFinTour = state.emprunts;
  log.decisions = {
    achats: cfgAchats.label,
    prix: cfgPrix.label,
    commercial: cfgCommercial.label,
    financement: cfgFinancement.label
  };

  state.score = calculerScore_V4(state, caVentes, unitesVendues);
  log.score = state.score;

  // Bienveillance pédagogique tours 1-2
  if (state.tour <= 2) {
    state.score = Math.min(150, state.score + 15);
    log.bienveillance = true;
  }

  state.historique.push(log);
  state.dernierTour = log;

  // Game over : faillite
  if (state.tresorerie < -30000) {
    state.gameOver = true;
  }
  if (state.tour >= state.nbTours) {
    state.partieTerminee = true;
  }

  return state;
}

function calculerScore_V4(state, caVentes, unitesVendues) {
  let score = state.score || 100;

  // Trésorerie
  if (state.tresorerie < 0) score -= 25;
  else if (state.tresorerie < 1000) score -= 10;
  else if (state.tresorerie > 15000) score += 8;

  // Ventes
  if (caVentes > 8000) score += 12;
  else if (caVentes < 1000) score -= 12;

  // Solvabilité (capitaux / (capitaux + emprunts))
  const solvabilite = state.emprunts > 0 ? state.capitaux / (state.capitaux + state.emprunts) : 1;
  if (solvabilite < 0.25) score -= 18;
  else if (solvabilite > 0.65) score += 8;

  // Stocks non nuls (l'entreprise peut vendre)
  if (state.stocks < 500) score -= 8;

  // Clients
  if (state.clients <= 2) score -= 15;
  else if (state.clients >= 20) score += 8;

  return Math.max(0, Math.min(200, score));
}

function formatMontant(n) {
  if (!n && n !== 0) return '—';
  const abs = Math.abs(Math.round(n));
  const formatted = new Intl.NumberFormat('fr-FR').format(abs);
  return (n < 0 ? '−' : '') + formatted + ' €';
}

function formatK(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1000) {
    return (Math.round(n / 100) / 10).toFixed(1).replace('.', ',') + ' k€';
  }
  return Math.round(n) + ' €';
}


// ============================================================
// 4. DIALOGS HTML — UX INTERACTIF
// ============================================================

function onOpen_V4() {
  SpreadsheetApp.getUi()
    .createMenu('🎮 Je Deviens Patron')
    .addItem('🆕 Nouvelle partie', 'dialog_NouvellePartie')
    .addSeparator()
    .addItem('▶ Jouer le trimestre suivant', 'dialog_Tour')
    .addItem('📊 Actualiser le tableau de bord', 'cmd_RefreshDashboard')
    .addSeparator()
    .addItem('🏆 Voir les résultats finaux', 'dialog_FinDeJeu')
    .addItem('🗑️ Réinitialiser la partie', 'cmd_Reset')
    .addToUi();
}

// ── DIALOG : Nouvelle partie ──────────────────────────────────────────────────
function dialog_NouvellePartie() {
  const html = HtmlService.createHtmlOutput(html_NouvellePartie())
    .setWidth(680).setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, '🏢 Nouvelle partie — Je Deviens Patron');
}

// ── DIALOG : Jouer un trimestre ───────────────────────────────────────────────
function dialog_Tour() {
  const state = getStateV4();
  if (!state) {
    SpreadsheetApp.getUi().alert('⚠️ Aucune partie en cours.\nUtilisez le menu : 🆕 Nouvelle partie');
    return;
  }
  if (state.gameOver || state.partieTerminee) {
    dialog_FinDeJeu();
    return;
  }
  // Incrémenter le tour AVANT d'afficher le dialog
  state.tour += 1;
  saveStateV4(state);

  const html = HtmlService.createHtmlOutput(html_Tour(state))
    .setWidth(720).setHeight(780);
  SpreadsheetApp.getUi().showModalDialog(html, 'Trimestre ' + state.tour + ' / ' + state.nbTours + ' — ' + state.emoji + ' ' + state.entreprise);
}

// ── DIALOG : Fin de partie ────────────────────────────────────────────────────
function dialog_FinDeJeu() {
  const state = getStateV4();
  if (!state) return;
  const html = HtmlService.createHtmlOutput(html_FinDeJeu(state))
    .setWidth(680).setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, '🏆 Résultats finaux — ' + state.entreprise);
}

// ── HANDLERS serveur (appelés depuis le JS des dialogs) ──────────────────────

function srv_StartGame(paramsJson) {
  try {
    const p = JSON.parse(paramsJson);
    if (!ENTREPRISES_V4[p.entreprise]) throw new Error('Entreprise inconnue : ' + p.entreprise);
    const state = newStateV4(p.entreprise, p.nbTours);
    saveStateV4(state);
    updateDashboard_V4(state);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function srv_Decisions(decisionsJson) {
  try {
    const decisions = JSON.parse(decisionsJson);
    let state = getStateV4();
    if (!state) return { ok: false, error: 'Aucune partie en cours' };

    state = traiterTrimestre(state, decisions);
    saveStateV4(state);
    updateDashboard_V4(state);

    return {
      ok: true,
      gameOver: state.gameOver,
      partieTerminee: state.partieTerminee,
      tour: state.tour,
      nbTours: state.nbTours,
      dernierTour: state.dernierTour
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function cmd_RefreshDashboard() {
  const state = getStateV4();
  if (!state) { SpreadsheetApp.getUi().alert('Aucune partie en cours.'); return; }
  updateDashboard_V4(state);
  SpreadsheetApp.getUi().alert('✅ Tableau de bord actualisé.');
}

function cmd_Reset() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert('⚠️ Réinitialiser la partie', 'Cette action efface la partie en cours. Continuer ?', ui.ButtonSet.YES_NO);
  if (r === ui.Button.YES) {
    PropertiesService.getScriptProperties().deleteProperty('gameStateV4');
    ui.alert('✅ Partie réinitialisée.');
  }
}


// ============================================================
// 4b. TEMPLATES HTML
// ============================================================

function html_NouvellePartie() {
  const ents = Object.entries(ENTREPRISES_V4);
  let cartes = '';
  for (const [key, e] of ents) {
    cartes += `
      <div class="ent-card" id="card-${key}" onclick="selectEnt('${key}')">
        <div class="ent-icon">${e.emoji}</div>
        <div class="ent-body">
          <div class="ent-nom">${e.nom}</div>
          <div class="ent-secteur">${e.secteur}</div>
          <div class="ent-desc">${e.description}</div>
          <div class="ent-profil">💡 ${e.profil}</div>
          <div class="ent-chiffres">
            💰 Trésorerie : <b>${e.tresorerie.toLocaleString('fr-FR')} €</b> &nbsp;|&nbsp;
            📦 Stocks : <b>${e.stocks.toLocaleString('fr-FR')} €</b> &nbsp;|&nbsp;
            🏦 Emprunts : <b>${e.emprunts.toLocaleString('fr-FR')} €</b>
          </div>
        </div>
      </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Google Sans',Arial,sans-serif;background:#f8f9fa;padding:18px;font-size:13px;color:#202124;overflow-y:auto}
h1{font-size:20px;color:#1a73e8;margin-bottom:4px}
.intro{color:#5f6368;font-size:12px;margin-bottom:16px;line-height:1.5}
h2{font-size:13px;font-weight:700;color:#3c4043;margin:14px 0 8px;text-transform:uppercase;letter-spacing:.5px}
.ent-card{display:flex;align-items:flex-start;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;margin-bottom:8px;cursor:pointer;background:#fff;transition:all .15s}
.ent-card:hover{border-color:#1a73e8;background:#f0f4ff}
.ent-card.sel{border-color:#1a73e8;background:#e8f0fe;box-shadow:0 0 0 3px #c6d9fb}
.ent-icon{font-size:30px;margin-right:12px;flex-shrink:0;line-height:1}
.ent-nom{font-weight:700;font-size:14px}
.ent-secteur{color:#1a73e8;font-size:11px;font-weight:600;margin:2px 0}
.ent-desc{color:#5f6368;font-size:11px;margin:3px 0}
.ent-profil{font-size:11px;color:#0d652d;background:#e6f4ea;padding:3px 8px;border-radius:4px;margin:4px 0;display:inline-block}
.ent-chiffres{font-size:11px;color:#3c4043;background:#f1f3f4;padding:4px 8px;border-radius:4px;margin-top:6px}
.dur-row{display:flex;gap:8px}
.dur-btn{flex:1;padding:10px;border:2px solid #e0e0e0;border-radius:8px;cursor:pointer;text-align:center;background:#fff;transition:all .15s}
.dur-btn:hover{border-color:#1a73e8;background:#f0f4ff}
.dur-btn.sel{border-color:#1a73e8;background:#e8f0fe;box-shadow:0 0 0 3px #c6d9fb}
.dur-label{font-weight:700;font-size:13px}
.dur-sub{font-size:11px;color:#5f6368;margin-top:2px}
.btn-go{display:block;width:100%;padding:14px;background:#1a73e8;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;margin-top:16px}
.btn-go:disabled{background:#9aa0a6;cursor:not-allowed}
.err{color:#d93025;font-size:12px;margin-top:6px;display:none}
.loading{display:none;text-align:center;padding:16px;color:#1a73e8;font-weight:600}
</style></head><body>
<h1>🏢 Je Deviens Patron</h1>
<p class="intro">Simulez la gestion d'une entreprise pendant plusieurs trimestres.<br>
Vos décisions génèrent des <b>flux monétaires</b> : entrées d'argent (ventes, emprunts) et sorties (achats, charges, remboursements). Pas d'écriture comptable — juste la logique des flux.</p>

<h2>1️⃣ Choisissez votre entreprise</h2>
${cartes}

<h2>2️⃣ Durée de la simulation</h2>
<div class="dur-row">
  <div class="dur-btn" onclick="selDur('6')" id="dur-6">
    <div class="dur-label">6 trimestres</div><div class="dur-sub">⏱ ~1h · Découverte</div>
  </div>
  <div class="dur-btn sel" onclick="selDur('8')" id="dur-8">
    <div class="dur-label">8 trimestres</div><div class="dur-sub">⏱ ~1h15 · Standard</div>
  </div>
  <div class="dur-btn" onclick="selDur('10')" id="dur-10">
    <div class="dur-label">10 trimestres</div><div class="dur-sub">⏱ ~1h30 · Avancé</div>
  </div>
  <div class="dur-btn" onclick="selDur('12')" id="dur-12">
    <div class="dur-label">12 trimestres</div><div class="dur-sub">⏱ ~1h45 · Expert</div>
  </div>
</div>

<p class="err" id="err">⚠️ Veuillez sélectionner une entreprise.</p>
<button class="btn-go" id="btn-go" onclick="start()">▶ Démarrer la simulation</button>
<div class="loading" id="loading">⏳ Initialisation en cours...</div>

<script>
var ent=null, dur='8';
function selectEnt(k){
  document.querySelectorAll('.ent-card').forEach(function(c){c.classList.remove('sel')});
  document.getElementById('card-'+k).classList.add('sel');
  ent=k; document.getElementById('err').style.display='none';
}
function selDur(d){
  document.querySelectorAll('.dur-btn').forEach(function(b){b.classList.remove('sel')});
  document.getElementById('dur-'+d).classList.add('sel');
  dur=d;
}
function start(){
  if(!ent){document.getElementById('err').style.display='block';return}
  document.getElementById('btn-go').disabled=true;
  document.getElementById('loading').style.display='block';
  google.script.run
    .withSuccessHandler(function(r){
      if(r.ok){google.script.host.close()}
      else{alert('Erreur : '+r.error);document.getElementById('btn-go').disabled=false;document.getElementById('loading').style.display='none'}
    })
    .withFailureHandler(function(e){alert('Erreur : '+e.message);document.getElementById('btn-go').disabled=false;document.getElementById('loading').style.display='none'})
    .srv_StartGame(JSON.stringify({entreprise:ent,nbTours:dur}));
}
</script></body></html>`;
}

// ── Génère le HTML du dialog de tour ─────────────────────────────────────────
function html_Tour(state) {
  const treso = state.tresorerie;
  const tresoColor = treso < 0 ? '#d93025' : treso < 1500 ? '#e37400' : '#137333';
  const solvabilite = state.emprunts > 0 ? Math.round(state.capitaux / (state.capitaux + state.emprunts) * 100) : 100;
  const solvaColor = solvabilite < 30 ? '#d93025' : solvabilite < 50 ? '#e37400' : '#137333';
  const pct = Math.round(state.tour / state.nbTours * 100);

  // Alerte découvert / trésorerie critique
  let alerte = '';
  if (treso < 0) {
    alerte = `<div class="alerte rouge">⚠️ DÉCOUVERT BANCAIRE de ${formatK(Math.abs(treso))} ! Des agios de 10% seront prélevés. Agissez vite.</div>`;
  } else if (treso < 2000) {
    alerte = `<div class="alerte orange">⚠️ Trésorerie très faible (${formatK(treso)}). Attention à ne pas tomber dans le rouge.</div>`;
  }

  // Événement du tour précédent (si applicable)
  let bandeauEvenement = '';
  const prevLog = state.historique.length > 0 ? state.historique[state.historique.length - 1] : null;
  if (prevLog && prevLog.evenement) {
    const ev = EVENEMENTS_V4.find(function(e){ return e.label === prevLog.evenement; });
    bandeauEvenement = `<div class="event-bandeau">${ev ? ev.emoji : '📣'} <b>Événement du trimestre dernier :</b> ${prevLog.evenement}${ev ? ' — ' + ev.desc : ''}</div>`;
  }

  // Construire les sections de décision
  let sectionsDecisions = '';
  const cats = ['achats', 'prix', 'commercial', 'financement'];
  const defaults = { achats: 'equilibre', prix: 'marche', commercial: 'aucune', financement: 'statu' };

  for (const cat of cats) {
    const cfg = DECISIONS_V4[cat];
    let opts = '';
    for (const opt of cfg.options) {
      // Griser les options impossible (ex: rembourser si emprunts < 5000)
      let disabled = false;
      let disabledReason = '';
      if (cat === 'financement') {
        if (opt.id === 'rembourser' && state.emprunts < 5000) {
          disabled = true; disabledReason = 'Emprunts insuffisants';
        }
        if (opt.id === 'emprunter20' && solvabilite < 20) {
          disabled = true; disabledReason = 'Solvabilité trop faible';
        }
      }
      if (cat === 'achats' && opt.id !== 'stop' && opt.id !== 'prudent') {
        // Estimer le coût pour avertir si trésorerie insuffisante
        const valStocks = state.stocks > 0 ? state.stocks : state.coutAchat * 80;
        const coutEstime = Math.round(valStocks * opt.coutFactor);
        if (coutEstime > state.tresorerie && opt.id !== 'equilibre') {
          disabledReason = 'Risque de découvert (~' + formatK(coutEstime) + ')';
        }
      }

      const isDefault = opt.id === defaults[cat];
      const disClass = disabled ? ' disabled' : '';
      const selClass = isDefault && !disabled ? ' sel' : '';
      const disAttr = disabled ? ' data-disabled="1"' : '';
      const checkedAttr = isDefault && !disabled ? ' checked' : '';

      opts += `
        <div class="opt${selClass}${disClass}"${disAttr} onclick="selectOpt(this,'${cat}','${opt.id}')">
          <input type="radio" name="${cat}" value="${opt.id}" id="${cat}-${opt.id}"${checkedAttr}${disabled ? ' disabled' : ''} style="display:none">
          <div class="opt-head">
            <span class="opt-emoji">${opt.emoji}</span>
            <span class="opt-label">${opt.label}</span>
            ${disabledReason ? '<span class="opt-warn">⚠️ ' + disabledReason + '</span>' : ''}
          </div>
          <div class="opt-expl">${opt.explication}</div>
          <div class="opt-impact">💡 ${opt.impact}</div>
        </div>`;
    }

    sectionsDecisions += `
      <div class="decision-bloc">
        <div class="dec-titre">${cfg.titre}</div>
        <div class="dec-aide">${cfg.aide}</div>
        ${opts}
      </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Google Sans',Arial,sans-serif;background:#f8f9fa;padding:14px;font-size:13px;color:#202124;overflow-y:auto}
.header{background:#1a73e8;color:#fff;padding:12px 16px;border-radius:8px;margin-bottom:10px}
.header-top{display:flex;justify-content:space-between;align-items:center}
.header-title{font-size:17px;font-weight:700}
.header-score{font-size:22px;font-weight:900;background:rgba(255,255,255,.2);padding:4px 12px;border-radius:6px}
.progress{height:6px;background:rgba(255,255,255,.3);border-radius:3px;margin-top:8px}
.progress-fill{height:6px;background:#fff;border-radius:3px;width:${pct}%}
.progress-label{font-size:10px;opacity:.8;margin-top:3px}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:10px}
.kpi{background:#fff;border:1px solid #e0e0e0;border-radius:7px;padding:8px 10px;text-align:center}
.kpi-val{font-size:15px;font-weight:800}
.kpi-lbl{font-size:10px;color:#5f6368;margin-top:2px}
.alerte{padding:8px 12px;border-radius:6px;font-size:12px;margin-bottom:8px;font-weight:600}
.alerte.rouge{background:#fce8e6;border:1px solid #d93025;color:#d93025}
.alerte.orange{background:#fef3e2;border:1px solid #e37400;color:#e37400}
.event-bandeau{background:#fff3e0;border:1px solid #ff9800;border-radius:6px;padding:7px 12px;margin-bottom:8px;font-size:12px}
.decision-bloc{background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:10px 12px;margin-bottom:8px}
.dec-titre{font-weight:700;font-size:13px;color:#1a73e8;margin-bottom:3px}
.dec-aide{font-size:11px;color:#5f6368;margin-bottom:8px}
.opt{padding:8px 10px;border:2px solid #e0e0e0;border-radius:6px;margin-bottom:5px;cursor:pointer;transition:all .12s;user-select:none}
.opt:hover:not(.disabled){border-color:#1a73e8;background:#f0f4ff}
.opt.sel{border-color:#1a73e8;background:#e8f0fe}
.opt.disabled{opacity:.5;cursor:not-allowed;background:#f8f9fa}
.opt-head{display:flex;align-items:center;gap:6px;margin-bottom:3px}
.opt-emoji{font-size:16px}
.opt-label{font-weight:700;font-size:13px;flex:1}
.opt-warn{font-size:10px;color:#e37400;font-weight:600}
.opt-expl{font-size:12px;color:#3c4043;margin-bottom:3px}
.opt-impact{font-size:11px;color:#0d652d;background:#e6f4ea;padding:3px 7px;border-radius:4px;display:inline-block}
.btn-val{display:block;width:100%;padding:13px;background:#34a853;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;margin-top:10px}
.btn-val:hover{background:#2d8e46}
.btn-val:disabled{background:#9aa0a6}
.loading{display:none;text-align:center;padding:12px;color:#1a73e8;font-weight:600}
</style></head><body>

<div class="header">
  <div class="header-top">
    <div class="header-title">${state.emoji} ${state.entreprise} · T${state.tour}/${state.nbTours}</div>
    <div class="header-score">⭐ ${state.score}</div>
  </div>
  <div class="progress"><div class="progress-fill"></div></div>
  <div class="progress-label">${pct}% de la simulation effectuée</div>
</div>

<div class="kpi-row">
  <div class="kpi"><div class="kpi-val" style="color:${tresoColor}">${formatK(treso)}</div><div class="kpi-lbl">💰 Trésorerie</div></div>
  <div class="kpi"><div class="kpi-val">${formatK(state.stocks)}</div><div class="kpi-lbl">📦 Stocks</div></div>
  <div class="kpi"><div class="kpi-val">${state.clients}</div><div class="kpi-lbl">👥 Clients</div></div>
  <div class="kpi"><div class="kpi-val" style="color:${solvaColor}">${solvabilite}%</div><div class="kpi-lbl">📊 Solvabilité</div></div>
</div>

${alerte}
${bandeauEvenement}

${sectionsDecisions}

<button class="btn-val" id="btn-val" onclick="valider()">✅ Valider mes décisions pour le trimestre ${state.tour}</button>
<div class="loading" id="loading">⏳ Calcul des flux en cours...</div>

<script>
function selectOpt(div, cat, id){
  if(div.dataset.disabled==='1') return;
  document.querySelectorAll('.opt[data-cat="'+cat+'"]').forEach(function(o){o.classList.remove('sel')});
  // Remove sel from all options in this group
  var allOpts=document.querySelectorAll('input[name="'+cat+'"]');
  allOpts.forEach(function(r){r.closest('.opt').classList.remove('sel')});
  div.classList.add('sel');
  var inp=div.querySelector('input[type=radio]');
  if(inp) inp.checked=true;
}

// Init: ensure defaults are visually selected
document.querySelectorAll('input[type=radio]:checked').forEach(function(r){
  r.closest('.opt').classList.add('sel');
});

function valider(){
  var dec={};
  var cats=['achats','prix','commercial','financement'];
  var ok=true;
  cats.forEach(function(c){
    var sel=document.querySelector('input[name="'+c+'"]:checked');
    if(sel) dec[c]=sel.value;
    else ok=false;
  });
  if(!ok){alert('Veuillez faire un choix pour chaque catégorie de décision.');return}
  document.getElementById('btn-val').disabled=true;
  document.getElementById('loading').style.display='block';
  google.script.run
    .withSuccessHandler(function(r){
      google.script.host.close();
      if(!r.ok){alert('Erreur : '+(r.error||'inconnue'));return}
      if(r.partieTerminee||r.gameOver){
        setTimeout(function(){google.script.run.dialog_FinDeJeu()},800);
      }
    })
    .withFailureHandler(function(e){
      document.getElementById('btn-val').disabled=false;
      document.getElementById('loading').style.display='none';
      alert('Erreur : '+e.message);
    })
    .srv_Decisions(JSON.stringify(dec));
}
</script></body></html>`;
}

// ── HTML Fin de partie ─────────────────────────────────────────────────────────
function html_FinDeJeu(state) {
  const caTotal = state.caTotal || 0;
  const scoreLabel = state.score >= 150 ? '🏆 Excellent !' : state.score >= 110 ? '✅ Bien joué !' : state.score >= 75 ? '⚠️ Peut mieux faire' : '❌ Difficile';
  const scoreColor = state.score >= 150 ? '#0d652d' : state.score >= 110 ? '#1a73e8' : state.score >= 75 ? '#e37400' : '#d93025';

  let lignesHisto = '';
  (state.historique || []).forEach(function(h) {
    const tColor = h.tresorerieFinTour >= 0 ? '#137333' : '#d93025';
    lignesHisto += `<tr>
      <td style="text-align:center;font-weight:700">T${h.tour}</td>
      <td style="color:${tColor};text-align:right">${formatK(h.tresorerieFinTour)}</td>
      <td style="text-align:right">${formatK(h.caVentes||0)}</td>
      <td style="text-align:center">${h.clientsFinTour}</td>
      <td style="font-size:11px;color:#5f6368">${h.evenement||'—'}</td>
    </tr>`;
  });

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Google Sans',Arial,sans-serif;background:#f8f9fa;padding:20px;font-size:13px;color:#202124}
.score-box{text-align:center;background:#fff;border:2px solid #e0e0e0;border-radius:10px;padding:20px;margin-bottom:16px}
.score-val{font-size:60px;font-weight:900;line-height:1}
.score-label{font-size:20px;font-weight:700;margin-top:6px}
.score-sub{font-size:12px;color:#5f6368;margin-top:4px}
.kpi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.kpi{background:#fff;border:1px solid #e0e0e0;border-radius:7px;padding:10px;text-align:center}
.kpi-val{font-size:17px;font-weight:800}
.kpi-lbl{font-size:10px;color:#5f6368;margin-top:3px}
h3{font-size:13px;font-weight:700;color:#1a73e8;margin:10px 0 6px;text-transform:uppercase;letter-spacing:.4px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden}
th{background:#1a73e8;color:#fff;padding:7px 8px;font-size:11px;font-weight:600}
td{padding:5px 8px;border-bottom:1px solid #f0f0f0;font-size:12px}
tr:last-child td{border-bottom:none}
tr:nth-child(even) td{background:#f8f9fa}
.btn-new{display:block;width:100%;padding:12px;background:#1a73e8;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-top:14px}
.faillite{background:#fce8e6;border:1px solid #d93025;border-radius:8px;padding:10px 14px;margin-bottom:14px;color:#d93025;font-weight:700}
</style></head><body>

${state.gameOver ? '<div class="faillite">💥 FAILLITE ! Votre trésorerie a atteint −30 000€. L\'entreprise est en cessation de paiement.</div>' : ''}

<div class="score-box">
  <div class="score-val" style="color:${scoreColor}">${state.score}</div>
  <div class="score-label" style="color:${scoreColor}">${scoreLabel}</div>
  <div class="score-sub">${state.emoji} ${state.entreprise} · ${state.nbTours} trimestres</div>
</div>

<div class="kpi-row">
  <div class="kpi">
    <div class="kpi-val" style="color:${state.tresorerie>=0?'#137333':'#d93025'}">${formatK(state.tresorerie)}</div>
    <div class="kpi-lbl">💰 Trésorerie finale</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">${formatK(caTotal)}</div>
    <div class="kpi-lbl">📈 CA cumulé</div>
  </div>
  <div class="kpi">
    <div class="kpi-val" style="color:#d93025">${formatK(state.emprunts)}</div>
    <div class="kpi-lbl">🏦 Emprunts restants</div>
  </div>
</div>

<h3>📋 Récapitulatif trimestre par trimestre</h3>
<table>
  <thead><tr><th>Tour</th><th>Trésorerie</th><th>CA Ventes</th><th>Clients</th><th>Événement</th></tr></thead>
  <tbody>${lignesHisto}</tbody>
</table>

<button class="btn-new" onclick="google.script.run.withSuccessHandler(function(){google.script.host.close()}).dialog_NouvellePartie()">🔄 Nouvelle partie</button>
</body></html>`;
}


// ============================================================
// 5. DASHBOARD — AFFICHAGE DANS GOOGLE SHEET
// ============================================================

function updateDashboard_V4(state) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('📊 Tableau de bord');
  if (!sh) {
    sh = ss.insertSheet('📊 Tableau de bord');
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(1);
  }
  sh.clear();
  sh.setTabColor(state.couleur || '#1a73e8');

  const E = ENTREPRISES_V4[state.entrepriseKey] || {};
  const solvabilite = state.emprunts > 0 ? Math.round(state.capitaux / (state.capitaux + state.emprunts) * 100) : 100;
  const tresoColor = state.tresorerie < 0 ? '#d93025' : state.tresorerie < 1500 ? '#e37400' : '#137333';
  const solvaColor = solvabilite < 30 ? '#d93025' : solvabilite < 50 ? '#e37400' : '#137333';
  const scoreColor = state.score >= 150 ? '#137333' : state.score >= 100 ? '#1a73e8' : state.score >= 75 ? '#e37400' : '#d93025';

  // ── EN-TÊTE ─────────────────────────────────────────────────────────────────
  sh.getRange('A1:I1').merge()
    .setValue(state.emoji + ' ' + state.entreprise + ' — ' + state.secteur)
    .setBackground(state.couleur || '#1a73e8').setFontColor('#fff')
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(1, 50);

  const partieInfo = state.partieTerminee ? '✅ Simulation terminée'
    : state.gameOver ? '💥 FAILLITE — Simulation arrêtée'
    : state.tour === 0 ? '⏳ Simulation non démarrée — Choisissez ▶ Jouer le trimestre suivant'
    : 'Trimestre ' + state.tour + ' / ' + state.nbTours + ' en cours';

  sh.getRange('A2:I2').merge()
    .setValue(partieInfo)
    .setBackground('#f1f3f4').setFontSize(11).setFontColor('#5f6368').setHorizontalAlignment('center');
  sh.setRowHeight(2, 28);

  // ── SÉCTION KPI ──────────────────────────────────────────────────────────────
  sh.getRange('A3:I3').merge()
    .setValue('📊 Situation financière actuelle')
    .setBackground('#e8f0fe').setFontColor('#1a73e8').setFontWeight('bold').setFontSize(12)
    .setVerticalAlignment('middle');
  sh.setRowHeight(3, 30);

  const kpis = [
    ['💰 Trésorerie', state.tresorerie, tresoColor, '#,##0 "€"'],
    ['📦 Stocks disponibles', state.stocks, '#1a73e8', '#,##0 "€"'],
    ['👥 Clients actifs', state.clients, '#0d652d', '0'],
    ['🏦 Emprunts bancaires', state.emprunts, '#d93025', '#,##0 "€"'],
    ['📊 Solvabilité', solvabilite / 100, solvaColor, '0"%"'],
    ['🏆 Score pédagogique', state.score, scoreColor, '0']
  ];

  kpis.forEach(function(k, i) {
    const r = 4 + i;
    const bg = i % 2 === 0 ? '#fff' : '#f8f9fa';
    sh.getRange('A' + r + ':E' + r).merge().setValue(k[0])
      .setFontSize(12).setFontWeight('bold').setBackground(bg).setVerticalAlignment('middle')
      .setHorizontalAlignment('left');
    const valCell = sh.getRange('F' + r + ':I' + r).merge()
      .setValue(typeof k[1] === 'number' ? k[1] : k[1])
      .setFontSize(15).setFontWeight('bold').setFontColor(k[2])
      .setHorizontalAlignment('right').setBackground(bg).setVerticalAlignment('middle');
    if (k[3] && k[3] !== '0') valCell.setNumberFormat(k[3]);
    sh.setRowHeight(r, 36);
  });

  // ── HISTORIQUE ───────────────────────────────────────────────────────────────
  const histo = state.historique || [];
  if (histo.length > 0) {
    const hRow = 11;
    sh.getRange('A' + hRow + ':I' + hRow).merge()
      .setValue('📋 Flux monétaires par trimestre')
      .setBackground('#e8f0fe').setFontColor('#1a73e8').setFontWeight('bold').setFontSize(12)
      .setVerticalAlignment('middle');
    sh.setRowHeight(hRow, 30);

    const headers = ['Tour', 'Trésorerie', 'CA Ventes', 'Stocks', 'Clients', 'Emprunts', 'Événement', 'Score', 'Décision achats'];
    sh.getRange('A' + (hRow + 1) + ':I' + (hRow + 1)).setValues([headers])
      .setFontWeight('bold').setBackground('#1a73e8').setFontColor('#fff').setFontSize(11)
      .setHorizontalAlignment('center');
    sh.setRowHeight(hRow + 1, 26);

    histo.forEach(function(h, i) {
      const r = hRow + 2 + i;
      const bg = i % 2 === 0 ? '#fff' : '#f8f9fa';
      const tColor = h.tresorerieFinTour >= 0 ? '#137333' : '#d93025';

      sh.getRange('A' + r).setValue('T' + h.tour).setHorizontalAlignment('center').setFontWeight('bold');
      sh.getRange('B' + r).setValue(h.tresorerieFinTour).setNumberFormat('#,##0 "€"').setFontColor(tColor);
      sh.getRange('C' + r).setValue(h.caVentes || 0).setNumberFormat('#,##0 "€"');
      sh.getRange('D' + r).setValue(h.stocksFinTour || 0).setNumberFormat('#,##0 "€"');
      sh.getRange('E' + r).setValue(h.clientsFinTour || 0).setHorizontalAlignment('center');
      sh.getRange('F' + r).setValue(h.empruntsFinTour || 0).setNumberFormat('#,##0 "€"');
      sh.getRange('G' + r).setValue(h.evenement || '—').setFontColor('#e37400');
      sh.getRange('H' + r).setValue(h.score || 0).setHorizontalAlignment('center').setFontWeight('bold').setFontColor(scoreColor);
      sh.getRange('I' + r).setValue(h.decisions ? h.decisions.achats : '').setFontSize(10).setFontColor('#5f6368');
      sh.getRange('A' + r + ':I' + r).setBackground(bg);
      sh.setRowHeight(r, 22);
    });
  }

  // Largeurs colonnes
  sh.setColumnWidth(1, 200);
  sh.setColumnWidth(2, 120); sh.setColumnWidth(3, 110); sh.setColumnWidth(4, 110);
  sh.setColumnWidth(5, 90);  sh.setColumnWidth(6, 110); sh.setColumnWidth(7, 140);
  sh.setColumnWidth(8, 80);  sh.setColumnWidth(9, 140);

  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sh);
}


// ============================================================
// 6. MENU (point d'entrée)
// ============================================================

function onOpen() {
  onOpen_V4();
}
