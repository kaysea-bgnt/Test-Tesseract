const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    points: {
      balance: {
        type: Number,
        default: 0,
      },
      amount: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ["active", "expired"],
        default: "active",
      },
      lastDateEarned: Date,
      lastDateRedeemed: Date,
      dateExpiry: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", schema);
