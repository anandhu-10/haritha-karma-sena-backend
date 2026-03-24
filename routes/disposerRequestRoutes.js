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

    /* ---------- FETCH DISPOSER WARD & AUTO-ASSIGN COLLECTOR ---------- */
    const user = await User.findById(disposerId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const disposerWard = user.profile?.ward;

    // Find active collectors in the same ward
    const potentialCollectors = await User.find({
      role: "collector",
      status: "Active",
      "profile.ward": disposerWard
    });



    const request = await DisposerRequest.create({
      disposerId,
      disposerName,
      wasteTypes,
      wasteQuantity,
      location,
      image,
      status: "Pending",
      date,
      ward: disposerWard,
      collectorId: null
    });

    /* 🏆 AWARD SUBMISSION POINTS (+10) */
    await User.findByIdAndUpdate(disposerId, { $inc: { communityPoints: 10 } });
    await PointsHistory.create({
      userId: disposerId,
      actionType: "Request Submitted",
      pointsEarned: 10,
      relatedWasteRequest: request._id
    });

    if (potentialCollectors.length > 0) {
      const notificationData = potentialCollectors.map(c => ({
        userId: c._id,
        message: `A new waste disposal request is available in ${disposerWard}! 🚛`
      }));
      await Notification.insertMany(notificationData);
    }

    res.status(201).json(request);
  } catch (err) {
    console.error("CREATE REQUEST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/** 📍 Haversine Distance Helper (lat/lng in degrees) **/
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ---------------- GET MY REQUESTS (🔥 NEW ROUTE FIX) ---------------- */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const disposerId = req.user.id;

    const requests = await DisposerRequest.find({
      disposerId,
    })
      .populate("collectorId", "name profile")
      .sort({ _id: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error("FETCH MY REQUESTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- GET all requests (Collector - AREA RESTRICTED) ---------------- */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'collector') {
      // Fallback for non-collectors (or just return empty)
      const requests = await DisposerRequest.find().sort({ _id: -1 }).limit(50);
      return res.status(200).json(requests);
    }

    const myWard = user.profile?.ward;

    // Only show requests in the same ward, or requests specifically assigned to this collector
    const requests = await DisposerRequest.find({
      $or: [
        { ward: myWard },
        { collectorId: user._id }
      ]
    }).sort({ _id: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error("FETCH REQUEST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- UPDATE status (Pick Up + Notify) ---------------- */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, completionLocation } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const request = await DisposerRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const updateData = { status };
    if (completionLocation) {
      updateData.completionLocation = completionLocation;
      updateData.completedAt = new Date();
    }

    const updatedRequest = await DisposerRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    /* 🔔 CREATE NOTIFICATION + AWARD ECO POINTS WHEN PICKED UP */
    if (status === "Picked Up") {
      await Notification.create({
        userId: request.disposerId,
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
      if (request.wasteTypes && request.wasteTypes.length > 1) totalBonus += 15;

      if (totalBonus > 0) {
        await User.findByIdAndUpdate(request.disposerId, { $inc: { communityPoints: totalBonus } });
        await PointsHistory.create({
          userId: request.disposerId,
          actionType: "Waste Collection Bonus",
          pointsEarned: totalBonus,
          relatedWasteRequest: request._id
        });
      }
    } else if (status === "Waste Collected") {
      // 🔔 New Requirement: Notify disposer when waste is physically taken
      await Notification.create({
        userId: request.disposerId,
        message: "Your waste has been collected from your house! 🏠✨",
      });
    } else if (status === "Completed") {
      // 🔔 User requirement: "when the waste is picked .admin and disposar should notify waste is collected"
      // Disposer Notification
      await Notification.create({
        userId: request.disposerId,
        message: "Your waste has been successfully collected! ✅ Thank you for your contribution.",
      });

      // Admin Notification
      const admins = await User.find({ role: "admin" });
      const adminNotes = admins.map(admin => ({
        userId: admin._id,
        message: `Waste from ${request.disposerName || "Disposer"} has been collected successfully.`,
      }));
      if (adminNotes.length > 0) {
        await Notification.insertMany(adminNotes);
      }
    }

    res.status(200).json(updatedRequest);
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;