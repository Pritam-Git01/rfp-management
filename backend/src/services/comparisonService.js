const { compareProposals } = require('./aiService');

const generateComparison = async (proposals, rfp) => {
  if (proposals.length === 0) {
    return {
      hasProposals: false,
      message: 'No proposals received yet'
    };
  }

  const proposalsData = proposals.map(p => ({
    vendorId: p.vendorId._id.toString(),
    vendorName: p.vendorId.name,
    totalCost: p.parsedData.totalCost,
    deliveryTimeline: p.parsedData.deliveryTimeline,
    paymentTerms: p.parsedData.paymentTerms,
    warrantyOffered: p.parsedData.warrantyOffered,
    completenessScore: p.aiAnalysis.completenessScore,
    termsCompliance: p.aiAnalysis.termsCompliance
  }));

  const aiComparison = await compareProposals(proposalsData, rfp.structuredData);

  return {
    hasProposals: true,
    proposals: proposalsData,
    aiRecommendation: aiComparison,
    summary: {
      totalProposals: proposals.length,
      lowestPrice: Math.min(...proposalsData.map(p => p.totalCost || Infinity)),
      highestPrice: Math.max(...proposalsData.map(p => p.totalCost || 0)),
      averageCompleteness: proposalsData.reduce((sum, p) => sum + (p.completenessScore || 0), 0) / proposalsData.length
    }
  };
};

module.exports = {
  generateComparison
};
