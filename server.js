const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

/* ---------- ROUTES ---------- */
const authRoutes = require("./routes/authroutes");
const collectionRoutes = require("./routes/collectionRoutes");
const disposerRequestRoutes = require("./routes/disposerRequestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- CORS ---------- */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://haritha-karma-sena.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ---------- BODY PARSERS ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- ROUTES ---------- */
app.use("/api/auth", authRoutes);
app.use("/api", collectionRoutes);
app.use("/api/disposer-requests", disposerRequestRoutes);
app.use("/api/notifications", notificationRoutes);

/* ---------- HEALTH CHECK ---------- */
app.get("/", (req, res) => {
  res.status(200).send("Haritha Karma Sena Backend is running 🚀");
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
