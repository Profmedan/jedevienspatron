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
exports.verifierEquilibreComptable = verifierEquilibreComptable;
exports.appliquerRessourcesPreparation = appliquerRessourcesPreparation;
exports.appliquerAchatMarchandises = appliquerAchatMarchandises;
exports.appliquerRealisationMetier = appliquerRealisationMetier;
exports.appliquerAvancementCreances = appliquerAvancementCreances;
exports.calculerCoutCommerciaux = calculerCoutCommerciaux;
exports.appliquerPaiementCommerciaux = appliquerPaiementCommerciaux;
exports.licencierCommercial = licencierCommercial;
exports.appliquerCarteClient = appliquerCarteClient;
exports.appliquerEffetsRecurrents = appliquerEffetsRecurrents;
exports.appliquerSpecialiteEntreprise = appliquerSpecialiteEntreprise;
exports.genererClientsSpecialite = genererClientsSpecialite;
exports.appliquerClotureTrimestre = appliquerClotureTrimestre;
exports.obtenirCarteRecrutement = obtenirCarteRecrutement;
exports.tirerCartesDecision = tirerCartesDecision;
exports.acheterCarteDecision = acheterCarteDecision;
exports.investirCartePersonnelle = investirCartePersonnelle;
exports.vendreImmobilisation = vendreImmobilisation;
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
/** Crée une closure push(poste, delta, explication, extras?) pour tracker les modifications */
function makePush(joueur, modifications) {
    return (poste, delta, explication, extras) => {
        const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, poste, delta);
        modifications.push({
            joueurId: joueur.id,
            poste,
            ancienneValeur,
            nouvelleValeur,
            explication,
            ...extras,
        });
    };
}
/**
 * B9-D : cible un actif PRÉCIS par son nom exact (pas par catégorie) et
 * applique un delta. Utile quand plusieurs actifs partagent la même
 * catégorie `stocks` (ex. Belvaux avec « Matière première » et « Produits
 * finis ») et qu'on veut pousser sur l'un sans toucher l'autre.
 *
 * Le poste enregistré dans la modification est `stocks` (ou la catégorie
 * de l'actif ciblé) pour que la lecture CR/Bilan reste cohérente.
 *
 * Retourne `true` si l'actif a été trouvé et modifié, `false` sinon
 * (l'appelant peut alors décider de fallback ou de lever une erreur).
 */
