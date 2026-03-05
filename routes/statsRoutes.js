const express = require("express");
const router = express.Router();
const DisposerRequest = require("../models/DisposerRequest");
const User = require("../models/user");

/* ---------------- GET ward-wise stats ---------------- */
router.get("/ward-stats", async (req, res) => {
    try {
        const stats = await DisposerRequest.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "disposerId",
                    foreignField: "_id",
                    as: "user_info"
                }
            },
            { $unwind: "$user_info" },
            {
                $group: {
                    _id: "$user_info.profile.ward",
                    totalWaste: { $sum: { $toDouble: "$wasteQuantity" } },
                    requestCount: { $sum: 1 }
                }
            },
            { $sort: { totalWaste: -1 } }
        ]);

        res.status(200).json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ---------------- GET waste type distribution ---------------- */
router.get("/type-distribution", async (req, res) => {
    try {
        const requests = await DisposerRequest.find();
        const distribution = {};

        requests.forEach(req => {
            req.wasteTypes.forEach(type => {
                distribution[type] = (distribution[type] || 0) + (Number(req.wasteQuantity) / req.wasteTypes.length);
            });
        });

        res.status(200).json(distribution);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
