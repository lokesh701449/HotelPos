import express from "express";
import { getProperties, createProperty, updateProperty } from "../controllers/propertyController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getProperties)
  .post(restrictTo("Admin"), createProperty);

router.route("/:id")
  .patch(restrictTo("Admin"), updateProperty);

export default router;
