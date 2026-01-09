import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/entitlements/[id]/revoke
 * Revoke an entitlement by setting validUntil to now
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: entitlementId } = await params;

    const entitlement = await prisma.entitlement.findUnique({
      where: { id: entitlementId },
    });

    if (!entitlement) {
      return NextResponse.json({ error: "Entitlement not found" }, { status: 404 });
    }

    // Revoke by setting validUntil to now and isActive to false
    const updated = await prisma.entitlement.update({
      where: { id: entitlementId },
      data: {
        validUntil: new Date(),
        isActive: false,
      },
    });

    console.log(`✅ Admin ${session.user.email} revoked entitlement ${entitlementId}`);

    return NextResponse.json({ entitlement: updated }, { status: 200 });
  } catch (error) {
    console.error("Revoke entitlement error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
