# B9-E — Arbitrage coût variable étape 4 (logistique / conseil) — 2026-04-24

**Question unique** : pour Véloce (logistique) et Synergia (conseil), le `coutVariable` ajouté PAR CARTE CLIENT à l'étape 4 par la logique B8 de `appliquerCarteClient` représente quoi exactement, et doit-il survivre en B9-E ?

**Pipeline déjà posé (par trimestre)** :
```
Étape 2 (B9-C) : servicesExt +300/+400     / dettes +300/+400      (coût d'approche / staffing)
Étape 3 (B9-D) : en-cours +300/+400        / productionStockée +300/+400
Étape 4 extourne (B9-D) : en-cours −300/−400 / productionStockée −300/−400
Étape 4 cartes clients (B8 actuel) : servicesExt +1000 PAR CARTE / dettes +1000 PAR CARTE + vente
```

À clarifier : ce `+1000 par carte` de B8 est-il un doublon du `+300/+400` de l'étape 2, ou une nature différente ?

---

## Option 1 : même coût que l'étape 3 (= doublon)

**Conséquence** : supprimer le `coutVariable` à l'étape 4 pour logistique/conseil, l'étape 4 se limite alors à extourne + vente.

**Problème** : si on supprime, les ventes deviennent 100 % de marge brute pour Véloce/Synergia (le coût unique serait 300/400 fixes par trimestre, quelle que soit la volumétrie de cartes clients). C'est exactement le **bug B8-D** que Pierre avait corrigé en introduisant ce `coutVariable` par carte. Revenir à 100 % de marge casse la pédagogie : l'élève conclut à tort que « plus tu vends, plus c'est rentable, sans limite ».

**Verdict** : à rejeter. Supprimer vide l'étape 4 de sens variable et rouvre un bug déjà corrigé.

---

## Option 2 : coût COMPLÉMENTAIRE de livraison / finalisation (= nature différente)

**Conséquence** : garder le `coutVariable` à l'étape 4, mais avec un libellé qui clarifie ce qu'il représente — différent du coût d'approche / staffing de l'étape 2.

**Interprétation économique réaliste** :

- **Véloce (logistique)** :
  - Étape 2 (300 €, fixe/trim) : *coût d'approche de la tournée* — carburant prorata, préparation véhicule, quote-part salaire chauffeur fixe du trimestre. Ce que l'entreprise engage AVANT de savoir combien elle va livrer.
  - Étape 4 (1 000 € par livraison, variable) : *frais variables de livraison* — manutention spécifique à chaque colis, emballage, assurance cargaison, éventuelle sous-traitance dernier kilomètre. Proportionnel au nombre de livraisons effectuées.

- **Synergia (conseil)** :
  - Étape 2 (400 €, fixe/trim) : *staffing mission* — allocation consultants, kickoff, licences outils partagées, frais de commercialisation.
  - Étape 4 (1 000 € par mission, variable) : *frais variables de mission* — déplacements consultants, matériel spécifique à la mission, support de déploiement, éventuelle sous-traitance expertise pointue. Proportionnel au nombre de missions livrées.

**Pourquoi c'est comptablement propre** : en PCG, la distinction fixe/variable est centrale pour l'analyse de la marge sur coûts variables (CA − charges variables = marge contributive). Avoir les deux natures rend le jeu pédagogique sur ce point fondamental : pourquoi une entreprise de service peut être rentable *par mission* (marge variable positive) mais perdre de l'argent *au trimestre* (charges fixes non couvertes).

**Pourquoi ce n'est PAS un doublon comptable** : l'étape 3 constate l'en-cours pour la VALEUR de l'approche/staffing (= part fixe). L'étape 4 extourne cet en-cours (la part fixe sort du stock) PUIS facture chaque carte avec ses propres frais variables. Les deux composantes coexistent sans se recouvrir.

**Verdict recommandé** : à retenir.

---

## Option 3 : aucun coût supplémentaire à l'étape 4

**Conséquence** : étape 4 = extourne + facturation seulement, pas de `coutVariable` par carte.

**Problème** : même que l'option 1 — rouvre le bug B8-D, la marge brute redevient 100 %. Pédagogiquement faux pour un transporteur ou un consultant.

**Verdict** : à rejeter.

---

## Recommandation tranchée : Option 2

**Décision** : conserver le `coutVariable` par carte à l'étape 4 pour les modes logistique et conseil, MAIS clarifier les libellés dans `appliquerCarteClient` pour que l'élève comprenne la nature différente des deux coûts.

**Montant V1** : `PRIX_UNITAIRE_MARCHANDISE = 1 000 €` (constante B8 actuelle). Cohérent avec les modes production et négoce. Calibrage fin prévu après partie manuelle, si nécessaire.

**Libellés à modifier dans `appliquerCarteClient` (branches logistique/conseil)** :

| Mode | Libellé actuel (B8) | Nouveau libellé proposé (B9-E) |
|---|---|---|
| logistique | "Services extérieurs (coût variable service)" | "Frais variables de livraison (manutention, emballage, assurance cargaison) : +1 000 €" |
| conseil | "Services extérieurs (coût variable service)" | "Frais variables de mission (déplacements, matériel, support déploiement) : +1 000 €" |
| service (legacy) | inchangé | inchangé (rétro-compat saves v3) |

**Note B9-D → B9-E** : aucune refonte de structure nécessaire. La logique B8 reste techniquement juste. La seule chose à faire en B9-E est de **renommer les libellés** dans le switch `appliquerCarteClient` pour qu'ils reflètent la nature économique de chaque composante (fixe/étape 2 vs variable/étape 4).

---

## Plan B9-E

Si Pierre valide ce tranchage :

1. **`engine.ts`** dans `appliquerCarteClient`, ajuster les libellés des branches logistique et conseil :
   - Détecter `modele.mode === "logistique"` → libellé "Frais variables de livraison (…)"
   - Détecter `modele.mode === "conseil"` → libellé "Frais variables de mission (…)"
   - Garder `service` inchangé (legacy).
2. **`modeleValeur.libelleExecution` et `modeleValeur.libelleContrepartie`** dans `entreprises.ts` :
   - Véloce : "Livraison réalisée" / "Frais variables de livraison"
   - Synergia : "Mission livrée" / "Frais variables de mission"
3. **Tests moteur** : ajuster les 2 tests existants B8-D (Véloce/Synergia) pour vérifier les nouveaux libellés dans les explications.
4. **Garde-fou** : tsc + tests + smoke test B9-D étendu pour vérifier que le pipeline complet (étape 2 → 3 → 4 extourne → 4 cartes clients) produit la bonne chronologie d'écritures.
5. **Glossaire (optionnel)** : ajouter ou enrichir l'entrée "Coûts fixes vs variables" si elle n'existe pas déjà (principe de marge sur coûts variables).

Estimation : plus léger que B9-C ou B9-D (3-4 fichiers, ~100 lignes de code). Pas de nouvelle fonction moteur, juste un rename de libellés + éventuelle entrée glossaire.

---

## Synthèse tranchée

**Le `coutVariable` par carte à l'étape 4 pour Véloce/Synergia n'est PAS un doublon** : il représente les frais variables par livraison/mission, distincts du coût d'approche/staffing fixe de l'étape 2. Il survit en B9-E, avec des libellés clarifiés pour que l'élève distingue les deux natures de coûts.

Montant V1 : 1 000 € par carte (inchangé B8). Recalibrage après partie manuelle possible.
