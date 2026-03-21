import Stripe from "stripe";

// Initialise le client Stripe avec la clé secrète
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});
