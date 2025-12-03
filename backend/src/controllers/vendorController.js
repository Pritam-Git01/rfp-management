const Vendor = require('../models/Vendor');

const getAllVendors = async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = {};
    if (category) {
      query.category = category;
    }

    const vendors = await Vendor.find(query).sort({ name: 1 });

    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({ vendor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendorById
};

