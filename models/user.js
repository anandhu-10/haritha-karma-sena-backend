const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["disposer", "collector"],
      required: true,
    },
    profile: {
      phone: String,
      pincode: String,
      panchayath: String,
      ward: String,
    },
    communityPoints: {
      type: Number,
      default: 0,
    },
    claimedRewards: [
      {
        rewardId: { type: mongoose.Schema.Types.ObjectId, ref: "Reward" },
        claimedAt: { type: Date, default: Date.now },
        title: String,
        rewardType: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
