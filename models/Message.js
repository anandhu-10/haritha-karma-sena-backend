const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            index: true,
        },
        sender: {
            type: String, // 'disposer' or 'collector'
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
