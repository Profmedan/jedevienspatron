/**
 * ============================================================
 * JE DEVIENS PATRON — Google Apps Script v3 (Complet)
 * ============================================================
 * Jeu sérieux de comptabilité/gestion d'entreprise
 * Auteur original : Pierre Médan
 * Apps Script réimplémentation : Claude (Expert Game Design)
 *
 * ============================================================
 * ARCHITECTURE
 * ============================================================
 * 1. UTILITY FUNCTIONS & FORMATTING
 * 2. DATA CONSTANTS (ENTREPRISES, CLIENTS, COMMERCIAUX, DÉCISIONS, ÉVÉNEMENTS)
 * 3. STATE MANAGEMENT (getState, saveState, newState)
 * 4. GAME LOGIC (étapes de tour, scoring, loan evaluation)
 * 5. DISPLAY FUNCTIONS (dashboard, historique, graphiques)
 * 6. MENU & UI (onOpen, menu handlers)
 */

// ============================================================
// 1. UTILITY FUNCTIONS & FORMATTING
// ============================================================

function fmt(value) {
  if (typeof value !== 'number') return value;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function fmtNum(value) {
  if (typeof value !== 'number') return value;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// ============================================================
// 2. DATA CONSTANTS
// ============================================================

const ENTREPRISES = {
  'Manufacture Belvaux': {
    nom: 'Manufacture Belvaux',
    type: 'production',
    couleur: '#1a73e8',
    icon: '🏭',
    specialite: '⚡ Production : +1 000 € stocks/trim',
    capital: 20000,
    empruntsInit: 8000,
    tresorerie: 8000,
    immobilisations: [
      { nom: 'Entrepôt', valeur: 8000 },
      { nom: 'Camionnette', valeur: 8000 }
    ],
    stocks: 4000
  },
  'Véloce Transports': {
    nom: 'Véloce Transports',
    type: 'logistique',
    couleur: '#e37400',
    icon: '🚚',
    specialite: '🚀 Logistique : délai encaissement −1 trim',
    capital: 20000,
    empruntsInit: 8000,
    tresorerie: 8000,
    immobilisations: [
      { nom: 'Camion', valeur: 10000 },
      { nom: 'Machine de manutention', valeur: 6000 }
    ],
    stocks: 4000
  },
  'Azura Commerce': {
    nom: 'Azura Commerce',
    type: 'commerce',
    couleur: '#137333',
    icon: '🛍️',
    specialite: '🛍 Commerce : +1 client Particulier/trim',
    capital: 20000,
    empruntsInit: 8000,
    tresorerie: 8000,
    immobilisations: [
      { nom: 'Showroom', valeur: 8000 },
      { nom: 'Voiture de démonstration', valeur: 8000 }
    ],
    stocks: 4000
  },
  'Synergia Lab': {
    nom: 'Synergia Lab',
    type: 'innovation',
    couleur: '#c0392b',
    icon: '💡',
    specialite: '💰 Innovation : +1 000 € produits financiers/trim',
    capital: 17000,
    empruntsInit: 8000,
    tresorerie: 8000,
    immobilisations: [
      { nom: 'Brevet IP', valeur: 8000 },
      { nom: 'Matériel informatique', valeur: 5000 }
    ],
    stocks: 4000
  }
};

const CLIENTS = {
  particulier: {
    id: 'client-particulier',
    type: 'Particulier',
    delaiPaiement: 0,
    achatsMin: 100,
    achatsMax: 300
  },
  tpe: {
    id: 'client-tpe',
    type: 'TPE',
    delaiPaiement: 1,
    achatsMin: 300,
    achatsMax: 800
  },
  grandcompte: {
    id: 'client-grand-compte',
    type: 'Grand Compte',
    delaiPaiement: 2,
    achatsMin: 800,
    achatsMax: 2000
  }
};

const COMMERCIAUX = {
  junior: {
    id: 'commercial-junior',
    nom: 'Commercial Junior',
    clientType: 'particulier',
    clientsParTour: 2,
    salaire: 1000,
    cout: 1000
  },
  senior: {
    id: 'commercial-senior',
    nom: 'Commercial Senior',
    clientType: 'tpe',
    clientsParTour: 2,
    salaire: 2000,
    cout: 2000
  },
  directrice: {
    id: 'directrice-commerciale',
    nom: 'Directrice Commerciale',
    clientType: 'grandcompte',
    clientsParTour: 2,
    salaire: 3000,
    cout: 3000
  }
};

const CARTES_DECISION = {
  // Véhicules
  'camionnette': { id: 'camionnette', nom: 'Camionnette', cout: 8000, immo: 8000, capacite: 6 },
  'berline': { id: 'berline', nom: 'Berline', cout: 8000, immo: 8000, capacite: 0, cartesParTour: 1 },
  'fourgon-refrigere': { id: 'fourgon-refrigere', nom: 'Fourgon Réfrigéré', cout: 6000, immo: 6000, capacite: 5 },
  'velo-cargo': { id: 'velo-cargo', nom: 'Vélo Cargo', cout: 3000, immo: 3000, capacite: 3 },
  // Logistique
  'expansion': { id: 'expansion', nom: 'Expansion', cout: 8000, immo: 8000, capacite: 10 },
  'entrepot-automatise': { id: 'entrepot-automatise', nom: 'Entrepôt Automatisé', cout: 8000, immo: 8000, capacite: 10 },
  'credit-bail': { id: 'credit-bail', nom: 'Crédit-Bail', cout: 6000, immo: 6000, capacite: 6 },
  // Investissements immatériels
  'site-internet': { id: 'site-internet', nom: 'Site Internet', cout: 4000, immo: 4000, clientesParticulier: 1 },
  'rse': { id: 'rse', nom: 'RSE', cout: 2000, immo: 2000, clientesParticulier: 1 },
  'recherche-developpement': { id: 'recherche-developpement', nom: 'Recherche & Développement', cout: 5000, immo: 5000, clientesTpe: 1 },
  'certification-iso': { id: 'certification-iso', nom: 'Certification ISO', cout: 5000, immo: 5000, clientesGrandcompte: 1 },
  'application-mobile': { id: 'application-mobile', nom: 'Application Mobile', cout: 4000, immo: 4000, clientesParticulier: 2 },
  'erp': { id: 'erp', nom: 'ERP', cout: 5000, immo: 5000, clientesGrandcompte: 1 },
  'label-qualite': { id: 'label-qualite', nom: 'Label Qualité', cout: 4000, immo: 4000, clientesTpe: 1 },
  'marketplace': { id: 'marketplace', nom: 'Marketplace', cout: 4000, immo: 4000, clientesParticulier: 2 },
  'programme-fidelite': { id: 'programme-fidelite', nom: 'Programme Fidélité', cout: 3000, immo: 3000, clientesParticulier: 1 },
  'export-international': { id: 'export-international', nom: 'Export International', cout: 5000, immo: 5000, clientesGrandcompte: 1 },
  'partenariat-commercial': { id: 'partenariat-commercial', nom: 'Partenariat Commercial', cout: 2000, immo: 2000, clientesTpe: 1 },
  'cybersecurite': { id: 'cybersecurite', nom: 'Cybersécurité', cout: 3000, immo: 3000 },
  'assurance-prevoyance': { id: 'assurance-prevoyance', nom: 'Assurance Prévoyance', cout: 2000, immo: 2000 },
  'mutuelle-collective': { id: 'mutuelle-collective', nom: 'Mutuelle Collective', cout: 2000, immo: 2000 },
  // Services financiers
  'affacturage': { id: 'affacturage', nom: 'Affacturage', cout: 0, immo: 0, coutParTour: 2000 },
  'relance-clients': { id: 'relance-clients', nom: 'Relance Clients', cout: 1000, immo: 0, oneTime: true },
  'remboursement-anticipe': { id: 'remboursement-anticipe', nom: 'Remboursement Anticipé', cout: 1000, immo: 0, oneTime: true },
  'levee-de-fonds': { id: 'levee-de-fonds', nom: 'Levée de Fonds', cout: 3000, immo: 0, oneTime: true },
  // Autres
  'publicite': { id: 'publicite', nom: 'Publicité', cout: 2000, immo: 0, optional: true, clientesParticulier: 2 },
  'formation': { id: 'formation', nom: 'Formation', cout: 2000, immo: 0, clientesGrandcompte: 1, oneTime: true },
  'optimisation-lean': { id: 'optimisation-lean', nom: 'Optimisation Lean', cout: 3000, immo: 3000 },
  'maintenance-preventive': { id: 'maintenance-preventive', nom: 'Maintenance Préventive', cout: 2000, immo: 0 }
};

const EVENEMENTS = [
  { id: 'evt-1', nom: 'Pic de demande', effet: 'ventes', valeur: 5000, negatif: false },
  { id: 'evt-2', nom: 'Grève logistique', effet: 'ventes', valeur: -3000, negatif: true },
  { id: 'evt-3', nom: 'Fournisseur en difficulté', effet: 'achats', valeur: 2000, negatif: true },
  { id: 'evt-4', nom: 'Subvention régionale', effet: 'tresorerie', valeur: 2000, negatif: false },
  { id: 'evt-5', nom: 'Réclamation client', effet: 'servicesExterieurs', valeur: 1500, negatif: true }
];

// ============================================================
// 3. STATE MANAGEMENT
// ============================================================

function getState() {
  const props = PropertiesService.getDocumentProperties();
  const stateJson = props.getProperty('gameState');
  return stateJson ? JSON.parse(stateJson) : null;
}

function saveState(state) {
  const props = PropertiesService.getDocumentProperties();
  props.setProperty('gameState', JSON.stringify(state));
}

function deleteState() {
  const props = PropertiesService.getDocumentProperties();
  props.deleteProperty('gameState');
}

function newState(nomEntreprise, nbTours = 12) {
  const entreprise = ENTREPRISES[nomEntreprise];
  if (!entreprise) throw new Error(`Entreprise inconnue: ${nomEntreprise}`);

  return {
    nomEntreprise: nomEntreprise,
    tour: 1,
    nbTours: nbTours,
    phase: 'playing',

    // Bilan
    tresorerie: entreprise.tresorerie,
    immobilisations: entreprise.immobilisations.map((im, idx) => ({
      id: idx,
      nom: im.nom,
      valeurInitiale: im.valeur,
      valeurActuelle: im.valeur
    })),
    stocks: entreprise.stocks,
    creancesPlus1: 0,
    creancesPlus2: 0,
    capitaux: entreprise.capital,
    emprunts: entreprise.empruntsInit || 8000,
    decouvert: 0,
    dettes: 0,
    dettesD2: 0,
    dettesFiscales: 0,

    // Compte de résultat
    ventes: 0,
    achats: 0,
    servicesExterieurs: 0,
    chargesPersonnel: 0,
    chargesInteret: 0,
    chargesExceptionnelles: 0,
    impotsTaxes: 0,
    dotationsAmortissements: 0,
    productionStockee: 0,
    produitsFinanciers: 0,
    revenusExceptionnels: 0,

    // Cartes actives
    cartes: [], // cartes de décision actives
    commerciaux: [], // commercial cards actifs
    affacturageActif: false,
    assuranceActif: false,

    // Clients en cours de traitement
    clientsATrait: [],
    clientsPerdusCeTour: 0,

    // Historique
    historiqueRésultat: [0],
    historiqueTrésorerie: [entreprise.tresorerie]
  };
}

// ============================================================
// 4. GAME LOGIC
// ============================================================

/**
 * Calcule la solvabilité (Capitaux propres + Résultat) / Total Passif × 100
 */
function calculerSolvabilite(state) {
  const capitauxPropres = state.capitaux;
  const resultatNet = calculerResultatNet(state);

  const totalPassif = capitauxPropres + state.emprunts + state.decouvert +
    state.dettes + state.dettesFiscales + state.dettesFiscales;

  if (totalPassif === 0) return 100;
  return ((capitauxPropres + resultatNet) / totalPassif) * 100;
}

/**
 * Calcule le résultat net (Produits - Charges)
 */
function calculerResultatNet(state) {
  const totalProduits = state.ventes + state.productionStockee + state.produitsFinanciers + state.revenusExceptionnels;
  const totalCharges = state.achats + state.servicesExterieurs + state.chargesPersonnel +
    state.chargesInteret + state.chargesExceptionnelles + state.impotsTaxes + state.dotationsAmortissements;
  return totalProduits - totalCharges;
}

/**
 * Calcule le total des immobilisations
 */
function getTotalImmobilisations(state) {
  return state.immobilisations.reduce((s, im) => s + im.valeurActuelle, 0);
}

/**
 * Calcule la capacité logistique (base + bonus cartes)
 */
function calculerCapaciteLogistique(state) {
  let capacite = 4; // base

  for (const carte of state.cartes) {
    if (carte.capacite) {
      capacite += carte.capacite;
    }
  }

  return capacite;
}

/**
 * Scorer une demande de prêt selon la spec
 */
function scorerDemandePret(state, montantDemande, tourActuel) {
  let score = 0;
  const details = [];

  // 1. Startup benevolence (tours 1-2)
  if (tourActuel <= 2) {
    score += 15;
    details.push('Entreprise en démarrage — bonus bienveillance banque ✓');
  }

  // 2. Solvabilité
  const solvabilite = calculerSolvabilite(state);
  if (solvabilite >= 40) {
    score += 30;
    details.push('Solvabilité solide ✓');
  } else if (solvabilite >= 30) {
    score += 20;
    details.push('Solvabilité acceptable');
  } else if (solvabilite >= 20) {
    score += 10;
    details.push('Solvabilité fragile');
  } else {
    details.push('Solvabilité insuffisante ✗');
  }

  // 3. Résultat net
  const resultatNet = calculerResultatNet(state);
  if (resultatNet > 0) {
    score += 25;
    details.push('Résultat bénéficiaire ✓');
  } else if (resultatNet === 0) {
    score += 10;
    details.push('Résultat nul (neutre)');
  } else {
    details.push('Résultat déficitaire ✗');
  }

  // 4. Position de trésorerie
  if (state.tresorerie >= 5000) {
    score += 20;
    details.push('Trésorerie confortable ✓');
  } else if (state.tresorerie >= 2000) {
    score += 10;
    details.push('Trésorerie limitée');
  } else if (state.tresorerie >= 0) {
    score += 5;
    details.push('Trésorerie très faible');
  } else {
    details.push('Découvert bancaire ✗');
  }

  // 5. Ratio d'endettement
  const totalActif = getTotalActif(state);
  const tauxEndettement = totalActif > 0 ? (state.emprunts / totalActif) * 100 : 100;
  if (tauxEndettement < 30) {
    score += 15;
    details.push('Endettement faible ✓');
  } else if (tauxEndettement < 50) {
    score += 10;
    details.push('Endettement modéré');
  } else if (tauxEndettement < 70) {
    score += 5;
    details.push('Endettement élevé');
  } else {
    details.push('Endettement excessif ✗');
  }

  // 6. Ratio de demande
  const ratioPret = totalActif > 0 ? (montantDemande / totalActif) * 100 : 100;
  if (ratioPret <= 10) {
    score += 10;
    details.push('Montant raisonnable ✓');
  } else if (ratioPret <= 20) {
    score += 5;
    details.push('Montant acceptable');
  } else {
    details.push('Montant trop élevé ✗');
  }

  const accepte = score >= 50;
  const tauxMajore = accepte && score < 65;

  let raison = '';
  if (!accepte) {
    raison = `Score ${score}/100 — insuffisant (min 50). Critères non validés.`;
  } else if (tauxMajore) {
    raison = `Score ${score}/100 — accordé avec taux majoré (8%/an).`;
  } else {
    raison = `Score ${score}/100 — accordé au taux standard (5%/an).`;
  }

  return {
    accepte: accepte,
    montantAccorde: accepte ? montantDemande : 0,
    tauxMajore: tauxMajore,
    score: score,
    raison: raison,
    details: details
  };
}

/**
 * Calcule le total de l'actif
 */
function getTotalActif(state) {
  const immobilisations = getTotalImmobilisations(state);
  const actifCirculant = state.stocks + state.creancesPlus1 + state.creancesPlus2 + state.tresorerie;
  return immobilisations + actifCirculant;
}

/**
 * Applique l'amortissement à la fin d'un trimestre
 */
function appliquerAmortissement(state) {
  let totalAmortissement = 0;

  for (const item of state.immobilisations) {
    if (item.valeurActuelle > 0) {
      const amortissement = Math.min(1000, item.valeurActuelle);
      item.valeurActuelle -= amortissement;
      totalAmortissement += amortissement;
    }
  }

  state.dotationsAmortissements += totalAmortissement;
}

/**
 * Applique les agios (10% du découvert, arrondi centaine sup)
 */
function appliquerAgios(state) {
  if (state.decouvert > 0) {
    const agios = Math.ceil(state.decouvert * 0.10 / 100) * 100;
    state.chargesInteret += agios;
    state.tresorerie -= agios;
  }
}

/**
 * Applique les intérêts annuels d'emprunt (tous les 4 trimestres)
 */
function appliquerInteretsEmprunt(state, tourActuel) {
  if (state.emprunts > 0 && tourActuel % 4 === 1) {
    const interet = Math.ceil(state.emprunts * 0.05 / 100) * 100;
    state.chargesInteret += interet;
    state.tresorerie -= interet;
  }
}

/**
 * Applique les charges fixes d'un trimestre
 */
function appliquerChargesFixed(state) {
  state.servicesExterieurs += 2000;
  state.tresorerie -= 2000;

  // Affacturage: 2000 € supplémentaires si actif
  if (state.affacturageActif) {
    state.servicesExterieurs += 2000;
    state.tresorerie -= 2000;
    // Encaisser les créances
    state.tresorerie += state.creancesPlus1 + state.creancesPlus2;
    state.creancesPlus1 = 0;
    state.creancesPlus2 = 0;
  }
}

/**
 * Applique les effets des commerciaux (salaires + clients)
 */
function appliquerCommerciauxTour(state) {
  for (const com of state.commerciaux) {
    state.chargesPersonnel += com.salaire;
    state.tresorerie -= com.salaire;

    // Ajouter les clients
    for (let i = 0; i < com.clientsParTour; i++) {
      if (com.clientType === 'particulier') {
        state.clientsATrait.push(CLIENTS.particulier);
      } else if (com.clientType === 'tpe') {
        state.clientsATrait.push(CLIENTS.tpe);
      } else if (com.clientType === 'grandcompte') {
        state.clientsATrait.push(CLIENTS.grandcompte);
      }
    }
  }
}

/**
 * Applique les effets de spécialité de l'entreprise
 */
function appliquerSpecialite(state) {
  if (state.nomEntreprise === 'Manufacture Belvaux') {
    // Production: +1000 stocks et +1000 production stockée
    state.stocks += 1000;
    state.productionStockee += 1000;
  } else if (state.nomEntreprise === 'Synergia Lab') {
    // Licence: +1000 trésorerie et +1000 produits financiers
    state.tresorerie += 1000;
    state.produitsFinanciers += 1000;
  } else if (state.nomEntreprise === 'Azura Commerce') {
    // Particuliers: +1 client gratuit
    state.clientsATrait.push(CLIENTS.particulier);
  }
}

/**
 * Traite un client (applique la vente)
 */
function traiterClient(state, client) {
  // Déterminer le montant aléatoire
  const montant = Math.floor(Math.random() * (client.achatsMax - client.achatsMin + 1)) + client.achatsMin;

  // Doubler pour arrondir à centaine sup
  const montantArrondi = Math.ceil(montant / 100) * 100;

  // Appliquer le délai (Véloce Transports réduit de 1)
  let delai = client.delaiPaiement;
  if (state.nomEntreprise === 'Véloce Transports') {
    delai = Math.max(0, delai - 1);
  }

  // Enregistrer la vente
  state.ventes += montantArrondi;
  state.achats += Math.ceil(montantArrondi * 0.3 / 100) * 100; // Matière première ~30%
  state.stocks -= 1;

  // Créances ou trésorerie selon délai
  if (delai === 0) {
    state.tresorerie += montantArrondi;
  } else if (delai === 1) {
    state.creancesPlus1 += montantArrondi;
  } else if (delai === 2) {
    state.creancesPlus2 += montantArrondi;
  }
}

/**
 * Processus des clients au tour
 */
function traiterClientsDelaTour(state) {
  const capacite = calculerCapaciteLogistique(state);
  const clientsTraites = state.clientsATrait.slice(0, capacite);
  state.clientsPerdusCeTour = Math.max(0, state.clientsATrait.length - capacite);

  for (const client of clientsTraites) {
    traiterClient(state, client);
  }

  state.clientsATrait = [];
}

/**
 * Applique l'encaissement des créances (C+1 -> Trésorerie, C+2 -> C+1)
 */
function appliquerEncaissementCreances(state) {
  // C+1 -> Trésorerie
  state.tresorerie += state.creancesPlus1;
  state.creancesPlus1 = 0;

  // C+2 -> C+1
  state.creancesPlus1 += state.creancesPlus2;
  state.creancesPlus2 = 0;
}

/**
 * Applique un événement aléatoire
 */
function appliquerEvenement(state) {
  const evt = EVENEMENTS[Math.floor(Math.random() * EVENEMENTS.length)];

  if (evt.effet === 'ventes') {
    state.ventes += evt.valeur;
  } else if (evt.effet === 'achats') {
    state.achats += evt.valeur;
  } else if (evt.effet === 'tresorerie') {
    state.tresorerie += evt.valeur;
  } else if (evt.effet === 'servicesExterieurs') {
    state.servicesExterieurs += evt.valeur;
  }

  return evt;
}

/**
 * Clôture annuelle (tous les 4 trimestres)
 */
function appliquerClotureAnnuelle(state) {
  // Ajouter le résultat net aux capitaux propres
  const resultatNet = calculerResultatNet(state);
  state.capitaux += resultatNet;

  // Réinitialiser les comptes de résultat
  state.ventes = 0;
  state.achats = 0;
  state.servicesExterieurs = 0;
  state.chargesPersonnel = 0;
  state.chargesInteret = 0;
  state.chargesExceptionnelles = 0;
  state.impotsTaxes = 0;
  state.dotationsAmortissements = 0;
  state.productionStockee = 0;
  state.produitsFinanciers = 0;
  state.revenusExceptionnels = 0;

  // Enregistrer le résultat dans l'historique
  state.historiqueRésultat.push(resultatNet);
}

/**
 * Vérifie la faillite
 */
function verifierFaillite(state) {
  // Découvert > 8000
  if (state.decouvert > 8000) {
    return { enFaillite: true, raison: 'Découvert excessif (> 8000)' };
  }

  // Capitaux propres < 0
  const capitaux = state.capitaux + calculerResultatNet(state);
  if (capitaux < 0) {
    return { enFaillite: true, raison: 'Capitaux propres négatifs' };
  }

  // Dette > 2x Capitaux
  const detteTotale = state.emprunts;
  if (detteTotale > capitaux * 2) {
    return { enFaillite: true, raison: 'Endettement excessif' };
  }

  return { enFaillite: false };
}

/**
 * Déséquilibre bilan-passif et gère le découvert
 */
function equilibrerBilan(state) {
  const totalActif = getTotalActif(state);
  const totalPassif = state.capitaux + state.emprunts + state.dettes + state.dettesFiscales;
  const resultat = calculerResultatNet(state);

  if (state.tresorerie < 0) {
    const deficitTreso = Math.abs(state.tresorerie);
    state.decouvert += deficitTreso;
    state.tresorerie = 0;
  }
}

/**
 * Calcule le score final du jeu
 */
function calculerScoreFinal(state) {
  const resultatCumulatif = state.historiqueRésultat.reduce((s, r) => s + r, 0);
  const immobilisations = getTotalImmobilisations(state);
  const tresorerie = state.tresorerie;
  const solvabilite = calculerSolvabilite(state);

  return (resultatCumulatif * 3) + (immobilisations * 2) + tresorerie + Math.round(solvabilite);
}

/**
 * Effectue un tour complet du jeu
 */
function executerTour(state) {
  // Étape 0: Charges fixes et amortissements
  appliquerAgios(state);
  appliquerInteretsEmprunt(state, state.tour);
  appliquerChargesFixed(state);
  appliquerAmortissement(state);

  // Étape 1: Encaissement créances
  appliquerEncaissementCreances(state);

  // Étape 2: Commerciaux et clients
  appliquerCommerciauxTour(state);
  appliquerSpecialite(state);

  // Étape 3: Traitement des clients (capacité limitée)
  traiterClientsDelaTour(state);

  // Étape 4: Événement aléatoire
  const evt = appliquerEvenement(state);

  // Étape 5: Équilibrer le bilan
  equilibrerBilan(state);

  // Historique
  state.historiqueTrésorerie.push(state.tresorerie);

  // Clôture annuelle tous les 4 tours
  if (state.tour % 4 === 0) {
    appliquerClotureAnnuelle(state);
  }

  // Vérifier faillite
  const faillite = verifierFaillite(state);
  if (faillite.enFaillite) {
    state.phase = 'faillite';
    return { faillite: faillite, evt: evt };
  }

  // Avancer au tour suivant
  state.tour += 1;
  if (state.tour > state.nbTours) {
    state.phase = 'finished';
    state.scoreFinal = calculerScoreFinal(state);
  }

  return { ok: true, evt: evt };
}

// ============================================================
// 5. DISPLAY FUNCTIONS
// ============================================================

function updateDashboard(state) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Effacer le contenu
  sheet.clear();

  // Titre
  const titleRange = sheet.getRange('A1:F1');
  titleRange.merge();
  titleRange.setValue(`🎮 JE DEVIENS PATRON — ${state.nomEntreprise}`);
  titleRange.setFontSize(16).setFontWeight('bold').setBackground('#1a73e8').setFontColor('white');

  // Bilan
  let row = 3;
  sheet.getRange(`A${row}:B${row}`).merge().setValue('BILAN').setFontWeight('bold').setBackground('#e3f2fd');
  row++;

  const bilanData = [
    ['ACTIF', ''],
    ['Trésorerie', fmt(state.tresorerie)],
    ['Stocks', fmt(state.stocks)],
    ['Créances +1', fmt(state.creancesPlus1)],
    ['Créances +2', fmt(state.creancesPlus2)],
    ['Immobilisations', fmt(getTotalImmobilisations(state))],
    ['', ''],
    ['PASSIF', ''],
    ['Capitaux propres', fmt(state.capitaux)],
    ['Emprunts', fmt(state.emprunts)],
    ['Découvert', fmt(state.decouvert)],
    ['Dettes fournisseurs', fmt(state.dettes)]
  ];

  for (const [label, value] of bilanData) {
    if (label === 'ACTIF' || label === 'PASSIF') {
      sheet.getRange(`A${row}:B${row}`).merge().setValue(label).setFontWeight('bold').setBackground('#f5f5f5');
    } else if (label === '') {
      row++;
    } else {
      sheet.getRange(`A${row}`).setValue(label);
      sheet.getRange(`B${row}`).setValue(value).setNumberFormat('#,##0 "€"');
    }
    row++;
  }

  // Compte de résultat
  row += 2;
  sheet.getRange(`A${row}:B${row}`).merge().setValue('COMPTE DE RÉSULTAT').setFontWeight('bold').setBackground('#e3f2fd');
  row++;

  const crData = [
    ['Ventes', fmt(state.ventes)],
    ['Production stockée', fmt(state.productionStockee)],
    ['Produits financiers', fmt(state.produitsFinanciers)],
    ['', ''],
    ['Achats', fmt(state.achats)],
    ['Services extérieurs', fmt(state.servicesExterieurs)],
    ['Charges personnel', fmt(state.chargesPersonnel)],
    ['Charges intérêt', fmt(state.chargesInteret)],
    ['Dotations amortissements', fmt(state.dotationsAmortissements)],
    ['', ''],
    ['Résultat Net', fmt(calculerResultatNet(state))]
  ];

  for (const [label, value] of crData) {
    if (label === '') {
      row++;
    } else {
      sheet.getRange(`A${row}`).setValue(label);
      sheet.getRange(`B${row}`).setValue(value).setNumberFormat('#,##0 "€"');
      if (label === 'Résultat Net') {
        sheet.getRange(`A${row}:B${row}`).setFontWeight('bold').setBackground('#fff9c4');
      }
    }
    row++;
  }

  // Indicateurs
  row += 2;
  sheet.getRange(`A${row}:B${row}`).merge().setValue('INDICATEURS').setFontWeight('bold').setBackground('#e3f2fd');
  row++;

  const indicateurs = [
    ['Tour', `${state.tour}/${state.nbTours}`],
    ['Solvabilité', `${fmtNum(calculerSolvabilite(state))}%`],
    ['Capacité logistique', `${calculerCapaciteLogistique(state)} unités`],
    ['Total Actif', fmt(getTotalActif(state))],
    ['Taux endettement', state.emprunts > 0 ? `${fmtNum((state.emprunts / getTotalActif(state)) * 100)}%` : '0%']
  ];

  for (const [label, value] of indicateurs) {
    sheet.getRange(`A${row}`).setValue(label);
    sheet.getRange(`B${row}`).setValue(value);
    row++;
  }

  // Cartes actives
  row += 2;
  sheet.getRange(`A${row}:B${row}`).merge().setValue('CARTES ACTIVES').setFontWeight('bold').setBackground('#e3f2fd');
  row++;

  if (state.cartes.length === 0) {
    sheet.getRange(`A${row}`).setValue('Aucune carte');
    row++;
  } else {
    for (const carte of state.cartes) {
      sheet.getRange(`A${row}`).setValue(carte.nom);
      sheet.getRange(`B${row}`).setValue(`Capacité +${carte.capacite || 0}`);
      row++;
    }
  }

  // Commerciaux
  row += 2;
  sheet.getRange(`A${row}:B${row}`).merge().setValue('COMMERCIAUX').setFontWeight('bold').setBackground('#e3f2fd');
  row++;

  if (state.commerciaux.length === 0) {
    sheet.getRange(`A${row}`).setValue('Aucun commercial');
    row++;
  } else {
    for (const com of state.commerciaux) {
      sheet.getRange(`A${row}`).setValue(com.nom);
      sheet.getRange(`B${row}`).setValue(`${com.clientsParTour} clients/tour`);
      row++;
    }
  }

  // Largeurs
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 150);
}

