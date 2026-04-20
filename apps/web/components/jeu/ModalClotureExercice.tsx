// JEDEVIENSPATRON — Modale de clôture d'exercice (B6-B, 2026-04-20)
// =================================================================
//
// Affichée après l'étape BILAN lorsque `estFinExercice(tour, nbToursMax)` est
// vrai. Bloquante : il faut que le dirigeant valide ses dividendes pour que
// le flow enchaîne sur `ModalOuvertureExercice` puis le trimestre suivant.
//
// Règles métier (arbitrées par Pierre, cf. `tasks/plan-b6-fin-exercice.md`) :
//   · IS = 15 % du résultat avant IS, 0 sur perte.
//   · Réserve légale = 500 € tant que capitaux propres < 20 000 € et bénéfice.
//   · Dividendes = 0 / 10 / 25 / 50 % de (résultat après IS − réserve légale).
//   · Perte : pas d'IS, pas de réserve, pas de dividendes, perte imputée aux
//     capitaux propres.
//
// Le calcul affiché est une *preview* : l'application réelle est déclenchée
// par `onValider(pctDividendes)` qui relaie au moteur `appliquerClotureExercice`.
"use client";

import { useEffect, useState } from "react";
import { Landmark, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import {
  Joueur,
  TAUX_IS,
  RESERVE_LEGALE_MONTANT,
  RESERVE_LEGALE_SEUIL_CAPITAUX,
  TAUX_DIVIDENDES_AUTORISES,
} from "@jedevienspatron/game-engine";

interface Props {
  joueur: Joueur;
  numeroExercice: number;
  premierTourExercice: number;
  dernierTourExercice: number;
  /** Callback invoqué avec le % de dividendes choisi (0, 0.10, 0.25 ou 0.50). */
  onValider: (pctDividendes: number) => void;
}

function fmtEuros(n: number): string {
  const signe = n < 0 ? "-" : "";
  return `${signe}${Math.abs(n).toLocaleString("fr-FR")} €`;
}

function fmtPct(p: number): string {
  return `${Math.round(p * 100)} %`;
}

/**
 * Calcule les agrégats affichables à partir du compteResultat courant du
 * joueur (celui de l'exercice en cours, pas le cumul partie). Fonction
 * pure : n'altère pas `joueur`.
 */
function calculerPreview(joueur: Joueur, pctDividendes: number) {
  const { charges, produits } = joueur.compteResultat;
  const totalProduits =
    produits.ventes +
    produits.productionStockee +
    produits.produitsFinanciers +
    produits.revenusExceptionnels;
  const totalCharges =
    charges.achats +
    charges.servicesExterieurs +
    charges.impotsTaxes +
    charges.chargesInteret +
    charges.chargesPersonnel +
    charges.chargesExceptionnelles +
    charges.dotationsAmortissements;
  const resultatAvantIS = totalProduits - totalCharges;
  const impotSociete = resultatAvantIS > 0 ? Math.round(resultatAvantIS * TAUX_IS) : 0;
  const resultatApresIS = resultatAvantIS - impotSociete;

  const capitauxPropres = joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
  const reserveLegale =
    resultatApresIS > 0 && capitauxPropres < RESERVE_LEGALE_SEUIL_CAPITAUX
      ? Math.min(RESERVE_LEGALE_MONTANT, resultatApresIS)
      : 0;

  const resultatDistribuable = Math.max(0, resultatApresIS - reserveLegale);
  const dividendesVerses = Math.round(resultatDistribuable * pctDividendes);
  const reportANouveau = resultatApresIS - reserveLegale - dividendesVerses;
  const deltaCapitaux = reserveLegale + reportANouveau;

  return {
    totalProduits,
    totalCharges,
    resultatAvantIS,
    impotSociete,
    resultatApresIS,
    capitauxPropres,
    reserveLegale,
    resultatDistribuable,
    dividendesVerses,
    reportANouveau,
    deltaCapitaux,
  };
}

export default function ModalClotureExercice({
  joueur,
  numeroExercice,
  premierTourExercice,
  dernierTourExercice,
  onValider,
}: Props) {
  // Par défaut on pré-sélectionne 0 % (tout en réserves) — choix prudent pour
  // un dirigeant qui débute, et cohérent avec le discours pédagogique.
  const [pctChoisi, setPctChoisi] = useState<number>(0);

  // Escape → équivalent à « valider 0 % » serait risqué (engagement financier).
  // On ignore donc volontairement la touche Escape sur cette modale — bloquante.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") onValider(pctChoisi);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onValider, pctChoisi]);

  const preview = calculerPreview(joueur, pctChoisi);
  const perteExercice = preview.resultatApresIS <= 0;
  const duree = dernierTourExercice - premierTourExercice + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/60 shadow-2xl">

        {/* En-tête */}
        <div className="flex items-center gap-4 p-6 pb-4 border-b border-white/10">
          <div className="p-3 rounded-xl bg-amber-600 text-white shrink-0">
            <Landmark size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-block text-xs font-bold text-white px-3 py-1 rounded-full bg-amber-600 mb-1.5">
              CLÔTURE D&apos;EXERCICE
            </span>
            <h2 className="text-xl font-black text-amber-300 leading-tight">
              Exercice N°{numeroExercice} — {joueur.entreprise.nom}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Trimestres {premierTourExercice}–{dernierTourExercice}
              {" · "}
              {duree} trimestre{duree > 1 ? "s" : ""}
              {duree < 4 && " (exercice partiel)"}
            </p>
          </div>
        </div>

        {/* Corps */}
        <div className="px-6 py-4 space-y-3">

          {/* Compte de résultat de l'exercice */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Compte de résultat de l&apos;exercice
            </p>
            <div className="space-y-1 text-sm text-slate-200">
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  Total produits
                </span>
                <span className="font-mono">{fmtEuros(preview.totalProduits)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <TrendingDown size={14} className="text-rose-400" />
                  Total charges
                </span>
                <span className="font-mono">−{fmtEuros(preview.totalCharges)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-bold">
                <span className={preview.resultatAvantIS >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  Résultat avant IS
                </span>
                <span className={`font-mono ${preview.resultatAvantIS >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {fmtEuros(preview.resultatAvantIS)}
                </span>
              </div>
            </div>
          </div>

          {/* Impôt sur les sociétés */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Impôt sur les sociétés
            </p>
            <div className="text-sm text-slate-200 space-y-1">
              {preview.resultatAvantIS > 0 ? (
                <>
                  <p>
                    Assiette (résultat avant IS) × taux {fmtPct(TAUX_IS)} ={" "}
                    <span className="font-mono font-bold text-amber-300">
                      {fmtEuros(preview.impotSociete)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    L&apos;IS est décaissé immédiatement en trésorerie (pas de dette portée).
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  {preview.resultatAvantIS < 0
                    ? "Exercice en perte : pas d'IS à payer (pas de crédit d'impôt non plus)."
                    : "Résultat nul : pas d'IS à payer."}
                </p>
              )}
            </div>
          </div>

          {/* Réserve légale — affichée seulement si applicable */}
          {preview.reserveLegale > 0 && (
            <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Réserve légale
              </p>
              <div className="text-sm text-slate-200 space-y-1">
                <p>
                  Dotation obligatoire :{" "}
                  <span className="font-mono font-bold text-amber-300">
                    {fmtEuros(preview.reserveLegale)}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  Vos capitaux propres ({fmtEuros(preview.capitauxPropres)}) sont sous le seuil
                  de {fmtEuros(RESERVE_LEGALE_SEUIL_CAPITAUX)} : la loi impose une mise en
                  réserve de {fmtEuros(RESERVE_LEGALE_MONTANT)} par exercice bénéficiaire.
                </p>
              </div>
            </div>
          )}

          {/* Affectation du résultat — choix du dirigeant */}
          {perteExercice ? (
            <div className="bg-rose-950/40 rounded-xl p-4 border border-rose-500/40 shadow-sm">
              <p className="text-xs font-bold text-rose-200 uppercase tracking-widest mb-2">
                Exercice en perte
              </p>
              <p className="text-sm text-rose-100 leading-relaxed">
                Pas d&apos;IS, pas de réserve, pas de dividendes. La perte de{" "}
                <span className="font-mono font-bold">
                  {fmtEuros(Math.abs(preview.resultatApresIS))}
                </span>{" "}
                sera imputée sur vos capitaux propres (report à nouveau débiteur).
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Affectation du résultat — choix du dirigeant
              </p>
              <p className="text-xs text-slate-400 mb-2">
                Bénéfice distribuable :{" "}
                <span className="font-mono font-bold text-slate-200">
                  {fmtEuros(preview.resultatDistribuable)}
                </span>
              </p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {TAUX_DIVIDENDES_AUTORISES.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPctChoisi(pct)}
                    className={`py-2 rounded-lg font-bold text-sm border-2 transition-all ${
                      pctChoisi === pct
                        ? "bg-amber-600 border-amber-400 text-white shadow-md"
                        : "bg-slate-900 border-white/10 text-slate-300 hover:border-amber-500/60"
                    }`}
                  >
                    {fmtPct(pct)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 rounded-lg p-2 border border-white/5">
                  <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mb-0.5">
                    Dividendes versés
                  </p>
                  <p className="font-mono text-amber-300 font-bold">
                    −{fmtEuros(preview.dividendesVerses)}
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2 border border-white/5">
                  <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mb-0.5">
                    Affecté aux capitaux propres
                  </p>
                  <p className="font-mono text-emerald-300 font-bold">
                    +{fmtEuros(preview.deltaCapitaux)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Synthèse pédagogique */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <PieChart size={12} /> En une phrase
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">
              {perteExercice
                ? "La perte de cet exercice diminue vos capitaux propres. L'exercice suivant reparte avec un compte de résultat à zéro."
                : `Votre bénéfice de ${fmtEuros(preview.resultatApresIS)} après IS alimente vos capitaux propres ${preview.deltaCapitaux > 0 ? `à hauteur de ${fmtEuros(preview.deltaCapitaux)}` : ""}${preview.dividendesVerses > 0 ? ` ; vous distribuez ${fmtEuros(preview.dividendesVerses)} de dividendes` : ""}.`}
            </p>
          </div>
        </div>

        {/* Bouton de validation */}
        <div className="p-6 pt-3">
          <button
            onClick={() => onValider(pctChoisi)}
            className="w-full py-3.5 rounded-xl font-black text-white text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-2"
          >
            <Landmark size={18} />
            Valider la clôture — Fermer l&apos;exercice
          </button>
          <p className="text-center text-xs text-slate-500 mt-2">
            Cette action est définitive. Le compte de résultat sera remis à zéro pour
            l&apos;exercice suivant.
          </p>
        </div>
      </div>
    </div>
  );
}
