"use client";
import { Joueur, DECOUVERT_MAX, REMBOURSEMENT_EMPRUNT_PAR_TOUR, getTotalActif, getTotalPassif, getResultatNet } from "@jedevienspatron/game-engine";
import { isBonPourEntreprise } from "@/lib/pedagogie/poste-helpers";
import { useState, useRef, useEffect } from "react";

type RecentMod = { poste: string; ancienneValeur: number; nouvelleValeur: number; ligneNom?: string };

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
    definition: "Biens durables achetés par l’entreprise (machines, véhicules, brevets…). Ils se déprécient chaque trimestre = amortissements.",
    exemple: "Ex : Une usine à 3, une camionnette à 1 = 4 d’immobilisations.",
    couleur: "#d97706",
    cote: "actif",
    regleOr: "Quand tu achètes un bien, l’Actif ↑ (nouvelle immo) et le Passif ↑ (emprunt ou trésorerie ↓ côté actif). Quand il s’amortit chaque trimestre, l’Actif ↓ et le Résultat ↓ — les deux côtés bougent ensemble.",
  },
  stocks: {
    definition: "Marchandises achetées mais pas encore vendues. Augmentent à l’achat, diminuent à la vente (le coût des marchandises vendues est comptabilisé en charge).",
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
    regleOr: "La trésorerie est le miroir de tous tes flux : chaque rentrée ou sortie d’argent modifie la trésorerie (Actif) et son pendant côté Passif (créance encaissée, dette payée, charge comptabilisée…). Si elle tombe à 0, le découvert prend le relais côté Passif.",
  },
  creances: {
    definition: "Argent que vos clients vous doivent mais n’ont pas encore payé. 'Dans 1 trimestre' sera encaissé au tour suivant, 'dans 2 trimestres' dans deux tours.",
    exemple: "Ex : Vente Grand Compte = +3 Ventes +3 Créances (encaissé dans 2 trimestres).",
    couleur: "#2563eb",
    cote: "actif",
    regleOr: "Une vente à crédit crée deux mouvements simultanés : Créances ↑ (Actif, promesse de paiement) et Ventes ↑ (Produit = Résultat ↑ = Passif ↑). Quand le client paie enfin : Trésorerie ↑ (Actif) et Créances ↓ (Actif). Le passif ne bouge pas — ce n’était que l’encaissement.",
  },
  capitaux: {
    definition: "Capitaux propres : argent investi par les propriétaires + résultats accumulés. Augmentent avec les bénéfices, diminuent avec les pertes.",
    exemple: "Ex : Capital 12. Bénéfice de 2 → Capitaux 14 à la clôture.",
    couleur: "#7c3aed",
    cote: "passif",
    regleOr: "Les capitaux propres sont ce que l’entreprise 'doit' à ses propriétaires. Ils ↑ avec les bénéfices (Résultat positif migre dans les capitaux en fin de période) et ↓ avec les pertes. Si les capitaux propres passent en négatif → l’entreprise doit plus qu’elle ne possède → faillite.",
  },
  emprunts: {
    definition: "Dettes à long terme envers la banque. Remboursées progressivement (-1 par tour). Génèrent des charges d’intérêt.",
    exemple: "Ex : Emprunt 4, remboursement 1/tour → Tour 1: 3, Tour 2: 2…",
    couleur: "#ea580c",
    cote: "passif",
    regleOr: "Quand tu empruntes, l’argent arrive en trésorerie (Actif ↑) et la dette s’inscrit au passif (Passif ↑) → bilan équilibré. Chaque remboursement : Trésorerie ↓ (Actif) et Emprunt ↓ (Passif). Les intérêts payés réduisent aussi la trésorerie et augmentent les charges (Résultat ↓).",
  },
  dettes: {
    definition: "Dettes à court terme : fournisseurs (achats à crédit, payables au tour suivant) ou fiscales (impôts à payer).",
    exemple: "Ex : Achat à crédit de 3 → Dettes fournisseurs +3 (payé au tour suivant).",
    couleur: "#e11d48",
    cote: "passif",
    regleOr: "Acheter à crédit crée simultanément un Actif (Stock ↑) et un Passif (Dette fournisseur ↑) — bilan équilibré. Quand tu règles la facture : Trésorerie ↓ (Actif) et Dette ↓ (Passif) — le bilan reste équilibré.",
  },
  decouvert: {
    definition: "⚠️ Découvert bancaire : trésorerie négative. Si le découvert dépasse 5, des pénalités s’appliquent. Au-delà, c’est la faillite.",
    exemple: "Ex : Tréso = 0, tu paies 3 → Tréso = 0, Découvert = 3 (dangereux !).",
    couleur: "#dc2626",
    cote: "passif",
    regleOr: "Le découvert est la trésorerie négative déplacée au passif. L’Actif Trésorerie reste à 0 ; c’est le Passif Découvert qui absorbe la différence — l’équation ACTIF = PASSIF reste vraie, mais c’est un signal d’alarme : la banque finance tes opérations à ta place.",
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
      <span className={`text-xs font-bold px-1 rounded-full ${bon ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"}`}>
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
  const ref = useRef<HTMLDivElement>(null);

  // Auto-scroll vers ce poste quand il est mis en surbrillance
  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex justify-between items-center px-2.5 py-2 rounded-lg mb-1 transition-all duration-300 ${
          info ? "cursor-pointer" : "cursor-default"
        } ${
          sub ? "text-sm" : "font-semibold"
        } ${
          highlighted
            ? "ring-2 ring-amber-400 bg-amber-500/20 shadow-lg shadow-amber-400/20 scale-[1.03] -mx-0.5 animate-pulse"
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
        <span className="text-gray-200 flex items-center gap-1 text-[10px] xl:text-xs min-w-0">
          <span className="truncate">{label}</span>
          {info && (
            <span className={`shrink-0 text-xs leading-none transition-colors ${show ? "text-white" : "text-gray-500"}`}>
              {show ? "▲" : "ⓘ"}
            </span>
          )}
        </span>
        <div className="flex items-center shrink-0">
          {recentMod ? (
            <BeforeAfterBadge mod={recentMod} />
          ) : (
            <span className={`font-bold tabular-nums text-xs xl:text-sm ${value < 0 ? "text-red-400" : "text-gray-100"}`}>
              {value >= 0 ? value : `(${Math.abs(value)})`}
            </span>
          )}
        </div>
      </div>

      {/* ── Panneau règle d’or contextuel ── */}
      {show && info && (
        <div
          className="mb-2 rounded-xl border p-3 text-xs space-y-2 shadow-lg"
          style={{ borderColor: `${info.couleur}60`, backgroundColor: `${info.couleur}10` }}
        >
          {/* Définition */}
          <p className="text-gray-200 leading-relaxed">{info.definition}</p>
          <p className="text-gray-500 italic border-t border-white/10 pt-2">{info.exemple}</p>

          {/* Règle d’or */}
          <div className="border-t border-white/10 pt-2">
            <p className="text-xs font-black uppercase tracking-widest mb-1.5"
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
      className="text-xs font-black uppercase tracking-widest mt-4 mb-1.5 px-1 flex items-center gap-1.5"
      style={{ color: color ?? "#9ca3af" }}
    >
      <span className="h-px flex-1 opacity-30" style={{ backgroundColor: color ?? "#9ca3af" }} />
      {label}
      <span className="h-px flex-1 opacity-30" style={{ backgroundColor: color ?? "#9ca3af" }} />
    </div>
  );
}

const TOTAL_REGLE_OR: Record<"actif" | "passif", { message: string; detail: string }> = {
  actif: {
    message: "Le Total Actif = tout ce que l’entreprise possède ou détient.",
    detail: "Il est toujours égal au Total Passif : chaque euro de l’entreprise a une origine (Passif) et un emploi (Actif). Si les deux divergent, une écriture est manquante.",
  },
  passif: {
    message: "Le Total Passif = tout ce que l’entreprise doit (à ses actionnaires ou à ses créanciers).",
    detail: "Il est toujours égal au Total Actif : les ressources (Passif) financent exactement les emplois (Actif). Capitaux propres + Dettes = ce que vous possédez.",
  },
};

function ColumnTotal({ label, value, variant }: { label: string; value: number; variant: "actif" | "passif" }) {
  const [open, setOpen] = useState(false);
  const isActif = variant === "actif";
  const info = TOTAL_REGLE_OR[variant];
  const accentColor = isActif ? "#3b82f6" : "#f59e0b";

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((s) => !s)}
        className={`w-full flex justify-between items-center px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
          isActif ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-500" : "bg-amber-600 border-amber-600 text-white hover:bg-amber-500"
        }`}
      >
        <span className="text-[9px] xl:text-xs font-bold uppercase tracking-wide opacity-90 flex items-center gap-1.5">
          {label}
          <span className={`text-[9px] xl:text-xs font-normal ${open ? "opacity-100" : "opacity-60"}`}>
            {open ? "▲" : "ⓘ"}
          </span>
        </span>
        <span className="text-base xl:text-xl font-black tabular-nums">{value}</span>
      </button>
      {open && (
        <div
          className="mt-1 rounded-xl border p-3 text-xs space-y-1.5"
          style={{ borderColor: `${accentColor}60`, backgroundColor: `${accentColor}15` }}
        >
          <p className="text-white font-semibold leading-relaxed">{info.message}</p>
          <p className="text-gray-300 leading-relaxed border-t border-white/10 pt-1.5">{info.detail}</p>
          <p className="text-xs font-black uppercase tracking-widest pt-0.5" style={{ color: accentColor }}>
            ⚖️ Règle d&apos;or — {isActif ? "ACTIF" : "PASSIF"} = {isActif ? "PASSIF" : "ACTIF"}
          </p>
        </div>
      )}
    </div>
  );
}

