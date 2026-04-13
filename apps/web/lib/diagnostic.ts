/**
 * Moteur de diagnostic pédagogique post-session.
 * Analyse les snapshots trimestriels d'un joueur et produit
 * des insights classés en forces, alertes et conseils.
 */

import type { TrimSnapshot } from "@jedevienspatron/game-engine";

// ─── Types ──────────────────────────────────────────────────────

export type DiagnosticCategory = "force" | "alerte" | "conseil";

export interface DiagnosticResult {
  id: string;
  category: DiagnosticCategory;
  label: string;
  message: string;
}

interface DiagnosticRule {
  id: string;
  category: DiagnosticCategory;
  label: string;
  check(snapshots: TrimSnapshot[]): string | null;
}

// ─── Règles ─────────────────────────────────────────────────────

const RULES: DiagnosticRule[] = [
  // ── ALERTES ──────────────────────────────────────────────────

  {
    id: "tresorerie-negative",
    category: "alerte",
    label: "Découvert bancaire persistant",
    check(snapshots) {
      let streak = 0;
      let worstStreak = 0;
      let endTour = 0;
      for (const s of snapshots) {
        if (s.tresorerie < 0) {
          streak++;
          if (streak > worstStreak) {
            worstStreak = streak;
            endTour = s.tour;
          }
        } else {
          streak = 0;
        }
      }
      if (worstStreak >= 2) {
        return `⚠️ Trésorerie négative durant ${worstStreak} trimestres consécutifs (jusqu'au T${endTour}). Le découvert a généré des agios et limité votre capacité d'investissement. Anticipez vos besoins en trésorerie avant qu'ils ne deviennent critiques.`;
      }
      return null;
    },
  },

  {
    id: "deficit-prolonge",
    category: "alerte",
    label: "Déficit prolongé",
    check(snapshots) {
      let streak = 0;
      for (const s of snapshots) {
        if (s.resultatNet < 0) {
          streak++;
        } else {
          streak = 0;
        }
        if (streak >= 3) {
          return `⚠️ Résultat net négatif durant ${streak} trimestres consécutifs (T${s.tour - streak + 1} à T${s.tour}). Vos charges dépassaient durablement vos produits — il fallait soit augmenter le CA (plus de commerciaux) soit réduire les charges.`;
        }
      }
      return null;
    },
  },

  {
    id: "capitaux-negatifs",
    category: "alerte",
    label: "Capitaux propres négatifs",
    check(snapshots) {
      const bad = snapshots.find((s) => s.capitauxPropres < 0);
      if (bad) {
        return `⚠️ Vos capitaux propres sont devenus négatifs au T${bad.tour} (${Math.round(bad.capitauxPropres)} €). En droit français, cela déclenche l'obligation de reconstituer les fonds propres sous 2 ans, sous peine de dissolution.`;
      }
      return null;
    },
  },

  {
    id: "croissance-non-rentable",
    category: "alerte",
    label: "Croissance non rentable",
    check(snapshots) {
      if (snapshots.length < 3) return null;
      for (let i = 2; i < snapshots.length; i++) {
        const prev = snapshots[i - 2];
        const curr = snapshots[i];
        if (prev.chiffreAffaires > 0) {
          const caGrowth = ((curr.chiffreAffaires - prev.chiffreAffaires) / prev.chiffreAffaires) * 100;
          const marge = curr.chiffreAffaires > 0 ? (curr.resultatNet / curr.chiffreAffaires) * 100 : 0;
          if (caGrowth > 40 && marge < 5) {
            return `⚠️ Votre CA a bondi de ${Math.round(caGrowth)}% (T${prev.tour}→T${curr.tour}) mais avec une marge nette de seulement ${Math.round(marge)}%. Croître sans marge consomme du cash — renforcez la rentabilité avant d'accélérer.`;
          }
        }
      }
      return null;
    },
  },

  // ── CONSEILS ─────────────────────────────────────────────────

  {
    id: "zero-commercial",
    category: "conseil",
    label: "Aucun recrutement commercial",
    check(snapshots) {
      if (snapshots.length < 4) return null;
      const allZero = snapshots.every((s) => s.nbCommerciaux === 0);
      if (allZero) {
        return `💡 Vous n'avez recruté aucun commercial pendant toute la partie. Les commerciaux sont le moteur de croissance : chacun rapporte des clients réguliers qui génèrent du CA trimestre après trimestre.`;
      }
      return null;
    },
  },

  {
    id: "commercial-tardif",
    category: "conseil",
    label: "Recrutement commercial tardif",
    check(snapshots) {
      if (snapshots.length < 5) return null;
      const mid = Math.floor(snapshots.length / 2);
      const firstHalf = snapshots.slice(0, mid);
      const secondHalf = snapshots.slice(mid);
      const noCommFirstHalf = firstHalf.every((s) => s.nbCommerciaux === 0);
      const hasCommSecondHalf = secondHalf.some((s) => s.nbCommerciaux > 0);
      if (noCommFirstHalf && hasCommSecondHalf) {
        return `💡 Votre premier commercial n'a été recruté qu'en deuxième moitié de partie. Un recrutement au T2-T3 aurait généré des clients bien plus tôt, avec un effet cumulé sur le CA.`;
      }
      return null;
    },
  },

  {
    id: "aucune-decision",
    category: "conseil",
    label: "Opportunités d'investissement manquées",
    check(snapshots) {
      if (snapshots.length < 4) return null;
      const decisionsCount = snapshots.filter((s) => s.decision !== null).length;
      if (decisionsCount <= 1) {
        return `💡 Vous n'avez pris que ${decisionsCount} décision(s) d'investissement en ${snapshots.length} trimestres. Les cartes Décision (commerciaux, véhicules, équipements) sont des leviers puissants pour développer votre entreprise.`;
      }
      return null;
    },
  },

  {
    id: "trop-prudent",
    category: "conseil",
    label: "Gestion trop prudente",
    check(snapshots) {
      if (snapshots.length < 4) return null;
      const last = snapshots[snapshots.length - 1];
      const first = snapshots[0];
      // Trésorerie très élevée à la fin mais score moyen = thésaurisation excessive
      if (last.tresorerie > first.tresorerie * 2 && last.score < 120) {
        return `💡 Vous avez accumulé beaucoup de trésorerie (${Math.round(last.tresorerie)} €) mais votre score reste modeste (${Math.round(last.score)}). L'argent qui dort ne rapporte rien — investissez dans des immobilisations ou des commerciaux pour améliorer votre score.`;
      }
      return null;
    },
  },

  // ── FORCES ───────────────────────────────────────────────────

  {
    id: "croissance-reguliere",
    category: "force",
    label: "Croissance régulière du CA",
    check(snapshots) {
      if (snapshots.length < 4) return null;
      let growthCount = 0;
      for (let i = 1; i < snapshots.length; i++) {
        if (snapshots[i].chiffreAffaires >= snapshots[i - 1].chiffreAffaires) growthCount++;
      }
      const ratio = growthCount / (snapshots.length - 1);
      if (ratio >= 0.75) {
        const first = snapshots[0].chiffreAffaires;
        const last = snapshots[snapshots.length - 1].chiffreAffaires;
        const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
        return `✅ Votre CA a progressé ${growthCount} trimestres sur ${snapshots.length - 1} (+${pct}% au total). Une croissance régulière montre une stratégie commerciale efficace et durable.`;
      }
      return null;
    },
  },

  {
    id: "profitabilite",
    category: "force",
    label: "Entreprise profitable",
    check(snapshots) {
      if (snapshots.length < 3) return null;
      const profitable = snapshots.filter((s) => s.resultatNet > 0).length;
      const ratio = profitable / snapshots.length;
      if (ratio >= 0.7) {
        return `✅ Résultat net positif durant ${profitable}/${snapshots.length} trimestres (${Math.round(ratio * 100)}%). Votre entreprise a été durablement rentable — c'est l'indicateur clé de santé financière.`;
      }
      return null;
    },
  },

  {
    id: "resilience",
    category: "force",
    label: "Résilience face aux difficultés",
    check(snapshots) {
      if (snapshots.length < 4) return null;
      let hitBottom = false;
      let bottomIdx = 0;
      for (let i = 0; i < snapshots.length; i++) {
        if (snapshots[i].tresorerie < 0) {
          hitBottom = true;
          bottomIdx = i;
        }
        if (hitBottom && i > bottomIdx && snapshots[i].tresorerie > 3000) {
          return `✅ Vous avez traversé une période de découvert (T${snapshots[bottomIdx].tour}) puis reconstitué votre trésorerie. Cette capacité de rebond montre une bonne gestion de crise — bien joué !`;
        }
      }
      return null;
    },
  },

  {
    id: "capitaux-renforces",
    category: "force",
    label: "Solidité financière renforcée",
    check(snapshots) {
      if (snapshots.length < 3) return null;
      const first = snapshots[0].capitauxPropres;
      const last = snapshots[snapshots.length - 1].capitauxPropres;
      if (first > 0 && last > first * 1.3) {
        const pct = Math.round(((last - first) / first) * 100);
        return `✅ Vos capitaux propres ont augmenté de ${pct}% (${Math.round(first)} € → ${Math.round(last)} €). Vous avez renforcé la solvabilité de votre entreprise, ce qui est rassurant pour les banques et les partenaires.`;
      }
      return null;
    },
  },
];

// ─── Fonction publique ──────────────────────────────────────────

/**
 * Analyse les snapshots trimestriels d'un joueur et retourne les diagnostics.
 * Les résultats sont triés : alertes d'abord, puis conseils, puis forces.
 */
export function analyserSnapshots(snapshots: TrimSnapshot[]): DiagnosticResult[] {
  if (!snapshots || snapshots.length === 0) return [];

  const results: DiagnosticResult[] = [];
  for (const rule of RULES) {
    const message = rule.check(snapshots);
    if (message) {
      results.push({
        id: rule.id,
        category: rule.category,
        label: rule.label,
        message,
      });
    }
  }

  // Tri : alertes → conseils → forces
  const order: Record<DiagnosticCategory, number> = { alerte: 0, conseil: 1, force: 2 };
  results.sort((a, b) => order[a.category] - order[b.category]);

  return results;
}
