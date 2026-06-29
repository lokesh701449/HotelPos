import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const userRouter = Router();

userRouter.get("/", authenticate, authorizeRoles("ADMIN", "MANAGER"), userController.getStaff);
userRouter.post("/", authenticate, authorizeRoles("ADMIN", "MANAGER"), userController.createStaff);

export default userRouter;
