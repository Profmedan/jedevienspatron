// ============================================================
// KICLEPATRON — Données des 4 entreprises
// Source : KICLEPATRON_v2.html — Pierre Médan
//
// Bilan initial équilibré : Actif = Passif = 20
//
// ── Logique d'amortissement (PCG) ──────────────────────────
// Chaque bien immobilisé perd -1 par trimestre (durée de vie = valeur initiale).
// Dotation aux amortissements = somme des amortissements de chaque bien.
// Durées de vie indicatives (en trimestres de jeu) :
//   • Matériel de production / Usine     : 6T  ≈ 3 ans simplifiés
//   • Machine logistique                 : 6T
//   • Véhicule utilitaire / Camionnette  : 2T  ≈ cycle court, renouvellement fréquent
//   • Agencement commercial (Showroom)   : 5T  ≈ 2,5 ans
//   • Brevet / Propriété intellectuelle  : 5T  ≈ 5 ans (droit fiscal)
//   • Matériel informatique              : 3T  ≈ 3 ans (taux PC)
//   • Voiture de démonstration           : 3T
// L'item "Autres Immobilisations" démarre à 0 — il reçoit les investissements
// achetés via les Cartes Décision et commence alors à s'amortir.
//
// ── Financement ─────────────────────────────────────────────
// Emprunts = 8 (remboursement -1/tour pendant 8 tours = fin de jeu)
// Capitaux propres = 12
// Total passif = 20 = Total actif ✓
// ============================================================

import { EntrepriseTemplate } from "@/lib/game-engine/types";

export const ENTREPRISES: EntrepriseTemplate[] = [
  {
    nom: "Entreprise Orange",
    couleur: "#e8751a",
    icon: "🏭",
    type: "Production",
    specialite: "⚡ Produit à chaque tour",
    actifs: [
      // IMMOBILISATIONS
      // Usine : matériel industriel → vie 6T (≈ 3 ans simplifiés, taux 33 %/an)
      { nom: "Usine", valeur: 6 },
      // Camionnette : véhicule utilitaire → vie 2T (cycle court)
      { nom: "Camionnette", valeur: 2 },
      // Autres : réservé aux investissements via Cartes Décision
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8 },
    ],
    passifs: [
      // CAPITAUX PROPRES
      { nom: "Capitaux propres", valeur: 12 },
      // EMPRUNTS — remboursement -1/trimestre pendant 8 trimestres
      { nom: "Emprunts", valeur: 8 },
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
      // Camion : poids lourd → vie 6T (durée élevée pour logistique)
      { nom: "Camion", valeur: 6 },
      // Machine : équipement de manutention → vie 2T (usure intensive)
      { nom: "Machine", valeur: 2 },
      // Autres : réservé aux investissements
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8 },
    ],
    passifs: [
      { nom: "Capitaux propres", valeur: 12 },
      { nom: "Emprunts", valeur: 8 },
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
      // Showroom : agencement commercial → vie 5T (5-10 ans PCG, ici simplifié)
      { nom: "Showroom", valeur: 5 },
      // Voiture de démonstration → vie 3T (usage intensif, dépréciation rapide)
      { nom: "Voiture", valeur: 3 },
      // Autres : réservé aux investissements
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8 },
    ],
    passifs: [
      { nom: "Capitaux propres", valeur: 12 },
      { nom: "Emprunts", valeur: 8 },
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
      // Brevet : propriété intellectuelle → vie 5T (amortissement sur 5 ans, art. 39 CGI)
      { nom: "Brevet", valeur: 5 },
      // Matériel informatique → vie 3T (durée fiscale standard 3 ans)
      { nom: "Matériel informatique", valeur: 3 },
      // Autres : réservé aux investissements
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8 },
    ],
    passifs: [
      { nom: "Capitaux propres", valeur: 12 },
      { nom: "Emprunts", valeur: 8 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
  },
];

/** Mapping nom → index pour accès rapide */
export const ENTREPRISE_INDEX: Record<string, number> = Object.fromEntries(
  ENTREPRISES.map((e, i) => [e.nom, i])
);
