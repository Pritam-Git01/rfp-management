const Proposal = require("../models/Proposal");
const RFP = require("../models/RFP");
const Vendor = require("../models/Vendor");
const { parseVendorResponse, analyzeProposal } = require("./aiService");
const { extractTextFromDocument } = require("./ocrService");

const processEmailToProposal = async (emailData) => {
  try {
    console.log(`📄 Processing email for RFP: ${emailData.rfpId}`);

    // 1. Find the RFP
    const rfp = await RFP.findById(emailData.rfpId);
    if (!rfp) {
      console.error(`✗ RFP not found: ${emailData.rfpId}`);
      return null;
    }

    // 2. Find the vendor by email
    const vendor = await Vendor.findOne({ email: emailData.from });
    if (!vendor) {
      console.error(`✗ Vendor not found for email: ${emailData.from}`);
      return null;
    }

    console.log(`✓ Found vendor: ${vendor.name}`);

    // 3. Extract text from attachments using OCR
    const attachmentTexts = [];
    for (const attachment of emailData.attachments) {
      try {
        const text = await extractTextFromDocument(
          attachment.path,
          attachment.mimetype
        );
        attachmentTexts.push(text);
        console.log(`✓ Extracted text from: ${attachment.filename}`);
      } catch (error) {
        console.error(
          `✗ Failed to extract text from ${attachment.filename}:`,
          error.message
        );
      }
    }

    // 4. Parse email content + attachments using AI
    console.log("🤖 Parsing vendor response with AI...");
    const parsedData = await parseVendorResponse(
      emailData.text || emailData.html,
      attachmentTexts
    );

    console.log(`✓ Parsed proposal data: $${parsedData.totalCost}`);

    // 5. Analyze the proposal against RFP requirements
    console.log("🤖 Analyzing proposal...");
    const aiAnalysis = await analyzeProposal(parsedData, rfp.structuredData);

    console.log(
      `✓ Analysis complete: ${aiAnalysis.completenessScore}% complete`
    );

    // 6. Create and save the proposal
    const proposal = await Proposal.create({
      rfpId: rfp._id,
      vendorId: vendor._id,
      status: "analyzed",
      rawEmailContent: emailData.text || emailData.html,
      attachments: emailData.attachments,
      parsedData,
      aiAnalysis,
      receivedAt: new Date(),
    });

    console.log(`✅ Proposal saved successfully: ${proposal._id}`);

    return proposal;
  } catch (error) {
    console.error("✗ Error processing email to proposal:", error.message);
    throw error;
  }
};

module.exports = {
  processEmailToProposal,
};
