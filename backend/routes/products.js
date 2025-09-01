const express = require("express");
const Product = require("../models/Product");
const Brand = require("../models/Brand");
const productMatchingService = require("../services/productMatching");

const router = express.Router();

/**
 * GET /products
 * Get all products with pagination
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

    const products = await Product.find(filter)
      .populate("brandId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /products/:id
 * Get product by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("brandId", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * POST /products
 * Create new product
 */
router.post("/", async (req, res) => {
  try {
    const { name, brandId, volume, volumeUnit, points, dateExpiry, keywords } = req.body;

    // Validate required fields
    if (!name || !brandId || !volume || !volumeUnit || !points || !dateExpiry) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Validate brand exists
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(400).json({
        success: false,
        error: "Brand not found",
      });
    }

    // Create normalized name
    const normalized_name = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const product = new Product({
      name,
      normalized_name,
      brandId,
      volume,
      volumeUnit,
      points,
      dateExpiry: new Date(dateExpiry),
      keywords: keywords || [],
    });

    await product.save();

    // Clear product cache
    productMatchingService.productSearchCache = null;

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * POST /products/match
 * Test product matching
 */
router.post("/match", async (req, res) => {
  try {
    const { itemName } = req.body;

    if (!itemName) {
      return res.status(400).json({
        success: false,
        error: "Item name is required",
      });
    }

    const item = { name: itemName };
    const matchedProduct = await productMatchingService.findMatchingProduct(item);
    const suggestions = await productMatchingService.getProductSuggestions(itemName, 5);

    res.json({
      success: true,
      item: itemName,
      matched: matchedProduct,
      suggestions,
    });
  } catch (error) {
    console.error("❌ Error matching product:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /products/suggestions/:itemName
 * Get product suggestions for item name
 */
router.get("/suggestions/:itemName", async (req, res) => {
  try {
    const { itemName } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const suggestions = await productMatchingService.getProductSuggestions(itemName, limit);

    res.json({
      success: true,
      itemName,
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
