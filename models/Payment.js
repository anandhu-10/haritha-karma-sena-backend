const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    default: 50,
  },
  month: {
    type: String, // YYYY-MM
    required: true,
  },
  status: {
    type: String,
    enum: ["paid"],
    default: "paid",
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
