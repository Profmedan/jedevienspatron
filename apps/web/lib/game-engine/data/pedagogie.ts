// JEDEVIENSPATRON — Contenu pédagogique : modales + QCM par étape

export interface ModalEtape {
  etape: number;
  titre: string;
  ceQuiSePasse: string;
  pourquoi: string;
  impactComptes: string;
  conseil: string;
}

export interface QuestionQCM {
  question: string;
  choix: [string, string, string, string]; // A, B, C, D
  bonneReponse: 0 | 1 | 2 | 3; // index 0=A, 1=B, 2=C, 3=D
  explicationBonne: string;
  explicationFausses: [string, string, string]; // explications des 3 mauvaises réponses
}

export interface QCMEtape {
  etape: number;
  questions: [QuestionQCM, QuestionQCM, QuestionQCM, QuestionQCM, QuestionQCM]; // exactement 5
}

export const MODALES_ETAPES: Record<number, ModalEtape> = {
  0: {
    etape: 0,
    titre: `Les frais qui te coûtent toujours de l'argent`,
    ceQuiSePasse: `Chaque trimestre, tu dois payer des charges régulières (loyer, salaire du gérant, assurances, électricité…). En plus, tes équipements (camion, mobilier, informatique) s'usent — même sans débourser un centime ce mois-ci. Tu dois comptabiliser cette usure comme une charge.`,
    pourquoi: `Sans payer ces frais, ton entreprise s'arrête. Et même si tes équipements durent longtemps, ils perdent de la valeur — tu dois en tenir compte pour connaître le vrai coût de ton activité.`,
    impactComptes: `Les charges fixes et l'amortissement réduisent ton résultat (bénéfice ou perte), mais seules les charges fixes font sortir de l'argent de ton compte bancaire.`,
    conseil: `Pense à ces frais comme des "obligations" — il faut les payer même si tu n'as pas vendu grand-chose ce mois-ci. Assure-toi d'avoir assez de trésorerie pour les couvrir.`,
  },
  1: {
    etape: 1,
    titre: `La banque réclame son dû (capital + intérêts)`,
    ceQuiSePasse: `Tu dois rembourser une partie du prêt que tu as contracté (c'est le capital) ET payer les intérêts que la banque demande pour te l'avoir prêté. Chaque trimestre, un montant fixe sort de ton compte.`,
    pourquoi: `C'est de l'argent qui part — tu dois l'avoir. Si tu oublies, tu te retrouves dans le rouge ou la banque te ferme le robinet. Bien gérer tes emprunts, c'est survivre.`,
    impactComptes: `Les intérêts réduisent ton résultat (c'est une charge). Le remboursement du capital sort de ta banque mais ne réduit pas le résultat (c'est du remboursement de dette).`,
    conseil: `Avant d'emprunter, calcule si tes futurs bénéfices peuvent couvrir le remboursement. Une dette trop lourde te paralyse.`,
  },
  2: {
    etape: 2,
    titre: `Tu remplis tes rayons pour vendre`,
    ceQuiSePasse: `Tu achètes de la marchandise auprès de tes fournisseurs pour la revendre. Cet achat augmente ton stock. Tu le paies maintenant (ou plus tard si c'est du crédit fournisseur), mais tu ne le comptabilises en "charge" que quand tu le vends.`,
    pourquoi: `Plus tu as de stock, plus tu peux vendre — mais tu dois avoir du cash (ou du crédit) pour le financer. Un stock trop gros te paralyse, trop petit te perd des ventes.`,
    impactComptes: `L'achat augmente ton stock (actif) et réduit ta banque (ou augmente une dette fournisseur). Pas de charge immédiate — c'est seulement quand tu vends que ça devient un "coût des ventes".`,
    conseil: `Achète juste assez pour 2-3 mois de ventes estimées. Pas plus, sinon tu bloques de l'argent inutilement.`,
  },
  3: {
    etape: 3,
    titre: `Tes clients te paient enfin !`,
    ceQuiSePasse: `Les clients à qui tu as vendu à crédit te remboursent (partiellement ou totalement). C'est du cash qui rentre dans ta banque. Tu diminues tes créances clients d'autant.`,
    pourquoi: `C'est la vie-sang du cash-flow. Les ventes rapportent du CA, mais le cash-flow c'est quand tu reçois l'argent. Pas de paiement clients = trésorerie qui s'étouffe.`,
    impactComptes: `Les créances client baissent (tu dois moins). La banque augmente (tu reçois de l'argent). Zéro impact sur le résultat (tu as déjà compté la vente quand tu l'as faite).`,
    conseil: `Suis de près tes délais de paiement. Plus les clients paient vite, mieux tu respires en trésorerie. Les délais longs = piège mortel.`,
  },
  4: {
    etape: 4,
    titre: `Tu paies tes vendeurs pour leurs efforts`,
    ceQuiSePasse: `Tes commerciaux (vendeurs/représentants) te ramènent du chiffre d'affaires. Tu dois les payer — soit un salaire fixe, soit une commission (pourcentage des ventes), soit un mix. C'est du cash qui sort.`,
    pourquoi: `Sans eux, tu ne vends rien. Mais tu dois pouvoir les payer. Un commercial qui gagne bien = motivation et plus de ventes. Un commercial mal payé = démotivation et départ.`,
    impactComptes: `Le paiement réduit ta banque et augmente tes charges (frais commerciaux/salaires). C'est une dépense courante.`,
    conseil: `Paie une commission qui te laisse marger suffisamment. Si tu paies 50 % de chaque vente en commission, tu dois vraiment en vendre pour que ça vaille le coup.`,
  },
  5: {
    etape: 5,
    titre: `Tes commerciaux livrent, tu fais du chiffre !`,
    ceQuiSePasse: `Grâce au travail de tes commerciaux, des clients reçoivent de la marchandise et tu enregistres une vente. Le chiffre d'affaires monte. Selon tes conditions, tu reçois du cash ou une promesse de paiement.`,
    pourquoi: `C'est LE moteur de ton entreprise. Plus tu vends, plus tu couvres tes frais fixes et plus tu fais de bénéfice. Sans clients, tu n'es rien.`,
    impactComptes: `Le chiffre d'affaires augmente (résultat en plus). Ton stock diminue (la marchandise part). Tes créances client montent (si tu vends à crédit) ou ta banque augmente (si tu vends cash).`,
    conseil: `Plus tu vends, plus tes frais fixes se répartissent sur beaucoup de ventes — tes bénéfices montent vite. C'est l'effet de levier. Sois obsédé par le chiffre.`,
  },
  6: {
    etape: 6,
    titre: `Tu embauches un nouveau vendeur (ou pas)`,
    ceQuiSePasse: `Tu as la possibilité d'embaucher un nouveau commercial. Il va booster tes ventes mais va aussi te coûter en salaire fixe (+ commissions sur ses ventes). C'est une décision stratégique : risque vs. bénéfice potentiel.`,
    pourquoi: `Recruter = investissement en ressources humaines. Ça coûte tout de suite (son salaire), mais ça rapporte progressivement (ses ventes). Tu dois avoir assez de trésorerie pour supporter la période de ramping.`,
    impactComptes: `Ses salaires augmentent tes charges (réduction du résultat). Ses ventes augmentent ton CA. Résultat net = ça dépend si son bénéfice généré > son salaire.`,
    conseil: `Recrute un commercial si tu penses vraiment qu'il va vendre au moins 2-3 fois son salaire annuel en CA. Sinon, c'est perte sèche.`,
  },
  7: {
    etape: 7,
    titre: `Tu investis dans un nouvel équipement ou compétence`,
    ceQuiSePasse: `Tu achètes ou investis dans quelque chose qui va booster ta productivité ou ta capacité : nouveau camion, logiciel, formation, stock plus gros. C'est un investissement capital qui sort de ta trésorerie immédiatement.`,
    pourquoi: `Les investissements coûtent cher maintenant mais rapportent plus tard. Un bon investissement peut doubler ta capacité. Un mauvais investissement te paralyse financièrement.`,
    impactComptes: `L'investissement augmente un actif (camion, logiciel) et réduit ta banque immédiatement. Ensuite, tu l'amortis sur plusieurs années (charge progressive).`,
    conseil: `Avant d'investir, calcule le ROI (retour sur investissement). Il faut au moins que ton investissement te rapporte plus que ce qu'il te coûte à court terme.`,
  },
  8: {
    etape: 8,
    titre: `Une surprise (bonne ou mauvaise) tombe du ciel`,
    ceQuiSePasse: `Chaque trimestre, un événement aléatoire arrive : un gros client se précipite sur toi (boom de ventes), un concurrent baisse ses prix (tu perds des clients), une usine ferme (rupture de stock), un emprunt devient plus cher… Les entrepreneurs vivent dans l'incertitude.`,
    pourquoi: `C'est la réalité. Tu peux avoir le meilleur plan du monde, mais la vie te joue des tours. Comment tu réagis ? Tu panique ? Tu t'adaptes ? La vraie compétence, c'est de rebondir.`,
    impactComptes: `Ça dépend de l'événement. Une grosse vente = CA boost. Une rupture d'approvisionnement = stock qui baisse, ventes perdues. Un accident = coût extra. Ça change ton résultat trimestre par trimestre.`,
    conseil: `Garde toujours une réserve de trésorerie pour absorber les mauvaises surprises. Et regarde les bonnes surprises comme des occasions (ne pas les gaspiller en dépenses folles).`,
  },
  9: {
    etape: 9,
    titre: `C'est fini ce trimestre, bilan et diagnostic`,
    ceQuiSePasse: `Le trimestre se termine. Tu dois regarder tes résultats : as-tu fait un bénéfice ou une perte ? Ta trésorerie tient-elle ? Tes ratios d'endettement explosent-ils ? C'est le moment de dire "j'ai bien géré" ou "je dois changer de stratégie".`,
    pourquoi: `Sans clôture, tu ne sais pas où tu en es. À la fin du 3e exercice (trimestre 12), tu devras justifier ta survie et ta performance. Chaque trimestre clôturé c'est une pierre de plus au chemin.`,
    impactComptes: `C'est du pur gestion : tu calcules ton résultat net (bénéfice ou perte), tu mets à jour ton bilan, tu vérifies ta trésorerie. Si tu as une perte, elle réduit tes capitaux propres. Si tu as un bénéfice, tu le mets en réserve ou tu le distribues.`,
    conseil: `Chaque clôture, pose-toi : "Où en suis-je réellement ?" Si tu as des doutes, c'est le moment d'ajuster : moins de charges, plus de ventes, recruter, investir différemment.`,
  },
};

