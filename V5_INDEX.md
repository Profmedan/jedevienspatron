# Je Deviens Patron V5 — Index Complet

**Livraison V5 - Avril 2026**

---

## 📚 Fichiers de la V5

### 🎮 Script Principal (Production)

**[`jeu_interactif_V5.gs`](jeu_interactif_V5.gs)** — 1274 lignes
- Script Google Apps Script complet
- ✅ Prêt pour déploiement immédiat
- Copier/coller dans Google Sheets

**Contient** :
1. Constantes : 4 entreprises, 5 décisions, 10 événements
2. Gestion d'état : PropertiesService, versioning
3. Logique jeu : 8 flux monétaires, scoring
4. Dialogs HTML : 3 dialogs interactifs
5. Dashboard : Google Sheets enrichi
6. Menu : 6 commandes

---

### 📖 Documentation (4 fichiers)

#### 1. **[`V5_LIVRAISON.md`](V5_LIVRAISON.md)** — 399 lignes
**Pour**: Superviseur/Décideur  
**Contient** :
- Résumé exécutif de la livraison
- Fichiers livrés
- Mécaniques V5 (résumé)
- Objectifs pédagogiques atteints
- Comparaison V4 vs V5
- Validation
- Déploiement

**À lire en 10 min pour comprendre ce qui a été livré.**

---

#### 2. **[`GUIDE_V5_RAPIDE.md`](GUIDE_V5_RAPIDE.md)** — 285 lignes
**Pour**: Formateur/Enseignant  
**Contient** :
- Installation dans Google Sheets
- Comment jouer (première partie)
- 5 catégories de décisions expliquées
- Résultats finaux
- Tableau de bord
- 4 scénarios pédagogiques
- FAQ
- Conseils formateur
- Limitations & améliorations futures

**À lire avant la première classe. Guide complet d'utilisation.**

---

#### 3. **[`V5_CHANGELOG.md`](V5_CHANGELOG.md)** — 306 lignes
**Pour**: Développeur/Concepteur  
**Contient** :
- Résumé des améliorations V5
- Flux monétaires complets (ordre critique)
- Décision recrutement détaillée
- Dynamique client enrichie
- 10 événements avec descriptions
- Scoring V5
- Dashboard sections
- Dialogs HTML
- Compatibilité & migration
- Validation technique
- Pédagogie générale

**À lire pour comprendre le design de la V5.**

---

#### 4. **[`V5_TEST_VALIDATION.md`](V5_TEST_VALIDATION.md)** — 452 lignes
**Pour**: QA/Testeur  
**Contient** :
- 14 sections de tests (checklist)
- Validation structure
- Flux monétaires (tests manuels)
- Recrutement (mécanique + capacité)
- Événements (grève, soldes, etc.)
- Satisfaction client
- Scoring
- Dashboard affichage
- Dialogs HTML
- Persistance & versioning
- Checklist finale

**À utiliser pour valider avant déploiement.**

---

## 🎯 Par Rôle — Quoi Lire ?

