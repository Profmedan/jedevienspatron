# Tâches JE DEVIENS PATRON — mis à jour 2026-04-24

---

## Tâche B9 : Refonte métier polymorphe — étape 3 visible + 4 modes distincts — 2026-04-24 🚧 (A fait, B9-C suivant)

### Contexte

Suite de B8 palier 1 (2026-04-21), qui a installé 3 modes (`negoce` / `production` / `service`), `FluxClientsEntreprise`, `clientsPassifsParTour` et un switch 3 branches dans `appliquerCarteClient`. B9 reprend l'ambition de la session B9-attempt-1 (archivée sous `archive/b9-attempt-1-2026-04-23`) en la construisant proprement par-dessus B8 cette fois.

**Objectif pédagogique** : les 4 entreprises doivent être **réellement différentes** en jeu — pas seulement via des libellés, mais via des écritures comptables qui reflètent leur cœur métier. En particulier, une étape 3 visible « Réalisation métier » matérialise la création de valeur spécifique à chaque modèle économique.

### Décisions validées (2026-04-24)

**1B — 4 modes distincts** (`negoce` / `production` / `logistique` / `conseil`)
Split du mode `service` en `logistique` (Véloce) et `conseil` (Synergia) pour permettre des écritures moteur différentes (Synergia aura ses en-cours mission + licences récurrentes, Véloce ses en-cours tournée + coût chauffeur).

**2A — 8 étapes avec fusion CLOTURE_BILAN** (pas de passage à 9 étapes)
Insertion de REALISATION_METIER en position 3 via décalage de VENTES/DECISION/EVENEMENT de +1 et fusion des ex-CLOTURE_TRIMESTRE + BILAN en un seul `CLOTURE_BILAN` (index 7). Le moteur garde 2 passes séquentielles sous l'index 7 ; l'UI présente une seule étape.

**3B — Dispatchs moteur par mode, `ModeleValeurEntreprise` inchangé pour les libellés**
`ModeleValeurEntreprise` (B8) garde ses champs texte (`ceQueJeVends`, `libelleExecution`, etc.). Les paramètres métier (coût canal Azura 300€, matière/finis Belvaux, en-cours services) sont ajoutés en propriétés séparées sur `EntrepriseTemplate` et lus par des fonctions dédiées (`appliquerRealisationBelvaux`, `appliquerRealisationAzura`, etc.).

**Garde-fou entre B9-A et B9-C** : après migration structurelle (B9-A), faire passer `npx tsc --noEmit` (engine + web) + smoke test scripté sur cycle /8 avec étape 3 placeholder avant d'injecter la polymorphie. Permet d'isoler les régressions de structure des régressions de sémantique métier.

### B9-A.1 — Spec d'écritures cibles (par étape polymorphe × par mode)

**Nouveau cycle 8 étapes** (après B9-A) :

| Index | Constante | Rôle |
|---|---|---|
| 0 | `ENCAISSEMENTS_CREANCES` | Avancement créances — inchangé |
| 1 | `COMMERCIAUX` | Paiement + génération clients — inchangé |
| 2 | `ACHATS_STOCK` | Achats de marchandises — inchangé (polymorphie éventuelle B9-C) |
| 3 | `REALISATION_METIER` | **NEW** — Acte métier polymorphe (B9-D) |
| 4 | `FACTURATION_VENTES` | ex-VENTES — décalé ; polymorphie étendue B9-E |
| 5 | `DECISION` | ex-4 — décalé |
| 6 | `EVENEMENT` | ex-5 — décalé |
| 7 | `CLOTURE_BILAN` | **Fusion** ex-CLOTURE_TRIMESTRE + ex-BILAN (2 passes moteur) |

**4 modes** : `negoce` (Azura), `production` (Belvaux), `logistique` (Véloce), `conseil` (Synergia).

**Écritures cibles par étape × par mode** :

| Étape | Mode | Écritures |
|---|---|---|
| 2 ACHATS_STOCK | tous | D `stocks` / C `tresorerie` ou `dettes` (B8, inchangé) |
| 3 REALISATION_METIER | `negoce` | D `servicesExterieurs` +300 € (canal) / C `tresorerie` −300 € ou `dettes` +300 € |
| 3 REALISATION_METIER | `production` | D `stocks` (produits finis) + `coutVariable` / C `productionStockee` + `coutVariable` ; consommation implicite de matière via `stocks` initial (B9-D V1) |
| 3 REALISATION_METIER | `logistique` | D `stocks` (en-cours tournée) + `coutVariable` / C `dettes` + `coutVariable` (heures chauffeur à payer) |
| 3 REALISATION_METIER | `conseil` | D `stocks` (en-cours mission) + `coutVariable` / C `dettes` + `coutVariable` (honoraires consultants) |
| 4 FACTURATION_VENTES | `negoce` | D `stocks` − `coutVariable` / C `achats` + `coutVariable` (CMV, B8) + D `ventes` / C `tresorerie` ou créances |
| 4 FACTURATION_VENTES | `production` | D `productionStockee` − `coutVariable` / C `stocks` (produits finis) − `coutVariable` (extourne) + vente |
| 4 FACTURATION_VENTES | `logistique` | D `productionStockee` − `coutVariable` / C `stocks` (en-cours tournée) − `coutVariable` (extourne) + vente |
| 4 FACTURATION_VENTES | `conseil` | D `productionStockee` − `coutVariable` / C `stocks` (en-cours mission) − `coutVariable` (extourne) + vente |

**Constantes de référence** :
- `PRIX_UNITAIRE_MARCHANDISE = 1000` (inchangé)
- `COUT_CANAL_AZURA_PAR_TOUR = 300` (nouveau, étape 3 Azura)
- `CHARGES_FIXES_PAR_TOUR = 2000` (inchangé, clôture)
- `coutVariable` par entreprise lu depuis `modeleValeur.coutVariable` (B8, déjà à 1000 pour les 4)

**Invariants à préserver** :
- Partie double stricte : Σ débits = Σ crédits par écriture (vérification à chaque application)
- Bilan équilibré Actif = Passif après chaque étape complète
- Modes B8 existants (`negoce`/`production`/`service`) migrent vers B9 sans perte :
  - `negoce` → `negoce`
  - `production` → `production`
  - `service` → `logistique` (Véloce) ou `conseil` (Synergia) selon `nom` entreprise
- Tests B8 conservés (199/199 avant B9 → 199/199 après B9-A, étendu progressivement en B9-D/E)
- `clientsPassifsParTour` conservé (champ B8 toujours actif)

### Plan d'implémentation

**Ordre de travail** (un commit par jalon, Pierre push après chaque) :

1. **B9-A.1** — ce doc (spec écritures, pas de code) ✅ commit `e0dc3cf`
2. **B9-A** — structure ✅ commit `b4c41b0` (2026-04-24)
   - `types.ts` : renumérotation `EtapeTour`, renommage `ETAPES.VENTES → FACTURATION_VENTES`, ajout `REALISATION_METIER = 3`, fusion `CLOTURE_TRIMESTRE + BILAN → CLOTURE_BILAN`, literal `"logistique"` et `"conseil"` ajoutés au type `SecteurActivite` et `ModeleValeurEntreprise.mode`, constante `COUT_CANAL_AZURA_PAR_TOUR = 300`
   - `entreprises.ts` : Véloce → `logistique`, Synergia → `conseil`
   - `engine.ts` : placeholder `appliquerRealisationMetier`, `MODELE_DEFAUT_PAR_SECTEUR` étendu, switchs `appliquerAchatMarchandises` et `appliquerCarteClient` étendus aux 3 modes service-like, `avancerEtape` → `CLOTURE_BILAN`
   - `index.ts` : export `appliquerRealisationMetier`
   - tests moteur adaptés (cycle-shape + engine) — 199/199
   - UI : `useGameFlow`, `useGamePersistence (SAVE_VERSION 3→4)`, `LeftPanel` (STEP_NAMES + STEP_HELP 8), `ModalEtape` (ETAPE_CONFIG 8 + icône Wrench), `gameFlowUtils` (ETAPE_INFO 8), `pedagogie.ts` (MODALES_ETAPES 8), `CompanyIntro` (MODE_LABEL 5 + pitch 3 modes), `EntryPanel`, `CompteResultatPanel`, `pedagogicalMessages` (renommages)
3. **🛡️ Garde-fou B9-A** ✅ 2026-04-24
   - `npx tsc --noEmit` game-engine : EXIT=0
   - `npx tsc --noEmit` apps/web : seules erreurs TS2786 pré-existantes (React 18/19 VM), aucune régression B9-A
   - Rebuild `dist/` OK
   - Tests moteur : 199/199 passent
   - Smoke test `/tmp/smoke-b9a.mjs` : cycle 0→1→2→3→4→5→6→7 traverse sans erreur, placeholder REALISATION_METIER conforme
4. **B9-C** — polymorphie étape 2 🚧 en cours (2026-04-24)
   - **Arbitrages tranchés** : cf. `tasks/b9-c-arbitrages.md` (commit `3d65dc7`).
     - Belvaux : appro matières premières (B8) — ciblage par nom de ligne
     - Azura : réassort marchandises (B8) — ciblage par nom de ligne
     - Véloce : coût d'approche tournée **300 € / trim** (nouveau)
     - Synergia : staffing mission **400 € / trim** (nouveau)
   - **Plan d'implémentation** :
     1. `types.ts` : 2 constantes `COUT_APPROCHE_VELOCE_PAR_TOUR=300`, `COUT_STAFFING_SYNERGIA_PAR_TOUR=400`
     2. `engine.ts` : créer `appliquerApprovisionnementVeloce(etat, nomJoueur)` et `appliquerApprovisionnementSynergia(etat, nomJoueur)` (dispatchers par entreprise, cohérent avec B9-D). Écritures : `Services extérieurs +` ou `Sous-traitance +` / `Dettes fournisseurs +`. Pas de paramètre quantité.
     3. `engine.ts` : dans `appliquerAchatMarchandises`, garde-fou de ciblage — écrire dans la ligne stock par **nom** (`Stocks matières premières` Belvaux, `Stocks marchandises` Azura), pas par position.
     4. `index.ts` : exports des 2 nouvelles fonctions.
     5. `LeftPanel.tsx` : étape 2 polymorphe sur `modeleValeur.mode` :
        - `negoce` / `production` → input quantité existant (inchangé)
        - `logistique` → bouton `Préparer la tournée (−300 €)` qui déclenche `onLaunchPreparation`
        - `conseil` → bouton `Staffer la mission (−400 €)` qui déclenche `onLaunchStaffing`
        - `service` legacy → bouton Passer (fallback)
     6. `useGameFlow.ts` : ajouter handlers `onLaunchPreparation` et `onLaunchStaffing` qui appellent les fonctions moteur et génèrent un `activeStep`.
     7. Tests moteur : 4 nouveaux tests (Véloce 300 €, Synergia 400 €, Belvaux stock MP par nom, Azura stock Mdse par nom).
   - **🛡️ Garde-fou B9-C** :
     - tsc engine + apps/web (hors TS2786 pré-existants)
     - Tests moteur 199/199 + 4 nouveaux
     - Rebuild dist
     - Smoke test étape 2 par mode : 4 parties × 8 étapes, vérif bilan équilibré à chaque étape
5. **B9-D** — polymorphie étape 3 `appliquerRealisationMetier` : 4 fonctions dédiées par mode, avec les écritures spécifiées plus haut ; ajout du helper `pushByName` pour cibler des lignes de stock précises (matière première vs produits finis vs en-cours)
5. **B9-D** — polymorphie étape 3 `appliquerRealisationMetier` : 4 fonctions dédiées par mode, avec les écritures spécifiées plus haut ; ajout du helper `pushByName` pour cibler des lignes de stock précises (matière première vs produits finis vs en-cours)
6. **B9-E** — extension du switch `appliquerCarteClient` avec les 4 branches (3 modes B8 → 4 modes B9) et les extournes (production/logistique/conseil)
7. **B9-F** — tests bout-en-bout 4 entreprises + régression B8 + test de couverture polymorphie
8. **B9-G** — UI pitch : enrichir `CompanyIntro` (B8-E déjà amorcé) et `LeftPanel` pour différencier Véloce de Synergia, ajouter explications étape 3

### Critères de succès (definition of done)

- Un joueur lance une partie Belvaux : il voit à l'étape 3 « Réalisation métier — production des produits finis » avec des écritures visibles (+productionStockée, +stocks produits finis). À l'étape 4, les mêmes écritures sont extournées contre la vente.
- Un joueur lance une partie Véloce : étape 3 affiche « Préparation/exécution de la tournée » avec coût chauffeur + en-cours. Étape 4 extourne l'en-cours.
- Un joueur lance une partie Synergia : étape 3 affiche « Réalisation de la mission » avec honoraires consultants + en-cours. Étape 4 extourne l'en-cours. Licences récurrentes en clôture (déjà via `effetsPassifs`).
- Un joueur lance une partie Azura : étape 3 affiche « Coût du canal (300 €) ». Étape 4 reste sur modèle CMV B8.
- Les 4 entreprises ont un bilan équilibré à chaque étape.
- Tests moteur 199/199 (ou +) — aucune régression B7/B8.
- `npx tsc --noEmit` engine + web → EXIT=0.

### Matériel de référence

- Branche archive `archive/b9-attempt-1-2026-04-23` : contient la tentative précédente de B9, utile comme source d'inspiration pour les helpers (`pushByName`, `mutateActifByName`) et les libellés pédagogiques. Pas à merger — à lire.
- Leçons : L-T25R-1..5 et L-COMM-1..2 dans `tasks/lessons.md` (session B9-attempt-1).

---

## Tâche B8 : Palier 1 moteurs métier — fusion codex + main — 2026-04-21 🚧

### Déclencheur
Après test-play post-B7, Pierre a diagnostiqué que le moteur confond **demande / capacité / réalisation de valeur** : les 4 entreprises restent cosmétiques autour d'un cycle unique « commerciaux → clients → stock 1000 € ». Les services (Véloce, Synergia) sortent à marge brute 100 % faute de coût variable, ce qui fausse la pédagogie.

### Comparaison avec le repo `jedevienspatron-codex` (Tâche 23, déjà implémentée là-bas)
Le codex a déjà introduit `ModeleValeurEntreprise` + `FluxClientsEntreprise` + branchement stock/service dans `appliquerCarteClient`. Mais il ne contient pas les améliorations main : T25 (capital +2 k), structure 8 étapes, fin d'exercice B6, fixes B7-A/B/C/D.

**Décision Pierre 2026-04-21 :** fusion « meilleur des 2 ».

