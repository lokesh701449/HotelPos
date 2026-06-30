import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseRequest from "../models/PurchaseRequest.js";
import Vendor from "../models/Vendor.js";
import Ingredient from "../models/Ingredient.js";

/**
 * @desc    Get all purchase orders
 * @route   GET /api/purchase-orders
 * @access  Private
 */
export const getPurchaseOrders = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;
  const user = req.user;

  try {
    let query = {};
    if (user.role !== "Admin" && user.role !== "Purchase Manager") {
      if (!propertyId) {
        query = { propertyId: { $in: user.assignedProperties } };
      } else {
        query = { propertyId };
      }
    } else if (propertyId) {
      query = { propertyId };
    }

    const orders = await PurchaseOrder.find(query)
      .populate("vendorId", "name contact email")
      .populate("items.ingredientId", "name unit sku")
      .populate("propertyId", "name code")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((o) => ({
      id: o._id,
      poNumber: o.poNumber,
      status: o.status,
      supplier: o.vendorId ? o.vendorId.name : "N/A",
      expectedDate: o.expectedDate ? o.expectedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) : "TBD",
      value: o.totalCost,
      property: o.propertyId ? o.propertyId.name : "N/A",
      items: o.items.map((it) => ({
        ingredientId: it.ingredientId ? it.ingredientId._id : null,
        name: it.ingredientId ? it.ingredientId.name : "Unknown",
        qty: it.qty,
        unit: it.unit,
        price: it.price,
      })),
      createdBy: o.createdBy ? o.createdBy.name : "Unknown",
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a manual purchase order
 * @route   POST /api/purchase-orders
 * @access  Private/Purchase Manager/Admin
 */
export const createPurchaseOrder = async (req, res) => {
  const { propertyId, vendorId, items, expectedDate } = req.body;

  try {
    // Generate unique PO Number
    const count = await PurchaseOrder.countDocuments();
    const poNumber = `PO-2026-${String(count + 1001).slice(-4)}`;

    let calculatedCost = 0;
    const finalItems = [];

    for (const item of items) {
      const ing = await Ingredient.findById(item.ingredientId);
      if (ing) {
        const itemPrice = item.price || ing.value;
        calculatedCost += item.qty * itemPrice;
        finalItems.push({
          ingredientId: item.ingredientId,
          qty: item.qty,
          unit: item.unit,
          price: itemPrice,
        });
      }
    }

    const order = await PurchaseOrder.create({
      poNumber,
      propertyId: propertyId || req.propertyId,
      vendorId,
      items: finalItems,
      totalCost: Math.round(calculatedCost),
      expectedDate: expectedDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days default
      createdBy: req.user._id,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Generate a consolidated Purchase Order from multiple approved requests
 * @route   POST /api/purchase-orders/generate-consolidated
 * @access  Private/Purchase Manager/Admin
 */
export const generateConsolidatedOrder = async (req, res) => {
  const { requestIds } = req.body;

  if (!requestIds || requestIds.length === 0) {
    return res.status(400).json({ message: "No purchase requests selected" });
  }

  try {
    // Fetch approved requests
    const requests = await PurchaseRequest.find({
      _id: { $in: requestIds },
      status: "approved",
    }).populate("items.ingredientId").populate("ingredientId");

    if (requests.length === 0) {
      return res.status(400).json({ message: "No approved requests found in selection" });
    }

    // Group items by property and aggregate quantities
    // If requests span multiple properties, we create a PO per property (standard practice for delivery isolation)
    // or group them. Let's group by propertyId.
    const propertyGroups = {};

    for (const reqObj of requests) {
      const propId = reqObj.propertyId.toString();
      if (!propertyGroups[propId]) {
        propertyGroups[propId] = {
          requestIds: [],
          itemsMap: {},
        };
      }
      propertyGroups[propId].requestIds.push(reqObj._id);

      // Aggregate items from this request
      const listItems = reqObj.items && reqObj.items.length > 0
        ? reqObj.items
        : reqObj.ingredientId
        ? [{ ingredientId: reqObj.ingredientId, qty: reqObj.quantity, unit: reqObj.unit }]
        : [];

      for (const item of listItems) {
        const ingId = item.ingredientId._id.toString();
        if (!propertyGroups[propId].itemsMap[ingId]) {
          propertyGroups[propId].itemsMap[ingId] = {
            ingredient: item.ingredientId,
            qty: 0,
            unit: item.unit,
          };
        }
        propertyGroups[propId].itemsMap[ingId].qty += item.qty;
      }
    }

    const createdPOs = [];

    // Create a PO for each property group
    for (const propId of Object.keys(propertyGroups)) {
      const group = propertyGroups[propId];
      const itemsList = Object.values(group.itemsMap);

      if (itemsList.length === 0) continue;

      // Group items by Supplier to create supplier-specific POs
      const supplierGroups = {};
      for (const item of itemsList) {
        const supplierName = item.ingredient.supplier || "Default Vendor";
        if (!supplierGroups[supplierName]) {
          supplierGroups[supplierName] = [];
        }
        supplierGroups[supplierName].push(item);
      }

      for (const supplierName of Object.keys(supplierGroups)) {
        const supplierItems = supplierGroups[supplierName];

        // Find or create vendor
        let vendor = await Vendor.findOne({ name: supplierName });
        if (!vendor) {
          vendor = await Vendor.create({
            name: supplierName,
            email: `contact@${supplierName.toLowerCase().replace(/\s+/g, "")}.com`,
          });
        }

        // Generate unique PO Number
        const count = await PurchaseOrder.countDocuments();
        const poNumber = `PO-2026-${String(count + 1001).slice(-4)}`;

        let totalCost = 0;
        const poItems = supplierItems.map((it) => {
          const itemCost = it.qty * it.ingredient.value;
          totalCost += itemCost;
          return {
            ingredientId: it.ingredient._id,
            qty: it.qty,
            unit: it.unit,
            price: it.ingredient.value,
          };
        });

        const po = await PurchaseOrder.create({
          poNumber,
          propertyId: propId,
          requestIds: group.requestIds,
          vendorId: vendor._id,
          items: poItems,
          totalCost: Math.round(totalCost),
          expectedDate: new Date(Date.now() + (vendor.leadTime || 2) * 24 * 60 * 60 * 1000),
          createdBy: req.user._id,
        });

        createdPOs.push(po);
      }

      // Mark source requests as ordered
      await PurchaseRequest.updateMany(
        { _id: { $in: group.requestIds } },
        { $set: { status: "ordered" } }
      );
    }

    res.status(201).json({
      message: `Consolidated requests into ${createdPOs.length} Purchase Order(s).`,
      purchaseOrders: createdPOs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
