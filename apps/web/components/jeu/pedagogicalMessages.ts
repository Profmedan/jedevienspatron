/**
 * Pedagogical Messages Module
 *
 * Generates contextual pedagogical messages based on game state.
 * Helps students understand the financial consequences of their decisions
 * in the French accounting serious game.
 */

export interface PedagogicalContext {
  tour: number;
  etape: number;
  resultatNet: number;
  tresorerie: number;
  bfr: number;
  creancesPlus1: number;
  creancesPlus2: number;
  ca: number;
  stocks: number;
  nbCommerciaux: number;
  decouvert: number;
  lastDecision?: string;  // Name of last decision card played
  lastEvent?: string;     // Name of last event card
}

/**
 * Generates a contextual pedagogical insight based on current game state.
 * Returns the first matching rule, or null if no special insight applies.
 */
export function generatePedagogicalMessage(ctx: PedagogicalContext): string | null {
  // Rule 1: Profitable but negative cash flow (growth trap)
  if (ctx.tresorerie < 0 && ctx.resultatNet > 0) {
    return `Votre entreprise est rentable (résultat +${ctx.resultatNet}) mais votre trésorerie est négative (${ctx.tresorerie}). C'est le piège classique de la croissance : vos clients ne vous ont pas encore payé ! Surveillez votre BFR.`;
  }

  // Rule 2: BFR too high relative to revenue
  if (ctx.bfr > ctx.ca * 0.5 && ctx.ca > 0) {
    return `Attention : votre BFR (${ctx.bfr}) représente plus de la moitié de votre CA (${ctx.ca}). Trop d'argent est immobilisé dans le cycle d'exploitation. Pensez à négocier des délais plus courts avec vos clients.`;
  }

  // Rule 3: High C+2 receivables
  if (ctx.creancesPlus2 > ctx.tresorerie && ctx.creancesPlus2 > 0) {
    return `Vous avez ${ctx.creancesPlus2} de créances en C+2 — plus que votre trésorerie actuelle (${ctx.tresorerie}). Ces clients grands comptes rapportent plus, mais immobilisent votre cash plus longtemps.`;
  }

  // Rule 4: Critical overdraft
  if (ctx.decouvert > 5) {
    return `⚠️ Votre découvert atteint ${ctx.decouvert}/8 ! Au-delà de 8, c'est la faillite. Réduisez vos investissements ou privilégiez les clients à paiement immédiat.`;
  }

  // Rule 5: Stock-out with sales force
  if (ctx.stocks === 0 && ctx.nbCommerciaux > 0) {
    return `Rupture de stock ! Vos commerciaux génèrent des clients, mais sans stock, impossible de les servir. Les ventes sont perdues. Pensez à acheter des marchandises.`;
  }

  // Rule 6: Excellent situation
  if (ctx.resultatNet > 5 && ctx.tresorerie > 5) {
    return `Excellente situation ! Résultat positif (+${ctx.resultatNet}) et trésorerie confortable (${ctx.tresorerie}). C'est le moment d'investir pour accélérer la croissance.`;
  }

  // Rule 7: After sales processing
  if (ctx.etape === 4 && ctx.ca > 0) {
    return `Les ventes du trimestre génèrent ${ctx.ca} de chiffre d'affaires. N'oubliez pas : les ventes augmentent le résultat, mais seuls les paiements comptants augmentent immédiatement la trésorerie.`;
  }

  // Rule 8: No sales force (after early game)
  if (ctx.nbCommerciaux === 0 && ctx.tour > 2) {
    return `Vous n'avez aucun commercial ! Sans force de vente, pas de nouveaux clients. Le recrutement est accessible à l'étape 6a.`;
  }

  // No special insight
  return null;
}

/**
 * Generates a summary message at the end of each quarter/tour.
 * Always returns a message (never null).
 */
export function generateTurnSummary(ctx: PedagogicalContext): string {
  // Build the base summary
  const baseMessage = `Trimestre ${ctx.tour} terminé — CA : ${ctx.ca}, Résultat : ${ctx.resultatNet > 0 ? '+' : ''}${ctx.resultatNet}, Trésorerie : ${ctx.tresorerie}.`;

  // Determine contextual note
  let contextualNote = "Continuez sur cette lancée.";

  // Growing result suggests progress
  if (ctx.resultatNet > 0 && ctx.tour > 1) {
    contextualNote = "Votre entreprise progresse !";
  }

  // Cash declining while result growing - growth trap warning
  if (ctx.tresorerie < 0 && ctx.resultatNet > 0) {
    contextualNote = "Mais attention, la trésorerie ne suit pas le résultat...";
  }

  // Both declining - situation deteriorating
  if (ctx.tresorerie < 0 && ctx.resultatNet < 0) {
    contextualNote = "La situation se dégrade — repensez votre stratégie.";
  }

  return `${baseMessage} ${contextualNote}`;
}

/**
 * Generates a critical alert if the game state reaches a dangerous situation.
 * Returns null if no critical tension detected.
 */
export function generateTensionAlert(ctx: PedagogicalContext): string | null {
  // Imminent bankruptcy
  if (ctx.decouvert > 6) {
    return `🚨 FAILLITE IMMINENTE — Découvert ${ctx.decouvert}/8 ! Chaque dépense vous rapproche de la liquidation.`;
  }

  // Critical cash flow crisis
  if (ctx.tresorerie < -3) {
    return `⚠️ TRÉSORERIE CRITIQUE — Vous êtes en découvert significatif. Évitez les investissements et privilégiez les encaissements rapides.`;
  }

  // Significant losses
  if (ctx.resultatNet < -5) {
    return `📉 PERTES IMPORTANTES — Résultat net à ${ctx.resultatNet}. Réduisez les charges ou augmentez les ventes pour redresser la barre.`;
  }

  return null;
}
