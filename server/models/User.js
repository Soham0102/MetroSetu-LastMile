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
    concessionRejected: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
