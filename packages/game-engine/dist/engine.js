"use strict";
// ============================================================
// JEDEVIENSPATRON — Moteur de jeu principal (GameEngine)
// Logique 100% pure TypeScript, sans DOM, sans React
// Source : JEDEVIENSPATRON_v2.html — Pierre Médan
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.creerJoueur = creerJoueur;
exports.initialiserJeu = initialiserJeu;
exports.appliquerEtape0 = appliquerEtape0;
exports.appliquerAchatMarchandises = appliquerAchatMarchandises;
exports.appliquerAvancementCreances = appliquerAvancementCreances;
exports.calculerCoutCommerciaux = calculerCoutCommerciaux;
exports.appliquerPaiementCommerciaux = appliquerPaiementCommerciaux;
exports.appliquerCarteClient = appliquerCarteClient;
exports.appliquerEffetsRecurrents = appliquerEffetsRecurrents;
exports.appliquerSpecialiteEntreprise = appliquerSpecialiteEntreprise;
exports.genererClientsSpecialite = genererClientsSpecialite;
exports.obtenirCarteRecrutement = obtenirCarteRecrutement;
exports.tirerCartesDecision = tirerCartesDecision;
exports.acheterCarteDecision = acheterCarteDecision;
exports.appliquerCarteEvenement = appliquerCarteEvenement;
exports.verifierFinTour = verifierFinTour;
exports.cloturerAnnee = cloturerAnnee;
exports.avancerEtape = avancerEtape;
exports.demanderEmprunt = demanderEmprunt;
exports.calculerCapaciteLogistique = calculerCapaciteLogistique;
exports.genererClientsParCommerciaux = genererClientsParCommerciaux;
const types_1 = require("./types");
const entreprises_1 = require("./data/entreprises");
const cartes_1 = require("./data/cartes");
const calculators_1 = require("./calculators");
// ─── COUNTER FOR DETERMINISTIC IDS ──────────────────────────
let _nextCommercialId = 0;
// ─── CONSTANTES IDs CARTES ──────────────────────────────────
/** Constantes centralisées pour les IDs de cartes — évite les string literals éparpillés */
const CARTE_IDS = {
    COMMERCIAL_JUNIOR: "commercial-junior-dec",
    AFFACTURAGE: "affacturage",
    FORMATION: "formation",
    REMBOURSEMENT_ANTICIPE: "remboursement-anticipe",
    LEVEE_DE_FONDS: "levee-de-fonds",
    ASSURANCE_PREVOYANCE: "assurance-prevoyance",
};
// ─── HELPERS INTERNES ────────────────────────────────────────
function melangerTableau(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function creerBilanVierge() {
    return {
        actifs: [],
        passifs: [],
        decouvert: 0,
        creancesPlus1: 0,
        creancesPlus2: 0,
        dettes: 0,
        dettesD2: 0,
        dettesFiscales: 0,
    };
}
function creerCompteResultatVierge() {
    return {
        charges: {
            achats: 0,
            servicesExterieurs: 0,
            impotsTaxes: 0,
            chargesInteret: 0,
            chargesPersonnel: 0,
            chargesExceptionnelles: 0,
            dotationsAmortissements: 0,
        },
        produits: {
            ventes: 0,
            productionStockee: 0,
            produitsFinanciers: 0,
            revenusExceptionnels: 0,
        },
    };
}
/** Crée une closure push(poste, delta, explication) pour tracker les modifications */
function makePush(joueur, modifications) {
    return (poste, delta, explication) => {
        const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, poste, delta);
        modifications.push({
            joueurId: joueur.id,
            poste,
            ancienneValeur,
            nouvelleValeur,
            explication,
        });
    };
}
/** Applique un delta sur le poste d'un joueur et retourne l'ancienne valeur */
function appliquerDeltaPoste(joueur, poste, delta) {
    const charges = joueur.compteResultat.charges;
    const produits = joueur.compteResultat.produits;
    const bilanActifs = joueur.bilan.actifs;
    const bilanPassifs = joueur.bilan.passifs;
    const bilan = joueur.bilan;
    // Compte de résultat — charges
    if (poste in charges) {
        const old = charges[poste];
        charges[poste] = Math.max(0, old + delta);
        return { ancienneValeur: old, nouvelleValeur: charges[poste] };
    }
    // Compte de résultat — produits
    if (poste in produits) {
        const old = produits[poste];
        produits[poste] = Math.max(0, old + delta); // Plancher 0 : un produit ne peut pas être négatif
        return { ancienneValeur: old, nouvelleValeur: produits[poste] };
    }
    // Bilan — postes simples (decouvert, creancesPlus1, creancesPlus2, dettes, dettesFiscales)
    if (poste in bilan && typeof bilan[poste] === "number") {
        const old = bilan[poste];
        bilan[poste] = Math.max(0, old + delta);
        return { ancienneValeur: old, nouvelleValeur: bilan[poste] };
    }
    // Bilan — actifs (chercher par catégorie)
    // Cas spécial immobilisations : les investissements (delta > 0) → "Autres Immobilisations"
    // pour ne pas altérer les biens existants (Entrepôt, Camion, etc.)
    if (poste === "immobilisations") {
        let targetActif = delta > 0
            ? bilanActifs.find((a) => a.nom === "Autres Immobilisations")
            : undefined;
        // Fallback : premier item immobilisations disponible
        if (!targetActif)
            targetActif = bilanActifs.find((a) => a.categorie === "immobilisations");
        if (targetActif) {
            const old = targetActif.valeur;
            targetActif.valeur = Math.max(0, old + delta);
            return { ancienneValeur: old, nouvelleValeur: targetActif.valeur };
        }
    }
    const actif = bilanActifs.find((a) => a.categorie === poste);
    if (actif) {
        const old = actif.valeur;
        actif.valeur = poste === "tresorerie" ? old + delta : Math.max(0, old + delta);
        return { ancienneValeur: old, nouvelleValeur: actif.valeur };
    }
    // Bilan — passifs (chercher par catégorie)
    const passif = bilanPassifs.find((p) => p.categorie === poste);
    if (passif) {
        const old = passif.valeur;
        passif.valeur = Math.max(0, old + delta);
        return { ancienneValeur: old, nouvelleValeur: passif.valeur };
    }
    // Poste introuvable — erreur pour détecter les typos/IDs invalides
    throw new Error(`[GameEngine] Poste inconnu : "${poste}". Vérifiez l'ID dans types.ts ou cartes.ts.`);
}
// ─── CRÉATION DE L'ÉTAT INITIAL ──────────────────────────────
function creerJoueur(id, pseudo, nomEntreprise) {
    const template = entreprises_1.ENTREPRISES.find((e) => e.nom === nomEntreprise);
    if (!template)
        throw new Error(`Entreprise inconnue : ${nomEntreprise}`);
    const bilan = creerBilanVierge();
    // Actifs avec catégories
    bilan.actifs = template.actifs.map((a) => ({
        nom: a.nom,
        valeur: a.valeur,
        categorie: a.nom.toLowerCase().includes("trésorerie")
            ? "tresorerie"
            : a.nom.toLowerCase().includes("stock")
                ? "stocks"
                : "immobilisations",
    }));
    // Passifs avec catégories
    bilan.passifs = template.passifs.map((p) => ({
        nom: p.nom,
        valeur: p.valeur,
        categorie: p.nom.toLowerCase().includes("capitaux") || p.nom.toLowerCase().includes("propres")
            ? "capitaux"
            : p.nom.toLowerCase().includes("emprunt")
                ? "emprunts"
                : "dettes",
    }));
    return {
        id,
        pseudo,
        entreprise: {
            nom: template.nom,
            couleur: template.couleur,
            icon: template.icon,
            type: template.type,
            specialite: template.specialite,
            ref: {
                actifs: template.actifs.map((a) => a.valeur),
                passifs: template.passifs.map((p) => p.valeur),
            },
        },
        bilan,
        compteResultat: creerCompteResultatVierge(),
        // Commercial Junior par défaut : -1 chargesPersonnel, -1 tresorerie, +2 clients Particuliers/tour
        cartesActives: (() => {
            const comJunior = cartes_1.CARTES_DECISION.find((c) => c.id === CARTE_IDS.COMMERCIAL_JUNIOR);
            return comJunior ? [{ ...comJunior, id: `${comJunior.id}-init-${_nextCommercialId++}` }] : [];
        })(),
        // 2 clients Particuliers pré-chargés dès T1 : l'entreprise avait déjà
        // quelques clients avant le début du jeu — le joueur voit immédiatement
        // une vente et son écriture sans attendre d'avoir recruté un commercial.
        clientsATrait: (() => {
            const cp = cartes_1.CARTES_CLIENTS.find((c) => c.id === "client-particulier");
            return cp ? [cp, cp] : [];
        })(),
        elimine: false,
        publicitéCeTour: false,
        clientsPerdusCeTour: 0,
    };
}
function initialiserJeu(joueursDefs, nbToursMax = 12 // 6 = session courte, 8 = standard, 12 = complet (3 exercices)
) {
    const joueurs = joueursDefs.map((def, i) => creerJoueur(i, def.pseudo, def.nomEntreprise));
    return {
        phase: "playing",
        tourActuel: 1,
        etapeTour: 0,
        joueurActif: 0,
        joueurs,
        nbJoueurs: joueurs.length,
        nbToursMax, // configurable : 4, 6 ou 8 trimestres
        piocheDecision: melangerTableau(cartes_1.CARTES_DECISION.filter((c) => c.categorie !== "commercial") // les commerciaux passent par obtenirCarteRecrutement
        ),
        piocheEvenements: melangerTableau([...cartes_1.CARTES_EVENEMENTS]),
        historiqueEvenements: [],
        messages: [
            `Bienvenue dans JEDEVIENSPATRON ! Trimestre 1/${nbToursMax} — 3 exercices comptables de ${Math.round(nbToursMax / 3)} trimestres chacun. Étape 0 : Charges fixes et amortissements.`,
        ],
    };
}
// ─── ÉTAPE 0 : Remboursements obligatoires + charges fixes + amortissements ──
function appliquerEtape0(etat, joueurIdx) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    const push = makePush(joueur, modifications);
    // 0. Agios bancaires sur découvert (AVANT remboursement : les intérêts s'ajoutent au découvert)
    if (joueur.bilan.decouvert > 0) {
        // Agios = 10% du découvert, arrondi au millier supérieur, minimum 1 000 €
        const agios = Math.max(1000, Math.ceil(joueur.bilan.decouvert * 0.10 / 1000) * 1000);
        push("chargesInteret", agios, `Agios bancaires : 10% de ton découvert de ${joueur.bilan.decouvert} € = ${agios} € d'intérêts — la banque te pénalise pour ta trésorerie négative`);
        push("decouvert", agios, `Agios ajoutés au découvert bancaire (+${agios} €) — tu dois rembourser davantage`);
    }
    // 0b. Intérêts annuels sur emprunt (tous les 4 trimestres = 1 fois/an)
    const empruntsPoste = joueur.bilan.passifs.find((p) => p.categorie === "emprunts");
    if (empruntsPoste && empruntsPoste.valeur > 0 && etat.tourActuel % types_1.INTERET_EMPRUNT_FREQUENCE === 1) {
        // Intérêt simplifié : 5% arrondi au millier supérieur (minimum 1 000 €)
        const interetEmprunt = Math.max(1000, Math.ceil(empruntsPoste.valeur * types_1.TAUX_INTERET_ANNUEL / 100));
        push("chargesInteret", interetEmprunt, `Intérêts annuels sur emprunt de ${empruntsPoste.valeur} : ${types_1.TAUX_INTERET_ANNUEL}% = ${interetEmprunt} — la banque facture ses intérêts une fois par an`);
        push("tresorerie", -interetEmprunt, `Paiement des intérêts d'emprunt : -${interetEmprunt} Trésorerie`);
    }
    // 1. Remboursement découvert PROGRESSIF (max REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR par trimestre)
    if (joueur.bilan.decouvert > 0) {
        const tresoDisponible = (0, calculators_1.getTresorerie)(joueur);
        const remboursementSouhaite = Math.min(joueur.bilan.decouvert, types_1.REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR);
        const remboursementEffectif = Math.min(remboursementSouhaite, Math.max(0, tresoDisponible));
        if (remboursementEffectif > 0) {
            push("tresorerie", -remboursementEffectif, `Remboursement progressif du découvert : -${remboursementEffectif} (max ${types_1.REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR}/trimestre, reste ${joueur.bilan.decouvert - remboursementEffectif} après remboursement)`);
            push("decouvert", -remboursementEffectif, `Découvert réduit de ${remboursementEffectif} — remboursement progressif pour ne pas asphyxier ta trésorerie`);
        }
        else {
            // Pas assez de trésorerie pour rembourser → message pédagogique
            modifications.push({
                joueurId: joueur.id,
                poste: "decouvert",
                ancienneValeur: joueur.bilan.decouvert,
                nouvelleValeur: joueur.bilan.decouvert,
                explication: `Découvert maintenu à ${joueur.bilan.decouvert} — trésorerie insuffisante pour rembourser ce trimestre. Attention aux agios !`,
            });
        }
    }
    // 2. Paiement dettes fournisseurs D+1
    if (joueur.bilan.dettes > 0) {
        push("tresorerie", -joueur.bilan.dettes, "Paiement dettes fournisseurs");
        push("dettes", -joueur.bilan.dettes, "Dettes fournisseurs soldées");
    }
    // 2b. Avancement dettes fournisseurs D+2 → D+1
    if (joueur.bilan.dettesD2 > 0) {
        const montantD2 = joueur.bilan.dettesD2;
        push("dettes", montantD2, `Dettes D+2 devenues D+1 : ${montantD2} € à payer au prochain trimestre`);
        push("dettesD2", -montantD2, `Dettes D+2 soldées (transférées en D+1)`);
    }
    // 3. Paiement dettes fiscales D+1
    if (joueur.bilan.dettesFiscales > 0) {
        push("tresorerie", -joueur.bilan.dettesFiscales, "Paiement dettes fiscales");
        push("dettesFiscales", -joueur.bilan.dettesFiscales, "Dettes fiscales soldées");
    }
    // 4. Remboursement emprunt (-1 000 € par tour si emprunts > 0)
    const emprunts = joueur.bilan.passifs.find((p) => p.categorie === "emprunts");
    if (emprunts && emprunts.valeur >= types_1.REMBOURSEMENT_EMPRUNT_PAR_TOUR) {
        push("tresorerie", -types_1.REMBOURSEMENT_EMPRUNT_PAR_TOUR, `Remboursement annuité emprunt : -${types_1.REMBOURSEMENT_EMPRUNT_PAR_TOUR} € par trimestre`);
        push("emprunts", -types_1.REMBOURSEMENT_EMPRUNT_PAR_TOUR, `Emprunt réduit de ${types_1.REMBOURSEMENT_EMPRUNT_PAR_TOUR} € — remboursement régulier`);
    }
    // 5. Charges fixes obligatoires (+2 Services ext., -2 Trésorerie)
    push("servicesExterieurs", types_1.CHARGES_FIXES_PAR_TOUR, `Charges fixes trimestrielles (loyer, électricité…) : +${types_1.CHARGES_FIXES_PAR_TOUR}`);
    push("tresorerie", -types_1.CHARGES_FIXES_PAR_TOUR, `Paiement charges fixes : -${types_1.CHARGES_FIXES_PAR_TOUR} Trésorerie`);
    // 6. Amortissement de chaque bien immobilisé (-1 par bien, Dotations = total)
    // Règle PCG : DÉBIT Dotations aux amortissements / CRÉDIT Immobilisations nettes
    // La dotation doit être ÉGALE à la somme des amortissements appliqués à chaque bien.
    // Post-amortissement (PCG) : les biens dont valeur nette = 0 restent au bilan (VNC = 0)
    // et continuent de générer leurs effets (clients, entretien) — seule la dotation s'arrête.
    const immoAmortissables = joueur.bilan.actifs.filter((a) => a.categorie === "immobilisations" && a.valeur > 0);
    if (immoAmortissables.length > 0) {
        const totalAvant = immoAmortissables.reduce((s, a) => s + a.valeur, 0);
        // Appliquer -1 000 € directement à chaque bien (mutation directe pour éviter .find() répété)
        immoAmortissables.forEach((item) => {
            item.valeur = Math.max(0, item.valeur - 1000);
        });
        const totalApres = immoAmortissables.reduce((s, a) => s + a.valeur, 0);
        const totalDotation = totalAvant - totalApres; // = nombre de biens amortis
        // Enregistrer UNE modification agrégée pour les immobilisations (total avant/après)
        modifications.push({
            joueurId: joueur.id,
            poste: "immobilisations",
            ancienneValeur: totalAvant,
            nouvelleValeur: totalApres,
            explication: `Amortissement de ${immoAmortissables.length} bien(s) immobilisé(s) : −1 000 € par bien, valeur nette ${totalAvant} → ${totalApres}`,
        });
        // Enregistrer la dotation = total des amortissements (règle de la partie double)
        push("dotationsAmortissements", totalDotation, `Dotation aux amortissements : +${totalDotation} (1 000 € par bien, ${immoAmortissables.length} bien(s) amortissable(s))`);
    }
    // Vérifier si trésorerie négative → découvert automatique
    const treso = (0, calculators_1.getTresorerie)(joueur);
    if (treso < 0) {
        const montantDecouvert = Math.abs(treso);
        push("tresorerie", montantDecouvert, "Trésorerie ramenée à 0");
        push("decouvert", montantDecouvert, `Découvert bancaire automatique — ta trésorerie était négative, la banque couvre le déficit mais tu paies des agios (+${montantDecouvert})`);
    }
    // Vérification immédiate : si le découvert dépasse le maximum → faillite
    if (joueur.bilan.decouvert > types_1.DECOUVERT_MAX) {
        joueur.elimine = true;
        modifications.push({
            joueurId: joueur.id,
            poste: "decouvert",
            ancienneValeur: joueur.bilan.decouvert,
            nouvelleValeur: joueur.bilan.decouvert,
            explication: `⛔ FAILLITE — Découvert bancaire (${joueur.bilan.decouvert} €) dépasse le maximum autorisé (${types_1.DECOUVERT_MAX} €). Cessation de paiement.`,
        });
    }
    return { succes: true, modifications };
}
// ─── ÉTAPE 1 : Achats de marchandises (optionnel) ────────────
function appliquerAchatMarchandises(etat, joueurIdx, quantite, modePaiement) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    if (quantite <= 0)
        return { succes: true, modifications };
    const push = makePush(joueur, modifications);
    // Stocks +quantite
    push("stocks", quantite, `Achat de ${quantite} unité(s) de marchandises`);
    // Paiement
    if (modePaiement === "tresorerie") {
        push("tresorerie", -quantite, "Paiement immédiat des achats");
    }
    else {
        push("dettes", quantite, "Achat à crédit : dette fournisseur D+1");
    }
    return { succes: true, modifications };
}
// ─── ÉTAPE 2 : Avancement des créances ──────────────────────
function appliquerAvancementCreances(etat, joueurIdx) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    const push = makePush(joueur, modifications);
    // Affacturage actif : toutes créances → Trésorerie immédiatement
    const hasAffacturage = joueur.cartesActives.some((c) => c.id === CARTE_IDS.AFFACTURAGE);
    if (hasAffacturage) {
        if (joueur.bilan.creancesPlus1 > 0) {
            push("tresorerie", joueur.bilan.creancesPlus1, "Affacturage : créances C+1 encaissées");
            push("creancesPlus1", -joueur.bilan.creancesPlus1, "Créances C+1 cédées au factor");
        }
        if (joueur.bilan.creancesPlus2 > 0) {
            push("tresorerie", joueur.bilan.creancesPlus2, "Affacturage : créances C+2 encaissées");
            push("creancesPlus2", -joueur.bilan.creancesPlus2, "Créances C+2 cédées au factor");
        }
    }
    else {
        // C+1 → Trésorerie (encaissement)
        if (joueur.bilan.creancesPlus1 > 0) {
            push("tresorerie", joueur.bilan.creancesPlus1, "Encaissement créances clients arrivées à échéance");
            push("creancesPlus1", -joueur.bilan.creancesPlus1, "Créances C+1 encaissées");
        }
        // C+2 → C+1 (un trimestre de plus)
        if (joueur.bilan.creancesPlus2 > 0) {
            push("creancesPlus1", joueur.bilan.creancesPlus2, "Avancement créances C+2 → C+1");
            push("creancesPlus2", -joueur.bilan.creancesPlus2, "Créances C+2 avancées d'un trimestre");
        }
    }
    // Si aucune créance en attente, ajouter un message pédagogique
    if (joueur.bilan.creancesPlus1 === 0 && joueur.bilan.creancesPlus2 === 0) {
        modifications.push({
            joueurId: joueur.id,
            poste: "creancesPlus1",
            ancienneValeur: 0,
            nouvelleValeur: 0,
            explication: "Aucune créance en attente ce trimestre. Avec des clients TPE ou Grands Comptes, tu verras ici les encaissements différés.",
        });
    }
    return { succes: true, modifications };
}
// ─── ÉTAPE 3 : Paiement des commerciaux ──────────────────────
function calculerCoutCommerciaux(joueur) {
    return joueur.cartesActives
        .filter((c) => c.categorie === "commercial")
        .reduce((sum, c) => {
        const cout = c.effetsRecurrents
            .filter((e) => e.poste === "chargesPersonnel")
            .reduce((s, e) => s + Math.abs(e.delta), 0);
        return sum + cout;
    }, 0);
}
function appliquerPaiementCommerciaux(etat, joueurIdx) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    const cout = calculerCoutCommerciaux(joueur);
    if (cout === 0)
        return { succes: true, modifications };
    const push = makePush(joueur, modifications);
    push("chargesPersonnel", cout, `Salaires commerciaux : +${cout} charges de personnel`);
    push("tresorerie", -cout, `Paiement salaires : -${cout} trésorerie`);
    return { succes: true, modifications };
}
// ─── ÉTAPE 4 : Traitement carte Client ───────────────────────
/**
 * Comptabilisation en 4 écritures (partie double complète) :
 * 1. Ventes +X (Produit)
 * 2. Stocks -1 (Actif)
 * 3. CMV/Achats +1 (Charge)
 * 4a. Trésorerie +X (si client particulier, paiement immédiat)
 * 4b. Créances C+1 +X (si client TPE)
 * 4c. Créances C+2 +X (si client grand compte)
 */
