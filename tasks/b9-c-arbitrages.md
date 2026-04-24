# B9-C — Arbitrages étape 2 (Approvisionnement) — 2026-04-24

**Objectif** : décider ce que chaque entreprise écrit à l'étape 2, avant d'attaquer le code.
**Portée** : étape 2 uniquement. Tout ce qui concerne la « réalisation » proprement dite reste à l'étape 3 (B9-D).
**Contrainte** : 3 modes service-like (service, logistique, conseil) partagent aujourd'hui la même branche moteur — mais l'étape 2 n'est muette que pour l'instant. Il faut qu'elle ait un sens propre pour chacun, sinon la différenciation des 4 entreprises reste cosmétique.

---

## Q1 — Véloce (logistique) : tournée préparée ou coût d'approche ?

**Recommandation : B — coût d'approche comptabilisé.**

**Écriture cible (étape 2)** :
```
Services extérieurs  +COUT_APPROCHE_VELOCE   (charge, CR)
Dettes fournisseurs  +COUT_APPROCHE_VELOCE   (passif, bilan)
```
Paramètre à calibrer (proposition : 300 € / trimestre), constante `COUT_APPROCHE_VELOCE_PAR_TOUR`.

**Pourquoi pas A (préparation stockable en en-cours)**
- Une tournée est consommée dans le trimestre où elle est préparée. La notion d'en-cours de production sur une prestation de transport < 3 mois est artificielle et contredit le PCG (PCG art. 213-35 : les en-cours sont des biens/services en cours de formation au travers d'un processus de production).
- Stocker puis extourner à l'étape 3 ou 4 créerait deux écritures pour un seul fait économique. Objectif pédagogique : ne pas multiplier les lignes sans création de valeur informationnelle.

**Ce que ça rend visible côté dirigeant-joueur**
- À chaque trimestre, Véloce voit une sortie de cash (ou une dette fournisseur) AVANT même d'avoir facturé → la tension de trésorerie propre au métier logistique devient palpable.
- Asymétrie claire avec Belvaux/Azura dont l'étape 2 gonfle le stock (actif) sans impacter le résultat.

---

## Q2 — Synergia (conseil) : cadrage/staffing écrit ou non ?

**Recommandation : B — écriture de staffing comptabilisée.**

**Écriture cible (étape 2)** :
```
Charges de sous-traitance  +COUT_STAFFING_SYNERGIA   (charge, CR)
Dettes fournisseurs        +COUT_STAFFING_SYNERGIA   (passif, bilan)
```
Paramètre à calibrer (proposition : 400 € / trimestre), constante `COUT_STAFFING_SYNERGIA_PAR_TOUR`.

**Pourquoi pas A (tout à l'étape 3)**
- Laisser l'étape 2 muette pour Synergia signifie que sur 3 modes service-like, 2 (Véloce et Synergia) auraient un comportement divergent à l'étape 2 sans raison pédagogique. Cohérence système > économie de lignes.
- Le staffing est une allocation de ressources engagée **avant** la réalisation. Le comptabiliser en charges de sous-traitance à l'étape 2 rend visible l'engagement pris avant la mission, et explique pourquoi le conseil peut être profitable en CA mais structurellement tendu en cash.

**Ce que ça rend visible côté dirigeant-joueur**
- Synergia et Véloce partagent le même pattern visuel à l'étape 2 (charges + / dettes +), mais avec des libellés et des montants différents → même grammaire comptable, économies de modèle différentes.
- La mission elle-même (honoraires consultants + en-cours éventuels, licences récurrentes) reste traitée à l'étape 3 en B9-D.

---

## Q3 — Belvaux / Azura : confirmation des écritures B8

**Recommandation : confirmer, avec un seul garde-fou de libellé.**

**Belvaux (production)** : l'étape 2 reste **appro matière première**.
```
Stocks matières premières  +QUANTITÉ × 1000       (actif)
Trésorerie                 −QUANTITÉ × 1000       (si comptant)
— ou —
Dettes fournisseurs        +QUANTITÉ × 1000       (si crédit)
```

**Azura (négoce e-commerce)** : l'étape 2 reste **réassort marchandises**.
```
Stocks marchandises        +QUANTITÉ × 1000       (actif)
Trésorerie                 −QUANTITÉ × 1000       (si comptant)
— ou —
Dettes fournisseurs        +QUANTITÉ × 1000       (si crédit)
```

**Garde-fou unique** : aujourd'hui le moteur B8 écrit dans une ligne de stock générique (`categorie: "stocks"`). Pour rendre l'asymétrie Belvaux/Azura visible dans le bilan (pédagogiquement : matière ≠ marchandise), il faut que **le libellé de la ligne de stock** reflète le mode :
- Belvaux : ligne `Stocks matières premières`
- Azura : ligne `Stocks marchandises`

Ce libellé existe déjà dans les données entreprises (cf. `entreprises.ts`) mais il faut s'assurer que `appliquerAchatMarchandises` cible bien cette ligne par nom, pas par position. Si ce n'est pas le cas, c'est un micro-fix à ajouter dans B9-C.

**Pourquoi pas de différenciation comptable au-delà** : sur le plan PCG, matières premières (classe 31) et marchandises (classe 37) sont deux sous-classes du même poste Stocks. Les règles d'évaluation et de rotation sont identiques à ce stade de jeu. Seul le libellé change pour l'élève.

---

## Ce qui reste ouvert pour B9-D (hors scope de ce doc)

- Réalisation métier proprement dite (étape 3) : production stockée Belvaux, extourne en-cours Véloce, honoraires consultants + licences récurrentes Synergia, coût du canal Azura (constante `COUT_CANAL_AZURA_PAR_TOUR = 300` déjà posée en B9-A).
- Extension du switch `appliquerCarteClient` (étape 4) avec les 4 branches et les extournes.
- Calibrage fin des montants : les valeurs 300/400 € proposées ci-dessus sont des placeholders à affiner après une partie manuelle.

---

## Synthèse tranchée

| Entreprise | Étape 2 (nouveau) | Écriture type |
|---|---|---|
| Belvaux | Appro matières premières (B8 conservé) | Stocks MP +, Trésorerie − ou Dettes four + |
| Azura | Réassort marchandises (B8 conservé) | Stocks Mdse +, Trésorerie − ou Dettes four + |
| Véloce | **Coût d'approche tournée** (nouveau B9-C) | Services ext +, Dettes four + |
| Synergia | **Staffing mission** (nouveau B9-C) | Sous-traitance +, Dettes four + |

**Si Pierre valide ce tableau**, B9-C devient une tâche de code ciblée :
1. Ajouter `COUT_APPROCHE_VELOCE_PAR_TOUR` et `COUT_STAFFING_SYNERGIA_PAR_TOUR` dans `types.ts`.
2. Dispatcher dans `appliquerAchatMarchandises` (ou fonction sœur) selon le mode.
3. Adapter `LeftPanel` pour afficher une UI différente à l'étape 2 (bouton « Préparer la tournée » pour Véloce, « Staffer la mission » pour Synergia, input quantité conservé pour Belvaux/Azura).
4. Vérifier que `pushByName` cible la bonne ligne de stock par nom (garde-fou Q3).
5. Tests moteur : 4 cas × 2 modes paiement = 8 nouveaux tests minimum.
