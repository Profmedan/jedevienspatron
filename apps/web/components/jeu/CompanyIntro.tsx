"use client";

import { useState } from "react";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalActif, getTotalPassif } from "@/lib/game-engine/calculators";

interface CompanyIntroProps {
  joueurs: Joueur[];
  onStart: () => void;
}

/** Descriptions pédagogiques par nom d'immobilisation (durée de vie en trimestres) */
const IMMO_DESCRIPTIONS: Record<string, { description: string; duree: number; icon: string }> = {
  "Usine": { description: "Outil de production industrielle", duree: 6, icon: "🏭" },
  "Camionnette": { description: "Véhicule de livraison utilitaire", duree: 2, icon: "🚐" },
  "Camion": { description: "Poids lourd de transport logistique", duree: 6, icon: "🚛" },
  "Machine": { description: "Équipement de manutention intensif", duree: 2, icon: "⚙️" },
  "Showroom": { description: "Agencement de l'espace commercial", duree: 5, icon: "🏪" },
  "Voiture": { description: "Véhicule de démonstration client", duree: 3, icon: "🚗" },
  "Brevet": { description: "Propriété intellectuelle (art. 39 CGI)", duree: 5, icon: "💡" },
  "Matériel informatique": { description: "Serveurs et postes de travail", duree: 3, icon: "💻" },
  "Autres Immobilisations": { description: "Investissements futurs via Cartes Décision", duree: 0, icon: "📦" },
};

/**
 * Écran pédagogique d'introduction au bilan comptable
 * Explique ACTIF, PASSIF, l'équilibre fondamental et les amortissements
 */
