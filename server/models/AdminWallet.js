const mongoose = require("mongoose");

const adminWalletSchema = new mongoose.Schema(
  {
    // Total commission earned from personal rides (4% of fullPrice per ride)
    totalCommission: { type: Number, default: 0 },
    // Concession discounts given (deducted from wallet)
    totalConcessionDeduction: { type: Number, default: 0 },
    // Donations total (from Donation model we can sum; optional cached value)
    totalDonations: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Single document for app-wide wallet state
adminWalletSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model("AdminWallet", adminWalletSchema);
