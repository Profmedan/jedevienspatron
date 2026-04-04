"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Partie = {
  id: string;
  date: string;
  pseudo: string;
  entreprise: string;
  score: number;
  resultatNet: number;
  tresorerie: number;
  trimestresJoues: number;
  faillite: boolean;
};

const STORAGE_KEY = "jdp_historique_solo";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function HistoriquePage() {
  const [parties, setParties] = useState<Partie[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Partie[];
      setParties(data);
    } catch {
      setParties([]);
    }
    setLoaded(true);
  }, []);

  function effacerHistorique() {
    if (!confirm("Effacer tout l’historique ? Cette action est irréversible.")) return;
    localStorage.removeItem(STORAGE_KEY);
    setParties([]);
  }

  const meilleurScore = parties.length > 0 ? Math.max(...parties.map(p => p.score)) : null;
  const nbFaillites   = parties.filter(p => p.faillite).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-gray-900 flex flex-col items-center py-12 px-4 gap-6">

      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1">
          ← Retour à l&apos;accueil
        </Link>
        {parties.length > 0 && (
          <button onClick={effacerHistorique}
            className="text-xs text-red-400 hover:text-red-300 transition-colors">
            🗑 Effacer l&apos;historique
          </button>
        )}
      </div>

      {/* Titre */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-indigo-100">📊 Mon historique</h1>
        <p className="text-sm text-indigo-400 mt-1">Vos parties jouées en mode solo sur cet appareil</p>
      </div>

      {!loaded ? (
        <div className="text-gray-400 text-sm">Chargement…</div>
      ) : parties.length === 0 ? (
        /* État vide */
        <div className="bg-gray-900 rounded-2xl shadow-lg shadow-black/20 border border-indigo-800 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎮</div>
          <h2 className="font-bold text-gray-100 text-lg mb-2">Aucune partie enregistrée</h2>
          <p className="text-gray-400 text-sm mb-6">
            Jouez une partie en mode solo — votre résultat sera automatiquement sauvegardé ici.
          </p>
          <Link href="/jeu"
            className="block bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors">
            🎮 Jouer maintenant →
          </Link>
        </div>
      ) : (
        <>
          {/* Stats globales */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
            <div className="bg-gray-900 rounded-xl p-4 shadow-lg shadow-black/10 border border-indigo-800 text-center">
              <div className="text-2xl font-black text-indigo-300">{parties.length}</div>
              <div className="text-xs text-gray-400 mt-1">partie{parties.length > 1 ? "s" : ""} jouée{parties.length > 1 ? "s" : ""}</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 shadow-lg shadow-black/10 border border-indigo-800 text-center">
              <div className="text-2xl font-black text-indigo-300">{meilleurScore ?? "—"}</div>
              <div className="text-xs text-gray-400 mt-1">meilleur score</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 shadow-lg shadow-black/10 border border-indigo-800 text-center">
              <div className={`text-2xl font-black ${nbFaillites > 0 ? "text-red-400" : "text-emerald-400"}`}>{nbFaillites}</div>
              <div className="text-xs text-gray-400 mt-1">faillite{nbFaillites > 1 ? "s" : ""}</div>
            </div>
          </div>

          {/* Liste des parties */}
          <div className="w-full max-w-2xl space-y-3">
            {parties.map((p, i) => (
              <div key={p.id}
                className={`bg-gray-900 rounded-2xl shadow-lg shadow-black/10 border p-5 ${p.faillite ? "border-red-800" : "border-indigo-800"}`}>

                {/* En-tête ligne */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xs bg-indigo-900/50 text-indigo-300 font-semibold px-2 py-0.5 rounded-full">Dernière partie</span>}
                      {p.score === meilleurScore && <span className="text-xs bg-amber-900/50 text-amber-300 font-semibold px-2 py-0.5 rounded-full">🏆 Meilleur score</span>}
                    </div>
                    <div className="font-bold text-gray-100 mt-1">{p.pseudo} · <span className="font-normal text-gray-400">{p.entreprise}</span></div>
                    <div className="text-xs text-gray-500 mt-0.5">{formatDate(p.date)}</div>
                  </div>
                  <div className="text-right">
                    {p.faillite ? (
                      <div className="text-red-400 font-bold text-xl">💀 Faillite</div>
                    ) : (
                      <div className="text-indigo-300 font-black text-2xl">{p.score} pts</div>
                    )}
                    <div className="text-xs text-gray-500">{p.trimestresJoues} trimestre{p.trimestresJoues > 1 ? "s" : ""}</div>
                  </div>
                </div>

                {/* Indicateurs financiers */}
                <div className="grid grid-cols-2 gap-2 border-t border-gray-700 pt-3">
                  <div className="text-xs">
                    <span className="text-gray-400">Résultat net</span>
                    <span className={`ml-2 font-semibold ${p.resultatNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {p.resultatNet >= 0 ? "+" : ""}{formatEuro(p.resultatNet)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-400">Trésorerie finale</span>
                    <span className={`ml-2 font-semibold ${p.tresorerie >= 0 ? "text-blue-400" : "text-red-400"}`}>
                      {formatEuro(p.tresorerie)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA rejouer + conversion */}
          <div className="w-full max-w-2xl space-y-3">
            <Link href="/jeu"
              className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-center transition-colors">
              🎮 Nouvelle partie
            </Link>
            <div className="bg-gray-900 rounded-xl border border-indigo-800 p-4 text-center text-sm text-gray-400">
              <span className="text-indigo-300 font-semibold">💡 Votre historique est sauvegardé uniquement sur cet appareil.</span>{" "}
              Créez un compte gratuit pour retrouver vos résultats depuis n&apos;importe où.{" "}
              <Link href="/auth/register" className="text-indigo-400 font-semibold hover:underline">
                Créer un compte →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
