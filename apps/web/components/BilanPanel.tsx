"use client";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalActif, getTotalPassif, getResultatNet } from "@/lib/game-engine/calculators";
import { isBonPourEntreprise } from "@/lib/game-engine/poste-helpers";
import { useState } from "react";

type RecentMod = { poste: string; ancienneValeur: number; nouvelleValeur: number };

interface Props {
  joueur: Joueur;
  highlightedPoste?: string | null;
  recentModifications?: RecentMod[];
}

// ─── Données pédagogiques enrichies par poste ─────────────────────────────────
// regleOr : explication contextuelle du lien avec ACTIF = PASSIF
const TOOLTIPS: Record<string, {
  definition: string;
  exemple: string;
  couleur: string;
  cote: "actif" | "passif";
  regleOr: string;
}> = {
  immobilisations: {
    definition: "Biens durables achetés par l'entreprise (machines, véhicules, brevets…). Ils se déprécient chaque trimestre = amortissements.",
    exemple: "Ex : Une usine à 3, une camionnette à 1 = 4 d'immobilisations.",
    couleur: "#d97706",
    cote: "actif",
    regleOr: "Quand tu achètes un bien, l'Actif ↑ (nouvelle immo) et le Passif ↑ (emprunt ou trésorerie ↓ côté actif). Quand il s'amortit chaque trimestre, l'Actif ↓ et le Résultat ↓ — les deux côtés bougent ensemble.",
  },
  stocks: {
    definition: "Marchandises achetées mais pas encore vendues. Augmentent à l'achat, diminuent à la vente (le coût des marchandises vendues est comptabilisé en charge).",
    exemple: "Ex : Tu achètes 4 unités → Stocks = 4. Tu en vends 2 → Stocks = 2, coût des ventes = 2.",
    couleur: "#db2777",
    cote: "actif",
    regleOr: "Achat comptant → Stocks ↑ (Actif) et Trésorerie ↓ (Actif). Bilan équilibré car un actif remplace un autre. Achat à crédit → Stocks ↑ (Actif) et Dettes fournisseurs ↑ (Passif). Vente → Stocks ↓ (Actif) et Coût des ventes ↑ (Charge = Résultat ↓ = Passif ↓).",
  },
  tresorerie: {
    definition: "Argent disponible immédiatement (compte bancaire). Augmente aux encaissements, diminue aux décaissements. Ne peut pas être négatif (→ découvert).",
    exemple: "Ex : Trésorerie 8. Tu paies 2 de charges → Trésorerie 6.",
    couleur: "#059669",
    cote: "actif",
    regleOr: "La trésorerie est le miroir de tous tes flux : chaque rentrée ou sortie d'argent modifie la trésorerie (Actif) et son pendant côté Passif (créance encaissée, dette payée, charge comptabilisée…). Si elle tombe à 0, le découvert prend le relais côté Passif.",
  },
  creances: {
    definition: "Argent que vos clients vous doivent mais n'ont pas encore payé. 'Dans 1 trimestre' sera encaissé au tour suivant, 'dans 2 trimestres' dans deux tours.",
    exemple: "Ex : Vente Grand Compte = +3 Ventes +3 Créances (encaissé dans 2 trimestres).",
    couleur: "#2563eb",
    cote: "actif",
    regleOr: "Une vente à crédit crée deux mouvements simultanés : Créances ↑ (Actif, promesse de paiement) et Ventes ↑ (Produit = Résultat ↑ = Passif ↑). Quand le client paie enfin : Trésorerie ↑ (Actif) et Créances ↓ (Actif). Le passif ne bouge pas — ce n'était que l'encaissement.",
  },
  capitaux: {
    definition: "Capitaux propres : argent investi par les propriétaires + résultats accumulés. Augmentent avec les bénéfices, diminuent avec les pertes.",
    exemple: "Ex : Capital 12. Bénéfice de 2 → Capitaux 14 à la clôture.",
    couleur: "#7c3aed",
    cote: "passif",
    regleOr: "Les capitaux propres sont ce que l'entreprise 'doit' à ses propriétaires. Ils ↑ avec les bénéfices (Résultat positif migre dans les capitaux en fin de période) et ↓ avec les pertes. Si les capitaux propres passent en négatif → l'entreprise doit plus qu'elle ne possède → faillite.",
  },
  emprunts: {
    definition: "Dettes à long terme envers la banque. Remboursées progressivement (-1 par tour). Génèrent des charges d'intérêt.",
    exemple: "Ex : Emprunt 4, remboursement 1/tour → Tour 1: 3, Tour 2: 2…",
    couleur: "#ea580c",
    cote: "passif",
    regleOr: "Quand tu empruntes, l'argent arrive en trésorerie (Actif ↑) et la dette s'inscrit au passif (Passif ↑) → bilan équilibré. Chaque remboursement : Trésorerie ↓ (Actif) et Emprunt ↓ (Passif). Les intérêts payés réduisent aussi la trésorerie et augmentent les charges (Résultat ↓).",
  },
  dettes: {
    definition: "Dettes à court terme : fournisseurs (achats à crédit, payables au tour suivant) ou fiscales (impôts à payer).",
    exemple: "Ex : Achat à crédit de 3 → Dettes fournisseurs +3 (payé au tour suivant).",
    couleur: "#e11d48",
    cote: "passif",
    regleOr: "Acheter à crédit crée simultanément un Actif (Stock ↑) et un Passif (Dette fournisseur ↑) — bilan équilibré. Quand tu règles la facture : Trésorerie ↓ (Actif) et Dette ↓ (Passif) — le bilan reste équilibré.",
  },
  decouvert: {
    definition: "⚠️ Découvert bancaire : trésorerie négative. Si le découvert dépasse 5, des pénalités s'appliquent. Au-delà, c'est la faillite.",
    exemple: "Ex : Tréso = 0, tu paies 3 → Tréso = 0, Découvert = 3 (dangereux !).",
    couleur: "#dc2626",
    cote: "passif",
    regleOr: "Le découvert est la trésorerie négative déplacée au passif. L'Actif Trésorerie reste à 0 ; c'est le Passif Découvert qui absorbe la différence — l'équation ACTIF = PASSIF reste vraie, mais c'est un signal d'alarme : la banque finance tes opérations à ta place.",
  },
};

