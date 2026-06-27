import { Request, Response, NextFunction } from "express";
import { menuService } from "../services/menu.service";
import { createMenuItemSchema, updateMenuItemSchema } from "../validation/menu.validation";

export class MenuController {
  async getMenuItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const categoryId = req.query.categoryId as string | undefined;

      let items;
      if (categoryId) {
        items = await menuService.getMenuItemsByCategory(categoryId, tenantId);
      } else {
        items = await menuService.getAllMenuItems(tenantId);
      }

      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  async getMenuItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const item = await menuService.getMenuItemById(id, tenantId);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async createMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const validatedData = createMenuItemSchema.parse(req.body);
      const item = await menuService.createMenuItem(tenantId, validatedData);
      res.status(201).json({ success: true, message: "Menu item created successfully", data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const validatedData = updateMenuItemSchema.parse(req.body);
      const item = await menuService.updateMenuItem(id, tenantId, validatedData);
      res.status(200).json({ success: true, message: "Menu item updated successfully", data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      await menuService.deleteMenuItem(id, tenantId);
      res.status(200).json({ success: true, message: "Menu item deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const menuController = new MenuController();
