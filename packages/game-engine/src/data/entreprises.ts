// ============================================================
// JEDEVIENSPATRON — Données des 4 entreprises
// Source : JEDEVIENSPATRON_v2.html — Pierre Médan
//
// ── Bilans initiaux équilibrés (Actif = Passif) ─────────────
//   • Manufacture Belvaux : Actif = Passif = 28
//       Immos (8+8) + Stocks 4 + Tréso 8 = 28
//       Capitaux 20 + Emprunts 8 = 28
//   • Véloce Transports   : Actif = Passif = 28
//       Immos (10+6) + Stocks 4 + Tréso 8 = 28
//       Capitaux 20 + Emprunts 8 = 28
//   • Azura Commerce      : Actif = Passif = 28
//       Immos (8+8) + Stocks 4 + Tréso 8 = 28
//       Capitaux 20 + Emprunts 8 = 28
//   • Synergia Lab        : Actif = Passif = 25
//       Immos (8+5) + Stocks 4 + Tréso 8 = 25
//       Capitaux 17 + Emprunts 8 = 25
//
// ── Logique d'amortissement (PCG) ──────────────────────────
// Chaque bien immobilisé perd -1 par trimestre (durée de vie = valeur initiale).
// Dotation aux amortissements = somme des amortissements de chaque bien.
// Durées de vie indicatives (en trimestres de jeu) :
//   • Entrepôt (machine industrielle)       : 8T  ≈ 2 ans
//   • Camionnette (véhicule utilitaire)  : 8T  ≈ 2 ans
//   • Camion (poids lourd)               : 10T ≈ 2,5 ans
//   • Machine (manutention)              : 6T  ≈ 1,5 an
//   • Showroom (agencement commercial)   : 8T  ≈ 2 ans
//   • Voiture (démonstration)            : 8T  ≈ 2 ans
//   • Brevet (propriété intellectuelle)  : 8T  ≈ 2 ans (simplifié)
//   • Matériel informatique              : 5T  ≈ 1,25 an (simplifié)
// L'item "Autres Immobilisations" démarre à 0 — il reçoit les investissements
// achetés via les Cartes Décision et commence alors à s'amortir.
//
// ── Financement ─────────────────────────────────────────────
// Emprunts = 8 pour toutes les entreprises (remboursement -1/tour × 8 tours)
// Capitaux propres ajustés pour équilibrer chaque bilan (20 ou 17)
// ============================================================

import { EntrepriseTemplate, EffetCarte } from "../types";

export const ENTREPRISES: EntrepriseTemplate[] = [
  {
    nom: "Manufacture Belvaux",
    couleur: "#e8751a",
    icon: "🏭",
    type: "Production",
    specialite: "⚡ Produit à chaque tour",
    // Spécialité active : +1 productionStockée, +1 stocks par trimestre
    effetsPassifs: [
      { poste: "productionStockee", delta: 1 },
      { poste: "stocks", delta: 1 },
    ],
    actifs: [
      // IMMOBILISATIONS
      // Entrepôt : matériel industriel → vie 8T (≈ 2 ans)
      { nom: "Entrepôt", valeur: 8000 },
      // Camionnette : véhicule utilitaire → vie 8T (≈ 2 ans)
      { nom: "Camionnette", valeur: 8000 },
      // Autres : réservé aux investissements via Cartes Décision
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4000 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8000 },
    ],
    passifs: [
      // CAPITAUX PROPRES — 20 pour équilibrer : Immos 16 + Stocks 4 + Tréso 8 = 28
      { nom: "Capitaux propres", valeur: 20000 },
      // EMPRUNTS — remboursement -1/trimestre pendant 8 trimestres
      { nom: "Emprunts", valeur: 8000 },
      // DETTES FOURNISSEURS
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
  },

  {
    nom: "Véloce Transports",
    couleur: "#7b2d8b",
    icon: "🚚",
    type: "Logistique",
    specialite: "🚀 Livraison rapide",
    // Spécialité active : délai d'encaissement réduit de 1 sur tous les clients
    // (TPE → immédiat, Grand Compte → C+1 au lieu de C+2)
    // Géré dans appliquerCarteClient() via le nom d'entreprise
    actifs: [
      // IMMOBILISATIONS
      // Camion : poids lourd → vie 10T (≈ 2,5 ans)
      { nom: "Camion", valeur: 10000 },
      // Machine : équipement de manutention → vie 6T (≈ 1,5 an)
      { nom: "Machine", valeur: 6000 },
      // Autres : réservé aux investissements
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4000 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8000 },
    ],
    passifs: [
      // CAPITAUX PROPRES — 20 pour équilibrer : Immos 16 + Stocks 4 + Tréso 8 = 28
      { nom: "Capitaux propres", valeur: 20000 },
      { nom: "Emprunts", valeur: 8000 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
  },

  {
    nom: "Azura Commerce",
    couleur: "#1565c0",
    icon: "🏪",
    type: "Commerce",
    specialite: "👥 Attire les particuliers",
    // Spécialité active : +1 client Particulier automatique par tour
    // Géré dans appliquerSpecialiteEntreprise() via le nom d'entreprise
    actifs: [
      // IMMOBILISATIONS
      // Showroom : agencement commercial → vie 8T (≈ 2 ans)
      { nom: "Showroom", valeur: 8000 },
      // Voiture de démonstration → vie 8T (≈ 2 ans)
      { nom: "Voiture", valeur: 8000 },
      // Autres : réservé aux investissements
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4000 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8000 },
    ],
    passifs: [
      // CAPITAUX PROPRES — 20 pour équilibrer : Immos 16 + Stocks 4 + Tréso 8 = 28
      { nom: "Capitaux propres", valeur: 20000 },
      { nom: "Emprunts", valeur: 8000 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
  },

  {
    nom: "Synergia Lab",
    couleur: "#2e7d32",
    icon: "💡",
    type: "Innovation",
    specialite: "💎 Revenus de licence",
    // Spécialité active : +1 produitsFinanciers, +1 trésorerie par trimestre
    effetsPassifs: [
      { poste: "produitsFinanciers", delta: 1 },
      { poste: "tresorerie", delta: 1 },
    ],
    actifs: [
      // IMMOBILISATIONS
      // Brevet : propriété intellectuelle → vie 8T (≈ 2 ans simplifié)
      { nom: "Brevet", valeur: 8000 },
      // Matériel informatique → vie 5T (≈ 1,25 an simplifié)
      { nom: "Matériel informatique", valeur: 5000 },
      // Autres : réservé aux investissements
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS
      { nom: "Stocks", valeur: 4000 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8000 },
    ],
    passifs: [
      // CAPITAUX PROPRES — 17 pour équilibrer : Immos 13 + Stocks 4 + Tréso 8 = 25
      { nom: "Capitaux propres", valeur: 17000 },
      { nom: "Emprunts", valeur: 8000 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
  },
];

/** Mapping nom → index pour accès rapide */
export const ENTREPRISE_INDEX: Record<string, number> = Object.fromEntries(
  ENTREPRISES.map((e, i) => [e.nom, i])
);
