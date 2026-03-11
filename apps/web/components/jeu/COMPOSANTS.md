# 📦 Composants Refactorisés du Jeu Sérieux

Guide d'utilisation complète des nouveaux composants React/TypeScript du jeu pédagogique "Je Deviens Patron".

---

## 🎯 Vue d'ensemble

La refactorisation divise la logique UI du fichier `page-v2.tsx` (2500+ lignes) en **composants réutilisables et maintenables**.

### Principes
- ✅ **Zéro rupture** avec la logique métier (engine, calculators, types)
- ✅ **Composants purs** : prop-based, aucun effet secondaire
- ✅ **Accessibilité** : labels ARIA, roles sémantiques
- ✅ **Design cohérent** : Tailwind CSS, gradient modernes, animations subtiles

---

## 📁 Structure

```
components/jeu/
├── index.ts                 # Exports publics
├── COMPOSANTS.md           # Ce fichier
├── utils.ts                # Utilitaires (classification, labels)
├── EntryCard.tsx           # Affichage d'une écriture comptable
├── EntryPanel.tsx          # Panneau interactif de saisie
├── HeaderJeu.tsx           # Barre supérieure
├── LeftPanel.tsx           # Panneau gauche (guide + actions)
├── MainContent.tsx         # Contenu principal (bilan/CR/indicateurs)
├── OverlayTransition.tsx   # Overlay de fin de trimestre
├── OverlayFaillite.tsx     # Overlay de faillite
├── SetupScreen.tsx         # Écran de configuration initial
└── CompanyIntro.tsx        # Écran pédagogique d'intro

app/jeu/
├── page-v2-refactored.tsx  # Nouvelle version composée (logique inchangée)
├── page-v2-helpers.ts      # Fonctions utilitaires (cloneEtat, etc.)
└── etape-info.ts           # Descriptions pédagogiques des étapes
```

---

## 🧩 Composants

### **1. `utils.ts`** – Utilitaires

Fonctions et constantes partagées.

#### Exports
```typescript
// Listes de postes comptables
export const ACTIF_KEYS: string[]
export const PASSIF_KEYS: string[]
export const CHARGES_KEYS: string[]
export const PRODUITS_KEYS: string[]

// Fonction : sens d'une écriture
export function getSens(poste: string, delta: number): "debit" | "credit"

// Fonction : nom complet d'un compte
export function nomCompte(poste: string): string

// Fonction : info document
export interface DocumentInfo { label: string; detail: string; badge: string }
export function getDocument(poste: string): DocumentInfo
```

**Utilisation**
```typescript
import { getSens, nomCompte, getDocument } from "@/components/jeu"

const sens = getSens("tresorerie", 100)      // "debit"
const nom = nomCompte("tresorerie")           // "Trésorerie"
const doc = getDocument("tresorerie")         // { label: "Bilan", detail: "Actif", ... }
```

---

### **2. `EntryCard.tsx`** – Affichage d'une écriture

**Props**
```typescript
interface EntryCardProps {
  entry: EntryLine                           // Écriture à afficher
  onApply: () => void                        // Callback au clic "Saisir"
}

interface EntryLine {
  id: string
  poste: string                              // Clé du poste comptable
  delta: number                              // Montant (+ ou -)
  description: string                        // Explication
  applied: boolean                           // Déjà saisie ?
  sens: "debit" | "credit"                   // Sens comptable
}
```

**Comportement**
- Coloration automatique selon le sens (bleu = débit, orange = crédit)
- Affiche une checkmark ✓ après saisie
- Bouton "Saisir →" avant saisie
- Badge document (Bilan / Compte de résultat)
- Zone d'information avec montant et description

**Exemple**
```typescript
<EntryCard
  entry={{
    id: "e1",
    poste: "tresorerie",
    delta: -100,
    description: "Paiement des commerciaux",
    applied: false,
    sens: "credit"
  }}
  onApply={() => console.log("Saisie !")}
/>
```

---

### **3. `EntryPanel.tsx`** – Panneau de saisie des écritures

**Props**
```typescript
interface EntryPanelProps {
  activeStep: ActiveStep                     // Étape en cours
  displayJoueur: Joueur                      // Joueur avec écritures appliquées
  onApply: (id: string) => void              // Saisir une écriture
  onApplyEntry?: (poste: string) => void     // Callback effet de bord (highlight)
  onConfirm: () => void                      // Valider l'étape
  onCancel: () => void                       // Annuler
}

interface ActiveStep {
  titre: string
  icone: string
  description: string
  principe: string                           // Info pédagogique
  conseil: string                            // Info pédagogique
  entries: EntryLine[]                       // Écritures à saisir
  baseEtat: EtatJeu                          // Snapshot avant
  previewEtat: EtatJeu                       // État final complet
}
```