function appliquerCarteClient(etat, joueurIdx, carteClient) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    const push = makePush(joueur, modifications);
    const stocks = (0, calculators_1.getTotalStocks)(joueur);
    if (stocks < 1) {
        return {
            succes: false,
            messageErreur: "Stock insuffisant ! Vous devez acheter des marchandises (étape 1) avant de vendre.",
            modifications,
        };
    }
    const montant = carteClient.montantVentes;
    // 1. Produit : Ventes
    push("ventes", montant, `Vente enregistrée : +${montant} Ventes`);
    // 2. Actif : Stocks diminuent
    push("stocks", -1, "Sortie de stock : -1 marchandise livrée");
    // 3. Charge : CMV (coût de la marchandise vendue)
    push("achats", 1, "Coût de la marchandise vendue (CMV) : +1 Achats");
    // 4. Encaissement selon délai
    // Spécialité Véloce Transports (Logistique) : livraison rapide → délai réduit de 1
    const delaiEffectif = joueur.entreprise.nom === "Véloce Transports"
        ? Math.max(0, carteClient.delaiPaiement - 1)
        : carteClient.delaiPaiement;
    if (delaiEffectif === 0) {
        const label = carteClient.delaiPaiement > 0 && joueur.entreprise.nom === "Véloce Transports"
            ? `🚀 Livraison rapide — encaissement accéléré : +${montant} Trésorerie`
            : `Encaissement immédiat : +${montant} Trésorerie`;
        push("tresorerie", montant, label);
    }
    else if (delaiEffectif === 1) {
        const label = carteClient.delaiPaiement > 1 && joueur.entreprise.nom === "Véloce Transports"
            ? `🚀 Livraison rapide — créance accélérée : +${montant} C+1 (au lieu de C+2)`
            : `Créance client TPE enregistrée : +${montant} C+1`;
        push("creancesPlus1", montant, label);
    }
    else {
        push("creancesPlus2", montant, `Créance grand compte enregistrée : +${montant} C+2`);
    }
    return { succes: true, modifications };
}
// ─── ÉTAPE 5 : Effets récurrents des cartes Décision ────────
function appliquerEffetsRecurrents(etat, joueurIdx) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    for (const carte of joueur.cartesActives) {
        if (carte.categorie === "commercial")
            continue; // les commerciaux sont traités étape 3
        for (const effet of carte.effetsRecurrents) {
            const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, effet.poste, effet.delta);
            modifications.push({
                joueurId: joueur.id,
                poste: effet.poste,
                ancienneValeur,
                nouvelleValeur,
                explication: `${carte.titre} — effet récurrent`,
            });
        }
    }
    return { succes: true, modifications };
}
// ─── ÉTAPE 5bis : Spécialité d'entreprise (effets passifs) ────
/**
 * Applique les effets passifs liés à la spécialité de l'entreprise.
 * Appelé à chaque tour, à l'étape 5, après les effets récurrents des cartes.
 *
 * ── Effets par entreprise ──────────────────────────────────────
 * • Manufacture Belvaux (Production) : +1 productionStockée, +1 stocks
 * • Véloce Transports (Logistique)   : délai encaissement -1 (géré dans appliquerCarteClient)
 * • Azura Commerce (Commerce)        : +1 client Particulier automatique (ajouté à clientsATrait)
 * • Synergia Lab (Innovation)        : +1 produitsFinanciers, +1 trésorerie
 */
