/**
 * RideBookingPage.jsx
 *
 * SYSTEM LOGIC:
 * Mode A — BOOKER (normal flow, came from SharedRidePage):
 *   Reads selectedRiders + myRequestId from localStorage.
 *   Computes centroid → hits /api/shared-ride/geocode → gets common spot name.
 *   User picks departure time (quick chips or custom) + how many seats they need.
 *   Confirm → POST /api/shared-ride/book → socket emits "ride:booked" to all matched users.
 *   → Success screen with group + map direction button.
 *
 * Mode B — INVITED (?mode=invited, came from invite banner on SharedRidePage):
 *   Reads inviteBooking from localStorage (set when socket pushed "ride:booked" to this user).
 *   Shows read-only view: map with common spot + your pin + polyline, time, metro.
 *   No form. Just "Get Directions" and "Done".
 *
 * Socket while on this page:
 *   "ride:booked" from OTHER account → top alert bar: "Your ride was confirmed! View →"
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  GoogleMap, useJsApiLoader,
  Marker, InfoWindow, Polyline, Circle,
} from "@react-google-maps/api";
import { io } from "socket.io-client";

/* ─── CONFIG ─────────────────────────────────────────────────────────────── */
const GMAPS_KEY  = import.meta.env.VITE_GOOGLE_MAPS_KEY  || "YOUR_GOOGLE_MAPS_KEY";
const API_BASE   = import.meta.env.VITE_API_BASE         || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL       || "http://localhost:5000";
const LIBS       = ["places"];

