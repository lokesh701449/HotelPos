import { orderRepository } from "../repositories/order.repository";
import { tableRepository } from "../repositories/table.repository";
import { menuRepository } from "../repositories/menu.repository";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import { socketService } from "../socket/socket.service";

const TAX_RATE = 0.05; // 5% tax

export class OrderService {
  private async recalculateTotals(orderId: string, tenantId: string) {
    const order = await orderRepository.findById(orderId, tenantId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    let subtotal = 0;
    for (const item of order.orderItems) {
      subtotal += item.price * item.quantity;
    }

    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    return orderRepository.update(orderId, tenantId, {
      subtotal,
      tax,
      total,
    });
  }

  async getAllOrders(tenantId: string, status?: string) {
    return orderRepository.findAll(tenantId, status);
  }

  async getOrderById(id: string, tenantId: string) {
    const order = await orderRepository.findById(id, tenantId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    return order;
  }

  async createOrder(tenantId: string, waiterId: string, data: any) {
    // 1. Verify table exists
    const table = await tableRepository.findById(data.tableId, tenantId);
    if (!table) {
      throw new NotFoundError("Table not found");
    }

    // 2. Check if table already has an active order
    const activeOrder = await orderRepository.findActiveByTable(data.tableId, tenantId);
    if (activeOrder) {
      throw new ConflictError("This table already has an active order");
    }

    // 3. Fetch menu items to get verified prices
    const itemsWithPrices = [];
    let subtotal = 0;

    for (const item of data.items) {
      const menuItem = await menuRepository.findById(item.menuItemId, tenantId);
      if (!menuItem) {
        throw new NotFoundError(`Menu item ${item.menuItemId} not found`);
      }
      if (!menuItem.available) {
        throw new BadRequestError(`Menu item "${menuItem.name}" is currently unavailable`);
      }

      itemsWithPrices.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes || "",
        price: menuItem.price,
      });

      subtotal += menuItem.price * item.quantity;
    }

    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    // 4. Create order
    const order = await orderRepository.create(
      {
        tenantId,
        tableId: data.tableId,
        waiterId,
        status: "OPEN",
        subtotal,
        tax,
        total,
      },
      itemsWithPrices
    );

    // 5. Emit socket events
    socketService.emitToTenant(tenantId, "order-created", order);
    
    // Fetch updated table status
    const updatedTable = await tableRepository.findById(data.tableId, tenantId);
    socketService.emitToTenant(tenantId, "table-updated", updatedTable);

    return order;
  }

  async updateOrderStatus(id: string, tenantId: string, status: string) {
    const order = await this.getOrderById(id, tenantId);

    const updatedOrder = await orderRepository.update(id, tenantId, {
      status: status as any,
    });

    socketService.emitToTenant(tenantId, "order-updated", updatedOrder);

    // If order was cancelled, release the table
    if (status === "CANCELLED") {
      await tableRepository.update(order.tableId, tenantId, { status: "AVAILABLE" });
      const updatedTable = await tableRepository.findById(order.tableId, tenantId);
      socketService.emitToTenant(tenantId, "table-updated", updatedTable);
    }

    return updatedOrder;
  }

  async addItemToOrder(orderId: string, tenantId: string, data: any) {
    const order = await this.getOrderById(orderId, tenantId);
    if (order.status !== "OPEN") {
      throw new BadRequestError("Items can only be added to OPEN orders");
    }

    const menuItem = await menuRepository.findById(data.menuItemId, tenantId);
    if (!menuItem) {
      throw new NotFoundError("Menu item not found");
    }
    if (!menuItem.available) {
      throw new BadRequestError(`Menu item "${menuItem.name}" is currently unavailable`);
    }

    const existingItem = await orderRepository.findOrderItem(orderId, data.menuItemId);
    if (existingItem) {
      // Add quantity
      await orderRepository.updateOrderItem(existingItem.id, {
        quantity: existingItem.quantity + data.quantity,
        notes: data.notes || existingItem.notes,
      });
    } else {
      // Create new
      await orderRepository.createOrderItem(orderId, {
        menuItemId: data.menuItemId,
        quantity: data.quantity,
        notes: data.notes || "",
        price: menuItem.price,
      });
    }

    const updatedOrder = await this.recalculateTotals(orderId, tenantId);
    socketService.emitToTenant(tenantId, "order-updated", updatedOrder);
    return updatedOrder;
  }

  async updateOrderItemQuantity(orderId: string, orderItemId: string, tenantId: string, data: any) {
    const order = await this.getOrderById(orderId, tenantId);
    if (order.status !== "OPEN") {
      throw new BadRequestError("Orders can only be modified in OPEN status");
    }

    const orderItem = await orderRepository.findOrderItemById(orderItemId);
    if (!orderItem || orderItem.orderId !== orderId) {
      throw new NotFoundError("Order item not found in this order");
    }

    await orderRepository.updateOrderItem(orderItemId, {
      quantity: data.quantity,
      notes: data.notes !== undefined ? data.notes : orderItem.notes,
    });

    const updatedOrder = await this.recalculateTotals(orderId, tenantId);
    socketService.emitToTenant(tenantId, "order-updated", updatedOrder);
    return updatedOrder;
  }

  async removeItemFromOrder(orderId: string, orderItemId: string, tenantId: string) {
    const order = await this.getOrderById(orderId, tenantId);
    if (order.status !== "OPEN") {
      throw new BadRequestError("Orders can only be modified in OPEN status");
    }

    const orderItem = await orderRepository.findOrderItemById(orderItemId);
    if (!orderItem || orderItem.orderId !== orderId) {
      throw new NotFoundError("Order item not found in this order");
    }

    await orderRepository.deleteOrderItem(orderItemId);

    const updatedOrder = await this.recalculateTotals(orderId, tenantId);
    socketService.emitToTenant(tenantId, "order-updated", updatedOrder);
    return updatedOrder;
  }
}

export const orderService = new OrderService();
