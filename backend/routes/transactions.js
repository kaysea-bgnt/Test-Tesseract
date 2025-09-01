const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Receipt = require("../models/Receipt");

const router = express.Router();

/**
 * GET /transactions
 * Get transactions with pagination
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const userId = req.query.userId;
    const action = req.query.action;

    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;

    const transactions = await Transaction.find(filter)
      .populate("userId", "username email")
      .populate("receiptId", "referenceId store totalAmount")
      .populate("storeId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /transactions/:id
 * Get transaction by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("userId", "username email")
      .populate("receiptId", "referenceId store totalAmount")
      .populate("storeId", "name");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("❌ Error fetching transaction:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * POST /transactions/earn
 * Manually award points to user
 */
router.post("/earn", async (req, res) => {
  try {
    const { userId, points, source = "system" } = req.body;

    if (!userId || !points) {
      return res.status(400).json({
        success: false,
        error: "User ID and points are required",
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Create transaction
    const transaction = new Transaction({
      userId,
      points: parseFloat(points),
      action: "earned",
      source,
    });

    await transaction.save();

    // Update user points
    if (!user.points) {
      user.points = { balance: 0, amount: 0, status: "active" };
    }
    user.points.balance += transaction.points;
    user.points.amount += transaction.points;
    user.points.lastDateEarned = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      transaction,
      user: {
        id: user._id,
        currentBalance: user.points.balance,
        totalEarned: user.points.amount,
      },
    });
  } catch (error) {
    console.error("❌ Error earning points:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /transactions/user/:userId
 * Get user's transaction history
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const transactions = await Transaction.find({ userId })
      .populate("receiptId", "referenceId store totalAmount")
      .populate("storeId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments({ userId });

    // Calculate summary
    const earned = await Transaction.aggregate([
      { $match: { userId: user._id, action: "earned" } },
      { $group: { _id: null, total: { $sum: "$points" } } },
    ]);

    const redeemed = await Transaction.aggregate([
      { $match: { userId: user._id, action: "redeemed" } },
      { $group: { _id: null, total: { $sum: "$points" } } },
    ]);

    const totalEarned = earned.length > 0 ? earned[0].total : 0;
    const totalRedeemed = redeemed.length > 0 ? redeemed[0].total : 0;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        currentBalance: user.points?.balance || 0,
        totalEarned,
        totalRedeemed,
      },
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user transactions:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /transactions/stats
 * Get transaction statistics
 */
router.get("/stats/overview", async (req, res) => {
  try {
    const userId = req.query.userId;

    const match = userId ? { userId } : {};

    const stats = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          totalPoints: { $sum: "$points" },
        },
      },
    ]);

    const totalTransactions = await Transaction.countDocuments(match);
    const totalUsers = userId ? 1 : await User.countDocuments();

    res.json({
      success: true,
      stats: {
        totalTransactions,
        totalUsers,
        byAction: stats,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching transaction stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
