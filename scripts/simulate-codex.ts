/**
 * JEDEVIENSPATRON — Simulateur interactif headless
 * ─────────────────────────────────────────────────
 * Les étapes automatiques (charges, créances, commerciaux, ventes, effets)
 * s'exécutent et affichent leur impact immédiatement.
 * Les étapes interactives (achats, recrutement, décision, emprunt, événement)
 * vous proposent un menu de choix.
 *
 * Usage :
 *   npm run simulate
 */

import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

import {
  initialiserJeu,
  appliquerEtape0,
  appliquerAchatMarchandises,
  appliquerAvancementCreances,
  appliquerPaiementCommerciaux,
  appliquerCarteClient,
  appliquerEffetsRecurrents,
  acheterCarteDecision,
  appliquerCarteEvenement,
  verifierFinTour,
  genererClientsParCommerciaux,
  calculerCapaciteLogistique,
  cloturerAnnee,
  demanderEmprunt,
  getResultatNet,
  getTresorerie,
  getTotalStocks,
  calculerIndicateurs,
  CARTES_DECISION,
  CARTES_EVENEMENTS,
  type NomEntreprise,
  type EtatJeu,
} from "../packages/game-engine/src/index";

// ════════════════════════════════════════════════════════════════
//  CONFIG de base
// ════════════════════════════════════════════════════════════════

const NB_TOURS = 6 as 6 | 8 | 10 | 12;

const JOUEUR = {
  pseudo: "Alice",
  nomEntreprise: "Manufacture Belvaux" as NomEntreprise,
  // Autres choix : "Véloce Transports" | "Azura Commerce" | "Synergia Lab"
};

// ════════════════════════════════════════════════════════════════
//  COULEURS TERMINAL
// ════════════════════════════════════════════════════════════════

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  cyan:   "\x1b[36m",
  white:  "\x1b[37m",
  gray:   "\x1b[90m",
  bgRed:  "\x1b[41m",
  bgGreen:"\x1b[42m",
};

function signed(val: number): string {
  if (val > 0) return `${C.green}+${val}${C.reset}`;
  if (val < 0) return `${C.red}${val}${C.reset}`;
  return `${C.gray}0${C.reset}`;
}

function line(char = "─", len = 64) {
  console.log(C.gray + char.repeat(len) + C.reset);
}

function header(text: string) {
  line("═");
  console.log(`${C.bold}${C.cyan}  ${text}${C.reset}`);
  line("─");
}

function autoStep(etape: number, label: string, impacts: string[]) {
  console.log(`  ${C.dim}[${etape}]${C.reset} ${label}`);
  for (const i of impacts) console.log(`      ${i}`);
}

function dashboard(joueur: ReturnType<typeof creerJoueur>) {
  const treso    = getTresorerie(joueur);
  const stocks   = getTotalStocks(joueur);
  const emprunts = joueur.bilan.passifs.find(p => p.categorie === "emprunts")?.valeur ?? 0;
  const decouvert= joueur.bilan.decouvert;
  const resultat = getResultatNet(joueur);
  const capitaux = joueur.bilan.passifs.find(p => p.categorie === "capitaux")?.valeur ?? 0;

  console.log(
    `  ${C.bold}Tréso${C.reset} ${C.cyan}${treso}${C.reset}` +
    (decouvert > 0 ? `  ${C.red}Découvert ${decouvert}${C.reset}` : "") +
    `  ${C.bold}Stocks${C.reset} ${stocks}` +
    `  ${C.bold}Emprunts${C.reset} ${emprunts}` +
    `  ${C.bold}Résultat${C.reset} ${signed(resultat)}` +
    `  ${C.bold}Capitaux${C.reset} ${signed(capitaux)}`
  );
}

// Type helper pour creerJoueur (on utilise le type Joueur via EtatJeu)
type Joueur = EtatJeu["joueurs"][0];
function creerJoueur(e: EtatJeu) { return e.joueurs[0]; }

// ════════════════════════════════════════════════════════════════
//  PROMPTS INTERACTIFS
// ════════════════════════════════════════════════════════════════

