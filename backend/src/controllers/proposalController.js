const Proposal = require('../models/Proposal');
const RFP = require('../models/RFP');
const { generateComparison } = require('../services/comparisonService');
    
const getProposalsByRFP = async (req, res) => {
  try {
    const { rfpId } = req.params;

    const rfp = await RFP.findOne({ 
      _id: rfpId, 
    });

    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    const proposals = await Proposal.find({ rfpId })
      .populate('vendorId', 'name email contactPerson')
      .sort({ receivedAt: -1 });

    res.json({ proposals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('vendorId', 'name email contactPerson')
      .populate('rfpId');

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const rfp = await RFP.findOne({
      _id: proposal.rfpId._id,
    });

    if (!rfp) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ proposal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const compareProposalsByRFP = async (req, res) => {
  try {
    const { rfpId } = req.params; 

    const rfp = await RFP.findOne({ 
      _id: rfpId,   
    });

    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    const proposals = await Proposal.find({ 
      rfpId,
      status: 'analyzed'
    }).populate('vendorId', 'name email');

    const comparison = await generateComparison(proposals, rfp);

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProposalsByRFP,
  getProposalById,
  compareProposalsByRFP
};
