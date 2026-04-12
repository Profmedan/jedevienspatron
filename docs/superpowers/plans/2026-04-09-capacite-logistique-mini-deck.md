# Capacité logistique — Mini-deck par entreprise

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à chaque entreprise un mini-deck personnel de 3 cartes d'investissement logistique thématiques, accessibles en permanence pendant l'étape 6, avec un système de prérequis N1→N2.

**Architecture:** Nouveaux champs sur `CarteDecision`, `EntrepriseTemplate` et `Joueur` dans `types.ts`. Les 12 cartes sont définies dans `cartes.ts` et assignées dans `entreprises.ts`. Une nouvelle fonction `investirCartePersonnelle` dans `engine.ts` gère le prérequis et retire la carte de `piochePersonnelle`. L'UI ajoute un panneau dédié dans `LeftPanel` et une alerte `clientsPerdusCeTour`.

**Tech Stack:** TypeScript strict, Next.js 15 / React 18, moteur de jeu pur (packages/game-engine). Validation : `npx tsc --noEmit` depuis `apps/web`.

**Rappel L20 :** Toute modification de `engine.ts`, `types.ts`, `cartes.ts`, `entreprises.ts` dans `packages/game-engine/src/` doit être synchronisée dans `apps/web/lib/game-engine/`.

---

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `packages/game-engine/src/types.ts` | Modifier : nouveaux champs CarteDecision, EntrepriseTemplate, Joueur + 12 IDs dans CAPACITE_IMMOBILISATION |
| `packages/game-engine/src/data/cartes.ts` | Modifier : ajouter 12 définitions de cartes logistiques |
| `packages/game-engine/src/data/entreprises.ts` | Modifier : ajouter cartesLogistiquesDepart + cartesLogistiquesDisponibles pour les 4 entreprises |
| `packages/game-engine/src/engine.ts` | Modifier : creerJoueur + nouvelle fonction investirCartePersonnelle |
| `packages/game-engine/tests/engine.test.ts` | Modifier : tests piochePersonnelle, prérequis, capacité |
| `apps/web/lib/game-engine/types.ts` | Sync avec packages/game-engine/src/types.ts |
| `apps/web/lib/game-engine/data/cartes.ts` | Sync avec packages/game-engine/src/data/cartes.ts |
| `apps/web/lib/game-engine/data/entreprises.ts` | Sync avec packages/game-engine/src/data/entreprises.ts |
| `apps/web/lib/game-engine/engine.ts` | Sync avec packages/game-engine/src/engine.ts |
| `apps/web/components/jeu/MiniDeckPanel.tsx` | Créer : panneau investissements logistiques |
| `apps/web/components/jeu/LeftPanel.tsx` | Modifier : intégrer MiniDeckPanel + alerte clientsPerdusCeTour |
| `apps/web/app/jeu/hooks/useGameFlow.ts` | Modifier : onInvestirPersonnel + passer piochePersonnelle |
| `apps/web/app/jeu/page.tsx` | Modifier : passer piochePersonnelle et onInvestirPersonnel à LeftPanel |

---

## Task 1 : Nouveaux types et constantes de capacité

**Fichiers :**
- Modifier : `packages/game-engine/src/types.ts`

- [ ] **Step 1 : Ajouter les champs `prerequis` et `entrepriseExclusive` sur `CarteDecision`**

Dans `packages/game-engine/src/types.ts`, à la fin de l'interface `CarteDecision` (après `categorie`), ajouter :

```typescript
  /** ID de la carte qui doit être dans cartesActives avant d'investir dans celle-ci */
  prerequis?: string;
  /** Si défini, cette carte n'est proposée qu'à cette entreprise */
  entrepriseExclusive?: NomEntreprise;
```

- [ ] **Step 2 : Ajouter les champs logistiques sur `EntrepriseTemplate`**

Dans `packages/game-engine/src/types.ts`, à la fin de l'interface `EntrepriseTemplate` (après `passifs`), ajouter :

