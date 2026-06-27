import { z } from "zod";

export const createMenuItemSchema = z.object({
  name: z.string().min(1, "Menu item name is required"),
  description: z.string().default(""),
  price: z.number().positive("Price must be a positive number"),
  prepTime: z.number().int().nonnegative("Prep time must be a non-negative integer"),
  veg: z.boolean(),
  categoryId: z.string().uuid("Category ID must be a valid UUID"),
  available: z.boolean().optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(1, "Menu item name is required").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number").optional(),
  prepTime: z.number().int().nonnegative("Prep time must be a non-negative integer").optional(),
  veg: z.boolean().optional(),
  categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
  available: z.boolean().optional(),
});
