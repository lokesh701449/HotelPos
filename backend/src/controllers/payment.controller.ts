import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";
import { createPaymentSchema } from "../validation/payment.validation";

export class PaymentController {
  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const payments = await paymentService.getAllPayments(tenantId);
      res.status(200).json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  }

  async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const payment = await paymentService.getPaymentById(id, tenantId);
      res.status(200).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  }

  async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const validatedData = createPaymentSchema.parse(req.body);
      const result = await paymentService.processPayment(tenantId, validatedData);
      res.status(201).json({ success: true, message: "Payment processed successfully", data: result });
    } catch (err) {
      next(err);
    }
  }

  async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = req.params.id as string;
      const invoiceText = await paymentService.generateInvoice(id, tenantId);

      res.setHeader("Content-Type", "text/plain");
      res.status(200).send(invoiceText);
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
