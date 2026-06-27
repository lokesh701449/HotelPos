import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import {
  createOrderSchema,
  addOrderItemSchema,
  updateOrderItemQtySchema,
  updateOrderStatusSchema,
} from "../validation/order.validation";

export class OrderController {
  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const status = req.query.status as string | undefined;
      const orders = await orderService.getAllOrders(tenantId, status);
      res.status(200).json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const order = await orderService.getOrderById(id, tenantId);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const waiterId = (req as any).user.id;
      const validatedData = createOrderSchema.parse(req.body);
      const order = await orderService.createOrder(tenantId, waiterId, validatedData);
      res.status(201).json({ success: true, message: "Order created successfully", data: order });
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const validatedData = updateOrderStatusSchema.parse(req.body);
      const order = await orderService.updateOrderStatus(id, tenantId, validatedData.status);
      res.status(200).json({ success: true, message: "Order status updated successfully", data: order });
    } catch (err) {
      next(err);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const orderId = req.params.id as string;
      const validatedData = addOrderItemSchema.parse(req.body);
      const order = await orderService.addItemToOrder(orderId, tenantId, validatedData);
      res.status(200).json({ success: true, message: "Item added to order", data: order });
    } catch (err) {
      next(err);
    }
  }

  async updateItemQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const orderId = req.params.id as string;
      const orderItemId = req.params.itemId as string;
      const validatedData = updateOrderItemQtySchema.parse(req.body);
      const order = await orderService.updateOrderItemQuantity(orderId, orderItemId, tenantId, validatedData);
      res.status(200).json({ success: true, message: "Order item quantity updated", data: order });
    } catch (err) {
      next(err);
    }
  }

  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const orderId = req.params.id as string;
      const orderItemId = req.params.itemId as string;
      const order = await orderService.removeItemFromOrder(orderId, orderItemId, tenantId);
      res.status(200).json({ success: true, message: "Item removed from order", data: order });
    } catch (err) {
      next(err);
    }
  }
}

export const orderController = new OrderController();
