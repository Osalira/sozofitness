import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RevenueService } from "@/lib/services/revenue-service";

/**
 * GET /api/coach/metrics
 * Get revenue metrics and recent sales for authenticated coach
 */
export async function GET(req: NextRequest) {
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

    // Get metrics and recent sales in parallel
    const [metrics, recentSales] = await Promise.all([
      RevenueService.getCoachMetrics(coach.id),
      RevenueService.getRecentSales(coach.id, 10),
    ]);

    return NextResponse.json({ metrics, recentSales }, { status: 200 });
  } catch (error) {
    console.error("Get coach metrics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