function updateHistorique(state) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('📊 Historique');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('📊 Historique');
  }

  sheet.clear();

  // En-têtes
  const headers = ['Tour', 'Trésorerie', 'Stocks', 'Immobilisations', 'Capitaux', 'Emprunts',
    'Découvert', 'CA cumulé', 'Résultat', 'Solvabilité %', 'Nb Clients', 'Événement'];
  sheet.getRange('A1:L1').setValues([headers]).setFontWeight('bold').setBackground('#1a73e8').setFontColor('white');

  // Données historiques (simulées pour l'instant - en prod, il faudrait tracker chaque tour)
  let row = 2;
  for (let t = 1; t <= state.tour; t++) {
    sheet.getRange(`A${row}`).setValue(t);
    sheet.getRange(`B${row}`).setValue(state.historiqueTrésorerie[t] || state.tresorerie).setNumberFormat('#,##0 "€"');
    sheet.getRange(`C${row}`).setValue(state.stocks).setNumberFormat('#,##0 "€"');
    sheet.getRange(`D${row}`).setValue(getTotalImmobilisations(state)).setNumberFormat('#,##0 "€"');
    sheet.getRange(`E${row}`).setValue(state.capitaux).setNumberFormat('#,##0 "€"');
    sheet.getRange(`F${row}`).setValue(state.emprunts).setNumberFormat('#,##0 "€"');
    sheet.getRange(`G${row}`).setValue(state.decouvert).setNumberFormat('#,##0 "€"');
    sheet.getRange(`H${row}`).setValue(state.ventes).setNumberFormat('#,##0 "€"');
    sheet.getRange(`I${row}`).setValue(calculerResultatNet(state)).setNumberFormat('#,##0 "€"');
    sheet.getRange(`J${row}`).setValue(calculerSolvabilite(state)).setNumberFormat('0.0"%"');
    sheet.getRange(`K${row}`).setValue(0);
    row++;
  }

  // Largeurs optimisées
  for (let i = 1; i <= 12; i++) {
    sheet.setColumnWidth(i, 120);
  }
}

