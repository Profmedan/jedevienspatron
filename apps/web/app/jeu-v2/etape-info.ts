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
      "Les charges fixes (loyer, énergie…) font sortir de l'argent de ta banque : ta trésorerie baisse. L'amortissement, lui, est différent : c'est une écriture comptable qui traduit l'usure de tes équipements. Ton résultat baisse (c'est une charge), mais aucun euro ne quitte ton compte bancaire.",
    conseil:
      "⚠️ Ces charges sont obligatoires : même si tu ne vends rien, tu dois les payer. Si ta trésorerie tombe sous zéro, tu passes en découvert. Et au-delà de 5 de découvert, c'est la faillite !",
  },
  1: {
    icone: "📦",
    titre: "Achats de marchandises",
    description:
      "Tu peux acheter des stocks pour les revendre. Choisis la quantité et le mode de paiement : comptant (trésorerie immédiate) ou à crédit (dette fournisseur D+1).",
    principe:
      "Quand tu achètes comptant, tu échanges de l'argent contre de la marchandise : ta banque baisse, ton stock monte. Si tu achètes à crédit, ton stock monte aussi, mais au lieu de payer maintenant, tu crées une dette envers ton fournisseur que tu rembourseras au prochain tour.",
    conseil:
      "💡 Acheter à crédit, c'est comme reporter le paiement : ta trésorerie reste intacte aujourd'hui, mais tu devras payer au trimestre suivant. Utile quand ta banque est basse, mais attention à ne pas accumuler trop de dettes !",
  },
  2: {
    icone: "⏩",
    titre: "Avancement des créances clients",
    description:
      "Les clients règlent à échéance : les Créances C+2 deviennent C+1, et les Créances C+1 entrent en trésorerie.",
    principe:
      "Tes clients qui devaient te payer ce trimestre (C+1) règlent enfin : l'argent entre dans ta banque et leur dette envers toi disparaît. Ceux qui devaient payer dans 2 trimestres (C+2) se rapprochent de l'échéance : ils passent en C+1 et te paieront au prochain tour.",
    conseil:
      "💡 Plus tes clients mettent de temps à payer, plus ta trésorerie souffre. Un particulier paie tout de suite (pas de décalage), une TPE en 1 trimestre, un Grand Compte en 2 trimestres. Anticipe ces délais !",
  },
  3: {
    icone: "👔",
    titre: "Paiement des commerciaux",
    description:
      "Tes commerciaux ont travaillé ce trimestre. Tu les rémunères : charges de personnel ↑, trésorerie ↓. En contrepartie, ils t'ont apporté des clients ce trimestre.",
    principe:
      "Tu paies le salaire de tes commerciaux : l'argent sort de ta banque (trésorerie baisse) et tes charges de personnel augmentent. C'est une dépense qui réduit ton résultat, mais en échange, chaque commercial t'a ramené des clients qui vont générer du chiffre d'affaires.",
    conseil:
      "🤝 Un Junior ramène 2 particuliers par trimestre (ils paient cash). Un Senior ramène 2 TPE (elles paient en 1 trimestre). Une Directrice ramène 2 Grands Comptes (ils paient en 2 trimestres). Pour recruter, c'est à l'étape 6.",
  },
  4: {
    icone: "🤝",
    titre: "Traitement des ventes (Cartes Client)",
    description:
      "Chaque vente génère plusieurs écritures simultanées : le chiffre d'affaires, le coût de la marchandise vendue, et l'encaissement (ou la créance si le client paie plus tard).",
    principe:
      "Quand tu vends, il se passe plusieurs choses en même temps : ton chiffre d'affaires augmente (c'est un produit, donc ton résultat monte), ton stock diminue (la marchandise part chez le client), et soit ta banque augmente (paiement cash), soit tu notes une créance (le client te paiera plus tard).",
    conseil:
      "🔑 C'est le cœur de la comptabilité : une seule vente touche plusieurs comptes à la fois. Le stock part, le chiffre d'affaires monte, et l'argent arrive (maintenant ou plus tard selon le type de client).",
  },
  5: {
    icone: "🔄",
    titre: "Effets récurrents des cartes Décision",
    description:
      "Certaines de tes cartes Décision actives ont des effets qui se répètent chaque trimestre (abonnements, maintenance, intérêts…).",
    principe:
      "Les cartes que tu as activées peuvent avoir des coûts récurrents : remboursement d'emprunt, abonnement logiciel, frais de maintenance… Ces charges sortent automatiquement de ta trésorerie chaque trimestre et réduisent ton résultat. Les intérêts d'emprunt, par exemple, sont le prix que tu paies à la banque pour t'avoir prêté de l'argent.",
    conseil:
      "💡 Avant d'activer une nouvelle carte, vérifie son coût récurrent. Deux ou trois cartes à effets répétés peuvent vite peser très lourd sur ta trésorerie à chaque tour. Assure-toi que tes ventes couvrent ces frais !",
  },
  6: {
    icone: "🎯",
    titre: "À toi de jouer !",
    description:
      "Deux actions OPTIONNELLES s'offrent à toi. 👇 Les cartes sont affichées directement — clique sur celle de ton choix, puis tape « Exécuter ».",
    principe:
      "Tu peux recruter un commercial (son salaire sortira de ta trésorerie chaque trimestre, mais il t'apportera des clients) ou investir dans un équipement (tu paies maintenant, l'équipement s'use progressivement — c'est l'amortissement — et il te rapporte sur la durée). Tu peux aussi emprunter pour financer un investissement.",
    conseil:
      "🧑‍💼 Tu démarres avec un Junior. Recruter un Senior dès le 2e tour booste tes ventes. Investir tôt, c'est répartir le coût sur plus de tours. Et l'Assurance Prévoyance te protège contre les mauvaises surprises !",
  },
  7: {
    icone: "🎲",
    titre: "Événement aléatoire",
    description:
      "Un événement imprévu affecte ton entreprise. Positif (subvention, client VIP) ou négatif (contrôle fiscal, crise sanitaire) : tu ne peux pas le refuser.",
    principe:
      "Un événement positif (subvention, gros client surprise) fait entrer de l'argent et améliore ton résultat. Un événement négatif (contrôle fiscal, panne, litige) te coûte de l'argent et dégrade ton résultat. Dans les deux cas, c'est exceptionnel : ça ne vient pas de ton activité normale.",
    conseil:
      "🎲 Tu ne peux pas prévoir ces événements, mais tu peux t'y préparer : garde une réserve de trésorerie pour encaisser les coups durs. Et si tu as l'Assurance Prévoyance, elle peut annuler certains événements négatifs.",
  },
  8: {
    icone: "✅",
    titre: "Bilan de fin de trimestre",
    description:
      "On vérifie l'équilibre du bilan, on contrôle la solvabilité et on calcule ton score. Si c'est le dernier trimestre, on clôture l'exercice.",
    principe:
      "À la fin du trimestre, ton résultat (bénéfice ou perte) est transféré dans tes capitaux propres. Si tu as fait un bénéfice, tes capitaux augmentent (ton entreprise vaut plus). Si tu as fait une perte, ils diminuent. Ensuite, le compteur de résultat repart à zéro pour le trimestre suivant.",
    conseil:
      "📊 Ton résultat = ce que tu as gagné (ventes) moins ce que tu as dépensé (charges). S'il est positif, ta situation s'améliore. Objectif : terminer avec des capitaux propres positifs, signe que ton entreprise est solide.",
  },
};
