import express from "express";
import {
  getPurchaseRequests,
  createPurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  adjustPurchaseRequest,
} from "../controllers/purchaseRequestController.js";
import { protect, restrictTo, requirePropertyAccess } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getPurchaseRequests)
  .post(requirePropertyAccess, restrictTo("Head Chef", "Store Keeper", "Admin"), createPurchaseRequest);

router.patch("/:id/approve", restrictTo("F&B Manager", "Admin"), approvePurchaseRequest);
router.patch("/:id/reject", restrictTo("F&B Manager", "Admin"), rejectPurchaseRequest);
router.patch("/:id/adjust", restrictTo("F&B Manager", "Admin"), adjustPurchaseRequest);

export default router;
