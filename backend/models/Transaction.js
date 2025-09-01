const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    purchaseAmount: {
      type: Number,
      required: false,
    },
    points: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["purchase", "earned", "redeemed", "expired"],
    },
    source: {
      type: String,
      enum: ["system", "event", "activity", "receipt", "product", "voucher", "reward"],
      default: "system",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", schema);
