// ADD THESE TO YOUR sharedRide.controller.js
// (append to existing file, or merge with the previous version)

const axios = require("axios");
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// GET /geocode?lat=&lng=
// Called by RideBookingPage to resolve the common spot name
// ─────────────────────────────────────────────────────────────────────────────
exports.geocodeCommonSpot = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat/lng required" });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);
    const results = response.data.results;

    if (!results || results.length === 0) {
      return res.json({
        commonSpot: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          name: "Meetup Point",
          address: `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`,
        },
      });
    }

    // Try to find a named road or landmark rather than just a full address
    const preferred =
      results.find((r) => r.types.includes("route")) ||
      results.find((r) => r.types.includes("point_of_interest")) ||
      results.find((r) => r.types.includes("establishment")) ||
      results[0];

    const shortName =
      preferred.address_components?.[0]?.long_name ||
      preferred.address_components?.[1]?.long_name ||
      "Meetup Point";

    res.json({
      commonSpot: {
        lat: preferred.geometry.location.lat,
        lng: preferred.geometry.location.lng,
        name: shortName,
        address: preferred.formatted_address,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /book
// Final booking confirmation — updates all matched requests
// ─────────────────────────────────────────────────────────────────────────────
exports.bookSharedRide = async (req, res) => {
  try {
    const { myRequestId, selectedRiderIds, departureTime, seats, commonSpot } = req.body;
    const io = req.app.get("io");

    const RideRequest = require("../models/RideRequest");
    const { v4: uuidv4 } = require("uuid");

    // Fetch requester's own request
    const myRequest = await RideRequest.findById(myRequestId);
    if (!myRequest) return res.status(404).json({ error: "Your request not found" });

    // Fetch all selected riders' requests
    const riderRequests = await RideRequest.find({
      _id: { $in: [] }, // we find by user id below
      user: { $in: selectedRiderIds },
      status: "waiting",
    }).populate("user", "name email phone avatar");

    const groupId = uuidv4();
    const allIds = [myRequest._id, ...riderRequests.map((r) => r._id)];
    const allUserIds = [req.user.id, ...selectedRiderIds];

    // Update all to matched
    await RideRequest.updateMany(
      { _id: { $in: allIds } },
      {
        $set: {
          status: "matched",
          departureTime: new Date(departureTime),
          commonSpot,
          matchedGroupId: groupId,
          matchedWith: allUserIds,
          seats,
        },
      }
    );

    // Notify all matched users via socket
    // Also broadcast to ALL users so they remove booked riders from their lists
    if (io) {
      const payload = {
        groupId,
        commonSpot,
        departureTime,
        seats,
        bookedBy:       req.user.id,
        bookedRiderIds: allUserIds,   // ← ALL user IDs in this booking (including booker)
      };

      // Personal room notification to each matched user
      allUserIds.forEach((uid) => {
        io.to(`user:${uid}`).emit("ride:booked", payload);
      });

      // Global broadcast so OTHER searching users remove these riders from their maps
      io.emit("ride:riders_booked", {
        bookedRiderIds: allUserIds,   // user IDs that are no longer available
      });
    }

    const booking = {
      groupId,
      commonSpot,
      departureTime,
      seats,
      totalRiders: allIds.length,
      status: "confirmed",
    };

    res.status(201).json({
      message: "Shared ride booked successfully!",
      booking,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};