```typescript
  /** Cartes logistiques actives dès T1 (ajoutées à cartesActives à l'initialisation) */
  cartesLogistiquesDepart?: CarteDecision[];
  /** Mini-deck logistique personnel — peuple piochePersonnelle à l'initialisation */
  cartesLogistiquesDisponibles?: CarteDecision[];
```

- [ ] **Step 3 : Ajouter `piochePersonnelle` sur `Joueur`**

Dans `packages/game-engine/src/types.ts`, dans l'interface `Joueur`, après `clientsATrait`, ajouter :

```typescript
  /** Mini-deck logistique personnel — cartes disponibles à l'investissement */
  piochePersonnelle: CarteDecision[];
```

- [ ] **Step 4 : Ajouter les 12 IDs dans `CAPACITE_IMMOBILISATION`**

Dans `packages/game-engine/src/types.ts`, dans `CAPACITE_IMMOBILISATION`, après la ligne `"sous-traitance": 0,`, remplacer la valeur 0 et ajouter les nouvelles entrées :

```typescript
  // Mini-deck Manufacture Belvaux (Production)
  "belvaux-robot-n1": 2,
  "belvaux-robot-n2": 2,
  "belvaux-entrepot": 2,

  // Mini-deck Véloce Transports (Logistique)
  "veloce-vehicule-n2": 2,
  "veloce-dispatch-n1": 2,
  "veloce-dispatch-n2": 2,

  // Mini-deck Azura Commerce (Commerce)
  "azura-marketplace-n1": 4,
  "azura-marketplace-n2": 4,
  "azura-soustraitance": 4,

  // Mini-deck Synergia Lab (Innovation)
  "synergia-erp-n1": 4,
  "synergia-erp-n2": 4,
  "synergia-partenariat": 4,
```

- [ ] **Step 5 : Vérifier que TypeScript compile**

```bash
cd /Users/ph/Desktop/jedevienspatron-github/apps/web && npx tsc --noEmit 2>&1
```

Attendu : 0 nouvelle erreur.

- [ ] **Step 6 : Commit**

```bash
cd /Users/ph/Desktop/jedevienspatron-github
git add packages/game-engine/src/types.ts
git commit -m "feat: add piochePersonnelle, prerequis, entrepriseExclusive types + 12 capacity IDs"
```

---

## Task 2 : Définitions des 12 cartes logistiques

**Fichiers :**
- Modifier : `packages/game-engine/src/data/cartes.ts`

- [ ] **Step 1 : Ajouter les 12 cartes à la fin de `CARTES_DECISION`**

Dans `packages/game-engine/src/data/cartes.ts`, avant le `];` de fermeture de `CARTES_DECISION`, ajouter :

