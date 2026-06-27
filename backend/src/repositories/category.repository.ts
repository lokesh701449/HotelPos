import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";

export class CategoryRepository {
  async findAll(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.category.findFirst({
      where: { id, tenantId },
    });
  }

  async findByName(name: string, tenantId: string) {
    return prisma.category.findFirst({
      where: {
        tenantId,
        name: {
          equals: name,
        },
      },
    });
  }

  async create(data: Prisma.CategoryUncheckedCreateInput) {
    return prisma.category.create({
      data,
    });
  }

  async update(id: string, tenantId: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryRepository = new CategoryRepository();
