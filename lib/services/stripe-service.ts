import { getStripeClient, STRIPE_ENABLED } from "@/lib/stripe-client";
import { ProductType } from "@prisma/client";
import Stripe from "stripe";

export class StripeService {
  /**
   * Retrieve a subscription from Stripe (source of truth)
   */
  static async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = getStripeClient();

    if (!stripe) {
      throw new Error("Stripe is not configured. Cannot retrieve subscription.");
    }

    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Create a product in Stripe
   * Returns Stripe product ID or null if Stripe is not enabled
   */
  static async createProduct(params: {
    name: string;
    description?: string | null;
    type: ProductType;
  }): Promise<string | null> {
    const stripe = getStripeClient();

    if (!stripe) {
      console.log("Stripe not enabled - skipping Stripe product creation");
      return null;
    }

    try {
      const stripeProduct = await stripe.products.create({
        name: params.name,
        description: params.description || undefined,
        metadata: {
          type: params.type,
          source: "sozofitness",
        },
      });

      console.log(`✅ Created Stripe product: ${stripeProduct.id}`);
      return stripeProduct.id;
    } catch (error) {
      console.error("Failed to create Stripe product:", error);
      throw new Error(
        `Stripe product creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create a price in Stripe
   * Returns Stripe price ID or null if Stripe is not enabled
   */
  static async createPrice(params: {
    productId: string; // Local DB product ID
    stripeProductId: string; // Stripe product ID
    amountCents: number;
    currency: string;
    type: ProductType;
    interval?: string | null;
    intervalCount?: number | null;
  }): Promise<string | null> {
    const stripe = getStripeClient();

    if (!stripe) {
      console.log("Stripe not enabled - skipping Stripe price creation");
      return null;
    }

    try {
      const priceData: Stripe.PriceCreateParams = {
        product: params.stripeProductId,
        unit_amount: params.amountCents,
        currency: params.currency,
        metadata: {
          productId: params.productId,
          source: "sozofitness",
        },
      };

      // For subscriptions, add recurring data
      if (params.type === ProductType.subscription && params.interval) {
        priceData.recurring = {
          interval: params.interval as Stripe.PriceCreateParams.Recurring.Interval,
          interval_count: params.intervalCount || 1,
        };
      }

      const stripePrice = await stripe.prices.create(priceData);

      console.log(`✅ Created Stripe price: ${stripePrice.id}`);
      return stripePrice.id;
    } catch (error) {
      console.error("Failed to create Stripe price:", error);
      throw new Error(
        `Stripe price creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create a Checkout Session for a one-time payment
   */
  static async createCheckoutSession(params: {
    priceId: string; // Stripe price ID
    clientEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    const stripe = getStripeClient();

    if (!stripe) {
      throw new Error("Stripe is not configured. Cannot create checkout session.");
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        customer_email: params.clientEmail,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
      });

      return session;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      throw new Error(
        `Checkout session creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create a Checkout Session for a subscription
   */
  static async createSubscriptionCheckout(params: {
    priceId: string; // Stripe price ID
    clientEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    const stripe = getStripeClient();

    if (!stripe) {
      throw new Error("Stripe is not configured. Cannot create checkout session.");
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        customer_email: params.clientEmail,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
      });

      return session;
    } catch (error) {
      console.error("Failed to create subscription checkout:", error);
      throw new Error(
        `Subscription checkout creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    const stripe = getStripeClient();

    if (!stripe) {
      throw new Error("Stripe is not configured. Cannot verify webhook.");
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      throw new Error("Invalid webhook signature");
    }
  }
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return STRIPE_ENABLED;
}
