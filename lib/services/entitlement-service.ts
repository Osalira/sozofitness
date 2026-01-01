import { prisma } from "@/lib/prisma";
import { ProductType } from "@prisma/client";

export class EntitlementService {
  /**
   * Check if a client has active entitlement to a specific product
   */
  static async hasActiveEntitlement(clientId: string, productId: string): Promise<boolean> {
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        clientId,
        productId,
        isActive: true,
        OR: [
          { validUntil: null }, // Indefinite
          { validUntil: { gt: new Date() } }, // Not expired
        ],
      },
    });

    return !!entitlement;
  }

  /**
   * Check if a client has active entitlement to ANY product from a coach
   * Useful for showing coach's content library
   */
  static async hasActiveEntitlementToCoach(clientId: string, coachId: string): Promise<boolean> {
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        clientId,
        coachId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });

    return !!entitlement;
  }

  /**
   * Get all active entitlements for a client
   * Returns with product and coach details
   */
  static async getClientEntitlements(clientId: string) {
    return await prisma.entitlement.findMany({
      where: {
        clientId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
      include: {
        client: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get all products a client has access to
   */
  static async getClientAccessibleProducts(clientId: string) {
    const entitlements = await prisma.entitlement.findMany({
      where: {
        clientId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
      select: {
        productId: true,
        coachId: true,
      },
    });

    if (entitlements.length === 0) {
      return [];
    }

    const productIds = entitlements.map((e) => e.productId);

    return await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: {
        coach: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        prices: {
          where: { isActive: true },
          take: 1,
          orderBy: { amountCents: "asc" },
        },
      },
    });
  }

  /**
   * Get all content items a client can access
   * Only returns content for products the client has entitlement to
   */
  static async getClientAccessibleContent(clientId: string, coachId: string) {
    // Get all product IDs client has access to from this coach
    const entitlements = await prisma.entitlement.findMany({
      where: {
        clientId,
        coachId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
      select: { productId: true },
    });

    if (entitlements.length === 0) {
      return [];
    }

    const productIds = entitlements.map((e) => e.productId);

    // Return all published content for those products
    return await prisma.contentItem.findMany({
      where: {
        coachId,
        productId: { in: productIds },
        isPublished: true,
      },
      include: {
        product: {
          select: { name: true, type: true },
        },
      },
      orderBy: { publishedAt: "desc" },
    });
  }

  /**
   * Check if client has entitlement to specific content item
   */
  static async canAccessContent(clientId: string, contentId: string): Promise<boolean> {
    const content = await prisma.contentItem.findUnique({
      where: { id: contentId },
      select: { productId: true, coachId: true, isPublished: true },
    });

    if (!content || !content.isPublished) {
      return false;
    }

    return await this.hasActiveEntitlement(clientId, content.productId);
  }
}
