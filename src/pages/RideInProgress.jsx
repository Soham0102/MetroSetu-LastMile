import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function RideInProgress() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sosSending, setSosSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    if (!token || !rideId) {
      navigate("/personal-ride-booking");
      return;
    }
    axios
      .get(`${API_BASE}/personal-ride/${rideId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setRide(res.data))
      .catch((e) => {
        if (e.response?.status === 401 || e.response?.status === 403) navigate("/login");
        else navigate("/personal-ride-booking");
      })
      .finally(() => setLoading(false));
  }, [token, rideId, navigate]);

  const handleSOS = async () => {
    if (!window.confirm("Send SOS to Admin? Help will be notified immediately.")) return;
    setSosSending(true);
    try {
      await axios.post(
        `${API_BASE}/personal-ride/${rideId}/sos`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSosSent(true);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to send SOS");
    } finally {
      setSosSending(false);
    }
  };

  const isFemale = user?.gender === "Female";
  const isRider = ride?.user && (String(ride.user._id) === String(user?.id) || String(ride.user) === String(user?.id));
  const showSOS = isFemale && isRider && (ride?.status === "ride_started" || ride?.status === "accepted");

  if (loading || !ride) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
        {loading ? "Loading ride…" : "Ride not found."}
      </div>
    );
  }

  const styles = {
    page: { minHeight: "100vh", background: "#f1f5f9", padding: "24px", fontFamily: "'DM Sans', sans-serif" },
    backBtn: { marginBottom: "16px", padding: "8px 0", background: "none", border: "none", color: "#154272", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
    card: { background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
    title: { fontSize: "20px", fontWeight: "700", color: "#0d9488", marginBottom: "16px" },
    row: { display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" },
    label: { color: "#64748b" },
    value: { fontWeight: "600", color: "#0B1F3A" },
    priceBox: { background: "#f0fdf4", border: "2px solid #0d9488", borderRadius: "10px", padding: "20px", marginTop: "16px" },
    sosBtn: { width: "100%", padding: "16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "16px" },
    sosSent: { background: "#fef2f2", border: "2px solid #dc2626", borderRadius: "8px", padding: "16px", marginTop: "16px", color: "#b91c1c", fontWeight: "600" },
  };

  const driver = ride.driver || {};
  const driverName = driver.name || "—";
  const driverPhone = driver.phone || "—";

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate("/personal-ride-booking")}>← Back</button>

      <div style={styles.card}>
        <h1 style={styles.title}>Ride in progress</h1>
        <div style={styles.row}><span style={styles.label}>Pickup</span><span style={styles.value}>{ride.pickupAddress || `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLng?.toFixed(4)}`}</span></div>
        <div style={styles.row}><span style={styles.label}>Drop</span><span style={styles.value}>{ride.dropAddress || `${ride.dropLat?.toFixed(4)}, ${ride.dropLng?.toFixed(4)}`}</span></div>
        <div style={styles.row}><span style={styles.label}>Driver</span><span style={styles.value}>{driverName}</span></div>
        <div style={styles.row}><span style={styles.label}>Driver phone</span><span style={styles.value}>{driverPhone}</span></div>
        <div style={styles.priceBox}>
          <div style={styles.row}><span style={styles.label}>You pay</span><span style={{ ...styles.value, fontSize: "18px" }}>₹{ride.offeredPrice}</span></div>
        </div>

        {showSOS && !sosSent && (
          <button style={styles.sosBtn} onClick={handleSOS} disabled={sosSending}>
            {sosSending ? "Sending…" : "🆘 SOS — Alert Admin"}
          </button>
        )}
        {sosSent && <div style={styles.sosSent}>SOS sent. Admin has been notified. Help is on the way.</div>}
      </div>
    </div>
  );
}
