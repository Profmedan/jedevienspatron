# Plan T25.C — Réordonner 9 étapes en 8 étapes

**Statut** : ✅ **plan validé par Pierre (2026-04-19)** — exécution en attente de la co-écriture des 8 modales pédagogiques
**Rédigé le** : 2026-04-19
**Validé le** : 2026-04-19 (Q1=B, Q2=A, Q3=A)
**Dépend de** : Tâche 25.A + 25.B (commit `907217f`, déjà livré)

---

## 1. Objectif

Réordonner le cycle d'un trimestre de **9 étapes (etapeTour 0-8)** vers **8 étapes (1-8)**, en passant d'une logique *"payer d'abord, agir ensuite"* à *"activité puis clôture"* :

| Nouveau # | Nom | Contenu (dérivé de l'actuel) |
|---|---|---|
| 1 | Encaissements | Avancement des créances (actuel 2) |
| 2 | Commerciaux | Paiement commerciaux + recrutement (actuel 3 + une partie de 6) |
| 3 | Achats | Achats de marchandises (actuel 1) |
| 4 | Ventes | Traitement cartes Client (actuel 4) |
| 5 | Décision | Carte Décision / Investissement (actuel 6) |
| 6 | Événement | Carte Événement (actuel 7) |
| 7 | Fin-période | Fusion : charges fixes + amortissements + effets récurrents (actuels 0 + 5) |
| 8 | Bilan | Clôture (actuel 8) |

Motif dramaturgique : le T1 doit commencer par une action **visible** (encaissements) plutôt que par une ponction silencieuse de charges fixes. Les charges fixes et amortissements sont regroupés en "fin-période" pour matérialiser l'idée de clôture d'un cycle.

---

## 2. Inventaire des surfaces (vérifié)

### 2.1 Code moteur

| Chemin | Rôle | Risque |
|---|---|---|
| `packages/game-engine/src/engine.ts` | **Canonique** | Ordre des `appliquerEtapeN` + `avancerEtape()` |
| `packages/game-engine/src/types.ts` L272-282 | Type `EtapeTour` + constantes `ETAPES.*` | Valeurs **et** noms à revoir |
| `apps/web/lib/game-engine/engine.ts` | **Legacy** | Diverge de la canonique (manque 155 lignes Tâche 24). A **1 consommateur actif** (`tirerQuestionsTrimestriel` depuis `data/pedagogie.ts`). |

### 2.2 Contenu pédagogique indexé par étape

- `apps/web/lib/game-engine/data/pedagogie.ts` L32-114 — **`MODALES_ETAPES`** : 9 entrées (INIT / ACHATS / COMMERCIAUX / VENTES / CHARGES / BILAN / INVESTISSEMENT / EVENEMENT / CLOTURE). **Contenu rédactionnel à re-mapper sémantiquement**, pas juste à renuméroter.
- Même fichier L116+ — **`QCM_ETAPES`** : 9 entrées (0-8), 6+ questions par entrée.

### 2.3 Utilisateurs du numéro d'étape (31 occurrences, 8 fichiers)

Hardcoded détectés (`etapeTour === N`) : **0** (5x), **1** (3x), **3** (1x), **4** (2x), **6** (7x). Dans : `useDecisionCards.ts`, `useGameFlow.ts`, `EntryPanel.tsx`, `LeftPanel.tsx`, `MainContent.tsx`, `HeaderJeu.tsx` (+ `CompteResultatPanel.tsx` avec `>= 1 && <= 7`).

Spots fragiles à ne pas oublier :
- `HeaderJeu.tsx:72` affiche le compteur `/9` → devient `/8`
- `CompteResultatPanel.tsx:250` filtre par range d'étapes → sémantique à revalider
- `LeftPanel.tsx:482` utilise `< etapeTour` (comparaison positionnelle, reste bon)

### 2.4 Slots dramaturgiques (Tâche 24)

Mapping actuel (`timing.ts` + `useGameFlow.ts:337-338`) :
- `debut_tour` → étape 0 (INIT) — **intention : tout début de trimestre**
- `avant_decision` → étape 6 (INVESTISSEMENT) — **intention : juste avant le choix**
- `finale` → dernier tour (pas étape-dépendant)

Non câblés en V2 : `apres_ventes`, `avant_bilan`, `fin_exercice`.

Après T25.C, les intentions doivent rester vraies. Nouveau mapping proposé :
- `debut_tour` → étape **1** (Encaissements) — début de trimestre visible
- `avant_decision` → étape **5** (Décision) — juste avant le choix

