# Plan B6 — Fin d'exercice (T4/T8/T12 + fin de partie)

**Statut** : proposé le 2026-04-20 après session Phase 4 Belvaux. À valider par Pierre avant implémentation.

**Contexte** : découvert par Pierre pendant la partie Phase 4 : le jeu n'affiche **aucun écran de clôture annuelle** au T4. Or un exercice comptable = 4 trimestres. Il manque IS, réserve légale, affectation du résultat.

**Scope arbitré** (AskUserQuestion 2026-04-20, cf. transcript session) : implémenter maintenant, en même temps que B4 (déjà livré au commit `86d8287`).

---

## 1. Règles métier arbitrées

| Règle | Valeur | Source |
|---|---|---|
| Base IS | Résultat cumulé depuis dernière clôture d'exercice (ou début de partie) = `getResultatNet(joueur)` à l'instant de la clôture | Pierre 2026-04-20 |
| Taux IS | 15% flat — `IS = max(0, résultat_net × 0.15)` arrondi entier | Pierre 2026-04-20 + `tasks/todo.md:296` |
| IS sur perte | 0 (pas de crédit d'impôt) | Pierre 2026-04-20 |
| Traçage IS | charge `compteResultat.charges.impotsTaxes` + décaissement immédiat trésorerie (pas de dette portée) | Pierre 2026-04-20 |
| Réserve légale | 500 € obligatoire tant que capitaux propres < 20 000 € | `tasks/todo.md:296` |
| Dividendes | Choix joueur parmi 0 / 10 / 25 / 50 % de `(résultat_net_après_IS − réserve_légale)` | Pierre 2026-04-20 |
| Affectation solde | `résultat_net_après_IS − réserve − dividendes` → ajouté aux capitaux propres | `tasks/todo.md:297-299` |
| Reset | `compteResultat` ramené à 0 (toutes charges et produits) après affectation | Conséquence comptable |

### Constantes nouvelles à ajouter dans `packages/game-engine/src/types.ts`

```typescript
/** Taux d'impôt sur les sociétés (PME) — simplifié flat 15% */
export const TAUX_IS = 0.15;
/** Montant forfaitaire de la réserve légale, obligatoire par exercice bénéficiaire */
export const RESERVE_LEGALE_MONTANT = 500;
/** Seuil de capitaux propres au-dessus duquel la réserve légale n'est plus obligatoire */
export const RESERVE_LEGALE_SEUIL_CAPITAUX = 20000;
/** Pourcentages de dividendes proposés au joueur à la clôture d'exercice */
export const TAUX_DIVIDENDES_AUTORISES = [0, 0.10, 0.25, 0.50] as const;
```

**Règle `arrondirJeu`** : comme le reste du moteur (cf. commit 597eb29), tous les montants passent par `arrondirJeu()` pour rester entiers en euros.

---

## 2. Déclenchement

**Condition** : `(tourActuel % 4 === 0) || (tourActuel === nbToursMax)`.

**Moment** : APRÈS l'étape `BILAN` (7), AVANT l'incrémentation de `tourActuel` dans `advanceStep` / `advanceTour`.

### Cas par durée de partie

| Durée partie | Clôtures | Dernier exercice |
|---|---|---|
| 6 trim | T4, T6 | T5-T6 (partiel, 2 trim) |
| 8 trim | T4, T8 | complet |
| 10 trim | T4, T8, T10 | T9-T10 (partiel, 2 trim) |
| 12 trim | T4, T8, T12 | complet |

**Pas de double déclenchement** : si `nbToursMax = 8`, à T8 on a à la fois `% 4 === 0` et `=== nbToursMax` — c'est une seule clôture (le `||` se court-circuite sans compter deux fois).

**Helper pur** à ajouter dans `packages/game-engine/src/timing.ts` :

```typescript
export function estFinExercice(tourActuel: number, nbToursMax: number): boolean {
  if (tourActuel < 1 || tourActuel > nbToursMax) return false;
  return (tourActuel % 4 === 0) || (tourActuel === nbToursMax);
}
```

---

## 3. Pipeline de la clôture d'exercice

Fonction pure à ajouter dans `packages/game-engine/src/engine.ts` :

```typescript
export function appliquerClotureExercice(
  etat: EtatJeu,
  joueurIdx: number,
  pctDividendes: number  // 0, 0.10, 0.25, 0.50
): ModificationMoteur[] { ... }
```

**Étapes internes** (ordre critique) :

1. **Calculer IS**
   - `resultatNetBrut = getResultatNet(joueur)`
   - `IS = arrondirJeu(max(0, resultatNetBrut × TAUX_IS))`
   - Ajouter `IS` à `joueur.compteResultat.charges.impotsTaxes`
   - Retirer `IS` de la trésorerie (`appliquerDeltaPoste(joueur, "tresorerie", -IS)`)

2. **Recalculer résultat net après IS**
   - `resultatNetApresIS = getResultatNet(joueur)` (re-lu après modif étape 1)
   - Si `resultatNetApresIS <= 0` : pas de réserve légale ni dividendes, passer direct à l'étape 6

3. **Réserve légale**
   - `capitauxPropres = somme postes passifs catégorie "capitaux"`
   - Si `capitauxPropres < RESERVE_LEGALE_SEUIL_CAPITAUX` ET `resultatNetApresIS > 0`
     - `reserveLegale = min(RESERVE_LEGALE_MONTANT, resultatNetApresIS)`
   - Sinon : `reserveLegale = 0`

4. **Calculer dividendes**
   - `beneficeDistribuable = max(0, resultatNetApresIS − reserveLegale)`
   - `dividendes = arrondirJeu(beneficeDistribuable × pctDividendes)`

5. **Affectation capitaux propres**
   - `montantAffecteCapitaux = resultatNetApresIS − dividendes` (inclut la réserve légale)
   - Ajouter `montantAffecteCapitaux` au poste capitaux propres via `appliquerDeltaPoste(joueur, "capitaux", montantAffecteCapitaux)`
   - Si `dividendes > 0` : retirer `dividendes` de la trésorerie

6. **Reset compteResultat**
   - Toutes les charges (7 postes) et tous les produits (4 postes) ramenés à 0

7. **Vérif équilibre final** (assertion défensive)
   - `verifierEquilibre(joueur)` doit retourner `equilibre: true`
   - Sinon : throw avec message explicite (régression à investiguer, pas à masquer)

### Preuve d'équilibre

Avant clôture : `ACTIF_pré = PASSIF_pré + RÉSULTAT_pré` (équation fondamentale).

Après étapes 1-6 :
- `ACTIF_post = ACTIF_pré − IS − dividendes`
- `PASSIF_post = PASSIF_pré + montantAffecteCapitaux = PASSIF_pré + RÉSULTAT_pré − IS − dividendes`
- `RÉSULTAT_post = 0`

Donc : `ACTIF_post = ACTIF_pré − IS − dividendes = PASSIF_pré + RÉSULTAT_pré − IS − dividendes = PASSIF_post + 0 = PASSIF_post + RÉSULTAT_post` ✓

---

## 4. UI — nouvelle modale `ModalClotureExercice`

**Fichier** : `apps/web/components/jeu/ModalClotureExercice.tsx`.

**Déclenchement** : modale bloquante (comme `OverlayFaillite`), apparaît entre l'étape BILAN (7) et l'avancement du trimestre.

**Props** :
```typescript
interface Props {
  joueur: Joueur;
  numeroExercice: number;       // 1 pour T1-T4, 2 pour T5-T8, etc.
  premierTourExercice: number;  // 1, 5, 9 selon contexte
  dernierTourExercice: number;  // 4, 8, 12, ou le nbToursMax si partiel
  onValider: (pctDividendes: number) => void;
}
```

**Contenu visuel** :

En-tête :
- Icône `Calendar` ou `Landmark` (à choisir — éviter conflit avec clôture trimestrielle qui utilise déjà `Landmark`)
- Titre : `Clôture de l'exercice N°{numeroExercice}`
- Sous-titre : `Trimestres {premier}–{dernier} · {durée} trimestre(s)`

Section "Compte de résultat de l'exercice" :
- Total Produits (ventes, productionStockee, etc.)
- Total Charges (achats, services, personnel, intérêts, dotations, exceptionnelles) — SANS l'IS qui va être ajouté
- **Résultat avant IS** = produits − charges

Section "Impôt sur les sociétés" (calcul affiché) :
- Assiette : résultat avant IS
- Taux : 15 %
- IS à payer : `max(0, assiette × 15%)` arrondi

Section "Réserve légale" :
- Affichée seulement si capitaux propres < 20 000 € ET résultat net après IS > 0
- Montant : 500 € (ou résultat net après IS si < 500)
- Justification pédagogique : "Obligation légale tant que les capitaux propres ne dépassent pas 20 000 €"

Section "Affectation du résultat — choix du dirigeant" (si résultat net après IS > 0) :
- Bénéfice distribuable = résultat net après IS − réserve légale
- **4 boutons** : `0% (tout en réserves)` · `10%` · `25%` · `50%`
- Pour chaque choix, preview des flux : `Dividendes : X €` / `Affecté aux capitaux propres : Y €`
- État sélectionné en amber (cohérent avec D1)

Section "Résultat en perte" (si résultat net après IS <= 0) :
- Message : "L'exercice se solde par une perte. Pas d'IS, pas de dividendes, pas de réserve."
- Affecter la perte aux capitaux propres (report à nouveau débiteur)
- Bouton : `Valider la clôture →`

CTA validation :
- Label : `Valider la clôture · Fermer l'exercice`
- Style : amber cohérent avec les CTA secondaires du jeu
- Déclenche `onValider(pctDividendes)` qui appelle `appliquerClotureExercice` côté hook

**Palette** (cohérente B4) :
- Fond : `bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/60`
- Bordure : `border-amber-500/50`
- Accent : `text-amber-300`
- Cartes internes : `bg-slate-950/60 border border-white/10 text-slate-200`
- Labels : `text-slate-500 uppercase tracking-widest`

### Mount dans `apps/web/app/jeu/page.tsx`

Application stricte de **L54** (un composant exporté n'est pas un composant monté) :

```tsx
{flow.clotureExerciceEnAttente && (
  <ModalClotureExercice
    joueur={joueur}
    numeroExercice={flow.numeroExerciceEnCours}
    premierTourExercice={flow.premierTourExercice}
    dernierTourExercice={etat.tourActuel}
    onValider={flow.validerClotureExercice}
  />
)}
```

### Hook `useGameFlow.ts`

Nouveaux états :
```typescript
clotureExerciceEnAttente: boolean;
validerClotureExercice: (pctDividendes: number) => void;
```

Branchement dans `launchStep` (ou équivalent) : après `ETAPES.BILAN`, avant incrément `tourActuel`, si `estFinExercice(etat.tourActuel, etat.nbToursMax)` → `setClotureExerciceEnAttente(true)`. Le reste du flow attend.

`validerClotureExercice(pct)` → appelle `appliquerClotureExercice` + setClotureExerciceEnAttente(false) + enchaîne incrément tour.

---

## 5. Tests unitaires

Fichier : `packages/game-engine/tests/clotureExercice.test.ts`.

### Cas à couvrir

1. **Bénéfice + capitaux < 20k** : IS = 15%, réserve légale = 500, dividendes 0%
   - Vérif : `compteResultat.charges.impotsTaxes` incrémenté
   - Vérif : tresorerie décaisse IS
   - Vérif : capitauxPropres += résultat_net_après_IS
   - Vérif : compteResultat reset à 0
   - Vérif : équilibre bilan

2. **Bénéfice + capitaux >= 20k** : pas de réserve légale
3. **Bénéfice, dividendes 25%** : dividendes correctement calculés et décaissés
4. **Bénéfice, dividendes 50%** : idem, cas limite
5. **Perte nette** : IS = 0, réserve = 0, dividendes = 0, affectation = résultat_net (négatif) aux capitaux propres
6. **Résultat = 0** : aucun mouvement sauf reset compteResultat
7. **Bénéfice petit (< 500)** : réserve = min(500, résultat_après_IS)
8. **Equilibre bilan** conservé dans tous les cas (ACTIF = PASSIF + 0)

### Test `estFinExercice`
- Matrice : tourActuel × nbToursMax, vérif oracle manuel

---

## 6. Ordre des commits

### Commit B6-A — moteur (types + calculs)
- `packages/game-engine/src/types.ts` :
  - Constantes `TAUX_IS`, `RESERVE_LEGALE_MONTANT`, `RESERVE_LEGALE_SEUIL_CAPITAUX`, `TAUX_DIVIDENDES_AUTORISES`
  - Nouveau champ `Joueur.compteResultatCumulePartie: CompteResultat`
  - Nouveau champ optionnel `Joueur.historiqueExercices?: ExerciceArchive[]`
  - Nouveau type `ExerciceArchive` (numero, tours, résultats, IS, réserve, dividendes, affectation)
  - Nouveaux champs optionnels `EtatJeu.dernierTourClotureExercice?`, `numeroExerciceEnCours?`
  - Bump `SAVE_VERSION`
- `packages/game-engine/src/timing.ts` : `estFinExercice`
- `packages/game-engine/src/engine.ts` :
  - `appliquerClotureExercice(etat, joueurIdx, pctDividendes)` — pipeline 10 étapes
  - Fonction helper interne `cumulerCompteResultat(cumul, trim)` pour étape B
  - Initialisation `compteResultatCumulePartie` dans la fabrique Joueur
- `packages/game-engine/src/save.ts` (ou équivalent) : bump + migration douce
- Tests :
  - `packages/game-engine/tests/clotureExercice.test.ts` — cases du §5
  - `packages/game-engine/tests/timing.test.ts` — matrice `estFinExercice`
  - `packages/game-engine/tests/save-migration.test.ts` — chargement save ancienne
- Rebuild `dist/`, `npm test`, tsc zéro erreur moteur

### Commit B6-B — UI (modales et LeftPanel)
- `apps/web/components/jeu/ModalClotureExercice.tsx` — nouveau (palette dark amber)
- `apps/web/components/jeu/ModalOuvertureExercice.tsx` — nouveau (palette dark cyan, courte)
- `apps/web/components/jeu/LeftPanel.tsx` :
  - Ajout contexte "Exercice N°{X} · T{début}-T{courant}"
  - Ligne "CA total partie" lue depuis `compteResultatCumulePartie`
- `apps/web/app/jeu/hooks/useGameFlow.ts` :
  - États `clotureExerciceEnAttente`, `ouvertureExerciceEnAttente`
  - Setters `validerClotureExercice(pctDividendes)`, `validerOuvertureExercice()`
  - Branchement post-BILAN : détection via `estFinExercice`
  - Enchaînement clôture → ouverture (sauf fin de partie)
- `apps/web/app/jeu/page.tsx` : mount `<ModalClotureExercice>` + `<ModalOuvertureExercice>` (L54 stricte)
- `apps/web/components/jeu/index.ts` : exports
- Vérif : `npx tsc --noEmit` baseline inchangée (152 + 0 nouvelles)

### Commit B6-C — docs
- `tasks/todo.md` : section B6 livrée avec résumés et fichiers touchés
- `tasks/lessons.md` : L58/L59 si nouvelles leçons émergent
- `tasks/plan-b6-fin-exercice.md` : section review avec ce qui a dévié du plan initial

### Commit B6-D — protocole de test
- `tasks/plan-phase4-b6.md` : analogue à `plan-phase4.md`, protocole Belvaux complet T1→T8 (ou 6) avec vérifications clôture T4 (IS, réserve, affectation) et clôture T6 (exercice partiel)

---

## 7. Décisions arbitrées (2026-04-20, AskUserQuestion session)

### A. Modale d'ouverture d'exercice — OUI (courte)
Après validation `ModalClotureExercice`, affichage d'une modale `ModalOuvertureExercice` courte :
- Titre : `Exercice N°{N+1} commence`
- Contenu : capitaux propres au démarrage, CA à zéro (reset), trimestre de départ
- CTA : `Commencer l'exercice →`

**Nouveau composant** : `apps/web/components/jeu/ModalOuvertureExercice.tsx`.

**Nouveau état flow** : `ouvertureExerciceEnAttente: boolean` + `validerOuvertureExercice()` (no-arg, juste ferme la modale et incrémente le tour).

**Séquence post-BILAN à T4/T8/T12/fin** :
1. BILAN affiché
2. `ModalClotureExercice` ouverte → joueur choisit dividendes → validation
3. Moteur applique `appliquerClotureExercice`
4. `ModalOuvertureExercice` ouverte (si ce n'est PAS la fin de partie)
5. Joueur valide → incrément `tourActuel` → étape 0 du nouveau trimestre

Cas fin de partie : on skip ModalOuvertureExercice, on enchaîne `gameover` directement.

### B. Affichage CA — CA exercice + CA total partie
Nouveau champ `Joueur.compteResultatCumulePartie: CompteResultat` initialisé à zéro, cumulé dans `appliquerClotureExercice` juste avant le reset (addition poste à poste).

**LeftPanel** (`apps/web/components/jeu/LeftPanel.tsx`) :
- Section "Exercice en cours" : lignes existantes (lues depuis `joueur.compteResultat`)
- Nouvelle ligne ou tooltip : "CA total partie : {X} €" (lu depuis `joueur.compteResultatCumulePartie.produits.ventes`)
- Contexte exercice : "Exercice N°{X} · T{debut}-T{courant}"

### C. SAVE_VERSION — bump + migration douce
**Bump** : SAVE_VERSION passe à la valeur suivante (à identifier dans le code).

**Nouveaux champs persistés** :
- `Joueur.compteResultatCumulePartie: CompteResultat` (défaut : tous zéro)
- `Joueur.historiqueExercices?: Array<{ numero, tourDebut, tourFin, resultatAvantIS, IS, reserveLegale, dividendes, affectationCapitaux }>` (optionnel, default [])
- `EtatJeu.dernierTourClotureExercice?: number` (optionnel, défaut 0)
- `EtatJeu.numeroExerciceEnCours?: number` (optionnel, défaut 1)

**Migration douce** : lors du chargement d'une save ancienne, les champs optionnels absents sont initialisés à leurs défauts. Les parties déjà commencées ne plantent pas mais n'auront pas l'historique des exercices passés (acceptable : Pierre abandonne la partie Belvaux actuelle, cf. décision E).

### D. Parties 6 trim — déclenchement T4 + T6
Confirmé : condition `(tourActuel % 4 === 0) || (tourActuel === nbToursMax)`. Pas d'ambiguïté, double clôture impossible par design.

### E. Partie Belvaux T6/6 actuelle — ABANDONNÉE
Pierre abandonne la partie en cours après le déploiement de B6. Il en relance une nouvelle pour valider le cycle complet T1→T6 avec clôtures à T4 et T6.

### F. Affichage perte dans "Affectation" (ex-point E)
Si `resultatNetApresIS <= 0` : pas de choix dividendes. Affecter la perte directement aux capitaux propres. L'UI bascule sur un mode "perte" :
- Message : "Exercice en perte · pas d'IS, pas de réserve, pas de dividendes"
- Affichage du montant de la perte affectée aux capitaux propres (report à nouveau débiteur)
- Un seul bouton : `Valider et ouvrir l'exercice suivant →`

---

## 8. Déploiement

Après B6-C pushé, Pierre doit rejouer une partie complète (ou au moins 4 trimestres) pour valider :
- Clôture T4 se déclenche
- Modale affiche les bons chiffres (IS, réserve, dividendes proposés)
- Choix dividendes 0/10/25/50% produit bien les 3 flux (IS décaissé, dividendes décaissés, capitaux propres augmentés)
- Après validation : compteResultat remis à 0, T5 démarre propre
- Bilan reste équilibré

Protocole détaillé à rédiger après validation du plan (plan-phase4-b6.md analogue à plan-phase4.md).

---

## Références sources

- `packages/game-engine/src/types.ts:219-255` — interface Joueur
- `packages/game-engine/src/types.ts:286-295` — constantes ETAPES
- `packages/game-engine/src/types.ts:297-327` — interface EtatJeu
- `packages/game-engine/src/calculators.ts:83-88` — `getResultatNet`
- `packages/game-engine/src/calculators.ts:122-124` — lecture capitaux propres
- `packages/game-engine/src/engine.ts:134-150` — `appliquerDeltaPoste`
- `packages/game-engine/src/engine.ts:860-898` — `appliquerClotureTrimestre`
- `packages/game-engine/src/timing.ts:54-71` — `determinerSlotsActifs`
- `apps/web/app/jeu/hooks/useGameFlow.ts:464-496` — étape VENTES (clientsPerdus)
- `apps/web/components/jeu/LeftPanel.tsx:549-554` — bandeau "Capacité insuffisante" (B5)
- `apps/web/app/jeu/page.tsx` — mount des overlays existants (OverlayFaillite, ModalEtape, DefiDirigeantScreen)
- `tasks/todo.md:293-320` — spec tâche 24 Vague 4 variante cloture
- `tasks/lessons.md` L53, L54, L55 — pièges déjà documentés
