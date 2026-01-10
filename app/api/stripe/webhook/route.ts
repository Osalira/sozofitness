import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StripeService } from "@/lib/services/stripe-service";
import { RevenueService } from "@/lib/services/revenue-service";
import { logger } from "@/lib/logger";
import Stripe from "stripe";
import { ProductType, SubscriptionStatus, EntitlementSourceType } from "@prisma/client";

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 *
 * IMPORTANT: This endpoint must be idempotent!
 * Stripe may send the same event multiple times.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    // In Next.js route handlers, prefer req.headers over next/headers().
    // (next/headers() can be async and may require awaiting depending on the runtime.)
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logger.error("No stripe-signature header");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = StripeService.verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err) {
      logger.error("Webhook signature verification failed", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    logger.info("Received Stripe webhook", {
      eventType: event.type,
      eventId: event.id,
    });

    // Check if we've already processed this event (idempotency)
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { id: event.id },
    });

    if (existingEvent) {
      logger.info("Event already processed, skipping", { eventId: event.id });
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    // Store the event immediately for idempotency
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        data: event.data as any,
        processedAt: new Date(),
      },
    });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        logger.info("Unhandled event type", { eventType: event.type });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error("Webhook processing error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Create Order/Subscription and grant Entitlement
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logger.info("Processing checkout.session.completed", {
    sessionId: session.id,
  });

  const metadata = session.metadata;
  if (!metadata) {
    logger.error("No metadata in checkout session", undefined, { sessionId: session.id });
    return;
  }

  const { userId, productId, priceId, coachId, productType } = metadata;

  if (!userId || !productId || !priceId || !coachId || !productType) {
    logger.error("Missing required metadata", undefined, {
      sessionId: session.id,
      hasUserId: !!userId,
      hasProductId: !!productId,
      hasPriceId: !!priceId,
      hasCoachId: !!coachId,
      hasProductType: !!productType,
    });
    return;
  }

  // Fetch product and price details
  const price = await prisma.price.findUnique({
    where: { id: priceId },
    include: { product: true },
  });

  if (!price) {
    logger.error("Price not found", undefined, { priceId });
    return;
  }

  if (productType === ProductType.one_on_one) {
    // One-time payment: Create Order and Entitlement
    await handleOneTimePayment(session, {
      userId,
      productId,
      priceId,
      coachId,
      price,
    });
  } else if (productType === ProductType.subscription) {
    // Subscription: Create Subscription and Entitlement
    await handleSubscriptionPayment(session, {
      userId,
      productId,
      priceId,
      coachId,
      price,
    });
  }
}

/**
 * Handle one-time payment (1:1 sessions)
 */
async function handleOneTimePayment(
  session: Stripe.Checkout.Session,
  data: { userId: string; productId: string; priceId: string; coachId: string; price: any }
) {
  const { userId, productId, priceId, coachId, price } = data;

  // Create Order
  const order = await prisma.order.create({
    data: {
      coachId,
      clientId: userId,
      productId,
      priceId,
      amountCents: price.amountCents,
      currency: price.currency,
      stripePaymentIntentId: session.payment_intent as string,
      stripeCheckoutSessionId: session.id,
      status: "completed",
    },
  });

  logger.info("Created Order", { orderId: order.id, userId, productId });

  // Grant Entitlement (indefinite for one-time purchases)
  const entitlement = await prisma.entitlement.create({
    data: {
      coachId,
      clientId: userId,
      productId,
      sourceType: EntitlementSourceType.order,
      sourceId: order.id,
      validUntil: null, // Indefinite access
      isActive: true,
    },
  });

  logger.info("Granted Entitlement", {
    entitlementId: entitlement.id,
    userId,
    productId,
  });

  // Create CoachClient relationship
  await prisma.coachClient.upsert({
    where: {
      coachId_clientId: {
        coachId,
        clientId: userId,
      },
    },
    create: {
      coachId,
      clientId: userId,
    },
    update: {},
  });

  logger.info("Updated coach-client relationship", { coachId, userId });

  // Update daily revenue aggregation
  try {
    await RevenueService.updateDailyRevenue(coachId, new Date(), order.amountCents);
  } catch (error) {
    logger.error("Failed to update daily revenue", error, { coachId, orderId: order.id });
    // Don't fail the order if revenue update fails
  }

  // Note: For 1:1 sessions, appointment is NOT created automatically
  // Client must visit /client/appointments and schedule their session
  // This allows them to choose a convenient time slot
}

/**
 * Handle subscription payment
 */
