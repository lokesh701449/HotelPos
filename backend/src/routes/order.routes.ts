import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const orderRouter = Router();

orderRouter.get("/", authenticate, orderController.getOrders);
orderRouter.get("/:id", authenticate, orderController.getOrderById);

orderRouter.post("/", authenticate, authorizeRoles("ADMIN", "MANAGER", "WAITER"), orderController.createOrder);
orderRouter.patch("/:id", authenticate, authorizeRoles("ADMIN", "MANAGER", "WAITER", "CHEF", "CASHIER"), orderController.updateOrderStatus);

// Order item actions
orderRouter.post("/:id/items", authenticate, authorizeRoles("ADMIN", "MANAGER", "WAITER"), orderController.addItem);
orderRouter.patch("/:id/items/:itemId", authenticate, authorizeRoles("ADMIN", "MANAGER", "WAITER"), orderController.updateItemQuantity);
orderRouter.delete("/:id/items/:itemId", authenticate, authorizeRoles("ADMIN", "MANAGER", "WAITER"), orderController.removeItem);

export default orderRouter;
