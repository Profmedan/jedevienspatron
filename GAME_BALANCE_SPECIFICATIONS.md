# JE DEVIENS PATRON — Game Balance & Mechanics Specifications
## Complete Reference for Apps Script Implementation

**Source**: TypeScript game engine (packages/game-engine/src/)
**Date**: 2026-04-06
**Author Analysis**: Claude (Game Balance Expert)

---

## 1. LOAN SCORING ALGORITHM (scorerDemandePret)

### Function Signature
```
scorerDemandePret(joueur: Joueur, montantDemande: number, tourActuel: number = 999)
  → ResultatDemandePret {
    accepte: boolean
    montantAccorde: number
    tauxMajore: boolean
    score: number
    raison: string
  }
```

### Complete Scoring Logic (max 100 points)

**1. STARTUP BENEVOLENCE (tours 1-2 only)**
- Condition: `tourActuel <= 2`
- Points: **+15**
- Reason: Bankers show mercy to early-stage startups, focusing on potential not results

**2. SOLVENCY RATIO** (Capitaux propres + Résultat) / Total Passif × 100
- Solvency ≥ 40%: **+30 points** — "Solvabilité solide"
- Solvency ≥ 30%: **+20 points** — "Solvabilité acceptable"
- Solvency ≥ 20%: **+10 points** — "Solvabilité fragile"
- Solvency < 20%: **+0 points** — "Solvabilité insuffisante" ✗

**3. NET RESULT (Résultat Net)**
- Profitable (> 0): **+25 points** — "Résultat bénéficiaire"
- Break-even (= 0): **+10 points** — "Résultat nul (neutre)"
- Loss (< 0): **+0 points** — "Résultat déficitaire" ✗

**4. CASH POSITION** (Trésorerie)
- ≥ 5,000: **+20 points** — "Trésorerie confortable"
- ≥ 2,000: **+10 points** — "Trésorerie limitée"
- ≥ 0: **+5 points** — "Trésorerie très faible"
- < 0 (overdraft): **+0 points** — "Découvert bancaire" ✗

**5. DEBT RATIO** (Emprunts / Total Actif × 100)
- < 30%: **+15 points** — "Endettement faible"
- < 50%: **+10 points** — "Endettement modéré"
- < 70%: **+5 points** — "Endettement élevé"
- ≥ 70%: **+0 points** — "Endettement excessif" ✗

**6. LOAN REQUEST RATIO** (Montant demandé / Total Actif × 100)
- ≤ 10%: **+10 points** — "Montant raisonnable"
- ≤ 20%: **+5 points** — "Montant acceptable"
- > 20%: **+0 points** — "Montant trop élevé" ✗

### Acceptance & Rate Decision
- **Acceptance threshold**: Score ≥ 50
- **Raised rate (8%/year)**: Score 50-64 (risky but OK)
- **Standard rate (5%/year)**: Score ≥ 65

### Default Response Format
```
If NOT accepted:
  Reason = "Score {score}/100 — insuffisant (min 50). {criteria_failed}"

If MAJORE rate:
  Reason = "Score {score}/100 — accordé avec taux majoré (8%/an). {risk_factors}"

If STANDARD rate:
  Reason = "Score {score}/100 — accordé au taux standard (5%/an). {positive_factors}"
```

---

## 2. CAPACITY CALCULATION LOGIC (calculerCapaciteLogistique)

### Formula
```
Capacity = CAPACITE_BASE + Σ(bonus per active card)
```

### Base Capacity
- **CAPACITE_BASE = 4 units/turn**
  - This is the minimum selling capacity (limited by lack of equipment)
  - Always available, cannot be negative

### Card Bonuses Per Card Type