const MAP_STYLES = [
  { elementType:"geometry",              stylers:[{color:"#0d1520"}] },
  { elementType:"labels.text.stroke",   stylers:[{color:"#0d1520"}] },
  { elementType:"labels.text.fill",     stylers:[{color:"#4a5a6e"}] },
  { featureType:"road",            elementType:"geometry",        stylers:[{color:"#16243a"}] },
  { featureType:"road",            elementType:"geometry.stroke", stylers:[{color:"#1c3050"}] },
  { featureType:"road.highway",    elementType:"geometry",        stylers:[{color:"#182d47"}] },
  { featureType:"water",           elementType:"geometry",        stylers:[{color:"#060d18"}] },
  { featureType:"poi",             elementType:"geometry",        stylers:[{color:"#0c1a2a"}] },
  { featureType:"transit.station", elementType:"geometry",        stylers:[{color:"#142030"}] },
];

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function getInitials(name = "") {
  return name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function centroid(points) {
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

function decodeToken(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; }
}

// Build time-slot options: every 15 min for next 2 hours
function buildSlots() {
  const slots = [];
  const now = new Date();
  for (let i = 1; i <= 8; i++) {
    const t = new Date(now.getTime() + i * 15 * 60 * 1000);
    slots.push({
      value: t.toISOString(),
      time:  t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      label: i === 1 ? "Now" : `+${i * 15}m`,
    });
  }
  return slots;
}

function openGoogleMaps(lat, lng) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function RideBookingPage({ navigate }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GMAPS_KEY, libraries: LIBS });

  /* ── Detect mode ─────────────────────────────────────────────────────────── */
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const isInvited    = searchParams.get("mode") === "invited";

  /* ── localStorage ────────────────────────────────────────────────────────── */
  const myLat     = parseFloat(localStorage.getItem("userLat")            || "0");
  const myLng     = parseFloat(localStorage.getItem("userLng")            || "0");
  const myAddr    = localStorage.getItem("userLocation")                  || "Your Location";
  const metroName = localStorage.getItem("nearestStation")                || "";
  const metroLat  = parseFloat(localStorage.getItem("nearestStationLat")  || "0");
  const metroLng  = parseFloat(localStorage.getItem("nearestStationLng")  || "0");
  const myReqId   = localStorage.getItem("myRequestId")                   || "";
  const token     = localStorage.getItem("token")                         || "";

  const selectedRiders = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("selectedRiders") || "[]"); } catch { return []; }
  }, []);

  const inviteData = useMemo(() => {
    if (!isInvited) return null;
    try { return JSON.parse(localStorage.getItem("inviteBooking") || "null"); } catch { return null; }
  }, [isInvited]);

  const myUserId = useMemo(() => decodeToken(token).id || "", [token]);
  const myCoords = useMemo(() => ({ lat: myLat, lng: myLng }), [myLat, myLng]);
  const slots    = useMemo(buildSlots, []);

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [screen,      setScreen]      = useState("form"); // form | loading | success
  const [seats,       setSeats]       = useState(1);
  const [selSlot,     setSelSlot]     = useState(slots[1].value);
  const [customTime,  setCustomTime]  = useState("");
  const [useCustom,   setUseCustom]   = useState(false);
  const [commonSpot,  setCommonSpot]  = useState(null);
  const [spotLoading, setSpotLoading] = useState(!isInvited);
  const [booking,     setBooking]     = useState(null);
  const [infoTarget,  setInfoTarget]  = useState(null);
  const [mapReady,    setMapReady]    = useState(false);
  const [notif,       setNotif]       = useState(null);
  const [remoteAlert, setRemoteAlert] = useState(null); // another account confirmed
  const [submitting,  setSubmitting]  = useState(false);

  const mapRef    = useRef(null);
  const notifTRef = useRef(null);

  /* ── Socket: listen for "ride:booked" from other accounts ──────────────── */
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });

    socket.on("ride:booked", (data) => {
      if (data.bookedBy === myUserId) return; // I did this
      setRemoteAlert(data);
    });

    return () => socket.disconnect();
  }, [token, myUserId]);

  /* ── Fetch common spot (only in booker mode) ────────────────────────────── */
  useEffect(() => {
    if (isInvited) {
      if (inviteData?.commonSpot) setCommonSpot(inviteData.commonSpot);
      return;
    }
    if (!myLat || !myLng) return;
    fetchSpot();
  }, []); // eslint-disable-line

  async function fetchSpot() {
    setSpotLoading(true);
    const allPts = [{ lat: myLat, lng: myLng }, ...selectedRiders.map(r => ({ lat: r.lat, lng: r.lng }))];
    const c = centroid(allPts);
    try {
      const res = await fetch(`${API_BASE}/shared-ride/geocode?lat=${c.lat}&lng=${c.lng}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCommonSpot(res.ok && data.commonSpot
        ? data.commonSpot
        : { lat: c.lat, lng: c.lng, name: "Meetup Point", address: `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` });
    } catch {
      const c2 = centroid([{ lat: myLat, lng: myLng }, ...selectedRiders.map(r => ({ lat: r.lat, lng: r.lng }))]);
      setCommonSpot({ lat: c2.lat, lng: c2.lng, name: "Meetup Point", address: "Calculated meeting point" });
    } finally {
      setSpotLoading(false);
    }
  }

  /* ── Confirm booking ─────────────────────────────────────────────────────── */
  async function confirmBooking() {
    const finalTime = useCustom ? customTime : selSlot;
    if (!finalTime) { toast("Please select a departure time", "warn"); return; }
    if (!commonSpot) { toast("Common spot is still loading", "warn"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/shared-ride/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          myRequestId:      myReqId,
          selectedRiderIds: selectedRiders.map(r => r.userId || r.id),
          departureTime:    finalTime,
          seats,
          commonSpot,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const bk = {
          ...data.booking,
          commonSpot,
          selectedRiders,
          seats,
          departureTime: finalTime,
          metro: metroName,
        };
        localStorage.setItem("lastBooking", JSON.stringify(bk));
        setBooking(bk);
        setScreen("success");
      } else {
        toast(data.error || "Booking failed. Try again.", "error");
        setSubmitting(false);
      }
    } catch {
      toast("Network error. Please retry.", "error");
      setSubmitting(false);
    }
  }

  function toast(msg, type = "info") {
    clearTimeout(notifTRef.current);
    setNotif({ msg, type });
    notifTRef.current = setTimeout(() => setNotif(null), 3500);
  }

  const onMapLoad = useCallback(map => { mapRef.current = map; setMapReady(true); }, []);

  const finalTime    = useCustom ? customTime : selSlot;
  const spotCenter   = commonSpot ? { lat: commonSpot.lat, lng: commonSpot.lng } : myCoords;
  const totalInGroup = 1 + selectedRiders.length;

  /* ══════════════════════════════════════════════════════════════
     SCREEN: INVITED (read-only, shown to rider booked by someone)
     ══════════════════════════════════════════════════════════════ */
  if (isInvited && inviteData) {
    const spot = inviteData.commonSpot;
    const time = inviteData.departureTime
      ? new Date(inviteData.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--";
    const spotPos = spot ? { lat: spot.lat, lng: spot.lng } : myCoords;

    if (!isLoaded) return <SpinScreen />;

    return (
      <>
        <style>{STYLES}</style>
        <div className="rb-invited-root">
          {/* Map */}
          <div className="rb-invited-map">
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={spotPos}
              zoom={15}
              onLoad={onMapLoad}
              options={{ styles: MAP_STYLES, disableDefaultUI: true, zoomControl: false, clickableIcons: false }}
            >
              {mapReady && (
                <>
                  {spot && (
                    <>
                      <Circle
                        center={spotPos}
                        radius={100}
                        options={{ fillColor: "#00d084", fillOpacity: 0.13,
                                   strokeColor: "#00d084", strokeOpacity: 0.3, strokeWeight: 1 }}
                      />
                      <Marker
                        position={spotPos}
                        zIndex={20}
                        icon={{ path: window.google.maps.SymbolPath.CIRCLE,
                                fillColor: "#00d084", fillOpacity: 1,
                                strokeColor: "#fff", strokeWeight: 3, scale: 14 }}
                        onClick={() => setInfoTarget({ type: "spot" })}
                      />
                    </>
                  )}
                  <Marker
                    position={myCoords}
                    zIndex={10}
                    icon={{ path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: "#3a7ae0", fillOpacity: 1,
                            strokeColor: "#fff", strokeWeight: 3, scale: 11 }}
                    onClick={() => setInfoTarget({ type: "me" })}
                  />
                  {spot && (
                    <Polyline
                      path={[myCoords, spotPos]}
                      options={{ strokeColor: "#3a7ae0", strokeOpacity: 0.5, strokeWeight: 2, geodesic: true }}
                    />
                  )}
                  {infoTarget && (
                    <InfoWindow
                      position={infoTarget.type === "spot" ? spotPos : myCoords}
                      onCloseClick={() => setInfoTarget(null)}
                    >
                      <div className="rb-iw">
                        {infoTarget.type === "spot"
                          ? <><div className="rb-iw__title">📍 {spot?.name}</div><div className="rb-iw__body">{spot?.address}</div></>
                          : <><div className="rb-iw__title">📍 You</div><div className="rb-iw__body">{myAddr}</div></>
                        }
                      </div>
                    </InfoWindow>
                  )}
                </>
              )}
            </GoogleMap>
          </div>

          {/* Info card */}
          <div className="rb-invited-card">
            <div className="rb-invited-badge">🎉 You've been added to a shared ride</div>

            {spot && (
              <div className="rb-invited-spot">
                <div className="rb-invited-spot__icon">📍</div>
                <div>
                  <div className="rb-invited-spot__name">{spot.name}</div>
                  <div className="rb-invited-spot__addr">{spot.address}</div>
                </div>
              </div>
            )}

            <div className="rb-invited-meta">
              <div className="rb-invited-meta__row"><span>🕐</span><span>Departs at <strong>{time}</strong></span></div>
              <div className="rb-invited-meta__row"><span>🚇</span><span>{metroName}</span></div>
            </div>

            {spot && (
              <button className="rb-invited-nav" onClick={() => openGoogleMaps(spot.lat, spot.lng)}>
                Open in Google Maps →
              </button>
            )}
            <button className="rb-invited-done"
              onClick={() => { if (navigate) navigate("/shared-ride"); else window.location.href = "/shared-ride"; }}>
              Done
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ══════════════════════════════════════════════════════════
     SCREEN: SUCCESS
     ══════════════════════════════════════════════════════════ */
  if (screen === "success" && booking) {
    const spot = booking.commonSpot;
    const time = new Date(booking.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return (
      <>
        <style>{STYLES}</style>
        <div className="rb-success-root">
          <div className="rb-success-card">
            <div className="rb-success-card__confetti">🎉</div>
            <h2 className="rb-success-card__title">Ride Confirmed!</h2>
            <p className="rb-success-card__sub">
              Your shared ride is booked. All riders have been notified.
            </p>

            {/* Common spot */}
            {spot && (
              <div className="rb-success-spot">
                <span className="rb-success-spot__icon">📍</span>
                <div>
                  <div className="rb-success-spot__name">{spot.name}</div>
                  <div className="rb-success-spot__addr">{spot.address}</div>
                </div>
              </div>
            )}

            {/* Group avatars */}
            <div className="rb-success-group">
              <div className="rb-success-group__label">Your ride group</div>
              <div className="rb-success-group__avs">
                <div className="rb-success-av rb-success-av--me">
                  <span>Me</span>
                  <div className="rb-success-av__name">You</div>
                </div>
                {(booking.selectedRiders || []).map((r, i) => (
                  <div key={r.id || i} className="rb-success-av">
                    <div className="rb-success-av__circle">
                      {r.avatar ? <img src={r.avatar} alt="" /> : getInitials(r.name)}
                    </div>
                    <div className="rb-success-av__name">{(r.name || "Rider").split(" ")[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="rb-success-details">
              <div className="rb-success-detail"><span>🕐</span><span>Departs <strong>{time}</strong></span></div>
              <div className="rb-success-detail"><span>🪑</span><span>{booking.seats} seat{booking.seats > 1 ? "s" : ""} reserved</span></div>
              <div className="rb-success-detail"><span>👥</span><span>{booking.totalRiders || totalInGroup} riders total</span></div>
              <div className="rb-success-detail"><span>🚇</span><span>{booking.metro}</span></div>
            </div>

            {spot && (
              <button className="rb-success-nav" onClick={() => openGoogleMaps(spot.lat, spot.lng)}>
                Open in Google Maps →
              </button>
            )}
            <button className="rb-success-done"
              onClick={() => { if (navigate) navigate("/shared-ride"); else window.location.href = "/shared-ride"; }}>
              Done
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ══════════════════════════════════════════════════════════
     SCREEN: MAIN BOOKING FORM
     ══════════════════════════════════════════════════════════ */
  if (!isLoaded) return <SpinScreen />;

  return (
    <>
      <style>{STYLES}</style>
      <div className="rb-root">

        {/* Toast */}
        {notif && (
          <div className={`rb-toast rb-toast--${notif.type}`}>{notif.msg}</div>
        )}

        {/* Remote alert — another account confirmed booking with you */}
        {remoteAlert && (
          <div className="rb-remote-alert">
            <span className="rb-remote-alert__icon">📲</span>
            <div className="rb-remote-alert__text">
              <div className="rb-remote-alert__title">Your ride was confirmed by the group!</div>
              <div className="rb-remote-alert__sub">Meetup at {remoteAlert.commonSpot?.name || "common spot"}</div>
            </div>
            <button className="rb-remote-alert__btn"
              onClick={() => {
                localStorage.setItem("inviteBooking", JSON.stringify(remoteAlert));
                if (navigate) navigate("/shared-ride/booking?mode=invited");
                else window.location.search = "?mode=invited";
              }}>
              View
            </button>
            <button className="rb-remote-alert__close" onClick={() => setRemoteAlert(null)}>✕</button>
          </div>
        )}

        {/* Back button */}
        <button className="rb-back"
          onClick={() => { if (navigate) navigate(-1); else window.history.back(); }}>
          ← Back
        </button>

        {/* ── MAP (top 42%) ──────────────────────────────────────────────── */}
        <div className="rb-map">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={spotCenter}
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
                {/* My pin — blue */}
                <Marker
                  position={myCoords}
                  zIndex={10}
                  title="You"
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: "#3a7ae0", fillOpacity: 1,
                    strokeColor: "#fff", strokeWeight: 3, scale: 11,
                  }}
                  onClick={() => setInfoTarget({ type: "me" })}
                />

                {/* Selected riders — orange */}
                {selectedRiders.map((r, i) => (
                  <Marker
                    key={r.id || i}
                    position={{ lat: r.lat, lng: r.lng }}
                    zIndex={10}
                    title={r.name}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: "#f5a623", fillOpacity: 1,
                      strokeColor: "#fff", strokeWeight: 2.5, scale: 10,
                    }}
                    onClick={() => setInfoTarget({ type: "rider", ...r })}
                  />
                ))}

                {/* Common spot — green */}
                {commonSpot && (
                  <>
                    <Circle
                      center={{ lat: commonSpot.lat, lng: commonSpot.lng }}
                      radius={90}
                      options={{
                        fillColor: "#00d084", fillOpacity: 0.12,
                        strokeColor: "#00d084", strokeOpacity: 0.3, strokeWeight: 1,
                      }}
                    />
                    <Marker
                      position={{ lat: commonSpot.lat, lng: commonSpot.lng }}
                      zIndex={20}
                      title="Meetup Point"
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: "#00d084", fillOpacity: 1,
                        strokeColor: "#fff", strokeWeight: 3, scale: 14,
                      }}
                      onClick={() => setInfoTarget({ type: "spot" })}
                    />
                    {/* Lines: each person → common spot */}
                    <Polyline
                      path={[myCoords, { lat: commonSpot.lat, lng: commonSpot.lng }]}
                      options={{ strokeColor: "#3a7ae0", strokeOpacity: 0.5, strokeWeight: 2, geodesic: true }}
                    />
                    {selectedRiders.map((r, i) => (
                      <Polyline
                        key={`ln-${r.id || i}`}
                        path={[{ lat: r.lat, lng: r.lng }, { lat: commonSpot.lat, lng: commonSpot.lng }]}
                        options={{ strokeColor: "#f5a623", strokeOpacity: 0.45, strokeWeight: 2, geodesic: true }}
                      />
                    ))}
                  </>
                )}

                {/* Metro — purple */}
                {metroLat !== 0 && metroLng !== 0 && (
                  <Marker
                    position={{ lat: metroLat, lng: metroLng }}
                    zIndex={8}
                    title={metroName}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: "#a855f7", fillOpacity: 1,
                      strokeColor: "#fff", strokeWeight: 2.5, scale: 10,
                    }}
                    onClick={() => setInfoTarget({ type: "metro" })}
                  />
                )}

                {/* Info window */}
                {infoTarget && (
                  <InfoWindow
                    position={
                      infoTarget.type === "spot"   ? { lat: commonSpot.lat, lng: commonSpot.lng }
                      : infoTarget.type === "rider"  ? { lat: infoTarget.lat, lng: infoTarget.lng }
                      : infoTarget.type === "metro"  ? { lat: metroLat, lng: metroLng }
                      : myCoords
                    }
                    onCloseClick={() => setInfoTarget(null)}
                  >
                    <div className="rb-iw">
                      {infoTarget.type === "spot" && (
                        <><div className="rb-iw__title">📍 Common Pickup</div>
                          <div className="rb-iw__name">{commonSpot?.name}</div>
                          <div className="rb-iw__body">{commonSpot?.address}</div></>
                      )}
                      {infoTarget.type === "rider" && (
                        <><div className="rb-iw__name">{infoTarget.name}</div>
                          <div className="rb-iw__body">{infoTarget.distance?.toFixed(1)} km from you</div></>
                      )}
                      {infoTarget.type === "me" && (
                        <><div className="rb-iw__name">📍 You</div>
                          <div className="rb-iw__body">{myAddr}</div></>
                      )}
                      {infoTarget.type === "metro" && (
                        <><div className="rb-iw__name">🚇 {metroName}</div>
                          <div className="rb-iw__body">Destination</div></>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </>
            )}
          </GoogleMap>

          {/* Map legend */}
          <div className="rb-legend">
            {[["#3a7ae0","You"], ["#f5a623","Riders"], ["#00d084","Meetup"], ["#a855f7","Metro"]].map(([c, l]) => (
              <div key={l} className="rb-legend-item">
                <span className="rb-legend-dot" style={{ background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* ── BOOKING PANEL ─────────────────────────────────────────────── */}
        <div className="rb-panel">
          <div className="rb-panel__handle" />

          {/* Common Spot Card */}
          <div className="rb-spot-card">
            <div className="rb-spot-card__pulse" />
            <div className="rb-spot-card__body">
              <div className="rb-spot-card__label">Common Pickup Point</div>
              {spotLoading ? (
                <div className="rb-spot-card__loading">
                  <div className="rb-mini-spin" />
                  <span>Calculating best meetup spot…</span>
                </div>
              ) : (
                <>
                  <div className="rb-spot-card__name">{commonSpot?.name || "—"}</div>
                  <div className="rb-spot-card__addr">{commonSpot?.address || ""}</div>
                </>
              )}
            </div>
            {commonSpot && !spotLoading && (
              <button className="rb-spot-card__nav"
                onClick={() => openGoogleMaps(commonSpot.lat, commonSpot.lng)}>
                Nav
              </button>
            )}
          </div>

          {/* Group bubbles row */}
          <div className="rb-group-row">
            {/* Me */}
            <div className="rb-group-bubble rb-group-bubble--me">
              <div className="rb-group-bubble__av">Me</div>
              <div className="rb-group-bubble__name">You</div>
            </div>
            {selectedRiders.map((r, i) => (
              <div key={r.id || i} className="rb-group-bubble">
                <div className="rb-group-bubble__av">
                  {r.avatar ? <img src={r.avatar} alt="" /> : getInitials(r.name)}
                </div>
                <div className="rb-group-bubble__name">{(r.name || "Rider").split(" ")[0]}</div>
                <div className="rb-group-bubble__dist">{r.distance?.toFixed(1)}km</div>
              </div>
            ))}
          </div>

          {/* ── DEPARTURE TIME ──────────────────────────────────────────── */}
          <div className="rb-section">
            <div className="rb-section__label">Departure Time</div>
            <div className="rb-chips-row">
              {slots.map(slot => (
                <button
                  key={slot.value}
                  className={`rb-time-chip${!useCustom && selSlot === slot.value ? " rb-time-chip--on" : ""}`}
                  onClick={() => { setSelSlot(slot.value); setUseCustom(false); }}
                >
                  <span className="rb-time-chip__t">{slot.time}</span>
                  <span className="rb-time-chip__l">{slot.label}</span>
                </button>
              ))}
              <button
                className={`rb-time-chip rb-time-chip--custom${useCustom ? " rb-time-chip--on" : ""}`}
                onClick={() => setUseCustom(true)}
              >
                <span className="rb-time-chip__t">Custom</span>
                <span className="rb-time-chip__l">pick</span>
              </button>
            </div>
            {useCustom && (
              <input
                type="datetime-local"
                className="rb-dt-input"
                min={new Date().toISOString().slice(0, 16)}
                value={customTime}
                onChange={e => setCustomTime(e.target.value)}
              />
            )}
          </div>

          {/* ── SEATS ───────────────────────────────────────────────────── */}
          <div className="rb-section">
            <div className="rb-section__label">Your Seats Needed</div>
            <div className="rb-seats-row">
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  className={`rb-seat-btn${seats === n ? " rb-seat-btn--on" : ""}`}
                  onClick={() => setSeats(n)}
                >
                  <span className="rb-seat-btn__icon">🪑</span>
                  <span className="rb-seat-btn__n">{n}</span>
                </button>
              ))}
            </div>
            <div className="rb-seats-hint">{totalInGroup} people total in group</div>
          </div>

          {/* ── SUMMARY BAR ─────────────────────────────────────────────── */}
          <div className="rb-summary">
            <div className="rb-summary__cell">
              <div className="rb-summary__val">{totalInGroup}</div>
              <div className="rb-summary__key">Riders</div>
            </div>
            <div className="rb-summary__sep" />
            <div className="rb-summary__cell">
              <div className="rb-summary__val">{seats}</div>
              <div className="rb-summary__key">My Seats</div>
            </div>
            <div className="rb-summary__sep" />
            <div className="rb-summary__cell">
              <div className="rb-summary__val rb-summary__val--sm">
                {finalTime ? new Date(finalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
              </div>
              <div className="rb-summary__key">Departs</div>
            </div>
            <div className="rb-summary__sep" />
            <div className="rb-summary__cell">
              <div className="rb-summary__val rb-summary__val--xs">{metroName || "—"}</div>
              <div className="rb-summary__key">Metro</div>
            </div>
          </div>

          {/* ── CONFIRM BUTTON ──────────────────────────────────────────── */}
          <button
            className={`rb-confirm${submitting ? " rb-confirm--busy" : ""}`}
            disabled={submitting || spotLoading || !finalTime}
            onClick={confirmBooking}
          >
            {submitting ? (
              <><div className="rb-btn-spin" /> Confirming…</>
            ) : (
              "Confirm Shared Ride"
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Small screens loading ──────────────────────────────────────────────── */
function SpinScreen() {
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
      <p style={{ color: "#3a7ae0", marginTop: 18, fontSize: 13, letterSpacing: ".3px" }}>Loading…</p>
    </div>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

@keyframes spin       { to { transform: rotate(360deg); } }
@keyframes fadeUp     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes toastSlide { from{opacity:0;transform:translateX(-50%) translateY(-12px) scale(.94)}
                        to  {opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
@keyframes pulseDot   { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.22);opacity:1} }
@keyframes alertDown  { from{opacity:0;transform:translateY(-100%)} to{opacity:1;transform:translateY(0)} }
@keyframes glowBtn    { 0%,100%{box-shadow:0 0 0 0 rgba(58,122,224,.35)} 60%{box-shadow:0 0 0 10px rgba(58,122,224,0)} }

*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }

/* ── ROOT ── */
.rb-root {
  display: flex; flex-direction: column;
  height: 100dvh; width: 100vw;
  background: #0d1520; font-family: 'DM Sans', sans-serif;
  overflow: hidden; position: relative;
}

/* ── TOAST ── */
.rb-toast {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  padding: 9px 22px; border-radius: 100px;
  font-size: 13px; font-weight: 500; white-space: nowrap;
  z-index: 9999; animation: toastSlide .3s ease; backdrop-filter: blur(16px);
}
.rb-toast--success { background:rgba(0,208,132,.13); border:1px solid #00d084; color:#00d084; }
.rb-toast--error   { background:rgba(248,81,73,.13);  border:1px solid #f85149; color:#f85149; }
.rb-toast--info    { background:rgba(58,122,224,.13); border:1px solid #3a7ae0; color:#3a7ae0; }
.rb-toast--warn    { background:rgba(245,166,35,.13); border:1px solid #f5a623; color:#f5a623; }

/* ── REMOTE ALERT (cross-account "your ride was confirmed") ── */
.rb-remote-alert {
  position: fixed; top: 0; left: 0; right: 0; z-index: 8000;
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  background: linear-gradient(135deg, #0d2418 0%, #0c1f35 100%);
  border-bottom: 1px solid rgba(0,208,132,.25);
  animation: alertDown .38s cubic-bezier(.4,0,.2,1);
}
.rb-remote-alert__icon  { font-size: 22px; flex-shrink: 0; }
.rb-remote-alert__text  { flex: 1; min-width: 0; }
.rb-remote-alert__title { color:#00d084; font-size:13px; font-weight:700; }
.rb-remote-alert__sub   { color:#3a6a50; font-size:11px; margin-top:1px; }
.rb-remote-alert__btn   {
  background: #00d084; color: #071a0f; border: none; border-radius: 8px;
  padding: 7px 13px; font-size: 12px; font-weight: 700;
  cursor: pointer; flex-shrink: 0; font-family: 'Syne', sans-serif;
}
.rb-remote-alert__close {
  background: transparent; border: 1px solid rgba(255,255,255,.09);
  border-radius: 8px; color: #3a5a4a; padding: 6px 10px;
  font-size: 14px; cursor: pointer; flex-shrink: 0;
}

/* ── BACK ── */
.rb-back {
  position: absolute; top: 14px; left: 14px; z-index: 30;
  background: rgba(8,13,22,.84); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.07); border-radius: 100px;
  color: #9eb0c4; font-size: 13px; font-weight: 500;
  padding: 7px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif;
}

/* ── MAP ── */
.rb-map { height: 42%; position: relative; flex-shrink: 0; }

.rb-legend {
  position: absolute; bottom: 12px; left: 12px;
  display: flex; gap: 10px;
  background: rgba(8,13,22,.84); backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,.07); border-radius: 10px;
  padding: 6px 12px;
}
.rb-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#7a8a9a; }
.rb-legend-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

.rb-iw           { font-family:'DM Sans',sans-serif; min-width:140px; padding:2px 0; }
.rb-iw__title    { color:#4a5a6e; font-size:10px; font-weight:700; text-transform:uppercase;
                   letter-spacing:.5px; margin-bottom:3px; }
.rb-iw__name     { color:#cdd8e8; font-weight:700; font-size:13px; margin-bottom:2px; }
.rb-iw__body     { color:#4a5a6e; font-size:11px; }

/* ── PANEL ── */
.rb-panel {
  flex: 1; background: #0d1520;
  border-top: 1px solid rgba(255,255,255,.05);
  border-radius: 22px 22px 0 0;
  display: flex; flex-direction: column;
  overflow-y: auto; padding: 0 0 28px;
  scrollbar-width: none;
}
.rb-panel::-webkit-scrollbar { display: none; }
.rb-panel__handle {
  width: 38px; height: 4px;
  background: rgba(255,255,255,.1); border-radius: 2px;
  margin: 12px auto 14px; flex-shrink: 0;
}

/* ── SPOT CARD ── */
.rb-spot-card {
  display: flex; align-items: flex-start; gap: 12px;
  background: #0a1d10; border: 1px solid rgba(0,208,132,.2);
  border-radius: 14px; padding: 14px 16px; margin: 0 16px 14px;
}
.rb-spot-card__pulse {
  width: 10px; height: 10px; border-radius: 50%;
  background: #00d084; box-shadow: 0 0 8px #00d084;
  animation: pulseDot 2s ease-in-out infinite;
  flex-shrink: 0; margin-top: 3px;
}
.rb-spot-card__body  { flex: 1; min-width: 0; }
.rb-spot-card__label { color:#00d084; font-size:10px; font-weight:700;
                       text-transform:uppercase; letter-spacing:.7px; margin-bottom:4px; }
.rb-spot-card__name  { color:#cdd8e8; font-size:14px; font-weight:600; margin-bottom:2px; }
.rb-spot-card__addr  { color:#3a5a4a; font-size:12px; line-height:1.4; }
.rb-spot-card__loading { display:flex; align-items:center; gap:8px; color:#3a5a4a; font-size:13px; }
.rb-spot-card__nav   {
  background: rgba(0,208,132,.13); border: 1px solid rgba(0,208,132,.28);
  border-radius: 8px; color: #00d084; font-size: 11px; font-weight: 700;
  padding: 7px 11px; cursor: pointer; flex-shrink: 0;
  font-family: 'Syne', sans-serif;
}
.rb-mini-spin {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(0,208,132,.2); border-top: 2px solid #00d084;
  animation: spin .8s linear infinite; flex-shrink: 0;
}

/* ── GROUP BUBBLES ── */
.rb-group-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 0 16px 14px; overflow-x: auto; scrollbar-width: none;
}
.rb-group-row::-webkit-scrollbar { display: none; }
.rb-group-bubble {
  display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0;
}
.rb-group-bubble__av {
  width: 46px; height: 46px; border-radius: 50%;
  background: #162030; border: 2px solid rgba(58,122,224,.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #3a7ae0;
  font-family: 'Syne', sans-serif; overflow: hidden;
}
.rb-group-bubble__av img { width:100%; height:100%; object-fit:cover; }
.rb-group-bubble--me .rb-group-bubble__av {
  border-color: rgba(58,122,224,.6); background: rgba(58,122,224,.12);
}
.rb-group-bubble__name { color:#7a8a9a; font-size:10px; font-weight:500;
                         text-align:center; max-width:46px;
                         overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rb-group-bubble__dist { color:#f5a623; font-size:9px; text-align:center; }

/* ── SECTION ── */
.rb-section { padding: 0 16px 16px; }
.rb-section__label {
  color: #2e4258; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .8px; margin-bottom: 9px;
}

/* ── TIME CHIPS ── */
.rb-chips-row { display: flex; flex-wrap: wrap; gap: 7px; }
.rb-time-chip {
  display: flex; flex-direction: column; align-items: center;
  background: #101c2e; border: 1px solid rgba(255,255,255,.05);
  border-radius: 10px; padding: 7px 12px; cursor: pointer;
  transition: all .18s; font-family: 'DM Sans', sans-serif; gap: 1px;
}
.rb-time-chip:active           { transform: scale(.96); }
.rb-time-chip--on              { background:rgba(58,122,224,.14); border-color:#3a7ae0; }
.rb-time-chip--custom          { border-style: dashed; }
.rb-time-chip__t               { color:#8a9aaa; font-size:13px; font-weight:600; }
.rb-time-chip__l               { color:#2e4258; font-size:10px; }
.rb-time-chip--on .rb-time-chip__t { color:#3a7ae0; }
.rb-dt-input {
  width: 100%; background: #101c2e; border: 1px solid #3a7ae0;
  border-radius: 10px; padding: 10px 14px; color: #cdd8e8;
  font-size: 14px; margin-top: 8px; outline: none;
  color-scheme: dark; font-family: 'DM Sans', sans-serif;
}

/* ── SEATS ── */
.rb-seats-row { display: flex; gap: 8px; margin-bottom: 6px; }
.rb-seat-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: #101c2e; border: 1px solid rgba(255,255,255,.05);
  border-radius: 12px; padding: 10px 0; cursor: pointer;
  transition: all .18s; font-family: 'Syne', sans-serif;
}
.rb-seat-btn:active    { transform: scale(.96); }
.rb-seat-btn--on       { background: rgba(58,122,224,.14); border-color: #3a7ae0; }
.rb-seat-btn__icon     { font-size: 16px; }
.rb-seat-btn__n        { color: #8a9aaa; font-size: 13px; font-weight: 700; }
.rb-seat-btn--on .rb-seat-btn__n { color: #3a7ae0; }
.rb-seats-hint         { color: #2e4258; font-size: 11px; }

/* ── SUMMARY BAR ── */
.rb-summary {
  display: flex; align-items: center;
  background: #101c2e; border: 1px solid rgba(255,255,255,.04);
  border-radius: 14px; margin: 0 16px 16px; overflow: hidden;
}
.rb-summary__cell { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 12px 0; }
.rb-summary__val  { color:#cdd8e8; font-size:20px; font-weight:800;
                    font-family:'Syne',sans-serif; line-height:1; }
.rb-summary__val--sm  { font-size:14px; }
.rb-summary__val--xs  { font-size:11px; color:#a855f7; text-align:center; word-break:break-all; }
.rb-summary__key  { color:#2e4258; font-size:9px; font-weight:700;
                    text-transform:uppercase; letter-spacing:.6px; margin-top:3px; }
.rb-summary__sep  { width:1px; height:32px; background:rgba(255,255,255,.04); }

/* ── CONFIRM BUTTON ── */
.rb-confirm {
  margin: 0 16px;
  background: linear-gradient(135deg, #3a7ae0 0%, #6366f1 100%);
  color: #fff; border: none; border-radius: 14px;
  padding: 15px 0; font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: 'Syne', sans-serif;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity .2s, transform .12s;
  animation: glowBtn 2.5s ease-in-out infinite;
}
.rb-confirm:disabled      { opacity: .45; cursor: not-allowed; animation: none; }
.rb-confirm:active:not(:disabled) { transform: scale(.98); }
.rb-confirm--busy         { animation: none; }
.rb-btn-spin {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.3); border-top: 2px solid #fff;
  animation: spin .8s linear infinite;
}

/* ══════════════════════════════════════════════════════════
   INVITED VIEW
   ══════════════════════════════════════════════════════════ */
.rb-invited-root { display:flex; flex-direction:column; height:100dvh; width:100vw; background:#0d1520; }
.rb-invited-map  { flex:1; min-height:0; }
.rb-invited-card {
  background: #0d1520; border-top: 1px solid rgba(255,255,255,.05);
  border-radius: 22px 22px 0 0; padding: 20px 20px 30px;
  display: flex; flex-direction: column; gap: 14px; flex-shrink: 0;
}
.rb-invited-badge {
  background: rgba(0,208,132,.1); border: 1px solid rgba(0,208,132,.28);
  border-radius: 10px; padding: 10px 14px;
  color: #00d084; font-size: 13px; font-weight: 600; text-align: center;
}
.rb-invited-spot {
  display: flex; gap: 10px; align-items: flex-start;
  background: #0a1d10; border: 1px solid rgba(0,208,132,.18);
  border-radius: 12px; padding: 12px 14px;
}
.rb-invited-spot__icon { font-size:20px; flex-shrink:0; }
.rb-invited-spot__name { color:#cdd8e8; font-size:14px; font-weight:600; margin-bottom:2px; }
.rb-invited-spot__addr { color:#3a5a4a; font-size:12px; }
.rb-invited-meta       { display:flex; flex-direction:column; gap:8px; }
.rb-invited-meta__row  { display:flex; align-items:center; gap:10px; color:#7a8a9a; font-size:13px; }
.rb-invited-meta__row strong { color:#cdd8e8; }
.rb-invited-nav {
  width: 100%; background: linear-gradient(135deg, #3a7ae0 0%, #6366f1 100%);
  color: #fff; border: none; border-radius: 12px; padding: 13px 0;
  font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Syne', sans-serif;
}
.rb-invited-done {
  width: 100%; background: transparent; color: #2e4258;
  border: 1px solid rgba(255,255,255,.06); border-radius: 12px;
  padding: 12px 0; font-size: 14px; cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}

/* ══════════════════════════════════════════════════════════
   SUCCESS SCREEN
   ══════════════════════════════════════════════════════════ */
.rb-success-root {
  display: flex; align-items: center; justify-content: center;
  height: 100dvh; width: 100vw;
  background: #0d1520; font-family: 'DM Sans', sans-serif; padding: 20px;
}
.rb-success-card {
  background: #101c2e; border: 1px solid rgba(255,255,255,.05);
  border-radius: 24px; padding: 28px 22px;
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  animation: fadeUp .4s ease;
}
.rb-success-card__confetti { font-size: 52px; }
.rb-success-card__title    { color:#cdd8e8; font-size:22px; font-weight:800;
                             font-family:'Syne',sans-serif; text-align:center; }
.rb-success-card__sub      { color:#4a5a6e; font-size:13px; text-align:center; line-height:1.5; }
.rb-success-spot {
  display: flex; gap: 10px; align-items: flex-start;
  background: #0a1d10; border: 1px solid rgba(0,208,132,.18);
  border-radius: 12px; padding: 12px 14px; width: 100%;
}
.rb-success-spot__icon { font-size:20px; flex-shrink:0; }
.rb-success-spot__name { color:#cdd8e8; font-size:13px; font-weight:600; margin-bottom:2px; }
.rb-success-spot__addr { color:#3a5a4a; font-size:12px; }
.rb-success-group      { width: 100%; }
.rb-success-group__label {
  color: #2e4258; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .7px;
  text-align: center; margin-bottom: 10px;
}
.rb-success-group__avs { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; }
.rb-success-av {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.rb-success-av--me {
  align-items: center;
}
.rb-success-av__circle {
  width: 46px; height: 46px; border-radius: 50%;
  background: #162030; border: 2px solid rgba(58,122,224,.28);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #3a7ae0;
  font-family: 'Syne', sans-serif; overflow: hidden;
}
.rb-success-av--me > span {
  width: 46px; height: 46px; border-radius: 50%;
  background: rgba(0,208,132,.12); border: 2px solid rgba(0,208,132,.45);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #00d084;
  font-family: 'Syne', sans-serif;
}
.rb-success-av__circle img { width:100%; height:100%; object-fit:cover; }
.rb-success-av__name   { color:#4a5a6e; font-size:10px; font-weight:500; }
.rb-success-details    {
  display: flex; flex-direction: column; gap: 8px; width: 100%;
  background: #0d1520; border-radius: 12px; padding: 14px;
}
.rb-success-detail { display:flex; align-items:center; gap:10px; color:#7a8a9a; font-size:13px; }
.rb-success-detail strong { color:#cdd8e8; }
.rb-success-nav {
  width: 100%; background: linear-gradient(135deg, #3a7ae0 0%, #6366f1 100%);
  color: #fff; border: none; border-radius: 12px; padding: 13px 0;
  font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Syne', sans-serif;
}
.rb-success-done {
  width: 100%; background: transparent; color: #2e4258;
  border: 1px solid rgba(255,255,255,.06); border-radius: 12px;
  padding: 12px 0; font-size: 14px; cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}
`;