import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().uuid("Order ID must be a valid UUID"),
  method: z.enum(["CASH", "CARD", "UPI"]),
  amount: z.number().positive("Payment amount must be a positive number"),
  transactionReference: z.string().optional(),
});
