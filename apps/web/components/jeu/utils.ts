/**
 * Utilitaires pour le jeu sérieux
 * - Classification des postes comptables
 * - Noms et labels standardisés
 * - Sens des écritures (débit/crédit)
 */

export const ACTIF_KEYS = [
  "tresorerie",
  "stocks",
  "immobilisations",
  "creancesPlus1",
  "creancesPlus2",
];

export const PASSIF_KEYS = [
  "capitaux",
  "emprunts",
  "dettes",
  "dettesD2",     // Dettes fournisseurs D+2 → PASSIF
  "dettesFiscales",
  // Le découvert bancaire est une dette envers la banque → PASSIF
  // (getTotalPassif l'inclut déjà côté passif dans calculators.ts)
  "decouvert",
];

export const CHARGES_KEYS = [
  "achats",
  "servicesExterieurs",
  "impotsTaxes",
  "chargesInteret",
  "chargesPersonnel",
  "chargesExceptionnelles",
  "dotationsAmortissements",
];

export const PRODUITS_KEYS = [
  "ventes",
  "productionStockee",
  "produitsFinanciers",
  "revenusExceptionnels",
];

export type SensEcriture = "debit" | "credit";

/** Retourne le document comptable auquel appartient un poste : "Bilan" ou "CR" */
export function getDocumentType(poste: string): "Bilan" | "CR" {
  const p = poste.toLowerCase();
  if (ACTIF_KEYS.some((k) => p.includes(k))) return "Bilan";
  if (PASSIF_KEYS.some((k) => p.includes(k))) return "Bilan";
  return "CR";
}

export function getSens(poste: string, delta: number): SensEcriture {
  const p = poste.toLowerCase();
  const isActif = ACTIF_KEYS.some((k) => p.includes(k.toLowerCase()));
  const isCharge = CHARGES_KEYS.some((k) => p.includes(k.toLowerCase()));
  const isPassif = PASSIF_KEYS.some((k) => p.includes(k.toLowerCase()));
  const isProduit = PRODUITS_KEYS.some((k) => p.includes(k.toLowerCase()));

  if ((isActif || isCharge) && delta >= 0) return "debit";
  if ((isActif || isCharge) && delta < 0) return "credit";
  if ((isPassif || isProduit) && delta >= 0) return "credit";
  return "debit";
}

export function nomCompte(poste: string): string {
  const map: Record<string, string> = {
    tresorerie: "Trésorerie",
    stocks: "Stocks de marchandises",
    immobilisations: "Immobilisations",
    creancesPlus1: "Créances clients C+1",
    creancesPlus2: "Créances clients C+2",
    decouvert: "Découvert bancaire",
    capitaux: "Capitaux propres",
    emprunts: "Emprunts",
    dettes: "Dettes fournisseurs",
    dettesFiscales: "Dettes fiscales",
    achats: "Achats (CMV)",
    servicesExterieurs: "Services extérieurs",
    impotsTaxes: "Impôts & taxes",
    chargesInteret: "Charges d'intérêt",
    chargesPersonnel: "Charges de personnel",
    chargesExceptionnelles: "Charges exceptionnelles",
    dotationsAmortissements: "Dotations aux amortissements",
    ventes: "Ventes",
    productionStockee: "Production stockée",
    produitsFinanciers: "Produits financiers",
    revenusExceptionnels: "Revenus exceptionnels",
  };

  // Bug fix (2026-04-24) : `poste.toLowerCase()` met tout en minuscules,
  // mais les clés `k` du map conservent leur casse camelCase (ex. "chargesPersonnel").
  // Sans mettre `k` en minuscules aussi, la correspondance échouait pour les postes
  // camelCase à 2 mots et les labels remontaient bruts ("chargesPersonnel" au lieu
  // de "Charges de personnel"). Impact : chargesPersonnel, chargesInteret,
  // productionStockee, servicesExterieurs, creancesPlus1, creancesPlus2,
  // produitsFinanciers, dotationsAmortissements, etc.
  const posteLower = poste.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (posteLower.includes(k.toLowerCase())) return v;
  }
  return poste;
}

export interface DocumentInfo {
  label: string;
  detail: string;
  badge: string;
}