function mutateActifByName(joueur, modifications, nomActif, delta, explication) {
    const actif = joueur.bilan.actifs.find((a) => a.nom === nomActif);
    if (!actif)
        return false;
    const ancienneValeur = actif.valeur;
    // Pas de plancher à 0 pour la trésorerie (peut passer en découvert),
    // mais les stocks et en-cours doivent rester ≥ 0.
    const categorie = actif.categorie;
    const nouvelleValeur = categorie === "tresorerie"
        ? ancienneValeur + delta
        : Math.max(0, ancienneValeur + delta);
    actif.valeur = nouvelleValeur;
    // Cast nécessaire : `PosteActif.categorie` inclut "creances" (legacy)
    // qui n'est pas dans `EffetCarte["poste"]`. En pratique on ne cible
    // jamais une ligne de créance via ce helper (les créances sont gérées
    // par `creancesPlus1`/`creancesPlus2` comme postes scalaires du Bilan).
    modifications.push({
        joueurId: joueur.id,
        poste: categorie,
        ancienneValeur,
        nouvelleValeur,
        explication,
    });
    return true;
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
            ? bilanActifs.find((a) => a.nom === types_1.NOM_IMMOBILISATIONS_AUTRES)
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
    // Poste introuvable — log + erreur pour détecter les typos/IDs invalides en dev et prod
    console.error(`[GameEngine] appliquerDeltaPoste — poste inconnu: "${poste}"`, {
        joueurId: joueur.id,
        pseudo: joueur.pseudo,
        delta,
        postesCharges: Object.keys(joueur.compteResultat.charges),
        postesProduits: Object.keys(joueur.compteResultat.produits),
    });
    throw new Error(`[GameEngine] Poste inconnu : "${poste}". Vérifiez l'ID dans types.ts ou cartes.ts.`);
}
// ─── CRÉATION DE L'ÉTAT INITIAL ──────────────────────────────
function creerJoueur(id, pseudo, nomEntreprise, customTemplates) {
    // Cherche d'abord dans les templates custom, puis dans les défauts
    const template = customTemplates?.find((e) => e.nom === nomEntreprise) ??
        entreprises_1.ENTREPRISES.find((e) => e.nom === nomEntreprise);
    if (!template)
        throw new Error(`Entreprise inconnue : ${nomEntreprise}`);
    const bilan = creerBilanVierge();
    // Actifs avec catégories — B9-D : reconnaissance élargie pour les noms
    // polymorphes (matière première, produits finis, marchandises, en-cours).
    const STOCK_KEYWORDS = ["stock", "matière", "produits finis", "marchandise", "en-cours", "en cours"];
    const estLigneStock = (nom) => {
        const n = nom.toLowerCase();
        return STOCK_KEYWORDS.some((kw) => n.includes(kw));
    };
    bilan.actifs = template.actifs.map((a) => ({
        nom: a.nom,
        valeur: a.valeur,
        categorie: a.nom.toLowerCase().includes("trésorerie")
            ? "tresorerie"
            : estLigneStock(a.nom)
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
            // B9-C : mode économique cloné depuis le template. Si un template
            // custom n'en fournit pas, on retombe sur "négoce" (le modèle le plus
            // proche du comportement historique uniforme).
            modeEconomique: template.modeEconomique ?? "négoce",
            ...(template.reducDelaiPaiement ? { reducDelaiPaiement: true } : {}),
            ...(template.clientGratuitParTour ? { clientGratuitParTour: true } : {}),
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
            const base = comJunior ? [{ ...comJunior, id: `${comJunior.id}-init-${_nextCommercialId++}` }] : [];
            return [...base, ...(template.cartesLogistiquesDepart ?? [])];
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
        piochePersonnelle: template.cartesLogistiquesDisponibles ?? [],
    };
}
function initialiserJeu(joueursDefs, nbToursMax = 12, // 6 = session courte, 8 = standard, 12 = complet (3 exercices)
customTemplates) {
    const joueurs = joueursDefs.map((def, i) => creerJoueur(i, def.pseudo, def.nomEntreprise, customTemplates));
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
// ─── ÉTAPE 7 (B9) — sous-passe 1/3 : Charges fixes + remboursement emprunt + amortissements ──
// NOTE : la fonction `appliquerEtape0` garde son nom historique mais est
// appelée lors de la CLÔTURE (B9 étape 7), pas au début du trimestre.
function appliquerEtape0(etat, joueurIdx) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    const push = makePush(joueur, modifications);
    // 0. Agios bancaires sur découvert (AVANT remboursement)
    // Agios = 10% du découvert, arrondi à la centaine supérieure — prélevés sur la trésorerie.
    // Si la trésorerie est insuffisante, elle tombe en négatif → découvert généré automatiquement.
    if (joueur.bilan.decouvert > 0) {
        const agios = Math.ceil(joueur.bilan.decouvert * types_1.TAUX_AGIOS / 100) * 100;
        push("chargesInteret", agios, `Agios bancaires : 10% de ton découvert de ${joueur.bilan.decouvert} € = ${agios} € — prélevés sur ta trésorerie`);
        push("tresorerie", -agios, `Agios bancaires débités de ta trésorerie (-${agios} €) — si elle est insuffisante, tu bascules en découvert`);
    }
    // 0b. Intérêts annuels sur emprunt (tous les 4 trimestres = 1 fois/an)
    // Intérêt = taux × capital, arrondi à la centaine supérieure — sans minimum artificiel.
    const empruntsPoste = joueur.bilan.passifs.find((p) => p.categorie === "emprunts");
    if (empruntsPoste && empruntsPoste.valeur > 0 && etat.tourActuel % types_1.INTERET_EMPRUNT_FREQUENCE === 1) {
        const interetEmprunt = Math.ceil(empruntsPoste.valeur * types_1.TAUX_INTERET_ANNUEL / 100 / 100) * 100;
        push("chargesInteret", interetEmprunt, `Intérêts annuels sur emprunt de ${empruntsPoste.valeur} € : ${types_1.TAUX_INTERET_ANNUEL}% = ${interetEmprunt} € — la banque facture ses intérêts une fois par an`);
        push("tresorerie", -interetEmprunt, `Paiement des intérêts d'emprunt : -${interetEmprunt} € sur ta trésorerie`);
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
            item.valeur = Math.max(0, item.valeur - types_1.AMORTISSEMENT_PAR_BIEN);
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
/**
 * Vérifie l'invariant comptable ACTIF = PASSIF + RÉSULTAT après chaque étape.
 * En développement, log un avertissement si l'équilibre est rompu (tolérance ±1€ pour arrondis).
 * Ne lève pas d'erreur pour ne pas bloquer le jeu en production.
 */
function verifierEquilibreComptable(joueur, contexte) {
    const totalActif = (0, calculators_1.getTotalActif)(joueur);
    const totalPassif = (0, calculators_1.getTotalPassif)(joueur);
    const resultatNet = (0, calculators_1.getResultatNet)(joueur);
    const ecart = Math.abs(totalActif - (totalPassif + resultatNet));
    if (ecart > 1) {
        console.warn(`[GameEngine] Déséquilibre comptable après ${contexte} — Joueur ${joueur.id} (${joueur.pseudo})`, {
            totalActif,
            totalPassif,
            resultatNet,
            ecart,
            attendu: `Actif (${totalActif}) = Passif (${totalPassif}) + Résultat (${resultatNet})`,
        });
    }
}
// ─── ÉTAPE 2 (B9) : Ressources & préparation — polymorphe par modeEconomique ─
// B9-C : la fonction publique `appliquerRessourcesPreparation` route vers
// 4 implémentations distinctes selon `joueur.entreprise.modeEconomique`.
// Chaque branche respecte la partie double : 1 débit + 1 crédit de montants
// égaux. La contrepartie (crédit) est toujours `tresorerie` (comptant) ou
// `dettes` fournisseurs (à crédit) — choisi par l'utilisateur via l'UI.
//
// Mode       | Débit                  | Narration
// -----------|------------------------|-------------------------------------
// production | stocks                 | Achat matière première Belvaux
// négoce     | stocks                 | Réassort marchandises Azura
// logistique | servicesExterieurs     | Préparation tournée Véloce (carburant, péages, sous-traitance)
// conseil    | chargesPersonnel       | Staffing / cadrage mission Synergia
/** Branche "production" — Manufacture Belvaux : achat de matière première. */
function appliquerRessourcesBelvaux(etat, joueurIdx, quantite, modePaiement) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    if (quantite <= 0)
        return { succes: true, modifications };
    const push = makePush(joueur, modifications);
    const montant = quantite * types_1.PRIX_UNITAIRE_MARCHANDISE;
    // DÉBIT : Stocks — ciblage précis "Matière première Belvaux" via pushByName
    // (B9-D) pour ne pas polluer les Produits finis. Fallback sur la catégorie
    // "stocks" générique si la ligne nommée n'existe pas (template custom).
    const cibleMatiere = mutateActifByName(joueur, modifications, "Matière première Belvaux", montant, `Achat de ${quantite} unité(s) de matière première Belvaux (+${montant} €)`);
    if (!cibleMatiere) {
        push("stocks", montant, `Achat de ${quantite} unité(s) de matière première Belvaux (${montant} €)`);
    }
    // CRÉDIT : trésorerie (comptant) ou dettes fournisseurs (à crédit)
    if (modePaiement === "tresorerie") {
        push("tresorerie", -montant, `Paiement comptant : −${montant} €`);
    }
    else {
        push("dettes", montant, `Achat matière à crédit : dette fournisseur +${montant} €`);
    }
    return { succes: true, modifications };
}
/** Branche "négoce" — Azura Commerce : réassort de marchandises. */
function appliquerRessourcesAzura(etat, joueurIdx, quantite, modePaiement) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    if (quantite <= 0)
        return { succes: true, modifications };
    const push = makePush(joueur, modifications);
    const montant = quantite * types_1.PRIX_UNITAIRE_MARCHANDISE;
    // DÉBIT 37 Stocks de marchandises
    push("stocks", montant, `Réassort de ${quantite} unité(s) de marchandises Azura (${montant} €)`);
    if (modePaiement === "tresorerie") {
        push("tresorerie", -montant, `Paiement comptant : −${montant} €`);
    }
    else {
        push("dettes", montant, `Réassort à crédit : dette fournisseur +${montant} €`);
    }
    return { succes: true, modifications };
}
/** Branche "logistique" — Véloce Transports : préparation de tournée (pas de stock, charges externes). */
function appliquerRessourcesVeloce(etat, joueurIdx, quantite, modePaiement) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    if (quantite <= 0)
        return { succes: true, modifications };
    const push = makePush(joueur, modifications);
    const montant = quantite * types_1.PRIX_UNITAIRE_MARCHANDISE;
    // DÉBIT 61 Services extérieurs — carburant, péages, sous-traitance transport
    push("servicesExterieurs", montant, `Préparation de ${quantite} tournée(s) Véloce — carburant, péages, sous-traitance (${montant} €)`);
    if (modePaiement === "tresorerie") {
        push("tresorerie", -montant, `Paiement comptant : −${montant} €`);
    }
    else {
        push("dettes", montant, `Préparation à crédit : dette fournisseur +${montant} €`);
    }
    return { succes: true, modifications };
}
/** Branche "conseil" — Synergia Lab : staffing et cadrage de mission. */
function appliquerRessourcesSynergia(etat, joueurIdx, quantite, modePaiement) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    if (quantite <= 0)
        return { succes: true, modifications };
    const push = makePush(joueur, modifications);
    const montant = quantite * types_1.PRIX_UNITAIRE_MARCHANDISE;
    // DÉBIT 64 Charges de personnel — heures d'experts affectées au cadrage
    push("chargesPersonnel", montant, `Staffing et cadrage de ${quantite} mission(s) Synergia — heures expertes affectées (${montant} €)`);
    if (modePaiement === "tresorerie") {
        push("tresorerie", -montant, `Paiement comptant : −${montant} €`);
    }
    else {
        push("dettes", montant, `Staffing à crédit : dette fournisseur +${montant} €`);
    }
    return { succes: true, modifications };
}
/**
 * Dispatcher polymorphe B9-C — route vers la branche adaptée au modèle
 * économique du joueur actif. Invariant : chaque branche applique une
 * écriture double parfaitement équilibrée (1 débit = 1 crédit = `montant`).
 */
