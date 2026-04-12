# Guide Rapide — Je Deviens Patron V5

## Installation & Démarrage

### 1. Importer le script dans Google Sheets

1. Ouvrir un **Google Sheet** neuf ou existant
2. **Outils** → **Éditeur de script**
3. Copier **intégralement** le contenu de `jeu_interactif_V5.gs`
4. Coller dans l'éditeur Google Apps Script
5. **Fichier** → **Enregistrer** (nom : "Je Deviens Patron V5")
6. Fermer l'éditeur, revenir au Sheet

### 2. Autoriser le script

- Recharger le Sheet (`Ctrl+R` ou `Cmd+R`)
- Un menu **🎮 Je Deviens Patron** apparaît
- Cliquer dessus : autorisation Google requise
- Accepter les permissions

---

## Première Partie

### Démarrer une nouvelle partie

1. **Menu → 🆕 Nouvelle partie**
2. **Sélectionner une entreprise** :
   - 🌿 **Belvaux Saveurs** : Épicerie fine bio. Équilibrée.
   - 🚲 **Véloce Express** : Livraison à vélo. Trésorerie tendue.
   - 🎨 **Azura Design** : Studio design. Peu de clients, marges hautes.
   - 💻 **Synergia Tech** : SSII. Forte croissance, fonds de roulement importants.

3. **Sélectionner une durée** :
   - **6 trimestres** (~1h) : Découverte
   - **8 trimestres** (~1h15) : Standard (recommandé)
   - **10 trimestres** (~1h30) : Avancé
   - **12 trimestres** (~1h45) : Expert

4. **Cliquer : ▶ Démarrer la simulation**

---

## Jouer un Trimestre

### Dialog principal

**Vous voyez 5 catégories de décisions** à faire chaque trimestre :

#### 📦 POLITIQUE D'ACHATS / PRODUCTION
Combien vous investissez dans les stocks ?

- **🛑 Aucun achat** : Trésorerie préservée. Risque rupture de stock.
- **🟡 Achats prudents (×0,5)** : Faible investissement. Volume limité.
- **🟢 Achats équilibrés (×1)** : Standard. Bon équilibre.
- **🔵 Achats ambitieux (×2)** : Forte dépense. Gros potentiel si demande suit.

**Conseil** : Regardez votre trésorerie. Si elle est < 2000€, évitez l'ambitieux.

---

#### 💰 STRATÉGIE TARIFAIRE
À quel prix vous vendez ?

- **🏷️ Prix cassés (−20%)** : Volume +30%, marge réduite.
- **⚖️ Prix du marché** : Équilibre. Sûr.
- **💎 Prix premium (+20%)** : Marge +20%, volume −20%. Fonctionne si qualité reconnue.

**Conseil** : Débuter avec "Prix du marché". Premium si >15 clients et satisfaction >75%.

---

#### 📣 ACTION COMMERCIALE
Comment développez-vous votre clientèle ?

- **😶 Pas d'action** : Trésorerie +0€. Risque : −1 client par attrition.
- **📞 Démarchage téléphonique (500€)** : +2 clients. Petit budget.
- **📰 Publicité locale (1 500€)** : +5 clients. Moyen budget.
- **📱 Campagne digitale (3 000€)** : +10 clients. Gros budget.

**Conseil** : Au moins 1 action tous les 2 trimestres pour ne pas perdre de clients.

---

#### 👥 RECRUTEMENT ET EFFECTIF (NOUVEAU V5)
Quel effectif pour ce trimestre ?

- **🧑 Travail seul** : Salaires 0€. Capacité ×0.5. Vous êtes surchargé.
- **👥 Équipe minimale (2 pers)** : Salaires 2 500€/trim. Capacité ×1.0. Standard.
- **👥👥 Équipe développée (4 pers)** : Salaires 6 000€/trim. Capacité ×1.5. Forte.
- **👥👥👥 Grande équipe (7 pers)** : Salaires 12 000€/trim. Capacité ×2.0. Très forte.

