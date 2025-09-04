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
      patterns: [/45000\s*a\s*RTIFIED/i, /BEAR\s+B\s+FORT\d+[A-Za-z]*/i, /BEAR\s+BIECRTEA0/i, /BEAR\s+BRANC(\s+PDR\s+MILK\s+\d+G)?/i],
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
    {
      name: "MiloActiveGo1kg", 
      patterns: [/Milo\s*Act\s*ive\s*Golk?a/i, /MiloActiveGo1kg/i],
    },
    {
      name: "Milo Actigen E Sachet 22G",
      patterns: [
        /MILO\s+ACTIGEN\s*E\s+SACHET\s*22G/i,
        /MILO\s+ACTIGEN\s*E\s+SACHET\s*\(24G\)/i,
        /MILO\s+ACTIGEN\s*E/i
      ],
    },
    {
      name: "Milo Activ-Go Winner TWN PCK 48G",
      patterns: [
        /MILO\s+ACTIV[- ]GO\s+WINNER\s+TWN\s+PCK\s+48G/i,
        /MILO\s+ACTIV[- ]GO\s+WINNER/i
      ],
    },
    {
      name: "Nestle KokoCrunch",
      patterns: [
        /NESTLE\s+KokoCrunch\s*El\s*oo\s*2\.00\s*i/i, 
        /(NESTLE\s+KOKOCRUNCH)/i
      ],
    }, 
    {
      name: "BEAR BRAND FCM 700G",
      patterns: [
        /.*BEAR\s+BRAND\s+FCM\s*(\d+)[0Oo]/i,
      ],
    },
    {
      name: "CHUCKIE 110ml",
      patterns: [
        /CH[Uu][Cc][Kk][Ii1][Ee]\s*110m[l1I]/i,
      ],
    },
    {
      name: "NIDO JR. MILK 2.4kg 1384.00", // can't be read by ocr as product
      patterns: [
        /NIDO\s*JR\.?\s*MILK\s*2\.4KG(?:\s*\d+\.?\d{0,2})?/i, 
        /NIDO\s*JR\s*\.?\s*mlKZ\.?\s*dk\s*1384(?:\.0*7)?/i,
      ],
    },

    {
      name: "BBRAND W-IRON 680G",
      patterns: [
        /BBRAND\s*W-IRON\s*680G/i,          
        /BEAR\s*BRAND\s*W-?IRON\s*680G/i,   
        /BBRAND\s*W-IRON\s*68O0?G/i         
      ],
    },

    {
      name: "BBRAND W-IRON 680G",
      patterns: [
        /BBRAND\s*W-IRON\s*680G/i,
        /BEAR\s*BRAND\s*W-?IRON\s*680G/i,
        /BBRAND\s*W-IRON\s*68O0?G/i
      ],
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
    { pattern:  /(\d{2,})(00)\b/, replacement: "$1.00"},
    

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
  baby: ["diapers", "milk", "baby food", "bear brand fortified", "nido 3+ pre-s1.6kg", "nido jr. milk", "NIDO JR. MILK 2.4kg"],
  personal: ["shampoo", "toothpaste", "deodorant"],
  grocery: ["rice", "oil", "sugar", "flour"],
};

module.exports = {
  PRODUCT_PATTERNS,
  NON_PRODUCT_KEYWORDS,
  PRODUCT_VALIDATION,
  PRODUCT_CATEGORIES,
};
