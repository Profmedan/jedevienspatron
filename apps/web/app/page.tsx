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
    <main className="min-h-screen bg-gray-950 flex flex-col">

      {/* ══════════════════════════════════════════════════ */}
      {/* HERO — image + texte côte à côte                  */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center min-h-[520px]">

          {/* Texte gauche */}
          <div className="flex-1 px-6 sm:px-10 md:px-14 py-14 z-10">
            <div className="inline-flex items-center gap-2 mb-6 bg-emerald-950/60 border border-emerald-700/60 px-4 py-2 rounded-full shadow-sm">
              <Zap size={15} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Jeu sérieux innovant</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-4">
              Je Deviens<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Patron
              </span>
            </h1>

            <p className="text-lg text-gray-100 font-semibold mb-2">
              Apprends la comptabilité générale en jouant
            </p>
            <p className="text-sm text-gray-500 mb-8">
              par Pierre Médan
            </p>

            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400 shrink-0" /> Partie complète : charges, stocks, créances, ventes</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400 shrink-0" /> Bilan et compte de résultat en temps réel</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400 shrink-0" /> QCM pédagogique après chaque étape</div>
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
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-10">Comment commencer ?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            {/* Bloc 1 : Code */}
            <div className="rounded-2xl border border-emerald-700/40 bg-gray-800/40 backdrop-blur-sm p-7 hover:bg-gray-800/60 hover:border-emerald-600/60 transition-all flex flex-col gap-4">
              <div className="inline-flex p-3 rounded-xl bg-emerald-950/50 text-emerald-400 w-fit">
                <KeyRound size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-100">J&apos;ai un code</h3>
                <p className="text-xs text-gray-400 mt-1">Mon formateur m&apos;a donné un code de session</p>
              </div>
              <form onSubmit={handleCode} className="space-y-3 flex-1 flex flex-col justify-end">
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(null); }}
                  placeholder="KIC-4A2B ou code accès"
                  maxLength={8}
                  className="w-full px-4 py-3 border-2 border-gray-700 bg-gray-950/50 text-gray-100 placeholder-gray-500 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-center font-mono font-bold text-lg uppercase tracking-widest"
                />
                {codeError && <p className="text-red-400 text-xs text-center">{codeError}</p>}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
                >
                  Rejoindre →
                </button>
              </form>
            </div>

            {/* Bloc 2 : Solo */}
            <div className="rounded-2xl border border-teal-700/40 bg-gray-800/40 backdrop-blur-sm p-7 hover:bg-gray-800/60 hover:border-teal-600/60 transition-all flex flex-col gap-4">
              <div className="inline-flex p-3 rounded-xl bg-teal-950/50 text-teal-400 w-fit">
                <Gamepad2 size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-100">Je joue seul</h3>
                <p className="text-xs text-gray-400 mt-1">Compte requis — 1 crédit par partie</p>
              </div>
              <div className="flex-1 flex flex-col justify-between gap-3">
                <ul className="text-xs text-gray-400 space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-teal-400 shrink-0" /> Partie complète en autonomie</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-teal-400 shrink-0" /> Résultats sauvegardés dans votre compte</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-teal-400 shrink-0" /> Bilan, compte de résultat, indicateurs</li>
                </ul>
                <Link href="/auth/login?redirectTo=/jeu" className="block w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-black py-3 rounded-xl text-center transition-all active:scale-95 shadow-lg shadow-teal-900/40">
                  Jouer maintenant →
                </Link>
              </div>
            </div>

            {/* Bloc 3 : Enseignant */}
            <div className="rounded-2xl border border-orange-600/50 bg-gradient-to-br from-orange-700 to-orange-800 p-7 shadow-lg shadow-orange-900/40 hover:from-orange-600 hover:to-orange-700 transition-all flex flex-col gap-4 text-white">
              <div className="inline-flex p-3 rounded-xl bg-white/15 text-white w-fit">
                <GraduationCap size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black">Enseignant / Formateur</h3>
                <p className="text-xs text-orange-200 mt-1">Créer des sessions et suivre les résultats</p>
              </div>
              <div className="flex-1 flex flex-col justify-between gap-3">
                <ul className="text-xs text-orange-200 space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-300 shrink-0" /> Générer un code de session</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-300 shrink-0" /> Scores en temps réel</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-300 shrink-0" /> Gestion groupes et classes</li>
                </ul>
                <div className="space-y-2">
                  <Link href="/auth/login" className="block w-full bg-white text-orange-700 font-black py-3 rounded-xl text-center hover:bg-orange-50 transition-all text-sm shadow-sm">
                    Se connecter
                  </Link>
                  <Link href="/auth/register" className="block w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl text-center transition-all text-sm">
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
      <section className="bg-gray-900 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-6">🎬 Comment ça marche ?</h2>
          <div className="bg-gradient-to-br from-emerald-950/30 to-teal-950/30 rounded-2xl h-52 flex items-center justify-center border border-dashed border-emerald-700/40">
            <div className="text-center text-gray-500">
              <div className="text-5xl mb-3 opacity-60">▶</div>
              <p className="text-sm font-semibold">Vidéo de démonstration</p>
              <p className="text-xs mt-1">Disponible prochainement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* 3 PRINCIPES COMPTABLES                            */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-8">Les 3 grands principes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 border border-blue-700/30 hover:border-blue-500/60 transition-all">
              <Scale size={28} className="text-blue-400 mb-3" />
              <strong className="text-blue-300 block mb-1">ACTIF = PASSIF</strong>
              <p className="text-gray-400 text-xs leading-snug">Le bilan est toujours équilibré. Ce que tu possèdes est financé par des ressources.</p>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-700/30 hover:border-purple-500/60 transition-all">
              <RefreshCw size={28} className="text-purple-400 mb-3" />
              <strong className="text-purple-300 block mb-1">Partie double</strong>
              <p className="text-gray-400 text-xs leading-snug">Chaque opération a deux effets : un <span className="text-blue-400">emploi</span> (débit) et une <span className="text-orange-400">ressource</span> (crédit).</p>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 border border-emerald-700/30 hover:border-emerald-500/60 transition-all">
              <TrendingUp size={28} className="text-emerald-400 mb-3" />
              <strong className="text-emerald-300 block mb-1">Résultat = Produits − Charges</strong>
              <p className="text-gray-400 text-xs leading-snug">Si tes ventes &gt; tes charges → <span className="text-emerald-400">bénéfice</span>. Sinon → <span className="text-red-400">perte</span>.</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
