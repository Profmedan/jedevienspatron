"use client";

import { useState } from "react";
import { Joueur } from "@/lib/game-engine/types";
import { getTotalActif, getTotalPassif } from "@/lib/game-engine/calculators";

interface CompanyIntroProps {
  joueurs: Joueur[];
  onStart: () => void;
}

/** Descriptions pédagogiques par nom d'immobilisation (durée de vie en trimestres) */
const IMMO_DESCRIPTIONS: Record<string, { description: string; duree: number; icon: string }> = {
  "Usine": { description: "Outil de production industrielle", duree: 6, icon: "🏭" },
  "Camionnette": { description: "Véhicule de livraison utilitaire", duree: 2, icon: "🚐" },
  "Camion": { description: "Poids lourd de transport logistique", duree: 6, icon: "🚛" },
  "Machine": { description: "Équipement de manutention intensif", duree: 2, icon: "⚙️" },
  "Showroom": { description: "Agencement de l'espace commercial", duree: 5, icon: "🏪" },
  "Voiture": { description: "Véhicule de démonstration client", duree: 3, icon: "🚗" },
  "Brevet": { description: "Propriété intellectuelle (art. 39 CGI)", duree: 5, icon: "💡" },
  "Matériel informatique": { description: "Serveurs et postes de travail", duree: 3, icon: "💻" },
  "Autres Immobilisations": { description: "Investissements futurs via Cartes Décision", duree: 0, icon: "📦" },
};