export function getDocument(poste: string): DocumentInfo {
  if (ACTIF_KEYS.includes(poste))
    return { label: "Bilan", detail: "Actif", badge: "bg-blue-900/50 text-blue-300" };
  if (PASSIF_KEYS.includes(poste))
    return { label: "Bilan", detail: "Passif", badge: "bg-orange-900/50 text-orange-300" };
  if (CHARGES_KEYS.includes(poste))
    return { label: "Compte de résultat", detail: "Charge", badge: "bg-red-900/50 text-red-300" };
  if (PRODUITS_KEYS.includes(poste))
    return { label: "Compte de résultat", detail: "Produit", badge: "bg-green-900/50 text-green-300" };

  return { label: "?", detail: "", badge: "bg-gray-700 text-gray-400" };
}

/**
 * Retourne une phrase d'impact pédagogique (une ligne, concise)
 * décrivant ce que fait concrètement cette variation pour l'entreprise.
 * Utilisé dans EntryCard pour l'étudiant BTS.
 */
export function getEffetTexte(poste: string, delta: number): string {
  const EFFETS: Record<string, { hausse: string; baisse: string }> = {
    tresorerie:              { hausse: "💰 Entrée d'argent en banque",              baisse: "💸 Sortie d'argent en banque" },
    stocks:                  { hausse: "📦 Votre stock augmente",                   baisse: "📦 Votre stock diminue (marchandises vendues)" },
    immobilisations:         { hausse: "🏭 Nouvel équipement enregistré à l'actif", baisse: "🏭 Cession ou mise au rebut d'équipement" },
    creancesPlus1:           { hausse: "📬 Le client vous paiera dans 1 trimestre", baisse: "📬 Créance encaissée (client a payé)" },
    creancesPlus2:           { hausse: "📬 Le client vous paiera dans 2 trimestres",baisse: "📬 Créance encaissée" },
    capitaux:                { hausse: "💼 Capitaux propres en hausse",             baisse: "💼 Capitaux propres en baisse" },
    emprunts:                { hausse: "🏦 Nouvel emprunt contracté",               baisse: "🏦 Annuité remboursée — dette réduite" },
    dettes:                  { hausse: "🔄 Achat à crédit — fournisseur à payer",   baisse: "🔄 Fournisseur payé" },
    dettesFiscales:          { hausse: "📊 Impôts et taxes à régler",               baisse: "📊 Dette fiscale réglée" },
    decouvert:               { hausse: "🚨 Trésorerie négative — attention !",      baisse: "🚨 Découvert réduit" },
    achats:                  { hausse: "📉 Coût des marchandises vendues → réduit le résultat", baisse: "📈 Correction d'achats → améliore le résultat" },
    servicesExterieurs:      { hausse: "📉 Charges fixes (loyer, énergie…) → réduit le résultat", baisse: "📈 Correction de charges" },
    impotsTaxes:             { hausse: "📉 Impôts et taxes → réduit le résultat",   baisse: "📈 Correction fiscale" },
    chargesInteret:          { hausse: "📉 Intérêts d'emprunt → réduit le résultat", baisse: "📈 Correction d'intérêts" },
    chargesPersonnel:        { hausse: "📉 Salaires et charges sociales → réduit le résultat", baisse: "📈 Correction de personnel" },
    chargesExceptionnelles:  { hausse: "📉 Charge non courante → réduit le résultat", baisse: "📈 Correction exceptionnelle" },
    dotationsAmortissements: { hausse: "📉 Usure de l'équipement comptabilisée — pas de sortie d'argent", baisse: "📈 Reprise d'amortissement" },
    ventes:                  { hausse: "📈 Chiffre d'affaires → améliore le résultat", baisse: "📉 Avoir client → réduit le CA" },
    productionStockee:       { hausse: "📈 Production non vendue valorisée → améliore le résultat", baisse: "" },
    produitsFinanciers:      { hausse: "📈 Revenus de placements → améliore le résultat", baisse: "" },
    revenusExceptionnels:    { hausse: "📈 Revenu non courant → améliore le résultat", baisse: "" },
  };

  const effet = EFFETS[poste];
  if (!effet) return "";
  return delta >= 0 ? effet.hausse : effet.baisse;
}

/**
 * Retourne l'explication concise du sens de l'écriture (partie double).
 */
export function getSensExplication(sens: SensEcriture): string {
  return sens === "debit"
    ? "Augmente un actif ou une charge"
    : "Augmente un passif ou un produit · diminue un actif";
}

