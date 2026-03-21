# Leçons apprises — jedevienspatron

## Session 2025-03 (contexte résumé)

### L1 — Lire avant d'éditer
**Erreur** : tentative d'Edit sans Read préalable → erreur "File has not been read yet"
**Règle** : toujours appeler `Read` sur le fichier avant tout `Edit`, même si je pense connaître le contenu.

### L2 — Vérifier visuellement le résultat déployé
**Erreur** : après un push, l'utilisateur a constaté "rien n'a changé" car l'ancien composant `EtapeGuide` était encore visible.
**Cause** : j'avais réécrit la logique mais le rendu visuel état B restait identique.
**Règle** : après tout changement UI, décrire précisément ce qui sera visible à l'écran — pas seulement ce qui change dans le code. Si possible, demander une capture d'écran de confirmation.

### L3 — Ne pas recréer ce qui a déjà été demandé de supprimer
**Erreur** : le bandeau ACTIF = PASSIF avait été demandé supprimé dans une session précédente, mais il était encore présent (ou recréé).
**Règle** : avant d'écrire du nouveau code UI, vérifier dans l'historique git si un élément similaire a déjà été supprimé à la demande de l'utilisateur.

### L4 — Aligner les éléments symétriques dès le départ
**Erreur** : Total Actif et Total Passif n'étaient pas alignés verticalement.
**Règle** : quand deux colonnes parallèles ont des totaux en bas, utiliser `flex flex-col` + `mt-auto` dès la création, pas en correction.

### L5 — Utiliser tasks/todo.md pour chaque tâche non triviale
**Règle** : dès qu'une tâche implique plus de 2 fichiers ou 3 étapes, créer un plan dans `tasks/todo.md` avant de commencer.

### L6 — Toujours utiliser les subagents disponibles dans agency-agents/
**Erreur** : travail en mode "tout en un" alors que des agents spécialisés sont disponibles dans `/agency-agents/`.
**Règle** : pour chaque tâche, identifier et activer le bon agent :

| Type de tâche | Agent à utiliser |
|---|---|
| Composant React / UI | `engineering/engineering-frontend-developer.md` |
| Décision UX / hiérarchie visuelle | `design/design-ux-architect.md` |
| Design visuel / couleurs | `design/design-ui-designer.md` |
| Vérification avant push | `testing/testing-reality-checker.md` |
| Coordination multi-agents | `specialized/agents-orchestrator.md` |
| Architecture / refactor | `engineering/engineering-senior-developer.md` |
| Jeu / game design | `game-development/game-designer.md` |

**Workflow obligatoire** :
1. Lire le fichier `.md` de l'agent concerné
2. Lancer un subagent avec ce contexte
3. Valider avec `testing/testing-reality-checker.md` avant tout push

---

### L7 — 2026-03-21 : Agents experts uploadés = priorité absolue

**Erreur** : sur la tâche "Improve unclear game map design", implémentation directe sans consulter les agents experts uploadés par Pierre (design-ux-architect, design-ui-designer, design-whimsy-injector, etc.).

**Conséquence** : v1 du GameMap techniquement correcte mais pauvre — sans microcopy narratif, sans différenciation 6a/6b par couleur, sans "vibe" par étape.

**Règle** :
- Lire les agents uploadés EN DÉBUT de session, pas en cours de route
- Pour toute tâche design/UX : lancer ≥ 3 agents en parallèle AVANT d'écrire du code
- Les agents Design à utiliser en priorité : `design-ux-researcher`, `design-ux-architect`, `design-ui-designer`, `design-visual-storyteller`, `design-whimsy-injector`, `design-brand-guardian`

**Pattern correct validé** :
```
① Lire CLAUDE.md + agents disponibles
② Écrire tasks/todo.md (pas seulement widget TodoWrite)
③ Lancer agents en parallèle (UX Research + Visual Story + Brand/UI)
④ Consolider → specs concrètes
⑤ Implémenter selon specs
⑥ npx tsc --noEmit → 0 erreur
⑦ Commit + update tasks/lessons.md
```

### L8 — 2026-03-21 : `npm run build` échoue dans le VM Linux (SWC)

**Cause** : binaire SWC pour Linux/x64 absent dans le VM sandbox.
**Solution** : utiliser `npx tsc --noEmit` pour la validation TypeScript. Le build réel se fait sur Vercel.