function appliquerRessourcesPreparation(etat, joueurIdx, quantite, modePaiement) {
    const mode = etat.joueurs[joueurIdx].entreprise.modeEconomique;
    switch (mode) {
        case "production": return appliquerRessourcesBelvaux(etat, joueurIdx, quantite, modePaiement);
        case "négoce": return appliquerRessourcesAzura(etat, joueurIdx, quantite, modePaiement);
        case "logistique": return appliquerRessourcesVeloce(etat, joueurIdx, quantite, modePaiement);
        case "conseil": return appliquerRessourcesSynergia(etat, joueurIdx, quantite, modePaiement);
        default: {
            // Cas impossible en pratique — garde-fou si une entreprise custom
            // arrive sans modeEconomique valide.
            const _exhaustive = mode;
            void _exhaustive;
            return appliquerRessourcesAzura(etat, joueurIdx, quantite, modePaiement);
        }
    }
}
/**
 * @deprecated B9-C : alias rétro-compatible vers `appliquerRessourcesPreparation`.
 * À retirer quand tous les call sites auront migré.
 */
function appliquerAchatMarchandises(etat, joueurIdx, quantite, modePaiement) {
    return appliquerRessourcesPreparation(etat, joueurIdx, quantite, modePaiement);
}
// ─── ÉTAPE 3 (B9) : Réalisation métier — polymorphe par modeEconomique ───────
// B9-D : la fonction publique `appliquerRealisationMetier` route vers
// 4 implémentations distinctes selon `joueur.entreprise.modeEconomique`.
// Chaque branche respecte la partie double : les écritures s'équilibrent
// parfaitement par acte (1 débit = 1 crédit).
//
// Mode       | Écritures                                 | Narration
// -----------|-------------------------------------------|----------------------------
// production | 2 actes : (a) consommation matière +M     | Belvaux fabrique des produits
//            |            C stocks[Matière] −M           | finis à partir de sa matière
//            |           (b) stocks[Produits finis] +V   | première. Production stockée
//            |            C productionStockee +V         | visible en produit CR.
// négoce     | 1 acte  : D servicesExterieurs +300       | Azura paie son canal fixe
//            |           C tresorerie (ou dettes) −300   | (animation / plateforme).
// logistique | 2 actes : (a) D chargesPersonnel +E       | Véloce exécute sa tournée :
//            |            C tresorerie −E                | heures chauffeur consommées,
//            |           (b) D stocks[En-cours Véloce]+V | en-cours de production de
//            |            C productionStockee +V         | services constaté (PCG 34).
// conseil    | 2 actes : (a) D chargesPersonnel +R       | Synergia livre la mission :
//            |            C tresorerie −R                | heures expertes consommées,
//            |           (b) D stocks[En-cours Mission]+V| en-cours de production de
//            |            C productionStockee +V         | services constaté.
/** Branche "production" — Belvaux fabrique à partir de sa matière première. */
function appliquerRealisationBelvaux(etat, joueurIdx, quantite) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    if (quantite <= 0)
        return { succes: true, modifications };
    const montant = quantite * types_1.PRIX_UNITAIRE_MARCHANDISE;
    // Garde-fou : ne pas transformer plus que la matière disponible
    const matiere = joueur.bilan.actifs.find((a) => a.nom === "Matière première Belvaux");
    if (!matiere) {
        return { succes: false, messageErreur: "Ligne « Matière première Belvaux » introuvable au bilan — vérifiez la configuration de l'entreprise.", modifications: [] };
    }
    if (matiere.valeur < montant) {
        return {
            succes: false,
            messageErreur: `Matière première insuffisante : ${matiere.valeur} € disponibles, ${montant} € demandés. Achetez davantage de matière à l'étape 2 avant de produire.`,
            modifications: [],
        };
    }
    const push = makePush(joueur, modifications);
    // ── Acte (a) : consommation de la matière première ────────────────────
    // D achats +M : la matière consommée devient une charge d'exploitation
    push("achats", montant, `Consommation de ${quantite} unité(s) de matière première Belvaux (+${montant} €)`);
    // C stocks (Matière première) −M : le stock de matière diminue
    mutateActifByName(joueur, modifications, "Matière première Belvaux", -montant, `Sortie de ${quantite} unité(s) de matière première Belvaux (−${montant} €)`);
    // ── Acte (b) : constat de la production stockée ───────────────────────
    // D stocks (Produits finis) +V : les produits fabriqués entrent au stock
    mutateActifByName(joueur, modifications, "Produits finis Belvaux", montant, `Production de ${quantite} unité(s) de produits finis Belvaux (+${montant} €)`);
    // C productionStockee +V : compte de produit contre-partie (classe 7)
    push("productionStockee", montant, `Production stockée Belvaux constatée au compte de résultat (+${montant} €)`);
    return { succes: true, modifications };
}
/** Branche "négoce" — Azura paie son coût de canal fixe. */
function appliquerRealisationAzura(etat, joueurIdx, modePaiement = "tresorerie") {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    const push = makePush(joueur, modifications);
    const montant = types_1.COUT_CANAL_AZURA_PAR_TOUR;
    // DÉBIT : services extérieurs (canal / distribution / PLV)
    push("servicesExterieurs", montant, `Coût de canal Azura — animation, plateforme e-commerce, PLV (+${montant} €)`);
    // CRÉDIT : trésorerie ou dettes
    if (modePaiement === "tresorerie") {
        push("tresorerie", -montant, `Paiement comptant du canal : −${montant} €`);
    }
    else {
        push("dettes", montant, `Canal à crédit : dette fournisseur +${montant} €`);
    }
    return { succes: true, modifications };
}
/** Branche "logistique" — Véloce exécute ses tournées et constate l'en-cours. */
function appliquerRealisationVeloce(etat, joueurIdx, quantite, modePaiement) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    if (quantite <= 0)
        return { succes: true, modifications };
    const montant = quantite * types_1.PRIX_UNITAIRE_MARCHANDISE;
    const push = makePush(joueur, modifications);
    // ── Acte (a) : charges d'exécution (heures chauffeur) ─────────────────
    push("chargesPersonnel", montant, `Heures chauffeur exécution ${quantite} tournée(s) Véloce (+${montant} €)`);
    if (modePaiement === "tresorerie") {
        push("tresorerie", -montant, `Paiement comptant heures chauffeur : −${montant} €`);
    }
    else {
        push("dettes", montant, `Heures chauffeur à crédit : dette fournisseur +${montant} €`);
    }
    // ── Acte (b) : constat de l'en-cours de production de services ────────
    // Réutilisation de `productionStockee` comme compte produit contre-partie
    // (simplification PCG — voir B9-A.1 décision 7).
    mutateActifByName(joueur, modifications, "En-cours tournée Véloce", montant, `En-cours de production — ${quantite} tournée(s) Véloce non facturée(s) (+${montant} €)`);
    push("productionStockee", montant, `Production de services Véloce constatée en en-cours (+${montant} €)`);
    return { succes: true, modifications };
}
/** Branche "conseil" — Synergia réalise ses missions et constate l'en-cours. */
function appliquerRealisationSynergia(etat, joueurIdx, quantite, modePaiement) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    if (quantite <= 0)
        return { succes: true, modifications };
    const montant = quantite * types_1.PRIX_UNITAIRE_MARCHANDISE;
    const push = makePush(joueur, modifications);
    // ── Acte (a) : charges d'exécution (heures expertes) ──────────────────
    push("chargesPersonnel", montant, `Heures expertes réalisation ${quantite} mission(s) Synergia (+${montant} €)`);
    if (modePaiement === "tresorerie") {
        push("tresorerie", -montant, `Paiement comptant heures expertes : −${montant} €`);
    }
    else {
        push("dettes", montant, `Heures expertes à crédit : dette fournisseur +${montant} €`);
    }
    // ── Acte (b) : constat de l'en-cours de production de services ────────
    mutateActifByName(joueur, modifications, "En-cours mission Synergia", montant, `En-cours de production — ${quantite} mission(s) Synergia non facturée(s) (+${montant} €)`);
    push("productionStockee", montant, `Production de services Synergia constatée en en-cours (+${montant} €)`);
    return { succes: true, modifications };
}
/**
 * Dispatcher polymorphe B9-D — route vers la branche adaptée au modèle
 * économique du joueur actif pour l'étape 3 REALISATION_METIER.
 *
 * Paramètres :
 *   - `quantite` : nombre d'unités à réaliser (transformer / exécuter / livrer).
 *     Ignoré pour Azura (montant fixe 300 €).
 *   - `modePaiement` : "tresorerie" (comptant) ou "dettes" (à crédit).
 *     Pour les 4 métiers sauf Belvaux qui consomme sa propre matière
 *     (pas de flux de trésorerie à cette étape — le flux sort à l'étape 2
 *     lors de l'achat de matière).
 *
 * Invariant : chaque branche applique des écritures parfaitement
 * équilibrées en partie double.
 */
