"use client";

import { useState } from "react";
import {
  Download, Upload, Lightbulb, Layers, Package, Wallet, Briefcase,
} from "lucide-react";
import { Joueur, getTotalActif, getTotalPassif } from "@jedevienspatron/game-engine";
import { getPitchMetier } from "@/lib/game-engine/data/pitchs-metier";

interface CompanyIntroProps {
  joueurs: Joueur[];
  onStart: () => void;
}

/** Descriptions pédagogiques par nom d'immobilisation (durée de vie en trimestres) */
const IMMO_DESCRIPTIONS: Record<string, { description: string; duree: number; icon: string }> = {
  "Entrepôt":               { description: "Outil de production industrielle",       duree: 6, icon: "🏭" },
  "Camionnette":            { description: "Véhicule de livraison utilitaire",        duree: 2, icon: "🚐" },
  "Camion":                 { description: "Poids lourd de transport logistique",     duree: 6, icon: "🚛" },
  "Machine":                { description: "Équipement de manutention intensif",      duree: 2, icon: "⚙️" },
  "Showroom":               { description: "Agencement de l'espace commercial",       duree: 5, icon: "🏪" },
  "Voiture":                { description: "Véhicule de démonstration client",        duree: 3, icon: "🚗" },
  "Brevet":                 { description: "Propriété intellectuelle (art. 39 CGI)",  duree: 5, icon: "💡" },
  "Matériel informatique":  { description: "Serveurs et postes de travail",           duree: 3, icon: "💻" },
  "Autres Immobilisations": { description: "Investissements futurs via Cartes Décision", duree: 0, icon: "📦" },
};

// ── Couleurs sémantiques (palette officielle) ──────────────────────────────
const C = {
  capitaux:   "#f2ce5c",  // Jaune
  emprunts:   "#f2aebf",  // Rose
  immos:      "#dfa66a",  // Orange brun
  stocks:     "#d992b4",  // Rose violet
  tresorerie: "#8ecf8e",  // Vert
  creances:   "#7fb1de",  // Bleu
};