### Trois arbitrages clés tranchés par Pierre
| # | Question | Décision |
|---|---|---|
| 1 | Comptabilité vente **Production** (Belvaux) | **Option A** — `stocks − / productionStockee −` (PCG industriel juste). Pas de CMV via achats. |
| 2 | Noms d'immos (Machine de production / Plateforme de dispatch / e-commerce / logicielle) | **Oui**, avec capacité inchangée (le matching `CAPACITE_IMMOBILISATION` est par id de carte, pas par nom d'immo — donc migration transparente). |
| 3 | Carnet de commandes T1 (`clientsDeDepart`) | **Non réactivé** — champ et helper gardés dans le code, mais tableaux vides dans `entreprises.ts` et fallback vide dans `creerJoueur`. Évite de regonfler le T1 artificiellement. |

### Ce qu'on prend de codex
- Types `ModeleValeurEntreprise` (étendu à 3 modes) + `FluxClientsEntreprise`.
- Helpers `getModeleValeurEntreprise` (avec fallback safe) + `genererClientsDepuisFlux`.
- Réécriture `appliquerCarteClient` avec switch à 3 modes.
- `clientsPassifsParTour` (demande récurrente hors commerciaux) sur Azura / Véloce / Synergia — **pas Belvaux** (Belvaux a déjà sa spécialité +1000 productionStockee/stocks, pas besoin de demande passive).
- Noms d'immos pédagogiques + libellés d'écriture personnalisés par entreprise.

### Ce qu'on conserve de main
- Bilans 30/30/30/27 (T25 vérifiée).
- Structure 8 étapes (T25.C).
- Fin d'exercice B6 (IS + réserve + dividendes).
- Fixes B7-A (anti-doublon), B7-B (Annuler), B7-C (bilan équilibré si perte > capitaux), B7-D (glossaire report à nouveau).
- Les 148/148 tests moteur existants.

### Sous-tâches
| # | Contenu | Statut |
|---|---|---|
| **B8-A** | types.ts — `ModeleValeurEntreprise` (3 modes), `FluxClientsEntreprise`, champs optionnels sur `EntrepriseTemplate` + `Joueur.entreprise`. | ✅ |
| **B8-B** | engine.ts — helpers + `appliquerCarteClient` switch 3 branches + `genererClientsSpecialite` lit `clientsPassifsParTour` + `creerJoueur` expose `modeleValeur` + fallback `clientsATrait = []`. | 🟡 _Partiel_ : switch 3 modes dans `appliquerCarteClient` + service bloque `appliquerAchatMarchandises` + propagation `secteurActivite` / `capaciteBase` dans `creerJoueur`. Reste : helpers `getModeleValeurEntreprise` / `genererClientsDepuisFlux` + lecture de `clientsPassifsParTour` dans `genererClientsSpecialite`. |
| **B8-C** | data/entreprises.ts — peupler `modeleValeur` + `clientsPassifsParTour` + renommer 2e immos (bilans inchangés). | 🟡 _Partiel_ : `secteurActivite` ajouté sur les 4 (production / service / negoce / service). Reste : `modeleValeur`, `clientsPassifsParTour`, rename immos. Les bilans main (30/30/30/27) ont été restaurés pour préserver T25. |
| **B8-D** | Tests moteur — adapter les 2 tests vendreImmobilisation ("Camionnette" → "Machine de production") + 1 test par mode. | ✅ _2026-04-21_ : 5 refs "Camionnette" dans `vendreImmobilisation` renommées en "Machine de production". `creerJoueur` et `calculerCoutCommerciaux` ré-exportés (dette depuis `d8571b4` refermée). 3 tests par mode pour `appliquerCarteClient` (négoce / production / service). Test régression "marge brute service < 100 %". 6 tests pour `clientsPassifsParTour` (mapping + câblage via `genererClientsSpecialite` pour Azura / Véloce / Synergia ; absence pour Belvaux). Adaptations : tests "4 écritures" passés à Azura (négoce) pour préserver la sémantique CMV ; tests commerciaux mis à jour (coût Junior = 1 000 €, nbClients = 2). **199 / 199 tests verts.** |
| **B8-E** | UI CompanyIntro — ajouter les 4 nouveaux noms dans `IMMO_DESCRIPTIONS`, afficher `modeleValeur.ceQueJeVends` / `dOuVientLaValeur` / `goulotPrincipal`. Bandeau "pas besoin d'acheter" pour mode service dans `LeftPanel` étape Achats. | 🟡 _Partiel_ : bandeau service ajouté dans `LeftPanel`. Reste : `IMMO_DESCRIPTIONS` (dépend du rename immos en B8-C) + pitch métier dans CompanyIntro. |
| **B8-F** | Vérif finale : `npx tsc --noEmit`, `npm test`, rebuild dist/, update lessons.md, commit signé Pierre. | ✅ _2026-04-21_ : `tsc` vert sur `packages/game-engine/src`. `jest --runInBand` → **199 / 199**. Dist reconstruit. 2 régressions TS non-TS2786 corrigées dans `apps/web` (secteurActivite manquant dans `EntrepriseBuilder.tsx` et `useGamePersistence.ts`) — conséquences directes de B8-A passées inaperçues à cause de `ignoreBuildErrors: true`. Cf. L-B8-F. Commit prêt (signé Pierre, push depuis le Mac). |

#### Fixes collatéraux B8-A
- **productionStockee peut être négatif** (PCG : variation nette des produits finis). Plancher 0 supprimé spécifiquement pour ce poste dans `appliquerDeltaPoste` (les autres produits gardent le plancher). Cela débloque la vente en mode production (Belvaux) sans casser `ventes`, `produitsFinanciers`, `revenusExceptionnels`.
- **`appliquerCarteClient` 3 branches** : négoce (`stocks − / achats +`), production (`stocks − / productionStockee −`, Option A), service (no-op sur le stock/achats, marge brute 100 % tant que B8-B n'implémente pas `servicesExterieurs + / dettes +`).
- **T25 préservé** : Véloce et Synergia conservent Stocks 4 000 € / Tréso 10 000 € (buffer de consommables non consommé par le cycle). Le test `tache25.test.ts` reste vert.

#### Résultats B8-A
- `npx tsc --noEmit` → exit 0.
- `npm test --runInBand` → **148 / 148 tests passent**. Seule `engine.test.ts` échoue à la compilation, mais il s'agit de la dette de typage pré-existante depuis le commit `d8571b4` (`creerJoueur` retiré de l'API publique — documenté dans `tache25.test.ts` ligne 18). Hors scope B8-A, sera traité en B8-D.

