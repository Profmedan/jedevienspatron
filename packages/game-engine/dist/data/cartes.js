"use strict";
// ============================================================
// JEDEVIENSPATRON — Catalogue complet des cartes
// Source : JEDEVIENSPATRON_v2.html — Pierre Médan
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARTES_LOGISTIQUES = exports.CARTES_EVENEMENTS = exports.CARTES_DECISION = exports.CARTES_CLIENTS = exports.CARTES_COMMERCIAUX = void 0;
// ─── CARTES COMMERCIAUX ─────────────────────────────────────
exports.CARTES_COMMERCIAUX = [
    {
        type: "commercial",
        id: "commercial-junior",
        titre: "Commercial Junior",
        coutChargesPersonnel: 1000,
        coutTresorerie: 1000,
        typeClientRapporte: "particulier",
        nbClientsParTour: 2, // génère 2 Particuliers/tour → ventes +4 000 €, CMV −2 000 €, salary −1 = +1 net
    },
    {
        type: "commercial",
        id: "commercial-senior",
        titre: "Commercial Senior",
        coutChargesPersonnel: 2000,
        coutTresorerie: 2000,
        typeClientRapporte: "tpe",
        nbClientsParTour: 2, // génère 2 TPE/tour → ventes +6 000 €, CMV −2 000 €, salary −2 = +2 net (C+1 × 2 → BFR !)
    },
    {
        type: "commercial",
        id: "directrice-commerciale",
        titre: "Directrice Commerciale",
        coutChargesPersonnel: 3000,
        coutTresorerie: 3000,
        typeClientRapporte: "grand_compte",
        nbClientsParTour: 2, // génère 2 Grand Comptes/tour → ventes +8 000 €, CMV −2 000 €, salary −3 = +3 net (C+2 × 2 → BFR critique !)
    },
];
// ─── CARTES CLIENTS ──────────────────────────────────────────
// Comptabilisation quadruple : Ventes +X | Stocks -1 | CMV (achats) +1 | Tréso ou Créance +X
exports.CARTES_CLIENTS = [
    {
        type: "client",
        id: "client-particulier",
        titre: "Client Particulier",
        montantVentes: 2000,
        delaiPaiement: 0, // Paiement immédiat → Trésorerie +2
        consommeStocks: true,
    },
    {
        type: "client",
        id: "client-tpe",
        titre: "Client TPE",
        montantVentes: 3000,
        delaiPaiement: 1, // Paiement différé → Créances C+1 +3
        consommeStocks: true,
    },
    {
        type: "client",
        id: "client-grand-compte",
        titre: "Client Grand Compte",
        montantVentes: 4000,
        delaiPaiement: 2, // Paiement très différé → Créances C+2 +4
        consommeStocks: true,
    },
];
// ─── CARTES DÉCISION ─────────────────────────────────────────
exports.CARTES_DECISION = [
    // ── COMMERCIAUX ────────────────────────────────────────────
    {
        type: "decision",
        id: "commercial-junior-dec",
        titre: "Commercial Junior",
        description: "Recrutez un commercial junior : salaire −1 000 €/trim, génère 2 clients Particuliers/trim (+2 × 2 000 € de ventes immédiates). Résultat net : +1 000 €/trim.",
        categorie: "commercial",
        effetsImmédiats: [
            { poste: "chargesPersonnel", delta: 1000 },
            { poste: "tresorerie", delta: -1000 },
        ],
        effetsRecurrents: [], // salaire déjà géré par appliquerPaiementCommerciaux (étape 3)
        clientParTour: "particulier",
        nbClientsParTour: 2,
    },
    {
        type: "decision",
        id: "commercial-senior-dec",
        titre: "Commercial Senior",
        description: "Recrutez un commercial senior : salaire −2 000 €/trim, génère 2 clients TPE/trim (+2 × 3 000 € de ventes en C+1). Résultat net : +2 000 €/trim — mais BFR élevé, gérez vos créances !",
        categorie: "commercial",
        effetsImmédiats: [
            { poste: "chargesPersonnel", delta: 2000 },
            { poste: "tresorerie", delta: -2000 },
        ],
        effetsRecurrents: [], // salaire déjà géré par appliquerPaiementCommerciaux (étape 3)
        clientParTour: "tpe",
        nbClientsParTour: 2,
    },
    {
        type: "decision",
        id: "directrice-commerciale-dec",
        titre: "Directrice Commerciale",
        description: "Recrutez une directrice commerciale : salaire −3 000 €/trim, génère 2 Grands Comptes/trim (+2 × 4 000 € de ventes en C+2). Résultat net : +3 000 €/trim — BFR critique, risque de faillite si tréso insuffisante !",
        categorie: "commercial",
        effetsImmédiats: [
            { poste: "chargesPersonnel", delta: 3000 },
            { poste: "tresorerie", delta: -3000 },
        ],
        effetsRecurrents: [], // salaire déjà géré par appliquerPaiementCommerciaux (étape 3)
        clientParTour: "grand_compte",
        nbClientsParTour: 2,
    },
    // ── VÉHICULES ──────────────────────────────────────────────
    {
        type: "decision",
        id: "camionnette",
        titre: "Camionnette",
        description: "Achetez une camionnette de livraison — améliore votre logistique et augmente la capacité de production. Investissement : Immos +8 000 €, Tréso −8 000 €. Entretien : Services ext. +1 000 €/trim. 📦 Bonus capacité : +6 pour Production/Logistique, +2 pour Commerce/Innovation (capacité initiale = 4). 📉 Amortissement : −1/trim pendant 8 trimestres → Dotation +1 000 € au CR.",
        categorie: "vehicule",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 8000 },
            { poste: "tresorerie", delta: -8000 },
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // entretien
            { poste: "tresorerie", delta: -1000 },
        ],
        clientParTour: "particulier",
    },
    {
        type: "decision",
        id: "berline",
        titre: "Berline",
        description: "Achetez une berline de représentation — facilite les démarches commerciales, +1 Carte Décision piochée par tour. Investissement : Immos +8 000 €, Tréso −8 000 €. Entretien : Services ext. +2 000 €/trim. 📉 Amortissement : −1/trim pendant 8 trimestres → Dotation aux amortissements +1 000 € au CR.",
        categorie: "vehicule",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 8000 },
            { poste: "tresorerie", delta: -8000 },
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 2000 },
            { poste: "tresorerie", delta: -2000 },
        ],
        carteDecisionBonus: 1, // +1 carte Décision piochée par tour
    },
    // ── INVESTISSEMENTS ────────────────────────────────────────
    {
        type: "decision",
        id: "site-internet",
        titre: "Site Internet",
        description: "Créez votre vitrine en ligne — visibilité accrue, +1 client Particulier/trimestre. Investissement : Immos +4 000 €, Tréso −4 000 €. Maintenance : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 4 trimestres → Dotation +1 000 € au CR.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 4000 }, // DÉBIT Immobilisations
            { poste: "tresorerie", delta: -4000 }, // CRÉDIT Trésorerie (paiement comptant)
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT Charges maintenance
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT Trésorerie
        ],
        clientParTour: "particulier",
    },
    {
        type: "decision",
        id: "rse",
        titre: "RSE",
        description: "Engagez-vous dans la responsabilité sociale — crédibilité renforcée, +1 client Particulier/trim. Financé par emprunt : Immos +2 000 €, Emprunts +2 000 € (aucune sortie de tréso immédiate !). Charges RSE : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 2 trimestres → Dotation +1 000 € au CR.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 2000 }, // DÉBIT Immobilisations
            { poste: "emprunts", delta: 2000 }, // CRÉDIT Emprunts (financement par dette)
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT Charges RSE
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT Trésorerie
        ],
        clientParTour: "particulier",
    },
    {
        type: "decision",
        id: "recherche-developpement",
        titre: "Recherche & Développement",
        description: "Investissez en R&D — innovation brevetée, +1 client TPE/trimestre. Crédit d'Impôt Recherche (CIR) : l'État rembourse 30 % sous forme de produit exceptionnel +1/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. Charges R&D : Services ext. +2 000 €/trim. 📉 Amortissement : −1/trim pendant 5 trimestres → Dotation +1 000 € au CR.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 }, // DÉBIT Immobilisations incorporelles
            { poste: "tresorerie", delta: -5000 }, // CRÉDIT Trésorerie
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 2000 }, // DÉBIT Charges R&D récurrentes
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT Trésorerie
            { poste: "revenusExceptionnels", delta: 1000 }, // CRÉDIT Crédit d'Impôt Recherche (CIR)
            { poste: "tresorerie", delta: 1000 }, // DÉBIT Trésorerie (encaissement CIR)
        ],
        clientParTour: "tpe",
    },
    {
        type: "decision",
        id: "expansion",
        titre: "Expansion",
        description: "Agrandissez vos locaux pour accueillir plus de clients et augmenter votre capacité de production. Investissement : Immos +8 000 €, Tréso −8 000 €. Maintenance : Services ext. +1 000 €/trim. 📦 Bonus capacité : +4 pour Production/Logistique, +6 pour Commerce/Innovation (capacité initiale = 4). 📉 Amortissement : −1/trim pendant 8 trimestres → Dotation +1 000 € au CR.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 8000 }, // DÉBIT Immobilisations (nouveaux locaux)
            { poste: "tresorerie", delta: -8000 }, // CRÉDIT Trésorerie
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT Loyer, entretien locaux
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT Trésorerie
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
            { poste: "servicesExterieurs", delta: 3000 },
            { poste: "tresorerie", delta: -3000 },
            // Apport investisseurs
            { poste: "tresorerie", delta: 6000 },
            { poste: "capitaux", delta: 6000 },
        ],
        effetsRecurrents: [], // carte à usage unique (retirée après usage)
    },
    {
        type: "decision",
        id: "remboursement-anticipe",
        titre: "Remboursement Anticipé",
        description: "Soldez intégralement votre emprunt. Coût : frais de dossier (Services ext. +1, Tréso −1 000 €) PLUS le capital restant dû (Tréso − emprunts, Emprunts → 0). Économisez les intérêts futurs.",
        categorie: "financement",
        effetsImmédiats: [
            { poste: "servicesExterieurs", delta: 1000 },
            { poste: "tresorerie", delta: -1000 },
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
            { poste: "servicesExterieurs", delta: 2000 },
            { poste: "tresorerie", delta: -2000 },
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
            { poste: "chargesPersonnel", delta: 1000 },
            { poste: "tresorerie", delta: -1000 },
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
            { poste: "chargesPersonnel", delta: 1000 },
            { poste: "tresorerie", delta: -1000 },
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
            { poste: "servicesExterieurs", delta: 2000 },
            { poste: "tresorerie", delta: -2000 },
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
            { poste: "tresorerie", delta: 5000 }, // DÉBIT Trésorerie (encaissement du prêt)
            { poste: "emprunts", delta: 5000 }, // CRÉDIT Emprunts (dette financière)
        ],
        effetsRecurrents: [
            { poste: "chargesInteret", delta: 1000 }, // DÉBIT Charges d'intérêts
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT Trésorerie (paiement intérêts)
        ],
    },
    {
        type: "decision",
        id: "certification-iso",
        titre: "Certification ISO 9001",
        description: "Obtenez la certification qualité — crédibilité auprès des grandes entreprises, +1 Grand Compte/trimestre. Investissement : Immos +5 000 €, Tréso −5 000 €. Maintien certification : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 5 trimestres → Dotation +1 000 € au CR.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 }, // DÉBIT Immobilisations incorporelles
            { poste: "tresorerie", delta: -5000 }, // CRÉDIT Trésorerie
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT Frais de maintien certification
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT Trésorerie
        ],
        clientParTour: "grand_compte",
    },
    {
        type: "decision",
        id: "application-mobile",
        titre: "Application Mobile",
        description: "Lancez votre app de vente en ligne — canal direct vers les consommateurs, +2 clients Particuliers/trimestre. Développement : Immos +4 000 €, Tréso −4 000 €. Hébergement & maintenance : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 4 trimestres → Dotation +1 000 € au CR.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 4000 }, // DÉBIT Immobilisations incorporelles (développement)
            { poste: "tresorerie", delta: -4000 }, // CRÉDIT Trésorerie
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT Hébergement & maintenance app
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT Trésorerie
        ],
        clientParTour: "particulier",
        nbClientsParTour: 2,
    },
    // ── PROTECTION ────────────────────────────────────────────
    {
        type: "decision",
        id: "assurance-prevoyance",
        titre: "Assurance Prévoyance",
        description: "Souscrivez une assurance — annule les événements négatifs (incendie, grève, litige, contrôle fiscal…). Dépôt de garantie : Immos +2 000 €, Tréso −2 000 €. Prime annuelle : Services ext. +1 000 €/trim, Tréso −1 000 €/trim. 📉 Amortissement : −1/trim (2 trimestres).",
        categorie: "protection",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 2000 },
            { poste: "tresorerie", delta: -2000 },
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 },
            { poste: "tresorerie", delta: -1000 },
        ],
    },
    // ════════════════════════════════════════════════════════════
    // NOUVELLES CARTES — Session 3 (14 cartes supplémentaires)
    // ════════════════════════════════════════════════════════════
    // ── VÉHICULES SUPPLÉMENTAIRES ──────────────────────────────
    {
        type: "decision",
        id: "fourgon-refrigere",
        titre: "Fourgon Réfrigéré",
        description: "Investissez dans un fourgon frigorifique — livraison de produits frais ou pharmaceutiques, +1 client TPE/trimestre. 💡 Immobilisation corporelle spécialisée (cpt 2182). Immos +6 000 €, Tréso −6 000 €. Entretien & carburant : Services ext. +2 000 €/trim. 📉 Amortissement : −1/trim pendant 6 trimestres → Dotation +1 000 € au CR.",
        categorie: "vehicule",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 6000 }, // DÉBIT 2182 — Matériel de transport réfrigéré
            { poste: "tresorerie", delta: -6000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 2000 }, // DÉBIT 615 — Entretien & carburant spécialisé
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT 512 — Banque
        ],
        clientParTour: "tpe",
    },
    {
        type: "decision",
        id: "velo-cargo",
        titre: "Vélo Cargo Électrique",
        description: "Optez pour la livraison verte en zone urbaine — zéro émission, image RSE valorisée, +1 client Particulier/trimestre. Faible investissement : Immos +3 000 €, Tréso −3 000 €. Entretien quasi nul : aucune charge récurrente. 📉 Amortissement : −1/trim pendant 3 trimestres → Dotation +1 000 € au CR. 💡 Exemple d'investissement frugal à retour rapide.",
        categorie: "vehicule",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 3000 }, // DÉBIT 2182 — Matériel de transport (vélo cargo)
            { poste: "tresorerie", delta: -3000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [],
        clientParTour: "particulier",
    },
    // ── INVESTISSEMENTS SUPPLÉMENTAIRES ────────────────────────
    {
        type: "decision",
        id: "erp",
        titre: "ERP / Logiciel de Gestion",
        description: "Centralisez votre gestion avec un progiciel intégré — crédibilité B2B accrue, +1 Grand Compte/trimestre. 💡 Immobilisation INCORPORELLE (cpt 205 — Logiciels). Immos +5 000 €, Tréso −5 000 €. Maintenance & mises à jour : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 5 trimestres → Dotation +1 000 € au CR.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 }, // DÉBIT 205 — Logiciels et licences (immo incorporelle)
            { poste: "tresorerie", delta: -5000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 615 — Maintenance & mises à jour
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
        clientParTour: "grand_compte",
    },
    {
        type: "decision",
        id: "marketplace",
        titre: "Marketplace en Ligne",
        description: "Référencez vos produits sur une grande place de marché — accès instantané à une clientèle massive, +2 clients Particuliers/trimestre. Développement boutique : Immos +4 000 €, Tréso −4 000 €. Commissions plateforme : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 4 trimestres → Dotation +1 000 € au CR. 💡 Les commissions sont des charges d'exploitation (cpt 627).",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 4000 }, // DÉBIT 205 — Logiciels (boutique marketplace)
            { poste: "tresorerie", delta: -4000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 627 — Services bancaires & commissions plateforme
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
        clientParTour: "particulier",
        nbClientsParTour: 2,
    },
    {
        type: "decision",
        id: "entrepot-automatise",
        titre: "Entrepôt Automatisé",
        description: "Automatisez votre logistique — capacité de stockage doublée, délais divisés par deux, +1 Grand Compte/trimestre. Investissement lourd : Immos +8 000 €, Tréso −8 000 €. Énergie & maintenance robots : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 8 trimestres → Dotation +1 000 € au CR. 💡 Investissement industriel à fort amortissement : ratio ROI long terme.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 8000 }, // DÉBIT 2154 — Matériel industriel & robotique
            { poste: "tresorerie", delta: -8000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 615 — Entretien robots & énergie
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
        clientParTour: "grand_compte",
    },
    {
        type: "decision",
        id: "label-qualite",
        titre: "Label Qualité / Bio",
        description: "Obtenez un label reconnu — différenciation sur des marchés de niche à forte valeur ajoutée, +1 client TPE/trimestre (distributeurs spécialisés). Certification : Immos +4 000 €, Tréso −4 000 €. Audits annuels : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 4 trimestres → Dotation +1 000 € au CR. 💡 Le label est une immo incorporelle : il crée de la valeur durable dans le bilan.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 4000 }, // DÉBIT 207 — Fonds commercial / label (immo incorporelle)
            { poste: "tresorerie", delta: -4000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 622 — Honoraires auditeurs & frais de renouvellement
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
        clientParTour: "tpe",
    },
    // ── FINANCEMENT SUPPLÉMENTAIRE ──────────────────────────────
    {
        type: "decision",
        id: "credit-bail",
        titre: "Crédit-Bail (Leasing)",
        description: "Utilisez un équipement professionnel sans l'acheter. 💡 Zéro apport immédiat — l'équipement est financé intégralement par dette : Immos +6 000 €, Emprunts +6 000 €. Loyers récurrents : Services ext. +2 000 €/trim, Tréso −2 000 €/trim. +1 client TPE/trim. 📉 Amortissement : −1/trim pendant 6 trimestres. ⚠️ Leasing ≠ gratuit : la dette crée une obligation de paiement sur 6 trimestres !",
        categorie: "financement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 6000 }, // DÉBIT 212/215 — Immobilisation en crédit-bail (actif)
            { poste: "emprunts", delta: 6000 }, // CRÉDIT 167 — Dettes sur contrats de crédit-bail (passif)
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 2000 }, // DÉBIT 612 — Redevances crédit-bail (charges locatives)
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT 512 — Banque
        ],
        clientParTour: "tpe",
    },
    {
        type: "decision",
        id: "crowdfunding",
        titre: "Crowdfunding",
        description: "Financez votre projet par la communauté — apport en capital SANS remboursement ni intérêts ! Levée participative : Tréso +4 000 €, Capitaux +4 000 €. Frais plateforme récurrents : Services ext. +1 000 €/trim. 💡 Le crowdfunding renforce vos FONDS PROPRES (cpt 101) sans créer de dette — contrairement à l'emprunt bancaire (cpt 164) qui alourdit votre passif.",
        categorie: "financement",
        effetsImmédiats: [
            { poste: "tresorerie", delta: 4000 }, // DÉBIT 512 — Banque (encaissement levée participative)
            { poste: "capitaux", delta: 4000 }, // CRÉDIT 101 — Capital social / apport crowdfunding
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 623 — Frais plateforme & communication
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
    },
    // ── TACTIQUE SUPPLÉMENTAIRE ─────────────────────────────────
    {
        type: "decision",
        id: "programme-fidelite",
        titre: "Programme de Fidélité",
        description: "Récompensez vos meilleurs clients et augmentez votre taux de réachat — +1 client Particulier/trimestre. Logiciel de fidélité : Immos +3 000 €, Tréso −3 000 € (immo incorporelle). Gestion du programme : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 3 trimestres → Dotation +1 000 € au CR. 💡 La fidélisation client réduit le coût d'acquisition : investissement rentable à moyen terme.",
        categorie: "tactique",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 3000 }, // DÉBIT 205 — Logiciel de gestion fidélité
            { poste: "tresorerie", delta: -3000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 623 — Frais de communication & gestion programme
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
        clientParTour: "particulier",
    },
    {
        type: "decision",
        id: "export-international",
        titre: "Export International",
        description: "Prospectez de nouveaux marchés à l'étranger — +1 Grand Compte/trimestre (contrats internationaux). Frais capitalisés : Immos +5 000 €, Tréso −5 000 €. Frais récurrents (déplacements, douanes, traduction) : Services ext. +2 000 €/trim. 📉 Amortissement : −1/trim pendant 5 trimestres → Dotation +1 000 € au CR. ⚠️ BFR élevé : les Grands Comptes paient en C+2, surveillez votre trésorerie !",
        categorie: "tactique",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 }, // DÉBIT 207 — Frais de développement commercial export (capitalisés)
            { poste: "tresorerie", delta: -5000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 2000 }, // DÉBIT 625/626 — Frais déplacements, douanes, traduction
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT 512 — Banque
        ],
        clientParTour: "grand_compte",
    },
    {
        type: "decision",
        id: "partenariat-commercial",
        titre: "Partenariat Commercial",
        description: "Signez un accord de distribution avec un réseau partenaire — accès à de nouveaux circuits sans investissement lourd, +1 client TPE/trimestre. Formalisation : Immos +2 000 €, Tréso −2 000 € (frais juridiques capitalisés). Commissions réseau : Services ext. +1 000 €/trim. 📉 Amortissement : −1/trim pendant 2 trimestres → Dotation +1 000 € au CR. 💡 Croissance indirecte via un réseau existant : coût d'acquisition mutualisé.",
        categorie: "tactique",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 2000 }, // DÉBIT 207 — Frais d'établissement partenariat (immo incorporelle)
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 622 — Commissions & honoraires réseau partenaires
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
        clientParTour: "tpe",
    },
    // ── SERVICE SUPPLÉMENTAIRE ──────────────────────────────────
    {
        type: "decision",
        id: "maintenance-preventive",
        titre: "Contrat de Maintenance",
        description: "Souscrivez un contrat de maintenance préventive externalisée — évitez les pannes coûteuses et annulez les événements techniques négatifs (panne, perte de données…). Abonnement SLA : Services ext. +1 000 €/trim, Tréso −1 000 €/trim. 💡 Coût fixe maîtrisé vs charges exceptionnelles imprévisibles : la prévention est toujours moins chère que la réparation d'urgence !",
        categorie: "service",
        effetsImmédiats: [],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 615 — Entretien externalisé (contrat de maintenance)
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
    },
    // ── PROTECTION SUPPLÉMENTAIRE ───────────────────────────────
    {
        type: "decision",
        id: "mutuelle-collective",
        titre: "Mutuelle Collective",
        description: "Protégez vos salariés avec une couverture santé — fidélisez vos équipes et réduisez le risque de grève. Logiciel RH : Immos +2 000 €, Tréso −2 000 €. Cotisation patronale récurrente : Charges personnel +1/trim, Tréso −1 000 €/trim. 💡 Les cotisations patronales sont comptabilisées en charges de personnel (cpt 645 PCG) et non en services extérieurs. 📉 Amortissement : −1/trim pendant 2 trimestres.",
        categorie: "protection",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 2000 }, // DÉBIT 205 — Logiciel SIRH (immo incorporelle)
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "chargesPersonnel", delta: 1000 }, // DÉBIT 645 — Cotisation patronale mutuelle santé
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
    },
    {
        type: "decision",
        id: "cybersecurite",
        titre: "Cybersécurité",
        description: "Protégez vos données et systèmes contre les intrusions — annule les événements de type perte de données ou piratage. Licences & audit initial : Immos +3 000 €, Tréso −3 000 €. Abonnement protection active : Services ext. +1 000 €/trim, Tréso −1 000 €/trim. 💡 Les logiciels de sécurité sont des immo incorporelles (cpt 205). 📉 Amortissement : −1/trim pendant 3 trimestres → Dotation +1 000 € au CR.",
        categorie: "protection",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 3000 }, // DÉBIT 205 — Licences cybersécurité (immo incorporelle)
            { poste: "tresorerie", delta: -3000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 615 — Abonnement protection & audits périodiques
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
        ],
    },
    // ── APPROVISIONNEMENT & PRODUCTION ─────────────────────────
    {
        type: "decision",
        id: "achat-urgence",
        titre: "Achat d'Urgence",
        description: "Achetez 5 unités de stock en urgence chez un concurrent — prix majoré de 40%. Stocks +5, Tréso −7 000 €. Le surcoût de 2€ passe en charges exceptionnelles. 💡 Une rupture de stock coûte toujours plus cher qu'un stock de sécurité — anticipez vos besoins en BFR ! ⚠️ Capacité max de production initiale = 4 unités ; certains investissements (Camionnette, Expansion…) augmentent cette capacité.",
        categorie: "tactique",
        effetsImmédiats: [
            { poste: "stocks", delta: 5000 }, // DÉBIT 37 — Stocks de marchandises
            { poste: "tresorerie", delta: -7000 }, // CRÉDIT 512 — Banque (5 coût + 2 surcoût)
            { poste: "chargesExceptionnelles", delta: 2000 }, // DÉBIT 671 — Surcoût d'achat d'urgence
        ],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "maintenance-preventive",
        titre: "Maintenance Préventive",
        description: "Mettez en place un contrat de maintenance préventive : entretien régulier des équipements → durée de vie allongée, amortissement réduit de 1/trim. Coût initial : Tréso −2 000 €. Coût récurrent : Services ext. +1 000 €/trim. 💡 La maintenance préventive coûte moins cher que la maintenance curative — elle réduit l'usure (amortissement) et prévient les pannes. ⚠️ Capacité max de production initiale = 4 unités.",
        categorie: "service",
        effetsImmédiats: [
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT 512 — Frais de mise en place du contrat
        ],
        effetsRecurrents: [
            { poste: "servicesExterieurs", delta: 1000 }, // DÉBIT 615 — Abonnement maintenance
            { poste: "tresorerie", delta: -1000 }, // CRÉDIT 512 — Banque
            { poste: "dotationsAmortissements", delta: -1000 }, // Réduction amortissement (durée de vie allongée)
        ],
    },
    {
        type: "decision",
        id: "revision-generale",
        titre: "Révision Générale",
        description: "Remettez à neuf vos équipements : révision majeure qui prolonge la durée de vie des actifs. Immos +4 000 €, Tréso −4 000 €. Les dépenses qui prolongent la durée de vie d'un bien s'immobilisent (et non en charges). 💡 Distinction CAPEX/OPEX : une révision qui augmente la durée de vie est un investissement, pas une charge ! ⚠️ Capacité max de production initiale = 4 unités ; certains investissements augmentent cette capacité.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 4000 }, // DÉBIT 215 — Immobilisations corporelles (revalorisation)
            { poste: "tresorerie", delta: -4000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "optimisation-lean",
        titre: "Optimisation Lean",
        description: "Déployez une démarche Lean/Kaizen : réduction des gaspillages, amélioration continue. Investissement immatériel : Immos +3 000 €, Tréso −3 000 €. Résultat : CMV réduit de 1/trim (moins de déchets = +1 stock préservé). 📉 Amortissement : −1/trim pendant 3 trimestres. 💡 Le Lean améliore la marge brute en réduisant les pertes matières — ROI souvent atteint dès le 2e trimestre.",
        categorie: "investissement",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 3000 }, // DÉBIT 205 — Investissement immatériel Lean
            { poste: "tresorerie", delta: -3000 }, // CRÉDIT 512 — Banque
        ],
        effetsRecurrents: [
            { poste: "achats", delta: -1000 }, // Réduction CMV (moins de gaspillage matière)
            { poste: "stocks", delta: 1000 }, // Stock préservé grâce à l'efficacité
        ],
    },
    {
        type: "decision",
        id: "sous-traitance",
        titre: "Sous-traitance de Production",
        description: "Externalisez une partie de la production : un sous-traitant livre 2 unités de stock/trim à 2€/unité (vs 1€ en interne). Surcoût : +2 Services ext./trim, compensé par +2 stocks sans mobiliser vos machines. 💡 Décision make-or-buy : la sous-traitance augmente les charges variables mais préserve la capacité interne et évite l'investissement lourd.",
        categorie: "tactique",
        effetsImmédiats: [],
        effetsRecurrents: [
            { poste: "stocks", delta: 2000 }, // Stocks livrés par le sous-traitant
            { poste: "tresorerie", delta: -4000 }, // Paiement : 2 unités × 2€
            { poste: "servicesExterieurs", delta: 2000 }, // DÉBIT 611 — Sous-traitance générale (surcoût)
        ],
    },
];
// ─── CARTES ÉVÉNEMENTS ──────────────────────────────────────
exports.CARTES_EVENEMENTS = [
    {
        type: "evenement",
        id: "client-vip",
        titre: "Client VIP ⭐",
        description: "Une starlette de télé-réalité s'est prise en selfie avec votre produit. Vos ventes sont au beau fixe !",
        effets: [
            { poste: "ventes", delta: 2000 },
            { poste: "tresorerie", delta: 2000 },
            { poste: "stocks", delta: -2000 },
            { poste: "achats", delta: 2000 }, // CMV correspondant
        ],
        annulableParAssurance: false,
    },
    {
        type: "evenement",
        id: "controle-fiscal",
        titre: "Contrôle Fiscal 📋",
        description: "Vous recevez un redressement suite à une erreur dans votre déclaration fiscale. Payez sans discuter !",
        effets: [
            { poste: "impotsTaxes", delta: 2000 },
            { poste: "tresorerie", delta: -2000 },
        ],
        annulableParAssurance: true,
    },
    {
        type: "evenement",
        id: "subvention-innovation",
        titre: "Subvention Innovation 🎉",
        description: "Vous inventez un concept innovant ! Vous obtenez une subvention de la région pour le développer.",
        effets: [
            { poste: "revenusExceptionnels", delta: 3000 },
            { poste: "tresorerie", delta: 3000 },
        ],
        annulableParAssurance: false,
    },
    {
        type: "evenement",
        id: "placement-financier",
        titre: "Placement Financier 📈",
        description: "Votre trésorerie placée génère des intérêts. La gestion prudente paye !",
        effets: [
            { poste: "produitsFinanciers", delta: 1000 },
            { poste: "tresorerie", delta: 1000 },
        ],
        annulableParAssurance: false,
    },
    {
        type: "evenement",
        id: "crise-sanitaire",
        titre: "Crise Sanitaire 😷",
        description: "Une crise sanitaire frappe le monde entier. Votre activité est perturbée : coûts de protection, pertes de marchandises, désorganisation.",
        effets: [
            { poste: "chargesExceptionnelles", delta: 2000 }, // DÉBIT Charges exceptionnelles (coûts de crise)
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT Trésorerie
        ],
        annulableParAssurance: true,
    },
    {
        type: "evenement",
        id: "incendie",
        titre: "L'Entreprise Prend Feu ! 🔥",
        description: "Votre entreprise est incendiée. Sans assurance, pas de clients au prochain tour. Avec assurance : indemnités.",
        effets: [
            { poste: "revenusExceptionnels", delta: 2000 },
            { poste: "tresorerie", delta: 2000 },
        ],
        annulableParAssurance: false, // l'assurance change l'effet mais ne l'annule pas
    },
    {
        type: "evenement",
        id: "greve",
        titre: "Grève des Employés ✊",
        description: "Vos employés font grève. La production est à l'arrêt : coûts de remplacement et pertes d'exploitation.",
        effets: [
            { poste: "chargesExceptionnelles", delta: 2000 }, // DÉBIT Charges exceptionnelles (coûts de grève)
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT Trésorerie
        ],
        annulableParAssurance: true,
    },
    {
        type: "evenement",
        id: "bouche-a-oreille",
        titre: "Bouche à Oreille 📣",
        description: "Vos clients sont très satisfaits, ils font du buzz sur les réseaux sociaux !",
        effets: [
            { poste: "ventes", delta: 1000 },
            { poste: "tresorerie", delta: 1000 },
        ],
        annulableParAssurance: false,
    },
    {
        type: "evenement",
        id: "perte-de-donnees",
        titre: "Perte de Données 💾",
        description: "Vous perdez vos fichiers informatiques. Vous devez faire appel à un spécialiste en urgence.",
        effets: [
            { poste: "chargesExceptionnelles", delta: 2000 },
            { poste: "tresorerie", delta: -2000 },
        ],
        annulableParAssurance: true,
    },
    {
        type: "evenement",
        id: "subvention-developpement-durable",
        titre: "Développement Durable 🌿",
        description: "Vous remportez un appel d'offres écologique auprès d'une mairie. Contrat lucratif mais la collectivité paie en 2 trimestres — attention au BFR !",
        effets: [
            { poste: "ventes", delta: 3000 }, // CRÉDIT Ventes (CA reconnu)
            { poste: "creancesPlus2", delta: 3000 }, // DÉBIT Créances C+2 (la mairie paie en 2 trimestres)
            { poste: "stocks", delta: -3000 }, // CRÉDIT Stocks (marchandises livrées)
            { poste: "achats", delta: 3000 }, // DÉBIT CMV (coût des marchandises vendues)
        ],
        annulableParAssurance: false,
    },
    // ── NOUVEAUX ÉVÉNEMENTS (1 positif + 2 négatifs) ─────────────
    {
        type: "evenement",
        id: "prix-pme-annee",
        titre: "Prix PME de l'Année 🏆",
        description: "La Chambre de Commerce vous remet le Prix Régional PME de l'Année. Votre notoriété bondit et attire de nouveaux partenaires.",
        effets: [
            { poste: "revenusExceptionnels", delta: 2000 }, // CRÉDIT Produits exceptionnels
            { poste: "tresorerie", delta: 2000 }, // DÉBIT Trésorerie (dotation prix)
        ],
        annulableParAssurance: false,
    },
    {
        type: "evenement",
        id: "rupture-stock-fournisseur",
        titre: "Rupture Fournisseur 📦",
        description: "Votre fournisseur principal est en rupture de stock. Vous devez vous approvisionner en urgence à prix fort chez un concurrent.",
        effets: [
            { poste: "chargesExceptionnelles", delta: 2000 }, // DÉBIT Charges exceptionnelles (surcoût)
            { poste: "tresorerie", delta: -2000 }, // CRÉDIT Trésorerie
        ],
        annulableParAssurance: false,
    },
    {
        type: "evenement",
        id: "litige-commercial",
        titre: "Litige Commercial ⚖️",
        description: "Un client conteste la conformité de votre livraison et vous assigne en justice. Honoraires d'avocat et provision pour risque.",
        effets: [
            { poste: "chargesExceptionnelles", delta: 3000 }, // DÉBIT Charges exceptionnelles (frais juridiques)
            { poste: "tresorerie", delta: -3000 }, // CRÉDIT Trésorerie
        ],
        annulableParAssurance: true,
    },
];
// ── MINI-DECK LOGISTIQUE PAR ENTREPRISE ────────────────────────
// Ces cartes ne font PAS partie de la pioche globale.
// Elles sont assignées via EntrepriseTemplate.cartesLogistiquesDisponibles.
exports.CARTES_LOGISTIQUES = [
    // ── Manufacture Belvaux (Production) ───────────────────────
    {
        type: "decision",
        id: "belvaux-robot-n1",
        titre: "Robot de manutention",
        description: "Automatisez la préparation des commandes — +2 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "investissement",
        entrepriseExclusive: "Manufacture Belvaux",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "belvaux-robot-n2",
        titre: "Robot de manutention N2",
        description: "Doublez la ligne robotisée — +2 ventes/trim supplémentaires. Investissement : Immos +5 000 €, Tréso −5 000 €. Nécessite : Robot de manutention. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "investissement",
        entrepriseExclusive: "Manufacture Belvaux",
        prerequis: "belvaux-robot-n1",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "belvaux-entrepot",
        titre: "Entrepôt automatisé",
        description: "Optimisez le stockage et l'expédition — +2 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "investissement",
        entrepriseExclusive: "Manufacture Belvaux",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
    // ── Véloce Transports (Logistique) ─────────────────────────
    {
        type: "decision",
        id: "veloce-vehicule-n2",
        titre: "2ème véhicule",
        description: "Ajoutez un second véhicule à la flotte — +2 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "vehicule",
        entrepriseExclusive: "Véloce Transports",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "veloce-dispatch-n1",
        titre: "Plateforme dispatch",
        description: "Centralisez la gestion des tournées — +2 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "investissement",
        entrepriseExclusive: "Véloce Transports",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "veloce-dispatch-n2",
        titre: "Plateforme dispatch N2",
        description: "Étendez la plateforme à la gestion multi-dépôts — +2 ventes/trim supplémentaires. Investissement : Immos +5 000 €, Tréso −5 000 €. Nécessite : Plateforme dispatch. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "investissement",
        entrepriseExclusive: "Véloce Transports",
        prerequis: "veloce-dispatch-n1",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
    // ── Azura Commerce (Commerce) ───────────────────────────────
    {
        type: "decision",
        id: "azura-marketplace-n1",
        titre: "Marketplace (incluse)",
        description: "Plateforme e-commerce de base — +4 ventes/trim. Investissement initial inclus dans le capital de départ.",
        categorie: "investissement",
        entrepriseExclusive: "Azura Commerce",
        effetsImmédiats: [],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "azura-marketplace-n2",
        titre: "Marketplace N2",
        description: "Ouvrez de nouveaux canaux de vente en ligne — +4 ventes/trim supplémentaires. Investissement : Immos +5 000 €, Tréso −5 000 €. Nécessite : Marketplace. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "investissement",
        entrepriseExclusive: "Azura Commerce",
        prerequis: "azura-marketplace-n1",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "azura-soustraitance",
        titre: "Sous-traitance livraison",
        description: "Externalisez la logistique à un prestataire — +4 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "investissement",
        entrepriseExclusive: "Azura Commerce",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
    // ── Synergia Lab (Innovation) ───────────────────────────────
    {
        type: "decision",
        id: "synergia-erp-n1",
        titre: "ERP logistique (inclus)",
        description: "Module de gestion des flux de base — +4 ventes/trim. Investissement initial inclus dans le capital de départ.",
        categorie: "investissement",
        entrepriseExclusive: "Synergia Lab",
        effetsImmédiats: [],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "synergia-erp-n2",
        titre: "ERP logistique N2",
        description: "Activez les modules avancés (prévisions, automatisation) — +4 ventes/trim supplémentaires. Investissement : Immos +5 000 €, Tréso −5 000 €. Nécessite : ERP logistique. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "investissement",
        entrepriseExclusive: "Synergia Lab",
        prerequis: "synergia-erp-n1",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
    {
        type: "decision",
        id: "synergia-partenariat",
        titre: "Partenariat logistique",
        description: "Nouez un accord avec un opérateur externe — +4 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
        categorie: "investissement",
        entrepriseExclusive: "Synergia Lab",
        effetsImmédiats: [
            { poste: "immobilisations", delta: 5000 },
            { poste: "tresorerie", delta: -5000 },
        ],
        effetsRecurrents: [],
    },
];
//# sourceMappingURL=cartes.js.map