function appliquerSpecialiteEntreprise(etat, joueurIdx) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    // 1. Effets passifs déclarés dans le template (Orange, Verte)
    const template = entreprises_1.ENTREPRISES.find((e) => e.nom === joueur.entreprise.nom);
    if (template?.effetsPassifs) {
        for (const effet of template.effetsPassifs) {
            const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, effet.poste, effet.delta);
            modifications.push({
                joueurId: joueur.id,
                poste: effet.poste,
                ancienneValeur,
                nouvelleValeur,
                explication: `${template.specialite} — spécialité ${template.type}`,
            });
        }
    }
    // Note : Véloce Transports (délai -1) est géré directement dans appliquerCarteClient()
    // Note : Azura Commerce (+1 client) est géré dans genererClientsSpecialite() à l'étape 3
    return { succes: true, modifications };
}
/**
 * Génère les clients bonus liés à la spécialité d'entreprise.
 * Appelé à l'étape 3, en même temps que genererClientsParCommerciaux.
 *
 * • Azura Commerce : +1 client Particulier automatique par tour
 */
function genererClientsSpecialite(joueur) {
    if (joueur.entreprise.nom === "Azura Commerce") {
        const clientParticulier = cartes_1.CARTES_CLIENTS.find((c) => c.id === "client-particulier");
        return clientParticulier ? [clientParticulier] : [];
    }
    return [];
}
// ─── ÉTAPE 6 : Recrutement garanti (toujours disponible) ────
/**
 * Retourne les cartes commerciales que le joueur peut encore recruter.
 * Aucun commercial n'est distribué automatiquement — le joueur choisit librement.
 * Disponible tout au long du jeu : les 3 types (Junior, Senior, Directrice) restent
 * recrutables à chaque tour, y compris en doublon (plusieurs juniors possibles, etc.).
 */
