const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const Message = require("./models/Message");

/* ---------- APP ---------- */
const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- HTTP SERVER (REQUIRED FOR SOCKET.IO) ---------- */
const server = http.createServer(app);

/* ---------- MIDDLEWARE ---------- */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://haritha-karma-sena.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

/* ---------- SOCKET.IO ---------- */
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://haritha-karma-sena.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔵 User connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`🟢 Joined room: ${roomId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      await Message.create({
        roomId: data.roomId,
        sender: data.sender,
        message: data.message,
        time: data.time
      });
      socket.to(data.roomId).emit("receive_message", data);
    } catch (err) {
      console.error("Socket message save error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

/* ---------- ROUTES ---------- */
const authRoutes = require("./routes/authroutes");
const collectionRoutes = require("./routes/collectionRoutes");
const disposerRequestRoutes = require("./routes/disposerRequestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/api/auth", authRoutes);
app.use("/api", collectionRoutes);
app.use("/api/disposer-requests", disposerRequestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);

/* ---------- PERSISTENT CHAT API ---------- */
app.get("/api/messages/:roomId", async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});


/* ---------- HEALTH CHECK ---------- */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Haritha Karma Sena Backend + Chat is running 🚀",
  });
});

/* ---------- 404 HANDLER ---------- */
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

/* ---------- ERROR HANDLER ---------- */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

/* ---------- DATABASE + SERVER ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => {
      console.log(`✅ Server + Chat running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
