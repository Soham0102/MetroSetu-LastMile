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
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

// ================= ROUTES =================
app.use("/api/weather", require("./routes/weatherRoutes"));
app.use("/api/routes", require("./routes/routes"));
app.use("/api/routes", require("./routes/routesApi"));
app.use("/api/shared-ride", require("./routes/sharedRide.routes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));
app.use("/api/personal-ride", require("./routes/personalRide.routes"));
app.use("/api/maps", require("./routes/maps.routes"));

app.get("/", (req, res) => {
  res.send("MetroSetu Backend Running 🚀");
});

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : ["http://localhost:3000", "http://localhost:5173"],
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
    socket.isAdmin = !!decoded.isAdmin;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// 🔌 Socket Connection
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.userId}`);

  // Join personal room for user notifications (e.g. concession approved)
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
  }
  // Admin room for real-time donation/concession updates
  if (socket.isAdmin) {
    socket.join("admin");
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