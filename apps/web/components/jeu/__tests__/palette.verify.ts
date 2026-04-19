/**
 * JEDEVIENSPATRON — Vérification de la palette par tonalité (Vague 3)
 * ====================================================================
 *
 * Script autonome (pas de framework de test dans apps/web) : valide que
 * `getPaletteTonalite()` retourne bien une palette distincte et complète
 * pour chacune des 5 tonalités + le cas systémique (null).
 *
 * Exécution :
 *   Depuis la racine du monorepo :
 *     npx tsc --noEmit apps/web/components/jeu/__tests__/palette.verify.ts
 *   Puis pour l'exécution runtime :
 *     npx ts-node apps/web/components/jeu/__tests__/palette.verify.ts
 *
 * Motivation (L48) : la palette est une pure fonction switch avec des
 * chaînes Tailwind littérales (contrainte JIT : pas de classe construite
 * dynamiquement). Ce script verrouille trois invariants :
 *   1. Chaque tonalité (y compris null/undefined) retourne une palette
 *      valide (tous les champs définis et non vides).
 *   2. Les 5 tonalités thématiques retournent des palettes distinctes
 *      (pas de collision couleur → risque de confusion pédagogique).
 *   3. null retourne la palette slate (neutre systémique) sans crash.
 */

import { getPaletteTonalite, type PaletteTonalite, type TonaliteDefi } from "../utils";

const ERREURS: string[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) ERREURS.push(msg);
}

// ─── 1. Tonalités à couvrir ─────────────────────────────────────────

const TONALITES: TonaliteDefi[] = [
  "tresorerie",
  "capacite",
  "financement",
  "risque",
  "positionnement",
  null,
];

// ─── 2. Chaque tonalité retourne une palette complète ───────────────

const CHAMPS_OBLIGATOIRES: (keyof PaletteTonalite)[] = [
  "overlayBg",
  "headerGradient",
  "accentText",
  "choixHover",
  "choixTitre",
  "pedagogieBg",
  "pedagogieBorder",
  "pedagogieTitre",
  "validerBtn",
];

const palettesObtenues = new Map<string, PaletteTonalite>();

for (const t of TONALITES) {
  const p = getPaletteTonalite(t);
  const clef = t ?? "null";

  for (const champ of CHAMPS_OBLIGATOIRES) {
    const valeur = p[champ];
    assert(
      typeof valeur === "string" && valeur.length > 0,
      `[${clef}] champ ${champ} absent ou vide : ${JSON.stringify(valeur)}`
    );
  }

  palettesObtenues.set(clef, p);
}

// ─── 3. Les 5 tonalités thématiques sont visuellement distinctes ────

// On compare un champ « signature » : overlayBg — c'est le plus visible
// à l'œil et doit être unique par tonalité.
const THEMATIQUES = ["tresorerie", "capacite", "financement", "risque", "positionnement"] as const;

const overlayBgs = THEMATIQUES.map((t) => palettesObtenues.get(t)!.overlayBg);
const uniques = new Set(overlayBgs);
assert(
  uniques.size === THEMATIQUES.length,
  `overlayBg non distincts entre tonalités thématiques : ${overlayBgs.join(", ")}`
);

// ─── 4. null → palette slate (neutre systémique) ────────────────────

const paletteNull = palettesObtenues.get("null")!;
assert(
  paletteNull.overlayBg.includes("slate"),
  `tonalite=null doit utiliser la palette slate (obtenu : ${paletteNull.overlayBg})`
);

// ─── 5. Vérifications spécifiques par tonalité ──────────────────────

const paletteTreso = palettesObtenues.get("tresorerie")!;
assert(
  paletteTreso.overlayBg.includes("emerald"),
  `tresorerie doit mapper sur emerald (vert = liquidité) ; obtenu : ${paletteTreso.overlayBg}`
);

const paletteCapa = palettesObtenues.get("capacite")!;
assert(
  paletteCapa.overlayBg.includes("sky"),
  `capacite doit mapper sur sky (bleu industriel) ; obtenu : ${paletteCapa.overlayBg}`
);

const paletteFinan = palettesObtenues.get("financement")!;
assert(
  paletteFinan.overlayBg.includes("violet"),
  `financement doit mapper sur violet (bancaire) ; obtenu : ${paletteFinan.overlayBg}`
);

const paletteRisque = palettesObtenues.get("risque")!;
assert(
  paletteRisque.overlayBg.includes("rose"),
  `risque doit mapper sur rose (alerte sobre) ; obtenu : ${paletteRisque.overlayBg}`
);

const palettePos = palettesObtenues.get("positionnement")!;
assert(
  palettePos.overlayBg.includes("indigo"),
  `positionnement doit mapper sur indigo (stratégie) ; obtenu : ${palettePos.overlayBg}`
);

// ─── 6. Rapport ─────────────────────────────────────────────────────

if (ERREURS.length === 0) {
  console.log(
    `✓ Palette : ${TONALITES.length} tonalités validées, ${CHAMPS_OBLIGATOIRES.length} champs par palette, ` +
      `${uniques.size} overlay distincts.`
  );
  process.exit(0);
} else {
  console.error(`✗ Palette : ${ERREURS.length} erreur(s) :`);
  for (const e of ERREURS) console.error("  - " + e);
  process.exit(1);
}