function appliquerRealisationMetier(etat, joueurIdx, quantite, modePaiement = "tresorerie") {
    const mode = etat.joueurs[joueurIdx].entreprise.modeEconomique;
    switch (mode) {
        case "production": return appliquerRealisationBelvaux(etat, joueurIdx, quantite);
        case "négoce": return appliquerRealisationAzura(etat, joueurIdx, modePaiement);
        case "logistique": return appliquerRealisationVeloce(etat, joueurIdx, quantite, modePaiement);
        case "conseil": return appliquerRealisationSynergia(etat, joueurIdx, quantite, modePaiement);
        default: {
            const _exhaustive = mode;
            void _exhaustive;
            // Fallback : comportement négoce (coût canal fixe) — couvre les
            // templates custom sans modeEconomique défini.
            return appliquerRealisationAzura(etat, joueurIdx, modePaiement);
        }
    }
}
// ─── ÉTAPE 0 (B9) : Encaissements — avancement des créances ──────────────────
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
// ─── ÉTAPE 1 (B9) : Développement commercial — paiement des commerciaux ──────
function calculerCoutCommerciaux(joueur) {
    // Les cartes commerciales ont effetsRecurrents: [] (vide par design).
    // Le salaire récurrent est identique au coût d'embauche initial,
    // stocké dans effetsImmédiats.chargesPersonnel.
    return joueur.cartesActives
        .filter((c) => c.categorie === "commercial")
        .reduce((sum, c) => {
        const cout = c.effetsImmédiats
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
// ─── LICENCIEMENT D'UN COMMERCIAL ─────────────────────────────
/**
 * Licencie un commercial actif :
 *  - Indemnité = 1 trimestre de salaire → Charges exceptionnelles + Trésorerie
 *  - Retire le commercial de cartesActives (arrêt des salaires et des clients)
 *
 * Pédagogie : l'indemnité passe en Charges exceptionnelles (cpt 671),
 * pas en Charges de personnel (641) — distinction importante en comptabilité française.
 */
function licencierCommercial(etat, joueurIdx, carteId) {
    const joueur = etat.joueurs[joueurIdx];
    const commercial = joueur.cartesActives.find((c) => c.id === carteId && c.categorie === "commercial");
    if (!commercial) {
        return { succes: false, messageErreur: "Commercial introuvable.", modifications: [] };
    }
    // Indemnité = absolu du premier effet trésorerie dans effetsImmédiats (= 1 trimestre de salaire)
    const indemniteBrut = commercial.effetsImmédiats
        .filter((e) => e.poste === "tresorerie")
        .reduce((s, e) => s + Math.abs(e.delta), 0);
    // Si la carte ne stocke pas d'effetsImmédiats (cartes clonées sans coût), fallback sur effetsRecurrents
    const indemnite = indemniteBrut > 0
        ? indemniteBrut
        : commercial.effetsRecurrents
            .filter((e) => e.poste === "chargesPersonnel")
            .reduce((s, e) => s + Math.abs(e.delta), 0);
    const modifications = [];
    const push = makePush(joueur, modifications);
    if (indemnite > 0) {
        push("chargesExceptionnelles", indemnite, `Indemnité de licenciement — ${commercial.titre} : +${indemnite} charges exceptionnelles`);
        push("tresorerie", -indemnite, `Indemnité de licenciement — ${commercial.titre} : -${indemnite} trésorerie`);
    }
    // Retrait du commercial de cartesActives
    joueur.cartesActives = joueur.cartesActives.filter((c) => c.id !== carteId);
    return { succes: true, modifications };
}
// ─── ÉTAPE 4 (B9) : Facturation & ventes — traitement carte Client ───────────
// Polymorphie future B9-E : cette fonction deviendra un dispatch par
// `modeEconomique` (production / négoce / services) pour générer les
// bonnes écritures de vente et d'extourne stock/en-cours.
/**
 * Comptabilisation en 4 écritures (partie double complète).
 * Ordre narratif optimisé pour la pédagogie :
 *   Acte 1 — Encaissement (Trésorerie/Créances) : le plus tangible
 *   Acte 2 — Chiffre d'affaires (Ventes)         : la contrepartie produit
 *   Acte 3 — Livraison (Stocks −1 unité)          : la sortie physique
 *   Acte 4 — Coût de revient (Achats/CMV)         : la contrepartie charge
 *
 * Chaque modification porte un saleGroupId + saleClientLabel + saleActIndex
 * pour permettre à l'UI de regrouper et narrer les ventes.
 */
function appliquerCarteClient(etat, joueurIdx, carteClient, saleGroupIndex) {
    const joueur = etat.joueurs[joueurIdx];
    const modifications = [];
    const push = makePush(joueur, modifications);
    const stocks = (0, calculators_1.getTotalStocks)(joueur);
    if (stocks < types_1.PRIX_UNITAIRE_MARCHANDISE) {
        return {
            succes: false,
            messageErreur: "Stock insuffisant ! Vous devez acheter des marchandises (étape 1) avant de vendre.",
            modifications,
        };
    }
    const montant = carteClient.montantVentes;
    const groupId = `vente-${saleGroupIndex ?? 0}`;
    const clientLabel = carteClient.titre;
    // Spécialité Logistique (reducDelaiPaiement) : livraison rapide → délai réduit de 1
    const delaiEffectif = joueur.entreprise.reducDelaiPaiement
        ? Math.max(0, carteClient.delaiPaiement - 1)
        : carteClient.delaiPaiement;
    // ACTE 1 — Encaissement selon délai (le plus tangible)
    if (delaiEffectif === 0) {
        const label = carteClient.delaiPaiement > 0 && joueur.entreprise.reducDelaiPaiement
            ? `🚀 Livraison rapide — encaissement accéléré : +${montant} € en caisse`
            : `Le client paie comptant : +${montant} € en caisse`;
        push("tresorerie", montant, label, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 1 });
    }
    else if (delaiEffectif === 1) {
        const label = carteClient.delaiPaiement > 1 && joueur.entreprise.reducDelaiPaiement
            ? `🚀 Livraison rapide — créance accélérée : +${montant} € (C+1 au lieu de C+2)`
            : `Le client paiera dans 1 trimestre : +${montant} € en créance C+1`;
        push("creancesPlus1", montant, label, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 1 });
    }
    else {
        push("creancesPlus2", montant, `Le client paiera dans 2 trimestres : +${montant} € en créance C+2`, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 1 });
    }
    // ACTE 2 — Chiffre d'affaires (Ventes)
    push("ventes", montant, `Vente enregistrée au chiffre d'affaires : +${montant} €`, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 2 });
    // ACTE 3 — Sortie du stock (livraison de la marchandise)
    push("stocks", -types_1.PRIX_UNITAIRE_MARCHANDISE, `Marchandise livrée au client : −${types_1.PRIX_UNITAIRE_MARCHANDISE} € de stock`, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 3 });
    // ACTE 4 — Coût de la marchandise vendue (CMV)
    push("achats", types_1.PRIX_UNITAIRE_MARCHANDISE, `Coût de la marchandise vendue (CMV) enregistré en charges : +${types_1.PRIX_UNITAIRE_MARCHANDISE} €`, { saleGroupId: groupId, saleClientLabel: clientLabel, saleActIndex: 4 });
    return { succes: true, modifications };
}
// ─── ÉTAPE 7 (B9) — sous-passe 2/3 : Effets récurrents des cartes Décision ──
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
// ─── ÉTAPE 7 (B9) — sous-passe 3/3 : Spécialité d'entreprise (effets passifs) ──
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
    if (joueur.entreprise.clientGratuitParTour) {
        const clientParticulier = cartes_1.CARTES_CLIENTS.find((c) => c.id === "client-particulier");
        return clientParticulier ? [clientParticulier] : [];
    }
    return [];
}
// ─── ÉTAPE 7 (B9) : Clôture du trimestre ────────────────────
/**
 * Étape de clôture du trimestre (cycle B9, index 7 — première passe).
 *
 * Fusionne les trois blocs qui, dans l'ancien cycle à 9 étapes, étaient
 * dispersés entre l'étape 0 (charges fixes + amortissements + remboursement
 * emprunt + intérêts) et l'étape 5 (effets récurrents des cartes actives +
 * spécialité d'entreprise). Pédagogiquement, « activité métier puis clôture » :
 * on a encaissé, développé le commercial, préparé, réalisé, facturé,
 * décidé, subi un événement → on ferme la porte en appliquant charges
 * fixes, amortissements, effets récurrents, remboursement d'emprunt et
 * intérêts. Puis, dans la même étape 7 côté UI, la seconde passe
 * (`verifierFinTour`) vérifie l'équilibre et déclenche la transition
 * de fin de tour.
 *
 * Retourne un ResultatAction unique dont `modifications` concatène
 * celles des trois fonctions sous-jacentes, dans l'ordre d'application.
 */
