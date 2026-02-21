// require("dotenv").config();
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const connectDB = require("./config/db");

// connectDB();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// app.set("io", io);

// // Routes
// app.use("/api/shared-rides", require("./routes/sharedRideRoutes"));

// io.on("connection", (socket) => {
//   console.log("User Connected:", socket.id);

//   socket.on("joinRide", (rideId) => {
//     socket.join(rideId);
//   });

//   socket.on("sendMessage", (data) => {
//     io.to(data.rideId).emit("receiveMessage", data);
//   });
// });

// server.listen(5000, () => console.log("Server running"));