"use client";
import { EtapeTour } from "@jedevienspatron/game-engine";

interface Props {
  etape: EtapeTour;
  tourActuel: number;
  nbTours: number;
}

interface Ecriture {
  label: string;
  debit: string;
  credit: string;
  note?: string;
}

interface EtapeData {
  titre: string;
  icon: string;
  description: string;
  ecritures: Ecriture[];
  conseil: string;
}

const ETAPES: EtapeData[] = [
  /* ── 0 ─ Charges fixes & Amortissements ── */
  {
    titre: "Charges fixes & Amortissements (usure)",
    icon: "💼",
    description: "Enregistre les charges obligatoires du trimestre : loyers, énergie, remboursement de l’emprunt, et amortissements (usure progressive des équipements).",
    ecritures: [
      { label: "Charges fixes",        debit: "Services ext. +2",      credit: "Trésorerie −2" },
      { label: "Remboursement emprunt",debit: "Emprunts −1",           credit: "Trésorerie −1" },
      { label: "Dotation amort.",      debit: "Dotation aux amort. +N",credit: "Immobilisations −N",
        note: "N = nombre de biens immobilisés actifs" },
    ],
    conseil: "💡 Les charges fixes font sortir de l’argent de ta banque. L’amortissement, lui, ne coûte rien en trésorerie : c’est juste une écriture pour comptabiliser l’usure de tes équipements. Ton résultat baisse, mais ta banque ne bouge pas.",
  },

  /* ── 1 ─ Achats de marchandises ── */
  {
    titre: "Achats de marchandises",
    icon: "📦",
    description: "Reconstitue tes stocks. Choisis la quantité et le mode de règlement : comptant ou à crédit fournisseur.",
    ecritures: [
      { label: "Paiement comptant",   debit: "Stocks +N",  credit: "Trésorerie −N" },
      { label: "Paiement à crédit",   debit: "Stocks +N",  credit: "Dettes fournisseurs +N",
        note: "Dette remboursée automatiquement au tour suivant" },
    ],
    conseil: "💡 Acheter à crédit, c’est reporter le paiement : ta trésorerie reste intacte aujourd’hui, mais tu devras payer ton fournisseur au trimestre suivant. Pratique quand ta banque est basse, mais gare à l’accumulation de dettes !",
  },

  /* ── 2 ─ Avancement des créances ── */
  {
    titre: "Avancement des créances clients",
    icon: "⏩",
    description: "Les clients règlent à échéance : les créances arrivent à maturité et entrent en trésorerie.",
    ecritures: [
      { label: "Encaissement C+1→Tréso", debit: "Trésorerie +X",    credit: "Créances C+1 −X" },
      { label: "Avancement C+2→C+1",     debit: "Créances C+1 +Y",  credit: "Créances C+2 −Y",
        note: "Mouvement interne à l’Actif — le total Actif ne change pas" },
    ],
    conseil: "💡 Un particulier paie tout de suite, une TPE en 1 trimestre, un Grand Compte en 2 trimestres. Plus le client est gros, plus tu attends avant de toucher l’argent. Anticipe ce décalage !",
  },

  /* ── 3 ─ Paiement des commerciaux ── */
  {
    titre: "Paiement des commerciaux",
    icon: "👔",
    description: "Verse les salaires de tes commerciaux actifs. En échange, ils t’ont apporté des clients ce trimestre.",
    ecritures: [
      { label: "Salaires commerciaux", debit: "Charges personnel +N", credit: "Trésorerie −N",
        note: "N = total des coûts salariaux de tes commerciaux actifs" },
    ],
    conseil: "🤝 Un Junior ramène 2 particuliers par trimestre (paiement cash). Un Senior ramène 2 TPE (paiement en 1 trimestre). Une Directrice ramène 2 Grands Comptes (paiement en 2 trimestres). Pour recruter, c’est à l’étape 5.",
  },

  /* ── 4 ─ Traitement des ventes (Cartes Client) ── */
  {
    titre: "Traitement des ventes",
    icon: "🤝",
    description: "Chaque vente génère 2 écritures simultanées : le produit de la vente et le coût des marchandises vendues (CMV).",
    ecritures: [
      { label: "Vente — produit",     debit: "Trésorerie ou Créance +X", credit: "Ventes +X",
        note: "Trésorerie si paiement immédiat, Créance C+1 ou C+2 selon délai" },
      { label: "CMV — coût marchand.",debit: "Achats / CMV +1",          credit: "Stocks −1" },
    ],
    conseil: "🔑 Chaque vente touche plusieurs comptes en même temps : ton chiffre d’affaires monte (tu gagnes), ton stock baisse (la marchandise part), et l’argent arrive dans ta banque ou en créance selon le délai de paiement du client.",
  },

  /* ── 5 ─ Effets récurrents des cartes ── */
  {
    titre: "Effets récurrents des cartes",
    icon: "🔄",
    description: "Tes cartes Décision actives génèrent des charges récurrentes chaque trimestre (maintenance, intérêts, abonnements…).",
    ecritures: [
      { label: "Maintenance / abonnements", debit: "Services ext. +N",     credit: "Trésorerie −N" },
      { label: "Charges d’intérêts",        debit: "Charges intérêt +N",   credit: "Trésorerie −N",
        note: "Uniquement si tu as souscrit un Prêt Bancaire" },
    ],
    conseil: "💡 Certaines cartes génèrent des coûts chaque trimestre (maintenance, intérêts d’emprunt, abonnements). Vérifie que tes ventes couvrent ces frais récurrents, sinon ils grignoteront ta trésorerie tour après tour.",
  },

  /* ── 6 ─ Carte Décision ── */
  {
    titre: "Choix d’une carte Décision",
    icon: "🎯",
    description: "Investis dans une carte Décision pour développer ton entreprise. Chaque achat génère des écritures immédiates et des effets récurrents.",
    ecritures: [
      { label: "Investissement comptant", debit: "Immobilisations +N",  credit: "Trésorerie −N" },
      { label: "Recrutement commercial",  debit: "Charges personnel +N",credit: "Trésorerie −N" },
      { label: "Financement (emprunt)",   debit: "Trésorerie +N",       credit: "Emprunts +N",
        note: "Effet de levier : Actif ↑ et Passif ↑ simultanément" },
    ],
    conseil: "🧑‍💼 Tu démarres avec un Junior. Recruter un Senior dès le 2e tour booste tes ventes. Investir tôt, c’est répartir le coût sur plus de tours. Et l’Assurance Prévoyance te protège contre les mauvaises surprises !",
  },

  /* ── 7 ─ Événement aléatoire ── */
  {
    titre: "Événement aléatoire",
    icon: "🎲",
    description: "Un événement imprévu affecte ton entreprise. Positif ou négatif — tu ne peux pas le refuser.",
    ecritures: [
      { label: "Événement positif", debit: "Trésorerie +N",       credit: "Produits except. +N",
        note: "Ex. subvention, client VIP, placement financier" },
      { label: "Événement négatif", debit: "Charges except. +N",  credit: "Trésorerie −N",
        note: "Ex. contrôle fiscal, litige, perte de données" },
    ],
    conseil: "🎲 Tu ne peux pas prévoir ces événements, mais tu peux t’y préparer : garde une réserve de trésorerie pour encaisser les coups durs. L’Assurance Prévoyance peut annuler certains événements négatifs (ceux marqués 🛡️).",
  },

  /* ── 8 ─ Bilan de fin de trimestre ── */
  {
    titre: "Bilan de fin de trimestre",
    icon: "✅",
    description: "Clôture du trimestre : le résultat net est intégré aux capitaux propres. Le compte de résultat repart à zéro.",
    ecritures: [
      { label: "Clôture si bénéfice", debit: "Résultat net → 0",   credit: "Capitaux propres ↑",
        note: "Le bénéfice renforce la solvabilité" },
      { label: "Clôture si perte",    debit: "Capitaux propres ↓", credit: "Résultat net → 0",
        note: "La perte érode le patrimoine. Si Capitaux < 0 → faillite !" },
    ],
    conseil: "📊 Ton résultat = ce que tu as gagné (ventes) moins ce que tu as dépensé (charges). S’il est positif, tes capitaux propres augmentent et ton entreprise se renforce. Objectif : terminer avec des capitaux propres positifs !",
  },
];

