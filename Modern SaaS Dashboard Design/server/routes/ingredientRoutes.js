import express from "express";
import {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "../controllers/ingredientController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getIngredients)
  .post(restrictTo("Admin"), createIngredient);

router.route("/:id")
  .get(getIngredientById)
  .patch(restrictTo("Admin"), updateIngredient)
  .delete(restrictTo("Admin"), deleteIngredient);

export default router;
