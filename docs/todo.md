# Todo — JE DEVIENS PATRON

## Statut général
Branche : `main` — dernier commit : `feat: unité €×1000 + 5 nouvelles cartes + simulateur Excel`

## En cours / À faire

- [ ] Tester le déploiement Vercel après le push (vérifier que le jeu fonctionne avec les nouvelles valeurs ×1000 €)
- [ ] Vérifier l'affichage des montants en € dans l'UI (pages /jeu, /dashboard, indicateurs financiers)
- [ ] Intégrer la contrainte de capacité de production dans le gameplay web (CAPACITE_BASE = 4 000 unités max par trimestre, bloquant si dépassé)
- [ ] Tester les 5 nouvelles cartes en partie réelle (Achat d'Urgence, Maintenance Préventive, Révision Générale, Optimisation Lean, Sous-traitance)
- [ ] Valider que le simulateur Excel (jeu_interactif.xlsx) correspond au comportement du moteur TypeScript

## Fait récemment (session 2026-04-06)
- [x] Implémentation Proposition E : spécialités d'entreprise actives dès T1
- [x] Catalogue cartes Excel (cartes_jeu.xlsx)
- [x] Simulateur CLI interactif (simulate.js)
- [x] Simulateur Excel jouable (jeu_interactif.xlsx) avec UX colorée
- [x] 5 nouvelles cartes décision (production/maintenance)
- [x] Capacités de production spécifiques par entreprise
- [x] Passage toutes valeurs monétaires ×1000 € (moteur + Excel)

## Backlog
- [ ] Skill `/start-feature` pour standardiser le démarrage de tâche
- [ ] Contrainte capacité production dans engine.ts (bloquer ventes > capacité)
- [ ] Amortissement lié à la capacité (Immob à 0 → réduction capacité)
- [ ] Page publique de présentation du jeu
- [ ] Mode multi-joueurs asynchrone
