// ============================================================
// KICLEPATRON — Catalogue complet des cartes
// Source : KICLEPATRON_v2.html — Pierre Médan
// ============================================================

import { CarteCommercial, CarteClient, CarteDecision, CarteEvenement } from "@/lib/game-engine/types";

// ─── CARTES COMMERCIAUX ─────────────────────────────────────

export const CARTES_COMMERCIAUX: CarteCommercial[] = [
  {
    type: "commercial",
    id: "commercial-junior",
    titre: "Commercial Junior",
    coutChargesPersonnel: 1,
    coutTresorerie: 1,
    typeClientRapporte: "particulier",
    nbClientsParTour: 2, // génère 2 Particuliers/tour → ventes +4, CMV −2, salary −1 = +1 net
  },
  {
    type: "commercial",
    id: "commercial-senior",
    titre: "Commercial Senior",
    coutChargesPersonnel: 2,
    coutTresorerie: 2,
    typeClientRapporte: "tpe",
    nbClientsParTour: 2, // génère 2 TPE/tour → ventes +6, CMV −2, salary −2 = +2 net (C+1 × 2 → BFR !)
  },
  {
    type: "commercial",
    id: "directrice-commerciale",
    titre: "Directrice Commerciale",
    coutChargesPersonnel: 3,
    coutTresorerie: 3,
    typeClientRapporte: "grand_compte",
    nbClientsParTour: 2, // génère 2 Grand Comptes/tour → ventes +8, CMV −2, salary −3 = +3 net (C+2 × 2 → BFR critique !)
  },
];

// ─── CARTES CLIENTS ──────────────────────────────────────────
// Comptabilisation quadruple : Ventes +X | Stocks -1 | CMV (achats) +1 | Tréso ou Créance +X

export const CARTES_CLIENTS: CarteClient[] = [
  {
    type: "client",
    id: "client-particulier",
    titre: "Client Particulier",
    montantVentes: 2,
    delaiPaiement: 0, // Paiement immédiat → Trésorerie +2
    consommeStocks: true,
  },
  {
    type: "client",
    id: "client-tpe",
    titre: "Client TPE",
    montantVentes: 3,
    delaiPaiement: 1, // Paiement différé → Créances C+1 +3
    consommeStocks: true,
  },
  {
    type: "client",
    id: "client-grand-compte",
    titre: "Client Grand Compte",
    montantVentes: 4,
    delaiPaiement: 2, // Paiement très différé → Créances C+2 +4
    consommeStocks: true,
  },
];

// ─── CARTES DÉCISION ─────────────────────────────────────────

