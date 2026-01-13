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

module.exports = router;