function appliquerClotureTrimestre(etat, joueurIdx) {
    const modifications = [];
    // 1. Charges fixes + amortissements + remboursement emprunt (+ intérêts T3+)
    const rEtape0 = appliquerEtape0(etat, joueurIdx);
    if (!rEtape0.succes)
        return rEtape0;
    modifications.push(...rEtape0.modifications);
    // 2. Effets récurrents des cartes Décision actives (abonnements, maintenance…)
    const rEffets = appliquerEffetsRecurrents(etat, joueurIdx);
    if (!rEffets.succes)
        return rEffets;
    modifications.push(...rEffets.modifications);
    // 3. Spécialité d'entreprise (productionStockée Belvaux, produitsFinanciers Synergia…)
    const rSpec = appliquerSpecialiteEntreprise(etat, joueurIdx);
    if (!rSpec.succes)
        return rSpec;
    modifications.push(...rSpec.modifications);
    return { succes: true, modifications };
}
// ─── ÉTAPE 5 (B9) : Recrutement garanti (toujours disponible, sous-phase 5a) ────
/**
 * Retourne les cartes commerciales que le joueur peut encore recruter.
 * Aucun commercial n'est distribué automatiquement — le joueur choisit librement.
 * Disponible tout au long du jeu : les 3 types (Junior, Senior, Directrice) restent
 * recrutables à chaque tour, y compris en doublon (plusieurs juniors possibles, etc.).
 */
