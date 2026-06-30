import UnitConversion from "../models/UnitConversion.js";

/**
 * Converts a quantity from one unit to another.
 * Checks ingredient-specific conversions first, then global conversions.
 * Supports both forward and reverse conversion paths.
 * 
 * @param {string} ingredientId - The ID of the ingredient (optional)
 * @param {number} quantity - The quantity to convert
 * @param {string} fromUnit - The unit to convert from
 * @param {string} toUnit - The unit to convert to
 * @returns {Promise<number>} - The converted quantity
 */
export const convertQuantity = async (ingredientId, quantity, fromUnit, toUnit) => {
  if (!fromUnit || !toUnit || fromUnit.toLowerCase() === toUnit.toLowerCase()) {
    return quantity;
  }

  const fUnit = fromUnit.trim().toLowerCase();
  const tUnit = toUnit.trim().toLowerCase();

  // 1. Try to find a direct conversion for this specific ingredient
  if (ingredientId) {
    const directIng = await UnitConversion.findOne({
      ingredientId,
      fromUnit: { $regex: new RegExp(`^${fUnit}$`, "i") },
      toUnit: { $regex: new RegExp(`^${tUnit}$`, "i") },
    });
    if (directIng) {
      return quantity * directIng.multiplier;
    }

    const reverseIng = await UnitConversion.findOne({
      ingredientId,
      fromUnit: { $regex: new RegExp(`^${tUnit}$`, "i") },
      toUnit: { $regex: new RegExp(`^${fUnit}$`, "i") },
    });
    if (reverseIng) {
      return quantity / reverseIng.multiplier;
    }
  }

  // 2. Try to find a global conversion (where ingredientId is null)
  const directGlobal = await UnitConversion.findOne({
    ingredientId: null,
    fromUnit: { $regex: new RegExp(`^${fUnit}$`, "i") },
    toUnit: { $regex: new RegExp(`^${tUnit}$`, "i") },
  });
  if (directGlobal) {
    return quantity * directGlobal.multiplier;
  }

  const reverseGlobal = await UnitConversion.findOne({
    ingredientId: null,
    fromUnit: { $regex: new RegExp(`^${tUnit}$`, "i") },
    toUnit: { $regex: new RegExp(`^${fUnit}$`, "i") },
  });
  if (reverseGlobal) {
    return quantity / reverseGlobal.multiplier;
  }

  // 3. Fallback: standard hardcoded metric conversions if not found in db
  if (fUnit === "kg" && tUnit === "g") return quantity * 1000;
  if (fUnit === "g" && tUnit === "kg") return quantity / 1000;
  if (fUnit === "l" && tUnit === "ml") return quantity * 1000;
  if (fUnit === "ml" && tUnit === "l") return quantity / 1000;

  // If no conversion found, log a warning and return quantity unmodified
  console.warn(`No conversion path found from ${fromUnit} to ${toUnit} for ingredient ${ingredientId}`);
  return quantity;
};

/**
 * Helper to convert quantity to base unit
 */
export const convertToBaseUnit = async (ingredient, quantity, unit) => {
  return await convertQuantity(ingredient._id, quantity, unit, ingredient.baseUnit);
};

/**
 * Helper to convert quantity from base unit back to display unit
 */
export const convertFromBaseUnit = async (ingredient, quantity, unit) => {
  return await convertQuantity(ingredient._id, quantity, ingredient.baseUnit, unit);
};
