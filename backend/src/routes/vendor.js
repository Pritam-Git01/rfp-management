const express = require('express');
const { getAllVendors, getVendorById, createVendor, updateVendorById } = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllVendors);
router.get('/:id', getVendorById);
router.post('/', createVendor);
router.put('/:id', updateVendorById);

module.exports = router;
