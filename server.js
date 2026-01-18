const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

/* ---------- APP ---------- */
const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- MIDDLEWARE (ORDER MATTERS) ---------- */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://haritha-karma-sena.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- ROUTES ---------- */
const authRoutes = require("./routes/authroutes");
const collectionRoutes = require("./routes/collectionRoutes");
const disposerRequestRoutes = require("./routes/disposerRequestRoutes"); // ✅ MUST MATCH FILE NAME
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api", collectionRoutes);
app.use("/api/disposer-requests", disposerRequestRoutes);
app.use("/api/notifications", notificationRoutes);

/* ---------- HEALTH CHECK ---------- */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Haritha Karma Sena Backend is running 🚀",
  });
});

/* ---------- 404 HANDLER (API ONLY) ---------- */
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});

/* ---------- ERROR HANDLER ---------- */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({
    message: "Internal Server Error",
  });
});

/* ---------- DATABASE + SERVER ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
