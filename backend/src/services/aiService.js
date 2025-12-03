const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const OPENAI_MODEL = "gpt-4.1-mini";
const GEMINI_MODEL = "gemini-2.5-pro";

const parseRFPFromNaturalLanguage = async (userInput) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const prompt = `You are an expert RFP analyst. Today's date is ${currentDate}.

TASK: Analyze the following RFP request and extract structured data.

IMPORTANT INSTRUCTIONS:
1. First, carefully analyze the text to understand ALL requirements
2. For dates: If relative terms like "within 30 days", "next month", "in 2 weeks" are used, calculate the ACTUAL date from today (${currentDate})
3. For missing information: Use realistic defaults based on standard RFP practices:
   - If no budget mentioned: set as null (user will specify)
   - If no deadline: calculate 30 days from today
   - If no payment terms: use "Net 30"
   - If no warranty: use "Standard manufacturer warranty"
4. All dates MUST be in YYYY-MM-DD format and MUST be in the future (after ${currentDate})

USER INPUT:
${userInput}

STEP 1 - ANALYSIS:
First, think through:
- What items are being requested?
- What is the timeline (convert any relative dates to actual dates)?
- What are the key requirements?
- What information is missing that needs defaults?

STEP 2 - OUTPUT:
Return ONLY valid JSON with this exact structure:
{
  "title": "brief descriptive title of the RFP",
  "items": [
    {
      "name": "specific item name",
      "quantity": number,
      "specifications": "detailed specifications if provided, or 'Standard specifications' if not mentioned"
    }
  ],
  "budget": number or null,
  "deliveryDeadline": "YYYY-MM-DD (must be a future date after ${currentDate})",
  "paymentTerms": "payment terms or 'Net 30' as default",
  "warrantyRequirements": "warranty details or 'Standard manufacturer warranty' as default",
  "additionalTerms": "any other terms or conditions mentioned"
}

Return ONLY the JSON, no explanations.`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    const parsedData = JSON.parse(
      content.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    );

    // Validation: Ensure deliveryDeadline is not in the past
    if (parsedData.deliveryDeadline && new Date(parsedData.deliveryDeadline) < new Date()) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      parsedData.deliveryDeadline = futureDate.toISOString().split('T')[0];
      console.warn("Fixed past date to 30 days from now");
    }

    return parsedData;
  } catch (error) {
    console.error("OpenAI failed, trying Gemini:", error.message);
    return await parseRFPWithGemini(userInput);
  }
};

const parseRFPWithGemini = async (userInput) => {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const currentDate = new Date().toISOString().split('T')[0];

  const prompt = `You are an expert RFP analyst. Today's date is ${currentDate}.

TASK: Analyze the following RFP request and extract structured data.

IMPORTANT INSTRUCTIONS:
1. First, carefully analyze the text to understand ALL requirements
2. For dates: If relative terms like "within 30 days", "next month", "in 2 weeks" are used, calculate the ACTUAL date from today (${currentDate})
3. For missing information: Use realistic defaults based on standard RFP practices:
   - If no budget mentioned: set as null (user will specify)
   - If no deadline: calculate 30 days from today
   - If no payment terms: use "Net 30"
   - If no warranty: use "Standard manufacturer warranty"
4. All dates MUST be in YYYY-MM-DD format and MUST be in the future (after ${currentDate})

USER INPUT:
${userInput}

STEP 1 - ANALYSIS:
First, think through:
- What items are being requested?
- What is the timeline (convert any relative dates to actual dates)?
- What are the key requirements?
- What information is missing that needs defaults?

STEP 2 - OUTPUT:
Return ONLY valid JSON with this exact structure:
{
  "title": "brief descriptive title of the RFP",
  "items": [
    {
      "name": "specific item name",
      "quantity": number,
      "specifications": "detailed specifications if provided, or 'Standard specifications' if not mentioned"
    }
  ],
  "budget": number or null,
  "deliveryDeadline": "YYYY-MM-DD (must be a future date after ${currentDate})",
  "paymentTerms": "payment terms or 'Net 30' as default",
  "warrantyRequirements": "warranty details or 'Standard manufacturer warranty' as default",
  "additionalTerms": "any other terms or conditions mentioned"
}

Return ONLY the JSON, no explanations.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const content = response.text();

  const parsedData = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, ""));

  // Validation: Ensure deliveryDeadline is not in the past
  if (parsedData.deliveryDeadline && new Date(parsedData.deliveryDeadline) < new Date()) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    parsedData.deliveryDeadline = futureDate.toISOString().split('T')[0];
    console.warn("Fixed past date to 30 days from now");
  }

  return parsedData;
};

const parseVendorResponse = async (emailContent, attachmentTexts = []) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const fullContent = `${emailContent}\n\nAttachments Content:\n${attachmentTexts.join("\n\n")}`;

    const prompt = `You are an expert procurement analyst. Today's date is ${currentDate}.

TASK: Parse this vendor proposal email and extract all pricing and terms information.

INSTRUCTIONS:
1. Carefully read the entire email and attachments
2. Extract ALL line items with their pricing
3. Calculate totals accurately
4. For delivery timelines: Convert relative dates (e.g., "2 weeks") to actual descriptions
5. Extract payment terms, warranty, and any special conditions

EMAIL AND ATTACHMENTS:
${fullContent}

Return ONLY valid JSON:
{
  "lineItems": [
    {
      "itemName": "exact item name from proposal",
      "unitPrice": number,
      "quantity": number,
      "totalPrice": number
    }
  ],
  "totalCost": number (sum of all line items),
  "deliveryTimeline": "delivery timeline as stated or calculated",
  "paymentTerms": "payment terms as stated",
  "warrantyOffered": "warranty details as stated",
  "additionalNotes": "any special conditions, discounts, or important notes"
}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(
      content.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    );
  } catch (error) {
    console.error("Vendor response parsing failed:", error.message);
    return await parseVendorResponseWithGemini(emailContent, attachmentTexts);
  }
};