// ─── MANIPULATION DU JOUEUR (pour saisie interactive) ─────────────────────────

import { Joueur, calculerIndicateurs } from "@jedevienspatron/game-engine";

/** Lit la valeur courante d'un poste sur le joueur */
export function getPosteValue(j: Joueur, poste: string): number {
  if (poste === "decouvert")      return j.bilan.decouvert;
  if (poste === "creancesPlus1")  return j.bilan.creancesPlus1;
  if (poste === "creancesPlus2")  return j.bilan.creancesPlus2;
  if (poste === "dettes")         return j.bilan.dettes;
  if (poste === "dettesD2")       return j.bilan.dettesD2 ?? 0;
  if (poste === "dettesFiscales") return j.bilan.dettesFiscales;
  const actif = j.bilan.actifs.find(a => (a.categorie as string) === poste);
  if (actif) return actif.valeur;
  const passif = j.bilan.passifs.find(p => (p.categorie as string) === poste);
  if (passif) return passif.valeur;
  const charges = j.compteResultat.charges as unknown as Record<string, number>;
  if (poste in charges) return charges[poste];
  const produits = j.compteResultat.produits as unknown as Record<string, number>;
  if (poste in produits) return produits[poste];
  return 0;
}

/** Applique un delta sur un poste du joueur (bilan ou CR) */
export function applyDeltaToJoueur(j: Joueur, poste: string, delta: number): void {
  if (poste === "decouvert")     { j.bilan.decouvert     += delta; return; }
  if (poste === "creancesPlus1") { j.bilan.creancesPlus1 += delta; return; }
  if (poste === "creancesPlus2") { j.bilan.creancesPlus2 += delta; return; }
  if (poste === "dettes")        { j.bilan.dettes         += delta; return; }
  if (poste === "dettesFiscales"){ j.bilan.dettesFiscales += delta; return; }

  // Immobilisations : distribuer le delta sur TOUS les biens pour respecter
  // la règle de l'amortissement individuel (-1 par bien immobilisé).
  if (poste === "immobilisations") {
    const immoItems = j.bilan.actifs.filter((a) => (a.categorie as string) === "immobilisations");
    if (immoItems.length > 0) {
      if (delta < 0) {
        // Distribuer la réduction proportionnellement : -1 par bien, dans l'ordre
        let remaining = -delta; // positif
        for (const item of immoItems) {
          if (remaining <= 0) break;
          const d = Math.min(remaining, item.valeur);
          item.valeur -= d;
          remaining -= d;
        }
      } else if (delta > 0) {
        // Investissement → "Autres Immobilisations" (réservé aux achats via Cartes Décision)
        const autres = immoItems.find((a) => a.nom === "Autres Immobilisations") ?? immoItems[0];
        autres.valeur += delta;
      }
    }
    return;
  }

  const actif = j.bilan.actifs.find(a => (a.categorie as string) === poste);
  if (actif) { actif.valeur += delta; return; }
  const passif = j.bilan.passifs.find(p => (p.categorie as string) === poste);
  if (passif) { passif.valeur += delta; return; }
  if (poste in j.compteResultat.charges)
    (j.compteResultat.charges as unknown as Record<string, number>)[poste] += delta;
  else if (poste in j.compteResultat.produits)
    (j.compteResultat.produits as unknown as Record<string, number>)[poste] += delta;
}

// ─── ANALYSE FINANCIÈRE FIN DE TRIMESTRE ──────────────────────────────────────

export interface MessageAnalyse {
  niveau: "rouge" | "jaune" | "vert";
  message: string;
}

