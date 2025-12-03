const RFP = require("../models/RFP");
const Vendor = require("../models/Vendor");
const { parseRFPFromNaturalLanguage } = require("../services/aiService");
const { sendRFPEmail } = require("../services/emailService");
const { getUserIdFromToken } = require("../utils/auth");

const createRFP = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    const structuredData = await parseRFPFromNaturalLanguage(description);

    const { title, ...restStructuredData } = structuredData;

    const rfp = await RFP.create({
      userId: userId,
      title: title,
      description,
      structuredData: restStructuredData,
      status: "draft",
    });

    res.status(201).json({
      message: "RFP created successfully",
      rfp,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRFPs = async (req, res) => {
  const userId = getUserIdFromToken(req);


  try {
    const rfps = await RFP.find({ userId })
      .populate("vendors", "name email")
      .sort({ createdAt: -1 });

    res.json({ rfps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRFPById = async (req, res) => {
  const userId = getUserIdFromToken(req);

  try {
    const rfp = await RFP.findOne({
      _id: req.params.id,
      userId,
    }).populate("vendors");

    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    res.json({ rfp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRFP = async (req, res) => {
  try {
    const { title, structuredData, vendors } = req.body;

    const userId = getUserIdFromToken(req);


    const rfp = await RFP.findOne({
      _id: req.params.id,
      userId,
    });

    console.log(req.params);


    if (title) rfp.title = title;
    if (structuredData)
      rfp.structuredData = { ...rfp.structuredData, ...structuredData };
    if (vendors) rfp.vendors = vendors;

    await rfp.save();

    res.json({
      message: "RFP updated successfully",
      rfp,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRFP = async (req, res) => {
  const userId = getUserIdFromToken(req);


  try {
    const rfp = await RFP.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    res.json({ message: "RFP deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendRFP = async (req, res) => {
  const userId = getUserIdFromToken(req);

  try {
    const { vendorIds } = req.body;

    const rfp = await RFP.findOne({
      _id: req.params.id,
      userId,
    });

    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    if (!vendorIds || vendorIds.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one vendor must be selected" });
    }

    const vendors = await Vendor.find({ _id: { $in: vendorIds } });

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const vendor of vendors) {
      const result = await sendRFPEmail(rfp, vendor);
      results.push(result);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    rfp.vendors = vendorIds;
    rfp.status = "sent";
    rfp.sentAt = new Date();

    await rfp.save();

    if (successCount === 0 && failureCount > 0) {
      return res.status(500).json({
        error: "Failed to send emails to all vendors",
        results,
        rfp,
      });
    }

    if (failureCount > 0) {
      return res.status(207).json({
        message: "RFP sent with some failures",
        results,
        rfp,
      });
    }

    res.json({
      message: "RFP sent successfully",
      results,
      rfp,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRFP,
  getAllRFPs,
  getRFPById,
  updateRFP,
  deleteRFP,
  sendRFP,
};
