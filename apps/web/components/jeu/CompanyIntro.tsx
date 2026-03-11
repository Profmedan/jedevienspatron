"use client";

import { useState } from "react";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalActif, getTotalPassif } from "@/lib/game-engine/calculators";

interface CompanyIntroProps {
  joueurs: Joueur[];
  onStart: () => void;
}

/**
 * Écran pédagogique d'introduction au bilan comptable
 * Explique ACTIF, PASSIF, et l'équilibre fondamental
 */
export function CompanyIntro({ joueurs, onStart }: CompanyIntroProps) {
  const [step, setStep] = useState(0);
  const j = joueurs[0];

  const totalActif = getTotalActif(j);
  const totalPassif = getTotalPassif(j);
  const capitaux = j.bilan.passifs.find((p) => p.categorie === "capitaux");
  const emprunts = j.bilan.passifs.find((p) => p.categorie === "emprunts");
  const tresorerie = j.bilan.actifs.find((a) => a.categorie === "tresorerie");
  const stocks = j.bilan.actifs.filter((a) => a.categorie === "stocks");
  const immos = j.bilan.actifs.filter((a) => a.categorie === "immobilisations");

  const steps = [
    <div key={0} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">📥 D&apos;où vient l&apos;argent de départ ?</h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        Toute entreprise naît grâce à des <strong>RESSOURCES</strong> : l&apos;argent
        investi par les propriétaires (capitaux propres) et/ou des emprunts bancaires.
        C&apos;est la colonne <strong>PASSIF</strong> du bilan.
      </p>
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
        <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">
          📥 RESSOURCES (Passif) — Qui finance ?
        </div>
        <div className="space-y-2">
          {capitaux && (
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-orange-100 hover:shadow-sm transition-shadow">
              <div>
                <div className="font-medium text-sm">{capitaux.nom}</div>
                <div className="text-xs text-gray-400">
                  Apport des propriétaires — ressource durable
                </div>
              </div>
              <span className="font-bold text-orange-700 text-lg">
                {capitaux.valeur}
              </span>
            </div>
          )}
          {emprunts && (
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-orange-100 hover:shadow-sm transition-shadow">
              <div>
                <div className="font-medium text-sm">{emprunts.nom}</div>
                <div className="text-xs text-gray-400">
                  Financement externe — ressource à rembourser
                </div>
              </div>
              <span className="font-bold text-orange-700 text-lg">
                {emprunts.valeur}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center bg-orange-100 rounded-lg p-2 font-bold text-orange-800">
            <span>TOTAL RESSOURCES (Passif)</span>
            <span className="text-lg">{totalPassif}</span>
          </div>
        </div>
      </div>
    </div>,

    <div key={1} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">
        📤 Comment cet argent a-t-il été utilisé ?
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        Avec ces ressources, l&apos;entreprise a acheté des <strong>EMPLOIS</strong> :
        biens durables, marchandises, liquidités. C&apos;est la colonne{" "}
        <strong>ACTIF</strong> du bilan.
      </p>
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
          📤 EMPLOIS (Actif) — À quoi sert l&apos;argent ?
        </div>
        <div className="space-y-2">
          {immos.length > 0 &&
            immos.map((a) => (
              <div
                key={a.nom}
                className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-100 hover:shadow-sm transition-shadow"
              >
                <div>
                  <div className="font-medium text-sm">{a.nom}</div>
                  <div className="text-xs text-gray-400">Investissement durable</div>
                </div>
                <span className="font-bold text-blue-700">{a.valeur}</span>
              </div>
            ))}
          {stocks.map((a) => (
            <div
              key={a.nom}
              className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-100 hover:shadow-sm transition-shadow"
            >
              <div>
                <div className="font-medium text-sm">{a.nom}</div>
                <div className="text-xs text-gray-400">Marchandises à revendre</div>
              </div>
              <span className="font-bold text-blue-700">{a.valeur}</span>
            </div>
          ))}
          {tresorerie && (
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-100 hover:shadow-sm transition-shadow">
              <div>
                <div className="font-medium text-sm">{tresorerie.nom}</div>
                <div className="text-xs text-gray-400">Liquidités disponibles</div>
              </div>
              <span className="font-bold text-blue-700">{tresorerie.valeur}</span>
            </div>
          )}
          <div className="flex justify-between items-center bg-blue-100 rounded-lg p-2 font-bold text-blue-800">
            <span>TOTAL EMPLOIS (Actif)</span>
            <span className="text-lg">{totalActif}</span>
          </div>
        </div>
      </div>
    </div>,

    <div key={2} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">
        ⚖️ L&apos;équilibre fondamental
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        En comptabilité, le bilan est <strong>toujours équilibré</strong> : ACTIF =
        PASSIF. C&apos;est une loi mathématique maintenue grâce à la{" "}
        <strong>partie double</strong>.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-blue-700">{totalActif}</div>
          <div className="text-sm font-bold text-blue-600 mt-1">TOTAL ACTIF</div>
          <div className="text-xs text-gray-400">(Emplois)</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-orange-700">{totalPassif}</div>
          <div className="text-sm font-bold text-orange-600 mt-1">TOTAL PASSIF</div>
          <div className="text-xs text-gray-400">(Ressources)</div>
        </div>
      </div>
      <div
        className={`rounded-xl p-4 text-center font-bold text-lg transition-all ${
          totalActif === totalPassif
            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-300"
            : "bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-2 border-red-300"
        }`}
      >
        {totalActif === totalPassif
          ? "✅ ACTIF = PASSIF — Le bilan est équilibré !"
          : "⚠️ Déséquilibre !"}
      </div>
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 text-xs text-indigo-800 leading-relaxed border border-indigo-100">
        <strong>Dans le jeu :</strong> à chaque étape, tu vas appliquer toi-même les
        écritures comptables. Tu verras en temps réel l&apos;effet sur le bilan. Si le
        bilan se déséquilibre, c&apos;est qu&apos;il manque une écriture — c&apos;est
        normal dans la partie double !
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-indigo-100">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-4 flex items-center gap-3">
          <span className="text-3xl">{j.entreprise.icon}</span>
          <div>
            <div className="font-bold">{j.pseudo} — {j.entreprise.nom}</div>
            <div className="text-sm text-indigo-200">{j.entreprise.specialite}</div>
          </div>
        </div>

        {/* Progression */}
        <div className="flex gap-2 justify-center p-3 border-b border-gray-100 bg-gray-50">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all ${
                i <= step ? "bg-indigo-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Contenu */}
        <div className="p-6 min-h-96">{steps[step]}</div>

        {/* Boutons navigation */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-500 text-sm hover:bg-gray-50 transition-colors font-medium"
            >
              ← Précédent
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              🚀 C&apos;est parti — Commencer !
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
