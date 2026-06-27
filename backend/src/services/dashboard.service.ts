import { dashboardRepository } from "../repositories/dashboard.repository";

export class DashboardService {
  async getDashboardSummary(tenantId: string) {
    const todayRevenue = await dashboardRepository.getTodayRevenue(tenantId);
    const tableOccupancy = await dashboardRepository.getTableOccupancy(tenantId);
    const popularItems = await dashboardRepository.getPopularItems(tenantId);
    const kitchenQueue = await dashboardRepository.getKitchenQueueStats(tenantId);

    return {
      todayRevenue,
      tableOccupancy,
      popularItems,
      kitchenQueue,
      generatedAt: new Date(),
    };
  }
}

export const dashboardService = new DashboardService();
