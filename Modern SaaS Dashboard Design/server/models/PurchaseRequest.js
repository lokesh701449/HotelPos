import mongoose from "mongoose";

const purchaseRequestItemSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
});

const purchaseRequestSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    // Support single item request directly (or first item of items array)
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
    },
    quantity: {
      type: Number,
    },
    unit: {
      type: String,
    },
    // Support multi-item request
    items: [purchaseRequestItemSchema],
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    priority: {
      type: String,
      required: true,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "ordered"],
      default: "pending",
    },
    reason: {
      type: String,
      required: true,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Populate single item fields if items is updated
purchaseRequestSchema.pre("save", function () {
  if (this.items && this.items.length > 0) {
    this.ingredientId = this.items[0].ingredientId;
    this.quantity = this.items[0].qty;
    this.unit = this.items[0].unit;
  }
});

const PurchaseRequest = mongoose.model("PurchaseRequest", purchaseRequestSchema);
export default PurchaseRequest;
