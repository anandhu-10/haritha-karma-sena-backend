const express = require("express");
const router = express.Router();

const DisposerRequest = require("../models/DisposerRequest");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const authMiddleware = require("../middleware/authMiddleware");

/* ---------------- CREATE request (Disposer) ---------------- */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      disposerName,
      wasteTypes,
      image,
      status,
      date,
    } = req.body;

    const disposerId = req.user.id; // 🔐 TRUST BACKEND TOKEN

    if (!disposerId || !wasteTypes || wasteTypes.length === 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    /* ---------- PAYMENT CHECK (MONTHLY) ---------- */
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    const paid = await Payment.findOne({
      userId: disposerId,
      month,
    });

    if (!paid) {
      return res.status(403).json({
        message: "Monthly disposal fee not paid",
      });
    }

    const request = await DisposerRequest.create({
      disposerId,
      disposerName,
      wasteTypes,
      image,
      status,
      date,
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("CREATE REQUEST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- GET all requests (Collector) ---------------- */
router.get("/", async (req, res) => {
  try {
    const requests = await DisposerRequest.find().sort({ _id: -1 });
    res.status(200).json(requests);
  } catch (err) {
    console.error("FETCH REQUEST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- UPDATE status (Pick Up + Notify) ---------------- */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const request = await DisposerRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    await request.save();

    /* 🔔 CREATE NOTIFICATION WHEN PICKED UP */
    if (status === "Picked Up") {
      await Notification.create({
        disposerId: request.disposerId,
        message: "Your waste request has been picked up by the collector ✅",
      });
    }

    res.status(200).json(request);
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
