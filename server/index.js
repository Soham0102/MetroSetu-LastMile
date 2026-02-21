// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const connectDB = require("./config/db");

// dotenv.config();
// connectDB();

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use("/api/weather", require("./routes/weatherRoutes"));
// app.use("/api/routes", require("./routes/routes"));
// app.use("/api/routes", require("./routes/routesApi"));

// const sharedRideRoutes = require("./routes/sharedRide.routes");
// app.use("/api/shared-ride", sharedRideRoutes);

// app.use("/api/auth", require("./routes/authRoutes"));

// app.get("/", (req, res) => {
//   res.send("MetroSetu Backend Running 🚀");
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// ================= ENV + DB =================
dotenv.config();
connectDB();

// ================= EXPRESS APP =================
const app = express();
const server = http.createServer(app);

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= ROUTES =================
app.use("/api/weather", require("./routes/weatherRoutes"));
app.use("/api/routes", require("./routes/routes"));
app.use("/api/routes", require("./routes/routesApi"));
app.use("/api/shared-ride", require("./routes/sharedRide.routes"));
app.use("/api/auth", require("./routes/authRoutes"));

app.get("/", (req, res) => {
  res.send("MetroSetu Backend Running 🚀");
});

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible inside controllers
app.set("io", io);

// 🔐 Socket Authentication Middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// 🔌 Socket Connection
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.userId}`);

  // Join personal room
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
  }

  // Join ride group room
  socket.on("join:group", ({ groupId }) => {
    socket.join(`group:${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Expire chat sessions idle > 5 minutes (run every 60s)
const { expireIdleSessions } = require("./controllers/rideSession.controller");
setInterval(() => {
  try {
    expireIdleSessions(io);
  } catch (e) {
    console.warn("expireIdleSessions:", e.message);
  }
}, 60 * 1000);

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});