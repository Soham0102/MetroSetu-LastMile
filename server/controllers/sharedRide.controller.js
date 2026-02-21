// controllers/sharedRide.controller.js

const RideRequest = require("../models/RideRequest");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ─────────────────────────────────────────────
// HELPER: Haversine distance in km
// ─────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────
// HELPER: Check if two users are going same direction
// Uses dot product of vectors from source to metro
// ─────────────────────────────────────────────
function isSameDirection(req1, req2, threshold = 0.3) {
  const ax = req1.metroLng - req1.sourceLng;
  const ay = req1.metroLat - req1.sourceLat;
  const bx = req2.metroLng - req2.sourceLng;
  const by = req2.metroLat - req2.sourceLat;
  const dot = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);
  // If either has no metro coords, can't judge direction — allow them
  if (magA === 0 || magB === 0) return true;
  return (dot / (magA * magB)) >= threshold;
}

// ─────────────────────────────────────────────
// HELPER: Compute centroid of multiple points
// ─────────────────────────────────────────────
function computeCentroid(points) {
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng };
}

// ─────────────────────────────────────────────
// HELPER: Get nearest road/place to centroid via Google Places
// ─────────────────────────────────────────────
async function getNearestCommonSpot(centroidLat, centroidLng) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${centroidLat},${centroidLng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);
    const results = response.data.results;

    if (results && results.length > 0) {
      const best = results[0];
      return {
        lat: best.geometry.location.lat,
        lng: best.geometry.location.lng,
        name: best.address_components?.[0]?.long_name || "Common Meetup Point",
        address: best.formatted_address,
      };
    }
  } catch (err) {
    console.error("Geocode error:", err.message);
  }

  // Fallback: just return the centroid
  return {
    lat: centroidLat,
    lng: centroidLng,
    name: "Meetup Point",
    address: `${centroidLat.toFixed(5)}, ${centroidLng.toFixed(5)}`,
  };
}

// ─────────────────────────────────────────────
// HELPER: Find matching rides for a given request
// ─────────────────────────────────────────────
async function findMatches(rideRequest) {
  const RADIUS_KM = 3; // Search within 3km
  const TIME_WINDOW_MINUTES = 30; // ±30 min departure window

  const minTime = new Date(
    rideRequest.departureTime.getTime() - TIME_WINDOW_MINUTES * 60 * 1000
  );
  const maxTime = new Date(
    rideRequest.departureTime.getTime() + TIME_WINDOW_MINUTES * 60 * 1000
  );

  // Geospatial query: find users near requester, same metro, same time window
  const nearbyRequests = await RideRequest.find({
    _id: { $ne: rideRequest._id },
    user: { $ne: rideRequest.user },
    status: "waiting",
    metroName: rideRequest.metroName, // Same destination metro
    departureTime: { $gte: minTime, $lte: maxTime },
    sourceLocation: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [rideRequest.sourceLng, rideRequest.sourceLat],
        },
        $maxDistance: RADIUS_KM * 1000, // meters
      },
    },
  }).populate("user", "name email phone avatar");

  // Further filter by direction similarity
  const directionMatches = nearbyRequests.filter((other) =>
    isSameDirection(rideRequest, other)
  );

  return directionMatches;
}

