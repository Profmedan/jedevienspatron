// ============================================================
// JEDEVIENSPATRON — Catalogue complet des cartes
// Source : JEDEVIENSPATRON_v2.html — Pierre Médan
// ============================================================

import { CarteCommercial, CarteClient, CarteDecision, CarteEvenement } from "../types";

// ─── CARTES COMMERCIAUX ─────────────────────────────────────

export const CARTES_COMMERCIAUX: CarteCommercial[] = [
  {
    type: "commercial",
    id: "commercial-junior",
    titre: "Commercial Junior",
    coutChargesPersonnel: 1,
    coutTresorerie: 1,
    typeClientRapporte: "particulier",
    nbClientsParTour: 1,
  },
  {
    type: "commercial",
    id: "commercial-senior",
    titre: "Commercial Senior",
    coutChargesPersonnel: 2,
    coutTresorerie: 2,
    typeClientRapporte: "tpe",
    nbClientsParTour: 1,
  },
  {
    type: "commercial",
    id: "directrice-commerciale",
    titre: "Directrice Commerciale",
    coutChargesPersonnel: 3,
    coutTresorerie: 3,
    typeClientRapporte: "grand_compte",
    nbClientsParTour: 1,
  },
];

// ─── CARTES CLIENTS ──────────────────────────────────────────
// Comptabilisation quadruple : Ventes +X | Stocks -1 | CMV (achats) +1 | Tréso ou Créance +X

export const CARTES_CLIENTS: CarteClient[] = [
  {
    type: "client",
    id: "client-particulier",
    titre: "Client Particulier",
    montantVentes: 1,
    delaiPaiement: 0, // Paiement immédiat → Trésorerie +1
    consommeStocks: true,
  },
  {
    type: "client",
    id: "client-tpe",
    titre: "Client TPE",
    montantVentes: 2,
    delaiPaiement: 1, // Paiement différé → Créances C+1 +2
    consommeStocks: true,
  },
  {
    type: "client",
    id: "client-grand-compte",
    titre: "Client Grand Compte",
    montantVentes: 3,
    delaiPaiement: 2, // Paiement très différé → Créances C+2 +3
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
    description: "Recrutez un commercial junior qui vous rapporte 1 client particulier par tour.",
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
  },
  {
    type: "decision",
    id: "commercial-senior-dec",
    titre: "Commercial Senior",
    description: "Recrutez un commercial senior qui vous rapporte 1 client TPE par tour.",
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
  },
  {
    type: "decision",
    id: "directrice-commerciale-dec",
    titre: "Directrice Commerciale",
    description: "Recrutez une directrice commerciale qui rapporte 1 grand compte par tour.",
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
  },

  // ── VÉHICULES ──────────────────────────────────────────────

  {
    type: "decision",
    id: "camionnette",
    titre: "Camionnette",
    description: "Achetez une camionnette de livraison. Améliore votre logistique.",
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
    description: "Achetez une berline de représentation pour vos déplacements commerciaux.",
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
    description: "Créez votre site internet. Visibilité accrue, clients en ligne.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 3 },
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 1 },
    ],
    clientParTour: "particulier",
  },
  {
    type: "decision",
    id: "rse",
    titre: "RSE",
    description: "Investissez dans votre responsabilité sociale et environnementale.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 1 },
      { poste: "emprunts", delta: 1 },
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 1 },
    ],
    clientParTour: "particulier",
  },
  {
    type: "decision",
    id: "recherche-developpement",
    titre: "Recherche & Développement",
    description: "Investissez en R&D pour développer de nouveaux produits innovants.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5 },
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 2 },
    ],
    clientParTour: "tpe",
  },
  {
    type: "decision",
    id: "expansion",
    titre: "Expansion",
    description: "Agrandissez vos locaux pour accueillir davantage de grands clients.",
    categorie: "investissement",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 6 },
    ],
    effetsRecurrents: [
      { poste: "servicesExterieurs", delta: 3 },
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
    description: "Soldez intégralement votre emprunt. Coût : frais de dossier (Services ext. +1, Tréso −1) PLUS le capital restant dû (Tréso − emprunts, Emprunts → 0). Économisez les intérêts futurs.",
    categorie: "financement",
    effetsImmédiats: [
      { poste: "servicesExterieurs", delta: 1 },
      { poste: "tresorerie", delta: -1 },
      // Le capital restant dû est également débité de la trésorerie et soldé en emprunts → voir logique dans engine.ts
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
    clientParTour: "particulier", // +2 si activée
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

  // ── PROTECTION ────────────────────────────────────────────

  {
    type: "decision",
    id: "assurance-prevoyance",
    titre: "Assurance Prévoyance",
    description: "Souscrivez une assurance. Annule les effets des événements négatifs.",
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
];
