import { Router } from "express";
import { tableController } from "../controllers/table.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const tableRouter = Router();

tableRouter.get("/", authenticate, tableController.getTables);
tableRouter.get("/:id", authenticate, tableController.getTableById);

tableRouter.post("/", authenticate, authorizeRoles("ADMIN", "MANAGER"), tableController.createTable);
tableRouter.patch("/:id", authenticate, authorizeRoles("ADMIN", "MANAGER", "WAITER"), tableController.updateTable);
tableRouter.delete("/:id", authenticate, authorizeRoles("ADMIN", "MANAGER"), tableController.deleteTable);

export default tableRouter;
