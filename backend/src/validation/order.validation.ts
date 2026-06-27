import { z } from "zod";

export const orderItemInputSchema = z.object({
  menuItemId: z.string().uuid("Menu item ID must be a valid UUID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  tableId: z.string().uuid("Table ID must be a valid UUID"),
  items: z.array(orderItemInputSchema).min(1, "Order must have at least one menu item"),
});

export const addOrderItemSchema = z.object({
  menuItemId: z.string().uuid("Menu item ID must be a valid UUID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  notes: z.string().optional(),
});

export const updateOrderItemQtySchema = z.object({
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["OPEN", "PREPARING", "READY", "SERVED", "PAID", "CANCELLED"]),
});

export const updateKitchenTicketSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "SERVED"]),
});
