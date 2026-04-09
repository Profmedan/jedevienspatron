# Superpowers Skills — Intégration dans CLAUDE.md

**Date :** 2026-04-09
**Projet :** jedevienspatron-github
**Statut :** Approuvé

---

## Objectif

Activer les superpowers skills automatiquement dans ce projet sans modifier le workflow existant de CLAUDE.md. Les skills viennent en complément, pas en remplacement.

## Approche retenue

Ajout d'une section `## Superpowers Skills` dans `CLAUDE.md` (approche additive). Le workflow existant reste intact.

## Design

### Section à ajouter dans CLAUDE.md

#### Déclencheurs automatiques

| Situation | Skill à invoquer |
|---|---|
| Nouvelle fonctionnalité / mécanique de jeu | `brainstorming` en premier |
| Bug / comportement inattendu | `systematic-debugging` en premier |
| Tâche non triviale (> 2 fichiers modifiés) | `writing-plans` avant le code |
| Avant d'affirmer "c'est corrigé" / "c'est fait" | `verification-before-completion` |
| Exécuter un plan existant | `executing-plans` |

#### Cohabitation avec le workflow existant

Les skills s'intercalent dans le workflow sans le remplacer :

```
1. Lire tasks/lessons.md                          ← inchangé
2. [brainstorming ou writing-plans si applicable] ← nouveau
3. Planifier dans tasks/todo.md                   ← inchangé
4. Implémenter
5. [verification-before-completion]               ← nouveau
6. npx tsc --noEmit                               ← inchangé
7. Mettre à jour todo.md + lessons.md             ← inchangé
```

## Fichier modifié

- `CLAUDE.md` — ajout de la section `## Superpowers Skills` après `## Workflow obligatoire`

## Non concerné

- `settings.json` — aucun hook supplémentaire nécessaire
- Le workflow obligatoire existant — aucune modification
- Les règles React critiques — aucune modification