```typescript
  // ── MINI-DECK LOGISTIQUE — Manufacture Belvaux ─────────────

  {
    type: "decision",
    id: "belvaux-robot-n1",
    titre: "Robot de manutention",
    description: "Automatisez la préparation des commandes — +2 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "investissement",
    entrepriseExclusive: "Manufacture Belvaux",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },
  {
    type: "decision",
    id: "belvaux-robot-n2",
    titre: "Robot de manutention N2",
    description: "Doublez la ligne robotisée — +2 ventes/trim supplémentaires. Investissement : Immos +5 000 €, Tréso −5 000 €. Nécessite : Robot N1. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "investissement",
    entrepriseExclusive: "Manufacture Belvaux",
    prerequis: "belvaux-robot-n1",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },
  {
    type: "decision",
    id: "belvaux-entrepot",
    titre: "Entrepôt automatisé",
    description: "Optimisez le stockage et l'expédition — +2 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "investissement",
    entrepriseExclusive: "Manufacture Belvaux",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },

  // ── MINI-DECK LOGISTIQUE — Véloce Transports ───────────────

  {
    type: "decision",
    id: "veloce-vehicule-n2",
    titre: "2ème véhicule",
    description: "Ajoutez un second véhicule à la flotte — +2 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "vehicule",
    entrepriseExclusive: "Véloce Transports",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },
  {
    type: "decision",
    id: "veloce-dispatch-n1",
    titre: "Plateforme dispatch",
    description: "Centralisez la gestion des tournées — +2 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "investissement",
    entrepriseExclusive: "Véloce Transports",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },
  {
    type: "decision",
    id: "veloce-dispatch-n2",
    titre: "Plateforme dispatch N2",
    description: "Étendez la plateforme à la gestion multi-dépôts — +2 ventes/trim supplémentaires. Investissement : Immos +5 000 €, Tréso −5 000 €. Nécessite : Plateforme dispatch. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "investissement",
    entrepriseExclusive: "Véloce Transports",
    prerequis: "veloce-dispatch-n1",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },

  // ── MINI-DECK LOGISTIQUE — Azura Commerce ──────────────────

  {
    type: "decision",
    id: "azura-marketplace-n1",
    titre: "Marketplace (incluse)",
    description: "Plateforme e-commerce de base — +4 ventes/trim. Investissement initial inclus dans le capital de départ.",
    categorie: "investissement",
    entrepriseExclusive: "Azura Commerce",
    effetsImmédiats: [],
    effetsRecurrents: [],
  },
  {
    type: "decision",
    id: "azura-marketplace-n2",
    titre: "Marketplace N2",
    description: "Ouvrez de nouveaux canaux de vente en ligne — +4 ventes/trim supplémentaires. Investissement : Immos +5 000 €, Tréso −5 000 €. Nécessite : Marketplace. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "investissement",
    entrepriseExclusive: "Azura Commerce",
    prerequis: "azura-marketplace-n1",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },
  {
    type: "decision",
    id: "azura-soustraitance",
    titre: "Sous-traitance livraison",
    description: "Externalisez la logistique à un prestataire — +4 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "investissement",
    entrepriseExclusive: "Azura Commerce",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },

  // ── MINI-DECK LOGISTIQUE — Synergia Lab ────────────────────

  {
    type: "decision",
    id: "synergia-erp-n1",
    titre: "ERP logistique (inclus)",
    description: "Module de gestion des flux de base — +4 ventes/trim. Investissement initial inclus dans le capital de départ.",
    categorie: "investissement",
    entrepriseExclusive: "Synergia Lab",
    effetsImmédiats: [],
    effetsRecurrents: [],
  },
  {
    type: "decision",
    id: "synergia-erp-n2",
    titre: "ERP logistique N2",
    description: "Activez les modules avancés (prévisions, automatisation) — +4 ventes/trim supplémentaires. Investissement : Immos +5 000 €, Tréso −5 000 €. Nécessite : ERP N1. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "investissement",
    entrepriseExclusive: "Synergia Lab",
    prerequis: "synergia-erp-n1",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },
  {
    type: "decision",
    id: "synergia-partenariat",
    titre: "Partenariat logistique",
    description: "Nouez un accord avec un opérateur externe — +4 ventes/trim. Investissement : Immos +5 000 €, Tréso −5 000 €. 📉 Amortissement : −1/trim pendant 5 trimestres.",
    categorie: "investissement",
    entrepriseExclusive: "Synergia Lab",
    effetsImmédiats: [
      { poste: "immobilisations", delta: 5000 },
      { poste: "tresorerie", delta: -5000 },
    ],
    effetsRecurrents: [],
  },
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /Users/ph/Desktop/jedevienspatron-github/apps/web && npx tsc --noEmit 2>&1
```

Attendu : 0 nouvelle erreur.

- [ ] **Step 3 : Commit**

```bash
cd /Users/ph/Desktop/jedevienspatron-github
git add packages/game-engine/src/data/cartes.ts
git commit -m "feat: add 12 logistic mini-deck card definitions"
```

---

## Task 3 : Assignation des cartes aux entreprises

**Fichiers :**
- Modifier : `packages/game-engine/src/data/entreprises.ts`

- [ ] **Step 1 : Importer les nouvelles cartes**

Au début de `packages/game-engine/src/data/entreprises.ts`, vérifier que `CARTES_DECISION` est importé. Si ce n'est pas le cas, ajouter :

