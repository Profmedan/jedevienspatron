"use strict";
// ============================================================
// JEDEVIENSPATRON — Mini-catalogue de démo pour la Vague 2
// ============================================================
// But pédagogique : valider le cœur émotionnel de la dramaturgie
// anti-lassitude en 6 trimestres.
//   T1 : "j'observe"
//   T2 : "je maîtrise"
//   T3 début : "le marché change"
//   T3 avant décision : "je choisis mon positionnement"
//   T5 : "mon choix revient" (arc différé 2 trimestres)
//   T6 : fin normale
//
// Ce catalogue est volontairement court (5 défis). Le catalogue
// complet V1 (27 défis) viendra à la Vague 4.
//
// Règle absolue : tous les montants passent par les fonctions de
// calibrage (L43). Aucun euro hardcodé dans ce fichier.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATALOGUE_V2_INDEX = exports.CATALOGUE_V2 = void 0;
const calibrage_1 = require("../../calibrage");
// ─── T1 — Observation silencieuse ───────────────────────────
const OBSERVATION_T1 = {
    id: "obs-t1",
    archetype: "observation",
    tonalite: null,
    conceptCible: "bilan_actif_passif",
    slot: "debut_tour",
    tourMin: 1,
    tourMax: 1,
    contexte: "Bienvenue, {pseudo}. Tu diriges {entreprise} depuis aujourd'hui. " +
        "Prends un instant : regarde ton bilan. Ce que tu vois là, c'est ton point de départ. " +
        "Rien ne se juge encore. Ton premier objectif est simple : comprendre ce que tu as en main.",
    choix: [
        {
            id: "continuer",
            libelle: "Je suis prêt",
            effetsImmediats: [],
            pedagogie: "À retenir : l'Actif (à gauche) liste ce que l'entreprise possède. " +
                "Le Passif (à droite) indique d'où vient l'argent. Les deux s'équilibrent toujours.",
        },
    ],
    // Obligatoire pour garantir l'apparition au T1.
    obligatoire: true,
};
// ─── T2 — Observation de cycle ──────────────────────────────
const OBSERVATION_T2 = {
    id: "obs-t2",
    archetype: "observation",
    tonalite: null,
    conceptCible: "tresorerie_vs_resultat",
    slot: "debut_tour",
    tourMin: 2,
    tourMax: 2,
    contexte: "T2. Tu as vécu un cycle complet, {pseudo}. Compare ta trésorerie et ton résultat du premier trimestre. " +
        "Ce sont deux choses différentes, et chez {entreprise} aussi ce sera ta grille de lecture.",
    choix: [
        {
            id: "continuer",
            libelle: "Je continue",
            effetsImmediats: [],
            pedagogie: "Résultat ≠ trésorerie. Une entreprise peut gagner de l'argent sur le papier (résultat positif) " +
                "et en manquer en caisse (trésorerie basse) — par exemple si ses clients n'ont pas encore payé.",
        },
    ],
    obligatoire: true,
};
// ─── T3 début — « Le marché change » ────────────────────────
const DEFI_T3_MARCHE = {
    id: "defi-t3-marche",
    archetype: "choix_binaire",
    tonalite: "positionnement",
    conceptCible: "marge_commerciale",
    slot: "debut_tour",
    tourMin: 3,
    tourMax: 3,
    contexte: "T3, {saison}. Les concurrents de {entreprise} baissent leurs prix. " +
        "Tes clients hésitent. Deux voies s'ouvrent à toi, {pseudo}.",
    choix: [
        {
            id: "adapter",
            libelle: "M'aligner et baisser mes prix",
            description: "Protéger la part de marché, accepter une marge plus courte.",
            effetsImmediats: [
                // Coût d'ajustement : remises commerciales + réimpression tarifs.
                { poste: "tresorerie", delta: -(0, calibrage_1.montantChargeFixe)(0.5) },
                { poste: "chargesExceptionnelles", delta: (0, calibrage_1.montantChargeFixe)(0.5) },
            ],
            pedagogie: "Tu protèges ton volume mais tu entames ta marge commerciale. " +
                "La décision se lit dans le compte de résultat : même chiffre d'affaires, résultat plus faible.",
        },
        {
            id: "tenir",
            libelle: "Tenir mes prix",
            description: "Préserver la marge, accepter un risque sur le volume.",
            effetsImmediats: [],
            pedagogie: "Tu préserves ta marge unitaire. Reste à voir si tes clients te suivent " +
                "— le vrai test viendra à l'étape Ventes.",
        },
    ],
    obligatoire: true,
};
// ─── T3 avant décision — Palier positionnement ──────────────
// Ce défi introduit le premier vrai arc différé : la conséquence
// revient à T5 (dansNTrimestres = 2).
const PALIER_T3_POSITIONNEMENT = {
    id: "palier-t3-positionnement",
    archetype: "palier_strategique",
    tonalite: "positionnement",
    conceptCible: "positionnement_strategique",
    slot: "avant_decision",
    tourMin: 3,
    tourMax: 3,
    contexte: "Décision de dirigeant, {pseudo}. Quel positionnement vas-tu donner à {entreprise} à partir de maintenant ? " +
        "Ce choix engage ta stratégie pour les prochains trimestres.",
    choix: [
        {
            id: "low_cost",
            libelle: "Low-cost — le volume avant la marge",
            description: "Prix bas, distribution large, marges fines.",
            effetsImmediats: [],
            effetsDiffere: [
                {
                    dansNTrimestres: 2,
                    effets: [
                        { poste: "ventes", delta: (0, calibrage_1.montantChargeFixe)(1.5) },
                        { poste: "achats", delta: (0, calibrage_1.montantChargeFixe)(1.2) },
                    ],
                    explication: "Ton pari low-cost porte ses fruits : le volume de ventes monte, " +
                        "mais les achats suivent. Ta marge reste fine — c'était le deal.",
                },
            ],
            pedagogie: "Low-cost : tu joues le volume et l'agilité opérationnelle. " +
                "Le piège : ton BFR (stocks + créances clients) peut gonfler plus vite que ta trésorerie.",
        },
        {
            id: "milieu",
            libelle: "Milieu de gamme — l'équilibre",
            description: "Offre standard, clientèle stable, pas de rupture.",
            effetsImmediats: [],
            effetsDiffere: [
                {
                    dansNTrimestres: 2,
                    effets: [{ poste: "ventes", delta: (0, calibrage_1.montantChargeFixe)(0.5) }],
                    explication: "Ton positionnement médian te procure une légère croissance, sans effet de levier.",
                },
            ],
            pedagogie: "Milieu de gamme : facile à tenir, difficile à transformer en avantage durable. " +
                "Tu gardes toutes tes options ouvertes, ce qui en soi est une stratégie.",
        },
        {
            id: "premium",
            libelle: "Premium — la marge avant le volume",
            description: "Qualité supérieure, prix élevés, clientèle sélective.",
            effetsImmediats: [
                // Investissement immédiat dans la qualité (formation, sourcing, packaging).
                { poste: "tresorerie", delta: -(0, calibrage_1.montantChargeFixe)(0.5) },
                { poste: "servicesExterieurs", delta: (0, calibrage_1.montantChargeFixe)(0.5) },
            ],
            effetsDiffere: [
                {
                    dansNTrimestres: 2,
                    effets: [{ poste: "ventes", delta: (0, calibrage_1.montantChargeFixe)(1.5) }],
                    explication: "Ton investissement qualité est perçu par le marché : tes ventes premium décollent. " +
                        "Ton effort a trouvé son public.",
                },
            ],
            pedagogie: "Premium : tu investis maintenant pour monétiser plus tard. " +
                "Il faut une trésorerie suffisante pour tenir le délai entre la dépense et le retour.",
        },
    ],
    obligatoire: true,
};
// ─── EXPORT DU CATALOGUE V2 ─────────────────────────────────
/**
 * Mini-catalogue de démo pour la Vague 2. 5 défis couvrant
 * l'arc émotionnel T1→T5 en durée 6.
 *
 * Les IDs sont stables : une partie qui mémorise un arc avec ces
 * IDs pourra être rechargée tant qu'ils existent dans le catalogue.
 */
exports.CATALOGUE_V2 = [
    OBSERVATION_T1,
    OBSERVATION_T2,
    DEFI_T3_MARCHE,
    PALIER_T3_POSITIONNEMENT,
];
/** Indexation par ID pour lookup O(1) lors de la résolution d'un arc. */
exports.CATALOGUE_V2_INDEX = Object.fromEntries(exports.CATALOGUE_V2.map((d) => [d.id, d]));
//# sourceMappingURL=catalogue-v2.js.map