const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "PersonalRide", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Snapshot for emergency handling (names, phones, addresses)
    userSnapshot: {
      name: String,
      email: String,
      phone: String,
      gender: String,
    },
    driverSnapshot: {
      name: String,
      phone: String,
    },
    rideSnapshot: {
      pickupAddress: String,
      dropAddress: String,
      pickupLat: Number,
      pickupLng: Number,
      dropLat: Number,
      dropLng: Number,
      offeredPrice: Number,
      vehicleType: String,
    },
    status: { type: String, enum: ["active", "acknowledged", "resolved"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
