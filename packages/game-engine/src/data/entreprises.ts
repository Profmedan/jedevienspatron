// ============================================================
// JEDEVIENSPATRON — Données des 4 entreprises
// Source : JEDEVIENSPATRON_v2.html — Pierre Médan
//
// ── Bilans initiaux équilibrés (Actif = Passif) — B9-D ──────
//   • Manufacture Belvaux : Actif = Passif = 28
//       Immos (8+8) + Produits finis 3 + Matière 1 + Tréso 8 = 28
//       Capitaux 20 + Emprunts 8 = 28
//   • Véloce Transports   : Actif = Passif = 28
//       Immos (10+6) + Stocks 4 + En-cours 0 + Tréso 8 = 28
//       Capitaux 20 + Emprunts 8 = 28
//   • Azura Commerce      : Actif = Passif = 28
//       Immos (8+8) + Marchandises 4 + Tréso 8 = 28
//       Capitaux 20 + Emprunts 8 = 28
//   • Synergia Lab        : Actif = Passif = 25
//       Immos (8+5) + Stocks 4 + En-cours 0 + Tréso 8 = 25
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

import { EntrepriseTemplate, EffetCarte, CarteDecision } from "../types";
import { CARTES_LOGISTIQUES } from "./cartes";

function carte(id: string): CarteDecision {
  const c = CARTES_LOGISTIQUES.find((c) => c.id === id);
  if (!c) throw new Error(`[entreprises.ts] Carte logistique introuvable : "${id}"`);
  return c;
}