**Comportement**
- Affiche les écritures groupées (débits / crédits)
- Vérification équilibre bilan en temps réel (ACTIF = PASSIF)
- Bouton "Continuer" actif uniquement si tout est saisi et équilibré
- Affichage du principe et conseil pédagogiques

**Exemple**
```typescript
<EntryPanel
  activeStep={activeStep}
  displayJoueur={joueur}
  onApply={applyEntry}
  onApplyEntry={highlightPoste}
  onConfirm={validateStep}
  onCancel={() => setActiveStep(null)}
/>
```

---

### **4. `HeaderJeu.tsx`** – Barre supérieure

**Props**
```typescript
interface HeaderJeuProps {
  joueurs: Joueur[]
  joueurActifIdx: number
  tourActuel: number
  nbToursMax: number
  etapeTour: number
  etapeTitle: string
}
```

**Comportement**
- Affiche titre du jeu + progression
- Liste des joueurs avec joueur actif en surlignage
- Responsive (titre caché sur mobile)

**Exemple**
```typescript
<HeaderJeu
  joueurs={etat.joueurs}
  joueurActifIdx={etat.joueurActif}
  tourActuel={etat.tourActuel}
  nbToursMax={etat.nbToursMax}
  etapeTour={etat.etapeTour}
  etapeTitle="Charges fixes & Amortissements"
/>
```

---

### **5. `LeftPanel.tsx`** – Panneau gauche

**Props** (nombreuses)
```typescript
interface LeftPanelProps {
  // État
  etapeTour: number
  tourActuel: number
  nbToursMax: number
  joueur: Joueur
  activeStep: ActiveStep | null

  // Actions générales
  onApplyEntry: (id: string) => void
  onConfirmStep: () => void
  onCancelStep: () => void
  onApplyEntryEffect?: (poste: string) => void
  onLaunchStep: () => void

  // Étape 1 (Achats)
  achatQte: number
  setAchatQte: (val: number) => void
  achatMode: "tresorerie" | "dettes"
  setAchatMode: (val: "tresorerie" | "dettes") => void
  onLaunchAchat: () => void
  onSkipAchat: () => void

  // Étape 6 (Cartes)
  showCartes: boolean
  setShowCartes: (val: boolean) => void
  selectedDecision: CarteDecision | null
  setSelectedDecision: (val: CarteDecision | null) => void
  cartesDisponibles: CarteDecision[]
  onLaunchDecision: () => void
  onSkipDecision: () => void
  decisionError: string | null

  // Journal
  journal: JournalEntry[]
}
```

**Comportement**
- Affiche `EtapeGuide` (composant existant)
- Panneau d'action adapté à l'étape (ou `EntryPanel` si actif)
- Journal comptable scrollable avec historique des opérations
- Boutons contextuels pour chaque étape

---

### **6. `MainContent.tsx`** – Contenu principal

**Props**
```typescript
interface MainContentProps {
  joueur: Joueur
  displayJoueur: Joueur                      // Avec écritures appliquées
  activeStep: any | null
  highlightedPoste: string | null
  etapeTour: number
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  showCartes: boolean
  selectedDecision: CarteDecision | null
  setSelectedDecision: (val: CarteDecision | null) => void
  cartesDisponibles: CarteDecision[]
}
```

**Comportement**
- En-tête joueur avec trésorerie
- Section "Commerciaux & Clients" avec visualisation
- Onglets (Bilan / Compte de résultat / Indicateurs)
- Affichage des cartes actives
- Sélecteur de cartes Décision (si étape 6)
- Surlignage de poste quand une écriture est appliquée

---

### **7. `OverlayTransition.tsx`** – Overlay de fin de trimestre

**Props**
```typescript
interface OverlayTransitionProps {
  transitionInfo: { from: number; to: number }
  joueurs: Joueur[]
  onContinue: () => void
}
```

**Comportement**
- Fullscreen modal avec tabs (Analyse / Indicateurs / Bilan / CR)
- Message contextuel selon clôture fiscale ou simple transition
- Analyse financière détaillée par joueur
- Bouton "Démarrer le Trimestre X"

---

### **8. `OverlayFaillite.tsx`** – Overlay de faillite

**Props**
```typescript
interface OverlayFailliteProps {
  joueurNom: string
  raison: string
  onRestart: () => void
  onContinue: () => void
  canContinue: boolean                       // D'autres joueurs en jeu ?
}
```

**Comportement**
- Fullscreen modal dramatique (💥 animation)
- Raison de la faillite, leçon comptable, conseil
- Boutons "Recommencer" et optionnellement "Continuer"

---

### **9. `SetupScreen.tsx`** – Configuration initiale

**Props**
```typescript
interface SetupScreenProps {
  onStart: (players: PlayerSetup[], nbTours: number) => void
}

export interface PlayerSetup {
  pseudo: string
  entreprise: NomEntreprise
}
```

