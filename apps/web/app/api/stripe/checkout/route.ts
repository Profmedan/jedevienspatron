import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// ─── POST /api/stripe/checkout — Crée une session Stripe Checkout ───
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifie l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Récupère le profil pour l'organisation
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: "Profil incomplet — organization_id manquant" },
        { status: 400 }
      );
    }

    // Récupère le pack demandé
    const body = await request.json();
    const { pack_id } = body as { pack_id?: string };

    if (!pack_id) {
      return NextResponse.json(
        { error: "pack_id requis" },
        { status: 400 }
      );
    }

    const { data: pack, error: packError } = await serviceClient
      .from("packs")
      .select("*")
      .eq("id", pack_id)
      .eq("actif", true)
      .single();

    if (packError || !pack) {
      return NextResponse.json(
        { error: "Pack non trouvé" },
        { status: 404 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      request.nextUrl.origin;

    // Crée la session Stripe Checkout
    const lineItems = pack.stripe_price_id
      ? [
          {
            price: pack.stripe_price_id,
            quantity: 1,
          },
        ]
      : [
          {
            price_data: {
              currency: "eur",
              unit_amount: pack.prix_cents,
              product_data: {
                name: `Pack ${pack.id} — ${pack.nb_sessions} sessions`,
              },
            },
            quantity: 1,
          },
        ];

    const session = await getStripe().checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${appUrl}/dashboard/packs?success=true`,
      cancel_url: `${appUrl}/dashboard/packs?cancelled=true`,
      metadata: {
        org_id: profile.organization_id,
        pack_id,
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error("Erreur API stripe/checkout POST:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
