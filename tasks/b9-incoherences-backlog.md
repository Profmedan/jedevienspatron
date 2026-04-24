# B9 — Backlog des incohérences à traiter (2026-04-24)

Issu de l'audit Pierre post B9-E. Les 3 premiers points (B1/B2/B3 Belvaux) ont été traités dans le commit fix Belvaux. Les 7 autres restent à traiter — documentés ici pour ne pas les oublier.

**Principe** : le jeu raconte "production / service / négoce" dans les libellés, mais le moteur fait parfois encore "stock générique + capacité générique". Les points ci-dessous sont les endroits où cette dissonance subsiste.

## Ordre de correction recommandé (par Pierre)

1. ✅ Belvaux : vente sur Stocks produits finis, production à 2 unités, suppression de l'ancien effetsPassifs. **FAIT** (commit fix Belvaux 2026-04-24).
2. Dettes fournisseurs : rendre le D+1 réel.
3. Clients perdus : distinguer capacité insuffisante, stock insuffisant, production insuffisante. **PARTIEL** (production insuffisante ajoutée dans le commit Belvaux ; capacité insuffisante déjà en place ; stock insuffisant Azura reste à faire).
4. Cartes investissement : remplacer "+ ventes" par "+ capacité" ou brancher une vraie génération de demande/production.
5. Recalibrer après une partie complète T1-T6.

## Backlog détaillé

### #4 — Dettes fournisseurs D+1 payées trop vite

**Symptôme** : les achats à crédit (étape 2), les coûts d'approche Véloce (étape 2), le staffing Synergia (étape 2), les frais variables de service (étape 4), tous créent `dettes fournisseurs +`. Mais la clôture (`appliquerClotureTrimestre`) paie **immédiatement** toutes les dettes fournisseurs à l'étape 7, le même trimestre.

Pierre : les libellés disent "règlement au trimestre suivant", mais le cash sort au même trimestre.

**Conséquence** : le BFR (Besoin en Fonds de Roulement) et le décalage fournisseurs ne sont pas enseignables. L'élève ne voit jamais ses dettes fournisseurs migrer d'un trimestre à l'autre.

**Fix** : deux options à trancher :
- **Option A** : écrire les nouvelles dettes en `dettesD2` (2 trimestres de délai). La clôture paie seulement `dettes` (arrivées à échéance) et promeut `dettesD2 → dettes`.
- **Option B** : ne payer à la clôture que les dettes **présentes en début de trimestre**, pas celles créées ce trimestre. Snapshot au début de l'étape 7.

**Emplacements** : `engine.ts` clôture (autour de ligne 495), tous les `push("dettes", +X, ...)` avec libellé "règlement au trimestre suivant".

### #5 — Clients non servis par manque de stock Azura disparaissent sans être comptés

**Symptôme** : `appliquerCarteClient` peut retourner `succes: false` si `getTotalStocks(joueur) < coutVariable` pour Azura en mode négoce (cf. engine.ts ligne ~1049). Mais `useGameFlow` (case FACTURATION_VENTES) ignore les échecs : `if (r.succes) mods = [...]`, les clients perdus ne sont comptés que sur la capacité logistique.

**Résultat** : le joueur Azura qui a épuisé son stock voit ses clients "disparaître" sans message pédagogique.

**NB** : Belvaux a déjà été corrigé dans le commit fix Belvaux (filtrage par `floor(stocksPF / coutVar)` en amont + message "production insuffisante"). Mais Azura qui a 1 seule ligne de stock (marchandises) peut aussi tomber en rupture.

**Fix** : appliquer le même filtrage en amont pour le mode négoce. Calculer `nbServibles = floor(stocksMarchandises / coutVar)` avant la boucle, limiter les clients traités, compter les perdus avec un 3e message "Rupture de stock marchandises".

**Emplacement** : `useGameFlow.ts` case FACTURATION_VENTES, après le filtrage capacité logistique.

