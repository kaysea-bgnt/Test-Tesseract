const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    store: {
      type: String,
      required: true,
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    validAmount: {
      type: Number,
      default: 0,
    },
    datePurchase: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["valid", "invalid", "flagged"],
      default: "valid",
    },
    reason: {
      type: String,
    },
    ocrData: {
      text: String,
      confidence: Number,
      processingTime: Number,
      fingerprint: String,
      imageHash: String,
      items: [
        {
          name: String,
          quantity: Number,
          unitPrice: Number,
          totalPrice: Number,
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
          matched: {
            type: Boolean,
            default: false,
          },
          points: {
            type: Number,
            default: 0,
          },
        },
      ],
      totals: {
        subtotal: Number,
        tax: Number,
        total: Number,
        currency: String,
      },
      metadata: {
        receiptDate: Date,
        receiptNumber: String,
        cashier: String,
        paymentMethod: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Receipt", schema);
