"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { KeyRound, Gamepad2, GraduationCap, CheckCircle, Zap, BarChart3, Scale, RefreshCw, TrendingUp } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();

    if (trimmed.match(/^KIC-[A-Z0-9]{4}$/)) {
      router.push(`/jeu?code=${trimmed}`);
      return;
    }

    if (trimmed.match(/^[A-Z0-9]{8}$/)) {
      const res = await fetch("/api/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (data.valid) {
        router.push("/jeu?access=bypass");
        return;
      }
      setCodeError("Code invalide ou expiré.");
      return;
    }

    setCodeError("Format invalide. Exemple : KIC-4A2B");
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* ══════════════════════════════════════════════════ */}
      {/* HERO — image + texte côte à côte                  */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center min-h-[520px]">

          {/* Texte gauche */}
          <div className="flex-1 px-6 sm:px-10 md:px-14 py-14 z-10">
            <div className="inline-flex items-center gap-2 mb-6 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 px-4 py-2 rounded-full shadow-sm">
              <Zap size={15} className="text-green-600" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Jeu sérieux innovant</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-tight tracking-tight mb-4">
              Je Deviens<br />
              <span className="bg-gradient-to-r from-green-500 via-teal-500 to-teal-600 bg-clip-text text-transparent">
                Patron
              </span>
            </h1>

            <p className="text-lg text-gray-700 font-semibold mb-2">
              Apprends la comptabilité générale en jouant
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Jeu sérieux · Terminale STMG / BTS / CCI · par Pierre Médan
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="/jeu"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <Gamepad2 size={20} />
                Jouer maintenant →
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gray-900 hover:bg-gray-800 text-white font-black rounded-xl shadow-md transition-all active:scale-95"
              >
                <GraduationCap size={20} />
                Espace Enseignant
              </Link>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> Partie complète : charges, stocks, créances, ventes</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> Bilan et compte de résultat en temps réel</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> QCM pédagogique après chaque étape</div>
            </div>
          </div>

          {/* Image droite */}
          <div className="flex-1 relative w-full md:min-h-[520px] min-h-[280px]">
            <Image
              src="/hero.png"
              alt="Je Deviens Patron — Jeu sérieux comptabilité"
              fill
              priority
              quality={90}
              className="object-contain object-center md:object-right"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* 3 BLOCS D'ACCÈS                                   */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-10">Comment commencer ?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            {/* Bloc 1 : Code */}
            <div className="rounded-2xl border-2 border-green-200 bg-white p-7 shadow-sm hover:shadow-md hover:border-green-400 transition-all flex flex-col gap-4">
              <div className="inline-flex p-3 rounded-xl bg-green-100 text-green-700 w-fit">
                <KeyRound size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">J&apos;ai un code</h3>
                <p className="text-xs text-gray-500 mt-1">Mon formateur m&apos;a donné un code de session</p>
              </div>
              <form onSubmit={handleCode} className="space-y-3 flex-1 flex flex-col justify-end">
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(null); }}
                  placeholder="KIC-4A2B ou code accès"
                  maxLength={8}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-center font-mono font-bold text-lg uppercase tracking-widest"
                />
                {codeError && <p className="text-red-500 text-xs text-center">{codeError}</p>}
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl transition-all active:scale-95"
                >
                  Rejoindre →
                </button>
              </form>
            </div>

            {/* Bloc 2 : Solo */}
            <div className="rounded-2xl border-2 border-teal-200 bg-white p-7 shadow-sm hover:shadow-md hover:border-teal-400 transition-all flex flex-col gap-4">
              <div className="inline-flex p-3 rounded-xl bg-teal-100 text-teal-700 w-fit">
                <Gamepad2 size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Je joue seul</h3>
                <p className="text-xs text-gray-500 mt-1">Découvrir le jeu sans inscription</p>
              </div>
              <div className="flex-1 flex flex-col justify-between gap-3">
                <ul className="text-xs text-gray-500 space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-teal-500 shrink-0" /> Partie complète en autonomie</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-teal-500 shrink-0" /> Bilan, compte de résultat, indicateurs</li>
                  <li className="flex items-center gap-2"><span className="text-gray-300 font-bold">✗</span> Résultats non sauvegardés</li>
                </ul>
                <Link href="/jeu" className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-3 rounded-xl text-center transition-all active:scale-95">
                  Jouer maintenant →
                </Link>
                <Link href="/historique" className="block w-full text-center text-xs text-teal-700 hover:text-teal-900 py-1 transition-colors">
                  <BarChart3 size={13} className="inline mr-1" />Voir mon historique
                </Link>
              </div>
            </div>

            {/* Bloc 3 : Enseignant */}
            <div className="rounded-2xl border-2 border-orange-300 bg-gradient-to-br from-orange-500 to-orange-600 p-7 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 text-white">
              <div className="inline-flex p-3 rounded-xl bg-white/20 text-white w-fit">
                <GraduationCap size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black">Enseignant / Formateur</h3>
                <p className="text-xs text-orange-100 mt-1">Créer des sessions et suivre les résultats</p>
              </div>
              <div className="flex-1 flex flex-col justify-between gap-3">
                <ul className="text-xs text-orange-100 space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-200 shrink-0" /> Générer un code de session</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-200 shrink-0" /> Scores en temps réel</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-200 shrink-0" /> Gestion groupes et classes</li>
                </ul>
                <div className="space-y-2">
                  <Link href="/auth/login" className="block w-full bg-white text-orange-600 font-black py-3 rounded-xl text-center hover:bg-orange-50 transition-all text-sm">
                    Se connecter
                  </Link>
                  <Link href="/auth/register" className="block w-full bg-orange-400 hover:bg-orange-300 text-white font-bold py-2.5 rounded-xl text-center transition-all text-sm">
                    Créer un compte gratuit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* VIDÉO DÉMO                                        */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="bg-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-6">🎬 Comment ça marche ?</h2>
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl h-52 flex items-center justify-center border-2 border-dashed border-green-200">
            <div className="text-center text-gray-400">
              <div className="text-5xl mb-3">▶</div>
              <p className="text-sm font-semibold">Vidéo de démonstration</p>
              <p className="text-xs mt-1">Disponible prochainement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* 3 PRINCIPES COMPTABLES                            */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Les 3 grands principes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 hover:border-blue-300 transition-all">
              <Scale size={28} className="text-blue-500 mb-3" />
              <strong className="text-blue-900 block mb-1">ACTIF = PASSIF</strong>
              <p className="text-gray-500 text-xs leading-snug">Le bilan est toujours équilibré. Ce que tu possèdes est financé par des ressources.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100 hover:border-purple-300 transition-all">
              <RefreshCw size={28} className="text-purple-500 mb-3" />
              <strong className="text-purple-900 block mb-1">Partie double</strong>
              <p className="text-gray-500 text-xs leading-snug">Chaque opération a deux effets : un <span className="text-blue-600">emploi</span> (débit) et une <span className="text-orange-600">ressource</span> (crédit).</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100 hover:border-green-300 transition-all">
              <TrendingUp size={28} className="text-green-500 mb-3" />
              <strong className="text-green-900 block mb-1">Résultat = Produits − Charges</strong>
              <p className="text-gray-500 text-xs leading-snug">Si tes ventes &gt; tes charges → <span className="text-green-600">bénéfice</span>. Sinon → <span className="text-red-600">perte</span>.</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
