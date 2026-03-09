"use strict";
// ============================================================
// KICLEPATRON — Données des 4 entreprises
// Source : KICLEPATRON_v2.html — Pierre Médan
// Bilan initial toujours équilibré : Actif = Passif = 16
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTREPRISE_INDEX = exports.ENTREPRISES = void 0;
exports.ENTREPRISES = [
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
exports.ENTREPRISE_INDEX = Object.fromEntries(exports.ENTREPRISES.map((e, i) => [e.nom, i]));
//# sourceMappingURL=entreprises.js.map