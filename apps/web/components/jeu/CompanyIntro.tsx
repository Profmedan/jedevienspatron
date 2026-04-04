"use client";

import { useState } from "react";
import { Joueur, getTotalActif, getTotalPassif } from "@jedevienspatron/game-engine";

interface CompanyIntroProps {
  joueurs: Joueur[];
  onStart: () => void;
}

/** Descriptions pédagogiques par nom d’immobilisation (durée de vie en trimestres) */
const IMMO_DESCRIPTIONS: Record<string, { description: string; duree: number; icon: string }> = {
  "Usine":               { description: "Outil de production industrielle",       duree: 6, icon: "🏭" },
  "Camionnette":         { description: "Véhicule de livraison utilitaire",        duree: 2, icon: "🚐" },
  "Camion":              { description: "Poids lourd de transport logistique",     duree: 6, icon: "🚛" },
  "Machine":             { description: "Équipement de manutention intensif",      duree: 2, icon: "⚙️" },
  "Showroom":            { description: "Agencement de l’espace commercial",       duree: 5, icon: "🏪" },
  "Voiture":             { description: "Véhicule de démonstration client",        duree: 3, icon: "🚗" },
  "Brevet":              { description: "Propriété intellectuelle (art. 39 CGI)",  duree: 5, icon: "💡" },
  "Matériel informatique": { description: "Serveurs et postes de travail",         duree: 3, icon: "💻" },
  "Autres Immobilisations": { description: "Investissements futurs via Cartes Décision", duree: 0, icon: "📦" },
};

// ── Couleurs sémantiques (palette officielle) ──────────────────────────────
const C = {
  capitaux:       "#f2ce5c",  // Jaune
  emprunts:       "#f2aebf",  // Rose
  immos:          "#dfa66a",  // Orange brun
  stocks:         "#d992b4",  // Rose violet
  tresorerie:     "#8ecf8e",  // Vert
  creances:       "#7fb1de",  // Bleu
  dettes:         "#f59f6d",  // Orange
  charges:        "#e66b6b",  // Rouge
  produits:       "#5cb88a",  // Vert émeraude
};

/**
 * Écran pédagogique d’introduction au bilan comptable
 * Explique ACTIF, PASSIF, l’équilibre fondamental et les amortissements
 */