**Vehicles (Véhicules)**
| Card ID | Base Bonus | Manufacture | Véloce | Azura | Synergia |
|---------|-----------|-------------|--------|-------|----------|
| camionnette | 6 | 6 | 6 | 2 | 2 |
| berline | 0 | 0 | 0 | 0 | 0 |
| fourgon-refrigere | 5 | 5 | 5 | 5 | 5 |
| velo-cargo | 3 | 3 | 3 | 3 | 3 |

**Logistics Investments**
| Card ID | Base Bonus | Manufacture | Véloce | Azura | Synergia |
|---------|-----------|-------------|--------|-------|----------|
| expansion | 10 | 4 | 4 | 6 | 6 |
| entrepot-automatise | 10 | 10 | 10 | 10 | 10 |
| credit-bail | 6 | 6 | 6 | 6 | 6 |

**Non-logistical Cards** (all = 0 bonus)
- Vehicles: berline, berline-repr
- Investments: site-internet, rse, recherche-developpement, certification-iso, application-mobile, eux-international, label-qualite, marketplace, erp, programme-fidelite, partenariat-commercial, revision-generale, optimisation-lean, sous-traitance
- Finance: pret-bancaire, levee-de-fonds, remboursement-anticipe, crowdfunding
- Tactics: publicite, relance-clients, formation, achat-urgence, maintenance-preventive
- Service: affacturage, maintenance-preventive
- Protection: assurance-prevoyance, mutuelle-collective, cybersecurite

### Lookup Algorithm
```typescript
for each carte in joueur.cartesActives:
  if CAPACITE_IMMOBILISATION_PAR_ENTREPRISE[carte.id][nomEntreprise] exists:
    capacite += CAPACITE_IMMOBILISATION_PAR_ENTREPRISE[carte.id][nomEntreprise]
  else:
    capacite += CAPACITE_IMMOBILISATION[carte.id] ?? 0
```

### Important Notes
- **Deprecated items remain functional**: Even when fully amortized (VNC = 0), immobilizations continue generating capacity bonuses
- **Berline is special**: It generates +1 decision card/turn bonus, NOT logistics capacity
- **No capacity penalties**: A card either adds 0 or a positive number

---

## 3. AMORTISSEMENT (DEPRECIATION) LOGIC

### Annual Amortization Rule (PCG - French Chart of Accounts)
- **Applied per turn (trimester)**: Each immobilization with value > 0 loses **1,000 €/turn**
- **Post-amortization rule**: Items reaching VNC = 0 (fully depreciated) remain on balance sheet at 0 value but CONTINUE functioning
- **Amortization stops at zero**: No negative depreciation

### Depreciation Implementation

**Step 1: Identify Amortizable Items**
```
amortizableItems = joueur.bilan.actifs
  .filter(a => a.categorie === "immobilisations" && a.valeur > 0)
```

**Step 2: Apply -1,000 per item**
```
for each item in amortizableItems:
  item.valeur = max(0, item.valeur - 1000)
```

**Step 3: Calculate Dotation Aux Amortissements (CR charge)**
```
totalBefore = sum of all immobilization values BEFORE depreciation
totalAfter  = sum of all immobilization values AFTER depreciation
dotationAmount = totalBefore - totalAfter
  = (number of items with value > 0) × 1000
```

**Step 4: Record Double Entry**
- DEBIT: Dotations aux amortissements (CR charge) = dotationAmount
- CREDIT: Immobilisations (Bilan asset) = dotationAmount (implicitly via -1,000 per item)

### Item-by-Item Depreciation Schedule

**Manufacture Belvaux**
| Item | Initial | Life (quarters) | Turnover |
|------|---------|----------------|----------|
| Entrepôt (warehouse) | 8,000 € | 8 | 8 turns |
| Camionnette (truck) | 8,000 € | 8 | 8 turns |
| Autres Immos | 0 € | — | — |

**Véloce Transports**
| Item | Initial | Life (quarters) | Turnover |
|------|---------|----------------|----------|
| Camion (heavy truck) | 10,000 € | 10 | 10 turns |
| Machine (handling equip) | 6,000 € | 6 | 6 turns |
| Autres Immos | 0 € | — | — |

