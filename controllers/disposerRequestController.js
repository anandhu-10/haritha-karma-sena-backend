const Notification = require("../models/Notification");

exports.pickUpRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await DisposerRequest.findById(requestId)
      .populate("disposerId");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // update status
    request.status = "Picked";
    await request.save();

    // 🔔 CREATE NOTIFICATION
    await Notification.create({
      disposerId: request.disposerId._id,
      message: "Your waste request has been accepted by the collector.",
    });

    res.json({ message: "Pickup confirmed and disposer notified" });
  } catch (err) {
    res.status(500).json({ message: "Pickup failed" });
  }
};
