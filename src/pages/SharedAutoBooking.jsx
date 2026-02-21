/**
 * SharedRidePage.jsx
 *
 * SYSTEM LOGIC:
 * 1. Reads userLat, userLng, userLocation, nearestStation, nearestStationLat/Lng, distance from localStorage
 *    (set by the metro-finder page before navigating here)
 * 2. On mount → POST /api/shared-ride/request  (broadcasts this user live to everyone via socket)
 * 3. GET /api/shared-ride/nearby → loads all currently waiting riders going to SAME metro within 5km
 * 4. Socket "ride:new_request"   → any new rider appears live on map + list (filtered: same metro, not me)
 * 5. Socket "ride:cancelled"     → removes cancelled rider from map + list
 * 6. Socket "ride:booked"        → if another user booked me, show invite banner at top
 * 7. User taps rider cards to select up to 3 → "Continue" → saves to localStorage → navigate to /shared-ride/booking
 *
 * DIRECTION FILTER (client-side mirror of backend):
 *   Only show riders whose source→metro vector has cosine similarity > 0.5 with my source→metro vector
 *   This ensures you only see riders going the SAME direction, not opposite.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle, Polyline } from "@react-google-maps/api";
import { io } from "socket.io-client";
import RideChatPopup from "../components/RideChatPopup";

/* ─── CONFIG ─────────────────────────────────────────────────────────────── */
const GMAPS_KEY  = import.meta.env.VITE_GOOGLE_MAPS_KEY  || "YOUR_GOOGLE_MAPS_KEY";
const API_BASE   = import.meta.env.VITE_API_BASE         || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL       || "http://localhost:5000";
const LIBS       = ["places", "geometry"];
const MAX_SEL    = 3;

const MAP_STYLES = [
  { elementType:"geometry",              stylers:[{color:"#0d1520"}] },
  { elementType:"labels.text.stroke",   stylers:[{color:"#0d1520"}] },
  { elementType:"labels.text.fill",     stylers:[{color:"#4a5a6e"}] },
  { featureType:"road",            elementType:"geometry",        stylers:[{color:"#16243a"}] },
  { featureType:"road",            elementType:"geometry.stroke", stylers:[{color:"#1c3050"}] },
  { featureType:"road.highway",    elementType:"geometry",        stylers:[{color:"#182d47"}] },
  { featureType:"road.highway",    elementType:"labels.text.fill",stylers:[{color:"#2e4a6a"}] },
  { featureType:"water",           elementType:"geometry",        stylers:[{color:"#060d18"}] },
  { featureType:"poi",             elementType:"geometry",        stylers:[{color:"#0c1a2a"}] },
  { featureType:"transit.station", elementType:"geometry",        stylers:[{color:"#142030"}] },
  { featureType:"administrative",  elementType:"geometry.stroke", stylers:[{color:"#1a2d47"}] },
  { featureType:"administrative.locality", elementType:"labels.text.fill", stylers:[{color:"#3a7ae0"}] },
];

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Direction similarity: are two riders going roughly same way?
// Returns cosine of angle between vectors (source→metro).
// If either party's metro coords are unknown (0,0), skip direction check and allow the rider.
function directionSimilarity(myLat, myLng, myMLat, myMLng, theirLat, theirLng, theirMLat, theirMLng) {
  // If we don't have real metro coords for them, can't compute direction – allow by default
  if (!theirMLat && !theirMLng) return 1;
  if (!myMLat && !myMLng) return 1;
  const ax = myMLng - myLng,       ay = myMLat - myLat;
  const bx = theirMLng - theirLng, by = theirMLat - theirLat;
  const dot = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);
  if (magA === 0 || magB === 0) return 1; // can't compute → allow
  return dot / (magA * magB);
}

function getInitials(name = "") {
  return name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function decodeToken(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; }
}

