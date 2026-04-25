/**
 * Simulation T1-T6 pour les 4 entreprises avec le moteur réel.
 *
 * Comportement "joueur prudent par défaut" — adapté par mode :
 *  - production (Belvaux) : Commercial Junior offert + achète juste de quoi
 *    produire 2 unités/trim. Limité par stock PF à la facturation.
 *  - negoce (Azura) : Commercial Junior offert + carte marketplace n1 départ
 *    (capacité 8). Achète juste de quoi servir les clients du trim.
 *  - logistique (Véloce) : Commercial Junior offert. Préparation tournée
 *    300 € fixe à l'étape 2. Capacité = calculerCapaciteLogistique.
 *  - conseil (Synergia) : Commercial Junior offert + carte ERP n1 départ
 *    (capacité 8). Staffing 400 € fixe à l'étape 2. Effets passifs licences
 *    +1 000 € produits financiers / +1 000 € tréso à la clôture.
 *
 * Aucune carte décision supplémentaire, aucun événement.
 */

import {
  initialiserJeu,
  appliquerAvancementCreances,
  appliquerPaiementCommerciaux,
  appliquerAchatMarchandises,
  appliquerApprovisionnementVeloce,
  appliquerApprovisionnementSynergia,
  appliquerRealisationMetier,
  appliquerExtourneEnCours,
  appliquerCarteClient,
  appliquerClotureTrimestre,
  appliquerClotureExercice,
  finaliserClotureExercice,
  genererClientsParCommerciaux,
  genererClientsSpecialite,
  calculerCapaciteLogistique,
  estFinExercice,
  getTresorerie,
  getResultatNet,
  getTotalActif,
  getTotalPassif,
  ETAPES,
  type Joueur,
  type EtatJeu,
} from "../src/index";

type NomEntreprise = "Manufacture Belvaux" | "Azura Commerce" | "Véloce Transports" | "Synergia Lab";