const parseVendorResponseWithGemini = async (emailContent, attachmentTexts = []) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  const currentDate = new Date().toISOString().split('T')[0];   
  const fullContent = `${emailContent}\n\nAttachments Content:\n${attachmentTexts.join("\n\n")}`;

  const prompt = `You are an expert procurement analyst. Today's date is ${currentDate}.

TASK: Parse this vendor proposal email and extract all pricing and terms information.

INSTRUCTIONS:
1. Carefully read the entire email and attachments
2. Extract ALL line items with their pricing
3. Calculate totals accurately
4. For delivery timelines: Convert relative dates (e.g., "2 weeks") to actual descriptions
5. Extract payment terms, warranty, and any special conditions

EMAIL AND ATTACHMENTS:
${fullContent}

Return ONLY valid JSON:
{
  "lineItems": [
    {
      "itemName": "exact item name from proposal",
      "unitPrice": number,
      "quantity": number,
      "totalPrice": number
    }
  ],
  "totalCost": number (sum of all line items),
  "deliveryTimeline": "delivery timeline as stated or calculated",
  "paymentTerms": "payment terms as stated",
  "warrantyOffered": "warranty details as stated",
  "additionalNotes": "any special conditions, discounts, or important notes"
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text();

  return JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
};

const analyzeProposal = async (proposal, rfpRequirements) => {
  try {
    const prompt = `You are a senior procurement analyst with 15+ years of experience evaluating vendor proposals.

CRITICAL INSTRUCTIONS:
- Analyze this proposal thoroughly against ALL RFP requirements
- Consider EVERY factor: price, delivery timeline, terms, quality, risk, compliance
- Use data-driven reasoning, not assumptions
- Be objective and comprehensive in your evaluation

RFP REQUIREMENTS:
${JSON.stringify(rfpRequirements, null, 2)}

VENDOR PROPOSAL:
${JSON.stringify(proposal, null, 2)}

ANALYSIS FRAMEWORK:

1. COMPLETENESS (Score 0-100):
   - Does proposal address ALL RFP items? 
   - Are specifications clearly stated?
   - Any missing or unclear information?
   - Calculate: (Items addressed / Total items) × 100

2. PRICE COMPETITIVENESS:
   - Classify as "High", "Medium", or "Low"
   - "Low" = Competitive/Budget-friendly pricing
   - "Medium" = Fair market value
   - "High" = Premium/Above market pricing
   - Compare against RFP budget if specified
   - Consider value for money, not just lowest price

3. DELIVERY TIMELINE:
   - Compare delivery timeline with RFP deadline
   - Calculate buffer or shortfall in days
   - Assess feasibility and risk

4. TERMS COMPLIANCE:
   - Classify as "Compliant", "Partial", or "Non-compliant"
   - Compare payment terms with RFP requirements
   - Compare warranty with RFP requirements
   - Note any deviations or exceptions

5. RISK FACTORS:
   - Identify specific, tangible risks (e.g., "Tight delivery timeline with no buffer", "Premium pricing 30% above budget")
   - List only significant risks that could impact project success
   - Return empty array [] if no major risks

