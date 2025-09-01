/**
 * Pattern Index - Export all OCR patterns
 * Centralized import point for all pattern modules
 */

const { STORE_PATTERNS, STORE_NAME_MAPPINGS, STORE_CATEGORIES } = require("./storePatterns");
const { PRODUCT_PATTERNS, NON_PRODUCT_KEYWORDS, PRODUCT_VALIDATION, PRODUCT_CATEGORIES } = require("./productPatterns");
const { OCR_CORRECTIONS, TEXT_PREPROCESSING, CORRECTION_CONFIDENCE } = require("./ocrCorrections");

module.exports = {
  // Store patterns
  STORE_PATTERNS,
  STORE_NAME_MAPPINGS,
  STORE_CATEGORIES,

  // Product patterns
  PRODUCT_PATTERNS,
  NON_PRODUCT_KEYWORDS,
  PRODUCT_VALIDATION,
  PRODUCT_CATEGORIES,

  // OCR corrections
  OCR_CORRECTIONS,
  TEXT_PREPROCESSING,
  CORRECTION_CONFIDENCE,

  // Convenience exports
  patterns: {
    store: STORE_PATTERNS,
    product: PRODUCT_PATTERNS,
    ocr: OCR_CORRECTIONS,
  },

  // Validation helpers
  validation: {
    store: STORE_NAME_MAPPINGS,
    product: PRODUCT_VALIDATION,
    categories: {
      store: STORE_CATEGORIES,
      product: PRODUCT_CATEGORIES,
    },
  },
};

