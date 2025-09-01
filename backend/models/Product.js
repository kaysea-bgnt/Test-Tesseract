const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    normalized_name: {
      type: String,
      required: true,
    },
    keywords: [String],
    status: {
      type: String,
      required: true,
      enum: ["active", "deactivated", "deleted"],
      default: "active",
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    volume: {
      type: Number,
      required: true,
    },
    volumeUnit: {
      type: String,
      required: true,
      enum: ["g", "ml", "kg", "l", "pack"],
    },
    points: {
      type: Number,
      required: true,
    },
    dateExpiry: {
      type: Date,
      required: true,
    },
    dateDeactivated: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", schema);
