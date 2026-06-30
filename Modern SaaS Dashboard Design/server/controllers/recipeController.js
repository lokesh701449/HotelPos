import Recipe from "../models/Recipe.js";
import Ingredient from "../models/Ingredient.js";
import InventoryTransaction from "../models/InventoryTransaction.js";
import { convertToBaseUnit } from "../services/conversion.js";
import Alert from "../models/Alert.js";
import { getStockBalance } from "../services/ledger.js";

/**
 * @desc    Get all recipes for property
 * @route   GET /api/recipes
 * @access  Private
 */
export const getRecipes = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;

  if (!propertyId) {
    return res.status(400).json({ message: "Property ID context is required" });
  }

  try {
    const recipes = await Recipe.find({ propertyId }).populate("ingredients.ingredientId", "name unit value");
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a new recipe
 * @route   POST /api/recipes
 * @access  Private/Head Chef/Admin
 */
export const createRecipe = async (req, res) => {
  const { name, category, portions, ingredients, cost, frequency, propertyId } = req.body;

  try {
    const recipe = await Recipe.create({
      name,
      category,
      portions: portions || 1,
      ingredients,
      cost,
      frequency,
      propertyId: propertyId || req.propertyId,
    });

    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update a recipe
 * @route   PATCH /api/recipes/:id
 * @access  Private/Head Chef/Admin
 */
export const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (recipe) {
      recipe.name = req.body.name || recipe.name;
      recipe.category = req.body.category || recipe.category;
      recipe.portions = req.body.portions || recipe.portions;
      recipe.ingredients = req.body.ingredients || recipe.ingredients;
      recipe.cost = req.body.cost !== undefined ? req.body.cost : recipe.cost;
      recipe.frequency = req.body.frequency || recipe.frequency;

      const updatedRecipe = await recipe.save();
      res.json(updatedRecipe);
    } else {
      res.status(404).json({ message: "Recipe not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a recipe
 * @route   DELETE /api/recipes/:id
 * @access  Private/Head Chef/Admin
 */
export const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (recipe) {
      await recipe.deleteOne();
      res.json({ message: "Recipe removed" });
    } else {
      res.status(404).json({ message: "Recipe not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Mark dish prepared (deduct recipe ingredients from stock ledger)
 * @route   POST /api/recipes/:id/prepare
 * @access  Private/Head Chef/Admin
 */
export const prepareRecipe = async (req, res) => {
  const { id } = req.params;
  const { portions } = req.body; // number of portions prepared
  const propertyId = req.query.propertyId || req.propertyId;

  if (!portions || portions <= 0) {
    return res.status(400).json({ message: "Portions count must be greater than 0" });
  }

  try {
    const recipe = await Recipe.findById(id).populate("ingredients.ingredientId");
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const scale = portions / recipe.portions; // portion multiplier

    // 1. Validate sufficient inventory for ALL ingredients first to prevent negative stock
    for (const item of recipe.ingredients) {
      const ingredient = item.ingredientId;
      if (!ingredient) continue;

      const quantityToDeduct = item.qty * scale;
      const baseQtyRequired = await convertToBaseUnit(ingredient, quantityToDeduct, item.unit);
      const currentBaseStock = await getStockBalance(propertyId, ingredient._id);

      if (currentBaseStock < baseQtyRequired) {
        const missingBase = baseQtyRequired - currentBaseStock;
        
        // Convert base stocks to display unit (item.unit)
        // We know baseQtyRequired corresponds to quantityToDeduct.
        // Therefore, displayAvailable = (currentBaseStock / baseQtyRequired) * quantityToDeduct.
        const displayAvailable = (currentBaseStock / baseQtyRequired) * quantityToDeduct;
        const displayMissing = (missingBase / baseQtyRequired) * quantityToDeduct;

        return res.status(400).json({
          success: false,
          ingredient: ingredient.name,
          required: Number(quantityToDeduct.toFixed(2)),
          available: Number(displayAvailable.toFixed(2)),
          missing: Number(displayMissing.toFixed(2)),
          message: `Insufficient stock for ingredient "${ingredient.name}". Required: ${quantityToDeduct.toFixed(2)} ${item.unit}, Available: ${displayAvailable.toFixed(2)} ${item.unit}`
        });
      }
    }

    const transactions = [];

    // 2. Deduct each ingredient (only executes if all ingredients are sufficient)
    for (const item of recipe.ingredients) {
      const ingredient = item.ingredientId;
      if (!ingredient) continue;

      const quantityToDeduct = item.qty * scale;
      
      // Calculate base quantity using unit conversion
      const baseQty = await convertToBaseUnit(ingredient, quantityToDeduct, item.unit);
      const signedBaseQty = -Math.abs(baseQty); // consumption is negative

      const transaction = await InventoryTransaction.create({
        propertyId,
        ingredientId: ingredient._id,
        type: "CONSUME",
        quantity: quantityToDeduct,
        unit: item.unit,
        baseQuantity: signedBaseQty,
        baseUnit: ingredient.baseUnit,
        source: `Recipe Prep: ${recipe.name}`,
        createdBy: req.user._id,
        notes: `Prepared ${portions} portions (Recipe base: ${recipe.portions} portions).`,
      });

      transactions.push(transaction);

      // Check if stock has breached par level
      const currentBaseStock = await getStockBalance(propertyId, ingredient._id);
      const parBase = await convertToBaseUnit(ingredient, ingredient.parLevel, ingredient.unit);

      if (currentBaseStock < parBase) {
        const displayStock = currentBaseStock / (baseQty / quantityToDeduct);
        const isCritical = currentBaseStock < parBase * 0.2;

        await Alert.create({
          propertyId,
          ingredientId: ingredient._id,
          type: isCritical ? "critical" : "low-stock",
          message: `${ingredient.name} stock (${displayStock.toFixed(1)} ${ingredient.unit}) is below par level (${ingredient.parLevel} ${ingredient.unit}) after preparing ${recipe.name}.`,
          status: "active",
        });
      }
    }

    res.status(200).json({
      message: `Successfully prepared ${portions} portions of ${recipe.name}. Stock updated.`,
      deductions: transactions.map((t) => ({
        ingredient: t.ingredientId,
        quantity: t.quantity,
        unit: t.unit,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
