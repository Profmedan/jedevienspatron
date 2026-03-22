"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Pack {
  id: string;
  segment: "individuel" | "organisme";
  nb_sessions: number;
  prix_cents: number;
  duree_jours: number | null;
}

interface CreditsResponse {
  sessions_disponibles: number;
}

export default function PacksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Chargement…</div>}>
      <PacksContent />
    </Suspense>
  );
}

function PacksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [creditsDisponibles, setCreditsDisponibles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Affiche les messages de succès/annulation depuis Stripe
  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");

    if (success === "true") {
      setSuccessMessage("✅ Paiement confirmé ! Vos sessions ont été créditées.");
      setTimeout(() => {
        setSuccessMessage(null);
        router.replace("/dashboard/packs");
      }, 4000);
    } else if (cancelled === "true") {
      setError("Paiement annulé. Vous pouvez réessayer quand vous voulez.");
      setTimeout(() => {
        setError(null);
        router.replace("/dashboard/packs");
      }, 4000);
    }
  }, [searchParams, router]);

  // Charge les packs et les crédits disponibles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Récupère les packs
        const packsRes = await fetch("/api/packs");
        if (!packsRes.ok) throw new Error("Impossible de charger les packs");
        const packsData = await packsRes.json();
        setPacks(packsData.packs || []);

        // Récupère les crédits disponibles
        const creditsRes = await fetch("/api/credits");
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setCreditsDisponibles(creditsData.sessions_disponibles || 0);
        }
      } catch (err) {
        console.error("Erreur chargement données:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Lance le paiement Stripe pour un pack
  const handleBuyPack = async (packId: string) => {
    try {
      setPurchasing(packId);
      setError(null);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: packId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur création session Stripe");
      }

      const { url } = await res.json();
      if (!url) throw new Error("URL Stripe manquante");

      // Redirige vers Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error("Erreur achat pack:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'achat");
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Chargement des packs...</p>
        </div>
      </div>
    );
  }

  // Sépare les packs par segment
  const individuels = packs.filter((p) => p.segment === "individuel");
  const organismes = packs.filter((p) => p.segment === "organisme");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-8">
        <h1 className="text-4xl font-bold mb-2">Acheter des sessions</h1>
        <p className="text-gray-300">Sélectionnez un pack et complétez votre paiement</p>
      </div>

      {/* Crédits restants */}
      <div className="px-6 py-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-semibold text-gray-300 mb-1">SESSIONS DISPONIBLES</p>
          <p className="text-5xl font-bold text-blue-400">{creditsDisponibles}</p>
          <p className="text-gray-400 mt-2">
            {creditsDisponibles === 0
              ? "Achetez un pack pour commencer une session"
              : `Vous pouvez créer ${creditsDisponibles} session(s)`}
          </p>
        </div>
      </div>

      {/* Message de succès */}
      {successMessage && (
        <div className="px-6 py-4 bg-green-900/40 border-b border-green-700 text-green-300">
          <div className="max-w-7xl mx-auto font-semibold">
            {successMessage}
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="px-6 py-4 bg-red-900/30 border-b border-red-700 text-red-300">
          <div className="max-w-7xl mx-auto">
            {error}
          </div>
        </div>
      )}

      {/* Contenu */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Section Individuel */}
          <section className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Pour les professeurs</h2>
              <p className="text-gray-400">
                Packs avec expiration (30, 60 ou 90 jours)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {individuels.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-8 hover:border-blue-500/50 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {pack.nb_sessions}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    sessions • {pack.duree_jours} jours
                  </p>

                  <div className="mb-8">
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {(pack.prix_cents / 100).toFixed(2)} €
                    </div>
                    <p className="text-xs text-gray-500">TTC</p>
                  </div>

                  <button
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={purchasing === pack.id}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    {purchasing === pack.id ? "Redirection..." : "Acheter maintenant"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Section Organisme */}
          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Pour les organismes</h2>
              <p className="text-gray-400">
                Packs sans expiration pour établissements et CCI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {organismes.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-purple-500/50 transition-colors"
                >
                  <h3 className="text-xl font-bold text-white mb-1">
                    {pack.nb_sessions}
                  </h3>
                  <p className="text-gray-400 mb-6 text-sm">
                    sessions • Sans expiration
                  </p>

                  <div className="mb-8">
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      {(pack.prix_cents / 100).toFixed(2)} €
                    </div>
                    <p className="text-xs text-gray-500">HT</p>
                  </div>

                  <button
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={purchasing === pack.id}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    {purchasing === pack.id ? "Redirection..." : "Acheter"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Lien retour */}
          <div className="mt-16 text-center">
            <Link
              href="/dashboard"
              className="inline-block text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