/** Formate un nombre en euros avec séparateur de milliers (ex. 20 000 €) */
function fmt(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

/**
 * Écran pédagogique d'introduction au bilan comptable
 * Explique ACTIF, PASSIF, l'équilibre fondamental et les amortissements
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

  const pitch = getPitchMetier(j.entreprise.modeEconomique);

  const steps = [
    /* ── Étape 0 (B9-G) : Pitch métier de l'entreprise ── */
    <div key="pitch" className="space-y-4">
      <h2 className="flex items-center gap-2 font-semibold text-white text-base">
        <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
        Voici ton entreprise : {j.entreprise.nom}
      </h2>
      <p className="text-slate-300 text-sm leading-relaxed">
        Avant de plonger dans les chiffres, prends une minute pour comprendre
        <strong className="text-white"> ce que fait ton entreprise</strong> et
        <strong className="text-white"> d&apos;où vient sa valeur</strong>. Chaque
        métier a sa propre logique — les étapes du trimestre sont les mêmes
        pour tous les joueurs, mais les écritures comptables varient selon
        ton modèle économique.
      </p>

      <div
        className="rounded-2xl border border-white/10 bg-slate-950/75 p-4 space-y-3"
        style={{ borderLeftWidth: "4px", borderLeftColor: pitch.couleurAccent }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{j.entreprise.icon}</span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Modèle économique
            </p>
            <p className="text-sm font-semibold text-white">{pitch.modele}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Ce que tu vends
          </p>
          <p className="text-sm text-slate-200 mt-1 leading-snug">{pitch.offre}</p>
        </div>

        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            D&apos;où vient la valeur
          </p>
          <p className="text-sm text-slate-300 mt-1 leading-snug">{pitch.sourceValeur}</p>
        </div>

        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">
            ⚠️ Point de vigilance
          </p>
          <p className="text-sm text-amber-200/90 mt-1 leading-snug">{pitch.goulot}</p>
        </div>

        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80">
            🔄 Ton cycle métier pendant le trimestre
          </p>
          <p className="text-sm text-cyan-100/90 mt-1 leading-snug">{pitch.cycleType}</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 italic leading-relaxed">
        Spécialité active : <span className="text-slate-300">{j.entreprise.specialite}</span>.
        Elle se déclenche automatiquement à chaque clôture de trimestre.
      </p>
    </div>,

    /* ── Étape 1 : D'où vient l'argent ── */
    <div key={0} className="space-y-4">
      <h2 className="flex items-center gap-2 font-semibold text-white text-base">
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        D&apos;où vient l&apos;argent de départ ?
      </h2>
      <p className="text-slate-300 text-sm leading-relaxed">
        Toute entreprise naît grâce à des <strong className="text-white">RESSOURCES</strong> : l&apos;argent
        investi par les propriétaires (<em>capitaux propres</em>) et/ou des emprunts
        bancaires. C&apos;est la colonne <strong className="text-white">PASSIF</strong> du bilan.
      </p>

      {/* Bloc PASSIF */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-4 space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: C.emprunts }}>
          <Download className="h-3 w-3" aria-hidden="true" />
          Ressources (Passif) — Qui finance ?
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
                {fmt(capitaux.valeur)}
              </span>
            </div>
          )}
          {emprunts && (
            <div className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-white">{emprunts.nom}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Financement bancaire — remboursement de −500 € par trimestre
                </div>
              </div>
              <span className="font-bold text-base shrink-0" style={{ color: C.emprunts }}>
                {fmt(emprunts.valeur)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 font-semibold mt-2"
               style={{ backgroundColor: "rgba(242,174,191,0.08)", color: C.emprunts }}>
            <span className="text-sm">TOTAL RESSOURCES (Passif)</span>
            <span className="text-base">{fmt(totalPassif)}</span>
          </div>
        </div>
      </div>

      {/* Note pédagogique */}
      <div className="rounded-xl border border-white/10 px-4 py-3 text-xs text-slate-300 leading-relaxed space-y-1"
           style={{ backgroundColor: "rgba(242,206,92,0.06)" }}>
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: C.capitaux }}>
          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
          Pourquoi emprunter ?
        </div>
        <p>
          Les emprunts ont permis d&apos;acheter les équipements productifs ({fmt(totalImmos)} d&apos;immobilisations).
          Sans ces outils, pas de production ni de ventes possibles !
        </p>
      </div>
    </div>,

    /* ── Étape 1 : Comment cet argent est utilisé ── */
    <div key={1} className="space-y-4">
      <h2 className="flex items-center gap-2 font-semibold text-white text-base">
        <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
        Comment cet argent a-t-il été utilisé ?
      </h2>
      <p className="text-slate-300 text-sm leading-relaxed">
        Avec ces ressources, l&apos;entreprise a acheté des <strong className="text-white">EMPLOIS</strong> :
        biens durables (immobilisations), marchandises (stocks) et liquidités (trésorerie).
        C&apos;est la colonne <strong className="text-white">ACTIF</strong> du bilan.
      </p>

      {/* Bloc ACTIF */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-4 space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: C.creances }}>
          <Upload className="h-3 w-3" aria-hidden="true" />
          Emplois (Actif) — À quoi sert l&apos;argent ?
        </div>
        <div className="space-y-2">

          {/* Immobilisations */}
          {immos.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mt-1 mb-1">
                <Layers className="h-3 w-3" aria-hidden="true" />
                Immobilisations (biens durables)
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
                    <span className="font-bold text-base shrink-0" style={{ color: C.immos }}>{fmt(a.valeur)}</span>
                  </div>
                );
              })}
            </>
          )}

          {/* Stocks */}
          {stocks.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mt-2 mb-1">
                <Package className="h-3 w-3" aria-hidden="true" />
                Stocks (marchandises)
              </div>
              {stocks.map((a) => (
                <div key={a.nom} className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-white">📦 {a.nom}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Marchandises prêtes à être vendues ou transformées</div>
                  </div>
                  <span className="font-bold text-base shrink-0" style={{ color: C.stocks }}>{fmt(a.valeur)}</span>
                </div>
              ))}
            </>
          )}

          {/* Trésorerie */}
          {tresorerie && (
            <>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 mt-2 mb-1">
                <Wallet className="h-3 w-3" aria-hidden="true" />
                Trésorerie
              </div>
              <div className="flex justify-between items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-white">💰 {tresorerie.nom}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Liquidités disponibles pour payer les charges</div>
                </div>
                <span className="font-bold text-base shrink-0" style={{ color: C.tresorerie }}>{fmt(tresorerie.valeur)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 font-semibold mt-2"
               style={{ backgroundColor: "rgba(127,177,222,0.08)", color: C.creances }}>
            <span className="text-sm">TOTAL EMPLOIS (Actif)</span>
            <span className="text-base">{fmt(totalActif)}</span>
          </div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-6"
         style={{ backgroundColor: "#020617", backgroundImage: "radial-gradient(circle at top left, rgba(34,211,238,0.10) 0%, transparent 30%), radial-gradient(circle at 80% 20%, rgba(250,204,21,0.06) 0%, transparent 25%), radial-gradient(circle at 70% 70%, rgba(34,211,238,0.08) 0%, transparent 25%)" }}>
      <div className="rounded-[28px] border border-white/10 bg-slate-950/80 shadow-2xl max-w-lg w-full overflow-hidden">

        {/* En-tête entreprise */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{j.entreprise.icon}</span>
            <div>
              <div className="font-semibold">{j.pseudo} — {j.entreprise.nom}</div>
              <div className="text-sm text-cyan-100">⚡ {j.entreprise.specialite}</div>
            </div>
          </div>
          {/* Bouton Passer — visible dès l'étape 0 */}
          <button
            onClick={onStart}
            className="cursor-pointer shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition-colors hover:bg-white/20"
            aria-label="Passer l'introduction et démarrer directement"
          >
            Passer →
          </button>
        </div>

        {/* Indicateur de progression */}
        <div className="flex gap-2 justify-center p-3 border-b border-white/10 bg-slate-950/50">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all ${
                i <= step ? "bg-cyan-400" : "bg-slate-700"
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
              className="flex-1 cursor-pointer py-3 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-white/5 transition-colors font-medium"
            >
              ← Précédent
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 cursor-pointer bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex-1 cursor-pointer bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              🚀 Commencer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
