#!/usr/bin/env node
// ============================================================
// SIMULATEUR INTERACTIF — JE DEVIENS PATRON
// Usage : node simulate.js
// ============================================================
// Les étapes automatiques défilent sans interruption.
// Tu choisis : recrutement, carte décision, événement, emprunt.
// ============================================================

"use strict";

const readline = require("readline");
const G = require("./packages/game-engine/dist/index.js");
const { CARTES_DECISION, CARTES_EVENEMENTS, CARTES_CLIENTS } = G;

// ── Couleurs ANSI ─────────────────────────────────────────
const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m",
  white: "\x1b[37m", bgBlue: "\x1b[44m", bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m", bgYellow: "\x1b[43m",
};

function sep(ch = "─", n = 68) { return C.dim + ch.repeat(n) + C.reset; }

// ── Readline helpers ──────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(q) { return new Promise(r => rl.question(q, r)); }

async function choix(titre, options, allowSkip = true) {
  console.log(`\n  ${C.bold}${C.cyan}${titre}${C.reset}`);
  options.forEach((o, i) => {
    console.log(`    ${C.bold}${i + 1}${C.reset}  ${o.label}`);
  });
  if (allowSkip) console.log(`    ${C.bold}0${C.reset}  ${C.dim}Passer${C.reset}`);

  while (true) {
    const rep = (await ask(`  ${C.yellow}> ${C.reset}`)).trim();
    const n = parseInt(rep, 10);
    if (allowSkip && n === 0) return null;
    if (n >= 1 && n <= options.length) return options[n - 1];
    console.log(`  ${C.red}Choisis un numéro entre ${allowSkip ? "0" : "1"} et ${options.length}${C.reset}`);
  }
}

async function choisirEntier(titre, min, max, defaut) {
  while (true) {
    const rep = (await ask(`  ${C.yellow}${titre} [${defaut}] > ${C.reset}`)).trim();
    if (rep === "") return defaut;
    const n = parseInt(rep, 10);
    if (!isNaN(n) && n >= min && n <= max) return n;
    console.log(`  ${C.red}Entre un nombre entre ${min} et ${max}${C.reset}`);
  }
}

// ── Affichage bilan compact ───────────────────────────────
function printBilan(joueur) {
  const actif = G.getTotalActif(joueur);
  const passif = G.getTotalPassif(joueur);
  const result = G.getResultatNet(joueur);
  const treso = G.getTresorerie(joueur);
  const ind = G.calculerIndicateurs(joueur);
  const faillite = G.verifierFaillite(joueur);

  const bilanOk = Math.abs(actif - passif) < 0.01;
  const resultCol = result >= 0 ? C.green : C.red;
  const tresoCol = treso >= 0 ? C.green : C.red;
  const decouvert = joueur.bilan.decouvert;

  console.log(`\n  ${C.bold}${joueur.entreprise.icon} ${joueur.pseudo}${C.reset}${faillite.enFaillite ? ` ${C.bgRed}${C.white} FAILLITE ${C.reset} ${C.red}${faillite.raison}${C.reset}` : ""}`);
  console.log(`  ${"─".repeat(58)}`);
  console.log(`  Actif : ${C.bold}${actif}${C.reset}  Passif : ${C.bold}${passif}${C.reset}  ${bilanOk ? C.green + "✓" + C.reset : C.red + "⚠ Déséquilibre" + C.reset}   Résultat : ${resultCol}${C.bold}${result >= 0 ? "+" + result : result}${C.reset}`);
  console.log(`  Tréso : ${tresoCol}${C.bold}${treso}${C.reset}${decouvert > 0 ? `  ${C.yellow}Découvert ${decouvert}/8${C.reset}` : ""}   BFR : ${ind.besoinFondsRoulement >= 0 ? C.yellow : C.green}${ind.besoinFondsRoulement}${C.reset}   FR : ${ind.fondsDeRoulement}`);

  const c1 = joueur.bilan.creancesPlus1, c2 = joueur.bilan.creancesPlus2;
  if (c1 || c2) console.log(`  Créances C+1 : ${c1}  C+2 : ${c2}`);
  if (joueur.cartesActives.length > 0) {
    console.log(`  ${C.dim}Cartes : ${joueur.cartesActives.map(c => c.titre).join(", ")}${C.reset}`);
  }
}

