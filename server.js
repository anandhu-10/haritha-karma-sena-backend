const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

/* ---------- ROUTES ---------- */
const authRoutes = require("./routes/auth"); // ✅ FIXED NAME
const collectionRoutes = require("./routes/collectionRoutes");
const disposerRequestRoutes = require("./routes/disposerRequestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

/* ---------- CONFIG ---------- */
const PORT = process.env.PORT || 5000;

/* ---------- CORS CONFIG ---------- */
const corsOptions = {
  origin: [
    "http://localhost:3000", // ✅ CRA frontend
    "https://haritha-karma-sena.vercel.app", // ✅ Vercel frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

/* ✅ HANDLE PREFLIGHT REQUESTS */
app.options("*", cors(corsOptions));

/* ---------- BODY PARSERS ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- ROUTES ---------- */
app.use("/api/auth", authroutes); // ✅ FIXED VARIABLE NAME
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
    process.exit(1); // ✅ Prevent hanging server
  });
