import Vendor from "../models/Vendor.js";

/**
 * @desc    Get all vendors
 * @route   GET /api/vendors
 * @access  Private
 */
export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({}).sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a new vendor
 * @route   POST /api/vendors
 * @access  Private/Purchase Manager/Admin
 */
export const createVendor = async (req, res) => {
  const { name, email, contact, address, leadTime } = req.body;

  try {
    const vendorExists = await Vendor.findOne({ name });
    if (vendorExists) {
      return res.status(400).json({ message: "Vendor with this name already exists" });
    }

    const vendor = await Vendor.create({
      name,
      email,
      contact,
      address,
      leadTime: leadTime || 2,
    });

    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