export function CompanyIntro({ joueurs, onStart }: CompanyIntroProps) {
  const [step, setStep] = useState(0);
  const j = joueurs[0];

  const totalActif = getTotalActif(j);
  const totalPassif = getTotalPassif(j);
  const capitaux = j.bilan.passifs.find((p) => p.categorie === "capitaux");
  const emprunts = j.bilan.passifs.find((p) => p.categorie === "emprunts");
  const tresorerie = j.bilan.actifs.find((a) => a.categorie === "tresorerie");
  const stocks = j.bilan.actifs.filter((a) => a.categorie === "stocks");
  // Filtrer les immobilisations actives (valeur > 0) — "Autres" est réservé aux investissements futurs
  const immos = j.bilan.actifs.filter(
    (a) => a.categorie === "immobilisations" && a.valeur > 0
  );
  // Total immos initial (pour l'explication du financement par emprunt)
  const totalImmos = immos.reduce((s, a) => s + a.valeur, 0);

  const steps = [
    /* ── Étape 0 : D'où vient l'argent ── */
    <div key={0} className="space-y-4">
      <h2 className="font-semibold text-white text-base">📥 D&apos;où vient l&apos;argent de départ ?</h2>
      <p className="text-slate-300 text-sm leading-relaxed">
        Toute entreprise naît grâce à des <strong>RESSOURCES</strong> : l&apos;argent
        investi par les propriétaires (<em>capitaux propres</em>) et/ou des emprunts
        bancaires. C&apos;est la colonne <strong>PASSIF</strong> du bilan.
      </p>
      <div className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4 space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400">
          📥 Ressources (Passif) — Qui finance ?
        </div>
        <div className="space-y-2">
          {capitaux && (
            <div className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-white">{capitaux.nom}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Apport des associés — ressource permanente, ne se rembourse pas
                </div>
              </div>
              <span className="font-bold text-purple-400 text-base shrink-0">
                {capitaux.valeur}
              </span>
            </div>
          )}
          {emprunts && (
            <div className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-white">{emprunts.nom}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Financement bancaire — remboursement de −1 par trimestre pendant {emprunts.valeur} trimestres
                </div>
              </div>
              <span className="font-bold text-purple-400 text-base shrink-0">
                {emprunts.valeur}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center gap-3 rounded-xl border border-white/10 bg-purple-950/20 px-3 py-2.5 font-semibold text-purple-400 mt-2">
            <span className="text-sm">TOTAL RESSOURCES (Passif)</span>
            <span className="text-base">{totalPassif}</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-purple-950/20 px-4 py-3 text-xs text-slate-300 leading-relaxed space-y-1">
        <span className="font-semibold text-purple-400">💡 Pourquoi emprunter ?</span>
        <p>Les emprunts ont permis d&apos;acheter les équipements productifs ({totalImmos} d&apos;immobilisations). Sans ces outils, pas de production ni de ventes possibles !</p>
      </div>
    </div>,

    /* ── Étape 1 : Comment cet argent est utilisé ── */
    <div key={1} className="space-y-4">
      <h2 className="font-semibold text-white text-base">
        📤 Comment cet argent a-t-il été utilisé ?
      </h2>
      <p className="text-slate-300 text-sm leading-relaxed">
        Avec ces ressources, l&apos;entreprise a acheté des <strong>EMPLOIS</strong> :
        biens durables (immobilisations), marchandises (stocks) et liquidités (trésorerie).
        C&apos;est la colonne <strong>ACTIF</strong> du bilan.
      </p>
      <div className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-4 space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-400">
          📤 Emplois (Actif) — À quoi sert l&apos;argent ?
        </div>
        <div className="space-y-2">
          {/* Immobilisations avec description et durée d'amortissement */}
          {immos.length > 0 && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mt-1 mb-1">
                🏗️ Immobilisations (biens durables)
              </div>
              {immos.map((a) => {
                const info = IMMO_DESCRIPTIONS[a.nom];
                return (
                  <div
                    key={a.nom}
                    className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-white">
                        {info?.icon ?? "🔧"} {a.nom}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {info?.description ?? "Investissement durable"}
                        {info && info.duree > 0 && (
                          <span className="ml-1 text-sky-400 font-medium">
                            · durée de vie : {info.duree} trimestres
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-sky-400 text-base shrink-0">{a.valeur}</span>
                  </div>
                );
              })}
            </>
          )}
          {/* Stocks */}
          {stocks.length > 0 && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mt-2 mb-1">
                📦 Stocks (marchandises)
              </div>
              {stocks.map((a) => (
                <div
                  key={a.nom}
                  className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-white">📦 {a.nom}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Marchandises prêtes à être vendues ou transformées</div>
                  </div>
                  <span className="font-bold text-sky-400 text-base shrink-0">{a.valeur}</span>
                </div>
              ))}
            </>
          )}
          {/* Trésorerie */}
          {tresorerie && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mt-2 mb-1">
                💰 Trésorerie
              </div>
              <div className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-white">💰 {tresorerie.nom}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Liquidités disponibles pour payer les charges</div>
                </div>
                <span className="font-bold text-sky-400 text-base shrink-0">{tresorerie.valeur}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center gap-3 rounded-xl border border-white/10 bg-sky-950/20 px-3 py-2.5 font-semibold text-sky-400 mt-2">
            <span className="text-sm">TOTAL EMPLOIS (Actif)</span>
            <span className="text-base">{totalActif}</span>
          </div>
        </div>
      </div>
    </div>,

  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 pt-6">
      <div className="rounded-[28px] border border-white/10 bg-slate-950/75 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-4 flex items-center gap-3">
          <span className="text-3xl">{j.entreprise.icon}</span>
          <div>
            <div className="font-semibold">{j.pseudo} — {j.entreprise.nom}</div>
            <div className="text-sm text-emerald-100">{j.entreprise.specialite}</div>
          </div>
        </div>

        {/* Progression */}
        <div className="flex gap-2 justify-center p-3 border-b border-white/10 bg-slate-950/50">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all ${
                i <= step ? "bg-emerald-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Contenu */}
        <div className="p-6 min-h-96">{steps[step]}</div>

        {/* Boutons navigation */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-2 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-white/5 transition-colors font-medium"
            >
              ← Précédent
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              🚀 C&apos;est parti — Commencer !
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