function printMods(mods) {
  if (!mods || mods.length === 0) return;
  for (const m of mods) {
    const delta = m.nouvelleValeur - m.ancienneValeur;
    if (delta === 0) continue;
    const d = delta > 0 ? `${C.green}+${delta}${C.reset}` : `${C.red}${delta}${C.reset}`;
    console.log(`    ${m.poste.padEnd(22)} ${m.ancienneValeur} → ${m.nouvelleValeur} (${d})  ${C.dim}${m.explication}${C.reset}`);
  }
}

// ── Setup ─────────────────────────────────────────────────
async function setup() {
  console.log(`\n${C.bgBlue}${C.white}${C.bold}  JE DEVIENS PATRON — Simulateur Interactif  ${C.reset}\n`);

  const entreprises = [
    { label: `🏭 Manufacture Belvaux ${C.dim}(Production : +1 productionStockée +1 stocks/tour)${C.reset}`, nom: "Manufacture Belvaux" },
    { label: `🚚 Véloce Transports   ${C.dim}(Logistique : encaissement accéléré −1 délai)${C.reset}`, nom: "Véloce Transports" },
    { label: `🏪 Azura Commerce      ${C.dim}(Commerce : +1 client Particulier gratuit/tour)${C.reset}`, nom: "Azura Commerce" },
    { label: `💡 Synergia Lab        ${C.dim}(Innovation : +1 produitsFinanciers +1 tréso/tour)${C.reset}`, nom: "Synergia Lab" },
  ];

  const pseudo = (await ask(`  ${C.yellow}Pseudo ? ${C.reset}`)).trim() || "Joueur";
  const entChoix = await choix("Choisis ton entreprise :", entreprises, false);
  const nbTours = await choisirEntier("Nombre de trimestres (6/8/10/12) ?", 6, 12, 8);

  return { pseudo, entreprise: entChoix.nom, nbTours };
}