function snapshot(j: Joueur, tag: string) {
  const tres = getTresorerie(j);
  const res = getResultatNet(j);
  const stocks = j.bilan.actifs
    .filter(a => a.categorie === "stocks")
    .reduce((s, a) => s + a.valeur, 0);
  const capitaux = j.bilan.passifs
    .filter(p => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
  const dettes = j.bilan.passifs
    .filter(p => p.categorie === "dettes")
    .reduce((s, p) => s + p.valeur, 0);
  const totA = getTotalActif(j);
  const totP = getTotalPassif(j);
  const eq = Math.abs(totA - totP) < 0.01 ? "✓" : `⚠${(totA - totP).toFixed(0)}`;
  console.log(
    `${tag.padEnd(28)} | tréso=${String(tres).padStart(6)} | stocks=${String(stocks).padStart(5)} | rés=${String(res).padStart(7)} | KP=${String(capitaux).padStart(6)} | dettes=${String(dettes).padStart(5)} | bilan ${eq}`,
  );
}

function simulate(nom: NomEntreprise) {
  console.log(`\n=== ${nom} — joueur prudent, 6 trimestres ===\n`);
  const etat: EtatJeu = initialiserJeu([{ pseudo: "Test", nomEntreprise: nom }], 6);
  const idx = 0;
  const j = etat.joueurs[idx];
  const mode = j.entreprise.modeleValeur?.mode ?? "negoce";

  snapshot(j, "T0 init");

  for (let tour = 1; tour <= 6; tour++) {
    // Étape 0 — Encaissements créances
    appliquerAvancementCreances(etat, idx);

    // Étape 1 — Paiement commerciaux + génération clients
    const newCommerciaux = genererClientsParCommerciaux(j);
    const newSpec = genererClientsSpecialite(j);
    j.clientsATrait = [...j.clientsATrait, ...newCommerciaux, ...newSpec];
    appliquerPaiementCommerciaux(etat, idx);

    // Étape 2 — Approvisionnement (par mode)
    if (mode === "production") {
      const mpVal = j.bilan.actifs.find(a => a.nom === "Stocks matières premières")?.valeur ?? 0;
      const mpUnites = Math.floor(mpVal / 1000);
      const aAcheter = Math.max(0, 2 - mpUnites);
      if (aAcheter > 0) appliquerAchatMarchandises(etat, idx, aAcheter, "tresorerie");
    } else if (mode === "negoce") {
      // Achète de quoi servir les clients attendus
      const stockVal = j.bilan.actifs.find(a => a.nom === "Stocks marchandises")?.valeur ?? 0;
      const stockUnites = Math.floor(stockVal / 1000);
      const besoin = j.clientsATrait.length;
      const aAcheter = Math.max(0, besoin - stockUnites);
      if (aAcheter > 0) appliquerAchatMarchandises(etat, idx, aAcheter, "tresorerie");
    } else if (mode === "logistique") {
      appliquerApprovisionnementVeloce(etat, idx);
    } else if (mode === "conseil") {
      appliquerApprovisionnementSynergia(etat, idx);
    }

    // Étape 3 — Réalisation métier
    appliquerRealisationMetier(etat, idx);

    // Étape 4 — Extourne (si applicable) + facturation
    appliquerExtourneEnCours(etat, idx);
    const capacite = calculerCapaciteLogistique(j);
    const clientsTries = [...j.clientsATrait].sort((a, b) => {
      const r = b.delaiPaiement - a.delaiPaiement;
      if (r !== 0) return r;
      return b.montantVentes - a.montantVentes;
    });
    let aServir = clientsTries.slice(0, capacite);
    const perdusCap = clientsTries.length - aServir.length;
    let perdusStock = 0;
    if (mode === "production") {
      const stockPF = j.bilan.actifs.find(a => a.nom === "Stocks produits finis")?.valeur ?? 0;
      const nbServibles = Math.floor(stockPF / 1000);
      if (aServir.length > nbServibles) {
        perdusStock = aServir.length - nbServibles;
        aServir = aServir.slice(0, nbServibles);
      }
    }
    for (let si = 0; si < aServir.length; si++) {
      appliquerCarteClient(etat, idx, aServir[si], si);
    }
    j.clientsPerdusCeTour = perdusCap + perdusStock;
    j.clientsATrait = [];

    // Étapes 5/6 — skip
    // Étape 7 — Clôture trimestre
    appliquerClotureTrimestre(etat, idx);

    // Si fin d'exercice (T4), appliquer clôture exercice
    if (estFinExercice(tour, etat.nbToursMax)) {
      appliquerClotureExercice(etat, idx, 0);
      finaliserClotureExercice(etat);
    }

    snapshot(j, `T${tour} fin clôture`);

    etat.tourActuel = tour + 1;
    etat.etapeTour = ETAPES.ENCAISSEMENTS_CREANCES;
  }

  // Synthèse cumul
  const cumul = j.compteResultatCumulePartie;
  const ventesC = cumul.produits.ventes;
  const totalProd =
    ventesC +
    (cumul.produits.productionStockee ?? 0) +
    (cumul.produits.autresProduits ?? 0) +
    ((cumul.produits as Record<string, number>).produitsFinanciers ?? 0);
  const totalCh =
    (cumul.charges.servicesExterieurs ?? 0) +
    (cumul.charges.chargesPersonnel ?? 0) +
    (cumul.charges.dotationsAmortissements ?? 0) +
    (cumul.charges.achats ?? 0) +
    (cumul.charges.chargesFinancieres ?? 0) +
    (cumul.charges.chargesExceptionnelles ?? 0);
  const kp = j.bilan.passifs
    .filter(p => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
  console.log(
    `Synthèse — Ventes ${ventesC} € | Produits ${totalProd} € | Charges ${totalCh} € | Résultat cumulé ${totalProd - totalCh} € | KP fin ${kp} € | Faillite ${j.elimine ? "OUI" : "non"}`,
  );
}

(["Manufacture Belvaux", "Azura Commerce", "Véloce Transports", "Synergia Lab"] as const).forEach(simulate);
