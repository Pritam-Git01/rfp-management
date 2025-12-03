const express = require('express');
const { getAllVendors, getVendorById } = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllVendors);
router.get('/:id', getVendorById);

module.exports = router;
