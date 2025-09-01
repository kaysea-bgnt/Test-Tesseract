const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const cloudinaryService = require("../services/cloudinaryService");
const { enhancedOcrParsed } = require("../services/tesseractOcr");
const productMatchingService = require("../services/productMatching");
const storeMatchingService = require("../services/storeMatching");
const duplicateDetectionService = require("../services/duplicateDetection");
const Receipt = require("../models/Receipt");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const router = express.Router();

// Helper function to find user by ID or username
async function findUser(userId) {
  let user = null;
  try {
    // Try to find by ObjectId first
    user = await User.findById(userId);
  } catch (error) {
    // If ObjectId fails, try to find by username
    user = await User.findOne({ username: userId });
  }
  return user;
}

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only allow 1 file
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."), false);
    }
  },
});

/**
 * POST /upload
 * Upload receipt image and process OCR
 */
router.post("/", upload.single("receipt"), async (req, res) => {
  // Set response timeout to 3 minutes for OCR processing
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000); // 3 minutes
  try {
    const { userId } = req.body;
    const file = req.file;

    // Validate input
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Validate user exists
    const user = await findUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log(`📁 Processing upload for user: ${userId}`);

    // 1. Upload to Cloudinary
    console.log("☁️ Uploading to Cloudinary...");
    const uploadResult = await cloudinaryService.uploadFile(file.buffer, file.originalname, file.mimetype);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to upload image",
        details: uploadResult.error,
      });
    }

    // 2. Process OCR
    const ocrResult = await enhancedOcrParsed(uploadResult.url);

    if (!ocrResult.success) {
      return res.status(500).json({
        success: false,
        error: "OCR processing failed",
        details: ocrResult.error,
      });
    }

    console.log("🔍 Checking for duplicate receipt...");

    const disableDup = process.env.DISABLE_DUPLICATE_DETECTION === "true";

    let imageHash = null;
    let duplicateCheck = { isDuplicate: false };

    if (!disableDup) {
      imageHash = duplicateDetectionService.generateImageHash(file.buffer);
      duplicateCheck = await duplicateDetectionService.checkForDuplicate(user._id, ocrResult, imageHash);
    } else {
      console.warn("⚠️ Duplicate detection DISABLED via DISABLE_DUPLICATE_DETECTION=true");
      // still compute hash for storage consistency
      imageHash = duplicateDetectionService.generateImageHash(file.buffer);
    }

    if (!disableDup && duplicateCheck.isDuplicate) {
      return res.status(409).json({
        success: false,
        error: "Duplicate receipt detected",
        details: {
          reason: duplicateCheck.reason,
          confidence: duplicateCheck.confidence,
          detectionMethods: duplicateCheck.detectionMethods,
          pointsAlreadyEarned: duplicateCheck.pointsAlreadyEarned,
          existingReceipt: {
            id: duplicateCheck.existingReceipt._id,
            referenceId: duplicateCheck.existingReceipt.referenceId,
            dateUploaded: duplicateCheck.existingReceipt.createdAt,
            pointsEarned: duplicateCheck.pointsAlreadyEarned,
          },
        },
      });
    }

    // 4. Match store
    console.log("🏪 Matching store...");
    const matchedStore = await storeMatchingService.findMatchingStore(ocrResult.store);

    // 5. Match products and calculate points
    console.log("🛍️ Matching products...");
    let totalPoints = 0;
    const matchedItems = [];

    for (const item of ocrResult.items) {
      const matchedProduct = await productMatchingService.findMatchingProduct(item);

      if (matchedProduct && matchedProduct._matchQuality !== "low") {
        const points = matchedProduct.points * item.quantity;
        totalPoints += points;

        matchedItems.push({
          ...item,
          productId: matchedProduct._id,
          matched: true,
          points: points,
          matchedProduct: {
            name: matchedProduct.name,
            brand: matchedProduct.brandId?.name || "Unknown",
            confidence: matchedProduct._confidenceScore,
            quality: matchedProduct._matchQuality,
          },
        });
      } else {
        matchedItems.push({
          ...item,
          matched: false,
          points: 0,
        });
      }
    }

    // 6. Create receipt record
    const receipt = new Receipt({
      userId: user._id, // Use the actual user ObjectId
      storeId: matchedStore?._id,
      store: ocrResult.store.name,
      referenceId: uuidv4(),
      url: uploadResult.url,
      totalAmount: ocrResult.totals.total,
      validAmount: matchedItems.reduce((sum, item) => sum + (item.matched ? item.totalPrice : 0), 0),
      datePurchase: ocrResult.metadata.receiptDate ? new Date(ocrResult.metadata.receiptDate) : new Date(),
      status: matchedStore ? "valid" : "flagged",
      reason: !matchedStore ? "STORE_NOT_FOUND" : null,
      ocrData: {
        text: ocrResult.rawText,
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime,
        fingerprint: duplicateDetectionService.generateReceiptFingerprint(ocrResult),
        imageHash: imageHash,
        items: matchedItems,
        totals: ocrResult.totals,
        metadata: ocrResult.metadata,
      },
    });

    await receipt.save();

    // 7. Create transaction if points earned
    let transaction = null;
    if (totalPoints > 0 && matchedStore) {
      transaction = new Transaction({
        userId: user._id, // Use the actual user ObjectId
        receiptId: receipt._id,
        storeId: matchedStore._id,
        purchaseAmount: receipt.validAmount,
        points: totalPoints,
        action: "earned",
        source: "receipt",
      });

      await transaction.save();

      // Update user points
      if (!user.points) {
        user.points = { balance: 0, amount: 0, status: "active" };
      }
      user.points.balance += totalPoints;
      user.points.amount += totalPoints;
      user.points.lastDateEarned = new Date();
      await user.save();
    }

    // 8. Return results
    const response = {
      success: true,
      receipt: {
        id: receipt._id,
        referenceId: receipt.referenceId,
        url: receipt.url,
        store: {
          name: receipt.store,
          matched: !!matchedStore,
          confidence: matchedStore?._confidenceScore,
        },
        totalAmount: receipt.totalAmount,
        validAmount: receipt.validAmount,
        status: receipt.status,
        datePurchase: receipt.datePurchase,
        duplicateDetection: {
          fingerprint: receipt.ocrData.fingerprint,
          imageHash: receipt.ocrData.imageHash,
        },
      },
      ocr: {
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime,
        items: matchedItems,
        totals: ocrResult.totals,
        rawText: ocrResult.rawText.substring(0, 500) + "...", // Truncate for response
      },
      points: {
        earned: totalPoints,
        transactionId: transaction?._id,
      },
      user: {
        id: user._id,
        currentBalance: user.points?.balance || 0,
        totalEarned: user.points?.amount || 0,
      },
    };

    console.log(`✅ Upload processed successfully. Points earned: ${totalPoints}`);
    res.json(response);
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * POST /upload/url
 * Process OCR from image URL
 */
