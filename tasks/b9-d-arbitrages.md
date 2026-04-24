# B9-D — Arbitrages étape 3 (Réalisation métier) — 2026-04-24

**Objectif** : décider les écritures comptables exactes que chaque entreprise pose à l'étape 3 (REALISATION_METIER), aujourd'hui placeholder no-op depuis B9-A.
**Portée** : étape 3 uniquement. Le switch `appliquerCarteClient` à l'étape 4 (B9-E) n'est traité qu'au titre de l'extourne des en-cours pour Véloce/Synergia.
**Contrainte** : chaque entreprise doit écrire quelque chose à l'étape 3, sinon la polymorphie métier reste cosmétique. Et les écritures doivent respecter la double partie PCG : débit = crédit à chaque fois.

---

## Q1 — Belvaux (production) : 2 écritures doubles exactes

**Recommandation : consommation matière première + entrée produits finis, effet net nul sur le résultat.**

**Écriture 1 (consommation des matières premières)** :
```
Débit    Variation de stock matières premières (charge, CR)    +1 000 €
Crédit   Stocks matières premières (actif, bilan)              −1 000 €
```

**Écriture 2 (entrée en stock des produits finis)** :
```
Débit    Stocks produits finis (actif, bilan)                  +1 000 €
Crédit   Production stockée (produit, CR)                      +1 000 €
```

