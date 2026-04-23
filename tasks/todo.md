# Tâches JE DEVIENS PATRON — mis à jour 2026-04-23

---

## T25.C-RESTART — Réordonnancement 9→8 étapes (RÉELLEMENT cette fois) — 2026-04-21 🚧

### Contexte
Les tâches T25.C Commit 2 (renommage `ETAPES`) et Commit 3 (réordonnancement 9→8 étapes) sont marquées *completed* dans la todo-list historique, mais **le code `main` ne reflète aucune de ces deux refontes** :

- `packages/game-engine/src/types.ts:253` : commentaire `"Les 9 étapes d'un tour de jeu"` + union `EtapeTour = 0..8` + constantes `ETAPES = { INIT, ACHATS, COMMERCIAUX, VENTES, CHARGES, BILAN, INVESTISSEMENT, EVENEMENT, CLOTURE }` — noms **cibles T25.C** mais **ordre legacy** (incohérents entre eux : `ETAPES.COMMERCIAUX = 2` pointe vers `appliquerAvancementCreances` dans `useGameFlow.ts`).
- `engine.ts:1238` : `maxEtape = 8` (donc 9 étapes).
- `useGameFlow.ts:322-390` : switch sur 0..8 dans l'ordre legacy (charges / achats / créances / commerciaux / ventes / effets / décision / événement / bilan).
- `gameFlowUtils.ts:ETAPE_INFO` : 9 entrées legacy.
- `LeftPanel.tsx:STEP_NAMES/STEP_HELP` : 9 entrées legacy + `/9` ligne 517.
- `HeaderJeu.tsx:67,72` : `/9`.
- `useDecisionCards.ts` + `MainContent.tsx` : `etapeTour === 6` pour Décision.
- `useGamePersistence.ts:24` : `SAVE_VERSION = 1`.

Diagnostic signalé par Pierre ; confirmé par lecture directe (pas subagent — le subagent Explore a halluciné un état déjà migré, voir L-T25R-1).

### Ordre cible T25.C (CLAUDE.md)
`ENCAISSEMENTS → COMMERCIAUX → ACHATS_STOCK → VENTES → DECISION → EVENEMENT → CLOTURE_TRIMESTRE → BILAN`

### Table de correspondance ancien→nouveau
| Ancien idx | Ancien rôle (fonction moteur) | Nouvel idx | Nouveau nom |
|---|---|---|---|
| 0 | charges fixes + amortissements + emprunt (`appliquerEtape0`) | **6 (fusion)** | CLOTURE_TRIMESTRE |
| 1 | achats (user-driven) | 2 | ACHATS_STOCK |
| 2 | avancement créances (`appliquerAvancementCreances`) | 0 | ENCAISSEMENTS |
| 3 | paiement commerciaux + génération clients | 1 | COMMERCIAUX |
| 4 | cartes client / ventes (`appliquerCarteClient`) | 3 | VENTES |
| 5 | effets récurrents + spécialité | **6 (fusion)** | CLOTURE_TRIMESTRE |
| 6 | décision (sub-phases 6a/6b) | 4 | DECISION |
| 7 | événement | 5 | EVENEMENT |
| 8 | bilan fin de tour | 7 | BILAN |

Fusion 0 (ancien charges fixes) + 5 (ancien effets récurrents) → nouvelle fonction `appliquerClotureTrimestre()` qui orchestre `appliquerEtape0` + `appliquerEffetsRecurrents` + `appliquerSpecialiteEntreprise` en **un seul appel avec un seul groupe de modifications**.