**Comportement**
- Sélection 1-4 joueurs
- Pseudo + entreprise par joueur
- Sélection nombre de trimestres (4/6/8)
- Validation : pseudo non-vide, entreprises différentes

---

### **10. `CompanyIntro.tsx`** – Écran pédagogique

**Props**
```typescript
interface CompanyIntroProps {
  joueurs: Joueur[]
  onStart: () => void
}
```

**Comportement**
- 3 étapes avec progression
  1. **D'où vient l'argent** → PASSIF
  2. **Comment l'argent est utilisé** → ACTIF
  3. **L'équilibre fondamental** → ACTIF = PASSIF
- Navigation prev/next
- Bouton "C'est parti"

---

## 🔄 Flux de données

### État global (page-v2-refactored.tsx)
```
[EtatJeu]
├─ joueurs: Joueur[]
├─ tourActuel: number
├─ etapeTour: number
├─ joueurActif: number
└─ ...

[Phase] = "setup" | "intro" | "playing" | "gameover"
[ActiveStep] = étape en cours (si null, pas de saisie)
[Journal] = historique des opérations
[Overlays] = tourTransition, failliteInfo
[UI] = activeTab, highlightedPoste, showCartes, etc.
```

### Flux d'une saisie d'écriture
```
1. User clique "Exécuter & Comprendre" → launchStep()
2. Moteur calcule les modifications → buildActiveStep()
3. activeStep = {entries: [...], baseEtat, previewEtat}
4. EntryPanel affiche les écritures
5. User clique "Saisir →" → applyEntry(id)
6. entries[i].applied = true
7. getDisplayJoueur() applique le delta temporaire
8. User clique "Continuer ✓" → confirmActiveStep()
9. Moteur exécute et avance l'étape
10. activeStep = null, on voit le résultat
```

---

## 🎨 Design & Styling

### Color Palette
- **Primary** : Indigo (600-700) & Purple (600-700)
- **Actif** : Bleu (Débits) & Orange (Crédits)
- **Status** : Vert (✓), Rouge (⚠️), Ambre (⚡)

### Gradients
- Header : `from-indigo-700 to-purple-700`
- Buttons : `from-indigo-600 to-purple-600`
- Transitions : `from-indigo-50 to-purple-50`

### Spacing
- Padding panels : `p-3` (base)
- Gaps : `gap-2`, `gap-3`, `gap-4`
- Rounded : `rounded-xl` (modal), `rounded-lg` (card)

### Animations
- Hover : `hover:shadow-md`, `hover:bg-opacity-80`
- Active : `active:scale-95`
- Loading : `animate-pulse`, `animate-bounce`

---

## 📊 Accessibilité

- `aria-label` sur boutons
- `aria-pressed` sur toggles
- `aria-status` sur éléments de statut
- `role="region"` sur sections nommées
- Contraste minimum AA (WCAG)
- Labels explicites pour inputs

---

## ✅ Checklist d'intégration

Avant d'utiliser `page-v2-refactored.tsx` :

- [ ] Fichiers crées dans `/components/jeu/`
- [ ] Fichiers helpers et etape-info.ts présents
- [ ] Imports dans page-v2-refactored.tsx corrects
- [ ] EtatJeu, Joueur, etc. importés de `@/lib/game-engine/types`
- [ ] Composants existants (BilanPanel, CompteResultatPanel, etc.) disponibles
- [ ] TailwindCSS configuré
- [ ] Tester la phase "setup" → "intro" → "playing"
- [ ] Vérifier overlays (transition, faillite)
- [ ] Tester toutes les étapes (0-8)
- [ ] Vérifier sauvegardes localStorage et Supabase

---

## 🚀 Performance

- Composants purs : aucun state inutile
- Re-renders minimisés : prop drilling réduit par composants
- getDisplayJoueur() optimisé : clonage une seule fois
- Journal limité à 30 entries (évite mémoire infinie)
- Images/icônes : émojis (légers)

---

## 📝 Notes

### Breaking Changes : **AUCUN**
- Logique métier identique
- Types inchangés
- Comportement de jeu préservé
- API Supabase inchangée

### Améliorations UX
- Transition trimestre plus visuelle
- Analyse financière détaillée en overlay
- Journal comptable toujours accessible
- Meilleure hiérarchie visuelle
- Responsive design renforcé

### Évolutions futures
- [ ] Dark mode
- [ ] Multi-language (i18n)
- [ ] Replays/spectating
- [ ] Statistiques avancées
- [ ] Gamification (badges, leaderboards)

---

## 🤝 Support

Pour questions ou bugs :
1. Vérifier le console browser (erreurs)
2. Inspecter les props via React DevTools
3. Tester avec données simples d'abord
4. Consulter les imports et dépendances

---

**Dernière mise à jour :** Mars 2026