**Montant V1** : 1 unité par trimestre, valorisée à `PRIX_UNITAIRE_MARCHANDISE = 1 000 €`. Production automatique, pas de choix joueur en V1 (simplification — introduction d'un choix de volume prévue en B9-G ou +).

**Pourquoi cette option (et pas une seule écriture simplifiée)**
- Le PCG impose ce double enregistrement pour l'industrie (classe 31 matières, classe 35 produits finis, compte 6031 variation de stock MP, compte 713 production stockée). Simplifier en une seule écriture aurait été pédagogiquement faux.
- L'effet net sur le résultat est **nul** à l'étape 3 : la charge (6031) et le produit (713) s'annulent. C'est voulu : **la marge ne se fait pas à la production, elle se fait à la vente**. Message fondamental pour l'élève-dirigeant.
- La valorisation à coût de matière (1 000 €) suppose zéro coût de transformation (main d'œuvre, énergie) à ce stade. En V1 c'est acceptable : les charges de personnel commercial sont déjà à l'étape 1, les charges fixes à la clôture. Une vraie valorisation à coût de production (MP + MO + énergie) sera possible en B9-G ou + si Pierre veut raffiner.

**Impact sur le bilan Belvaux après étape 3 (par rapport à après étape 2)**
- Stocks matières premières : −1 000 € (consommé)
- Stocks produits finis : +1 000 € (créé)
- Charges "variation MP" : +1 000 € (enregistrée)
- Produits "production stockée" : +1 000 € (enregistrée)
- Résultat net : inchangé (charges et produits se compensent)

**Garde-fou data** : Belvaux doit avoir **deux** lignes de stock dans `actifs` — `Stocks matières premières` (déjà renommée en B9-C) et `Stocks produits finis` (**à ajouter**, initiale à 0 €). Cela impose un helper `pushByName` pour cibler la bonne ligne par nom, puisque `appliquerDeltaPoste` ne matche aujourd'hui que par `categorie === "stocks"` (qui récupère la première ligne).

---

## Q2 — Azura (négoce) : quel acte réel justifie l'écriture à cette étape ?

**Recommandation : coût de canal (commission marketplace + marketing) en charges, fixe par trimestre.**

**Écriture unique (1 écriture double)** :
```
Débit    Services extérieurs (charge, CR)                      +300 €
Crédit   Dettes fournisseurs (passif, bilan)                   +300 €
```

**Montant V1** : `COUT_CANAL_AZURA_PAR_TOUR = 300` (constante déjà posée en B9-A, commit `b4c41b0`).

**Acte réel que ça représente**
- Azura vend via une marketplace (Amazon, Fnac) et via son site e-commerce. Chaque trimestre, les canaux prélèvent des commissions (frais marketplace, commission ads, abonnement outils).
- Contrairement à Belvaux qui transforme physiquement sa matière première, Azura ne fait pas d'acte de production au sens industriel. Mais Azura engage un **coût de canal** récurrent qui n'est ni de l'achat de stock (étape 2) ni un salaire commercial (étape 1).
- Ce coût est comptabilisé en **services extérieurs** (PCG classe 62 — rémunérations d'intermédiaires et honoraires), pas en achat.

**Pourquoi pas "rien" à l'étape 3 pour Azura**
- Si Azura n'écrit rien à l'étape 3, son étape 3 devient muette (bouton Passer) et on perd la différenciation métier qu'on construit depuis B9-A.
- Pédagogiquement : même une entreprise de négoce pur a des coûts structurels de distribution. Le jeu ne doit pas faire croire qu'Azura vit seulement de la marge prix de vente − prix d'achat : il y a aussi les frais de canal qui grignotent la marge.

**Impact sur le bilan / CR Azura après étape 3**
- Services extérieurs : +300 € (charge enregistrée)
- Dettes fournisseurs : +300 € (à régler au trimestre suivant)
- Résultat net : −300 €
- Trésorerie : inchangée (paiement différé)

---

## Q3 — Véloce / Synergia : en-cours de production + extourne à la facturation

**Recommandation : en-cours constaté à l'étape 3 pour le montant du coût déjà engagé à l'étape 2, puis extourné à l'étape 4 au moment de la facturation.**

### Schéma exact Véloce (logistique)

**Étape 2 (B9-C, déjà en place)** — coût d'approche engagé :
```
Débit    Services extérieurs          +300 €
Crédit   Dettes fournisseurs          +300 €
```

**Étape 3 (B9-D, à implémenter)** — constatation de l'en-cours :
```
Débit    Stocks en-cours de production (actif, bilan)   +300 €
Crédit   Production stockée (produit, CR)               +300 €
```

**Étape 4 (B9-E, à propager)** — extourne de l'en-cours + facturation :
```
Débit    Production stockée             −300 €       (extourne)
Crédit   Stocks en-cours                −300 €       (extourne)

Puis pour chaque carte client, la logique B8 service/logistique/conseil continue :
Débit    Services extérieurs           +coutVariable
Crédit   Dettes fournisseurs           +coutVariable
Débit    Trésorerie (ou créances)      +prixVente
Crédit   Ventes                        +prixVente
```

### Schéma exact Synergia (conseil)

Identique en structure à Véloce, avec 400 € à la place de 300 € (constante `COUT_STAFFING_SYNERGIA_PAR_TOUR`).

**Étape 3 (B9-D)** :
```
Débit    Stocks en-cours de production     +400 €
Crédit   Production stockée                +400 €
```

**Étape 4 (B9-E)** : extourne −400 / −400, puis logique B8 standard.

### Pourquoi ce schéma (et pas autre chose)

**Pourquoi une écriture d'en-cours à l'étape 3 plutôt que rien**
- En B9-C on a établi que les 3 modes service-like (service, logistique, conseil) partagent une grammaire comptable à l'étape 2 (charges + / dettes +). Pour l'étape 3 la grammaire peut être différente, mais il faut AU MOINS une écriture visible, sinon l'étape 3 devient "Passer" pour 2 entreprises sur 4.
- L'en-cours (compte 34 en PCG) est exactement fait pour ça : représenter la valeur d'une prestation en cours d'exécution qui n'est pas encore facturée. C'est le bon compte, pas un bricolage pédagogique.
- L'effet pédagogique : l'élève voit que le coût engagé étape 2 a produit un actif (l'en-cours) à l'étape 3. Cela matérialise la valeur du travail en cours, même si la facturation n'a pas encore eu lieu.

**Pourquoi extourner à l'étape 4 (pas au trimestre suivant)**
- Dans notre modèle de jeu, une tournée ou une mission s'exécute dans le trimestre (étape 2 prépa → étape 3 réa → étape 4 facturation). Pas de chevauchement inter-trimestres en V1.
- L'extourne à l'étape 4 au moment de la facturation est conforme au PCG : quand la prestation est facturée, l'en-cours est repris et la vente est enregistrée.
- L'effet pédagogique : l'en-cours apparaît à l'étape 3 puis disparaît à l'étape 4. Pour l'élève, c'est le rappel que "en-cours ≠ vente" — une valeur constatée qui devient réelle au moment de la facturation.

**Conservation du coût variable par carte client (B8)**
- La logique B8 actuelle pour `service`/`logistique`/`conseil` dans `appliquerCarteClient` ajoute un `coutVariable` par carte (services ext + / dettes +). Elle reste inchangée en B9-D. En B9-E, on ajoute simplement l'extourne en amont de cette logique, une seule fois par trimestre (pas par carte).

---

## Implications pour B9-E (extension `appliquerCarteClient`)

À l'étape 4, pour Véloce et Synergia, la facturation doit **d'abord extourner** l'en-cours constaté à l'étape 3, **puis** appliquer la logique B8 habituelle.

Deux options d'architecture :

1. **Option intégrée** — `appliquerCarteClient` détecte s'il s'agit de la 1ère carte du trimestre et, dans ce cas, insère l'extourne avant la logique B8. Complexe à maintenir (état "1ère carte du trimestre" à tracker).

2. **Option séparée** — créer une fonction dédiée `appliquerExtourneEnCours(etat, joueurIdx)` appelée **une fois** au début de l'étape 4 pour les modes logistique/conseil, avant la boucle de traitement des cartes clients. Plus propre.

**Recommandation : option 2 (séparée).** Cela garde `appliquerCarteClient` inchangé sur sa logique B8 et sort l'extourne dans une fonction dédiée qui s'exécute une seule fois par trimestre. Le hook `useGameFlow` gère l'appel.

---

## Synthèse tranchée

| Entreprise | Étape 3 (B9-D) | Écriture(s) | Montant V1 |
|---|---|---|---|
| Belvaux | Production MP → PF | 2 écritures doubles (consommation + entrée PF) | 1 000 € |
| Azura | Coût de canal (marketplace, ads) | 1 écriture (servicesExt + / dettes +) | 300 € |
| Véloce | Constatation en-cours tournée | 1 écriture (en-cours + / productionStockée +) | 300 € |
| Synergia | Constatation en-cours mission | 1 écriture (en-cours + / productionStockée +) | 400 € |

**Garde-fous data à implémenter dans B9-D** :
- Ajouter ligne `Stocks produits finis` (0 € initial) à Belvaux dans `actifs`.
- Ajouter ligne `Stocks en-cours de production` (0 € initial) à Véloce et Synergia dans `actifs`.
- Créer helper `pushByName(joueur, modifications, nomLigne, delta, libelle)` pour cibler les lignes par nom dans les bilans à plusieurs stocks.

**Fonction moteur cible** : `appliquerRealisationMetier(etat, joueurIdx)` (aujourd'hui placeholder) devient un dispatcher qui détecte le mode via `getModeleValeurEntreprise` et délègue à `appliquerRealisationBelvaux` / `appliquerRealisationAzura` / `appliquerRealisationVeloce` / `appliquerRealisationSynergia`. Architecture cohérente avec B9-C (dispatchers par entreprise).

**Ce qui reste pour B9-E** (hors B9-D) :
- `appliquerExtourneEnCours` appelée une fois à l'étape 4 avant le traitement des cartes clients (uniquement pour logistique/conseil).
- Wiring dans `useGameFlow` / `useVenteFlow`.
- Tests moteur : 2 nouveaux tests d'extourne (Véloce / Synergia).

---

## Si Pierre valide ce tableau, B9-D devient

1. `types.ts` : aucun ajout de constante (les montants 300/400/1000 sont déjà posés).
2. `data/entreprises.ts` : 3 nouvelles lignes bilan (Belvaux +Stocks PF, Véloce +En-cours, Synergia +En-cours). Équilibre capitaux propres inchangé (lignes à 0 € à l'initial).
3. `engine.ts` : helper `pushByName` + dispatcher `appliquerRealisationMetier` + 4 fonctions dédiées `appliquerRealisationBelvaux/Azura/Veloce/Synergia`.
4. `index.ts` : exports.
5. `useGameFlow.ts` : branche `case ETAPES.REALISATION_METIER` avec un `buildActiveStep` qui récupère les écritures du moteur (au lieu du placeholder actuel).
6. Tests moteur : 4 nouveaux tests (1 par entreprise).
7. Garde-fou : tsc + tests + smoke 4 entreprises × étape 3 équilibre bilan.

Estimation : même ordre de grandeur que B9-C (4-5 fichiers, ~200 lignes de code + tests).
