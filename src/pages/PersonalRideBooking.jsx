import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://localhost:5000";

// Uber-like dynamic pricing: base fare (₹) + per km (₹)
const VEHICLE_PRICING = {
  Auto:   { base: 25,  perKm: 14,  label: "Auto",   icon: "🛺" },
  Cab:    { base: 50,  perKm: 20,  label: "Cab",    icon: "🚕" },
  Sedan:  { base: 70,  perKm: 25,  label: "Sedan",  icon: "🚗" },
  "Go Sedan": { base: 55, perKm: 22, label: "Go Sedan", icon: "🚙" },
};

function getDrivingDistance(originLat, originLng, destLat, destLng) {
  const base = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
  const url = `${base}/maps/distance-matrix?originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}`;
  return fetch(url)
    .then((res) => res.json())
    .then((data) => ({
      distanceKm: data.distanceKm ?? null,
      durationText: data.durationText ?? null,
      error: data.error || null,
    }))
    .catch((err) => ({ distanceKm: null, durationText: null, error: err.message }));
}

export default function PersonalRideBooking() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const concessionApproved = !!user?.concessionApproved;

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [originLat, setOriginLat] = useState(null);
  const [originLng, setOriginLng] = useState(null);
  const [destLat, setDestLat] = useState(null);
  const [destLng, setDestLng] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationText, setDurationText] = useState("");
  const [vehicleType, setVehicleType] = useState("Auto");
  const [loadingDistance, setLoadingDistance] = useState(true);
  const [distanceError, setDistanceError] = useState("");
  const [searching, setSearching] = useState(false);
  const [rideCreated, setRideCreated] = useState(false);
  const [acceptedInfo, setAcceptedInfo] = useState(null);

  const loadFromStorage = useCallback(() => {
    const userLocation = localStorage.getItem("userLocation") || "";
    const nearestStation = localStorage.getItem("nearestStation") || "";
    const lat = localStorage.getItem("userLat");
    const lng = localStorage.getItem("userLng");
    const nslat = localStorage.getItem("nearestStationLat");
    const nslng = localStorage.getItem("nearestStationLng");
    const storedDistance = parseFloat(localStorage.getItem("distance")) || null;

    setSource(userLocation);
    setDestination(nearestStation || "Metro Station");
    if (lat && lng) {
      setOriginLat(parseFloat(lat));
      setOriginLng(parseFloat(lng));
    }
    if (nslat && nslng) {
      setDestLat(parseFloat(nslat));
      setDestLng(parseFloat(nslng));
    }
    if (!lat || !lng || !nslat || !nslng) {
      setDistanceKm(storedDistance);
      setLoadingDistance(false);
    }
    return { lat, lng, nslat, nslng, storedDistance };
  }, []);

  useEffect(() => {
    const { lat, lng, nslat, nslng, storedDistance } = loadFromStorage();
    if (lat && lng && nslat && nslng) {
      setLoadingDistance(true);
      setDistanceError("");
      getDrivingDistance(parseFloat(lat), parseFloat(lng), parseFloat(nslat), parseFloat(nslng))
        .then(({ distanceKm: km, durationText: dur, error }) => {
          setLoadingDistance(false);
          if (km != null) {
            setDistanceKm(km);
            setDurationText(dur || "");
            setDistanceError(error ? "Using approximate distance." : "");
          } else {
            setDistanceKm(storedDistance);
            setDistanceError(error || "");
          }
        });
    } else {
      setDistanceKm(storedDistance);
      setLoadingDistance(false);
      if (!lat || !lng) setDistanceError("Set your location on Home first.");
    }
  }, [loadFromStorage]);

  const pricing = VEHICLE_PRICING[vehicleType];
  const rawPrice = pricing && distanceKm != null
    ? pricing.base + distanceKm * pricing.perKm
    : null;
  const finalPrice = rawPrice != null && concessionApproved
    ? rawPrice * 0.75
    : rawPrice;

  const token = localStorage.getItem("token");

  // Real-time: listen for driver acceptance and ride started (redirect to Ride In Progress).
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on("ride:accepted", (data) => setAcceptedInfo(data));
    socket.on("ride:started", (data) => {
      if (data?.rideId) navigate(`/ride-in-progress/${data.rideId}`);
    });
    socket.on("connect_error", () => {
      // Backend may be stopped; avoid spamming console. Page still works for booking.
    });
    return () => socket.disconnect();
  }, [token, navigate]);

  const handleSearchDriver = async () => {
    if (finalPrice == null || originLat == null || originLng == null || destLat == null || destLng == null) return;
    if (!token) {
      setDistanceError("Please log in to request a ride.");
      return;
    }
    setSearching(true);
    setDistanceError("");
    try {
      await axios.post(
        `${API_BASE}/personal-ride`,
        {
          pickupLat: originLat,
          pickupLng: originLng,
          pickupAddress: source,
          dropLat: destLat,
          dropLng: destLng,
          dropAddress: destination,
          fullPrice: rawPrice != null ? Math.round(rawPrice) : undefined,
          offeredPrice: Math.round(finalPrice),
          vehicleType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRideCreated(true);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || "Failed to create ride request.";
      if (err.response?.status === 403 && data?.code === "USE_RIDER_ACCOUNT") {
        setDistanceError("You're logged in as Admin. Please log out and sign in with a rider account to book a ride.");
      } else {
        setDistanceError(msg);
      }
    } finally {
      setSearching(false);
    }
  };

  const hasLocation = originLat != null && originLng != null;

  const styles = {
    page: { minHeight: "100vh", background: "#f1f5f9", padding: "24px", fontFamily: "'DM Sans', sans-serif" },
    container: { maxWidth: "560px", margin: "0 auto" },
    card: { background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
    title: { fontSize: "22px", fontWeight: "700", color: "#0B1F3A", marginBottom: "8px" },
    subtitle: { fontSize: "14px", color: "#64748b", marginBottom: "20px" },
    field: { marginBottom: "16px" },
    label: { display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      fontSize: "14px",
      boxSizing: "border-box",
      background: "#f8fafc",
    },
    vehicleGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginTop: "12px" },
    vehicleCard: (selected) => ({
      padding: "16px",
      borderRadius: "10px",
      border: `2px solid ${selected ? "#154272" : "#e2e8f0"}`,
      background: selected ? "#eff6ff" : "#fff",
      cursor: "pointer",
      textAlign: "center",
    }),
    priceBox: { background: "#f0fdf4", border: "2px solid #0d9488", borderRadius: "10px", padding: "20px", marginTop: "20px", marginBottom: "20px" },
    priceRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" },
    finalRow: { fontSize: "18px", fontWeight: "700", color: "#0B1F3A", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" },
    concessionBadge: { fontSize: "12px", color: "#0d9488", fontWeight: "600", marginTop: "4px" },
    btnPrimary: { width: "100%", padding: "14px", background: "#154272", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" },
    btnSecondary: { width: "100%", marginTop: "10px", padding: "12px", background: "transparent", color: "#154272", border: "2px solid #154272", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
    backBtn: { marginBottom: "16px", padding: "8px 0", background: "none", border: "none", color: "#154272", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
    error: { fontSize: "13px", color: "#dc2626", marginTop: "4px" },
    searching: { textAlign: "center", padding: "24px", color: "#0d9488", fontWeight: "600" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate("/recommendation")}>← Back to Recommendation</button>

        <div style={styles.card}>
          <h1 style={styles.title}>Book a Personal Ride</h1>
          <p style={styles.subtitle}>Source and destination are set from your last search on Home.</p>

          <div style={styles.field}>
            <span style={styles.label}>Source</span>
            <input
              type="text"
              readOnly
              value={source || "—"}
              style={styles.input}
              placeholder="Set location on Home page"
            />
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Destination</span>
            <input
              type="text"
              readOnly
              value={destination || "—"}
              style={styles.input}
            />
          </div>
          {distanceError && <p style={styles.error}>{distanceError}</p>}
          {loadingDistance && <p style={{ fontSize: "13px", color: "#64748b" }}>Fetching route distance via Google Maps…</p>}
          {!loadingDistance && distanceKm != null && (
            <p style={{ fontSize: "13px", color: "#475569" }}>
              Distance: <strong>{distanceKm.toFixed(2)} km</strong>
              {durationText && ` · Est. ${durationText}`}
            </p>
          )}
        </div>

        <div style={styles.card}>
          <span style={styles.label}>Choose vehicle type</span>
          <div style={styles.vehicleGrid}>
            {Object.entries(VEHICLE_PRICING).map(([key, p]) => (
              <div
                key={key}
                style={styles.vehicleCard(vehicleType === key)}
                onClick={() => setVehicleType(key)}
              >
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>{p.icon}</div>
                <div style={{ fontWeight: "600", color: "#0B1F3A" }}>{p.label}</div>
              </div>
            ))}
          </div>

          {distanceKm != null && pricing && (
            <div style={styles.priceBox}>
              <div style={styles.priceRow}>
                <span>Base fare ({pricing.label})</span>
                <span>₹{pricing.base}</span>
              </div>
              <div style={styles.priceRow}>
                <span>Distance ({distanceKm.toFixed(2)} km × ₹{pricing.perKm}/km)</span>
                <span>₹{(distanceKm * pricing.perKm).toFixed(0)}</span>
              </div>
              {concessionApproved && (
                <div style={styles.priceRow}>
                  <span>Subtotal</span>
                  <span>₹{rawPrice?.toFixed(0)}</span>
                </div>
              )}
              {concessionApproved && (
                <div style={styles.priceRow}>
                  <span>Concession (25% off)</span>
                  <span style={{ color: "#0d9488" }}>−25%</span>
                </div>
              )}
              <div style={{ ...styles.priceRow, ...styles.finalRow }}>
                <span>You pay</span>
                <span>₹{finalPrice?.toFixed(0)}</span>
              </div>
              {concessionApproved && <div style={styles.concessionBadge}>✓ Concession applied</div>}
            </div>
          )}

          {rideCreated && !acceptedInfo && (
            <div style={{ background: "#eff6ff", border: "2px solid #154272", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ fontWeight: "600", color: "#154272", marginBottom: "4px" }}>Ride requested</p>
              <p style={{ fontSize: "14px", color: "#475569" }}>Waiting for a driver. You’ll get an OTP when one accepts.</p>
            </div>
          )}
          {acceptedInfo && (
            <div style={{ background: "#f0fdf4", border: "2px solid #0d9488", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "#0d9488", fontWeight: "600", marginBottom: "6px" }}>✓ Real-time notification — driver accepted on this page</p>
              <p style={{ fontWeight: "700", color: "#0d9488", marginBottom: "8px" }}>Driver accepted your ride!</p>
              <p style={{ fontSize: "14px", color: "#475569", marginBottom: "4px" }}>Driver: {acceptedInfo.driverName}</p>
              <p style={{ fontSize: "18px", fontWeight: "700", color: "#0B1F3A", letterSpacing: "4px", marginTop: "8px" }}>Share this OTP with driver: {acceptedInfo.otp}</p>
            </div>
          )}
          <button
            style={styles.btnPrimary}
            onClick={handleSearchDriver}
            disabled={finalPrice == null || searching || rideCreated}
          >
            {searching ? "Creating ride request…" : rideCreated ? "Ride requested" : "Search for Driver"}
          </button>
          {searching && (
            <p style={styles.searching}>Creating your ride request…</p>
          )}
          <button style={styles.btnSecondary} onClick={() => navigate("/recommendation")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
