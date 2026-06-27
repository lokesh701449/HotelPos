import { Router } from "express";
import { menuController } from "../controllers/menu.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const menuRouter = Router();

menuRouter.get("/", authenticate, menuController.getMenuItems);
menuRouter.get("/:id", authenticate, menuController.getMenuItemById);

menuRouter.post("/", authenticate, authorizeRoles("ADMIN", "MANAGER"), menuController.createMenuItem);
menuRouter.patch("/:id", authenticate, authorizeRoles("ADMIN", "MANAGER"), menuController.updateMenuItem);
menuRouter.delete("/:id", authenticate, authorizeRoles("ADMIN", "MANAGER"), menuController.deleteMenuItem);

export default menuRouter;
