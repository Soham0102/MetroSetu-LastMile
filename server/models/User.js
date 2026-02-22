const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: null
    },
    // Concession application
    concessionCategory: {
      type: String,
      enum: ["Student", "Corporate", "Less Privileged"],
      default: null
    },
    concessionDocuments: {
      studentId: { type: String, default: null },
      corporateId: { type: String, default: null },
      aadhaarCard: { type: String, default: null },
      rationCard: { type: String, default: null }
    },
    concessionApproved: { type: Boolean, default: false },
    concessionRejected: { type: Boolean, default: false },
    // Driver registration
    isDriver: { type: Boolean, default: false },
    driverApproved: { type: Boolean, default: false },
    driverRejected: { type: Boolean, default: false },
    vehicleType: { type: String, enum: ["Auto", "Car", "Cab", "Sedan", "Go Sedan"], default: null },
    vehicleNumber: { type: String, default: null },
    licenseNumber: { type: String, default: null },
    driverDocuments: {
      rc: { type: String, default: null },
      insurance: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
