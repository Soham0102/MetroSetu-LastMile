// models/ChatMessage.js
const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    rideSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RideSession",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

chatMessageSchema.index({ rideSession: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