```typescript
import { CARTES_DECISION } from "./cartes";
```

Si `CARTES_DECISION` n'est pas déjà importé, ajouter cet import après les imports existants.

- [ ] **Step 2 : Ajouter un helper local en haut du fichier (après les imports)**

```typescript
function carte(id: string) {
  const c = CARTES_DECISION.find((c) => c.id === id);
  if (!c) throw new Error(`[entreprises.ts] Carte introuvable : "${id}"`);
  return c;
}
```

- [ ] **Step 3 : Ajouter les champs à Manufacture Belvaux**

Dans l'objet `Manufacture Belvaux`, après le champ `passifs`, ajouter :

```typescript
    cartesLogistiquesDepart: [],
    cartesLogistiquesDisponibles: [
      carte("belvaux-robot-n1"),
      carte("belvaux-robot-n2"),
      carte("belvaux-entrepot"),
    ],
```

- [ ] **Step 4 : Ajouter les champs à Véloce Transports**

Dans l'objet `Véloce Transports`, après le champ `passifs`, ajouter :

```typescript
    cartesLogistiquesDepart: [],
    cartesLogistiquesDisponibles: [
      carte("veloce-vehicule-n2"),
      carte("veloce-dispatch-n1"),
      carte("veloce-dispatch-n2"),
    ],
```

- [ ] **Step 5 : Ajouter les champs à Azura Commerce**

Dans l'objet `Azura Commerce`, après le champ `passifs`, ajouter :

```typescript
    cartesLogistiquesDepart: [
      carte("azura-marketplace-n1"),  // actif dès T1, capacité 4→8
    ],
    cartesLogistiquesDisponibles: [
      carte("azura-marketplace-n2"),
      carte("azura-soustraitance"),
    ],
```

- [ ] **Step 6 : Ajouter les champs à Synergia Lab**

Dans l'objet `Synergia Lab`, après le champ `passifs`, ajouter :

```typescript
    cartesLogistiquesDepart: [
      carte("synergia-erp-n1"),  // actif dès T1, capacité 4→8
    ],
    cartesLogistiquesDisponibles: [
      carte("synergia-erp-n2"),
      carte("synergia-partenariat"),
    ],
```

- [ ] **Step 7 : Vérifier TypeScript**

```bash
cd /Users/ph/Desktop/jedevienspatron-github/apps/web && npx tsc --noEmit 2>&1
```

Attendu : 0 nouvelle erreur.

- [ ] **Step 8 : Commit**

```bash
cd /Users/ph/Desktop/jedevienspatron-github
git add packages/game-engine/src/data/entreprises.ts
git commit -m "feat: assign logistic mini-decks to all 4 companies"
```

---

## Task 4 : Moteur — initialisation et investissement

**Fichiers :**
- Modifier : `packages/game-engine/src/engine.ts`

- [ ] **Step 1 : Initialiser `piochePersonnelle` dans `creerJoueur`**

Dans `engine.ts`, dans la fonction `creerJoueur`, remplacer le `return { ... }` en ajoutant les deux champs suivants après `clientsATrait` :

```typescript
    elimine: false,
    publicitéCeTour: false,
    clientsPerdusCeTour: 0,
    piochePersonnelle: template.cartesLogistiquesDisponibles ?? [],
```

Et dans le bloc `cartesActives`, ajouter les cartes de départ logistiques après le commercial junior :

```typescript
    cartesActives: (() => {
      const comJunior = CARTES_DECISION.find((c) => c.id === CARTE_IDS.COMMERCIAL_JUNIOR);
      const base = comJunior ? [{ ...comJunior, id: `${comJunior.id}-init-${_nextCommercialId++}` }] : [];
      return [...base, ...(template.cartesLogistiquesDepart ?? [])];
    })(),
```

- [ ] **Step 2 : Ajouter la fonction `investirCartePersonnelle` après `acheterCarteDecision`**