**Azura Commerce**
| Item | Initial | Life (quarters) | Turnover |
|------|---------|----------------|----------|
| Showroom (retail space) | 8,000 € | 8 | 8 turns |
| Voiture (demo car) | 8,000 € | 8 | 8 turns |
| Autres Immos | 0 € | — | — |

**Synergia Lab**
| Item | Initial | Life (quarters) | Turnover |
|------|---------|----------------|----------|
| Brevet (patent IP) | 8,000 € | 8 | 8 turns |
| Matériel informatique (IT) | 5,000 € | 5 | 5 turns |
| Autres Immos | 0 € | — | — |

### Decision Cards — Depreciation Periods

| Card | Immo Value | Life (Quarters) | Annual Dotation |
|------|-----------|-----------------|-----------------|
| Camionnette | 8,000 € | 8 | 1,000 € |
| Berline | 8,000 € | 8 | 1,000 € |
| Site Internet | 4,000 € | 4 | 1,000 € |
| RSE | 2,000 € | 2 | 1,000 € |
| R&D | 5,000 € | 5 | 1,000 € |
| Expansion | 8,000 € | 8 | 1,000 € |
| Certification ISO | 5,000 € | 5 | 1,000 € |
| Application Mobile | 4,000 € | 4 | 1,000 € |
| Assurance Prévoyance | 2,000 € | 2 | 1,000 € |
| Fourgon Réfrigéré | 6,000 € | 6 | 1,000 € |
| Vélo Cargo | 3,000 € | 3 | 1,000 € |
| ERP | 5,000 € | 5 | 1,000 € |
| Marketplace | 4,000 € | 4 | 1,000 € |
| Entrepôt Automatisé | 8,000 € | 8 | 1,000 € |
| Label Qualité | 4,000 € | 4 | 1,000 € |
| Crédit-Bail | 6,000 € | 6 | 1,000 € |
| Programme Fidélité | 3,000 € | 3 | 1,000 € |
| Export International | 5,000 € | 5 | 1,000 € |
| Partenariat Commercial | 2,000 € | 2 | 1,000 € |
| Mutuelle Collective | 2,000 € | 2 | 1,000 € |
| Cybersécurité | 3,000 € | 3 | 1,000 € |
| Révision Générale | 4,000 € | — | 0 € (no immo) |
| Optimisation Lean | 3,000 € | 3 | 1,000 € |

### Key Rule
**All cards with immobilization investment have identical dotation**: 1,000 € per turn, regardless of initial investment value. The life span determines turnover, not the dotation amount.

---

## 4. VÉLOCE TRANSPORTS SPECIAL ABILITY (encaissement -1 délai)

### Mechanic: Payment Delay Reduction by 1 Quarter

**Implementation Location**: `appliquerCarteClient()` function
**Applied to**: All client sales for Véloce Transports players

### Logic

```typescript
// Calculate effective delay for Véloce Transports
const delaiEffectif = joueur.entreprise.nom === "Véloce Transports"
  ? Math.max(0, carteClient.delaiPaiement - 1) as 0 | 1 | 2
  : carteClient.delaiPaiement;
```

### Concrete Examples

| Client Type | Délai Normal | Véloce Bonus | Accounting Entry |
|-------------|-------------|-------------|-------------------|
| Particulier | 0 (immediate) | 0 | Trésorerie +X |
| TPE | 1 (C+1) | 0 | Trésorerie +X |
| Grand Compte | 2 (C+2) | 1 (C+1) | Créances Plus 1 +X |

### Business Logic
- **Particulier clients**: Always immediate (capped at 0), no change
- **TPE clients**: Jump from C+1 delay to IMMEDIATE (cash on delivery)
- **Grand Compte clients**: Reduced from C+2 to C+1 delay

