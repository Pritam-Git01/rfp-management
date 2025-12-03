const Tesseract = require("tesseract.js");
const pdfParse = require("pdf-parse");
const fs = require("fs").promises;
const { fromPath } = require("pdf2pic");
const sharp = require("sharp");
const path = require("path");

/**
 * Preprocess image for better OCR accuracy
 */
const preprocessImageForOCR = async (imagePath) => {
  try {
    const outputPath = imagePath.replace(
      path.extname(imagePath),
      "_processed" + path.extname(imagePath)
    );

    // Enhance image quality for OCR
    await sharp(imagePath)
      .grayscale() // Convert to grayscale
      .normalize() // Normalize contrast
      .sharpen() // Sharpen edges
      .threshold(128) // Binary threshold for better text recognition
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.warn("Image preprocessing failed, using original:", error.message);
    return imagePath; // Fallback to original if preprocessing fails
  }
};

/**
 * Extract text from image using OCR with preprocessing
 */
const extractTextFromImage = async (imagePath) => {
  try {
    console.log(`Starting OCR for image: ${imagePath}`);

    // Preprocess image for better OCR
    const processedPath = await preprocessImageForOCR(imagePath);

    // Perform OCR with optimized settings
    const {
      data: { text, confidence },
    } = await Tesseract.recognize(processedPath, "eng", {
      logger: (info) => {
        if (info.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
        }
      },
      tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Auto page segmentation
      preserve_interword_spaces: "1", // Preserve spacing
    });

    console.log(`OCR completed with confidence: ${confidence}%`);

    // Clean up processed image if it's different from original
    if (processedPath !== imagePath) {
      try {
        await fs.unlink(processedPath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }

    if (!text || text.trim().length === 0) {
      console.warn("OCR returned empty text");
      return "";
    }

    return text.trim();
  } catch (error) {
    console.error("OCR failed:", error.message);
    return ""; // Return empty string to allow email body processing
  }
};

/**
 * Check if PDF contains extractable text or is image-based
 */
const isPDFTextBased = async (pdfPath) => {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer, { max: 1 }); // Parse only first page

    // If we can extract meaningful text (more than 50 chars), it's text-based
    const hasText = data.text && data.text.trim().length > 50;
    console.log(
      `PDF type detection: ${hasText ? "Text-based" : "Image-based/Scanned"}`
    );

    return hasText;
  } catch (error) {
    console.warn("PDF type detection failed, assuming image-based:", error.message);
    return false; // Assume image-based if detection fails
  }
};

/**
 * Convert PDF pages to images for OCR
 */
const convertPDFToImages = async (pdfPath) => {
  try {
    const outputDir = path.join(path.dirname(pdfPath), "temp_pdf_images");
    
    // Create temp directory
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    const options = {
      density: 300, // Higher DPI for better OCR
      saveFilename: path.basename(pdfPath, ".pdf"),
      savePath: outputDir,
      format: "png",
      width: 2000, // High resolution
      height: 2000,
    };

    const convert = fromPath(pdfPath, options);
    
    // Convert first 10 pages (adjust as needed)
    const pageCount = 10;
    const imagePaths = [];

    for (let i = 1; i <= pageCount; i++) {
      try {
        const result = await convert(i, { responseType: "image" });
        imagePaths.push(result.path);
        console.log(`Converted PDF page ${i} to image`);
      } catch (err) {
        // No more pages
        console.log(`PDF has ${i - 1} pages`);
        break;
      }
    }

    return { imagePaths, outputDir };
  } catch (error) {
    console.error("PDF to image conversion failed:", error.message);
    throw error;
  }
};

/**
 * Extract text from image-based PDF using OCR
 */
const extractTextFromImagePDF = async (pdfPath) => {
  let outputDir = null;
  
  try {
    console.log("Extracting text from image-based PDF using OCR...");

    // Convert PDF pages to images
    const { imagePaths, outputDir: tempDir } = await convertPDFToImages(pdfPath);
    outputDir = tempDir;

    if (imagePaths.length === 0) {
      console.warn("No images extracted from PDF");
      return "";
    }

    // Perform OCR on each page
    const extractedTexts = [];
    
    for (let i = 0; i < imagePaths.length; i++) {
      console.log(`Processing page ${i + 1}/${imagePaths.length}...`);
      const pageText = await extractTextFromImage(imagePaths[i]);
      
      if (pageText.trim()) {
        extractedTexts.push(`--- Page ${i + 1} ---\n${pageText}`);
      }
    }

    // Cleanup temp images
    try {
      for (const imgPath of imagePaths) {
        await fs.unlink(imgPath);
      }
      await fs.rmdir(outputDir);
    } catch (cleanupError) {
      console.warn("Cleanup failed:", cleanupError.message);
    }

    const fullText = extractedTexts.join("\n\n");
    console.log(`Extracted ${fullText.length} characters from PDF via OCR`);

    return fullText;
  } catch (error) {
    console.error("Image-based PDF extraction failed:", error.message);
    
    // Cleanup on error
    if (outputDir) {
      try {
        await fs.rm(outputDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    return "";
  }
};

/**
 * Extract text from text-based PDF
 */
const extractTextFromTextPDF = async (pdfPath) => {
  try {
    const dataBuffer = await fs.readFile(pdfPath);

    // Try with default settings
    const data = await pdfParse(dataBuffer, {
      max: 0, // Parse all pages
    });

    if (data.text && data.text.trim().length > 0) {
      console.log(`Extracted ${data.text.length} characters from text-based PDF`);
      return data.text.trim();
    }

    console.warn("Text-based PDF parsing returned empty text");
    return "";
  } catch (error) {
    console.error("Text-based PDF parsing failed:", error.message);
    return "";
  }
};

/**
 * Smart PDF extraction - detects type and uses appropriate method
 */
const extractTextFromPDF = async (pdfPath) => {
  try {
    console.log(`Processing PDF: ${pdfPath}`);

    // Step 1: Check if PDF is text-based or image-based
    const isTextBased = await isPDFTextBased(pdfPath);

    if (isTextBased) {
      // Extract text directly from text-based PDF
      const text = await extractTextFromTextPDF(pdfPath);
      
      if (text && text.length > 50) {
        return text;
      }
      
      // If text extraction failed, fallback to OCR
      console.warn("Text extraction yielded poor results, trying OCR fallback...");
    }

    // Step 2: Use OCR for image-based PDFs or if text extraction failed
    return await extractTextFromImagePDF(pdfPath);
  } catch (error) {
    console.error(`PDF processing error for ${pdfPath}:`, error.message);
    return "";
  }
};

/**
 * Main document extraction function
 */
const extractTextFromDocument = async (filePath, mimetype) => {
  try {
    console.log(`Extracting text from ${mimetype}: ${filePath}`);

    if (mimetype === "application/pdf") {
      return await extractTextFromPDF(filePath);
    } else if (mimetype.startsWith("image/")) {
      return await extractTextFromImage(filePath);
    } else if (mimetype.includes("text") || mimetype.includes("plain")) {
      // Text files
      return await fs.readFile(filePath, "utf-8");
    } else {
      console.warn(`Unsupported mimetype: ${mimetype}, trying as text...`);
      try {
        return await fs.readFile(filePath, "utf-8");
      } catch (err) {
        console.warn(`Unable to read file as text: ${filePath}`);
        return "";
      }
    }
  } catch (error) {
    console.error(`Document extraction error for ${filePath}:`, error.message);
    return "";
  }
};

module.exports = {
  extractTextFromImage,
  extractTextFromPDF,
  extractTextFromDocument,
};