function fmtRider(r, myLat, myLng) {
  const srcLat = Number(r.sourceLat);
  const srcLng = Number(r.sourceLng);
  // metroLat/Lng may not be returned by all API shapes – fallback to 0 only if truly absent
  const mLat = Number(r.metroLat  || r.metro?.lat  || 0);
  const mLng = Number(r.metroLng  || r.metro?.lng  || 0);
  // distance may be string from MongoDB $geoNear serialization
  const dist = parseFloat(r.distance);
  return {
    id:           r._id || r.id,
    userId:       r.user?._id || r.user?.id || "",
    name:         r.user?.name || "Rider",
    avatar:       r.user?.avatar || null,
    phone:        r.user?.phone  || null,
    lat:          srcLat,
    lng:          srcLng,
    metroName:    r.metroName || "",
    metroLat:     mLat,
    metroLng:     mLng,
    departureTime:r.departureTime,
    // always recalculate if API distance is missing/NaN
    distance:     !isNaN(dist) && dist > 0
                    ? dist
                    : haversine(myLat, myLng, srcLat, srcLng),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function SharedRidePage({ navigate }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GMAPS_KEY, libraries: LIBS });

  /* ── Read localStorage set by metro-finder page ────────────────────────── */
  const myLat     = parseFloat(localStorage.getItem("userLat")            || "0");
  const myLng     = parseFloat(localStorage.getItem("userLng")            || "0");
  const myAddr    = localStorage.getItem("userLocation")                  || "Your Location";
  const metroName = localStorage.getItem("nearestStation")                || "";
  const metroLat  = parseFloat(localStorage.getItem("nearestStationLat")  || "0");
  const metroLng  = parseFloat(localStorage.getItem("nearestStationLng")  || "0");
  const metroDist = parseFloat(localStorage.getItem("distance")           || "0");
  const token     = localStorage.getItem("token")                         || "";
  const myUserId  = useMemo(() => decodeToken(token).id || "", [token]);
  const myCoords  = useMemo(() => ({ lat: myLat, lng: myLng }), [myLat, myLng]);

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [allRiders,   setAllRiders]   = useState([]);
  const [selected,    setSelected]    = useState(new Set());
  const [infoTarget,  setInfoTarget]  = useState(null);
  const [myReqId,     setMyReqId]     = useState("");
  const [notif,       setNotif]       = useState(null);
  const [invite,      setInvite]      = useState(null);
  const [mapReady,    setMapReady]    = useState(false);
  const [pulseRing,   setPulseRing]   = useState(false);
  const [posting,     setPosting]     = useState(false);
  const [fetchDone,   setFetchDone]   = useState(false);
  // "idle" = before user starts search, "searching" = live, "cancelling" = cancel in-flight
  const [searchState, setSearchState] = useState("idle");
  const [sessions, setSessions] = useState([]);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatSessionDetails, setChatSessionDetails] = useState(null);
  const [chatIncomingMessage, setChatIncomingMessage] = useState(null);
  const [chatExpiredSessionId, setChatExpiredSessionId] = useState(null);
  const [chatSessionUpdate, setChatSessionUpdate] = useState(null); // time proposed / final time set (from socket)
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const socketRef   = useRef(null);
  const mapRef      = useRef(null);
  const notifRef    = useRef(null);
  const myReqIdRef  = useRef("");       // mirrors myReqId for unmount cleanup
  const allRidersRef = useRef([]);      // mirrors allRiders for socket closures

  // Keep allRidersRef in sync
  useEffect(() => { allRidersRef.current = allRiders; }, [allRiders]);

  /* ── Direction-filtered riders (same metro + same direction + not me) ───── */
  const riders = useMemo(() => {
    return allRiders.filter(r => {
      if (r.userId === myUserId) return false;
      // Case-insensitive trim comparison so "Rajiv Chowk" vs "rajiv chowk" still matches
      if (r.metroName.trim().toLowerCase() !== metroName.trim().toLowerCase()) return false;
      // Direction check — returns 1 (allow) when metro coords missing
      const sim = directionSimilarity(myLat, myLng, metroLat, metroLng, r.lat, r.lng, r.metroLat, r.metroLng);
      return sim > 0.3; // ~72° tolerance — was 0.45 which was too strict
    }).sort((a, b) => a.distance - b.distance);
  }, [allRiders, myUserId, metroName, myLat, myLng, metroLat, metroLng]);

  const selectedRiders = useMemo(() => riders.filter(r => selected.has(r.id)), [riders, selected]);

  // Session with a given rider (by otherUser id or requesterRequestId when I'm accepter)
  const getSessionForRider = useCallback((rider) => {
    return sessions.find(
      (s) => String(s.otherUser?._id || s.otherUser) === String(rider.userId)
    );
  }, [sessions]);

  /* ── On mount: only cleanup stale request from previous session ─────────── */
  useEffect(() => {
    // If user navigated back, their old request is still "waiting" in DB.
    // Cancel it silently so they start fresh each time.
    if (token && myUserId) {
      fetch(`${API_BASE}/shared-ride/cancel-stale`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // silent — may 404 if nothing to cancel, that's fine
    }
    // Reset state cleanly on every mount (handles back-navigation)
    setAllRiders([]);
    setSelected(new Set());
    setMyReqId("");
    setFetchDone(false);
    setSearchState("idle");

    return () => {
      // On unmount (navigate away): cancel request so it doesn't appear stale to others
      if (myReqIdRef.current) {
        fetch(`${API_BASE}/shared-ride/cancel`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    };
  }, []); // eslint-disable-line

  /* ── Socket ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => console.log("[socket] connected:", socket.id));

    // New request from any user → add to list
    socket.on("ride:new_request", ({ rideRequest }) => {
      const uid = rideRequest.user?._id || rideRequest.user?.id || "";
      if (uid === myUserId) return; // skip own echo
      const formatted = fmtRider(rideRequest, myLat, myLng);
      setAllRiders(prev => {
        const idx = prev.findIndex(r => r.id === formatted.id || r.userId === formatted.userId);
        if (idx !== -1) {
          // Update in place (re-broadcast of an existing request)
          const updated = [...prev];
          updated[idx] = formatted;
          return updated;
        }
        // Truly new rider
        setPulseRing(true);
        setTimeout(() => setPulseRing(false), 800);
        return [...prev, formatted];
      });
    });

    // Request cancelled
    socket.on("ride:request_cancelled", ({ requestId }) => {
      setAllRiders(prev => prev.filter(r => r.id !== requestId));
      setSelected(prev => { const s = new Set(prev); s.delete(requestId); return s; });
    });

    // Global: some riders just got booked — remove them from everyone's list
    socket.on("ride:riders_booked", ({ bookedRiderIds }) => {
      setAllRiders(prev => prev.filter(r => !bookedRiderIds.includes(r.userId)));
      setSelected(prev => {
        const s = new Set(prev);
        prev.forEach(reqId => {
          // find the rider object by request id
          const rider = allRidersRef.current.find(r => r.id === reqId);
          if (rider && bookedRiderIds.includes(rider.userId)) s.delete(reqId);
        });
        return s;
      });
    });

    // Someone accepted my request → refresh sessions so Chat shows for that rider
    socket.on("ride:request_accepted", ({ sessionId: sid }) => {
      if (!sid) return;
      fetch(`${API_BASE}/shared-ride/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => d.sessions && setSessions(d.sessions))
        .catch(() => {});
    });

    socket.on("ride:request_rejected", () => {
      // Optional: show "Your request was declined" for requester
    });

    socket.on("ride:chat_message", (data) => {
      setChatIncomingMessage({ sessionId: data.sessionId, message: data.message });
    });

    socket.on("ride:session_expired", (data) => {
      setChatExpiredSessionId(data.sessionId || null);
    });

    socket.on("ride:time_proposed", (data) => {
      setChatSessionUpdate({
        sessionId: data.sessionId,
        proposedTime: data.proposedTime,
        proposedBy: data.proposedBy,
      });
    });
    socket.on("ride:final_time_proposed", (data) => {
      setChatSessionUpdate({
        sessionId: data.sessionId,
        finalTime: data.finalTime,
        finalTimeProposedBy: data.proposedBy,
        commonSpot: data.commonSpot,
      });
    });
    socket.on("ride:final_time_rejected", (data) => {
      setChatSessionUpdate({
        sessionId: data.sessionId,
        finalTime: null,
        finalTimeProposedBy: null,
      });
    });

    // Ride booked (both users get this when both confirm or when other accepts final time)
    socket.on("ride:booked", (data) => {
      if (data.bookedRiderIds && data.bookedRiderIds.length > 0) {
        setAllRiders(prev => prev.filter(r => !data.bookedRiderIds.includes(r.userId)));
        setSelected(prev => {
          const s = new Set(prev);
          prev.forEach(id => {
            const rider = allRiders.find(r => r.id === id);
            if (rider && data.bookedRiderIds.includes(rider.userId)) s.delete(id);
          });
          return s;
        });
      }
      setInvite(data);
      if (data.bookedBy !== myUserId) {
        toast("🎉 Someone invited you to a shared ride!", "success");
      }
      // Redirect both users to confirmation page when ride is confirmed
      if (data.redirect) {
        localStorage.setItem("inviteBooking", JSON.stringify(data));
        if (navigate) navigate("/shared-ride/booking?mode=invited");
        else window.location.href = "/shared-ride/booking?mode=invited";
      }
    });

    return () => { socket.disconnect(); };
  }, [token, myUserId]); // eslint-disable-line

  /* ── API ─────────────────────────────────────────────────────────────────── */
  async function postMyRequest() {
    setPosting(true);
    try {
      const res = await fetch(`${API_BASE}/shared-ride/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sourceLat:     myLat,
          sourceLng:     myLng,
          sourceAddress: myAddr,
          metroName,
          metroLat,
          metroLng,
          departureTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyReqId(data.rideRequest._id);
        myReqIdRef.current = data.rideRequest._id;
        toast("Your request is live 🟢", "success");
      } else {
        toast(data.error || "Failed to post", "error");
      }
    } catch {
      toast("Connection error", "error");
    } finally {
      setPosting(false);
    }
  }

  async function loadNearby() {
    try {
      const qs = new URLSearchParams({ lat: myLat, lng: myLng, radius: 5, metroName });
      const res = await fetch(`${API_BASE}/shared-ride/nearby?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const incoming = (data.requests || []).map(r => fmtRider(r, myLat, myLng));
        setAllRiders(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const fresh = incoming.filter(r => !existingIds.has(r.id));
          return [...prev, ...fresh];
        });
      }
    } catch (e) {
      console.warn("[loadNearby] failed:", e);
    } finally {
      setFetchDone(true);
    }
  }

  async function loadSessions() {
    try {
      const res = await fetch(`${API_BASE}/shared-ride/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.sessions) setSessions(data.sessions);
    } catch (e) {
      console.warn("[loadSessions] failed:", e);
    }
  }

  async function acceptRequest(riderRequestId) {
    setAcceptingId(riderRequestId);
    try {
      const res = await fetch(`${API_BASE}/shared-ride/accept-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: riderRequestId }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadSessions();
        toast("Request accepted. Open Chat to discuss details.", "success");
        const sid = data.session?._id || data.session?.id;
        setChatSessionId(sid);
        setChatSessionDetails({
          otherUser: data.session?.otherUser,
          commonSpot: data.session?.commonSpot,
          departureTime: data.session?.departureTime,
        });
      } else {
        toast(data.error || "Could not accept", "error");
      }
    } catch (e) {
      toast("Connection error", "error");
    } finally {
      setAcceptingId(null);
    }
  }

  async function rejectRequest(riderRequestId) {
    setRejectingId(riderRequestId);
    try {
      await fetch(`${API_BASE}/shared-ride/reject-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: riderRequestId }),
      });
      toast("Request declined", "info");
    } catch (e) {
      toast("Connection error", "error");
    } finally {
      setRejectingId(null);
    }
  }

  /* ── Selection ───────────────────────────────────────────────────────────── */
  function toggleRider(id) {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else if (s.size < MAX_SEL) {
        s.add(id);
      } else {
        toast(`You can select up to ${MAX_SEL} riders`, "warn");
      }
      return s;
    });
  }

  function proceed() {
    if (selected.size === 0) { toast("Select at least 1 rider first", "warn"); return; }
    localStorage.setItem("selectedRiders", JSON.stringify(selectedRiders));
    localStorage.setItem("myRequestId", myReqId);
    // Don't cancel request here — booking page needs it alive
    if (navigate) navigate("/shared-ride/booking");
    else window.location.href = "/shared-ride/booking";
  }

  /* ── Start Search — user explicitly taps "Search for Riders" ────────────── */
  async function startSearch() {
    if (!myLat || !myLng || !metroName || !token) {
      toast("Location or metro info missing", "error");
      return;
    }
    setSearchState("searching");
    setAllRiders([]);
    setSelected(new Set());
    setFetchDone(false);
    setSessions([]);
    await postMyRequest();
    await loadNearby();
    await loadSessions();
  }

  /* ── Cancel Search — kills live request, clears list ────────────────────── */
  async function cancelSearch() {
    setSearchState("cancelling");
    try {
      await fetch(`${API_BASE}/shared-ride/cancel`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      myReqIdRef.current = "";
      setMyReqId("");
      setAllRiders([]);
      setSelected(new Set());
      setFetchDone(false);
      toast("Search cancelled", "info");
    } catch {
      toast("Failed to cancel", "error");
    } finally {
      setSearchState("idle");
    }
  }

  function acceptInvite() {
    if (!invite) return;
    localStorage.setItem("inviteBooking", JSON.stringify(invite));
    if (navigate) navigate("/shared-ride/booking?mode=invited");
    else window.location.href = "/shared-ride/booking?mode=invited";
  }

  function toast(msg, type = "info") {
    clearTimeout(notifRef.current);
    setNotif({ msg, type });
    notifRef.current = setTimeout(() => setNotif(null), 3500);
  }

  const onMapLoad = useCallback(map => { mapRef.current = map; setMapReady(true); }, []);

  /* ── Render ──────────────────────────────────────────────────────────────── */
  if (!isLoaded) return <MapLoading />;

  return (
    <>
      <style>{STYLES}</style>
      <div className="sr-root">

        {/* ── Toast ── */}
        {notif && (
          <div className={`sr-toast sr-toast--${notif.type}`}>{notif.msg}</div>
        )}

        {/* ── Invite Banner (when another account books you) ── */}
        {invite && (
          <div className="sr-invite">
            <div className="sr-invite__left">
              <span className="sr-invite__emoji">🎉</span>
              <div>
                <div className="sr-invite__title">You've been invited to a shared ride!</div>
                <div className="sr-invite__sub">
                  Meetup: <strong>{invite.commonSpot?.name || "Common point"}</strong>
                  {invite.departureTime
                    ? " · " + new Date(invite.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </div>
              </div>
            </div>
            <div className="sr-invite__actions">
              <button className="sr-invite__view" onClick={acceptInvite}>View →</button>
              <button className="sr-invite__close" onClick={() => setInvite(null)}>✕</button>
            </div>
          </div>
        )}

        {/* ── MAP ─────────────────────────────────────────────────────────── */}
        <div className="sr-map">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={myCoords}
            zoom={15}
            onLoad={onMapLoad}
            options={{
              styles: MAP_STYLES,
              disableDefaultUI: true,
              zoomControl: false,
              clickableIcons: false,
              gestureHandling: "greedy",
            }}
          >
            {mapReady && (
              <>
                {/* My search radius ring */}
                <Circle
                  center={myCoords}
                  radius={3000}
                  options={{
                    fillColor: "#3a7ae0",
                    fillOpacity: pulseRing ? 0.12 : 0.05,
                    strokeColor: "#3a7ae0",
                    strokeOpacity: 0.2,
                    strokeWeight: 1,
                  }}
                />

                {/* My location pin — BLUE */}
                <Marker
                  position={myCoords}
                  zIndex={25}
                  title="You"
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: "#3a7ae0",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3,
                    scale: 13,
                  }}
                  onClick={() => setInfoTarget({ type: "me" })}
                />

                {/* Metro station pin — PURPLE */}
                {metroLat !== 0 && metroLng !== 0 && (
                  <Marker
                    position={{ lat: metroLat, lng: metroLng }}
                    zIndex={15}
                    title={metroName}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: "#a855f7",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2.5,
                      scale: 11,
                    }}
                    onClick={() => setInfoTarget({ type: "metro" })}
                  />
                )}

                {/* My direction line (me → metro) */}
                {metroLat !== 0 && (
                  <Polyline
                    path={[myCoords, { lat: metroLat, lng: metroLng }]}
                    options={{
                      strokeColor: "#3a7ae0",
                      strokeOpacity: 0.18,
                      strokeWeight: 2,
                      geodesic: true,
                    }}
                  />
                )}

                {/* Other riders — ORANGE (unselected) / GREEN (selected) */}
                {riders.map(rider => {
                  const isSel = selected.has(rider.id);
                  return (
                    <Marker
                      key={rider.id}
                      position={{ lat: rider.lat, lng: rider.lng }}
                      zIndex={isSel ? 20 : 12}
                      title={rider.name}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: isSel ? "#00d084" : "#f5a623",
                        fillOpacity: 1,
                        strokeColor: isSel ? "#ffffff" : "rgba(255,255,255,0.55)",
                        strokeWeight: isSel ? 3 : 2,
                        scale: isSel ? 13 : 10,
                      }}
                      onClick={() => setInfoTarget({ type: "rider", ...rider })}
                    />
                  );
                })}

                {/* Green connection lines: selected rider → me */}
                {selectedRiders.map(r => (
                  <Polyline
                    key={`line-${r.id}`}
                    path={[{ lat: r.lat, lng: r.lng }, myCoords]}
                    options={{
                      strokeColor: "#00d084",
                      strokeOpacity: 0.5,
                      strokeWeight: 2.5,
                      geodesic: true,
                    }}
                  />
                ))}

                {/* Map Info Windows */}
                {infoTarget && (
                  <InfoWindow
                    position={
                      infoTarget.type === "rider" ? { lat: infoTarget.lat, lng: infoTarget.lng }
                      : infoTarget.type === "metro" ? { lat: metroLat, lng: metroLng }
                      : myCoords
                    }
                    onCloseClick={() => setInfoTarget(null)}
                  >
                    <div className="sr-iw">
                      {infoTarget.type === "me" && (
                        <>
                          <div className="sr-iw__title">📍 You</div>
                          <div className="sr-iw__body">{myAddr}</div>
                          <div className="sr-iw__tag">→ {metroName} · {metroDist.toFixed(1)} km</div>
                        </>
                      )}
                      {infoTarget.type === "metro" && (
                        <>
                          <div className="sr-iw__title">🚇 {metroName}</div>
                          <div className="sr-iw__tag">Your destination · {metroDist.toFixed(1)} km</div>
                        </>
                      )}
                      {infoTarget.type === "rider" && (
                        <>
                          <div className="sr-iw__title">{infoTarget.name}</div>
                          <div className="sr-iw__body">→ {infoTarget.metroName}</div>
                          <div className="sr-iw__dist">{infoTarget.distance.toFixed(2)} km from you</div>
                          <button
                            className={`sr-iw__btn${selected.has(infoTarget.id) ? " sr-iw__btn--sel" : ""}`}
                            onClick={() => { toggleRider(infoTarget.id); setInfoTarget(null); }}
                          >
                            {selected.has(infoTarget.id) ? "✓ Selected" : "+ Select Rider"}
                          </button>
                        </>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </>
            )}
          </GoogleMap>

          {/* Map overlay — top chips */}
          <div className="sr-map-top">
            <div className="sr-chip">
              {searchState === "searching" && <span className="sr-blink" />}
              {searchState === "idle"
                ? "Tap Search to go live"
                : riders.length > 0
                  ? `${riders.length} rider${riders.length !== 1 ? "s" : ""} nearby`
                  : "Searching nearby…"}
            </div>
            <div className="sr-chip sr-chip--metro">
              🚇 {metroName || "Metro"}
            </div>
          </div>

          {/* Zoom controls */}
          <div className="sr-zoom">
            <button onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || 14) + 1)}>+</button>
            <button onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || 14) - 1)}>−</button>
          </div>
        </div>

        {/* ── BOTTOM SHEET ─────────────────────────────────────────────────── */}
        <div className={`sr-sheet${selected.size > 0 ? " sr-sheet--tall" : ""}`}>
          <div className="sr-sheet__handle" />

          {/* Route summary strip */}
          <div className="sr-route">
            <div className="sr-route__side">
              <div className="sr-route__dot sr-route__dot--blue" />
              <div className="sr-route__text">
                <div className="sr-route__label">Pickup</div>
                <div className="sr-route__place">{myAddr}</div>
              </div>
            </div>
            <div className="sr-route__arrow">→</div>
            <div className="sr-route__side">
              <div className="sr-route__dot sr-route__dot--purple" />
              <div className="sr-route__text">
                <div className="sr-route__label">Metro</div>
                <div className="sr-route__place">{metroName}</div>
              </div>
            </div>
          </div>

          {/* Section label + Cancel button */}
          <div className="sr-section-hd">
            <span>Riders going your way</span>
            {riders.length > 0 && <span className="sr-badge">{riders.length}</span>}
            {searchState === "searching" && (
              <button
                className="sr-cancel-btn"
                onClick={cancelSearch}
                disabled={searchState === "cancelling"}
              >
                {searchState === "cancelling" ? "Cancelling…" : "✕ Cancel"}
              </button>
            )}
          </div>

          {/* IDLE STATE — before user starts search */}
          {searchState === "idle" && (
            <div className="sr-idle">
              <div className="sr-idle__icon">🚇</div>
              <div className="sr-idle__title">Ready to find ride partners?</div>
              <div className="sr-idle__sub">
                You're heading to <strong>{metroName}</strong> from {myAddr}.
                Tap below to go live and find others nearby.
              </div>
              <button className="sr-start-btn" onClick={startSearch}>
                🔍 Search for Riders
              </button>
            </div>
          )}

          {/* SEARCHING — loading or no results yet */}
          {searchState === "searching" && !fetchDone && riders.length === 0 && (
            <div className="sr-empty">
              <div className="sr-empty__icon">⏳</div>
              <div className="sr-empty__title">Broadcasting your request…</div>
              <div className="sr-empty__sub">Finding people heading to {metroName}</div>
            </div>
          )}

          {/* SEARCHING — fetch done, still no riders */}
          {searchState === "searching" && fetchDone && riders.length === 0 && (
            <div className="sr-empty">
              <div className="sr-empty__icon">🔍</div>
              <div className="sr-empty__title">No riders nearby yet</div>
              <div className="sr-empty__sub">
                Your request is live. Others heading to {metroName} will appear here in real‑time.
              </div>
            </div>
          )}

          {/* SEARCHING — riders found: Accept/Reject or Chat per rider */}
          {searchState === "searching" && riders.length > 0 && (
            <div className="sr-list">
              {riders.map((rider, idx) => {
                const sessionWithRider = getSessionForRider(rider);
                const isAccepting = acceptingId === rider.id;
                const isRejecting = rejectingId === rider.id;
                return (
                  <div
                    key={rider.id}
                    className="sr-card sr-card--actions"
                    style={{ animationDelay: `${idx * 45}ms` }}
                  >
                    <div className="sr-avatar">
                      {rider.avatar
                        ? <img src={rider.avatar} alt={rider.name} />
                        : <span>{getInitials(rider.name)}</span>
                      }
                    </div>
                    <div className="sr-card__info">
                      <div className="sr-card__name">{rider.name}</div>
                      <div className="sr-card__meta">
                        <span className="sr-card__dist">📍 {rider.distance.toFixed(1)} km</span>
                        <span className="sr-card__dot-sep" />
                        <span className="sr-card__metro">→ {rider.metroName}</span>
                      </div>
                    </div>
                    <div className="sr-card__actions">
                      {sessionWithRider ? (
                        <button
                          type="button"
                          className="sr-card__chat"
                          onClick={() => {
                            setChatSessionId(sessionWithRider._id);
                            setChatSessionDetails({
                              otherUser: sessionWithRider.otherUser,
                              commonSpot: sessionWithRider.commonSpot,
                              departureTime: sessionWithRider.departureTime,
                            });
                          }}
                        >
                          Chat
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="sr-card__reject"
                            onClick={(e) => { e.stopPropagation(); rejectRequest(rider.id); }}
                            disabled={isRejecting}
                          >
                            {isRejecting ? "…" : "Reject"}
                          </button>
                          <button
                            type="button"
                            className="sr-card__accept"
                            onClick={(e) => { e.stopPropagation(); acceptRequest(rider.id); }}
                            disabled={isAccepting}
                          >
                            {isAccepting ? "…" : "Accept"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legacy footer: only when at least one rider selected (optional multi-rider book flow) */}
          {selected.size > 0 && (
            <div className="sr-footer">
              <div className="sr-footer__group">
                <div className="sr-footer__av sr-footer__av--me">Me</div>
                {selectedRiders.map(r => (
                  <div key={r.id} className="sr-footer__av">
                    {r.avatar ? <img src={r.avatar} alt="" /> : getInitials(r.name)}
                  </div>
                ))}
                <div className="sr-footer__label">
                  {1 + selected.size} people · {metroName}
                </div>
              </div>
              <button className="sr-continue" onClick={proceed}>
                Continue →
              </button>
            </div>
          )}
        </div>

        {/* Chat popup (when a session is open) */}
        {chatSessionId && (() => {
          const openSession = sessions.find((s) => String(s._id) === String(chatSessionId));
          const details = chatSessionDetails || openSession;
          return (
            <RideChatPopup
              sessionId={chatSessionId}
              otherUser={details?.otherUser}
              commonSpot={details?.commonSpot}
              departureTime={details?.departureTime}
              onClose={() => {
                setChatSessionId(null);
                setChatSessionDetails(null);
                setChatIncomingMessage(null);
                setChatExpiredSessionId(null);
              }}
              onNavigateToDetail={(sid) => {
                setChatSessionId(null);
                setChatSessionDetails(null);
                if (navigate) navigate(`/shared-ride/session/${sid}`);
                else window.location.href = `/shared-ride/session/${sid}`;
              }}
              onRideBooked={(booking) => {
                setInvite(booking);
                setChatSessionId(null);
                if (booking) localStorage.setItem("inviteBooking", JSON.stringify(booking));
                toast("Ride confirmed! Check your invite.", "success");
                if (navigate) navigate("/shared-ride/booking?mode=invited");
                else window.location.href = "/shared-ride/booking?mode=invited";
              }}
              token={token}
              incomingMessage={chatIncomingMessage}
              expiredSessionId={chatExpiredSessionId}
              sessionUpdate={chatSessionUpdate}
            />
          );
        })()}
      </div>
    </>
  );
}

/* ─── Loading screen ─────────────────────────────────────────────────────── */
function MapLoading() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", background: "#0d1520",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`@keyframes __s{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        border: "3px solid #1a2d47", borderTop: "3px solid #3a7ae0",
        animation: "__s 0.85s linear infinite",
      }} />
      <p style={{ color: "#3a7ae0", marginTop: 18, fontSize: 13, letterSpacing: "0.3px" }}>
        Loading map…
      </p>
    </div>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

@keyframes spin       { to { transform: rotate(360deg); } }
@keyframes fadeUp     { from { opacity:0; transform:translateY(9px); } to { opacity:1; transform:translateY(0); } }
@keyframes toastSlide { from { opacity:0; transform:translateX(-50%) translateY(-12px) scale(.94); }
                        to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }
@keyframes blink      { 0%,100%{opacity:1;box-shadow:0 0 5px #00d084;} 55%{opacity:.25;box-shadow:none;} }
@keyframes bannerDown { from{opacity:0;transform:translateY(-100%);} to{opacity:1;transform:translateY(0);} }

*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }

/* ROOT */
.sr-root {
  display: flex; flex-direction: column;
  height: 100dvh; width: 100vw;
  background: #0d1520; font-family: 'DM Sans', sans-serif;
  overflow: hidden; position: relative;
}

/* TOAST */
.sr-toast {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  padding: 9px 22px; border-radius: 100px;
  font-size: 13px; font-weight: 500; white-space: nowrap;
  z-index: 9999; animation: toastSlide .3s ease; backdrop-filter: blur(16px);
}
.sr-toast--success { background:rgba(0,208,132,.13); border:1px solid #00d084; color:#00d084; }
.sr-toast--error   { background:rgba(248,81,73,.13);  border:1px solid #f85149; color:#f85149; }
.sr-toast--info    { background:rgba(58,122,224,.13); border:1px solid #3a7ae0; color:#3a7ae0; }
.sr-toast--warn    { background:rgba(245,166,35,.13); border:1px solid #f5a623; color:#f5a623; }

/* INVITE BANNER */
.sr-invite {
  position: fixed; top: 0; left: 0; right: 0; z-index: 8000;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 13px 16px;
  background: linear-gradient(135deg, #0d2418 0%, #0c1f35 100%);
  border-bottom: 1px solid rgba(0,208,132,.28);
  animation: bannerDown .4s cubic-bezier(.4,0,.2,1);
}
.sr-invite__left   { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
.sr-invite__emoji  { font-size:22px; flex-shrink:0; }
.sr-invite__title  { color:#00d084; font-size:13px; font-weight:700; }
.sr-invite__sub    { color:#4a8a68; font-size:11px; margin-top:2px; }
.sr-invite__sub strong { color:#80ffcc; }
.sr-invite__actions{ display:flex; align-items:center; gap:8px; flex-shrink:0; }
.sr-invite__view   { background:#00d084; color:#071a0f; border:none; border-radius:8px;
                     padding:7px 14px; font-size:12px; font-weight:700;
                     cursor:pointer; font-family:'Syne',sans-serif; }
.sr-invite__close  { background:transparent; border:1px solid rgba(255,255,255,.1);
                     border-radius:8px; color:#4a6a58; padding:6px 10px;
                     font-size:14px; cursor:pointer; line-height:1; }

/* MAP AREA */
.sr-map { flex:1; position:relative; min-height:0; }

.sr-map-top {
  position: absolute; top: 14px; left: 0; right: 0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 14px; z-index: 10; pointer-events: none;
}
.sr-chip {
  display: flex; align-items: center; gap: 7px;
  background: rgba(8,13,22,.84); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.07); border-radius: 100px;
  padding: 7px 14px; font-size: 12px; font-weight: 500;
  color: #9eb0c4; pointer-events: auto;
}
.sr-chip--metro { gap: 5px; }
.sr-blink {
  width: 7px; height: 7px; border-radius: 50%;
  background: #00d084; flex-shrink: 0;
  animation: blink 2.2s ease-in-out infinite;
}

.sr-zoom {
  position: absolute; right: 14px; bottom: 18px;
  display: flex; flex-direction: column; gap: 4px; z-index: 10;
}
.sr-zoom button {
  width: 38px; height: 38px;
  background: rgba(8,13,22,.84); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.09); border-radius: 9px;
  color: #9eb0c4; font-size: 20px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif; transition: background .15s;
}
.sr-zoom button:active { background: rgba(58,122,224,.22); }

/* INFO WINDOW (Google Maps injects white bg by default — keep it minimal) */
.sr-iw { font-family:'DM Sans',sans-serif; min-width:155px; padding:2px 0; }
.sr-iw__title { color:#dce8f5; font-weight:700; font-size:14px; margin-bottom:3px; }
.sr-iw__body  { color:#6a7d8f; font-size:12px; margin-bottom:2px; }
.sr-iw__dist  { color:#f5a623; font-size:12px; font-weight:600; margin-bottom:8px; }
.sr-iw__tag   { color:#3a7ae0; font-size:11px; font-weight:600; margin-top:2px; }
.sr-iw__btn {
  width:100%; background:#162035; border:1px solid #3a7ae0;
  border-radius:7px; color:#3a7ae0; font-size:12px; font-weight:600;
  padding:6px 0; cursor:pointer; transition:all .15s;
  font-family:'DM Sans',sans-serif;
}
.sr-iw__btn--sel { background:rgba(0,208,132,.13); border-color:#00d084; color:#00d084; }

/* BOTTOM SHEET */
.sr-sheet {
  background: #0d1520;
  border-top: 1px solid rgba(255,255,255,.055);
  border-radius: 22px 22px 0 0;
  max-height: 52%;
  display: flex; flex-direction: column;
  overflow: hidden;
  transition: max-height .38s cubic-bezier(.4,0,.2,1);
  flex-shrink: 0; z-index: 20;
}
.sr-sheet--tall { max-height: 68%; }
.sr-sheet__handle {
  width: 38px; height: 4px;
  background: rgba(255,255,255,.1); border-radius: 2px;
  margin: 12px auto 0; flex-shrink: 0;
}

/* ROUTE STRIP */
.sr-route {
  display: flex; align-items: center; gap: 8px;
  padding: 13px 20px 12px;
  border-bottom: 1px solid rgba(255,255,255,.05);
  flex-shrink: 0;
}
.sr-route__side  { display:flex; align-items:center; gap:9px; flex:1; min-width:0; }
.sr-route__dot   { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
.sr-route__dot--blue   { background:#3a7ae0; box-shadow:0 0 5px #3a7ae0; }
.sr-route__dot--purple { background:#a855f7; box-shadow:0 0 5px #a855f7; }
.sr-route__text  { min-width:0; }
.sr-route__label { color:#2e4258; font-size:9px; font-weight:700;
                   text-transform:uppercase; letter-spacing:.7px; }
.sr-route__place { color:#aabcce; font-size:13px; font-weight:500;
                   white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sr-route__arrow { color:#1e3050; font-size:13px; flex-shrink:0; }

/* SECTION HEADING */
.sr-section-hd {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px 5px;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .9px;
  color: #2e4258; flex-shrink: 0;
}
.sr-badge {
  background: rgba(58,122,224,.14); color:#3a7ae0;
  border-radius: 100px; padding: 1px 9px;
  font-size: 11px; font-weight: 700;
}

/* EMPTY STATE */
.sr-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 22px 28px;
  text-align: center; gap: 7px;
}
.sr-empty__icon  { font-size: 36px; }
.sr-empty__title { color:#7a8a9a; font-size:14px; font-weight:600; }
.sr-empty__sub   { color:#2e4258; font-size:12px; line-height:1.6; max-width:280px; }

/* RIDERS LIST */
.sr-list {
  flex: 1; overflow-y: auto;
  padding: 5px 14px 14px;
  display: flex; flex-direction: column; gap: 8px;
  scrollbar-width: none;
}
.sr-list::-webkit-scrollbar { display:none; }

/* RIDER CARD */
.sr-card {
  display: flex; align-items: center; gap: 12px;
  background: #101c2e; border: 1px solid rgba(255,255,255,.05);
  border-radius: 14px; padding: 12px 14px;
  cursor: pointer; user-select: none;
  transition: border-color .2s, background .2s, transform .12s;
  animation: fadeUp .3s ease both;
}
.sr-card:active  { transform: scale(.983); }
.sr-card--sel    { background: rgba(0,208,132,.07); border-color: rgba(0,208,132,.38); }

/* AVATAR */
.sr-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: #162030; border: 2px solid rgba(58,122,224,.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; color: #3a7ae0;
  font-family: 'Syne', sans-serif; flex-shrink: 0; overflow: hidden;
}
.sr-avatar img  { width:100%; height:100%; object-fit:cover; }
.sr-avatar--sel { border-color:#00d084; color:#00d084; background:rgba(0,208,132,.1); }

/* CARD INFO */
.sr-card__info  { flex:1; min-width:0; }
.sr-card__name  { color:#cdd8e8; font-size:14px; font-weight:600; }
.sr-card__meta  { display:flex; align-items:center; gap:6px; margin-top:3px; }
.sr-card__dist  { color:#f5a623; font-size:12px; font-weight:500; }
.sr-card__dot-sep { width:3px; height:3px; border-radius:50%; background:#1e3050; flex-shrink:0; }
.sr-card__metro { color:#4a5a6e; font-size:12px;
                  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* SELECT TICK */
.sr-tick {
  width: 28px; height: 28px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #2e4258; flex-shrink: 0;
  transition: all .18s;
}
.sr-tick--on { background:#00d084; border-color:#00d084; color:#fff; font-weight:700; }

/* CARD ACTIONS (Accept/Reject or Chat) */
.sr-card--actions { cursor: default; }
.sr-card--actions .sr-card__info { flex: 1; min-width: 0; }
.sr-card__actions {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.sr-card__accept {
  background: #00d084; color: #071a0f; border: none;
  border-radius: 10px; padding: 8px 14px;
  font-size: 12px; font-weight: 700; cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}
.sr-card__accept:disabled { opacity: .7; cursor: not-allowed; }
.sr-card__reject {
  background: rgba(248,81,73,.15); color: #f85149; border: 1px solid rgba(248,81,73,.35);
  border-radius: 10px; padding: 8px 14px;
  font-size: 12px; font-weight: 700; cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}
.sr-card__reject:disabled { opacity: .7; cursor: not-allowed; }
.sr-card__chat {
  background: #3a7ae0; color: #fff; border: none;
  border-radius: 10px; padding: 8px 16px;
  font-size: 12px; font-weight: 700; cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}

/* FOOTER */
.sr-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px 16px;
  border-top: 1px solid rgba(255,255,255,.055);
  background: #0d1520; flex-shrink: 0;
  animation: fadeUp .22s ease;
}
.sr-footer__group {
  display: flex; align-items: center; gap: 0; flex-wrap: nowrap; min-width: 0;
}
.sr-footer__av {
  width: 32px; height: 32px; border-radius: 50%;
  background: #162030; border: 2.5px solid #0d1520;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #3a7ae0;
  margin-left: -8px; overflow: hidden; flex-shrink: 0;
  font-family: 'Syne', sans-serif;
}
.sr-footer__av:first-child { margin-left: 0; }
.sr-footer__av img { width:100%; height:100%; object-fit:cover; }
.sr-footer__av--me { background:rgba(58,122,224,.18); }
.sr-footer__label  { color:#7a8a9a; font-size:12px; font-weight:500;
                     margin-left:10px; white-space:nowrap; flex-shrink:0; }

/* CONTINUE BUTTON */
.sr-continue {
  background: #3a7ae0; color: #fff; border: none;
  border-radius: 12px; padding: 12px 22px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  font-family: 'Syne', sans-serif; flex-shrink: 0;
  transition: background .18s, transform .12s;
}
.sr-continue:active { transform: scale(.96); }

/* IDLE STATE */
.sr-idle {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 20px 28px 10px;
  text-align: center; gap: 10px;
}
.sr-idle__icon  { font-size: 38px; }
.sr-idle__title { color:#b8c8d8; font-size:15px; font-weight:700; font-family:'Syne',sans-serif; }
.sr-idle__sub   { color:#2e4258; font-size:12px; line-height:1.6; max-width:280px; }
.sr-idle__sub strong { color:#7a9abf; }

/* START SEARCH BUTTON */
.sr-start-btn {
  margin-top: 4px;
  background: linear-gradient(135deg, #3a7ae0 0%, #6366f1 100%);
  color: #fff; border: none; border-radius: 14px;
  padding: 13px 32px; font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: 'Syne', sans-serif;
  letter-spacing: 0.3px;
  transition: opacity .18s, transform .12s;
  box-shadow: 0 4px 20px rgba(58,122,224,.35);
}
.sr-start-btn:active { transform: scale(.97); opacity:.88; }

/* CANCEL SEARCH BUTTON (inline in section heading) */
.sr-cancel-btn {
  margin-left: auto;
  background: rgba(248,81,73,.12); border: 1px solid rgba(248,81,73,.3);
  border-radius: 8px; color: #f85149; font-size: 11px; font-weight: 700;
  padding: 4px 10px; cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: background .15s;
  white-space: nowrap; flex-shrink: 0;
}
.sr-cancel-btn:hover   { background: rgba(248,81,73,.2); }
.sr-cancel-btn:disabled{ opacity: .5; cursor: not-allowed; }
`;