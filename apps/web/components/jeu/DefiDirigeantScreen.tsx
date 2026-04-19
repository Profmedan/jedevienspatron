"use client";

/**
 * DefiDirigeantScreen — écran plein écran pour les « Défis du dirigeant »
 * (Tâche 24, Vague 3).
 *
 * Deux variantes de rendu, aiguillées par l'archétype du défi :
 *   • « courte » (observation / choix_binaire / choix_arbitrage /
 *     consequence_differee / conditionnel) : décision rapide < 30s,
 *     retour immédiat au flow après validation.
 *   • « longue » (palier_strategique) : décision structurante, affiche
 *     un bloc « bilan projectif » listant les effets immédiats ET
 *     différés de chaque choix pour que le joueur mesure la portée.
 *
 * La palette visuelle est choisie par la tonalité du défi
 * (getPaletteTonalite) pour que l'œil reconnaisse immédiatement la
 * thématique : trésorerie, capacité, financement, risque, positionnement.
 *
 * Rétrocompatibilité : l'écran ne se monte que si `defisActives === true`
 * côté page.tsx. Hors du flag, le composant n'est jamais rendu.
 */

import { useState } from "react";
import type { DefiDirigeant, ChoixDefi, EffetCarte } from "@jedevienspatron/game-engine";
import { getPaletteTonalite, nomCompte, type TonaliteDefi, type PaletteTonalite } from "./utils";

interface DefiDirigeantScreenProps {
  /** Défi à présenter. */
  defi: DefiDirigeant;
  /** Contexte formaté (tokens {pseudo}, {saison}, etc. déjà résolus). */
  contexteFormate: string;
  /** Callback appelé quand le joueur valide son choix (ou le « Continuer » de l'observation). */
  onChoix: (choixId: string | null) => void;
}

type Variante = "courte" | "longue";

/**
 * Routage archétype → variante de rendu.
 * Unique source de vérité : si un nouvel archétype arrive, il bascule
 * par défaut en « courte » (safe fallback) — à mettre à jour ici.
 */
function variantePourArchetype(archetype: DefiDirigeant["archetype"]): Variante {
  return archetype === "palier_strategique" ? "longue" : "courte";
}

/**
 * Libellé du badge affiché à côté du titre pour signaler la nature
 * dramaturgique du défi.
 */