### Double Entry Accounting
When Véloce Transports sells to a Grand Compte:
1. **Ventes** (Produit) +X
2. **Stocks** (Actif) -1
3. **Achats** (Charge) +1
4. **Créances Plus 1** (Actif) +X ← Instead of Créances Plus 2

---

## 5. ANNUAL CLOSURE LOGIC (clôture annuelle / Exercice Closure)

### Timing
- Occurs after each **4-turn cycle** (4, 8, 12 turns in a 12-turn game)
- Marks the end of accounting year (fiscal year)
- Triggered automatically in game flow (implicit in turn progression)

### What RESETS (per Exercice)

**Sales & Revenue by Type** (all Produits reset)
- Ventes: → 0
- Production Stockée: → 0
- Produits Financiers: → 0
- Revenus Exceptionnels: → 0

**Charges by Type** (all Charges reset)
- Achats: → 0
- Services Extérieurs: → 0
- Impôts & Taxes: → 0
- Charges Intérêt: → 0
- Charges Personnel: → 0
- Charges Exceptionnelles: → 0
- Dotations Amortissements: → 0

**Résultat Net**: Auto-calculated from produits - charges, then → incorporated into Capitaux propres (retained earnings, cpt 106)

### What PERSISTS (Bilan only)

**Assets (Actifs)** — NOT reset
- Immobilisations (net of accumulated depreciation): Remain at current VNC
- Stocks: Remain (inventory not auto-sold)
- Créances Plus 1 & Plus 2: Remain until encashed
- Trésorerie: Remains

**Liabilities (Passifs)** — NOT reset
- Capitaux propres (increased by retained earnings): Accumulate
- Emprunts: Remain (continuing obligation)
- Dettes fournisseurs: Remain
- Dettes D2: Remain
- Dettes Fiscales: Remain
- Découvert: Remains

**Client Pipeline** — NOT reset
- Cartes Décision actives: Continue generating clients next year
- Clients à traiter: Reset to empty at END of turn, then refilled
- Commercial cards keep producing clients

### Accounting Entry at Year-End
```
Résultat Net (= Produits - Charges)
  ↓
DEBIT/CREDIT Capitaux propres (106 — Retained Earnings)
  = Incorporates profit/loss into equity
```

### Score Calculation Integration
Annual results feed into final game score:
- Cumulative Résultat Net × 3 (multiplier)
- Cumulative Immobilizations × 2
- Trésorerie (final)
- Solvabilité (final)

---

## 6. SCORE CALCULATION AT END OF GAME (calculerScore)

### Function Signature
```typescript
calculerScore(joueur: Joueur): number
```

### Formula
```
Score = (Résultat Net × 3) + (Immobilisations × 2) + Trésorerie + Solvabilité
```

### Component Breakdown

**1. Net Result Component** (3× multiplier)
- Value: Final cumulative `Résultat Net` from all turns
- Calculation: Sum of all annual results
- Multiplier: **×3** (profit is heavily rewarded)
- Example: 12,000 € profit × 3 = 36,000 points

**2. Immobilization Component** (2× multiplier)
- Value: Total current immobilization value = `getTotalImmobilisations(joueur)`
- Includes all physical assets at current VNC (even fully amortized at 0 are ignored, not negative)
- Multiplier: **×2** (investment in equipment is rewarded)
- Example: 24,000 € in equipment × 2 = 48,000 points

**3. Trésorerie Component** (1× multiplier)
- Value: Final cash on hand = `getTresorerie(joueur)`
- Direct addition, no multiplier
- Negative trésorerie (overdraft) scores as negative
- Example: 8,000 € cash = 8,000 points

**4. Solvabilité Component** (as-is, rounded)
- Value: `Math.round(indicateurs.ratioSolvabilite)`
- Ratio Solvabilité = (Capitaux propres + Résultat Net) / Total Passif × 100
- Range: 0-100+ (can exceed 100 if highly profitable)
- Example: 67% solvency = 67 points

