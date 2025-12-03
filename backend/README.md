# AI-Powered RFP Management System - Backend

A Node.js/Express backend system for managing RFPs (Request for Proposals) with AI-powered features including natural language processing, vendor response parsing, and proposal comparison.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **AI Providers**: 
  - Primary: OpenAI GPT-4
  - Fallback: Google Gemini Pro
- **Email**: SendGrid (SMTP) + IMAP
- **OCR**: Tesseract.js
- **Authentication**: JWT

## Features

- 🤖 AI-powered RFP creation from natural language
- 📧 Automated email sending to vendors
- 📥 IMAP-based email polling for vendor responses
- 📄 OCR support for PDF and image attachments
- 🔍 AI-based proposal parsing and analysis
- 📊 Automated proposal comparison and recommendations
- 🔐 Simple JWT-based authentication

## Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- OpenAI API Key
- Google Gemini API Key (optional, for fallback)
- SendGrid API Key
- Gmail account with App Password (for IMAP)

## Installation

1. Clone the repository
```bash
cd rfp-backend
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/rfp_management

JWT_SECRET=your_secure_random_string
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...

SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=your_email@domain.com
SENDGRID_FROM_NAME=RFP Management System

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_password
IMAP_TLS=true

EMAIL_POLL_INTERVAL=5
```

4. Seed vendors data
```bash
npm run seed
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Start Email Polling (Separate Process)
```bash
npm run email:poll
```

## API Documentation

### Authentication

#### Signup
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "companyName": "Acme Corp",
  "profession": "Procurement Manager"
}

Response: 201
{
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": { ... }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": { ... }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {token}

Response: 200
{
  "user": { ... }
}
```

### RFP Management

#### Create RFP
```http
POST /api/rfps
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "I need to procure 20 laptops with 16GB RAM and 15 monitors 27-inch. Budget is $50,000. Delivery within 30 days. Payment terms net 30. Need 1 year warranty."
}

Response: 201
{
  "message": "RFP created successfully",
  "rfp": {
    "_id": "...",
    "title": "Laptops and Monitors Procurement",
    "structuredData": {
      "items": [...],
      "budget": 50000,
      ...
    }
  }
}
```

#### Get All RFPs
```http
GET /api/rfps
Authorization: Bearer {token}

Response: 200
{
  "rfps": [...]
}
```

#### Get RFP by ID
```http
GET /api/rfps/:id
Authorization: Bearer {token}

Response: 200
{
  "rfp": { ... }
}
```

#### Update RFP
```http
PATCH /api/rfps/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "structuredData": { ... }
}

Response: 200
{
  "message": "RFP updated successfully",
  "rfp": { ... }
}
```

#### Delete RFP
```http
DELETE /api/rfps/:id
Authorization: Bearer {token}

Response: 200
{
  "message": "RFP deleted successfully"
}
```

#### Send RFP to Vendors
```http
POST /api/rfps/:id/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "vendorIds": ["vendor_id_1", "vendor_id_2"]
}

Response: 200
{
  "message": "RFP sent successfully",
  "results": [
    { "success": true, "vendor": "TechGear Solutions" }
  ],
  "rfp": { ... }
}
```

### Vendor Management

#### Get All Vendors
```http
GET /api/vendors
Authorization: Bearer {token}

Response: 200
{
  "vendors": [...]
}
```

#### Get Vendors by Category
```http
GET /api/vendors?category=laptops
Authorization: Bearer {token}

Response: 200
{
  "vendors": [...]
}
```

#### Get Vendor by ID
```http
GET /api/vendors/:id
Authorization: Bearer {token}

Response: 200
{
  "vendor": { ... }
}
```

### Proposal Management

#### Get Proposals for RFP
```http
GET /api/proposals/rfp/:rfpId
Authorization: Bearer {token}

Response: 200
{
  "proposals": [
    {
      "vendorId": { ... },
      "parsedData": { ... },
      "aiAnalysis": { ... }
    }
  ]
}
```

#### Get Proposal by ID
```http
GET /api/proposals/:id
Authorization: Bearer {token}

Response: 200
{
  "proposal": { ... }
}
```

