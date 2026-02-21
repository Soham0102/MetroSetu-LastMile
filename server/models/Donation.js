const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donorName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    transactionId: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