### Complete Example
```
Joueur "Alice" — Manufacture Belvaux
  Résultat Net (cumulative): 15,000 €
  Immobilisations (current VNC): 12,000 €
  Trésorerie (final): 5,000 €
  Solvabilité ratio: 72%

Score = (15,000 × 3) + (12,000 × 2) + 5,000 + 72
       = 45,000 + 24,000 + 5,000 + 72
       = 74,072 points
```

### Ranking Interpretation
- **80,000+**: Excellent (strong profitability, solid investment, good liquidity)
- **60,000-79,999**: Very good (balanced growth, adequate solvency)
- **40,000-59,999**: Good (starting to consolidate)
- **20,000-39,999**: Moderate (struggling profitability or weak base)
- **< 20,000**: Poor (losses or minimal growth)

---

## 7. ENTERPRISE-SPECIFIC MECHANICS

### Manufacture Belvaux (Production)
**Specialty**: ⚡ "Produit à chaque tour" (produces every turn)
- **Effect**: +1,000 € production stockée + 1,000 € stocks per quarter
- **Applied**: Automatically via `appliquerSpecialiteEntreprise()`
- **Accounting**: Increases both CR revenue (productionStockée) and Bilan asset (stocks)
- **Economic meaning**: The factory automatically generates semi-finished goods ready for sale

### Véloce Transports (Logistics)
**Specialty**: 🚀 "Livraison rapide" (fast delivery)
- **Effect**: Payment delay -1 quarter on ALL clients
- **Applied**: In `appliquerCarteClient()` when processing sales
- **Details**: See Section 4 above

### Azura Commerce (Retail)
**Specialty**: 👥 "Attire les particuliers" (attracts individual customers)
- **Effect**: +1 Client Particulier per turn (automatic)
- **Applied**: Via `genererClientsSpecialite()` at turn start
- **Accounting**: Adds a free "Particulier" card to `clientsATrait` each quarter
- **Stacks with**: Commercial cards that also generate particuliers

### Synergia Lab (Innovation)
**Specialty**: 💎 "Revenus de licence" (licensing revenue)
- **Effect**: +1,000 € produits financiers + 1,000 € trésorerie per quarter
- **Applied**: Via `appliquerSpecialiteEntreprise()`
- **Accounting**: Increases both CR revenue (produitsFinanciers) and Bilan liquidity (cash)
- **Economic meaning**: Passive income from patent licensing or IP monetization

---

## 8. CLIENT GENERATION MECHANICS

### Sources of Clients

**1. Commercial Cards (via Recrutement)**
| Card | Type | Qty/Turn | Cost |
|------|------|----------|------|
| Commercial Junior | Particulier | 2 | 1,000 € salary + 1,000 € cash |
| Commercial Senior | TPE | 2 | 2,000 € salary + 2,000 € cash |
| Directrice Commerciale | Grand Compte | 2 | 3,000 € salary + 3,000 € cash |

**2. Decision Cards (Recurring Effects)**
| Card ID | Client Type | Qty/Turn |
|---------|------------|----------|
| site-internet | Particulier | 1 |
| rse | Particulier | 1 |
| recherche-developpement | TPE | 1 |
| expansion | Grand Compte | 1 |
| certification-iso | Grand Compte | 1 |
| application-mobile | Particulier | 2 |
| fourgon-refrigere | TPE | 1 |
| velo-cargo | Particulier | 1 |
| erp | Grand Compte | 1 |
| label-qualite | TPE | 1 |
| marketplace | Particulier | 2 |
| entrepot-automatise | Grand Compte | 1 |
| programme-fidelite | Particulier | 1 |
| export-international | Grand Compte | 1 |
| partenariat-commercial | TPE | 1 |
| publicite | Particulier | 2 (if activated) |

**3. Enterprise Specialty**
- **Azura Commerce**: +1 Particulier per turn (automatic)

