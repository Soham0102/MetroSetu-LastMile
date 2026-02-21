// models/RideRequest.js
const mongoose = require("mongoose");

const rideRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // GeoJSON point for geospatial queries
    sourceLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    // Keep flat fields too for easy access
    sourceLat: { type: Number, required: true },
    sourceLng: { type: Number, required: true },
    sourceAddress: { type: String, default: "" },

    // Destination metro/stop
    metroName: { type: String, required: true },
    metroLat: { type: Number, required: true },
    metroLng: { type: Number, required: true },

    departureTime: { type: Date, required: true },

    // Computed common pickup spot (set after matching)
    commonSpot: {
      lat: Number,
      lng: Number,
      name: String,
      address: String,
    },

    status: {
      type: String,
      enum: ["waiting", "matched", "cancelled"],
      default: "waiting",
    },

    // Users matched together
    matchedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    matchedGroupId: {
      type: String, // shared group identifier for socket room
      default: null,
    },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
rideRequestSchema.index({ sourceLocation: "2dsphere" });

// Compound index for fast lookups
rideRequestSchema.index({ status: 1, metroName: 1, departureTime: 1 });

module.exports = mongoose.model("RideRequest", rideRequestSchema);