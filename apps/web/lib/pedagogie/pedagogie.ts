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

/** 4 questions tirées pour un trimestre donné */
export interface QCMTrimestre {
  tourActuel: number;
  questions: QuestionQCM[];
}

// ─── T25.C (2026-04-19) — Modales du nouveau cycle 8 étapes ──────────────
// Clé = etat.etapeTour du moteur de jeu (0-7), nomenclature ETAPES.*.
// Contenu rédactionnel validé par Pierre (cf. tasks/plan-t25c.md §7).
// Règle d'or : chaque paragraphe décrit CE QUI SE PASSE dans la nouvelle
// étape, pas une permutation de l'ancien contenu.
export const MODALES_ETAPES: Record<number, ModalEtape> = {
  // ── étape 0 : Encaissements des créances clients ─────────────────────────────
  0: {
    etape: 0,
    titre: `Tes clients paient — la vente devient de l'argent`,
    ceQuiSePasse: `Les créances arrivées à échéance sont encaissées. La trésorerie augmente, les créances clients diminuent du même montant. Le chiffre d'affaires ne bouge pas : il avait été enregistré au moment de la vente.`,
    pourquoi: `Tant qu'un client n'a pas payé, la vente reste un papier — pas un moyen d'action. Une entreprise rentable peut manquer de trésorerie si ses clients paient trop tard. Encaisser, c'est transformer le chiffre en marge de manœuvre.`,
    impactComptes: `Trésorerie +, créances clients -. Résultat inchangé : c'est un mouvement interne à l'actif, pas une opération de gestion. La banque récupère enfin ce que la vente avait promis.`,
    conseil: `Surveille tes délais d'encaissement. Des clients qui paient vite tiennent la trésorerie à flot ; des retards répétés la vident en silence, même avec un carnet de commandes plein.`,
  },
  // ── étape 1 : Paiement des commerciaux (+ recrutement/licenciement) ──────────
  1: {
    etape: 1,
    titre: `Tu rémunères ton équipe commerciale`,
    ceQuiSePasse: `Les commerciaux en poste sont payés ce trimestre. Si tu viens de recruter ou de licencier, l'effectif est ajusté avant paiement. Le coût est prélevé immédiatement sur la trésorerie.`,
    pourquoi: `Les commerciaux coûtent avant de rapporter. Leur salaire pèse chaque trimestre, mais ils ouvrent le carnet de commandes. Sans eux, la demande reste théorique.`,
    impactComptes: `Charges de personnel +, trésorerie -. Le résultat se dégrade d'autant. C'est une charge d'exploitation courante — pas une immobilisation, même si l'effet sur les ventes est durable.`,
    conseil: `Dimensionne ton équipe à ta marge prévue, pas à ton ambition. Un commercial en trop brûle du cash jusqu'à ce qu'il produise ; une équipe trop maigre laisse du chiffre à la concurrence.`,
  },
  // ── étape 2 : Achats de marchandises / matières ─────────────────────────────
  2: {
    etape: 2,
    titre: `Tu achètes ce que tu vas vendre`,
    ceQuiSePasse: `Tu achètes marchandises ou matières. Le stock augmente, et soit la trésorerie baisse (achat comptant), soit une dette fournisseur est créée (paiement différé). Pas de charge à ce stade : c'est une transformation d'actif.`,
    pourquoi: `Le stock, c'est de l'argent transformé en marchandises. Trop de stock immobilise la trésorerie sans la rémunérer ; trop peu te fait rater des ventes. Acheter, c'est parier sur la demande à venir.`,
    impactComptes: `Stocks +, et soit trésorerie -, soit dettes fournisseurs +. Le coût d'achat ne devient charge qu'au moment de la vente — c'est pourquoi un stock élevé ne réduit pas ton résultat courant.`,
    conseil: `Achète pour couvrir 2 à 3 trimestres de ventes prévues, pas plus. Le stock qui dort, c'est du cash qui ne travaille pas.`,
  },
  // ── étape 3 : Traitement des ventes (cartes Client) ──────────────────────────
  3: {
    etape: 3,
    titre: `Tes clients achètent — chiffre d'affaires et marge`,
    ceQuiSePasse: `Les cartes Client sont traitées. Le chiffre d'affaires augmente du prix de vente, le stock diminue du coût des marchandises vendues. La contrepartie atterrit en banque (comptant) ou en créance (crédit).`,
    pourquoi: `C'est le moment de vérité commerciale. Mais vendre beaucoup ne suffit pas : ce qui compte, c'est ce qu'il reste quand on a retiré le coût du produit. La marge, pas le volume.`,
    impactComptes: `Produits d'exploitation +, stocks -, trésorerie ou créances clients +. La marge brute se révèle à cette étape ; c'est elle qui conditionne la capacité à absorber les charges fixes de la clôture.`,
    conseil: `Regarde la marge par type de client, pas seulement le CA. Un gros client peu marginé, surtout s'il paie en retard, peut te faire plus de mal qu'un petit client bien marginé et ponctuel.`,
  },
  // ── étape 4 : Carte Décision (émotion dirigeant) ────────────────────────────
  4: {
    etape: 4,
    titre: `Tu choisis où engager l'entreprise`,
    ceQuiSePasse: `Tu peux jouer une carte Décision — investissement, recrutement, emprunt, carte logistique, protection. L'effet immédiat impacte trésorerie ou bilan ; l'effet récurrent reviendra aux clôtures suivantes.`,
    pourquoi: `Une bonne décision n'est pas gratuite : elle déplace le risque dans le temps. Tu paies aujourd'hui pour une capacité, une croissance ou une protection que tu espères demain. Ne rien faire est aussi un choix.`,
    impactComptes: `Selon la carte : immobilisation + et trésorerie - (investissement), emprunt + et trésorerie + (crédit), charges de personnel + (recrutement). Beaucoup de cartes embarquent un effet récurrent qui reviendra à chaque clôture.`,
    conseil: `C'est toi qui décides : mais le marché ne te dira pas si tu as eu raison avant plusieurs trimestres. Regarde toujours la sortie de cash d'aujourd'hui et le coût récurrent cumulé jusqu'à la fin de la partie.`,
  },
  // ── étape 5 : Carte Événement (émotion dirigeant) ────────────────────────────
  5: {
    etape: 5,
    titre: `L'environnement économique frappe à la porte`,
    ceQuiSePasse: `Une carte Événement est tirée automatiquement. Elle peut affecter la trésorerie, le stock, les clients, les dettes — ou plusieurs postes à la fois. Tu n'as pas choisi ce moment, mais tu dois en tenir compte dans les comptes.`,
    pourquoi: `L'environnement ne demande pas la permission. Panne, opportunité, contrôle, bonne nouvelle : l'imprévu fait partie du métier. Ce n'est pas l'événement qui distingue les dirigeants — c'est leur lecture et leur réaction.`,
    impactComptes: `Variable selon l'événement. Un incident augmente les charges exceptionnelles ou réduit un actif ; une opportunité gonfle le CA ou les produits. Regarde la ligne affectée au bilan pour mesurer l'ampleur réelle.`,
    conseil: `Tu n'as pas choisi ce moment : ta responsabilité, c'est la lecture, pas la panique. Garde un coussin de trésorerie pour absorber les chocs, et une discipline de lecture pour ne pas confondre événement passager et dérive structurelle.`,
  },
  // ── étape 6 : Clôture du trimestre (émotion dirigeant, étape clé T25.C) ──────
  6: {
    etape: 6,
    titre: `La période se ferme — les coûts structurels deviennent visibles`,
    ceQuiSePasse: `Tout ce qui a permis à l'entreprise de fonctionner ce trimestre arrive dans les comptes : charges fixes, dettes fournisseurs, remboursement d'emprunt, amortissements et effets récurrents des cartes actives.`,
    pourquoi: `La clôture transforme l'activité brute en résultat. C'est ici qu'on comprend pourquoi trésorerie et bénéfice ne racontent pas exactement la même histoire : un amortissement pèse sur le résultat sans sortie d'argent, une dette fournisseur payée pèse sur la banque.`,
    impactComptes: `La trésorerie baisse avec les paiements exigibles. Les amortissements augmentent les charges sans impacter les comptes de la banque. Après toutes ces écritures, le résultat net du trimestre peut enfin être porté au bilan.`,
    conseil: `Respire : c'est ici que tu vois si ta stratégie tient. Regarde d'abord ta trésorerie après clôture, puis ton résultat net. Si l'un va bien et pas l'autre, ton problème vient souvent du délai client, du stock ou d'une structure trop lourde.`,
  },
  // ── étape 7 : Bilan de fin de trimestre ─────────────────────────────────────
  7: {
    etape: 7,
    titre: `Tu arrêtes les comptes — la photo patrimoniale est prise`,
    ceQuiSePasse: `Le résultat net du trimestre (calculé en clôture) est affecté aux capitaux propres. L'actif et le passif sont recalés. Les indicateurs de solidité — fonds propres, dette, trésorerie, ratio — sont mis à jour pour la lecture externe.`,
    pourquoi: `Le bilan ne raconte pas ton trimestre : il raconte ton entreprise à l'instant T. Ce qu'elle possède, ce qu'elle doit, ce qu'elle a accumulé. C'est la photo que la banque, l'associé ou le repreneur regardent en premier.`,
    impactComptes: `Capitaux propres +/- selon le résultat, actif et passif équilibrés par construction. Aucun flux de trésorerie à cette étape : c'est une écriture de constatation, pas de décaissement.`,
    conseil: `Regarde la tendance, pas seulement la photo. Un bilan isolé ne dit rien ; trois bilans consécutifs montrent si la structure se consolide ou se fragilise. C'est la direction qui compte.`,
  },
};