export const CARTES_DECISION: CarteDecision[] = [
  // ── COMMERCIAUX ────────────────────────────────────────────

  {
    type: "decision",
    id: "commercial-junior-dec",
    titre: "Commercial Junior",
    description: "Recrutez un commercial junior : salaire −1/trim, génère 2 clients Particuliers/trim (+2×2 ventes immédiates). Résultat net : +1/trim.",
    categorie: "commercial",
    effetsImmédiats: [
      { poste: "chargesPersonnel", delta: 1 },
      { poste: "tresorerie", delta: -1 },
    ],
    effetsRecurrents: [
      { poste: "chargesPersonnel", delta: 1 },
      { poste: "tresorerie", delta: -1 },
    ],
    clientParTour: "particulier",
    nbClientsParTour: 2,
  },
  {
    type: "decision",
    id: "commercial-senior-dec",
    titre: "Commercial Senior",
    description: "Recrutez un commercial senior : salaire −2/trim, génère 2 clients TPE/trim (+2×3 ventes en C+1). Résultat net : +2/trim — mais BFR élevé, gérez vos créances !",
    categorie: "commercial",
    effetsImmédiats: [
      { poste: "chargesPersonnel", delta: 2 },
      { poste: "tresorerie", delta: -2 },
    ],
    effetsRecurrents: [
      { poste: "chargesPersonnel", delta: 2 },
      { poste: "tresorerie", delta: -2 },
    ],
    clientParTour: "tpe",
    nbClientsParTour: 2,
  },
  {
    type: "decision",
    id: "directrice-commerciale-dec",
    titre: "Directrice Commerciale",
    description: "Recrutez une directrice commerciale : salaire −3/trim, génère 2 Grands Comptes/trim (+2×4 ventes en C+2). Résultat net : +3/trim — BFR critique, risque de faillite si tréso insuffisante !",
    categorie: "commercial",
    effetsImmédiats: [
      { poste: "chargesPersonnel", delta: 3 },
      { poste: "tresorerie", delta: -3 },
    ],
    effetsRecurrents: [
      { poste: "chargesPersonnel", delta: 3 },
      { poste: "tresorerie", delta: -3 },
    ],
    clientParTour: "grand_compte",
    nbClientsParTour: 2,
  },

  // ── VÉHICULES ──────────────────────────────────────────────

  {
    type: "decision",
    id: "camionnette",
    titre: "Camionnette",
    description: "Achetez une camionnette de livraison — améliore votre logistique et attire 1 client Particulier/trimestre. Investissement immédiat : Immos +2, Tréso −2. Entretien : Services ext. +2/trim. 📉 Amortissement : −1/trim pendant 2 trimestres → Dotation aux amortissements +1 au CR.",
    categorie: "vehicule",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 2 },
      { poste: "tresorerie", delta: -2 },
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 2 }, // entretien
      { poste: "tresorerie", delta: -2 },
    ],
    clientParTour: "particulier",
  },
  {
    type: "decision",
    id: "berline",
    titre: "Berline",
    description: "Achetez une berline de représentation — facilite les démarches commerciales, +1 Carte Décision piochée par tour. Investissement : Immos +3, Tréso −3. Entretien : Services ext. +2/trim. 📉 Amortissement : −1/trim pendant 3 trimestres → Dotation aux amortissements +1 au CR.",
    categorie: "vehicule",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 3 },
      { poste: "tresorerie", delta: -3 },
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 2 },
      { poste: "tresorerie", delta: -2 },
    ],
    carteDecisionBonus: 1, // +1 carte Décision piochée par tour
  },

  // ── INVESTISSEMENTS ────────────────────────────────────────

  {
    type: "decision",
    id: "site-internet",
    titre: "Site Internet",
    description: "Créez votre vitrine en ligne — visibilité accrue, +1 client Particulier/trimestre. Investissement : Immos +3, Tréso −3. Maintenance : Services ext. +1/trim. 📉 Amortissement : −1/trim pendant 3 trimestres → Dotation +1 au CR.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 3 },  // DÉBIT Immobilisations
      { poste: "tresorerie", delta: -3 },      // CRÉDIT Trésorerie (paiement comptant)
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 1 }, // DÉBIT Charges maintenance
      { poste: "tresorerie", delta: -1 },         // CRÉDIT Trésorerie
    ],
    clientParTour: "particulier",
  },
  {
    type: "decision",
    id: "rse",
    titre: "RSE",
    description: "Engagez-vous dans la responsabilité sociale — crédibilité renforcée, +1 client Particulier/trim. Financé par emprunt : Immos +1, Emprunts +1 (aucune sortie de tréso immédiate !). Charges RSE : Services ext. +1/trim. 📉 Amortissement : −1/trim pendant 1 trimestre → Dotation +1 au CR.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 1 }, // DÉBIT Immobilisations
      { poste: "emprunts", delta: 1 },        // CRÉDIT Emprunts (financement par dette)
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 1 }, // DÉBIT Charges RSE
      { poste: "tresorerie", delta: -1 },         // CRÉDIT Trésorerie
    ],
    clientParTour: "particulier",
  },
  {
    type: "decision",
    id: "recherche-developpement",
    titre: "Recherche & Développement",
    description: "Investissez en R&D — innovation brevetée, +1 client TPE/trimestre. Crédit d'Impôt Recherche (CIR) : l'État rembourse 30 % sous forme de produit exceptionnel +1/trim. Investissement : Immos +5, Tréso −5. Charges R&D : Services ext. +2/trim. 📉 Amortissement : −1/trim pendant 5 trimestres → Dotation +1 au CR.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5 },  // DÉBIT Immobilisations incorporelles
      { poste: "tresorerie", delta: -5 },       // CRÉDIT Trésorerie
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 2 },    // DÉBIT Charges R&D récurrentes
      { poste: "tresorerie", delta: -2 },            // CRÉDIT Trésorerie
      { poste: "revenusExceptionnels", delta: 1 },  // CRÉDIT Crédit d'Impôt Recherche (CIR)
      { poste: "tresorerie", delta: 1 },             // DÉBIT Trésorerie (encaissement CIR)
    ],
    clientParTour: "tpe",
  },
  {
    type: "decision",
    id: "expansion",
    titre: "Expansion",
    description: "Agrandissez vos locaux — capacité d'accueil doublée, +1 Grand Compte/trimestre. Investissement : Immos +6, Tréso −6. Loyer et entretien : Services ext. +3/trim. 📉 Amortissement : −1/trim pendant 6 trimestres → Dotation +1 au CR.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 6 },  // DÉBIT Immobilisations (nouveaux locaux)
      { poste: "tresorerie", delta: -6 },       // CRÉDIT Trésorerie
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 3 }, // DÉBIT Loyer, entretien locaux
      { poste: "tresorerie", delta: -3 },         // CRÉDIT Trésorerie
    ],
    clientParTour: "grand_compte",
  },

  // ── FINANCEMENT ────────────────────────────────────────────

  {
    type: "decision",
    id: "levee-de-fonds",
    titre: "Levée de Fonds",
    description: "Ouvrez votre capital à des investisseurs. Apport immédiat de trésorerie.",
    categorie: "financement",
    effetsImmédiats: [
      // Coût du dossier
      { poste: "servicesExterieurs", delta: 3 },
      { poste: "tresorerie", delta: -3 },
      // Apport investisseurs
      { poste: "tresorerie", delta: 6 },
      { poste: "capitaux", delta: 6 },
    ],
    effetsRecurrents: [], // carte à usage unique (retirée après usage)
  },
  {
    type: "decision",
    id: "remboursement-anticipe",
    titre: "Remboursement Anticipé",
    description: "Remboursez intégralement votre emprunt. Économisez sur les intérêts futurs.",
    categorie: "financement",
    effetsImmédiats: [
      { poste: "servicesExterieurs", delta: 1 },
      { poste: "tresorerie", delta: -1 },
      // Les emprunts restants sont remboursés → voir logique dans engine.ts
    ],
    effetsRecurrents: [],
  },

  // ── TACTIQUE ──────────────────────────────────────────────

  {
    type: "decision",
    id: "publicite",
    titre: "Publicité",
    description: "Lancez une campagne publicitaire. +2 clients particuliers si activée ce tour.",
    categorie: "tactique",
    effetsImmédiats: [],
    effetsRecurrents: [
      // Coût seulement si activée (optionnel chaque tour)
      { poste: "servicesExterieurs", delta: 2 },
      { poste: "tresorerie", delta: -2 },
    ],
    clientParTour: "particulier",
    nbClientsParTour: 2, // +2 clients particuliers par trimestre
  },
  {
    type: "decision",
    id: "relance-clients",
    titre: "Relance Clients",
    description: "Relancez vos créances. Toutes vos créances avancent d'un cran immédiatement.",
    categorie: "tactique",
    effetsImmédiats: [
      { poste: "chargesPersonnel", delta: 1 },
      { poste: "tresorerie", delta: -1 },
      // Avancement créances géré dans engine.ts (logique spéciale)
    ],
    effetsRecurrents: [],
  },
  {
    type: "decision",
    id: "formation",
    titre: "Formation",
    description: "Formez vos équipes. Gagnez immédiatement 1 client grand compte.",
    categorie: "tactique",
    effetsImmédiats: [
      { poste: "chargesPersonnel", delta: 1 },
      { poste: "tresorerie", delta: -1 },
    ],
    effetsRecurrents: [],
    clientParTour: "grand_compte", // +1 immédiat à l'achat uniquement
  },

  // ── SERVICE ───────────────────────────────────────────────

  {
    type: "decision",
    id: "affacturage",
    titre: "Affacturage",
    description: "Cédez vos créances à un factor. Encaissez immédiatement, sans délai.",
    categorie: "service",
    effetsImmédiats: [],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 2 },
      { poste: "tresorerie", delta: -2 },
      // Toutes créances converties immédiatement en trésorerie → logique dans engine.ts
    ],
  },

  // ── NOUVELLES CARTES DÉCISION ──────────────────────────────

  {
    type: "decision",
    id: "pret-bancaire",
    titre: "Prêt Bancaire",
    description: "Contractez un emprunt auprès de votre banque. Obtenez 5 de trésorerie immédiatement, mais payez 1 d'intérêts chaque trimestre. Montre l'effet de levier financier : l'actif et le passif augmentent simultanément.",
    categorie: "financement",
    effetsImmédiats: [
      { poste: "tresorerie", delta: 5 },  // DÉBIT Trésorerie (encaissement du prêt)
      { poste: "emprunts", delta: 5 },    // CRÉDIT Emprunts (dette financière)
    ],
    effetsRecurrents: [
      { poste: "chargesInteret", delta: 1 },  // DÉBIT Charges d'intérêts
      { poste: "tresorerie", delta: -1 },      // CRÉDIT Trésorerie (paiement intérêts)
    ],
  },
  {
    type: "decision",
    id: "certification-iso",
    titre: "Certification ISO 9001",
    description: "Obtenez la certification qualité — crédibilité auprès des grandes entreprises, +1 Grand Compte/trimestre. Investissement : Immos +4, Tréso −4. Maintien certification : Services ext. +1/trim. 📉 Amortissement : −1/trim pendant 4 trimestres → Dotation +1 au CR.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 4 },  // DÉBIT Immobilisations incorporelles
      { poste: "tresorerie", delta: -4 },       // CRÉDIT Trésorerie
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 1 }, // DÉBIT Frais de maintien certification
      { poste: "tresorerie", delta: -1 },         // CRÉDIT Trésorerie
    ],
    clientParTour: "grand_compte",
  },
  {
    type: "decision",
    id: "application-mobile",
    titre: "Application Mobile",
    description: "Lancez votre app de vente en ligne — canal direct vers les consommateurs, +2 clients Particuliers/trimestre. Développement : Immos +3, Tréso −3. Hébergement & maintenance : Services ext. +1/trim. 📉 Amortissement : −1/trim pendant 3 trimestres → Dotation +1 au CR.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 3 },  // DÉBIT Immobilisations incorporelles (développement)
      { poste: "tresorerie", delta: -3 },       // CRÉDIT Trésorerie
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 1 }, // DÉBIT Hébergement & maintenance app
      { poste: "tresorerie", delta: -1 },         // CRÉDIT Trésorerie
    ],
    clientParTour: "particulier",
    nbClientsParTour: 2,
  },

  // ── PROTECTION ────────────────────────────────────────────

  {
    type: "decision",
    id: "assurance-prevoyance",
    titre: "Assurance Prévoyance",
    description: "Souscrivez une assurance — annule les événements négatifs (incendie, grève, litige, contrôle fiscal…). Dépôt de garantie : Immos +1, Tréso −1. Prime annuelle : Services ext. +1/trim, Tréso −1/trim. 📉 Amortissement : −1/trim (1 trimestre).",
    categorie: "protection",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 1 },
      { poste: "tresorerie", delta: -1 },
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 1 },
      { poste: "tresorerie", delta: -1 },
    ],
  },
];

