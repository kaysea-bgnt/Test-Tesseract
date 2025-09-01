const express = require("express");
const { enhancedOcrParsed } = require("../services/tesseractOcr");

const router = express.Router();

/**
 * POST /ocr/process
 * Process OCR on image URL
 */
router.post("/process", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Image URL is required",
      });
    }

    console.log(`🔍 Processing OCR for URL: ${imageUrl}`);

    // Process OCR
    const ocrResult = await enhancedOcrParsed(imageUrl);

    if (!ocrResult.success) {
      return res.status(500).json({
        success: false,
        error: "OCR processing failed",
        details: ocrResult.error,
      });
    }

    const response = {
      success: true,
      store: ocrResult.store,
      items: ocrResult.items,
      totals: ocrResult.totals,
      metadata: ocrResult.metadata,
      confidence: ocrResult.confidence,
      processingTime: ocrResult.processingTime,
      rawText: ocrResult.rawText,
      method: ocrResult.method,
    };

    console.log(`✅ OCR completed successfully. Found ${ocrResult.items.length} items`);
    res.json(response);
  } catch (error) {
    console.error("❌ OCR processing error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
