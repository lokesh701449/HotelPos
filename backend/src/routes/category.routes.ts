import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const categoryRouter = Router();

categoryRouter.get("/", authenticate, categoryController.getCategories);
categoryRouter.get("/:id", authenticate, categoryController.getCategoryById);

categoryRouter.post("/", authenticate, authorizeRoles("ADMIN", "MANAGER"), categoryController.createCategory);
categoryRouter.patch("/:id", authenticate, authorizeRoles("ADMIN", "MANAGER"), categoryController.updateCategory);
categoryRouter.delete("/:id", authenticate, authorizeRoles("ADMIN", "MANAGER"), categoryController.deleteCategory);

export default categoryRouter;