6. RECOMMENDATION:
   - Provide clear, data-backed recommendation
   - Format: "Accept - [reason]" or "Reject - [reason]" or "Request Clarification - [what needs clarification]"
   - Base decision on OVERALL VALUE, not single factor
   - Include key supporting data points

Return ONLY this exact JSON structure:
{
  "completenessScore": number between 0-100,
  "priceCompetitiveness": "High" or "Medium" or "Low" with brief justification,
  "termsCompliance": "Compliant" or "Partial" or "Non-compliant" with brief explanation,
  "riskFactors": array of strings (specific risks only, or empty array),
  "recommendation": "Accept/Reject/Request Clarification - detailed reasoning with supporting data"
}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(
      content.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    );
  } catch (error) {
    console.error("Proposal analysis failed:", error.message);
    throw error;
  }
};

const compareProposals = async (proposals, rfpRequirements) => {
  try {
    const prompt = `You are a senior procurement analyst conducting a comprehensive vendor comparison to identify the BEST OVERALL VALUE.

CRITICAL INSTRUCTIONS:
- Evaluate ALL vendors on multiple criteria, not just price or speed
- Use weighted scoring: Price (25%), Delivery (20%), Terms (15%), Completeness (20%), Risk (20%)
- Recommend vendor with BEST OVERALL VALUE, not necessarily cheapest or fastest
- Provide specific data points and numbers in your reasoning
- Be thorough and objective

RFP REQUIREMENTS:
${JSON.stringify(rfpRequirements, null, 2)}

VENDOR PROPOSALS:
${JSON.stringify(proposals, null, 2)}

EVALUATION PROCESS:

STEP 1 - PRICE ANALYSIS:
- List each vendor's total cost with exact numbers
- Calculate price differences in $ and %
- Determine: Is cheapest offer the best value? Why/why not?
- Score each vendor 0-100 (lower price = higher score, but consider value)

STEP 2 - DELIVERY ANALYSIS:
- List each vendor's delivery timeline with exact numbers
- Calculate which is faster and by how many days
- Compare against RFP deadline and assess buffer
- Score 0-100 based on timeline vs requirements

STEP 3 - TERMS ANALYSIS:
- Compare payment terms side-by-side
- Compare warranties side-by-side
- Which vendor offers more favorable terms?
- Score 0-100 based on terms favorability

STEP 4 - COMPLETENESS ANALYSIS:
- Compare completeness scores from each proposal analysis
- Which vendor addresses requirements better?
- Score 0-100 based on RFP coverage

STEP 5 - RISK ANALYSIS:
- List risks for each vendor
- Which vendor presents lower overall risk?
- Score 0-100 (lower risk = higher score)

STEP 6 - CALCULATE WEIGHTED SCORE:
For each vendor: (Price×0.25) + (Delivery×0.20) + (Terms×0.15) + (Completeness×0.20) + (Risk×0.20)

STEP 7 - IDENTIFY STRENGTHS & CONCERNS:
- List 2-3 key strengths per vendor with specific data
- List concerns per vendor (empty array if none)

STEP 8 - FINAL RECOMMENDATION:
- Select vendor with highest weighted score OR best strategic fit
- If NOT recommending cheapest/fastest, explicitly justify the trade-off
- Include specific numbers and percentages in reasoning

Return ONLY this exact JSON structure:
{
  "bestVendorId": "vendor_id of recommended vendor",
  "reasoning": "Comprehensive explanation with: (1) Side-by-side price comparison with exact numbers and percentages, (2) Delivery timeline comparison with days, (3) Terms comparison, (4) Overall scores, (5) Why this vendor is the BEST VALUE despite any trade-offs, (6) Specific data supporting the decision. Minimum 150 words.",
  "priceComparison": "Detailed breakdown: Vendor A: $X, Vendor B: $Y (difference: $Z or N%). Explain value assessment and whether cheapest is best choice.",
  "overallScore": {
    "vendor_id_1": number between 0-100 (weighted score),
    "vendor_id_2": number between 0-100 (weighted score)
  },
  "strengths": {
    "vendor_id_1": ["specific strength with data", "specific strength with data"],
    "vendor_id_2": ["specific strength with data", "specific strength with data"]
  },
  "concerns": {
    "vendor_id_1": ["specific concern"] or [] if none,
    "vendor_id_2": ["specific concern"] or [] if none
  }
}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(
      content.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    );
  } catch (error) {
    console.error("Comparison failed:", error.message);
    throw error;
  }
};

module.exports = {
  parseRFPFromNaturalLanguage,
  parseVendorResponse,
  analyzeProposal,
  compareProposals,
};