function updateGraphiques(state) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('📈 Graphiques');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('📈 Graphiques');
  }

  sheet.clear();

  // Titre
  sheet.getRange('A1:B1').merge().setValue('Graphiques d\'évolution').setFontWeight('bold').setBackground('#1a73e8').setFontColor('white');

  // Données pour graphiques
  const tourData = [];
  for (let i = 1; i <= state.tour; i++) {
    tourData.push([i, state.historiqueTrésorerie[i] || state.tresorerie, state.historiqueRésultat[i] || 0]);
  }

  // Placer les données pour le graphique
  sheet.getRange('A3:C3').setValues([['Tour', 'Trésorerie', 'Résultat']]);
  if (tourData.length > 0) {
    sheet.getRange(`A4:C${3 + tourData.length}`).setValues(tourData);
  }
}

// ============================================================
// 6. MENU & UI
// ============================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎮 Jeu')
    .addItem('Nouvelle partie', 'menuNouvellePartie')
    .addItem('Exécuter un tour', 'menuExecuterTour')
    .addItem('Acheter une carte', 'menuAcheterCarte')
    .addItem('Recruter un commercial', 'menuRecruterCommercial')
    .addItem('Demander un prêt', 'menuDemanderPret')
    .addItem('Quitter et voir le score', 'menuQuitterEtScore')
    .addToUi();
}