// ─── T25.C (2026-04-19) — QCM_ETAPES neutralisés ─────────────────────────
// Le cycle passe de 9 à 8 étapes avec un ordre dramaturgique inverse.
// Les ~50 questions rédigées pour l'ancien ordre ne testent plus la
// compréhension au bon moment — les garder sur le nouveau cycle serait
// PIRE que de ne pas avoir de QCM pendant la fenêtre de refonte.
// Décision Pierre (2026-04-19) : neutralisation avec warning console
// jusqu'au Commit 4 (refonte complète après partie manuelle Phase 4).
export const QCM_ETAPES: Record<number, QCMEtape> = {
  0: { etape: 0, questions: [] },
  1: { etape: 1, questions: [] },
  2: { etape: 2, questions: [] },
  3: { etape: 3, questions: [] },
  4: { etape: 4, questions: [] },
  5: { etape: 5, questions: [] },
  6: { etape: 6, questions: [] },
  7: { etape: 7, questions: [] },
};

// ─── POOL GLOBAL QCM (toutes étapes confondues) ───────────────────────────────
/**
 * Agrège toutes les questions QCM de tous les étapes en un seul pool global.
 * Utilisé pour les QCM de fin de trimestre (4 questions tirées au sort).
 *
 * T25.C : le pool est vide tant que QCM_ETAPES est neutralisé (cf. bloc ci-dessus).
 */
