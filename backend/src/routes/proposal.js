const express = require('express');
const { 
  getProposalsByRFP, 
  getProposalById,
  compareProposalsByRFP 
} = require('../controllers/proposalController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/rfp/:rfpId', getProposalsByRFP);
router.get('/rfp/:rfpId/compare', compareProposalsByRFP);
router.get('/:id', getProposalById);

module.exports = router;
