import Ingredient from "../models/Ingredient.js";

/**
 * @desc    Get all ingredients (global + private to property)
 * @route   GET /api/ingredients
 * @access  Private
 */
export const getIngredients = async (req, res) => {
  const propertyId = req.query.propertyId;

  try {
    let query = {};
    if (propertyId) {
      query = { $or: [{ propertyId: null }, { propertyId }] };
    }
    const ingredients = await Ingredient.find(query);
    const mapped = ingredients.map((ing) => ({
      id: ing._id,
      ingredient: ing.name,
      name: ing.name,
      category: ing.category,
      sku: ing.sku,
      description: ing.description,
      unit: ing.unit,
      baseUnit: ing.baseUnit,
      parLevel: ing.parLevel,
      value: ing.value,
      supplier: ing.supplier,
      leadTime: ing.leadTime,
      storageLocation: ing.storageLocation,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get a single ingredient details
 * @route   GET /api/ingredients/:id
 * @access  Private
 */
export const getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (ingredient) {
      res.json({
        id: ingredient._id,
        ingredient: ingredient.name,
        name: ingredient.name,
        category: ingredient.category,
        sku: ingredient.sku,
        description: ingredient.description,
        unit: ingredient.unit,
        baseUnit: ingredient.baseUnit,
        parLevel: ingredient.parLevel,
        value: ingredient.value,
        supplier: ingredient.supplier,
        leadTime: ingredient.leadTime,
        storageLocation: ingredient.storageLocation,
      });
    } else {
      res.status(404).json({ message: "Ingredient not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a new ingredient
 * @route   POST /api/ingredients
 * @access  Private/Admin
 */
export const createIngredient = async (req, res) => {
  const {
    name,
    category,
    sku,
    description,
    propertyId,
    parLevel,
    unit,
    baseUnit,
    supplier,
    leadTime,
    storageLocation,
    value,
  } = req.body;

  try {
    const skuExists = await Ingredient.findOne({ sku });
    if (skuExists) {
      return res.status(400).json({ message: "SKU already exists" });
    }

    const ingredient = await Ingredient.create({
      name,
      category,
      sku,
      description,
      propertyId: propertyId || null,
      parLevel,
      unit,
      baseUnit,
      supplier,
      leadTime,
      storageLocation,
      value,
    });

    res.status(201).json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update ingredient details
 * @route   PATCH /api/ingredients/:id
 * @access  Private/Admin
 */
export const updateIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);

    if (ingredient) {
      ingredient.name = req.body.name || ingredient.name;
      ingredient.category = req.body.category || ingredient.category;
      ingredient.sku = req.body.sku || ingredient.sku;
      ingredient.description = req.body.description || ingredient.description;
      ingredient.propertyId = req.body.propertyId !== undefined ? req.body.propertyId : ingredient.propertyId;
      ingredient.parLevel = req.body.parLevel !== undefined ? req.body.parLevel : ingredient.parLevel;
      ingredient.unit = req.body.unit || ingredient.unit;
      ingredient.baseUnit = req.body.baseUnit || ingredient.baseUnit;
      ingredient.supplier = req.body.supplier || ingredient.supplier;
      ingredient.leadTime = req.body.leadTime !== undefined ? req.body.leadTime : ingredient.leadTime;
      ingredient.storageLocation = req.body.storageLocation || ingredient.storageLocation;
      ingredient.value = req.body.value !== undefined ? req.body.value : ingredient.value;

      const updatedIngredient = await ingredient.save();
      res.json(updatedIngredient);
    } else {
      res.status(404).json({ message: "Ingredient not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete an ingredient
 * @route   DELETE /api/ingredients/:id
 * @access  Private/Admin
 */
export const deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (ingredient) {
      await ingredient.deleteOne();
      res.json({ message: "Ingredient removed" });
    } else {
      res.status(404).json({ message: "Ingredient not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
