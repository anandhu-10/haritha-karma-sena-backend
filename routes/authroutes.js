const express = require("express");
const router = express.Router();

/* 🔥 MUST MATCH FILE NAME EXACTLY */
const { signup, login, updateProfile, getProfile } = require("../controllers/authcontroller");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.put("/profile", authMiddleware, updateProfile);
router.get("/profile", authMiddleware, getProfile);

module.exports = router;
