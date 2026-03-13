const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

// Protected Admin Routes
router.get("/stats", adminMiddleware, adminController.getDashboardStats);

router.get("/users", adminMiddleware, adminController.getUsers);
router.get("/collectors", adminMiddleware, adminController.getCollectors);
router.put("/users/:id/status", adminMiddleware, adminController.updateUserStatus);
router.delete("/users/:id", adminMiddleware, adminController.deleteUser);

router.get("/requests", adminMiddleware, adminController.getAllRequests);
router.post("/assign", adminMiddleware, adminController.manualAssignCollector);

router.get("/complaints", adminMiddleware, adminController.getComplaints);
router.put("/complaints/:id", adminMiddleware, adminController.updateComplaint);

router.post("/awareness", adminMiddleware, adminController.createAwareness);

// User/Collector route to submit a complaint
router.post("/complaints", authMiddleware, adminController.createComplaint);
router.get("/my-complaints", authMiddleware, adminController.getUserComplaints);

module.exports = router;
