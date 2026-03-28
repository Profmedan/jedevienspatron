import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

// ─── POST /api/stripe/webhook — Reçoit les événements Stripe ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 400 }
      );
    }

    // Vérifie la signature Stripe
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Erreur vérification signature Stripe:", err);
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Traite l'événement checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Récupère les métadonnées
      const metadata = session.metadata as {
        org_id?: string;
        pack_id?: string;
      };

      if (!metadata?.org_id || !metadata?.pack_id) {
        console.error("Métadonnées manquantes dans la session Stripe:", metadata);
        return NextResponse.json(
          { error: "Métadonnées manquantes" },
          { status: 400 }
        );
      }

      // Récupère le pack
      const { data: pack, error: packError } = await serviceClient
        .from("packs")
        .select("nb_sessions, duree_jours")
        .eq("id", metadata.pack_id)
        .single();

      if (packError || !pack) {
        console.error("Pack non trouvé:", metadata.pack_id);
        return NextResponse.json(
          { error: "Pack non trouvé" },
          { status: 404 }
        );
      }

      // Calcule la date d'expiration
      let expiresAt = null;
      if (pack.duree_jours) {
        const now = new Date();
        expiresAt = new Date(now.getTime() + pack.duree_jours * 24 * 60 * 60 * 1000).toISOString();
      }

      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Insère le crédit dans session_credits
      const { error: insertError } = await serviceClient
        .from("session_credits")
        .insert({
          organization_id: metadata.org_id,
          pack_id: metadata.pack_id,
          sessions_total: pack.nb_sessions,
          sessions_used: 0,
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_checkout_session_id: session.id,
          expires_at: expiresAt,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          return NextResponse.json({ received: true }, { status: 200 });
        }

        console.error("Erreur insertion crédit:", insertError);
        return NextResponse.json(
          { error: "Erreur insertion crédit" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Erreur API stripe/webhook POST:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