function obtenirCarteRecrutement(_etat, _joueurIdx) {
    return cartes_1.CARTES_DECISION.filter((c) => c.categorie === "commercial");
}
// ─── ÉTAPE 5 (B9) : Pioche Décision (hors commerciaux, sous-phase 5b) ───
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
    // Ajouter la carte aux actives (spread pour ne pas muter le tableau original)
    joueur.cartesActives = [...joueur.cartesActives, carte];
    // Carte Formation : bonus d'1 client grand compte immédiat
    if (carte.id === CARTE_IDS.FORMATION) {
        const clientGC = cartes_1.CARTES_CLIENTS.find((c) => c.id === "client-grand-compte");
        if (clientGC)
            joueur.clientsATrait = [...joueur.clientsATrait, clientGC];
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
// ─── INVESTISSEMENT MINI-DECK LOGISTIQUE ─────────────────────
/**
 * Investit dans une carte du mini-deck logistique personnel du joueur.
 * Vérifie le prérequis, retire la carte de piochePersonnelle, applique les effets immédiats.
 */
function investirCartePersonnelle(etat, joueurIdx, carteId) {
    const joueur = etat.joueurs[joueurIdx];
    const carteIdx = joueur.piochePersonnelle.findIndex((c) => c.id === carteId);
    if (carteIdx === -1) {
        return {
            succes: false,
            messageErreur: `Carte "${carteId}" introuvable dans votre mini-deck.`,
            modifications: [],
        };
    }
    const carte = joueur.piochePersonnelle[carteIdx];
    // Vérification du prérequis
    if (carte.prerequis && !joueur.cartesActives.some((c) => c.id === carte.prerequis)) {
        const carteRequise = joueur.piochePersonnelle.find((c) => c.id === carte.prerequis);
        const nomRequis = carteRequise?.titre ?? carte.prerequis;
        return {
            succes: false,
            messageErreur: `Prérequis non atteint : investissez d'abord dans "${nomRequis}".`,
            modifications: [],
        };
    }
    const modifications = [];
    // Appliquer les effets immédiats
    for (const effet of carte.effetsImmédiats) {
        const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, effet.poste, effet.delta);
        modifications.push({
            joueurId: joueur.id,
            poste: effet.poste,
            ancienneValeur,
            nouvelleValeur,
            explication: `${carte.titre} — investissement logistique`,
        });
    }
    // Retirer de piochePersonnelle, ajouter à cartesActives (spread pour immutabilité)
    joueur.piochePersonnelle = joueur.piochePersonnelle.filter((_, i) => i !== carteIdx);
    joueur.cartesActives = [...joueur.cartesActives, carte];
    return { succes: true, modifications };
}
// ─── VENTE D'IMMOBILISATION (CESSION D'OCCASION) ─────────────
/**
 * Vend une immobilisation nommée du bilan du joueur (cession d'occasion).
 * Calcule la plus ou moins-value comptable et l'enregistre au compte de résultat.
 *
 * Règles comptables (PCG simplifié) :
 *  - Le bien "Autres Immobilisations" est un poste agrégé non vendable individuellement.
 *  - VNC = valeur nette comptable = valeur actuelle au bilan
 *    (les amortissements la décrémentent directement à chaque tour).
 *  - Vente autorisée même si VNC = 0 (bien totalement amorti).
 *  - Plus-value (prixCession > VNC) → +revenusExceptionnels (produit exceptionnel).
 *  - Moins-value (prixCession < VNC) → +chargesExceptionnelles (charge exceptionnelle).
 *  - Le bien est retiré définitivement du bilan après cession.
 *
 * @param prixCession Prix de vente accepté par l'apprenant (proposé par défaut à 80% VNC).
 */