Dans `engine.ts`, après la fonction `acheterCarteDecision` (ligne ~817), ajouter :

```typescript
/**
 * Investit dans une carte du mini-deck logistique personnel du joueur.
 * Vérifie le prérequis, retire la carte de piochePersonnelle, applique les effets immédiats.
 */
export function investirCartePersonnelle(
  etat: EtatJeu,
  joueurIdx: number,
  carteId: string
): ResultatAction {
  const joueur = etat.joueurs[joueurIdx];
  const carteIdx = joueur.piochePersonnelle.findIndex((c) => c.id === carteId);

  if (carteIdx === -1) {
    return {
      succes: false,
      messageErreur: `Carte "${carteId}" introuvable dans votre mini-deck.`,
      modifications: [],
    };
  }

  const carte = joueur.piochePersonnelle[carteIdx];

  // Vérification du prérequis
  if (carte.prerequis && !joueur.cartesActives.some((c) => c.id === carte.prerequis)) {
    const carteRequise = joueur.piochePersonnelle.find((c) => c.id === carte.prerequis)
      ?? joueur.cartesActives.find((c) => c.id === carte.prerequis);
    const nomRequis = carteRequise?.titre ?? carte.prerequis;
    return {
      succes: false,
      messageErreur: `Prérequis non atteint : investissez d'abord dans "${nomRequis}".`,
      modifications: [],
    };
  }

  const modifications: ResultatAction["modifications"] = [];

  // Appliquer les effets immédiats
  for (const effet of carte.effetsImmédiats) {
    const { ancienneValeur, nouvelleValeur } = appliquerDeltaPoste(
      joueur,
      effet.poste,
      effet.delta
    );
    modifications.push({
      joueurId: joueur.id,
      poste: effet.poste,
      ancienneValeur,
      nouvelleValeur,
      explication: `${carte.titre} — investissement logistique`,
    });
  }

  // Retirer de piochePersonnelle, ajouter à cartesActives
  joueur.piochePersonnelle = joueur.piochePersonnelle.filter((_, i) => i !== carteIdx);
  joueur.cartesActives.push(carte);

  return { succes: true, modifications };
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
cd /Users/ph/Desktop/jedevienspatron-github/apps/web && npx tsc --noEmit 2>&1
```

Attendu : 0 nouvelle erreur.

- [ ] **Step 4 : Commit**

```bash
cd /Users/ph/Desktop/jedevienspatron-github
git add packages/game-engine/src/engine.ts
git commit -m "feat: init piochePersonnelle in creerJoueur + investirCartePersonnelle"
```

---

## Task 5 : Tests moteur

**Fichiers :**
- Modifier : `packages/game-engine/tests/engine.test.ts`

- [ ] **Step 1 : Importer `investirCartePersonnelle` et `calculerCapaciteLogistique`**

En haut du fichier de test, ajouter à l'import de `engine` :

```typescript
import {
  creerJoueur,
  initialiserJeu,
  appliquerEtape0,
  appliquerCarteClient,
  appliquerPaiementCommerciaux,
  appliquerAvancementCreances,
  verifierFinTour,
  calculerCoutCommerciaux,
  genererClientsParCommerciaux,
  investirCartePersonnelle,       // nouveau
  calculerCapaciteLogistique,     // nouveau
} from "../src/engine";
```

- [ ] **Step 2 : Écrire les tests et vérifier qu'ils échouent**

Ajouter à la fin du fichier de test :

```typescript
// ─── MINI-DECK LOGISTIQUE ─────────────────────────────────────

