import Property from "../models/Property.js";

/**
 * @desc    Get all properties (filtered by user assignment if not Admin/Purchase Manager)
 * @route   GET /api/properties
 * @access  Private
 */
export const getProperties = async (req, res) => {
  try {
    let query = {};
    
    // Non-Admin and non-Purchase Manager can only see their assigned properties
    if (req.user.role !== "Admin" && req.user.role !== "Purchase Manager") {
      query = { _id: { $in: req.user.assignedProperties } };
    }

    const properties = await Property.find(query);
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a new property
 * @route   POST /api/properties
 * @access  Private/Admin
 */
export const createProperty = async (req, res) => {
  const { name, code, address, status } = req.body;

  try {
    const propertyExists = await Property.findOne({ code: code.toUpperCase() });
    if (propertyExists) {
      return res.status(400).json({ message: "Property code already exists" });
    }

    const property = await Property.create({
      name,
      code,
      address,
      status,
    });

    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update property details
 * @route   PATCH /api/properties/:id
 * @access  Private/Admin
 */
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (property) {
      property.name = req.body.name || property.name;
      property.code = req.body.code ? req.body.code.toUpperCase() : property.code;
      property.address = req.body.address || property.address;
      property.status = req.body.status || property.status;

      const updatedProperty = await property.save();
      res.json(updatedProperty);
    } else {
      res.status(404).json({ message: "Property not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
