/**
 * Construit le message court d'un bandeau de transition entre 2 étapes.
 *
 * Architecture validée par Pierre (2026-04-25) — cf. tasks/todo.md.
 * Le moteur reste pur, la dramaturgie est ici. La fonction est sans état :
 * elle compare l'état AVANT et l'état APRÈS et formate un résumé conforme
 * au tableau pédagogique :
 *
 *   Étape | rien à dire             | action réelle
 *   ------+--------------------------+--------------------------
 *   0     | "Aucun client ne te…"    | "X € encaissés. Y € restent à recevoir."
 *   1     | "Aucun commercial actif" | "N commerciaux payés. M clients attendus."
 *   2     | "Pas d'achat ce trim."   | "X unités achetées. Stock disponible : Y."
 *   3     | "Aucune réalisation."    | (secteur-conditionnel)
 *   4     | "Aucun client à factur." | "N ventes. CA : X €. Clients perdus : Y."
 *   5     | "Pas de décision."       | "Décision appliquée : [carte]. Cash : X €."
 *   6     | "Événement sans impact"  | "Événement appliqué. Impact : X € sur [poste]."
 *   7     | (jamais vide)            | "Résultat net : X €. Trésorerie : Y €. Bilan ✓"
 *
 * Les calculs s'appuient sur les helpers publics du moteur (getTresorerie,
 * getResultatNet, etc.) et sur la structure du bilan / compteResultat.
 * Aucune dépendance au DOM ni à React → testable unitairement le jour venu.
 */

import {
  ETAPES,
  getTresorerie,
  getResultatNet,
  getTotalActif,
  getTotalPassif,
  type EtatJeu,
  type Joueur,
} from "@jedevienspatron/game-engine";
import type { ModificationMoteur } from "./gameFlowUtils";

export interface TransitionSummary {
  message: string;
  severity: "info" | "alert";
}

export interface TransitionContext {
  /** Titre de la carte décision appliquée (étape 5). */
  decisionLabel?: string;
  /** Titre de la carte événement appliquée (étape 6). */
  evenementTitre?: string;
}

/** Pluralise un mot en ajoutant "s" si n > 1. */
function pl(n: number, base: string, suffix = "s"): string {
  return n > 1 ? `${base}${suffix}` : base;
}

/** Formate un montant en € avec séparateur de milliers (français). */
function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

/** Total des stocks (toutes lignes confondues, en €). */
function getStockTotal(joueur: Joueur): number {
  return joueur.bilan.actifs
    .filter((a) => a.categorie === "stocks")
    .reduce((s, a) => s + a.valeur, 0);
}

/** Cherche la valeur d'une ligne de bilan par son nom exact. */
function getActifByName(joueur: Joueur, nom: string): number {
  return joueur.bilan.actifs.find((a) => a.nom === nom)?.valeur ?? 0;
}

/**
 * Construit le résumé pédagogique d'une transition d'étape.
 *
 * @param etatAvant     État du jeu AVANT l'application des écritures de l'étape
 * @param etatApres     État du jeu APRÈS l'application
 * @param fromEtape     Index de l'étape qui vient de se terminer (0-7)
 * @param mods          Liste des modifications retournées par le moteur (peut
 *                      contenir des deltas nuls — informatifs)
 * @param contexte      Données complémentaires (label décision, titre événement)
 */
