const express = require("express");
const router = express.Router();
const PointsHistory = require("../models/PointsHistory");
const authMiddleware = require("../middleware/authMiddleware");

/* ---------------- GET user's point history ---------------- */
router.get("/my", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await PointsHistory.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
