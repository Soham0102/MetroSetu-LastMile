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
    offeredPrice: { type: Number, required: true },
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
