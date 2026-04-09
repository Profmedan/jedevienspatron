# Superpowers Skills Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une section `## Superpowers Skills` dans `CLAUDE.md` pour activer les skills automatiquement dans ce projet sans modifier le workflow existant.

**Architecture:** Modification additive de `CLAUDE.md` — une nouvelle section insérée après `## Workflow obligatoire`, sans toucher aux règles existantes.

**Tech Stack:** Markdown, CLAUDE.md

---

### Task 1 : Ajouter la section Superpowers Skills dans CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` — après la section `## Workflow obligatoire`

- [ ] **Step 1 : Ouvrir CLAUDE.md et localiser la section cible**

Le bloc à trouver (fin de la section Workflow) :
```markdown
5. **Mettre à jour** `tasks/todo.md` et `tasks/lessons.md` après chaque correction
```

- [ ] **Step 2 : Insérer la section Superpowers Skills après ce bloc**

Ajouter exactement ce contenu après l'étape 5 du workflow :

```markdown

---

## Superpowers Skills

### Déclencheurs automatiques

| Situation | Skill à invoquer |
|---|---|
| Nouvelle fonctionnalité / mécanique de jeu | `brainstorming` en premier |
| Bug / comportement inattendu | `systematic-debugging` en premier |
| Tâche non triviale (> 2 fichiers modifiés) | `writing-plans` avant le code |
| Avant d'affirmer "c'est corrigé" / "c'est fait" | `verification-before-completion` |
| Exécuter un plan existant | `executing-plans` |

### Cohabitation avec le workflow existant

Les skills s'intercalent sans remplacer les règles actuelles :

```
1. Lire tasks/lessons.md                          ← inchangé
2. [brainstorming ou writing-plans si applicable] ← superpowers
3. Planifier dans tasks/todo.md                   ← inchangé
4. Implémenter
5. [verification-before-completion]               ← superpowers
6. npx tsc --noEmit                               ← inchangé
7. Mettre à jour todo.md + lessons.md             ← inchangé
```
```

- [ ] **Step 3 : Vérifier que le workflow existant est intact**

Lire `CLAUDE.md` et confirmer que les 5 étapes du Workflow obligatoire sont présentes et inchangées.

- [ ] **Step 4 : Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-04-09-superpowers-integration-design.md docs/superpowers/plans/2026-04-09-superpowers-integration.md
git commit -m "chore: intégration superpowers skills dans CLAUDE.md"
```