function vendreImmobilisation(etat, joueurIdx, nomImmo, prixCession) {
    const joueur = etat.joueurs[joueurIdx];
    if (nomImmo === "Autres Immobilisations") {
        return {
            succes: false,
            messageErreur: `"Autres Immobilisations" est un poste agrégé et ne peut pas être vendu individuellement.`,
            modifications: [],
        };
    }
    if (prixCession < 0 || !Number.isFinite(prixCession)) {
        return {
            succes: false,
            messageErreur: `Le prix de cession doit être un nombre positif ou nul.`,
            modifications: [],
        };
    }
    const idx = joueur.bilan.actifs.findIndex((a) => a.nom === nomImmo && a.categorie === "immobilisations");
    if (idx === -1) {
        return {
            succes: false,
            messageErreur: `Immobilisation "${nomImmo}" introuvable au bilan.`,
            modifications: [],
        };
    }
    const actif = joueur.bilan.actifs[idx];
    const vnc = actif.valeur;
    const plusValue = prixCession - vnc;
    const modifications = [];
    // 1. Encaissement du prix de cession en trésorerie (DÉBIT 512 Banque)
    const tresoActif = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie");
    if (tresoActif) {
        const old = tresoActif.valeur;
        tresoActif.valeur = old + prixCession;
        modifications.push({
            joueurId: joueur.id,
            poste: "tresorerie",
            ancienneValeur: old,
            nouvelleValeur: tresoActif.valeur,
            explication: `Cession ${nomImmo} : encaissement ${prixCession} €`,
        });
    }
    // 2. Sortie du bien du bilan (CRÉDIT 21x Immobilisations — VNC effacée)
    modifications.push({
        joueurId: joueur.id,
        poste: "immobilisations",
        ancienneValeur: vnc,
        nouvelleValeur: 0,
        explication: `Cession ${nomImmo} : sortie du bilan, VNC ${vnc} € effacée`,
    });
    joueur.bilan.actifs.splice(idx, 1);
    // 3. Plus ou moins-value comptable au compte de résultat
    if (plusValue > 0) {
        const old = joueur.compteResultat.produits.revenusExceptionnels;
        joueur.compteResultat.produits.revenusExceptionnels = old + plusValue;
        modifications.push({
            joueurId: joueur.id,
            poste: "revenusExceptionnels",
            ancienneValeur: old,
            nouvelleValeur: joueur.compteResultat.produits.revenusExceptionnels,
            explication: `Plus-value de cession ${nomImmo} : +${plusValue} € (prix ${prixCession} − VNC ${vnc})`,
        });
    }
    else if (plusValue < 0) {
        const moinsValue = Math.abs(plusValue);
        const old = joueur.compteResultat.charges.chargesExceptionnelles;
        joueur.compteResultat.charges.chargesExceptionnelles = old + moinsValue;
        modifications.push({
            joueurId: joueur.id,
            poste: "chargesExceptionnelles",
            ancienneValeur: old,
            nouvelleValeur: joueur.compteResultat.charges.chargesExceptionnelles,
            explication: `Moins-value de cession ${nomImmo} : +${moinsValue} € en charges exceptionnelles (prix ${prixCession} < VNC ${vnc})`,
        });
    }
    return { succes: true, modifications };
}
// ─── ÉTAPE 6 (B9) : Carte Événement ──────────────────────────
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
    // Proportionnalisation : si tauxActif défini, le delta réel = sign(delta) × arrondi(totalActif × taux)
    // Plancher de 500 € pour que l'événement reste perceptible même sur un petit bilan.
    const totalActif = (0, calculators_1.getTotalActif)(joueur);
    for (const effet of carte.effets) {
        let delta = effet.delta;
        if (carte.tauxActif !== undefined) {
            const montant = Math.max(500, Math.round((totalActif * carte.tauxActif) / 100) * 100);
            delta = Math.sign(effet.delta) * montant;
        }
        const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(joueur, effet.poste, delta);
        modifications.push({
            joueurId: joueur.id, poste: effet.poste,
            ancienneValeur, nouvelleValeur,
            explication: `${carte.titre} : ${delta > 0 ? "+" : ""}${delta} ${effet.poste}`,
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
    // Écriture en partie double :
    //   DÉBIT  661 Charges d'intérêts    → réduit le Résultat net (PASSIF−)
    //   CRÉDIT 5191 Découvert bancaire   → augmente le découvert  (PASSIF+)
    // Les deux effets se compensent : l'équilibre ACTIF = PASSIF + RÉSULTAT est préservé.
    if (joueur.bilan.decouvert > types_1.DECOUVERT_MAX) {
        const pénalité = joueur.bilan.decouvert - types_1.DECOUVERT_MAX;
        appliquerDeltaPoste(joueur, "chargesInteret", pénalité); // DÉBIT charges
        appliquerDeltaPoste(joueur, "decouvert", pénalité); // CRÉDIT découvert (contrepartie)
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
    // B9 : cycle à 8 étapes (0..7). CLOTURE_BILAN = 7 est la dernière.
    const maxEtape = 7;
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
    const resultat = (0, calculators_1.scorerDemandePret)(joueur, montant, etat.tourActuel);
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
            const nb = carte.nbClientsParTour ?? 1;
            for (let i = 0; i < nb; i++) {
                clients.push(clientCarte);
            }
        }
    }
    return clients;
}
//# sourceMappingURL=engine.js.map