### 2.5 Tests

- `engine.test.ts:296` : `expect(etat.etapeTour).toBe(0)` — 1 assertion
- `timing.test.ts` : teste les slots par tour, pas par numéro d'étape (OK)
- `catalogue-v2.test.ts` : teste le piochage par slot, pas par numéro d'étape (OK)

Filet de sécurité tests : **très faible**. À renforcer AVANT de réordonner.

---

## 3. Décisions tranchées par Pierre (2026-04-19)

### Q1 — ✅ Option B : `etapeTour` reste 0-indexé (0-7 après T25.C)

L'UI affiche `etapeTour + 1` → compteur visible 1/8 à 8/8. Pas de rupture de convention TS interne.

**Point de vigilance ajouté par Pierre** : le changement de sens ET de longueur du pipeline implique d'**invalider les sauvegardes en cours**, sinon un joueur qui refresh au milieu d'une ancienne partie revient sur une étape qui ne signifie plus la même chose. Mécanisme confirmé :
- `apps/web/app/jeu/hooks/useGamePersistence.ts:24` — constante `SAVE_VERSION = 1`, validée à la lecture (ligne 52 : `if (save.version !== SAVE_VERSION) return null;`). Bump à **`SAVE_VERSION = 2`** dans le Commit 3 = toutes les sauvegardes v1 rejetées au prochain refresh, sans code supplémentaire.
- Rien à faire côté serveur : la table `game_sessions` ne persiste pas `etapeTour` (seuls les snapshots de fin-de-trimestre + état final sont sauvegardés en DB, pas l'état en cours).

### Q2 — ✅ Option A : supprimer la copie legacy, en commit séparé avant le réordonnancement

Le Commit 1 doit rester **purement structurel** : un seul moteur canonique, aucun changement de comportement. Synchroniser aurait signifié refaire deux fois toutes les futures refontes du cycle → exactement la dette à tuer.

### Q3 — ✅ Option A : renommer les constantes maintenant

Nomenclature validée par Pierre :

```typescript
ETAPES.ENCAISSEMENTS_CREANCES = 0   // anciennement étape 2 (avancement créances)
ETAPES.COMMERCIAUX             = 1  // anciennement étape 3 (paiement commerciaux + recrutement)
ETAPES.ACHATS_STOCK            = 2  // anciennement étape 1 (achats marchandises)
ETAPES.VENTES                  = 3  // anciennement étape 4 (traitement cartes Client)
ETAPES.DECISION                = 4  // anciennement étape 6 (investissement / carte Décision)
ETAPES.EVENEMENT               = 5  // anciennement étape 7 (carte Événement)
ETAPES.CLOTURE_TRIMESTRE       = 6  // NOUVEAU — fusion des anciennes 0 + 5
ETAPES.BILAN                   = 7  // anciennement étape 8 (clôture finale)
```

**Contenu de `CLOTURE_TRIMESTRE`** (décision Pierre) — bloc unique de fin de période qui fait subir :
- charges fixes (loyer, abonnements, etc.)
- charges sociales et dettes fournisseurs
- remboursement du capital de l'emprunt (-500 €/trim)
- intérêts d'emprunt si tour éligible (cadence annuelle T3/T7/T11… — T25.B)
- dotations aux amortissements
- effets récurrents des cartes actives (spécialités, cartes logistiques actives)

**Logique pédagogique** : "on encaisse et on vend avant d'être assommé par les charges de fin de période". Ce qui était une ponction invisible en début de trimestre devient une **conséquence visible** après l'activité commerciale.

---

## 4. Ordre d'exécution validé (3 commits atomiques)

Chaque étape est un **commit atomique** qui laisse le jeu fonctionnel. Objectif : pouvoir s'arrêter entre deux commits sans laisser une régression.

### Phase 0 — Filet de sécurité (préalable)
1. **Ajouter des tests "shape"** sur le cycle actuel : pour chaque `tourActuel = 1`, exécuter un tour complet avec `initialiserJeu` + `avancerEtape` × 8, vérifier trésorerie, stocks, créances, dettes à chaque transition. Un test par entreprise (4 tests × 8 étapes = 32 assertions).
2. Ces tests DOIVENT PASSER sur l'état actuel **avant** tout refactoring.

### Phase 1 — Migration du legacy (Q2 = A) — SCINDÉE en 1a + 1b
Amendée le 2026-04-19 après cartographie : `data/pedagogie.ts` (modales + QCM)
et `poste-helpers.ts` (helper UI `isBonPourEntreprise`) sont UNIQUES à la copie
legacy et ne doivent PAS entrer dans `@jedevienspatron/game-engine` (moteur pur).
Ils migrent donc vers `apps/web/lib/pedagogie/` — pas vers le package engine.

**Commit 1a** — `refactor(web): déplacer le contenu pédagogique hors du legacy engine`
3. Créer `apps/web/lib/pedagogie/`.
4. Déplacer `apps/web/lib/game-engine/data/pedagogie.ts` → `apps/web/lib/pedagogie/pedagogie.ts` (via `git mv`).
5. Déplacer `apps/web/lib/game-engine/poste-helpers.ts` → `apps/web/lib/pedagogie/poste-helpers.ts` (via `git mv`).
6. Mettre à jour les 10 imports web : 5 `@/lib/game-engine/data/pedagogie` → `@/lib/pedagogie/pedagogie`, 5 `@/lib/game-engine/poste-helpers` → `@/lib/pedagogie/poste-helpers`.
7. Vérification : `grep -r "@/lib/game-engine/data/pedagogie\|@/lib/game-engine/poste-helpers"` doit ne rien retourner dans le code source.
8. Aucun changement de comportement attendu.

**Commit 1b** — `chore(engine): supprimer la copie legacy du moteur`
9. Supprimer les 5 fichiers restants de `apps/web/lib/game-engine/` (calculators.ts, engine.ts, types.ts, data/cartes.ts, data/entreprises.ts).
10. Rediriger les derniers imports moteur vers `@jedevienspatron/game-engine`.
11. Vérification : `grep -r "@/lib/game-engine"` doit ne rien retourner dans le code source.

### Phase 2 — Renommage des constantes (Q3 = A)
8. Mettre à jour `ETAPES.*` avec les nouveaux noms dans `types.ts`.
9. Remplacer partout les `=== N` littéraux par `=== ETAPES.XXX` (31 sites). Les valeurs ne changent pas encore.
10. Vérifier `npx jest` + `npx tsc --noEmit` OK.
11. **Commit 2** : `refactor: nommer explicitement les étapes du cycle (pas de changement de valeur)`.

### Phase 3 — Réordonnancement effectif
12. Changer les valeurs dans `ETAPES.*` (et le type `EtapeTour` → 0-7).
13. Réordonner les appels dans `avancerEtape()`. Créer `appliquerClotureTrimestre()` qui fusionne l'actuelle `appliquerEtape0()` (charges fixes, amortissements, intérêts, remboursement) avec l'actuelle étape 5 (effets récurrents / spécialités).
14. Re-mapper `MODALES_ETAPES` et `QCM_ETAPES` avec les **8 nouveaux paragraphes co-écrits** (cf. § 7). Ne pas permuter l'ancien contenu — chaque paragraphe est ré-écrit pour décrire la nouvelle étape et son enjeu de gestion réelle.
15. Mettre à jour le mapping des slots dramaturgiques : `debut_tour` → `ETAPES.ENCAISSEMENTS_CREANCES` (0), `avant_decision` → `ETAPES.DECISION` (4). Vérifier `useGameFlow.ts:337-338` et `timing.ts`.
16. Mettre à jour `HeaderJeu.tsx:72` (compteur `/9` → `/8`).
17. Revalider `CompteResultatPanel.tsx:250` (`>= 1 && <= 7` → logique à porter sur les nouveaux indices ; l'intention était "masquer sauf étape initiale et bilan").
18. **Bump persistence** : `useGamePersistence.ts:24` `SAVE_VERSION = 1` → `SAVE_VERSION = 2`. Toutes les sauvegardes localStorage v1 rejetées au prochain refresh.
19. Mettre à jour les tests (le test Phase 0 doit maintenant valider le nouvel ordre).
20. **Commit 3** : `feat(engine): Tâche 25.C — réordonnancement 9→8 étapes (activité puis clôture)` — inclut le bump `SAVE_VERSION` pour éviter les sauvegardes fantômes.

### Phase 4 — Vérification finale
21. `npx jest` : 100 % vert.
22. `npx tsc --noEmit` (game-engine + apps/web) : OK.
23. Test de régression persistence : lancer une partie, refresh, vérifier que la sauvegarde v1 injectée à la main dans localStorage est bien rejetée (console silencieuse, pas de restauration).
24. Partie manuelle sur 3 trimestres dans une des 4 entreprises pour vérifier que le jeu reste jouable et que le nouvel ordre est lisible.
25. Mettre à jour `tasks/todo.md` et `tasks/lessons.md`.

---

## 5. Risques identifiés

| Risque | Gravité | Mitigation |
|---|---|---|
| Re-mapping rédactionnel des modales erroné (la modale parle d'une chose qui ne se passe plus à cette étape) | **Haute** | Revoir chaque modale contre le contenu sémantique de la nouvelle étape — pas juste réordonner le tableau. |
| Test `engine.test.ts:296` cassé en compilation depuis d8571b4 | Moyenne | Ne pas essayer de la réparer dans T25.C. Utiliser la suite `tache25.test.ts` pattern pour les nouveaux tests. |
| Slots dramaturgiques décalés sans que Tâche 24 Vague 2 s'en rende compte | **Haute** | Tester manuellement qu'un défi arrive bien à `debut_tour` du T1 (première étape visible) et `avant_decision` du T3 après refonte. |
| Régressions silencieuses sur les 31 sites hardcoded | Haute | Phase 2 (renommage) **avant** Phase 3 (renumérotation) : pendant la Phase 2, le compilateur TS échoue sur tout site oublié. Passage ciblé en deux temps au lieu d'une seule fois. |
| Sauvegardes localStorage v1 mal alignées sur le nouvel ordre | **Haute** | **Résolu par design** : bump `SAVE_VERSION` 1→2 dans Commit 3 → `useGamePersistence.ts:52` rejette automatiquement. Aucun `etapeTour` persisté côté serveur (vérifié dans `supabase/migrations/` et `apps/web/app/api/sessions/`). Test explicite en Phase 4 §23. |

---

## 6. Estimation

- Phase 0 : 30 min (écriture des tests shape)
- Phase 1 : 20 min (migration legacy)
- Phase 2 : 40 min (renommage explicite — 31 sites)
- Phase 3 : 1 h 30 (réordonnancement + re-mapping pédagogique)
- Phase 4 : 30 min (tests + partie manuelle + docs)

**Total** : ~3 h 30 de travail focalisé, **3 commits atomiques**.

---

## 7. Co-écriture des 8 modales pédagogiques (prérequis Phase 3 §14)

**Règle** : ne pas permuter les anciennes modales. Chaque paragraphe est ré-écrit pour répondre à deux questions :
1. **Qu'est-ce qui se passe maintenant ?** — action mécanique et postes comptables impactés.
2. **Pourquoi cette étape existe en gestion réelle ?** — ancrage métier, pas code.

### Contrat par modale

Chaque entrée de `MODALES_ETAPES[i]` doit respecter le schéma actuel (`titre`, `ceQuiSePasse`, `pourquoi`, `impactComptes`, `conseil`). Je tiens la mise en forme UX ; Pierre fournit le fond pédagogique.

### Schéma cible (non modifié par T25.C)

```typescript
interface ModalEtape {
  etape: number;
  titre: string;
  ceQuiSePasse: string;
  pourquoi: string;
  impactComptes: string;
  conseil: string;
}
```

### Fond pédagogique V1 (validé par Pierre 2026-04-19)

Ces 8 paragraphes sont le **cœur narratif** de chaque modale. Ils constituent la source de vérité sémantique pour la rédaction des 5 champs (titre, ceQuiSePasse, pourquoi, impactComptes, conseil).

**Étape 0 — `ENCAISSEMENTS_CREANCES`**
> Une vente passée devient enfin de l'argent disponible. Le chiffre d'affaires ne suffit pas : tant qu'un client n'a pas payé, l'entreprise porte une créance. Une entreprise peut être rentable et pourtant manquer de trésorerie si les encaissements arrivent trop tard.

**Étape 1 — `COMMERCIAUX`**
> Les commerciaux coûtent avant de rapporter. Leur salaire pèse chaque trimestre, mais ils ouvrent des opportunités de vente. Le dirigeant doit arbitrer entre prudence de trésorerie et capacité à générer de nouveaux clients.
>
> (Note Pierre : éviter le mot "investissement" pour ne pas brouiller immobilisation vs charge.)

**Étape 2 — `ACHATS_STOCK`**
> On prépare l'activité avant de vendre. Le stock est de l'argent transformé en marchandises : trop de stock immobilise la trésorerie, trop peu de stock fait perdre des ventes. Acheter, c'est parier sur la demande à venir.

**Étape 3 — `VENTES`**
> C'est le moment de vérité commerciale. Les ventes créent le chiffre d'affaires, mais elles consomment aussi du stock. Le dirigeant ne regarde pas seulement ce qu'il vend : il observe aussi la marge créée par chaque client.

**Étape 4 — `DECISION`** _(émotion dirigeant)_
> Le dirigeant choisit où engager l'entreprise. Investir, recruter, emprunter ou se protéger peut améliorer l'avenir, mais consomme souvent de la trésorerie aujourd'hui. Une bonne décision n'est pas gratuite : elle déplace le risque dans le temps.

**Étape 5 — `EVENEMENT`** _(émotion dirigeant)_
> L'environnement économique ne demande pas la permission. Une panne, une opportunité, un contrôle ou une bonne nouvelle peut modifier la trajectoire du trimestre. Le dirigeant apprend à absorber l'imprévu sans perdre la lecture comptable.

**Étape 6 — `CLOTURE_TRIMESTRE`** _(émotion dirigeant + étape clé du nouveau cycle)_
> La période se ferme : tout ce qui a permis à l'entreprise de fonctionner devient visible dans les comptes. Charges fixes, remboursements, intérêts, amortissements et effets récurrents transforment l'activité du trimestre en résultat. C'est ici qu'on comprend pourquoi trésorerie et bénéfice ne racontent pas exactement la même histoire.
>
> (Consigne Pierre : cette étape doit devenir la "vérité de gestion", pas une punition.)

**Étape 7 — `BILAN`**
> Le bilan photographie l'entreprise à l'instant T : ce qu'elle possède, ce qu'elle doit, et ce qu'elle a accumulé comme richesse ou fragilité. La banque, l'associé ou le dirigeant ne regardent pas seulement le trimestre : ils regardent la solidité construite depuis le début.

### Dimension "émotion dirigeant" — étapes 4, 5, 6 uniquement

Règle d'emploi : à ces trois moments (décision, imprévu, clôture), l'apprenant doit **sentir qu'il pilote**, pas seulement qu'il passe des écritures. Mécanique UX proposée : ajouter à ces 3 modales une ligne italique courte en tête du champ `conseil`, formulée à la **deuxième personne du singulier** (pas un "on" neutre). Exemple de ton :
- Étape 4 : *"C'est toi qui décides. Mais le marché ne te dira pas si tu as eu raison avant trois trimestres."*
- Étape 5 : *"Tu n'as pas choisi ce moment. Ta responsabilité, c'est la lecture, pas la panique."*
- Étape 6 : *"Respire. C'est là que tu vois si ta stratégie tient."*

Les 5 autres étapes gardent le ton neutre/pédagogique (pas d'émotion dirigeant forcée).

### Règles de rédaction finalisées (validées par Pierre 2026-04-19)

1. **Longueur** : 3 lignes par champ (`ceQuiSePasse`, `pourquoi`, `impactComptes`, `conseil`). L'étape 6 (CLOTURE_TRIMESTRE) peut dépasser légèrement car elle porte la charge pédagogique centrale du nouveau cycle, mais pas au point de devenir une page de cours. La version longue (4-5 lignes par champ) est préservée pour un futur "en savoir plus" — pas en modale.
2. **Émotion dirigeant** : pas de 6e champ au schéma. Le `conseil` devient le lieu stable de la posture dirigeant, avec un **incipit en phrase humaine + deux-points + lecture comptable**. Appliqué aux étapes 4 (Décision), 5 (Événement), 6 (Clôture). Les 5 autres étapes gardent un ton neutre/pédagogique.
3. **Chiffres fixes OK** : constantes réelles (`-500 €`, `8 000 €`) ancrent la modale dans le concret.
4. **Calendrier dynamique hors modale** : références de tours (T3, T7, T11…) à générer par l'UI en surcouche selon le contexte de la partie — pas en texte figé dans la modale.
5. **Ton** : 2ᵉ personne du singulier. Éviter "investissement" pour les commerciaux (ambiguïté immobilisation vs charge).

### Version finale — 8 modales validées par Pierre (2026-04-19)

Source de vérité pour Phase 3 §14. Les clés numériques suivent la nouvelle numérotation 0-indexée (`ETAPES.ENCAISSEMENTS_CREANCES = 0` → `ETAPES.BILAN = 7`).

```typescript
export const MODALES_ETAPES: Record<number, ModalEtape> = {
  // ── étape 0 : Encaissements des créances clients ─────────────────────────────
  0: {
    etape: 0,
    titre: `Tes clients paient — la vente devient de l'argent`,
    ceQuiSePasse: `Les créances arrivées à échéance sont encaissées. La trésorerie augmente, les créances clients diminuent du même montant. Le chiffre d'affaires ne bouge pas : il avait été enregistré au moment de la vente.`,
    pourquoi: `Tant qu'un client n'a pas payé, la vente reste un papier — pas un moyen d'action. Une entreprise rentable peut manquer de trésorerie si ses clients paient trop tard. Encaisser, c'est transformer le chiffre en marge de manœuvre.`,
    impactComptes: `Trésorerie +, créances clients -. Résultat inchangé : c'est un mouvement interne à l'actif, pas une opération de gestion. La banque récupère enfin ce que la vente avait promis.`,
    conseil: `Surveille tes délais d'encaissement. Des clients qui paient vite tiennent la trésorerie à flot ; des retards répétés la vident en silence, même avec un carnet de commandes plein.`,
  },
  // ── étape 1 : Paiement des commerciaux (+ recrutement/licenciement) ──────────
  1: {
    etape: 1,
    titre: `Tu rémunères ton équipe commerciale`,
    ceQuiSePasse: `Les commerciaux en poste sont payés ce trimestre. Si tu viens de recruter ou de licencier, l'effectif est ajusté avant paiement. Le coût est prélevé immédiatement sur la trésorerie.`,
    pourquoi: `Les commerciaux coûtent avant de rapporter. Leur salaire pèse chaque trimestre, mais ils ouvrent le carnet de commandes. Sans eux, la demande reste théorique.`,
    impactComptes: `Charges de personnel +, trésorerie -. Le résultat se dégrade d'autant. C'est une charge d'exploitation courante — pas une immobilisation, même si l'effet sur les ventes est durable.`,
    conseil: `Dimensionne ton équipe à ta marge prévue, pas à ton ambition. Un commercial en trop brûle du cash jusqu'à ce qu'il produise ; une équipe trop maigre laisse du chiffre à la concurrence.`,
  },
  // ── étape 2 : Achats de marchandises / matières ─────────────────────────────
  2: {
    etape: 2,
    titre: `Tu achètes ce que tu vas vendre`,
    ceQuiSePasse: `Tu achètes marchandises ou matières. Le stock augmente, et soit la trésorerie baisse (achat comptant), soit une dette fournisseur est créée (paiement différé). Pas de charge à ce stade : c'est une transformation d'actif.`,
    pourquoi: `Le stock, c'est de l'argent transformé en marchandises. Trop de stock immobilise la trésorerie sans la rémunérer ; trop peu te fait rater des ventes. Acheter, c'est parier sur la demande à venir.`,
    impactComptes: `Stocks +, et soit trésorerie -, soit dettes fournisseurs +. Le coût d'achat ne devient charge qu'au moment de la vente — c'est pourquoi un stock élevé ne réduit pas ton résultat courant.`,
    conseil: `Achète pour couvrir 2 à 3 trimestres de ventes prévues, pas plus. Le stock qui dort, c'est du cash qui ne travaille pas.`,
  },
  // ── étape 3 : Traitement des ventes (cartes Client) ──────────────────────────
  3: {
    etape: 3,
    titre: `Tes clients achètent — chiffre d'affaires et marge`,
    ceQuiSePasse: `Les cartes Client sont traitées. Le chiffre d'affaires augmente du prix de vente, le stock diminue du coût des marchandises vendues. La contrepartie atterrit en banque (comptant) ou en créance (crédit).`,
    pourquoi: `C'est le moment de vérité commerciale. Mais vendre beaucoup ne suffit pas : ce qui compte, c'est ce qu'il reste quand on a retiré le coût du produit. La marge, pas le volume.`,
    impactComptes: `Produits d'exploitation +, stocks -, trésorerie ou créances clients +. La marge brute se révèle à cette étape ; c'est elle qui conditionne la capacité à absorber les charges fixes de la clôture.`,
    conseil: `Regarde la marge par type de client, pas seulement le CA. Un gros client peu marginé, surtout s'il paie en retard, peut te faire plus de mal qu'un petit client bien marginé et ponctuel.`,
  },
  // ── étape 4 : Carte Décision (émotion dirigeant) ────────────────────────────
  4: {
    etape: 4,
    titre: `Tu choisis où engager l'entreprise`,
    ceQuiSePasse: `Tu peux jouer une carte Décision — investissement, recrutement, emprunt, carte logistique, protection. L'effet immédiat impacte trésorerie ou bilan ; l'effet récurrent reviendra aux clôtures suivantes.`,
    pourquoi: `Une bonne décision n'est pas gratuite : elle déplace le risque dans le temps. Tu paies aujourd'hui pour une capacité, une croissance ou une protection que tu espères demain. Ne rien faire est aussi un choix.`,
    impactComptes: `Selon la carte : immobilisation + et trésorerie - (investissement), emprunt + et trésorerie + (crédit), charges de personnel + (recrutement). Beaucoup de cartes embarquent un effet récurrent qui reviendra à chaque clôture.`,
    conseil: `C'est toi qui décides : mais le marché ne te dira pas si tu as eu raison avant plusieurs trimestres. Regarde toujours la sortie de cash d'aujourd'hui et le coût récurrent cumulé jusqu'à la fin de la partie.`,
  },
  // ── étape 5 : Carte Événement (émotion dirigeant) ────────────────────────────
  5: {
    etape: 5,
    titre: `L'environnement économique frappe à la porte`,
    ceQuiSePasse: `Une carte Événement est tirée automatiquement. Elle peut affecter la trésorerie, le stock, les clients, les dettes — ou plusieurs postes à la fois. Tu n'as pas choisi ce moment, mais tu dois en tenir compte dans les comptes.`,
    pourquoi: `L'environnement ne demande pas la permission. Panne, opportunité, contrôle, bonne nouvelle : l'imprévu fait partie du métier. Ce n'est pas l'événement qui distingue les dirigeants — c'est leur lecture et leur réaction.`,
    impactComptes: `Variable selon l'événement. Un incident augmente les charges exceptionnelles ou réduit un actif ; une opportunité gonfle le CA ou les produits. Regarde la ligne affectée au bilan pour mesurer l'ampleur réelle.`,
    conseil: `Tu n'as pas choisi ce moment : ta responsabilité, c'est la lecture, pas la panique. Garde un coussin de trésorerie pour absorber les chocs, et une discipline de lecture pour ne pas confondre événement passager et dérive structurelle.`,
  },
  // ── étape 6 : Clôture du trimestre (émotion dirigeant, étape clé T25.C) ──────
  6: {
    etape: 6,
    titre: `La période se ferme — les coûts structurels deviennent visibles`,
    ceQuiSePasse: `Tout ce qui a permis à l'entreprise de fonctionner ce trimestre arrive dans les comptes : charges fixes, dettes fournisseurs, remboursement d'emprunt, amortissements et effets récurrents des cartes actives.`,
    pourquoi: `La clôture transforme l'activité brute en résultat. C'est ici qu'on comprend pourquoi trésorerie et bénéfice ne racontent pas exactement la même histoire : un amortissement pèse sur le résultat sans sortie d'argent, une dette fournisseur payée pèse sur la banque.`,
    impactComptes: `La trésorerie baisse avec les paiements exigibles. Les amortissements augmentent les charges sans impacter les comptes de la banque. Après toutes ces écritures, le résultat net du trimestre peut enfin être porté au bilan.`,
    conseil: `Respire : c'est ici que tu vois si ta stratégie tient. Regarde d'abord ta trésorerie après clôture, puis ton résultat net. Si l'un va bien et pas l'autre, ton problème vient souvent du délai client, du stock ou d'une structure trop lourde.`,
  },
  // ── étape 7 : Bilan de fin de trimestre ─────────────────────────────────────
  7: {
    etape: 7,
    titre: `Tu arrêtes les comptes — la photo patrimoniale est prise`,
    ceQuiSePasse: `Le résultat net du trimestre (calculé en clôture) est affecté aux capitaux propres. L'actif et le passif sont recalés. Les indicateurs de solidité — fonds propres, dette, trésorerie, ratio — sont mis à jour pour la lecture externe.`,
    pourquoi: `Le bilan ne raconte pas ton trimestre : il raconte ton entreprise à l'instant T. Ce qu'elle possède, ce qu'elle doit, ce qu'elle a accumulé. C'est la photo que la banque, l'associé ou le repreneur regardent en premier.`,
    impactComptes: `Capitaux propres +/- selon le résultat, actif et passif équilibrés par construction. Aucun flux de trésorerie à cette étape : c'est une écriture de constatation, pas de décaissement.`,
    conseil: `Regarde la tendance, pas seulement la photo. Un bilan isolé ne dit rien ; trois bilans consécutifs montrent si la structure se consolide ou se fragilise. C'est la direction qui compte.`,
  },
};
```

### Note UX (hors scope T25.C, à traiter dans un ticket séparé)

Les incipits de `conseil` sur les étapes 4, 5, 6 contiennent une "phrase posture dirigeant" + deux-points + lecture comptable. Pierre souhaite qu'à terme, l'UI rende cette phrase d'introduction en italique. Mécanisme proposé (à implémenter plus tard, pas dans T25.C) : le rendu côté React détecte la première phrase se terminant par ` : ` et l'enveloppe dans un `<em>`. Ne pas modifier le schéma `ModalEtape` — le texte brut reste la source de vérité.

### Prérequis Phase 3 §14 : LEVÉS

Le contenu rédactionnel des 8 modales est figé. Phase 3 peut démarrer dès validation de Pierre sur l'ordre des 3 commits.

### Décisions d'exécution (validées par Pierre 2026-04-19)

**QCM — commit 4 séparé avec désactivation propre dans commit 3**
- Commit 3 neutralise les QCM existants avec un **warning interne explicite** (ne PAS les garder sur l'ancien ordre — "garder des QCM faux est pire que pas de QCM pendant une courte fenêtre").
- Commit 4 refonte complète des 9 `QCM_ETAPES` (~50 questions) après une partie manuelle du nouveau cycle — les QCM testent la compréhension au bon moment, un re-mapping trop rapide risque une question juste posée au mauvais moment mental.

**Protocole de vérification Phase 4 (cadré mais léger)**
Partie manuelle Belvaux, durée 6, jouer **jusqu'à T3 inclus**, vérifier :
1. Trésorerie non plombée avant les produits au T1 (nouveau cycle respecté).
2. Les étapes racontent bien le trimestre dans le nouvel ordre (narration).
3. Le parcours d'une vente passe par : stock → CA → marge → encaissement ou créance.
4. La clôture T1 applique bien charges + remboursement + dotations + effets récurrents (sans intérêts).
5. Bilan T1 équilibré (Actif = Passif + Résultat).
6. Joueur arrive au premier moment de tension (T3 — premier défi Tâche 24 + première facturation d'intérêts T25.B) sans sensation de **punition injuste**.

Puis **mini-smoke sur Synergia** — uniquement T1 — pour couvrir le profil initial différent (Immos 13 k vs 16 k, Capitaux 19 k vs 22 k).

Pas de résultat net attendu au centime dans cette passe. Un test de scénario chiffré pourra être ajouté **après** stabilisation de T25.C.

**Phase 0 — commit propre avant toute chirurgie**
Commit dédié `test(engine): caractériser le cycle actuel avant refonte`, même si squashé ensuite. Ce commit documente les constantes vitales avant l'opération et rend la revue lisible.

---

## 8. Séquencement final des commits

| # | Commit | Contenu |
|---|---|---|
| 0 | `test(engine): caractériser le cycle actuel avant refonte` | Tests "shape" du cycle 9-étapes actuel : ordre des étapes, invariants (bilan équilibré à chaque étape), flux attendus. Ces tests DOIVENT passer sur `main` avant tout refactor. |
| 1 | `chore(engine): supprimer la copie legacy — pedagogie migrée` | Migration `apps/web/lib/game-engine/data/pedagogie.ts` → `packages/game-engine/src/data/pedagogie.ts`. Suppression du dossier `apps/web/lib/game-engine/` entier. Aucun changement de comportement. |
| 2 | `refactor(engine): nommer explicitement les étapes du cycle` | `ETAPES.*` renommés selon la nomenclature Pierre (§3 Q3). Tous les littéraux `etapeTour === N` remplacés par `=== ETAPES.XXX`. Valeurs inchangées. |
| 3 | `feat(engine): Tâche 25.C — réordonnancement 9→8 étapes (activité puis clôture)` | Valeurs `ETAPES.*` réassignées, `avancerEtape()` réordonnée, `appliquerClotureTrimestre()` créée (fusion charges fixes + effets récurrents), 8 modales figées, QCM neutralisés avec warning interne, mapping slots dramaturgiques mis à jour, `HeaderJeu.tsx /9 → /8`, `SAVE_VERSION` 1→2. |
| 4 | `feat(pedagogie): refonte QCM du nouveau cycle` | Après partie manuelle Phase 4 validée : les 9 `QCM_ETAPES` sont re-rédigés pour tester la compréhension au bon moment du nouveau cycle. **Traité dans une session ultérieure.** |

---

### Prérequis restants avant exécution

1. ✅ Q1/Q2/Q3 tranchées (2026-04-19).
2. ✅ 8 modales rédigées et validées (2026-04-19).
3. ✅ Séquencement des commits tranché (2026-04-19).
4. ✅ Protocole Phase 4 cadré (2026-04-19).
5. ✅ Go Phase 0 (2026-04-19).

**Tous les prérequis sont levés. Exécution en cours.**
