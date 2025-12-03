const express = require('express');
const { 
  createRFP, 
  getAllRFPs, 
  getRFPById, 
  updateRFP, 
  deleteRFP,
  sendRFP 
} = require('../controllers/rfpController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createRFP);
router.get('/', getAllRFPs);
router.get('/:id', getRFPById);
router.patch('/:id', updateRFP);
router.delete('/:id', deleteRFP);
router.post('/:id/send', sendRFP);

module.exports = router;
