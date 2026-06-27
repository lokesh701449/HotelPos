import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";

export class KitchenRepository {
  async findAll(tenantId: string, status?: string) {
    return prisma.kitchenTicket.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        order: {
          include: {
            table: true,
            orderItems: { include: { menuItem: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" }, // Oldest tickets first (FIFO queue)
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.kitchenTicket.findFirst({
      where: { id, tenantId },
      include: {
        order: {
          include: {
            table: true,
            orderItems: { include: { menuItem: true } },
          },
        },
      },
    });
  }

  async findByOrderId(orderId: string, tenantId: string) {
    return prisma.kitchenTicket.findFirst({
      where: { orderId, tenantId },
    });
  }

  async update(id: string, tenantId: string, data: Prisma.KitchenTicketUpdateInput) {
    return prisma.kitchenTicket.update({
      where: { id },
      data,
      include: {
        order: {
          include: {
            table: true,
            orderItems: { include: { menuItem: true } },
          },
        },
      },
    });
  }
}

export const kitchenRepository = new KitchenRepository();
