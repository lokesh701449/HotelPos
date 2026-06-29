import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";

export class OrderRepository {
  async findAll(tenantId: string, status?: string) {
    return prisma.order.findMany({
      where: { 
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        table: true,
        waiter: { select: { id: true, name: true, role: true } },
        orderItems: { include: { menuItem: true } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        table: true,
        waiter: { select: { id: true, name: true, role: true } },
        orderItems: { include: { menuItem: true } },
        payments: true,
        kitchenTickets: true,
      },
    });
  }

  async findActiveByTable(tableId: string, tenantId: string) {
    return prisma.order.findFirst({
      where: {
        tableId,
        tenantId,
        status: {
          in: ["OPEN", "PREPARING", "READY", "SERVED"],
        },
      },
      include: {
        orderItems: true,
      },
    });
  }

  async create(orderData: Prisma.OrderUncheckedCreateInput, items: Prisma.OrderItemUncheckedCreateWithoutOrderInput[]) {
    // Create order and its items in a transaction
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          ...orderData,
          orderItems: {
            create: items,
          },
        },
        include: {
          orderItems: { include: { menuItem: true } },
          table: true,
        },
      });

      // Automatically update table status to OCCUPIED
      await tx.table.update({
        where: { id: orderData.tableId },
        data: { status: "OCCUPIED" },
      });

      // Automatically create a Kitchen Ticket for the order
      await tx.kitchenTicket.create({
        data: {
          tenantId: order.tenantId,
          orderId: order.id,
          status: "PENDING",
        },
      });

      return order;
    });
  }

  async update(id: string, tenantId: string, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        orderItems: { include: { menuItem: true } },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    return prisma.$transaction(async (tx) => {
      // Find order to check tableId
      const order = await tx.order.findFirst({
        where: { id, tenantId },
      });

      if (order) {
        // Reset table status to AVAILABLE
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE" },
        });
      }

      return tx.order.delete({
        where: { id },
      });
    });
  }

  // Order Items operations
  async findOrderItem(orderId: string, menuItemId: string) {
    return prisma.orderItem.findFirst({
      where: { orderId, menuItemId },
    });
  }

  async findOrderItemById(orderItemId: string) {
    return prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: true },
    });
  }

  async createOrderItem(orderId: string, data: Omit<Prisma.OrderItemUncheckedCreateInput, "orderId">) {
    return prisma.orderItem.create({
      data: {
        ...data,
        orderId,
      },
    });
  }

  async updateOrderItem(orderItemId: string, data: Prisma.OrderItemUpdateInput) {
    return prisma.orderItem.update({
      where: { id: orderItemId },
      data,
    });
  }

  async deleteOrderItem(orderItemId: string) {
    return prisma.orderItem.delete({
      where: { id: orderItemId },
    });
  }
}

export const orderRepository = new OrderRepository();
