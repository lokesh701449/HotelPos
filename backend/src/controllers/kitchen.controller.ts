import { Request, Response, NextFunction } from "express";
import { kitchenService } from "../services/kitchen.service";
import { updateKitchenTicketSchema } from "../validation/order.validation";

export class KitchenController {
  async getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const status = req.query.status as string | undefined;
      const tickets = await kitchenService.getAllTickets(tenantId, status);
      res.status(200).json({ success: true, data: tickets });
    } catch (err) {
      next(err);
    }
  }

  async getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const ticket = await kitchenService.getTicketById(id, tenantId);
      res.status(200).json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async updateTicketStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const validatedData = updateKitchenTicketSchema.parse(req.body);
      const ticket = await kitchenService.updateTicketStatus(id, tenantId, validatedData.status);
      res.status(200).json({ success: true, message: "Kitchen ticket status updated", data: ticket });
    } catch (err) {
      next(err);
    }
  }
}

export const kitchenController = new KitchenController();
