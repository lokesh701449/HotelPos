import express from "express";
import {
  getFoodCostReport,
  getVarianceReport,
  getWastageReport,
  getMonthEndReconciliation,
} from "../controllers/reportController.js";
import { protect, restrictTo, requirePropertyAccess } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(requirePropertyAccess);
router.use(restrictTo("F&B Manager", "Admin"));

router.get("/food-cost", getFoodCostReport);
router.get("/variance", getVarianceReport);
router.get("/wastage", getWastageReport);
router.get("/month-end-reconciliation", getMonthEndReconciliation);

export default router;