router.post("/url", async (req, res) => {
  try {
    const { imageUrl, userId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Image URL is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Validate user exists
    const user = await findUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log(`🔗 Processing URL upload for user: ${userId}`);

    // Process OCR directly from URL
    const ocrResult = await enhancedOcrParsed(imageUrl);

    if (!ocrResult.success) {
      return res.status(500).json({
        success: false,
        error: "OCR processing failed",
        details: ocrResult.error,
      });
    }

    // Match store and products (same logic as file upload)
    const matchedStore = await storeMatchingService.findMatchingStore(ocrResult.store);

    let totalPoints = 0;
    const matchedItems = [];

    for (const item of ocrResult.items) {
      const matchedProduct = await productMatchingService.findMatchingProduct(item);

      if (matchedProduct && matchedProduct._matchQuality !== "low") {
        const points = matchedProduct.points * item.quantity;
        totalPoints += points;

        matchedItems.push({
          ...item,
          productId: matchedProduct._id,
          matched: true,
          points: points,
          matchedProduct: {
            name: matchedProduct.name,
            brand: matchedProduct.brandId?.name || "Unknown",
            confidence: matchedProduct._confidenceScore,
            quality: matchedProduct._matchQuality,
          },
        });
      } else {
        matchedItems.push({
          ...item,
          matched: false,
          points: 0,
        });
      }
    }

    const response = {
      success: true,
      store: {
        name: ocrResult.store.name,
        matched: !!matchedStore,
        confidence: matchedStore?._confidenceScore,
      },
      ocr: {
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime,
        items: matchedItems,
        totals: ocrResult.totals,
        rawText: ocrResult.rawText.substring(0, 500) + "...",
      },
      points: {
        potential: totalPoints,
      },
    };

    console.log(`✅ URL processing completed. Potential points: ${totalPoints}`);
    res.json(response);
  } catch (error) {
    console.error("❌ URL processing error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
