// controllers/rideSession.controller.js
// Accept/Reject flow, chat, time selection, dual confirmation, and 5-min idle expiry.

const RideRequest = require("../models/RideRequest");
const RideSession = require("../models/RideSession");
const ChatMessage = require("../models/ChatMessage");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const CHAT_IDLE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function getIo(req) {
  return req.app.get("io");
}

// Geocode lat,lng to get a named common spot (for session common point)
async function geocodeCommonSpot(lat, lng) {
  if (!lat || !lng) return { lat: lat || 0, lng: lng || 0, name: "Meetup Point", address: "" };
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);
    const results = response.data.results;
    if (!results || results.length === 0) {
      return { lat, lng, name: "Meetup Point", address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
    }
    const preferred =
      results.find((r) => r.types.includes("route")) ||
      results.find((r) => r.types.includes("point_of_interest")) ||
      results.find((r) => r.types.includes("establishment")) ||
      results[0];
    const shortName =
      preferred.address_components?.[0]?.long_name ||
      preferred.address_components?.[1]?.long_name ||
      "Meetup Point";
    return {
      lat: preferred.geometry.location.lat,
      lng: preferred.geometry.location.lng,
      name: shortName,
      address: preferred.formatted_address || "",
    };
  } catch (err) {
    console.error("geocodeCommonSpot:", err.message);
    return { lat, lng, name: "Meetup Point", address: "" };
  }
}

