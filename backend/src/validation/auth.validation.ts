import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "WAITER", "CHEF", "CASHIER"]),
  tenantId: z.string().uuid().optional(),
  tenantName: z.string().optional(),
  brandName: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => data.tenantId || data.tenantName, {
  message: "Either tenantId or tenantName must be provided to associate or create a tenant",
  path: ["tenantId"],
});
