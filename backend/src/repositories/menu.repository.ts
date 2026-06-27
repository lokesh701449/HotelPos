import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";

export class MenuRepository {
  async findAll(tenantId: string) {
    return prisma.menuItem.findMany({
      where: { tenantId },
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.menuItem.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
  }

  async findByName(name: string, tenantId: string) {
    return prisma.menuItem.findFirst({
      where: {
        tenantId,
        name: {
          equals: name,
        },
      },
    });
  }

  async findByCategory(categoryId: string, tenantId: string) {
    return prisma.menuItem.findMany({
      where: { categoryId, tenantId },
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }

  async create(data: Prisma.MenuItemUncheckedCreateInput) {
    return prisma.menuItem.create({
      data,
      include: { category: true },
    });
  }

  async update(id: string, tenantId: string, data: Prisma.MenuItemUpdateInput) {
    return prisma.menuItem.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string, tenantId: string) {
    return prisma.menuItem.delete({
      where: { id },
    });
  }
}

export const menuRepository = new MenuRepository();