/** Badge avant → après affiché à la place de la valeur courante. */
function BeforeAfterBadge({ mod }: { mod: RecentMod }) {
  const delta = mod.nouvelleValeur - mod.ancienneValeur;
  const bon = isBonPourEntreprise(mod.poste, delta);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="line-through text-gray-500 text-xs tabular-nums">{mod.ancienneValeur}</span>
      <span className="text-gray-500 text-xs">→</span>
      <span className={`font-black text-sm tabular-nums ${bon ? "text-emerald-400" : "text-red-400"}`}>
        {mod.nouvelleValeur}
      </span>
      <span className={`text-[10px] font-bold px-1 rounded-full ${bon ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"}`}>
        {delta > 0 ? "+" : ""}{delta}
      </span>
    </span>
  );
}

function TooltipPoste({ label, value, color, categorie, sub, highlighted, recentMod }: {
  label: string;
  value: number;
  color?: string;
  categorie?: string;
  sub?: boolean;
  highlighted?: boolean;
  recentMod?: RecentMod;
}) {
  const [show, setShow] = useState(false);
  const info = categorie ? TOOLTIPS[categorie] : null;

  return (
    <div className="relative">
      <div
        className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg mb-1 transition-all duration-300 ${
          info ? "cursor-pointer" : "cursor-default"
        } ${
          sub ? "text-sm" : "font-semibold"
        } ${
          highlighted
            ? "ring-2 ring-amber-400 bg-amber-500/20 shadow-lg shadow-amber-400/20 scale-[1.03] -mx-0.5"
            : ""
        } ${
          show && info ? "ring-1 ring-white/20 bg-white/5" : ""
        }`}
        style={{
          backgroundColor: (highlighted || (show && info)) ? undefined : (color ? `${color}28` : undefined),
          borderLeft: color ? `3px solid ${color}` : undefined,
        }}
        onClick={() => info && setShow((s) => !s)}
      >
        <span className="text-gray-200 flex items-center gap-1 text-sm">
          {label}
          {info && (
            <span className={`text-[10px] leading-none transition-colors ${show ? "text-white" : "text-gray-500"}`}>
              {show ? "▲" : "ⓘ"}
            </span>
          )}
        </span>
        <div className="flex items-center">
          {recentMod ? (
            <BeforeAfterBadge mod={recentMod} />
          ) : (
            <span className={`font-bold tabular-nums text-sm ${value < 0 ? "text-red-400" : "text-gray-100"}`}>
              {value >= 0 ? value : `(${Math.abs(value)})`}
            </span>
          )}
        </div>
      </div>

      {/* ── Panneau règle d'or contextuel ── */}
      {show && info && (
        <div
          className="mb-2 rounded-xl border p-3 text-xs space-y-2 shadow-lg"
          style={{ borderColor: `${info.couleur}60`, backgroundColor: `${info.couleur}10` }}
        >
          {/* Définition */}
          <p className="text-gray-200 leading-relaxed">{info.definition}</p>
          <p className="text-gray-500 italic border-t border-white/10 pt-2">{info.exemple}</p>

          {/* Règle d'or */}
          <div className="border-t border-white/10 pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1.5"
               style={{ color: info.cote === "actif" ? "#60a5fa" : "#fbbf24" }}>
              ⚖️ Règle d&apos;or — Comment ça équilibre
            </p>
            <p className="text-gray-300 leading-relaxed">{info.regleOr}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, color }: { label: string; color?: string }) {
  return (
    <div
      className="text-[10px] font-black uppercase tracking-widest mt-3 mb-1 px-1 flex items-center gap-1.5"
      style={{ color: color ?? "#9ca3af" }}
    >
      <span className="h-px flex-1 opacity-30" style={{ backgroundColor: color ?? "#9ca3af" }} />
      {label}
      <span className="h-px flex-1 opacity-30" style={{ backgroundColor: color ?? "#9ca3af" }} />
    </div>
  );
}

function ColumnTotal({ label, value, variant }: { label: string; value: number; variant: "actif" | "passif" }) {
  const isActif = variant === "actif";
  return (
    <div className={`flex justify-between items-center px-3 py-2.5 rounded-xl mt-3 border-2 ${
      isActif ? "bg-blue-600 border-blue-600 text-white" : "bg-amber-600 border-amber-600 text-white"
    }`}>
      <span className="text-xs font-bold uppercase tracking-wide opacity-90">{label}</span>
      <span className="text-2xl font-black tabular-nums">{value}</span>
    </div>
  );
}

function findMod(mods: RecentMod[] | undefined, poste: string): RecentMod | undefined {
  return mods?.find((m) => m.poste === poste);
}

export default function BilanPanel({ joueur, highlightedPoste, recentModifications }: Props) {
  const totalActif  = getTotalActif(joueur);
  const resultat    = getResultatNet(joueur);
  const totalPassif = getTotalPassif(joueur);
  const equilibre   = Math.abs(totalActif - totalPassif) < 0.01;

  const immobilisations = joueur.bilan.actifs.filter((a) => a.categorie === "immobilisations");
  const stocks          = joueur.bilan.actifs.filter((a) => a.categorie === "stocks");
  const tresorerie      = joueur.bilan.actifs.find((a) => a.categorie === "tresorerie");
  const capitaux        = joueur.bilan.passifs.filter((p) => p.categorie === "capitaux");
  const emprunts        = joueur.bilan.passifs.filter((p) => p.categorie === "emprunts");
  const dettes          = joueur.bilan.passifs.filter((p) => p.categorie === "dettes");

  return (
    <div className="bg-gray-900 rounded-2xl shadow-md border border-gray-700 overflow-hidden">

      {/* ── En-tête ── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
        <h3 className="font-black text-white text-base tracking-widest uppercase">📋 Bilan</h3>
        <span className="text-xs text-slate-400 italic">Clique sur ⓘ pour la règle d&apos;or de chaque poste</span>
      </div>

      {/* ── Équation ACTIF = PASSIF (informatif, non cliquable) ── */}
      <div className={`mx-4 mt-4 mb-3 rounded-2xl p-3 border-2 ${
        equilibre ? "border-indigo-700/60 bg-gradient-to-r from-blue-950/60 via-gray-800 to-amber-950/40" : "border-red-700 bg-red-950/40"
      }`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-600 rounded-xl py-2.5 shadow-sm">
            <div className="font-black text-3xl text-white tabular-nums">{totalActif}</div>
            <div className="text-xs text-blue-100 font-bold uppercase tracking-widest mt-0.5">ACTIF</div>
          </div>
          <div className="flex items-center justify-center">
            <span className={`font-black text-3xl ${equilibre ? "text-indigo-400" : "text-red-400"}`}>
              {equilibre ? "=" : "≠"}
            </span>
          </div>
          <div className="bg-amber-600 rounded-xl py-2.5 shadow-sm">
            <div className="font-black text-3xl text-white tabular-nums">{totalPassif}</div>
            <div className="text-xs text-amber-100 font-bold uppercase tracking-widest mt-0.5">PASSIF</div>
          </div>
        </div>
        {!equilibre && (
          <div className="mt-2 text-center text-xs font-bold py-1 rounded-lg bg-red-900/50 text-red-300">
            ⚠️ Déséquilibre : écart {(totalActif - totalPassif).toFixed(1)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-0 px-4 pb-4">
        {/* ── ACTIF ── */}
        <div className="pr-3 border-r border-gray-700">
          <div className="text-center text-[11px] font-black text-blue-300 mb-2 uppercase tracking-widest bg-blue-900/40 rounded-lg py-1">
            ACTIF · Ce que vous possédez
          </div>

          <SectionHeader label="Investissements durables" color={TOOLTIPS.immobilisations.couleur} />
          {(() => {
            const totalImmMod = findMod(recentModifications, "immobilisations");
            const nItems = immobilisations.length;
            return immobilisations.map((a) => {
              let perItemMod: typeof totalImmMod;
              if (totalImmMod && nItems > 0) {
                const totalDelta = totalImmMod.nouvelleValeur - totalImmMod.ancienneValeur;
                const perItemDelta = Math.round(totalDelta / nItems);
                perItemMod = {
                  poste: "immobilisations",
                  ancienneValeur: a.valeur - perItemDelta,
                  nouvelleValeur: a.valeur,
                };
              }
              return (
                <TooltipPoste
                  key={a.nom}
                  label={a.nom}
                  value={a.valeur}
                  color={TOOLTIPS.immobilisations.couleur}
                  categorie="immobilisations"
                  sub
                  highlighted={highlightedPoste === "immobilisations"}
                  recentMod={perItemMod}
                />
              );
            });
          })()}

          <SectionHeader label="Stocks" color={TOOLTIPS.stocks.couleur} />
          {stocks.map((a) => (
            <TooltipPoste
              key={a.nom}
              label={a.nom}
              value={a.valeur}
              color={TOOLTIPS.stocks.couleur}
              categorie="stocks"
              sub
              highlighted={highlightedPoste === "stocks"}
              recentMod={findMod(recentModifications, "stocks")}
            />
          ))}

          {(joueur.bilan.creancesPlus1 > 0 || joueur.bilan.creancesPlus2 > 0) && (
            <>
              <SectionHeader label="Créances clients" color={TOOLTIPS.creances.couleur} />
              {joueur.bilan.creancesPlus1 > 0 && (
                <TooltipPoste
                  label="Argent à recevoir (dans 1 trim.)"
                  value={joueur.bilan.creancesPlus1}
                  color={TOOLTIPS.creances.couleur}
                  categorie="creances"
                  sub
                  highlighted={highlightedPoste === "creancesPlus1"}
                  recentMod={findMod(recentModifications, "creancesPlus1")}
                />
              )}
              {joueur.bilan.creancesPlus2 > 0 && (
                <TooltipPoste
                  label="Argent à recevoir (dans 2 trim.)"
                  value={joueur.bilan.creancesPlus2}
                  color={TOOLTIPS.creances.couleur}
                  categorie="creances"
                  sub
                  highlighted={highlightedPoste === "creancesPlus2"}
                  recentMod={findMod(recentModifications, "creancesPlus2")}
                />
              )}
            </>
          )}

          <SectionHeader label="Trésorerie" color={TOOLTIPS.tresorerie.couleur} />
          {tresorerie && (
            <TooltipPoste
              label="Trésorerie"
              value={tresorerie.valeur}
              color={TOOLTIPS.tresorerie.couleur}
              categorie="tresorerie"
              sub
              highlighted={highlightedPoste === "tresorerie"}
              recentMod={findMod(recentModifications, "tresorerie")}
            />
          )}

          <ColumnTotal label="Total Actif" value={totalActif} variant="actif" />
        </div>

        {/* ── PASSIF ── */}
        <div className="pl-3">
          <div className="text-center text-[11px] font-black text-amber-300 mb-2 uppercase tracking-widest bg-amber-900/40 rounded-lg py-1">
            PASSIF · D&apos;où vient le financement
          </div>

          <SectionHeader label="Capitaux propres" color={TOOLTIPS.capitaux.couleur} />
          {capitaux.map((p) => (
            <TooltipPoste
              key={p.nom}
              label={p.nom}
              value={p.valeur}
              color={TOOLTIPS.capitaux.couleur}
              categorie="capitaux"
              sub
              highlighted={highlightedPoste === "capitaux"}
              recentMod={findMod(recentModifications, "capitaux")}
            />
          ))}
          {resultat !== 0 && (
            <TooltipPoste
              label="Résultat net"
              value={resultat}
              color={resultat >= 0 ? "#22c55e" : "#ef4444"}
              sub
            />
          )}

          <SectionHeader label="Emprunts" color={TOOLTIPS.emprunts.couleur} />
          {emprunts.map((p) => (
            <TooltipPoste
              key={p.nom}
              label={p.nom}
              value={p.valeur}
              color={TOOLTIPS.emprunts.couleur}
              categorie="emprunts"
              sub
              highlighted={highlightedPoste === "emprunts"}
              recentMod={findMod(recentModifications, "emprunts")}
            />
          ))}

          {(dettes.length > 0 || joueur.bilan.dettes > 0 || joueur.bilan.dettesFiscales > 0) && (
            <>
              <SectionHeader label="Dettes (court terme)" color={TOOLTIPS.dettes.couleur} />
              {dettes.map((p) => (
                <TooltipPoste
                  key={p.nom}
                  label={p.nom}
                  value={p.valeur}
                  color={TOOLTIPS.dettes.couleur}
                  categorie="dettes"
                  sub
                  highlighted={highlightedPoste === "dettes"}
                  recentMod={findMod(recentModifications, "dettes")}
                />
              ))}
              {joueur.bilan.dettes > 0 && (
                <TooltipPoste
                  label="Dettes fournisseurs"
                  value={joueur.bilan.dettes}
                  color={TOOLTIPS.dettes.couleur}
                  categorie="dettes"
                  sub
                  highlighted={highlightedPoste === "dettes"}
                  recentMod={findMod(recentModifications, "dettes")}
                />
              )}
              {joueur.bilan.dettesFiscales > 0 && (
                <TooltipPoste
                  label="Dettes fiscales"
                  value={joueur.bilan.dettesFiscales}
                  color={TOOLTIPS.dettes.couleur}
                  categorie="dettes"
                  sub
                  highlighted={highlightedPoste === "dettesFiscales"}
                  recentMod={findMod(recentModifications, "dettesFiscales")}
                />
              )}
            </>
          )}

          {joueur.bilan.decouvert > 0 && (
            <>
              <SectionHeader
                label={joueur.bilan.decouvert > 5 ? "🔴 DÉCOUVERT — FAILLITE !" : "⚠️ Découvert"}
                color="#dc2626"
              />
              <div className={`px-3 py-2 rounded-xl border-2 mb-1 ${
                joueur.bilan.decouvert > 5
                  ? "bg-red-950/70 border-red-600 animate-pulse"
                  : "bg-orange-950/40 border-orange-500"
              }`}>
                <TooltipPoste
                  label="Découvert bancaire"
                  value={joueur.bilan.decouvert}
                  color={TOOLTIPS.decouvert.couleur}
                  categorie="decouvert"
                  sub
                  highlighted={highlightedPoste === "decouvert"}
                  recentMod={findMod(recentModifications, "decouvert")}
                />
                <div className={`text-xs mt-1 font-semibold ${
                  joueur.bilan.decouvert > 5 ? "text-red-300" : "text-orange-300"
                }`}>
                  {joueur.bilan.decouvert > 5
                    ? "🚨 Découvert > 5 : faillite si non régularisé !"
                    : "Remboursez ce découvert au tour suivant."}
                </div>
              </div>
            </>
          )}

          <ColumnTotal label="Total Passif" value={totalPassif} variant="passif" />
        </div>
      </div>
    </div>
  );
}