export const QCM_POOL_GLOBAL: QuestionQCM[] = Object.values(QCM_ETAPES).flatMap(
  (qcmEtape) => qcmEtape.questions
);

// T25.C : flag module-level pour n'émettre le warning de neutralisation qu'une
// seule fois par session (évite la pollution console à chaque changement de trimestre).
let _warnedQCMNeutralized = false;

/**
 * Tire 4 questions au hasard depuis le pool global.
 * La sélection est effectuée de manière pseudo-aléatoire à chaque appel.
 * Utiliser cette fonction dans le composant React pour obtenir les 4 questions du trimestre.
 *
 * T25.C : tant que QCM_ETAPES est neutralisé, retourne un tableau vide et émet
 * un warning interne explicite. La refonte complète des questions est programmée
 * au Commit 4 (cf. tasks/plan-t25c.md §8).
 */
export function tirerQuestionsTrimestriel(): QuestionQCM[] {
  if (QCM_POOL_GLOBAL.length === 0 && !_warnedQCMNeutralized) {
    _warnedQCMNeutralized = true;
    // eslint-disable-next-line no-console
    console.warn(
      "[T25.C] QCM_ETAPES neutralisés : les questions seront refontes dans le Commit 4 " +
        "(refonte pédagogique du nouveau cycle 8 étapes). Aucune question tirée ce trimestre."
    );
  }
  const pool = [...QCM_POOL_GLOBAL];
  const selection: QuestionQCM[] = [];
  while (selection.length < 4 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selection.push(pool.splice(idx, 1)[0]);
  }
  return selection;
}