// ── Simulation d'un tour ──────────────────────────────────
async function simulerTour(etat, tourNum) {
  const idx = 0;
  const joueur = etat.joueurs[idx];
  const annee = Math.ceil(tourNum / 4);
  const trimestre = ((tourNum - 1) % 4) + 1;

  console.log(`\n${sep("═")}`);
  console.log(`${C.bold}  TRIMESTRE ${tourNum} / ${etat.nbToursMax}  —  Année ${annee} T${trimestre}${C.reset}`);
  console.log(sep("═"));

  // ── Étape 0 : Charges fixes (auto) ───────────────────
  {
    const r = G.appliquerEtape0(etat, idx);
    console.log(`\n  ${C.dim}[Auto]${C.reset} ${C.bold}Charges fixes & amortissements${C.reset}`);
    printMods(r.modifications);
  }

  // ── Étape 1 : Achats marchandises ────────────────────
  {
    const stockActuel = G.getTotalStocks(joueur);
    const capacite = G.calculerCapaciteLogistique(joueur);
    const defaut = Math.max(0, capacite - stockActuel + 2);
    const qte = await choisirEntier(
      `Acheter combien de marchandises ? (stock=${stockActuel}, capacité=${capacite})`,
      0, 20, defaut
    );
    if (qte > 0) {
      const modes = [
        { label: `Trésorerie (paiement immédiat)`, val: "tresorerie" },
        { label: `À crédit (dette fournisseur D+1)`, val: "dettes" },
      ];
      const mode = await choix("Mode de paiement :", modes, false);
      const r = G.appliquerAchatMarchandises(etat, idx, qte, mode.val);
      printMods(r.modifications);
    }
  }

  // ── Étape 2 : Avancement créances (auto) ─────────────
  {
    const r = G.appliquerAvancementCreances(etat, idx);
    if (r.modifications.length > 0) {
      console.log(`\n  ${C.dim}[Auto]${C.reset} ${C.bold}Avancement créances${C.reset}`);
      printMods(r.modifications);
    }
  }

  // ── Étape 3 : Commerciaux + génération clients (auto) ─
  {
    const clients = G.genererClientsParCommerciaux(joueur);
    const clientsSpec = G.genererClientsSpecialite(joueur);
    joueur.clientsATrait = [...joueur.clientsATrait, ...clients, ...clientsSpec];
    const r = G.appliquerPaiementCommerciaux(etat, idx);
    const total = clients.length + clientsSpec.length;
    if (total > 0 || r.modifications.length > 0) {
      console.log(`\n  ${C.dim}[Auto]${C.reset} ${C.bold}Commerciaux : ${total} client(s) générés${C.reset}${clientsSpec.length > 0 ? ` (dont ${clientsSpec.length} spécialité)` : ""}`);
      printMods(r.modifications);
    }
  }

  // ── Étape 4 : Traitement clients (auto) ──────────────
  {
    const capacite = G.calculerCapaciteLogistique(joueur);
    const clientsTriés = [...joueur.clientsATrait].sort(
      (a, b) => (b.delaiPaiement - a.delaiPaiement) || (b.montantVentes - a.montantVentes)
    );
    const traités = clientsTriés.slice(0, capacite);
    const perdus = clientsTriés.length - traités.length;
    let allMods = [];
    for (const c of traités) {
      const r = G.appliquerCarteClient(etat, idx, c);
      if (r.succes) allMods.push(...r.modifications);
    }
    joueur.clientsATrait = [];
    joueur.clientsPerdusCeTour = perdus;

    console.log(`\n  ${C.dim}[Auto]${C.reset} ${C.bold}Ventes : ${traités.length} client(s) traités${C.reset}${perdus > 0 ? ` ${C.yellow}(${perdus} perdu(s) — capacité ${capacite})${C.reset}` : ""}`);
    printMods(allMods);
  }

  // ── Étape 5 : Effets récurrents + spécialité (auto) ──
  {
    const r1 = G.appliquerEffetsRecurrents(etat, idx);
    const r2 = G.appliquerSpecialiteEntreprise(etat, idx);
    const mods = [...r1.modifications, ...r2.modifications];
    if (mods.length > 0) {
      console.log(`\n  ${C.dim}[Auto]${C.reset} ${C.bold}Effets récurrents & spécialité${C.reset}`);
      printMods(mods);
    }
  }

  // ── Étape 6a : Recrutement commercial ────────────────
  {
    const cartes = G.obtenirCarteRecrutement(etat, idx);
    const options = cartes.map(c => {
      const cout = c.effetsImmédiats.find(e => e.poste === "chargesPersonnel")?.delta || 0;
      const client = c.clientParTour || "?";
      const nb = c.nbClientsParTour || 1;
      return {
        label: `${c.titre}  ${C.dim}(salaire −${cout}/trim → ${nb}× ${client}/tour)${C.reset}`,
        carte: c,
      };
    });
    const sel = await choix("🤝 Recruter un commercial ?", options);
    if (sel) {
      const r = G.acheterCarteDecision(etat, idx, sel.carte);
      if (r.succes) {
        console.log(`  ${C.magenta}✓ Recruté : ${sel.carte.titre}${C.reset}`);
        printMods(r.modifications);
      } else {
        console.log(`  ${C.red}✗ ${r.messageErreur}${C.reset}`);
      }
    }
  }

  // ── Étape 6b : Carte décision ────────────────────────
  {
    // Regrouper par catégorie
    const catOrder = ["vehicule", "investissement", "financement", "tactique", "service", "protection"];
    const catLabel = {
      vehicule: "🚗 Véhicules", investissement: "🏗 Investissements",
      financement: "💰 Financement", tactique: "🎯 Tactique",
      service: "🔧 Services", protection: "🛡 Protection",
    };
    // Filtrer commerciaux et cartes déjà actives
    const déjàActives = new Set(joueur.cartesActives.filter(c => c.categorie !== "commercial").map(c => c.id));
    const disponibles = CARTES_DECISION
      .filter(c => c.categorie !== "commercial" && !déjàActives.has(c.id));

    const options = [];
    for (const cat of catOrder) {
      const cartesCat = disponibles.filter(c => c.categorie === cat);
      if (cartesCat.length === 0) continue;
      // Séparateur catégorie
      options.push({ label: `${C.bold}── ${catLabel[cat] || cat} ──${C.reset}`, carte: null, sep: true });
      for (const c of cartesCat) {
        const imm = c.effetsImmédiats.map(e => `${e.poste} ${e.delta > 0 ? "+" : ""}${e.delta}`).join(", ");
        const rec = c.effetsRecurrents.length > 0
          ? c.effetsRecurrents.map(e => `${e.poste} ${e.delta > 0 ? "+" : ""}${e.delta}`).join(", ")
          : "";
        const client = c.clientParTour ? ` → +${c.nbClientsParTour || 1} ${c.clientParTour}/tour` : "";
        options.push({
          label: `${c.titre.padEnd(26)} ${C.dim}Imm: ${imm || "—"}${rec ? `  Réc: ${rec}` : ""}${client}${C.reset}`,
          carte: c,
        });
      }
    }

    // Afficher menu numéroté en filtrant les séparateurs
    console.log(`\n  ${C.bold}${C.cyan}📋 Acheter une carte Décision ?${C.reset}`);
    let num = 1;
    const indexMap = {};
    for (const o of options) {
      if (o.sep) {
        console.log(`    ${o.label}`);
      } else {
        console.log(`    ${C.bold}${String(num).padStart(2)}${C.reset}  ${o.label}`);
        indexMap[num] = o;
        num++;
      }
    }
    console.log(`    ${C.bold} 0${C.reset}  ${C.dim}Passer${C.reset}`);

    while (true) {
      const rep = (await ask(`  ${C.yellow}> ${C.reset}`)).trim();
      const n = parseInt(rep, 10);
      if (n === 0) break;
      if (indexMap[n]) {
        const r = G.acheterCarteDecision(etat, idx, indexMap[n].carte);
        if (r.succes) {
          console.log(`  ${C.blue}✓ Acheté : ${indexMap[n].carte.titre}${C.reset}`);
          printMods(r.modifications);
        } else {
          console.log(`  ${C.red}✗ ${r.messageErreur}${C.reset}`);
        }
        break;
      }
      console.log(`  ${C.red}Choisis un numéro entre 0 et ${num - 1}${C.reset}`);
    }
  }

  // ── Étape 6c : Emprunt bancaire ──────────────────────
  {
    const empruntsPossibles = [5, 8, 12, 16, 20];
    const opts = empruntsPossibles.map(m => {
      const result = G.scorerDemandePret(joueur, m);
      const status = result.accepte ? `${C.green}✓ Accepté${C.reset}` : `${C.red}✗ Refusé${C.reset}`;
      const taux = result.tauxMajore ? `${C.yellow}8%${C.reset}` : "5%";
      return { label: `${m} k€  ${status}  taux ${taux}  ${C.dim}(score ${result.score})${C.reset}`, montant: m, result };
    });
    const sel = await choix("🏦 Demander un emprunt bancaire ?", opts);
    if (sel) {
      const r = G.demanderEmprunt(etat, idx, sel.montant);
      if (r.succes) {
        console.log(`  ${C.green}✓ Emprunt ${sel.montant} accordé${C.reset}`);
        printMods(r.modifications);
      } else {
        console.log(`  ${C.red}✗ ${r.messageErreur}${C.reset}`);
      }
    }
  }

  // ── Étape 7 : Événement ──────────────────────────────
  {
    // Lister les événements disponibles dans la pioche
    const pioche = etat.piocheEvenements;
    const positifs = pioche.filter(c => c.effets.every(e => e.delta >= 0) || c.id === "incendie" || c.id === "subvention-developpement-durable");
    const négatifs = pioche.filter(c => c.effets.some(e => e.delta < 0) && c.id !== "incendie" && c.id !== "subvention-developpement-durable");

    const options = [];
    if (positifs.length > 0) {
      options.push({ label: `${C.bold}── ✨ Positifs ──${C.reset}`, carte: null, sep: true });
      for (const c of positifs) {
        const effStr = c.effets.map(e => `${e.poste} ${e.delta > 0 ? "+" : ""}${e.delta}`).join(", ");
        options.push({ label: `${c.titre.padEnd(30)} ${C.dim}${effStr}${C.reset}`, carte: c });
      }
    }
    if (négatifs.length > 0) {
      options.push({ label: `${C.bold}── ⚡ Négatifs ──${C.reset}`, carte: null, sep: true });
      for (const c of négatifs) {
        const effStr = c.effets.map(e => `${e.poste} ${e.delta > 0 ? "+" : ""}${e.delta}`).join(", ");
        const annulable = c.annulableParAssurance ? ` ${C.dim}[assurable]${C.reset}` : "";
        options.push({ label: `${c.titre.padEnd(30)} ${C.dim}${effStr}${C.reset}${annulable}`, carte: c });
      }
    }

    console.log(`\n  ${C.bold}${C.cyan}🎲 Choisir l'événement du trimestre :${C.reset}`);
    let num = 1;
    const indexMap = {};
    for (const o of options) {
      if (o.sep) {
        console.log(`    ${o.label}`);
      } else {
        console.log(`    ${C.bold}${String(num).padStart(2)}${C.reset}  ${o.label}`);
        indexMap[num] = o;
        num++;
      }
    }
    console.log(`    ${C.bold} 0${C.reset}  ${C.dim}Pas d'événement ce tour${C.reset}`);

    while (true) {
      const rep = (await ask(`  ${C.yellow}> ${C.reset}`)).trim();
      const n = parseInt(rep, 10);
      if (n === 0) break;
      if (indexMap[n]) {
        const carte = indexMap[n].carte;
        // Vérifier protection
        const assurance = joueur.cartesActives.some(c => c.id === "assurance-prevoyance");
        const maintenance = joueur.cartesActives.some(c => c.id === "maintenance-preventive");
        const protégé = carte.annulableParAssurance && (assurance || maintenance);

        if (protégé) {
          console.log(`  ${C.green}🛡 Événement "${carte.titre}" ANNULÉ par votre protection !${C.reset}`);
        } else {
          const r = G.appliquerCarteEvenement(etat, idx, carte);
          console.log(`  ${carte.effets.some(e => e.delta < 0) ? "⚡" : "✨"} ${C.bold}${carte.titre}${C.reset}`);
          printMods(r.modifications);
        }
        // Retirer de la pioche
        const i = pioche.findIndex(c => c.id === carte.id);
        if (i !== -1) pioche.splice(i, 1);
        break;
      }
      console.log(`  ${C.red}Choisis un numéro entre 0 et ${num - 1}${C.reset}`);
    }
  }

  // ── Étape 8 : Fin de tour ────────────────────────────
  {
    G.verifierFinTour(etat, idx);
    const faillite = G.verifierFaillite(joueur);
    if (faillite.enFaillite && !joueur.elimine) {
      joueur.elimine = true;
      console.log(`\n  ${C.bgRed}${C.white}${C.bold} ☠ FAILLITE ${C.reset} ${C.red}${faillite.raison}${C.reset}`);
    }

    // Clôture annuelle
    if (tourNum % 4 === 0) {
      G.cloturerAnnee(etat, idx);
      console.log(`\n  ${C.cyan}${C.bold}── Clôture annuelle (Exercice ${annee}) ──${C.reset}`);
    }
  }

  // ── Bilan de fin de tour ─────────────────────────────
  printBilan(joueur);

  return !joueur.elimine;
}

