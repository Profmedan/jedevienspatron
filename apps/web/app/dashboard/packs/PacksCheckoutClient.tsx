"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

export interface Pack {
  id: string;
  segment: "individuel" | "organisme";
  nb_sessions: number;
  prix_cents: number;
  devise: string;
  duree_jours: number | null;
  actif: boolean;
  stripe_price_id: string | null;
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

function formatCurrency(amountInCents: number) {
  return currencyFormatter.format(amountInCents / 100);
}

function formatPricePerSession(pack: Pack) {
  return currencyFormatter.format(pack.prix_cents / 100 / pack.nb_sessions);
}

function getBestValuePackId(packs: Pack[]) {
  return packs.reduce<string | null>((bestId, currentPack) => {
    if (!bestId) {
      return currentPack.id;
    }

    const currentRatio = currentPack.prix_cents / currentPack.nb_sessions;
    const bestPack = packs.find((pack) => pack.id === bestId);
    const bestRatio = bestPack ? bestPack.prix_cents / bestPack.nb_sessions : Infinity;

    return currentRatio < bestRatio ? currentPack.id : bestId;
  }, null);
}

export default function PacksCheckoutClient({
  individuels,
  organismes,
}: {
  individuels: Pack[];
  organismes: Pack[];
}) {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuyPack(packId: string) {
    try {
      setPurchasingId(packId);
      setError(null);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: packId }),
      });

      const data = (await res.json()) as { error?: string; url?: string };

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Impossible d’ouvrir Stripe Checkout.");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la préparation du paiement.",
      );
      setPurchasingId(null);
    }
  }

  const featuredIndividuel = getBestValuePackId(individuels);
  const featuredOrganisme = getBestValuePackId(organismes);

  return (
    <section className="space-y-10">
      {error ? (
        <div
          className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-sm text-rose-50"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      ) : null}

      <SegmentSection
        title="Pour Les Professeurs"
        description="Des packs souples pour lancer des sessions pendant une période donnée."
        eyebrow="Utilisation individuelle"
        accentClassName="from-cyan-500/20 via-cyan-400/10 to-transparent"
        buttonClassName="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
        packs={individuels}
        featuredPackId={featuredIndividuel}
        purchasingId={purchasingId}
        onBuyPack={handleBuyPack}
      />

      <SegmentSection
        title="Pour Les Organismes"
        description="Des volumes plus importants pour écoles, CCI et réseaux multi-formateurs."
        eyebrow="Établissements & organismes"
        accentClassName="from-amber-500/20 via-amber-400/10 to-transparent"
        buttonClassName="bg-amber-400 text-slate-950 hover:bg-amber-300"
        packs={organismes}
        featuredPackId={featuredOrganisme}
        purchasingId={purchasingId}
        onBuyPack={handleBuyPack}
      />
    </section>
  );
}

function SegmentSection({
  title,
  description,
  eyebrow,
  accentClassName,
  buttonClassName,
  packs,
  featuredPackId,
  purchasingId,
  onBuyPack,
}: {
  title: string;
  description: string;
  eyebrow: string;
  accentClassName: string;
  buttonClassName: string;
  packs: Pack[];
  featuredPackId: string | null;
  purchasingId: string | null;
  onBuyPack: (packId: string) => Promise<void>;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-black text-white">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {packs.map((pack) => {
          const isFeatured = featuredPackId === pack.id;
          const isPurchasing = purchasingId === pack.id;
          const durationLabel =
            pack.duree_jours === null
              ? "Sans expiration"
              : `${pack.duree_jours} jours d’activation`;

          return (
            <article
              key={pack.id}
              className={`relative overflow-hidden rounded-[1.75rem] border bg-slate-950/80 p-6 shadow-xl shadow-slate-950/30 transition-transform hover:-translate-y-1 ${
                isFeatured
                  ? "border-white/20"
                  : "border-white/10"
              }`}
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${accentClassName}`}
              />

              <div className="relative space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {pack.id}
                    </p>
                    <h3 className="mt-2 text-4xl font-black text-white tabular-nums">
                      {pack.nb_sessions}
                    </h3>
                    <p className="text-sm text-slate-400">
                      session{pack.nb_sessions > 1 ? "s" : ""}
                    </p>
                  </div>

                  {isFeatured ? (
                    <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Meilleur Ratio
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-3xl font-black text-white">
                    {formatCurrency(pack.prix_cents)}
                  </p>
                  <p className="text-sm text-slate-400">
                    {formatPricePerSession(pack)} par session
                  </p>
                </div>

                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                    Utilisez les crédits au fur et à mesure des nouvelles parties.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                    {durationLabel}
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => onBuyPack(pack.id)}
                  disabled={Boolean(purchasingId)}
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 ${buttonClassName}`}
                >
                  {isPurchasing ? "Redirection Vers Stripe…" : "Acheter Ce Pack"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
