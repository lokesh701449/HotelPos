import express from "express";
import {
  receiveDelivery,
  issueStock,
  consumeStock,
  wasteStock,
  spoilStock,
  adjustStock,
  getTransactions,
} from "../controllers/transactionController.js";
import { protect, restrictTo, requirePropertyAccess } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(requirePropertyAccess);

router.get("/", getTransactions);

router.post("/receive", restrictTo("Store Keeper", "Admin"), receiveDelivery);
router.post("/issue", restrictTo("Store Keeper", "Admin"), issueStock);
router.post("/consume", restrictTo("Head Chef", "Admin"), consumeStock);
router.post("/waste", restrictTo("Store Keeper", "Head Chef", "Admin"), wasteStock);
router.post("/spoilage", restrictTo("Store Keeper", "Admin"), spoilStock);
router.post("/adjust", restrictTo("Store Keeper", "Admin"), adjustStock);

export default router;
