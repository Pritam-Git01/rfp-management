const nodemailer = require("nodemailer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const fs = require("fs").promises;
const path = require("path");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendRFPEmail = async (rfp, vendor) => {
  const emailContent = generateRFPEmailContent(rfp);

  const msg = {
    to: vendor.email,
    from: {
      address: process.env.SEND_FROM_EMAIL,
      name: process.env.SEND_FROM_NAME,
    },
    subject: `RFP: ${rfp._id} ${rfp.title}`,
    html: emailContent,
  };

  try {
    transporter.sendMail(msg);
    console.log(`Email sent successfully to ${vendor.name} (${vendor.email})`);
    return { success: true, vendor: vendor.name };
  } catch (error) {
    console.error(`Failed to send email to ${vendor.name}:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
    return {
      success: false,
      vendor: vendor.name,
      error: error.message,
      details: error.response ? error.response.body : null,
    };
  }
};

const generateRFPEmailContent = (rfp) => {
  const items = rfp.structuredData.items
    .map(
      (item) =>
        `<li><strong>${item.name}</strong> - Quantity: ${item.quantity} - ${item.specifications}</li>`
    )
    .join("");

  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2c3e50;">Request for Proposal: ${rfp.title}</h2>
        
        <p>Dear Vendor,</p>
        
        <p>We are pleased to invite you to submit a proposal for the following requirements:</p>
        
        <h3>Items Required:</h3>
        <ul>${items}</ul>
        
        <h3>Project Details:</h3>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Budget:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">$${
              rfp.structuredData.budget?.toLocaleString() || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Delivery Deadline:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              rfp.structuredData.deliveryDeadline
                ? new Date(
                    rfp.structuredData.deliveryDeadline
                  ).toLocaleDateString()
                : "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment Terms:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              rfp.structuredData.paymentTerms || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Warranty Requirements:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              rfp.structuredData.warrantyRequirements || "N/A"
            }</td>
          </tr>
        </table>
        
        ${
          rfp.structuredData.additionalTerms
            ? `
          <h3>Additional Terms:</h3>
          <p>${rfp.structuredData.additionalTerms}</p>
        `
            : ""
        }
        
        <p><strong>Please reply to this email with your proposal including:</strong></p>
        <ul>
          <li>Detailed pricing breakdown</li>
          <li>Delivery timeline</li>
          <li>Payment terms</li>
          <li>Warranty information</li>
          <li>Any additional terms or conditions</li>
        </ul>
        
        <p>We look forward to receiving your proposal.</p>
        
        <p>Best regards,<br>
        ${process.env.SEND_FROM_NAME}</p>
      </body>
    </html>
  `;
};

const fetchInboundEmails = () => {
  return new Promise((resolve, reject) => {
    console.log("📧 Connecting to IMAP server...");
    const imap = new Imap({
      user: process.env.SMTP_USER, // Using SMTP credentials for IMAP
      password: process.env.SMTP_PASS,
      host: process.env.IMAP_HOST || process.env.SMTP_HOST,
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const emails = [];

    imap.once("ready", () => {
      console.log("✓ Connected to IMAP server");
      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          console.error("✗ Error opening inbox:", err.message);
          imap.end();
          return reject(err);
        }

        console.log(`📬 Searching for unread RFP emails...`);
        imap.search(["UNSEEN", ["SUBJECT", "RFP:"]], (err, results) => {
          if (err) {
            console.error("✗ Error searching emails:", err.message);
            imap.end();
            return reject(err);
          }

          if (results.length === 0) {
            console.log("ℹ No new RFP emails found");
            imap.end();
            return resolve([]);
          }

          console.log(`✓ Found ${results.length} unread RFP email(s)`);

          const fetch = imap.fetch(results, { bodies: "", markSeen: true });

          fetch.on("message", (msg) => {
            msg.on("body", (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error("Email parsing error:", err);
                  return;
                }

                // Match both "RFP:" and "RFP-" formats for backward compatibility
                const rfpIdMatch = parsed.subject?.match(
                  /RFP[:-]\s*([a-f0-9]{24})/i
                );
                if (rfpIdMatch) {
                  console.log(
                    `✓ Processing email from ${parsed.from.value[0].address}`
                  );
                  const emailData = {
                    rfpId: rfpIdMatch[1],
                    from: parsed.from.value[0].address,
                    subject: parsed.subject,
                    text: parsed.text,
                    html: parsed.html,
                    attachments: [],
                  };

                  if (parsed.attachments && parsed.attachments.length > 0) {
                    const uploadsDir = path.join(__dirname, "../../uploads");
                    await fs.mkdir(uploadsDir, { recursive: true });

                    for (const attachment of parsed.attachments) {
                      const filename = `${Date.now()}_${attachment.filename}`;
                      const filepath = path.join(uploadsDir, filename);
                      await fs.writeFile(filepath, attachment.content);

                      emailData.attachments.push({
                        filename: attachment.filename,
                        path: filepath,
                        mimetype: attachment.contentType,
                      });
                    }
                  }

                  emails.push(emailData);
                }
              });
            });
          });

          fetch.once("end", () => {
            imap.end();
          });
        });
      });
    });

    imap.once("error", (err) => {
      console.error("✗ IMAP connection error:", err.message);
      reject(err);
    });

    imap.once("end", () => {
      setTimeout(() => resolve(emails), 1000);
    });

    imap.connect();
  });
};

module.exports = {
  sendRFPEmail,
  fetchInboundEmails,
};
