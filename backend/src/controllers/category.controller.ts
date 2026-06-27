import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import { createCategorySchema, updateCategorySchema } from "../validation/category.validation";

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const categories = await categoryService.getAllCategories(tenantId);
      res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const category = await categoryService.getCategoryById(id, tenantId);
      res.status(200).json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const validatedData = createCategorySchema.parse(req.body);
      const category = await categoryService.createCategory(tenantId, validatedData.name);
      res.status(201).json({ success: true, message: "Category created successfully", data: category });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await categoryService.updateCategory(id, tenantId, validatedData.name);
      res.status(200).json({ success: true, message: "Category updated successfully", data: category });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      await categoryService.deleteCategory(id, tenantId);
      res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
