"use strict";
// ============================================================
// JEDEVIENSPATRON — Données des 4 entreprises
// Source : JEDEVIENSPATRON_v2.html — Pierre Médan
//
// ── Bilans initiaux équilibrés (Actif = Passif) ─────────────
// Tâche 25 (2026-04-18) : +2 000 € de capital ET +2 000 € de trésorerie
// pour les 4 entreprises. Motif : le designer lui-même fait faillite au T6
// du jeu actuel. Le coussin de démarrage supplémentaire permet d'absorber
// la charge fixe du T1 sans forcer l'emprunt immédiat.
//   • Manufacture Belvaux : Actif = Passif = 30
//       Immos (8+8) + Stocks 4 + Tréso 10 = 30
//       Capitaux 22 + Emprunts 8 = 30
//   • Véloce Transports   : Actif = Passif = 30
//       Immos (10+6) + Stocks 4 + Tréso 10 = 30
//       Capitaux 22 + Emprunts 8 = 30
//   • Azura Commerce      : Actif = Passif = 30
//       Immos (8+8) + Stocks 4 + Tréso 10 = 30
//       Capitaux 22 + Emprunts 8 = 30
//   • Synergia Lab        : Actif = Passif = 27
//       Immos (8+5) + Stocks 4 + Tréso 10 = 27
//       Capitaux 19 + Emprunts 8 = 27
//
// ── Logique d'amortissement (PCG) ──────────────────────────
// Chaque bien immobilisé perd -1 par trimestre (durée de vie = valeur initiale).
// Dotation aux amortissements = somme des amortissements de chaque bien.
// Durées de vie indicatives (en trimestres de jeu) :
//   • Entrepôt (bâtiment industriel)         : 8T  ≈ 2 ans
//   • Machine de production (outil Belvaux)  : 8T  ≈ 2 ans  (ex-Camionnette, B8-C)
//   • Camion (poids lourd Véloce)            : 10T ≈ 2,5 ans
//   • Machine (manutention Véloce)           : 6T  ≈ 1,5 an
//   • Showroom (agencement commercial)       : 8T  ≈ 2 ans
//   • Voiture (démonstration Azura)          : 8T  ≈ 2 ans
//   • Brevet (propriété intellectuelle)      : 8T  ≈ 2 ans (simplifié)
//   • Matériel informatique                  : 5T  ≈ 1,25 an (simplifié)
// L'item "Autres Immobilisations" démarre à 0 — il reçoit les investissements
// achetés via les Cartes Décision et commence alors à s'amortir.
//
// ── Modèle de valeur (B8-C) ────────────────────────────────
// Chaque entreprise déclare un `modeleValeur` qui pilote la comptabilisation
// de la vente dans appliquerCarteClient (acte 3 et acte 4) :
//   • Belvaux  (production) : stocks − / productionStockee −
//   • Véloce   (service)    : servicesExterieurs + / dettes +
//   • Azura    (négoce)     : stocks − / achats +
//   • Synergia (service)    : servicesExterieurs + / dettes +
// Les libellés pédagogiques (ceQueJeVends / dOuVientLaValeur / goulotPrincipal)
// alimentent CompanyIntro (B8-E).
//
// ── Demande passive (B8-C) ─────────────────────────────────
// `clientsPassifsParTour` modélise la demande récurrente hors commerciaux :
// trafic boutique/web, livraisons de proximité, abonnements individuels.
// Volontairement modeste (1 Particulier/tour = 2 000 € brut) pour ne pas
// dévaloriser le recrutement de commerciaux.
//   • Belvaux  : aucun flux passif (la production ne se vend pas toute seule)
//   • Véloce   : 1 Particulier/tour — Livraisons courtes récurrentes
//   • Azura    : 1 Particulier/tour — Trafic boutique et web
//                (migration propre de clientGratuitParTour → clientsPassifsParTour)
//   • Synergia : 1 Particulier/tour — Abonnements individuels
// Les anciennes saves avec `clientGratuitParTour: true` restent compatibles :
// `genererClientsSpecialite` cumule les deux sources.
//
// ── Financement ─────────────────────────────────────────────
// Emprunts = 8 pour toutes les entreprises (remboursement -500/tour)
// Capitaux propres ajustés pour équilibrer chaque bilan (22 ou 19).
// Depuis Tâche 25 : capitaux +2 000 € en contrepartie de la trésorerie +2 000 €.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTREPRISE_INDEX = exports.ENTREPRISES = void 0;
const cartes_1 = require("./cartes");
function carte(id) {
    const c = cartes_1.CARTES_LOGISTIQUES.find((c) => c.id === id);
    if (!c)
        throw new Error(`[entreprises.ts] Carte logistique introuvable : "${id}"`);
    return c;
}
exports.ENTREPRISES = [
    {
        nom: "Manufacture Belvaux",
        couleur: "#e8751a",
        icon: "🏭",
        type: "Production",
        secteurActivite: "production",
        specialite: "⚡ Produit à chaque tour",
        // Spécialité active : +1 000 € productionStockée, +1 000 € stocks par trimestre
        effetsPassifs: [
            { poste: "productionStockee", delta: 1000 },
            { poste: "stocks", delta: 1000 },
        ],
        // B8-C — Modèle de valeur : producteur industriel
        modeleValeur: {
            mode: "production",
            ceQueJeVends: "Des pièces métalliques fabriquées à la commande",
            dOuVientLaValeur: "La transformation de matières premières en produits finis à l'atelier",
            goulotPrincipal: "Capacité de production et stock de produits finis",
            coutVariable: 1000,
            libelleExecution: "Produit fini livré au client",
            libelleContrepartie: "Déstockage du produit fini (baisse de production stockée)",
        },
        actifs: [
            // IMMOBILISATIONS
            // Entrepôt : bâtiment industriel → vie 8T (≈ 2 ans)
            { nom: "Entrepôt", valeur: 8000 },
            // Machine de production : outil industriel cœur du métier → vie 8T
            // (renommée depuis "Camionnette" en B8-C — une camionnette utilitaire
            //  n'avait pas de sens comptable pour un pur producteur)
            { nom: "Machine de production", valeur: 8000 },
            // Autres : réservé aux investissements via Cartes Décision
            { nom: "Autres Immobilisations", valeur: 0 },
            // STOCKS — B9-C (2026-04-24) : renommé "Stocks matières premières" (PCG classe 31)
            // pour rendre visible que Belvaux transforme de la matière en production stockée.
            { nom: "Stocks matières premières", valeur: 4000 },
            // B9-D (2026-04-24) : ligne dédiée aux produits finis (PCG classe 35).
            // Initialisée à 0 — se remplit à l'étape 3 (Réalisation métier) quand Belvaux
            // consomme de la matière première pour produire. Se vide à l'étape 4 (Facturation)
            // quand les produits finis sont vendus.
            { nom: "Stocks produits finis", valeur: 0 },
            // TRÉSORERIE — +2 000 € depuis Tâche 25 (coussin de démarrage)
            { nom: "Trésorerie", valeur: 10000 },
        ],
        passifs: [
            // CAPITAUX PROPRES — 22 pour équilibrer : Immos 16 + Stocks 4 + Tréso 10 = 30
            { nom: "Capitaux propres", valeur: 22000 },
            // EMPRUNTS — remboursement -500/trimestre
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
        // B9-A (2026-04-24) : split du mode "service" en "logistique" pour
        // permettre des écritures divergentes de Synergia en B9-D/E.
        secteurActivite: "logistique",
        specialite: "🚀 Livraison rapide",
        reducDelaiPaiement: true, // Spécialité : délai d'encaissement réduit de 1 (TPE → immédiat, Grand Compte → C+1)
        // B8-C — Modèle de valeur : prestataire de transport (mode "logistique" depuis B9-A)
        modeleValeur: {
            mode: "logistique",
            ceQueJeVends: "Des prestations de transport et de livraison",
            dOuVientLaValeur: "Le temps de conduite, le carburant et le tri des colis",
            goulotPrincipal: "Capacité de la flotte et disponibilité des chauffeurs",
            coutVariable: 1000,
            libelleExecution: "Carburant et sous-traitance mobilisés pour la course",
            libelleContrepartie: "Facture transporteur / carburant à régler au prochain trimestre",
        },
        // B8-C — Demande passive : flux récurrent de livraisons courtes
        clientsPassifsParTour: [
            { typeClient: "particulier", nbParTour: 1, source: "Livraisons courtes récurrentes" },
        ],
        actifs: [
            // IMMOBILISATIONS
            // Camion : poids lourd → vie 10T (≈ 2,5 ans)
            { nom: "Camion", valeur: 10000 },
            // Machine : équipement de manutention → vie 6T (≈ 1,5 an)
            { nom: "Machine", valeur: 6000 },
            // Autres : réservé aux investissements
            { nom: "Autres Immobilisations", valeur: 0 },
            // STOCKS — buffer de consommables (carburant, petites pièces). En mode
            // logistique, ce poste n'est pas consommé par le cycle de vente (coût
            // variable = servicesExterieurs/dettes).
            { nom: "Stocks", valeur: 4000 },
            // B9-D (2026-04-24) : ligne "Stocks en-cours de production" (PCG classe 34)
            // pour matérialiser la valeur de la tournée en cours d'exécution.
            // Initialisée à 0 — se remplit à l'étape 3, s'extourne à l'étape 4 avant facturation.
            { nom: "Stocks en-cours de production", valeur: 0 },
            // TRÉSORERIE — +2 000 € depuis Tâche 25 (coussin de démarrage)
            { nom: "Trésorerie", valeur: 10000 },
        ],
        passifs: [
            // CAPITAUX PROPRES — 22 pour équilibrer : Immos 16 + Stocks 4 + Tréso 10 = 30
            { nom: "Capitaux propres", valeur: 22000 },
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
        secteurActivite: "negoce",
        specialite: "👥 Attire les particuliers",
        // B8-C — Modèle de valeur : négoce classique
        modeleValeur: {
            mode: "negoce",
            ceQueJeVends: "Des marchandises revendues en boutique et en ligne",
            dOuVientLaValeur: "L'écart entre le prix d'achat fournisseur et le prix de vente",
            goulotPrincipal: "Réassort des stocks et rotation du linéaire",
            coutVariable: 1000,
            libelleExecution: "Marchandise livrée au client",
            libelleContrepartie: "Coût de la marchandise vendue (CMV) enregistré en charges",
        },
        // B8-C — Demande passive : trafic boutique & web.
        // Migration propre de `clientGratuitParTour` vers le mécanisme unifié.
        // Les anciennes parties sauvegardées avec `clientGratuitParTour: true`
        // restent compatibles : `genererClientsSpecialite` cumule les deux sources.
        clientsPassifsParTour: [
            { typeClient: "particulier", nbParTour: 1, source: "Trafic boutique et web" },
        ],
        actifs: [
            // IMMOBILISATIONS
            // Showroom : agencement commercial → vie 8T (≈ 2 ans)
            { nom: "Showroom", valeur: 8000 },
            // Voiture de démonstration → vie 8T (≈ 2 ans)
            { nom: "Voiture", valeur: 8000 },
            // Autres : réservé aux investissements
            { nom: "Autres Immobilisations", valeur: 0 },
            // STOCKS — B9-C (2026-04-24) : renommé "Stocks marchandises" (PCG classe 37)
            // pour rendre visible qu'Azura achète et revend des marchandises finies sans transformation.
            { nom: "Stocks marchandises", valeur: 4000 },
            // TRÉSORERIE — +2 000 € depuis Tâche 25 (coussin de démarrage)
            { nom: "Trésorerie", valeur: 10000 },
        ],
        passifs: [
            // CAPITAUX PROPRES — 22 pour équilibrer : Immos 16 + Stocks 4 + Tréso 10 = 30
            { nom: "Capitaux propres", valeur: 22000 },
            { nom: "Emprunts", valeur: 8000 },
            { nom: "Dettes fournisseurs", valeur: 0 },
        ],
        cartesLogistiquesDepart: [
            carte("azura-marketplace-n1"), // actif dès T1 — capacité 4→8
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
        // B9-A (2026-04-24) : split du mode "service" en "conseil" pour
        // distinguer le métier missions+licences de Synergia de la logistique de Véloce.
        secteurActivite: "conseil",
        specialite: "💎 Revenus de licence",
        // Spécialité active : +1 000 € produitsFinanciers, +1 000 € trésorerie par trimestre
        effetsPassifs: [
            { poste: "produitsFinanciers", delta: 1000 },
            { poste: "tresorerie", delta: 1000 },
        ],
        // B8-C — Modèle de valeur : prestataire missions + licences (mode "conseil" depuis B9-A)
        modeleValeur: {
            mode: "conseil",
            ceQueJeVends: "Des missions de conseil et des licences logicielles",
            dOuVientLaValeur: "Le savoir-faire de l'équipe et la propriété intellectuelle (brevets)",
            goulotPrincipal: "Disponibilité des ingénieurs et qualité du portefeuille de brevets",
            coutVariable: 1000,
            libelleExecution: "Temps ingénieur et infrastructure cloud mobilisés pour la mission",
            libelleContrepartie: "Facture sous-traitance / cloud à régler au prochain trimestre",
        },
        // B8-C — Demande passive : abonnements individuels (particuliers payants)
        clientsPassifsParTour: [
            { typeClient: "particulier", nbParTour: 1, source: "Abonnements individuels" },
        ],
        actifs: [
            // IMMOBILISATIONS
            // Brevet : propriété intellectuelle → vie 8T (≈ 2 ans simplifié)
            { nom: "Brevet", valeur: 8000 },
            // Matériel informatique → vie 5T (≈ 1,25 an simplifié)
            { nom: "Matériel informatique", valeur: 5000 },
            // Autres : réservé aux investissements
            { nom: "Autres Immobilisations", valeur: 0 },
            // STOCKS — buffer de consommables. En mode conseil, ce poste n'est
            // pas consommé par le cycle de vente (coût variable = servicesExterieurs/dettes).
            { nom: "Stocks", valeur: 4000 },
            // B9-D (2026-04-24) : ligne "Stocks en-cours de production" (PCG classe 34)
            // pour matérialiser la valeur de la mission en cours d'exécution.
            // Initialisée à 0 — se remplit à l'étape 3, s'extourne à l'étape 4 avant facturation.
            { nom: "Stocks en-cours de production", valeur: 0 },
            // TRÉSORERIE — +2 000 € depuis Tâche 25 (coussin de démarrage)
            { nom: "Trésorerie", valeur: 10000 },
        ],
        passifs: [
            // CAPITAUX PROPRES — 19 pour équilibrer : Immos 13 + Stocks 4 + Tréso 10 = 27
            { nom: "Capitaux propres", valeur: 19000 },
            { nom: "Emprunts", valeur: 8000 },
            { nom: "Dettes fournisseurs", valeur: 0 },
        ],
        cartesLogistiquesDepart: [
            carte("synergia-erp-n1"), // actif dès T1 — capacité 4→8
        ],
        cartesLogistiquesDisponibles: [
            carte("synergia-erp-n2"),
            carte("synergia-partenariat"),
        ],
    },
];
/** Mapping nom → index pour accès rapide */
exports.ENTREPRISE_INDEX = Object.fromEntries(exports.ENTREPRISES.map((e, i) => [e.nom, i]));
//# sourceMappingURL=entreprises.js.map