**4. Formation Card (One-time)**
- **formation**: Immediate +1 Grand Compte (single bonus, no recurring)

### Client Processing (Step 4 of Turn)

**Capacity Check**
- At start of turn: Calculate `capaciteLogistique`
- Each client card consumes 1 unit of capacity
- Excess clients = **lost sales** (recorded in `clientsPerdusCeTour`)

**Implementation Note**
- The TypeScript engine tracks `clientsPerdusCeTour` but implementation in Apps Script must manually limit clientsATrait to capaciteLogistique before processing
- Pseudo-code:
  ```
  capacite = calculerCapaciteLogistique()
  processableClients = clientsATrait.slice(0, capacite)
  lostClients = clientsATrait.slice(capacite)
  clientsPerdusCeTour = lostClients.length

  for each client in processableClients:
    appliquerCarteClient(client)
  ```

---

## 9. SPECIAL CARD MECHANICS

### Affacturage (Factoring)
- **Effect**: All créances immediately converted to trésorerie (eliminates delay)
- **Recurring cost**: 2,000 € services extérieurs per turn
- **Accounting**:
  - Créances Plus 1 → Trésorerie
  - Créances Plus 2 → Trésorerie
  - Services Extérieurs +2,000 €
  - Trésorerie -2,000 €

### Relance Clients (Customer Follow-up)
- **Effect**: All créances advance by 1 quarter immediately (unique one-time use)
- **Cost**: 1,000 € chargesPersonnel + 1,000 € trésorerie
- **Accounting**:
  - Créances Plus 2 → Créances Plus 1 (advance by 1)
  - ChargesPersonel +1,000
  - Trésorerie -1,000

### Publicité (Advertising)
- **Effect**: Optional activation each turn
- **Clients**: +2 Particuliers if activated
- **Cost**: 2,000 € services extérieurs + 2,000 € trésorerie (only if activated)
- **Decision Point**: Player chooses each turn whether to activate

### Remboursement Anticipé (Early Repayment)
- **Effect**: Immediate full loan payoff
- **Cost**:
  - Dossier: 1,000 € services extérieurs + 1,000 € trésorerie
  - Capital: Trésorerie - (emprunts value), Emprunts → 0
- **Card Status**: One-time use only (removed after use)

### Levée de Fonds (Fundraising)
- **Effect**: Equity injection (no debt)
- **Net Result**: Trésorerie +3,000 net
  - Dossier: 3,000 € services extérieurs + 3,000 € trésorerie (cost)
  - Investors: 6,000 € trésorerie + 6,000 € capitaux (income)
- **Card Status**: One-time use (removed after use)

### Berline (Company Car)
- **Effect**: +1 Decision card drawn per turn (not capacity bonus)
- **Cost**: 8,000 € immo + 8,000 € trésorerie
- **Recurring**: 2,000 € services extérieurs per turn
- **Capacity**: 0 (no logistics benefit)

### Prêt Bancaire (Bank Loan)
- **Effect**: Direct loan with interest
- **Immediate**: Trésorerie +5,000 €, Emprunts +5,000 €
- **Recurring**: Chargesintérêt +1,000 € per turn, Trésorerie -1,000 €
- **Note**: Simplified model (standard rate, no scoring)

### RSE (Corporate Social Responsibility)
- **Financing**: Financed by debt (no immediate cash impact)
- **Effect**: Immos +2,000, Emprunts +2,000 (no trésorerie hit)
- **Recurring cost**: 1,000 € services extérieurs per turn
- **Clients**: +1 Particulier per turn

### Assurance Prévoyance (Insurance)
- **Effect**: Cancels negative events if active
- **Logic**: Check all applied events; if negative and card active, annul them
- **Cost**: Immo +2,000 (dépôt de garantie), Trésorerie -2,000
- **Recurring**: 1,000 € services extérieurs per turn
- **Amortization**: 2 turns

---

## 10. TURN STRUCTURE & AMORTIZATION TIMING

