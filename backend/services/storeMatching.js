const Store = require("../models/Store");
const Fuse = require("fuse.js");

// === Fuzzy Match Threshold Constant ===
const STORE_FUZZY_VALID_THRESHOLD = 0.4; // Accept as valid if below or equal to this score (Fuse.js: lower is better)

class StoreMatchingService {
  constructor() {
    // Fuse.js configuration for fuzzy search
    this.fuseOptions = {
      keys: [
        { name: "name", weight: 0.6 },
        { name: "normalized_name", weight: 0.3 },
        { name: "keywords", weight: 0.1 },
      ],
      threshold: STORE_FUZZY_VALID_THRESHOLD, // Slightly higher threshold for stores
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

    // Cache for store search data
    this.storeSearchCache = null;
    this.lastCacheUpdate = null;
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes (stores change less frequently)
  }

  /**
   * Get cached store search data
   * @returns {Promise<Array>} Store search data
   */
  async getStoreSearchData() {
    try {
      // Check if cache is still valid
      if (this.storeSearchCache && this.lastCacheUpdate) {
        const now = Date.now();
        if (now - this.lastCacheUpdate < this.cacheExpiry) {
          console.log("Using cached store data");
          return this.storeSearchCache;
        }
      }

      // Fetch fresh data from database
      console.log("Fetching fresh store data from database");
      const stores = await Store.find({ status: "active" }).lean();

      // Update cache
      this.storeSearchCache = stores;
      this.lastCacheUpdate = Date.now();

      console.log(`Loaded ${stores.length} active stores for matching`);
      return stores;
    } catch (error) {
      console.error("Error fetching store search data:", error);
      return [];
    }
  }

  /**
   * Normalize store name for better matching
   * @param {string} storeName - Store name to normalize
   * @returns {string} Normalized store name
   */
  normalizeStoreName(storeName) {
    let normalized = storeName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Extract main store name from branch names (e.g., "mercury drug nakasisiguro" -> "mercury drug")
    if (normalized.includes("mercury drug")) {
      normalized = "mercury drug";
    }

    return normalized;
  }

  /**
   * Find matching store using fuzzy search
   * @param {Object} storeData - Store data from OCR
   * @returns {Promise<Object|null>} Matching store with confidence score
   */
  async findMatchingStore(storeData) {
    try {
      // Get store search data
      const stores = await this.getStoreSearchData();

      if (stores.length === 0) {
        console.log("No active stores found in database");
        return null;
      }

      // Normalize the store name for better matching
      const normalizedStoreName = this.normalizeStoreName(storeData.name);

      if (!normalizedStoreName) {
        console.log("Invalid store name for matching");
        return null;
      }

      // Initialize Fuse.js with stores
      const fuse = new Fuse(stores, this.fuseOptions);

      // Perform fuzzy search
      const searchResults = fuse.search(normalizedStoreName);

      if (searchResults.length === 0) {
        console.log(`No fuzzy matches found for store: "${normalizedStoreName}"`);
        return null;
      }

      // Get the best match
      const bestMatch = searchResults[0];
      const store = bestMatch.item;
      const confidenceScore = bestMatch.score;

      console.log(`Fuzzy match found for store "${normalizedStoreName}":`, {
        storeName: store.name,
        normalizedName: store.normalized_name,
        type: store.type,
        confidenceScore: confidenceScore,
        matches: bestMatch.matches,
      });

      // Return store with confidence information
      return {
        ...store,
        _confidenceScore: confidenceScore,
        _matchDetails: bestMatch.matches,
      };
    } catch (error) {
      console.error("Error in fuzzy store matching:", error);

      // Fallback to basic search if fuzzy search fails
      return await this.fallbackStoreSearch(storeData);
    }
  }

  /**
   * Fallback store search using basic regex matching
   * @param {Object} storeData - Store data from OCR
   * @returns {Promise<Object|null>} Matching store
   */
  async fallbackStoreSearch(storeData) {
    try {
      const stores = await this.getStoreSearchData();
      const normalizedStoreName = this.normalizeStoreName(storeData.name);

      if (!normalizedStoreName || stores.length === 0) {
        return null;
      }

      // Basic keyword matching
      const keywords = normalizedStoreName.split(" ");
      const matchingStores = stores.filter((store) => {
        const storeName = store.normalized_name.toLowerCase();
        return keywords.some((keyword) => keyword.length > 2 && storeName.includes(keyword));
      });

      if (matchingStores.length > 0) {
        // Return the first match with a low confidence score
        const store = matchingStores[0];
        console.log(`Fallback match found for store: "${store.name}"`);
        return {
          ...store,
          _confidenceScore: 0.5, // Low confidence for fallback
          _matchDetails: [],
        };
      }

      return null;
    } catch (error) {
      console.error("Error in fallback store search:", error);
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
   * Get store suggestions for unmatched stores
   * @param {string} storeName - Store name to find suggestions for
   * @param {number} limit - Number of suggestions to return
   * @returns {Promise<Array>} Store suggestions
   */
  async getStoreSuggestions(storeName, limit = 5) {
    try {
      const stores = await this.getStoreSearchData();
      const normalizedStoreName = this.normalizeStoreName(storeName);

      if (!normalizedStoreName || stores.length === 0) {
        return [];
      }

      const fuse = new Fuse(stores, {
        ...this.fuseOptions,
        findAllMatches: true,
      });

      const searchResults = fuse.search(normalizedStoreName);

      return searchResults.slice(0, limit).map((result) => ({
        id: result.item._id,
        name: result.item.name,
        normalized_name: result.item.normalized_name,
        type: result.item.type,
        keywords: result.item.keywords,
        confidenceScore: result.score,
        matchQuality: this.getMatchQuality(result.score),
      }));
    } catch (error) {
      console.error("Error getting store suggestions:", error);
      return [];
    }
  }
}

// Export singleton instance
const storeMatchingService = new StoreMatchingService();
module.exports = storeMatchingService;