function obtenirCarteRecrutement(_etat, _joueurIdx) {
    return cartes_1.CARTES_DECISION.filter((c) => c.categorie === "commercial");
}
// ─── ÉTAPE 6 : Pioche Décision (hors commerciaux) ───────────
/**
 * Tire nb cartes de la pioche (les cartes commerciales sont exclues :
 * elles passent par obtenirCarteRecrutement ci-dessus).
 * Le nombre minimum garanti est 4 cartes.
 */
function tirerCartesDecision(etat, nb = 3) {
    // Recharger la pioche AVANT le tirage si insuffisante
    if (etat.piocheDecision.length < nb) {
        etat.piocheDecision.push(...melangerTableau(cartes_1.CARTES_DECISION.filter((c) => c.categorie !== "commercial")));
    }
    return etat.piocheDecision.splice(0, nb);
}
function acheterCarteDecision(etat, joueurIdx, carte) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    // Garde anti-doublon uniquement pour les cartes non-commerciales
    // Les commerciaux peuvent être recrutés plusieurs fois (plusieurs juniors, etc.)
    if (carte.categorie !== "commercial" && joueur.cartesActives.some((a) => a.id === carte.id)) {
        return {
            succes: false,
            messageErreur: `Vous avez déjà la carte "${carte.titre}" active.`,
            modifications: [],
        };
    }
    // Pour les commerciaux, cloner la carte avec un ID unique afin de tracer chaque recrue
    if (carte.categorie === "commercial") {
        carte = { ...carte, id: `${carte.id}-${_nextCommercialId++}` };
    }
    // Appliquer les effets immédiats
    for (const effet of carte.effetsImmédiats) {
        const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, effet.poste, effet.delta);
        modifications.push({
            joueurId: joueur.id,
            poste: effet.poste,
            ancienneValeur,
            nouvelleValeur,
            explication: `${carte.titre} — effet immédiat`,
        });
    }
    // Ajouter la carte aux actives
    joueur.cartesActives.push(carte);
    // Carte Formation : bonus d'1 client grand compte immédiat
    if (carte.id === CARTE_IDS.FORMATION) {
        const clientGC = cartes_1.CARTES_CLIENTS.find((c) => c.id === "client-grand-compte");
        if (clientGC)
            joueur.clientsATrait.push(clientGC);
    }
    // Remboursement anticipé : solder les emprunts restants
    if (carte.id === CARTE_IDS.REMBOURSEMENT_ANTICIPE) {
        const emprunts = joueur.bilan.passifs.find((p) => p.categorie === "emprunts");
        if (emprunts && emprunts.valeur > 0) {
            const { ancienneValeur: tresoAncienne, nouvelleValeur: tresoNouvelle } = appliquerDeltaPoste(joueur, "tresorerie", -emprunts.valeur);
            modifications.push({
                joueurId: joueur.id, poste: "tresorerie",
                ancienneValeur: tresoAncienne, nouvelleValeur: tresoNouvelle,
                explication: `Remboursement anticipé : trésorerie −${emprunts.valeur} (capital restant dû)`,
            });
            const { ancienneValeur: empruntAncien, nouvelleValeur: empruntNouveau } = appliquerDeltaPoste(joueur, "emprunts", -emprunts.valeur);
            modifications.push({
                joueurId: joueur.id, poste: "emprunts",
                ancienneValeur: empruntAncien, nouvelleValeur: empruntNouveau,
                explication: `Remboursement anticipé : dette financière soldée −${emprunts.valeur}`,
            });
        }
        // Retirer la carte (usage unique)
        joueur.cartesActives = joueur.cartesActives.filter((c) => c.id !== CARTE_IDS.REMBOURSEMENT_ANTICIPE);
    }
    // Levée de fonds : usage unique
    if (carte.id === CARTE_IDS.LEVEE_DE_FONDS) {
        joueur.cartesActives = joueur.cartesActives.filter((c) => c.id !== CARTE_IDS.LEVEE_DE_FONDS);
    }
    return { succes: true, modifications };
}
// ─── ÉTAPE 7 : Carte Événement ───────────────────────────────
function appliquerCarteEvenement(etat, joueurIdx, carte) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    // Assurance prévoyance annule les événements négatifs
    const hasAssurance = joueur.cartesActives.some((c) => c.id === CARTE_IDS.ASSURANCE_PREVOYANCE);
    const estNegatif = carte.effets.some((e) => e.delta < 0);
    if (hasAssurance && carte.annulableParAssurance && estNegatif) {
        modifications.push({
            joueurId: joueur.id,
            poste: "tresorerie",
            ancienneValeur: (0, calculators_1.getTresorerie)(joueur),
            nouvelleValeur: (0, calculators_1.getTresorerie)(joueur),
            explication: `${carte.titre} — ANNULÉ par l'Assurance Prévoyance 🛡️`,
        });
        etat.historiqueEvenements.push({ tour: etat.tourActuel, joueurId: joueur.id, carte });
        return { succes: true, modifications };
    }
    for (const effet of carte.effets) {
        const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, effet.poste, effet.delta);
        modifications.push({
            joueurId: joueur.id, poste: effet.poste,
            ancienneValeur, nouvelleValeur,
            explication: `${carte.titre} : ${effet.delta > 0 ? "+" : ""}${effet.delta} ${effet.poste}`,
        });
    }
    etat.historiqueEvenements.push({ tour: etat.tourActuel, joueurId: joueur.id, carte });
    return { succes: true, modifications };
}
function verifierFinTour(etat, joueurIdx) {
    const joueur = etat.joueurs[joueurIdx];
    const { equilibre, ecart } = (0, calculators_1.verifierEquilibre)(joueur);
    const { enFaillite, raison } = (0, calculators_1.verifierFaillite)(joueur);
    const score = (0, calculators_1.calculerScore)(joueur);
    // Découvert > DECOUVERT_MAX → pénalité d'intérêts bancaires
    // (enregistrée en Charges d'intérêt, prélevée sur la trésorerie du prochain tour via le découvert)
    if (joueur.bilan.decouvert > types_1.DECOUVERT_MAX) {
        const pénalité = joueur.bilan.decouvert - types_1.DECOUVERT_MAX;
        // CORRECTION BUG : la pénalité s'enregistre en Charges d'intérêt (CR)
        // et augmente le découvert (le joueur devra rembourser encore plus au prochain tour)
        // Note : c'est intentionnellement pénalisé pour pousser à résorber le découvert
        appliquerDeltaPoste(joueur, "chargesInteret", pénalité);
        // Pas de nouveau delta sur le découvert ici — il sera recalculé à l'étape 0 du prochain tour
    }
    if (enFaillite) {
        joueur.elimine = true;
    }
    return {
        equilibre,
        enFaillite,
        raisonFaillite: raison,
        score,
        ecartEquilibre: ecart,
        message: equilibre
            ? "✅ Bilan équilibré ! Vous maîtrisez la partie double."
            : `⚠️ Bilan déséquilibré de ${Math.abs(ecart).toFixed(0)} €. Vérifiez vos écritures.`,
    };
}
// ─── FIN D'ANNÉE (après 4 tours) ─────────────────────────────
//
// ⚠️ NOTE PÉDAGOGIQUE : le découvert bancaire n'est PAS remis à zéro en clôture annuelle.
// C'est un choix intentionnel : en comptabilité réelle, un découvert est une dette bancaire
// qui persiste tant qu'elle n'est pas remboursée. Les étudiants doivent comprendre que
// le découvert s'accumule d'un exercice à l'autre et génère des agios croissants.
function cloturerAnnee(etat) {
    for (const joueur of etat.joueurs) {
        if (joueur.elimine)
            continue;
        // Résultat net → Capitaux propres
        const resultatNet = Object.values(joueur.compteResultat.produits).reduce((s, v) => s + v, 0) -
            Object.values(joueur.compteResultat.charges).reduce((s, v) => s + v, 0);
        const capitaux = joueur.bilan.passifs.find((p) => p.categorie === "capitaux");
        if (capitaux)
            capitaux.valeur += resultatNet;
        // Réinitialiser compte de résultat
        joueur.compteResultat = creerCompteResultatVierge();
        // Clôture exercice : garder les commerciaux + investissements long terme actifs
        // Supprimer uniquement les cartes tactiques (usage court terme) et financement (usage unique)
        joueur.cartesActives = joueur.cartesActives.filter((c) => c.categorie !== "tactique" && c.categorie !== "financement");
        // Réinitialiser clients à traiter et clients perdus ce tour
        joueur.clientsATrait = [];
        joueur.clientsPerdusCeTour = 0;
    }
    etat.tourActuel = 1;
    etat.etapeTour = 0;
    etat.joueurActif = 0;
}
// ─── AVANCEMENT DU TOUR ─────────────────────────────────────
function avancerEtape(etat) {
    const maxEtape = 8;
    if (etat.etapeTour < maxEtape) {
        etat.etapeTour = (etat.etapeTour + 1);
    }
    else {
        // Fin du tour pour ce joueur — passer au joueur suivant
        etat.joueurActif++;
        if (etat.joueurActif >= etat.nbJoueurs) {
            // Fin du tour pour tous → incrémenter le tour
            etat.joueurActif = 0;
            etat.tourActuel++;
        }
        etat.etapeTour = 0;
    }
}
// ─── DEMANDE D'EMPRUNT BANCAIRE ──────────────────────────────
/**
 * Le banquier score la situation financière du joueur sur 100 points.
 * - Score >= 65 : accepté, taux standard 5%/an
 * - Score 50-64 : accepté avec taux majoré 8%/an
 * - Score < 50  : refusé
 *
 * Si le prêt est accordé, les fonds sont versés immédiatement :
 *   DÉBIT Trésorerie / CRÉDIT Emprunts
 */