async function choisir(
  rl: readline.Interface,
  question: string,
  options: Array<{ label: string; value: string }>,
  allowSkip = true,
): Promise<string | null> {
  console.log(`\n  ${C.yellow}${C.bold}${question}${C.reset}`);
  options.forEach((o, i) => console.log(`    ${C.bold}${i + 1}${C.reset}. ${o.label}`));
  if (allowSkip) console.log(`    ${C.bold}0${C.reset}. Passer`);

  while (true) {
    const raw = await rl.question(`  > `);
    const n = parseInt(raw.trim());
    if (allowSkip && (raw.trim() === "0" || raw.trim() === "")) return null;
    if (n >= 1 && n <= options.length) return options[n - 1].value;
    console.log(`  ${C.red}Choix invalide.${C.reset}`);
  }
}

async function demanderNombre(
  rl: readline.Interface,
  question: string,
  min: number,
  max: number,
  defaut: number,
): Promise<number> {
  while (true) {
    const raw = await rl.question(`  ${C.yellow}${question}${C.reset} [${min}-${max}, défaut ${defaut}]: `);
    if (raw.trim() === "") return defaut;
    const n = parseInt(raw.trim());
    if (!isNaN(n) && n >= min && n <= max) return n;
    console.log(`  ${C.red}Entrez un nombre entre ${min} et ${max}.${C.reset}`);
  }
}

// ════════════════════════════════════════════════════════════════
//  SIMULATION INTERACTIVE
// ════════════════════════════════════════════════════════════════

