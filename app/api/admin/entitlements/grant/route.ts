import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, EntitlementSourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/entitlements/grant
 * Manually grant an entitlement to a user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, productId, validityDays } = body;

    if (!userId || !productId) {
      return NextResponse.json({ error: "User ID and Product ID are required" }, { status: 400 });
    }

    // Verify user and product exist
    const [user, product] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate validUntil if validityDays provided
    let validUntil: Date | null = null;
    if (validityDays) {
      validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);
    }

    // Create a fake "admin" order ID for tracking (using admin user ID)
    const adminSourceId = session.user.id;

    // Grant entitlement
    const entitlement = await prisma.entitlement.create({
      data: {
        coachId: product.coachId,
        clientId: userId,
        productId,
        sourceType: EntitlementSourceType.admin,
        sourceId: adminSourceId, // Use admin's ID as source
        validUntil,
        isActive: true,
      },
    });

    console.log(
      `✅ Admin ${session.user.email} granted entitlement ${entitlement.id} to user ${user.email}`
    );

    return NextResponse.json({ entitlement }, { status: 201 });
  } catch (error) {
    console.error("Grant entitlement error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
