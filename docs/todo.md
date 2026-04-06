# Todo — JE DEVIENS PATRON

## Statut général
Branche : `main` — dernier commit : `feat: unité €×1000 + 5 nouvelles cartes + simulateur Excel`

## En cours / À faire

- [ ] Tester le déploiement Vercel après le push (vérifier que le jeu fonctionne avec les nouvelles valeurs ×1000 €)
- [ ] Vérifier l'affichage des montants en € dans l'UI (pages /jeu, /dashboard, indicateurs financiers)
- [ ] Intégrer la contrainte de capacité de production dans le gameplay web (CAPACITE_BASE = 4 unités max par trimestre, bloquant si dépassé)
- [ ] Tester les 5 nouvelles cartes en partie réelle (Achat d'Urgence, Maintenance Préventive, Révision Générale, Optimisation Lean, Sous-traitance)
- [ ] Valider que le simulateur Excel (jeu_interactif.xlsx) correspond au comportement du moteur TypeScript
- [ ] Synchroniser apps/web/lib/game-engine/ (copie locale) avec les corrections ×1000 du package

## Fait récemment (session 2026-04-06)
- [x] Implémentation Proposition E : spécialités d'entreprise actives dès T1
- [x] Catalogue cartes Excel (cartes_jeu.xlsx)
- [x] Simulateur CLI interactif (simulate.js)
- [x] Simulateur Excel jouable (jeu_interactif.xlsx) avec UX colorée
- [x] 5 nouvelles cartes décision (production/maintenance)
- [x] Capacités de production spécifiques par entreprise
- [x] Passage toutes valeurs monétaires ×1000 € (moteur + Excel)
- [x] Bug fix : agios bancaires proportionnels (10% du découvert, min 1 000 €)
- [x] Bug fix : avancement dettesD2 → D+1 chaque trimestre
- [x] Bug fix : détection faillite immédiate (découvert > 8 000 €)
- [x] Bug fix : IDs commerciaux déterministes (compteur au lieu de Date.now())
- [x] Constantes ×1000 : DECOUVERT_MAX=8000, CHARGES_FIXES=2000, REMBOURSEMENT_EMPRUNT=1000, amortissement=1000/bien
- [x] Documentation : découvert persistant entre exercices (note pédagogique)
- [x] NB_TOURS_MAX marqué @deprecated

## Backlog
- [ ] Skill `/start-feature` pour standardiser le démarrage de tâche
- [ ] Contrainte capacité production dans engine.ts (bloquer ventes > capacité)
- [ ] Amortissement lié à la capacité (Immob à 0 → réduction capacité)
- [ ] Page publique de présentation du jeu
- [ ] Mode multi-joueurs asynchrone
