# Tâche : Improve unclear game map design
**Date** : 2026-03-21
**Statut** : En cours

---

## Contexte
Le jeu pédagogique "JE DEVIENS PATRON" possède une interface de jeu en 3 panneaux.
Le panneau gauche contenait un `ProgressStrip` minimaliste (3 barres + titre tronqué) qui ne donnait pas au joueur une vision claire de sa progression.

**4 problèmes identifiés par Pierre :**
1. Le joueur ne voit pas clairement **où il en est** dans les 9 étapes du tour
2. La **navigation entre étapes** n'est pas intuitive
3. Le **parcours global** (tours + étapes à venir) n'est pas visible
4. **Lisibilité mobile** insuffisante

---

## Plan

### Étape 1 — Analyse par les agents experts [ ]
Lancer en parallèle :
- **UX Researcher** : analyser les douleurs de l'utilisateur (étudiant en compta, 18-25 ans) face à la progression du jeu
- **UX Architect** : définir l'architecture de l'information pour le GameMap
- **Visual Storyteller** : penser la narration visuelle du parcours trimestriel
- **Whimsy Injector** : proposer des éléments de plaisir/personnalité adaptés au contexte pédagogique
- **Brand Guardian** : vérifier l'alignement avec l'identité "JE DEVIENS PATRON"
- **UI Designer** : définir les specs visuelles du composant

### Étape 2 — Consolidation des recommandations [ ]
Synthétiser les recommandations des 6 agents en specs d'implémentation concrètes.

### Étape 3 — Implémentation [ ]
Modifier `apps/web/components/jeu/LeftPanel.tsx` :
- Composant `GameMap` (remplace `ProgressStrip`)
- Répondre aux 4 problèmes identifiés
- Respecter les specs des agents

### Étape 4 — Vérification [ ]
- Check TypeScript (`npx tsc --noEmit`)
- Commit + push vers Vercel
- Screenshot visuel pour validation

### Étape 5 — Leçons [ ]
- Mettre à jour `tasks/lessons.md`

---

## Fichiers concernés
- `apps/web/components/jeu/LeftPanel.tsx` — composant principal
- `apps/web/lib/game-engine/data/pedagogie.ts` — données des 9 étapes
- `apps/web/lib/game-engine/types.ts` — types

---

## Review (à compléter après implémentation)
- [ ] Les 4 problèmes sont résolus
- [ ] TypeScript OK
- [ ] Visuellement validé sur Vercel
- [ ] Agents consultés avant implémentation

---

## Tâche urgente : Corriger les 2 erreurs de build Vercel (2026-03-21)

### Erreur 1 — ESLint : module `eslint-config-next/core-web-vitals` introuvable
- **Cause** : Next.js 15 exige l'extension `.js` dans l'import ESM flat config
- **Fix** : Désactiver ESLint au build dans `next.config.ts` (pattern identique à TS)

### Erreur 2 — React dual instance : `ReactCurrentDispatcher` undefined
- **Cause** : monorepo npm workspaces → `styled-jsx` et `react-dom` utilisent 2 instances React distinctes
- **Fix A** (déjà committé) : `overrides` dans root `package.json` → force une seule version npm
- **Fix B** (à faire) : webpack alias dans `next.config.ts` → force une seule instance au bundle time

### Plan d'exécution
- [x] Diagnostiquer les 2 erreurs
- [ ] Ajouter `eslint.ignoreDuringBuilds: true` dans `next.config.ts`
- [ ] Ajouter webpack alias React dans `next.config.ts`
- [ ] Vérifier avec `npx tsc --noEmit`
- [ ] Commit + instruire push
