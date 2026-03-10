"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  function handleCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed.match(/^KIC-[A-Z0-9]{4}$/)) {
      setCodeError("Format invalide. Le code ressemble à : KIC-4A2B");
      return;
    }
    router.push(`/jeu?code=${trimmed}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center py-12 px-6 gap-8">

      {/* HERO */}
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-indigo-900 mb-3">
          🎓 JE DEVIENS PATRON
        </h1>
        <p className="text-xl text-indigo-700 mb-1 font-medium">
          Apprends la comptabilité générale en jouant
        </p>
        <p className="text-sm text-indigo-400">Jeu sérieux conçu par Pierre Médan · Terminale STMG / BTS / CCI</p>
      </div>

      {/* TROIS BLOCS D'ACCÈS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full">

        {/* Bloc 1 : Apprenant avec code */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-indigo-200 p-6 flex flex-col gap-4">
          <div className="text-center">
            <div className="text-3xl mb-1">🔑</div>
            <h2 className="font-bold text-indigo-800 text-lg">J&apos;ai un code</h2>
            <p className="text-xs text-gray-500 mt-1">Mon formateur m&apos;a donné un code de session</p>
          </div>
          <form onSubmit={handleCode} className="space-y-3 flex-1 flex flex-col justify-end">
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(null); }}
              placeholder="KIC-4A2B"
              maxLength={8}
              className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 text-center font-mono font-bold text-lg tracking-widest uppercase"
            />
            {codeError && (
              <p className="text-red-500 text-xs text-center">{codeError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Rejoindre la session →
            </button>
          </form>
        </div>

        {/* Bloc 2 : Jouer seul */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-emerald-200 p-6 flex flex-col gap-4">
          <div className="text-center">
            <div className="text-3xl mb-1">🎮</div>
            <h2 className="font-bold text-emerald-800 text-lg">Je joue seul</h2>
            <p className="text-xs text-gray-500 mt-1">Découvrir le jeu sans inscription</p>
          </div>
          <div className="flex-1 flex flex-col justify-between gap-3">
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li className="flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">✓</span> Partie complète en autonomie</li>
              <li className="flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">✓</span> Bilan, compte de résultat, indicateurs</li>
              <li className="flex items-start gap-1.5"><span className="text-gray-300 mt-0.5">✗</span> Résultats non sauvegardés</li>
            </ul>
            <Link
              href="/jeu"
              className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-center transition-colors"
            >
              Jouer maintenant →
            </Link>
            <Link
              href="/historique"
              className="block w-full text-center text-xs text-emerald-700 hover:text-emerald-900 py-1 transition-colors"
            >
              📊 Voir mon historique
            </Link>
          </div>
        </div>

        {/* Bloc 3 : Enseignant / Formateur */}
        <div className="bg-indigo-700 rounded-2xl shadow-sm p-6 flex flex-col gap-4 text-white">
          <div className="text-center">
            <div className="text-3xl mb-1">🏫</div>
            <h2 className="font-bold text-lg">Enseignant / Formateur</h2>
            <p className="text-xs text-indigo-200 mt-1">Créer des sessions et suivre les résultats</p>
          </div>
          <div className="flex-1 flex flex-col justify-between gap-3">
            <ul className="text-xs text-indigo-200 space-y-1.5">
              <li className="flex items-start gap-1.5"><span className="text-indigo-300 mt-0.5">✓</span> Générer un code de session (KIC-XXXX)</li>
              <li className="flex items-start gap-1.5"><span className="text-indigo-300 mt-0.5">✓</span> Scores et classements en temps réel</li>
              <li className="flex items-start gap-1.5"><span className="text-indigo-300 mt-0.5">✓</span> Gestion de vos groupes et classes</li>
            </ul>
            <div className="space-y-2">
              <Link
                href="/auth/login"
                className="block w-full bg-white text-indigo-700 font-bold py-3 rounded-xl text-center hover:bg-indigo-50 transition-colors text-sm"
              >
                Se connecter
              </Link>
              <Link
                href="/auth/register"
                className="block w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl text-center transition-colors border border-indigo-400 text-sm"
              >
                Créer un compte gratuit
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* VIDÉO DE DÉMONSTRATION (placeholder) */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 max-w-4xl w-full text-center">
        <h2 className="font-bold text-indigo-800 text-lg mb-3">🎬 Comment ça marche ?</h2>
        <div className="bg-indigo-50 rounded-xl h-48 flex items-center justify-center border-2 border-dashed border-indigo-200">
          <div className="text-center text-indigo-400">
            <div className="text-4xl mb-2">▶</div>
            <p className="text-sm font-medium">Vidéo de démonstration</p>
            <p className="text-xs mt-1">Disponible prochainement</p>
          </div>
        </div>
      </div>

      {/* 3 GRANDS PRINCIPES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full text-sm">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
          <div className="text-2xl mb-2">⚖️</div>
          <strong className="text-indigo-800">ACTIF = PASSIF</strong>
          <p className="text-gray-500 mt-1 text-xs leading-snug">
            Le bilan est toujours équilibré. Ce que tu possèdes (actif)
            est financé par des ressources (passif).
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
          <div className="text-2xl mb-2">🔄</div>
          <strong className="text-indigo-800">Partie double</strong>
          <p className="text-gray-500 mt-1 text-xs leading-snug">
            Chaque opération a deux effets symétriques :
            un <span className="text-blue-600">emploi</span> (débit) et une <span className="text-orange-600">ressource</span> (crédit).
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
          <div className="text-2xl mb-2">📈</div>
          <strong className="text-indigo-800">Résultat = Produits − Charges</strong>
          <p className="text-gray-500 mt-1 text-xs leading-snug">
            Si tes ventes &gt; tes charges → <span className="text-green-600">bénéfice</span>.
            Sinon → <span className="text-red-600">perte</span>.
          </p>
        </div>
      </div>

      <p className="text-xs text-indigo-400 text-center">
        ACTIF + CHARGES = PASSIF + PRODUITS<br />
        L&apos;équation fondamentale de la comptabilité générale française
      </p>
    </main>
  );
}