### Fichiers à modifier
- [x] `packages/game-engine/src/types.ts` — union 0..7, commentaire "8 étapes", `ETAPES` réordonné
- [x] `packages/game-engine/src/engine.ts` — nouvelle fonction `appliquerClotureTrimestre()`, `maxEtape = 7`, ré-export de `creerJoueur` + `calculerCoutCommerciaux` (perdus lors du refactor graphify)
- [x] `packages/game-engine/src/index.ts` — export `appliquerClotureTrimestre`
- [x] `apps/web/app/jeu/hooks/useGameFlow.ts` — switch remappé (0..7), `AUTO_ETAPES = [0,1,3,5,6]`, skip-auto étapes 0 et 1 quand sans modifications, reset `clientsPerdusCeTour` déplacé au BILAN (étape 7)
- [x] `apps/web/app/jeu/hooks/useDecisionCards.ts` — `etapeTour === 4` pour DECISION
- [x] `apps/web/app/jeu/hooks/useAchatFlow.ts` — aucun changement (déclenché par bouton)
- [x] `apps/web/app/jeu/hooks/useGamePersistence.ts` — `SAVE_VERSION = 2` → invalide les saves v1 (pas de mappage)
- [x] `apps/web/app/jeu/hooks/gameFlowUtils.ts` — `ETAPE_INFO` 0..7 remappé
- [x] `apps/web/components/jeu/MainContent.tsx` — `etapeTour === 4` pour Décision
- [x] `apps/web/components/jeu/LeftPanel.tsx` — `STEP_NAMES` + `STEP_HELP` 8 entrées, `/8`, `=== 4` Décision, `=== 3` ventes, `=== 2` Achats, libellés 6a/6b → 4a/4b
- [x] `apps/web/components/jeu/HeaderJeu.tsx` — `/8`
- [x] `apps/web/components/jeu/EntryPanel.tsx` — `isSalesStep = etapeTour === 3`
- [x] `apps/web/components/jeu/ModalEtape.tsx` — `ETAPE_CONFIG` 8 entrées remappées, import `Briefcase` retiré
- [x] `apps/web/components/jeu/pedagogicalMessages.ts` — indexes remappés + libellé 6a → 4a
- [x] `apps/web/components/CompteResultatPanel.tsx` — conseil "étape 6 → 5" + condition `isProvisoire` remappée 0..6
- [x] `apps/web/components/EtapeGuide.tsx` — conseil "étape 6 → 5"
- [x] `apps/web/lib/game-engine/data/pedagogie.ts` — `MODALES_ETAPES` 0..7 remappées ; nouvelle étape 6 CLOTURE_TRIMESTRE avec contenu fusionné (charges fixes + effets récurrents) ; `QCM_ETAPES` inchangé (le pool est aplati, les clés n'influent pas sur le gameplay — cf. #22 T25.C Commit 4 pour la refonte QCM)
- [ ] `apps/web/lib/game-engine/types.ts` + `apps/web/app/jeu/etape-info.ts` — laissés tels quels (fichiers morts, zéro import, dead code à supprimer dans une tâche de nettoyage ultérieure)
- [ ] `packages/game-engine/tests/engine.test.ts` — tests `ETAPES` et `creerJoueur`/`calculerCoutCommerciaux` passent (exports restaurés). 2 échecs sémantiques pré-existants sur `calculerCoutCommerciaux Junior` et `genererClientsParCommerciaux` non liés au réordonnancement → tâche #45 (B8-D).

### Validation
- [x] `npx tsc --noEmit` sur `packages/game-engine` → 0 erreur (EXIT=0)
- [x] `npx tsc --noEmit` sur `apps/web` → 0 erreur (EXIT=0)
- [x] `npm test --workspace=packages/game-engine` → **37/39 verts**. Les 2 échecs sont **pré-existants sur `main`** (ils bloquaient déjà la compilation des tests avant T25.C-RESTART via TS2459 sur `creerJoueur` et `calculerCoutCommerciaux`) et sont de nature sémantique sur le modèle commercial (Junior → 1 vs 2 clients/tour, salaire récurrent ≠ 0). Ils relèvent de la tâche #45 B8-D « Tests moteur adaptés + couverture par mode » en cours.
- [x] `dist/` reconstruit via `npm run build --workspace=packages/game-engine`
- [ ] Partie solo manuelle T1 complète : ENCAISSEMENTS → COMMERCIAUX → ACHATS → VENTES → DECISION → EVENEMENT → CLOTURE → BILAN avec bilan équilibré en fin de T1 → **différée tâche #21 Phase 4**

### Review — 2026-04-21

**État avant** : les commits T25.C #14, #19, #20 étaient marqués *completed* dans la todo-list mais le code sur `main` était dans un état mixte : `ETAPES` renommé mais non réordonné, union `EtapeTour = 0..8`, switch `useGameFlow` à 9 entrées en ordre legacy. Diagnostic confirmé par lecture directe (un subagent Explore avait halluciné un état déjà migré — voir L-T25R-1).

**Ce qui a été fait** : réordonnancement complet et cohérent du cycle de 9 → 8 étapes dans l'ordre pédagogique « activité puis clôture » (ENCAISSEMENTS → COMMERCIAUX → ACHATS_STOCK → VENTES → DECISION → EVENEMENT → CLOTURE_TRIMESTRE → BILAN). Fusion des anciennes étapes 0 (charges fixes + amortissements + emprunt) et 5 (effets récurrents + spécialité entreprise) dans la nouvelle étape 6 CLOTURE_TRIMESTRE via une fonction `appliquerClotureTrimestre()` qui orchestre les trois blocs en une seule passe.

**Garde-fou saves** : `SAVE_VERSION` passé à `2` dans `useGamePersistence.ts` → toutes les sauvegardes v1 (ordre incohérent ancien/cible) sont invalidées automatiquement au chargement, ce qui évite la corruption d'une partie en cours lors de la mise à jour.

**Sous-phases DECISION** : 6a (recrutement) + 6b (investissement) renommées 4a / 4b partout (LeftPanel, MainContent, pedagogicalMessages).

**Tests** : les tests qui encodaient l'ordre ancien n'existaient pas — le suite n'encode pas d'assertion sur l'index numérique d'une étape au-delà du nommage `ETAPES.*`. Les 2 échecs restants (`calculerCoutCommerciaux = 0` et `Junior génère 1 client`) sont antérieurs à T25.C-RESTART : avant cette tâche les tests ne compilaient même pas (TS2459 sur `creerJoueur` / `calculerCoutCommerciaux`). La restauration des exports a permis aux tests de tourner et a révélé ces 2 divergences sémantiques sur le modèle commercial, qui appartiennent à la tâche #45 B8-D en cours.

**Nettoyage deferred** : les deux fichiers legacy `apps/web/lib/game-engine/types.ts` et `apps/web/app/jeu/etape-info.ts` contiennent encore le vieil `EtapeTour = 0..8` et un vieil `ETAPE_INFO` 9 entrées, mais aucun code ne les importe (dead code). À supprimer dans une tâche de nettoyage séparée pour garder ce commit focalisé sur le réordonnancement.

**Partie manuelle** : à exécuter dans la tâche #21 Phase 4 (smoke Belvaux T1–T3 + Synergia T1) par Pierre — non bloquant pour le commit car tous les indices numériques ont été vérifiés par `tsc`.

---

## Tâche 24 : Refonte concrète des 4 entreprises + 8 étapes métier (B9) — 2026-04-23 🚧

### Contexte
Le chantier B8 a commencé à différencier les entreprises au niveau de la vente et de la présentation métier, mais le cycle de trimestre reste encore trop homogène. En particulier :
- l'étape « achats de marchandises » ne raconte pas juste le métier de Véloce et Synergia ;
- Belvaux ne vit pas encore clairement le sous-cycle **matière → production → stock → vente** ;
- les commerciaux restent perçus comme le moteur universel, alors qu'ils ne devraient être qu'un levier de demande parmi d'autres.

Pierre veut une refonte **concrète** des 4 entreprises et des 8 étapes visibles du jeu, sans simple renommage cosmétique.

### Vérification pré-B9 (2026-04-23) — constat
Après T25.C-RESTART, un `grep` systématique a confirmé que **toutes les tâches B8 marquées `completed` dans la todo-list n'ont JAMAIS été committées sur `main`** : `modeleValeur`, `ModeleValeurEntreprise`, `FluxClientsEntreprise`, `clientsPassifsParTour` retournent **zéro résultat** dans `packages/` et `apps/web/`. `appliquerCarteClient` utilise encore `PRIX_UNITAIRE_MARCHANDISE` en dur (CMV uniforme pour toutes les entreprises). `CompanyIntro.tsx` ne mentionne aucun des 4 noms d'entreprises.

Conséquence : B9 absorbe l'intégralité des B8-A/B/C/E (types + polymorphisme vente + data entreprises + UI CompanyIntro) en plus de la refonte du cycle. Cf. leçon L-T25R-2 (statut *completed* ≠ commit sur `main`).

### Décisions prises (2026-04-23, validées par Pierre)

1. **Option B retenue** : on renumérote le cycle en 8 étapes visibles B9 (insertion de « Réalisation métier » en position 3, décalage VENTES→4 DECISION→5 EVENEMENT→6, fusion narrative CLOTURE+BILAN en étape 7). Coût assumé : deuxième migration, `SAVE_VERSION 2→3`, remap `useGameFlow` + modales + tests. Motif : Belvaux DOIT avoir une étape visible de fabrication avant vente ; sinon dette pédagogique permanente.
2. **Moteur clôture/bilan séparés** : `appliquerClotureTrimestre()` reste distinct de la vérification d'équilibre final. Côté UI, étape 7 narrée comme « deux temps pédagogiques » (clôture puis bilan) mais moteur fait deux passes séquentielles. L'invariant d'équilibre est vérifié APRÈS toutes les écritures de clôture, jamais pendant.
3. **B9-E absorbe le polymorphisme vente complet** (B8-A + B8-B + B8-C absents de `main`).
4. **Azura étape 3 a une vraie écriture comptable** — pas de checkpoint muet. Choix pédagogique de Pierre : l'écriture est le cœur de l'apprentissage. Format retenu : coût de canal / distribution / mise en vente, **montant fixe 300 €/trimestre** (≈ 15 % de la marge brute moyenne Azura).
5. **B9-B découpé V1/V2** : V1 = renommage « Développement commercial » + texte pédagogique (zéro mécanique) ; V2 = vraies sources de demande (trafic, contrats, réputation) sur une session distincte.
6. **Belvaux étape 3 — double écriture assumée** : consommation matière (D `achats` / C `stocks` matière) enchaînée avec constat de production (D `stocks` produits finis / C `productionStockee`). Densité comptable accrue mais fidélité PCG préservée.
7. **Véloce & Synergia — en-cours de production de services** : à l'étape 3, la prestation crée un actif « en-cours » (réutilisation de la catégorie `stocks` avec un nom dédié) contre-partie `productionStockee`. À l'étape 4, l'en-cours est extourné au moment de la facturation. Cela préserve le principe de partie double à toutes les étapes et enseigne la notion d'en-cours de production (compte PCG 34 simplifié).

### Principe de partie double — invariant non négociable
Chaque action métier = au moins une écriture Débit + une écriture Crédit de montants égaux. Aucune étape ne doit produire un mouvement unilatéral. Le bilan est vérifié équilibré (Actif = Passif) après chaque étape complète. C'est le cœur de l'apprentissage et l'argument N°1 pour rejeter toute simplification qui casserait cet invariant.

### Cycle cible B9 (Option B, renumérotation confirmée)

| Idx | Nom visible (UI) | Polymorphe ? | Moteur |
|---|---|---|---|
| 0 | Encaissements & règlements | non | commun (avancement créances + échéances dettes) |
| 1 | Développement commercial | V1 non / V2 oui | commun V1 (paiement commerciaux + clients générés) ; V2 multi-sources |
| 2 | Ressources & préparation | **OUI** | branche par `modeEconomique` |
| 3 | Réalisation métier | **OUI** | branche par `modeEconomique` |
| 4 | Facturation & ventes | **OUI** | branche par `modeEconomique` |
| 5 | Décision du dirigeant | non | commun (recrutement 5a + investissement 5b) |
| 6 | Événement & ajustement | non | commun (pioche événement + application) |
| 7 | Clôture & bilan | non | 2 passes moteur : (7a) `appliquerClotureTrimestre` puis (7b) vérif équilibre + affectation résultat + IS |

### B9-A.1 — Tableau d'écritures cibles (4 entreprises × 3 étapes polymorphes)

**Légende** :
- D = Débit (emploi) / C = Crédit (ressource)
- M, V, Q, P, S, R, T, E, D_canal = montants à calibrer dans les sous-tâches B9-C/D (pas dans ce tableau)
- Tous les postes listés existent déjà dans les types moteur — aucun ajout de poste comptable requis

| Entreprise | Étape 2 — Ressources & préparation | Étape 3 — Réalisation métier | Étape 4 — Facturation & ventes |
|---|---|---|---|
| **Belvaux** (production) | **Achat matière première (1 écriture double)**<br>D `stocks` (Matière 1ère) +M<br>C `tresorerie` −M *(ou `dettes` +M si crédit fournisseur)* | **Production du fini (2 écritures doubles enchaînées)**<br>**a.** D `achats` (consommation matière) +M′<br>     C `stocks` (Matière 1ère) −M′<br>**b.** D `stocks` (Produits finis) +V<br>     C `productionStockee` +V | **Vente produit fabriqué (2 écritures doubles enchaînées)**<br>**a.** D `tresorerie`/`creancesPlus1`/`creancesPlus2` +P<br>     C `ventes` +P<br>**b.** D `productionStockee` −V (extourne)<br>     C `stocks` (Produits finis) −V |
| **Azura** (négoce) | **Réassort marchandises (1 écriture double)**<br>D `stocks` (Marchandises) +Q<br>C `tresorerie` −Q *(ou `dettes` +Q si crédit fournisseur)* | **Coût de canal / mise en vente (1 écriture double)**<br>D `servicesExterieurs` (animation, plateforme, PLV) **+300 €**<br>C `tresorerie` **−300 €** *(ou `dettes` +300 € si crédit prestataire)*<br><br>*Calibrage : 300 € fixe = ~15 % de la marge brute moyenne Azura (~2 000 €/tour). Ordre de grandeur cohérent avec `REMBOURSEMENT_EMPRUNT_PAR_TOUR = 500`. À confirmer en B9-C.* | **Vente marchandise (2 écritures doubles enchaînées = modèle CMV actuel)**<br>**a.** D `tresorerie`/`creancesPlus1`/`creancesPlus2` +P<br>     C `ventes` +P<br>**b.** D `achats` (CMV) +Q′<br>     C `stocks` (Marchandises) −Q′ |
| **Véloce** (services logistiques) | **Préparation tournée (1 écriture double)**<br>D `servicesExterieurs` (carburant, péages, sous-traitance) +T<br>C `tresorerie` −T *(ou `dettes` +T)* | **Exécution prestation + constat en-cours (2 écritures doubles enchaînées)**<br>**a.** D `chargesPersonnel` (heures chauffeur) +E<br>     C `tresorerie` −E *(ou `dettes` +E)*<br>**b.** D `stocks` (En-cours tournée Véloce) +V_svc<br>     C `productionStockee` +V_svc<br><br>*Constat comptable : la production de service (compte PCG 34 en-cours) est valorisée au coût de production. `productionStockee` réutilisé comme compte produit contre-partie (simplification jeu).* | **Facturation + extourne en-cours (2 écritures doubles enchaînées)**<br>**a.** D `tresorerie`/`creancesPlus1`/`creancesPlus2` +P<br>     C `ventes` +P<br>**b.** D `productionStockee` −V_svc (extourne)<br>     C `stocks` (En-cours tournée Véloce) −V_svc<br><br>*L'en-cours créé à l'étape 3 est soldé au moment de la facturation : la production de service passe en vente facturée.* |
| **Synergia** (missions + licences) | **Staffing / cadrage mission (1 écriture double)**<br>D `chargesPersonnel` (heures cadrage) +S<br>C `tresorerie` −S *(ou `dettes` +S)* | **Réalisation mission + constat en-cours (2 écritures doubles enchaînées)**<br>**a.** D `chargesPersonnel` (heures exécution) +R<br>     C `tresorerie` −R *(ou `dettes` +R)*<br>**b.** D `stocks` (En-cours mission Synergia) +V_svc<br>     C `productionStockee` +V_svc<br><br>*Même principe que Véloce : en-cours de production de services valorisé au coût direct.* | **Facturation + extourne en-cours (2 écritures doubles enchaînées)**<br>**a.** D `tresorerie`/`creancesPlus1`/`creancesPlus2` +P<br>     C `ventes` +P<br>**b.** D `productionStockee` −V_svc (extourne)<br>     C `stocks` (En-cours mission Synergia) −V_svc<br><br>**Licences (optionnel, si carte licence active)** :<br>D `tresorerie` +L<br>C `produitsFinanciers` +L *(déjà géré par `appliquerSpecialiteEntreprise`)* |

**Invariants vérifiables par test unitaire**
- À la fin de chaque étape k : Σ(Débits) == Σ(Crédits) dans les modifications appliquées
- Après étape complète : `verifierEquilibreComptable(joueur)` → true
- Belvaux : après production d'une unité, `stocks` (matière) diminue ET `stocks` (produits finis) augmente ET `productionStockee` est créditée → triple cohérence
- Azura : chaque vente laisse `ventes` ≥ `achats` (marge positive normale, hors stock mort) ; étape 3 consomme 300 € fixes en `servicesExterieurs`
- Véloce / Synergia : après étape 3, `stocks` (En-cours) augmente ET `productionStockee` est créditée. Après étape 4 : `stocks` (En-cours) redescend à 0 ET `productionStockee` est extournée. Cycle complet à `productionStockee` nette = 0 à la fin du trimestre (si toutes les prestations sont facturées sur le même trimestre — sinon l'en-cours traverse la clôture, ce qui est correct en PCG).

**Postes comptables utilisés — tous existants dans `packages/game-engine/src/types.ts`**
- Actifs : `tresorerie`, `stocks` (discriminé par le champ `nom` du `PosteActif`, y compris les en-cours de services), `creancesPlus1`, `creancesPlus2`, `immobilisations`
- Passifs : `dettes`, `capitaux`, `emprunts`, `dettesD2`, `dettesFiscales`, `decouvert`
- CR charges : `achats`, `servicesExterieurs`, `chargesPersonnel`, `chargesInteret`, `chargesExceptionnelles`, `dotationsAmortissements`, `impotsTaxes`
- CR produits : `ventes`, `productionStockee` *(utilisé à la fois pour les produits finis Belvaux ET comme compte contre-partie des en-cours de services Véloce/Synergia — simplification PCG)*, `produitsFinanciers`, `revenusExceptionnels`

**Discrimination des stocks par nom** (pas de refactor moteur)
- Un `PosteActif` de catégorie `stocks` avec `nom` distinct → le moteur traite chaque ligne indépendamment via `find((a) => a.nom === ...)`. Aucun ajout de type requis.
- **Belvaux** démarre avec deux lignes `stocks` : `"Matière première Belvaux"` (init 0 ou faible) et `"Produits finis Belvaux"` (init 0). L'étape 2 alimente la Matière 1ère ; l'étape 3 transfère vers Produits finis ; l'étape 4 extourne les Produits finis.
- **Azura** démarre avec une ligne `stocks` : `"Marchandises Azura"` (init selon bilan cible).
- **Véloce** démarre avec une ligne `stocks` : `"En-cours tournée Véloce"` (init 0). Étape 3 alimente, étape 4 extourne.
- **Synergia** démarre avec une ligne `stocks` : `"En-cours mission Synergia"` (init 0). Étape 3 alimente, étape 4 extourne.

**Branchement moteur requis** (à implémenter en B9-C, B9-D, B9-E)
```ts
// Nouveau champ dans EntrepriseTemplate + Joueur
type ModeEconomique = "production" | "négoce" | "logistique" | "conseil";

// Dispatch par étape polymorphe
function appliquerEtape2(etat, j): ResultatAction {
  switch (etat.joueurs[j].modeEconomique) {
    case "production": return appliquerEtape2Belvaux(etat, j);
    case "négoce":     return appliquerEtape2Azura(etat, j);
    case "logistique": return appliquerEtape2Veloce(etat, j);
    case "conseil":    return appliquerEtape2Synergia(etat, j);
  }
}
// Idem appliquerEtape3, appliquerCarteClient (étape 4)
```

**Hors périmètre B9-A.1** — traité en sous-tâches dédiées
- Calibrage exact des montants M, V, Q, P, S, R, T, E, V_svc (→ B9-C/D). **D_canal Azura tranché à 300 € fixe.**
- Tests unitaires moteur par entreprise (→ B9-H)
- Libellés pédagogiques et UI contextualisée (→ B9-G)
- Sources multi-demande (→ B9-B V2)

### Étapes cibles B9 — tableau simplifié (reprise)

| Étape | Nom cible | Intention commune | Polymorphe ? |
|---|---|---|---|
| 0 | Encaissements & règlements | Cash qui rentre, créances qui mûrissent, dettes échues qui sortent | non |
| 1 | Développement commercial | Demande, trafic, contrats, réputation | V1 non / V2 oui |
| 2 | Ressources & préparation | Ce qu'il faut mobiliser avant de délivrer | **oui** |
| 3 | Réalisation métier | Production, exécution, mission, tournée | **oui** |
| 4 | Facturation & ventes | Vente / facturation → CA + contrepartie | **oui** |
| 5 | Décision du dirigeant | Recrutement, investissement, financement | non |
| 6 | Événement & ajustement | Choc externe ou opportunité | non |
| 7 | Clôture & bilan | Charges, amortissements, résultat, bilan | non (moteur 2 passes) |

### Périmètre B9 V1
- [ ] Renommer les 8 étapes côté moteur, flow, modales et UI (avec renumérotation Option B)
- [ ] Rendre les étapes 2, 3 et 4 réellement polymorphes selon `modeEconomique`
- [ ] Sortir définitivement Véloce et Synergia du faux récit « achat de marchandises »
- [ ] Donner à Belvaux une étape de production explicite ressentie en jeu
- [ ] Conserver Azura comme modèle de négoce lisible et stable, avec une étape 3 à écriture réelle (coût de canal)
- [ ] Rééquilibrer la génération de demande (B9-B V1 : texte ; V2 : mécanique)
- [ ] Adapter les textes pédagogiques de chaque étape au métier de l'entreprise
- [ ] Ajouter les tests moteur et smoke tests couvrant le nouveau cycle
- [ ] `SAVE_VERSION 2→3` + invalidation des saves v2

### Plan d'implémentation

#### B9-A — Socle de vocabulaire commun + renumérotation Option B — 2026-04-23 ✅
- [x] B9-A.1 : Tableau d'écritures cibles (ci-dessus)
- [x] `packages/game-engine/src/types.ts` : union `EtapeTour = 0..7` avec nouveaux commentaires B9 ; `ETAPES` renumérotées (ENCAISSEMENTS, DEVELOPPEMENT_COMMERCIAL, RESSOURCES_PREPARATION, REALISATION_METIER, FACTURATION_VENTES, DECISION, EVENEMENT, CLOTURE_BILAN)
- [x] `packages/game-engine/src/engine.ts` : `maxEtape = 7` (inchangé) ; en-têtes de sections mises à jour pour refléter B9 ; `appliquerClotureTrimestre` déplacé narrativement à l'étape 7 (les fonctions moteur gardent leurs noms historiques, pilotage via le switch useGameFlow)
- [x] `apps/web/app/jeu/hooks/useGameFlow.ts` : switch remappé (case 0 ENCAISSEMENTS, 1 DEV_COMMERCIAL, 4 FACTURATION_VENTES ex-3, 6 EVENEMENT ex-5, 7 CLOTURE_BILAN ex-6) ; étape 3 REALISATION_METIER auto-skipée via condition `modsFiltrees.length === 0` ; étape 7 fusionne clôture + bilan avec shortcut `verifierFinTour + confirmEndOfTurn` dans `confirmActiveStep` ; `AUTO_ETAPES = [0, 1, 3, 4, 6, 7]` ; `subEtape6` → `subEtapeDecision`
- [x] `apps/web/app/jeu/hooks/useDecisionCards.ts` : `etapeTour === 4` → `=== 5` ; `subEtape6` → `subEtapeDecision` ; `pioche6b` → `piocheDecision` ; libellés 4a/4b → 5a/5b
- [x] `apps/web/app/jeu/hooks/gameFlowUtils.ts` : `ETAPE_INFO` 0..7 remappé avec textes B9 (intro « Réalisation métier » polymorphe V1 placeholder, fusion Clôture+Bilan en index 7)
- [x] `apps/web/lib/game-engine/data/pedagogie.ts` : `MODALES_ETAPES` remappées (0 Encaissements, 1 Développement commercial, 2 Ressources & préparation, 3 Réalisation métier NEW, 4 Facturation & ventes, 5 Décision, 6 Événement, 7 Clôture & bilan fusion). Texte étape 3 explicite : « polymorphe, pleinement active en B9-D »
- [x] `apps/web/components/jeu/ModalEtape.tsx` : `ETAPE_CONFIG` 0..7 remappé. Étape 3 utilise `Factory` + palette `violet/fuchsia`. Étape 7 `Landmark` + `teal/cyan` pour la fusion clôture+bilan
- [x] `apps/web/app/jeu/hooks/useGamePersistence.ts` : `SAVE_VERSION = 3` (invalide les saves v2)
- [x] `apps/web/components/jeu/LeftPanel.tsx` : `STEP_NAMES` + `STEP_HELP` 8 entrées B9, `isDecisionStep = etapeTour === 5`, `hasSaleGroups = etapeTour === 4`, `etapeTour !== 2 && !== 5` pour masquer le bouton Lancer, libellés 4a/4b → 5a/5b
- [x] `apps/web/components/jeu/HeaderJeu.tsx` : `/8` inchangé (déjà correct)
- [x] `apps/web/components/jeu/EntryPanel.tsx` : `isSalesStep = etapeTour === 4`
- [x] `apps/web/components/jeu/MainContent.tsx` : prop `subEtape6` → `subEtapeDecision`, `etapeTour === 4` → `=== 5`, libellés 4a/4b → 5a/5b
- [x] `apps/web/components/jeu/pedagogicalMessages.ts` : `ctx.etape === 3` → `=== 4` (règle post-ventes), libellé « étape 4a » → « étape 5a »
- [x] `apps/web/components/CompteResultatPanel.tsx` : commentaire T25.C → B9, condition `isProvisoire` inchangée (0..6 provisoire, 7 avec activeStep provisoire)
- [x] `apps/web/components/jeu/InvestissementPanel.tsx` : header « étape 6b » → « étape 5b B9 »
- [x] `apps/web/app/jeu/page.tsx` : prop `subEtape6={flow.subEtape6}` → `subEtapeDecision={flow.subEtapeDecision}` (2 occurrences)
- [ ] `apps/web/components/EtapeGuide.tsx` : laissé en l'état (dead code, zéro import détecté par `grep -r "EtapeGuide"`). Mention cosmétique « recruter à l'étape 5 » reste correcte par hasard pour B9.
- [x] `npx tsc --noEmit` sur `packages/game-engine` → EXIT=0
- [x] `npx tsc --noEmit` sur `apps/web` → EXIT=0
- [x] Rebuild `dist/` via `npm run build --workspace=packages/game-engine`
- [x] Tests moteur : 37/39 verts (2 échecs pré-existants sur Junior `calculerCoutCommerciaux` + `genererClientsParCommerciaux`, relèvent de #45 B8-D comme pour T25.C-RESTART)

#### B9-B — Étape 1 : Développement commercial (V1 texte, V2 mécanique différée)
- [ ] **V1** (ce chantier) : renommer « Paiement des commerciaux » → « Développement commercial » dans MODALES, LeftPanel, pedagogicalMessages. Texte pédagogique qui explique que les commerciaux sont UN levier parmi d'autres (trafic, contrats, réputation). Zéro mécanique nouvelle — les commerciaux génèrent encore les clients comme aujourd'hui.
- [ ] **V2** (session ultérieure) : sources de demande multiples (trafic passif, contrats récurrents, réputation). Nouvelles données dans `Joueur`, nouvelles règles de génération, nouvelle UI.

#### B9-C — Étape 2 : Ressources & préparation (polymorphe) — 2026-04-23 ✅
- [x] Ajouter `ModeEconomique = "production" | "négoce" | "logistique" | "conseil"` comme type exporté dans `packages/game-engine/src/types.ts`
- [x] Champ `modeEconomique?: ModeEconomique` sur `EntrepriseTemplate` (optionnel pour compat avec templates custom créés via EntrepriseBuilder — fallback "négoce" dans `creerJoueur`)
- [x] Champ `modeEconomique: ModeEconomique` sur `Joueur.entreprise` (requis — cloné par `creerJoueur` depuis le template, avec fallback)
- [x] Peupler `modeEconomique` dans `data/entreprises.ts` pour les 4 entreprises (Belvaux=production, Véloce=logistique, Azura=négoce, Synergia=conseil)
- [x] Implémenter 4 fonctions branchées : `appliquerRessourcesBelvaux` (D stocks / C tréso ou dettes, libellés matière), `appliquerRessourcesAzura` (D stocks / C tréso ou dettes, libellés réassort), `appliquerRessourcesVeloce` (D servicesExterieurs / C tréso ou dettes, libellés tournée), `appliquerRessourcesSynergia` (D chargesPersonnel / C tréso ou dettes, libellés staffing)
- [x] Dispatcher public `appliquerRessourcesPreparation(etat, idx, qte, mode)` qui route par `modeEconomique` — exhaustif via `never` sur le switch
- [x] Alias rétro-compatible `appliquerAchatMarchandises` qui délègue au dispatcher (deprecated, à retirer quand tous les call sites auront migré)
- [x] Export dans `packages/game-engine/src/index.ts`
- [x] Câblage `useAchatFlow.ts` : bascule vers `appliquerRessourcesPreparation` + correction bug historique `buildActiveStep(..., 1)` → `..., 2` (étape RESSOURCES_PREPARATION)
- [x] UI polymorphe `LeftPanel.tsx` : helper `ressourcePreparationLabels(mode)` qui fournit titre court + 3 aria-labels adaptés par métier ; sous-titre cyan au-dessus du stepper à l'étape 2
- [x] **Décision assumée V1 B9-C — bilans de départ inchangés** : en V1, la ligne `Stocks` des 4 entreprises garde son nom et sa valeur de 4000 € (pas de discrimination Matière/Produits finis pour Belvaux ni de renommage pour Véloce/Synergia). La polymorphie V1 opère uniquement sur les ÉCRITURES (quel poste est débité). La discrimination des stocks par nom et l'ajout des lignes « En-cours » arrivera en B9-D quand ces lignes deviendront réellement utilisées. Justification : zéro risque de régression sur les tests existants et l'équilibre de jeu, focus 100% sur la polymorphie comptable.
- [x] Tests unitaires : 6 nouveaux cas dans `describe("appliquerRessourcesPreparation — polymorphie par modeEconomique (B9-C)")` couvrant les 4 entreprises, l'invariant partie double (somme absolue des deltas = 2 × montant), et le cas quantité nulle. **43/45 tests verts** (les 2 échecs pré-existants restent sur #45 B8-D commercial Junior).
- [x] `npx tsc --noEmit` sur `packages/game-engine` ET `apps/web` → EXIT=0
- [x] Rebuild `dist/`

#### B9-D — Étape 3 : Réalisation métier (polymorphe) — 2026-04-23 ✅
- [x] Constante `COUT_CANAL_AZURA_PAR_TOUR = 300` dans `types.ts`
- [x] Helper interne `mutateActifByName` dans `engine.ts` pour cibler un actif par nom exact (partie double préservée)
- [x] Data `entreprises.ts` : Belvaux split stocks en 2 lignes (« Produits finis Belvaux » 3000 EN PREMIER + « Matière première Belvaux » 1000) ; Azura renommée en « Marchandises Azura » ; Véloce et Synergia gagnent une 2e ligne stocks « En-cours tournée/mission » initialisée à 0 (totaux bilan inchangés)
- [x] `creerJoueur` : reconnaissance élargie pour la catégorie `stocks` (ajout des mots-clés `matière`, `produits finis`, `marchandise`, `en-cours`, `en cours`) — indispensable pour que les nouvelles lignes stocks soient correctement catégorisées
- [x] Refactor `appliquerRessourcesBelvaux` (B9-C) : cible maintenant « Matière première Belvaux » via `mutateActifByName` (ne pollue plus les Produits finis)
- [x] `appliquerRealisationBelvaux` : 2 écritures doubles enchaînées — (a) D achats +M / C Matière première −M ; (b) D Produits finis +V / C productionStockee +V. Garde-fou : refus si matière insuffisante
- [x] `appliquerRealisationAzura` : 1 écriture double — D servicesExterieurs +300 / C trésorerie ou dettes −300
- [x] `appliquerRealisationVeloce` : 2 écritures doubles — (a) D chargesPersonnel +E / C trésorerie ou dettes −E ; (b) D En-cours tournée +V_svc / C productionStockee +V_svc
- [x] `appliquerRealisationSynergia` : symétrique Véloce avec « En-cours mission Synergia »
- [x] Dispatcher public `appliquerRealisationMetier(etat, idx, qte, mode)` avec switch exhaustif (garde-fou `never`)
- [x] Export dans `packages/game-engine/src/index.ts`
- [x] Nouveau hook `useRealisationFlow` (similaire à `useAchatFlow`) : state `realisationQte`/`realisationMode`/`realisationError`, actions `launchRealisation`/`skipRealisation`
- [x] `useGameFlow.ts` : intégration du hook, retrait de l'index 3 de la condition skip-auto (étape 3 désormais user-driven comme l'étape 2), mise à jour `AUTO_ETAPES = [0, 1, 4, 6, 7]`, expose les props au niveau retour typé
- [x] UI LeftPanel : helper `realisationMetierLabels(mode, joueur)` pour titre/stepper/mode/récit adaptés ; nouveau bloc étape 3 avec stepper borné (Belvaux : matière disponible ; Véloce/Synergia : 0-10 ; Azura : pas de stepper, montant fixe 300 €) ; radios comptant/crédit affichées selon le métier ; bouton Lancer désactivé si quantité nulle
- [x] `page.tsx` : passage des nouveaux props `realisationQte`, `setRealisationQte`, `realisationMode`, `setRealisationMode`, `onLaunchRealisation`, `onSkipRealisation`, `realisationError` à LeftPanel
- [x] Masquage du bouton « Lancer » principal quand `etapeTour === 3` (étape user-driven)
- [x] `MODALES_ETAPES[3]` mise à jour : retrait de la mention « polymorphie à venir B9-D », description des 4 branches avec écritures exactes
- [x] `ETAPE_INFO[3]` mise à jour : même principe que la modale
- [x] Tests unitaires : 8 nouveaux cas dans `describe("appliquerRealisationMetier — polymorphie par modeEconomique (B9-D)")` couvrant production Belvaux (+ garde-fou matière insuffisante), négoce Azura (coût canal fixe à crédit), logistique Véloce, conseil Synergia, invariant partie double 4 entreprises, quantité nulle, et régression Belvaux étape 2 ciblage matière. **51/53 tests verts** (les 2 échecs sont toujours les pré-existants #45 B8-D Junior).
- [x] `npx tsc --noEmit` sur `packages/game-engine` ET `apps/web` → EXIT=0
- [x] Rebuild `dist/`

#### B9-E — Étape 4 : Facturation & ventes (polymorphe, refonte `appliquerCarteClient`) — 2026-04-23 ✅
- [x] `mutateActifByName` étendue avec paramètre optionnel `extras` (saleGroupId / saleClientLabel / saleActIndex) pour tracer les écritures polymorphes dans l'UI de regroupement par vente
- [x] Refactor `appliquerCarteClient` pour brancher par `modeEconomique` — les actes 1 (encaissement) et 2 (chiffre d'affaires) restent communs, les actes 3 et 4 varient :
  - **production** (Belvaux) : D `productionStockee` −1000 / C stocks[Produits finis Belvaux] −1000. **Fallback CMV** si `productionStockee` courant < PRIX_UNITAIRE (cas des produits finis initiaux de l'inventaire, jamais passés en production stockée) : D `achats` / C stocks[Produits finis Belvaux]. Préserve la partie double sans pousser productionStockee en négatif.
  - **négoce** (Azura) : modèle CMV classique inchangé — D `achats` / C stocks[Marchandises Azura].
  - **logistique** (Véloce) : D `productionStockee` −1000 / C stocks[En-cours tournée Véloce] −1000 — la facturation solde l'en-cours constaté à l'étape 3.
  - **conseil** (Synergia) : symétrique Véloce avec En-cours mission Synergia.
  - **default** : fallback négoce pour templates custom sans `modeEconomique`.
- [x] Garde-fou `stockDispo` polymorphe : Belvaux vérifie « Produits finis Belvaux » uniquement (la matière première n'est pas vendable), Azura vérifie « Marchandises Azura », Véloce/Synergia vérifient leurs en-cours respectifs. Messages d'erreur adaptés par métier.
- [x] Libellés d'écritures contextualisés (« Produits finis Belvaux livrés », « Tournée Véloce facturée », « Mission Synergia facturée »).
- [x] MODALES_ETAPES[4] + ETAPE_INFO[4] mises à jour : description des 4 branches avec écritures exactes, conseils adaptés par métier (ex. « Véloce/Synergia sans en-cours = client perdu »).
- [x] Tests unitaires : 8 nouveaux cas dans `describe("appliquerCarteClient — polymorphisme vente par modeEconomique (B9-E)")` couvrant :
  - Belvaux T1 sans production : fallback CMV sur produits finis initiaux
  - Belvaux après production : extourne productionStockee + sortie Produits finis
  - Azura : modèle CMV sur Marchandises Azura
  - Véloce T1 sans en-cours : vente refusée (pédagogique)
  - Véloce après exécution : extourne en-cours + productionStockee
  - Synergia après mission : symétrique Véloce
  - Invariant partie double : 4 mods par vente pour les 4 métiers
  - Belvaux : stockDispo calculé sur Produits finis uniquement (matière 1ère non vendable)
- [x] **59/61 tests verts** (les 2 échecs restants sont toujours les pré-existants #45 B8-D Junior, non liés à B9-E).
- [x] `npx tsc --noEmit` sur `packages/game-engine` ET `apps/web` → EXIT=0
- [x] Rebuild `dist/`
- [ ] `SaleGroupCard.tsx` : les 4 écritures polymorphes sont déjà transmises via les extras saleGroupId/saleActIndex — le composant affichera automatiquement la nouvelle narration. Vérification visuelle à faire par Pierre (tâche #21 Phase 4).

#### B9-F — Étapes 5, 6 et 7
- [ ] Étape 5 : décisions du dirigeant — alignement des cartes recrutement/investissement sur le goulot de chaque entreprise (ex. licence Synergia, entrepôt Belvaux, flotte Véloce, canal Azura)
- [ ] Étape 6 : événements rédigés selon le métier
- [ ] Étape 7 : moteur = 2 passes (`appliquerClotureTrimestre` + vérif équilibre/affectation) ; UI raconte « deux temps pédagogiques » mais reste une seule étape numérotée

#### B9-G — UI & pédagogie (absorbe B8-E absent de main)
- [ ] `SetupScreen` : afficher clairement ce que vend chaque entreprise, d'où vient la valeur, son goulot
- [ ] `CompanyIntro` : décrire le cycle métier réel (pitch par entreprise — non présent sur `main`)
- [ ] `LeftPanel` : aides contextuelles spécifiques à l'étape ET à l'entreprise
- [ ] `SaleGroupCard` : récit d'exécution cohérent selon le mode économique

#### B9-H — Validation
- [ ] Tests unitaires moteur : pour chaque entreprise × chaque étape polymorphe, vérifier Σ(Débits) == Σ(Crédits) et `verifierEquilibreComptable` après application
- [ ] `npm test -- --runInBand` dans `packages/game-engine` → tous verts (y compris les 2 tests `calculerCoutCommerciaux` / `Junior` qui seront adressés en #45 B8-D en parallèle)
- [ ] `npm run build` dans `packages/game-engine`
- [ ] `npx tsc --noEmit` dans `apps/web`
- [ ] Smoke test manuel 1 trimestre × 4 entreprises
- [ ] Smoke test manuel 6 trimestres × Belvaux et Véloce
- [ ] Relecture pédagogique : le vocabulaire enseigne juste sans « renommer mentalement »

### Ordre d'attaque recommandé
1. **B9-A** (vocabulaire + renumérotation) — le plus petit en risque, débloque tout le reste
2. **B9-C** (ressources polymorphes) — introduit `modeEconomique` et les 4 branches
3. **B9-D** (réalisation polymorphe) — ajoute l'écriture réelle partout, y compris Azura
4. **B9-E** (facturation polymorphe + refactor `appliquerCarteClient`) — absorbe B8-B
5. **B9-B V1** (texte + renommage uniquement) — rapide, peut se faire en parallèle
6. **B9-F** (étapes 5/6/7 moteur)
7. **B9-G** (UI métier — absorbe B8-E)
8. **B9-H** (validation complète + commit)

### Critères de réussite
- [ ] Belvaux sent qu'il fabrique avant de vendre (étape 3 visible et écriture distincte)
- [ ] Azura sent qu'il achète/revend et gère sa rotation de stock, avec un coût de canal à l'étape 3
- [ ] Véloce ne voit plus d'étape « achat de marchandises » incohérente avec son métier
- [ ] Synergia ressent une capacité experte / mission, pas un commerce à stock déguisé
- [ ] Les commerciaux sont un levier de demande parmi d'autres, pas le cœur universel du moteur
- [ ] Le principe de partie double est respecté sur toutes les écritures des 4 × 3 = 12 chemins
- [ ] Le vocabulaire des 8 étapes est juste pédagogiquement pour les 4 entreprises

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
