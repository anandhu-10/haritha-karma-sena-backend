const mongoose = require("mongoose");

const pointsHistorySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        actionType: { type: String, required: true }, // e.g., "Request Submitted", "Pickup Confirmed", "Reward Claimed"
        pointsEarned: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        relatedWasteRequest: { type: mongoose.Schema.Types.ObjectId, ref: "DisposerRequest" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("PointsHistory", pointsHistorySchema);
