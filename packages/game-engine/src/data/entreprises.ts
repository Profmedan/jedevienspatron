// ============================================================
// JEDEVIENSPATRON — Données des 4 entreprises
// Source : JEDEVIENSPATRON_v2.html — Pierre Médan
// Bilan initial toujours équilibré : Actif = Passif = 16
// ============================================================

import { EntrepriseTemplate } from "../types";

export const ENTREPRISES: EntrepriseTemplate[] = [
  {
    nom: "Entreprise Orange",
    couleur: "#e8751a",
    icon: "🏭",
    type: "Production",
    specialite: "⚡ Produit à chaque tour",
    actifs: [
      // IMMOBILISATIONS
      { nom: "Usine", valeur: 3 },
      { nom: "Camionnette", valeur: 1 },
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8 },
    ],
    passifs: [
      // CAPITAUX PROPRES
      { nom: "Capitaux propres", valeur: 12 },
      // EMPRUNTS
      { nom: "Emprunts", valeur: 4 },
      // DETTES FOURNISSEURS
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
  },

  {
    nom: "Entreprise Violette",
    couleur: "#7b2d8b",
    icon: "🚚",
    type: "Logistique",
    specialite: "🚀 Livraison rapide",
    actifs: [
      // IMMOBILISATIONS
      { nom: "Camion", valeur: 1 },
      { nom: "Machine", valeur: 3 },
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8 },
    ],
    passifs: [
      { nom: "Capitaux propres", valeur: 12 },
      { nom: "Emprunts", valeur: 4 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
  },

  {
    nom: "Entreprise Bleue",
    couleur: "#1565c0",
    icon: "🏪",
    type: "Commerce",
    specialite: "👥 Attire les particuliers",
    actifs: [
      // IMMOBILISATIONS
      { nom: "Showroom", valeur: 2 },
      { nom: "Voiture", valeur: 2 },
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8 },
    ],
    passifs: [
      { nom: "Capitaux propres", valeur: 12 },
      { nom: "Emprunts", valeur: 4 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
  },

  {
    nom: "Entreprise Verte",
    couleur: "#2e7d32",
    icon: "💡",
    type: "Innovation",
    specialite: "💎 Revenus de licence",
    actifs: [
      // IMMOBILISATIONS
      { nom: "Brevet", valeur: 1 },
      { nom: "Voiture", valeur: 3 },
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8 },
    ],
    passifs: [
      { nom: "Capitaux propres", valeur: 12 },
      { nom: "Emprunts", valeur: 4 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
  },
];

/** Mapping nom → index pour accès rapide */
export const ENTREPRISE_INDEX: Record<string, number> = Object.fromEntries(
  ENTREPRISES.map((e, i) => [e.nom, i])
);
