import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/discover/coaches?q=search_term
 * Public endpoint to list coaches with their active products and prices
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    // Build where clause for search
    const whereClause = query
      ? {
          OR: [
            { user: { name: { contains: query, mode: "insensitive" as const } } },
            {
              products: {
                some: {
                  isActive: true,
                  name: { contains: query, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {};

    // Get coaches with active products only
    const coaches = await prisma.coach.findMany({
      where: {
        ...whereClause,
        products: {
          some: { isActive: true },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            // DO NOT include email or other private fields
          },
        },
        products: {
          where: { isActive: true },
          include: {
            prices: {
              where: { isActive: true },
              select: {
                id: true,
                amountCents: true,
                currency: true,
                interval: true,
                intervalCount: true,
                stripePriceId: true,
              },
              orderBy: { amountCents: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format response - only public fields
    const publicCoaches = coaches.map((coach) => ({
      coachId: coach.id,
      displayName: coach.user.name || "Coach",
      bio: coach.bio,
      productCount: coach.products.length,
      products: coach.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        type: product.type,
        prices: product.prices.map((price) => ({
          id: price.id,
          amountCents: price.amountCents,
          currency: price.currency,
          interval: price.interval,
          intervalCount: price.intervalCount,
          stripePriceId: price.stripePriceId,
        })),
      })),
    }));

    return NextResponse.json({ coaches: publicCoaches }, { status: 200 });
  } catch (error) {
    console.error("Discover coaches error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coaches" },
      { status: 500 }
    );
  }
}

