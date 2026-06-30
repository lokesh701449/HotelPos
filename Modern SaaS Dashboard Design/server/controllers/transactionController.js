import InventoryTransaction from "../models/InventoryTransaction.js";
import Ingredient from "../models/Ingredient.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import { convertToBaseUnit } from "../services/conversion.js";
import Alert from "../models/Alert.js";
import { getStockBalance } from "../services/ledger.js";

// Helper to create and save transaction
const createTransaction = async ({
  propertyId,
  ingredientId,
  type,
  quantity,
  unit,
  source,
  createdBy,
  notes,
}) => {
  const ingredient = await Ingredient.findById(ingredientId);
  if (!ingredient) {
    throw new Error("Ingredient not found");
  }

  // Calculate base quantity using unit conversion
  const baseQty = await convertToBaseUnit(ingredient, quantity, unit);

  // Set sign based on transaction type
  let signedBaseQty = baseQty;
  if (["ISSUE", "CONSUME", "WASTE", "SPOILAGE"].includes(type)) {
    signedBaseQty = -Math.abs(baseQty);
  } else if (type === "ADJUST") {
    // For ADJUST, we accept the quantity's sign as provided in request
    signedBaseQty = baseQty; 
  } else {
    // RECEIVE is positive
    signedBaseQty = Math.abs(baseQty);
  }

  const transaction = await InventoryTransaction.create({
    propertyId,
    ingredientId,
    type,
    quantity,
    unit,
    baseQuantity: signedBaseQty,
    baseUnit: ingredient.baseUnit,
    source: source || "Manual Entry",
    createdBy,
    notes,
  });

  // After saving a transaction that decreases stock, check for par level breach to create an Alert
  if (["ISSUE", "CONSUME", "WASTE", "SPOILAGE", "ADJUST"].includes(type)) {
    const currentBaseStock = await getStockBalance(propertyId, ingredientId);
    
    // Convert par level to base unit
    const parBase = await convertToBaseUnit(ingredient, ingredient.parLevel, ingredient.unit);

    if (currentBaseStock < parBase) {
      const displayStock = currentBaseStock / (baseQty / quantity); // estimate or recalculate
      const isCritical = currentBaseStock < parBase * 0.2;
      
      await Alert.create({
        propertyId,
        ingredientId,
        type: isCritical ? "critical" : "low-stock",
        message: `${ingredient.name} stock (${displayStock.toFixed(1)} ${ingredient.unit}) is below par level (${ingredient.parLevel} ${ingredient.unit}).`,
        status: "active",
      });
    }
  }

  return transaction;
};

/**
 * @desc    Record receipt of delivery (increments stock)
 * @route   POST /api/transactions/receive
 * @access  Private/Store Keeper/Admin
 */
export const receiveDelivery = async (req, res) => {
  const { propertyId, ingredientId, quantity, unit, source, notes, poId, isShort, isDamaged } = req.body;

  try {
    let customNotes = notes || "";
    if (isShort) customNotes += " [Flagged: Short Quantity]";
    if (isDamaged) customNotes += " [Flagged: Damaged Quantity]";

    const transaction = await createTransaction({
      propertyId: propertyId || req.propertyId,
      ingredientId,
      type: "RECEIVE",
      quantity,
      unit,
      source: source || (poId ? `PO #${poId}` : "Direct Delivery"),
      createdBy: req.user._id,
      notes: customNotes,
    });

    // If associated with a PO, update the status
    if (poId) {
      const po = await PurchaseOrder.findById(poId);
      if (po) {
        // If it's a partial delivery, mark it as completed or keep as sent. Let's make it Completed.
        po.status = isShort ? "sent" : "completed"; // if short, keep active as sent, else complete
        await po.save();
      }
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Issue stock to kitchen (decrements store stock)
 * @route   POST /api/transactions/issue
 * @access  Private/Store Keeper/Admin
 */
export const issueStock = async (req, res) => {
  const { propertyId, ingredientId, quantity, unit, source, notes } = req.body;

  try {
    const transaction = await createTransaction({
      propertyId: propertyId || req.propertyId,
      ingredientId,
      type: "ISSUE",
      quantity,
      unit,
      source: source || "Main Kitchen",
      createdBy: req.user._id,
      notes,
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Recipe-based ingredient consumption
 * @route   POST /api/transactions/consume
 * @access  Private/Head Chef/Admin
 */
export const consumeStock = async (req, res) => {
  const { propertyId, ingredientId, quantity, unit, source, notes } = req.body;

  try {
    const transaction = await createTransaction({
      propertyId: propertyId || req.propertyId,
      ingredientId,
      type: "CONSUME",
      quantity,
      unit,
      source: source || "Recipe Prep",
      createdBy: req.user._id,
      notes,
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Record wastage (decrements stock)
 * @route   POST /api/transactions/waste
 * @access  Private/Store Keeper/Admin
 */
export const wasteStock = async (req, res) => {
  const { propertyId, ingredientId, quantity, unit, source, notes } = req.body;

  try {
    const transaction = await createTransaction({
      propertyId: propertyId || req.propertyId,
      ingredientId,
      type: "WASTE",
      quantity,
      unit,
      source: source || "Kitchen Wastage",
      createdBy: req.user._id,
      notes,
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Record spoilage (decrements stock)
 * @route   POST /api/transactions/spoilage
 * @access  Private/Store Keeper/Admin
 */
export const spoilStock = async (req, res) => {
  const { propertyId, ingredientId, quantity, unit, source, notes } = req.body;

  try {
    const transaction = await createTransaction({
      propertyId: propertyId || req.propertyId,
      ingredientId,
      type: "SPOILAGE",
      quantity,
      unit,
      source: source || "Store Spoilage",
      createdBy: req.user._id,
      notes,
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Record manual stock adjustment (increments or decrements)
 * @route   POST /api/transactions/adjust
 * @access  Private/Store Keeper/Admin
 */
export const adjustStock = async (req, res) => {
  const { propertyId, ingredientId, quantity, unit, source, notes } = req.body;

  try {
    const transaction = await createTransaction({
      propertyId: propertyId || req.propertyId,
      ingredientId,
      type: "ADJUST",
      quantity,
      unit,
      source: source || "Audit Adjustment",
      createdBy: req.user._id,
      notes,
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all transactions for the property
 * @route   GET /api/transactions
 * @access  Private
 */
export const getTransactions = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;
  const { type, ingredientId } = req.query;

  if (!propertyId) {
    return res.status(400).json({ message: "Property ID context is required" });
  }

  try {
    let query = { propertyId };
    
    if (type && type !== "all") {
      query.type = type.toUpperCase();
    }
    
    if (ingredientId) {
      query.ingredientId = ingredientId;
    }

    const transactions = await InventoryTransaction.find(query)
      .populate("ingredientId", "name unit sku value")
      .populate("createdBy", "name role")
      .sort({ timestamp: -1 })
      .limit(100);

    const formattedTxns = transactions.map((t) => ({
      id: t._id,
      date: t.timestamp.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      }),
      type: t.type.toLowerCase(),
      ingredient: t.ingredientId ? t.ingredientId.name : "Unknown",
      sku: t.ingredientId ? t.ingredientId.sku : "N/A",
      quantity: Math.abs(t.quantity),
      unit: t.unit,
      value: Math.max(0, Math.round(Math.abs(t.quantity) * (t.ingredientId ? t.ingredientId.value : 0))),
      by: t.createdBy ? t.createdBy.name : "System",
      reference: t.source || "Manual Entry",
      notes: t.notes || "",
    }));

    res.json(formattedTxns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
