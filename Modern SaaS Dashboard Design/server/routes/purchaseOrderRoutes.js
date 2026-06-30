import express from "express";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  generateConsolidatedOrder,
} from "../controllers/purchaseOrderController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getPurchaseOrders)
  .post(restrictTo("Purchase Manager", "Admin"), createPurchaseOrder);

router.post("/generate-consolidated", restrictTo("Purchase Manager", "Admin"), generateConsolidatedOrder);

export default router;