async function simulate() {
  const rl = readline.createInterface({ input, output });

  const etat: EtatJeu = initialiserJeu([JOUEUR], NB_TOURS);
  const idx = 0;

  console.log(`\n${C.bold}${C.cyan}╔══ JEDEVIENSPATRON — Simulateur interactif ══╗${C.reset}`);
  console.log(`  ${JOUEUR.pseudo} · ${JOUEUR.nomEntreprise} · ${NB_TOURS} trimestres`);
  console.log(`  ${C.dim}Étapes auto : 0, 2, 3, 4, 5   |   Étapes interactives : 1, 6a, 6b, 7${C.reset}\n`);

  for (let tour = 1; tour <= NB_TOURS; tour++) {
    etat.tourActuel = tour;
    const joueur = etat.joueurs[idx];
    joueur.clientsPerdusCeTour = 0;

    header(`TRIMESTRE ${tour} / ${NB_TOURS}`);
    dashboard(joueur);
    console.log();

    // ── [0] AUTO : Charges fixes + remboursements + amortissements ──────────
    const treso0avant = getTresorerie(joueur);
    const decouvert0avant = joueur.bilan.decouvert;
    appliquerEtape0(etat, idx);
    const impacts0: string[] = [];
    const deltaT0 = getTresorerie(joueur) - treso0avant;
    if (deltaT0 !== 0) impacts0.push(`Tréso ${signed(deltaT0)}`);
    if (joueur.bilan.decouvert > decouvert0avant)
      impacts0.push(`${C.red}Découvert ouvert : ${joueur.bilan.decouvert}${C.reset}`);
    autoStep(0, "Charges fixes + remboursement emprunt + amortissement", impacts0);

    // ── [1] INTERACTIF : Achats de stock ─────────────────────────────────────
    console.log();
    const stocksActuels = getTotalStocks(joueur);
    const tresoActuelle = getTresorerie(joueur);
    console.log(`  ${C.dim}[1] Achats de stock${C.reset}  (stocks actuels: ${stocksActuels}, tréso: ${C.cyan}${tresoActuelle}${C.reset})`);

    const qte = await demanderNombre(rl, "Quantité à acheter", 0, 20, 0);
    if (qte > 0) {
      const modeChoix = await choisir(rl, "Mode de paiement :", [
        { label: "Comptant (trésorerie)", value: "tresorerie" },
        { label: "À crédit (dette fournisseur)", value: "dettes" },
      ], false) as "tresorerie" | "dettes";
      appliquerAchatMarchandises(etat, idx, qte, modeChoix ?? "tresorerie");
      console.log(`      Stocks ${signed(qte)}  Tréso/Dettes ${signed(-qte)}`);
    } else {
      console.log(`      ${C.gray}Pas d'achat.${C.reset}`);
    }

    // ── Emprunt bancaire (proposé ici si tréso faible) ──────────────────────
    if (getTresorerie(joueur) < 3 || joueur.bilan.decouvert > 0) {
      const veutEmprunter = await choisir(rl, "Demander un emprunt bancaire ?", [
        { label: "Oui, demander un prêt", value: "oui" },
      ]);
      if (veutEmprunter === "oui") {
        const montants = [5, 8, 12, 16, 20];
        const choixMontant = await choisir(rl, "Montant souhaité :", montants.map(m => ({
          label: `${m}`,
          value: String(m),
        })));
        if (choixMontant) {
          const { resultat, modifications } = demanderEmprunt(etat, idx, Number(choixMontant));
          if (resultat.accepte) {
            console.log(`      ${C.green}✓ Prêt accordé : +${resultat.montantAccorde} tréso (${resultat.tauxMajore ? "8%/an majoré" : "5%/an standard"})${C.reset}`);
          } else {
            console.log(`      ${C.red}✗ Prêt refusé — score ${resultat.score}/100${C.reset}`);
          }
        }
      }
    }

    // ── [2] AUTO : Avancement créances ───────────────────────────────────────
    const c1avant = joueur.bilan.creancesPlus1;
    const c2avant = joueur.bilan.creancesPlus2;
    appliquerAvancementCreances(etat, idx);
    const encaisse = c1avant - joueur.bilan.creancesPlus1 + c2avant - joueur.bilan.creancesPlus2;
    autoStep(2, "Avancement des créances clients", [
      c1avant + c2avant > 0
        ? `Encaissé ${signed(c1avant)}  C+1→tréso, C+2→C+1`
        : C.gray + "Pas de créances en attente." + C.reset,
    ]);

    // ── [3] AUTO : Paiement commerciaux + génération clients ────────────────
    const clients = genererClientsParCommerciaux(joueur);
    joueur.clientsATrait = [...joueur.clientsATrait, ...clients];
    const treso3avant = getTresorerie(joueur);
    appliquerPaiementCommerciaux(etat, idx);
    const deltaT3 = getTresorerie(joueur) - treso3avant;
    autoStep(3, `Commerciaux → ${clients.length} client(s) généré(s)`, [
      deltaT3 !== 0 ? `Salaires ${signed(deltaT3)}` : C.gray + "Pas de commercial actif." + C.reset,
    ]);

    // ── [4] AUTO : Traitement des ventes ────────────────────────────────────
    const capacite = calculerCapaciteLogistique(joueur);
    const file = [...joueur.clientsATrait];
    const traites = file.slice(0, capacite);
    const perdus  = file.slice(capacite);
    let caTotal = 0;
    for (const c of traites) {
      const r = appliquerCarteClient(etat, idx, c);
      if (r.succes) caTotal += c.montantVentes;
    }
    joueur.clientsATrait = [];
    joueur.clientsPerdusCeTour = perdus.length;
    const impact4: string[] = [`CA ${signed(caTotal)}  Stocks ${signed(-traites.length)}`];
    if (perdus.length > 0)
      impact4.push(`${C.yellow}⚠ ${perdus.length} client(s) perdu(s) — capacité max ${capacite}${C.reset}`);
    autoStep(4, `${traites.length} vente(s)`, impact4);

    // ── [5] AUTO : Effets récurrents cartes décision ─────────────────────────
    const treso5avant = getTresorerie(joueur);
    appliquerEffetsRecurrents(etat, idx);
    const deltaT5 = getTresorerie(joueur) - treso5avant;
    autoStep(5, "Effets récurrents des cartes actives", [
      deltaT5 !== 0 ? `Tréso ${signed(deltaT5)}` : C.gray + "Aucun effet récurrent." + C.reset,
    ]);

    // ── [6a] INTERACTIF : Recrutement commercial ─────────────────────────────
    console.log();
    const cartesCommerciales = CARTES_DECISION.filter(c => c.categorie === "commercial");
    const recrut = await choisir(
      rl,
      "[6a] Recruter un commercial ?",
      cartesCommerciales.map(c => ({
        label: `${c.titre} — coût ${Math.abs(c.effetsImmédiats.find(e => e.poste === "tresorerie")?.delta ?? 0)}/trim, rapporte 1 ${c.clientParTour ?? "?"}`,
        value: c.id,
      })),
    );
    if (recrut) {
      const carte = cartesCommerciales.find(c => c.id === recrut)!;
      acheterCarteDecision(etat, idx, carte);
      console.log(`      ${C.yellow}✓ ${carte.titre} recruté(e)${C.reset}`);
    }

    // ── [6b] INTERACTIF : Carte décision (investissement/tactique…) ──────────
    const cartesInvest = CARTES_DECISION.filter(c => c.categorie !== "commercial");
    const decision = await choisir(
      rl,
      "[6b] Acheter une carte décision ?",
      cartesInvest.map(c => {
        const coutImm  = c.effetsImmédiats.find(e => e.poste === "tresorerie")?.delta ?? 0;
        const coutRec  = c.effetsRecurrents.find(e => e.poste === "tresorerie")?.delta ?? 0;
        const client   = c.clientParTour ? ` +1 ${c.clientParTour}/trim` : "";
        return {
          label: `${c.titre} [${c.categorie}] — immédiat ${signed(coutImm)}${coutRec !== 0 ? ` récurrent ${signed(coutRec)}/trim` : ""}${client}`,
          value: c.id,
        };
      }),
    );
    if (decision) {
      const carte = cartesInvest.find(c => c.id === decision)!;
      acheterCarteDecision(etat, idx, carte);
      console.log(`      ${C.yellow}✓ ${carte.titre} activé(e)${C.reset}`);
    }

    // ── [7] INTERACTIF : Événement ───────────────────────────────────────────
    console.log();
    const evChoix = await choisir(
      rl,
      "[7] Choisir l'événement :",
      [
        { label: "Pioche aléatoire", value: "_random" },
        ...CARTES_EVENEMENTS.map(e => {
          const resume = e.effets.map(ef => `${ef.poste} ${signed(ef.delta)}`).join("  ");
          const tag = e.annulableParAssurance ? " 🛡" : "";
          return { label: `${e.titre}${tag}  (${resume})`, value: e.id };
        }),
      ],
      false,
    );

    let carteEv = evChoix === "_random"
      ? etat.piocheEvenements[0]
      : CARTES_EVENEMENTS.find(e => e.id === evChoix);

    if (!carteEv) carteEv = etat.piocheEvenements[0];
    if (evChoix === "_random" && etat.piocheEvenements.length > 0)
      etat.piocheEvenements = etat.piocheEvenements.slice(1);

    if (carteEv) {
      appliquerCarteEvenement(etat, idx, carteEv);
      const isNeg = carteEv.effets.some(e => e.delta < 0);
      const annule = joueur.cartesActives.some(c => c.id === "assurance-prevoyance")
        && carteEv.annulableParAssurance && isNeg ? ` ${C.green}(annulé par assurance)${C.reset}` : "";
      const col = isNeg ? C.red : C.green;
      console.log(`      ${col}${carteEv.titre}${C.reset}${annule}`);
      carteEv.effets.forEach(ef => console.log(`        ${ef.poste} ${signed(ef.delta)}`));
    }

    // ── [8] AUTO : Bilan fin de trimestre ────────────────────────────────────
    const fin = verifierFinTour(etat, idx);
    const ind  = calculerIndicateurs(joueur);

    line();
    console.log(`  ${C.bold}Bilan T${tour} :${C.reset}`);
    dashboard(joueur);
    console.log(`  Cartes actives : ${C.dim}${joueur.cartesActives.map(c => c.titre).join(" · ") || "aucune"}${C.reset}`);

    if (fin.enFaillite) {
      console.log(`\n  ${C.bgRed}${C.bold} 💀 FAILLITE — ${fin.raisonFaillite} ${C.reset}\n`);
      rl.close();
      return;
    }

    // Clôture annuelle tous les 4 trimestres
    if (tour % 4 === 0 && tour < NB_TOURS) {
      cloturerAnnee(etat);
      console.log(`\n  ${C.yellow}📅 Clôture d'exercice — résultat intégré aux capitaux propres${C.reset}`);
    }

    if (tour < NB_TOURS) {
      await rl.question(`\n  ${C.dim}↵ Appuyez sur Entrée pour continuer au trimestre ${tour + 1}…${C.reset}`);
    }
  }

  // ── Résultat final ──────────────────────────────────────────────────────
  const joueur = etat.joueurs[idx];
  const ind = calculerIndicateurs(joueur);
  header("FIN DE PARTIE");
  dashboard(joueur);
  console.log(`  Fonds de roulement : ${signed(ind.fondsDeRoulement)}`);
  console.log(`  BFR                : ${signed(ind.besoinFondsRoulement)}`);
  console.log(`  Résultat           : ${joueur.elimine ? `${C.red}Éliminé 💀${C.reset}` : `${C.green}Survie ✓${C.reset}`}`);
  console.log();

  rl.close();
}

simulate().catch(err => { console.error(err); process.exit(1); });
