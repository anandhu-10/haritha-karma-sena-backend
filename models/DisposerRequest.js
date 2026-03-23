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

    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    wasteTypes: {
      type: [String], // ✅ ARRAY FIX
      required: true,
    },

    location: {
      type: [Number], // [lng, lat]
      default: null,
    },

    image: {
      type: String, // base64 allowed
      default: null,
    },

    wasteQuantity: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      default: "Pending",
    },

    date: {
      type: String,
    },
    ward: {
      type: String,
      default: null,
    },
    timeSlot: {
      type: String,
      default: "Anytime",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DisposerRequest",
  DisposerRequestSchema
);
