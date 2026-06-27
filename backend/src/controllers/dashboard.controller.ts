import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";

export class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const summary = await dashboardService.getDashboardSummary(tenantId);
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
