const express = require("express");
const router = express.Router();
const { createDonation, getAllDonations } = require("../controllers/donationController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", createDonation);
router.get("/", protect, adminOnly, getAllDonations);

module.exports = router;
