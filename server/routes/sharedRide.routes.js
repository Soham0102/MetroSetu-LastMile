// routes/sharedRide.routes.js
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

const {
  acceptRequest,
  rejectRequest,
  getMySessions,
  getSession,
  getMessages,
  sendMessage,
  confirmRide,
  expireSession,
} = require("../controllers/rideSession.controller");

router.post("/request",      protect, createRideRequest);
router.get("/my-request",    protect, getMyRideRequest);
router.get("/nearby",        protect, getNearbyRequests);
router.delete("/cancel",     protect, cancelRideRequest);
router.delete("/cancel-stale", protect, cancelStaleRequest);
router.post("/confirm",      protect, confirmMatch);
router.get("/geocode",       protect, geocodeCommonSpot);
router.post("/book",         protect, bookSharedRide);

// Accept/Reject + Chat + Dual confirm flow
router.post("/accept-request", protect, acceptRequest);
router.post("/reject-request", protect, rejectRequest);
router.get("/sessions",        protect, getMySessions);
router.get("/session/:sessionId",       protect, getSession);
router.get("/session/:sessionId/messages", protect, getMessages);
router.post("/session/:sessionId/message", protect, sendMessage);
router.post("/session/:sessionId/confirm", protect, confirmRide);
router.post("/session/:sessionId/expire",  protect, expireSession);

module.exports = router;