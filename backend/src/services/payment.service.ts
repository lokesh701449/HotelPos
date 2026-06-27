import { paymentRepository } from "../repositories/payment.repository";
import { orderRepository } from "../repositories/order.repository";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { socketService } from "../socket/socket.service";

export class PaymentService {
  async getAllPayments(tenantId: string) {
    return paymentRepository.findAll(tenantId);
  }

  async getPaymentById(id: string, tenantId: string) {
    const payment = await paymentRepository.findById(id, tenantId);
    if (!payment) {
      throw new NotFoundError("Payment not found");
    }
    return payment;
  }

  async processPayment(tenantId: string, data: any) {
    const order = await orderRepository.findById(data.orderId, tenantId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status === "PAID") {
      throw new BadRequestError("This order has already been paid");
    }
    if (order.status === "CANCELLED") {
      throw new BadRequestError("Cannot pay for a cancelled order");
    }

    // Call payment transaction
    const result = await paymentRepository.create(
      {
        tenantId,
        orderId: data.orderId,
        method: data.method,
        amount: data.amount,
        transactionReference: data.transactionReference || null,
      },
      order.tableId
    );

    // Emit Socket events
    socketService.emitToTenant(tenantId, "payment-completed", result.payment);
    socketService.emitToTenant(tenantId, "order-updated", result.order);
    socketService.emitToTenant(tenantId, "table-updated", result.table);
    socketService.emitToTenant(tenantId, "dashboard-updated", { message: "payment received" });

    return result;
  }

  async generateInvoice(paymentId: string, tenantId: string): Promise<string> {
    const payment = await this.getPaymentById(paymentId, tenantId);
    const order = payment.order;
    const items = order.orderItems;

    const brandName = (order as any).tenant?.brandName || "RESTAURANT HOTEL POS";
    const address = (order as any).tenant?.address || "123 Food Street";

    const width = 50;
    const separator = "-".repeat(width);
    const doubleSeparator = "=".repeat(width);

    const padCenter = (str: string) => {
      const len = str.length;
      if (len >= width) return str;
      const left = Math.floor((width - len) / 2);
      const right = width - len - left;
      return " ".repeat(left) + str + " ".repeat(right);
    };

    const padSpread = (left: string, right: string) => {
      const remainingSpace = width - left.length - right.length;
      if (remainingSpace <= 0) return left + " " + right;
      return left + " ".repeat(remainingSpace) + right;
    };

    let invoice = "";
    invoice += doubleSeparator + "\n";
    invoice += padCenter(brandName.toUpperCase()) + "\n";
    invoice += padCenter(address) + "\n";
    invoice += doubleSeparator + "\n";
    invoice += padSpread(`Invoice: #${payment.id.substring(0, 8)}`, `Date: ${payment.createdAt.toLocaleDateString()}`) + "\n";
    invoice += padSpread(`Table: Table ${(order as any).table.number}`, `Waiter: ${(order as any).waiter.name}`) + "\n";
    invoice += separator + "\n";
    invoice += padSpread("Items", "Price") + "\n";
    invoice += separator + "\n";

    for (const item of items) {
      const leftCol = `${item.menuItem.name} x ${item.quantity}`;
      const rightCol = `${(item.price * item.quantity).toFixed(2)}`;
      invoice += padSpread(leftCol, rightCol) + "\n";
      if (item.notes) {
        invoice += `  * Notes: ${item.notes}\n`;
      }
    }

    invoice += separator + "\n";
    invoice += padSpread("Subtotal:", `$${order.subtotal.toFixed(2)}`) + "\n";
    invoice += padSpread("Tax (5%):", `$${order.tax.toFixed(2)}`) + "\n";
    invoice += padSpread("Total:", `$${order.total.toFixed(2)}`) + "\n";
    invoice += doubleSeparator + "\n";
    invoice += padSpread("Payment Method:", payment.method) + "\n";
    invoice += padSpread("Amount Paid:", `$${payment.amount.toFixed(2)}`) + "\n";
    invoice += padSpread("Status:", payment.status) + "\n";
    if (payment.transactionReference) {
      invoice += padSpread("Tx Ref:", payment.transactionReference) + "\n";
    }
    invoice += doubleSeparator + "\n";
    invoice += padCenter("THANK YOU FOR YOUR PATRONAGE!") + "\n";
    invoice += doubleSeparator + "\n";

    return invoice;
  }
}

export const paymentService = new PaymentService();
