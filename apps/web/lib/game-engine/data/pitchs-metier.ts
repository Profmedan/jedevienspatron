// ═════════════════════════════════════════════════════════════════════════════
// B9-G — Pitchs métier par entreprise
// ═════════════════════════════════════════════════════════════════════════════
// Description narrative de chaque entreprise utilisée par SetupScreen
// (choix d'entreprise) et CompanyIntro (introduction au cycle).
// Pour chaque entreprise :
//   - `offre`        : ce que l'entreprise vend concrètement
//   - `sourceValeur` : comment la valeur est créée dans le métier
//   - `goulot`       : le point d'attention critique pour l'apprenant
//   - `cycleType`    : le fil rouge des étapes 2/3/4 dans le jeu
//   - `couleurAccent` : teinte CSS pour habiller le bloc pitch
// ═════════════════════════════════════════════════════════════════════════════

import type { ModeEconomique } from "@jedevienspatron/game-engine";

export interface PitchMetier {
  modele: string;
  offre: string;
  sourceValeur: string;
  goulot: string;
  cycleType: string;
  couleurAccent: string;
}

/**
 * Pitchs narratifs des 4 entreprises canoniques, indexés par `modeEconomique`.
 * Les templates custom tombent sur "négoce" par défaut via `creerJoueur`.
 */
export const PITCHS_METIER: Record<ModeEconomique, PitchMetier> = {
  production: {
    modele: "Production industrielle",
    offre: "Produits fabriqués à partir de matière première dans un atelier.",
    sourceValeur: "Transformation : la matière première (M) + les heures atelier deviennent un produit fini (V) vendu à un prix supérieur. La marge brute = prix de vente − coût de production.",
    goulot: "Bien dimensionner ton stock de matière première ET ton stock de produits finis. Trop peu de matière = production bloquée. Trop de produits finis non vendus = trésorerie immobilisée.",
    cycleType: "Achat matière (2) → Production : consommation matière + production stockée (3) → Vente avec extourne (4).",
    couleurAccent: "#e8751a",
  },
  "négoce": {
    modele: "Négoce / Revente",
    offre: "Marchandises achetées chez des fournisseurs puis revendues aux clients.",
    sourceValeur: "Marge commerciale : tu achètes à un prix, tu revends plus cher. La valeur vient de la sélection, de la mise en avant et du service client — pas d'une transformation physique.",
    goulot: "Rotation du stock + coût de canal fixe (animation, plateforme, PLV). Un stock qui ne tourne pas est de l'argent bloqué. Un canal mal animé = pas de visibilité, pas de vente.",
    cycleType: "Réassort marchandises (2) → Coût de canal 300 € fixe (3) → Vente avec CMV classique (4).",
    couleurAccent: "#1565c0",
  },
  logistique: {
    modele: "Prestation de services logistiques",
    offre: "Tournées de transport et de livraison facturées à la course ou au forfait.",
    sourceValeur: "Heures chauffeur + flotte valorisées en prestation. Pas de stock à revendre — la valeur se crée dans l'exécution de la tournée, puis se concrétise à la facturation.",
    goulot: "Bien préparer (carburant, péages, sous-traitance) avant d'exécuter. L'en-cours de tournée ne rapporte rien tant qu'il n'est pas facturé : attention à ne pas laisser s'accumuler des prestations non facturées.",
    cycleType: "Préparation tournée (2) → Exécution + en-cours de production (3) → Facturation avec extourne en-cours (4).",
    couleurAccent: "#7b2d8b",
  },
  conseil: {
    modele: "Conseil + licences logicielles",
    offre: "Missions d'expertise facturées au forfait + revenus récurrents de licences logicielles.",
    sourceValeur: "Temps expert valorisé sur des missions à forte valeur ajoutée + flux passif des licences qui tombe chaque trimestre indépendamment de l'activité de conseil.",
    goulot: "Staffing rigoureux des experts sur les missions + monétisation des licences. Trop peu de missions = consultants sous-employés. Trop de missions simultanées = qualité qui baisse et délais qui explosent.",
    cycleType: "Staffing / cadrage (2) → Réalisation mission + en-cours (3) → Facturation avec extourne en-cours (4). Licences versées automatiquement en clôture (7).",
    couleurAccent: "#2e7d32",
  },
};

/**
 * Helper : retourne le pitch adapté, avec fallback "négoce" sécurisé pour
 * les entreprises custom créées par un formateur sans `modeEconomique`
 * explicite (cf. `creerJoueur` qui fait le même fallback côté moteur).
 */
export function getPitchMetier(mode: ModeEconomique | undefined): PitchMetier {
  return PITCHS_METIER[mode ?? "négoce"] ?? PITCHS_METIER["négoce"];
}
