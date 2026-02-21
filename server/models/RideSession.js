// models/RideSession.js
// Represents an accepted ride request between two users (requester + accepter).
// Ride is only confirmed when both users press Confirm in chat.

const mongoose = require("mongoose");

const rideSessionSchema = new mongoose.Schema(
  {
    // Requester (User A) — the one whose ride request was accepted
    requesterRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RideRequest",
      required: true,
    },
    requesterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Accepter (User B) — the one who clicked Accept
    accepterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Accepter may have their own ride request (if they were also searching)
    accepterRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RideRequest",
      default: null,
    },
    status: {
      type: String,
      enum: ["accepted", "chatting", "both_confirmed", "rejected", "expired"],
      default: "accepted",
    },
    // For dual confirmation: each user must press Confirm
    requesterConfirmed: { type: Boolean, default: false },
    accepterConfirmed: { type: Boolean, default: false },
    // Last message time — used for 5-minute idle expiry
    lastMessageAt: { type: Date, default: null },
    // Set when status becomes both_confirmed (for invite payload)
    groupId: { type: String, default: null },
    commonSpot: {
      lat: Number,
      lng: Number,
      name: String,
      address: String,
    },
    departureTime: { type: Date, default: null },
  },
  { timestamps: true }
);

rideSessionSchema.index({ requesterUserId: 1, status: 1 });
rideSessionSchema.index({ accepterUserId: 1, status: 1 });
rideSessionSchema.index({ requesterRequestId: 1 });
rideSessionSchema.index({ lastMessageAt: 1 });

module.exports = mongoose.model("RideSession", rideSessionSchema);
