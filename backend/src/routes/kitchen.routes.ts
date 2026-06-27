import { Router } from "express";
import { kitchenController } from "../controllers/kitchen.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const kitchenRouter = Router();

kitchenRouter.get("/", authenticate, kitchenController.getTickets);
kitchenRouter.get("/:id", authenticate, kitchenController.getTicketById);
kitchenRouter.patch("/:id", authenticate, authorizeRoles("ADMIN", "MANAGER", "CHEF"), kitchenController.updateTicketStatus);

export default kitchenRouter;
