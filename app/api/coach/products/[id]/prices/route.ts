import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProductService } from "@/lib/services/product-service";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/coach/products/[id]/prices
 * Add a price to a product
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.coach) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get coach record
    const coach = await prisma.coach.findUnique({
      where: { userId: session.user.id },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });
    }

    const { id: productId } = await params;
    const body = await req.json();
    const { amountCents, currency, interval, intervalCount } = body;

    // Verify product ownership
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        coachId: coach.id,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 });
    }

    // Validation
    if (!amountCents || typeof amountCents !== "number" || amountCents < 0) {
      return NextResponse.json(
        { error: "Valid amount in cents is required (must be >= 0)" },
        { status: 400 }
      );
    }

    if (currency && typeof currency !== "string") {
      return NextResponse.json({ error: "Currency must be a string" }, { status: 400 });
    }

    // Validate interval for subscriptions
    const validIntervals = ["day", "week", "month", "year"];
    if (interval && !validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: `Interval must be one of: ${validIntervals.join(", ")}` },
        { status: 400 }
      );
    }

    // Create price
    const price = await ProductService.createPrice({
      productId,
      amountCents,
      currency: currency || "usd",
      interval: interval || null,
      intervalCount: intervalCount || 1,
    });

    return NextResponse.json({ price }, { status: 201 });
  } catch (error) {
    console.error("Create price error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
