// JEDEVIENSPATRON — Modale d'ouverture du nouvel exercice (B6-B, 2026-04-20)
// ===========================================================================
//
// Affichée juste après la validation de `ModalClotureExercice`, avant que le
// flow incrémente le trimestre. Objectif pédagogique : matérialiser la
// bascule d'un exercice à l'autre (« photo de départ ») et rappeler au
// dirigeant l'assiette avec laquelle il commence la période suivante.
//
// Cas fin de partie : on NE monte PAS cette modale (la séquence enchaîne
// directement `gameover`). Cf. plan §4.
"use client";

import { useEffect } from "react";
import { Sparkles, Wallet, TrendingUp } from "lucide-react";
import { Joueur, getTresorerie } from "@jedevienspatron/game-engine";

interface Props {
  joueur: Joueur;
  /** Numéro de l'exercice qui S'OUVRE (= exercice clos + 1). */
  numeroExercice: number;
  /** Premier trimestre du nouvel exercice (= tourActuel + 1 une fois l'incrément fait). */
  premierTourNouvelExercice: number;
  onValider: () => void;
}

function fmtEuros(n: number): string {
  const signe = n < 0 ? "-" : "";
  return `${signe}${Math.abs(n).toLocaleString("fr-FR")} €`;
}

function capitauxPropres(joueur: Joueur): number {
  return joueur.bilan.passifs
    .filter((p) => p.categorie === "capitaux")
    .reduce((s, p) => s + p.valeur, 0);
}

function caTotalPartie(joueur: Joueur): number {
  return joueur.compteResultatCumulePartie.produits.ventes;
}

export default function ModalOuvertureExercice({
  joueur,
  numeroExercice,
  premierTourNouvelExercice,
  onValider,
}: Props) {
  // Modale bloquante mais courte : Entrée ou Escape = valider.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") onValider();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onValider]);

  const kp = capitauxPropres(joueur);
  const tr = getTresorerie(joueur);
  const ca = caTotalPartie(joueur);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/60 shadow-2xl">

        {/* En-tête */}
        <div className="flex items-center gap-4 p-6 pb-4 border-b border-white/10">
          <div className="p-3 rounded-xl bg-cyan-600 text-white shrink-0">
            <Sparkles size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-block text-xs font-bold text-white px-3 py-1 rounded-full bg-cyan-600 mb-1.5">
              NOUVEL EXERCICE
            </span>
            <h2 className="text-xl font-black text-cyan-300 leading-tight">
              Exercice N°{numeroExercice} commence
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              À partir du trimestre T{premierTourNouvelExercice}
            </p>
          </div>
        </div>

        {/* Corps : la photo de départ */}
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Wallet size={12} /> Capitaux propres
              </p>
              <p className="text-lg font-black text-cyan-300 font-mono">{fmtEuros(kp)}</p>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Wallet size={12} /> Trésorerie
              </p>
              <p className={`text-lg font-black font-mono ${tr >= 0 ? "text-cyan-300" : "text-rose-300"}`}>
                {fmtEuros(tr)}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <TrendingUp size={12} /> CA total partie (cumulé depuis T1)
            </p>
            <p className="text-lg font-black text-emerald-300 font-mono">{fmtEuros(ca)}</p>
            <p className="text-xs text-slate-400 mt-1">
              Le compte de résultat du nouvel exercice repart à zéro ; le cumul de partie
              continue de grossir.
            </p>
          </div>
        </div>

        {/* Bouton de validation */}
        <div className="p-6 pt-3">
          <button
            onClick={onValider}
            className="w-full py-3.5 rounded-xl font-black text-white text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Commencer l&apos;exercice →
          </button>
          <p className="text-center text-xs text-slate-500 mt-2">
            Appuie sur Entrée pour démarrer
          </p>
        </div>
      </div>
    </div>
  );
}