export function analyserSituationFinanciere(joueur: Joueur): MessageAnalyse[] {
  const ind = calculerIndicateurs(joueur);
  const msgs: MessageAnalyse[] = [];

  if (ind.tresorerieNette < 0) {
    msgs.push({ niveau: "rouge", message: `⚠️ Votre trésorerie nette est négative (${ind.tresorerieNette}). Votre fonds de roulement ne couvre pas votre BFR : risque de rupture de trésorerie.` });
  } else if (ind.tresorerieNette < 5) {
    msgs.push({ niveau: "jaune", message: `🔶 Votre trésorerie nette est faible (${ind.tresorerieNette}). La marge de sécurité est étroite.` });
  } else {
    msgs.push({ niveau: "vert", message: `✅ Votre trésorerie nette est positive (${ind.tresorerieNette}). Équilibre financier maîtrisé.` });
  }

  if (ind.fondsDeRoulement < 0) {
    msgs.push({ niveau: "rouge", message: `⚠️ Fonds de roulement négatif (${ind.fondsDeRoulement}). Fragilité structurelle.` });
  } else if (ind.besoinFondsRoulement > ind.fondsDeRoulement) {
    msgs.push({ niveau: "jaune", message: `🔶 Votre BFR (${ind.besoinFondsRoulement}) dépasse votre FR (${ind.fondsDeRoulement}).` });
  }

  if (ind.resultatNet < 0) {
    msgs.push({ niveau: "rouge", message: `📉 Résultat déficitaire (${ind.resultatNet}). Vos charges dépassent vos produits.` });
  } else if (ind.resultatNet === 0) {
    msgs.push({ niveau: "jaune", message: `⚖️ Résultat net nul. Vous êtes à l'équilibre sans bénéfice.` });
  } else {
    msgs.push({ niveau: "vert", message: `📈 Résultat net bénéficiaire (${ind.resultatNet}). Capitaux propres en hausse.` });
  }

  if (ind.ratioSolvabilite < 20) {
    msgs.push({ niveau: "rouge", message: `🔴 Solvabilité très faible (${ind.ratioSolvabilite.toFixed(1)}%). Risque élevé de faillite.` });
  } else if (ind.ratioSolvabilite < 40) {
    msgs.push({ niveau: "jaune", message: `🟡 Solvabilité correcte (${ind.ratioSolvabilite.toFixed(1)}%). Vigilance.` });
  } else {
    msgs.push({ niveau: "vert", message: `🟢 Solvabilité solide (${ind.ratioSolvabilite.toFixed(1)}%).` });
  }

  return msgs;
}

// ─── PÉDAGOGIE DES ÉCRITURES ──────────────────────────────────────────────────

/**
 * Retourne une phrase courte et concrète expliquant CE QUI SE PASSE
 * pour l'apprenant, selon le poste et le sens de l'écriture.
 */
