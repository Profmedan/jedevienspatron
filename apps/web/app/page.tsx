"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { KeyRound, Gamepad2, GraduationCap, CheckCircle, Zap, Scale, RefreshCw, TrendingUp, Mail, Shield, FileText, Info, Target, BookOpen, Shuffle, Users, Clock, Building2 } from "lucide-react";

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
      {/* QU'EST-CE QUE CE JEU ?                             */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="relative w-full px-6 py-16 md:py-24 overflow-hidden">
        {/* Fond subtil */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">

          {/* Intro */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-5 bg-emerald-950/40 border border-emerald-700/50 px-4 py-2 rounded-full">
              <Gamepad2 size={15} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Ludopédagogie</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Apprendre la comptabilité{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                en jouant
              </span>
            </h2>
            <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Un simulateur de gestion d&apos;entreprise où chaque décision a des conséquences comptables visibles.
              Vos apprenants pilotent une PME, expérimentent, se trompent et comprennent les vrais mécanismes financiers.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* CARTE PRINCIPALE — Le cœur du jeu (2×2) */}
            <div className="md:col-span-2 md:row-span-2 group rounded-3xl border border-emerald-700/40 bg-gradient-to-br from-emerald-950/30 via-emerald-900/10 to-transparent p-8 md:p-10 backdrop-blur-sm hover:border-emerald-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-emerald-600/5 to-transparent transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="p-3 rounded-2xl bg-emerald-600/20 border border-emerald-600/40 group-hover:bg-emerald-600/30 transition-colors">
                      <Building2 size={28} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-white">Gérez votre entreprise</h3>
                      <p className="text-sm text-emerald-300 font-medium">Trimestre après trimestre</p>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    Choisissez parmi 4 entreprises (manufacture, transport, commerce, labo) et pilotez-la sur 6 à 12 trimestres.
                    À chaque tour : achats de stocks, paiement des charges, ventes clients, investissements stratégiques.
                    Chaque action modifie votre bilan et votre compte de résultat — en temps réel.
                  </p>
                </div>
                <div className="space-y-2.5 pt-4 border-t border-emerald-700/30">
                  {["8 étapes de décision par trimestre", "Bilan et trésorerie visibles en permanence", "Score final basé sur votre performance financière"].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-gray-200">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Carte 2 — Comptabilité vivante */}
            <div className="group rounded-2xl border-l-4 border-l-blue-500/70 border border-blue-700/30 bg-gradient-to-br from-blue-950/20 via-blue-900/5 to-transparent p-6 backdrop-blur-sm hover:border-blue-600/50 hover:border-l-blue-400 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/10">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-600/40 mb-4 group-hover:bg-blue-600/30 transition-colors">
                <Scale size={22} className="text-blue-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Comptabilité vivante</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                L&apos;équation ACTIF = PASSIF n&apos;est plus théorique. Vous la voyez à l&apos;écran après chaque action. La partie double devient tangible.
              </p>
            </div>

            {/* Carte 3 — QCM pédagogique */}
            <div className="group rounded-2xl border-l-4 border-l-amber-500/70 border border-amber-700/30 bg-gradient-to-br from-amber-950/20 via-amber-900/5 to-transparent p-6 backdrop-blur-sm hover:border-amber-600/50 hover:border-l-amber-400 transition-all duration-300 hover:shadow-md hover:shadow-amber-500/10">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-600/20 border border-amber-600/40 mb-4 group-hover:bg-amber-600/30 transition-colors">
                <BookOpen size={22} className="text-amber-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">QCM après chaque étape</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Pas juste jouer : comprendre. Un quiz valide votre raisonnement comptable à chaque décision. Zéro passivité.
              </p>
            </div>

            {/* Carte 4 — Événements & stratégie */}
            <div className="group rounded-2xl border-l-4 border-l-violet-500/70 border border-violet-700/30 bg-gradient-to-br from-violet-950/20 via-violet-900/5 to-transparent p-6 backdrop-blur-sm hover:border-violet-600/50 hover:border-l-violet-400 transition-all duration-300 hover:shadow-md hover:shadow-violet-500/10">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-600/40 mb-4 group-hover:bg-violet-600/30 transition-colors">
                <Shuffle size={22} className="text-violet-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Surprises et décisions</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Cartes de décision (investir, recruter, emprunter) et événements aléatoires (crise, opportunité) forcent à s&apos;adapter.
              </p>
            </div>

            {/* Carte 5 — Solo ou en classe */}
            <div className="group rounded-2xl border-l-4 border-l-teal-500/70 border border-teal-700/30 bg-gradient-to-br from-teal-950/20 via-teal-900/5 to-transparent p-6 backdrop-blur-sm hover:border-teal-600/50 hover:border-l-teal-400 transition-all duration-300 hover:shadow-md hover:shadow-teal-500/10">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-teal-600/20 border border-teal-600/40 mb-4 group-hover:bg-teal-600/30 transition-colors">
                <Users size={22} className="text-teal-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Solo ou en classe</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Jouez seul pour vous entraîner ou en groupe avec un code de session. Le formateur suit les scores en direct.
              </p>
            </div>

          </div>

          {/* Bandeau chiffres clés */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "8", label: "décisions par trimestre", icon: Target },
              { value: "4", label: "entreprises au choix", icon: Building2 },
              { value: "6–12", label: "trimestres de jeu", icon: Clock },
              { value: "1h–1h45", label: "durée de partie", icon: Zap },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 bg-gray-800/30 border border-gray-700/40 rounded-xl px-4 py-3">
                <Icon size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="text-lg font-black text-white">{value}</span>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA vers les blocs d'accès */}
          <p className="text-center mt-12 text-gray-500 text-sm font-medium">
            Prêt à piloter votre première entreprise ?{" "}
            <span className="text-emerald-400">↓</span>
          </p>

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

      {/* ══════════════════════════════════════════════════ */}
      {/* PIED DE PAGE                                      */}
      {/* ══════════════════════════════════════════════════ */}
      <footer className="bg-gray-950 border-t border-gray-800 py-10 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Liens légaux */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-6 text-xs text-gray-400">
            <Link href="/mentions-legales" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <Info size={13} />Mentions légales
            </Link>
            <Link href="/cgu" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <FileText size={13} />CGU
            </Link>
            <Link href="/confidentialite" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <Shield size={13} />Politique de confidentialité
            </Link>
            <Link href="/contact" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <Mail size={13} />Contact
            </Link>
          </div>

          {/* Séparateur */}
          <div className="border-t border-gray-800 my-5" />

          {/* Copyright + hébergeur */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} Pierre Médan — Tous droits réservés</p>
            <p>Hébergé par <span className="text-gray-500">Vercel Inc.</span> · DNS <span className="text-gray-500">OVH</span></p>
          </div>

        </div>
      </footer>

    </main>
  );
}