/**
 * Écran pédagogique d'introduction au bilan comptable
 * Explique ACTIF, PASSIF, l'équilibre fondamental et les amortissements
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
  // Filtrer les immobilisations actives (valeur > 0) — "Autres" est réservé aux investissements futurs
  const immos = j.bilan.actifs.filter(
    (a) => a.categorie === "immobilisations" && a.valeur > 0
  );
  // Total immos initial (pour l'explication du financement par emprunt)
  const totalImmos = immos.reduce((s, a) => s + a.valeur, 0);

  const steps = [
    /* ── Étape 0 : D'où vient l'argent ── */
    <div key={0} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">📥 D&apos;où vient l&apos;argent de départ ?</h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        Toute entreprise naît grâce à des <strong>RESSOURCES</strong> : l&apos;argent
        investi par les propriétaires (<em>capitaux propres</em>) et/ou des emprunts
        bancaires. C&apos;est la colonne <strong>PASSIF</strong> du bilan.
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
                  Apport des associés — ressource permanente, ne se rembourse pas
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
                  Financement bancaire — remboursement de −1 par trimestre pendant {emprunts.valeur} trimestres
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
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
        <span className="font-bold">💡 Pourquoi emprunter ?</span> Les emprunts ont permis d&apos;acheter
        les équipements productifs ({totalImmos} d&apos;immobilisations). Sans ces outils,
        pas de production ni de ventes possibles !
      </div>
    </div>,

    /* ── Étape 1 : Comment cet argent est utilisé ── */
    <div key={1} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">
        📤 Comment cet argent a-t-il été utilisé ?
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        Avec ces ressources, l&apos;entreprise a acheté des <strong>EMPLOIS</strong> :
        biens durables (immobilisations), marchandises (stocks) et liquidités (trésorerie).
        C&apos;est la colonne <strong>ACTIF</strong> du bilan.
      </p>
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
          📤 EMPLOIS (Actif) — À quoi sert l&apos;argent ?
        </div>
        <div className="space-y-2">
          {/* Immobilisations avec description et durée d'amortissement */}
          {immos.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1 mb-1">
                🏗️ Immobilisations (biens durables)
              </div>
              {immos.map((a) => {
                const info = IMMO_DESCRIPTIONS[a.nom];
                return (
                  <div
                    key={a.nom}
                    className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-100 hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {info?.icon ?? "🔧"} {a.nom}
                      </div>
                      <div className="text-xs text-gray-400">
                        {info?.description ?? "Investissement durable"}
                        {info && info.duree > 0 && (
                          <span className="ml-1 text-amber-600 font-medium">
                            · durée de vie : {info.duree} trimestres
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-blue-700">{a.valeur}</span>
                  </div>
                );
              })}
            </>
          )}
          {/* Stocks */}
          {stocks.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2 mb-1">
                📦 Stocks (marchandises)
              </div>
              {stocks.map((a) => (
                <div
                  key={a.nom}
                  className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-100 hover:shadow-sm transition-shadow"
                >
                  <div>
                    <div className="font-medium text-sm">📦 {a.nom}</div>
                    <div className="text-xs text-gray-400">Marchandises prêtes à être vendues ou transformées</div>
                  </div>
                  <span className="font-bold text-blue-700">{a.valeur}</span>
                </div>
              ))}
            </>
          )}
          {/* Trésorerie */}
          {tresorerie && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2 mb-1">
                💰 Trésorerie
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-100 hover:shadow-sm transition-shadow">
                <div>
                  <div className="font-medium text-sm">💰 {tresorerie.nom}</div>
                  <div className="text-xs text-gray-400">Liquidités disponibles pour payer les charges</div>
                </div>
                <span className="font-bold text-blue-700">{tresorerie.valeur}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center bg-blue-100 rounded-lg p-2 font-bold text-blue-800 mt-2">
            <span>TOTAL EMPLOIS (Actif)</span>
            <span className="text-lg">{totalActif}</span>
          </div>
        </div>
      </div>
    </div>,

    /* ── Étape 2 : L'équilibre fondamental ── */
    <div key={2} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">
        ⚖️ L&apos;équilibre fondamental
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        En comptabilité, le bilan est <strong>toujours équilibré</strong> : ACTIF =
        PASSIF. C&apos;est une loi mathématique maintenue grâce à la{" "}
        <strong>partie double</strong> — chaque opération affecte au moins deux postes.
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
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 text-xs text-indigo-800 leading-relaxed border border-indigo-100 space-y-2">
        <p>
          <strong>🔄 Principe de la partie double :</strong> toute écriture comptable
          touche au moins deux comptes en sens opposés (débit ↔ crédit).
          Exemple : payer une charge en trésorerie → Charge augmente (Débit) et
          Trésorerie diminue (Crédit).
        </p>
        <p>
          <strong>📊 Résultat net :</strong> à la fin de chaque trimestre, le bénéfice
          (ou la perte) du Compte de Résultat vient <em>s&apos;ajouter</em> aux
          Capitaux propres au Passif — maintenant ainsi l&apos;équilibre ACTIF = PASSIF.
        </p>
      </div>
    </div>,

    /* ── Étape 3 : Les amortissements ── */
    <div key={3} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">
        📉 Que sont les amortissements ?
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        Chaque trimestre, tes immobilisations <strong>perdent de la valeur</strong> :
        une usine s&apos;use, un brevet expire, un ordinateur vieillit. On enregistre
        cette usure par une <strong>dotation aux amortissements</strong> (PCG, compte 681).
      </p>

      {/* Schéma visuel partie double */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 text-center">
          ✍️ Écriture comptable chaque trimestre
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="font-black text-red-700 text-base">DÉBIT</div>
            <div className="text-xs text-red-600 mt-1 font-medium">681 — Dotation</div>
            <div className="text-xs text-gray-500 mt-1">Charge au Compte de Résultat</div>
            <div className="text-xl font-black text-red-700 mt-2">+{immos.length}</div>
            <div className="text-xs text-gray-400">({immos.length} bien(s) × −1)</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="font-black text-blue-700 text-base">CRÉDIT</div>
            <div className="text-xs text-blue-600 mt-1 font-medium">28x — Amort. immos</div>
            <div className="text-xs text-gray-500 mt-1">Valeur nette du Bilan</div>
            <div className="text-xl font-black text-blue-700 mt-2">−{immos.length}</div>
            <div className="text-xs text-gray-400">(−1 par bien immobilisé)</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-center text-slate-500 font-medium">
          ∑ Débits = ∑ Crédits → le bilan reste équilibré ✓
        </div>
      </div>

      <div className="space-y-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">💡 Clé PCG :</span> l&apos;amortissement est une
          charge <em>calculée</em>, pas une sortie de trésorerie ! L&apos;argent
          reste en banque mais le résultat net diminue.
          <br />
          <span className="font-semibold">CAF = Résultat net + Dotations</span> —
          la Capacité d&apos;Autofinancement est donc supérieure au résultat.
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 leading-relaxed">
          <span className="font-bold">🎯 Dans le jeu :</span> chaque immobilisation
          perd −1 par trimestre. Tes équipements durent de 2 à 6 trimestres selon leur
          type. Investir dans de nouveaux équipements (via les Cartes Décision)
          augmentera ta capacité de production !
        </div>
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
          {[0, 1, 2, 3].map((i) => (
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
