import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";

export class TableRepository {
  async findAll(tenantId: string) {
    return prisma.table.findMany({
      where: { tenantId },
      orderBy: { number: "asc" },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.table.findFirst({
      where: { id, tenantId },
    });
  }

  async findByNumber(number: number, tenantId: string) {
    return prisma.table.findFirst({
      where: { number, tenantId },
    });
  }

  async create(data: Prisma.TableUncheckedCreateInput) {
    return prisma.table.create({
      data,
    });
  }

  async update(id: string, tenantId: string, data: Prisma.TableUpdateInput) {
    return prisma.table.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    return prisma.table.delete({
      where: { id },
    });
  }
}

export const tableRepository = new TableRepository();