**⚠️ ATTENTION SALAIRES** : C'est une **charge FIXE** chaque trimestre, même sans ventes !

**Capacité** : Multiplie vos unités vendables. Plus d'effectif = plus de ventes possibles.

**Conseil** : Débuter avec "Équipe minimale" (2 pers). Recruter progressivement si CA stable.

---

#### 🏦 GESTION DU FINANCEMENT
Quelle action sur votre structure financière ?

- **💸 Rembourser 5 000€ d'emprunt** : −5000€ tréso, emprunts réduits. Intérêts futurs baissent.
- **⏸️ Statu quo** : Aucun changement.
- **🏦 Emprunter 10 000€** : +10000€ tréso. Intérêts : ~125€/trim.
- **🏗️ Emprunter 20 000€** : +20000€ tréso. Intérêts : ~250€/trim.

**Conseil** : Emprunter si vous avez un plan. Rembourser si tréso > 20k€.

---

### KPI en haut du dialog

- **💰 Trésorerie** : Votre argent disponible (vert si +, rouge si −)
- **📦 Stocks** : Valeur de votre inventaire
- **👥 Clients** : Nombre de clients actifs
- **📊 Solvabilité** : Vert >50%, orange 30-50%, rouge <30%
- **😊 Satisfaction** : Satisfaction client (0-100%)

---

### Avertissements

- **Découvert** : "⚠️ DÉCOUVERT BANCAIRE" → Agios 10% appliqués
- **Grève** : "Grève fournisseur" → Pas d'achats possibles ce trimestre
- **Rupture** : "Rupture de stock — satisfaction −20%" → Vous avez perdu des clients

---

### Valider & Fin de trimestre

1. **Vérifier tous les 5 choix sont faits**
2. **Cliquer : ✅ Valider mes décisions**
3. Le système calcule les flux, affiche le dashboard
4. **Revenir au menu → ▶ Jouer le trimestre suivant**

---

## Résultats Finaux

### Fin de partie automatique

La partie s'arrête si :
- Vous atteignez le dernier trimestre choisi
- Votre trésorerie tombe < −30 000€ (FAILLITE 💥)

### Dialog "Résultats finaux"

Affiche :
- **Score final** : 0-200 points
  - 150+ : 🏆 Excellent
  - 110-149 : ✅ Bien joué
  - 75-109 : ⚠️ Peut mieux faire
  - <75 : ❌ Difficile

- **KPI finaux** : Trésorerie, CA cumulé, emprunts restants
- **Historique complet** : Chaque trimestre avec tous les indicateurs

### Nouvelle partie

Cliquer : **🔄 Nouvelle partie** pour recommencer avec une autre entreprise/durée.

---

## Tableau de Bord Google Sheets

### Mise à jour automatique

Le dashboard se remplit après chaque trimestre avec :

1. **📊 BILAN SIMPLIFIÉ** : Actif (trésorerie, stocks) et Passif (capitaux, emprunts)
2. **📈 COMPTE DE RÉSULTAT** : Ventes − Coûts − Charges = Résultat NET
3. **📊 INDICATEURS CLÉS** : 8 KPI avec couleurs de solvabilité
4. **📋 FLUX MONÉTAIRES** : Historique détaillé par trimestre

### Consulter manuellement

- **Menu → 📊 Actualiser le tableau de bord** : Force la mise à jour
- **Menu → 🗑️ Réinitialiser la partie** : Efface la partie en cours

---

## Stratégies Pédagogiques

### Scénario 1 : "Croissance vs Solvabilité"

1. Débuter avec "Équipe minimale" + prix marché
2. Trimestre 2-3 : Recruter 4 pers pour hausse capacité
3. Vérifier : **Salaires doublent** (6000€) → trésorerie baisse
4. **Leçon** : "Recruter sans CA = danger trésorerie"

