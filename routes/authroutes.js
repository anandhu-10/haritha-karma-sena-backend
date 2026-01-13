const express = require("express");
const router = express.Router();

/* 🔥 MUST MATCH FILE NAME EXACTLY */
const { signup, login } = require("../controllers/authcontroller");

router.post("/signup", signup);
router.post("/login", login);

module.exports = router;
