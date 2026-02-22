import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIzaSyA9spKFBlhfECHHoXnMPRziyuUuhL124yo";

export default function DriverRideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpError, setOtpError] = useState("");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GMAPS_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    if (!user?.isDriver || !user?.driverApproved) {
      navigate("/login");
      return;
    }
  }, [user?.isDriver, user?.driverApproved, navigate]);

  useEffect(() => {
    if (!token || !rideId) return;
    axios
      .get(`${API_BASE}/personal-ride/${rideId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setRide(res.data))
      .catch((e) => {
        if (e.response?.status === 401 || e.response?.status === 403) navigate("/login");
        else setRide(null);
      })
      .finally(() => setLoading(false));
  }, [token, rideId, navigate]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await axios.post(
        `${API_BASE}/personal-ride/${rideId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRide(res.data.ride);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to accept");
    } finally {
      setAccepting(false);
    }
  };

  const handleStartRide = async () => {
    setOtpError("");
    if (!otpInput.trim()) {
      setOtpError("Enter the OTP shared by the user.");
      return;
    }
    setStarting(true);
    try {
      const res = await axios.post(
        `${API_BASE}/personal-ride/${rideId}/start`,
        { otp: otpInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRide(res.data);
      setShowOtpModal(false);
      setOtpInput("");
    } catch (e) {
      setOtpError(e.response?.data?.message || "Invalid OTP. Ride not started.");
    } finally {
      setStarting(false);
    }
  };

  if (!user?.isDriver || !user?.driverApproved) return null;
  if (loading || !ride) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        {loading ? "Loading ride…" : "Ride not found."}
        <button type="button" style={{ marginLeft: "12px" }} onClick={() => navigate("/driver-dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  const pickup = { lat: ride.pickupLat, lng: ride.pickupLng };
  const drop = { lat: ride.dropLat, lng: ride.dropLng };
  const center = {
    lat: (pickup.lat + drop.lat) / 2,
    lng: (pickup.lng + drop.lng) / 2,
  };
  const isAccepted = ride.status === "accepted" || ride.status === "ride_started" || ride.status === "completed";
  const isStarted = ride.status === "ride_started" || ride.status === "completed";

  const styles = {
    page: { minHeight: "100vh", background: "#f1f5f9", padding: "24px", fontFamily: "'DM Sans', sans-serif" },
    backBtn: { marginBottom: "16px", padding: "8px 0", background: "none", border: "none", color: "#154272", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
    card: { background: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
    mapWrap: { width: "100%", height: "320px", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" },
    price: { fontSize: "22px", fontWeight: "700", color: "#0d9488", marginBottom: "16px" },
    btn: { width: "100%", padding: "14px", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" },
    btnPrimary: { background: "#154272", color: "#fff" },
    btnSuccess: { background: "#0d9488", color: "#fff" },
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modalInner: { background: "#fff", borderRadius: "12px", padding: "24px", maxWidth: "360px", width: "90%" },
    input: { width: "100%", padding: "12px", fontSize: "18px", letterSpacing: "8px", textAlign: "center", marginBottom: "12px", boxSizing: "border-box" },
    error: { color: "#dc2626", fontSize: "14px", marginBottom: "8px" },
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate("/driver-dashboard")}>← Back to Dashboard</button>

      <div style={styles.card}>
        <h2 style={{ marginBottom: "12px", color: "#154272" }}>Ride details</h2>
        <p><strong>Pickup:</strong> {ride.pickupAddress || `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLng?.toFixed(4)}`}</p>
        <p><strong>Drop:</strong> {ride.dropAddress || `${ride.dropLat?.toFixed(4)}, ${ride.dropLng?.toFixed(4)}`}</p>
        <div style={styles.price}>Offered price: ₹{ride.offeredPrice}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.mapWrap}>
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={center}
              zoom={13}
              options={{ mapTypeControl: false, streetViewControl: false }}
            >
              <Marker position={pickup} title="Pickup" />
              <Marker position={drop} title="Drop" />
              <Polyline
                path={[pickup, drop]}
                options={{ strokeColor: "#154272", strokeWeight: 4, strokeOpacity: 0.8 }}
              />
            </GoogleMap>
          )}
        </div>

        {ride.status === "pending" && (
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? "Accepting…" : "Accept Ride"}
          </button>
        )}

        {isAccepted && !isStarted && (
          <div>
            <p style={{ marginBottom: "12px", color: "#0d9488", fontWeight: "600" }}>OTP has been sent to the user. Ask the user for the OTP when you reach the pickup location.</p>
            <button
              style={{ ...styles.btn, ...styles.btnSuccess }}
              onClick={() => { setShowOtpModal(true); setOtpError(""); setOtpInput(""); }}
            >
              Start Ride
            </button>
          </div>
        )}

        {isStarted && (
          <p style={{ color: "#0d9488", fontWeight: "600" }}>Ride started. Complete the trip.</p>
        )}
      </div>

      {showOtpModal && (
        <div style={styles.modal} onClick={() => !starting && setShowOtpModal(false)}>
          <div style={styles.modalInner} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "12px" }}>Enter OTP from user</h3>
            <input
              type="text"
              placeholder="6-digit OTP"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
              style={styles.input}
            />
            {otpError && <p style={styles.error}>{otpError}</p>}
            <button style={{ ...styles.btn, ...styles.btnSuccess }} onClick={handleStartRide} disabled={starting}>
              {starting ? "Verifying…" : "Confirm & Start Ride"}
            </button>
            <button style={{ ...styles.btn, marginTop: "8px", background: "#e2e8f0" }} onClick={() => setShowOtpModal(false)} disabled={starting}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
