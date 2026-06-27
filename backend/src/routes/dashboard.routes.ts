import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const dashboardRouter = Router();

// Only ADMIN and MANAGER roles can query the aggregate dashboard summary
dashboardRouter.get("/summary", authenticate, authorizeRoles("ADMIN", "MANAGER"), dashboardController.getSummary);

export default dashboardRouter;
