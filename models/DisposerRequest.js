const mongoose = require("mongoose");

const DisposerRequestSchema = new mongoose.Schema(
  {
    disposerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    disposerName: {
      type: String,
      required: true,
    },

    wasteTypes: {
      type: [String], // ✅ ARRAY FIX
      required: true,
    },

    image: {
      type: String, // base64 allowed
      default: null,
    },

    status: {
      type: String,
      default: "Pending",
    },

    date: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DisposerRequest",
  DisposerRequestSchema
);
