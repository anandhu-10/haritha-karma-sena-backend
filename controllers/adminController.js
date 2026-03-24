const User = require("../models/user");
const DisposerRequest = require("../models/DisposerRequest");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");

/* ================= DASHBOARD STATS ================= */
exports.getDashboardStats = async (req, res) => {
    try {
        const totalDisposers = await User.countDocuments({ role: "disposer" });
        const totalCollectors = await User.countDocuments({ role: "collector" });
        const totalRequests = await DisposerRequest.countDocuments();

        // Today's Date
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Convert to ISO strings for string comparison if needed, but date is string in DisposerRequest: `date: String`.
        // Let's count Active Requests (everything not completed)
        const activeRequests = await DisposerRequest.countDocuments({ status: { $ne: "Completed" } });

        // For "Waste Collected Today", we count everything that has been physically taken or finalized today
        const wasteCollectedTodayCount = await DisposerRequest.countDocuments({
            status: { $in: ["Waste Collected", "Completed"] },
            updatedAt: { $gte: startOfDay }
        });

        // Chart Data Types - Optimize by only selecting wasteTypes field
        const requests = await DisposerRequest.find({}, "wasteTypes");

        const wasteTypeCounts = { plastic: 0, organic: 0, ewaste: 0, other: 0 };
        requests.forEach(reqObj => {
            if (Array.isArray(reqObj.wasteTypes)) {
                reqObj.wasteTypes.forEach(t => {
                    if (typeof t === 'string') {
                        let lowerT = t.toLowerCase();
                        if (lowerT.includes("plastic")) wasteTypeCounts.plastic++;
                        else if (lowerT.includes("organic") || lowerT.includes("food")) wasteTypeCounts.organic++;
                        else if (lowerT.includes("e-waste") || lowerT.includes("electronic")) wasteTypeCounts.ewaste++;
                        else wasteTypeCounts.other++;
                    } else if (t) {
                        // Fallback for truthy non-string values
                        wasteTypeCounts.other++;
                    }
                });
            }
        });

        // Count Unassigned Requests (Awaiting Admin)
        const unassignedRequests = await DisposerRequest.countDocuments({ collectorId: null });

        res.status(200).json({
            totalUsers: totalDisposers,
            totalCollectors,
            totalRequests,
            wasteCollectedToday: wasteCollectedTodayCount,
            activeRequests,
            unassignedRequests,
            wasteTypeDistribution: wasteTypeCounts
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching stats", error: error.message });
    }
};

/* ================= USERS MANAGEMENT ================= */
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "disposer" }).select("-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

/* ================= COLLECTORS MANAGEMENT ================= */
exports.getCollectors = async (req, res) => {
    try {
        const collectors = await User.find({ role: "collector" }).select("-password");
        res.status(200).json(collectors);
    } catch (error) {
        res.status(500).json({ message: "Error fetching collectors", error: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["Active", "Blocked", "Pending"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User status updated", user });
    } catch (error) {
        res.status(500).json({ message: "Error updating status", error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

/* ================= REQUESTS MANAGEMENT ================= */
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await DisposerRequest.find()
            .populate("disposerId", "name email phone profile")
            .populate("collectorId", "name phone profile")
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching requests", error: error.message });
    }
};

/* ================= COMPLAINTS MANAGEMENT ================= */
exports.getComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ message: "Error fetching complaints", error: error.message });
    }
};

exports.updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminResponse } = req.body;

        const complaint = await Complaint.findByIdAndUpdate(
            id,
            { status, adminResponse },
            { new: true }
        );

        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        // Send notification to user
        await Notification.create({
            userId: complaint.userId,
            message: `Your complaint regarding "${complaint.subject}" has been marked as ${status}. ${adminResponse ? `Response: ${adminResponse}` : ''}`
        });

        res.status(200).json({ message: "Complaint updated successfully", complaint });
    } catch (error) {
        res.status(500).json({ message: "Error updating complaint", error: error.message });
    }
};

/* ================= AWARENESS & NOTIFICATIONS ================= */
exports.createAwareness = async (req, res) => {
    try {
        const { message, targetRole } = req.body;

        if (!message) return res.status(400).json({ message: "Message is required" });

        const filter = targetRole && targetRole !== "all" ? { role: targetRole } : { role: { $in: ["disposer", "collector"] } };
        const users = await User.find(filter).select("_id");

        const notifications = users.map(user => ({
            userId: user._id,
            message
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json({ message: "Awareness notifications sent to " + users.length + " users." });
    } catch (error) {
        res.status(500).json({ message: "Error creating notifications", error: error.message });
    }
};

/* ================= COMPLAINT SUBMISSION BY USER ================= */
exports.createComplaint = async (req, res) => {
    try {
        const { subject, description } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        const user = await User.findById(userId);

        const complaint = await Complaint.create({
            userId,
            userName: user.name,
            userRole,
            subject,
            description
        });

        res.status(201).json({ message: "Complaint submitted successfully", complaint });
    } catch (error) {
        res.status(500).json({ message: "Error submitting complaint", error: error.message });
    }
};

exports.getUserComplaints = async (req, res) => {
    try {
        const userId = req.user.id;
        const complaints = await Complaint.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user complaints", error: error.message });
    }
};

/* ================= MANUAL ASSIGNMENT ================= */
exports.manualAssignCollector = async (req, res) => {
    try {
        const { requestId, collectorId } = req.body;

        const request = await DisposerRequest.findByIdAndUpdate(
            requestId,
            { collectorId, status: "Assigned" },
            { new: true }
        );

        if (!request) return res.status(404).json({ message: "Request not found" });

        await Notification.create({
            userId: collectorId,
            message: `Admin manually assigned a new task to you 🚛`,
        });

        res.status(200).json({ message: "Collector assigned manually", request });
    } catch (error) {
        res.status(500).json({ message: "Error assigning collector", error: error.message });
    }
};