export function CompanyIntro({ joueurs, onStart }: CompanyIntroProps) {
  const [step, setStep] = useState(0);
  const j = joueurs[0];

  const totalActif  = getTotalActif(j);
  const totalPassif = getTotalPassif(j);
  const capitaux    = j.bilan.passifs.find((p) => p.categorie === "capitaux");
  const emprunts    = j.bilan.passifs.find((p) => p.categorie === "emprunts");
  const tresorerie  = j.bilan.actifs.find((a)  => a.categorie === "tresorerie");
  const stocks      = j.bilan.actifs.filter((a) => a.categorie === "stocks");
  const immos       = j.bilan.actifs.filter((a) => a.categorie === "immobilisations" && a.valeur > 0);
  const totalImmos  = immos.reduce((s, a) => s + a.valeur, 0);

  const steps = [
    /* ── Étape 0 : D’où vient l’argent ── */
    <div key={0} className="space-y-4">
      <h2 className="font-semibold text-white text-base">📥 D&apos;où vient l&apos;argent de départ ?</h2>
      <p className="text-slate-300 text-sm leading-relaxed">
        Toute entreprise naît grâce à des <strong className="text-white">RESSOURCES</strong> : l&apos;argent
        investi par les propriétaires (<em>capitaux propres</em>) et/ou des emprunts
        bancaires. C&apos;est la colonne <strong className="text-white">PASSIF</strong> du bilan.
      </p>

      {/* Bloc PASSIF */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-4 space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: C.emprunts }}>
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
              <span className="font-bold text-base shrink-0" style={{ color: C.capitaux }}>
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
              <span className="font-bold text-base shrink-0" style={{ color: C.emprunts }}>
                {emprunts.valeur}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 font-semibold mt-2"
               style={{ backgroundColor: "rgba(242,174,191,0.08)", color: C.emprunts }}>
            <span className="text-sm">TOTAL RESSOURCES (Passif)</span>
            <span className="text-base">{totalPassif}</span>
          </div>
        </div>
      </div>

      {/* Note pédagogique */}
      <div className="rounded-xl border border-white/10 px-4 py-3 text-xs text-slate-300 leading-relaxed space-y-1"
           style={{ backgroundColor: "rgba(242,206,92,0.06)" }}>
        <div className="font-semibold" style={{ color: C.capitaux }}>💡 Pourquoi emprunter ?</div>
        <p>Les emprunts ont permis d&apos;acheter les équipements productifs ({totalImmos} d&apos;immobilisations). Sans ces outils, pas de production ni de ventes possibles !</p>
      </div>
    </div>,

    /* ── Étape 1 : Comment cet argent est utilisé ── */
    <div key={1} className="space-y-4">
      <h2 className="font-semibold text-white text-base">
        📤 Comment cet argent a-t-il été utilisé ?
      </h2>
      <p className="text-slate-300 text-sm leading-relaxed">
        Avec ces ressources, l&apos;entreprise a acheté des <strong className="text-white">EMPLOIS</strong> :
        biens durables (immobilisations), marchandises (stocks) et liquidités (trésorerie).
        C&apos;est la colonne <strong className="text-white">ACTIF</strong> du bilan.
      </p>

      {/* Bloc ACTIF */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-4 space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: C.creances }}>
          📤 Emplois (Actif) — À quoi sert l&apos;argent ?
        </div>
        <div className="space-y-2">

          {/* Immobilisations */}
          {immos.length > 0 && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mt-1 mb-1">
                🏗️ Immobilisations (biens durables)
              </div>
              {immos.map((a) => {
                const info = IMMO_DESCRIPTIONS[a.nom];
                return (
                  <div key={a.nom} className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-white">
                        {info?.icon ?? "🔧"} {a.nom}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {info?.description ?? "Investissement durable"}
                        {info && info.duree > 0 && (
                          <span className="ml-1 font-medium" style={{ color: C.creances }}>
                            · durée de vie : {info.duree} trimestres
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-base shrink-0" style={{ color: C.immos }}>{a.valeur}</span>
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
                <div key={a.nom} className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-white">📦 {a.nom}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Marchandises prêtes à être vendues ou transformées</div>
                  </div>
                  <span className="font-bold text-base shrink-0" style={{ color: C.stocks }}>{a.valeur}</span>
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
                <span className="font-bold text-base shrink-0" style={{ color: C.tresorerie }}>{tresorerie.valeur}</span>
              </div>
            </>
          )}

          <div className="flex justify-between items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 font-semibold mt-2"
               style={{ backgroundColor: "rgba(127,177,222,0.08)", color: C.creances }}>
            <span className="text-sm">TOTAL EMPLOIS (Actif)</span>
            <span className="text-base">{totalActif}</span>
          </div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-6"
         style={{ backgroundColor: "#020617", backgroundImage: "radial-gradient(circle at top left, rgba(34,211,238,0.10) 0%, transparent 30%), radial-gradient(circle at 80% 20%, rgba(250,204,21,0.06) 0%, transparent 25%), radial-gradient(circle at 70% 70%, rgba(16,185,129,0.08) 0%, transparent 25%)" }}>
      <div className="rounded-[28px] border border-white/10 bg-slate-950/80 shadow-2xl max-w-lg w-full overflow-hidden">

        {/* En-tête entreprise */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-4 flex items-center gap-3">
          <span className="text-3xl">{j.entreprise.icon}</span>
          <div>
            <div className="font-semibold">{j.pseudo} — {j.entreprise.nom}</div>
            <div className="text-sm text-emerald-100">⚡ {j.entreprise.specialite}</div>
          </div>
        </div>

        {/* Indicateur de progression */}
        <div className="flex gap-2 justify-center p-3 border-b border-white/10 bg-slate-950/50">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all ${
                i <= step ? "bg-emerald-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Contenu */}
        <div className="p-5 min-h-96">{steps[step]}</div>

        {/* Navigation */}
        <div className="px-5 pb-5 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-white/5 transition-colors font-medium"
            >
              ← Précédent
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              🚀 C&apos;est parti — Commencer !
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
