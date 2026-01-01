import { prisma } from "@/lib/prisma";
import { ProductType } from "@prisma/client";
import { StripeService } from "./stripe-service";

export interface CreateProductInput {
  coachId: string;
  name: string;
  description?: string;
  type: ProductType;
}

export interface CreatePriceInput {
  productId: string;
  amountCents: number;
  currency?: string;
  interval?: string | null;
  intervalCount?: number | null;
}

export class ProductService {
  /**
   * Create a new product for a coach
   * Also creates the product in Stripe if configured
   */
  static async createProduct(input: CreateProductInput) {
    const { coachId, name, description, type } = input;

    // Verify coach exists
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
    });

    if (!coach) {
      throw new Error("Coach not found");
    }

    // Create product in Stripe first (if configured)
    let stripeProductId: string | null = null;
    try {
      stripeProductId = await StripeService.createProduct({
        name,
        description,
        type,
      });
    } catch (error) {
      console.error("Stripe product creation failed, continuing with local creation:", error);
      // Continue - allow local product creation even if Stripe fails
      // This allows development without Stripe configured
    }

    // Create product in database
    return await prisma.product.create({
      data: {
        coachId,
        name,
        description,
        type,
        isActive: true,
        stripeProductId,
      },
      include: {
        prices: true,
      },
    });
  }

  /**
   * Create a price for a product
   * Also creates the price in Stripe if configured
   */
  static async createPrice(input: CreatePriceInput) {
    const { productId, amountCents, currency = "usd", interval, intervalCount = 1 } = input;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Validate: subscriptions must have interval
    if (product.type === ProductType.subscription && !interval) {
      throw new Error("Subscription products must have an interval");
    }

    // Validate: one-on-one sessions should not have interval
    if (product.type === ProductType.one_on_one && interval) {
      throw new Error("One-on-one sessions cannot have recurring intervals");
    }

    // Create price in Stripe if product has Stripe ID
    let stripePriceId: string | null = null;
    if (product.stripeProductId) {
      try {
        stripePriceId = await StripeService.createPrice({
          productId,
          stripeProductId: product.stripeProductId,
          amountCents,
          currency,
          type: product.type,
          interval: product.type === ProductType.subscription ? interval : null,
          intervalCount: product.type === ProductType.subscription ? intervalCount : null,
        });
      } catch (error) {
        console.error("Stripe price creation failed, continuing with local creation:", error);
        // Continue - allow local price creation even if Stripe fails
      }
    }

    return await prisma.price.create({
      data: {
        productId,
        amountCents,
        currency,
        interval: product.type === ProductType.subscription ? interval : null,
        intervalCount: product.type === ProductType.subscription ? intervalCount : null,
        isActive: true,
        stripePriceId,
      },
    });
  }

  /**
   * Get all products for a coach with their prices
   */
  static async getCoachProducts(coachId: string) {
    return await prisma.product.findMany({
      where: { coachId },
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { amountCents: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get a single product with prices (verify coach ownership)
   */
  static async getProduct(productId: string, coachId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        coachId,
      },
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { amountCents: "asc" },
        },
      },
    });

    if (!product) {
      throw new Error("Product not found or access denied");
    }

    return product;
  }

  /**
   * Update product
   */
  static async updateProduct(
    productId: string,
    coachId: string,
    data: { name?: string; description?: string; isActive?: boolean }
  ) {
    // Verify ownership
    const product = await prisma.product.findFirst({
      where: { id: productId, coachId },
    });

    if (!product) {
      throw new Error("Product not found or access denied");
    }

    return await prisma.product.update({
      where: { id: productId },
      data,
      include: {
        prices: true,
      },
    });
  }

  /**
   * Deactivate a price
   */
  static async deactivatePrice(priceId: string, coachId: string) {
    // Verify the price belongs to a product owned by this coach
    const price = await prisma.price.findFirst({
      where: {
        id: priceId,
        product: {
          coachId,
        },
      },
    });

    if (!price) {
      throw new Error("Price not found or access denied");
    }

    return await prisma.price.update({
      where: { id: priceId },
      data: { isActive: false },
    });
  }
}