function badgePourArchetype(archetype: DefiDirigeant["archetype"]): string {
  switch (archetype) {
    case "observation":
      return "Observation";
    case "choix_binaire":
    case "choix_arbitrage":
      return "Décision rapide";
    case "consequence_differee":
      return "Conséquence";
    case "conditionnel":
      return "Alerte";
    case "palier_strategique":
      return "Décision stratégique";
    case "cloture":
      return "Clôture d'exercice";
    default:
      return "Défi du dirigeant";
  }
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────

export function DefiDirigeantScreen({
  defi,
  contexteFormate,
  onChoix,
}: DefiDirigeantScreenProps) {
  const [choixId, setChoixId] = useState<string | null>(null);

  const estObservation = defi.archetype === "observation";
  const variante: Variante = variantePourArchetype(defi.archetype);
  const palette = getPaletteTonalite(defi.tonalite as TonaliteDefi);
  const badge = badgePourArchetype(defi.archetype);

  const choixSelectionne = choixId
    ? defi.choix.find((c) => c.id === choixId) ?? null
    : null;

  function choisir(id: string) {
    setChoixId(id);
  }

  function valider() {
    // Observation sans choix : on remonte null si le joueur n'a rien cliqué.
    onChoix(choixId);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${palette.overlayBg} backdrop-blur-sm p-4`}
    >
      <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* ─── En-tête ───────────────────────────────────────── */}
        <div
          className={`px-6 py-4 text-white text-center bg-gradient-to-r ${palette.headerGradient}`}
        >
          <div className="text-4xl mb-1">🎭</div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-75 mb-0.5">
            Défi du dirigeant · {badge}
          </div>
          <h2 className="text-xl font-bold">
            {estObservation ? "Observation" : "Une décision à prendre"}
          </h2>
        </div>

        {/* ─── Contenu ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Contexte narratif */}
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
            {contexteFormate}
          </p>

          {/* Observation : pas de choix, juste un bouton « Continuer » */}
          {estObservation && (
            <div
              className={`${palette.pedagogieBg} border ${palette.pedagogieBorder} rounded-xl p-3 text-sm ${palette.accentText} leading-relaxed`}
            >
              💡 À ce stade, rien à décider. Observez et continuez.
            </div>
          )}

          {/* Bilan projectif (variante longue uniquement, avant sélection) */}
          {variante === "longue" && !choixSelectionne && !estObservation && (
            <BilanProjectif
              choix={defi.choix}
              palette={palette}
              selectId={choisir}
            />
          )}

          {/* Choix proposés (variante courte, avant sélection) */}
          {variante === "courte" && !estObservation && !choixSelectionne && (
            <div className="space-y-2">
              {defi.choix.map((c) => (
                <button
                  key={c.id}
                  onClick={() => choisir(c.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all bg-gray-800 border-gray-600 text-gray-200 ${palette.choixHover}`}
                >
                  <div className={`font-bold ${palette.choixTitre} mb-0.5`}>
                    {c.libelle}
                  </div>
                  {c.description && (
                    <div className="text-xs text-gray-400 leading-snug">
                      {c.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Résultat après choix : pédagogie */}
          {choixSelectionne && (
            <div
              className={`${palette.pedagogieBg} border ${palette.pedagogieBorder} rounded-xl p-4 text-sm leading-relaxed space-y-2`}
            >
              <div
                className={`text-xs font-bold uppercase tracking-wider ${palette.pedagogieTitre}`}
              >
                ✅ Choix : {choixSelectionne.libelle}
              </div>
              <p className="text-gray-200">{choixSelectionne.pedagogie}</p>
            </div>
          )}
        </div>

        {/* ─── Pied : bouton valider ─────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-700 shrink-0">
          {estObservation ? (
            <button
              onClick={valider}
              className={`w-full ${palette.validerBtn} text-white font-bold py-3 rounded-xl text-lg shadow-sm transition-all active:scale-95`}
            >
              Continuer →
            </button>
          ) : choixSelectionne ? (
            <button
              onClick={valider}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3 rounded-xl text-lg shadow-sm transition-all active:scale-95"
            >
              Appliquer ce choix →
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-700 text-gray-400 font-bold py-3 rounded-xl text-lg cursor-not-allowed"
            >
              {variante === "longue"
                ? "Choisissez une orientation stratégique"
                : "Choisissez une option ci-dessus"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composant : bilan projectif (variante longue)
// ─────────────────────────────────────────────────────────────

interface BilanProjectifProps {
  choix: ChoixDefi[];
  palette: PaletteTonalite;
  selectId: (id: string) => void;
}

/**
 * Liste chaque choix avec ses effets immédiats ET différés sous forme
 * tabulaire, pour que le joueur perçoive la portée stratégique avant
 * de décider. Un clic sur un choix le sélectionne.
 */
function BilanProjectif({ choix, palette, selectId }: BilanProjectifProps) {
  return (
    <div className="space-y-3">
      <div
        className={`text-xs font-bold uppercase tracking-wider ${palette.pedagogieTitre}`}
      >
        📊 Bilan projectif — cliquez sur une orientation
      </div>

      {choix.map((c) => {
        const dansTrims = c.effetsDiffere?.map((e) => e.dansNTrimestres) ?? [];
        const trimMax = dansTrims.length > 0 ? Math.max(...dansTrims) : 0;

        return (
          <button
            key={c.id}
            onClick={() => selectId(c.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all bg-gray-800 border-gray-600 ${palette.choixHover}`}
          >
            <div className={`font-bold ${palette.choixTitre} mb-1`}>
              {c.libelle}
            </div>
            {c.description && (
              <div className="text-xs text-gray-400 leading-snug mb-2">
                {c.description}
              </div>
            )}

            {/* Effets immédiats */}
            {c.effetsImmediats.length > 0 && (
              <div className="mt-2 text-xs">
                <div className="text-gray-500 uppercase tracking-wider mb-0.5">
                  Maintenant
                </div>
                <EffetsList effets={c.effetsImmediats} />
              </div>
            )}

            {/* Effets différés */}
            {c.effetsDiffere && c.effetsDiffere.length > 0 && (
              <div className="mt-2 text-xs">
                <div className="text-gray-500 uppercase tracking-wider mb-0.5">
                  Dans {trimMax} trimestre{trimMax > 1 ? "s" : ""}
                </div>
                {c.effetsDiffere.map((bloc, i) => (
                  <EffetsList key={i} effets={bloc.effets} />
                ))}
              </div>
            )}

            {/* Cas rare : ni immédiat ni différé */}
            {c.effetsImmediats.length === 0 &&
              (!c.effetsDiffere || c.effetsDiffere.length === 0) && (
                <div className="mt-2 text-xs italic text-gray-500">
                  Pas d&apos;effet comptable direct.
                </div>
              )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composant : liste d'effets comptables (poste + delta)
// ─────────────────────────────────────────────────────────────

function EffetsList({ effets }: { effets: EffetCarte[] }) {
  return (
    <ul className="space-y-0.5">
      {effets.map((e, i) => {
        const signe = e.delta >= 0 ? "+" : "−";
        const abs = Math.abs(e.delta).toLocaleString("fr-FR");
        const couleur = e.delta >= 0 ? "text-emerald-300" : "text-rose-300";
        return (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span className="text-gray-300">{nomCompte(e.poste)}</span>
            <span className={`font-mono ${couleur}`}>
              {signe} {abs} €
            </span>
          </li>
        );
      })}
    </ul>
  );
}
