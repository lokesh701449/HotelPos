import { categoryRepository } from "../repositories/category.repository";
import { ConflictError, NotFoundError } from "../utils/errors";

export class CategoryService {
  async getAllCategories(tenantId: string) {
    return categoryRepository.findAll(tenantId);
  }

  async getCategoryById(id: string, tenantId: string) {
    const category = await categoryRepository.findById(id, tenantId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return category;
  }

  async createCategory(tenantId: string, name: string) {
    const existing = await categoryRepository.findByName(name, tenantId);
    if (existing) {
      throw new ConflictError(`Category with name "${name}" already exists`);
    }

    return categoryRepository.create({
      tenantId,
      name,
    });
  }

  async updateCategory(id: string, tenantId: string, name: string) {
    const category = await this.getCategoryById(id, tenantId);

    const existing = await categoryRepository.findByName(name, tenantId);
    if (existing && existing.id !== id) {
      throw new ConflictError(`Category with name "${name}" already exists`);
    }

    return categoryRepository.update(id, tenantId, { name });
  }

  async deleteCategory(id: string, tenantId: string) {
    await this.getCategoryById(id, tenantId);
    return categoryRepository.delete(id, tenantId);
  }
}

export const categoryService = new CategoryService();
