/**
 * Informations pédagogiques pour chaque étape du jeu
 * Utilisé par EntryPanel et autres composants
 */

export const ETAPE_INFO: Record<
  number,
  {
    icone: string;
    titre: string;
    description: string;
    principe: string;
    conseil: string;
  }
> = {
  0: {
    icone: "💼",
    titre: "Charges fixes & Dotation aux amortissements",
    description:
      "Chaque trimestre, ton entreprise paie ses charges fixes (loyer, électricité…) et enregistre l'usure de ses immobilisations sous forme de dotation aux amortissements — une charge calculée, sans sortie de trésorerie.",
    principe:
      "Charges fixes → DÉBIT Services extérieurs / CRÉDIT Trésorerie. Amortissements (PCG 681/28x) → DÉBIT Dotation aux amortissements (+N) / CRÉDIT Immobilisations nettes (−N). Règle PCG : Σ dotation = nombre de biens actifs (−1 par bien). La dotation réduit le résultat mais PAS la trésorerie → CAF = Résultat + Dotation.",
    conseil:
      "⚠️ Ces charges sont OBLIGATOIRES. Si ta trésorerie passe sous zéro, un découvert s'ouvre. Au-delà de 5 de découvert → faillite ! Note : l'amortissement est une charge non décaissée : la trésorerie reste intacte mais le résultat baisse.",
  },
  1: {
    icone: "📦",
    titre: "Achats de marchandises",
    description:
      "Tu peux acheter des stocks pour les revendre. Choisis la quantité et le mode de paiement : comptant (trésorerie immédiate) ou à crédit (dette fournisseur D+1).",
    principe:
      "Comptant : DÉBIT Stocks / CRÉDIT Trésorerie. À crédit : DÉBIT Stocks / CRÉDIT Dettes fournisseurs. Dans les deux cas, l'Actif est modifié mais le Passif l'est aussi → équilibre maintenu.",
    conseil:
      "💡 Acheter à crédit préserve ta trésorerie aujourd'hui mais crée une dette à rembourser au prochain tour. C'est le mécanisme du délai fournisseur.",
  },
  2: {
    icone: "⏩",
    titre: "Avancement des créances clients",
    description:
      "Les clients règlent à échéance : les Créances C+2 deviennent C+1, et les Créances C+1 entrent en trésorerie.",
    principe:
      "Encaissement C+1 : DÉBIT Trésorerie / CRÉDIT Créances C+1. Avancement C+2→C+1 : DÉBIT Créances C+1 / CRÉDIT Créances C+2. Mouvement interne à l'Actif : total Actif ne change pas ici.",
    conseil:
      "💡 Un client Grand Compte paie en C+2 : la vente est faite aujourd'hui mais encaissée dans 2 trimestres. Attention au décalage de trésorerie !",
  },
  3: {
    icone: "👔",
    titre: "Paiement des commerciaux",
    description:
      "Tes commerciaux ont travaillé ce trimestre. Tu les rémunères : charges de personnel ↑, trésorerie ↓. En contrepartie, ils t'ont apporté des clients ce trimestre.",
    principe:
      "DÉBIT Charges de personnel / CRÉDIT Trésorerie. Les salaires sont une charge d'exploitation qui réduit le résultat. Mais les commerciaux génèrent des ventes futures qui compensent.",
    conseil:
      "🤝 Chaque commercial génère automatiquement ses clients : Junior → 2 Particuliers/trim (CA +4, tréso immédiate), Senior → 2 TPE/trim (CA +6, C+1), Directrice → 2 Grands Comptes/trim (CA +8, C+2). Pour recruter, utilisez l'étape 6a 🎯.",
  },
  4: {
    icone: "🤝",
    titre: "Traitement des ventes (Cartes Client)",
    description:
      "Chaque vente génère 4 écritures : une vente (produit), un stock consommé (charge), un coût des marchandises vendues (CMV), et une entrée de trésorerie ou créance.",
    principe:
      "① Ventes + (Produit) ② Stocks − (marchandises livrées) ③ Achats/CMV + (Coût de revient) ④ Tréso + ou Créance + (selon délai). L'équation ACTIF+CHARGES = PASSIF+PRODUITS reste vraie.",
    conseil:
      "🔑 C'est LE cœur de la partie double : une seule vente génère 4 écritures qui s'équilibrent. Le comptable capte l'économie réelle en langage chiffré.",
  },
  5: {
    icone: "🔄",
    titre: "Effets récurrents des cartes Décision",
    description:
      "Certaines de tes cartes Décision actives ont des effets qui se répètent chaque trimestre (abonnements, maintenance, intérêts…).",
    principe:
      "Ces charges récurrentes sont des Charges d'exploitation régulières : DÉBIT compte de charge / CRÉDIT Trésorerie. Elles réduisent le résultat d'exploitation à chaque tour.",
    conseil:
      "💡 Les cartes avec effets récurrents peuvent peser sur la trésorerie. Vérifie que tes revenus récurrents couvrent tes charges récurrentes.",
  },
  6: {
    icone: "🎯",
    titre: "6a Recrutement + 6b Investissement",
    description:
      "Ce trimestre se divise en deux actions OPTIONNELLES et indépendantes. 6a : recruter un nouveau commercial (Junior, Senior ou Directrice). 6b : activer une carte Décision (investissement, financement, protection…). Tu peux faire les deux, l'un, ou passer les deux.",
    principe:
      "Recrutement (6a) : DÉBIT Charges de personnel / CRÉDIT Trésorerie (salaire de prise de poste). Investissement (6b) : DÉBIT Autres Immobilisations (actif ↑) / CRÉDIT Trésorerie. La chaîne de valeur : Investissement → clients générés → ventes → revenus → résultat amélioré. Attention : chaque immobilisation génère +1 dotation/trimestre, réduisant le résultat (charge calculée sans sortie tréso).",
    conseil:
      "🧑‍💼 Recruter tôt (dès T1/T2) maximise le nombre de trimestres de revenus. 💡 Investir tôt amortit sur plus de tours. Exemple optimal : Junior T1 + Senior T2 + Directrice T5. 🛡️ L'Assurance Prévoyance protège des événements négatifs. La R&D bénéficie du CIR (Crédit d'Impôt Recherche). Anticipe tes stocks : chaque client consomme 1 unité par vente !",
  },
  7: {
    icone: "🎲",
    titre: "Événement aléatoire",
    description:
      "Un événement imprévu affecte ton entreprise. Positif (subvention, client VIP) ou négatif (contrôle fiscal, crise sanitaire) : tu ne peux pas le refuser.",
    principe:
      "Les événements positifs sont des Produits exceptionnels (CRÉDIT Produits exceptionnels / DÉBIT Trésorerie). Les négatifs sont des Charges exceptionnelles (l'inverse).",
    conseil:
      "🎲 L'Assurance Prévoyance peut annuler certains événements négatifs. Avoir des réserves de trésorerie absorbe les chocs.",
  },
  8: {
    icone: "✅",
    titre: "Bilan de fin de trimestre",
    description:
      "On vérifie l'équilibre du bilan, on contrôle la solvabilité et on calcule ton score. Si c'est le dernier trimestre, on clôture l'exercice.",
    principe:
      "Clôture : le Résultat Net est intégré aux Capitaux propres (bénéfice → capitaux augmentent ; perte → capitaux diminuent). Le compte de résultat est remis à zéro.",
    conseil:
      "📊 Résultat Net = Produits − Charges. S'il est positif, ta solvabilité s'améliore. Objectif : finir avec un bilan équilibré et des capitaux propres positifs.",
  },
};
