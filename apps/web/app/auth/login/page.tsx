"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const message = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou mot de passe incorrect. Vérifiez vos identifiants.");
    } else {
      router.push(redirectTo);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    });
    if (error) setError("Connexion Google impossible. Réessayez.");
    setLoading(false);
  }

  return (
    <div className="space-y-5">

      {/* Message confirmation email */}
      {message === "check-email" && (
        <div className="bg-blue-950/30 border border-blue-800 rounded-xl p-4 text-blue-200 text-sm">
          📬 <strong>Vérifiez votre email !</strong> Un lien de confirmation vous a été envoyé. Cliquez dessus avant de vous connecter.
        </div>
      )}

      {/* Connexion Google */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-600 rounded-xl bg-gray-900 hover:bg-gray-800 font-medium text-gray-100 transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-xs text-gray-500 font-medium">OU</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* Formulaire email/mot de passe */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
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
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-900 text-gray-100 text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? "Connexion en cours…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎯</div>
          <h1 className="text-2xl font-black text-gray-100">JE DEVIENS PATRON</h1>
          <p className="text-gray-400 text-sm mt-1">Le jeu sérieux de gestion d&apos;entreprise</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl shadow-black/20 p-8">
          <h2 className="text-xl font-bold text-gray-100 mb-1">Connexion</h2>
          <p className="text-gray-400 text-sm mb-6">Accédez à votre tableau de bord</p>

          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-800 rounded-xl" />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Lien inscription */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Pas encore de compte ?{" "}
          <Link href="/auth/register" className="text-indigo-400 font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
