const express = require("express");
const router = express.Router();

const DisposerRequest = require("../models/DisposerRequest");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");
const PointsHistory = require("../models/PointsHistory");

/* ---------------- CREATE request (Disposer) ---------------- */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      disposerName,
      wasteTypes,
      wasteQuantity,
      location,
      image,
      status,
      date,
    } = req.body;

    const disposerId = req.user.id; // 🔐 TRUST BACKEND TOKEN

    if (!disposerId || !wasteTypes || wasteTypes.length === 0 || !wasteQuantity) {
      return res.status(400).json({ message: "Invalid request data. Waste types and quantity are required." });
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
      wasteQuantity,
      location,
      image,
      status,
      date,
    });

    /* 🏆 AWARD SUBMISSION POINTS (+10) */
    await User.findByIdAndUpdate(disposerId, { $inc: { communityPoints: 10 } });
    await PointsHistory.create({
      userId: disposerId,
      actionType: "Request Submitted",
      pointsEarned: 10,
      relatedWasteRequest: request._id
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("CREATE REQUEST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- GET MY REQUESTS (🔥 NEW ROUTE FIX) ---------------- */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const disposerId = req.user.id;

    const requests = await DisposerRequest.find({
      disposerId,
    })
      .populate("collectorId", "name")
      .sort({ _id: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error("FETCH MY REQUESTS ERROR:", err);
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

    /* 🔔 CREATE NOTIFICATION + AWARD ECO POINTS WHEN PICKED UP */
    if (status === "Picked Up") {
      await Notification.create({
        disposerId: request.disposerId,
        message: "Your waste request has been picked up by the collector ✅",
      });

      // 🏆 CALCULATE ADDITIONAL REWARDS
      let totalBonus = 0;

      // 1. Quantity points
      const qty = Number(request.wasteQuantity);
      if (qty >= 1 && qty <= 3) totalBonus += 5;
      else if (qty > 3 && qty <= 7) totalBonus += 10;
      else if (qty > 7) totalBonus += 20;

      // 2. Segregation points (if more than 1 type)
      if (request.wasteTypes.length > 1) totalBonus += 15;

      if (totalBonus > 0) {
        await User.findByIdAndUpdate(request.disposerId, { $inc: { communityPoints: totalBonus } });
        await PointsHistory.create({
          userId: request.disposerId,
          actionType: "Waste Collection Bonus",
          pointsEarned: totalBonus,
          relatedWasteRequest: request._id
        });
      }
    }

    res.status(200).json(request);
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;