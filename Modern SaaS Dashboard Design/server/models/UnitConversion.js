import mongoose from "mongoose";

const unitConversionSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      default: null, // Null indicates global conversion
    },
    fromUnit: {
      type: String,
      required: true,
      trim: true,
    },
    toUnit: {
      type: String,
      required: true,
      trim: true,
    },
    multiplier: {
      type: Number,
      required: true, // e.g., 1000 for kg to g, or 12 for dozen to piece
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate conversion paths
unitConversionSchema.index({ ingredientId: 1, fromUnit: 1, toUnit: 1 }, { unique: true });

const UnitConversion = mongoose.model("UnitConversion", unitConversionSchema);
export default UnitConversion;
