import { Request, Response, NextFunction } from "express";
import { tableService } from "../services/table.service";
import { createTableSchema, updateTableSchema } from "../validation/table.validation";

export class TableController {
  async getTables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const tables = await tableService.getAllTables(tenantId);
      res.status(200).json({ success: true, data: tables });
    } catch (err) {
      next(err);
    }
  }

  async getTableById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const table = await tableService.getTableById(id, tenantId);
      res.status(200).json({ success: true, data: table });
    } catch (err) {
      next(err);
    }
  }

  async createTable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const validatedData = createTableSchema.parse(req.body);
      const table = await tableService.createTable(tenantId, validatedData);
      res.status(201).json({ success: true, message: "Table created successfully", data: table });
    } catch (err) {
      next(err);
    }
  }

  async updateTable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const validatedData = updateTableSchema.parse(req.body);
      const table = await tableService.updateTable(id, tenantId, validatedData);
      res.status(200).json({ success: true, message: "Table updated successfully", data: table });
    } catch (err) {
      next(err);
    }
  }

  async deleteTable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      await tableService.deleteTable(id, tenantId);
      res.status(200).json({ success: true, message: "Table deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const tableController = new TableController();