export default function EtapeGuide({ etape, tourActuel, nbTours }: Props) {
  const info = ETAPES[etape];
  if (!info) return null;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 p-4">

      {/* ── Progression tour ── */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
          Tour {tourActuel} / {nbTours}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: nbTours }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-6 rounded-full transition-all ${
                i < tourActuel ? "bg-indigo-400" : "bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Progression étape ── */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < etape ? "bg-indigo-500" : i === etape ? "bg-indigo-400" : "bg-gray-700"
            }`}
          />
        ))}
      </div>

      {/* ── Contenu ── */}
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl shrink-0">{info.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
            Étape {etape + 1} / 9
          </div>
          <h4 className="font-bold text-gray-100 text-base leading-tight mb-1.5">
            {info.titre}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">{info.description}</p>
        </div>
      </div>

      {/* ── Écritures comptables : DÉBIT → CRÉDIT ── */}
      <div className="space-y-2 mb-3">
        {info.ecritures.map((e, i) => (
          <div key={i} className="rounded-lg overflow-hidden border border-gray-700">
            {/* Label de l’écriture */}
            <div className="bg-gray-800 px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              {e.label}
            </div>
            {/* Débit */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-950/20 border-b border-gray-700">
              <span className="text-[10px] font-black text-blue-400 uppercase w-12 shrink-0">
                📤 DÉBIT
              </span>
              <span className="text-xs font-semibold text-blue-300">{e.debit}</span>
            </div>
            {/* Crédit */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-orange-950/20">
              <span className="text-[10px] font-black text-orange-400 uppercase w-12 shrink-0">
                📥 CRÉDIT
              </span>
              <span className="text-xs font-semibold text-orange-300">{e.credit}</span>
            </div>
            {/* Note optionnelle */}
            {e.note && (
              <div className="px-2.5 py-1 bg-gray-800/60 text-[10px] text-gray-500 italic leading-snug">
                {e.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Conseil pédagogique ── */}
      <div className="bg-amber-950/30 border border-amber-700/60 rounded-lg px-3 py-2 text-xs text-amber-300 leading-relaxed">
        {info.conseil}
      </div>
    </div>
  );
}
