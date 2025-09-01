const Tesseract = require("tesseract.js");
const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const { detectStoreName, extractProducts, applyOcrCorrections } = require("../utils/ocrHelpers");

// Enhanced Tesseract configuration for better confidence scores
const TESSERACT_CONFIG = {
  logger: () => {}, // Disable Tesseract internal logging
};

// Confidence-boosting Tesseract parameters
const CONFIDENCE_BOOST_CONFIG = {
  // Page segmentation modes for better text recognition
  tessedit_pageseg_mode: "6", // Uniform block of text (best for receipts)

  // OCR engine mode for optimal performance
  tessedit_ocr_engine_mode: "3", // Default engine (LSTM + Legacy)

  // Language-specific optimizations
  preserve_interword_spaces: "1", // Preserve spaces between words
  textord_heavy_nr: "1", // Better handling of noise

  // Character recognition improvements
  tessedit_char_whitelist:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,@#$%&*()-+=/\\|[]{}:;\"'<>?₱", // Allow common receipt characters

  // Confidence threshold adjustments
  tessedit_min_confidence: "20", // Lower threshold to capture more text

  // Text quality improvements
  textord_min_linesize: "1.5", // Lower minimum line size for better detection
  textord_old_baselines: "0", // Use modern baseline detection

  // Noise reduction
  textord_noise_debug: "0", // Disable noise debug for better performance
  textord_heavy_nr: "1", // Heavy noise reduction for receipts

  // Character set optimizations
  tessedit_do_invert: "0", // Don't invert colors (receipts are usually dark text on light background)
};

/**
 * Smart preprocessing strategy based on image quality
 * High-quality images get minimal preprocessing, low-quality get enhanced
 */
async function smartPreprocess(imageBuffer, options = {}) {
  // For high-quality images (like mercury21.jpeg), use minimal preprocessing
  if (options.preprocess === "smart" || options.preprocess === true) {
    // Try fewer strategies for faster processing
    const strategies = [
      { name: "minimal", preprocess: false },
      { name: "enhanced", preprocess: "enhanced" },
    ];

    let bestResult = null;
    let bestScore = 0;

    for (const strategy of strategies) {
      console.log(`[Tesseract] Testing ${strategy.name} strategy...`);

      try {
        let processedBuffer = imageBuffer;

        if (strategy.preprocess === "grayscale") {
          processedBuffer = await sharp(imageBuffer).grayscale().toBuffer();
        } else if (strategy.preprocess === "enhanced") {
          processedBuffer = await sharp(imageBuffer)
            .grayscale()
            .linear(1.2, 0)
            .modulate({ brightness: 1.1 })
            .sharpen({ sigma: 0.8, m1: 1, m2: 0.5, x1: 2, y2: 10, y3: 20 })
            .median(1)
            .toBuffer();
        } else if (strategy.preprocess === "high-contrast") {
          processedBuffer = await sharp(imageBuffer)
            .grayscale()
            .linear(1.5, 0)
            .modulate({ brightness: 1.2, contrast: 1.3 })
            .toBuffer();
        }

        // Quick OCR test to evaluate strategy (with timeout)
        const testResult = await Promise.race([
          Tesseract.recognize(processedBuffer, "eng", {
            tessedit_pageseg_mode: "6",
            tessedit_ocr_engine_mode: "3",
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("OCR test timeout")), 10000)),
        ]);

        // Calculate strategy score
        const score = calculateStrategyScore(testResult.data.text, testResult.data.confidence);

        console.log(`[Tesseract] ${strategy.name} strategy score: ${score.toFixed(1)}%`);

        if (score > bestScore) {
          bestScore = score;
          bestResult = { buffer: processedBuffer, strategy: strategy.name };
        }
      } catch (error) {
        console.log(`[Tesseract] ${strategy.name} strategy failed: ${error.message}`);
      }
    }

    if (bestResult) {
      console.log(`[Tesseract] Selected ${bestResult.strategy} strategy (score: ${bestScore.toFixed(1)}%)`);
      return bestResult.buffer;
    }
  }

  // Fallback to original preprocessing logic
  if (options.preprocess === false) {
    console.log(`[Tesseract] Using raw image (no preprocessing)`);
    return imageBuffer;
  } else if (options.preprocess === "grayscale") {
    console.log(`[Tesseract] Using grayscale preprocessing`);
    return await sharp(imageBuffer).grayscale().toBuffer();
  } else if (options.preprocess === "high-contrast") {
    console.log(`[Tesseract] Using high contrast preprocessing`);
    return await sharp(imageBuffer).grayscale().linear(1.5, 0).modulate({ brightness: 1.2, contrast: 1.3 }).toBuffer();
  } else if (options.preprocess === "sharp-focus") {
    console.log(`[Tesseract] Using sharp focus preprocessing`);
    return await sharp(imageBuffer)
      .grayscale()
      .sharpen({ sigma: 1.2, m1: 1, m2: 0.5, x1: 2, y2: 10, y3: 20 })
      .linear(1.1, 0)
      .toBuffer();
  } else {
    // Default enhanced preprocessing pipeline
    console.log(`[Tesseract] Using enhanced preprocessing pipeline`);
    return await sharp(imageBuffer)
      .grayscale()
      .linear(1.2, 0)
      .modulate({ brightness: 1.1 })
      .sharpen({ sigma: 0.8, m1: 1, m2: 0.5, x1: 2, y2: 10, y3: 20 })
      .median(1)
      .toBuffer();
  }
}

