require('dotenv').config();
const mongoose = require('mongoose');
const cron = require('node-cron');
const { fetchInboundEmails } = require('../services/emailService');
const { parseVendorResponse, analyzeProposal } = require('../services/aiService');
const { extractTextFromDocument } = require('../services/ocrService');
const Proposal = require('../models/Proposal');
const Vendor = require('../models/Vendor');
const RFP = require('../models/RFP');

const processInboundEmails = async () => {
  try {
    console.log('Fetching inbound emails...');
    const emails = await fetchInboundEmails();

    if (emails.length === 0) {
      console.log('No new emails found');
      return;
    }

    console.log(`Processing ${emails.length} emails`);

    for (const email of emails) {
      try {
        const vendor = await Vendor.findOne({ email: email.from });
        if (!vendor) {
          console.log(`Vendor not found for email: ${email.from}`);
          continue;
        }

        const rfp = await RFP.findById(email.rfpId);
        if (!rfp) {
          console.log(`RFP not found: ${email.rfpId}`);
          continue;
        }

        const attachmentTexts = [];
        for (const attachment of email.attachments) {
          try {
            const text = await extractTextFromDocument(attachment.path, attachment.mimetype);
            attachmentTexts.push(text);
          } catch (err) {
            console.error(`Failed to extract text from ${attachment.filename}:`, err.message);
          }
        }

        const parsedData = await parseVendorResponse(email.text, attachmentTexts);

        let proposal = await Proposal.findOne({ 
          rfpId: email.rfpId, 
          vendorId: vendor._id 
        });

        if (proposal) {
          proposal.rawEmailContent = email.text;
          proposal.attachments = email.attachments;
          proposal.parsedData = parsedData;
          proposal.status = 'received';
          proposal.receivedAt = new Date();
        } else {
          proposal = new Proposal({
            rfpId: email.rfpId,
            vendorId: vendor._id,
            rawEmailContent: email.text,
            attachments: email.attachments,
            parsedData,
            status: 'received',
            receivedAt: new Date()
          });
        }

        await proposal.save();

        const aiAnalysis = await analyzeProposal(parsedData, rfp.structuredData);
        proposal.aiAnalysis = aiAnalysis;
        proposal.status = 'analyzed';
        await proposal.save();

        if (rfp.status === 'sent') {
          rfp.status = 'receiving';
          await rfp.save();
        }

        console.log(`Processed proposal from ${vendor.name} for RFP ${email.rfpId}`);
      } catch (err) {
        console.error('Error processing email:', err.message);
      }
    }
  } catch (error) {
    console.error('Error in email polling:', error.message);
  }
};

const startEmailPolling = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const intervalMinutes = parseInt(process.env.EMAIL_POLL_INTERVAL) || 5;
    console.log(`Starting email polling every ${intervalMinutes} minutes`);

    cron.schedule(`*/${intervalMinutes} * * * *`, processInboundEmails);

    await processInboundEmails();
  } catch (error) {
    console.error('Error starting email polling:', error);
    process.exit(1);
  }
};

startEmailPolling();