### #6 — Les cartes disent "+4 ventes/trim" alors qu'elles donnent de la capacité

**Symptôme** : les cartes Robot Belvaux, Marketplace Azura, ERP Synergia, etc. ont des descriptions qui promettent "+4 ventes/trim". Mais leurs effets immédiats/récurrents ne génèrent pas de clients — elles augmentent seulement la `CAPACITE_IMMOBILISATION` (mapping `types.ts` ligne ~586).

**Résultat** : "+4 ventes" n'est vrai que SI la demande existe. Un joueur qui investit dans une marketplace N2 sans avoir de commerciaux supplémentaires ne verra AUCUN gain.

**Fix** : 2 actions complémentaires :
- **UX** : reformuler les descriptions en "+4 capacité de traitement" ou "+4 clients servis/trim si la demande existe".
- **Moteur** (optionnel V2) : certaines cartes pourraient aussi générer de la demande passive (+1 client/trim). À arbitrer carte par carte.

**Emplacements** : `cartes.ts` lignes 888 (robot Belvaux), 974 (marketplace Azura), 1014 (ERP Synergia), et autres.

### #7 — Les investissements Belvaux ne pilotent pas la production

**Symptôme** : les cartes "Robot Belvaux N1" et "N2" augmentent une capacité générique de ventes (via `CAPACITE_IMMOBILISATION`). Mais `appliquerRealisationBelvaux` ignore totalement ces cartes : la constante `PRODUCTION_BELVAUX_PAR_TOUR = 2` est fixe.

**Résultat** : acheter un robot Belvaux augmente "la capacité de livraison" mais pas "la capacité de fabriquer". Incohérent avec le sens industriel.

**Fix** : introduire un mapping `CAPACITE_PRODUCTION_PAR_CARTE` qui ajoute N unités de production par tour selon les cartes actives. Exemple :
- `belvaux-robot-n1` : +1 unité production/trim.
- `belvaux-robot-n2` : +2 unités production/trim.
- Belvaux initial : 2 unités (constante).
- Après Robot N2 actif : 2 + 2 = 4 unités/trim.

`appliquerRealisationBelvaux` calcule alors : `capaciteProduction = PRODUCTION_BELVAUX_PAR_TOUR + Σ(bonus cartes actives)`.

**NB** : c'est la V2 de l'Option 3 de l'arbitrage "capacité par immobilisation" qu'on avait laissée pour plus tard. Naturellement alignée avec ce point #7.

**Emplacement** : `engine.ts` `appliquerRealisationBelvaux` + nouveau mapping dans `types.ts`.

### #8 — Descriptions commerciaux promettent du "résultat net" alors qu'elles donnent une contribution brute

**Symptôme** : les cartes Commercial Junior/Senior/Expert ont des descriptions du type "Résultat net : +1 000 €/trim". Or avec les charges fixes, dotations, coûts métier et BFR, ce qui rentre réellement en résultat net est bien différent.

**Fix** : reformuler en **"Marge contributive avant charges fixes et amortissements : +1 000 €/trim"** ou **"Contribution brute"**.

**Emplacements** : `cartes.ts` lignes 79, 93, 107.

### #9 — Texte pédagogique étape 2 encore faux pour Véloce/Synergia

