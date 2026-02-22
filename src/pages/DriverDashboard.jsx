import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [driverLat, setDriverLat] = useState(null);
  const [driverLng, setDriverLng] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.isDriver || !user?.driverApproved) {
      navigate("/login");
      return;
    }
  }, [user?.isDriver, user?.driverApproved, navigate]);

  const fetchLocation = useCallback(() => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLat(pos.coords.latitude);
        setDriverLng(pos.coords.longitude);
      },
      (err) => {
        setLocationError("Could not get location. Allow browser access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const fetchNearbyRides = useCallback(async () => {
    if (driverLat == null || driverLng == null || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/personal-ride/nearby`, {
        params: { lat: driverLat, lng: driverLng },
        headers: { Authorization: `Bearer ${token}` },
      });
      setRides(res.data || []);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [driverLat, driverLng, token, navigate]);

  useEffect(() => {
    fetchNearbyRides();
    const interval = setInterval(fetchNearbyRides, 10000);
    return () => clearInterval(interval);
  }, [fetchNearbyRides]);

  if (!user?.isDriver || !user?.driverApproved) return null;

  const styles = {
    page: { minHeight: "100vh", background: "#f1f5f9", padding: "24px", fontFamily: "'DM Sans', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
    title: { fontSize: "24px", fontWeight: "700", color: "#154272" },
    logout: { padding: "8px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
    card: { background: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", cursor: "pointer" },
    locationBar: { background: "#eff6ff", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "14px", color: "#154272" },
    ridePickup: { fontWeight: "600", color: "#0B1F3A", marginBottom: "4px" },
    rideDrop: { fontSize: "14px", color: "#475569", marginBottom: "4px" },
    ridePrice: { fontSize: "18px", fontWeight: "700", color: "#0d9488", marginTop: "8px" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Driver Dashboard</h1>
        <button style={styles.logout} onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }}>
          Logout
        </button>
      </div>

      <div style={styles.locationBar}>
        {locationError ? (
          <span>{locationError} <button type="button" onClick={fetchLocation} style={{ marginLeft: "8px", textDecoration: "underline" }}>Retry</button></span>
        ) : driverLat != null && driverLng != null ? (
          <span>📍 Your location: {driverLat.toFixed(5)}, {driverLng.toFixed(5)} · Showing ride requests within 3 km</span>
        ) : (
          <span>Getting your location…</span>
        )}
      </div>

      <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#154272", marginBottom: "12px" }}>Nearby ride requests</h2>
      {loading && driverLat != null ? (
        <p style={{ color: "#64748b" }}>Loading…</p>
      ) : rides.length === 0 ? (
        <p style={{ color: "#64748b" }}>No ride requests within 3 km. We’ll refresh every 10 seconds.</p>
      ) : (
        rides.map((ride) => (
          <div
            key={ride._id}
            style={styles.card}
            onClick={() => navigate(`/driver/ride/${ride._id}`)}
          >
            <div style={styles.ridePickup}>Pickup: {ride.pickupAddress || `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLng?.toFixed(4)}`}</div>
            <div style={styles.rideDrop}>Drop: {ride.dropAddress || `${ride.dropLat?.toFixed(4)}, ${ride.dropLng?.toFixed(4)}`}</div>
            <div style={styles.ridePrice}>₹{ride.offeredPrice}</div>
          </div>
        ))
      )}
    </div>
  );
}
