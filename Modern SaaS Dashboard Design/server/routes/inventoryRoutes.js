import express from "express";
import {
  getInventory,
  getIngredientInventoryDetails,
  getLowStockInventory,
  getChainInventory,
} from "../controllers/inventoryController.js";
import { protect, restrictTo, requirePropertyAccess } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/chain-summary", restrictTo("Admin", "Purchase Manager"), getChainInventory);
router.get("/low-stock", requirePropertyAccess, getLowStockInventory);
router.get("/:ingredientId", requirePropertyAccess, getIngredientInventoryDetails);
router.get("/", requirePropertyAccess, getInventory);

export default router;