export function buildTransitionSummary(
  etatAvant: EtatJeu,
  etatApres: EtatJeu,
  fromEtape: number,
  mods: ModificationMoteur[],
  contexte: TransitionContext = {},
): TransitionSummary {
  const idx = etatAvant.joueurActif;
  const joueurAvant = etatAvant.joueurs[idx];
  const joueurApres = etatApres.joueurs[idx];

  switch (fromEtape) {
    // ─── Étape 0 — Paiements clients à recevoir ─────────────────────────
    case ETAPES.ENCAISSEMENTS_CREANCES: {
      const tresoAvant = getTresorerie(joueurAvant);
      const tresoApres = getTresorerie(joueurApres);
      const encaisse = Math.max(0, tresoApres - tresoAvant);
      const restantC1 = joueurApres.bilan.creancesPlus1 ?? 0;
      const restantC2 = joueurApres.bilan.creancesPlus2 ?? 0;
      const restant = restantC1 + restantC2;
      if (encaisse === 0 && restant === 0) {
        return {
          message:
            etatAvant.tourActuel === 1
              ? "Aucun client ne te doit encore d'argent."
              : "Aucun paiement client à recevoir ce trimestre.",
          severity: "info",
        };
      }
      if (encaisse === 0 && restant > 0) {
        return {
          message: `Aucun encaissement ce trimestre. ${fmt(restant)} € restent à recevoir.`,
          severity: "info",
        };
      }
      return {
        message: `${fmt(encaisse)} € encaissés. ${fmt(restant)} € restent à recevoir.`,
        severity: "info",
      };
    }

    // ─── Étape 1 — Paiement commerciaux ─────────────────────────────────
    case ETAPES.COMMERCIAUX: {
      const commerciaux = joueurApres.cartesActives.filter(
        (c) => c.categorie === "commercial",
      );
      const nb = commerciaux.length;
      // À ce stade, le moteur a déjà ajouté les nouveaux clients dans
      // `clientsATrait` (cf. useGameFlow → switch COMMERCIAUX) → le compte
      // donne le total attendu pour le trimestre.
      const clientsAttendus = joueurApres.clientsATrait?.length ?? 0;
      if (nb === 0) {
        return {
          message: "Aucun commercial actif : aucun nouveau client ce trimestre.",
          severity: "alert",
        };
      }
      return {
        message: `${nb} ${pl(nb, "commercial", "aux")} ${pl(nb, "payé")}. ${clientsAttendus} ${pl(
          clientsAttendus,
          "client",
        )} ${pl(clientsAttendus, "attendu")}.`,
        severity: "info",
      };
    }

    // ─── Étape 2 — Approvisionnement ────────────────────────────────────
    case ETAPES.ACHATS_STOCK: {
      const secteur = joueurApres.entreprise.secteurActivite;
      // Logistique / conseil / service legacy : pas de stock physique, on
      // affiche le coût d'approche fixe à la place.
      if (secteur === "logistique" || secteur === "conseil" || secteur === "service") {
        const tresoAvant = getTresorerie(joueurAvant);
        const tresoApres = getTresorerie(joueurApres);
        const cout = tresoAvant - tresoApres;
        if (cout <= 0) {
          return { message: "Pas d'engagement ce trimestre.", severity: "alert" };
        }
        const label =
          secteur === "logistique"
            ? "Coût d'approche tournée"
            : secteur === "conseil"
              ? "Coût staffing mission"
              : "Coût d'approche";
        return {
          message: `${label} engagé : ${fmt(cout)} €.`,
          severity: "info",
        };
      }
      // Production / négoce : on compte le delta de stocks (en unités de 1 000 €).
      const stockAvant = getStockTotal(joueurAvant);
      const stockApres = getStockTotal(joueurApres);
      const delta = stockApres - stockAvant;
      if (delta <= 0) {
        return { message: "Pas d'achat ce trimestre.", severity: "alert" };
      }
      const unites = Math.round(delta / 1000);
      const dispo = Math.round(stockApres / 1000);
      return {
        message: `${unites} ${pl(unites, "unité")} ${pl(unites, "achetée")}. Stock disponible : ${dispo} unités.`,
        severity: "info",
      };
    }

    // ─── Étape 3 — Réalisation métier ───────────────────────────────────
    case ETAPES.REALISATION_METIER: {
      const secteur = joueurApres.entreprise.secteurActivite;
      // Cas Belvaux matière insuffisante : le moteur émet une mod
      // explicative avec ancienneValeur === nouvelleValeur, qu'on relit ici.
      const msgInsuffisant = mods.find((m) =>
        m.explication.toLowerCase().includes("matière insuffisante"),
      );
      if (msgInsuffisant) {
        return { message: msgInsuffisant.explication, severity: "alert" };
      }
      // Aucune écriture réelle : étape vide.
      const modsReels = mods.filter((m) => m.nouvelleValeur !== m.ancienneValeur);
      if (modsReels.length === 0) {
        return { message: "Aucune réalisation ce trimestre.", severity: "alert" };
      }

      if (secteur === "production") {
        // Belvaux : delta MP (négatif) + delta PF (positif).
        const mpAvant = getActifByName(joueurAvant, "Stocks matières premières");
        const mpApres = getActifByName(joueurApres, "Stocks matières premières");
        const pfAvant = getActifByName(joueurAvant, "Stocks produits finis");
        const pfApres = getActifByName(joueurApres, "Stocks produits finis");
        const consoMP = Math.max(0, Math.round((mpAvant - mpApres) / 1000));
        const prodPF = Math.max(0, Math.round((pfApres - pfAvant) / 1000));
        return {
          message: `${consoMP} ${pl(consoMP, "matière")} ${pl(
            consoMP,
            "transformée",
          )} en ${prodPF} ${pl(prodPF, "produit")} ${pl(prodPF, "fini")}.`,
          severity: "info",
        };
      }
      if (secteur === "negoce") {
        return { message: "Coût canal e-commerce comptabilisé : 300 €.", severity: "info" };
      }
      if (secteur === "logistique") {
        return { message: "Tournée préparée. En-cours constaté : 300 €.", severity: "info" };
      }
      if (secteur === "conseil" || secteur === "service") {
        return { message: "Mission staffée. En-cours constaté : 400 €.", severity: "info" };
      }
      return { message: "Réalisation métier appliquée.", severity: "info" };
    }

    // ─── Étape 4 — Facturation & ventes ────────────────────────────────
    case ETAPES.FACTURATION_VENTES: {
      const caAvant = joueurAvant.compteResultat.produits.ventes;
      const caApres = joueurApres.compteResultat.produits.ventes;
      const deltaCA = caApres - caAvant;
      // Une vente = une mod sur "ventes" avec delta > 0. L'extourne et les
      // mods de capacité (delta=0) sont exclues.
      const nbVentes = mods.filter(
        (m) => m.poste === "ventes" && m.nouvelleValeur - m.ancienneValeur > 0,
      ).length;
      const perdus = joueurApres.clientsPerdusCeTour ?? 0;

      if (nbVentes === 0 && deltaCA === 0) {
        return { message: "Aucun client à facturer.", severity: "alert" };
      }

      const perduSuffix = perdus > 0 ? ` Clients perdus : ${perdus}.` : "";
      return {
        message: `${nbVentes} ${pl(nbVentes, "vente")} ${pl(
          nbVentes,
          "enregistrée",
        )}. CA : ${fmt(deltaCA)} €.${perduSuffix}`,
        severity: perdus > 0 ? "alert" : "info",
      };
    }

    // ─── Étape 5 — Décisions ────────────────────────────────────────────
    case ETAPES.DECISION: {
      if (!contexte.decisionLabel) {
        return { message: "Pas de décision ce trimestre.", severity: "info" };
      }
      const tresoAvant = getTresorerie(joueurAvant);
      const tresoApres = getTresorerie(joueurApres);
      const impact = tresoApres - tresoAvant;
      const sign = impact >= 0 ? "+" : "";
      return {
        message: `Décision appliquée : ${contexte.decisionLabel}. Impact cash : ${sign}${fmt(impact)} €.`,
        severity: "info",
      };
    }

    // ─── Étape 6 — Événement ────────────────────────────────────────────
    case ETAPES.EVENEMENT: {
      const modsReels = mods.filter((m) => m.nouvelleValeur !== m.ancienneValeur);
      if (modsReels.length === 0) {
        return { message: "Événement sans impact comptable.", severity: "info" };
      }
      // Poste avec le plus gros delta absolu = sujet principal.
      const principal = modsReels.reduce((acc, m) => {
        const dM = Math.abs(m.nouvelleValeur - m.ancienneValeur);
        const dAcc = Math.abs(acc.nouvelleValeur - acc.ancienneValeur);
        return dM > dAcc ? m : acc;
      }, modsReels[0]);
      const delta = principal.nouvelleValeur - principal.ancienneValeur;
      const sign = delta >= 0 ? "+" : "";
      const titre = contexte.evenementTitre ? `${contexte.evenementTitre} — ` : "";
      return {
        message: `${titre}Impact : ${sign}${fmt(delta)} € sur ${principal.poste}.`,
        severity: delta < 0 ? "alert" : "info",
      };
    }

    // ─── Étape 7 — Clôture & bilan ──────────────────────────────────────
    case ETAPES.CLOTURE_BILAN: {
      const resultatNet = getResultatNet(joueurApres);
      const treso = getTresorerie(joueurApres);
      const totalActif = getTotalActif(joueurApres);
      const totalPassif = getTotalPassif(joueurApres);
      const equilibre = Math.abs(totalActif - totalPassif) < 0.01;
      const sign = resultatNet >= 0 ? "+" : "";
      const equilibreLabel = equilibre
        ? "Bilan équilibré."
        : "⚠ Bilan déséquilibré !";
      return {
        message: `Résultat net : ${sign}${fmt(resultatNet)} €. Trésorerie : ${fmt(treso)} €. ${equilibreLabel}`,
        severity: !equilibre || resultatNet < 0 ? "alert" : "info",
      };
    }

    default:
      return { message: "Étape terminée.", severity: "info" };
  }
}

/**
 * Nom long de l'étape (utilisé comme deuxième ligne du bandeau).
 * Indexé sur ETAPES.* (0-7). Pour CLOTURE_BILAN (7), l'étape suivante
 * est ENCAISSEMENTS_CREANCES (0) du tour suivant — gérer hors de cette
 * fonction.
 */
export function getStepLabel(etape: number): string {
  const labels = [
    "Paiements clients à recevoir",
    "Paiement commerciaux",
    "Approvisionnement",
    "Réalisation métier",
    "Facturation & ventes",
    "Décisions",
    "Événement",
    "Clôture & bilan",
  ];
  return labels[etape] ?? "—";
}
