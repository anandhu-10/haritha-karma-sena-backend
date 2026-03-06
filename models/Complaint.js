const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        userName: { type: String, required: true },
        userRole: { type: String, required: true },
        subject: { type: String, required: true },
        description: { type: String, required: true },
        status: {
            type: String,
            enum: ["Pending", "Reviewed", "Resolved"],
            default: "Pending",
        },
        adminResponse: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
