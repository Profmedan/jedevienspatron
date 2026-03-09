# 🎓 KICLEPATRON — Instructions de lancement

## Prérequis
- Node.js ≥ 18 ([https://nodejs.org](https://nodejs.org))

## Lancer le jeu en local

```bash
# 1. Ouvrez un Terminal dans ce dossier
cd kiclepatron-saas/apps/web

# 2. Installez les dépendances (une seule fois)
npm install --legacy-peer-deps

# 3. Lancez le serveur de développement
npm run dev

# 4. Ouvrez votre navigateur sur :
#    http://localhost:3000
```

## Structure du projet

```
kiclepatron-saas/
  apps/web/               ← Application Next.js (UI)
    app/
      page.tsx            ← Page d'accueil
      jeu/page.tsx        ← Page de jeu principale
    components/
      BilanPanel.tsx      ← Affichage du Bilan
      CompteResultatPanel.tsx
      CarteView.tsx       ← Affichage des cartes
      EtapeGuide.tsx      ← Animateur virtuel (9 étapes)
      IndicateursPanel.tsx ← FR, BFR, CAF, etc.
    lib/game-engine/      ← Moteur de jeu TypeScript pur
      types.ts            ← Tous les types
      calculators.ts      ← Calculs financiers
      engine.ts           ← Logique de jeu
      data/
        entreprises.ts    ← 4 entreprises (Actif=Passif=16)
        cartes.ts         ← Cartes commerciaux/clients/décisions/événements

  packages/game-engine/   ← Package partageable (web + mobile futur)
```

## Règles du jeu en bref

- 2 à 4 joueurs, 4 tours (trimestres)
- Chaque joueur choisit une entreprise (Orange, Violette, Bleue, Verte)
- 9 étapes par tour, toujours en **partie double** :
  - Étape 0 : Charges fixes + amortissements (auto)
  - Étape 1 : Achats de marchandises (optionnel)
  - Étape 2 : Avancement des créances (auto)
  - Étape 3 : Paiement commerciaux + génération clients
  - Étape 4 : Traitement cartes Client (4 écritures chacune)
  - Étape 5 : Effets récurrents des cartes Décision (auto)
  - Étape 6 : Choix d'une carte Décision (optionnel)
  - Étape 7 : Tirage carte Événement (aléatoire)
  - Étape 8 : Vérification équilibre + score + faillite ?

- **Score** = Résultat Net × 3 + Immobilisations × 2 + Trésorerie + Solvabilité%
- **Faillite** si : découvert > 5, ou capitaux propres < 0, ou dettes > 2× capitaux

## Équation fondamentale
> **ACTIF + CHARGES = PASSIF + PRODUITS**
> (equivalent à ACTIF = PASSIF + RÉSULTAT NET)

---
*Pierre Médan — KICLEPATRON v3 SaaS*
