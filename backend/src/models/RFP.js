const mongoose = require("mongoose");

const rfpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "receiving", "completed"],
      default: "draft",
    },
    structuredData: {
      items: [
        {
          name: String,
          quantity: Number,
          specifications: String,
        },
      ],
      budget: Number,
      deliveryDeadline: Date,
      paymentTerms: String,
      warrantyRequirements: String,
      additionalTerms: String,
    },
    vendors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
      },
    ],
    sentAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RFP", rfpSchema);
