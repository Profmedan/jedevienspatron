import Stripe from "stripe";

// Client Stripe initialisé en lazy pour éviter l'erreur au build
// (STRIPE_SECRET_KEY n'est pas disponible pendant next build)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY manquant dans les variables d'environnement");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}