// ─────────────────────────────────────────────
// CREATE or UPDATE ride request
// ─────────────────────────────────────────────
exports.createRideRequest = async (req, res) => {
  try {
    const {
      sourceLat,
      sourceLng,
      sourceAddress,
      metroName,
      metroLat,
      metroLng,
      departureTime,
    } = req.body;

    const io = req.app.get("io");

    // Upsert: update if waiting request exists
    let rideRequest = await RideRequest.findOne({
      user: req.user.id,
      status: "waiting",
    });

    const requestData = {
      sourceLat,
      sourceLng,
      sourceAddress: sourceAddress || "",
      sourceLocation: {
        type: "Point",
        coordinates: [sourceLng, sourceLat],
      },
      metroName,
      metroLat,
      metroLng,
      departureTime: new Date(departureTime),
    };

    if (rideRequest) {
      Object.assign(rideRequest, requestData);
      await rideRequest.save();
    } else {
      rideRequest = await RideRequest.create({
        user: req.user.id,
        ...requestData,
      });
    }

    await rideRequest.populate("user", "name email phone avatar");

    // Emit to all connected clients that a new/updated request exists
    if (io) {
      io.emit("ride:new_request", {
        rideRequest: rideRequest.toObject(),
      });
    }

    // Find matches for this request
    const matches = await findMatches(rideRequest);

    // If matches found, compute common spot and notify
    let commonSpot = null;
    if (matches.length > 0) {
      const allPoints = [
        { lat: rideRequest.sourceLat, lng: rideRequest.sourceLng },
        ...matches.map((m) => ({ lat: m.sourceLat, lng: m.sourceLng })),
      ];

      const centroid = computeCentroid(allPoints);
      commonSpot = await getNearestCommonSpot(centroid.lat, centroid.lng);

      // Create a shared group ID
      const groupId = uuidv4();

      // Update all matched requests with the common spot
      const allMatchedIds = [rideRequest._id, ...matches.map((m) => m._id)];
      const allMatchedUserIds = [
        rideRequest.user._id,
        ...matches.map((m) => m.user._id),
      ];

      await RideRequest.updateMany(
        { _id: { $in: allMatchedIds } },
        {
          $set: {
            commonSpot,
            matchedGroupId: groupId,
            matchedWith: allMatchedUserIds,
            // Don't auto-set matched status - let users confirm
          },
        }
      );

      // Emit match found to all involved users
      if (io) {
        allMatchedIds.forEach((id) => {
          io.to(`user:${id.toString()}`).emit("ride:match_found", {
            groupId,
            commonSpot,
            matches: matches.map((m) => ({
              id: m._id,
              user: m.user,
              sourceLat: m.sourceLat,
              sourceLng: m.sourceLng,
              departureTime: m.departureTime,
            })),
          });
        });

        // Also broadcast updated spot to all watchers
        io.emit("ride:common_spot_updated", {
          metroName,
          commonSpot,
          groupId,
          userCount: allMatchedIds.length,
        });
      }
    }

    res.status(201).json({
      message: rideRequest.isNew
        ? "Ride request created"
        : "Ride request updated",
      rideRequest,
      matches: matches.map((m) => ({
        id: m._id,
        user: { name: m.user.name, avatar: m.user.avatar },
        sourceLat: m.sourceLat,
        sourceLng: m.sourceLng,
        departureTime: m.departureTime,
        distance: haversineDistance(
          rideRequest.sourceLat,
          rideRequest.sourceLng,
          m.sourceLat,
          m.sourceLng
        ).toFixed(2),
      })),
      commonSpot,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET all nearby waiting requests (for map view)
// ─────────────────────────────────────────────
exports.getNearbyRequests = async (req, res) => {
  try {
    const { lat, lng, metroName, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const query = {
      user: { $ne: req.user.id },
      status: "waiting",          // only live, unbooked requests
      sourceLocation: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius) * 1000,
        },
      },
    };

    // Case-insensitive metro match
    if (metroName) {
      query.metroName = { $regex: new RegExp(`^${metroName.trim()}$`, "i") };
    }

    const requests = await RideRequest.find(query)
      .populate("user", "name avatar phone")
      .limit(20)
      .lean();

    res.json({
      count: requests.length,
      requests: requests.map((r) => ({
        _id: r._id,
        id:  r._id,
        user: r.user,
        sourceLat:  r.sourceLat,
        sourceLng:  r.sourceLng,
        metroName:  r.metroName,
        metroLat:   r.metroLat,   // ← was missing before — direction filter needs this
        metroLng:   r.metroLng,   // ← was missing before
        departureTime: r.departureTime,
        commonSpot: r.commonSpot,
        distance: haversineDistance(
          parseFloat(lat), parseFloat(lng),
          r.sourceLat, r.sourceLng
        ).toFixed(2),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET my current ride request
// ─────────────────────────────────────────────
exports.getMyRideRequest = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findOne({
      user: req.user.id,
      status: "waiting",
    })
      .populate("user", "name email phone avatar")
      .populate("matchedWith", "name avatar phone");

    if (!rideRequest) {
      return res.status(404).json({ message: "No active ride request found" });
    }

    res.json(rideRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// CANCEL ride request
// ─────────────────────────────────────────────
exports.cancelRideRequest = async (req, res) => {
  try {
    const io = req.app.get("io");

    const rideRequest = await RideRequest.findOneAndUpdate(
      { user: req.user.id, status: "waiting" },
      { status: "cancelled" },
      { new: true }
    );

    if (!rideRequest) {
      return res.status(404).json({ message: "No active request to cancel" });
    }

    if (io) {
      io.emit("ride:request_cancelled", { requestId: rideRequest._id });
    }

    res.json({ message: "Ride request cancelled", rideRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// CANCEL STALE — silently cancel any leftover waiting request
// Called on page mount so back-navigation doesn't leave ghost requests
// Returns 200 even if nothing was cancelled (204 = nothing found)
// ─────────────────────────────────────────────
exports.cancelStaleRequest = async (req, res) => {
  try {
    const io = req.app.get("io");

    const rideRequest = await RideRequest.findOneAndUpdate(
      { user: req.user.id, status: "waiting" },
      { status: "cancelled" },
      { new: true }
    );

    if (rideRequest && io) {
      io.emit("ride:request_cancelled", { requestId: rideRequest._id });
    }

    // Always 200 — caller doesn't need to handle 404
    res.json({ cancelled: !!rideRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// CONFIRM match (user agrees to go to common spot)
// ─────────────────────────────────────────────
exports.confirmMatch = async (req, res) => {
  try {
    const io = req.app.get("io");

    const rideRequest = await RideRequest.findOneAndUpdate(
      { user: req.user.id, status: "waiting", matchedGroupId: { $ne: null } },
      { status: "matched" },
      { new: true }
    ).populate("matchedWith", "name avatar phone");

    if (!rideRequest) {
      return res.status(404).json({ message: "No matched request found" });
    }

    if (io) {
      io.emit("ride:confirmed", {
        groupId: rideRequest.matchedGroupId,
        userId: req.user.id,
        requestId: rideRequest._id,
      });
    }

    res.json({ message: "Match confirmed!", rideRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};