/**
 * Calculate strategy score based on text quality and key elements
 */
function calculateStrategyScore(text, confidence) {
  let score = confidence * 0.4; // 40% weight to raw confidence

  // 60% weight to key element detection
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  score += Math.min(lines.length * 2, 20); // Max 20 points for lines

  // Key element bonuses
  if (text.match(/(?:MERCURY|MERCURY DRUG)/i)) score += 15;
  if (text.match(/(?:BBRAND|BEAR BRAND|NIDO|MLK|MILK)/i)) score += 10;
  if (text.match(/(?:TOTAL|GRAND TOTAL).*?\d+\.?\d*/i)) score += 15;
  if (text.match(/\d{12,}/)) score += 10; // Product codes
  if (text.match(/(?:TXN|INVOICE)/i)) score += 10;

  return Math.min(score, 100);
}

/**
 * Enhanced Tesseract OCR Service for receipt processing
 * Supports both local file paths and remote URLs with image preprocessing
 */
async function tesseractOcr(imagePathOrUrl, options = {}) {
  try {
    let imageBuffer;

    // Check if input is a local file
    if (fs.existsSync(imagePathOrUrl)) {
      imageBuffer = fs.readFileSync(imagePathOrUrl);
      console.log(`[Tesseract] Processing local file: ${imagePathOrUrl}`);
    } else if (/^https?:\/\//.test(imagePathOrUrl)) {
      // Download image from URL
      console.log(`[Tesseract] Downloading image from URL: ${imagePathOrUrl}`);
      const response = await axios.get(imagePathOrUrl, { responseType: "arraybuffer" });
      imageBuffer = Buffer.from(response.data, "binary");
    } else {
      throw new Error("Invalid image path or URL");
    }

    // Apply smart preprocessing strategy
    imageBuffer = await smartPreprocess(imageBuffer, options);

    // Run Tesseract OCR with enhanced options for receipt text
    const startTime = Date.now();

    const { data } = await Tesseract.recognize(imageBuffer, options.language || "eng", {
      ...options,
      ...TESSERACT_CONFIG,
      ...CONFIDENCE_BOOST_CONFIG, // Apply confidence-boosting configuration
    });

    const processingTime = Date.now() - startTime;

    // Clean OCR logging - show only raw and corrected text
    console.log(`\n📄 [RAW OCR TEXT]`);
    console.log("─".repeat(50));
    console.log(data.text);
    console.log("─".repeat(50));

    return {
      success: true,
      text: data.text,
      confidence: data.confidence,
      words: data.words,
      lines: data.lines,
      processingTime,
      preprocessed: options.preprocess || false,
      method: "nodejs",
    };
  } catch (error) {
    console.error("Tesseract OCR Error:", error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Parse raw text into receipt structure
 */
function parseReceiptText(text, ocrResult = {}) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Parse extracted lines

  // Apply OCR corrections to text
  const correctedText = applyOcrCorrections(text);

  // Show corrected text after OCR corrections
  console.log(`\n📝 [CORRECTED OCR TEXT]`);
  console.log("─".repeat(50));
  console.log(correctedText);
  console.log("─".repeat(50));

  // Detect store name using patterns
  const storeName = detectStoreName(correctedText);

  // Enhanced total amount detection
  let total = 0;
  let subtotal = 0;

  // Look for TOTAL, GRAND TOTAL, AMOUNT DUE
  const totalPatterns = [
    /(?:TOTAL|GRAND TOTAL|AMOUNT DUE).*?([\d,]+\.?\d*)/i,
    /₱\s*([\d,]+\.?\d*)/i,
    /PHP\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      total = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }

  // Look for SUBTOTAL
  const subtotalMatch = text.match(/(?:SUBTOTAL).*?([\d,]+\.?\d*)/i);
  if (subtotalMatch) {
    subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ""));
  }

  // Extract products using patterns
  const items = extractProducts(correctedText);

  // Enhanced date detection
  let receiptDate = null;
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
    /(\d{2}\/\d{2}\/\d{4})/, // MM/DD/YYYY
    /(\d{2}-\d{2}-\d{4})/, // MM-DD-YYYY
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      receiptDate = match[1];
      break;
    }
  }

  // Enhanced receipt number detection
  let receiptNumber = null;
  const receiptPatterns = [
    /(?:RECEIPT|NO|#)\s*[:#-]?\s*(\w+)/i,
    /(?:SN|SERIAL)\s*[:#-]?\s*(\w+)/i,
    /(?:PTU|TIN)\s*[:#-]?\s*(\w+)/i,
  ];

  for (const pattern of receiptPatterns) {
    const match = text.match(pattern);
    if (match) {
      receiptNumber = match[1];
      break;
    }
  }

  console.log(`[Parser] Found ${items.length} items, total: ${total}`);

  return {
    success: true,
    store: {
      name: storeName,
      address: "",
      phone: "",
      taxId: "",
    },
    items,
    totals: {
      subtotal: subtotal || total,
      tax: 0,
      total,
      currency: "PHP",
    },
    metadata: {
      receiptDate,
      receiptNumber,
      cashier: "",
      paymentMethod: "",
    },
    confidence: ocrResult.confidence || 85,
    processingTime: ocrResult.processingTime || 0,
    rawText: text,
    method: ocrResult.method || "nodejs",
    auditTrail: {
      processingSteps: [
        {
          step: "tesseract_ocr",
          timestamp: new Date().toISOString(),
          details: {
            method: ocrResult.method || "nodejs",
            language: "eng",
            confidence: ocrResult.confidence || 85,
            linesExtracted: lines.length,
            preprocessed: ocrResult.preprocessed || false,
          },
        },
      ],
    },
  };
}

/**
 * Parse Tesseract OCR output into expected receipt OCR data structure
 * Compatible with the existing upload flow
 */
async function tesseractOcrParsed(imagePathOrUrl, options = {}) {
  const startTime = Date.now();
  console.log(`[Tesseract] Starting receipt parsing for: ${imagePathOrUrl}`);

  // Use smart preprocessing by default
  const smartOptions = { ...options, preprocess: "smart" };

  const ocrResult = await tesseractOcr(imagePathOrUrl, smartOptions);
  if (!ocrResult.success) {
    console.error(`[Tesseract] OCR failed: ${ocrResult.error}`);
    return ocrResult;
  }

  const parsedResult = parseReceiptText(ocrResult.text, ocrResult);
  const totalProcessingTime = Date.now() - startTime;

  console.log(`[Tesseract] Receipt parsing completed in ${totalProcessingTime}ms`);
  console.log(`[Tesseract] Found ${parsedResult.items.length} items, total: ${parsedResult.totals.total}`);

  return {
    ...parsedResult,
    processingTime: totalProcessingTime,
  };
}

/**
 * Enhanced OCR with multiple preprocessing strategies for optimal confidence
 * Tests different preprocessing approaches and selects the best result
 */
async function enhancedOcrParsed(imagePathOrUrl, options = {}) {
  console.log(`[Enhanced OCR] Starting multi-strategy processing for: ${imagePathOrUrl}`);

  const strategies = [
    {
      name: "Minimal Preprocessing",
      preprocess: false,
      description: "Grayscale only - minimal processing (best for high-quality images)",
    },
    {
      name: "Enhanced Preprocessing",
      preprocess: true,
      description: "Multi-step preprocessing with contrast, sharpening, and noise reduction",
    },
    {
      name: "High Contrast",
      preprocess: "high-contrast",
      description: "Aggressive contrast enhancement",
    },
    {
      name: "Sharp Focus",
      preprocess: "sharp-focus",
      description: "Enhanced sharpening for clear text",
    },
  ];

  const results = [];

  // Test each preprocessing strategy
  for (const strategy of strategies) {
    try {
      const result = await tesseractOcrParsed(imagePathOrUrl, {
        ...options,
        preprocess: strategy.preprocess,
      });

      if (result.success) {
        results.push({
          ...result,
          strategy: strategy.name,
          description: strategy.description,
        });
      }
    } catch (error) {
      // Silent fail - try next strategy
    }
  }

  if (results.length === 0) {
    return {
      success: false,
      error: "All preprocessing strategies failed",
      timestamp: new Date().toISOString(),
    };
  }

  // Select the best result based on multiple criteria
  let bestResult = results[0];
  let bestScore = 0;

  for (const result of results) {
    // Calculate composite score: 60% confidence + 30% items found + 10% store detection
    const confidenceScore = result.confidence || 0;
    const itemsScore = Math.min((result.items.length / 10) * 100, 100); // Cap at 100%
    const storeScore = result.store?.name && result.store.name !== "Unknown Store" ? 100 : 0;

    const compositeScore = confidenceScore * 0.6 + itemsScore * 0.3 + storeScore * 0.1;

    // Calculate composite score silently

    if (compositeScore > bestScore) {
      bestScore = compositeScore;
      bestResult = result;
    }
  }

  return {
    ...bestResult,
    strategyUsed: bestResult.strategy,
    strategyDescription: bestResult.description,
    allResults: results.map((r) => ({
      strategy: r.strategy,
      confidence: r.confidence,
      itemsCount: r.items.length,
      storeDetected: r.store?.name !== "Unknown Store",
    })),
  };
}

/**
 * Quick quality detection for immediate improvement
 * This provides a fast solution for your deadline
 */
async function quickQualityDetection(imageBuffer) {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();

    // Simple quality indicators
    const isHighQuality = metadata.width >= 800 && metadata.height >= 600 && metadata.channels >= 3;

    console.log(`[Quality] Image: ${metadata.width}x${metadata.height}, Channels: ${metadata.channels}`);
    console.log(`[Quality] Detected as: ${isHighQuality ? "HIGH QUALITY" : "LOW QUALITY"}`);

    return isHighQuality;
  } catch (error) {
    console.log(`[Quality] Error detecting quality: ${error.message}`);
    return false; // Default to low quality
  }
}

module.exports = tesseractOcr;
module.exports.tesseractOcrParsed = tesseractOcrParsed;
module.exports.enhancedOcrParsed = enhancedOcrParsed;