// ─── CARTES ÉVÉNEMENTS ──────────────────────────────────────

export const CARTES_EVENEMENTS: CarteEvenement[] = [
  {
    type: "evenement",
    id: "client-vip",
    titre: "Client VIP ⭐",
    description:
      "Une starlette de télé-réalité s'est prise en selfie avec votre produit. Vos ventes sont au beau fixe !",
    effets: [
      { poste: "ventes", delta: 2 },
      { poste: "tresorerie", delta: 2 },
      { poste: "stocks", delta: -2 },
      { poste: "achats", delta: 2 }, // CMV correspondant
    ],
    annulableParAssurance: false,
  },
  {
    type: "evenement",
    id: "controle-fiscal",
    titre: "Contrôle Fiscal 📋",
    description:
      "Vous recevez un redressement suite à une erreur dans votre déclaration fiscale. Payez sans discuter !",
    effets: [
      { poste: "impotsTaxes", delta: 2 },
      { poste: "tresorerie", delta: -2 },
    ],
    annulableParAssurance: true,
  },
  {
    type: "evenement",
    id: "subvention-innovation",
    titre: "Subvention Innovation 🎉",
    description:
      "Vous inventez un concept innovant ! Vous obtenez une subvention de la région pour le développer.",
    effets: [
      { poste: "revenusExceptionnels", delta: 3 },
      { poste: "tresorerie", delta: 3 },
    ],
    annulableParAssurance: false,
  },
  {
    type: "evenement",
    id: "placement-financier",
    titre: "Placement Financier 📈",
    description:
      "Votre trésorerie placée génère des intérêts. La gestion prudente paye !",
    effets: [
      { poste: "produitsFinanciers", delta: 1 },
      { poste: "tresorerie", delta: 1 },
    ],
    annulableParAssurance: false,
  },
  {
    type: "evenement",
    id: "crise-sanitaire",
    titre: "Crise Sanitaire 😷",
    description:
      "Une crise sanitaire touche le monde entier. Vos ventes s'effondrent ce trimestre.",
    effets: [
      { poste: "ventes", delta: -2 },
      { poste: "tresorerie", delta: -2 },
    ],
    annulableParAssurance: true,
  },
  {
    type: "evenement",
    id: "incendie",
    titre: "L'Entreprise Prend Feu ! 🔥",
    description:
      "Votre entreprise est incendiée. Sans assurance, pas de clients au prochain tour. Avec assurance : indemnités.",
    effets: [
      { poste: "revenusExceptionnels", delta: 2 },
      { poste: "tresorerie", delta: 2 },
    ],
    annulableParAssurance: false, // l'assurance change l'effet mais ne l'annule pas
  },
  {
    type: "evenement",
    id: "greve",
    titre: "Grève des Employés ✊",
    description:
      "Vos employés font grève. La production est à l'arrêt ce trimestre.",
    effets: [
      { poste: "ventes", delta: -2 },
      { poste: "tresorerie", delta: -2 },
    ],
    annulableParAssurance: true,
  },
  {
    type: "evenement",
    id: "bouche-a-oreille",
    titre: "Bouche à Oreille 📣",
    description:
      "Vos clients sont très satisfaits, ils font du buzz sur les réseaux sociaux !",
    effets: [
      { poste: "ventes", delta: 1 },
      { poste: "tresorerie", delta: 1 },
    ],
    annulableParAssurance: false,
  },
  {
    type: "evenement",
    id: "perte-de-donnees",
    titre: "Perte de Données 💾",
    description:
      "Vous perdez vos fichiers informatiques. Vous devez faire appel à un spécialiste en urgence.",
    effets: [
      { poste: "chargesExceptionnelles", delta: 2 },
      { poste: "tresorerie", delta: -2 },
    ],
    annulableParAssurance: true,
  },
  {
    type: "evenement",
    id: "subvention-developpement-durable",
    titre: "Développement Durable 🌿",
    description:
      "Vous remportez un appel d'offres pour un projet écologique auprès d'une mairie.",
    effets: [
      { poste: "ventes", delta: 3 },
      { poste: "tresorerie", delta: 3 },
    ],
    annulableParAssurance: false,
  },

  // ── NOUVEAUX ÉVÉNEMENTS (1 positif + 2 négatifs) ─────────────

  {
    type: "evenement",
    id: "prix-pme-annee",
    titre: "Prix PME de l'Année 🏆",
    description:
      "La Chambre de Commerce vous remet le Prix Régional PME de l'Année. Votre notoriété bondit et attire de nouveaux partenaires.",
    effets: [
      { poste: "revenusExceptionnels", delta: 2 },  // CRÉDIT Produits exceptionnels
      { poste: "tresorerie", delta: 2 },             // DÉBIT Trésorerie (dotation prix)
    ],
    annulableParAssurance: false,
  },
  {
    type: "evenement",
    id: "rupture-stock-fournisseur",
    titre: "Rupture Fournisseur 📦",
    description:
      "Votre fournisseur principal est en rupture de stock. Vous devez vous approvisionner en urgence à prix fort chez un concurrent.",
    effets: [
      { poste: "chargesExceptionnelles", delta: 2 },  // DÉBIT Charges exceptionnelles (surcoût)
      { poste: "tresorerie", delta: -2 },              // CRÉDIT Trésorerie
    ],
    annulableParAssurance: false,
  },
  {
    type: "evenement",
    id: "litige-commercial",
    titre: "Litige Commercial ⚖️",
    description:
      "Un client conteste la conformité de votre livraison et vous assigne en justice. Honoraires d'avocat et provision pour risque.",
    effets: [
      { poste: "chargesExceptionnelles", delta: 3 },  // DÉBIT Charges exceptionnelles (frais juridiques)
      { poste: "tresorerie", delta: -3 },              // CRÉDIT Trésorerie
    ],
    annulableParAssurance: true,
  },
];
