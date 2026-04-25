/**
 * Simulation Belvaux T1-T6 avec le moteur réel.
 *
 * Comportement "joueur prudent par défaut" :
 *  - Conserve le Commercial Junior offert (2 particuliers/trim, salaire 1000)
 *  - Achète juste de quoi maintenir le stock MP au niveau de la production prévue
 *  - Aucune carte Décision supplémentaire (skip)
 *  - Aucun événement défavorable (force pioche neutre)
 *
 * Affiche pour chaque trimestre :
 *  - Trésorerie début / fin
 *  - Stocks MP, PF
 *  - Résultat net (cumulé exercice)
 *  - Capitaux propres
 *  - Δ tréso, Δ résultat
 */

import {
  initialiserJeu,
  avancerEtape,
  appliquerAvancementCreances,
  appliquerPaiementCommerciaux,
  appliquerAchatMarchandises,
  appliquerRealisationMetier,
  appliquerExtourneEnCours,
  appliquerCarteClient,
  appliquerClotureTrimestre,
  appliquerClotureExercice,
  finaliserClotureExercice,
  genererClientsParCommerciaux,
  genererClientsSpecialite,
  verifierFinTour,
  estFinExercice,
  getTresorerie,
  getResultatNet,
  getTotalActif,
  getTotalPassif,
  ETAPES,
  type Joueur,
} from "../src/index";

const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }], 6);
const idx = 0;

function snapshot(j: Joueur, tag: string) {
  const tres = getTresorerie(j);
  const res = getResultatNet(j);
  const mp = j.bilan.actifs.find(a => a.nom === "Stocks matières premières")?.valeur ?? 0;
  const pf = j.bilan.actifs.find(a => a.nom === "Stocks produits finis")?.valeur ?? 0;
  const capitaux = j.bilan.passifs.filter(p => p.categorie === "capitaux").reduce((s,p) => s + p.valeur, 0);
  const dettes = j.bilan.passifs.filter(p => p.categorie === "dettes").reduce((s,p) => s + p.valeur, 0);
  const totA = getTotalActif(j);
  const totP = getTotalPassif(j);
  const eq = Math.abs(totA - totP) < 0.01 ? "✓" : `⚠ ${(totA-totP).toFixed(0)}`;
  console.log(`${tag.padEnd(28)} | tréso=${String(tres).padStart(6)} | MP=${String(mp).padStart(5)} | PF=${String(pf).padStart(5)} | rés=${String(res).padStart(6)} | KP=${String(capitaux).padStart(6)} | dettes=${String(dettes).padStart(5)} | bilan ${eq}`);
}

console.log("=== Simulation Belvaux 6 trimestres — joueur prudent (Commercial Junior, achat strict du besoin) ===\n");
snapshot(etat.joueurs[idx], "T0 init");

for (let tour = 1; tour <= 6; tour++) {
  const j = etat.joueurs[idx];

  // Étape 0 — Encaissements créances
  appliquerAvancementCreances(etat, idx);
  // Étape 1 — Paiement commerciaux + génération de clients
  const newClients = genererClientsParCommerciaux(j);
  const specClients = genererClientsSpecialite(j);
  j.clientsATrait = [...j.clientsATrait, ...newClients, ...specClients];
  appliquerPaiementCommerciaux(etat, idx);

  // Étape 2 — Approvisionnement (achat strict : compléter stock MP au niveau besoin de prod = 2 unités)
  const mpActuel = j.bilan.actifs.find(a => a.nom === "Stocks matières premières")?.valeur ?? 0;
  const mpUnites = Math.floor(mpActuel / 1000);
  const aAcheter = Math.max(0, 2 - mpUnites);
  if (aAcheter > 0) {
    appliquerAchatMarchandises(etat, idx, aAcheter, "tresorerie");
  }

  // Étape 3 — Réalisation métier (Belvaux : transforme jusqu'à 2 MP → 2 PF)
  appliquerRealisationMetier(etat, idx);

  // Étape 4 — Facturation : pas d'extourne en mode production, on facture les clients dans l'ordre
  appliquerExtourneEnCours(etat, idx); // no-op pour Belvaux mais on respecte le pipeline
  const clientsAFacturer = [...j.clientsATrait];
  // Limiter à 2 (capacité production) et au stock PF dispo
  const lignePF = j.bilan.actifs.find(a => a.nom === "Stocks produits finis");
  const stockPF = lignePF?.valeur ?? 0;
  const nbServibles = Math.min(2, Math.floor(stockPF / 1000));
  const aServir = clientsAFacturer.slice(0, nbServibles);
  const perdus = clientsAFacturer.length - aServir.length;
  for (let si = 0; si < aServir.length; si++) {
    appliquerCarteClient(etat, idx, aServir[si], si);
  }
  j.clientsPerdusCeTour = perdus;
  j.clientsATrait = [];

  // Étape 5/6 — Décision/Événement : skip
  // Étape 7 — Clôture & bilan
  appliquerClotureTrimestre(etat, idx);

  // Si fin d'exercice (T4) : appliquer clôture exercice avec 0% dividendes
  if (estFinExercice(tour, etat.nbToursMax)) {
    appliquerClotureExercice(etat, idx, 0);
    finaliserClotureExercice(etat);
  }

  snapshot(etat.joueurs[idx], `T${tour} fin clôture`);

  // Préparation tour suivant
  etat.tourActuel = tour + 1;
  etat.etapeTour = ETAPES.ENCAISSEMENTS_CREANCES;
}

const j = etat.joueurs[idx];
console.log("\n=== Synthèse fin T6 ===");
console.log(`Trésorerie finale : ${getTresorerie(j)} €`);
console.log(`Résultat exercice en cours : ${getResultatNet(j)} €`);
const cumul = j.compteResultatCumulePartie;
const ventesC = cumul.produits.ventes;
const totalProduits = ventesC + (cumul.produits.productionStockee ?? 0) + (cumul.produits.autresProduits ?? 0);
const totalCharges = (cumul.charges.servicesExterieurs ?? 0) + (cumul.charges.chargesPersonnel ?? 0)
  + (cumul.charges.dotationsAmortissements ?? 0) + (cumul.charges.achats ?? 0)
  + (cumul.charges.chargesFinancieres ?? 0) + (cumul.charges.chargesExceptionnelles ?? 0);
console.log(`Cumul partie — Ventes : ${ventesC} € | Total produits : ${totalProduits} € | Total charges : ${totalCharges} € | Résultat cumulé : ${totalProduits - totalCharges} €`);
console.log(`Capitaux propres : ${j.bilan.passifs.filter(p => p.categorie === "capitaux").reduce((s,p) => s + p.valeur, 0)} €`);
console.log(`Faillite : ${j.elimine ? "OUI" : "non"}`);
