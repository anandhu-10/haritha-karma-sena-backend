const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

/* ---- Get notifications for disposer ---- */
router.get("/:disposerId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      disposerId: req.params.disposerId,
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---- Mark all as read ---- */
router.patch("/mark-read/:disposerId", async (req, res) => {
  try {
    await Notification.updateMany(
      { disposerId: req.params.disposerId, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: "Marked all as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---- DELETE all notifications ---- */
router.delete("/:disposerId", async (req, res) => {
  try {
    await Notification.deleteMany({
      disposerId: req.params.disposerId,
    });
    res.status(200).json({ message: "Cleared all notifications" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---- DELETE selected notification ---- */
router.delete("/single/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