describe("piochePersonnelle — initialisation", () => {
  test("Manufacture Belvaux démarre avec 3 cartes dans piochePersonnelle", () => {
    const joueur = creerJoueur(0, "Test", "Manufacture Belvaux");
    expect(joueur.piochePersonnelle).toHaveLength(3);
    expect(joueur.piochePersonnelle.map((c) => c.id)).toContain("belvaux-robot-n1");
  });

  test("Azura Commerce démarre avec 2 cartes dans piochePersonnelle (N1 est dans cartesActives)", () => {
    const joueur = creerJoueur(0, "Test", "Azura Commerce");
    expect(joueur.piochePersonnelle).toHaveLength(2);
    expect(joueur.cartesActives.some((c) => c.id === "azura-marketplace-n1")).toBe(true);
  });

  test("Azura Commerce démarre à capacité 8 grâce à marketplace N1", () => {
    const joueur = creerJoueur(0, "Test", "Azura Commerce");
    expect(calculerCapaciteLogistique(joueur)).toBe(8);
  });

  test("Synergia Lab démarre à capacité 8 grâce à ERP N1", () => {
    const joueur = creerJoueur(0, "Test", "Synergia Lab");
    expect(calculerCapaciteLogistique(joueur)).toBe(8);
  });

  test("Manufacture Belvaux démarre à capacité 10 (inchangée)", () => {
    const joueur = creerJoueur(0, "Test", "Manufacture Belvaux");
    expect(calculerCapaciteLogistique(joueur)).toBe(10);
  });
});

describe("investirCartePersonnelle — prérequis", () => {
  test("Investir dans N1 réussit et retire la carte de piochePersonnelle", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = investirCartePersonnelle(etat, 0, "belvaux-robot-n1");
    expect(result.succes).toBe(true);
    expect(etat.joueurs[0].piochePersonnelle.find((c) => c.id === "belvaux-robot-n1")).toBeUndefined();
    expect(etat.joueurs[0].cartesActives.some((c) => c.id === "belvaux-robot-n1")).toBe(true);
  });

  test("Investir dans N2 sans N1 échoue avec message prérequis", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = investirCartePersonnelle(etat, 0, "belvaux-robot-n2");
    expect(result.succes).toBe(false);
    expect(result.messageErreur).toContain("Prérequis");
  });

  test("Investir dans N2 après N1 réussit et augmente la capacité", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    investirCartePersonnelle(etat, 0, "belvaux-robot-n1");
    const result = investirCartePersonnelle(etat, 0, "belvaux-robot-n2");
    expect(result.succes).toBe(true);
    expect(calculerCapaciteLogistique(etat.joueurs[0])).toBe(14); // 10 + 2 + 2
  });

  test("Carte introuvable dans piochePersonnelle retourne erreur", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const result = investirCartePersonnelle(etat, 0, "id-inexistant");
    expect(result.succes).toBe(false);
    expect(result.messageErreur).toContain("introuvable");
  });

  test("Investir dans N1 débite 5 000€ de trésorerie", () => {
    const etat = initialiserJeu([{ pseudo: "Test", nomEntreprise: "Manufacture Belvaux" }]);
    const tresoAvant = etat.joueurs[0].bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;
    investirCartePersonnelle(etat, 0, "belvaux-robot-n1");
    const tresoApres = etat.joueurs[0].bilan.actifs.find((a) => a.categorie === "tresorerie")!.valeur;
    expect(tresoApres).toBe(tresoAvant - 5000);
  });
});
```

- [ ] **Step 3 : Vérifier que les tests échouent (TDD)**

```bash
cd /Users/ph/Desktop/jedevienspatron-github/packages/game-engine && npx jest 2>&1
```

Attendu : les nouveaux tests FAIL (fonctions pas encore implémentées dans le package — normal à ce stade).

- [ ] **Step 4 : Lancer les tests après l'implémentation des Tasks 1-4**

```bash
cd /Users/ph/Desktop/jedevienspatron-github/packages/game-engine && npx jest 2>&1
```

Attendu : tous les nouveaux tests PASS.

- [ ] **Step 5 : Commit**

```bash
cd /Users/ph/Desktop/jedevienspatron-github
git add packages/game-engine/tests/engine.test.ts
git commit -m "test: mini-deck piochePersonnelle, prerequis, capacite logistique"
```

---

## Task 6 : Synchronisation apps/web/lib/game-engine/ (L20)

**Fichiers :**
- Modifier : `apps/web/lib/game-engine/types.ts`
- Modifier : `apps/web/lib/game-engine/data/cartes.ts`
- Modifier : `apps/web/lib/game-engine/data/entreprises.ts`
- Modifier : `apps/web/lib/game-engine/engine.ts`

- [ ] **Step 1 : Répliquer les modifications de types.ts**

Appliquer exactement les mêmes changements que Task 1 sur `apps/web/lib/game-engine/types.ts` :
- Champs `prerequis?` et `entrepriseExclusive?` sur `CarteDecision`
- Champs `cartesLogistiquesDepart?` et `cartesLogistiquesDisponibles?` sur `EntrepriseTemplate`
- Champ `piochePersonnelle` sur `Joueur`
- 12 IDs dans `CAPACITE_IMMOBILISATION`

- [ ] **Step 2 : Répliquer les 12 cartes dans cartes.ts**

Appliquer exactement les mêmes ajouts que Task 2 sur `apps/web/lib/game-engine/data/cartes.ts`.

- [ ] **Step 3 : Répliquer les assignations dans entreprises.ts**

Appliquer exactement les mêmes ajouts que Task 3 sur `apps/web/lib/game-engine/data/entreprises.ts`.

- [ ] **Step 4 : Répliquer les modifications de engine.ts**

Appliquer exactement les mêmes modifications que Task 4 sur `apps/web/lib/game-engine/engine.ts` :
- `piochePersonnelle` dans `creerJoueur`
- `cartesLogistiquesDepart` dans `cartesActives` au retour de `creerJoueur`
- Fonction `investirCartePersonnelle` exportée

- [ ] **Step 5 : Vérifier TypeScript apps/web**

```bash
cd /Users/ph/Desktop/jedevienspatron-github/apps/web && npx tsc --noEmit 2>&1
```

Attendu : 0 erreur.

- [ ] **Step 6 : Commit**

```bash
cd /Users/ph/Desktop/jedevienspatron-github
git add apps/web/lib/game-engine/
git commit -m "feat: sync game-engine lib with mini-deck changes (L20)"
```

---

## Task 7 : Composant MiniDeckPanel

**Fichiers :**
- Créer : `apps/web/components/jeu/MiniDeckPanel.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
"use client";

