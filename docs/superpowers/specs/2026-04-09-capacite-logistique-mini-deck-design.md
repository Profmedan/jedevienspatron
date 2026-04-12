# Capacité logistique — Mini-deck par entreprise

**Date** : 2026-04-09
**Statut** : Approuvé — prêt pour implémentation

---

## Contexte

Le système de capacité logistique v2 crée un déséquilibre de départ :

| Entreprise | Immo logistique | Capacité départ |
|---|---|---|
| Manufacture Belvaux | Camionnette (+6) | 10 ventes/trim |
| Véloce Transports | Camion (+6) | 10 ventes/trim |
| Azura Commerce | Aucune | 4 ventes/trim |
| Synergia Lab | Aucune | 4 ventes/trim |

Azura et Synergia n'ont pas de voie claire pour augmenter leur capacité. Les cartes globales existantes (camionnette, expansion...) sont soit thématiquement incohérentes pour elles, soit à bonus faibles, soit non répétables. Un joueur expérimenté évite ces entreprises.

---

## Solution : Mini-deck logistique par entreprise

Chaque entreprise dispose d'un **mini-deck personnel de 3 cartes d'investissement logistique**, thématiques à son profil métier. Ces cartes sont toujours visibles (pas tirées aléatoirement) et constituent la voie de croissance logistique propre à chaque entreprise.

### Objectif de balance

Toutes les entreprises peuvent atteindre **~16 ventes/trim** en investissant leur mini-deck complet.

---

## Contenu des mini-decks

### Manufacture Belvaux (Production) — départ 10

| Carte | ID | Bonus | Coût immo | Prérequis |
|---|---|---|---|---|
| Robot de manutention N1 | `belvaux-robot-n1` | +2 | 5 000 | — |
| Robot de manutention N2 | `belvaux-robot-n2` | +2 | 5 000 | `belvaux-robot-n1` |
| Entrepôt automatisé | `belvaux-entrepot` | +2 | 5 000 | — |

Capacité max : 10 + 6 = **16**

### Véloce Transports (Logistique) — départ 10

| Carte | ID | Bonus | Coût immo | Prérequis |
|---|---|---|---|---|
| 2ème véhicule | `veloce-vehicule-n2` | +2 | 5 000 | — |
| Plateforme dispatch N1 | `veloce-dispatch-n1` | +2 | 5 000 | — |
| Plateforme dispatch N2 | `veloce-dispatch-n2` | +2 | 5 000 | `veloce-dispatch-n1` |

Capacité max : 10 + 6 = **16**

### Azura Commerce (Commerce) — départ 8*

| Carte | ID | Bonus | Coût immo | Prérequis |
|---|---|---|---|---|
| ~~Marketplace N1~~ | `azura-marketplace-n1` | +4 | — | — |
| Marketplace N2 | `azura-marketplace-n2` | +4 | 5 000 | `azura-marketplace-n1` |
| Sous-traitance livraison | `azura-soustraitance` | +4 | 5 000 | — |

*Marketplace N1 incluse dans l'équipement de départ (cartesActives au T1).
Capacité max : 8 + 8 = **16**

### Synergia Lab (Innovation) — départ 8*

| Carte | ID | Bonus | Coût immo | Prérequis |
|---|---|---|---|---|
| ~~ERP logistique N1~~ | `synergia-erp-n1` | +4 | — | — |
| ERP logistique N2 | `synergia-erp-n2` | +4 | 5 000 | `synergia-erp-n1` |
| Partenariat logistique | `synergia-partenariat` | +4 | 5 000 | — |

*ERP N1 inclus dans l'équipement de départ (cartesActives au T1).
Capacité max : 8 + 8 = **16**

---

## Coût uniforme

Toutes les cartes du mini-deck coûtent **5 000€ en immobilisations** (Trésorerie −5 000, Immobilisations +5 000). Uniforme entre toutes les entreprises pour éviter qu'un joueur expérimenté favorise ou évite une entreprise sur la base du coût.

---

## Modèle de données

### Nouveaux champs sur `CarteDecision` (types.ts)

```typescript
prerequis?: string           // ID de la carte N1 requise avant investissement
entrepriseExclusive?: string // ex: "Azura Commerce" — visible uniquement pour cette entreprise
```

### Nouveaux champs sur `EntrepriseTemplate` (types.ts)

```typescript
cartesLogistiquesDepart: CarteDecision[]       // actives dès T1, ajoutées à cartesActives
cartesLogistiquesDisponibles: CarteDecision[]  // peuplent piochePersonnelle
```

### Nouveau champ sur `Joueur` (types.ts)

```typescript
piochePersonnelle: CarteDecision[]  // cartes mini-deck non encore investies
```

---

## Logique moteur (engine.ts)

### `creerJoueur`

1. Pousser `cartesLogistiquesDepart` dans `cartesActives` (comme les immos de départ)
2. Initialiser `piochePersonnelle` depuis `cartesLogistiquesDisponibles`

### Décision d'investissement dans une carte personnelle

```
Joueur décide d'investir dans une carte de piochePersonnelle
  → Vérification prérequis (carte.prerequis dans cartesActives ?)
      ├── OUI → investissement validé :
      │         • Immobilisations +5 000€, Trésorerie −5 000€
      │         • Carte retirée de piochePersonnelle → ajoutée à cartesActives
      └── NON → investissement bloqué : "Prérequis : [nom carte N1] non acquise"
```

`calculerCapaciteLogistique` ne change pas — il lit `cartesActives` et applique automatiquement les nouveaux bonus via `CAPACITE_IMMOBILISATION`.

### Nouveaux IDs dans `CAPACITE_IMMOBILISATION` (types.ts)

Ajouter les 12 IDs avec leurs bonus respectifs (+2 pour Belvaux/Véloce, +4 pour Azura/Synergia).

---

## Interface utilisateur

### Panneau "Investissements logistiques"

Affiché à côté des 4 cartes décision aléatoires pendant la phase décision. Toujours visible — les cartes ne sont pas tirées, elles sont permanentes.

- Carte disponible → bouton "Investir" actif
- Carte N2 prérequis non atteint → grisée, label "Nécessite [nom N1]"
- Carte déjà investie → absente (retirée de `piochePersonnelle`)

### Alerte capacité insuffisante

Quand `clientsPerdusCeTour > 0`, afficher un bandeau prominent :

> ⚠️ Capacité logistique insuffisante — X client(s) perdu(s) ce trimestre

Ce signal pousse naturellement le joueur à consulter son panneau d'investissements.

---

## Fichiers impactés

| Fichier | Modification |
|---|---|
| `packages/game-engine/src/types.ts` | Nouveaux champs CarteDecision, EntrepriseTemplate, Joueur + 12 IDs dans CAPACITE_IMMOBILISATION |
| `packages/game-engine/src/data/entreprises.ts` | cartesLogistiquesDepart + cartesLogistiquesDisponibles pour les 4 entreprises |
| `packages/game-engine/src/engine.ts` | creerJoueur + logique investissement carte personnelle |
| `apps/web/lib/game-engine/` | Synchroniser les 3 fichiers ci-dessus (L20) |
| Composant phase décision (UI) | Panneau mini-deck + alerte clientsPerdusCeTour |

---

## Hors périmètre

- Amortissement des nouvelles immobilisations (géré automatiquement par le système existant)
- Modification des bonus des cartes globales existantes (camionnette, expansion, etc.)