function findMod(
  mods: RecentMod[] | undefined,
  poste: string,
  ligneNom?: string,
): RecentMod | undefined {
  // Retourne le DERNIER mod pour ce poste : quand tresorerie est modifiée
  // plusieurs fois dans la même étape (intérêts, puis remboursement, puis charges),
  // le badge reflète l'opération la plus récente appliquée.
  const matches = mods?.filter((m) => m.poste === poste) ?? [];
  if (matches.length === 0) return undefined;

  // B9 post (2026-04-24) — Ciblage par ligneNom quand plusieurs lignes partagent
  // la même catégorie (ex. Belvaux a "Stocks matières premières" ET "Stocks
  // produits finis" tous deux en categorie "stocks"). Le moteur remplit
  // `ligneNom` via `pushByName`. Règles :
  // 1. Si ligneNom demandé fourni ET qu'au moins un mod précise `ligneNom` :
  //    ne garder que les mods dont `ligneNom` matche. Si aucun match → undefined
  //    (évite d'afficher le même badge sur une autre ligne de la même catégorie).
  // 2. Si ligneNom demandé fourni MAIS aucun mod n'a de `ligneNom` défini :
  //    comportement legacy (retourne le dernier mod, badge générique).
  // 3. Si ligneNom non fourni : comportement legacy.
  if (ligneNom !== undefined) {
    const someHaveLigneNom = matches.some((m) => m.ligneNom !== undefined);
    if (someHaveLigneNom) {
      const filteredByName = matches.filter((m) => m.ligneNom === ligneNom);
      return filteredByName.length > 0 ? filteredByName[filteredByName.length - 1] : undefined;
    }
  }
  return matches[matches.length - 1];
}

