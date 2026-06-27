import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";

export class PaymentRepository {
  async findAll(tenantId: string) {
    return prisma.payment.findMany({
      where: { tenantId },
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.payment.findFirst({
      where: { id, tenantId },
      include: { order: { include: { table: true, orderItems: { include: { menuItem: true } } } } },
    });
  }

  async create(data: Prisma.PaymentUncheckedCreateInput, tableId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Create payment
      const payment = await tx.payment.create({
        data: {
          ...data,
          status: "COMPLETED", // Completed on cashier receipt
        },
      });

      // 2. Update Order status to PAID
      const order = await tx.order.update({
        where: { id: data.orderId },
        data: { status: "PAID" },
        include: { orderItems: { include: { menuItem: true } }, table: true },
      });

      // 3. Reset Table status to AVAILABLE
      const table = await tx.table.update({
        where: { id: tableId },
        data: { status: "AVAILABLE" },
      });

      // 4. Update KitchenTicket status if active to SERVED
      const ticket = await tx.kitchenTicket.findFirst({
        where: { orderId: data.orderId },
      });
      if (ticket) {
        await tx.kitchenTicket.update({
          where: { id: ticket.id },
          data: { status: "SERVED" },
        });
      }

      return { payment, order, table };
    });
  }
}

export const paymentRepository = new PaymentRepository();