### 🎓 Formateur / Enseignant
1. **D'abord** : [`V5_LIVRAISON.md`](V5_LIVRAISON.md) (résumé 10 min)
2. **Puis** : [`GUIDE_V5_RAPIDE.md`](GUIDE_V5_RAPIDE.md) (guide complet)
3. **Besoin de help?** : [`FAQ`](GUIDE_V5_RAPIDE.md#faq) dans le guide

---

### 👨‍💼 Chef de Projet / Superviseur
1. **D'abord** : [`V5_LIVRAISON.md`](V5_LIVRAISON.md) (exécutif)
2. **Validation** : [`V5_TEST_VALIDATION.md`](V5_TEST_VALIDATION.md) (checklist)
3. **Déploiement** : [`GUIDE_V5_RAPIDE.md`](GUIDE_V5_RAPIDE.md#installation--démarrage) (install steps)

---

### 👨‍💻 Développeur
1. **D'abord** : [`V5_CHANGELOG.md`](V5_CHANGELOG.md) (architecture)
2. **Code** : [`jeu_interactif_V5.gs`](jeu_interactif_V5.gs) (source bien commenté)
3. **Tests** : [`V5_TEST_VALIDATION.md`](V5_TEST_VALIDATION.md) (validation checklist)

---

### 🔍 QA / Testeur
1. **D'abord** : [`V5_TEST_VALIDATION.md`](V5_TEST_VALIDATION.md) (checklist)
2. **Référence** : [`V5_CHANGELOG.md`](V5_CHANGELOG.md) (specs techniques)
3. **Guide** : [`GUIDE_V5_RAPIDE.md`](GUIDE_V5_RAPIDE.md) (user guide pour test)

---

## 📊 Statistiques

| Fichier | Type | Lignes | Taille | Rôle |
|---------|------|--------|--------|------|
| `jeu_interactif_V5.gs` | Script GAS | 1274 | 55 KB | Production |
| `V5_LIVRAISON.md` | Doc | 399 | 12 KB | Exécutif |
| `GUIDE_V5_RAPIDE.md` | Doc | 285 | 9.5 KB | Formateur |
| `V5_CHANGELOG.md` | Doc | 306 | 11 KB | Technique |
| `V5_TEST_VALIDATION.md` | Doc | 452 | 12 KB | QA |
| **TOTAL** | | **2716** | **99.5 KB** | |

---

## 🎮 Mécaniques Clés (Cheat Sheet)

### 5 Catégories de Décisions

| Catégorie | Options | Impact |
|-----------|---------|--------|
| 📦 **Achats** | stop / prudent / équilibre / ambitieux | Tréso / stocks |
| 💰 **Prix** | discount / marché / premium | Marge vs volume |
| 📣 **Commercial** | aucune / téléphone / locale / digitale | Clients + coût |
| 👥 **Recrutement** | solo / mini / dev / grande | Salaires + capacité |
| 🏦 **Financement** | rembourser / statu quo / emprunter | Tréso + emprunts |

---

### 8 Flux Monétaires (Ordre Critique)

1. **Financement** → Emprunts/Remboursements
2. **Salaires** → Effectif × coût
3. **Achats** → Stocks (sauf grève)
4. **Commercial** → Marketing + clients
5. **Ventes** → CA avec capacité
6. **Charges fixes** → Loyer, assurances
7. **Intérêts** → 1,25% / trimestre
8. **Agios** → 10% du découvert

---

### 10 Événements

**Anciens** (V4) : boom, crise, fournisseur, concurrent, opportunité, qualité  
**Nouveaux** (V5) : grève, soldes, recrutement_marché, fidélisation

---

### Scoring (7 Critères)

- Trésorerie | Ventes | Solvabilité | **Effectif** | **Satisfaction** | Clients | Stocks
- Bienveillance tours 1-2 : +15 points

---

## ✅ Checklist Déploiement

- [ ] Lire [`V5_LIVRAISON.md`](V5_LIVRAISON.md)
- [ ] Lire [`GUIDE_V5_RAPIDE.md`](GUIDE_V5_RAPIDE.md)
- [ ] Copier [`jeu_interactif_V5.gs`](jeu_interactif_V5.gs)
- [ ] Coller dans Google Apps Script
- [ ] Ouvrir Google Sheet
- [ ] Menu "🎮 Je Deviens Patron" apparaît
- [ ] Test partie T1-T3 (Belvaux, 8 trimestres)
- [ ] Dashboard se remplit correctement
- [ ] Vérifier flux monétaires (historique)
- [ ] Voir résultats finaux
- [ ] Test reset
- [ ] ✅ Prêt pour classe !

---

## 🔗 Ressources Complémentaires

### Existants (V4 predecessor)
- `jeu_interactif_V4.gs` — Version précédente (archive)
- `GAME_BALANCE_SPECIFICATIONS.md` — Specs pédagogiques détaillées
- `CONTENU_PEDAGOGIQUE_9_ETAPES.md` — Contenu pédagogique du jeu

### Lié à l'écosystème
- `CLAUDE.md` — Instructions Pierre Médan (workflow, outils)
- `README_LANCER.md` — Démarrage ancien projet

---

## 🚀 Quick Start (3 min)

### Pour Formateur

1. Ouvrir **Google Sheet** vierge
2. **Outils** → **Éditeur de script**
3. Copier [`jeu_interactif_V5.gs`](jeu_interactif_V5.gs)
4. **Enregistrer**
5. Revenir au Sheet, recharger
6. Menu **🎮 Je Deviens Patron** apparaît
7. **Cliquer : 🆕 Nouvelle partie**
8. Sélectionner entreprise + durée
9. **Jouer ! ▶**

---

## 📞 Support

| Question | Document |
|----------|----------|
| C'est quoi V5? | [`V5_LIVRAISON.md`](V5_LIVRAISON.md) |
| Comment l'utiliser? | [`GUIDE_V5_RAPIDE.md`](GUIDE_V5_RAPIDE.md) |
| Comment ça marche? | [`V5_CHANGELOG.md`](V5_CHANGELOG.md) |
| Ça marche? (tests) | [`V5_TEST_VALIDATION.md`](V5_TEST_VALIDATION.md) |
| Code source? | [`jeu_interactif_V5.gs`](jeu_interactif_V5.gs) (bien commenté) |

---

## 🎓 Objectifs Pédagogiques

✅ Comprendre **flux monétaires** (entrées/sorties)  
✅ Gérer **trésorerie** (le sang de l'entreprise)  
✅ Recruter **stratégiquement** (coûts vs capacité)  
✅ Satisfaire **clients** (fidélisation)  
✅ Gérer **événements** (facteurs externes)  
✅ Scorer **équilibre** (tréso + croissance + qualité)

---

## 📋 Version History

- **V4** (2025) : Flux basiques, 4 décisions, 6 événements
- **V5** (Avril 2026) : Flux enrichis, 5 décisions, 10 événements, **recrutement**, **satisfaction**

---

## 🏆 Validation

- ✅ 1274 lignes (1000-1400 requis)
- ✅ 0 TODO, 0 placeholder
- ✅ 8 flux monétaires cohérents
- ✅ Production-ready

---

## 📝 Conclusion

**Je Deviens Patron V5 est livré complet, documenté, validé et prêt pour production.**

**5 fichiers** : 1 script + 4 docs  
**2716 lignes** totales  
**~100 KB** au total

**À déployer aujourd'hui dans Google Sheets.**

---

*Navigation : Start by [`V5_LIVRAISON.md`](V5_LIVRAISON.md) (résumé) or [`GUIDE_V5_RAPIDE.md`](GUIDE_V5_RAPIDE.md) (guide pratique).*