export const QCM_ETAPES: Record<number, QCMEtape> = {
  0: {
    etape: 0,
    questions: [
      {
        question: `Tu finis le trimestre avec 50 000 € en banque. Tes charges fixes sont 12 000 € et ton amortissement 3 000 €. Combien te reste-t-il vraiment en trésorerie ?`,
        choix: [
          `50 000 € (l'amortissement ne coûte rien)`,
          `38 000 € (50 000 - 12 000 - 3 000)`,
          `35 000 € (50 000 - 15 000 de sortie réelle)`,
          `47 000 € (seul l'amortissement compte)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Les charges fixes (12 000 €) te sortent vraiment de l'argent. L'amortissement (3 000 €) ne te coûte rien en trésorerie ce mois-ci — c'est juste une comptabilisation de l'usure. Donc tu perds 12 000 € secs, pas 15 000 €. Ta trésorerie passe de 50 000 à 38 000 €.`,
        explicationFausses: [
          `Oublie les 12 000 € qui sortent réellement.`,
          `Confond trésorerie et résultat (mixing les deux).`,
          `Ignore complètement les charges fixes — ton loyer ne disparaît pas magiquement !`,
        ],
      },
      {
        question: `Ton résultat trimestriel (avant impôts) est de 8 000 €. Tes charges fixes sont 10 000 € et tu as amortis pour 2 000 €. Ton bénéfice réel est plutôt :`,
        choix: [
          `8 000 € (c'est le résultat)`,
          `-4 000 € (8 000 - 10 000 - 2 000)`,
          `-2 000 € (8 000 - 10 000 en réalité)`,
          `6 000 € (8 000 - 2 000 seulement)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Les 8 000 € de résultat incluent déjà les 10 000 € de charges et les 2 000 € d'amortissement dans le calcul. Donc ton vrai bénéfice est -2 000 € (une petite perte). En trésorerie, tu as perdu 10 000 € (charges), pas 12 000 (les 2 000 € d'amortissement ne sortent pas de la caisse).`,
        explicationFausses: [
          `Confond résultat comptable et réalité économique.`,
          `Additionne mal — tu déjà compté les charges dans les 8 000 €.`,
          `Ignore les charges fixes — elles te mettent dans le rouge.`,
        ],
      },
      {
        question: `Pourquoi est-ce qu'on "amortit" les équipements plutôt que de tout comptabiliser en dépense l'année d'achat ?`,
        choix: [
          `Pour payer moins d'impôts`,
          `Parce que le camion te sert pendant 5 ans, pas juste cette année`,
          `Parce que c'est obligatoire par la loi`,
          `Pour faire croire que tu fais plus de bénéfices`,
        ],
        bonneReponse: 1,
        explicationBonne: `Si tu achètes un camion 50 000 € et tu l'utilises 5 ans, ce serait bête de dire qu'il t'a coûté 50 000 € cette année. En amortissant (disons 10 000 € par an), tu répartis le coût sur sa durée de vie réelle — c'est plus juste pour voir quel bénéfice tu fais vraiment chaque année.`,
        explicationFausses: [
          `C'est un effet, pas la raison principale.`,
          `C'est pas juste obligatoire, c'est surtout logique économiquement.`,
          `Au contraire, l'amortissement réduit tes bénéfices affichés.`,
        ],
      },
      {
        question: `Tes charges fixes ce trimestre : loyer 5 000 €, salaire du gérant 8 000 €, assurances 1 500 €. Tes amortissements : 2 500 €. Quel montant exact va réduire ta banque ?`,
        choix: [
          `17 000 €`,
          `14 500 €`,
          `12 000 €`,
          `16 000 €`,
        ],
        bonneReponse: 1,
        explicationBonne: `Loyer + salaire + assurances = 5 000 + 8 000 + 1 500 = 14 500 € qui sortent réellement de ta banque. L'amortissement (2 500 €) ne coûte rien en argent frais — c'est juste de la comptabilité pour l'usure.`,
        explicationFausses: [
          `Additionne les amortissements aussi (erreur classique).`,
          `Oublie les assurances.`,
          `Compte un montant aléatoire.`,
        ],
      },
      {
        question: `Tu as acheté un équipement pour 20 000 € amortissable sur 4 ans. Chaque trimestre, tu dois amortir :`,
        choix: [
          `20 000 € (tout en une fois)`,
          `5 000 € (annuel, donc 20 000 / 4)`,
          `1 250 € (par trimestre : 20 000 / 4 ans / 4 trimestres)`,
          `2 500 € (par trimestre)`,
        ],
        bonneReponse: 2,
        explicationBonne: `4 ans = 16 trimestres. L'amortissement annuel est 20 000 € / 4 = 5 000 €. Par trimestre : 5 000 € / 4 = 1 250 €. C'est logique : tu répartis le coût uniformément sur chaque période.`,
        explicationFausses: [
          `Tu prendrais une énorme perte le premier trimestre — pas réaliste.`,
          `C'est l'amortissement annuel, pas trimestriel.`,
          `C'est le double du bon calcul.`,
        ],
      },
    ],
  },
  1: {
    etape: 1,
    questions: [
      {
        question: `Tu dois rembourser ce trimestre : 3 000 € de capital emprunt + 500 € d'intérêts. Quel est l'impact exact sur tes comptes ?`,
        choix: [
          `Ton résultat baisse de 3 500 € et ta banque de 3 500 €`,
          `Ton résultat baisse de 3 000 € et ta banque de 3 500 €`,
          `Ton résultat baisse de 500 € et ta banque de 3 500 €`,
          `Ton résultat baisse de 3 500 € et ta banque de 500 €`,
        ],
        bonneReponse: 2,
        explicationBonne: `Seuls les intérêts (500 €) sont une charge pour le résultat — tu dois les comptabiliser. Le remboursement du capital (3 000 €) est juste de la trésorerie (tu rembourses une dette). Mais en banque, tu sors 3 500 € au total.`,
        explicationFausses: [
          `Confond le capital (qui n'impacte pas le résultat) avec les intérêts.`,
          `Mélange mal — le capital ne touche pas le résultat.`,
          `Inverse complètement — le capital ne sort pas du résultat, mais il sort de la banque.`,
        ],
      },
      {
        question: `Ton taux d'emprunt est 4 % par an. Tu dois rembourser ce trimestre 2 000 € de capital. Combien d'intérêts paies-tu (sur le capital restant) ?`,
        choix: [
          `80 € (4 % de 2 000)`,
          `On ne peut pas le savoir sans connaître le capital restant au début du trimestre`,
          `200 € (1 % par trimestre de 20 000)`,
          `40 € (4 % annuel / 4 trimestres = 1 %)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Les intérêts se calculent sur le capital restant dû, pas sur le capital remboursé. Si tu dois 50 000 €, les intérêts trimestriels sont 50 000 × 4 % / 4 = 500 €. Pas assez d'infos dans la question.`,
        explicationFausses: [
          `Applique le taux au remboursement du jour (faux).`,
          `Invente un capital qui n'existe pas.`,
          `Bien que ça semble logique, ça ignore la vraie base de calcul.`,
        ],
      },
      {
        question: `Après 2 ans (8 trimestres) de remboursement régulier d'un emprunt, tes intérêts vont :`,
        choix: [
          `Augmenter (tu as remboursé du capital)`,
          `Diminuer (il reste moins de capital à intéresser)`,
          `Rester identiques (le taux est fixe)`,
          `Doubler (tu paies les intérêts deux fois)`,
        ],
        bonneReponse: 1,
        explicationBonne: `À chaque remboursement, le capital diminue. Puisque les intérêts se calculent sur ce qui reste, ils baissent naturellement. C'est logique : plus tu dois peu, moins tu paies de frais.`,
        explicationFausses: [
          `Inverse la logique — c'est l'opposé qui se passe.`,
          `Le montant total des intérêts est constant si tu paies la même somme, mais la part intérêts vs capital change.`,
          `Tu ne paies jamais les intérêts deux fois sur la même base.`,
        ],
      },
      {
        question: `Ton emprunt original était 100 000 €. Tu as remboursé 40 000 € jusqu'ici. Taux : 3 % annuel. Tes intérêts trimestriels sont maintenant :`,
        choix: [
          `750 € (3 % de 100 000 / 4)`,
          `450 € (3 % de 60 000 / 4)`,
          `300 € (3 % de 40 000 / 4)`,
          `900 € (3 % de 120 000 / 4)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Capital restant = 100 000 - 40 000 = 60 000 €. Intérêts annuels = 60 000 × 3 % = 1 800 €. Par trimestre = 1 800 / 4 = 450 €. Simple et mécanique.`,
        explicationFausses: [
          `Calcule sur le capital initial (ne tient pas compte des remboursements).`,
          `Calcule sur le capital remboursé (illogique).`,
          `Invente un capital qui n'existe pas.`,
        ],
      },
      {
        question: `Tu dois rembourser chaque trimestre 5 000 € (capital + intérêts mélangés). Tes intérêts ce trimestre sont 800 €. Combien de capital rembourses-tu réellement ?`,
        choix: [
          `5 000 €`,
          `4 200 € (5 000 - 800)`,
          `4 200 €`,
          `5 800 € (5 000 + 800)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Le paiement de 5 000 € se décompose en 800 € d'intérêts (charge) et 4 200 € de remboursement du capital (réduction de dette). C'est crucial pour ton bilan.`,
        explicationFausses: [
          `Confond le paiement total avec le remboursement de capital.`,
          `(identique à la bonne réponse)`,
          `Additionne au lieu de soustraire — faux total.`,
        ],
      },
    ],
  },
  2: {
    etape: 2,
    questions: [
      {
        question: `Tu achètes 10 000 € de marchandises que tu paies cash. Tes charges ce trimestre vont :`,
        choix: [
          `Rester inchangées (tu n'as pas vendu, donc pas de charge)`,
          `Augmenter de 10 000 €`,
          `Diminuer de 10 000 €`,
          `Augmenter de 5 000 €`,
        ],
        bonneReponse: 0,
        explicationBonne: `Acheter n'est pas une charge — c'est juste une transformation : tu échanges du cash contre du stock. La charge (coût des ventes) ne vient que quand un client achète la marchandise. Avant, c'est juste de l'argent immobilisé.`,
        explicationFausses: [
          `Confond achat et coût des ventes (erreur majeure).`,
          `L'achat ne diminue pas les charges.`,
          `Pourquoi seulement la moitié ? Pas de logique.`,
        ],
      },
      {
        question: `Ton stock en début de trimestre : 15 000 €. Tu achètes 8 000 €. À la fin du trimestre, tu as vendu pour 20 000 € HT (c'est-à-dire 20 000 € de marchandises). Ton stock final est :`,
        choix: [
          `3 000 € (15 000 + 8 000 - 20 000)`,
          `23 000 € (15 000 + 8 000)`,
          `20 000 €`,
          `15 000 €`,
        ],
        bonneReponse: 0,
        explicationBonne: `Stock initial (15 000) + Achats (8 000) - Marchandises vendues (20 000) = 3 000 €. C'est la logique des entrepôts : tu remplis, tu vides. Pas compliqué.`,
        explicationFausses: [
          `Oublie de soustraire les ventes — tu compterais le stock deux fois.`,
          `Ignore le stock initial et les achats.`,
          `Prétend qu'il n'y a eu aucun mouvement.`,
        ],
      },
      {
        question: `Tu achètes à crédit (tu dois payer dans 60 jours). Que se passe-t-il immédiatement ?`,
        choix: [
          `Ta banque baisse de 10 000 €`,
          `Ton stock augmente et ta banque diminue`,
          `Ton stock augmente, ta banque ne bouge pas (tu dois de l'argent au fournisseur)`,
          `Tes charges augmentent immédiatement`,
        ],
        bonneReponse: 2,
        explicationBonne: `L'achat à crédit augmente ton stock mais crée une "dette fournisseur" au lieu de faire sortir du cash immédiatement. C'est pratique pour ta trésorerie à court terme, mais tu dois payer plus tard.`,
        explicationFausses: [
          `C'est vrai si tu paies cash, pas à crédit.`,
          `Mélange achat cash et achat crédit.`,
          `Les charges ne montent que si tu vends.`,
        ],
      },
      {
        question: `Tes créances clients (argent que tu dois recevoir) t'aident à :`,
        choix: [
          `Augmenter ta banque immédiatement`,
          `Réduire ton stock directement`,
          `Suivre combien de clients te doivent de l'argent (tracabilité)`,
          `Payer tes fournisseurs plus vite`,
        ],
        bonneReponse: 2,
        explicationBonne: `Les créances clients c'est un actif : ça montre combien les clients te doivent. C'est un pense-bête pour savoir "attends, j'ai vendu 100 000 € à crédit à des gens mais je n'ai reçu que 60 000 €".`,
        explicationFausses: [
          `Les créances ne sont pas encore du cash.`,
          `Les créances n'impactent pas le stock.`,
          `Au contraire, il faut que tu sois payé pour payer tes fournisseurs.`,
        ],
      },
      {
        question: `Tu mets 90 jours de crédit à tes clients (au lieu de 30). C'est bon pour :`,
        choix: [
          `Ta banque (tu reçois plus vite)`,
          `Tes frais financiers (tu empruntes moins)`,
          `Ton attractivité client (plus facile de vendre, clients heureux)`,
          `Ton cash-flow à court terme (tu as plus d'argent)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Oui, les longs délais attirent les clients (c'est un avantage commercial). Mais c'est mauvais pour ta trésorerie (tu attends 3 mois pour être payé) et bon pour les clients (ils ont 3 mois pour payer).`,
        explicationFausses: [
          `Au contraire, tu reçois plus lentement.`,
          `Au contraire, tu dois peut-être emprunter pour combler le trou.`,
          `Au contraire, tu as moins d'argent en banque (tu attends).`,
        ],
      },
    ],
  },
  3: {
    etape: 3,
    questions: [
      {
        question: `Tu as 30 000 € de créances clients. Ce trimestre, 12 000 € sont payés. Tes créances clients passent à :`,
        choix: [
          `30 000 € (tu n'as pas vendu plus)`,
          `42 000 € (30 000 + 12 000)`,
          `18 000 € (30 000 - 12 000)`,
          `12 000 € (tu as seulement reçu ce montant)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Quand un client paie une partie, sa dette diminue. Tu as toujours des créances, mais moins qu'avant : 30 000 - 12 000 = 18 000 €. Simple logique.`,
        explicationFausses: [
          `Prétend qu'aucun paiement n'a eu lieu.`,
          `Additionne au lieu de soustraire — tu ne crées pas de dettes en recevant de l'argent.`,
          `Confond le paiement avec les créances restantes.`,
        ],
      },
      {
        question: `Tes clients te doivent 50 000 €. Selon tes contrats, ils te paient 25 % par mois. Ce trimestre (3 mois), combien rentrera en banque ?`,
        choix: [
          `12 500 € (25 % une seule fois)`,
          `25 000 € (50 %)`,
          `37 500 € (25 % × 3 mois de 50 000)`,
          `50 000 € (tout d'un coup)`,
        ],
        bonneReponse: 2,
        explicationBonne: `25 % par mois pendant 3 mois = 75 % de 50 000 = 37 500 €. À la fin du trimestre, tu en auras reçu 75 %, il te restera 12 500 € en créances.`,
        explicationFausses: [
          `Une seule fois, pas 3 mois.`,
          `C'est seulement 50 % (2 mois de paiement).`,
          `C'est impossible en 3 mois si tu reçois 25 % par mois.`,
        ],
      },
      {
        question: `Tu as vendu 40 000 € à crédit ce mois-ci. Tes clients habituels paient 50 % le mois suivant, 30 % le mois d'après, 20 % le mois d'après. À la fin du mois 3, combien as-tu reçu ?`,
        choix: [
          `40 000 € (tout)`,
          `20 000 € (50 % seulement)`,
          `32 000 € (20k + 12k)`,
          `70 000 € (50 % + 30 % + 20 % = 100 %, donc 40 000 × 1,75)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Mois 1 (vente) : 0 € reçu. Mois 2 : 40 000 × 50 % = 20 000 €. Mois 3 : 40 000 × 30 % = 12 000 €. À la fin du mois 3, tu en as reçu 32 000 €, il te reste 8 000 € à recevoir en mois 4.`,
        explicationFausses: [
          `Impossible si les clients paient progressivement.`,
          `C'est seulement le 2e mois.`,
          `Tu mélanges tout — 50 + 30 + 20 = 100 %, pas 175 %.`,
        ],
      },
      {
        question: `Quand un client te paie, quel impact sur ton résultat ?`,
        choix: [
          `Aucun (tu as déjà compté la vente quand tu l'as faite)`,
          `Ça augmente ton résultat (c'est du revenu)`,
          `Ça diminue ton résultat (c'est une dépense)`,
          `Ça crée une petite charge de gestion`,
        ],
        bonneReponse: 0,
        explicationBonne: `Le résultat, c'est Revenus - Charges. Tu as déjà compté le revenu quand tu as vendu (même à crédit). Quand le client paie, tu récupères juste l'argent promis — aucun changement au résultat, juste à la banque.`,
        explicationFausses: [
          `Tu compterais la vente deux fois.`,
          `Recevoir de l'argent n'est pas une charge.`,
          `Il n'y a aucune charge supplémentaire.`,
        ],
      },
      {
        question: `Tu aimes bien garder de gros délais de paiement (120 jours) pour tes clients. C'est bon pour :`,
        choix: [
          `Tes résultats (tu vends plus)`,
          `Ta trésorerie court terme (tu reçois plus vite)`,
          `Ton attractivité auprès des clients, mais mauvais pour ta trésorerie`,
          `Tes intérêts d'emprunt (tu dois moins emprunter)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Les délais longs attirent les clients (ils aiment avoir le temps de payer), mais toi, tu attends 4 mois avant d'avoir l'argent. Pendant ce temps, tu dois payer tes fournisseurs, tes salaires… avec quoi ? Donc tu dois emprunter ou avoir beaucoup de réserve. C'est un piège.`,
        explicationFausses: [
          `Les résultats ne changent pas, le délai oui.`,
          `C'est l'inverse — tu reçois plus lentement.`,
          `Au contraire, tu dois emprunter plus pour combler le trou.`,
        ],
      },
    ],
  },
  4: {
    etape: 4,
    questions: [
      {
        question: `Tes 2 commerciaux ont généré 80 000 € de chiffre d'affaires ce trimestre. Chacun gagne 1 500 € par mois fixe, plus 5 % de commission sur les ventes. Combien les paies-tu ce trimestre ?`,
        choix: [
          `9 000 € (1 500 × 3 mois)`,
          `13 000 € (9 000 + 4 000 commission)`,
          `4 000 € (5 % de 80 000)`,
          `20 000 €`,
        ],
        bonneReponse: 1,
        explicationBonne: `Fixe : 1 500 × 3 mois × 2 commerçants = 9 000 €. Commission : 5 % × 80 000 € = 4 000 € total. Total : 13 000 €.`,
        explicationFausses: [
          `Oublie la commission — ça réduit ton bénéfice.`,
          `C'est seulement la commission, pas le fixe.`,
          `Calcul brouillon.`,
        ],
      },
      {
        question: `Tu as 3 commerciaux. Tu penses à te débarrasser d'un pour réduire tes coûts. Quel est le risque ?`,
        choix: [
          `Tes charges baissent (bon pour toi)`,
          `Tu perds le chiffre d'affaires qu'il générait (souvent plus grave)`,
          `Tes clients seront plus heureux (un seul contact)`,
          `Tu fais plus de bénéfices`,
        ],
        bonneReponse: 1,
        explicationBonne: `Oui, tu paies moins en salaire si tu le vires. Mais ce gars ramène peut-être 50 000 € de chiffre par trimestre. Tu économises 4 500 € en salaire mais tu perds 50 000 € en ventes — mauvais calcul.`,
        explicationFausses: [
          `C'est vrai que tes charges baissent, mais ce n'est pas l'enjeu majeur.`,
          `Au contraire, moins de vendeurs = moins d'attention client.`,
          `Perdre du chiffre = moins de bénéfices, même si tu paies moins.`,
        ],
      },
      {
        question: `Ton commercial a généré 30 000 € ce trimestre. Tu lui dois 2 000 € fixes + 10 % de commission. Combien paies-tu ?`,
        choix: [
          `2 000 €`,
          `5 000 € (30 000 / 6)`,
          `5 000 € (2 000 + 3 000)`,
          `3 000 € (10 % × 30 000)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Fixe : 2 000 €. Commission : 10 % × 30 000 € = 3 000 €. Total : 5 000 €.`,
        explicationFausses: [
          `Ignores la commission.`,
          `Fait un calcul aléatoire.`,
          `C'est le montant juste mais par calcul partiel (commission seulement).`,
        ],
      },
      {
        question: `Tu augmentes la commission de tes commerçants de 5 % à 8 % pour les motiver. Ton chiffre monte de 100 000 à 130 000 €. C'est bon pour toi si :`,
        choix: [
          `Les nouvelles commissions n'excèdent pas 3 900 € supplémentaires`,
          `Les bénéfices supplémentaires (30 000 € × ta marge) > les nouvelles commissions`,
          `Ton résultat baisse mais ta réputation monte`,
          `Tu vends plus, point`,
        ],
        bonneReponse: 1,
        explicationBonne: `Nouvelle commission = 8 % × 130 000 = 10 400 €. Ancienne = 5 % × 100 000 = 5 000 €. Différence : +5 400 € de commissions. Les 30 000 € de ventes supplémentaires te rapportent disons 40 % de marge = 12 000 €. Donc oui, tu gagnes 12 000 - 5 400 = 6 600 € de plus.`,
        explicationFausses: [
          `Le montant de 3 900 € n'a aucun sens.`,
          `Tu ne fais pas des affaires pour la réputation.`,
          `Oui tu vends plus, mais faut que ça coûte moins que tu ne gagnes.`,
        ],
      },
      {
        question: `Tes commerciaux coûtent 10 % de ton chiffre en salaires + commissions. Ton chiffre ce trimestre : 200 000 €. Combien coûtent-ils ?`,
        choix: [
          `10 000 €`,
          `20 000 € (10 % × 200 000)`,
          `20 000 €`,
          `100 000 € (50 % de 200 000)`,
        ],
        bonneReponse: 1,
        explicationBonne: `10 % × 200 000 € = 20 000 €. C'est le ratio que tu te fixes.`,
        explicationFausses: [
          `Dix fois trop peu.`,
          `(identique à la bonne réponse)`,
          `Beaucoup trop haut (c'est 50 % là).`,
        ],
      },
    ],
  },
  5: {
    etape: 5,
    questions: [
      {
        question: `Tu vends 50 000 € de marchandises ce trimestre. Tes charges variables (coût de ces marchandises) sont 30 000 €. Ton chiffre d'affaires et ta contribution marge sont :`,
        choix: [
          `CA 50 000, marge 30 000`,
          `CA 50 000, marge 20 000 (50 000 - 30 000)`,
          `CA 80 000, marge 30 000`,
          `CA 50 000, marge 50 000`,
        ],
        bonneReponse: 1,
        explicationBonne: `Le CA, c'est ce que tu vends (50 000 €). La marge = CA - Coûts directs = 50 000 - 30 000 = 20 000 €. Avec ces 20 000 €, tu dois couvrir tes frais fixes et faire un bénéfice.`,
        explicationFausses: [
          `Confond marge et coût.`,
          `Additionne le CA et le coût (pas de sens).`,
          `Prétend que tu gardes tout en marge (impossible).`,
        ],
      },
      {
        question: `Tes clients paient cash à la livraison. Tu fais 60 000 € de ventes ce trimestre. Quel est l'impact direct sur ta banque ?`,
        choix: [
          `+60 000 € (tu reçois tout immédiatement)`,
          `+40 000 € (il faut enlever les coûts)`,
          `+60 000 € (le CA montant, pas le bénéfice)`,
          `+30 000 € (la marge nette)`,
        ],
        bonneReponse: 0,
        explicationBonne: `Quand tu vends cash, tu reçois le prix de vente (60 000 €), pas le bénéfice. C'est un montant brut qui entre. Après, tu vas soustraire les coûts et frais pour voir ton bénéfice.`,
        explicationFausses: [
          `Mélange CA et résultat net.`,
          `(identique à la bonne réponse en essence)`,
          `C'est peut-être ton bénéfice, mais pas ce que tu reçois en trésorerie.`,
        ],
      },
      {
        question: `Tu vends 100 000 € de marchandises à crédit (délai 30 jours). À la fin du trimestre, tu as reçu 60 000 €. Ton CA de ce trimestre est :`,
        choix: [
          `60 000 € (ce que tu as reçu)`,
          `100 000 € (ce que tu as vendu, peu importe si tu l'as reçu ou pas)`,
          `40 000 € (ce qui reste à recevoir)`,
          `160 000 € (100 000 + 60 000)`,
        ],
        bonneReponse: 1,
        explicationBonne: `En comptabilité, le CA = ce que tu vends, pas ce que tu reçois. Tu dis "ce trimestre, on a fait 100 000 € de chiffre". Le paiement de 60 000 € c'est du cash, mais le CA c'est 100 000.`,
        explicationFausses: [
          `Confond CA et trésorerie.`,
          `C'est juste ce qui reste à recevoir (créances).`,
          `Mélange ventes et paiements.`,
        ],
      },
      {
        question: `Ton CA ce trimestre : 100 000 €. Ton stock au début : 25 000 €. Tu as acheté : 60 000 €. Ton stock à la fin : 20 000 €. Quel est ton coût des ventes ?`,
        choix: [
          `60 000 € (ce que tu as acheté)`,
          `65 000 € (25 000 + 60 000 - 20 000)`,
          `65 000 €`,
          `45 000 € (25 000 + 20 000)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Coût des ventes = Stock initial + Achats - Stock final = 25 000 + 60 000 - 20 000 = 65 000 €. C'est classique.`,
        explicationFausses: [
          `C'est seulement les achats ce trimestre.`,
          `(identique à la bonne réponse)`,
          `Fait une addition bizarre.`,
        ],
      },
      {
        question: `Tu dois augmenter ton CA de 50 % (de 100 000 € à 150 000 €). Tes frais fixes restent 40 000 €. Ton coût de ventes passe de 60 000 € à 90 000 €. Ton bénéfice avant impôts passe de :`,
        choix: [
          `40 000 € à 60 000 €`,
          `0 € à 20 000 € (résultat = CA - Coûts variables - Fixes)`,
          `60 000 € à 80 000 €`,
          `100 000 € à 150 000 €`,
        ],
        bonneReponse: 1,
        explicationBonne: `Avant : 100 000 - 60 000 - 40 000 = 0 € (break-even). Après : 150 000 - 90 000 - 40 000 = 20 000 €. C'est magique : +50 % de CA et tu passes de zéro à +20 000 € de profit. C'est l'effet de levier !`,
        explicationFausses: [
          `Oublie les coûts variables.`,
          `Inventé.`,
          `Mélange CA et bénéfice.`,
        ],
      },
    ],
  },
  6: {
    etape: 6,
    questions: [
      {
        question: `Tu envisages d'embaucher un commercial à 2 000 € par mois + 3 % de commission. Tu estimes qu'il va générer 50 000 € de CA par trimestre. Tes marge brute sur ces ventes : 40 %. C'est rentable ?`,
        choix: [
          `Non, ça te coûte trop cher`,
          `Oui : (50 000 × 40 %) - (6 000 fixe) - (1 500 commission) = 12 500 € net`,
          `Non, les commissions sont trop hautes`,
          `Impossible à calculer sans plus d'infos`,
        ],
        bonneReponse: 1,
        explicationBonne: `Marge brute : 50 000 × 40 % = 20 000 €. Coûts directs : 6 000 € (3 × 2 000) fixe + 1 500 € (3 % × 50 000) commission = 7 500 €. Contribution : 20 000 - 7 500 = 12 500 €. Rentable !`,
        explicationFausses: [
          `Sans calcul, c'est trop vite dit.`,
          `3 %, c'est normal pour une commission.`,
          `On peut calculer avec les infos.`,
        ],
      },
      {
        question: `Tu as actuellement 2 commerciaux qui te rapportent 150 000 € de CA par trimestre. Tu en ajoutes un 3e qui fera 40 000 €. Tes charges fixes montent de 4 500 € par trimestre. Le CA total passe à 190 000 €. C'est un bon choix ?`,
        choix: [
          `Non, tu augmentes tes charges`,
          `Oui si la marge sur les +40 000 € couvre les +4 500 € de charges et encore plus`,
          `Impossible à dire sans la marge`,
          `Oui, tu fais +40 000 € de CA`,
        ],
        bonneReponse: 1,
        explicationBonne: `Les 40 000 € de CA doivent te rapporter en marge brute > 4 500 €. Si ta marge brute est 35 % sur ces 40 000 €, tu fais 14 000 € de marge. Donc oui, c'est rentable (14 000 - 4 500 = 9 500 € gagnés).`,
        explicationFausses: [
          `Plus de charges ne veut pas dire perte.`,
          `"+CA" ne suffît pas, faut regarder la marge et les coûts.`,
          `(identique à la bonne réponse en essence)`,
        ],
      },
      {
        question: `Tu recrutes un commercial 2 000 € par mois. Le premier trimestre, il ne produit que 5 000 € de CA (ramp-up). Tu fais une perte de :`,
        choix: [
          `6 000 € (son salaire pur)`,
          `Ça dépend de sa commission et de ta marge — mais au moins 6 000 € + frais`,
          `2 000 € (juste ce qu'il coûte)`,
          `0 € (tu l'embauches pas si c'est mauvais)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Minimum, tu perds son salaire (6 000 € pour 3 mois). En plus, il faut lui payer une commission sur les 5 000 € vendus. C'est normal en ramp-up.`,
        explicationFausses: [
          `Il y a aussi la commission.`,
          `6 000 € minimum, plus la commission.`,
          `On accepte les pertes de ramp-up en espérant qu'il monte en puissance.`,
        ],
      },
      {
        question: `Tes deux commerciaux actuels ont généré 120 000 € de CA annuel à eux deux. Tu en ajoutes un 3e avec le même potentiel (40 000 € de CA annuel). Sa charge fixe : 2 000 € par mois. C'est viable si :`,
        choix: [
          `Tu as 24 000 € de trésorerie libre pour supporter son paiement`,
          `Tu as 24 000 € et que ça génère au moins 24 000 € de CA additionnel en marge brute`,
          `Tu es prêt à perdre un peu les premiers mois (risque accepté)`,
          `Tu as une trésorerie de plus de 100 000 €`,
        ],
        bonneReponse: 1,
        explicationBonne: `Les 40 000 € de CA doivent générer au minimum 24 000 € de marge brute pour couvrir son salaire (24 000 €/an). Si ta marge est 50 %+ tu gagnes. Mais il faut cette trésorerie cushion.`,
        explicationFausses: [
          `24 000 € c'est nécessaire mais pas suffisant.`,
          `Oui il faut un risque, mais il faut du calcul derrière.`,
          `100 000 € c'est excessif.`,
        ],
      },
      {
        question: `Tu dois choisir entre recruter 1 commercial (coûte 24k/an, génère 100k CA) vs investir 24k dans un logiciel de vente (génère 50k CA supplémentaires). Lequel choisir ?`,
        choix: [
          `Le commercial (plus de CA)`,
          `Le logiciel (moins de risque)`,
          `Ça dépend de ta marge et de ta trésorerie — les deux peuvent être rentables`,
          `Aucun, garde la trésorerie`,
        ],
        bonneReponse: 2,
        explicationBonne: `Commercial : 100k CA × 50% marge = 50k contribution - 24k salaire = 26k gain. Logiciel : 50k CA × 50% marge = 25k gain (si on suppose une durée). C'est comparable. Le choix dépend du risque et de ton appétit.`,
        explicationFausses: [
          `Le commercial génère plus de CA mais coûte plus.`,
          `Le logiciel est moins de risque, mais pas rentable.`,
          `Les deux peuvent être rentables, pas "aucun".`,
        ],
      },
    ],
  },
  7: {
    etape: 7,
    questions: [
      {
        question: `Un événement t'apporte +20 000 € de CA bonus (gros client inattendu). Tes charges ne changent pas. Ton résultat va augmenter de :`,
        choix: [
          `20 000 € (tout le CA est du bénéfice)`,
          `15 000 € (20 000 CA × 75 % marge brute)`,
          `0 € (c'est du hasard, ça compense ailleurs)`,
          `10 000 € (la moitié du CA)`,
        ],
        bonneReponse: 1,
        explicationBonne: `CA additionnel 20 000 €. Tu dois enlever le coût (disons 5 000 € si tu coûtes 25 %). Donc 20 000 - 5 000 = 15 000 € de contribution. C'est du pur bénéfice puisque tes charges fixes ne montent pas.`,
        explicationFausses: [
          `Ignores le coût des ventes.`,
          `Au contraire, c'est du bonus pur.`,
          `Arbitraire.`,
        ],
      },
      {
        question: `Un événement négatif : un fournisseur augmente ses prix de 20 %. Tes achats trimestriels : 60 000 €. Le surcoût : 12 000 €. Ton résultat baisse de :`,
        choix: [
          `12 000 €`,
          `Plus que 12 000 € si tu ne peux pas augmenter tes prix client`,
          `Moins de 12 000 € (tu as des réserves)`,
          `0 € (c'est un cas rare)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Oui le coût monte de 12 000 €. Mais si tu ne peux pas répercuter sur tes prix, ta marge brute s'érode. L'impact réel > 12 000 €.`,
        explicationFausses: [
          `Vrai en première approximation, mais incomplet.`,
          `Les réserves aident à la trésorerie, pas au résultat.`,
          `Faux, c'est un risque classique.`,
        ],
      },
      {
        question: `Un concurrent te prend 30 % de tes clients ce trimestre. Ton CA passe de 100 000 € à 70 000 €. Tes charges fixes restent 40 000 €. Ton résultat après :`,
        choix: [
          `0 € (tu perds tout)`,
          `-5 000 € (70 000 - 30 000 coûts ventes - 40 000 fixes)`,
          `Ça dépend du coût unitaire, mais tu perds beaucoup`,
          `+5 000 € (tu en gardes la moitié)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Nouveau CA 70 000 €. Coût des ventes = 70 000 × (30 000/100 000) = 21 000 €. Résultat = 70 000 - 21 000 - 40 000 = 9 000 €. (C'est positif, mais tu as perdu 21 000 € de résultat.)`,
        explicationFausses: [
          `Trop pessimiste.`,
          `(identique à la bonne réponse)`,
          `Trop optimiste.`,
        ],
      },
      {
        question: `Tu reçois un événement "Subvention COVID de 5 000 €". Ton résultat va :`,
        choix: [
          `Augmenter de 5 000 € (c'est du revenu pur)`,
          `Augmenter de 3 500 € (après impôts)`,
          `Augmenter de 5 000 € net (les subventions ne sont pas imposées généralement)`,
          `Ne pas changer (c'est du provisoire)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Une subvention est du revenu exceptionnel qui augmente ton résultat (généralement non imposée ou partiellement imposée). +5 000 € net.`,
        explicationFausses: [
          `Grosso modo vrai mais formulation simpliste.`,
          `On va pas appliquer d'impôts immédiatement.`,
          `Non c'est immédiat.`,
        ],
      },
      {
        question: `Tu as une série d'événements : +10 000 € (gros client), -3 000 € (rupture stock), +2 000 € (subvention). L'impact net sur ton résultat ce trimestre est :`,
        choix: [
          `+9 000 € (10 - 3 + 2)`,
          `+9 000 € en CA, mais moins en résultat`,
          `+15 000 € (tout ce qui arrive additionne)`,
          `Environ +5 000 € (6k bénéfice + 3k perte + 2k sub)`,
        ],
        bonneReponse: 3,
        explicationBonne: `+10 000 € CA × 60 % marge = +6 000 € de bénéfice. -3 000 € coût supplémentaire = -3 000 €. +2 000 € subvention = +2 000 €. Net : +6 000 - 3 000 + 2 000 = +5 000 €.`,
        explicationFausses: [
          `9 000 € suppose qu'on additionne sans considérer les coûts.`,
          `Partiellement juste.`,
          `Tu ne sommes pas les CA et les subventions.`,
        ],
      },
    ],
  },
  8: {
    etape: 8,
    questions: [
      {
        question: `À la clôture du trimestre, tu as : CA 120 000 €, charges 80 000 € (dont 30 000 € d'amortissement). Ton résultat net (avant impôts) est :`,
        choix: [
          `40 000 €`,
          `40 000 € (120 000 - 80 000)`,
          `50 000 € (on enlève pas l'amortissement)`,
          `70 000 € (120 000 - 50 000 de charges réelles)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Résultat = CA - Toutes les charges (y compris amortissement). 120 000 - 80 000 = 40 000 €. L'amortissement compte, même s'il ne sort pas de trésorerie.`,
        explicationFausses: [
          `(identique à la bonne réponse)`,
          `Tu dois enlever l'amortissement.`,
          `Tu mélanges les concepts.`,
        ],
      },
      {
        question: `Ton résultat ce trimestre : +15 000 € (bénéfice). Ton bilan initial : Actif 500 000 €, Passif (dettes) 300 000 €, Capitaux propres 200 000 €. À la clôture, tes capitaux propres deviennent :`,
        choix: [
          `200 000 € (inchangé)`,
          `215 000 € (200 000 + 15 000 de bénéfice)`,
          `300 000 € (tu augmentes tes réserves)`,
          `185 000 € (tu dois payer des impôts)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Chaque trimestre de bénéfice augmente tes capitaux propres (réserves). 200 000 + 15 000 = 215 000 €. C'est un investissement dans ta propre boîte.`,
        explicationFausses: [
          `Non, le bénéfice gonfle les capitaux propres.`,
          `On ne crée pas un deuxième palier.`,
          `On va payer les impôts plus tard.`,
        ],
      },
      {
        question: `À la clôture, tu dois faire attention à tes ratios. L'endettement maximal acceptable pour un jeune entrepreneur est environ :`,
        choix: [
          `50 % de l'actif (dette = 50 % de ce que tu possèdes)`,
          `70 % de l'actif (tu peux être plus endetté quand tu croîs)`,
          `Ça dépend du secteur et de la stabilité du cash-flow`,
          `100 % (pas de limite)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Un ratio d'endettement "sain" dépend : secteur stable = 60-70 %, secteur volatile = 40-50 %. Plus ton cash-flow est stable, plus tu peux te permettre de dettes. Pour une startup, 50-60 % c'est standard.`,
        explicationFausses: [
          `Peut être trop conservateur.`,
          `70 % c'est OK mais dépend.`,
          `Sans limite = tu crèves rapidement.`,
        ],
      },
      {
        question: `À la clôture, tu constates que ta trésorerie (banque) est passée de 80 000 € à 60 000 € ce trimestre. Tu as un résultat positif (+10 000 €) mais tu as moins d'argent. Pourquoi ?`,
        choix: [
          `Le résultat ne compte pas, seul le cash compte`,
          `Tu as probablement remboursé de la dette ou investi plus que ton bénéfice`,
          `Il y a une erreur comptable`,
          `C'est normal, la trésorerie baisse toujours`,
        ],
        bonneReponse: 1,
        explicationBonne: `Résultat != Trésorerie. Tu peux faire +10 000 € de résultat mais avoir investi 35 000 € ou remboursé 25 000 € de dettes. C'est très normal et fréquent.`,
        explicationFausses: [
          `Faux, le résultat compte (c'est ta rentabilité long terme).`,
          `Non c'est une vraie situation.`,
          `Non, elle peut monter ou baisser.`,
        ],
      },
      {
        question: `Tu as 12 trimestres devant toi (3 exercices). Le trimestre 4, tu as perdu 5 000 €. C'est grave ?`,
        choix: [
          `Oui, tu dois arrêter tout`,
          `Non, ça arrive à tout le monde`,
          `Ça dépend si tu as une réserve et si c'est une tendance ou une anomalie`,
          `Non, tu as encore du temps`,
        ],
        bonneReponse: 2,
        explicationBonne: `Une perte trimestrielle ce n'est pas dramatique si : 1) tu as une réserve (tu ne crèves pas), 2) c'est une anomalie, pas une tendance. Mais si ça continue 3 trimestres d'affilée sans réserve, tu dois t'inquiéter.`,
        explicationFausses: [
          `Alarmiste.`,
          `Trop léger.`,
          `Tu as du temps, mais faut réagir vite.`,
        ],
      },
    ],
  },
  9: {
    etape: 9,
    questions: [
      {
        question: `Tu dois décider : investir ou pas dans quelque chose. L'investissement coûte 50 000 € maintenant. Il te rapportera 10 000 € par an pendant 10 ans. C'est bon ?`,
        choix: [
          `Non, tu investis 50 000 € et tu ne récupères que 100 000 € au total`,
          `Oui, c'est 100 000 € de revenus pour 50 000 € investi`,
          `Ça dépend : ton ROI est 100 % sur 10 ans (10 % par an), faut que ce soit > ton coût d'emprunt`,
          `Impossible à dire, c'est du long terme`,
        ],
        bonneReponse: 2,
        explicationBonne: `ROI = (Revenus - Investissement) / Investissement = (100 000 - 50 000) / 50 000 = 100 % sur 10 ans = 10 % par an. Si tu empruntes à 4 %, c'est bon. Si tu empruntes à 12 %, c'est mauvais.`,
        explicationFausses: [
          `C'est vrai brut, mais il faut regarder le ROI et le coût du capital.`,
          `C'est positif mais pas rentable si c'est long terme.`,
          `On peut calculer avec les infos.`,
        ],
      },
      {
        question: `Ton projet business A te rapporterait 30 000 € en bénéfice annuel et te coûte 100 000 € à mettre en place. Projet B : 50 000 € en bénéfice, coûte 150 000 €. Lequel choisir ?`,
        choix: [
          `A, ça rapporte moins cher à mettre en place`,
          `B, ça rapporte plus en absolu`,
          `Regarde le ROI : A = 30 %, B = 33 %, B est un peu mieux mais dépend de ta trésorerie`,
          `Aucun, c'est trop risqué`,
        ],
        bonneReponse: 2,
        explicationBonne: `A : ROI = 30 000 / 100 000 = 30 % annuel. B : ROI = 50 000 / 150 000 = 33 % annuel. B est légèrement meilleur, mais si tu n'as que 100 000 €, tu dois choisir A.`,
        explicationFausses: [
          `Juste le coût ne suffit pas.`,
          `Juste le montant absolu ne suffit pas.`,
          `Les deux peuvent être bons avec le bon ROI.`,
        ],
      },
      {
        question: `Tu as 100 000 € en banque. Un investissement A rapporte 10 %, un investissement B rapporte 15 %. Tu empruntes à 6 %. Lequel choisir ?`,
        choix: [
          `A, c'est plus sûr`,
          `B, ça rapporte plus`,
          `B, car 15 % > 6 % (coût d'emprunt), donc c'est positif net`,
          `Aucun, garde la trésorerie`,
        ],
        bonneReponse: 2,
        explicationBonne: `B rapporte 15 % alors que tu dois rembourser 6 %. Le gain net est 15 - 6 = 9 %. C'est du "arbitrage positif".`,
        explicationFausses: [
          `A est plus sûr mais moins rentable.`,
          `B rapporte plus mais faut vérifier vs le coût d'emprunt.`,
          `Si le ROI > coût d'emprunt, c'est bon d'investir.`,
        ],
      },
      {
        question: `Ton ROI (retour sur investissement) doit être au minimum :`,
        choix: [
          `0 % (au minimum tu récupères ton argent)`,
          `5 % (tu gagnes un peu)`,
          `Supérieur à ton coût d'emprunt (ex: si tu empruntes à 4 %, faut ROI > 4 %)`,
          `20 % minimum (sinon ce n'est pas intéressant)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Si tu empruntes à 4 % pour un investissement qui te rapporte 3 %, tu perds de l'argent. Donc ROI > coût d'emprunt, minimum.`,
        explicationFausses: [
          `0 % c'est break-even, pas rentable.`,
          `5 % c'est peut-être juste assez.`,
          `20 % c'est optimal mais pas toujours atteignable.`,
        ],
      },
      {
        question: `Tu as 100 000 € en banque. Un super investissement te coûterait 80 000 € et tu serais forcé d'emprunter 0 € (tu paies cash). Ça te laisserait 20 000 € en trésorerie. C'est bon ?`,
        choix: [
          `Oui, maximum de cash pour l'investissement`,
          `Peut-être pas — 20 000 € c'est peut-être pas assez de réserve d'urgence`,
          `Oui si l'investissement est solide, non si le business reste fragile`,
          `Non, tu dois garder au minimum 50 % en réserve`,
        ],
        bonneReponse: 2,
        explicationBonne: `Ça dépend. Si tu as des charges fixes stables, 20 000 € peut suffire (ça couvre 1-2 mois). Si tu es fragile, c'est trop peu. Tu dois avoir une réserve = 2-3 mois de charges fixes minimum.`,
        explicationFausses: [
          `Pas assez de réserve.`,
          `Partiel — dépend du contexte.`,
          `50 % c'est peut-être excessif.`,
        ],
      },
    ],
  },
};
