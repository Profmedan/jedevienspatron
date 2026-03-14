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
  choix: [string, string, string]; // A, B, C
  bonneReponse: 0 | 1 | 2; // index 0=A, 1=B, 2=C
  explicationBonne: string;
  explicationFausses: [string, string]; // explications des 2 mauvaises réponses
}

export interface QCMEtape {
  etape: number;
  questions: QuestionQCM[]; // pool d'au moins 6 questions — 2 séries de 3 par tour
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
    ceQuiSePasse: `Tu achètes de la marchandise auprès de tes fournisseurs pour la revendre. Cet achat augmente ton stock. Tu le paies maintenant (ou plus tard si c'est à crédit fournisseur — tu paieras au prochain tour), mais tu ne le comptabilises en "charge" que quand tu le vends.`,
    pourquoi: `Plus tu as de stock, plus tu peux vendre — mais tu dois avoir de l'argent disponible (ou du crédit fournisseur) pour le financer. Un stock trop gros bloque ton argent inutilement, trop petit te fait rater des ventes.`,
    impactComptes: `L'achat augmente ton stock (ce que tu possèdes) et réduit ta banque (ou crée une dette envers ton fournisseur). Pas de charge immédiate — c'est seulement quand tu vends que ça devient un "coût des ventes".`,
    conseil: `Achète juste assez pour 2-3 mois de ventes estimées. Pas plus, sinon tu immobilises de l'argent qui ne rapporte rien.`,
  },
  3: {
    etape: 3,
    titre: `Tes clients te paient enfin !`,
    ceQuiSePasse: `Les clients à qui tu as vendu à crédit te remboursent (partiellement ou totalement). De l'argent rentre dans ta banque. Tu diminues tes créances clients (les montants que tes clients te devaient) d'autant.`,
    pourquoi: `Vendre ne suffit pas — c'est encaisser qui compte vraiment. Tant que tes clients ne paient pas, tu as fait une vente sur le papier mais tu n'as pas d'argent disponible. Et sans argent, même une entreprise pleine de ventes peut faire faillite.`,
    impactComptes: `Les créances clients baissent (les montants que tes clients te devaient diminuent). Ta banque augmente (l'argent arrive). Zéro impact sur le résultat — la vente avait déjà été comptée au moment où tu l'as faite.`,
    conseil: `Surveille tes délais de paiement. Plus les clients paient vite, mieux ta trésorerie se porte. Laisser des clients payer très tard, c'est leur faire crédit sans le décider — et ça peut t'étouffer.`,
  },
  4: {
    etape: 4,
    titre: `Tu paies tes vendeurs pour leurs efforts`,
    ceQuiSePasse: `Tes commerciaux (vendeurs/représentants) te ramènent des ventes. Tu dois les payer — soit un salaire fixe, soit une commission (pourcentage des ventes), soit les deux. L'argent sort de ta banque.`,
    pourquoi: `Sans eux, tu ne vends rien. Mais tu dois pouvoir les payer. Un commercial qui gagne bien = motivation et plus de ventes. Un commercial mal payé = démotivation et départ.`,
    impactComptes: `Le paiement réduit ta banque et augmente tes charges (frais commerciaux/salaires). C'est une dépense courante.`,
    conseil: `Paie une commission qui te laisse une marge suffisante. Si tu paies 50 % de chaque vente en commission, il faut vraiment vendre beaucoup pour que ça reste rentable.`,
  },
  5: {
    etape: 5,
    titre: `Tes commerciaux livrent, tu fais des ventes !`,
    ceQuiSePasse: `Grâce au travail de tes commerciaux, des clients reçoivent de la marchandise et tu enregistres une vente. Ton chiffre d'affaires (total des ventes) monte. Selon tes conditions, tu reçois l'argent tout de suite ou une promesse de paiement.`,
    pourquoi: `C'est LE moteur de ton entreprise. Plus tu vends, plus tu couvres tes frais fixes et plus tu fais de bénéfice. Sans clients, tu n'es rien.`,
    impactComptes: `Le chiffre d'affaires augmente (résultat en plus). Ton stock diminue (la marchandise part). Tes créances clients montent (si tu vends à crédit) ou ta banque augmente (si le client paie comptant).`,
    conseil: `Plus tu vends, plus tes frais fixes se répartissent sur beaucoup de ventes — tes bénéfices montent beaucoup plus vite que tes ventes. C'est le principe du seuil de rentabilité : une fois tes frais couverts, chaque euro de vente supplémentaire est presque tout bénéfice.`,
  },
  6: {
    etape: 6,
    titre: `Tu embauches un nouveau vendeur (ou pas)`,
    ceQuiSePasse: `Tu as la possibilité d'embaucher un nouveau commercial. Il va développer tes ventes mais te coûtera en salaire fixe (+ commissions sur ses ventes). C'est une décision stratégique : risque vs. bénéfice potentiel.`,
    pourquoi: `Recruter, c'est investir dans une personne. Ça coûte tout de suite (son salaire), mais ça rapporte progressivement (ses ventes). Tu dois avoir assez de trésorerie pour tenir pendant le temps qu'il lui faut pour être pleinement efficace.`,
    impactComptes: `Ses salaires augmentent tes charges (réduction du résultat). Ses ventes augmentent ton chiffre d'affaires. Au final : rentable ou pas ? Ça dépend si les ventes qu'il génère rapportent plus que son salaire.`,
    conseil: `Recrute un commercial si tu penses vraiment qu'il va générer en ventes au moins 2 à 3 fois son salaire annuel. Sinon, c'est une perte nette.`,
  },
  7: {
    etape: 7,
    titre: `Tu investis dans un nouvel équipement ou compétence`,
    ceQuiSePasse: `Tu achètes ou investis dans quelque chose qui va augmenter ta productivité ou ta capacité : nouveau camion, logiciel, formation… L'argent sort de ta trésorerie immédiatement, mais la valeur créée dure longtemps.`,
    pourquoi: `Les investissements coûtent cher maintenant mais rapportent plus tard. Un bon investissement peut doubler ta capacité. Un mauvais investissement te paralyse financièrement.`,
    impactComptes: `L'investissement augmente un actif (camion, logiciel — quelque chose que tu possèdes) et réduit ta banque immédiatement. Ensuite, tu l'amortis sur plusieurs années (tu répartis la charge progressivement sur sa durée de vie).`,
    conseil: `Avant d'investir, calcule le retour sur investissement. Il faut que ce que ça te rapporte (ventes ou économies) soit supérieur à ce que ça te coûte, sur une durée raisonnable.`,
  },
  8: {
    etape: 8,
    titre: `Une surprise (bonne ou mauvaise) tombe du ciel`,
    ceQuiSePasse: `Chaque trimestre, un événement aléatoire arrive : un gros client se précipite sur toi (hausse des ventes), un concurrent baisse ses prix (tu perds des clients), une usine ferme (rupture de stock), un emprunt devient plus cher… Les entrepreneurs vivent dans l'incertitude.`,
    pourquoi: `C'est la réalité. Tu peux avoir le meilleur plan du monde, mais la vie te joue des tours. Comment tu réagis ? Tu paniques ? Tu t'adaptes ? La vraie compétence, c'est de rebondir.`,
    impactComptes: `Ça dépend de l'événement. Une grosse vente = chiffre d'affaires en hausse. Une rupture d'approvisionnement = stock qui baisse, ventes manquées. Un accident = dépense imprévue. Chaque événement modifie ton résultat du trimestre.`,
    conseil: `Garde toujours une réserve de trésorerie pour absorber les mauvaises surprises. Et regarde les bonnes surprises comme des occasions à saisir — ne les gaspille pas en dépenses impulsives.`,
  },
  9: {
    etape: 9,
    titre: `C'est fini ce trimestre, bilan et diagnostic`,
    ceQuiSePasse: `Le trimestre se termine. Tu dois regarder tes résultats : as-tu fait un bénéfice ou une perte ? Ta trésorerie tient-elle ? Tes dettes deviennent-elles trop lourdes par rapport à ce que tu possèdes ? C'est le moment de dire "j'ai bien géré" ou "je dois changer de stratégie".`,
    pourquoi: `Sans ce bilan de fin de trimestre, tu ne sais pas où tu en es. Chaque trimestre clôturé, c'est une occasion de vérifier que tu vas dans la bonne direction.`,
    impactComptes: `Tu calcules ton résultat net (bénéfice ou perte), tu mets à jour ton bilan, tu vérifies ta trésorerie. Si tu as une perte, elle ronge tes fonds propres (l'argent mis au départ + les bénéfices accumulés). Si tu as un bénéfice, tu le gardes en réserve ou tu le distribues.`,
    conseil: `À chaque clôture, pose-toi : "Où en suis-je réellement ?" Si tu as des doutes, c'est le moment d'ajuster : réduire tes charges, vendre davantage, recruter ou investir différemment.`,
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
        ],
        bonneReponse: 2,
        explicationBonne: `Les charges fixes (12 000 €) te sortent vraiment de l'argent. L'amortissement (3 000 €) ne te coûte rien en trésorerie ce mois-ci — c'est juste une comptabilisation de l'usure. Donc tu perds 12 000 € secs, pas 15 000 €. Ta trésorerie passe de 50 000 à 38 000 €.`,
        explicationFausses: [
          `Oublie les 12 000 € qui sortent réellement.`,
          `Confond trésorerie et résultat (mixing les deux).`,
        ],
      },
      {
        question: `Ton résultat trimestriel (avant impôts) est de 8 000 €. Tes charges fixes sont 10 000 € et tu as amortis pour 2 000 €. Ton bénéfice réel est plutôt :`,
        choix: [
          `8 000 € (c'est le résultat)`,
          `-4 000 € (8 000 - 10 000 - 2 000)`,
          `-2 000 € (8 000 - 10 000 en réalité)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Les 8 000 € de résultat incluent déjà les 10 000 € de charges et les 2 000 € d'amortissement dans le calcul. Donc ton vrai bénéfice est -2 000 € (une petite perte). En trésorerie, tu as perdu 10 000 € (charges), pas 12 000 (les 2 000 € d'amortissement ne sortent pas de la caisse).`,
        explicationFausses: [
          `Confond résultat comptable et réalité économique.`,
          `Additionne mal — tu déjà compté les charges dans les 8 000 €.`,
        ],
      },
      {
        question: `Pourquoi est-ce qu'on "amortit" les équipements plutôt que de tout comptabiliser en dépense l'année d'achat ?`,
        choix: [
          `Pour payer moins d'impôts`,
          `Parce que le camion te sert pendant 5 ans, pas juste cette année`,
          `Parce que c'est obligatoire par la loi`,
        ],
        bonneReponse: 1,
        explicationBonne: `Si tu achètes un camion 50 000 € et tu l'utilises 5 ans, ce serait bête de dire qu'il t'a coûté 50 000 € cette année. En amortissant (disons 10 000 € par an), tu répartis le coût sur sa durée de vie réelle — c'est plus juste pour voir quel bénéfice tu fais vraiment chaque année.`,
        explicationFausses: [
          `C'est un effet, pas la raison principale.`,
          `C'est pas juste obligatoire, c'est surtout logique économiquement.`,
        ],
      },
      {
        question: `Tes charges fixes ce trimestre : loyer 5 000 €, salaire du gérant 8 000 €, assurances 1 500 €. Tes amortissements : 2 500 €. Quel montant exact va réduire ta banque ?`,
        choix: [
          `17 000 €`,
          `14 500 €`,
          `12 000 €`,
        ],
        bonneReponse: 1,
        explicationBonne: `Loyer + salaire + assurances = 5 000 + 8 000 + 1 500 = 14 500 € qui sortent réellement de ta banque. L'amortissement (2 500 €) ne coûte rien en argent frais — c'est juste de la comptabilité pour l'usure.`,
        explicationFausses: [
          `Additionne les amortissements aussi (erreur classique).`,
          `Oublie les assurances.`,
        ],
      },
      {
        question: `Tu as acheté un équipement pour 20 000 € amortissable sur 4 ans. Chaque trimestre, tu dois amortir :`,
        choix: [
          `20 000 € (tout en une fois)`,
          `5 000 € (annuel, donc 20 000 / 4)`,
          `1 250 € (par trimestre : 20 000 / 4 ans / 4 trimestres)`,
        ],
        bonneReponse: 2,
        explicationBonne: `4 ans = 16 trimestres. L'amortissement annuel est 20 000 € / 4 = 5 000 €. Par trimestre : 5 000 € / 4 = 1 250 €. C'est logique : tu répartis le coût uniformément sur chaque période.`,
        explicationFausses: [
          `Tu prendrais une énorme perte le premier trimestre — pas réaliste.`,
          `C'est l'amortissement annuel, pas trimestriel.`,
        ],
      },
      {
        question: `Ton entreprise a une charge fixe de 6 000 € par trimestre et un amortissement de 2 000 €. Si ta trésorerie de départ est 10 000 €, quelle sera-t-elle à la fin du trimestre (aucune vente) ?`,
        choix: [
          `4 000 € (10 000 - 6 000 de charges réelles)`,
          `2 000 € (10 000 - 6 000 - 2 000)`,
          `10 000 € (l'amortissement ne change rien à la trésorerie)`,
        ],
        bonneReponse: 0,
        explicationBonne: `Seules les charges fixes (6 000 €) sortent réellement de ta banque. L'amortissement (2 000 €) est une charge comptable — aucun centime ne quitte ton compte. Trésorerie finale : 10 000 - 6 000 = 4 000 €.`,
        explicationFausses: [
          `Tu déduis aussi l'amortissement de la trésorerie — erreur ! L'amortissement n'est pas un décaissement.`,
          `L'amortissement touche bien le résultat, mais pas la trésorerie.`,
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
        ],
        bonneReponse: 2,
        explicationBonne: `Seuls les intérêts (500 €) sont une charge pour le résultat — tu dois les comptabiliser. Le remboursement du capital (3 000 €) est juste de la trésorerie (tu rembourses une dette). Mais en banque, tu sors 3 500 € au total.`,
        explicationFausses: [
          `Confond le capital (qui n'impacte pas le résultat) avec les intérêts.`,
          `Mélange mal — le capital ne touche pas le résultat.`,
        ],
      },
      {
        question: `Ton taux d'emprunt est 4 % par an. Tu dois rembourser ce trimestre 2 000 € de capital. Combien d'intérêts paies-tu (sur le capital restant) ?`,
        choix: [
          `80 € (4 % de 2 000)`,
          `On ne peut pas le savoir sans connaître le capital restant au début du trimestre`,
          `200 € (1 % par trimestre de 20 000)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Les intérêts se calculent sur le capital restant dû, pas sur le capital remboursé. Si tu dois 50 000 €, les intérêts trimestriels sont 50 000 × 4 % / 4 = 500 €. Pas assez d'infos dans la question.`,
        explicationFausses: [
          `Applique le taux au remboursement du jour (faux).`,
          `Invente un capital qui n'existe pas.`,
        ],
      },
      {
        question: `Après 2 ans (8 trimestres) de remboursement régulier d'un emprunt, tes intérêts vont :`,
        choix: [
          `Augmenter (tu as remboursé du capital)`,
          `Diminuer (il reste moins de capital à intéresser)`,
          `Rester identiques (le taux est fixe)`,
        ],
        bonneReponse: 1,
        explicationBonne: `À chaque remboursement, le capital diminue. Puisque les intérêts se calculent sur ce qui reste, ils baissent naturellement. C'est logique : plus tu dois peu, moins tu paies de frais.`,
        explicationFausses: [
          `Inverse la logique — c'est l'opposé qui se passe.`,
          `Le montant total des intérêts est constant si tu paies la même somme, mais la part intérêts vs capital change.`,
        ],
      },
      {
        question: `Ton emprunt original était 100 000 €. Tu as remboursé 40 000 € jusqu'ici. Taux : 3 % annuel. Tes intérêts trimestriels sont maintenant :`,
        choix: [
          `750 € (3 % de 100 000 / 4)`,
          `450 € (3 % de 60 000 / 4)`,
          `300 € (3 % de 40 000 / 4)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Capital restant = 100 000 - 40 000 = 60 000 €. Intérêts annuels = 60 000 × 3 % = 1 800 €. Par trimestre = 1 800 / 4 = 450 €. Simple et mécanique.`,
        explicationFausses: [
          `Calcule sur le capital initial (ne tient pas compte des remboursements).`,
          `Calcule sur le capital remboursé (illogique).`,
        ],
      },
      {
        question: `Tu dois rembourser chaque trimestre 5 000 € (capital + intérêts mélangés). Tes intérêts ce trimestre sont 800 €. Combien de capital rembourses-tu réellement ?`,
        choix: [
          `5 000 €`,
          `4 200 € (5 000 - 800)`,
          `4 200 €`,
        ],
        bonneReponse: 1,
        explicationBonne: `Le paiement de 5 000 € se décompose en 800 € d'intérêts (charge) et 4 200 € de remboursement du capital (réduction de dette). C'est crucial pour ton bilan.`,
        explicationFausses: [
          `Confond le paiement total avec le remboursement de capital.`,
          `(identique à la bonne réponse)`,
        ],
      },
      {
        question: `Chaque trimestre tu rembourses 1 000 € de capital + 200 € d'intérêts. Quel est l'impact sur ton RÉSULTAT (pas sur ta banque) ?`,
        choix: [
          `Le résultat baisse de 200 € seulement (les intérêts)`,
          `Le résultat baisse de 1 200 € (capital + intérêts)`,
          `Le résultat ne change pas (c'est juste un remboursement)`,
        ],
        bonneReponse: 0,
        explicationBonne: `Seuls les INTÉRÊTS (200 €) sont une charge qui réduit le résultat. Le remboursement du capital (1 000 €) sort de ta banque et réduit ta dette, mais n'impacte PAS le résultat.`,
        explicationFausses: [
          `Tu mélanges impact banque et impact résultat : 1 200 € sortent de la banque, mais seuls 200 € réduisent le résultat.`,
          `Les intérêts sont bien une charge qui réduit le résultat.`,
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
        ],
        bonneReponse: 0,
        explicationBonne: `Acheter n'est pas une charge — c'est juste une transformation : tu échanges du cash contre du stock. La charge (coût des ventes) ne vient que quand un client achète la marchandise. Avant, c'est juste de l'argent immobilisé.`,
        explicationFausses: [
          `Confond achat et coût des ventes (erreur majeure).`,
          `L'achat ne diminue pas les charges.`,
        ],
      },
      {
        question: `Ton stock en début de trimestre : 15 000 €. Tu achètes 8 000 €. À la fin du trimestre, tu as vendu pour 20 000 € HT (c'est-à-dire 20 000 € de marchandises). Ton stock final est :`,
        choix: [
          `3 000 € (15 000 + 8 000 - 20 000)`,
          `23 000 € (15 000 + 8 000)`,
          `20 000 €`,
        ],
        bonneReponse: 0,
        explicationBonne: `Stock initial (15 000) + Achats (8 000) - Marchandises vendues (20 000) = 3 000 €. C'est la logique des entrepôts : tu remplis, tu vides. Pas compliqué.`,
        explicationFausses: [
          `Oublie de soustraire les ventes — tu compterais le stock deux fois.`,
          `Ignore le stock initial et les achats.`,
        ],
      },
      {
        question: `Tu achètes à crédit (tu dois payer dans 60 jours). Que se passe-t-il immédiatement ?`,
        choix: [
          `Ta banque baisse de 10 000 €`,
          `Ton stock augmente et ta banque diminue`,
          `Ton stock augmente, ta banque ne bouge pas (tu dois de l'argent au fournisseur)`,
        ],
        bonneReponse: 2,
        explicationBonne: `L'achat à crédit augmente ton stock mais crée une "dette fournisseur" au lieu de faire sortir du cash immédiatement. C'est pratique pour ta trésorerie à court terme, mais tu dois payer plus tard.`,
        explicationFausses: [
          `C'est vrai si tu paies cash, pas à crédit.`,
          `Mélange achat cash et achat crédit.`,
        ],
      },
      {
        question: `Tes créances clients (argent que tu dois recevoir) t'aident à :`,
        choix: [
          `Augmenter ta banque immédiatement`,
          `Réduire ton stock directement`,
          `Suivre combien de clients te doivent de l'argent (tracabilité)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Les créances clients c'est un actif : ça montre combien les clients te doivent. C'est un pense-bête pour savoir "attends, j'ai vendu 100 000 € à crédit à des gens mais je n'ai reçu que 60 000 €".`,
        explicationFausses: [
          `Les créances ne sont pas encore du cash.`,
          `Les créances n'impactent pas le stock.`,
        ],
      },
      {
        question: `Tu mets 90 jours de crédit à tes clients (au lieu de 30). C'est bon pour :`,
        choix: [
          `Ta banque (tu reçois plus vite)`,
          `Tes frais financiers (tu empruntes moins)`,
          `Ton attractivité client (plus facile de vendre, clients heureux)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Oui, les longs délais attirent les clients (c'est un avantage commercial). Mais c'est mauvais pour ta trésorerie (tu attends 3 mois pour être payé) et bon pour les clients (ils ont 3 mois pour payer).`,
        explicationFausses: [
          `Au contraire, tu reçois plus lentement.`,
          `Au contraire, tu dois peut-être emprunter pour combler le trou.`,
        ],
      },
      {
        question: `Tu achètes 50 unités à 20 €, tu en vends 30 à 35 €. Quelle est ta marge brute ce trimestre ?`,
        choix: [
          `450 € (30 × 15 € de marge unitaire)`,
          `1 050 € (30 × 35 €, le CA total)`,
          `-1 000 € (tu as dépensé 1 000 € pour le stock)`,
        ],
        bonneReponse: 0,
        explicationBonne: `Marge = CA - Coût des marchandises vendues. CA : 30 × 35 = 1 050 €. CMMV : 30 × 20 = 600 €. Marge = 450 €. Les 20 unités non vendues restent en stock et ne sont pas encore une charge.`,
        explicationFausses: [
          `C'est le CA total, pas la marge. La marge soustrait le coût des marchandises vendues.`,
          `Tu charges les 50 unités achetées alors qu'on ne charge que les 30 vendues.`,
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
        ],
        bonneReponse: 2,
        explicationBonne: `Quand un client paie une partie, sa dette diminue. Tu as toujours des créances, mais moins qu'avant : 30 000 - 12 000 = 18 000 €. Simple logique.`,
        explicationFausses: [
          `Prétend qu'aucun paiement n'a eu lieu.`,
          `Additionne au lieu de soustraire — tu ne crées pas de dettes en recevant de l'argent.`,
        ],
      },
      {
        question: `Tes clients te doivent 50 000 €. Selon tes contrats, ils te paient 25 % par mois. Ce trimestre (3 mois), combien rentrera en banque ?`,
        choix: [
          `12 500 € (25 % une seule fois)`,
          `25 000 € (50 %)`,
          `37 500 € (25 % × 3 mois de 50 000)`,
        ],
        bonneReponse: 2,
        explicationBonne: `25 % par mois pendant 3 mois = 75 % de 50 000 = 37 500 €. À la fin du trimestre, tu en auras reçu 75 %, il te restera 12 500 € en créances.`,
        explicationFausses: [
          `Une seule fois, pas 3 mois.`,
          `C'est seulement 50 % (2 mois de paiement).`,
        ],
      },
      {
        question: `Tu as vendu 40 000 € à crédit ce mois-ci. Tes clients habituels paient 50 % le mois suivant, 30 % le mois d'après, 20 % le mois d'après. À la fin du mois 3, combien as-tu reçu ?`,
        choix: [
          `40 000 € (tout)`,
          `20 000 € (50 % seulement)`,
          `32 000 € (20k + 12k)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Mois 1 (vente) : 0 € reçu. Mois 2 : 40 000 × 50 % = 20 000 €. Mois 3 : 40 000 × 30 % = 12 000 €. À la fin du mois 3, tu en as reçu 32 000 €, il te reste 8 000 € à recevoir en mois 4.`,
        explicationFausses: [
          `Impossible si les clients paient progressivement.`,
          `C'est seulement le 2e mois.`,
        ],
      },
      {
        question: `Quand un client te paie, quel impact sur ton résultat ?`,
        choix: [
          `Aucun (tu as déjà compté la vente quand tu l'as faite)`,
          `Ça augmente ton résultat (c'est du revenu)`,
          `Ça diminue ton résultat (c'est une dépense)`,
        ],
        bonneReponse: 0,
        explicationBonne: `Le résultat, c'est Revenus - Charges. Tu as déjà compté le revenu quand tu as vendu (même à crédit). Quand le client paie, tu récupères juste l'argent promis — aucun changement au résultat, juste à la banque.`,
        explicationFausses: [
          `Tu compterais la vente deux fois.`,
          `Recevoir de l'argent n'est pas une charge.`,
        ],
      },
      {
        question: `Tu aimes bien garder de gros délais de paiement (120 jours) pour tes clients. C'est bon pour :`,
        choix: [
          `Tes résultats (tu vends plus)`,
          `Ta trésorerie court terme (tu reçois plus vite)`,
          `Ton attractivité auprès des clients, mais mauvais pour ta trésorerie`,
        ],
        bonneReponse: 2,
        explicationBonne: `Les délais longs attirent les clients (ils aiment avoir le temps de payer), mais toi, tu attends 4 mois avant d'avoir l'argent. Pendant ce temps, tu dois payer tes fournisseurs, tes salaires… avec quoi ? Donc tu dois emprunter ou avoir beaucoup de réserve. C'est un piège.`,
        explicationFausses: [
          `Les résultats ne changent pas, le délai oui.`,
          `C'est l'inverse — tu reçois plus lentement.`,
        ],
      },
      {
        question: `Un client te doit 800 € depuis le trimestre dernier (créance C+1). Il paie aujourd'hui. Quel est l'impact sur ton RÉSULTAT ce trimestre ?`,
        choix: [
          `Aucun impact sur le résultat — le CA était déjà comptabilisé`,
          `+800 € sur le résultat (rentrée d'argent)`,
          `+800 € en trésorerie ET +800 € en résultat`,
        ],
        bonneReponse: 0,
        explicationBonne: `La vente a été comptabilisée lors de la livraison. Maintenant tu encaisses : trésorerie +800 € et créance -800 €. C'est un transfert bilan — zéro impact résultat.`,
        explicationFausses: [
          `La trésorerie monte, mais le résultat ne bouge pas — tu as déjà compté cette vente.`,
          `Ce serait compter la vente deux fois !`,
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
        ],
        bonneReponse: 1,
        explicationBonne: `Fixe : 1 500 × 3 mois × 2 commerçants = 9 000 €. Commission : 5 % × 80 000 € = 4 000 € total. Total : 13 000 €.`,
        explicationFausses: [
          `Oublie la commission — ça réduit ton bénéfice.`,
          `C'est seulement la commission, pas le fixe.`,
        ],
      },
      {
        question: `Tu as 3 commerciaux. Tu penses à te débarrasser d'un pour réduire tes coûts. Quel est le risque ?`,
        choix: [
          `Tes charges baissent (bon pour toi)`,
          `Tu perds le chiffre d'affaires qu'il générait (souvent plus grave)`,
          `Tes clients seront plus heureux (un seul contact)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Oui, tu paies moins en salaire si tu le vires. Mais ce gars ramène peut-être 50 000 € de chiffre par trimestre. Tu économises 4 500 € en salaire mais tu perds 50 000 € en ventes — mauvais calcul.`,
        explicationFausses: [
          `C'est vrai que tes charges baissent, mais ce n'est pas l'enjeu majeur.`,
          `Au contraire, moins de vendeurs = moins d'attention client.`,
        ],
      },
      {
        question: `Ton commercial a généré 30 000 € ce trimestre. Tu lui dois 2 000 € fixes + 10 % de commission. Combien paies-tu ?`,
        choix: [
          `2 000 €`,
          `5 000 € (30 000 / 6)`,
          `5 000 € (2 000 + 3 000)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Fixe : 2 000 €. Commission : 10 % × 30 000 € = 3 000 €. Total : 5 000 €.`,
        explicationFausses: [
          `Ignores la commission.`,
          `Fait un calcul aléatoire.`,
        ],
      },
      {
        question: `Tu augmentes la commission de tes commerçants de 5 % à 8 % pour les motiver. Ton chiffre monte de 100 000 à 130 000 €. C'est bon pour toi si :`,
        choix: [
          `Les nouvelles commissions n'excèdent pas 3 900 € supplémentaires`,
          `Les bénéfices supplémentaires (30 000 € × ta marge) > les nouvelles commissions`,
          `Ton résultat baisse mais ta réputation monte`,
        ],
        bonneReponse: 1,
        explicationBonne: `Nouvelle commission = 8 % × 130 000 = 10 400 €. Ancienne = 5 % × 100 000 = 5 000 €. Différence : +5 400 € de commissions. Les 30 000 € de ventes supplémentaires te rapportent disons 40 % de marge = 12 000 €. Donc oui, tu gagnes 12 000 - 5 400 = 6 600 € de plus.`,
        explicationFausses: [
          `Le montant de 3 900 € n'a aucun sens.`,
          `Tu ne fais pas des affaires pour la réputation.`,
        ],
      },
      {
        question: `Tes commerciaux coûtent 10 % de ton chiffre en salaires + commissions. Ton chiffre ce trimestre : 200 000 €. Combien coûtent-ils ?`,
        choix: [
          `10 000 €`,
          `20 000 € (10 % × 200 000)`,
          `20 000 €`,
        ],
        bonneReponse: 1,
        explicationBonne: `10 % × 200 000 € = 20 000 €. C'est le ratio que tu te fixes.`,
        explicationFausses: [
          `Dix fois trop peu.`,
          `(identique à la bonne réponse)`,
        ],
      },
      {
        question: `2 commerciaux : un fixe à 3 000 €/trimestre, l'autre à 10 % sur ses ventes (il a vendu 25 000 €). Quel est le coût total en charges de personnel ?`,
        choix: [
          `5 500 € (3 000 fixe + 2 500 commission)`,
          `28 000 € (3 000 + 25 000 de CA)`,
          `3 000 € (seul le fixe est une charge)`,
        ],
        bonneReponse: 0,
        explicationBonne: `Commercial 1 : 3 000 € fixe. Commercial 2 : 10 % × 25 000 = 2 500 € de commission. Total : 5 500 €. Les commissions sont des charges de personnel comme les salaires fixes.`,
        explicationFausses: [
          `Tu additionnes le CA du commercial 2 — le CA est une ressource, pas une charge !`,
          `Les commissions sont aussi des charges salariales.`,
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
        ],
        bonneReponse: 1,
        explicationBonne: `Le CA, c'est ce que tu vends (50 000 €). La marge = CA - Coûts directs = 50 000 - 30 000 = 20 000 €. Avec ces 20 000 €, tu dois couvrir tes frais fixes et faire un bénéfice.`,
        explicationFausses: [
          `Confond marge et coût.`,
          `Additionne le CA et le coût (pas de sens).`,
        ],
      },
      {
        question: `Tes clients paient cash à la livraison. Tu fais 60 000 € de ventes ce trimestre. Quel est l'impact direct sur ta banque ?`,
        choix: [
          `+60 000 € (tu reçois tout immédiatement)`,
          `+40 000 € (il faut enlever les coûts)`,
          `+60 000 € (le CA montant, pas le bénéfice)`,
        ],
        bonneReponse: 0,
        explicationBonne: `Quand tu vends cash, tu reçois le prix de vente (60 000 €), pas le bénéfice. C'est un montant brut qui entre. Après, tu vas soustraire les coûts et frais pour voir ton bénéfice.`,
        explicationFausses: [
          `Mélange CA et résultat net.`,
          `(identique à la bonne réponse en essence)`,
        ],
      },
      {
        question: `Tu vends 100 000 € de marchandises à crédit (délai 30 jours). À la fin du trimestre, tu as reçu 60 000 €. Ton CA de ce trimestre est :`,
        choix: [
          `60 000 € (ce que tu as reçu)`,
          `100 000 € (ce que tu as vendu, peu importe si tu l'as reçu ou pas)`,
          `40 000 € (ce qui reste à recevoir)`,
        ],
        bonneReponse: 1,
        explicationBonne: `En comptabilité, le CA = ce que tu vends, pas ce que tu reçois. Tu dis "ce trimestre, on a fait 100 000 € de chiffre". Le paiement de 60 000 € c'est du cash, mais le CA c'est 100 000.`,
        explicationFausses: [
          `Confond CA et trésorerie.`,
          `C'est juste ce qui reste à recevoir (créances).`,
        ],
      },
      {
        question: `Ton CA ce trimestre : 100 000 €. Ton stock au début : 25 000 €. Tu as acheté : 60 000 €. Ton stock à la fin : 20 000 €. Quel est ton coût des ventes ?`,
        choix: [
          `60 000 € (ce que tu as acheté)`,
          `65 000 € (25 000 + 60 000 - 20 000)`,
          `65 000 €`,
        ],
        bonneReponse: 1,
        explicationBonne: `Coût des ventes = Stock initial + Achats - Stock final = 25 000 + 60 000 - 20 000 = 65 000 €. C'est classique.`,
        explicationFausses: [
          `C'est seulement les achats ce trimestre.`,
          `(identique à la bonne réponse)`,
        ],
      },
      {
        question: `Tu dois augmenter ton CA de 50 % (de 100 000 € à 150 000 €). Tes frais fixes restent 40 000 €. Ton coût de ventes passe de 60 000 € à 90 000 €. Ton bénéfice avant impôts passe de :`,
        choix: [
          `40 000 € à 60 000 €`,
          `0 € à 20 000 € (résultat = CA - Coûts variables - Fixes)`,
          `60 000 € à 80 000 €`,
        ],
        bonneReponse: 1,
        explicationBonne: `Avant : 100 000 - 60 000 - 40 000 = 0 € (break-even). Après : 150 000 - 90 000 - 40 000 = 20 000 €. C'est magique : +50 % de CA et tu passes de zéro à +20 000 € de profit. C'est l'effet de levier !`,
        explicationFausses: [
          `Oublie les coûts variables.`,
          `Inventé.`,
        ],
      },
      {
        question: `Tu vends 20 articles à 50 €, dont 12 cash et 8 à crédit (paiement dans 1 trimestre). Quel est l'impact IMMÉDIAT sur ta trésorerie ?`,
        choix: [
          `+600 € (12 × 50 €)`,
          `+1 000 € (20 × 50 €)`,
          `+400 € (8 × 50 €)`,
        ],
        bonneReponse: 0,
        explicationBonne: `Seuls les 12 clients cash paient maintenant : 12 × 50 = 600 € en trésorerie. Les 8 clients à crédit créent une créance (actif), mais l'argent n'est pas encore là. Pourtant, le CA total (1 000 €) est bien enregistré en résultat dès maintenant.`,
        explicationFausses: [
          `Les ventes à crédit entrent dans le CA mais pas encore dans la trésorerie.`,
          `Ce sont les seules ventes à crédit — tu ne les encaisses qu'au trimestre suivant.`,
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
        ],
        bonneReponse: 1,
        explicationBonne: `Marge brute : 50 000 × 40 % = 20 000 €. Coûts directs : 6 000 € (3 × 2 000) fixe + 1 500 € (3 % × 50 000) commission = 7 500 €. Contribution : 20 000 - 7 500 = 12 500 €. Rentable !`,
        explicationFausses: [
          `Sans calcul, c'est trop vite dit.`,
          `3 %, c'est normal pour une commission.`,
        ],
      },
      {
        question: `Tu as actuellement 2 commerciaux qui te rapportent 150 000 € de CA par trimestre. Tu en ajoutes un 3e qui fera 40 000 €. Tes charges fixes montent de 4 500 € par trimestre. Le CA total passe à 190 000 €. C'est un bon choix ?`,
        choix: [
          `Non, tu augmentes tes charges`,
          `Oui si la marge sur les +40 000 € couvre les +4 500 € de charges et encore plus`,
          `Impossible à dire sans la marge`,
        ],
        bonneReponse: 1,
        explicationBonne: `Les 40 000 € de CA doivent te rapporter en marge brute > 4 500 €. Si ta marge brute est 35 % sur ces 40 000 €, tu fais 14 000 € de marge. Donc oui, c'est rentable (14 000 - 4 500 = 9 500 € gagnés).`,
        explicationFausses: [
          `Plus de charges ne veut pas dire perte.`,
          `"+CA" ne suffît pas, faut regarder la marge et les coûts.`,
        ],
      },
      {
        question: `Tu recrutes un commercial 2 000 € par mois. Le premier trimestre, il ne produit que 5 000 € de CA (ramp-up). Tu fais une perte de :`,
        choix: [
          `6 000 € (son salaire pur)`,
          `Ça dépend de sa commission et de ta marge — mais au moins 6 000 € + frais`,
          `2 000 € (juste ce qu'il coûte)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Minimum, tu perds son salaire (6 000 € pour 3 mois). En plus, il faut lui payer une commission sur les 5 000 € vendus. C'est normal en ramp-up.`,
        explicationFausses: [
          `Il y a aussi la commission.`,
          `6 000 € minimum, plus la commission.`,
        ],
      },
      {
        question: `Tes deux commerciaux actuels ont généré 120 000 € de CA annuel à eux deux. Tu en ajoutes un 3e avec le même potentiel (40 000 € de CA annuel). Sa charge fixe : 2 000 € par mois. C'est viable si :`,
        choix: [
          `Tu as 24 000 € de trésorerie libre pour supporter son paiement`,
          `Tu as 24 000 € et que ça génère au moins 24 000 € de CA additionnel en marge brute`,
          `Tu es prêt à perdre un peu les premiers mois (risque accepté)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Les 40 000 € de CA doivent générer au minimum 24 000 € de marge brute pour couvrir son salaire (24 000 €/an). Si ta marge est 50 %+ tu gagnes. Mais il faut cette trésorerie cushion.`,
        explicationFausses: [
          `24 000 € c'est nécessaire mais pas suffisant.`,
          `Oui il faut un risque, mais il faut du calcul derrière.`,
        ],
      },
      {
        question: `Tu dois choisir entre recruter 1 commercial (coûte 24k/an, génère 100k CA) vs investir 24k dans un logiciel de vente (génère 50k CA supplémentaires). Lequel choisir ?`,
        choix: [
          `Le commercial (plus de CA)`,
          `Le logiciel (moins de risque)`,
          `Ça dépend de ta marge et de ta trésorerie — les deux peuvent être rentables`,
        ],
        bonneReponse: 2,
        explicationBonne: `Commercial : 100k CA × 50% marge = 50k contribution - 24k salaire = 26k gain. Logiciel : 50k CA × 50% marge = 25k gain (si on suppose une durée). C'est comparable. Le choix dépend du risque et de ton appétit.`,
        explicationFausses: [
          `Le commercial génère plus de CA mais coûte plus.`,
          `Le logiciel est moins de risque, mais pas rentable.`,
        ],
      },
      {
        question: `Tu envisages de recruter un commercial à 4 000 €/trimestre. Il devrait générer 15 000 € de CA avec 40 % de marge. Est-ce rentable ?`,
        choix: [
          `Oui : marge générée (6 000 €) > coût (4 000 €) — bénéfice net +2 000 €`,
          `Non : son salaire dépasse le CA qu'il génère`,
          `C'est neutre : le CA divisé par son salaire ne montre pas de profit clair`,
        ],
        bonneReponse: 0,
        explicationBonne: `Marge générée : 40 % × 15 000 = 6 000 €. Coût : 4 000 €. Gain net = +2 000 €. La règle : comparer la MARGE générée (pas le CA) avec le coût du commercial.`,
        explicationFausses: [
          `Tu compares son salaire au CA brut — il faut comparer au profit généré (marge nette).`,
          `Ce n'est pas le CA divisé par le salaire qui compte, c'est la marge nette après son coût.`,
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
        ],
        bonneReponse: 1,
        explicationBonne: `CA additionnel 20 000 €. Tu dois enlever le coût (disons 5 000 € si tu coûtes 25 %). Donc 20 000 - 5 000 = 15 000 € de contribution. C'est du pur bénéfice puisque tes charges fixes ne montent pas.`,
        explicationFausses: [
          `Ignores le coût des ventes.`,
          `Au contraire, c'est du bonus pur.`,
        ],
      },
      {
        question: `Un événement négatif : un fournisseur augmente ses prix de 20 %. Tes achats trimestriels : 60 000 €. Le surcoût : 12 000 €. Ton résultat baisse de :`,
        choix: [
          `12 000 €`,
          `Plus que 12 000 € si tu ne peux pas augmenter tes prix client`,
          `Moins de 12 000 € (tu as des réserves)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Oui le coût monte de 12 000 €. Mais si tu ne peux pas répercuter sur tes prix, ta marge brute s'érode. L'impact réel > 12 000 €.`,
        explicationFausses: [
          `Vrai en première approximation, mais incomplet.`,
          `Les réserves aident à la trésorerie, pas au résultat.`,
        ],
      },
      {
        question: `Un concurrent te prend 30 % de tes clients ce trimestre. Ton CA passe de 100 000 € à 70 000 €. Tes charges fixes restent 40 000 €. Ton résultat après :`,
        choix: [
          `0 € (tu perds tout)`,
          `-5 000 € (70 000 - 30 000 coûts ventes - 40 000 fixes)`,
          `Ça dépend du coût unitaire, mais tu perds beaucoup`,
        ],
        bonneReponse: 1,
        explicationBonne: `Nouveau CA 70 000 €. Coût des ventes = 70 000 × (30 000/100 000) = 21 000 €. Résultat = 70 000 - 21 000 - 40 000 = 9 000 €. (C'est positif, mais tu as perdu 21 000 € de résultat.)`,
        explicationFausses: [
          `Trop pessimiste.`,
          `(identique à la bonne réponse)`,
        ],
      },
      {
        question: `Tu reçois un événement "Subvention COVID de 5 000 €". Ton résultat va :`,
        choix: [
          `Augmenter de 5 000 € (c'est du revenu pur)`,
          `Augmenter de 3 500 € (après impôts)`,
          `Augmenter de 5 000 € net (les subventions ne sont pas imposées généralement)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Une subvention est du revenu exceptionnel qui augmente ton résultat (généralement non imposée ou partiellement imposée). +5 000 € net.`,
        explicationFausses: [
          `Grosso modo vrai mais formulation simpliste.`,
          `On va pas appliquer d'impôts immédiatement.`,
        ],
      },
      {
        question: `Tu as une série d'événements : +10 000 € (gros client), -3 000 € (rupture stock), +2 000 € (subvention). L'impact net sur ton résultat ce trimestre est :`,
        choix: [
          `+9 000 € (10 - 3 + 2)`,
          `+9 000 € en CA, mais moins en résultat`,
          `Environ +5 000 € (6k bénéfice + 3k perte + 2k sub)`,
        ],
        bonneReponse: 2,
        explicationBonne: `+10 000 € CA × 60 % marge = +6 000 € de bénéfice. -3 000 € coût supplémentaire = -3 000 €. +2 000 € subvention = +2 000 €. Net : +6 000 - 3 000 + 2 000 = +5 000 €.`,
        explicationFausses: [
          `9 000 € suppose qu'on additionne sans considérer les coûts.`,
          `Partiellement juste.`,
        ],
      },
      {
        question: `Tu achètes une machine à 12 000 € amortissable sur 3 ans (12 trimestres). Juste après l'achat, qu'observe-t-on au bilan ?`,
        choix: [
          `Immobilisations +12 000 € et Trésorerie -12 000 €`,
          `Résultat -12 000 € et Trésorerie -12 000 €`,
          `Immobilisations +12 000 € seulement (pas de sortie d'argent immédiate)`,
        ],
        bonneReponse: 0,
        explicationBonne: `À l'achat : immobilisation (actif) +12 000 € et trésorerie -12 000 €. Le total actif reste inchangé (un actif devient un autre). La charge de 1 000 €/trimestre (amortissement) n'apparaîtra que progressivement dans le résultat.`,
        explicationFausses: [
          `La machine est une immobilisation amortie progressivement — pas une charge immédiate en résultat.`,
          `La trésorerie diminue bien — tu as payé cash !`,
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
        ],
        bonneReponse: 1,
        explicationBonne: `Résultat = CA - Toutes les charges (y compris amortissement). 120 000 - 80 000 = 40 000 €. L'amortissement compte, même s'il ne sort pas de trésorerie.`,
        explicationFausses: [
          `(identique à la bonne réponse)`,
          `Tu dois enlever l'amortissement.`,
        ],
      },
      {
        question: `Ton résultat ce trimestre : +15 000 € (bénéfice). Ton bilan initial : Actif 500 000 €, Passif (dettes) 300 000 €, Capitaux propres 200 000 €. À la clôture, tes capitaux propres deviennent :`,
        choix: [
          `200 000 € (inchangé)`,
          `215 000 € (200 000 + 15 000 de bénéfice)`,
          `300 000 € (tu augmentes tes réserves)`,
        ],
        bonneReponse: 1,
        explicationBonne: `Chaque trimestre de bénéfice augmente tes capitaux propres (réserves). 200 000 + 15 000 = 215 000 €. C'est un investissement dans ta propre boîte.`,
        explicationFausses: [
          `Non, le bénéfice gonfle les capitaux propres.`,
          `On ne crée pas un deuxième palier.`,
        ],
      },
      {
        question: `À la clôture, tu dois faire attention à tes ratios. L'endettement maximal acceptable pour un jeune entrepreneur est environ :`,
        choix: [
          `50 % de l'actif (dette = 50 % de ce que tu possèdes)`,
          `70 % de l'actif (tu peux être plus endetté quand tu croîs)`,
          `Ça dépend du secteur et de la stabilité du cash-flow`,
        ],
        bonneReponse: 2,
        explicationBonne: `Un ratio d'endettement "sain" dépend : secteur stable = 60-70 %, secteur volatile = 40-50 %. Plus ton cash-flow est stable, plus tu peux te permettre de dettes. Pour une startup, 50-60 % c'est standard.`,
        explicationFausses: [
          `Peut être trop conservateur.`,
          `70 % c'est OK mais dépend.`,
        ],
      },
      {
        question: `À la clôture, tu constates que ta trésorerie (banque) est passée de 80 000 € à 60 000 € ce trimestre. Tu as un résultat positif (+10 000 €) mais tu as moins d'argent. Pourquoi ?`,
        choix: [
          `Le résultat ne compte pas, seul le cash compte`,
          `Tu as probablement remboursé de la dette ou investi plus que ton bénéfice`,
          `Il y a une erreur comptable`,
        ],
        bonneReponse: 1,
        explicationBonne: `Résultat != Trésorerie. Tu peux faire +10 000 € de résultat mais avoir investi 35 000 € ou remboursé 25 000 € de dettes. C'est très normal et fréquent.`,
        explicationFausses: [
          `Faux, le résultat compte (c'est ta rentabilité long terme).`,
          `Non c'est une vraie situation.`,
        ],
      },
      {
        question: `Tu as 12 trimestres devant toi (3 exercices). Le trimestre 4, tu as perdu 5 000 €. C'est grave ?`,
        choix: [
          `Oui, tu dois arrêter tout`,
          `Non, ça arrive à tout le monde`,
          `Ça dépend si tu as une réserve et si c'est une tendance ou une anomalie`,
        ],
        bonneReponse: 2,
        explicationBonne: `Une perte trimestrielle ce n'est pas dramatique si : 1) tu as une réserve (tu ne crèves pas), 2) c'est une anomalie, pas une tendance. Mais si ça continue 3 trimestres d'affilée sans réserve, tu dois t'inquiéter.`,
        explicationFausses: [
          `Alarmiste.`,
          `Trop léger.`,
        ],
      },
      {
        question: `Un événement exceptionnel te rapporte une subvention de 5 000 €. Comment cela apparaît-il dans tes comptes ?`,
        choix: [
          `Trésorerie +5 000 € et Résultat +5 000 € (produit exceptionnel)`,
          `Trésorerie +5 000 € seulement — aucun impact sur le résultat`,
          `Capitaux propres +5 000 € directement`,
        ],
        bonneReponse: 0,
        explicationBonne: `Une subvention est un produit exceptionnel : trésorerie +5 000 € ET résultat net +5 000 €. Les capitaux propres s'améliorent indirectement via le bénéfice en fin de période.`,
        explicationFausses: [
          `Tout encaissement qui n'est pas un remboursement de dette impacte le résultat.`,
          `Les capitaux propres se mettent à jour en fin de période via le résultat, pas directement.`,
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
        ],
        bonneReponse: 2,
        explicationBonne: `ROI = (Revenus - Investissement) / Investissement = (100 000 - 50 000) / 50 000 = 100 % sur 10 ans = 10 % par an. Si tu empruntes à 4 %, c'est bon. Si tu empruntes à 12 %, c'est mauvais.`,
        explicationFausses: [
          `C'est vrai brut, mais il faut regarder le ROI et le coût du capital.`,
          `C'est positif mais pas rentable si c'est long terme.`,
        ],
      },
      {
        question: `Ton projet business A te rapporterait 30 000 € en bénéfice annuel et te coûte 100 000 € à mettre en place. Projet B : 50 000 € en bénéfice, coûte 150 000 €. Lequel choisir ?`,
        choix: [
          `A, ça rapporte moins cher à mettre en place`,
          `B, ça rapporte plus en absolu`,
          `Regarde le ROI : A = 30 %, B = 33 %, B est un peu mieux mais dépend de ta trésorerie`,
        ],
        bonneReponse: 2,
        explicationBonne: `A : ROI = 30 000 / 100 000 = 30 % annuel. B : ROI = 50 000 / 150 000 = 33 % annuel. B est légèrement meilleur, mais si tu n'as que 100 000 €, tu dois choisir A.`,
        explicationFausses: [
          `Juste le coût ne suffit pas.`,
          `Juste le montant absolu ne suffit pas.`,
        ],
      },
      {
        question: `Tu as 100 000 € en banque. Un investissement A rapporte 10 %, un investissement B rapporte 15 %. Tu empruntes à 6 %. Lequel choisir ?`,
        choix: [
          `A, c'est plus sûr`,
          `B, ça rapporte plus`,
          `B, car 15 % > 6 % (coût d'emprunt), donc c'est positif net`,
        ],
        bonneReponse: 2,
        explicationBonne: `B rapporte 15 % alors que tu dois rembourser 6 %. Le gain net est 15 - 6 = 9 %. C'est du "arbitrage positif".`,
        explicationFausses: [
          `A est plus sûr mais moins rentable.`,
          `B rapporte plus mais faut vérifier vs le coût d'emprunt.`,
        ],
      },
      {
        question: `Ton ROI (retour sur investissement) doit être au minimum :`,
        choix: [
          `0 % (au minimum tu récupères ton argent)`,
          `5 % (tu gagnes un peu)`,
          `Supérieur à ton coût d'emprunt (ex: si tu empruntes à 4 %, faut ROI > 4 %)`,
        ],
        bonneReponse: 2,
        explicationBonne: `Si tu empruntes à 4 % pour un investissement qui te rapporte 3 %, tu perds de l'argent. Donc ROI > coût d'emprunt, minimum.`,
        explicationFausses: [
          `0 % c'est break-even, pas rentable.`,
          `5 % c'est peut-être juste assez.`,
        ],
      },
      {
        question: `Tu as 100 000 € en banque. Un super investissement te coûterait 80 000 € et tu serais forcé d'emprunter 0 € (tu paies cash). Ça te laisserait 20 000 € en trésorerie. C'est bon ?`,
        choix: [
          `Oui, maximum de cash pour l'investissement`,
          `Peut-être pas — 20 000 € c'est peut-être pas assez de réserve d'urgence`,
          `Oui si l'investissement est solide, non si le business reste fragile`,
        ],
        bonneReponse: 2,
        explicationBonne: `Ça dépend. Si tu as des charges fixes stables, 20 000 € peut suffire (ça couvre 1-2 mois). Si tu es fragile, c'est trop peu. Tu dois avoir une réserve = 2-3 mois de charges fixes minimum.`,
        explicationFausses: [
          `Pas assez de réserve.`,
          `Partiel — dépend du contexte.`,
        ],
      },
      {
        question: `À la clôture : CA 20 000 €, charges totales 16 000 € dont 3 000 € d'amortissements. Quelle est ta variation réelle de trésorerie ce trimestre ?`,
        choix: [
          `+7 000 € (20 000 - 13 000 de charges décaissées)`,
          `+4 000 € (résultat net = variation trésorerie)`,
          `-16 000 € (toutes les charges sortent en trésorerie)`,
        ],
        bonneReponse: 0,
        explicationBonne: `Charges décaissées = 16 000 - 3 000 amortissements = 13 000 €. Variation trésorerie : +20 000 - 13 000 = +7 000 €. Le résultat comptable (+4 000 €) diffère car les amortissements réduisent le résultat mais ne sortent PAS de la banque.`,
        explicationFausses: [
          `Le résultat comptable ≠ variation trésorerie, justement à cause des amortissements non décaissés.`,
          `L'amortissement ne sort pas de la banque — c'est une charge calculée.`,
        ],
      },
    ],
  },
};
