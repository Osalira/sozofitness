import { prisma } from "@/lib/prisma";

export class RevenueService {
  /**
   * Update daily revenue aggregation for a coach
   * Call this when an order is completed
   */
  static async updateDailyRevenue(coachId: string, date: Date, amountCents: number) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    await prisma.coachDailyRevenue.upsert({
      where: {
        coachId_date: {
          coachId,
          date: dateOnly,
        },
      },
      create: {
        coachId,
        date: dateOnly,
        revenueCents: amountCents,
        orderCount: 1,
        newClientCount: 0, // Would need to check if first purchase
      },
      update: {
        revenueCents: {
          increment: amountCents,
        },
        orderCount: {
          increment: 1,
        },
      },
    });

    console.log(
      `✅ Updated daily revenue for ${coachId} on ${dateOnly.toISOString().split("T")[0]}`
    );
  }

  /**
   * Get coach metrics (7-day and 30-day totals)
   */
  static async getCoachMetrics(coachId: string) {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get aggregated revenue from CoachDailyRevenue
    const [revenue7d, revenue30d] = await Promise.all([
      prisma.coachDailyRevenue.aggregate({
        where: {
          coachId,
          date: { gte: last7Days },
        },
        _sum: {
          revenueCents: true,
          orderCount: true,
        },
      }),
      prisma.coachDailyRevenue.aggregate({
        where: {
          coachId,
          date: { gte: last30Days },
        },
        _sum: {
          revenueCents: true,
          orderCount: true,
        },
      }),
    ]);

    // Fallback: compute from orders if pre-aggregation missing
    if (!revenue7d._sum.revenueCents) {
      const orders7d = await prisma.order.aggregate({
        where: {
          coachId,
          status: "completed",
          createdAt: { gte: last7Days },
        },
        _sum: { amountCents: true },
        _count: true,
      });

      return {
        revenue7d: orders7d._sum.amountCents || 0,
        orderCount7d: orders7d._count,
        revenue30d: revenue30d._sum.revenueCents || 0,
        orderCount30d: revenue30d._sum.orderCount || 0,
      };
    }

    return {
      revenue7d: revenue7d._sum.revenueCents || 0,
      orderCount7d: revenue7d._sum.orderCount || 0,
      revenue30d: revenue30d._sum.revenueCents || 0,
      orderCount30d: revenue30d._sum.orderCount || 0,
    };
  }

  /**
   * Get recent sales for a coach
   */
  static async getRecentSales(coachId: string, limit = 10) {
    return await prisma.order.findMany({
      where: {
        coachId,
        status: "completed",
      },
      include: {
        client: {
          select: { email: true, name: true },
        },
        product: {
          select: { name: true },
        },
        price: {
          select: { amountCents: true, currency: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
