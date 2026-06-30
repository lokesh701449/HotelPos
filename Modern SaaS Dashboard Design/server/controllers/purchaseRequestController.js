import PurchaseRequest from "../models/PurchaseRequest.js";
import Ingredient from "../models/Ingredient.js";

/**
 * @desc    Get all purchase requests
 * @route   GET /api/purchase-requests
 * @access  Private
 */
export const getPurchaseRequests = async (req, res) => {
  const propertyId = req.query.propertyId || req.propertyId;
  const user = req.user;

  try {
    let query = {};
    
    // Purchase Managers/Admin can view all property requests. Others restricted to assigned property.
    if (user.role !== "Admin" && user.role !== "Purchase Manager") {
      if (!propertyId) {
        query = { propertyId: { $in: user.assignedProperties } };
      } else {
        query = { propertyId };
      }
    } else if (propertyId) {
      query = { propertyId };
    }

    const requests = await PurchaseRequest.find(query)
      .populate("ingredientId", "name unit sku value")
      .populate("items.ingredientId", "name unit value")
      .populate("requestedBy", "name role")
      .populate("approvedBy", "name role")
      .populate("propertyId", "name code")
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map((r) => {
      // Map items for layout display
      const itemsList = r.items && r.items.length > 0
        ? r.items.map((it) => ({
            name: it.ingredientId ? it.ingredientId.name : "Unknown",
            qty: it.qty,
            unit: it.unit,
            price: it.ingredientId ? it.ingredientId.value : 0,
          }))
        : r.ingredientId
        ? [{
            name: r.ingredientId.name,
            qty: r.quantity,
            unit: r.unit,
            price: r.ingredientId.value,
          }]
        : [];

      return {
        id: r._id,
        status: r.status,
        requestedBy: r.requestedBy ? r.requestedBy.name : "Unknown",
        date: r.requestDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        property: r.propertyId ? r.propertyId.name : "N/A",
        propertyId: r.propertyId ? r.propertyId._id : null,
        approvedBy: r.approvedBy ? r.approvedBy.name : undefined,
        approvalDate: r.approvalDate ? r.approvalDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) : undefined,
        items: itemsList,
        estimatedValue: r.estimatedCost || 0,
        priority: r.priority,
        reason: r.reason,
        notes: r.notes || "",
        // Supporting single-item variables for simpler tables
        ingredient: r.ingredientId ? r.ingredientId.name : "N/A",
        quantity: r.quantity,
        unit: r.unit,
      };
    });

    res.json(formattedRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a new purchase request
 * @route   POST /api/purchase-requests
 * @access  Private/Chef/Store Keeper/Admin
 */
export const createPurchaseRequest = async (req, res) => {
  const { propertyId, ingredientId, quantity, unit, items, priority, reason, notes } = req.body;

  try {
    let finalItems = items || [];
    let calculatedCost = 0;

    // Handle single item requests by converting to items array or calculating cost directly
    if (ingredientId && quantity && unit) {
      const ingredient = await Ingredient.findById(ingredientId);
      if (ingredient) {
        calculatedCost = quantity * ingredient.value;
        if (finalItems.length === 0) {
          finalItems = [{ ingredientId, qty: quantity, unit }];
        }
      }
    } else if (finalItems.length > 0) {
      // Calculate consolidated cost for multiple items
      for (const item of finalItems) {
        const ing = await Ingredient.findById(item.ingredientId);
        if (ing) {
          calculatedCost += item.qty * ing.value;
        }
      }
    }

    const request = await PurchaseRequest.create({
      propertyId: propertyId || req.propertyId,
      ingredientId,
      quantity,
      unit,
      items: finalItems,
      requestedBy: req.user._id,
      priority: priority || "medium",
      reason,
      estimatedCost: Math.round(calculatedCost),
      notes,
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Approve a purchase request
 * @route   PATCH /api/purchase-requests/:id/approve
 * @access  Private/F&B Manager/Admin
 */
export const approvePurchaseRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);

    if (request) {
      request.status = "approved";
      request.approvedBy = req.user._id;
      request.approvalDate = new Date();

      const updatedRequest = await request.save();
      res.json(updatedRequest);
    } else {
      res.status(404).json({ message: "Purchase request not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Reject a purchase request
 * @route   PATCH /api/purchase-requests/:id/reject
 * @access  Private/F&B Manager/Admin
 */
export const rejectPurchaseRequest = async (req, res) => {
  const { notes } = req.body;

  try {
    const request = await PurchaseRequest.findById(req.params.id);

    if (request) {
      request.status = "rejected";
      request.notes = notes || "Rejected by F&B Manager";
      request.approvedBy = req.user._id;
      request.approvalDate = new Date();

      const updatedRequest = await request.save();
      res.json(updatedRequest);
    } else {
      res.status(404).json({ message: "Purchase request not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Adjust purchase request details
 * @route   PATCH /api/purchase-requests/:id/adjust
 * @access  Private/F&B Manager/Admin
 */
export const adjustPurchaseRequest = async (req, res) => {
  const { quantity, items, priority, reason } = req.body;

  try {
    const request = await PurchaseRequest.findById(req.params.id);

    if (request) {
      if (quantity !== undefined) request.quantity = quantity;
      if (priority) request.priority = priority;
      if (reason) request.reason = reason;
      if (items) request.items = items;

      // Recalculate estimated cost
      let calculatedCost = 0;
      if (request.items && request.items.length > 0) {
        for (const item of request.items) {
          const ing = await Ingredient.findById(item.ingredientId);
          if (ing) {
            calculatedCost += item.qty * ing.value;
          }
        }
      } else if (request.ingredientId && request.quantity) {
        const ingredient = await Ingredient.findById(request.ingredientId);
        if (ingredient) {
          calculatedCost = request.quantity * ingredient.value;
        }
      }
      request.estimatedCost = Math.round(calculatedCost);

      const updatedRequest = await request.save();
      res.json(updatedRequest);
    } else {
      res.status(404).json({ message: "Purchase request not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
