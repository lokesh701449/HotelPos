import InventoryTransaction from "../models/InventoryTransaction.js";
import Ingredient from "../models/Ingredient.js";
import { convertQuantity } from "../services/conversion.js";

/**
 * @desc    Get Food Cost Report (Value of consumption grouped by category)
 * @route   GET /api/reports/food-cost
 * @access  Private/F&B Manager/Admin
 */
export const getFoodCostReport = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;
  const days = req.query.days ? parseInt(req.query.days) : 30;

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const txns = await InventoryTransaction.find({
      propertyId,
      type: "CONSUME",
      timestamp: { $gte: startDate },
    }).populate("ingredientId");

    const categoryCosts = {};
    let totalCost = 0;

    for (const t of txns) {
      if (!t.ingredientId) continue;
      // Value = displayQty * unit price
      const displayQty = await convertQuantity(
        t.ingredientId._id,
        t.baseQuantity,
        t.ingredientId.baseUnit,
        t.ingredientId.unit
      );
      const cost = Math.abs(displayQty * t.ingredientId.value);
      
      const cat = t.ingredientId.category || "Others";
      if (!categoryCosts[cat]) categoryCosts[cat] = 0;
      categoryCosts[cat] += cost;
      totalCost += cost;
    }

    const categories = Object.keys(categoryCosts).map((name) => ({
      name,
      value: Math.round(categoryCosts[name]),
      color:
        name === "Meat"
          ? "#EF4444"
          : name === "Dairy"
          ? "#3B82F6"
          : name === "Vegetables"
          ? "#10B981"
          : name === "Grains"
          ? "#F59E0B"
          : "#8B5CF6",
    }));

    res.json({
      totalCost: Math.round(totalCost),
      foodCostPercent: 32.5, // simulated food cost percentage
      categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get Theoretical vs Actual Variance Report
 * @route   GET /api/reports/variance
 * @access  Private/F&B Manager/Admin
 */
export const getVarianceReport = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;
  const days = req.query.days ? parseInt(req.query.days) : 30;

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch all ingredients
    const ingredients = await Ingredient.find({
      $or: [{ propertyId: null }, { propertyId }],
    });

    const report = [];

    for (const ing of ingredients) {
      const txns = await InventoryTransaction.find({
        propertyId,
        ingredientId: ing._id,
        timestamp: { $gte: startDate },
      });

      let theoreticalBase = 0; // CONSUME transactions
      let actualOutBase = 0;    // ISSUE, WASTE, SPOILAGE, ADJUST transactions that are negative

      for (const t of txns) {
        if (t.type === "CONSUME") {
          theoreticalBase += Math.abs(t.baseQuantity);
        } else if (["ISSUE", "WASTE", "SPOILAGE"].includes(t.type)) {
          actualOutBase += Math.abs(t.baseQuantity);
        } else if (t.type === "ADJUST" && t.baseQuantity < 0) {
          actualOutBase += Math.abs(t.baseQuantity);
        }
      }

      // Convert back to display unit
      const theoretical = await convertQuantity(ing._id, theoreticalBase, ing.baseUnit, ing.unit);
      const actualOut = await convertQuantity(ing._id, actualOutBase, ing.baseUnit, ing.unit);

      // Variance = actual out - theoretical consumption
      const variance = Math.max(0, actualOut - theoretical);
      const varianceVal = Math.round(variance * ing.value);

      if (actualOut > 0 || theoretical > 0) {
        let explanation = "No significant variance";
        if (variance > actualOut * 0.1) {
          explanation = "High kitchen wastage / over-portioning";
        }

        report.push({
          ingredient: ing.name,
          category: ing.category,
          sku: ing.sku,
          theoretical: Number(theoretical.toFixed(2)),
          actual: Number(actualOut.toFixed(2)),
          variance: Number(variance.toFixed(2)),
          varianceValue: varianceVal,
          unit: ing.unit,
          explanation,
        });
      }
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get Wastage & Spoilage Report
 * @route   GET /api/reports/wastage
 * @access  Private/F&B Manager/Admin
 */
export const getWastageReport = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;
  const days = req.query.days ? parseInt(req.query.days) : 30;

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const txns = await InventoryTransaction.find({
      propertyId,
      type: { $in: ["WASTE", "SPOILAGE"] },
      timestamp: { $gte: startDate },
    }).populate("ingredientId").populate("createdBy", "name");

    const items = txns.map((t) => {
      const value = Math.max(0, Math.round(Math.abs(t.quantity) * (t.ingredientId ? t.ingredientId.value : 0)));
      return {
        id: t._id,
        date: t.timestamp.toLocaleDateString("en-IN"),
        ingredient: t.ingredientId ? t.ingredientId.name : "Unknown",
        category: t.ingredientId ? t.ingredientId.category : "N/A",
        qty: Math.abs(t.quantity),
        unit: t.unit,
        value,
        type: t.type.toLowerCase(),
        reportedBy: t.createdBy ? t.createdBy.name : "System",
        reason: t.notes || "Not specified",
      };
    });

    const totalWastageCost = items.reduce((sum, item) => sum + item.value, 0);

    res.json({
      totalCost: totalWastageCost,
      items,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get Month-End Reconciliation Report
 * @route   GET /api/reports/month-end-reconciliation
 * @access  Private/F&B Manager/Admin
 */
export const getMonthEndReconciliation = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;

  try {
    // Return aggregate counts and summary
    const totalIngredients = await Ingredient.countDocuments({
      $or: [{ propertyId: null }, { propertyId }],
    });

    const recentAudits = await InventoryTransaction.find({
      propertyId,
      type: "ADJUST",
    })
      .populate("ingredientId", "name SKU")
      .populate("createdBy", "name")
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      status: "ready",
      totalIngredients,
      auditAdjustmentsCount: recentAudits.length,
      recentAdjustments: recentAudits.map((a) => ({
        ingredient: a.ingredientId ? a.ingredientId.name : "Unknown",
        qty: a.quantity,
        unit: a.unit,
        date: a.timestamp.toLocaleDateString("en-IN"),
        by: a.createdBy ? a.createdBy.name : "System",
        notes: a.notes,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
