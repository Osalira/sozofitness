import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StripeService } from "@/lib/services/stripe-service";
import { ProductType, UserRole } from "@prisma/client";

/**
 * POST /api/checkout/create-session
 * Create a Stripe Checkout session for purchasing a product
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clients only
    if (session.user.role !== UserRole.client) {
      return NextResponse.json({ error: "Only clients can purchase products" }, { status: 403 });
    }

    const body = await req.json();
    const { priceId, productId } = body;

    if (!priceId || !productId) {
      return NextResponse.json({ error: "Price ID and Product ID are required" }, { status: 400 });
    }

    // Fetch price with product details
    // NOTE: findUnique() can only use unique fields. Use findFirst() for filtered lookups.
    const price = await prisma.price.findFirst({
      where: { id: priceId, isActive: true },
      include: {
        product: {
          include: {
            coach: true,
          },
        },
      },
    });

    if (!price || price.product.id !== productId) {
      return NextResponse.json({ error: "Invalid price or product" }, { status: 404 });
    }

    if (!price.product.isActive) {
      return NextResponse.json({ error: "Product is not available" }, { status: 400 });
    }

    if (!price.stripePriceId) {
      return NextResponse.json(
        {
          error:
            "Stripe integration not configured for this product. Contact the coach to complete setup.",
        },
        { status: 400 }
      );
    }

    // Check if user already has access
    const existingEntitlement = await prisma.entitlement.findFirst({
      where: {
        clientId: session.user.id,
        productId: price.product.id,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });

    if (existingEntitlement) {
      return NextResponse.json(
        { error: "You already have access to this product" },
        { status: 400 }
      );
    }

    // Build URLs
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?product_id=${productId}`;

    // Metadata to include in checkout session
    const metadata = {
      userId: session.user.id,
      userEmail: session.user.email,
      productId: price.product.id,
      priceId: price.id,
      coachId: price.product.coachId,
      productType: price.product.type,
    };

    // Create appropriate checkout session based on product type
    let checkoutSession;

    if (price.product.type === ProductType.subscription) {
      checkoutSession = await StripeService.createSubscriptionCheckout({
        priceId: price.stripePriceId,
        clientEmail: session.user.email,
        successUrl,
        cancelUrl,
        metadata,
      });
    } else {
      checkoutSession = await StripeService.createCheckoutSession({
        priceId: price.stripePriceId,
        clientEmail: session.user.email,
        successUrl,
        cancelUrl,
        metadata,
      });
    }

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    console.error("Create checkout session error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