export function getPedagogieContexte(poste: string, delta: number, isDebit: boolean): string {
  // Cas particuliers par direction (débit vs crédit)
  const MAP: Record<string, { debit: string; credit: string }> = {
    tresorerie: {
      debit:  "💰 De l'argent ENTRE dans ton compte bancaire.",
      credit: "💸 De l'argent SORT de ton compte bancaire.",
    },
    stocks: {
      debit:  "📦 Des marchandises ARRIVENT dans ton stock — elles attendent d'être vendues.",
      credit: "📦 Des marchandises QUITTENT le stock — elles ont été vendues ou consommées.",
    },
    immobilisations: {
      debit:  "🏭 Tu acquiers un équipement durable (machine, véhicule, local…) — il sera amorti progressivement.",
      credit: "🏭 Un équipement PERD de la valeur : c'est l'usure (amortissement) ou une cession.",
    },
    creancesPlus1: {
      debit:  "📬 Un client te doit de l'argent qu'il paiera dans 1 trimestre — c'est une créance C+1.",
      credit: "📬 Une créance C+1 est ENCAISSÉE — l'argent entre enfin en trésorerie.",
    },
    creancesPlus2: {
      debit:  "📬 Un grand client paie très lentement : son argent n'arrivera que dans 2 trimestres — créance C+2.",
      credit: "📬 La créance C+2 AVANCE d'un cran — elle devient une créance C+1.",
    },
    capitaux: {
      debit:  "📉 Les capitaux propres DIMINUENT — résultat d'une perte ou d'un retrait des associés.",
      credit: "📈 Les capitaux propres AUGMENTENT — bénéfice intégré ou nouvel apport.",
    },
    emprunts: {
      debit:  "🏦 Tu REMBOURSES une partie de l'emprunt bancaire — la dette diminue.",
      credit: "🏦 Tu EMPRUNTES de l'argent à la banque — ressource immédiate, remboursement futur.",
    },
    dettes: {
      debit:  "✅ Tu paies enfin le fournisseur — la dette disparaît.",
      credit: "🔄 Achat À CRÉDIT : tu as les marchandises aujourd'hui, tu paieras le fournisseur plus tard.",
    },
    dettesFiscales: {
      debit:  "✅ Tu règles ta dette fiscale (impôts, TVA…) — obligation soldée.",
      credit: "🧾 L'État te réclame des impôts ou taxes — dette fiscale créée.",
    },
    decouvert: {
      debit:  "🚨 Ton découvert AUGMENTE — tu es encore plus endetté envers la banque.",
      credit: "🚨 Ton découvert DIMINUE légèrement — mais ta trésorerie reste négative.",
    },
    achats: {
      debit:  "📉 COÛT de la marchandise vendue enregistré — ça RÉDUIT ton résultat net.",
      credit: "Le coût de vente est annulé ou corrigé.",
    },
    servicesExterieurs: {
      debit:  "📉 CHARGES FIXES du trimestre (loyer, énergie, assurances…) — elles réduisent ton bénéfice.",
      credit: "Correction ou annulation d'une charge extérieure.",
    },
    chargesInteret: {
      debit:  "📉 INTÉRÊTS d'emprunt payés à la banque — coût du financement, réduit le résultat.",
      credit: "Correction d'intérêts.",
    },
    chargesPersonnel: {
      debit:  "👔 SALAIRES versés à tes commerciaux — charges de personnel, réduisent le résultat.",
      credit: "Correction ou remboursement de charges de personnel.",
    },
    chargesExceptionnelles: {
      debit:  "⚡ CHARGE EXCEPTIONNELLE (événement rare ou imprévu) — impact négatif sur le résultat.",
      credit: "Annulation d'une charge exceptionnelle.",
    },
    dotationsAmortissements: {
      debit:  "⏳ USURE des équipements comptabilisée — charge calculée, AUCUNE sortie d'argent réelle.",
      credit: "Correction d'amortissement.",
    },
    ventes: {
      debit:  "Correction ou annulation d'une vente.",
      credit: "📈 VENTE enregistrée — ton chiffre d'affaires AUGMENTE, le résultat s'améliore.",
    },
    revenusExceptionnels: {
      debit:  "Annulation d'un produit exceptionnel.",
      credit: "🎉 PRODUIT EXCEPTIONNEL — revenu inattendu (subvention, cession…), améliore le résultat.",
    },
    produitsFinanciers: {
      debit:  "Correction d'un produit financier.",
      credit: "💹 PRODUIT FINANCIER — intérêts ou dividendes reçus, améliorent le résultat.",
    },
  };

  const mapping = MAP[poste];
  if (!mapping) return "";
  return isDebit ? mapping.debit : mapping.credit;
}

// ─────────────────────────────────────────────────────────────
// PALETTE PAR TONALITÉ DE DÉFI (Vague 3, Tâche 24)
// ─────────────────────────────────────────────────────────────

/**
 * Tonalités thématiques des défis du dirigeant — mirror du type
 * `TonaliteDefi` de game-engine. Null pour observations/cloture
 * (défis systémiques sans tonalité).
 */
export type TonaliteDefi =
  | "tresorerie"
  | "capacite"
  | "financement"
  | "risque"
  | "positionnement"
  | null;

/**
 * Palette Tailwind appliquée à l'overlay DefiDirigeantScreen selon
 * la tonalité. Les classes sont écrites en dur (pas construites
 * dynamiquement) parce que le JIT de Tailwind ne détecte pas les
 * littéraux assemblés à l'exécution.
 *
 * Mapping sémantique :
 *   - tresorerie    → emerald (vert : argent, liquidité)
 *   - capacite      → sky     (bleu industriel : production, logistique)
 *   - financement   → violet  (bancaire : dette, levée de fonds)
 *   - risque        → rose    (alerte sobre, sans agressivité)
 *   - positionnement → indigo  (stratégie, identique au défaut V2)
 *   - null          → slate   (neutre : observations, clôture)
 */
export interface PaletteTonalite {
  /** Couleur de fond de l'overlay (transparence 80%). */
  overlayBg: string;
  /** Gradient d'en-tête (déroulement from-/to-). */
  headerGradient: string;
  /** Couleur d'icône et de libellé d'accent. */
  accentText: string;
  /** Classes de la carte de choix (hover border + bg). */
  choixHover: string;
  /** Couleur du titre de chaque choix. */
  choixTitre: string;
  /** Bloc pédagogique après sélection : background. */
  pedagogieBg: string;
  /** Bloc pédagogique après sélection : border. */
  pedagogieBorder: string;
  /** Bloc pédagogique après sélection : titre de la section. */
  pedagogieTitre: string;
  /** Gradient du bouton « Valider/Appliquer/Continuer ». */
  validerBtn: string;
}