**Symptôme** : `gameFlowUtils.ts` (line ~65) dit "Pas de charge à ce stade" pour l'étape 2. Or depuis B9-C, Véloce et Synergia **comptabilisent bien des servicesExterieurs à l'étape 2** (coût d'approche / staffing).

**Résultat** : texte statique incompatible avec les modes logistique/conseil. L'élève lit "pas de charge" mais voit +300/+400 € de services ext. s'ajouter — dissonance.

**Fix** : rendre le texte polymorphe selon l'entreprise.

Options :
- **Option A** : texte conditionnel dans `gameFlowUtils.ts` basé sur `modele.mode`.
- **Option B** : rendre `ETAPE_INFO[2]` accesseur prenant `modele.mode` en paramètre.

**NB** : le texte de MODALES_ETAPES[2] (dans pedagogie.ts) a déjà été rewrite en B9-E pour couvrir les 4 métiers. Ce qui reste à corriger, c'est le texte court affiché dans l'activeStep par `gameFlowUtils.ETAPE_INFO[2].principe`.

**Emplacement** : `apps/web/app/jeu/hooks/gameFlowUtils.ts` ETAPE_INFO[2].

### #10 — Priorité clients favorise les délais longs

**Symptôme** : le tri `useGameFlow.ts` (ligne ~571) place les délais de paiement les plus longs en premier (`b.delaiPaiement - a.delaiPaiement`). Si la capacité est limitée, le jeu sert les **Grands Comptes** (délai C+2) avant les **particuliers comptant**.

**Résultat** : aggravation du BFR sans choix du joueur. Le joueur ne comprend pas pourquoi sa trésorerie est serrée alors qu'il a "tout vendu".

**Fix** : 2 options à trancher :
- **Option A** : inverser le tri — servir d'abord les clients comptants, puis TPE (C+1), puis Grands Comptes (C+2). Priorité à la trésorerie immédiate.
- **Option B** : laisser le joueur choisir l'ordre de priorité (UI plus complexe, décision stratégique consciente).

**Recommandation V1** : Option A. Le joueur comprendra intuitivement "on encaisse le cash d'abord". Pour V2, option B possible avec une carte Décision "Politique de relance" qui change l'ordre.

**Emplacement** : `apps/web/app/jeu/hooks/useGameFlow.ts` ligne ~571.

## Calibrage observé (à retester après correction #1 Belvaux)

Au T1 sans investissement ni achat manuel (audit Pierre pré-fix Belvaux) :
- Belvaux -2 000 € résultat
- Azura -2 300 € résultat
- Véloce -2 300 € résultat
- Synergia -1 400 € résultat

Toutes les entreprises commencent en perte comptable malgré des ventes. Pas forcément interdit (la perte au T1 est pédagogique), mais ça veut dire qu'investir tôt devient punitif. À réévaluer après correction #1.

## Effort estimé

| # | Scope | Complexité | Priorité |
|---|---|---|---|
| ✅ B1/B2/B3 | Belvaux | fait | ✅ Bouclé |
| 4 | Dettes D+1 | **Élevée** (touche la clôture, tous les modes) | **Haute** (BFR = pédagogie clé) |
| 5 | Clients perdus Azura | Faible | Haute |
| 6 | Descriptions cartes | Faible (UX) + Moyenne (moteur optionnel) | Moyenne |
| 7 | Investissements Belvaux → production | Moyenne | Moyenne (attendre #4) |
| 8 | Descriptions commerciaux | Trivial (3 textes) | Basse |
| 9 | Texte étape 2 polymorphe | Faible | Basse |
| 10 | Tri clients | Faible | Moyenne |

Suggestion d'enchaînement V1 : #5 + #8 + #9 + #10 (quick wins < 1h chacun), puis #4 (plus lourd, 2-3h), puis #6 + #7 (mini-chantier V2 capacité par carte).

## Pourquoi ce backlog existe

L'audit a révélé que la nouvelle logique métier B9 était "à moitié branchée" : les 4 entreprises ont maintenant une vraie identité (modeleValeur, écritures polymorphes), mais certaines anciennes mécaniques génériques B8 continuent de tourner derrière. Le commit fix Belvaux ferme les 3 plus graves (contrat pédagogique "produire ≠ vendre"). Ce document liste les 7 autres pour garder la trace.

**Principe général** : après B9-D/E, toute nouvelle feature qui touche un comportement "générique" (stock, capacité, dette) doit vérifier si elle doit être rendue polymorphe par mode. Et tout `effetsPassifs` legacy doit être relu pour s'assurer qu'il ne doublonne pas avec les fonctions métier polymorphes.
