import express from "express";
import { getVendors, createVendor } from "../controllers/vendorController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getVendors)
  .post(restrictTo("Purchase Manager", "Admin"), createVendor);

export default router;
