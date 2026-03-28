"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ORG_TYPES = [
  { value: "lycee", label: "Lycée" },
  { value: "college", label: "Collège" },
  { value: "universite", label: "Université / BTS" },
  { value: "cci", label: "CCI / Chambre de Commerce" },
  { value: "france_travail", label: "France Travail" },
  { value: "ecole_privee", label: "École privée" },
  { value: "individuel", label: "Particulier / Indépendant" },
  { value: "autre", label: "Autre" },
] as const;

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<string>("lycee");

  const supabase = createClient();

  async function handleGoogleSignup() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?redirectTo=${encodeURIComponent("/dashboard")}`,
      },
    });
    if (error) setError("Inscription Google impossible. Réessayez.");
    setLoading(false);
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName, org_name: orgName, org_type: orgType },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      // Email de confirmation envoyé
      setEmailSent(true);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  }

  // Écran affiché après inscription si confirmation email requise
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl shadow-black/20 p-8 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-gray-100 mb-3">Confirmez votre email</h2>
          <p className="text-gray-300 text-sm mb-4">
            Un email de confirmation a été envoyé à <strong>{email}</strong>.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Ouvrez cet email et cliquez sur le lien pour activer votre compte, puis revenez vous connecter.
          </p>
          <Link
            href="/auth/login"
            className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Aller à la page de connexion
          </Link>
          <p className="text-xs text-gray-500 mt-4">
            Vous ne trouvez pas l&apos;email ? Vérifiez vos spams.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎯</div>
          <h1 className="text-2xl font-black text-gray-100">JE DEVIENS PATRON</h1>
          <p className="text-gray-400 text-sm mt-1">Le jeu sérieux de gestion d&apos;entreprise</p>
        </div>

        <div className="bg-gray-900 rounded-2xl shadow-2xl shadow-black/20 p-8">
          {/* Indicateur d'étape */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 1 ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-500"}`}>1</div>
            <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? "bg-indigo-600" : "bg-gray-700"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 2 ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-500"}`}>2</div>
          </div>

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-gray-100 mb-1">Créer votre compte</h2>
              <p className="text-gray-400 text-sm mb-6">Accédez au tableau de bord et aux résultats de vos parties</p>

              <button
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-600 rounded-xl bg-gray-900 hover:bg-gray-800 font-medium text-gray-100 transition-colors disabled:opacity-50 mb-5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                S&apos;inscrire avec Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500 font-medium">OU</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Prénom et nom</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Marie Dupont"
                    required
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-900 text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    required
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-900 text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-900 text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-900 text-gray-100 text-sm"
                  />
                </div>

                {error && (
                  <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Continuer →
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-gray-100 mb-1">Votre structure</h2>
              <p className="text-gray-400 text-sm mb-6">Ces informations permettent de personnaliser votre expérience</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Type de structure</label>
                  <select
                    value={orgType}
                    onChange={e => setOrgType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-900 text-gray-100"
                  >
                    {ORG_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Nom de la structure</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="Lycée Victor Hugo – Besançon"
                    required
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-900 text-gray-100 text-sm"
                  />
                </div>

                {error && (
                  <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm">{error}</div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-gray-600 text-gray-200 font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? "Création…" : "Créer mon compte"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Déjà un compte ?{" "}
          <Link href="/auth/login" className="text-indigo-400 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
