import { menuRepository } from "../repositories/menu.repository";
import { categoryRepository } from "../repositories/category.repository";
import { ConflictError, NotFoundError } from "../utils/errors";

export class MenuService {
  async getAllMenuItems(tenantId: string) {
    return menuRepository.findAll(tenantId);
  }

  async getMenuItemById(id: string, tenantId: string) {
    const item = await menuRepository.findById(id, tenantId);
    if (!item) {
      throw new NotFoundError("Menu item not found");
    }
    return item;
  }

  async getMenuItemsByCategory(categoryId: string, tenantId: string) {
    const category = await categoryRepository.findById(categoryId, tenantId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return menuRepository.findByCategory(categoryId, tenantId);
  }

  async createMenuItem(tenantId: string, data: any) {
    // 1. Verify category exists
    const category = await categoryRepository.findById(data.categoryId, tenantId);
    if (!category) {
      throw new NotFoundError("Referenced category not found");
    }

    // 2. Check for duplicate name
    const existing = await menuRepository.findByName(data.name, tenantId);
    if (existing) {
      throw new ConflictError(`Menu item with name "${data.name}" already exists`);
    }

    return menuRepository.create({
      ...data,
      tenantId,
    });
  }

  async updateMenuItem(id: string, tenantId: string, data: any) {
    const item = await this.getMenuItemById(id, tenantId);

    // If updating category, verify target category exists
    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId, tenantId);
      if (!category) {
        throw new NotFoundError("Referenced category not found");
      }
    }

    // If updating name, check for name conflict
    if (data.name) {
      const existing = await menuRepository.findByName(data.name, tenantId);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Menu item with name "${data.name}" already exists`);
      }
    }

    return menuRepository.update(id, tenantId, data);
  }

  async deleteMenuItem(id: string, tenantId: string) {
    await this.getMenuItemById(id, tenantId);
    return menuRepository.delete(id, tenantId);
  }
}

export const menuService = new MenuService();
