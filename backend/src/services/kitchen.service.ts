import { kitchenRepository } from "../repositories/kitchen.repository";
import { orderRepository } from "../repositories/order.repository";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { socketService } from "../socket/socket.service";
import { stockroomService } from "../integrations/stockroom.service";

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

    // If transitioning to READY, verify and deduct ingredients in StockRoom
    if (status === "READY" && ticket.status !== "READY") {
      try {
        const propertyId = await stockroomService.getPropertyId(tenantId);
        if (propertyId) {
          const recipes = await stockroomService.getRecipes(propertyId);
          for (const item of ticket.order.orderItems) {
            const recipe = recipes.find(
              (r: any) => r.name.toLowerCase() === item.menuItem.name.toLowerCase()
            );
            if (recipe) {
              await stockroomService.prepareRecipe(recipe._id || recipe.id, item.quantity, propertyId);
            }
          }
        }
      } catch (error: any) {
        console.error("[StockRoom Integration Error]:", error);
        if (error.success === false) {
          // Insufficient stock validation error from StockRoom
          throw new BadRequestError(
            `Insufficient Stock: ${error.ingredient}. Required: ${error.required}, Available: ${error.available}, Missing: ${error.missing}`
          );
        } else {
          // Log other API connection errors but allow the ticket to be prepared so FOH keeps running
          console.warn("[StockRoom API Connection Error]: Inventory Service Unavailable. Skipping deduction.");
        }
      }
    }

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
