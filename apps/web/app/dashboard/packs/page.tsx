import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import PacksCheckoutClient, { type Pack } from "./PacksCheckoutClient";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Notice = {
  kind: "success" | "error" | "warning";
  message: string;
};

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function getNotice(
  searchParams: Record<string, string | string[] | undefined>,
): Notice | null {
  if (getSearchParam(searchParams, "success") === "true") {
    return {
      kind: "success",
      message: "Paiement confirmé. Vos sessions sont disponibles dans votre crédit.",
    };
  }

  if (getSearchParam(searchParams, "cancelled") === "true") {
    return {
      kind: "warning",
      message: "Paiement annulé. Aucun débit n’a été effectué.",
    };
  }

  if (getSearchParam(searchParams, "message") === "no-credits") {
    return {
      kind: "error",
      message: "Vous avez besoin d’un crédit disponible pour lancer une nouvelle session.",
    };
  }

  return null;
}

export default async function PacksPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/packs");
  }

  const serviceClient = createServiceClient();

  const [{ data: profile }, { data: packsData, error: packsError }] =
    await Promise.all([
      serviceClient
        .from("profiles")
        .select("organization_id, display_name")
        .eq("id", user.id)
        .single(),
      serviceClient
        .from("packs")
        .select("*")
        .eq("actif", true)
        .order("segment", { ascending: true })
        .order("nb_sessions", { ascending: true }),
    ]);

  if (packsError) {
    throw new Error("Impossible de charger les packs.");
  }

  let creditsDisponibles = 0;

  if (profile?.organization_id) {
    const { data: creditsData, error: creditsError } = await serviceClient
      .from("credits_disponibles")
      .select("sessions_disponibles")
      .eq("organization_id", profile.organization_id)
      .single();

    if (creditsError && creditsError.code !== "PGRST116") {
      throw new Error("Impossible de charger les crédits disponibles.");
    }

    creditsDisponibles = creditsData?.sessions_disponibles ?? 0;
  }

  const packs = (packsData ?? []) as Pack[];
  const individuels = packs.filter((pack) => pack.segment === "individuel");
  const organismes = packs.filter((pack) => pack.segment === "organisme");
  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Formateur";
  const notice = getNotice(resolvedSearchParams);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b_0%,#020617_42%,#020617_100%)] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour au tableau de bord
          </Link>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
            Compte actif : <span className="font-semibold">{displayName}</span>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-950/30">
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_58%)] lg:block" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Sessions & Paiement
              </div>

              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-white text-balance sm:text-5xl">
                  Achetez le bon volume de sessions pour vos prochaines classes
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Choisissez un pack adapté à votre rythme d’animation. Le
                  paiement passe par Stripe et les crédits sont ajoutés
                  automatiquement à votre organisation.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Sessions Disponibles
                  </p>
                  <p className="mt-3 text-4xl font-black text-cyan-300 tabular-nums">
                    {creditsDisponibles}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {creditsDisponibles > 0
                      ? "Vous pouvez lancer de nouvelles parties immédiatement."
                      : "Achetez un premier pack pour ouvrir une nouvelle session."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Activation
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    Crédit automatique
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Les crédits apparaissent après confirmation du paiement par
                    Stripe.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Suivi
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    Historique centralisé
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Utilisez vos crédits pour créer des codes de session et suivre
                    les résultats depuis le tableau de bord.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/40">
            <h2 className="text-lg font-bold text-white">Ce que vous achetez</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                Paiement sécurisé par Stripe, sans stockage local de carte bancaire.
              </li>
              <li className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                Packs individuels avec durée limitée, packs organismes sans expiration.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                Une session créée consomme un crédit, puis le code reste utilisable par votre groupe.
              </li>
            </ul>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
              Les packs <strong>professeurs</strong> sont affichés TTC. Les packs{" "}
              <strong>organismes</strong> sont affichés HT.
            </div>

            <Link
              href="/dashboard/sessions/new"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Créer Une Session
            </Link>
          </aside>
        </section>

        {notice ? (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm ${
              notice.kind === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-50"
                : notice.kind === "warning"
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-50"
                  : "border-rose-400/30 bg-rose-400/10 text-rose-50"
            }`}
            role={notice.kind === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{notice.message}</p>
            </div>
          </div>
        ) : null}

        <PacksCheckoutClient
          individuels={individuels}
          organismes={organismes}
        />
      </div>
    </main>
  );
}
