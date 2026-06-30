import express from "express";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  prepareRecipe,
} from "../controllers/recipeController.js";
import { protect, restrictTo, requirePropertyAccess } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(requirePropertyAccess);

router.route("/")
  .get(getRecipes)
  .post(restrictTo("Head Chef", "Admin"), createRecipe);

router.route("/:id")
  .patch(restrictTo("Head Chef", "Admin"), updateRecipe)
  .delete(restrictTo("Head Chef", "Admin"), deleteRecipe);

router.post("/:id/prepare", restrictTo("Head Chef", "Admin"), prepareRecipe);

export default router;