import { CarteDecision, Joueur } from "@jedevienspatron/game-engine";

interface MiniDeckPanelProps {
  joueur: Joueur;
  onInvestir: (carteId: string) => void;
  disabled?: boolean; // true si pas étape 6
}

export function MiniDeckPanel({ joueur, onInvestir, disabled }: MiniDeckPanelProps) {
  if (joueur.piochePersonnelle.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <h3 className="mb-2 text-sm font-semibold text-amber-800">
        Investissements logistiques
      </h3>
      <div className="flex flex-col gap-2">
        {joueur.piochePersonnelle.map((carte) => {
          const prerequisOk = !carte.prerequis ||
            joueur.cartesActives.some((c) => c.id === carte.prerequis);
          const peutInvestir = !disabled && prerequisOk;

          return (
            <div
              key={carte.id}
              className={`rounded border p-2 text-xs ${
                prerequisOk
                  ? "border-amber-300 bg-white"
                  : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-800">{carte.titre}</p>
                  {!prerequisOk && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      Nécessite :{" "}
                      {joueur.piochePersonnelle.find((c) => c.id === carte.prerequis)?.titre
                        ?? carte.prerequis}
                    </p>
                  )}
                  {prerequisOk && (
                    <p className="mt-0.5 text-gray-500">{carte.description.split("—")[1]?.trim().split(".")[0]}</p>
                  )}
                </div>
                <button
                  onClick={() => onInvestir(carte.id)}
                  disabled={!peutInvestir}
                  className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    peutInvestir
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "cursor-not-allowed bg-gray-200 text-gray-400"
                  }`}
                >
                  Investir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /Users/ph/Desktop/jedevienspatron-github/apps/web && npx tsc --noEmit 2>&1
```

Attendu : 0 erreur.

- [ ] **Step 3 : Commit**

```bash
cd /Users/ph/Desktop/jedevienspatron-github
git add apps/web/components/jeu/MiniDeckPanel.tsx
git commit -m "feat: add MiniDeckPanel component for personal logistic investments"
```

---

## Task 8 : Intégration UI — LeftPanel + alerte + flow

**Fichiers :**
- Modifier : `apps/web/app/jeu/hooks/useGameFlow.ts`
- Modifier : `apps/web/app/jeu/page.tsx`
- Modifier : `apps/web/components/jeu/LeftPanel.tsx`

- [ ] **Step 1 : Ajouter `investirCartePersonnelle` dans `useGameFlow.ts`**

Dans `apps/web/app/jeu/hooks/useGameFlow.ts`, importer la nouvelle fonction :

```typescript
import {
  tirerCartesDecision, acheterCarteDecision,
  investirCartePersonnelle,   // ajouter
  // ... autres imports existants
} from "@/lib/game-engine/engine";
```

Puis dans le return de `useGameFlow`, ajouter le handler :

```typescript
    handleInvestirPersonnel: (carteId: string) => {
      if (!etat) return;
      const next = cloneEtat(etat);
      const result = investirCartePersonnelle(next, next.joueurActif, carteId);
      if (result.succes) {
        setEtat(next);
        addJournalEntry(result.modifications, "Investissement logistique");
      } else {
        // Afficher l'erreur — réutiliser le mécanisme decisionError existant
        setDecisionError(result.messageErreur ?? "Erreur investissement");
      }
    },
```

- [ ] **Step 2 : Passer `handleInvestirPersonnel` depuis `page.tsx`**

Dans `apps/web/app/jeu/page.tsx`, ajouter `onInvestirPersonnel={flow.handleInvestirPersonnel}` dans les props de `LeftPanel` :

```tsx
            <LeftPanel
              // ... props existants ...
              onInvestirPersonnel={flow.handleInvestirPersonnel}
            />
```

- [ ] **Step 3 : Mettre à jour `LeftPanel.tsx` — props et rendu**

Dans `apps/web/components/jeu/LeftPanel.tsx` :

**Ajouter l'import :**
```typescript
import { MiniDeckPanel } from "./MiniDeckPanel";
```

**Ajouter à l'interface `LeftPanelProps` :**
```typescript
  onInvestirPersonnel?: (carteId: string) => void;
```

**Ajouter le paramètre dans la fonction :**
```typescript
export function LeftPanel({
  // ... params existants ...
  onInvestirPersonnel,
}: LeftPanelProps) {
```

**Ajouter le rendu du MiniDeckPanel** dans la zone de l'étape 6 (après les cartes décision aléatoires) :

```tsx
          {/* Mini-deck logistique — visible à l'étape 6 */}
          {etapeTour === 6 && subEtape6 === "investissement" && (
            <MiniDeckPanel
              joueur={joueur}
              onInvestir={(carteId) => onInvestirPersonnel?.(carteId)}
              disabled={false}
            />
          )}
```

**Ajouter l'alerte `clientsPerdusCeTour`** en haut du LeftPanel (avant les autres sections) :

```tsx
          {/* Alerte capacité logistique insuffisante */}
          {joueur.clientsPerdusCeTour > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              ⚠️ Capacité logistique insuffisante — {joueur.clientsPerdusCeTour} client(s) perdu(s) ce trimestre
            </div>
          )}
```

- [ ] **Step 4 : Vérifier TypeScript**

```bash
cd /Users/ph/Desktop/jedevienspatron-github/apps/web && npx tsc --noEmit 2>&1
```

Attendu : 0 erreur.

- [ ] **Step 5 : Commit final**

```bash
cd /Users/ph/Desktop/jedevienspatron-github
git add apps/web/app/jeu/hooks/useGameFlow.ts apps/web/app/jeu/page.tsx apps/web/components/jeu/LeftPanel.tsx
git commit -m "feat: integrate MiniDeckPanel and clientsPerdusCeTour alert in LeftPanel"
```
