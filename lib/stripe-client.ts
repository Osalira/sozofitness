import Stripe from "stripe";

/**
 * Feature flag: Allow app to function without Stripe in development
 * Products/prices will be created locally but not synced to Stripe
 */
export const STRIPE_ENABLED = !!(
  process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "__PLACEHOLDER__"
);

/**
 * Stripe client instance
 * Returns null if Stripe keys are not configured
 */
export function getStripeClient(): Stripe | null {
  if (!STRIPE_ENABLED) {
    console.warn("⚠️  Stripe is not configured. Set STRIPE_SECRET_KEY in .env to enable payments.");
    return null;
  }

  try {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  } catch (error) {
    console.error("Failed to initialize Stripe client:", error);
    return null;
  }
}

/**
 * Get Stripe client or throw error
 * Use this when Stripe is required for the operation
 */
export function requireStripeClient(): Stripe {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables. See STRIPE_SETUP.md for instructions."
    );
  }
  return stripe;
}

// Singleton instance
let stripeInstance: Stripe | null = null;

export const stripe = {
  get client() {
    if (!stripeInstance && STRIPE_ENABLED) {
      stripeInstance = getStripeClient();
    }
    return stripeInstance;
  },
};