### Impacts identifiés (grep "Camionnette|Voiture|Machine|Matériel informatique")
- `apps/web/components/jeu/CompanyIntro.tsx` — registre `IMMO_DESCRIPTIONS` à étendre.
- `packages/game-engine/tests/engine.test.ts` — 2 tests `vendreImmobilisation("Camionnette"…)` à migrer vers "Machine de production".
- `packages/game-engine/src/data/cartes.ts` — mention "Camionnette" dans la description de la **carte Décision** id `camionnette` → **ne pas toucher** (c'est la carte d'investissement, distincte de l'immo de départ de Belvaux).

### Ce qu'on ne fait PAS dans ce palier
- Réécriture du pipeline en étapes métier séparées.
- Modification de la mécanique de capacité logistique (décision Pierre : « on pourra refondre plus tard la notion de capacité logistique en capacité opérationnelle, mais pas dans ce merge »).
- Réactivation des 2 clients de départ par entreprise.

---

## Tâche 25 : Rééquilibrage de la courbe de difficulté (T1 respirable) — 2026-04-18 🚧

### Déclencheur
Pierre a lui-même fait faillite au T6 dans une partie test. Constat : la charge fixe du T1 (≈ 2 000 €) + le premier intérêt d'emprunt consomment immédiatement le coussin initial et forcent un emprunt dès T2, cassant le contrat pédagogique "le T1 est une prise de contact".

### Ajustements approuvés le 2026-04-18
| Sous-tâche | Contenu | Statut |
|---|---|---|
| **T25.A** | +2 000 € de trésorerie initiale ET +2 000 € de capitaux propres sur les 4 entreprises (bilans restent équilibrés : Belvaux/Véloce/Azura = 30 k, Synergia = 27 k). | ✅ |
| **T25.B** | Intérêts d'emprunt décalés : pas d'intérêts à T1/T2, première facturation annuelle à T3, puis T7, T11… Le remboursement du capital (-500 €/trim.) reste inchangé dès T1. | ✅ |
| **T25.C** | Réordonner les 9 étapes en 8 étapes ("activité puis clôture" au lieu de "payer d'abord"). | 🟢 **Commits 0→3 livrés (2026-04-20)**. Cycle 9→8 étapes effectif (code + modales + slots + `SAVE_VERSION` 1→2). QCM neutralisés avec warning interne en attendant Commit 4. Reste : partie manuelle Phase 4 (Belvaux T1-T3 + smoke Synergia T1) → Commit 4 (refonte QCM). |
| **T25.D** | Tests unitaires : trésorerie T1 = 10 000 €, capitaux 22 000/19 000, équilibre bilan, cadence intérêts T1/T2/T3/T4/T7, remboursement capital intact. | ✅ (12 tests passent) |
| **T25.E** | Vérification + docs (tsc, rebuild dist/, todo.md, lessons.md). | 🚧 |

### Fichiers modifiés dans ce lot (T25.A + T25.B uniquement)
- `packages/game-engine/src/data/entreprises.ts` — Trésorerie 8 000 → 10 000 (×4), Capitaux propres 20 000 → 22 000 (×3) et 17 000 → 19 000 (Synergia). En-têtes de fichier mis à jour.
- `packages/game-engine/src/engine.ts` — Étape 0 : calcul des intérêts gated sur `tourActuel >= 3 && (tourActuel - 3) % 4 === 0`. Remboursement du capital laissé inchangé (toujours -500 € dès T1).
- `packages/game-engine/tests/tache25.test.ts` — **Nouveau fichier**, 12 tests, utilise uniquement l'API publique (`initialiserJeu`, `appliquerEtape0`, `getTresorerie`, `getTotalActif/Passif`, `getResultatNet`, `ENTREPRISES`).
- `packages/game-engine/tests/engine.test.ts` — Mises à jour de valeurs attendues (total actif 28 000 → 30 000 ; trésorerie après étape 0 ajustée ; cessions 18 000 → 20 000 et 13 000 → 15 000).
- `packages/game-engine/tests/defis.test.ts` — Mise à jour du motif de trésorerie attendu ("8" → "10") sur Belvaux au T1.

### Pourquoi un fichier de tests dédié
La suite `engine.test.ts` est cassée en compilation depuis le commit d8571b4 ("nettoyer l'API publique du package") — `creerJoueur` et `calculerCoutCommerciaux` n'y sont plus exportés. La réparer dépasse le scope de Tâche 25 (dette de typage indépendante). Un fichier dédié à l'API publique évite ce champ de mines tout en garantissant une couverture suffisante.

### Pourquoi T25.C est reporté
L'inventaire du code a révélé que réordonner les étapes impacte :
1. Deux copies du moteur (`packages/game-engine/src/engine.ts` + `apps/web/lib/game-engine/` — legacy encore utilisé par l'app).
2. ~170 lignes de contenu pédagogique indexées par numéro d'étape : `MODALES_ETAPES` (9 entrées) et `QCM_ETAPES` (10 entrées) qu'il faut **re-mapper sémantiquement**, pas juste renuméroter.
3. Les slots dramaturgiques de Tâche 24 (`debut_tour`, `avant_decision`, etc.) attachés au pipeline actuel.

Règle appliquée : **"If something goes sideways, STOP and re-plan immediately"**. Un plan dédié à T25.C sera rédigé avant exécution.

### Commits T25.C livrés
| # | SHA | Message | Notes |
|---|---|---|---|
| 0 | `b630856` | `test(engine): caractériser le cycle actuel avant refonte` | 20 tests "shape" du cycle 9-étapes qui ont servi de filet de sécurité. Après Commit 3, la parité est garantie par le test `appliquerClotureTrimestre === appliquerEtape0 + appliquerEffetsRecurrents + spécialité`. |
| 1 | `e276aef` + `a72aedd` | `refactor(web): déplacer le contenu pédagogique hors du legacy engine` puis `chore(engine): supprimer la copie legacy du moteur` | Contenu pédago migré vers `apps/web/lib/pedagogie/pedagogie.ts`. 5 fichiers legacy supprimés (`apps/web/lib/game-engine/`). Zéro consommateur restant. |
| 2 | `e78cc48` | `refactor: nommer explicitement les étapes du cycle (pas de changement de valeur)` | `ETAPES.*` renommés (`CHARGES_FIXES`, `ACHATS`, `COMMERCIAUX`, `VENTES`, `EFFETS_RECURRENTS`, `INVESTISSEMENT`, `EVENEMENT`, `BILAN`). Littéraux `=== N` remplacés par `=== ETAPES.X`. Valeurs inchangées. |
| 3 | _à créer_ | `feat(engine): Tâche 25.C — réordonnancement 9→8 étapes (activité puis clôture)` | Valeurs `ETAPES.*` réassignées : `ENCAISSEMENTS_CREANCES:0`, `COMMERCIAUX:1`, `ACHATS_STOCK:2`, `VENTES:3`, `DECISION:4`, `EVENEMENT:5`, `CLOTURE_TRIMESTRE:6`, `BILAN:7`. `appliquerClotureTrimestre()` créée (fusion charges fixes + effets récurrents + spécialité). 8 modales figées (`MODALES_ETAPES` 0→7). QCM neutralisés (warning interne). Slots dramaturgiques remappés. `HeaderJeu.tsx` + `LeftPanel.tsx` `/9 → /8`. `SAVE_VERSION` 1→2. |

### Vérification Commit 3
- `npx tsc --noEmit` (game-engine) : ✅ aucune erreur
- `npm run build` game-engine : ✅ dist/ régénéré
- `npx jest` (full) : ✅ 116/116 tests passent sur 6 suites — la suite `engine.test.ts` reste cassée en compilation (dette d8571b4, hors scope T25.C)
- `cycle-shape.test.ts` : ✅ 20/20 (inclus le test de parité `appliquerClotureTrimestre`)
- `npx tsc --noEmit` (apps/web) : ✅ 152 erreurs, strictement identique au baseline pré-T25.C — **aucune régression introduite**
- `SAVE_VERSION 1→2` : les saves localStorage de l'ancien cycle 9-étapes sont rejetées au chargement → apprenants repartent proprement sur le nouveau cycle

### Reste à faire
- **Phase 4** : partie manuelle Belvaux T1-T3 + smoke Synergia T1 (cadré dans `tasks/plan-t25c.md` §7 prérequis)
- **Commit 4** (session ultérieure) : refonte complète des ~50 questions QCM_ETAPES pour le nouveau cycle, après Phase 4 validée

---

## Tâche 24 : Défis du dirigeant X — couche d'orchestration de partie — 2026-04-18 🚧

### Statut
Couche d'orchestration **centrale** (pas une feature secondaire). Architecture arrêtée le 2026-04-18. 4 points bloquants tranchés. Vague 1 prête à démarrer.

### Contexte
Le cycle de 9 étapes (vérifié `packages/game-engine/src/engine.ts:313`, `apps/web/app/jeu/hooks/gameFlowUtils.ts:33-90`) est strictement identique à chaque trimestre. Dès T3, l'apprenant a vu tout le cycle deux fois → risque de lassitude confirmé.

Stratégie retenue : **couche d'orchestration** "Défi du dirigeant [Pseudo]" qui introduit dramaturgie et rupture de rythme, via des slots dramaturgiques attachés au pipeline existant.

### Framework (6 éléments par défi)
1. Contexte narratif (personnalisé via `formatContexte`)
2. Choix (1 à 3 options)
3. Conséquence immédiate
4. Conséquence différée (obligatoire pour ≥ 50% des défis)
5. Concept comptable ciblé (débrief pédagogique)
6. Résolution en fin de trimestre ou d'exercice

### Slots dramaturgiques — un défi s'attache à un slot explicite

**Règle fondamentale** : on ne force pas tous les défis au même endroit du pipeline. Un défi BFR n'a pas le même moment naturel qu'une clôture ou qu'un départ de commercial.

| Slot | Rôle | Défis attendus |
|---|---|---|
| `debut_tour` | Météo, arc différé, tension annoncée | Événements externes, retours de conséquences différées |
| `apres_ventes` | Capacité, stock, BFR, clients perdus | Défis flux opérationnel |
| `avant_decision` | Arbitrage de dirigeant | Paliers stratégiques, choix structurants |
| `avant_bilan` | Conséquence immédiate, défi court | Défis secondaires rapides |
| `fin_exercice` | Clôture, IS, affectation | Clôture obligatoire |
| `finale` | Palier irréversible, sortie | Dernier palier stratégique |

### Timing dramaturgique
- **T1-T2** : apprentissage actif (défis d'observation, sans sanction)
- **T3** : « Le marché me résiste » — premier défi GARANTI
- **Tour "juge"** : slot `fin_exercice` déclenché (clôture obligatoire)
- **Tour "revient"** : slot `debut_tour` déclenche une résolution différée
- **Finale** : slot `finale` déclenche un palier irréversible

### Matrice timing × durée

| Durée | T1-T2 | Résiste | Juge | Revient | 2e palier | Finale |
|---|---|---|---|---|---|---|
| 6 | Observation | T3 | T4 | T5 | — | T6 |
| 8 | Observation | T3 | T5 | T6-T7 | — | T8 |
| 10 | Observation | T3 | T5 | T6 | T8 | T10 |
| 12 | Observation | T3 | T4 + T8 | T5 + T9 | — | T12 |

### 4 points bloquants tranchés (2026-04-18)

1. **Finale vs étape 8** : la finale (slot `finale`) s'intercale **avant** l'étape 8 Bilan. Elle ne la remplace jamais. L'étape 8 reste la vérité comptable finale qui calcule le score.
2. **Défis conditionnels (archétype 7)** : coexistent avec le défi obligatoire. Règle dure = **maximum 1 défi majeur + 1 alerte conditionnelle courte par trimestre**.
3. **Dette IS** : portée par le poste `dettesFiscales` existant. Pas de nouveau poste en V1 — simplicité d'abord, extension plus tard si la pédagogie l'exige.
4. **Personnalisation narrative** : fonction `formatContexte(defi, joueur, etat)` — pas de simple template `{{pseudo}}`. Permet d'injecter pseudo, entreprise, saison, trésorerie, score, choix passés.

### T3 — scénario d'ouverture de la dramaturgie

Le T3 matérialise le basculement "je fais de la compta → je deviens dirigeant". Ordre exact :

1. **Slot `debut_tour` — Écran 1 : « Le marché change »**
   Défi externe court (archétype 3 ou 4), contextualisé par saison et entreprise. Effet immédiat léger OU contrainte annoncée (arc différé).

2. **Étapes 1-5 normales** — le joueur joue comme d'habitude, mais avec la pression du marché ressentie.

3. **Slot `avant_decision` — Écran 2 : « Comment veux-tu te positionner ? »**
   Palier stratégique irréversible (archétype 6 — Positionnement). Le joueur choisit sa réponse au marché APRÈS avoir senti la pression.

4. **Étapes 6-8 normales** — le bilan final du trimestre n'est pas remplacé.

**Règles UX T3** :
- Chaque écran doit être **court** (< 30s de lecture).
- Les deux écrans doivent être **visuellement très différents** (palette, iconographie, tonalité).
- L'un doit **répondre à l'autre** narrativement (même arc : le marché change → je me positionne).

### Archétypes mécaniques (7)

| # | Archétype | Slot par défaut | Caractéristique |
|---|---|---|---|
| 1 | Observation | `debut_tour` (T1, T2) | Question pédagogique, aucun effet, pas de sanction |
| 2 | Choix binaire simple | variable | 2 options, effet immédiat uniquement |
| 3 | Choix à arbitrage | `debut_tour` ou `apres_ventes` | 3 options avec trade-offs |
| 4 | Conséquence différée | `debut_tour` | Effet étalé sur 2-4 trim via `defisActifs: ArcDiffere[]` |
| 5 | Clôture obligatoire | `fin_exercice` | Automatique, IS + affectation |
| 6 | Palier stratégique | `avant_decision` ou `finale` | Choix irréversible, modifie paramètres globaux |
| 7 | Conditionnel | variable | Coexiste avec défi obligatoire (max 1 alerte courte) |

### Catalogue V1 (27 défis)

**Matrice narrative 5 × 4 = 20 défis** :

| Tonalité \ Format | Simple | À choix | Différé | Avancé (entreprise) |
|---|---|---|---|---|
| 1 — Trésorerie / BFR | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 — Capacité / production / stock | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 — Financement / banque / dette | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 — Risque / protection / juridique | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 — Positionnement / stratégie / marché | ⬜ | ⬜ | ⬜ | ⬜ |

**Systémiques (7 défis)** :
- 3 observations : T1 "où est l'argent disponible ?", T1-fin "résultat = trésorerie ?", T2 "Grand Compte = encaissement immédiat ?"
- 1 clôture paramétrable (slot `fin_exercice`)
- 3 paliers stratégiques : positionnement (T3-T4), croissance (T6-T8), sortie (finale)

### Architecture par vagues

**Vague 1 — Socle technique (game-engine)**

Types dans `packages/game-engine/src/types.ts` — **noms sans accent, cf. L44** :
- [x] `DefiDirigeant`, `ChoixDefi`, `EffetDiffere`, `ArcDiffere`, `DefiResolu`
- [x] `SlotDramaturgique = "debut_tour" | "apres_ventes" | "avant_decision" | "avant_bilan" | "fin_exercice" | "finale"`
- [x] `RuptureType = "resiste" | "juge" | "revient" | "second_palier" | "finale"`
- [x] Extension `EtatJeu` : `defisActifs?: ArcDiffere[]`, `defisResolus?: DefiResolu[]`, `defisActives?: boolean` (optionnels pour rétrocompatibilité) ; `Joueur.choixStrategiques?: Record<string, string>`

Logique pure dans `packages/game-engine/src/defis.ts` :
- [x] `piocherDefi(etat, joueur, slot, catalogue, rng?): DefiDirigeant | null`
- [x] `appliquerChoixDefi(defi, choix, etat, joueur): ResultatChoixDefi` (pur, sans mutation)
- [x] `resoudreConsequencesDifferees(etat): ResolutionEffetsDifferes`
- [x] `formatContexte(template, etat, joueur): string` (tokens : `{pseudo}`, `{entreprise}`, `{saison}`, `{tresorerie}`, `{tour}`)

Fonctions de calibrage dans `packages/game-engine/src/calibrage.ts` :
- [x] `montantUnites(n)` → `arrondirJeu(n * PRIX_UNITAIRE_MARCHANDISE)` (constante vérifiée `types.ts` = 1000)
- [x] `montantChargeFixe(ratio)` → `arrondirJeu(ratio * CHARGES_FIXES_PAR_TOUR)` (constante `types.ts` = 2000)
- [x] `montantTresorerieCritique(etat, joueur)` → tension structurelle bornée par `DECOUVERT_MAX`
- [x] `arrondirJeu(montant)` → pas de 500 €, préserve le signe, zéro invariant

Catalogue (reporté en Vague 2+ — la Vague 1 livre un socle testable, le catalogue V1 viendra avec l'orchestration flow) :
- [ ] `packages/game-engine/src/data/defis/observation.ts`
- [ ] `packages/game-engine/src/data/defis/cloture.ts`
- [ ] `packages/game-engine/src/data/defis/paliers.ts`
- [ ] `packages/game-engine/src/data/defis/catalogue.ts`

Tests :
- [x] `packages/game-engine/tests/defis.test.ts` (28 tests, 100% couverture sur `defis.ts`)
- [x] `packages/game-engine/tests/calibrage.test.ts` (16 tests, 100% couverture sur `calibrage.ts`)

**Review Vague 1 (2026-04-18)**

- `npx tsc --noEmit` sur `packages/game-engine` : 0 erreur.
- `npx jest tests/calibrage.test.ts tests/defis.test.ts` : 44 tests verts.
- Couverture : `calibrage.ts` 100 %, `defis.ts` 100 %, `types.ts` 100 %.
- Régression moteur : aucune. `engine.test.ts` échoue avec les mêmes erreurs TypeScript qu'avant (fonctions `creerJoueur` / `calculerCoutCommerciaux` non exportées depuis `engine.ts:209` et `engine.ts:586`). Problème antérieur, hors périmètre Vague 1.
- Rétrocompatibilité : tous les nouveaux champs sur `EtatJeu` / `Joueur` sont optionnels. Les parties en cours restent valides.
- Index public : `calibrage` et `defis` sont désormais exportés via `packages/game-engine/src/index.ts` et consommables depuis `apps/web`.

**Vague 2 — Orchestration flow vertical minimal (apps/web)**

Scope choisi avec Pierre 2026-04-18 : vertical très court pour valider le cœur émotionnel
« T1 observe → T3 marché change → T3 positionnement → T5 choix revient → T6 fin normale ».
Flag `defisActives = false` par défaut. Activation via URL `?defis=1` (setting DB en Vague 2.5).

- [x] **Step 1** — `packages/game-engine/src/data/defis/catalogue-v2.ts` (mini-catalogue 4 défis)
- [x] **Step 2** — `packages/game-engine/src/timing.ts` (2 fonctions pures, V2 minimaliste) + re-exports
  dans `apps/web/app/jeu/hooks/gameFlowUtils.ts`.
  Validation : 74 tests game-engine verts. `tsc --noEmit` apps/web : aucune nouvelle erreur.
- [x] **Step 3** — `apps/web/components/jeu/DefiDirigeantScreen.tsx` (UI minimale, 1 seule variante).
  Plein écran sobre : header indigo→violet, contexte formaté, liste de boutons de choix,
  pédagogie affichée après sélection, bouton « Appliquer ce choix ». Export ajouté dans
  `apps/web/components/jeu/index.ts`. `tsc --noEmit` : OK.
- [x] **Step 4** — `apps/web/app/jeu/hooks/useGameFlow.ts` — branchement V2 minimaliste :
  - Nouvel import : `determinerSlotsActifs`, `piocherDefi`, `appliquerChoixDefi`,
    `resoudreConsequencesDifferees`, `formatContexte`, `CATALOGUE_V2`,
    types `DefiDirigeant` / `SlotDramaturgique`.
  - 2 nouveaux états : `defiEnAttente`, `contexteDefi`.
  - 3 nouvelles fonctions : `slotPourEtapeCourante`, `resoudreArcsDifferes`, `resoudreDefi`.
  - Interception dans `launchStep()` avant le flow normal, encadrée par
    `if (workingEtat.defisActives)` → **flag OFF = comportement strictement identique**.
  - Arcs différés résolus silencieusement au début du trimestre (étape 0, joueur 0)
    — le joueur voit ses postes bouger dans le bilan/CR, sans écran intermédiaire.
  - Consultation des slots `debut_tour` (étape 0) et `avant_decision` (étape 6).
  - Retour API étendu : `defiEnAttente`, `contexteDefi`, `resoudreDefi`.
- [x] **Step 5** — `apps/web/app/jeu/page.tsx` — lecture `?defis=1`, injection, overlay :
  - Import de `DefiDirigeantScreen`.
  - 1 nouvel état : `defisActivesURL` (lu via `URLSearchParams`).
  - 2 nouveaux `useEffect` : lecture au montage + injection sur `etat.defisActives` une fois.
  - Rendu de `<DefiDirigeantScreen>` en tout premier dans le JSX principal (prend le dessus).
- [ ] **Step 6** — Validation manuelle (flag OFF identique, flag ON parcours T1→T5) + commit + push

### Résultats Vague 2

- `packages/game-engine` : 74 tests verts (timing 13, catalogue-v2 17, defis 28, calibrage 16).
- `tsc --noEmit` sur apps/web : seules erreurs = React 18 vs 19 types pré-existants
  (Link, RightPanel). Aucune erreur nouvelle liée aux défis.
- Rétrocompatibilité : sans `?defis=1`, `etat.defisActives === undefined`, toute la
  logique défis est court-circuitée dans `useGameFlow.launchStep()` — le comportement
  est strictement identique à la version commitée au 2b7b4bc.
- Parcours cible (`?defis=1`, durée 6 trimestres) :
  - T1 étape 0 → observation `obs-t1` (slot `debut_tour`)
  - T2 étape 0 → observation `obs-t2`
  - T3 étape 0 → défi `defi-t3-marche` (archétype choix_binaire)
  - T3 étape 6 → palier `palier-t3-positionnement` (choix low_cost / milieu / premium)
  - T5 étape 0 → résolution silencieuse de l'arc différé du palier (effets sur ventes/achats/trésorerie)
  - T6 étape 8 → fin normale, OverlayTransition et gameover inchangés.
- Leçon L45 ajoutée dans `tasks/lessons.md` : workspace link manquant dans le VM (symlink
  manuel possible comme fallback rapide).

### Reste à faire (Step 6)

- Validation manuelle par Pierre depuis le Mac :
  1. `http://localhost:3000/jeu` sans `?defis=1` → comportement identique à avant.
  2. `http://localhost:3000/jeu?defis=1` → enchaînement T1/T2/T3/T5 décrit ci-dessus.
- Si OK → commit + push depuis le Mac (VM ne peut pas pousser).

**Ce qu'on NE FAIT PAS en Vague 2** (reporté) :
- Catalogue complet 27 défis (Vague 4)
- Clôture IS / réserve légale / affectation (Vague 4)
- 5 palettes visuelles finales (Vague 3)
- Paliers croissance / sortie / conditionnels avancés (Vague 4)
- Setting formateur en DB (Vague 2.5 — migration 006)
- Scoring final par doctrine (Vague 5)

**Vague 3 — UI**

- [ ] `apps/web/components/jeu/DefiDirigeantScreen.tsx` — écran plein écran
  - Variante **courte** (< 30s, archétypes 2/3/4/7) avec palette par tonalité
  - Variante **longue** (palier stratégique, archétype 6) avec bilan projectif
  - Variante **clôture** (archétype 5) avec bilan consolidé + calcul IS + affectation
- [ ] `apps/web/components/jeu/JournalDefis.tsx` — chronologie des défis et arcs en cours dans `RightPanel`
- [ ] `apps/web/app/jeu/page.tsx` — phase intermédiaire `defi` (entre étapes)
- [ ] `apps/web/components/jeu/index.ts` — exports

**Vague 4 — Écriture narrative**

- [ ] Remplir la matrice 5 × 4 (20 défis)
- [ ] Écrire les 3 observations
- [ ] Écrire les 3 paliers stratégiques
- [ ] Paramétrer le défi clôture
- [ ] `docs/DEFIS_DIRIGEANT_V1.md` — catalogue complet

**Vague 5 — Équilibrage & tests**

- [ ] Appliquer les règles d'équilibrage via fonctions de calibrage
- [ ] Tests unitaires, tests d'intégration, tests pédagogiques (cf. Validation)

### Règles d'équilibrage (via fonctions de calibrage)

Tous les montants dans les défis passent par les 4 fonctions de `calibrage.ts`. Les défis restent lisibles (ex. `montantUnites(5)` au lieu de `5000`).

**Clôture (slot `fin_exercice`)** :
- IS = 15% du bénéfice de l'exercice, puis `arrondirJeu()`
- Réserve légale obligatoire = `arrondirJeu(500)` tant que capitaux propres < `montantUnites(20)`
- Dividendes : 0 à 50% du (résultat net − IS − réserve), tranches `arrondirJeu`
- Dette IS portée en `dettesFiscales` existant

**Palier croissance (slot `avant_decision` en T6-T8)** :
- Emprunt : `+montantUnites(10)` tréso, rembours. `REMBOURSEMENT_EMPRUNT_PAR_TOUR`, intérêts `TAUX_INTERET_ANNUEL`
- Levée : `+montantUnites(15)` apport, dilution 30%
- Organique : +5% ventes cumulatif sur 4 trim

**Palier positionnement (slot `avant_decision` en T3-T4)** :
- Low-cost : marges −25%, volumes +40%
- Milieu de gamme : neutre
- Premium : marges +30%, volumes −20% (exige ISO ou R&D sous 2 trim)

**Palier sortie (slot `finale`)** :
- Transmission familiale : bonus score si capitaux propres > `montantUnites(25)`
- Cession fonds : multiplicateur score basé sur EBITDA moyen 3 derniers trim
- IPO : 3 exercices bénéficiaires consécutifs

**Saisonnalité (coefficients neutres sur 4 trim, injectés via `formatContexte`)** :
- T1 (hiver) : ventes × 0.95, charges × 1.15
- T2 (printemps) : ventes × 1.05, charges × 1.00
- T3 (été) : ventes × 0.85, charges × 0.95
- T4 (fin d'année) : ventes × 1.15, charges × 1.10

### Validation

- [ ] `npx tsc --noEmit` sur game-engine : 0 erreur
- [ ] `npx tsc --noEmit` sur apps/web : 0 nouvelle erreur (erreurs pré-existantes tolérées cf. Tâche 6.5)
- [ ] Test unitaire : `determinerTimingRupture(tour, nbTours)` pour les 4 durées
- [ ] Test unitaire : `determinerSlotsActifs(tour, etat)` respecte la règle "1 majeur + 1 alerte max"
- [ ] Test unitaire : arc différé à 3 trim → résolution correcte au bon tour via `debut_tour`
- [ ] Test unitaire : les 4 fonctions de `calibrage.ts` (bornes, arrondis, dérivation de trésorerie)
- [ ] Test unitaire : `formatContexte` injecte pseudo, saison, entreprise, trésorerie
- [ ] Test d'intégration : partie durée 8, tous les slots déclenchent le défi attendu au bon tour
- [ ] Test visuel : les 3 variantes de `DefiDirigeantScreen` (courte, longue, clôture) + 5 palettes
- [ ] Test pédagogique : soumettre 3 défis à un enseignant de gestion, validation concept comptable reconnaissable
- [ ] Test anti-régression : `defisActives = false` → comportement strictement identique à V actuelle (pipeline 9 étapes préservé)

### Ressources
- Constantes économiques : `packages/game-engine/src/types.ts:344-528` (incluant `PRIX_UNITAIRE_MARCHANDISE:347` = 1000)
- Moteur étape 0 (charges fixes, amortissements) : `packages/game-engine/src/engine.ts:313-482`
- Cartes existantes (41 Décision + 15 Événements) : `packages/game-engine/src/data/cartes.ts`
- Flow actuel et ETAPE_INFO : `apps/web/app/jeu/hooks/gameFlowUtils.ts:33-90`
- Snapshots trimestriels déjà collectés : `apps/web/app/jeu/hooks/gameFlowUtils.ts:146`
- Leçons pertinentes : L43 (échelle des montants), L44 (nommage sans accent)

---

## Tâche 22 : Mode relecture par étape (read-only replay) — 2026-04-14 🚧

### Contexte
Pendant une partie, l'apprenant peut vouloir revenir sur une écriture passée qu'il n'a pas bien comprise, sans pour autant pouvoir la modifier (principe comptable : on ne corrige pas rétroactivement le passé, on l'analyse). Aujourd'hui, le journal existe (30 dernières étapes) mais n'affiche pas le Bilan/CR reconstitué du moment. Pierre veut un mode relecture **read-only** avec Bilan/CR fidèles à la réalité de l'époque.

### Décisions Pierre
- **V2** (snapshots complets) retenu plutôt que V1 (simple résumé écritures) → besoin de chiffres fiables pour la formation.
- **Granularité par étape** (pas par écriture) → respecte le principe de partie double (Actif = Passif à la fin d'une étape complète, jamais entre deux écritures d'une même étape).
- Raccourci clavier **Backspace** + bouton **⏮ Revoir** dans le header.
- Bandeau pédagogique rouge : "En gestion d'entreprise, on ne peut pas annuler ni modifier les actions du passé…"

### Architecture
- Chaque `JournalEntry` embarque un `joueurSnapshot: Joueur` (deep-clone via `structuredClone`) pris **après** application complète de l'étape.
- Composant `JournalReplay.tsx` : modale plein écran avec timeline à gauche (groupée par trimestre → étapes) et panneau détail à droite.
- Panneau détail : Bilan/CR APRÈS cette étape + liste des écritures (postes + deltas) + principe pédagogique.
- Bouton "Reprendre la partie" (vert) en bas à droite + `Escape` pour fermer.

### Fichiers à modifier
- [ ] `apps/web/app/jeu/hooks/useGameFlow.ts` — enrichir `JournalEntry` + capture snapshot dans `confirmActiveStep`
- [ ] `apps/web/components/jeu/JournalReplay.tsx` — nouveau composant
- [ ] `apps/web/components/jeu/HeaderJeu.tsx` — bouton ⏮ Revoir
- [ ] `apps/web/app/jeu/page.tsx` — state `showReplay` + raccourci Backspace
- [ ] `apps/web/components/jeu/index.ts` — export
- [ ] `tasks/lessons.md` — L40 (replay pattern via snapshots deep-clone)

### Validation
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] Journal vide → bouton désactivé
- [ ] Backspace ignoré si focus dans input/textarea
- [ ] Chiffres affichés cohérents avec la réalité du moment historique

---

## Tâche 21 : SetupScreen refondu en wizard séquentiel — 2026-04-14 🚧

### Contexte
L'écran actuel empile tout (nombre joueurs, pseudos, entreprises, durée) sur une seule page → surcharge cognitive pour un nouveau joueur. Le bouton "Créer ma propre entreprise" n'est pas compréhensible pour un débutant qui n'a jamais vu les entreprises préexistantes. Le texte de conseil statique devient incohérent dès que l'utilisateur modifie son choix (ex. "1 joueur sur 6 trimestres" alors que 8 trimestres est sélectionné).

### Décisions Pierre
- Wizard **inline** (pas de modales empilées) avec transitions horizontales via `AnimatePresence`.
- **4 étapes** : (1) nombre joueurs → (2) pseudos → (3) entreprises → (4) durée + récap + démarrer.
- **"Créer ma propre entreprise"** intégré comme DERNIÈRE option du dropdown d'entreprise (icône ✏️), avec valeur spéciale `__create__` qui ouvre `EntrepriseBuilder`.
- **Conseil de démarrage dynamique** : reformulé selon `(nbJoueurs, nbTours)` en cours. Texte de base conservé pour 1 joueur / 6 trimestres. Correction : "2, 3 ou 4 joueurs" (pas "2 ou 3").

### Fichiers à modifier
- [ ] `apps/web/components/jeu/SetupScreen.tsx` — réécriture complète
- [ ] `tasks/lessons.md` — leçon L39 (wizard pattern pour onboarding)

### Architecture
- État lifted dans `SetupScreen` : `{ step, direction, nbJoueurs, nbTours, players[], adHocTemplates[], builderOpenForPlayer }`.
- `step: 1 | 2 | 3 | 4` + `direction: 1 | -1` pour animation slide.
- `canAdvance(step)` : validation par étape (pseudo non vide, entreprises uniques).
- Barre de progression en haut (4 pastilles + labels).
- Bandeau conseil dynamique visible sur toutes les étapes.
- Focus auto sur le premier élément interactif de chaque étape.
- Navigation : boutons "← Retour" et "Suivant →" (étape 4 → "Démarrer la partie").
- Clavier : `Enter` = Suivant (si valide), `Escape` = Retour.

### Validation
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] Flux joueur 1, 2, 3, 4 (chaque combinaison)
- [ ] Flux "Créer ma propre entreprise" depuis le dropdown → builder → assignation auto
- [ ] Retour/avance préserve l'état
- [ ] Conseil dynamique reflète les choix courants

---

# Tâches JE DEVIENS PATRON — mis à jour 2026-04-13

---

## Tâche 18 : Éditeur d'entreprises personnalisées (Option B) — 2026-04-13 ✅

### Contexte
Un formateur peut créer des scénarios personnalisés en modifiant le bilan initial d'une entreprise.
Les cartes et effets passifs sont hérités de l'entreprise de base (4 défauts).
Les templates sont snapshotés dans la session au moment de la création (immuables).

### Fichiers créés
- [x] `supabase/migrations/011_custom_enterprise_templates.sql` — Table + RLS + colonne enterprise_templates sur game_sessions
- [x] `apps/web/app/api/templates/route.ts` — GET (liste) + POST (création) avec validation Actif=Passif
- [x] `apps/web/app/api/templates/[id]/route.ts` — PUT (mise à jour) + DELETE (soft-delete)
- [x] `apps/web/app/api/sessions/[code]/templates/route.ts` — GET templates d'une session par room_code
- [x] `apps/web/app/dashboard/templates/page.tsx` — Page complète : liste cards + éditeur modal + validation bilan temps réel

### Fichiers modifiés
- [x] `packages/game-engine/src/types.ts` — NomEntreprise élargi (DefaultEntreprise | string & {})
- [x] `packages/game-engine/src/engine.ts` — creerJoueur() + initialiserJeu() acceptent customTemplates?
- [x] `apps/web/lib/game-engine/types.ts` — Miroir types
- [x] `apps/web/lib/game-engine/engine.ts` — Miroir engine
- [x] `apps/web/app/api/sessions/route.ts` — POST accepte template_ids, snapshot dans enterprise_templates
- [x] `apps/web/app/dashboard/sessions/new/page.tsx` — Section "Scénario personnalisé" avec sélection templates
- [x] `apps/web/components/jeu/SetupScreen.tsx` — Affiche entreprises custom en plus des 4 défauts
- [x] `apps/web/app/jeu/hooks/useGamePersistence.ts` — Charge customTemplates depuis session
- [x] `apps/web/app/jeu/hooks/useGameFlow.ts` — Passe customTemplates à initialiserJeu()
- [x] `apps/web/app/jeu/page.tsx` — Wire customTemplates entre persistence, flow et SetupScreen

### Architecture
```
Formateur crée template (POST /api/templates)
  └─ Stocké en BDD (custom_enterprise_templates)

Formateur crée session avec templates (POST /api/sessions + template_ids)
  └─ Templates convertis en EntrepriseTemplate[] → snapshot JSONB dans game_sessions.enterprise_templates

Joueur rejoint session
  └─ useGamePersistence charge templates (GET /api/sessions/{code}/templates)
  └─ SetupScreen affiche défauts + customs
  └─ initialiserJeu(defs, nbTours, customTemplates) → creerJoueur lookup custom → defaults
```

### Validation
- [x] `npx tsc --noEmit` — 0 erreur
- [ ] Migration 011 à appliquer par Pierre sur Supabase

---

## Tâche 17 : Feature A — Dashboard formateur temps réel — 2026-04-13 ✅

### Contexte
Le formateur peut suivre en direct la progression de ses apprenants pendant une session.
Les joueurs envoient un heartbeat (live_state) à chaque fin de trimestre via l'API.
Le dashboard utilise Supabase Realtime pour recevoir les mises à jour sans rechargement.

### Fichiers créés
- [x] `apps/web/app/api/sessions/heartbeat/route.ts` — API POST (mise à jour live_state + last_heartbeat)
- [x] `apps/web/app/dashboard/sessions/[id]/live/page.tsx` — Page live avec grille joueurs + stats temps réel + Supabase Realtime subscription
- [x] `supabase/migrations/010_enable_realtime_game_players.sql` — Active Realtime sur game_players

### Fichiers modifiés
- [x] `apps/web/app/jeu/hooks/gameFlowUtils.ts` — Ajout `buildLiveState()` (LiveState léger ~200B)
- [x] `apps/web/app/jeu/hooks/useGameFlow.ts` — Envoi heartbeat dans `confirmEndOfTurn` + param `roomCode`
- [x] `apps/web/app/jeu/page.tsx` — Passage `roomCode` à useGameFlow
- [x] `apps/web/app/dashboard/sessions/[id]/page.tsx` — Boutons "Suivre en direct" et "Rapport pédagogique"
- [x] `apps/web/lib/rate-limit.ts` — Ajout config "sessions/heartbeat" (120/min)

### Architecture
```
Joueur (page /jeu)
  └─ confirmEndOfTurn → POST /api/sessions/heartbeat
       └─ UPDATE game_players SET live_state, last_heartbeat

Formateur (page /dashboard/sessions/[id]/live)
  └─ Supabase Realtime subscription sur game_players
       └─ postgres_changes (INSERT + UPDATE) filtré par session_id
```

### Notes
- Migration 010 à appliquer manuellement par Pierre sur Supabase
- Le heartbeat est fire-and-forget (non bloquant pour le joueur)
- Détection inactivité : 5 min sans heartbeat = indicateur grisé

---

## Tâche 16 : Feature B — Rapport pédagogique post-session — 2026-04-13 ✅

### Contexte
Page `/rapport/[room_code]` avec graphiques Recharts, diagnostic textuel automatique, et classement.
Accessible par le formateur ET les joueurs après la partie (URL partageable).

### Fichiers créés
- [x] `apps/web/app/api/rapport/[room_code]/route.ts` — API GET (session + joueurs + snapshots depuis Supabase)
- [x] `apps/web/lib/diagnostic.ts` — Moteur de diagnostic : 12 règles (4 alertes, 4 conseils, 4 forces)
- [x] `apps/web/components/rapport/ReportCharts.tsx` — 3 graphiques Recharts (trésorerie, CA, score) avec courbes superposées en multi
- [x] `apps/web/components/rapport/DiagnosticPanel.tsx` — Panneau diagnostic par joueur (alertes/conseils/forces colorés)
- [x] `apps/web/app/rapport/[room_code]/page.tsx` — Page complète (classement + graphiques + diagnostic + navigation)

### Fichiers modifiés
- [x] `apps/web/app/jeu/page.tsx` — Bouton "Voir le rapport pédagogique" en gameover (lien vers `/rapport/{room_code}`)
- [x] `apps/web/package.json` — Ajout de `recharts` en dépendance

### Diagnostic : 12 règles pédagogiques
**Alertes** : trésorerie négative persistante, déficit prolongé, capitaux propres négatifs, croissance non rentable
**Conseils** : aucun commercial, recrutement tardif, aucune décision, gestion trop prudente
**Forces** : croissance régulière, entreprise profitable, résilience, solidité financière renforcée

### Prochaine phase
- Phase 3 : Feature A — Dashboard formateur temps réel (heartbeat API, Supabase Realtime, live UI)

---

## Tâche 15 : Features A+B — Phase 1 (fondations snapshots) — 2026-04-13 ✅

### Contexte
Features A (dashboard formateur temps réel) et B (rapport pédagogique post-session) nécessitent une infrastructure de snapshots trimestriels. Phase 1 pose les fondations : migration SQL, types, accumulation côté client, sauvegarde en base.

### Changes réalisés
- [x] Migration `009_game_players_live_and_snapshots.sql` : colonnes `live_state`, `last_heartbeat`, `snapshots` sur `game_players`
- [x] Types `LiveState` + `TrimSnapshot` dans `packages/game-engine/src/types.ts` + miroir `apps/web`
- [x] `buildTrimSnapshot()` dans `gameFlowUtils.ts` : snapshot à partir de l'état courant du joueur
- [x] `useGameFlow` : accumule les snapshots (useState) + capture le label de la dernière décision par trimestre
- [x] `useGamePersistence` : reçoit les snapshots via `MutableRefObject` (résout dépendance circulaire), les inclut dans localStorage (solo) et API (multi)
- [x] `/api/sessions/results` : validation + insertion du champ `snapshots` dans `game_players`
- [x] `npx tsc --noEmit` → 0 erreur

### Prochaines phases
- Phase 2 : Feature B — Rapport pédagogique post-session (composants, graphiques, diagnostic)
- Phase 3 : Feature A — Dashboard formateur temps réel (heartbeat API, Realtime, live UI)

### Note
Migration 009 à appliquer manuellement par Pierre sur Supabase.

---

## Tâche 14 : Refactoring qualité code P1-P10 — 2026-04-13 ✅

### Contexte
Graphify a identifié 10 points de qualité (🔴 critiques, 🟠 risque élevé, 🟡 moyen).
Pierre a demandé qu'on traite tous les points en professionnel.

### Résumé des changes

| # | Criticité | Description | Statut |
|---|---|---|---|
| P1 | 🔴 | IDs hardcodés → constantes CARTE_IDS + throw sur poste inconnu | ✅ |
| P2 | 🔴 | Flags sémantiques entreprises (reducDelaiPaiement, clientGratuitParTour) | ✅ |
| P3 | 🟠 | push() → spread immutable sur cartesActives, clientsATrait | ✅ |
| P4 | 🔴 | useGameFlow 810L → 4 sous-hooks (pedagogy, loans, achat, decisions) | ✅ |
| P5 | 🟠 | Magic numbers → constantes nommées (TAUX_AGIOS, AMORTISSEMENT_PAR_BIEN, etc.) | ✅ |
| P6 | 🟡 | Constants REVENU_PAR_CLIENT, BONUS_CAPACITE, BENEFICE_QUALITATIF → types.ts | ✅ |
| P7 | 🟡 | Invariant verifierEquilibreComptable() | ✅ |
| P8 | 🟠 | console.error avec contexte avant throw | ✅ |
| P9 | 🟡 | ETAPES object nommé + satisfies | ✅ |
| P10 | 🟡 | setActiveStep → useReducer typé (activeStepReducer) | ✅ |

### Architecture P4 — 5 nouveaux fichiers
- `hooks/gameFlowUtils.ts` — buildActiveStep, cloneEtat, ETAPE_INFO, ModificationMoteur
- `hooks/usePedagogyFlow.ts` — QCM, modal pédago, maybeShowPedagoModal
- `hooks/useLoansFlow.ts` — emprunts bancaires
- `hooks/useAchatFlow.ts` — achats de marchandises
- `hooks/useDecisionCards.ts` — cartes décision, pioche, cession, licenciement

### Validation
- [x] `npx tsc --noEmit` → 0 erreur ✅
- [ ] Push + test visuel Pierre

---

## Tâche 13 : Afficher les bénéfices des cartes d'investissement — 2026-04-12

### Contexte
À l'étape 7/9 (investissement), le joueur voit le coût de chaque carte mais aucun bénéfice.
Il ne peut pas faire un choix éclairé. Les données existent dans le moteur (clientParTour,
effetsRecurrents, carteDecisionBonus) mais ne sont pas rendues.

### Solution : affichage inline des bénéfices (recommandation UX)
Approche "expanded inline" — le joueur voit coût ET bénéfice d'un coup d'œil sans clic supplémentaire.

### Implémentation
- [x] Fonction `analyserBenefice(carte)` : calcule clients, charges récurrentes, CIR, résultat net, payback
- [x] Bloc vert : clients générés/trim + montant ventes
- [x] Bloc amber : charges d'entretien récurrentes
- [x] Bloc cyan : revenus spéciaux (CIR)
- [x] Bloc violet : cartes décision bonus (Berline)
- [x] Ligne de synthèse : résultat net/trim + payback en trimestres + délai paiement
- [x] `npx tsc --noEmit` → 0 erreur ✅
- [x] `npm test` → 39/39 verts ✅
- [ ] Test visuel par Pierre

---

## Tâche 12 : Refonte UX "Traitement des ventes" — 2026-04-12

### Contexte
Pierre signale que la séquence de 4 écritures par vente (Ventes, Stocks, Achats/CMV, Trésorerie) est confuse pour l'apprenant. 6 problèmes identifiés :
1. Déséquilibre temporaire affiché (⚠️) entre les écritures d'une même transaction
2. Ordre contre-intuitif (commence par le plus abstrait : Ventes au lieu du plus concret : Trésorerie)
3. Aucun lien narratif entre les 4 écritures d'une même vente
4. 12 écritures séquentielles (3 clients × 4) = surcharge cognitive
5. Terminologie Débit/Crédit brute sans explication accessible
6. Bulle pédagogique (💡) générique identique pour les 12 écritures

### Solution : "L'histoire d'une vente" — regroupée, narrée, progressive

Chaque vente = 1 carte narrative avec 4 actes, un récit adapté au client, et un seul bouton de validation.

### Plan d'implémentation (5 volets)

#### Volet 1 — Engine : réordonner les écritures + metadata
- [x] `engine.ts` : réordonner les 4 push() dans `appliquerCarteClient` (Trésorerie→Ventes→Stocks→CMV)
- [x] Ajouter `saleGroupId`, `saleClientLabel`, `saleActIndex` aux modifications
- [x] Synchroniser les 2 fichiers engine.ts (L20)
- [x] Rebuild `packages/game-engine`

#### Volet 2 — useGameFlow : regrouper les entries par vente
- [x] Taguer chaque lot de 4 modifications avec `saleGroupId` dans case 4
- [x] Propager `saleGroupId`, `saleClientLabel`, `saleActIndex` dans EntryLine
- [x] `applySaleGroup()` pour application atomique des 4 écritures

#### Volet 3 — Nouveau composant SaleGroupCard.tsx
- [x] Carte narrative par vente avec 4 actes numérotés
- [x] Récit adapté au client (Particulier/TPE/Grand Compte)
- [x] Micro-explication Débit/Crédit en langage clair
- [x] Vérification d'équilibre intégrée (Σ Débits = Σ Crédits)
- [x] Marge brute affichée (Ventes − CMV)
- [x] Un seul bouton "Enregistrer cette vente"

#### Volet 4 — LeftPanel : VENTE 1/3 au lieu d'ÉCRITURE 1/12
- [x] Compteur de ventes au lieu de compteur d'écritures
- [x] Résumé narratif de la vente en cours
- [x] Application atomique des 4 écritures (pas de déséquilibre intermédiaire)

#### Volet 5 — EntryPanel : utiliser SaleGroupCard en step 4
- [x] Remplacer les EntryCard individuelles par SaleGroupCard
- [x] Conserver EntryCard comme fallback pour entries sans saleGroupId

#### Volet 6 — Câblage + Vérification
- [x] `onApplySaleGroup` câblé : page.tsx → LeftPanel (+ EntryPanel prêt)
- [x] `npx tsc --noEmit` → 0 erreur ✅
- [x] `npm test` → 39/39 verts ✅
- [ ] Test visuel : aucun ⚠️ Déséquilibre pendant le step 4 (à tester par Pierre)
- [ ] Narrative cohérente pour les 3 types de clients (à vérifier visuellement)

---

## Tâche 11 : Refonte étape 6b Investissement — 2026-04-11

### Contexte (source : messages de Pierre)
Pierre n'aime pas l'UX actuelle de l'étape 6b :
1. Deux fenêtres séparées (MiniDeckPanel logistique à gauche + cartes globales dans MainContent) → confusion
2. Un seul investissement possible par tour → pas de prise de risque
3. Pas de possibilité de vendre des immobilisations d'occasion → manque un concept comptable important (plus/moins-value de cession)

Choix validés par Pierre :
- **Option 1** : panneau unifié avec catégories visibles
- **Plusieurs investissements par tour** autorisés (si trésorerie le permet)
- **Vente d'immobilisation d'occasion** à ajouter

### État actuel du moteur (exploration effectuée)

#### A. Deux flux parallèles de cartes à l'étape 6b
| Source | Provenance | API moteur | UI actuelle |
|---|---|---|---|
| `cartesDisponibles` | `tirerCartesDecision(etat, 4)` = 4 cartes globales piochées | `acheterCarteDecision` | `MainContent.tsx` (liste scrollable dans panneau central) |
| `piochePersonnelle` | mini-deck logistique de l'entreprise (`cartesLogistiquesDisponibles`) | `investirCartePersonnelle` | `MiniDeckPanel.tsx` (panneau séparé) |

Chaque flux produit un `activeStep` avec entries → l'apprenant clique "Appliquer" écriture par écriture → `confirmActiveStep()` marque l'étape finie.

#### B. Structure des immobilisations (découverte clé)
- Chaque ligne `PosteActif` d'immobilisation stocke `valeur` = **valeur nette comptable courante** (VNC), pas la valeur brute.
- L'amortissement (`appliquerEtape0`) décrémente directement `item.valeur -= 1000` jusqu'à 0, et enregistre la dotation agrégée sur le CR.
- **Pas de suivi gross value / cumul amortissements** — c'est une simplification pédagogique volontaire.
- Les investissements via Cartes Décision vont TOUS dans la ligne agrégée "Autres Immobilisations" (moteur `appliquerEffet` ligne 154-164 de `engine.ts`).

**Conséquence pour la cession** : on peut calculer plus/moins-value directement via `prixCession − a.valeur` (VNC courante). Simple.
**Limite** : "Autres Immobilisations" est un fourre-tout → on ne peut pas vendre séparément un "Site Internet" acheté via Carte Décision, sauf à refactorer en lignes nommées (plus invasif).

#### C. Blocage "un seul investissement par tour" (découverte clé)
Dans `useGameFlow.ts` :
- `launchDecision()` (ligne 587) et `handleInvestirPersonnel()` (ligne 621) construisent un `activeStep` avec les entries de UNE carte.
- Une fois l'étape validée via `confirmActiveStep()` (ligne 323), `setSubEtape6("recrutement")` et `avancerEtape(next)` → passe à l'étape 7.
- Il n'y a aucun "retour au choix" après une validation.

---

### Plan d'implémentation (3 volets, dépendances progressives)

#### Volet 1 — Panneau unifié catégorisé (UX pure, sans impact moteur)

**Objectif** : fusionner `MiniDeckPanel` + liste globale de `MainContent` en un seul composant catégorisé, affiché dans le panneau central pendant l'étape 6b.

Nouveau composant `apps/web/components/jeu/InvestissementPanel.tsx` :
- Reçoit `{ joueur, cartesDisponibles, onInvestirPersonnel, onInvestirGlobal, disabled }`
- Construit une liste unifiée avec **catégories** :
  - 🏭 **Logistique & capacité** (piochePersonnelle, ou `categorie: "investissement"` qui augmente capacité, ex. Entrepôt, Robot)
  - 🚗 **Véhicules** (`categorie: "vehicule"`)
  - 🌐 **Visibilité & commerce** (`categorie: "commercial"`, `"service"`)
  - 💡 **Innovation / R&D** (cartes investissement avec `clientParTour: "tpe"` ou R&D)
  - 💰 **Financement** (`categorie: "financement"`)
  - 🛡️ **Protection / Tactique** (`categorie: "protection"`, `"tactique"`)
- Chaque carte affiche : titre, description courte, coût trésorerie visible (somme des deltas négatifs sur `tresorerie`), badge "Prérequis manquant" si applicable, bouton "Investir"
- Prop `disabled` pour griser quand trésorerie insuffisante ou activeStep en cours
- Remplace l'actuel bloc inline `{etapeTour === 6 && !_activeStep && (...)}` dans `MainContent.tsx` (lignes 142-198)
- Supprime l'appel à `MiniDeckPanel` dans `LeftPanel.tsx` (ou le conditionne pour n'afficher qu'en dehors de l'étape 6, en lecture seule)

**Fichiers touchés** :
- ➕ `apps/web/components/jeu/InvestissementPanel.tsx` (nouveau)
- ✏️ `apps/web/components/jeu/MainContent.tsx` (remplace bloc carte)
- ✏️ `apps/web/components/jeu/LeftPanel.tsx` (retire MiniDeckPanel de l'étape 6b)
- ✏️ `apps/web/app/jeu/page.tsx` (ou composant parent) pour câbler les props si nécessaire

**Non-goal** : ne touche pas au moteur ni à `useGameFlow` dans ce volet.

---

#### Volet 2 — Plusieurs investissements par tour

**Objectif** : à la fin d'un `confirmActiveStep()` pendant la sous-étape 6b, revenir au choix de cartes au lieu d'avancer à l'étape 7.

**Changements dans `useGameFlow.ts`** :
- `confirmActiveStep()` : après avoir persisté les écritures (`setEtat({ ...next })`), si on est en `etapeTour === 6 && subEtape6 === "investissement"` → NE PAS appeler `avancerEtape(next)`. Au lieu : reset `activeStep` / `selectedDecision` / `recentModifications` mais rester sur 6b.
- La carte globale utilisée est déjà retirée via `acheterCarteDecision` → `next.cartesAchetees.push(...)` (à vérifier dans moteur) ou via `tirerCartesDecision` aléatoire à chaque re-render.
- Les cartes logistiques utilisées sont retirées de `piochePersonnelle` par `investirCartePersonnelle` (ligne 928 engine.ts) → OK.

**Problème identifié** : `cartesDisponibles` est recalculé à chaque render via `tirerCartesDecision(cloneEtat(etat), 4)` (ligne 231 useGameFlow.ts). Comme c'est aléatoire (?), il faut mémoïser la pioche au début de l'étape 6b pour que la liste reste stable entre les investissements. **À vérifier** : `tirerCartesDecision` est-il déterministe ou aléatoire ? Si aléatoire, ajouter un `useMemo` stabilisé sur `etat.tourActuel + etat.joueurActif + subEtape6`.

**Nouveau bouton "Terminer les investissements"** dans `InvestissementPanel` :
- Déclenche `skipDecision()` (qui avance à l'étape 7 proprement)
- Permet de sortir quand le joueur a fini

**Garde-fou trésorerie** :
- Avant de cliquer "Investir" sur une carte, afficher le coût et griser si `trésorerie + deltaCumulé < coût`.
- Le modal de confirmation existant (Tâche 10.7 récente) reste actif pour chaque carte.

**Fichiers touchés** :
- ✏️ `apps/web/app/jeu/hooks/useGameFlow.ts` (confirmActiveStep + mémoïsation cartesDisponibles)
- ✏️ `apps/web/components/jeu/InvestissementPanel.tsx` (bouton "Terminer")

---

#### Volet 3 — Vente d'immobilisation d'occasion (plus/moins-value de cession)

**Objectif pédagogique** : enseigner le schéma comptable de la cession d'immobilisation.

**Règle PCG (simplifiée via VNC directe)** :
```
Débit  Trésorerie              = prix de cession (saisi)
Crédit Immobilisations         = VNC courante (a.valeur)
Si prix > VNC : Crédit Revenus exceptionnels = prix − VNC  (plus-value)
Si prix < VNC : Débit Charges exceptionnelles = VNC − prix (moins-value)
```

**Moteur — nouvelle fonction `vendreImmobilisation`** dans `engine.ts` :
```ts
export function vendreImmobilisation(
  etat: EtatJeu,
  joueurIdx: number,
  nomImmo: string,
  prixCession: number
): ResultatAction
```
- Trouver l'actif par `nom` dans `bilan.actifs` catégorie immobilisations
- Vérifier `a.valeur > 0` (pas de vente d'un bien déjà totalement amorti — à discuter, voir question ci-dessous)
- Modifications générées :
  1. Trésorerie +prixCession
  2. Immo `a.nom` : −a.valeur (passe à 0)
  3. Si plus-value : `revenusExceptionnels +diff`
  4. Si moins-value : `chargesExceptionnelles +diff`
- Retirer la ligne d'actif si elle est vide ? **Ou** la laisser à 0 pour traçabilité ? → À trancher.

**Exports types** : vérifier que `revenusExceptionnels` et `chargesExceptionnelles` existent déjà comme `poste` valides dans `EffetCarte` (j'ai vu `chargesExceptionnelles` et `revenusExceptionnels` dans la liste des postes types.ts — à reconfirmer).

**UI — nouvelle section "Vendre un bien" dans `InvestissementPanel`** :
- Liste les immobilisations du joueur avec `valeur > 0` ET qui sont des biens nommés (pas "Autres Immobilisations" tant qu'on ne refactore pas — voir question 3)
- Pour chaque bien : nom, VNC, champ "Prix de vente" (stepper par pas de 500€ par exemple, min 0, max 3×VNC)
- Bouton "Vendre" → crée un `activeStep` (comme pour un investissement) → passe par le modal de confirmation + écritures à appliquer une par une
- Aperçu plus/moins-value en temps réel sous le stepper

**Nouvelle fonction `handleVendreImmobilisation(nomImmo, prix)`** dans `useGameFlow.ts` :
- Symétrique de `handleInvestirPersonnel`
- Appelle `vendreImmobilisation` moteur, construit `activeStep` avec titre "Cession d'immobilisation"

**Tests unitaires** dans `packages/game-engine/src/__tests__/` (s'il y en a) :
- Test plus-value : prix 5000, VNC 3000 → Tréso +5000, Immo −3000, RevExc +2000 ✓
- Test moins-value : prix 2000, VNC 3000 → Tréso +2000, Immo −3000, ChgExc +1000 ✓
- Test cession à la VNC : pas de plus ni moins-value

**Fichiers touchés** :
- ✏️ `packages/game-engine/src/engine.ts` (+ nouvelle fonction `vendreImmobilisation`)
- ✏️ `packages/game-engine/src/index.ts` (export)
- ✏️ `apps/web/lib/game-engine/engine.ts` (duplicat — vérifier s'il existe toujours)
- ✏️ `apps/web/app/jeu/hooks/useGameFlow.ts` (handleVendreImmobilisation + export)
- ✏️ `apps/web/components/jeu/InvestissementPanel.tsx` (section vente)
- ➕ `packages/game-engine/src/__tests__/cession.test.ts` (nouveau)

---

### Décisions validées par Pierre (2026-04-11)

1. **Catégories** ✅ proposition retenue : 🏭 Logistique & capacité / 🚗 Véhicules / 🌐 Visibilité & commerce / 💡 Innovation / 💰 Financement / 🛡️ Protection & Tactique
2. **Vente biens totalement amortis (VNC = 0)** ✅ autorisée — prix de cession = produit exceptionnel pur, concept pédagogique intéressant
3. **Vente "Autres Immobilisations"** ✅ option (a) — la ligne agrégée n'est PAS vendable (uniquement les biens nommés dès le départ : Entrepôt, Camionnette, etc.)
4. **Prix de cession** ✅ proposition automatique = **80 % de la VNC**, modifiable par l'apprenant via stepper
5. **Limite investissements par tour** ✅ aucune — seul garde-fou = trésorerie

### Ordre d'implémentation proposé

1. D'abord volet 1 (panneau unifié) — pur refactor UI, impact zéro sur le moteur, validable immédiatement
2. Puis volet 2 (plusieurs investissements) — modification de `confirmActiveStep` + mémoïsation pioche
3. Enfin volet 3 (cession) — le plus gros, nécessite moteur + tests + UI

### Validation (`verification-before-completion`)

Après chaque volet :
- [x] `npx tsc --noEmit` dans `apps/web` → 0 erreur (Volet 1, 2 et 3)
- [x] `npm test` dans `packages/game-engine` → 39/39 verts (32 existants + 7 nouveaux pour `vendreImmobilisation`)
- [ ] Test manuel du flux complet (tour entier en solo, 1 joueur, 6 trimestres) — à valider par Pierre
- [ ] Capture de l'écran étape 6b pour Pierre — à valider par Pierre

### Review finale Tâche 11 — 2026-04-11

**Volet 1 ✅ (panneau unifié)**
- Nouveau composant `apps/web/components/jeu/InvestissementPanel.tsx` qui fusionne `piochePersonnelle` (mini-deck logistique, badge "Mini-deck") et `cartesDisponibles` (cartes globales) en 5 sections catégorisées : Logistique & Innovation (Factory/amber), Véhicules (Truck/sky), Commerce & Services (Globe/emerald), Financement (Coins/violet), Protection & Tactique (Shield/rose).
- `MiniDeckPanel` retiré de `LeftPanel.tsx` pendant l'étape 6b.
- `MainContent.tsx` rend `InvestissementPanel` à `etapeTour === 6 && subEtape6 === "investissement"`.

**Volet 2 ✅ (multi-investissements)**
- `useGameFlow.ts` :
  - Nouveau state `pioche6b: CarteDecision[] | null` mémoïse la pioche tirée à l'entrée en 6b et la reset à la sortie (`useEffect`).
  - `cartesDisponibles` lit `pioche6b ?? []` en 6b, garde le calcul live ailleurs.
  - `launchDecision` accepte un `carteArg?: CarteDecision` optionnel pour synchronicité (passé en click handler).
  - `confirmActiveStep` ajoute un branch dédié `etapeTour === 6 && subEtape6 === "investissement"` qui retourne au panneau au lieu d'avancer à l'étape 7.
  - Après chaque investissement validé : retrait manuel de la carte de `pioche6b`.
- Sortie de l'étape 6b uniquement via le bouton "Terminer →" du panneau (`onSkipDecision`).

**Volet 3 ✅ (cession d'occasion)**
- Moteur (`packages/game-engine/src/engine.ts` + duplicat `apps/web/lib/game-engine/engine.ts`) :
  - Nouvelle fonction `vendreImmobilisation(etat, joueurIdx, nomImmo, prixCession)` qui :
    1. Refuse "Autres Immobilisations" et les noms inconnus / prix négatif
    2. Lit la VNC = `actif.valeur` (le moteur amortit directement la VNC, pas de gross/cumul)
    3. Crédite la trésorerie (mutation directe pour cibler le bon actif)
    4. Splice le bien hors du tableau `bilan.actifs`
    5. Logge plus-value sur `revenusExceptionnels` ou moins-value sur `chargesExceptionnelles`
- 7 tests unitaires ajoutés dans `packages/game-engine/tests/engine.test.ts` couvrant : plus-value, moins-value, cession à la VNC, refus "Autres Immobilisations", refus introuvable, refus prix négatif, vente bien totalement amorti (VNC=0).
- UI : sous-composant `CarteCession` dans `InvestissementPanel.tsx` avec stepper (pas de 500 €), prix par défaut = 80% VNC arrondi, aperçu plus/moins-value en temps réel, bouton orange "Vendre". Section "Vente d'occasion" (icône Tag, accent orange) listée avant les sections d'investissement.
- Handler `handleVendreImmobilisation` dans `useGameFlow.ts` symétrique à `handleInvestirPersonnel`, propage l'`activeStep` au système de validation comptable progressive avec un override titre/icône/description spécifique cession.
- Câblage `page.tsx → MainContent → InvestissementPanel` via la nouvelle prop `onVendreImmobilisation`.

**Leçons capturées dans tasks/lessons.md**
- L31 : rebuild obligatoire de `packages/game-engine` après ajout d'export — sinon `apps/web` voit `dist/` désynchronisé (TS2305 + cascades TS7006).
- L32 : pioche aléatoire d'un panneau persistant doit vivre en `useState`, pas en calcul de render.
- L33 : `confirmActiveStep` ne doit pas avancer l'étape quand l'étape autorise plusieurs actions consécutives.
- L34 : pour cibler un bien nommé du bilan, manipuler directement `joueur.bilan.actifs` au lieu de passer par `appliquerDeltaPoste` qui route les deltas par catégorie.

**À faire par Pierre (validation manuelle)**
- Lancer une partie solo, atteindre l'étape 6b et : (a) investir dans 2 cartes successives, (b) vendre une Camionnette à 6 400 € (80% VNC = +0), (c) vérifier que la cession apparaît au CR en revenus/charges exceptionnels, (d) cliquer "Terminer →".

---

## Tâche 10 : Déséquilibre bilan + badges avant/après — 2026-04-11

### Contexte
Pierre signale deux bugs UX dans l'affichage progressif des écritures comptables :
1. **Déséquilibre intermédiaire** : entre l'écriture "trésorerie −500" et "emprunts −500" du remboursement, le bilan affiche "⚠️ Déséquilibre : écart −500" car les deux demi-écritures d'une transaction sont appliquées séparément.
2. **Badges avant/après manquants ou erronés** : le badge "7600 → 7100" n'apparaît pas toujours (absent pour achat et décisions, ou montre le premier mouvement au lieu du dernier quand un poste est modifié plusieurs fois).

### Corrections

#### 10.1 — Atomicité comptable (`applyEntry` dans useGameFlow.ts)
- [x] Importer `getTotalActif`, `getTotalPassif` depuis `@jedevienspatron/game-engine`
- [x] Modifier `applyEntry` : après avoir marqué l'écriture cliquée, auto-appliquer les suivantes jusqu'à ce que `getTotalActif === getTotalPassif` (bilan équilibré)
- [x] Le moteur étant correct, le bilan est toujours équilibré en état final → toute transaction multi-ligne converge en ≤ N itérations

#### 10.2 — Badges précis (`effectiveRecentMods` dans useGameFlow.ts)
- [x] Filtrer `recentModifications` par INDEX (pas par poste) : `recentModifications.filter((_, i) => activeStep.entries[i]?.applied === true)`
- [x] Garantit que le badge reflète l'écriture EXACTE la plus récente (ex : "7600→7100" pour le remboursement, pas "8000→7600" pour les intérêts)

#### 10.3 — `findMod` retourne le dernier match (`BilanPanel.tsx`)
- [x] Changer `mods?.find(...)` → `.filter(...).at(-1)` pour retourner le DERNIER mod d'un poste
- [x] Couvre le cas où tresorerie est modifiée 3 fois dans l'étape 0

#### 10.4 — Badges absents pour achat et décisions
- [x] Ajouter `setRecentModifications(modsFiltrees.map(...))` dans `launchAchat`
- [x] Ajouter `setRecentModifications(modsFiltrees.map(...))` dans `launchDecision`
- [x] Ajouter `setRecentModifications(modsFiltrees.map(...))` dans `handleInvestirPersonnel`

#### 10.5 — Badge immobilisations (BilanPanel.tsx)
- [x] Supprimer la division `totalDelta / nItems` (donne -667 sur des items à 0)
- [x] Amortissement (totalDelta < 0) : badge UNIQUEMENT sur items avec `a.valeur > 0`, taux fixe −1 000 €/bien
- [x] Investissement (totalDelta > 0) : badge UNIQUEMENT sur "Autres Immobilisations"

#### 10.6 — Validation
- [x] `npx tsc --noEmit` dans `apps/web` → 0 erreur (vérifié après chaque groupe de corrections)

---

## Tâche 9 : Achat stock en milliers + baisse remboursement emprunt — 2026-04-10

### Contexte
Pierre signale deux soucis dans le moteur de jeu :
1. **Achat stock** : ligne 470 `push("stocks", quantite)` + `push("tresorerie", -quantite)` → 1 unité coûte 1€ au lieu de 1000€. Bug silencieux préexistant car les cartes (+5000, +2000) et le bilan initial (stocks 4000€) travaillaient déjà en euros → incohérence vente/cartes.
2. **Remboursement emprunt** : 1000€/trim trop lourd en charges fixes → baisser à 500€/trim.

### Décisions validées par Pierre
- Prix unitaire marchandise = **1 000 €** (constante `PRIX_UNITAIRE_MARCHANDISE`)
- Remboursement emprunt = **500 €/trimestre**
- UI achat = stepper +/− avec affichage total en direct

### Implémentation
#### 9.1 — Constantes (types.ts x2)
- [x] `packages/game-engine/src/types.ts` : `export const PRIX_UNITAIRE_MARCHANDISE = 1000`
- [x] `packages/game-engine/src/types.ts` : `REMBOURSEMENT_EMPRUNT_PAR_TOUR = 500` (au lieu de 1000)
- [x] `apps/web/lib/game-engine/types.ts` : mêmes changements (duplicat)

#### 9.2 — Engine : achat (engine.ts x2)
- [x] `appliquerAchatMarchandises` : `push("stocks", quantite * PRIX_UNITAIRE_MARCHANDISE)` + `push("tresorerie", -quantite * PRIX_UNITAIRE_MARCHANDISE)` (ou `dettes` +même montant)
- [x] Libellé : "Achat de N unité(s) de marchandises (N × 1000 €)"
- [x] Idem dans `apps/web/lib/game-engine/engine.ts`

#### 9.3 — Engine : vente (cohérence comptable)
- [x] `appliquerCarteClient` : `push("stocks", -PRIX_UNITAIRE_MARCHANDISE)` au lieu de `-1`
- [x] `appliquerCarteClient` : `push("achats", PRIX_UNITAIRE_MARCHANDISE)` au lieu de `+1`
- [x] Vérification stock : `if (stocks < PRIX_UNITAIRE_MARCHANDISE)` au lieu de `< 1`
- [x] Idem dans `apps/web/lib/game-engine/engine.ts`

#### 9.4 — Tests unitaires à mettre à jour
- [x] Test "charges fixes" ligne 83 : `- 1000` → `- 500` (remboursement)
- [x] Test "remboursement d'emprunt" ligne 107 : `- 1000` → `- 500`
- [x] Test "Vente Particulier" ligne 126 : `stocksBefore - 1` → `stocksBefore - 1000`
- [x] Test "Vente Particulier" ligne 127 : `charges.achats === 1` → `=== 1000`
- [x] Test "Vente TPE" ligne 144 : `charges.achats === 1` → `=== 1000`
- [x] Test "Vente Grand Compte" ligne 161 : `charges.achats === 1` → `=== 1000`
- [x] Libellés des describe() mis à jour (cosmétique)

#### 9.5 — UI : stepper d'achat (LeftPanel.tsx)
- [x] Remplacer `<input type="number">` par un stepper `− [qte] +` dans `apps/web/components/jeu/LeftPanel.tsx`
- [x] Afficher sous le stepper : "Coût : {qte × 1000} €"
- [x] Clamper qte à [0, 10]
- [x] Conserver l'accessibilité (aria-label, keyboard)

#### 9.6 — Validation
- [x] `npm test` dans packages/game-engine → 32/32 verts
- [x] `npx tsc --noEmit` dans apps/web → 0 erreur
- [x] Mise à jour `tasks/lessons.md` avec leçon L26 (incohérence unités/euros silencieuse)

### Risques identifiés
- Les cartes décision existantes utilisent déjà des deltas 1000/2000/5000 sur `stocks` → OK, cohérent avec la nouvelle unité
- `entreprises.ts:58` : +1000 stocks à l'init d'une entreprise → OK, c'est 1 unité dans la nouvelle échelle
- Éventuels tests de simulation (`simulate.js`, `scripts/simulate-codex.ts`) à vérifier si utilisés

---

# Tâches historiques — mis à jour 2026-03-22

## Tâches précédentes ✅ TERMINÉES
- Tâche 1 : GameMap v2 — déployé
- Tâche 2 : Build fixes (React 18, ESLint, CVE Next.js)
- Tâche 3 : Dark mode + Auth + Business model Stripe (volets 1/2/3)

---

## Tâche 4 : Stripe + Domaine + Corrections UX — 2026-03-22

### 4.1 — Stripe ✅
- [x] 7 produits Stripe créés (individuel-5/10/20, org-80/150/300/1000)
- [x] Migration 005 : stripe_price_id pour les 7 packs en base Supabase
- [x] Route /api/stripe/checkout (lazy Stripe client)
- [x] Route /api/stripe/webhook (checkout.session.completed → crédits)
- [x] Page /dashboard/packs avec boutons Acheter + messages succès/erreur
- [x] STRIPE_WEBHOOK_SECRET configuré sur Vercel
- [x] NEXT_PUBLIC_APP_URL = https://jedevienspatron.fr sur Vercel

### 4.2 — Domaine jedevienspatron.fr ✅
- [x] Domaine ajouté sur Vercel (projet jedevienspatron-web)
- [x] DNS OVH configurés : A @ → 76.76.21.21, www CNAME → cname.vercel-dns.com.
- [x] Supabase Site URL + Redirect URLs mis à jour
- [ ] Vérifier propagation DNS (attendre ✅ verts sur Vercel)

### 4.3 — Corrections bugs ✅
- [x] Fix email redirect : window.location.origin → NEXT_PUBLIC_APP_URL
- [x] Fix trimestres : 4/6/8 → 6/8/10/12 (+15 min par tranche de 2)
- [x] Fix navigation : bouton "Acheter des sessions" dans dashboard
- [x] Fix lien "Acheter des sessions" quand crédits insuffisants

### 4.4 — Bypass codes ✅
- [x] Codes TEST0001–TEST0010 créés (1 utilisation chacun)
- [x] Code AIRWEEK1 illimité (usage interne Pierre)
- [x] Code CLASSE01 (5 utilisations) + DEMO2026 (1 utilisation)

---

## Tâche 5 : À faire — priorités restantes

### 5.1 — Test Stripe end-to-end
- [ ] Tester achat avec carte 4242 4242 4242 4242
- [ ] Vérifier crédits incrémentés après paiement
- [ ] Mettre à jour URL webhook Stripe → https://jedevienspatron.fr/api/stripe/webhook

### 5.2 — Dashboard formateur ✅
- [x] Page suivi apprenants : player_name + room_code + score par session (déjà existante : /dashboard/sessions/[id]/page.tsx)

### 5.3 — Bloquer jeu individuel sans inscription ✅
- [x] Middleware : si accès /jeu sans session ET sans bypass code → redirect login
- [x] Homepage "Je joue seul" → lien vers login + texte "Compte requis"
- [x] Vérif crédits AVANT de lancer la partie (appel /api/sessions au démarrage solo)

---

## Tâche 6 : Corrections Citadel engine.ts — 2026-03-26

### 6.1 — CRITICAL ✅
- [x] `verifierFinTour` : supprimé `appliquerDeltaPoste(joueur, "decouvert", pénalité)` (spirale exponentielle découvert)
- [x] Appliqué dans `packages/game-engine/src/engine.ts` ET `apps/web/lib/game-engine/engine.ts`

### 6.2 — WARNING ✅
- [x] `tirerCartesDecision` : recharge pioche AVANT splice (évite retour incomplet)
- [x] `appliquerDeltaPoste` : throw Error au lieu de console.warn silencieux pour poste inconnu
- [x] `makePush()` helper : extraction de la closure dupliquée dans 6 fonctions
- [x] `CARTE_IDS` : constantes centralisées, 6 IDs remplacés (commercial-junior, affacturage, formation, remboursement-anticipe, levee-de-fonds, assurance-prevoyance)
- [x] Appliqué dans les 2 fichiers engine.ts

### 6.3 — INFO ✅
- [x] Suppression boucle `for (let i = 0; i < 1; i++)` dans `genererClientsParCommerciaux`

### 6.4 — SKIPPED (trop risqué)
- [ ] Renommage propriétés accentuées (`effetsImmédiats`, `publicitéCeTour`) — 50+ occurrences, impact cross-file

### 6.5 — Vérification ✅
- [x] `npx tsc --noEmit` game-engine : 0 erreur
- [x] `npx tsc --noEmit` apps/web : erreurs pré-existantes uniquement (stripe.ts, utils.ts, supabase)

---

## Review finale
- [ ] Test complet flux achat Stripe (carte test)
- [ ] Test flux formateur (créer session → distribuer code → apprenants jouent)
- [ ] Test flux bypass code (TEST0001 → jouer → code épuisé)
- [ ] DNS jedevienspatron.fr propagé et ✅ sur Vercel
- [ ] Stripe webhook URL → jedevienspatron.fr

---

## Tâche 23 : Session security + localStorage persistence — 2026-04-14 ✅

### Contexte
Pierre a corrigé le business model : 1 crédit = 1 code = 1 apprenant = 1 partie unique.
Deux besoins : (A) empêcher un apprenant de rejouer après refresh (sécurité serveur), (B) restaurer la partie après un refresh accidentel (localStorage).

### Implémentation

**Route API (A)** :
- [x] `POST /api/sessions/[code]/start` : `waiting→playing` (200), déjà `playing` (208), `finished` (403)
- [x] `PATCH /api/sessions/[code]/start` : marque `finished` + `finished_at` en fin de partie
- [x] Guard atomique `.eq("status", "waiting")` sur l'update pour éviter race conditions

**Hook useGamePersistence (A+B)** :
- [x] `SavedGame { version, savedAt, roomCode, phase, etat }` avec TTL 24h + versioning
- [x] Effect 1 : init — local save → restore | pas de save → POST /start → handle 200/208/403
- [x] Effect 2 : sauvegarde continue pendant `playing`/`intro`
- [x] Effect 3 : gameover → clearSave + PATCH /start + remove pending key
- [x] `persistenceReady` exporté pour spinner dans page.tsx
- [x] `restoredGame` exporté (consommé via useEffect dans page.tsx)
- [x] `sessionBlocked` exporté pour écrans d'erreur
- [x] Solo : KEY_SOLO_PENDING pour retrouver le roomCode après refresh sans URL param

**page.tsx** :
- [x] Spinner tant que `!persistenceReady` (évite flash setup)
- [x] Écran "Session terminée 🔒" si `sessionBlocked === "finished"`
- [x] Écran "Session déjà en cours ⚠️" si `sessionBlocked === "playing"`
- [x] `useEffect` sur `persistence.restoredGame` → `setPhase` + `setEtat`

**TypeScript** :
- [x] apps/web : 0 erreur
- [x] game-engine : 0 erreur

---

## 🐛 2026-04-19 — Fixes post-test manuel Vague 2 (Tâche 24)

Pierre teste Vague 2 Défis du dirigeant sur 6 trimestres (commit `8cc38cc` déjà pushé).
Deux issues rapportées pendant le test.

### Fix #1 — Bug 4 ventes au lieu de 2 au T1 (bug antérieur, pas une régression V2)

**Constat** :
- Entreprise : Belvaux production
- Étape 4, T1 : 4 ventes distinctes au lieu des 2 attendues (1 commercial junior = 2 clients)

**Cause racine** : `packages/game-engine/src/engine.ts` L272-275 pré-chargeait 2 clients
Particuliers dans `clientsATrait` à la création du joueur, et à l'étape 3 le Commercial Junior
par défaut AJOUTAIT 2 clients supplémentaires (spread, pas override). Total T1 : 2+2=4.

**Fix** : remplacer le pré-chargement par `clientsATrait: []`. Le Commercial Junior
génère déjà ses 2 clients à l'étape 3.

**Fichier modifié** :
- [x] `packages/game-engine/src/engine.ts` L272-275 → `clientsATrait: []` + commentaire explicatif
- [x] `packages/game-engine/dist/engine.js` recompilé via `npx tsc`

**Tests** :
- [x] 74 tests game-engine passent (calibrage, catalogue-v2, defis, timing)
- [x] `engine.test.ts` a des erreurs de compilation pré-existantes (non liées au fix)

### Fix #2 — Bouton "Passer →" étape 6b pas assez visible (UX)

**Constat** : après un investissement ou lors du renoncement, le bouton "Passer" en
`bg-white/10` se confond avec le fond sombre → Pierre ne voit pas l'option pour skipper.

**Fix** : appliquer la palette amber (déjà utilisée dans la section Logistique & Innovation
du même panel) pour créer cohérence + visibilité :
```
bg-amber-500 text-slate-950 font-bold
border border-amber-300/60 ring-2 ring-amber-300/50 shadow-lg shadow-amber-500/40
hover:bg-amber-400
```

**Fichier modifié** :
- [x] `apps/web/components/jeu/InvestissementPanel.tsx` L390-398 (bouton en-tête "Passer →")
- [x] `apps/web/components/jeu/InvestissementPanel.tsx` L491-500 (bouton bas "Passer cette étape →")

### Vérifications

- [x] `cd packages/game-engine && npx tsc` → build dist/ OK
- [x] `cd apps/web && npx tsc --noEmit` → 0 régression liée à mes modifs
- [x] 74/74 tests game-engine passent
- [x] `tasks/lessons.md` : ajout L46 (pré-chargement redondant) + L47 (CTA secondaire)

### À faire côté Pierre

- [ ] Commit + push depuis le Mac (VM ne peut pas supprimer `.git/index.lock`)
- [ ] Retester T1 Belvaux production → confirmer 2 ventes (attendu)
- [ ] Valider visuellement le contraste du bouton Passer amber (étape 6b)
- [ ] Continuer le test 6 trimestres avec le flag `?defis=1`

### Message de commit suggéré

```
fix(game): bug 4 ventes au T1 + UX bouton Passer étape 6b

- Supprime le pré-chargement de 2 clients Particuliers dans creerJoueur
  (packages/game-engine/src/engine.ts L272-275) qui créait un doublon
  avec les 2 clients générés par le Commercial Junior par défaut à l'étape 3.
  Au T1 : 2 ventes au lieu de 4 ventes distinctes.

- Met en surbrillance amber les 2 boutons "Passer" de l'étape 6b
  Investissement pour éviter qu'ils se confondent avec le fond sombre.
  Cohérent avec la palette Logistique & Innovation du même panel.

- Documente dans lessons.md L46 (pré-chargement redondant) + L47 (CTA).
```

---

## 🌊 2026-04-19 — Vague 3 (Tâche 24) — Refonte `DefiDirigeantScreen`

### Périmètre de cette session

Ordre voulu par Pierre : **variante courte/longue → palette par tonalité → (clôture + journal : sessions suivantes)**.

### Livraisons

#### 1. Mini-catalogue étendu (`packages/game-engine/src/data/defis/catalogue-v2.ts`)
- [x] Ajout de `DEFI_T4_CREDIT_CLIENT` (archétype `choix_arbitrage`, tonalité `tresorerie`, 3 choix avec trade-off ventes/trésorerie/créances C+1 / C+2)
- [x] Ajout de `OBSERVATION_T5_CREANCE_DOUTEUSE` (archétype `consequence_differee`, tonalité `risque`, principe de prudence : créance sort / charge entre à valeur absolue égale)
- [x] `CATALOGUE_V2` contient 6 défis et couvre 5 archétypes + 4 tonalités (tresorerie, risque, positionnement, null)

#### 2. Helper palette par tonalité (`apps/web/components/jeu/utils.ts`)
- [x] Type `TonaliteDefi` miroir de game-engine + `PaletteTonalite` (9 champs de classes Tailwind)
- [x] 6 constantes palette déclarées en dur (contrainte JIT Tailwind : pas de classe construite) : PALETTE_EMERALD (tresorerie), PALETTE_SKY (capacite), PALETTE_VIOLET (financement), PALETTE_ROSE (risque), PALETTE_INDIGO (positionnement), PALETTE_SLATE (null)
- [x] Fonction `getPaletteTonalite(tonalite)` : switch explicite, defaulte sur slate

#### 3. Refonte de `DefiDirigeantScreen.tsx` (`apps/web/components/jeu/`)
- [x] Routage archétype → variante via `variantePourArchetype()` (seul `palier_strategique` → `longue`, tout le reste → `courte`)
- [x] Variante **courte** : enchaînement linéaire choix → validation → pédagogie, palette appliquée partout (overlay, header, hover, bouton valider)
- [x] Variante **longue** : sous-composant `BilanProjectif` qui liste pour chaque choix les effets Maintenant et dans N trimestres, avec sous-composant `EffetsList` (poste + delta signé ±, vert si +, rouge si −)
- [x] Badge dynamique à côté du titre par archétype (Observation / Décision rapide / Conséquence / Alerte / Décision stratégique / Clôture d'exercice)

### Tests

- [x] `packages/game-engine/tests/catalogue-v2.test.ts` étendu : 27 tests (vs 18 avant), couvre explicitement les 2 nouveaux défis + sémantique comptable (monotonie CA, principe de prudence, trade-off BFR)
- [x] `apps/web/components/jeu/__tests__/palette.verify.ts` — script d'assertion autonome (pas de jest dans apps/web) : vérifie que les 6 tonalités retournent des palettes complètes, distinctes, et correctement mappées. Compilation + exécution runtime validées.
- [x] **Suite jest complète** : 84 tests passent (10 nouveaux). Les erreurs `engine.test.ts` sont pré-existantes (non liées à Vague 3).

### Vérifications

- [x] `cd packages/game-engine && npx tsc` → dist/ recompilée (new defis visibles dans `dist/data/defis/catalogue-v2.js`)
- [x] `cd apps/web && npx tsc --noEmit` → aucune nouvelle erreur sur `DefiDirigeantScreen`, `utils`, `__tests__/palette.verify`. Erreurs lucide/recharts pré-existantes (Tâche 6.5)
- [x] `npx jest` dans game-engine → 84/84 verts sur les suites qui compilent
- [x] Palette runtime : `✓ 6 tonalités validées, 9 champs par palette, 5 overlay distincts`

### Reste à faire (priorité Pierre, sessions suivantes)

- [ ] Variante **clôture** (archétype `cloture`) — bilan consolidé + calcul IS + réserve légale + affectation du résultat
- [ ] `JournalDefis.tsx` — chronologie des défis résolus + arcs différés en cours dans `RightPanel`
- [ ] Écriture narrative complète (Vague 4) : 27 défis couvrant 7 archétypes × 5 tonalités

### À faire côté Pierre

- [ ] Commit + push depuis le Mac
- [ ] Tester visuellement les variantes avec `?defis=1` sur une partie 6 trim : observation T1/T2 (slate), choix_binaire T3 marché (indigo), palier T3 positionnement (indigo, variante longue), arbitrage T4 crédit (emerald), consequence_differee T5 créance (rose)
- [ ] Valider que la palette se lit : tresorerie reconnaissable au premier coup d'œil sans lire le titre

### Message de commit suggéré

```
feat(defis): Vague 3 — variantes courte/longue + palette par tonalité

- DefiDirigeantScreen.tsx : routage archétype → variante, palette
  par tonalité appliquée partout (overlay, header, hover, valider),
  sous-composant BilanProjectif pour palier_strategique qui liste
  effets Maintenant + Dans N trimestres avec EffetsList signée.

- utils.ts : types TonaliteDefi / PaletteTonalite + 6 palettes
  hardcodées (contrainte JIT Tailwind) + getPaletteTonalite().

- catalogue-v2.ts : +2 défis (DEFI_T4_CREDIT_CLIENT tresorerie,
  OBSERVATION_T5_CREANCE_DOUTEUSE risque) pour couvrir plus
  d'archétypes et tonalités en test.

- tests/catalogue-v2.test.ts : 27 tests (vs 18), sémantique
  comptable des 2 nouveaux défis (monotonie CA, principe de
  prudence, trade-off BFR).

- __tests__/palette.verify.ts : assertion runtime autonome des
  6 tonalités × 9 champs (5 overlay distincts).

Documente lessons.md L48 (routage archétype → variante + palette).
```

---

## 🛠️ 2026-04-20 — Ajustements UX / bugs post-T25.C (Phase 4)

### Déclencheur

Partie manuelle Belvaux T1→T3 + smoke Synergia T1 (Phase 4 de T25.C). 7 défauts relevés, rangés en 3 bugs (B1/B2/B3) + 4 améliorations UX (U1/D1/U2/U3). Plan validé par Pierre dans l'ordre ci-dessous.

### Livraisons

| # | Chantier | Nature | Fichiers touchés | Statut |
|---|---|---|---|---|
| B1 | Bandeau découvert — "FAILLITE" → "FAILLITE PRÉVISIBLE" + seuils sur % de `DECOUVERT_MAX` | Bug libellé + dérivation de seuils | `AlerteDecouvert.tsx` | ✅ |
| B2 | Basculement trésorerie négative → découvert bancaire en fin de clôture (invariant : trésorerie finale ≥ 0) | Bug moteur | `engine.ts`, `useAchatFlow.ts`, `cycle-shape.test.ts`, `index.ts`, `dist/` | ✅ |
| B3 | Libellé étape Achats : "Paiement des commerciaux" résiduel du cycle 9 étapes → description correcte | Bug libellé (séquelle L52) | `MainContent.tsx` | ✅ |
| U1 | Nettoyage libellés 6A / 6B → "Sous-étape Recrutement / Investissement" | UX cohérence | `MainContent.tsx`, `LeftPanel.tsx`, `InvestissementPanel.tsx`, `useDecisionCards.ts` | ✅ |
| D1 | 3 boutons Passer en amber-500/300 ring (cohérence CTA secondaire) | UX lisibilité | `MainContent.tsx`, `LeftPanel.tsx`, `CompanyIntro.tsx` | ✅ |
| U2 | Fil d'Ariane — refonte 3 états (current cyan / done emerald / upcoming slate) + `aria-current="step"` | UX hiérarchie visuelle | `LeftPanel.tsx` | ✅ |
| U3 | Modales pédago consultables : 1) mount `<ModalEtape>` manquant ; 2) ETAPE_CONFIG remappé 0→7 ; 3) clic sur étape franchie rouvre la modale | Bug + UX | `ModalEtape.tsx`, `page.tsx`, `LeftPanel.tsx` | ✅ |

### Vérification

- `npx tsc --noEmit` (apps/web) : **152 erreurs, baseline strict inchangé** (aucune régression introduite dans tout le lot)
- `npx jest` (game-engine) : **118 tests verts** (116 baseline + 2 tests de basculement trésorerie)
- Relecture manuelle : bandeau découvert clair, CTA visibles, fil d'Ariane lisible à distance, modales pédagogiques accessibles au clic

### Reste à faire côté Pierre

- [ ] Appliquer les 2 commits depuis le Mac (messages rédigés dans la session, split : B1+B2 puis B3+U1+D1+U2+U3)
- [ ] Re-tester une partie Belvaux T1→T6 pour confirmer que le bandeau "FAILLITE PRÉVISIBLE" ne clignote plus abusivement en cours de cycle

### Leçons tirées

- L53 — `DECOUVERT_MAX` en euros, pas en parts : dériver les seuils visuels en % de la constante plutôt qu'en valeurs magiques
- L54 — Un composant exporté ≠ un composant monté : après refactor, grep `<ComponentName` (ou `import ComponentName`) pour valider le wiring complet
- L55 — Remapper les mappings visuels, pas seulement les libellés : quand on renumérote un cycle, `ETAPE_CONFIG` (icônes / couleurs) est aussi indexé par numéro — le rater laisse la modale avec le "thème" de l'ancienne étape

---

## 🛠️ 2026-04-21 — Bugs post test-play B6 (Pierre a testé une partie complète)

### Déclencheur

Après push de B6-B (commit `ed5f88b` — UI fin d'exercice livrée), Pierre a fait une partie test et remonté 3 bugs + 1 demande pédagogique. Traitement direct (pas de re-planification demandée par Pierre : « non traite les 3 directement »).

### Livraisons

| # | Chantier | Nature | Fichiers touchés | Statut |
|---|---|---|---|---|
| B7-A | Bouton « Investir » relance client silent fail → filtrage anti-doublon côté UI pour les cartes non-commerciales déjà actives | Bug UI (silent fail) | `apps/web/app/jeu/hooks/useDecisionCards.ts` | ✅ |
| B7-B | Bouton « Annuler » ne libère pas l'état complet de la décision → chaîner setPendingConfirm(false) + setSelectedDecision(null) + onCancelStep() | Bug UI | `apps/web/components/jeu/LeftPanel.tsx` | ✅ |
| B7-C | Bilan déséquilibré après clôture avec perte massive : `appliquerDeltaPoste` plafonne capitaux à 0 (`Math.max(0, …)`). Fix : mutation directe de `capitaux.valeur` dans `appliquerClotureExercice`, sans plancher. | Bug moteur (invariant Actif=Passif) | `packages/game-engine/src/engine.ts`, `packages/game-engine/tests/clotureExercice.test.ts`, `dist/` | ✅ |
| B7-D | Glossaire — entrée « Report à nouveau » expliquant créditeur vs débiteur, avec rappel art. L.223-42 Code de commerce (procédure d'alerte) | UX pédagogique | `apps/web/components/GlossairePanel.tsx` | ✅ |

### Vérification

- `npx jest` (game-engine) : **148 tests verts** (27/27 clôture exercice, dont le nouveau test `Perte > capitaux propres initiaux` qui reproduisait B7-C sans le fix)
- `npx tsc --noEmit` (apps/web) : baseline TS2786 inchangée (erreurs pré-existantes React 18/19 + lucide-react/recharts non liées à B7)
- `npm run build` (game-engine) : dist/ recompilé sans erreur
- Test de reproduction B7-C ajouté AVANT le fix : écart observé 3 000 € = (|perte 22 000| − capitaux_initial 19 000), exactement la signature du bug. Après fix : 0 € d'écart, capitaux propres = −3 000 € comme attendu.

### Reste à faire côté Pierre

- [ ] Pull + push des commits depuis le Mac (pas depuis le VM)
- [ ] Rejouer une partie jusqu'au premier exercice clos pour confirmer que (1) Investir est cliquable une seule fois par carte non-commerciale, (2) Annuler ramène au choix de cartes, (3) bilan équilibré même en cas de grosse perte, (4) la nouvelle entrée « Report à nouveau » s'affiche dans le glossaire

### Leçons tirées

- L-B7-A — Silent fail moteur = bug UI : si un handler renvoie `messageErreur` invisible, filtrer en amont pour rendre l'option non cliquable
- L-B7-B — Tout `onCancel` doit libérer TOUT l'état de l'étape, pas seulement une modale locale
- L-B7-C — `appliquerDeltaPoste` plafonne les passifs à 0 : inadapté aux capitaux propres en situation de crise. Muter directement pour les postes structurels avec contrepartie explicite dans `modifications`
- Meta — Un subagent peut se tromper de diagnostic. Vérification numérique manuelle obligatoire + test de reproduction qui PASSE seulement après le fix
