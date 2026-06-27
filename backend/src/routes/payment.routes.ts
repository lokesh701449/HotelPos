import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const paymentRouter = Router();

paymentRouter.get("/", authenticate, authorizeRoles("ADMIN", "MANAGER", "CASHIER"), paymentController.getPayments);
paymentRouter.get("/:id", authenticate, authorizeRoles("ADMIN", "MANAGER", "CASHIER"), paymentController.getPaymentById);

paymentRouter.post("/", authenticate, authorizeRoles("ADMIN", "MANAGER", "CASHIER"), paymentController.processPayment);

// POS Invoice receipt endpoint
paymentRouter.get("/:id/invoice", authenticate, paymentController.getInvoice);

export default paymentRouter;
