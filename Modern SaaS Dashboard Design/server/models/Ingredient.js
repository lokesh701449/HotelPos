import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null, // Null indicates global ingredient
    },
    parLevel: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      type: String,
      required: true, // Display/Purchase unit (e.g., "kg", "L", "case", "piece")
    },
    baseUnit: {
      type: String,
      required: true, // Base storage unit (e.g., "g", "mL", "piece")
    },
    supplier: {
      type: String,
    },
    leadTime: {
      type: Number, // in days
      default: 1,
    },
    storageLocation: {
      type: String,
    },
    value: {
      type: Number, // Cost per unit (e.g., cost per kg, cost per L)
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Ingredient = mongoose.model("Ingredient", ingredientSchema);
export default Ingredient;
