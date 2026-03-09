"use client";
import { EtapeTour } from "@/lib/game-engine/types";

interface Props {
  etape: EtapeTour;
  tourActuel: number;
  nbTours: number;
}

const ETAPES: Array<{ titre: string; icon: string; description: string; conseil: string }> = [
  {
    titre: "Charges fixes & Amortissements",
    icon: "💼",
    description: "Le moteur tourne automatiquement : paiement des charges fixes (+2 services extérieurs, −2 trésorerie), remboursement d'emprunt (−1), amortissement des immobilisations (−1 immo, +1 dotations).",
    conseil: "💡 La partie double : chaque débit a un crédit égal. Ici la trésorerie baisse et les charges augmentent.",
  },
  {
    titre: "Achats de marchandises",
    icon: "📦",
    description: "Optionnel : achetez des marchandises pour reconstituer vos stocks. Paiement comptant (−Tréso, +Stocks) ou à crédit (−Tréso OU +Dettes fournisseurs).",
    conseil: "💡 Acheter à crédit préserve la trésorerie mais crée une dette fournisseur à rembourser le tour suivant.",
  },
  {
    titre: "Avancement des créances",
    icon: "⏩",
    description: "Les créances mûrissent : C+2 → C+1 → Trésorerie. Le moteur l'applique automatiquement.",
    conseil: "💡 Une vente à C+2 n'est encaissée que 2 tours plus tard. Anticipez votre trésorerie !",
  },
  {
    titre: "Paiement des commerciaux",
    icon: "👔",
    description: "Payez vos équipes commerciales actives. Coût en charges de personnel et en trésorerie.",
    conseil: "💡 Les commerciaux coûtent mais rapportent des clients. Calculez le retour sur investissement.",
  },
  {
    titre: "Cartes Client",
    icon: "🤝",
    description: "Traitez les clients apportés par vos commerciaux. Chaque vente génère 4 écritures comptables : Ventes+, Stocks−, CMV+, et Tréso/Créances selon le délai.",
    conseil: "💡 4 écritures pour une vente : produit → capitaux propres. C'est le principe de la partie double !",
  },
  {
    titre: "Effets récurrents",
    icon: "🔄",
    description: "Application automatique des effets récurrents de vos cartes Décision actives (licences, abonnements, revenus passifs…).",
    conseil: "💡 Les revenus récurrents stabilisent votre trésorerie. Cherchez les cartes à effets durables.",
  },
  {
    titre: "Carte Décision",
    icon: "🎯",
    description: "Choisissez une carte Décision parmi les disponibles : investissement, recrutement, financement, tactique ou protection. Chaque carte a des effets immédiats ET récurrents.",
    conseil: "💡 Les cartes de protection (assurance) peuvent annuler certains événements. Pensez au risque !",
  },
  {
    titre: "Carte Événement",
    icon: "🎲",
    description: "Pioche d'un événement aléatoire. Il peut être positif ou négatif. L'assurance prévoyance peut annuler certains événements négatifs.",
    conseil: "💡 La gestion du risque fait partie de la comptabilité. Constituez des réserves en prévision.",
  },
  {
    titre: "Vérification & Clôture",
    icon: "✅",
    description: "Vérification de l'équilibre comptable (Actif = Passif). Contrôle des conditions de faillite. Calcul du score. Si c'est le dernier tour, clôture annuelle.",
    conseil: "💡 En comptabilité, le bilan DOIT toujours être équilibré. Un écart indique une erreur d'écriture.",
  },
];

export default function EtapeGuide({ etape, tourActuel, nbTours }: Props) {
  const info = ETAPES[etape];

  return (
    <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 animate-slide-in">
      {/* Tour progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
          Tour {tourActuel} / {nbTours}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: nbTours }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-6 rounded-full ${i < tourActuel ? "bg-indigo-400" : "bg-indigo-100"}`}
            />
          ))}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${i < etape ? "bg-indigo-400" : i === etape ? "bg-indigo-600" : "bg-indigo-100"}`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex items-start gap-3">
        <div className="text-3xl">{info.icon}</div>
        <div className="flex-1">
          <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
            Étape {etape + 1}/9
          </div>
          <h4 className="font-bold text-indigo-900 text-base leading-tight mb-2">{info.titre}</h4>
          <p className="text-sm text-indigo-700 leading-relaxed mb-3">{info.description}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 leading-relaxed">
            {info.conseil}
          </div>
        </div>
      </div>
    </div>
  );
}