function menuNouvellePartie() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Quelle entreprise choisissez-vous?',
    'Manufacture Belvaux\nVéloce Transports\nAzura Commerce\nSynergia Lab',
    ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const entreprise = response.getResponseText();
  if (!ENTREPRISES[entreprise]) {
    ui.alert('Entreprise inconnue');
    return;
  }

  const nbTours = ui.prompt('Nombre de trimestres? (6, 8, ou 12)', '12', ui.ButtonSet.OK_CANCEL);
  if (nbTours.getSelectedButton() !== ui.Button.OK) return;

  const nb = parseInt(nbTours.getResponseText()) || 12;
  if (![6, 8, 12].includes(nb)) {
    ui.alert('Nombre de trimestres invalide (6, 8, ou 12)');
    return;
  }

  // Créer et sauvegarder l'état
  const state = newState(entreprise, nb);
  saveState(state);

  // Afficher le dashboard
  SpreadsheetApp.getActiveSheet().setName('🎮 Tableau de Bord');
  updateDashboard(state);
  updateHistorique(state);
  updateGraphiques(state);

  ui.alert(`Partie commencée avec ${entreprise}!\n${nb} trimestres\n\nCliquez sur "Exécuter un tour" pour commencer.`);
}

function menuExecuterTour() {
  const ui = SpreadsheetApp.getUi();
  let state = getState();

  if (!state) {
    ui.alert('Aucune partie en cours. Commencez une nouvelle partie.');
    return;
  }

  if (state.phase !== 'playing') {
    ui.alert(`Jeu terminé. Phase: ${state.phase}`);
    if (state.phase === 'finished') {
      ui.alert(`Score final: ${fmtNum(state.scoreFinal)}`);
    }
    return;
  }

  const result = executerTour(state);
  saveState(state);

  updateDashboard(state);
  updateHistorique(state);
  updateGraphiques(state);

  let msg = `Tour ${state.tour - 1} exécuté!\n`;
  if (result.evt) {
    msg += `Événement: ${result.evt.nom}`;
  }
  if (result.faillite) {
    msg += `\n\n⚠️ FAILLITE: ${result.faillite.raison}`;
  }

  ui.alert(msg);
}

