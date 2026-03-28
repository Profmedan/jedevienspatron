"use client";

import { useState } from "react";
import { BookOpen, Scale, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

type Category = "bilan" | "resultat" | "concepts";

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  analogy?: string;
  category: Category;
}

interface CategoryConfig {
  label: string;
  icon: ReactNode;
  activeClass: string;
  borderClass: string;
}

const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  bilan: {
    label: "Bilan",
    icon: <Scale size={16} />,
    activeClass: "bg-emerald-900/40 border-emerald-600/60 text-emerald-300",
    borderClass: "border-emerald-700/30 hover:border-emerald-600/50",
  },
  resultat: {
    label: "Compte de résultat",
    icon: <TrendingUp size={16} />,
    activeClass: "bg-blue-900/40 border-blue-600/60 text-blue-300",
    borderClass: "border-blue-700/30 hover:border-blue-600/50",
  },
  concepts: {
    label: "Concepts fondamentaux",
    icon: <BookOpen size={16} />,
    activeClass: "bg-violet-900/40 border-violet-600/60 text-violet-300",
    borderClass: "border-violet-700/30 hover:border-violet-600/50",
  },
};

const GLOSSARY: GlossaryTerm[] = [
  // ── BILAN ────────────────────────────────────────────────────
  {
    id: "actif",
    term: "Actif",
    definition: "Tout ce que l'entreprise possède : machines, stocks, créances, argent en caisse. L'actif est toujours égal au passif.",
    analogy: "C'est comme l'inventaire de ce que vous avez dans votre maison, votre compte en banque et ce que vos amis vous doivent.",
    category: "bilan",
  },
  {
    id: "passif",
    term: "Passif",
    definition: "Toutes les ressources qui financent l'actif : capitaux propres des propriétaires et dettes envers les tiers.",
    analogy: "C'est la liste de « d'où vient l'argent » : votre mise de départ + ce que vous avez emprunté.",
    category: "bilan",
  },
  {
    id: "tresorerie",
    term: "Trésorerie",
    definition: "L'argent liquide réellement disponible dans la caisse ou sur le compte bancaire de l'entreprise.",
    analogy: "Les billets dans votre portefeuille — pas vos investissements, pas ce que vos clients vous doivent, juste l'argent disponible maintenant.",
    category: "bilan",
  },
  {
    id: "creances",
    term: "Créances clients",
    definition: "L'argent que les clients doivent encore à l'entreprise pour des ventes déjà effectuées mais pas encore encaissées.",
    analogy: "Vous avez livré une commande mais le client paie dans 30 jours. Cette somme est une créance — elle vous appartient, mais vous ne l'avez pas encore.",
    category: "bilan",
  },
  {
    id: "capitaux-propres",
    term: "Capitaux propres",
    definition: "L'argent investi par les fondateurs plus tous les bénéfices accumulés et non distribués au fil du temps.",
    analogy: "C'est votre « mise de départ » augmentée de tout ce que vous avez gagné et réinvesti dans l'entreprise.",
    category: "bilan",
  },
  // ── COMPTE DE RÉSULTAT ────────────────────────────────────────
  {
    id: "charges",
    term: "Charges",
    definition: "Toutes les dépenses de l'entreprise : achats de marchandises, salaires, loyer, électricité, amortissements…",
    analogy: "C'est tout ce qui sort de la caisse ou grève le résultat : votre liste de courses mensuelle de l'entreprise.",
    category: "resultat",
  },
  {
    id: "produits",
    term: "Produits",
    definition: "Tous les revenus de l'entreprise : ventes de marchandises ou services, produits financiers, revenus exceptionnels.",
    analogy: "Tout ce qui rentre : vos ventes, les intérêts que vous touchez, une subvention exceptionnelle.",
    category: "resultat",
  },
  {
    id: "amortissement",
    term: "Amortissement",
    definition: "Répartition du coût d'un bien durable (machine, véhicule) sur toute sa durée de vie plutôt qu'en une seule fois.",
    analogy: "Une machine achetée 10 000 € dure 5 ans : on compte 2 000 € de charge par an. C'est l'usure comptabilisée progressivement.",
    category: "resultat",
  },
  {
    id: "resultat-net",
    term: "Résultat net",
    definition: "La différence entre tous les produits et toutes les charges. Positif = bénéfice. Négatif = perte.",
    analogy: "Si vous gagnez 1 000 € et dépensez 700 €, votre résultat net est 300 €. C'est ce qu'il reste vraiment.",
    category: "resultat",
  },
  // ── CONCEPTS FONDAMENTAUX ────────────────────────────────────
  {
    id: "bilan",
    term: "Bilan",
    definition: "Photographie de la situation financière de l'entreprise à un instant précis. L'actif est toujours égal au passif.",
    analogy: "C'est le bilan de santé annuel de votre entreprise : ce que vous avez, ce que vous devez, ce qu'il vous reste.",
    category: "concepts",
  },
  {
    id: "compte-resultat",
    term: "Compte de résultat",
    definition: "Film des revenus et dépenses sur une période (trimestre, année). Il montre comment le résultat s'est formé.",
    analogy: "Là où le bilan est une photo, le compte de résultat est la vidéo : il raconte ce qui s'est passé depuis le début.",
    category: "concepts",
  },
  {
    id: "partie-double",
    term: "Partie double",
    definition: "Règle fondamentale de la comptabilité : chaque opération affecte deux comptes simultanément — un débit (emploi) et un crédit (ressource).",
    analogy: "Quand vous achetez un stock pour 100 € en trésorerie : vos stocks augmentent de 100 € ET votre caisse diminue de 100 €. Les deux côtés s'équilibrent toujours.",
    category: "concepts",
  },
];

export function GlossarySection() {
  const [activeTab, setActiveTab] = useState<Category>("bilan");

  const terms = GLOSSARY.filter((t) => t.category === activeTab);
  const cfg = CATEGORY_CONFIG[activeTab];

  return (
    <section className="relative w-full px-6 py-16 md:py-20 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">

        {/* Titre */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-5 bg-violet-950/40 border border-violet-700/50 px-4 py-2 rounded-full">
            <BookOpen size={15} className="text-violet-400" />
            <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">Vocabulaire</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Glossaire{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              comptable
            </span>
          </h2>
          <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            12 termes essentiels expliqués sans jargon, avec des analogies de la vie courante.
            Les mêmes termes que vous rencontrerez dans le jeu.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          {(Object.entries(CATEGORY_CONFIG) as [Category, CategoryConfig][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-all duration-200 ${
                activeTab === key
                  ? config.activeClass
                  : "bg-gray-800/30 border-gray-700/40 text-gray-400 hover:text-gray-200 hover:border-gray-600/60"
              }`}
            >
              {config.icon}
              {config.label}
            </button>
          ))}
        </div>

        {/* Grille de termes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {terms.map((item) => (
            <div
              key={item.id}
              className={`group rounded-2xl border ${cfg.borderClass} bg-gray-800/40 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-md`}
            >
              <h3 className="text-base font-black text-white mb-2">{item.term}</h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">{item.definition}</p>
              {item.analogy && (
                <div className="bg-gray-950/60 border-l-2 border-gray-600 rounded-r-lg px-4 py-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Analogie</p>
                  <p className="text-xs text-gray-400 italic leading-relaxed">{item.analogy}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center mt-10 text-gray-600 text-xs">
          Ces définitions correspondent exactement aux termes utilisés dans le jeu et ses QCM.
        </p>

      </div>
    </section>
  );
}
