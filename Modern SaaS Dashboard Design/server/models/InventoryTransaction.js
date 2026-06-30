import mongoose from "mongoose";

const inventoryTransactionSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["RECEIVE", "ISSUE", "CONSUME", "WASTE", "SPOILAGE", "ADJUST"],
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    baseQuantity: {
      type: Number,
      required: true, // Signed quantity in baseUnit (e.g., negative for ISSUE/CONSUME/WASTE/SPOILAGE)
    },
    baseUnit: {
      type: String,
      required: true,
    },
    source: {
      type: String, // e.g., PO-1234, Main Kitchen, Manual adjustment
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const InventoryTransaction = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema
);
export default InventoryTransaction;