// ── Résultats finaux ──────────────────────────────────────
function printResultatsFinaux(etat) {
  const joueur = etat.joueurs[0];
  const score = G.calculerScore(joueur);
  const sig = G.calculerSIGSimplifie(joueur);

  console.log(`\n${sep("═")}`);
  console.log(`${C.bgGreen}${C.white}${C.bold}  RÉSULTATS FINAUX  ${C.reset}`);
  console.log(sep("═"));

  printBilan(joueur);

  if (joueur.elimine) {
    console.log(`\n  ${C.red}${C.bold}Partie terminée par faillite.${C.reset}`);
  } else {
    console.log(`\n  ${C.bold}Score final : ${C.yellow}${score}${C.reset}`);
    console.log(`  ${C.dim}(Résultat×3 + Immos×2 + Tréso + Capitaux − Découvert)${C.reset}`);
  }
  console.log(`\n${sep("═")}\n`);
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  try {
    const conf = await setup();
    const etat = G.initialiserJeu(
      [{ pseudo: conf.pseudo, nomEntreprise: conf.entreprise }],
      conf.nbTours
    );

    for (let tour = 1; tour <= conf.nbTours; tour++) {
      const continuer = await simulerTour(etat, tour);
      if (!continuer) break;
    }

    printResultatsFinaux(etat);
  } finally {
    rl.close();
  }
}

main();
