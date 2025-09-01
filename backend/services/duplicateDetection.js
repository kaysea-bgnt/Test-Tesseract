const Receipt = require("../models/Receipt");
const Transaction = require("../models/Transaction");
const crypto = require("crypto");

/**
 * Duplicate Receipt Detection Service
 * Uses multiple methods to detect if a receipt has already been processed
 */
class DuplicateDetectionService {
  /**
   * Generate a unique fingerprint for a receipt based on OCR data
   */
  generateReceiptFingerprint(ocrResult) {
    const fingerprintData = {
      store: ocrResult.store?.name || "",
      total: ocrResult.totals?.total || 0,
      date: ocrResult.metadata?.receiptDate || "",
      receiptNumber: ocrResult.metadata?.receiptNumber || "",
      items:
        ocrResult.items
          ?.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)) || [],
    };

    // Create hash from fingerprint data
    const hash = crypto.createHash("sha256");
    hash.update(JSON.stringify(fingerprintData));
    return hash.digest("hex");
  }

  /**
   * Check for duplicate receipt using multiple detection methods
   * Optimized for speed - stops early if high-confidence duplicate found
   */
  async checkForDuplicate(userId, ocrResult, imageHash = null) {
    console.log(`🔍 Checking for duplicate receipt for user: ${userId}`);

    const duplicateChecks = [];

    // Method 1: Check by image hash first (fastest and most accurate)
    if (imageHash) {
      const imageHashCheck = await this.checkByImageHash(userId, imageHash);
      duplicateChecks.push({
        method: "image_hash",
        isDuplicate: imageHashCheck.isDuplicate,
        confidence: imageHashCheck.confidence,
        existingReceipt: imageHashCheck.existingReceipt,
        pointsAlreadyEarned: imageHashCheck.pointsAlreadyEarned,
      });

      // Early exit if exact image match found
      if (imageHashCheck.isDuplicate && imageHashCheck.pointsAlreadyEarned) {
        console.log(`🔍 Early exit: Exact image match with points already earned`);
        return this.analyzeDuplicateChecks(duplicateChecks);
      }
    }

    // Method 2: Check by receipt number (very specific)
    if (ocrResult.metadata?.receiptNumber) {
      const receiptNumberCheck = await this.checkByReceiptNumber(userId, ocrResult);
      duplicateChecks.push({
        method: "receipt_number",
        isDuplicate: receiptNumberCheck.isDuplicate,
        confidence: receiptNumberCheck.confidence,
        existingReceipt: receiptNumberCheck.existingReceipt,
        pointsAlreadyEarned: receiptNumberCheck.pointsAlreadyEarned,
      });

      // Early exit if exact receipt number match found
      if (receiptNumberCheck.isDuplicate && receiptNumberCheck.pointsAlreadyEarned) {
        console.log(`🔍 Early exit: Exact receipt number match with points already earned`);
        return this.analyzeDuplicateChecks(duplicateChecks);
      }
    }

    // Method 3: Check by receipt fingerprint
    const fingerprint = this.generateReceiptFingerprint(ocrResult);
    const fingerprintCheck = await this.checkByFingerprint(userId, fingerprint);
    duplicateChecks.push({
      method: "fingerprint",
      isDuplicate: fingerprintCheck.isDuplicate,
      confidence: fingerprintCheck.confidence,
      existingReceipt: fingerprintCheck.existingReceipt,
      pointsAlreadyEarned: fingerprintCheck.pointsAlreadyEarned,
    });

    // Method 4: Check by store + total + date combination (slowest, do last)
    const storeTotalDateCheck = await this.checkByStoreTotalDate(userId, ocrResult);
    duplicateChecks.push({
      method: "store_total_date",
      isDuplicate: storeTotalDateCheck.isDuplicate,
      confidence: storeTotalDateCheck.confidence,
      existingReceipt: storeTotalDateCheck.existingReceipt,
      pointsAlreadyEarned: storeTotalDateCheck.pointsAlreadyEarned,
    });

    // Analyze results
    const analysis = this.analyzeDuplicateChecks(duplicateChecks);

    console.log(`🔍 Duplicate detection results:`, {
      isDuplicate: analysis.isDuplicate,
      confidence: analysis.confidence,
      methods: duplicateChecks.map((check) => `${check.method}: ${check.isDuplicate ? "YES" : "NO"}`),
    });

    return analysis;
  }

  /**
   * Check for duplicate by receipt fingerprint
   */
  async checkByFingerprint(userId, fingerprint) {
    try {
      const existingReceipt = await Receipt.findOne({
        userId: userId,
        "ocrData.fingerprint": fingerprint,
        status: { $in: ["valid", "flagged"] },
      });

      if (existingReceipt) {
        // Check if points were already earned
        const transaction = await Transaction.findOne({
          receiptId: existingReceipt._id,
          action: "earned",
        });

        const pointsAlreadyEarned = !!transaction;

        // Smart duplicate detection: Only block if points were actually earned
        // Don't block just because receipt is "valid" - points might not have been earned
        const shouldBlock = pointsAlreadyEarned;

        return {
          isDuplicate: shouldBlock,
          confidence: shouldBlock ? 0.95 : 0.3, // Lower confidence for non-blocking duplicates
          existingReceipt: existingReceipt,
          pointsAlreadyEarned: pointsAlreadyEarned,
          reason: shouldBlock
            ? "Duplicate receipt with points already earned"
            : "Similar receipt found but no points earned - allowing retry",
        };
      }

      return { isDuplicate: false, confidence: 0 };
    } catch (error) {
      console.error("Error checking by fingerprint:", error);
      return { isDuplicate: false, confidence: 0 };
    }
  }

  /**
   * Check for duplicate by store + total + date combination
   */
  async checkByStoreTotalDate(userId, ocrResult) {
    try {
      const store = ocrResult.store?.name;
      const total = ocrResult.totals?.total;
      const date = ocrResult.metadata?.receiptDate;

      if (!store || !total || !date) {
        return { isDuplicate: false, confidence: 0 };
      }

      // Allow some tolerance for total amount (±1 peso)
      const totalTolerance = 1;
      const dateTolerance = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      const existingReceipt = await Receipt.findOne({
        userId: userId,
        store: { $regex: new RegExp(store, "i") },
        totalAmount: { $gte: total - totalTolerance, $lte: total + totalTolerance },
        datePurchase: {
          $gte: new Date(new Date(date).getTime() - dateTolerance),
          $lte: new Date(new Date(date).getTime() + dateTolerance),
        },
        status: { $in: ["valid", "flagged"] },
      });

      if (existingReceipt) {
        const transaction = await Transaction.findOne({
          receiptId: existingReceipt._id,
          action: "earned",
        });

        const pointsAlreadyEarned = !!transaction;

        // Smart duplicate detection: Only block if points were actually earned
        // Don't block just because receipt is "valid" - points might not have been earned
        const shouldBlock = pointsAlreadyEarned;

        return {
          isDuplicate: shouldBlock,
          confidence: shouldBlock ? 0.85 : 0.25, // Lower confidence for non-blocking duplicates
          existingReceipt: existingReceipt,
          pointsAlreadyEarned: pointsAlreadyEarned,
          reason: shouldBlock
            ? "Duplicate receipt with points already earned"
            : "Similar receipt found but no points earned - allowing retry",
        };
      }

      return { isDuplicate: false, confidence: 0 };
    } catch (error) {
      console.error("Error checking by store total date:", error);
      return { isDuplicate: false, confidence: 0 };
    }
  }

  /**
   * Check for duplicate by receipt number
   */
  async checkByReceiptNumber(userId, ocrResult) {
    try {
      const receiptNumber = ocrResult.metadata?.receiptNumber;
      const store = ocrResult.store?.name;

      if (!receiptNumber || !store) {
        return { isDuplicate: false, confidence: 0 };
      }

      const existingReceipt = await Receipt.findOne({
        userId: userId,
        store: { $regex: new RegExp(store, "i") },
        "ocrData.metadata.receiptNumber": receiptNumber,
        status: { $in: ["valid", "flagged"] },
      });

      if (existingReceipt) {
        const transaction = await Transaction.findOne({
          receiptId: existingReceipt._id,
          action: "earned",
        });

        const pointsAlreadyEarned = !!transaction;

        // Receipt number is very specific - but only block if points were earned
        const shouldBlock = pointsAlreadyEarned;

        return {
          isDuplicate: shouldBlock,
          confidence: shouldBlock ? 0.98 : 0.3, // Lower confidence if no points earned
          existingReceipt: existingReceipt,
          pointsAlreadyEarned: pointsAlreadyEarned,
          reason: shouldBlock
            ? "Exact receipt number match with points already earned"
            : "Exact receipt number match but no points earned - allowing retry",
        };
      }

      return { isDuplicate: false, confidence: 0 };
    } catch (error) {
      console.error("Error checking by receipt number:", error);
      return { isDuplicate: false, confidence: 0 };
    }
  }

  /**
   * Check for duplicate by image hash
   */
  async checkByImageHash(userId, imageHash) {
    try {
      const existingReceipt = await Receipt.findOne({
        userId: userId,
        "ocrData.imageHash": imageHash,
        status: { $in: ["valid", "flagged"] },
      });

      if (existingReceipt) {
        const transaction = await Transaction.findOne({
          receiptId: existingReceipt._id,
          action: "earned",
        });

        const pointsAlreadyEarned = !!transaction;

        // Exact image match - but only block if points were earned
        const shouldBlock = pointsAlreadyEarned;

        return {
          isDuplicate: shouldBlock,
          confidence: shouldBlock ? 0.99 : 0.3, // Lower confidence if no points earned
          existingReceipt: existingReceipt,
          pointsAlreadyEarned: pointsAlreadyEarned,
          reason: shouldBlock
            ? "Exact image match with points already earned"
            : "Exact image match but no points earned - allowing retry",
        };
      }

      return { isDuplicate: false, confidence: 0 };
    } catch (error) {
      console.error("Error checking by image hash:", error);
      return { isDuplicate: false, confidence: 0 };
    }
  }

  /**
   * Analyze multiple duplicate check results
   */
  analyzeDuplicateChecks(checks) {
    const duplicateChecks = checks.filter((check) => check.isDuplicate);

    if (duplicateChecks.length === 0) {
      return {
        isDuplicate: false,
        confidence: 0,
        reason: "No duplicates found",
      };
    }

    // Separate high-confidence duplicates (should block) from low-confidence ones (allow retry)
    const highConfidenceDuplicates = duplicateChecks.filter((check) => check.confidence >= 0.8);
    const lowConfidenceDuplicates = duplicateChecks.filter((check) => check.confidence < 0.8);

    // Check if any duplicates have points already earned
    const hasPointsEarned = duplicateChecks.some((check) => check.pointsAlreadyEarned);

    // Smart blocking logic:
    // 1. Block if points were already earned (regardless of confidence)
    // 2. Block if high confidence duplicate found (≥80% confidence) AND points were earned
    // 3. Block if multiple methods detect it (≥3 methods) AND points were earned
    // 4. Allow retry if no points were earned or only low confidence duplicates found
    const shouldBlock =
      hasPointsEarned ||
      (highConfidenceDuplicates.length > 0 && hasPointsEarned) ||
      (duplicateChecks.length >= 3 && hasPointsEarned);

    // Calculate overall confidence
    const totalConfidence = duplicateChecks.reduce((sum, check) => sum + check.confidence, 0);
    const averageConfidence = totalConfidence / duplicateChecks.length;

    // Get the most confident duplicate
    const mostConfidentDuplicate = duplicateChecks.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    // Generate reason message
    let reason;
    if (!shouldBlock) {
      reason = "Similar receipts found but allowing retry (no points earned)";
    } else if (hasPointsEarned) {
      reason = `Duplicate detected with points already earned (${duplicateChecks.length} methods)`;
    } else if (highConfidenceDuplicates.length > 0) {
      reason = `High confidence duplicate detected (${highConfidenceDuplicates.length} methods)`;
    } else {
      reason = `Multiple duplicate detection methods (${duplicateChecks.length} methods)`;
    }

    return {
      isDuplicate: shouldBlock,
      confidence: averageConfidence,
      reason: reason,
      existingReceipt: mostConfidentDuplicate?.existingReceipt,
      pointsAlreadyEarned: hasPointsEarned,
      detectionMethods: duplicateChecks.map((check) => check.method),
      details: {
        highConfidenceMethods: highConfidenceDuplicates.map((check) => check.method),
        lowConfidenceMethods: lowConfidenceDuplicates.map((check) => check.method),
        totalMethods: duplicateChecks.length,
      },
    };
  }

  /**
   * Generate image hash for duplicate detection
   */
  generateImageHash(imageBuffer) {
    const hash = crypto.createHash("sha256");
    hash.update(imageBuffer);
    return hash.digest("hex");
  }
}

module.exports = new DuplicateDetectionService();
