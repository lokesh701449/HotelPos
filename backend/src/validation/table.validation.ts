import { z } from "zod";

export const createTableSchema = z.object({
  number: z.number().int().positive("Table number must be a positive integer"),
  capacity: z.number().int().positive("Table capacity must be a positive integer"),
});

export const updateTableSchema = z.object({
  number: z.number().int().positive("Table number must be a positive integer").optional(),
  capacity: z.number().int().positive("Table capacity must be a positive integer").optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "BILLING"]).optional(),
});
