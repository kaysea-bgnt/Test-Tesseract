/**
 * OCR Helper Utilities
 * Functions to apply OCR corrections and patterns
 */

const { STORE_PATTERNS, PRODUCT_PATTERNS, OCR_CORRECTIONS, NON_PRODUCT_KEYWORDS } = require("../data/patterns");
const { PRODUCT_PATTERNS: PRODUCT_PATTERNS_EXTENDED } = require("../data/patterns/productPatterns");

/**
 * Apply OCR corrections to text
 * @param {string} text - Raw text from OCR
 * @returns {string} Corrected text
 */
function applyOcrCorrections(text) {
  let correctedText = text;

  // Apply character corrections
  for (const correction of OCR_CORRECTIONS.characterMistakes) {
    correctedText = correctedText.replace(new RegExp(correction.from, "g"), correction.to);
  }

  // Apply word corrections
  for (const correction of OCR_CORRECTIONS.wordMistakes) {
    correctedText = correctedText.replace(correction.from, correction.to);
  }

  // Apply volume corrections
  for (const correction of OCR_CORRECTIONS.volumeCorrections) {
    correctedText = correctedText.replace(correction.from, correction.to);
  }

  // Apply price corrections
  for (const correction of OCR_CORRECTIONS.priceCorrections) {
    correctedText = correctedText.replace(correction.from, correction.to);
  }

  // Apply store corrections
  for (const correction of OCR_CORRECTIONS.storeCorrections) {
    correctedText = correctedText.replace(correction.from, correction.to);
  }

  // Apply product corrections
  for (const correction of OCR_CORRECTIONS.productCorrections) {
    correctedText = correctedText.replace(correction.from, correction.to);
  }

  return correctedText;
}

/**
 * Detect store name from text using patterns
 * @param {string} text - OCR text
 * @returns {string} Detected store name or "Unknown Store"
 */
function detectStoreName(text) {
  let storeName = "Unknown Store";

  console.log(`\n🏪 [STORE DETECTION]`);

  // Check Mercury Drug patterns first
  for (const pattern of STORE_PATTERNS.mercuryDrug) {
    const match = text.match(pattern);
    if (match) {
      storeName = match[1] || match[0];
      console.log(`🏪 [Store Found] Mercury Drug: "${storeName}"`);
      return storeName;
    }
  }

  // Check Savemore patterns
  for (const pattern of STORE_PATTERNS.savemore) {
    const match = text.match(pattern);
    if (match) {
      storeName = match[1] || match[0];
      console.log(`🏪 [Store Found] Savemore: "${storeName}"`);
      return storeName;
    }
  }

  // Check SM Group patterns
  for (const pattern of STORE_PATTERNS.smGroup) {
    const match = text.match(pattern);
    if (match) {
      storeName = match[1] || match[0];
      console.log(`🏪 [Store Found] SM Group: "${storeName}"`);
      return storeName;
    }
  }

  // Check major retailers
  for (const pattern of STORE_PATTERNS.majorRetailers) {
    const match = text.match(pattern);
    if (match) {
      storeName = match[1] || match[0];
      console.log(`🏪 [Store Found] Major Retailer: "${storeName}"`);
      return storeName;
    }
  }

  // Check generic patterns
  for (const pattern of STORE_PATTERNS.genericStores) {
    const match = text.match(pattern);
    if (match) {
      storeName = match[1] || match[0];
      console.log(`🏪 [Store Found] Generic Store: "${storeName}"`);
      return storeName;
    }
  }

  // Fallback: Check for keywords
  for (const [key, keywords] of Object.entries(STORE_PATTERNS.keywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        // Use STORE_NAME_MAPPINGS instead of STORE_PATTERNS.keywords
        const { STORE_NAME_MAPPINGS } = require("../data/patterns/storePatterns");
        storeName = STORE_NAME_MAPPINGS[key] || "Unknown Store";
        console.log(`🏪 [Store Found] "${storeName}" (keyword: "${keyword}")`);
        return storeName;
      }
    }
  }

  return storeName;
}

