# Plan Phase 4 — Test manuel du cycle 8 étapes (T25.C)

**Objectif** : Valider en une seule session (1) les fix B1+B2 du commit `fa3dc3d`, (2) les ajustements UX du commit `597eb29`, (3) le cycle 8 étapes complet en conditions réelles.

**Durée estimée** : ~90 min. Belvaux T1→T6 (~60 min) + Synergia T1 (~15 min) + vérifications ciblées (~15 min).

**Matériel** : ce document affiché à côté de l'écran. Console navigateur ouverte (F12).

**Important** : aucune valeur de trésorerie en cours de cycle n'est écrite "en dur" dans ce plan — elles dépendent des cartes tirées et des décisions de jeu, à observer sur l'écran. Ne sont fixées que les valeurs de **bilan initial** et les **constantes du moteur** (sourcées en fin de chaque assertion).

---

## 1. Prérequis et démarrage

- [ ] Ouvrir **https://jedevienspatron.fr/jeu** *(layout.tsx L18, `NEXT_PUBLIC_APP_URL`)*
- [ ] Attendre ~2 min après le push du commit `c062e4a` pour laisser Vercel redéployer
- [ ] Sélectionner **Manufacture Belvaux** pour le scénario principal
- [ ] Vérifier que le `SAVE_VERSION = 2` : une save localStorage de l'ancien cycle 9 étapes doit être rejetée proprement (retour à l'écran d'accueil, pas de crash)
- [ ] Console navigateur ouverte : un warning interne `[T25.C] QCM_ETAPES neutralisés` est attendu (voir pedagogie.ts — QCM désactivés jusqu'au Commit 4 de T25.C)

---

## 2. Constantes du moteur à garder en tête

Source : `packages/game-engine/src/types.ts` et `engine.ts`.

| Constante | Valeur | Source |
|---|---|---|
| CHARGES_FIXES_PAR_TOUR | **2 000 €** | types.ts:L374 |
| DECOUVERT_MAX | **8 000 €** | types.ts:L373 |
| TAUX_INTERET_ANNUEL | **5 %/an** | types.ts:L478 |
| INTERET_EMPRUNT_FREQUENCE | **4 trimestres** | types.ts:L382 |
| Cadence intérêts | `tourActuel >= 3 && (tourActuel - 3) % 4 === 0` → **T3, T7, T11…** | engine.ts:L352-369 |
| Seuils découvert | 25 % / 50 % / 75 % / 90 % de DECOUVERT_MAX → **2 000 / 4 000 / 6 000 / 7 200 €** | AlerteDecouvert.tsx:L28-31 |

---

## 3. Bilan initial — valeurs de référence

### Belvaux *(entreprises.ts:L54-92)*
- Trésorerie : **10 000 €** *(L76)*
- Entrepôt : 8 000 € *(L68)* + Camionnette : 8 000 € *(L70)* + Stocks : 4 000 € *(L74)*
- **Total actif = 30 000 €**
- Capitaux propres : 22 000 € *(L80)* + Emprunt : 8 000 € *(L82)*
- **Total passif = 30 000 €**
- Spécialité : « Produit à chaque tour » → **+1 000 € production stockée, +1 000 € stocks** à chaque clôture *(L59-63)*

### Synergia Lab *(entreprises.ts:L163-200)*
- Trésorerie : **10 000 €** *(L185)*
- Brevet : 8 000 € *(L177)* + Matériel info : 5 000 € *(L179)* + Stocks : 4 000 € *(L183)*
- **Total actif = 27 000 €**
- Capitaux propres : 19 000 € *(L189)* + Emprunt : 8 000 € *(L190)*
- **Total passif = 27 000 €**
- Spécialité : « Revenus de licence » → **+1 000 € produits financiers, +1 000 € trésorerie** à chaque clôture *(L168-172)*

---

## 4. Scénario Belvaux T1 → T6

### 4.1 — Libellé court et description attendus à chaque étape

Source verbatim : `LeftPanel.tsx` (STEP_NAMES L13-22, STEP_HELP L81-90).

| Étape | STEP_NAME | STEP_HELP (description sous le titre) |
|---|---|---|
| 1/8 | « Encaissements créances » | « Vos créances clients avancent d'un trimestre : celles qui arrivent à échéance entrent en trésorerie. » |
| 2/8 | « Paiement commerciaux » | « Salaires versés. Nouveaux clients générés. » |
| 3/8 | « Approvisionnement » | « Achat de stocks (optionnel). » |
| 4/8 | « Traitement ventes » | « Tes clients passent en caisse… une vente est enregistrée au Compte de Résultat… » |
| 5/8 | « Décisions » | « Sélection d'une carte de recrutement, d'investissement ou d'emprunt (optionnel). » |
| 6/8 | « Événement » | « Une carte Événement sera piochée. » |
| 7/8 | « Clôture du trimestre » | « Charges fixes, remboursement d'emprunt, intérêts (à partir du T3), dotations aux amortissements et effets récurrents… » |
| 8/8 | « Bilan trimestre » | « Vérification du bilan. Fin du trimestre. » |

**Point de contrôle L52** : la description sous le titre doit correspondre à la bonne étape (pas décalée). B3 concerne l'étape 3/8 qui doit parler d'achats, pas de paiement des commerciaux.

### 4.2 — Icône et palette attendues de la modale pédago

Source verbatim : `ModalEtape.tsx` ETAPE_CONFIG (L19-42).

| Étape | Icône Lucide | Palette gradient | Badge |
|---|---|---|---|
| 1/8 | DollarSign | green-50 → emerald-50 | bg-green-600 |
| 2/8 | Handshake | blue-50 → indigo-50 | bg-blue-600 |
| 3/8 | Package | amber-50 → yellow-50 | bg-amber-600 |
| 4/8 | Target | purple-50 → violet-50 | bg-purple-600 |
| 5/8 | Mail | indigo-50 → blue-50 | bg-indigo-600 |
| 6/8 | Dice6 | yellow-50 → amber-50 | bg-yellow-600 |
| 7/8 | Landmark | rose-50 → pink-50 | bg-rose-600 |
| 8/8 | BarChart3 | teal-50 → cyan-50 | bg-teal-600 |

**Point de contrôle U3-A** : l'icône doit correspondre à la sémantique de l'étape (DollarSign pour Encaissements, pas Briefcase).

### 4.3 — Titre de la modale pédago attendu

Source verbatim : `pedagogie.ts` MODALES_ETAPES (L36-109).

| Étape | Titre |
|---|---|
| 1/8 | « Tes clients paient — la vente devient de l'argent » |
| 2/8 | « Tu rémunères ton équipe commerciale » |
| 3/8 | « Tu achètes ce que tu vas vendre » |
| 4/8 | « Tes clients achètent — chiffre d'affaires et marge » |
| 5/8 | « Tu choisis où engager l'entreprise » |
| 6/8 | « L'environnement économique frappe à la porte » |
| 7/8 | « La période se ferme — les coûts structurels deviennent visibles » |
| 8/8 | « Tu arrêtes les comptes — la photo patrimoniale est prise » |

### 4.4 — Séquence de clôture (étape 7/8) — invariants à vérifier

Source : `engine.ts` `appliquerClotureTrimestre()` (L860-878).

L'ordre des passes appliquées **automatiquement** à l'étape 7/8 :

1. **appliquerEtape0** : agios + intérêts (si T ≥ 3) + remboursement capital + charges fixes + amortissements
2. **appliquerEffetsRecurrents** : cartes actives
3. **appliquerSpecialiteEntreprise** : spécialité d'entreprise (Belvaux = +1 000 prod stockée + 1 000 stocks)
4. **basculerTresorerieSiNegative** : rebascule finale (si trésorerie < 0 → devient 0 et passif découvert augmente)
5. **Test faillite** sur découvert post-rebascule (si découvert > 8 000 → `elimine = true`)

### 4.5 — Checklist trimestre par trimestre

Pour **chaque trimestre T1 à T6**, vérifier à l'étape 7/8 puis à l'étape 8/8 :

#### Étape 7/8 Clôture
- [ ] Charges fixes : **−2 000 €** sur trésorerie (constante CHARGES_FIXES_PAR_TOUR)
- [ ] Remboursement capital emprunt : **−500 €** (dès T1, T25.B — remboursement inchangé)
- [ ] Intérêts d'emprunt : **uniquement à T3** dans cette partie, **pas à T1/T2/T4/T5/T6**
- [ ] Dotations aux amortissements : entrées en charges, pas d'impact tréso
- [ ] Spécialité Belvaux : +1 000 € production stockée + 1 000 € stocks
- [ ] Trésorerie finale **≥ 0** (invariant B2)
- [ ] Si trésorerie théorique < 0 : ligne **« Découvert bancaire »** apparaît au passif

#### Étape 8/8 Bilan
- [ ] **Actif = Passif + Résultat** (invariant de bilan)
- [ ] Résultat net affecté aux capitaux propres
- [ ] Fil d'Ariane : 8/8 étapes en ✅ emerald, puis passage au T suivant

#### Trimestre par trimestre — points de contrôle spécifiques

| T | Intérêts attendus | Observations clés |
|---|---|---|
| T1 | Non *(cadence)* | Trésorerie ne doit pas faire faillite (T25.A/B). Spécialité s'applique (+1 000 tréso pour Belvaux ? — voir §4.4 pt 3). |
| T2 | Non | Créances C+1 du T1 doivent être encaissées à l'étape 1/8. Remboursement capital 2/4 du plan. |
| T3 | **Oui** — première facturation | Intérêts 5 %/an sur capital restant (à calculer sur l'écran). Premier trimestre "lourd". |
| T4 | Non | Effet récurrent des cartes jouées en T3 éventuellement actif. |
| T5 | Non | Observer si des défis Tâche 24 apparaissent (si activés). |
| T6 | Non | Fin des 6 trimestres — bilan patrimonial final à scruter. |

---

## 5. Vérifications ciblées bug fixes (commit `fa3dc3d`)

### 5.1 — B1 : FAILLITE PRÉVISIBLE + seuils en % de DECOUVERT_MAX

**Protocole** : forcer la trésorerie en négatif (ex : T4-T5, refuser les encaissements, dépenser beaucoup en investissement).

Titres attendus par palier *(AlerteDecouvert.tsx:L51, L62, L73, L85, L98)* :

| Découvert (€) | Palier | Titre exact affiché |
|---|---|---|
| 0 → 2 000 | Jaune (≤ 25 %) | « Attention, ton découvert augmente » |
| 2 001 → 4 000 | Orange (≤ 50 %) | « Découvert élevé » |
| 4 001 → 6 000 | Rouge (≤ 75 %) | « Découvert critique » |
| 6 001 → 7 200 | Rouge (≤ 90 %) | *(encore « Découvert critique »)* |
| 7 201 → 7 999 | Imminente (< 100 %) | **« FAILLITE PRÉVISIBLE »** |
| ≥ 8 000 | Faillite effective | « FAILLITE » + `elimine = true` |

- [ ] Le titre « **FAILLITE** » seul (sans « PRÉVISIBLE ») ne doit JAMAIS apparaître tant que le découvert est < 8 000 €
- [ ] Les seuils changent bien aux montants ci-dessus (si DECOUVERT_MAX changeait, ils s'ajusteraient — test implicite de la règle L53)

### 5.2 — B2 : basculement trésorerie négative → découvert à la clôture

**Protocole** : arranger une fin de T où la trésorerie avant clôture est juste au-dessus de 2 000 € (les charges fixes vont la plonger en négatif).

- [ ] À la sortie de l'étape 7/8, **trésorerie ≥ 0** (invariant `basculerTresorerieSiNegative`)
- [ ] Ligne « **Découvert bancaire** » présente au passif avec montant = |tréso négative avant bascule|
- [ ] Message pédagogique du moteur dans la console des modifications du jeu (engine.ts:L514-521)
- [ ] Bilan à l'étape 8/8 reste équilibré (Actif = Passif + Résultat)

### 5.3 — B3 : libellé étape 3/8

- [ ] Titre court sur le bandeau : « **Approvisionnement** » *(STEP_NAMES[2])*
- [ ] Description sous le titre : « **Achat de stocks (optionnel).** » *(STEP_HELP[2])*
- [ ] Titre modale pédago : « **Tu achètes ce que tu vas vendre** » *(MODALES_ETAPES[2].titre)*
- [ ] **Aucune occurrence de « Paiement des commerciaux » ou « rémunères ton équipe »** à l'étape 3/8

---

## 6. Vérifications ciblées UX (commit `597eb29`)

### 6.1 — U1 : nettoyage des libellés 6A/6B

- [ ] **Aucun « 6A », « 6B » ou « étape 6 »** visible à l'écran, sur aucune étape
- [ ] À l'étape 5/8 (Décisions), les sous-choix apparaissent comme « **Sous-étape Recrutement** » et « **Sous-étape Investissement** » (pas « 6A / 6B »)
- [ ] Le titre de la modale de l'étape 5/8 reste « Tu choisis où engager l'entreprise »

### 6.2 — D1 : boutons « Passer » visibles en amber

Les 3 boutons « Passer cette étape » à vérifier :
- [ ] **Intro société** (CompanyIntro) : bouton amber compact (rounded-full)
- [ ] **Étape 3/8 Approvisionnement** : bouton amber (dans LeftPanel, rounded-lg flex-1)
- [ ] **Étape 5/8 Investissement** : bouton amber (dans MainContent, rounded-xl)

Critère visuel commun : `bg-amber-500` + `border-amber-300` + `ring-2 ring-amber-300/50` + texte `slate-950` + `shadow-amber-500/40`. Doit contraster franchement avec le fond sombre.

### 6.3 — U2 : fil d'Ariane 3 états distincts

Dans le LeftPanel section Parcours :
- [ ] **Étape courante** : fond cyan translucide + ring cyan + texte cyan-100 + font-semibold + icône `→` + `aria-current="step"` (vérifiable au DevTools)
- [ ] **Étapes franchies** : bordure emerald + fond emerald translucide + texte emerald-100 + icône `✅` + font-medium + boutonisées (hover et focus visibles)
- [ ] **Étapes à venir** : transparent + texte slate-500 + icône `○` + pas d'interactivité

### 6.4 — U3 : modales consultables au clic

- [ ] Dès l'étape 2/8, cliquer sur l'étape 1/8 dans le fil d'Ariane → la modale « Tes clients paient… » s'ouvre avec l'icône **DollarSign** et la palette **green/emerald** *(pas l'icône/couleur de l'étape courante)*
- [ ] Cliquer sur l'étape 4/8 après l'avoir franchie → modale « Tes clients achètent… » avec icône **Target** et palette **purple/violet**
- [ ] Fermer la modale (Échap ou bouton) ne fait PAS avancer l'étape courante
- [ ] Avant même le premier clic sur une étape franchie, la modale de **première visite** de l'étape courante doit s'être affichée automatiquement une fois (si ce n'est pas le cas, c'est le bug U3-B qu'on vient de corriger qui revient)

---

## 7. Smoke Synergia T1

Objectif : vérifier qu'après le refactor de `appliquerClotureTrimestre` (B2), la spécialité Synergia s'applique toujours correctement (elle est chaînée entre `appliquerEffetsRecurrents` et `basculerTresorerieSiNegative`).

- [ ] Sélectionner **Synergia Lab**, vérifier bilan initial selon §3 (Actif 27k = Passif 27k)
- [ ] Jouer T1 complet, étapes 1/8 à 8/8
- [ ] À l'étape 7/8 (Clôture) :
  - [ ] Charges fixes −2 000 €
  - [ ] Remboursement capital −500 €
  - [ ] Pas d'intérêts (T1 < T3)
  - [ ] Amortissements sur Brevet + Matériel info (montants à observer)
  - [ ] **Spécialité Synergia** : +1 000 € produits financiers + **+1 000 € trésorerie** (doit être visible dans les mouvements de clôture)
- [ ] À l'étape 8/8 : bilan T1 équilibré

**Critère de réussite** : la ligne « Spécialité » dans les modifications de clôture mentionne « +1 000 € produits financiers » *(entreprises.ts:L168-172)*.

---

## 8. Template de rapport post-partie

À remplir en cours de jeu. Ajouter une ligne chaque fois qu'un écart apparaît.

| T | Étape | Écart observé (vs attendu ci-dessus) | Section concernée | Gravité (bloquant/cosmétique) | Screenshot |
|---|---|---|---|---|---|
|   |     |                                      |                    |                                |            |
|   |     |                                      |                    |                                |            |

**Cas spécifiques à remplir obligatoirement** (même si OK) :

| Contrôle | Résultat (OK/KO + commentaire) |
|---|---|
| B1 — « FAILLITE PRÉVISIBLE » (pas « FAILLITE ») entre 7 201 € et 7 999 € de découvert | |
| B2 — Ligne « Découvert bancaire » apparaît au passif si tréso < 0 pré-clôture | |
| B3 — Étape 3/8 : titre « Tu achètes ce que tu vas vendre » | |
| U1 — Aucun « 6A/6B » visible nulle part | |
| D1 — 3 boutons Passer visibles en amber | |
| U2 — 3 états visuels du fil d'Ariane distinguables à distance | |
| U3 — Clic sur étape franchie rouvre sa modale avec bon icône + palette | |
| Modale première visite — s'affiche une fois au début de l'étape 1/8 | |
| Belvaux T1 bilan équilibré | |
| Belvaux T3 intérêts d'emprunt appliqués (première fois) | |
| Belvaux T4 intérêts d'emprunt NON appliqués | |
| Belvaux T6 bilan équilibré | |
| Synergia T1 spécialité produit financier +1 000 € appliquée | |

---

## 9. Zones d'incertitude à trancher en cours de test

Points que je ne peux pas prédire depuis le code seul — à observer :

- **Charges commerciaux T1** : dépend du nombre de commerciaux Belvaux au départ et du coût unitaire. À observer.
- **Nombre de cartes Client générées** : dépend du moteur `genererClients`. À observer.
- **Événements tirés T1-T6** : aléatoires par construction (pool Événement).
- **Cartes Décision disponibles** : dépend de la pioche configurée. Pierre décide lesquelles jouer pour explorer les branches B1/B2.
- **Bilan exact à la fin de chaque T** : résulte de tous les choix faits — seul l'invariant Actif = Passif + Résultat est testable en dur.

---

## 10. Après la partie

- [ ] Archiver ce fichier rempli (ou les notes griffonnées) dans `tasks/rapports-phase4/2026-04-20-belvaux-t1t6.md` pour traçabilité
- [ ] Reporter les écarts bloquants dans `tasks/todo.md` comme nouveaux chantiers (si nécessaire)
- [ ] Si Phase 4 est validée sans bug bloquant → débloquer **Commit 4 T25.C** (refonte des ~50 questions QCM_ETAPES pour le nouveau cycle 8 étapes)
- [ ] Capturer les leçons résiduelles dans `lessons.md` (L58+)

---

*Plan rédigé le 2026-04-20. Sources : tous les fichiers cités en ligne. Aucune valeur numérique n'a été inventée ou extrapolée — les valeurs absentes du code sont marquées « à observer ».*