#### Compare Proposals
```http
GET /api/proposals/rfp/:rfpId/compare
Authorization: Bearer {token}

Response: 200
{
  "hasProposals": true,
  "proposals": [...],
  "aiRecommendation": {
    "bestVendorId": "...",
    "reasoning": "...",
    "priceComparison": "...",
    "overallScore": { ... }
  },
  "summary": {
    "totalProposals": 3,
    "lowestPrice": 45000,
    "highestPrice": 52000,
    "averageCompleteness": 85
  }
}
```

## Project Structure

```
rfp-backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── RFP.js               # RFP schema
│   │   ├── Vendor.js            # Vendor schema
│   │   └── Proposal.js          # Proposal schema
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js     # Global error handler
│   ├── services/
│   │   ├── aiService.js         # OpenAI/Gemini integration
│   │   ├── emailService.js      # SendGrid/IMAP handling
│   │   ├── ocrService.js        # OCR for documents
│   │   └── comparisonService.js # Proposal comparison logic
│   ├── controllers/
│   │   ├── authController.js    # Auth endpoints
│   │   ├── rfpController.js     # RFP CRUD
│   │   ├── vendorController.js  # Vendor endpoints
│   │   └── proposalController.js # Proposal endpoints
│   ├── routes/
│   │   ├── auth.js
│   │   ├── rfp.js
│   │   ├── vendor.js
│   │   └── proposal.js
│   ├── scripts/
│   │   ├── seedVendors.js       # Seed 10 vendors
│   │   └── pollEmails.js        # Email polling service
│   └── app.js                   # Express app setup
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Key Design Decisions

### 1. AI Provider Abstraction
- Primary: OpenAI GPT-4 for highest accuracy
- Fallback: Google Gemini for redundancy
- Function-based approach for easy provider switching

### 2. Email Architecture
- SendGrid for reliable outbound delivery
- IMAP polling for inbound responses
- Cron-based polling (configurable interval)
- Automatic RFP-email matching via subject line

### 3. Document Processing
- Tesseract.js for OCR (images)
- pdf-parse for PDF text extraction
- AI parsing of extracted text

### 4. Proposal Analysis
- Multi-criteria scoring (price, compliance, completeness)
- AI-generated recommendations
- Comparative analysis across all proposals

### 5. Authentication
- Simple JWT-based auth (no refresh token)
- Access token valid for 7 days (configurable)

## Assumptions & Limitations

1. **Single User**: No multi-tenancy support
2. **Email Format**: Vendors must reply to RFP email (subject line matching)
3. **Vendor Pre-seeding**: 10 vendors pre-populated, no CRUD UI
4. **File Storage**: Local filesystem (uploads directory)
5. **Email Polling**: Runs as separate process, not real-time
6. **No Redis**: Direct database queries (add Redis later for caching)

## Future Enhancements

- [ ] Real-time email webhooks (replace IMAP polling)
- [ ] Redis caching for vendor lists and RFP summaries
- [ ] File storage on S3 or cloud storage
- [ ] Advanced vendor management UI
- [ ] Multi-user support with role-based access
- [ ] Email tracking (opens, clicks)
- [ ] Proposal versioning and audit logs

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB service
sudo systemctl start mongod
```

### Email Not Sending
- Verify SendGrid API key
- Check sender email is verified in SendGrid
- Review SendGrid logs at https://app.sendgrid.com

### Email Polling Not Working
- Confirm IMAP credentials
- Enable "App Passwords" for Gmail
- Check firewall allows port 993
- Review logs from `npm run email:poll`

### AI Parsing Errors
- Check OpenAI API key and billing
- Verify Gemini API key (fallback)
- Review rate limits

## Development Tips

1. **Testing Email Flow**: Use a test Gmail account
2. **AI Cost Management**: Monitor OpenAI usage dashboard
3. **Database Reset**: Drop collections if needed
```bash
mongosh rfp_management --eval "db.dropDatabase()"
npm run seed
```

## License

MIT

## Support

For issues or questions, please check the assignment documentation or contact the development team.
