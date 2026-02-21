// routes/sharedRide.routes.js  ← FINAL VERSION
const express = require("express");
const router  = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  createRideRequest,
  getMyRideRequest,
  getNearbyRequests,
  cancelRideRequest,
  cancelStaleRequest,
  confirmMatch,
} = require("../controllers/sharedRide.controller");

const {
  geocodeCommonSpot,
  bookSharedRide,
} = require("../controllers/bookAndGeocode.controller");

router.post("/request",      protect, createRideRequest);
router.get("/my-request",    protect, getMyRideRequest);
router.get("/nearby",        protect, getNearbyRequests);
router.delete("/cancel",     protect, cancelRideRequest);
router.delete("/cancel-stale", protect, cancelStaleRequest);  // ← NEW: silent stale cleanup
router.post("/confirm",      protect, confirmMatch);
router.get("/geocode",       protect, geocodeCommonSpot);
router.post("/book",         protect, bookSharedRide);

module.exports = router;