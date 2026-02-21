const Donation = require("../models/Donation");

exports.createDonation = async (req, res) => {
  try {
    const { donorName, amount } = req.body;
    if (!donorName || !amount || amount < 1) {
      return res.status(400).json({ message: "Donor name and valid amount are required" });
    }
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const donation = await Donation.create({
      donorName,
      amount: Number(amount),
      transactionId,
      date: new Date(),
    });
    const io = req.app.get("io");
    if (io) io.to("admin").emit("donation:created", donation);
    res.status(201).json({
      message: "Donation recorded",
      receipt: {
        donorName: donation.donorName,
        amount: donation.amount,
        date: donation.date,
        transactionId: donation.transactionId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ date: -1 }).lean();
    const total = donations.reduce((sum, d) => sum + d.amount, 0);
    res.json({ donations, total });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
