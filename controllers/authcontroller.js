const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ======================================================
   SIGNUP
====================================================== */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (!["disposer", "collector"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role selected",
      });
    }

    /* ---------- EMAIL NORMALIZATION ---------- */
    const normalizedEmail = email.trim().toLowerCase();

    /* ---------- CHECK USER ---------- */
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    /* ---------- HASH PASSWORD ---------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------- CREATE USER ---------- */
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    /* ---------- RESPONSE ---------- */
    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({
      message: "Server error during signup",
    });
  }
};

/* ======================================================
   LOGIN
====================================================== */
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required",
      });
    }

    if (!["disposer", "collector"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role selected",
      });
    }

    /* ---------- EMAIL NORMALIZATION ---------- */
    const normalizedEmail = email.trim().toLowerCase();

    /* ---------- FIND USER ---------- */
    const user = await User.findOne({
      email: normalizedEmail,
      role,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    /* ---------- PASSWORD CHECK ---------- */
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    /* ---------- JWT ---------- */
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    /* ---------- RESPONSE ---------- */
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({
      message: "Server error during login",
    });
  }
};