function demanderEmprunt(etat, joueurIdx, montant) {
    const joueur = etat.joueurs[joueurIdx];
    const resultat = (0, calculators_1.scorerDemandePret)(joueur, montant);
    const modifications = [];
    if (!resultat.accepte) {
        return { resultat, modifications };
    }
    const push = makePush(joueur, modifications);
    const tauxLabel = resultat.tauxMajore ? "8%/an (taux majoré)" : "5%/an (taux standard)";
    push("tresorerie", montant, `Versement emprunt bancaire : +${montant} trésorerie`);
    push("emprunts", montant, `Nouvel emprunt bancaire de ${montant} — taux ${tauxLabel}`);
    return { resultat, modifications };
}
// ─── CAPACITÉ LOGISTIQUE ──────────────────────────────────────
/**
 * Calcule la capacité logistique maximale du joueur.
 * Formule : CAPACITE_BASE + somme des bonus des immobilisations actives
 *
 * Les immobilisations restent fonctionnelles même quand VNC = 0 (amortie).
 * On identifie les immobilisations via les cartes actives du joueur.
 */
function calculerCapaciteLogistique(joueur) {
    let capacite = types_1.CAPACITE_BASE;
    const nomEntreprise = joueur.entreprise.nom;
    for (const carte of joueur.cartesActives) {
        // Vérifier s'il existe un bonus spécifique à l'entreprise
        const bonusParEntreprise = types_1.CAPACITE_IMMOBILISATION_PAR_ENTREPRISE[carte.id];
        if (bonusParEntreprise && bonusParEntreprise[nomEntreprise] !== undefined) {
            capacite += bonusParEntreprise[nomEntreprise];
        }
        else {
            const bonus = types_1.CAPACITE_IMMOBILISATION[carte.id] ?? 0;
            capacite += bonus;
        }
    }
    return capacite;
}
// ─── PIOCHE CLIENTS (générée par les commerciaux) ───────────
function genererClientsParCommerciaux(joueur) {
    const clients = [];
    for (const carte of joueur.cartesActives) {
        if (!carte.clientParTour)
            continue;
        const clientCarte = cartes_1.CARTES_CLIENTS.find((c) => c.id === `client-${carte.clientParTour}`);
        if (clientCarte) {
            clients.push(clientCarte);
        }
    }
    return clients;
}
//# sourceMappingURL=engine.js.map