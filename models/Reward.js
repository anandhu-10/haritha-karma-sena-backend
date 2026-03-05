const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        pointsRequired: { type: Number, required: true },
        rewardType: {
            type: String,
            enum: ["badge", "item", "certificate"],
            required: true
        },
        image: { type: String } // Optional image for reward
    },
    { timestamps: true }
);

module.exports = mongoose.model("Reward", rewardSchema);
