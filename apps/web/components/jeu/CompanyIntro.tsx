"use client";

import { useState } from "react";
import {
  Download, Upload, Lightbulb, Layers, Package, Wallet, Target,
} from "lucide-react";
import {
  Joueur,
  getTotalActif,
  getTotalPassif,
  getModeleValeurEntreprise,
} from "@jedevienspatron/game-engine";

interface CompanyIntroProps {
  joueurs: Joueur[];
  onStart: () => void;
}

/**
 * Descriptions pédagogiques par nom d'immobilisation (durée de vie en trimestres).
 * Mis à jour en B8-E pour refléter les renommages de B8-C :
 *   • "Machine de production" (Belvaux) remplace "Camionnette"
 * Les clés "Camionnette" etc. restent présentes pour la rétrocompatibilité
 * des saves antérieures (ancien bilan Belvaux ou autres entreprises exotiques).
 */
const IMMO_DESCRIPTIONS: Record<string, { description: string; duree: number; icon: string }> = {
  "Entrepôt":               { description: "Bâtiment industriel où sont stockés les produits finis", duree: 8, icon: "🏭" },
  "Machine de production":  { description: "Outil de fabrication cœur de l'atelier Belvaux",         duree: 8, icon: "⚙️" },
  "Camionnette":            { description: "Véhicule de livraison utilitaire",                        duree: 8, icon: "🚐" },
  "Camion":                 { description: "Poids lourd de transport logistique",                     duree: 10, icon: "🚛" },
  "Machine":                { description: "Équipement de manutention pour le tri des colis",         duree: 6, icon: "⚙️" },
  "Showroom":               { description: "Agencement de l'espace commercial Azura",                 duree: 8, icon: "🏪" },
  "Voiture":                { description: "Véhicule de démonstration client",                        duree: 8, icon: "🚗" },
  "Brevet":                 { description: "Propriété intellectuelle protégeant l'innovation",        duree: 8, icon: "💡" },
  "Matériel informatique":  { description: "Serveurs et postes de travail de l'équipe d'ingénieurs",  duree: 5, icon: "💻" },
  "Autres Immobilisations": { description: "Investissements futurs via Cartes Décision",              duree: 0, icon: "📦" },
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

  // B8-E — Pitch métier : lecture du modèle de valeur (triptyque pédagogique).
  // Fallback par secteur si l'entreprise n'expose pas de `modeleValeur` explicite
  // (rétrocompat saves antérieures à B8).
  const modeleValeur = getModeleValeurEntreprise(j.entreprise);
  const MODE_LABEL: Record<typeof modeleValeur.mode, string> = {
    negoce: "Négoce",
    production: "Production",
    service: "Service",
  };

  const steps = [
    /* ── Étape 0 : D'où vient l'argent ── */
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

    /* ── Étape 2 : Mon métier — Pitch métier issu du modeleValeur (B8-E) ── */
    <div key={2} className="space-y-4">
      <h2 className="flex items-center gap-2 font-semibold text-white text-base">
        <Target className="h-4 w-4 shrink-0" aria-hidden="true" />
        Mon métier
      </h2>
      <p className="text-slate-300 text-sm leading-relaxed">
        Avant de commencer, un rappel sur ce que votre entreprise
        <span className="font-semibold text-white"> vend réellement</span> et
        d&apos;où vient sa <span className="font-semibold text-white">marge brute</span>.
        Chaque mode de création de valeur impacte la comptabilisation des ventes
        différemment.
      </p>

      {/* Bloc MÉTIER */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: C.capitaux }}>
            <Target className="h-3 w-3" aria-hidden="true" />
            Modèle de création de valeur
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full border border-white/15 px-2 py-0.5 text-slate-300">
            Mode : {MODE_LABEL[modeleValeur.mode]}
          </span>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Ce que je vends</div>
            <div className="text-sm text-white mt-0.5">{modeleValeur.ceQueJeVends}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">D&apos;où vient la valeur</div>
            <div className="text-sm text-white mt-0.5">{modeleValeur.dOuVientLaValeur}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Mon goulot principal</div>
            <div className="text-sm text-white mt-0.5">{modeleValeur.goulotPrincipal}</div>
          </div>
        </div>
      </div>

      {/* Note pédagogique — impact comptable par mode */}
      <div className="rounded-xl border border-white/10 px-4 py-3 text-xs text-slate-300 leading-relaxed space-y-1"
           style={{ backgroundColor: "rgba(242,206,92,0.06)" }}>
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: C.capitaux }}>
          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
          Impact sur votre compte de résultat
        </div>
        {modeleValeur.mode === "negoce" && (
          <p>
            À chaque vente : <strong className="text-white">Stocks −{fmt(modeleValeur.coutVariable)}</strong> et
            <strong className="text-white"> Achats (CMV) +{fmt(modeleValeur.coutVariable)}</strong>.
            Votre marge brute dépend de votre capacité à négocier un prix d&apos;achat bas.
          </p>
        )}
        {modeleValeur.mode === "production" && (
          <p>
            À chaque vente : <strong className="text-white">Stocks −{fmt(modeleValeur.coutVariable)}</strong> et
            <strong className="text-white"> Production stockée −{fmt(modeleValeur.coutVariable)}</strong>.
            Vous vendez ce que vous avez produit : gérer la capacité de production est vital.
          </p>
        )}
        {modeleValeur.mode === "service" && (
          <p>
            À chaque vente : <strong className="text-white">Services extérieurs +{fmt(modeleValeur.coutVariable)}</strong> et
            <strong className="text-white"> Dettes fournisseurs +{fmt(modeleValeur.coutVariable)}</strong>.
            Vous mobilisez du carburant, de la sous-traitance ou du cloud pour exécuter la mission.
          </p>
        )}
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
            className="cursor-pointer shrink-0 rounded-full border border-amber-300/60 bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300/50 transition-colors hover:bg-amber-400"
            aria-label="Passer l'introduction et démarrer directement"
          >
            Passer →
          </button>
        </div>

        {/* Indicateur de progression */}
        <div className="flex gap-2 justify-center p-3 border-b border-white/10 bg-slate-950/50">
          {[0, 1, 2].map((i) => (
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
