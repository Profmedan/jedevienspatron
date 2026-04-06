# Notes durables — JE DEVIENS PATRON

## Architecture
- Monorepo npm workspaces : `apps/web` (Next.js 15) + `packages/game-engine` (TypeScript pur)
- Le moteur est compilé dans `packages/game-engine/dist/` — toujours recompiler après modification source
- Validation TypeScript : `npx tsc --noEmit` depuis `apps/web` ou depuis la racine avec `-p packages/game-engine/tsconfig.json`
- **Ne jamais** ajouter `overrides` React ni aliaser `react` dans webpack

## Règles monétaires
- Toutes les valeurs monétaires sont en **euros** (unité = 1 €, affichées avec séparateur de milliers)
- Les bilans initiaux : Actif = Passif = 28 000 € (Manufacture, Véloce, Azura) ou 25 000 € (Synergia)
- Capacité de production initiale = **4 unités/trimestre** pour toutes les entreprises
- La capacité augmente uniquement via des investissements (Camionnette, Expansion, etc.)

## Capacités de production par entreprise
| Carte       | Belvaux / Véloce | Azura / Synergia |
|-------------|-----------------|-----------------|
| Camionnette | +6 000 → 10 000 | +2 000 → 6 000  |
| Expansion   | +4 000 → 8 000  | +6 000 → 10 000 |

## Cartes décision — 34 cartes total
- 3 cartes commerciaux (recrutement)
- 29 cartes décision originales
- 5 nouvelles cartes (2026-04) : Achat d'Urgence, Maintenance Préventive, Révision Générale, Optimisation Lean, Sous-traitance

## Fichiers clés
- `packages/game-engine/src/data/cartes.ts` — catalogue complet des cartes
- `packages/game-engine/src/data/entreprises.ts` — bilans initiaux des 4 entreprises
- `packages/game-engine/src/types.ts` — types + constantes (CAPACITE_BASE, MONTANTS_EMPRUNT, etc.)
- `packages/game-engine/src/engine.ts` — logique de jeu (étapes 0-9)
- `apps/web/app/api/` — routes API (Stripe, Supabase, sessions)
- `jeu_interactif.xlsx` — simulateur Excel (349 formules, 0 erreur)
- `simulate.js` — simulateur CLI interactif (node simulate.js)

## Pièges connus
- `tirerCartesDecision()` utilise splice → détruit la pioche ; préférer chercher dans `CARTES_DECISION` directement
- `appliquerAchatMarchandises()` requiert 4 paramètres : etat, joueurIdx, quantite, modePaiement
- Les clients doivent être générés à l'étape 3 pour être traités à l'étape 4
- Intérêts calculés 1×/an (trimestre 1 de chaque année), plancher 1 000 €
- `.next/types/validator.ts` → erreur TS pré-existante non liée à nos modifications, à ignorer
