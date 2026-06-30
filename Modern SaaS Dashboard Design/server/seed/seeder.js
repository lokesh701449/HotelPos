import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Property from "../models/Property.js";
import Ingredient from "../models/Ingredient.js";
import UnitConversion from "../models/UnitConversion.js";
import Vendor from "../models/Vendor.js";
import Recipe from "../models/Recipe.js";
import PurchaseRequest from "../models/PurchaseRequest.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import InventoryTransaction from "../models/InventoryTransaction.js";
import Alert from "../models/Alert.js";
import AuditLog from "../models/AuditLog.js";
import { convertToBaseUnit } from "../services/conversion.js";

dotenv.config();

const seed = async () => {
  try {
    console.log("Connecting to database for seeding...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stockroom");
    console.log("Connected successfully. Clearing existing collections...");

    await User.deleteMany();
    await Property.deleteMany();
    await Ingredient.deleteMany();
    await UnitConversion.deleteMany();
    await Vendor.deleteMany();
    await Recipe.deleteMany();
    await PurchaseRequest.deleteMany();
    await PurchaseOrder.deleteMany();
    await InventoryTransaction.deleteMany();
    await Alert.deleteMany();
    await AuditLog.deleteMany();

    console.log("Collections cleared. Seeding properties...");

    // 1. Create Properties
    const propertyA = await Property.create({
      name: "Grand Hyatt Mumbai",
      code: "GH-MUM",
      address: "Off Western Express Highway, Santacruz East, Mumbai, Maharashtra 400055",
      status: "Operational",
    });

    const propertyB = await Property.create({
      name: "Taj Palace Delhi",
      code: "TP-DEL",
      address: "2, Sardar Patel Marg, Diplomatic Enclave, Chanakyapuri, New Delhi, Delhi 110021",
      status: "Operational",
    });

    console.log("Properties seeded. Seeding users...");

    // 2. Create Users
    const storeKeeper = await User.create({
      name: "Kavitha Nair",
      email: "storekeeper@stockroom.com",
      password: "password123", // Will be hashed by pre-save hook
      role: "Store Keeper",
      assignedProperties: [propertyA._id],
    });

    const headChef = await User.create({
      name: "Ramesh Sharma",
      email: "chef@stockroom.com",
      password: "password123",
      role: "Head Chef",
      assignedProperties: [propertyA._id],
    });

    const manager = await User.create({
      name: "Arjun Patel",
      email: "manager@stockroom.com",
      password: "password123",
      role: "F&B Manager",
      assignedProperties: [propertyA._id],
    });

    const purchaseManager = await User.create({
      name: "Meena Rao",
      email: "purchase@stockroom.com",
      password: "password123",
      role: "Purchase Manager",
      assignedProperties: [propertyA._id, propertyB._id],
    });

    const admin = await User.create({
      name: "Admin System",
      email: "admin@stockroom.com",
      password: "password123",
      role: "Admin",
      assignedProperties: [propertyA._id, propertyB._id],
    });

    console.log("Users seeded. Seeding vendors...");

    // 3. Create Vendors
    const vendorMeats = await Vendor.create({
      name: "Fresh Meats Co.",
      email: "sales@freshmeats.com",
      contact: "+91 98765 11111",
      address: "Market Road, Mumbai",
      leadTime: 2,
    });

    const vendorVeggies = await Vendor.create({
      name: "Veggie Suppliers",
      email: "delivery@veggies.com",
      contact: "+91 98765 22222",
      address: "APMC Market, Vashi",
      leadTime: 1,
    });

    const vendorDairy = await Vendor.create({
      name: "Dairy Fresh",
      email: "milk@dairyfresh.com",
      contact: "+91 98765 33333",
      address: "Aarey Colony, Goregaon",
      leadTime: 1,
    });

    const vendorGrains = await Vendor.create({
      name: "Grain Masters",
      email: "orders@grainmasters.com",
      contact: "+91 98765 44444",
      address: "Grain Market, Navi Mumbai",
      leadTime: 3,
    });

    const vendorSpices = await Vendor.create({
      name: "Spice Kingdom",
      email: "spices@spicekingdom.com",
      contact: "+91 98765 55555",
      address: "Khari Baoli, Delhi",
      leadTime: 4,
    });

    console.log("Vendors seeded. Seeding ingredients...");

    // 4. Create Ingredients (Global)
    const ingredientsData = [
      { name: "Chicken Breast", category: "Meat", sku: "CHK-001", unit: "kg", baseUnit: "kg", parLevel: 100, supplier: "Fresh Meats Co.", value: 500, leadTime: 2, storageLocation: "Cold Room A" },
      { name: "Basmati Rice", category: "Grains", sku: "GRC-001", unit: "kg", baseUnit: "g", parLevel: 80, supplier: "Grain Masters", value: 180, leadTime: 3, storageLocation: "Dry Pantry" },
      { name: "Fresh Milk", category: "Dairy", sku: "DRY-001", unit: "L", baseUnit: "mL", parLevel: 50, supplier: "Dairy Fresh", value: 60, leadTime: 1, storageLocation: "Cold Room B" },
      { name: "Tomatoes", category: "Vegetables", sku: "VEG-001", unit: "kg", baseUnit: "kg", parLevel: 60, supplier: "Veggie Suppliers", value: 60, leadTime: 1, storageLocation: "Veggie Crate" },
      { name: "Olive Oil", category: "Oils", sku: "OIL-001", unit: "L", baseUnit: "mL", parLevel: 25, supplier: "Veggie Suppliers", value: 800, leadTime: 2, storageLocation: "Dry Pantry" },
      { name: "Onions", category: "Vegetables", sku: "VEG-002", unit: "kg", baseUnit: "kg", parLevel: 40, supplier: "Veggie Suppliers", value: 40, leadTime: 1, storageLocation: "Veggie Crate" },
      { name: "Cheddar Cheese", category: "Dairy", sku: "DRY-002", unit: "kg", baseUnit: "g", parLevel: 15, supplier: "Dairy Fresh", value: 600, leadTime: 1, storageLocation: "Cold Room B" },
      { name: "Black Pepper", category: "Spices", sku: "SPC-001", unit: "kg", baseUnit: "g", parLevel: 10, supplier: "Spice Kingdom", value: 500, leadTime: 3, storageLocation: "Dry Pantry" },
      { name: "Butter", category: "Dairy", sku: "DRY-003", category: "Dairy", unit: "kg", baseUnit: "g", parLevel: 20, supplier: "Dairy Fresh", value: 400, leadTime: 1, storageLocation: "Cold Room B" },
      { name: "Eggs", category: "Dairy", sku: "DRY-004", category: "Dairy", unit: "piece", baseUnit: "piece", parLevel: 200, supplier: "Dairy Fresh", value: 6, leadTime: 1, storageLocation: "Cold Room B" },
    ];

    const ingredients = {};
    for (const data of ingredientsData) {
      const ing = await Ingredient.create(data);
      ingredients[data.name] = ing;
    }

    console.log("Ingredients seeded. Seeding conversions...");

    // 5. Create Unit Conversions
    await UnitConversion.create({ ingredientId: ingredients["Chicken Breast"]._id, fromUnit: "case", toUnit: "kg", multiplier: 10 });
    await UnitConversion.create({ ingredientId: ingredients["Tomatoes"]._id, fromUnit: "case", toUnit: "kg", multiplier: 15 });
    await UnitConversion.create({ ingredientId: null, fromUnit: "L", toUnit: "mL", multiplier: 1000 });
    await UnitConversion.create({ ingredientId: null, fromUnit: "kg", toUnit: "g", multiplier: 1000 });
    await UnitConversion.create({ ingredientId: ingredients["Eggs"]._id, fromUnit: "crate", toUnit: "piece", multiplier: 30 });

    console.log("Conversions seeded. Seeding recipes...");

    // 6. Create Recipes
    const recipeButterChicken = await Recipe.create({
      name: "Butter Chicken",
      category: "Main Course",
      portions: 50,
      cost: 2750,
      frequency: "Daily",
      propertyId: propertyA._id,
      ingredients: [
        { ingredientId: ingredients["Chicken Breast"]._id, qty: 5, unit: "kg" },
        { ingredientId: ingredients["Fresh Milk"]._id, qty: 2, unit: "L" },
        { ingredientId: ingredients["Tomatoes"]._id, qty: 1, unit: "kg" },
        { ingredientId: ingredients["Butter"]._id, qty: 0.5, unit: "kg" },
      ],
    });

    const recipeBiryani = await Recipe.create({
      name: "Chicken Biryani",
      category: "Main Course",
      portions: 40,
      cost: 3200,
      frequency: "Daily",
      propertyId: propertyA._id,
      ingredients: [
        { ingredientId: ingredients["Chicken Breast"]._id, qty: 4, unit: "kg" },
        { ingredientId: ingredients["Basmati Rice"]._id, qty: 3, unit: "kg" },
        { ingredientId: ingredients["Onions"]._id, qty: 1.5, unit: "kg" },
        { ingredientId: ingredients["Tomatoes"]._id, qty: 1, unit: "kg" },
      ],
    });

    console.log("Recipes seeded. Seeding inventory transactions...");

    // 7. Seed Transactions to establish ledger history and stock levels
    const txnsData = [
      // Property A (Grand Hyatt Mumbai) - establishing stock levels
      { propertyId: propertyA._id, ingredient: "Chicken Breast", type: "RECEIVE", qty: 150, unit: "kg", source: "PO-2026-1001", createdBy: storeKeeper._id, notes: "Initial delivery" },
      { propertyId: propertyA._id, ingredient: "Basmati Rice", type: "RECEIVE", qty: 70, unit: "kg", source: "PO-2026-1001", createdBy: storeKeeper._id, notes: "Initial delivery" },
      { propertyId: propertyA._id, ingredient: "Fresh Milk", type: "RECEIVE", qty: 15, unit: "L", source: "PO-2026-1002", createdBy: storeKeeper._id, notes: "Initial delivery" },
      { propertyId: propertyA._id, ingredient: "Tomatoes", type: "RECEIVE", qty: 5, unit: "kg", source: "Direct Delivery", createdBy: storeKeeper._id, notes: "Local emergency purchase" },
      { propertyId: propertyA._id, ingredient: "Olive Oil", type: "RECEIVE", qty: 40, unit: "L", source: "Invoice #112", createdBy: storeKeeper._id, notes: "Restocking" },
      { propertyId: propertyA._id, ingredient: "Onions", type: "RECEIVE", qty: 25, unit: "kg", source: "Invoice #113", createdBy: storeKeeper._id, notes: "Restocking" },
      { propertyId: propertyA._id, ingredient: "Cheddar Cheese", type: "RECEIVE", qty: 30, unit: "kg", source: "Invoice #114", createdBy: storeKeeper._id, notes: "Initial delivery" },
      { propertyId: propertyA._id, ingredient: "Black Pepper", type: "RECEIVE", qty: 15, unit: "kg", source: "Invoice #115", createdBy: storeKeeper._id, notes: "Initial delivery" },
      { propertyId: propertyA._id, ingredient: "Butter", type: "RECEIVE", qty: 25, unit: "kg", source: "Invoice #114", createdBy: storeKeeper._id, notes: "Initial delivery" },
      { propertyId: propertyA._id, ingredient: "Eggs", type: "RECEIVE", qty: 10, unit: "crate", source: "Invoice #114", createdBy: storeKeeper._id, notes: "Initial delivery (300 eggs)" },

      // Property B (Taj Palace Delhi) - establishing stock levels
      { propertyId: propertyB._id, ingredient: "Chicken Breast", type: "RECEIVE", qty: 40, unit: "kg", source: "Invoice #201", createdBy: admin._id, notes: "Low stock seed" },
      { propertyId: propertyB._id, ingredient: "Basmati Rice", type: "RECEIVE", qty: 100, unit: "kg", source: "Invoice #202", createdBy: admin._id, notes: "Healthy stock seed" },
      { propertyId: propertyB._id, ingredient: "Fresh Milk", type: "RECEIVE", qty: 60, unit: "L", source: "Invoice #203", createdBy: admin._id, notes: "Healthy stock seed" },
      { propertyId: propertyB._id, ingredient: "Tomatoes", type: "RECEIVE", qty: 70, unit: "kg", source: "Invoice #204", createdBy: admin._id, notes: "Healthy stock seed" },

      // Issues/Wastage to simulate movements at Property A
      { propertyId: propertyA._id, ingredient: "Chicken Breast", type: "ISSUE", qty: 25, unit: "kg", source: "Main Kitchen", createdBy: storeKeeper._id, notes: "Issued for lunch service" },
      { propertyId: propertyA._id, ingredient: "Basmati Rice", type: "ISSUE", qty: 25, unit: "kg", source: "Main Kitchen", createdBy: storeKeeper._id, notes: "Issued for biryani preparation" },
      { propertyId: propertyA._id, ingredient: "Fresh Milk", type: "ISSUE", qty: 5, unit: "L", source: "Coffee Station", createdBy: storeKeeper._id, notes: "Issued to café" },
      { propertyId: propertyA._id, ingredient: "Tomatoes", type: "ISSUE", qty: 5, unit: "kg", source: "Main Kitchen", createdBy: storeKeeper._id, notes: "Issued to kitchen" }, // Makes tomatoes stock 0!

      // Wastage examples
      { propertyId: propertyA._id, ingredient: "Fresh Milk", type: "WASTE", qty: 2, unit: "L", source: "Spillage", createdBy: storeKeeper._id, notes: "Accidental spillage in cold room" },
      { propertyId: propertyA._id, ingredient: "Tomatoes", type: "WASTE", qty: 3, unit: "kg", source: "Spoilage - Overripe", createdBy: storeKeeper._id, notes: "Discarded damaged stock from delivery" },
    ];

    for (const t of txnsData) {
      const ing = ingredients[t.ingredient];
      const baseQty = await convertToBaseUnit(ing, t.qty, t.unit);
      
      let signedBaseQty = baseQty;
      if (["ISSUE", "CONSUME", "WASTE", "SPOILAGE"].includes(t.type)) {
        signedBaseQty = -Math.abs(baseQty);
      }

      await InventoryTransaction.create({
        propertyId: t.propertyId,
        ingredientId: ing._id,
        type: t.type,
        quantity: t.qty,
        unit: t.unit,
        baseQuantity: signedBaseQty,
        baseUnit: ing.baseUnit,
        source: t.source,
        createdBy: t.createdBy,
        notes: t.notes,
      });
    }

    console.log("Transactions seeded. Seeding purchase requests...");

    // 8. Create Purchase Requests
    await PurchaseRequest.create({
      propertyId: propertyA._id,
      ingredientId: ingredients["Tomatoes"]._id,
      quantity: 100,
      unit: "kg",
      requestedBy: headChef._id,
      priority: "high",
      status: "pending",
      reason: "Out of stock - urgent kitchen requirement",
      estimatedCost: 6000,
      notes: "Need immediately for gravy prep",
    });

    await PurchaseRequest.create({
      propertyId: propertyA._id,
      ingredientId: ingredients["Fresh Milk"]._id,
      quantity: 80,
      unit: "L",
      requestedBy: headChef._id,
      priority: "high",
      status: "pending",
      reason: "Critical stock level",
      estimatedCost: 4800,
      notes: "Breached par level",
    });

    await PurchaseRequest.create({
      propertyId: propertyA._id,
      ingredientId: ingredients["Basmati Rice"]._id,
      quantity: 50,
      unit: "kg",
      requestedBy: storeKeeper._id,
      priority: "medium",
      status: "approved",
      reason: "Below par level",
      estimatedCost: 9000,
      approvedBy: manager._id,
      approvalDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      notes: "Scheduled replenishment",
    });

    await PurchaseRequest.create({
      propertyId: propertyA._id,
      ingredientId: ingredients["Olive Oil"]._id,
      quantity: 30,
      unit: "L",
      requestedBy: headChef._id,
      priority: "low",
      status: "rejected",
      reason: "Quality upgrade request",
      estimatedCost: 24000,
      approvedBy: manager._id,
      approvalDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: "Rejected: Budget constraints limit premium oils this month",
    });

    console.log("Purchase requests seeded. Seeding purchase orders...");

    // 9. Create Purchase Orders
    const reqApproved = await PurchaseRequest.findOne({ status: "approved" });
    
    await PurchaseOrder.create({
      poNumber: "PO-2026-1001",
      propertyId: propertyA._id,
      requestIds: reqApproved ? [reqApproved._id] : [],
      vendorId: vendorGrains._id,
      status: "completed",
      totalCost: 15000,
      expectedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: storeKeeper._id,
      items: [
        { ingredientId: ingredients["Basmati Rice"]._id, qty: 100, unit: "kg", price: 150 },
      ],
    });

    await PurchaseOrder.create({
      poNumber: "PO-2026-1002",
      propertyId: propertyA._id,
      requestIds: [],
      vendorId: vendorDairy._id,
      status: "pending",
      totalCost: 10400,
      expectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      createdBy: storeKeeper._id,
      items: [
        { ingredientId: ingredients["Fresh Milk"]._id, qty: 100, unit: "L", price: 60 },
        { ingredientId: ingredients["Butter"]._id, qty: 11, unit: "kg", price: 400 },
      ],
    });

    console.log("Purchase orders seeded. Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database: ", error);
    process.exit(1);
  }
};

seed();