export const ENTREPRISES: EntrepriseTemplate[] = [
  {
    nom: "Manufacture Belvaux",
    couleur: "#e8751a",
    icon: "🏭",
    type: "Production",
    modeEconomique: "production",
    specialite: "⚡ Produit à chaque tour",
    // Spécialité active : +1 000 € productionStockée, +1 000 € stocks par trimestre
    effetsPassifs: [
      { poste: "productionStockee", delta: 1000 },
      { poste: "stocks", delta: 1000 },
    ],
    actifs: [
      // IMMOBILISATIONS
      // Entrepôt : matériel industriel → vie 8T (≈ 2 ans)
      { nom: "Entrepôt", valeur: 8000 },
      // Camionnette : véhicule utilitaire → vie 8T (≈ 2 ans)
      { nom: "Camionnette", valeur: 8000 },
      // Autres : réservé aux investissements via Cartes Décision
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS — B9-D : discrimination par nom. Produits finis EN PREMIER
      // pour que `appliquerCarteClient` (étape 4) déstocke les bons à la
      // vente via `push("stocks", -X)` (qui prend le premier actif de
      // catégorie "stocks"). Matière première EN DEUXIÈME, ciblée par
      // nom via `pushByName` à l'étape 2 (achat) et 3 (consommation).
      { nom: "Produits finis Belvaux", valeur: 3000 },   // 3 unités prêtes à vendre au T1
      { nom: "Matière première Belvaux", valeur: 1000 }, // 1 unité de matière au T1
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
    cartesLogistiquesDepart: [],
    cartesLogistiquesDisponibles: [
      carte("belvaux-robot-n1"),
      carte("belvaux-robot-n2"),
      carte("belvaux-entrepot"),
    ],
  },

  {
    nom: "Véloce Transports",
    couleur: "#7b2d8b",
    icon: "🚚",
    type: "Logistique",
    modeEconomique: "logistique",
    specialite: "🚀 Livraison rapide",
    reducDelaiPaiement: true, // Spécialité : délai d'encaissement réduit de 1 (TPE → immédiat, Grand Compte → C+1)
    actifs: [
      // IMMOBILISATIONS
      // Camion : poids lourd → vie 10T (≈ 2,5 ans)
      { nom: "Camion", valeur: 10000 },
      // Machine : équipement de manutention → vie 6T (≈ 1,5 an)
      { nom: "Machine", valeur: 6000 },
      // Autres : réservé aux investissements
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS — "Stocks" générique (fournitures, consommables) conservé
      // en première position pour compat V1 avec `appliquerCarteClient`.
      // Le vrai nettoyage "services ne déstockent pas" arrive en B9-E.
      { nom: "Stocks", valeur: 4000 },
      // EN-COURS — B9-D : compte PCG 34 simplifié. Alimenté par
      // `appliquerRealisationVeloce` (étape 3) et extourné par la vente
      // (étape 4, B9-E). En V1 B9-D, l'extourne reste manuelle/déférée.
      { nom: "En-cours tournée Véloce", valeur: 0 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8000 },
    ],
    passifs: [
      // CAPITAUX PROPRES — 20 pour équilibrer : Immos 16 + Stocks 4 + Tréso 8 = 28
      { nom: "Capitaux propres", valeur: 20000 },
      { nom: "Emprunts", valeur: 8000 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
    cartesLogistiquesDepart: [],
    cartesLogistiquesDisponibles: [
      carte("veloce-vehicule-n2"),
      carte("veloce-dispatch-n1"),
      carte("veloce-dispatch-n2"),
    ],
  },

  {
    nom: "Azura Commerce",
    couleur: "#1565c0",
    icon: "🏪",
    type: "Commerce",
    modeEconomique: "négoce",
    specialite: "👥 Attire les particuliers",
    clientGratuitParTour: true, // Spécialité : +1 client Particulier automatique par tour
    actifs: [
      // IMMOBILISATIONS
      // Showroom : agencement commercial → vie 8T (≈ 2 ans)
      { nom: "Showroom", valeur: 8000 },
      // Voiture de démonstration → vie 8T (≈ 2 ans)
      { nom: "Voiture", valeur: 8000 },
      // Autres : réservé aux investissements
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS — B9-D : renommée "Marchandises Azura" (négoce)
      { nom: "Marchandises Azura", valeur: 4000 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8000 },
    ],
    passifs: [
      // CAPITAUX PROPRES — 20 pour équilibrer : Immos 16 + Stocks 4 + Tréso 8 = 28
      { nom: "Capitaux propres", valeur: 20000 },
      { nom: "Emprunts", valeur: 8000 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
    cartesLogistiquesDepart: [
      carte("azura-marketplace-n1"),  // actif dès T1 — capacité 4→8
    ],
    cartesLogistiquesDisponibles: [
      carte("azura-marketplace-n2"),
      carte("azura-soustraitance"),
    ],
  },

  {
    nom: "Synergia Lab",
    couleur: "#2e7d32",
    icon: "💡",
    type: "Innovation",
    modeEconomique: "conseil",
    specialite: "💎 Revenus de licence",
    // Spécialité active : +1 000 € produitsFinanciers, +1 000 € trésorerie par trimestre
    effetsPassifs: [
      { poste: "produitsFinanciers", delta: 1000 },
      { poste: "tresorerie", delta: 1000 },
    ],
    actifs: [
      // IMMOBILISATIONS
      // Brevet : propriété intellectuelle → vie 8T (≈ 2 ans simplifié)
      { nom: "Brevet", valeur: 8000 },
      // Matériel informatique → vie 5T (≈ 1,25 an simplifié)
      { nom: "Matériel informatique", valeur: 5000 },
      // Autres : réservé aux investissements
      { nom: "Autres Immobilisations", valeur: 0 },
      // STOCKS — "Stocks" générique (matériel de support, licences) conservé
      // en première position pour compat V1 avec `appliquerCarteClient`.
      { nom: "Stocks", valeur: 4000 },
      // EN-COURS — B9-D : compte PCG 34 simplifié. Alimenté par
      // `appliquerRealisationSynergia` (étape 3) ; extourne à la
      // facturation déférée en B9-E.
      { nom: "En-cours mission Synergia", valeur: 0 },
      // TRÉSORERIE
      { nom: "Trésorerie", valeur: 8000 },
    ],
    passifs: [
      // CAPITAUX PROPRES — 17 pour équilibrer : Immos 13 + Stocks 4 + Tréso 8 = 25
      { nom: "Capitaux propres", valeur: 17000 },
      { nom: "Emprunts", valeur: 8000 },
      { nom: "Dettes fournisseurs", valeur: 0 },
    ],
    cartesLogistiquesDepart: [
      carte("synergia-erp-n1"),  // actif dès T1 — capacité 4→8
    ],
    cartesLogistiquesDisponibles: [
      carte("synergia-erp-n2"),
      carte("synergia-partenariat"),
    ],
  },
];

/** Mapping nom → index pour accès rapide */
export const ENTREPRISE_INDEX: Record<string, number> = Object.fromEntries(
  ENTREPRISES.map((e, i) => [e.nom, i])
);
