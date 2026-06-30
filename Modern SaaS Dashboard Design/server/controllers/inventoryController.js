import { getPropertyInventory, getStockBalance, getChainInventorySummary } from "../services/ledger.js";
import Ingredient from "../models/Ingredient.js";
import InventoryTransaction from "../models/InventoryTransaction.js";
import { convertQuantity } from "../services/conversion.js";

/**
 * @desc    Get live stock levels for all ingredients at the current property
 * @route   GET /api/inventory
 * @access  Private
 */
export const getInventory = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;

  if (!propertyId) {
    return res.status(400).json({ message: "Property ID context is required" });
  }

  try {
    const inventory = await getPropertyInventory(propertyId);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get live stock levels & details for a single ingredient
 * @route   GET /api/inventory/:ingredientId
 * @access  Private
 */
export const getIngredientInventoryDetails = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;
  const { ingredientId } = req.params;

  if (!propertyId) {
    return res.status(400).json({ message: "Property ID context is required" });
  }

  try {
    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    const baseStock = await getStockBalance(propertyId, ingredientId);
    const displayStock = await convertQuantity(
      ingredientId,
      baseStock,
      ingredient.baseUnit,
      ingredient.unit
    );

    // Get transaction history for this item
    const transactions = await InventoryTransaction.find({
      propertyId,
      ingredientId,
    })
      .populate("createdBy", "name")
      .sort({ timestamp: -1 })
      .limit(50);

    const history = transactions.map((t) => ({
      id: t._id,
      date: t.timestamp.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      }),
      type: t.type.charAt(0).toUpperCase() + t.type.slice(1).toLowerCase(),
      quantity: t.quantity,
      unit: t.unit,
      by: t.createdBy ? t.createdBy.name : "System",
      notes: t.notes,
      source: t.source,
    }));

    res.json({
      ingredient: ingredient.name,
      category: ingredient.category,
      sku: ingredient.sku,
      description: ingredient.description,
      available: Math.max(0, Number(displayStock.toFixed(2))),
      unit: ingredient.unit,
      parLevel: ingredient.parLevel,
      supplier: ingredient.supplier || "N/A",
      leadTime: ingredient.leadTime,
      storageLocation: ingredient.storageLocation,
      value: Math.max(0, Math.round(displayStock * ingredient.value)),
      unitCost: ingredient.value,
      history,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get low-stock ingredients for the property
 * @route   GET /api/inventory/low-stock
 * @access  Private
 */
export const getLowStockInventory = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;

  if (!propertyId) {
    return res.status(400).json({ message: "Property ID context is required" });
  }

  try {
    const inventory = await getPropertyInventory(propertyId);
    const lowStock = inventory.filter(
      (item) => item.status === "low" || item.status === "critical" || item.status === "out"
    );
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get chain-wide summary of stock levels aggregated by property
 * @route   GET /api/inventory/chain-summary
 * @access  Private/Purchase Manager/Admin
 */
export const getChainInventory = async (req, res) => {
  try {
    const chainSummary = await getChainInventorySummary();
    res.json(chainSummary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
