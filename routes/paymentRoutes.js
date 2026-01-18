const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const authMiddleware = require("../middleware/authMiddleware"); 
// ⚠️ use YOUR existing auth middleware filename

/* ---------- CHECK PAYMENT STATUS ---------- */
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    const payment = await Payment.findOne({
      userId: req.user.id,
      month,
    });

    res.json({
      paid: !!payment,
      month,
    });
  } catch (err) {
    res.status(500).json({ message: "Payment status check failed" });
  }
});

/* ---------- PAY ₹50 (TEMP MANUAL) ---------- */
router.post("/pay", authMiddleware, async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7);

    const alreadyPaid = await Payment.findOne({
      userId: req.user.id,
      month,
    });

    if (alreadyPaid) {
      return res.status(400).json({ message: "Already paid for this month" });
    }

    const payment = await Payment.create({
      userId: req.user.id,
      month,
    });

    res.json({
      success: true,
      payment,
    });
  } catch (err) {
    res.status(500).json({ message: "Payment failed" });
  }
});

module.exports = router;