async function handleSubscriptionPayment(
  session: Stripe.Checkout.Session,
  data: { userId: string; productId: string; priceId: string; coachId: string; price: any }
) {
  const { userId, productId, priceId, coachId, price } = data;

  if (!session.subscription) {
    logger.error("No subscription ID in session", undefined, { sessionId: session.id });
    return;
  }

  // Stripe is the source of truth: retrieve the subscription to get accurate period dates.
  const stripeSub = await StripeService.retrieveSubscription(session.subscription as string);
  // Stripe types in this SDK version don't include current_period_* fields, but the API does.
  // Use a narrow runtime extraction to keep compile-time happy.
  const stripeSubAny = stripeSub as any;
  const currentPeriodStart = stripeSubAny.current_period_start
    ? new Date(stripeSubAny.current_period_start * 1000)
    : new Date();
  const currentPeriodEnd = stripeSubAny.current_period_end
    ? new Date(stripeSubAny.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.upsert({
    where: { stripeSubscriptionId: session.subscription as string },
    create: {
      coachId,
      clientId: userId,
      productId,
      priceId,
      stripeSubscriptionId: session.subscription as string,
      status: SubscriptionStatus.active,
      currentPeriodStart,
      currentPeriodEnd,
    },
    update: {
      status: SubscriptionStatus.active,
      currentPeriodStart,
      currentPeriodEnd,
    },
  });

  logger.info("Created/Updated Subscription", {
    subscriptionId: subscription.id,
    userId,
    productId,
  });

  // Grant Entitlement (valid until period end)
  // Avoid relying on a compound-unique Prisma client type that may be stale in-editor.
  const existingEntitlement = await prisma.entitlement.findFirst({
    where: {
      clientId: userId,
      productId,
      sourceType: EntitlementSourceType.subscription,
      sourceId: subscription.id,
    },
  });

  if (existingEntitlement) {
    await prisma.entitlement.update({
      where: { id: existingEntitlement.id },
      data: { validUntil: subscription.currentPeriodEnd, isActive: true },
    });
  } else {
    await prisma.entitlement.create({
      data: {
        coachId,
        clientId: userId,
        productId,
        sourceType: EntitlementSourceType.subscription,
        sourceId: subscription.id,
        validUntil: subscription.currentPeriodEnd,
        isActive: true,
      },
    });
  }

  logger.info("Granted Subscription Entitlement", { userId, productId });

  // Create coach-client relationship
  await prisma.coachClient.upsert({
    where: {
      coachId_clientId: {
        coachId,
        clientId: userId,
      },
    },
    create: {
      coachId,
      clientId: userId,
    },
    update: {},
  });
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info("Processing subscription update", { subscriptionId: subscription.id });

  const subAny = subscription as any;
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: subAny.current_period_start
        ? new Date(subAny.current_period_start * 1000)
        : undefined,
      currentPeriodEnd: subAny.current_period_end
        ? new Date(subAny.current_period_end * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });

  // Update entitlement validity
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (sub) {
    await prisma.entitlement.updateMany({
      where: {
        sourceType: EntitlementSourceType.subscription,
        sourceId: sub.id,
      },
      data: {
        validUntil: sub.currentPeriodEnd,
        isActive: subscription.status === "active",
      },
    });
  }

  logger.info("Updated subscription and entitlement", { subscriptionId: subscription.id });
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info("Processing subscription deletion", { subscriptionId: subscription.id });

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: SubscriptionStatus.canceled,
      canceledAt: new Date(),
    },
  });

  // Expire entitlements
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (sub) {
    await prisma.entitlement.updateMany({
      where: {
        sourceType: EntitlementSourceType.subscription,
        sourceId: sub.id,
      },
      data: {
        isActive: false,
      },
    });
  }

  logger.info("Canceled subscription and expired entitlement", { subscriptionId: subscription.id });
}

/**
 * Handle invoice paid (for subscription renewals)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  logger.info("Processing invoice.paid", { invoiceId: invoice.id });

  const subscriptionRef = (invoice as any)?.parent?.subscription_details?.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;

  if (subscriptionId) {
    const sub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (sub) {
      // Extend entitlement validity
      await prisma.entitlement.updateMany({
        where: {
          sourceType: EntitlementSourceType.subscription,
          sourceId: sub.id,
        },
        data: {
          validUntil: sub.currentPeriodEnd,
          isActive: true,
        },
      });
      logger.info("Extended entitlement for subscription renewal", {
        subscriptionId: sub.id,
      });
    }
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.info("Processing invoice.payment_failed", { invoiceId: invoice.id });

  const subscriptionRef = (invoice as any)?.parent?.subscription_details?.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;

  if (subscriptionId) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: SubscriptionStatus.past_due,
      },
    });
    logger.info("Marked subscription as past_due", { subscriptionId });
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.info("Processing charge.refunded", { chargeId: charge.id });

  // Find order by payment intent
  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: charge.payment_intent as string },
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "refunded" },
    });

    // Expire entitlement
    await prisma.entitlement.updateMany({
      where: {
        sourceType: EntitlementSourceType.order,
        sourceId: order.id,
      },
      data: { isActive: false },
    });

    logger.info("Refunded order and expired entitlement", { orderId: order.id });
  }
}
