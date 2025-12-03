const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  rfpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFP',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'received', 'analyzed'],
    default: 'pending'
  },
  rawEmailContent: {
    type: String,
    default: ''
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String
  }],
  parsedData: {
    lineItems: [{
      itemName: String,
      unitPrice: Number,
      quantity: Number,
      totalPrice: Number
    }],
    totalCost: Number,
    deliveryTimeline: String,
    paymentTerms: String,
    warrantyOffered: String,
    additionalNotes: String
  },
  aiAnalysis: {
    completenessScore: {
      type: Number,
      min: 0,
      max: 100
    },
    priceCompetitiveness: String,
    termsCompliance: String,
    riskFactors: [String],
    recommendation: String
  },
  receivedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Proposal', proposalSchema);
