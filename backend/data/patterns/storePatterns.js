/**
 * Store Detection Patterns for OCR
 * Handles Philippine stores with OCR error tolerance
 */

const STORE_PATTERNS = {
  // Mercury Drug patterns (specific to pharmacy receipts)
  mercuryDrug: [
    /(MERCURY\s+DRUG\s+[A-Z]+)/i,
    /(MERCURY\s+DRUG)/i,
    /(SOUTHERN\s+LUZON\s+DRUG\s+CORPORATION)/i,
    /(MERCURY\s+DRUG\s+LUCBAN)/i,
    /(MERCURY\s+DRUG\s+NAKAGISIGURO)/i,
    /(MERCURY\s+DRUG\s+[A-Z\s]+)/i, // More flexible pattern
  ],

  // Savemore Market patterns (specific to Savemore receipts)
  savemore: [/(SAVEMORE\s+MARKET)/i, /(SAVEMORE)/i, /(SANFORD\s+MARKETING\s+CORPORATION)/i, /(FESTIVAL\s+MALL)/i],

  // SM Group patterns
  smGroup: [
    /(SM\s+HYPERMARKET|SM\s+SUPERMARKET|SM\s+MALL)/i,
    /(SM\s+[A-Z]+)/i, // SM followed by any word
    /(HYPERMARKET|SUPERMARKET)/i, // Just the word
    /(SM\s+[A-Z]+\s+HYPERMARKET)/i,
    /(SM\s+[A-Z]+\s+SUPERMARKET)/i,
  ],

  // Major Philippine retailers
  majorRetailers: [
    /(SAVEMORE|SM|ROBINSONS|PUREGOLD|7-ELEVEN|WALMART|TARGET)/i,
    /(ROBINSONS\s+SUPERMARKET)/i,
    /(PUREGOLD\s+SUPERMARKET)/i,
    /(SAVEMORE\s+SUPERMARKET)/i,
    /(SAVEMORE\s+MARKET)/i,
    /(SANFORD\s+MARKETING\s+CORPORATION)/i,
    /(7-ELEVEN|7ELEVEN|SEVEN\s+ELEVEN)/i,
  ],

  // Generic store patterns
  genericStores: [
    /^([A-Z\s]+(?:HYPERMARKET|SUPERMARKET|MARKET|STORE|SHOP|MALL))/i,
    /^([A-Z\s]+(?:INC|CORP|LLC))/i,
    /^([A-Z\s]{3,}(?:HYPERMARKET|SUPERMARKET|MARKET|STORE))/i,
  ],

  // Address-based patterns
  addressPatterns: [/SM.*HYPERMARKET/i, /HYPERMARKET.*MANDALUYONG/i, /MERCURY.*DRUG/i, /ROBINSONS.*MALL/i],

  // Keywords for fallback detection
  keywords: {
    sm: ["SM", "HYPERMARKET", "SUPERMARKET"],
    mercury: ["MERCURY", "DRUG", "SOUTHERN LUZON"],
    robinsons: ["ROBINSONS", "MALL", "ROBINSON'S"],
    puregold: ["PUREGOLD"],
    savemore: ["SAVEMORE"],
    sevenEleven: ["7-ELEVEN", "7ELEVEN", "SEVEN ELEVEN"],
  },
};

// Store name mappings for fallback
const STORE_NAME_MAPPINGS = {
  // When keywords are found, map to actual store names
  sm: "SM HYPERMARKET",
  mercury: "MERCURY DRUG",
  robinsons: "ROBINSONS SUPERMARKET",
  puregold: "PUREGOLD",
  savemore: "SAVEMORE",
  sevenEleven: "7-ELEVEN",
};

// Store categories for better organization
const STORE_CATEGORIES = {
  pharmacy: ["MERCURY DRUG"],
  hypermarket: ["SM HYPERMARKET", "ROBINSONS SUPERMARKET"],
  supermarket: ["PUREGOLD", "SAVEMORE"],
  convenience: ["7-ELEVEN"],
};

module.exports = {
  STORE_PATTERNS,
  STORE_NAME_MAPPINGS,
  STORE_CATEGORIES,
};
