/**
 * Product Detection Patterns for OCR
 * Handles product extraction and OCR error corrections
 */

const PRODUCT_PATTERNS = {
  // Specific product patterns - only for well-known brands
  specificProducts: [
    // Keep only essential, well-known products
    {
      name: "Nestle Milo",
      patterns: [/(MILO\s+\d+[gml])\s+([\d,]+\.?\d*)/i, /(NESTLE\s+MILO\s+\d+[gml])\s+([\d,]+\.?\d*)/i],
    },
    {
      name: "Coca-Cola",
      patterns: [/(COCA\s*COLA\s+\d+\.?\d*[lml])\s+([\d,]+\.?\d*)/i, /(COKE\s+\d+\.?\d*[lml])\s+([\d,]+\.?\d*)/i],
    },
    // Added from OCR corrections
    {
      name: "Bear Brand Fortified",
      patterns: [/45000\s*a\s*RTIFIED/i, /BEAR\s+B\s+FORT\d+[A-Za-z]*/i, /BEAR\s+BIECRTEA0/i],
    },
    {
      name: "Nescafe Gold",
      patterns: [/NESCAFE\s+GOLD\s+29/i],
    },
    {
      name: "NIDO3+PRE-S1.6KG",
      patterns: [/WIDO3HPRE-51\s*6KG/i, /NIDO3\+PRE-S1\.6KG/i],
    },
    {
      name: "NIDO3+PRE-S2.4KG",
      patterns: [/MIO034PRE-S7./i, /NIDO3\+PRE-S2\.4KG/i],
    },
  ],

  // Generic patterns removed - now handled by smart detection in ocrHelpers.js
  genericPatterns: [],

  // Volume unit patterns
  volumeUnits: [
    { pattern: /\.dkg/i, replacement: ".4kg" },
    { pattern: /\.d\s*kg/i, replacement: ".4kg" },
    { pattern: /\.d\s*ml/i, replacement: ".4ml" },
    { pattern: /\.d\s*l/i, replacement: ".4l" },
    { pattern: /\.d\s*g/i, replacement: ".4g" },
    { pattern: /kg/i, replacement: "kg" },
    { pattern: /ml/i, replacement: "ml" },
    { pattern: /l/i, replacement: "l" },
    { pattern: /g/i, replacement: "g" },
    { pattern: /pack/i, replacement: "pack" },
  ],

  // Price correction patterns
  priceCorrections: [
    { pattern: /150\.007/i, replacement: "1150.00" },
    { pattern: /1150/i, replacement: "1150.00" },
    { pattern: /(\d+)\.(\d{3})/i, replacement: "$1$2.00" }, // Fix decimal places
  ],
};

// Non-product keywords (items to filter out)
const NON_PRODUCT_KEYWORDS = [
  // Receipt totals and payments
  "total",
  "subtotal",
  "cash",
  "change",
  "vat",
  "tax",
  "amount",
  "due",
  "tendered",
  "payment",
  "receipt",

  // Store information
  "mercury",
  "drug",
  "corporation",
  "address",
  "phone",
  "hypermarket",
  "supermarket",
  "mall",
  "store",

  // Receipt metadata
  "date",
  "time",
  "cashier",
  "operator",
  "invoice",
  "transaction",
  "serial",
  "number",
  "reference",

  // Common OCR mistakes
  "cast",
  "caste",
  "cass",
  "cassh",
  "case",
];

// Product validation rules
const PRODUCT_VALIDATION = {
  minLength: 3,
  maxLength: 100,
  minPrice: 0.01,
  maxPrice: 10000,
  allowedCharacters: /^[A-Za-z0-9\s\.\-\(\)]+$/,
};

// Product categories for better organization
const PRODUCT_CATEGORIES = {
  beverages: ["milo", "coca-cola", "pepsi", "coffee", "tea", "nescafe gold"],
  snacks: ["chips", "crackers", "cookies", "candy"],
  household: ["soap", "detergent", "cleaning"],
  baby: ["diapers", "milk", "baby food", "bear brand fortified", "nido 3+ pre-s1.6kg"],
  personal: ["shampoo", "toothpaste", "deodorant"],
  grocery: ["rice", "oil", "sugar", "flour"],
};

module.exports = {
  PRODUCT_PATTERNS,
  NON_PRODUCT_KEYWORDS,
  PRODUCT_VALIDATION,
  PRODUCT_CATEGORIES,
};
