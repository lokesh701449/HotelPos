import { prisma } from "../config/db";

export class DashboardRepository {
  async getTodayRevenue(tenantId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        amount: true,
      },
    });

    const total = payments.reduce((acc, curr) => acc + curr.amount, 0);
    return Number(total.toFixed(2));
  }

  async getTableOccupancy(tenantId: string) {
    const totalTables = await prisma.table.count({
      where: { tenantId },
    });

    const occupiedTables = await prisma.table.count({
      where: {
        tenantId,
        status: {
          in: ["OCCUPIED", "BILLING"],
        },
      },
    });

    const availableTables = await prisma.table.count({
      where: {
        tenantId,
        status: "AVAILABLE",
      },
    });

    const occupancyRate = totalTables > 0 ? Number(((occupiedTables / totalTables) * 100).toFixed(2)) : 0;

    return {
      totalTables,
      occupiedTables,
      availableTables,
      occupancyRate,
    };
  }

  async getPopularItems(tenantId: string) {
    // Get OrderItem sums grouped by menuItemId for the tenant
    const groupedItems = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: {
        order: {
          tenantId,
          status: "PAID", // Only count items from completed/paid orders
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    // Populate menuItem details
    const popularItems = [];
    for (const group of groupedItems) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: group.menuItemId },
        select: { name: true, price: true, category: { select: { name: true } } },
      });

      if (menuItem) {
        popularItems.push({
          id: group.menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          categoryName: menuItem.category.name,
          quantitySold: group._sum.quantity || 0,
        });
      }
    }

    return popularItems;
  }

  async getKitchenQueueStats(tenantId: string) {
    const pendingCount = await prisma.kitchenTicket.count({
      where: { tenantId, status: "PENDING" },
    });

    const preparingCount = await prisma.kitchenTicket.count({
      where: { tenantId, status: "PREPARING" },
    });

    const readyCount = await prisma.kitchenTicket.count({
      where: { tenantId, status: "READY" },
    });

    return {
      pending: pendingCount,
      preparing: preparingCount,
      ready: readyCount,
      totalActive: pendingCount + preparingCount,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
