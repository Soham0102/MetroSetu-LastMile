const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { create, nearby, getOne, accept, startRide, myRides, reportSOS } = require("../controllers/personalRide.controller");

router.post("/", protect, create);
router.get("/nearby", protect, nearby);
router.get("/my-rides", protect, myRides);
router.get("/:rideId", protect, getOne);
router.post("/:rideId/accept", protect, accept);
router.post("/:rideId/start", protect, startRide);
router.post("/:rideId/sos", protect, reportSOS);

module.exports = router;