/**
 * Check if product matches specific product patterns
 * @param {string} productName - Product name to check
 * @returns {Object|null} Product info if matched, null otherwise
 */
function matchSpecificProduct(productName) {
  const normalizedName = productName.toLowerCase().trim();

  // Check specific product patterns from productPatterns.js
  for (const product of PRODUCT_PATTERNS_EXTENDED.specificProducts) {
    for (const pattern of product.patterns) {
      if (pattern.test(productName)) {
        return {
          name: product.name,
          originalName: productName,
          matched: true,
          pattern: pattern.source,
        };
      }
    }
  }

  return null;
}

/**
 * Check if item is likely a product
 * @param {string} itemName - Item name to check
 * @returns {boolean} True if likely a product
 */
function isLikelyProduct(itemName) {
  const normalizedName = itemName.toLowerCase().trim();

  // Skip empty or very short items
  if (!normalizedName || normalizedName.length < 2) {
    return false;
  }

  // Skip pure numbers or prices
  if (/^[\d.,₱$]+$/.test(normalizedName)) {
    return false;
  }

  // Skip common receipt metadata
  const metadataKeywords = [
    "total",
    "subtotal",
    "cash",
    "cast", // OCR often reads "CASH" as "Cast"
    "change",
    "vat",
    "tax",
    "amount",
    "due",
    "tendered",
    "payment",
    "receipt",
    "date",
    "time",
    "cashier",
    "operator",
    "invoice",
    "transaction",
    "serial",
    "number",
    "reference",
    "mercury",
    "drug",
    "corporation",
    "address",
    "phone",
    "hypermarket",
    "supermarket",
    "mall",
    "store",
    "sold",
    "cred",
    "crd",
    "suki",
    "points",
    "balance",
    "earned",
    "redeemed",
    "previous",
    "extra",
  ];

  // Check if this is a known specific product first (before filtering)
  const specificProductMatch = matchSpecificProduct(itemName);
  if (specificProductMatch) {
    console.log(`🎯 [Known Product] "${itemName}" → "${specificProductMatch.name}"`);
    return true;
  }

  for (const keyword of metadataKeywords) {
    if (normalizedName.includes(keyword)) {
      return false;
    }
  }

  // Must contain letters (not just symbols/numbers)
  if (!/[a-zA-Z]/.test(normalizedName)) {
    return false;
  }

  return true;
}

/**
 * Extract products from OCR text
 * @param {string} text - OCR text
 * @returns {Array} Array of product objects
 */
