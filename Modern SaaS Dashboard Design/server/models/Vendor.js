import mongoose from "mongoose";

const vendorPriceSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
});

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    contact: {
      type: String,
    },
    address: {
      type: String,
    },
    leadTime: {
      type: Number, // in days
      default: 2,
    },
    priceInfo: [vendorPriceSchema],
  },
  {
    timestamps: true,
  }
);

const Vendor = mongoose.model("Vendor", vendorSchema);
export default Vendor;