// ─── Accept request (User B accepts User A's request) ─────────────────────
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body; // requester's RideRequest _id
    const io = getIo(req);
    const accepterUserId = req.user.id;

    if (!requestId) {
      return res.status(400).json({ error: "requestId is required" });
    }

    const requesterRequest = await RideRequest.findById(requestId)
      .populate("user", "name avatar phone");
    if (!requesterRequest || requesterRequest.status !== "waiting") {
      return res.status(404).json({ error: "Request not found or no longer available" });
    }

    const requesterUserId = requesterRequest.user._id.toString();
    if (requesterUserId === accepterUserId) {
      return res.status(400).json({ error: "Cannot accept your own request" });
    }

    // One active session per pair (requester request + accepter)
    const existing = await RideSession.findOne({
      requesterRequestId: requestId,
      accepterUserId,
      status: { $in: ["accepted", "chatting", "both_confirmed"] },
    });
    if (existing) {
      return res.status(200).json({
        message: "Already accepted",
        session: existing,
        otherUser: requesterRequest.user,
      });
    }

    const accepterRequest = await RideRequest.findOne({
      user: accepterUserId,
      status: "waiting",
    });

    // Compute common point from centroid of both users' locations and geocode it
    const reqLat = requesterRequest.sourceLat;
    const reqLng = requesterRequest.sourceLng;
    const accLat = accepterRequest?.sourceLat ?? reqLat;
    const accLng = accepterRequest?.sourceLng ?? reqLng;
    const centroidLat = (reqLat + accLat) / 2;
    const centroidLng = (reqLng + accLng) / 2;
    const commonSpot = await geocodeCommonSpot(centroidLat, centroidLng);

    const session = await RideSession.create({
      requesterRequestId: requestId,
      requesterUserId,
      accepterUserId,
      accepterRequestId: accepterRequest?._id || null,
      status: "accepted",
      commonSpot,
      departureTime: requesterRequest.departureTime,
    });

    if (io) {
      io.to(`user:${requesterUserId}`).emit("ride:request_accepted", {
        sessionId: session._id,
        accepter: req.user,
        requestId,
      });
    }

    const sessionObj = session.toObject();
    sessionObj.otherUser = requesterRequest.user;

    res.status(201).json({
      message: "Request accepted. You can chat to finalize details.",
      session: sessionObj,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Reject request (User B rejects User A's request) ─────────────────────
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const io = getIo(req);

    if (!requestId) {
      return res.status(400).json({ error: "requestId is required" });
    }

    const requesterRequest = await RideRequest.findById(requestId).select("user");
    if (!requesterRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    const requesterUserId = requesterRequest.user.toString();
    if (io) {
      io.to(`user:${requesterUserId}`).emit("ride:request_rejected", {
        requestId,
        rejectedBy: req.user.id,
      });
    }

    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get my active sessions (for showing Chat button) ────────────────────
exports.getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await RideSession.find({
      $or: [{ requesterUserId: userId }, { accepterUserId: userId }],
      status: { $in: ["accepted", "chatting"] },
    })
      .populate("requesterUserId", "name avatar")
      .populate("accepterUserId", "name avatar")
      .sort({ updatedAt: -1 })
      .lean();

    const list = sessions.map((s) => {
      const other = s.requesterUserId._id.toString() === userId
        ? s.accepterUserId
        : s.requesterUserId;
      const isRequester = s.requesterUserId._id.toString() === userId;
      return {
        _id: s._id,
        otherUser: other,
        isRequester,
        requesterRequestId: s.requesterRequestId,
        status: s.status,
        lastMessageAt: s.lastMessageAt,
        commonSpot: s.commonSpot,
        departureTime: s.departureTime,
        proposedTime: s.proposedTime,
        proposedBy: s.proposedBy,
        finalTime: s.finalTime,
        finalTimeProposedBy: s.finalTimeProposedBy,
        finalTimeAccepted: s.finalTimeAccepted,
      };
    });

    res.json({ sessions: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get single session (for chat popup) ─────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await RideSession.findById(sessionId)
      .populate("requesterUserId", "name avatar")
      .populate("accepterUserId", "name avatar");
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const requesterId = session.requesterUserId._id.toString();
    const accepterId = session.accepterUserId._id.toString();
    if (userId !== requesterId && userId !== accepterId) {
      return res.status(403).json({ error: "Not part of this session" });
    }

    if (session.status === "expired" || session.status === "rejected") {
      return res.status(400).json({ error: "Session no longer active" });
    }

    const other = userId === requesterId ? session.accepterUserId : session.requesterUserId;
    const isRequester = userId === requesterId;
    const payload = {
      _id: session._id,
      status: session.status,
      otherUser: other,
      isRequester,
      requesterConfirmed: session.requesterConfirmed,
      accepterConfirmed: session.accepterConfirmed,
      commonSpot: session.commonSpot,
      departureTime: session.departureTime,
      lastMessageAt: session.lastMessageAt,
      proposedTime: session.proposedTime,
      proposedBy: session.proposedBy,
      finalTime: session.finalTime,
      finalTimeProposedBy: session.finalTimeProposedBy,
      finalTimeAccepted: session.finalTimeAccepted,
    };

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Propose time (either user can propose; visible to the other) ──────────
exports.proposeTime = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { proposedTime: proposedTimeStr } = req.body;
    const io = getIo(req);
    const userId = req.user.id;

    if (!proposedTimeStr) {
      return res.status(400).json({ error: "proposedTime is required (ISO string)" });
    }

    const session = await RideSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const requesterId = session.requesterUserId.toString();
    const accepterId = session.accepterUserId.toString();
    if (userId !== requesterId && userId !== accepterId) {
      return res.status(403).json({ error: "Not part of this session" });
    }
    if (session.status !== "accepted" && session.status !== "chatting") {
      return res.status(400).json({ error: "Session is no longer active" });
    }

    const proposedTime = new Date(proposedTimeStr);
    session.proposedTime = proposedTime;
    session.proposedBy = userId;
    await session.save();

    const otherUserId = userId === requesterId ? accepterId : requesterId;
    if (io) {
      io.to(`user:${otherUserId}`).emit("ride:time_proposed", {
        sessionId,
        proposedTime: proposedTime.toISOString(),
        proposedBy: userId,
      });
    }

    res.json({
      session: session.toObject(),
      proposedTime: proposedTime.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Set final time (proposer locks time; confirmation goes to the OTHER user only) ─
exports.setFinalTime = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { finalTime: finalTimeStr } = req.body;
    const io = getIo(req);
    const userId = req.user.id;

    if (!finalTimeStr) {
      return res.status(400).json({ error: "finalTime is required (ISO string)" });
    }

    const session = await RideSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const requesterId = session.requesterUserId.toString();
    const accepterId = session.accepterUserId.toString();
    if (userId !== requesterId && userId !== accepterId) {
      return res.status(403).json({ error: "Not part of this session" });
    }
    if (session.status !== "accepted" && session.status !== "chatting") {
      return res.status(400).json({ error: "Session is no longer active" });
    }

    const finalTime = new Date(finalTimeStr);
    session.finalTime = finalTime;
    session.finalTimeProposedBy = userId;
    session.finalTimeAccepted = false;
    await session.save();

    const otherUserId = userId === requesterId ? accepterId : requesterId;
    if (io) {
      io.to(`user:${otherUserId}`).emit("ride:final_time_proposed", {
        sessionId,
        finalTime: finalTime.toISOString(),
        commonSpot: session.commonSpot,
        proposedBy: userId,
      });
    }

    res.json({
      session: session.toObject(),
      finalTime: finalTime.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Accept final time (other user confirms → both confirmed, book ride, redirect both) ─
exports.acceptFinalTime = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const io = getIo(req);
    const userId = req.user.id;

    const session = await RideSession.findById(sessionId)
      .populate("requesterUserId", "name avatar");
    if (!session) return res.status(404).json({ error: "Session not found" });
    const requesterId = session.requesterUserId._id.toString();
    const accepterId = session.accepterUserId.toString();
    if (userId !== requesterId && userId !== accepterId) {
      return res.status(403).json({ error: "Not part of this session" });
    }
    if (!session.finalTime || !session.finalTimeProposedBy) {
      return res.status(400).json({ error: "No final time has been proposed" });
    }
    if (session.finalTimeProposedBy.toString() === userId) {
      return res.status(400).json({ error: "You proposed the final time; the other user must accept" });
    }
    if (session.finalTimeAccepted) {
      return res.status(400).json({ error: "Final time already accepted" });
    }

    session.finalTimeAccepted = true;
    session.requesterConfirmed = true;
    session.accepterConfirmed = true;
    session.status = "both_confirmed";
    const groupId = uuidv4();
    session.groupId = groupId;
    session.departureTime = session.finalTime;
    await session.save();

    const allUserIds = [requesterId, accepterId];
    const allRequestIds = await RideRequest.find({
      user: { $in: allUserIds },
      status: "waiting",
    }).select("_id user");

    const commonSpot = session.commonSpot || {
      lat: 0,
      lng: 0,
      name: "Meetup Point",
      address: "",
    };

    await RideRequest.updateMany(
      { _id: { $in: allRequestIds.map((r) => r._id) } },
      {
        $set: {
          status: "matched",
          departureTime: session.finalTime,
          commonSpot,
          matchedGroupId: groupId,
          matchedWith: allUserIds,
        },
      }
    );

    const payload = {
      groupId,
      commonSpot,
      departureTime: session.finalTime.toISOString(),
      seats: 2,
      bookedBy: requesterId,
      bookedRiderIds: allUserIds,
    };

    if (io) {
      allUserIds.forEach((uid) => {
        io.to(`user:${uid}`).emit("ride:booked", { ...payload, redirect: true });
      });
      io.emit("ride:riders_booked", { bookedRiderIds: allUserIds });
    }

    res.json({
      message: "Ride confirmed! Both parties agreed.",
      session: session.toObject(),
      booking: payload,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Reject final time (other user declines; can propose again) ────────────
exports.rejectFinalTime = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const io = getIo(req);
    const userId = req.user.id;

    const session = await RideSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const requesterId = session.requesterUserId.toString();
    const accepterId = session.accepterUserId.toString();
    if (userId !== requesterId && userId !== accepterId) {
      return res.status(403).json({ error: "Not part of this session" });
    }
    if (session.finalTimeProposedBy?.toString() === userId) {
      return res.status(400).json({ error: "You proposed the final time; you cannot reject it" });
    }

    session.finalTime = null;
    session.finalTimeProposedBy = null;
    session.finalTimeAccepted = false;
    await session.save();

    const otherUserId = userId === requesterId ? accepterId : requesterId;
    if (io) {
      io.to(`user:${otherUserId}`).emit("ride:final_time_rejected", { sessionId });
    }

    res.json({ message: "Final time rejected. You can propose a new time.", session: session.toObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get messages for session ─────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await RideSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const requesterId = session.requesterUserId.toString();
    const accepterId = session.accepterUserId.toString();
    if (userId !== requesterId && userId !== accepterId) {
      return res.status(403).json({ error: "Not part of this session" });
    }

    const messages = await ChatMessage.find({ rideSession: sessionId })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 })
      .lean();

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Send message + update lastMessageAt, broadcast to other user ─────────
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;
    const io = getIo(req);
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const session = await RideSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const requesterId = session.requesterUserId.toString();
    const accepterId = session.accepterUserId.toString();
    if (userId !== requesterId && userId !== accepterId) {
      return res.status(403).json({ error: "Not part of this session" });
    }
    if (session.status !== "accepted" && session.status !== "chatting") {
      return res.status(400).json({ error: "Session is no longer active" });
    }

    session.status = "chatting";
    session.lastMessageAt = new Date();
    await session.save();

    const msg = await ChatMessage.create({
      rideSession: sessionId,
      sender: userId,
      text: text.trim(),
    });
    await msg.populate("sender", "name avatar");

    const otherUserId = userId === requesterId ? accepterId : requesterId;
    if (io) {
      io.to(`user:${otherUserId}`).emit("ride:chat_message", {
        sessionId,
        message: msg.toObject(),
      });
    }

    res.status(201).json({ message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Confirm (current user marks self as confirmed) ───────────────────────
// When both confirmed → create booking and emit ride:booked.
exports.confirmRide = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const io = getIo(req);
    const userId = req.user.id;

    const session = await RideSession.findById(sessionId)
      .populate("requesterUserId", "name avatar");
    if (!session) return res.status(404).json({ error: "Session not found" });
    const requesterId = session.requesterUserId._id.toString();
    const accepterId = session.accepterUserId.toString();
    if (userId !== requesterId && userId !== accepterId) {
      return res.status(403).json({ error: "Not part of this session" });
    }
    if (session.status === "both_confirmed" || session.status === "expired") {
      return res.status(400).json({ error: "Session already finalized or expired" });
    }

    if (userId === requesterId) {
      session.requesterConfirmed = true;
    } else {
      session.accepterConfirmed = true;
    }
    await session.save();

    const otherUserId = userId === requesterId ? accepterId : requesterId;
    if (io) {
      io.to(`user:${otherUserId}`).emit("ride:other_confirmed", {
        sessionId,
        otherUserId: userId,
      });
    }

    if (session.requesterConfirmed && session.accepterConfirmed) {
      session.status = "both_confirmed";
      const groupId = uuidv4();
      session.groupId = groupId;
      await session.save();

      const myRequest = await RideRequest.findById(session.requesterRequestId);
      if (!myRequest) {
        return res.json({
          message: "You confirmed. Waiting for the other person.",
          session: session.toObject(),
        });
      }

      const departureTime = session.departureTime || myRequest.departureTime;
      const commonSpot = session.commonSpot || myRequest.commonSpot || {
        lat: myRequest.sourceLat,
        lng: myRequest.sourceLng,
        name: "Meetup Point",
        address: "",
      };

      const allUserIds = [requesterId, accepterId];
      const allRequestIds = await RideRequest.find({
        user: { $in: allUserIds },
        status: "waiting",
      }).select("_id user");

      await RideRequest.updateMany(
        { _id: { $in: allRequestIds.map((r) => r._id) } },
        {
          $set: {
            status: "matched",
            departureTime: new Date(departureTime),
            commonSpot,
            matchedGroupId: groupId,
            matchedWith: allUserIds,
          },
        }
      );

      const payload = {
        groupId,
        commonSpot,
        departureTime,
        seats: 2,
        bookedBy: requesterId,
        bookedRiderIds: allUserIds,
        redirect: true,
      };

      if (io) {
        allUserIds.forEach((uid) => {
          io.to(`user:${uid}`).emit("ride:booked", payload);
        });
        io.emit("ride:riders_booked", { bookedRiderIds: allUserIds });
      }

      return res.json({
        message: "Ride confirmed! Both parties agreed.",
        session: session.toObject(),
        booking: payload,
      });
    }

    res.json({
      message: "You confirmed. Waiting for the other person to confirm.",
      session: session.toObject(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Expire session (5 min idle or manual close) ──────────────────────────
exports.expireSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const io = getIo(req);
    const userId = req.user.id;

    const session = await RideSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const requesterId = session.requesterUserId.toString();
    const accepterId = session.accepterUserId.toString();
    if (userId !== requesterId && userId !== accepterId) {
      return res.status(403).json({ error: "Not part of this session" });
    }
    if (session.status !== "accepted" && session.status !== "chatting") {
      return res.json({ message: "Session already closed", session });
    }

    session.status = "expired";
    await session.save();

    const otherUserId = userId === requesterId ? accepterId : requesterId;
    if (io) {
      io.to(`user:${otherUserId}`).emit("ride:session_expired", { sessionId });
    }

    res.json({ message: "Session expired", session: session.toObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Check and expire sessions that are idle > 5 min (call from cron or on send) ─
async function expireIdleSessions(io) {
  const cutoff = new Date(Date.now() - CHAT_IDLE_EXPIRY_MS);
  const idle = await RideSession.find({
    status: { $in: ["accepted", "chatting"] },
    lastMessageAt: { $ne: null, $lt: cutoff },
  });
  for (const session of idle) {
    session.status = "expired";
    await session.save();
    const requesterId = session.requesterUserId.toString();
    const accepterId = session.accepterUserId.toString();
    if (io) {
      io.to(`user:${requesterId}`).emit("ride:session_expired", { sessionId: session._id });
      io.to(`user:${accepterId}`).emit("ride:session_expired", { sessionId: session._id });
    }
  }
}

exports.expireIdleSessions = expireIdleSessions;
exports.CHAT_IDLE_EXPIRY_MS = CHAT_IDLE_EXPIRY_MS;
