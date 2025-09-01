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
    type: {
      type: String,
      required: true,
      enum: ["physical", "online"],
      default: "physical",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "deactivated"],
      default: "active",
    },
    dateDeactivated: {
      type: Date,
    },
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", schema);