function extractProducts(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const products = [];

  console.log(`\n🛍️ [PRODUCT EXTRACTION]`);
  console.log(`Processing ${lines.length} lines...`);

  // Smart product detection patterns
  const productPatterns = [
    // Pattern 1: "Product Name Price" (most common)
    /^([A-Za-z\s]+(?:\s+\d+\.?\d*[kglmlpack]+)?)\s+([\d,]+\.?\d*)$/,
    // Pattern 2: "Product Name ₱Price"
    /^([A-Za-z\s]+(?:\s+\d+\.?\d*[kglmlpack]+)?)\s+₱?([\d,]+\.?\d*)$/,
    // Pattern 3: "Quantity Product Price"
    /^(\d+)\s+([A-Za-z\s]+(?:\s+\d+\.?\d*[kglmlpack]+)?)\s+([\d,]+\.?\d*)$/,
    // Pattern 4: "Product @UnitPrice TotalPrice"
    /^([A-Za-z\s]+)\s+@([\d,]+\.?\d*)\s+([\d,]+\.?\d*)$/,
    // Pattern 5: "Quantity Product @UnitPrice" (Savemore format)
    /^(\d+)\s+([A-Za-z\s]+(?:\s+\d+\.?\d*[kglmlpack]+)?)\s+@([\d,]+\.?\d*)$/,
    // Pattern 6: "DecimalQuantity Product @UnitPrice" (Savemore format)
    /^(\d+\.\d+)\s+([A-Za-z\s]+(?:\s+\d+\.?\d*[kglmlpack]+)?)\s+@([\d,]+\.?\d*)$/,
    // Pattern 7: "Product Name ProductCode Price" (Mercury Drug format)
    /^([A-Za-z\s]+)\s+(\d{6,15})\s+([\d,]+\.?\d*)$/,
    // Pattern 8: "Product Name with mixed content Price" (Mercury Drug format)
    /^([A-Za-z\s]+(?:\s+[A-Za-z]*\d+[A-Za-z]*)?)\s+([\d,]+\.?\d*)$/,
    // Pattern 9: "Product Name Size Price" (Mercury Drug format)
    /^([A-Za-z\s]+)\s+(\d+[A-Za-z]+)\s+([\d,]+\.?\d*)$/,
    // Pattern 10: "Product Name UnitSpec Price" (Mercury Drug format like "SUGO PNT GRA100g")
    /^([A-Za-z\s]+)\s+([A-Za-z]+\d+[A-Za-z]*)\s+([\d,]+\.?\d*)$/,
    // Pattern 11: "Product Name with embedded size Price" (Mercury Drug format like "BEAR B FORT2400g")
    /^([A-Za-z\s]+\d+[A-Za-z]*)\s+([\d,]+\.?\d*[TVXZ]?)$/,
    // Pattern 12: "Product Name with numbers Price" (Mercury Drug format like "LICEAL SC10mL3+1")
    /^([A-Za-z\s]+\d+[A-Za-z]*\d*[A-Za-z]*)\s+([\d,]+\.?\d*[TVXZ]?)$/,
    // Pattern 13: "Product Name Price with suffix" (Mercury Drug format like "LICEAL S SC10mL 16.50T")
    /^([A-Za-z\s]+)\s+([\d,]+\.?\d*[TVXZ])$/,
    // Pattern 14: "Product Name with numbers Price" (Mercury Drug format like "LICEAL SC10mL3+1")
    /^([A-Za-z\s]+\d+[A-Za-z]*\d*[A-Za-z]*)\s+([\d,]+\.?\d*[TVXZ]?)$/,
    // Pattern 15: "Product Name Negative Price" (Mercury Drug format like "LICEAL S SC10mL -16.50V")
    /^([A-Za-z\s]+)\s+(-[\d,]+\.?\d*[TVXZ])$/,
    // Pattern 16: "Product Name with numbers and symbols Price" (Mercury Drug format like "LICEAL SC10mL3+1")
    /^([A-Za-z\s]+\d+[A-Za-z]*[+\-]?\d*[A-Za-z]*)\s+([\d,]+\.?\d*[TVXZ]?)$/,
    // Pattern 17: "Any Product Name with Price" (Catch-all for complex product names)
    /^([A-Za-z\s\d+\-]+)\s+([\d,]+\.?\d*[TVXZ]?)$/,
    // Pattern 18: "Product Name with Negative Price" (Mercury Drug voided items)
    /^([A-Za-z\s]+)\s+(-[\d,]+\.?\d*[TVXZ])$/,
    // Pattern 19: "Product Name with mixed content and numbers" (Mercury Drug format like "CHIC NC HV 11mL")
    /^([A-Za-z\s]+\d+[A-Za-z]*)\s+([\d,]+\.?\d*[TVXZ]?)$/,
    // Pattern 20: "Product Name with dashes and numbers" (Mercury Drug format like "SG A-FRSH 115gx3")
    /^([A-Za-z\s\-]+\d+[A-Za-z]*)\s+([\d,]+\.?\d*[TVXZ]?)$/,
    // Pattern 21: "Quantity format" (Mercury Drug format like "7 @ 9.50")
    /^(\d+)\s+@\s+([\d,]+\.?\d*)$/,
    // Pattern 22: "Product Name with letters and numbers mixed" (Mercury Drug format like "JJ F PCDYCH13.8g")
    /^([A-Za-z\s]+[A-Za-z]*\d+[A-Za-z]*\.?\d*[A-Za-z]*)\s+([\d,]+\.?\d*[TVXZ]?)$/,
    // Pattern 23: "Known Product Names without clear price" (Fallback for specific products)
    /^([A-Za-z\s]+(?:\s+\d+[A-Za-z]*)?)\s*[A-Za-z]*$/,
    // Pattern 24: "Bear Brand specific pattern" (for BEAR B FORT2400g wo)
    /^(BEAR\s+B\s+FORT\d+[A-Za-z]*)\s*[A-Za-z]*$/,
    // Pattern 25: "Nido corrected pattern" (for NIDO3+PRE-S1.6KG)
    /^(NIDO3\+PRE-S\d+\.\d+KG)\s+([\d,]+\.?\d*)$/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if not likely a product
    if (!isLikelyProduct(line)) {
      continue;
    }

    // Try each pattern
    for (let patternIndex = 0; patternIndex < productPatterns.length; patternIndex++) {
      const pattern = productPatterns[patternIndex];
      const match = line.match(pattern);

      if (match) {
        console.log(`📦 [Pattern Match] Pattern ${patternIndex + 1}: "${line}"`);

        let productName,
          price,
          quantity = 1;

        // Handle different pattern types
        if (patternIndex === 6) {
          // Pattern 7: "Product Name ProductCode Price" (Mercury Drug format)
          productName = match[1].trim();
          price = parseFloat(match[3].replace(/,/g, ""));
        } else if (patternIndex === 8) {
          // Pattern 9: "Product Name Size Price" (Mercury Drug format)
          productName = match[1].trim();
          price = parseFloat(match[3].replace(/,/g, ""));
        } else if (patternIndex === 9) {
          // Pattern 10: "Product Name UnitSpec Price" (Mercury Drug format like "SUGO PNT GRA100g")
          productName = match[1].trim();
          price = parseFloat(match[3].replace(/,/g, ""));
        } else if (patternIndex === 10) {
          // Pattern 11: "Product Name with embedded size Price" (Mercury Drug format like "BEAR B FORT2400g")
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 11) {
          // Pattern 12: "Product Name with numbers Price" (Mercury Drug format like "LICEAL SC10mL3+1")
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 12) {
          // Pattern 13: "Product Name Price with suffix" (Mercury Drug format like "LICEAL S SC10mL 16.50T")
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 13) {
          // Pattern 14: "Product Name with numbers Price" (Mercury Drug format like "LICEAL SC10mL3+1")
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 14) {
          // Pattern 15: "Product Name Negative Price" (Mercury Drug format like "LICEAL S SC10mL -16.50V")
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 15) {
          // Pattern 16: "Product Name with numbers and symbols Price" (Mercury Drug format like "LICEAL SC10mL3+1")
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 16) {
          // Pattern 17: "Any Product Name with Price" (Catch-all for complex product names)
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 17) {
          // Pattern 18: "Product Name with Negative Price" (Mercury Drug voided items)
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 18) {
          // Pattern 19: "Product Name with mixed content and numbers" (Mercury Drug format like "CHIC NC HV 11mL")
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 19) {
          // Pattern 20: "Product Name with dashes and numbers" (Mercury Drug format like "SG A-FRSH 115gx3")
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 20) {
          // Pattern 21: "Quantity format" (Mercury Drug format like "7 @ 9.50")
          quantity = parseFloat(match[1]);
          productName = "Unknown Product"; // Generic name for quantity format
          price = parseFloat(match[2].replace(/,/g, ""));
        } else if (patternIndex === 21) {
          // Pattern 22: "Product Name with letters and numbers mixed" (Mercury Drug format like "JJ F PCDYCH13.8g")
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/[TVXZ]/g, "").replace(/,/g, ""));
        } else if (patternIndex === 22) {
          // Pattern 23: "Known Product Names without clear price" (Fallback for specific products)
          productName = match[1].trim();
          price = 0; // No price detected, will be handled by specific product matching
        } else if (patternIndex === 23) {
          // Pattern 24: "Bear Brand specific pattern" (for BEAR B FORT2400g wo)
          productName = match[1].trim();
          price = 0; // No price detected, will be handled by specific product matching
        } else if (patternIndex === 24) {
          // Pattern 25: "Nido specific pattern" (for WIDO3HPRE-51 6KG)
          productName = match[1].trim();
          price = 0; // No price detected, will be handled by specific product matching
        } else if (patternIndex === 25) {
          // Pattern 26: "Nido corrected pattern" (for NIDO3+PRE-S1.6KG)
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/,/g, ""));
        } else if (match.length === 3) {
          // Pattern 1, 2, 8: "Product Price", "Product ₱Price", "Product with mixed content Price"
          productName = match[1].trim();
          price = parseFloat(match[2].replace(/,/g, ""));
        } else if (match.length === 4) {
          // Check if first group is a number (quantity) or text (product name)
          if (isNaN(parseFloat(match[1]))) {
            // Pattern 4: "Product @UnitPrice TotalPrice"
            productName = match[1].trim();
            price = parseFloat(match[3].replace(/,/g, ""));
          } else {
            // Pattern 3, 5, 6: "Quantity Product Price", "Quantity Product @UnitPrice"
            quantity = parseFloat(match[1]); // Use parseFloat for decimal quantities
            productName = match[2].trim();
            price = parseFloat(match[3].replace(/,/g, ""));
          }
        }

        // Validate the extracted data

        // Check if this matches any specific product patterns first
        const specificProductMatch = matchSpecificProduct(productName);

        // Accept products if they have a valid name and either a valid price OR match specific patterns
        const hasValidName = productName && productName.length > 2;
        const hasValidPrice = price && price !== 0;
        const isSpecificProduct = specificProductMatch !== null;

        if (hasValidName && (hasValidPrice || isSpecificProduct)) {
          // Clean up product name
          productName = productName.replace(/\s+/g, " ").trim();

          const productData = {
            index: i + 1,
            name: specificProductMatch ? specificProductMatch.name : productName,
            quantity: quantity,
            unitPrice: hasValidPrice ? price / quantity : 0,
            totalPrice: hasValidPrice ? price : 0,
            detectedPattern: isSpecificProduct ? "specific-pattern" : "smart",
          };

          // Add specific product info if matched
          if (specificProductMatch) {
            productData.specificProduct = specificProductMatch;
            console.log(`🎯 [Specific Product Match] "${productName}" → "${specificProductMatch.name}"`);
          }

          products.push(productData);

          if (hasValidPrice) {
            console.log(`✅ [Product Found] "${productName}" - Qty: ${quantity}, Price: ₱${price}`);
          } else {
            console.log(`✅ [Product Found] "${productName}" - Qty: ${quantity}, Price: Unknown (Pattern Match)`);
          }
          break;
        }
      }
    }
  }

  console.log(`\n📊 [EXTRACTION SUMMARY]`);
  console.log(`Found ${products.length} products:`);
  products.forEach((product, idx) => {
    const priceText = product.totalPrice > 0 ? `₱${product.totalPrice}` : "Unknown";
    console.log(`  ${idx + 1}. "${product.name}" - ${priceText}`);
  });

  return products;
}

/**
 * Preprocess text for better OCR results
 * @param {string} text - Raw text
 * @returns {string} Preprocessed text
 */
function preprocessText(text) {
  let processedText = text;

  // Remove artifacts
  for (const pattern of OCR_CORRECTIONS.TEXT_PREPROCESSING?.removeArtifacts || []) {
    processedText = processedText.replace(pattern, " ");
  }

  // Normalize variations
  for (const correction of OCR_CORRECTIONS.TEXT_PREPROCESSING?.normalizeVariations || []) {
    processedText = processedText.replace(correction.from, correction.to);
  }

  return processedText.trim();
}

module.exports = {
  applyOcrCorrections,
  detectStoreName,
  matchSpecificProduct,
  isLikelyProduct,
  extractProducts,
  preprocessText,
};
