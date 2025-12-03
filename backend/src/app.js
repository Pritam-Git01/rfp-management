require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const { seedVendors } = require("./utils/seeder");
const { fetchInboundEmails } = require("./services/emailService");

const authRoutes = require("./routes/auth");
const rfpRoutes = require("./routes/rfp");
const vendorRoutes = require("./routes/vendor");
const proposalRoutes = require("./routes/proposal");

const app = express();

const initializeApp = async () => {
  await connectDB();
  await seedVendors();
  startEmailPolling();
};

initializeApp();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "RFP Management API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rfps", rfpRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/proposals", proposalRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startEmailPolling = () => {
  const POLL_INTERVAL = 60000; // 60 seconds

  console.log(
    `✓ Email polling started (checking every ${POLL_INTERVAL / 1000}s)`
  );

  setInterval(async () => {
    try {
      console.log("📧 Checking for new vendor emails...");
      const emails = await fetchInboundEmails();
      if (emails.length > 0) {
        console.log(`✓ Received ${emails.length} new email(s)`);

        // Process each email and create proposals
        const {
          processEmailToProposal,
        } = require("./services/proposalService");
        for (const email of emails) {
          try {
            await processEmailToProposal(email);
          } catch (error) {
            console.error(
              `✗ Failed to process email for RFP ${email.rfpId}:`,
              error.message
            );
          }
        }
      }
    } catch (error) {
      console.error("✗ Error fetching emails:", error.message);
    }
  }, POLL_INTERVAL);
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