### Turn Order (9 Steps: 0-8)

**Step 0**: Fixed charges + remboursement + amortissement
- Agios on overdraft (10% of découvert)
- Interest on loans (annual, at turn 1 of each year)
- Overdraft repayment (progressive, max 2,000/turn)
- Supplier debt payment (dettes)
- Fiscal debt payment (dettesF)
- Loan repayment (fixed 1,000/turn)
- Fixed charges (2,000)
- **AMORTIZATION APPLIED HERE** (-1,000 per immobilization)
- Trésorerie overflow → découvert

**Step 1**: Purchases (optional, player choice)

**Step 2**: Receivables advancement
- C+1 → Trésorerie (payment)
- C+2 → C+1 (advance)

**Step 3**: Commercial salaries + quiz

**Step 4**: Client processing (capacity-limited)

**Step 5**: Recurring effects of decision cards

**Step 5bis**: Enterprise specialty effects

**Step 6**: Recruitment + decision card purchase (optional)

**Step 7**: Event card (mandatory)

**Step 8**: End-of-turn balance check + faillite verification

---

## 11. BANKRUPTCY & FAILURE CONDITIONS

### Immediate Faillite (Step 8)
1. **Overdraft > 8,000 €**: Game Over, player eliminated
2. **Capitaux propres (+ Résultat) < 0**: Insolvency, player eliminated
3. **Total debt > 2× Capitaux propres**: Over-leverage, player eliminated

### Recurring Penalties
- **Overdraft fines**: 10% of overdraft amount collected as interest each turn
- **Loan interest**: 5% annual (standard) or 8% annual (raised) applied at turn 1 of each year

---

## 12. IMPLEMENTATION CHECKLIST FOR APPS SCRIPT

- [ ] Implement `scorerDemandePret()` with all 6 scoring criteria
- [ ] Implement `calculerCapaciteLogistique()` with enterprise-specific bonuses
- [ ] Implement amortization logic: -1,000 per immo per turn, Dotations = sum of amortizations
- [ ] Apply Véloce Transports délai -1 reduction in client sales
- [ ] Implement annual closure: reset CR, accumulate equity
- [ ] Implement score formula: (NetResult × 3) + (Immos × 2) + Cash + Solvency
- [ ] Implement client capacity limiting: max = calculerCapaciteLogistique()
- [ ] Implement enterprise specialties:
  - Manufacture: +1,000 productionStockée + 1,000 stocks/turn
  - Véloce: délai -1
  - Azura: +1 client Particulier/turn
  - Synergia: +1,000 produitsFinanciers + 1,000 trésorerie/turn
- [ ] Implement special card effects (Affacturage, Relance, Publicité, etc.)
- [ ] Implement faillite checks: découvert > 8,000, capitaux < 0, debt > 2× equity
- [ ] Track `clientsPerdusCeTour` when capacity is exceeded

---

## APPENDIX: CONSTANTS

```typescript
// Capacity
CAPACITE_BASE = 4

// Costs & Payments
CHARGES_FIXES_PAR_TOUR = 2,000
REMBOURSEMENT_EMPRUNT_PAR_TOUR = 1,000
REMBOURSEMENT_DECOUVERT_MAX_PAR_TOUR = 2,000

// Frequency
INTERET_EMPRUNT_FREQUENCE = 4  // Every 4 turns (annual)
NB_TOURS_PAR_AN = 4

// Interest Rates
TAUX_INTERET_ANNUEL = 5%  // Standard
TAUX_INTERET_MAJORE = 8%  // Raised (at-risk loans)

// Bankruptcy
DECOUVERT_MAX = 8,000

// Scoring
SCORE_MULTIPLICATEUR_RESULTAT = 3
SCORE_MULTIPLICATEUR_IMMO = 2
```

---

**END OF SPECIFICATIONS**

All algorithms extracted directly from TypeScript source code.
Ready for Apps Script implementation.
