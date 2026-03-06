const express = require("express");
const router = express.Router();
const Reward = require("../models/Reward");
const User = require("../models/user");
const PointsHistory = require("../models/PointsHistory");
const authMiddleware = require("../middleware/authMiddleware");

/* ---------------- GET all rewards ---------------- */
router.get("/", async (req, res) => {
    try {
        const rewards = await Reward.find();
        res.status(200).json(rewards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ---------------- CLAIM reward ---------------- */
router.post("/claim", authMiddleware, async (req, res) => {
    try {
        const { rewardId } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        const reward = await Reward.findById(rewardId);

        if (!user || !reward) {
            return res.status(404).json({ message: "User or Reward not found" });
        }

        if (user.communityPoints < reward.pointsRequired) {
            return res.status(400).json({ message: "Insufficient points" });
        }

        // Deduct points
        user.communityPoints -= reward.pointsRequired;

        // Add to claimed rewards
        user.claimedRewards.push({
            rewardId: reward._id,
            title: reward.title,
            rewardType: reward.rewardType,
            claimedAt: new Date()
        });

        await user.save();

        // Log in points history as negative points
        await PointsHistory.create({
            userId,
            actionType: `Claimed Reward: ${reward.title}`,
            pointsEarned: -reward.pointsRequired
        });

        res.status(200).json({ message: "Reward claimed successfully!", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ---------------- ADMIN: ADD new reward ---------------- */
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
        const { title, description, pointsRequired, rewardType, iconType } = req.body;
        const newReward = await Reward.create({ title, description, pointsRequired, rewardType, iconType });
        res.status(201).json(newReward);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ---------------- ADMIN: DELETE reward ---------------- */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
        await Reward.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Reward deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
