import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users/search?email=xxx
 * Search for a user by email and get their details
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's orders, subscriptions, and entitlements
    const [orders, subscriptions, entitlements] = await Promise.all([
      prisma.order.findMany({
        where: { clientId: user.id },
        include: {
          product: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.subscription.findMany({
        where: { clientId: user.id },
        include: {
          product: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.entitlement.findMany({
        where: { clientId: user.id },
        include: {
          product: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json(
      {
        user,
        orders,
        subscriptions,
        entitlements,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin user search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