function menuAcheterCarte() {
  const ui = SpreadsheetApp.getUi();
  let state = getState();

  if (!state) {
    ui.alert('Aucune partie en cours.');
    return;
  }

  const carteIds = Object.keys(CARTES_DECISION);
  const response = ui.prompt(`Quelle carte acheter?\n\n${carteIds.join('\n')}`, '', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const carteId = response.getResponseText();
  const carte = CARTES_DECISION[carteId];

  if (!carte) {
    ui.alert('Carte inconnue');
    return;
  }

  if (state.tresorerie < carte.cout) {
    ui.alert(`Trésorerie insuffisante (${fmt(state.tresorerie)} vs ${fmt(carte.cout)})`);
    return;
  }

  // Acheter la carte
  state.tresorerie -= carte.cout;
  if (carte.immo) {
    state.immobilisations.push({
      id: state.cartes.length,
      nom: carte.nom,
      valeurInitiale: carte.immo,
      valeurActuelle: carte.immo
    });
  }
  state.cartes.push(carte);

  saveState(state);
  updateDashboard(state);
  ui.alert(`${carte.nom} achetée!`);
}

function menuRecruterCommercial() {
  const ui = SpreadsheetApp.getUi();
  let state = getState();

  if (!state) {
    ui.alert('Aucune partie en cours.');
    return;
  }

  const commercialIds = ['junior', 'senior', 'directrice'];
  const response = ui.prompt(`Quel commercial recruter?\n\njunior\nsenior\ndirectrice`, '', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const type = response.getResponseText();
  const com = COMMERCIAUX[type];

  if (!com) {
    ui.alert('Commercial inconnu');
    return;
  }

  if (state.tresorerie < com.cout) {
    ui.alert(`Trésorerie insuffisante`);
    return;
  }

  state.tresorerie -= com.cout;
  state.commerciaux.push(com);

  saveState(state);
  updateDashboard(state);
  ui.alert(`${com.nom} recruté!`);
}

function menuDemanderPret() {
  const ui = SpreadsheetApp.getUi();
  let state = getState();

  if (!state) {
    ui.alert('Aucune partie en cours.');
    return;
  }

  const montantResponse = ui.prompt('Montant du prêt demandé (€)?', '5000', ui.ButtonSet.OK_CANCEL);
  if (montantResponse.getSelectedButton() !== ui.Button.OK) return;

  const montant = parseInt(montantResponse.getResponseText()) || 5000;
  const scoring = scorerDemandePret(state, montant, state.tour);

  if (!scoring.accepte) {
    ui.alert(`Demande refusée\n${scoring.raison}`);
    return;
  }

  state.emprunts += montant;
  state.tresorerie += montant;

  saveState(state);
  updateDashboard(state);

  const taux = scoring.tauxMajore ? '8%' : '5%';
  ui.alert(`Prêt accepté!\n${fmt(montant)} à ${taux}/an\n${scoring.raison}`);
}

function menuQuitterEtScore() {
  const ui = SpreadsheetApp.getUi();
  let state = getState();

  if (!state) {
    ui.alert('Aucune partie en cours.');
    return;
  }

  const score = calculerScoreFinal(state);
  state.scoreFinal = score;
  state.phase = 'finished';
  saveState(state);

  let interpretation = '';
  if (score >= 80000) interpretation = 'Excellent!';
  else if (score >= 60000) interpretation = 'Très bon';
  else if (score >= 40000) interpretation = 'Bon';
  else if (score >= 20000) interpretation = 'Passable';
  else interpretation = 'À améliorer';

  ui.alert(`Partie terminée\n\nScore final: ${fmtNum(score)}\n${interpretation}\n\nFélicitations!`);
}
