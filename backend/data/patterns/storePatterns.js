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
    /(SM\s+[A-Z]+\s+HYPERMARKET)/i,
    /(SM\s+[A-Z]+\s+SUPERMARKET)/i,
  ],

  // Nestlé Store patterns
  nestleStore: [
    /(NESTL[EÉ]\s+STORE)/i,    
    /(NESTLE\s+STORE)/i,       
    /.*Nestlé\s+Store\.?/i,  
    /.*Nestlé\s+Store/i,        
  ],

  // Nestle PH patterns
  nestlePH: [
    /(NESTL[EÉ]\s*PH)/i,
    /(NESTLE\s*PH)/i,
    /(Nestlé\s*Philippines)/i,
    /(Nestle\s*Philippines)/i,
    /(NESTL[EÉ]\s*PHILIPPINES)/i,
    /neste\s*pH/i,
  ],

  // Everwin Mart patterns
  everwinMart: [
    /(EVERWIN\s+MART\s*\(MALOLOS\))/i,
    /(EVERWIN\s+MART)/i,   
  ],

  puregold: [
    /(PUREGOLD\s+SUPERMARKET)/i,
    /(PUREGOLD)/i,
    /pure[gq0o]ld/i, 
    /pure[gq]o?ld\s*price\s*cl[ui][bck][\s,]*(inc\.?)?/i,
  ],

  walterMart: [
    /\bWALTERMART\s+SUPERMARKET\b/i,
    /\bWALTER\s+SUPERMARKET\b/i,
    /\bWART\s+SUPERMARKET\b/i,
    /.*\b(WART|WALTER|WALTERMART)\b.*\bSUPER\b.*/i,
    /.*\bwaltermart\b.*/i,
  ],

  alturas: [
    /(altu[rn]as?|wus)\s+sup(e|ai|ei|er|ar)[a-z]*.*corp/i
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
    sm: ["SM", "HYPERMARKET"],
    mercury: ["MERCURY", "DRUG", "SOUTHERN LUZON"],
    robinsons: ["ROBINSONS", "MALL", "ROBINSON'S"],
    puregold: ["PUREGOLD"],
    savemore: ["SAVEMORE"],
    sevenEleven: ["7-ELEVEN", "7ELEVEN", "SEVEN ELEVEN"],
    nestle: ["NESTLE", "NESTLÉ"],
    nestlePH: ["NESTLE PH", "NESTLÉ PH", "NESTLE PHILIPPINES", "NESTLÉ PHILIPPINES"],
    everwin: ["EVERWIN", "MALOLOS"],
    walterMart: ["WALTERMART", "WALTER", "WALTERMART SUPERMARKET"],
    alturas: ["ALTURAS", "ALTURAS SUPERMARKET", "ALTURAS SUPERMARKET CORP"]

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
  nestle: "NESTLÉ STORE",
  nestlePH: "NESTLE PH",
  everwin: "Everwin Mart (Malolos)",
  puregold: "PUREGOLD",
  walterMart: "WALTERMART SUPERMARKET",
  alturas: "ALTURAS SUPERMARKET CORP",



};

// Store categories for better organization
const STORE_CATEGORIES = {
  pharmacy: ["MERCURY DRUG"],
  hypermarket: ["SM HYPERMARKET", "ROBINSONS SUPERMARKET"],
  supermarket: ["PUREGOLD", "SAVEMORE", "Everwin Mart (Malolos)", "WALTERMART SUPERMARKET", "ALTURAS SUPERMARKET CORP"],
  convenience: ["7-ELEVEN", "NESTLÉ", "NESTLE"],
};

module.exports = {
  STORE_PATTERNS,
  STORE_NAME_MAPPINGS,
  STORE_CATEGORIES,
};
