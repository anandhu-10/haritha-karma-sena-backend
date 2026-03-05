const express = require("express");
const router = express.Router();
const User = require("../models/user");

/* ---------------- GET top leaderboard users ---------------- */
router.get("/", async (req, res) => {
    try {
        const topUsers = await User.find({ role: "disposer" })
            .select("name communityPoints claimedRewards")
            .sort({ communityPoints: -1 })
            .limit(10);

        res.status(200).json(topUsers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
