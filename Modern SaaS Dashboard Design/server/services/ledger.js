import mongoose from "mongoose";
import InventoryTransaction from "../models/InventoryTransaction.js";
import Ingredient from "../models/Ingredient.js";
import { convertQuantity } from "./conversion.js";

/**
 * Calculates current stock balance for a specific ingredient at a property in its baseUnit.
 * 
 * @param {string} propertyId - Property ID
 * @param {string} ingredientId - Ingredient ID
 * @returns {Promise<number>} - Stock balance in base unit
 */
export const getStockBalance = async (propertyId, ingredientId) => {
  const result = await InventoryTransaction.aggregate([
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        ingredientId: new mongoose.Types.ObjectId(ingredientId),
      },
    },
    {
      $group: {
        _id: null,
        balance: { $sum: "$baseQuantity" },
      },
    },
  ]);

  return result.length > 0 ? result[0].balance : 0;
};

/**
 * Calculates inventory levels for all ingredients at a property.
 * Returns each ingredient along with its available stock in display unit and base unit.
 * 
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} - List of ingredients with stock levels
 */
export const getPropertyInventory = async (propertyId) => {
  // Get all ingredients that are either global (propertyId is null) or specific to this property
  const ingredients = await Ingredient.find({
    $or: [{ propertyId: null }, { propertyId }],
  });

  const inventoryList = [];

  for (const ingredient of ingredients) {
    const baseStock = await getStockBalance(propertyId, ingredient._id);
    
    // Convert base stock to display unit
    const displayStock = await convertQuantity(
      ingredient._id,
      baseStock,
      ingredient.baseUnit,
      ingredient.unit
    );

    // Determine status relative to parLevel
    let status = "healthy";
    if (displayStock <= 0) {
      status = "out";
    } else if (displayStock < ingredient.parLevel * 0.2) {
      status = "critical";
    } else if (displayStock < ingredient.parLevel) {
      status = "low";
    }

    // Value = displayStock * unit price
    const value = Math.max(0, Math.round(displayStock * ingredient.value));

    inventoryList.push({
      id: ingredient._id,
      ingredient: ingredient.name,
      category: ingredient.category,
      sku: ingredient.sku,
      description: ingredient.description,
      available: Math.max(0, Number(displayStock.toFixed(2))),
      availableBase: Math.max(0, Number(baseStock.toFixed(2))),
      reserved: 0, // reserved is placeholder or can be calculated if needed
      unit: ingredient.unit,
      baseUnit: ingredient.baseUnit,
      parLevel: ingredient.parLevel,
      supplier: ingredient.supplier || "N/A",
      leadTime: ingredient.leadTime,
      storageLocation: ingredient.storageLocation,
      status,
      value,
    });
  }

  return inventoryList;
};

/**
 * Aggregates inventory across all properties for chain-wide visibility.
 * 
 * @returns {Promise<Array>} - Unified chain inventory list
 */
export const getChainInventorySummary = async () => {
  const ingredients = await Ingredient.find({ propertyId: null }); // Global ingredients
  const allProperties = await mongoose.model("Property").find();
  const summary = [];

  for (const ingredient of ingredients) {
    const propertyStocks = [];
    let totalChainStock = 0;
    let totalChainValue = 0;

    for (const prop of allProperties) {
      const baseStock = await getStockBalance(prop._id, ingredient._id);
      const displayStock = await convertQuantity(
        ingredient._id,
        baseStock,
        ingredient.baseUnit,
        ingredient.unit
      );

      const propValue = Math.max(0, Math.round(displayStock * ingredient.value));
      totalChainStock += displayStock;
      totalChainValue += propValue;

      propertyStocks.push({
        propertyId: prop._id,
        propertyName: prop.name,
        stock: Math.max(0, Number(displayStock.toFixed(2))),
        unit: ingredient.unit,
        value: propValue,
      });
    }

    summary.push({
      ingredientId: ingredient._id,
      name: ingredient.name,
      category: ingredient.category,
      sku: ingredient.sku,
      totalStock: Math.max(0, Number(totalChainStock.toFixed(2))),
      unit: ingredient.unit,
      totalValue: totalChainValue,
      properties: propertyStocks,
    });
  }

  return summary;
};
