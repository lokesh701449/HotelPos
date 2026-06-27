import { kitchenRepository } from "../repositories/kitchen.repository";
import { orderRepository } from "../repositories/order.repository";
import { NotFoundError } from "../utils/errors";
import { socketService } from "../socket/socket.service";

export class KitchenService {
  async getAllTickets(tenantId: string, status?: string) {
    return kitchenRepository.findAll(tenantId, status);
  }

  async getTicketById(id: string, tenantId: string) {
    const ticket = await kitchenRepository.findById(id, tenantId);
    if (!ticket) {
      throw new NotFoundError("Kitchen ticket not found");
    }
    return ticket;
  }

  async updateTicketStatus(id: string, tenantId: string, status: "PENDING" | "PREPARING" | "READY" | "SERVED") {
    const ticket = await this.getTicketById(id, tenantId);

    // Update ticket status
    const updatedTicket = await kitchenRepository.update(id, tenantId, {
      status,
    });

    // Map KitchenStatus to OrderStatus and update order
    let orderStatus: "OPEN" | "PREPARING" | "READY" | "SERVED" | null = null;
    if (status === "PREPARING") {
      orderStatus = "PREPARING";
    } else if (status === "READY") {
      orderStatus = "READY";
    } else if (status === "SERVED") {
      orderStatus = "SERVED";
    }

    if (orderStatus) {
      const updatedOrder = await orderRepository.update(ticket.orderId, tenantId, {
        status: orderStatus,
      });
      socketService.emitToTenant(tenantId, "order-updated", updatedOrder);
    }

    // Emit socket events
    socketService.emitToTenant(tenantId, "ticket-updated", updatedTicket);

    if (status === "READY") {
      socketService.emitToTenant(tenantId, "ticket-ready", {
        ticketId: updatedTicket.id,
        orderId: updatedTicket.orderId,
        tableNumber: updatedTicket.order.table.number,
      });
    }

    return updatedTicket;
  }
}

export const kitchenService = new KitchenService();
