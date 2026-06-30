import express from "express";
import {
  getStoreKeeperDashboard,
  getChefDashboard,
  getManagerDashboard,
  getPurchaseManagerDashboard,
  getAdminDashboard,
} from "../controllers/dashboardController.js";
import { protect, restrictTo, requirePropertyAccess } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/store-keeper", requirePropertyAccess, restrictTo("Store Keeper", "Admin"), getStoreKeeperDashboard);
router.get("/chef", requirePropertyAccess, restrictTo("Head Chef", "Admin"), getChefDashboard);
router.get("/manager", requirePropertyAccess, restrictTo("F&B Manager", "Admin"), getManagerDashboard);
router.get("/purchase-manager", restrictTo("Purchase Manager", "Admin"), getPurchaseManagerDashboard);
router.get("/admin", restrictTo("Admin"), getAdminDashboard);

export default router;
