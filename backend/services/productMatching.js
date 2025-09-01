const Product = require("../models/Product");
const Fuse = require("fuse.js");
const { isLikelyProduct } = require("../utils/ocrHelpers");

// === Fuzzy Match Threshold Constant ===
const FUZZY_VALID_THRESHOLD = 0.4; // Accept as valid if below or equal to this score (Fuse.js: lower is better)

class ProductMatchingService {
  constructor() {
    // Fuse.js configuration for fuzzy search
    this.fuseOptions = {
      keys: [
        { name: "name", weight: 0.5 },
        { name: "normalized_name", weight: 0.4 },
        { name: "keywords", weight: 0.1 },
      ],
      threshold: FUZZY_VALID_THRESHOLD, // Lower threshold = more strict matching
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 3,
      findAllMatches: false,
      location: 0,
      distance: 100,
      useExtendedSearch: false,
      ignoreLocation: false,
      ignoreFieldNorm: false,
    };

    // Cache for product search data
    this.productSearchCache = null;
    this.lastCacheUpdate = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes

    // OCR Error Correction Patterns - now imported from data/patterns
    this.ocrCorrections = require("../data/patterns/ocrCorrections").OCR_CORRECTIONS;
  }

  /**
   * Correct common OCR errors in product names
   * @param {string} itemName - Raw item name from OCR
   * @returns {string} Corrected item name
   */
  correctOcrErrors(itemName) {
    let correctedName = itemName;

    // Apply product name corrections
    for (const fix of this.ocrCorrections.productCorrections || []) {
      correctedName = correctedName.replace(fix.from, fix.to);
    }

    // Apply volume corrections
    for (const fix of this.ocrCorrections.volumeCorrections || []) {
      correctedName = correctedName.replace(fix.from, fix.to);
    }

    console.log(`[OCR Correction] "${itemName}" -> "${correctedName}"`);
    return correctedName;
  }

  /**
   * Check if item is likely a product (not a total/header)
   * @param {string} itemName - Item name to check
   * @returns {boolean} True if likely a product
   */
  isLikelyProduct(itemName) {
    return isLikelyProduct(itemName);
  }

  /**
   * Get cached product search data
   * @returns {Promise<Array>} Product search data
   */
  async getProductSearchData() {
    try {
      // Check if cache is still valid
      if (this.productSearchCache && this.lastCacheUpdate) {
        const now = Date.now();
        if (now - this.lastCacheUpdate < this.cacheExpiry) {
          console.log("Using cached product data");
          return this.productSearchCache;
        }
      }

      // Fetch fresh data from database
      console.log("Fetching fresh product data from database");
      const products = await Product.find({ status: "active" }).populate("brandId", "name").lean();

      // Update cache
      this.productSearchCache = products;
      this.lastCacheUpdate = Date.now();

      console.log(`Loaded ${products.length} active products for matching`);
      return products;
    } catch (error) {
      console.error("Error fetching product search data:", error);
      return [];
    }
  }

  /**
   * Normalize item name for better matching
   * @param {string} itemName - Item name to normalize
   * @returns {string} Normalized item name
   */
  normalizeItemName(itemName) {
    return itemName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/\./g, "") // Remove decimal points for better matching (2.4kg -> 24kg)
      .trim();
  }

  /**
   * Find matching product using fuzzy search with OCR error correction
   * @param {Object} item - Receipt item
   * @returns {Promise<Object|null>} Matching product with confidence score
   */
  async findMatchingProduct(item) {
    try {
      // Get product search data
      const products = await this.getProductSearchData();

      if (products.length === 0) {
        console.log("No active products found in database");
        return null;
      }

      // Check if item is likely a product (not a total/header)
      if (!this.isLikelyProduct(item.name)) {
        console.log(`Skipping non-product item: "${item.name}"`);
        return null;
      }

      // Correct common OCR errors
      const correctedItemName = this.correctOcrErrors(item.name);

      // Normalize the corrected item name for better matching
      const normalizedItemName = this.normalizeItemName(correctedItemName);

      if (!normalizedItemName) {
        console.log("Invalid item name for matching");
        return null;
      }

      // Initialize Fuse.js with products
      const fuse = new Fuse(products, this.fuseOptions);

      // Perform fuzzy search
      const searchResults = fuse.search(normalizedItemName);

      if (searchResults.length === 0) {
        console.log(`No fuzzy matches found for: "${normalizedItemName}"`);
        return null;
      }

      // Get the best match
      const bestMatch = searchResults[0];
      const product = bestMatch.item;
      const confidenceScore = bestMatch.score;

      console.log(`Fuzzy match found for "${normalizedItemName}":`, {
        productName: product.name,
        normalizedName: product.normalized_name,
        brand: product.brandId?.name || "Unknown",
        volume: `${product.volume}${product.volumeUnit}`,
        points: product.points,
        confidenceScore: confidenceScore,
        matches: bestMatch.matches,
      });

      // Return product with confidence information
      return {
        ...product,
        _confidenceScore: confidenceScore,
        _matchDetails: bestMatch.matches,
        _matchQuality: this.getMatchQuality(confidenceScore),
      };
    } catch (error) {
      console.error("Error in fuzzy product matching:", error);
      return null;
    }
  }

  /**
   * Get match quality based on confidence score
   * @param {number} confidenceScore - Fuse.js confidence score
   * @returns {string} Match quality
   */
  getMatchQuality(confidenceScore) {
    if (confidenceScore <= 0.1) return "excellent"; // auto-accept
    if (confidenceScore <= 0.2) return "good"; // auto-accept
    if (confidenceScore <= 0.3) return "fair"; // manual review
    if (confidenceScore <= 0.4) return "poor"; // manual review
    return "low"; // treat as not found/invalid
  }

  /**
   * Get product suggestions for unmatched items
   * @param {string} itemName - Item name to find suggestions for
   * @param {number} limit - Number of suggestions to return
   * @returns {Promise<Array>} Product suggestions
   */
  async getProductSuggestions(itemName, limit = 5) {
    try {
      const products = await this.getProductSearchData();
      const normalizedItemName = this.normalizeItemName(itemName);

      if (!normalizedItemName || products.length === 0) {
        return [];
      }

      const fuse = new Fuse(products, {
        ...this.fuseOptions,
        findAllMatches: true,
      });

      const searchResults = fuse.search(normalizedItemName);

      return searchResults.slice(0, limit).map((result) => ({
        id: result.item._id,
        name: result.item.name,
        normalized_name: result.item.normalized_name,
        brand: result.item.brandId?.name || "Unknown",
        volume: `${result.item.volume}${result.item.volumeUnit}`,
        points: result.item.points,
        keywords: result.item.keywords,
        confidenceScore: result.score,
        matchQuality: this.getMatchQuality(result.score),
      }));
    } catch (error) {
      console.error("Error getting product suggestions:", error);
      return [];
    }
  }
}

// Export singleton instance
const productMatchingService = new ProductMatchingService();
module.exports = productMatchingService;