/** Palette par défaut (tonalité null : indigo — neutre systémique). */
const PALETTE_INDIGO: PaletteTonalite = {
  overlayBg: "bg-indigo-900/80",
  headerGradient: "from-indigo-600 to-purple-600",
  accentText: "text-indigo-200",
  choixHover: "hover:border-indigo-500 hover:bg-indigo-950/40",
  choixTitre: "text-indigo-200",
  pedagogieBg: "bg-indigo-950/30",
  pedagogieBorder: "border-indigo-700/50",
  pedagogieTitre: "text-indigo-300",
  validerBtn:
    "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800",
};

const PALETTE_EMERALD: PaletteTonalite = {
  overlayBg: "bg-emerald-900/80",
  headerGradient: "from-emerald-600 to-teal-600",
  accentText: "text-emerald-200",
  choixHover: "hover:border-emerald-500 hover:bg-emerald-950/40",
  choixTitre: "text-emerald-200",
  pedagogieBg: "bg-emerald-950/30",
  pedagogieBorder: "border-emerald-700/50",
  pedagogieTitre: "text-emerald-300",
  validerBtn:
    "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800",
};

const PALETTE_SKY: PaletteTonalite = {
  overlayBg: "bg-sky-900/80",
  headerGradient: "from-sky-600 to-cyan-600",
  accentText: "text-sky-200",
  choixHover: "hover:border-sky-500 hover:bg-sky-950/40",
  choixTitre: "text-sky-200",
  pedagogieBg: "bg-sky-950/30",
  pedagogieBorder: "border-sky-700/50",
  pedagogieTitre: "text-sky-300",
  validerBtn:
    "bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800",
};

const PALETTE_VIOLET: PaletteTonalite = {
  overlayBg: "bg-violet-900/80",
  headerGradient: "from-violet-600 to-purple-600",
  accentText: "text-violet-200",
  choixHover: "hover:border-violet-500 hover:bg-violet-950/40",
  choixTitre: "text-violet-200",
  pedagogieBg: "bg-violet-950/30",
  pedagogieBorder: "border-violet-700/50",
  pedagogieTitre: "text-violet-300",
  validerBtn:
    "bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800",
};

const PALETTE_ROSE: PaletteTonalite = {
  overlayBg: "bg-rose-900/80",
  headerGradient: "from-rose-600 to-pink-600",
  accentText: "text-rose-200",
  choixHover: "hover:border-rose-500 hover:bg-rose-950/40",
  choixTitre: "text-rose-200",
  pedagogieBg: "bg-rose-950/30",
  pedagogieBorder: "border-rose-700/50",
  pedagogieTitre: "text-rose-300",
  validerBtn:
    "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800",
};

const PALETTE_SLATE: PaletteTonalite = {
  overlayBg: "bg-slate-900/80",
  headerGradient: "from-slate-600 to-slate-700",
  accentText: "text-slate-200",
  choixHover: "hover:border-slate-400 hover:bg-slate-800/40",
  choixTitre: "text-slate-200",
  pedagogieBg: "bg-slate-800/40",
  pedagogieBorder: "border-slate-600/50",
  pedagogieTitre: "text-slate-300",
  validerBtn:
    "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800",
};

/**
 * Retourne la palette Tailwind associée à une tonalité de défi.
 * Pour tonalite=null (observations, clôture), la palette slate neutre
 * est utilisée — ces défis systémiques ne doivent pas rivaliser
 * visuellement avec les 5 tonalités thématiques.
 */
export function getPaletteTonalite(tonalite: TonaliteDefi): PaletteTonalite {
  switch (tonalite) {
    case "tresorerie":
      return PALETTE_EMERALD;
    case "capacite":
      return PALETTE_SKY;
    case "financement":
      return PALETTE_VIOLET;
    case "risque":
      return PALETTE_ROSE;
    case "positionnement":
      return PALETTE_INDIGO;
    case null:
    default:
      return PALETTE_SLATE;
  }
}
