const express = require("express");
const Store = require("../models/Store");
const storeMatchingService = require("../services/storeMatching");

const router = express.Router();

/**
 * GET /stores
 * Get all stores with pagination
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword;

    const filter = { status: "active" };
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { normalized_name: { $regex: keyword, $options: "i" } },
      ];
    }

    const stores = await Store.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });

    const total = await Store.countDocuments(filter);

    res.json({
      success: true,
      stores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching stores:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /stores/:id
 * Get store by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    res.json({
      success: true,
      store,
    });
  } catch (error) {
    console.error("❌ Error fetching store:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * POST /stores
 * Create new store
 */
router.post("/", async (req, res) => {
  try {
    const { name, type = "physical", keywords } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Store name is required",
      });
    }

    // Create normalized name
    const normalized_name = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const store = new Store({
      name,
      normalized_name,
      type,
      keywords: keywords || [],
    });

    await store.save();

    // Clear store cache
    storeMatchingService.storeSearchCache = null;

    res.status(201).json({
      success: true,
      store,
    });
  } catch (error) {
    console.error("❌ Error creating store:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * POST /stores/match
 * Test store matching
 */
router.post("/match", async (req, res) => {
  try {
    const { storeName } = req.body;

    if (!storeName) {
      return res.status(400).json({
        success: false,
        error: "Store name is required",
      });
    }

    const storeData = { name: storeName };
    const matchedStore = await storeMatchingService.findMatchingStore(storeData);
    const suggestions = await storeMatchingService.getStoreSuggestions(storeName, 5);

    res.json({
      success: true,
      store: storeName,
      matched: matchedStore,
      suggestions,
    });
  } catch (error) {
    console.error("❌ Error matching store:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /stores/suggestions/:storeName
 * Get store suggestions for store name
 */
router.get("/suggestions/:storeName", async (req, res) => {
  try {
    const { storeName } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const suggestions = await storeMatchingService.getStoreSuggestions(storeName, limit);

    res.json({
      success: true,
      storeName,
      suggestions,
    });
  } catch (error) {
    console.error("❌ Error getting suggestions:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