function BilanAnalyse({ joueur, totalActif, totalPassif }: { joueur: Joueur; totalActif: number; totalPassif: number }) {
  const [open, setOpen] = useState(false);

  // Calculer quelques indicateurs simples
  const tresorerie = joueur.bilan.actifs.find(a => a.categorie === "tresorerie")?.valeur ?? 0;
  const decouvert = joueur.bilan.decouvert ?? 0;
  const tresoNette = tresorerie - decouvert;
  const capitaux = joueur.bilan.passifs.filter(p => p.categorie === "capitaux").reduce((s, p) => s + p.valeur, 0);
  const emprunts = joueur.bilan.passifs.filter(p => p.categorie === "emprunts").reduce((s, p) => s + p.valeur, 0);
  const stocks = joueur.bilan.actifs.filter(a => a.categorie === "stocks").reduce((s, a) => s + a.valeur, 0);

  // Construire l’analyse
  const points: Array<{ niveau: "rouge" | "jaune" | "vert"; texte: string }> = [];

  if (tresoNette < 0) points.push({ niveau: "rouge", texte: `Trésorerie nette négative (${tresoNette.toLocaleString("fr-FR")} €) — risque de faillite si le découvert dépasse ${DECOUVERT_MAX.toLocaleString("fr-FR")} €.` });
  else if (tresoNette < 3000) points.push({ niveau: "jaune", texte: `Trésorerie faible (${tresoNette.toLocaleString("fr-FR")} €) — préservez vos liquidités ce trimestre.` });
  else points.push({ niveau: "vert", texte: `Trésorerie saine (${tresoNette.toLocaleString("fr-FR")} €) — vous pouvez envisager un investissement.` });

  if (emprunts > capitaux) points.push({ niveau: "rouge", texte: `Vos emprunts (${emprunts.toLocaleString("fr-FR")} €) dépassent vos capitaux propres (${capitaux.toLocaleString("fr-FR")} €) — endettement excessif.` });
  else if (emprunts > 0) points.push({ niveau: "jaune", texte: `Emprunts en cours (${emprunts.toLocaleString("fr-FR")} €) — remboursement automatique de ${REMBOURSEMENT_EMPRUNT_PAR_TOUR.toLocaleString("fr-FR")} € chaque trimestre.` });

  if (stocks > 5000) points.push({ niveau: "jaune", texte: `Stocks élevés (${stocks.toLocaleString("fr-FR")} €) — immobilisation de trésorerie. Vendez avant d’acheter davantage.` });

  const colors = {
    rouge: "text-red-600 bg-red-50 border-red-200",
    jaune: "text-amber-700 bg-amber-50 border-amber-200",
    vert: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-xs font-bold text-indigo-700 uppercase tracking-wider py-1 hover:text-indigo-900 transition-colors"
      >
        <span>🔍 Analyse & Conseils</span>
        <span className="text-gray-400 font-normal normal-case">{open ? "▲ Masquer" : "▼ Afficher"}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {points.map((p, i) => (
            <div key={i} className={`border rounded-lg px-2.5 py-1.5 text-xs leading-snug ${colors[p.niveau]}`}>
              {p.texte}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  // Note: bilan.passifs[] entries for "dettes" sont stales (moteur met à jour bilan.dettes direct)
  // → on n’utilise plus ce tableau pour l’affichage (suppression du doublon PCG)

  return (
    <div className="bg-gray-900 rounded-2xl shadow-md border border-gray-700 overflow-hidden">

      {/* ── En-tête ── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
        <h3 className="font-black text-white text-base tracking-widest uppercase">📋 Bilan</h3>
        <span className="text-xs text-slate-300 italic">Clique sur ⓘ pour la règle d&apos;or de chaque poste</span>
      </div>

      {/* Alerte déséquilibre uniquement (l’équation est déjà visible dans les totaux des colonnes) */}
      {!equilibre && (
        <div className="mx-4 mt-3 mb-1 text-center text-xs font-bold py-1.5 rounded-lg bg-red-900/50 text-red-300 border border-red-700">
          ⚠️ Déséquilibre : écart {(totalActif - totalPassif).toFixed(1)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 px-4 pb-4 items-stretch min-w-0">
        {/* ── ACTIF ── */}
        <div className="pr-4 border-r border-gray-700 flex flex-col h-full min-w-0">
          <div className="text-center text-xs font-black text-blue-300 mb-2 uppercase tracking-widest bg-blue-900/40 rounded-lg py-1">
            ACTIF · Ce que vous possédez
          </div>

          <SectionHeader label="Investissements durables" color={TOOLTIPS.immobilisations.couleur} />
          {(() => {
            const totalImmMod = findMod(recentModifications, "immobilisations");
            return immobilisations.map((a) => {
              let perItemMod: typeof totalImmMod;
              if (totalImmMod) {
                const totalDelta = totalImmMod.nouvelleValeur - totalImmMod.ancienneValeur;
                if (totalDelta < 0) {
                  // ── Amortissement (CRÉDIT Immobilisations) ──────────────────
                  // Le moteur applique exactement −1 000 € par bien (taux PCG fixe).
                  // On n'affiche le badge QUE sur les biens dont la valeur est > 0 :
                  //  • valeur > 0  → bien encore actif, amortissement de 1 000 € ✓
                  //  • valeur = 0  → bien déjà entièrement amorti (ou jamais utilisé)
                  //    → PAS de badge, pour éviter d'afficher un delta fictif
                  if (a.valeur > 0) {
                    perItemMod = {
                      poste: "immobilisations",
                      ancienneValeur: a.valeur + 1000, // avant = après + taux fixe
                      nouvelleValeur: a.valeur,
                    };
                  }
                } else if (totalDelta > 0) {
                  // ── Investissement (DÉBIT Immobilisations) ──────────────────
                  // Le delta va toujours dans "Autres Immobilisations" (cf. applyDeltaToJoueur)
                  if (a.nom === "Autres Immobilisations") {
                    perItemMod = {
                      poste: "immobilisations",
                      ancienneValeur: a.valeur - totalDelta,
                      nouvelleValeur: a.valeur,
                    };
                  }
                }
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
              recentMod={findMod(recentModifications, "stocks", a.nom)}
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

          <div className="mt-auto">
            <ColumnTotal label="Total Actif" value={totalActif} variant="actif" />
          </div>
        </div>

        {/* ── PASSIF ── */}
        <div className="pl-4 flex flex-col h-full min-w-0">
          <div className="text-center text-xs font-black text-amber-300 mb-2 uppercase tracking-widest bg-amber-900/40 rounded-lg py-1">
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

          {(joueur.bilan.dettes > 0 || (joueur.bilan.dettesD2 ?? 0) > 0 || joueur.bilan.dettesFiscales > 0) && (
            <>
              <SectionHeader label="Dettes (court terme)" color={TOOLTIPS.dettes.couleur} />
              {/* Compte unique 401 — source de vérité : bilan.dettes (champ direct mis à jour par le moteur) */}
              {joueur.bilan.dettes > 0 && (
                <TooltipPoste
                  label="Dettes fournisseurs D+1"
                  value={joueur.bilan.dettes}
                  color={TOOLTIPS.dettes.couleur}
                  categorie="dettes"
                  sub
                  highlighted={highlightedPoste === "dettes"}
                  recentMod={findMod(recentModifications, "dettes")}
                />
              )}
              {(joueur.bilan.dettesD2 ?? 0) > 0 && (
                <TooltipPoste
                  label="Dettes fournisseurs D+2"
                  value={joueur.bilan.dettesD2!}
                  color={TOOLTIPS.dettes.couleur}
                  categorie="dettes"
                  sub
                  highlighted={highlightedPoste === "dettesD2"}
                  recentMod={findMod(recentModifications, "dettesD2")}
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
                label={joueur.bilan.decouvert > DECOUVERT_MAX ? "🔴 DÉCOUVERT — FAILLITE !" : "⚠️ Découvert"}
                color="#dc2626"
              />
              <div className={`px-3 py-2 rounded-xl border-2 mb-1 ${
                joueur.bilan.decouvert > DECOUVERT_MAX
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
                  joueur.bilan.decouvert > DECOUVERT_MAX ? "text-red-300" : "text-orange-300"
                }`}>
                  {joueur.bilan.decouvert > DECOUVERT_MAX
                    ? `🚨 Découvert > ${DECOUVERT_MAX} : faillite si non régularisé !`
                    : "Remboursez ce découvert au tour suivant."}
                </div>
              </div>
            </>
          )}

          <div className="mt-auto">
            <ColumnTotal label="Total Passif" value={totalPassif} variant="passif" />
          </div>
        </div>
      </div>

      <BilanAnalyse joueur={joueur} totalActif={totalActif} totalPassif={totalPassif} />
    </div>
  );
}
