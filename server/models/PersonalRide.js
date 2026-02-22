const mongoose = require("mongoose");

const personalRideSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pickupLat: { type: Number, required: true },
    pickupLng: { type: Number, required: true },
    pickupAddress: { type: String, default: "" },
    dropLat: { type: Number, required: true },
    dropLng: { type: Number, required: true },
    dropAddress: { type: String, default: "" },
    fullPrice: { type: Number, default: null }, // Actual ride price before concession; driver sees fullPrice * 0.96
    offeredPrice: { type: Number, required: true }, // What user pays (after concession if any)
    vehicleType: { type: String, default: "Auto" },
    status: {
      type: String,
      enum: ["pending", "accepted", "ride_started", "completed", "cancelled"],
      default: "pending",
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    otp: { type: String, default: null },
    pickupLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
  },
  { timestamps: true }
);

personalRideSchema.index({ pickupLocation: "2dsphere" });
personalRideSchema.index({ status: 1 });

module.exports = mongoose.model("PersonalRide", personalRideSchema);