### Scénario 2 : "Impact satisfaction client"

1. Politique : achats prudents, pas d'action commerciale
2. Tour 2-3 : Rupture de stock → satisfaction −20%
3. Perte de clients, CA baisse
4. **Leçon** : "Qualité de service affecte la fidélité"

### Scénario 3 : "Événement économique"

1. Monitorer l'événement du trimestre (grève, soldes, boom)
2. Adapter stratégie : soldes = hausse volume / baisse marge
3. Grève = pas d'achats
4. **Leçon** : "Facteurs externes impactent l'entreprise"

### Scénario 4 : "Découvert bancaire"

1. Recruter 7 pers + achats ambitieux + pas de commercial
2. Trésorerie s'effondre rapidement
3. Découvert → agios 10%
4. **Leçon** : "Découvert est coûteux. Prudence trésorerie."

---

## FAQ

### Q. Mon trésorerie est négative. Que faire ?
**R.** Réduire salaires (moins d'effectif), moins d'achats, moins de marketing. Garder CA via clients existants.

### Q. Comment éviter la rupture de stock ?
**R.** Achats équilibrés (×1) ou ambitieux (×2). Recruter assez pour avoir capacité. Monitorer "unités disponibles" vs "demande".

### Q. Recruter 7 pers c'est trop ?
**R.** Oui si CA < 8000€. Vous paieriez 12000€ de salaires pour peu de revenu. Recruter progressivement.

### Q. Quel est le meilleur effectif ?
**R.** Dépend du CA. Équipe minimale (2) si CA ~5k€. Équipe développée (4) si CA ~10k€. Grande équipe (7) si CA >15k€.

### Q. Comment augmenter satisfaction client ?
**R.** Éviter ruptures de stock, action commerciale régulière, prix aligné à qualité. Événement "fidélisation" aide aussi.

### Q. Faut-il rembourser les emprunts ?
**R.** Si tréso > 20k€ oui. Sinon garder l'argent pour fonctionner. Intérêts (1,25% trim) coûtent peu.

### Q. Quelle durée choisir pour une classe ?
**R.** 8 trimestres (~1h15 + débriefing) = optimal pour 2h de cours. 6 trimestres si ≤1h30.

---

## Conseils Formateur

### Débriefing post-jeu (15-20 min)

1. **Analyse bilan** : Qui a la meilleure trésorerie ? Pourquoi ?
2. **Compte de résultat** : Qui a le meilleur résultat NET ? Qui a faillis ?
3. **Décisions clés** : Quand recruter ? Comment gérer les salaires ?
4. **Événements** : Comment réagir à une grève ? À une période de soldes ?
5. **Conclusion** : "Trésorerie = nerf de la guerre. Flux réalistes = enjeux réels."

### Points à souligner

- **Salaires = charge fixe** → même sans ventes, faut payer
- **Capacité produit** → effectif limite ventes possibles
- **Satisfaction client** → rupture = fuite clients
- **Événements** → facteurs externes non maîtrisés
- **Score multi-critères** → équilibre tréso + croissance + satisfaction

---

## Limitations & Améliorations Futures

### V5 (Actuel)
- ✅ Flux monétaires réalistes
- ✅ Recrutement avec impact capacité
- ✅ Satisfaction client dynamique
- ✅ 10 événements pédagogiques

### Futures améliorations possibles
- Cycle de paiement (créances clients, délais fournisseurs)
- Impôts et TVA
- Investissements immobiliers
- Variations saisonnières

---

## Support

- **Question sur les mécaniques** ? Lire `V5_CHANGELOG.md`
- **Question sur la pédagogie** ? Lire `GAME_BALANCE_SPECIFICATIONS.md`
- **Code source** ? Consulter `jeu_interactif_V5.gs` (bien commenté)

---

**Amusez-vous ! Et rappelez aux apprenants : "Trésorerie, c'est le sang de l'entreprise."** 💰
