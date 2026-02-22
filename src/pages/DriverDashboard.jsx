// 

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [driverLat, setDriverLat] = useState(null);
  const [driverLng, setDriverLng] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [isActive, setIsActive] = useState(() => {
    return localStorage.getItem("driverActive") !== "false";
  });
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!user?.isDriver || !user?.driverApproved) {
      navigate("/login");
    }
  }, [user?.isDriver, user?.driverApproved, navigate]);

  // Fetch full user profile from DB to get vehicleType, vehicleNumber, licenseNumber
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const freshUser = res.data.user || res.data;
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch (e) {
        console.error("Failed to fetch profile", e);
        if (e.response?.status === 401 || e.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [token, navigate]);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

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
      () => {
        setLocationError("Could not get location. Allow browser access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const fetchNearbyRides = useCallback(async () => {
    if (!isActive) {
      setRides([]);
      setLoading(false);
      return;
    }
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
  }, [driverLat, driverLng, token, navigate, isActive]);

  useEffect(() => {
    fetchNearbyRides();
    const interval = setInterval(fetchNearbyRides, 10000);
    return () => clearInterval(interval);
  }, [fetchNearbyRides]);

  // Toggle active status
  const toggleActive = async () => {
    setTogglingStatus(true);
    const newStatus = !isActive;
    setIsActive(newStatus);
    localStorage.setItem("driverActive", String(newStatus));
    if (!newStatus) {
      setRides([]);
    }
    // Small delay for UX feedback
    await new Promise((r) => setTimeout(r, 300));
    setTogglingStatus(false);
  };

  if (!user?.isDriver || !user?.driverApproved) return null;

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const vehicleIcon = {
    Auto: "🛺",
    Car: "🚗",
    Cab: "🚕",
    Sedan: "🚘",
    "Go Sedan": "🚙",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #f5f5f5; color: #111; -webkit-font-smoothing: antialiased; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

        .nav { background: #fff; border-bottom: 1px solid #e5e5e5; padding: 0 32px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111; }
        .nav-logo { width: 32px; height: 32px; background: #111; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .nav-name { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .nav-user { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: #333; }
        .nav-avatar { width: 28px; height: 28px; border-radius: 50%; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
        .btn-logout { padding: 6px 14px; font-size: 12px; font-weight: 600; font-family: inherit; background: #fff; color: #666; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; transition: all .15s; }
        .btn-logout:hover { border-color: #ef4444; color: #ef4444; }

        .page { max-width: 1120px; margin: 0 auto; padding: 28px 32px 60px; }

        .dash-header { margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
        .dash-header-left {}
        .dash-greeting { font-size: 13px; color: #999; font-weight: 500; margin-bottom: 4px; }
        .dash-title { font-size: 24px; font-weight: 700; color: #111; letter-spacing: -0.5px; margin-bottom: 4px; }
        .dash-sub { font-size: 13px; color: #888; }

        /* Toggle */
        .toggle-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; min-width: 240px; }
        .toggle-card.active { border-color: #10b981; }
        .toggle-card.inactive { border-color: #e5e5e5; }
        .toggle-info { flex: 1; }
        .toggle-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; color: #999; margin-bottom: 2px; }
        .toggle-status { font-size: 14px; font-weight: 700; }
        .toggle-status.on { color: #10b981; }
        .toggle-status.off { color: #999; }
        .toggle-sub { font-size: 11px; color: #999; margin-top: 1px; }

        /* Toggle switch */
        .toggle-switch { position: relative; width: 48px; height: 26px; flex-shrink: 0; cursor: pointer; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-track { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #ddd; border-radius: 13px; transition: background .25s; }
        .toggle-switch input:checked + .toggle-track { background: #10b981; }
        .toggle-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform .25s; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
        .toggle-switch input:checked ~ .toggle-knob { transform: translateX(22px); }
        .toggle-switch.disabled { opacity: .5; pointer-events: none; }

        /* Stats */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .stat-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 18px 20px; transition: border-color .15s; }
        .stat-card:hover { border-color: #ccc; }
        .stat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .8px; color: #999; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .stat-val { font-size: 20px; font-weight: 700; color: #111; line-height: 1; }
        .stat-unit { font-size: 11px; color: #999; margin-top: 4px; }
        .stat-shimmer { height: 20px; width: 60%; border-radius: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e5 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }

        /* Location bar */
        .loc-bar { background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .loc-info { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #333; }
        .loc-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; flex-shrink: 0; animation: pulse-dot 2s infinite; }
        .loc-dot.err { background: #ef4444; animation: none; }
        .loc-dot.loading { background: #f59e0b; }
        .loc-dot.offline { background: #999; animation: none; }
        .loc-coords { font-size: 11px; color: #999; font-family: monospace; }
        .btn-refresh { padding: 6px 14px; font-size: 11px; font-weight: 600; font-family: inherit; background: #f5f5f5; color: #333; border: 1px solid #e5e5e5; border-radius: 6px; cursor: pointer; transition: all .15s; }
        .btn-refresh:hover { border-color: #111; color: #111; }

        /* Section head */
        .section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .section-head h2 { font-size: 14px; font-weight: 600; color: #111; }
        .section-head span { font-size: 12px; color: #999; }
        .section-line { flex: 1; height: 1px; background: #e5e5e5; margin-left: 12px; }

        /* Ride cards */
        .rides-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px; }
        .ride-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 20px 22px; cursor: pointer; transition: border-color .15s, box-shadow .2s; display: flex; flex-direction: column; gap: 14px; }
        .ride-card:hover { border-color: #ccc; box-shadow: 0 2px 12px rgba(0,0,0,.04); }
        .ride-route { display: flex; gap: 14px; }
        .ride-dots { display: flex; flex-direction: column; align-items: center; gap: 2px; padding-top: 4px; }
        .ride-dot-pickup { width: 10px; height: 10px; border-radius: 50%; background: #111; flex-shrink: 0; }
        .ride-dot-line { width: 1.5px; height: 28px; background: #ddd; }
        .ride-dot-drop { width: 10px; height: 10px; border-radius: 2px; background: #ef4444; flex-shrink: 0; }
        .ride-addresses { flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .ride-addr-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .8px; color: #999; margin-bottom: 2px; }
        .ride-addr-val { font-size: 13px; font-weight: 500; color: #111; line-height: 1.4; }
        .ride-bottom { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f0f0f0; padding-top: 14px; }
        .ride-payout { font-size: 20px; font-weight: 700; color: #111; }
        .ride-payout .currency { font-size: 14px; color: #999; font-weight: 500; margin-right: 2px; }
        .ride-vehicle-tag { font-size: 11px; font-weight: 500; color: #666; padding: 4px 10px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; gap: 4px; }
        .ride-meta { display: flex; gap: 16px; font-size: 11px; color: #999; }

        /* Offline overlay */
        .offline-banner { background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 48px 24px; text-align: center; }
        .offline-banner .off-icon { font-size: 36px; margin-bottom: 14px; }
        .offline-banner h3 { font-size: 16px; font-weight: 600; color: #111; margin-bottom: 6px; }
        .offline-banner p { font-size: 13px; color: #999; line-height: 1.6; max-width: 360px; margin: 0 auto; }

        /* Empty state */
        .empty { background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 48px 24px; text-align: center; }
        .empty-icon { font-size: 32px; margin-bottom: 12px; }
        .empty h3 { font-size: 15px; font-weight: 600; color: #111; margin-bottom: 4px; }
        .empty p { font-size: 13px; color: #999; line-height: 1.5; }

        /* Skeleton */
        .skel-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 22px; }
        .skel-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e5 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 10px; }
        .skel-line.w60 { width: 60%; }
        .skel-line.w80 { width: 80%; }
        .skel-line.w40 { width: 40%; height: 20px; }

        .footer { background: #fff; border-top: 1px solid #e5e5e5; text-align: center; padding: 24px; font-size: 12px; color: #999; }
        .footer strong { color: #111; font-weight: 700; }

        @media (max-width: 900px) {
          .nav { padding: 0 16px; }
          .page { padding: 20px 16px 40px; }
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .rides-grid { grid-template-columns: 1fr; }
          .dash-header { flex-direction: column; }
        }
        @media (max-width: 480px) {
          .stats-row { grid-template-columns: 1fr; }
          .loc-bar { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* Nav */}
      <nav className="nav">
        <a href="/" className="nav-brand">
          <div className="nav-logo">🚇</div>
          <span className="nav-name">MetroSetu</span>
        </a>
        <div className="nav-right">
          <div className="nav-user">
            <div className="nav-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "D"}
            </div>
            {user.name || "Driver"}
          </div>
          <button
            className="btn-logout"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("driverActive");
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="page">
        {/* Header + Toggle */}
        <div className="dash-header">
          <div className="dash-header-left">
            <div className="dash-greeting">
              {greeting()}, {user.name?.split(" ")[0] || "Driver"}
            </div>
            <h1 className="dash-title">Driver Dashboard</h1>
            <div className="dash-sub">
              {now.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              ·{" "}
              {now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          {/* Active Toggle */}
          <div className={`toggle-card ${isActive ? "active" : "inactive"}`}>
            <div className="toggle-info">
              <div className="toggle-label">Driver Mode</div>
              <div className={`toggle-status ${isActive ? "on" : "off"}`}>
                {isActive ? "Active" : "Offline"}
              </div>
              <div className="toggle-sub">
                {isActive
                  ? "You're receiving ride requests"
                  : "Toggle on to start accepting rides"}
              </div>
            </div>
            <label
              className={`toggle-switch ${togglingStatus ? "disabled" : ""}`}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={toggleActive}
                disabled={togglingStatus}
              />
              <span className="toggle-track" />
              <span className="toggle-knob" />
            </label>
          </div>
        </div>

        {/* Stats — fetched fresh from DB */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">
              {vehicleIcon[user.vehicleType] || "🚗"} Vehicle Type
            </div>
            {profileLoading ? (
              <div className="stat-shimmer" />
            ) : (
              <>
                <div className="stat-val" style={{ fontSize: 17 }}>
                  {user.vehicleType || "Not set"}
                </div>
                <div className="stat-unit">Registered vehicle</div>
              </>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-label">🔢 Vehicle Number</div>
            {profileLoading ? (
              <div className="stat-shimmer" />
            ) : (
              <>
                <div
                  className="stat-val"
                  style={{ fontSize: 15, fontFamily: "monospace", letterSpacing: 1 }}
                >
                  {user.vehicleNumber || "—"}
                </div>
                <div className="stat-unit">Registration plate</div>
              </>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-label">📋 License Number</div>
            {profileLoading ? (
              <div className="stat-shimmer" />
            ) : (
              <>
                <div
                  className="stat-val"
                  style={{ fontSize: 14, fontFamily: "monospace", letterSpacing: 0.5 }}
                >
                  {user.licenseNumber || "—"}
                </div>
                <div className="stat-unit">Driving license</div>
              </>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-label">📦 Nearby Rides</div>
            <div className="stat-val">
              {!isActive ? "—" : loading ? "—" : rides.length}
            </div>
            <div className="stat-unit">
              {isActive ? "Within 3 km" : "Go online to see"}
            </div>
          </div>
        </div>

        {/* Location Bar */}
        <div className="loc-bar">
          <div className="loc-info">
            <div
              className={`loc-dot${
                !isActive
                  ? " offline"
                  : locationError
                  ? " err"
                  : driverLat == null
                  ? " loading"
                  : ""
              }`}
            />
            <div>
              {!isActive ? (
                <span style={{ color: "#999", fontSize: 13 }}>
                  You're offline — location tracking paused
                </span>
              ) : locationError ? (
                <span style={{ color: "#ef4444", fontSize: 13 }}>
                  {locationError}
                </span>
              ) : driverLat != null && driverLng != null ? (
                <>
                  <span style={{ fontWeight: 500 }}>Location active</span>
                  <span className="loc-coords" style={{ marginLeft: 8 }}>
                    {driverLat.toFixed(5)}, {driverLng.toFixed(5)}
                  </span>
                </>
              ) : (
                <span style={{ color: "#f59e0b" }}>Getting your location…</span>
              )}
            </div>
          </div>
          <button className="btn-refresh" onClick={fetchLocation}>
            ↻ Refresh
          </button>
        </div>

        {/* Rides Section */}
        <div className="section-head">
          <h2>Ride Requests</h2>
          <span>
            {isActive ? "— within 3 km radius" : "— go online to view"}
          </span>
          <div className="section-line" />
        </div>

        {/* Offline state */}
        {!isActive ? (
          <div className="offline-banner">
            <div className="off-icon">🌙</div>
            <h3>You're currently offline</h3>
            <p>
              Turn on the driver mode toggle above to start receiving ride
              requests from passengers nearby. You can go offline anytime.
            </p>
          </div>
        ) : loading && driverLat != null ? (
          <div className="rides-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skel-card">
                <div className="skel-line w80" />
                <div className="skel-line w60" />
                <div className="skel-line w40" style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : rides.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🛣️</div>
            <h3>No ride requests nearby</h3>
            <p>
              No pending rides within 3 km of your location.
              <br />
              Auto-refreshing every 10 seconds.
            </p>
          </div>
        ) : (
          <div className="rides-grid">
            {rides.map((ride) => (
              <div
                key={ride._id}
                className="ride-card"
                onClick={() => navigate(`/driver/ride/${ride._id}`)}
              >
                <div className="ride-route">
                  <div className="ride-dots">
                    <div className="ride-dot-pickup" />
                    <div className="ride-dot-line" />
                    <div className="ride-dot-drop" />
                  </div>
                  <div className="ride-addresses">
                    <div>
                      <div className="ride-addr-label">Pickup</div>
                      <div className="ride-addr-val">
                        {ride.pickupAddress ||
                          `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLng?.toFixed(4)}`}
                      </div>
                    </div>
                    <div>
                      <div className="ride-addr-label">Drop-off</div>
                      <div className="ride-addr-val">
                        {ride.dropAddress ||
                          `${ride.dropLat?.toFixed(4)}, ${ride.dropLng?.toFixed(4)}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ride-bottom">
                  <div className="ride-payout">
                    <span className="currency">₹</span>
                    {ride.driverPrice != null
                      ? ride.driverPrice
                      : ride.offeredPrice}
                  </div>
                  <div className="ride-vehicle-tag">
                    {vehicleIcon[ride.vehicleType] || "🚗"}{" "}
                    {ride.vehicleType || "Auto"}
                  </div>
                </div>

                <div className="ride-meta">
                  {ride.fullPrice &&
                    ride.fullPrice !== ride.offeredPrice && (
                      <span>Full: ₹{ride.fullPrice}</span>
                    )}
                  <span>
                    {ride.status?.charAt(0).toUpperCase() +
                      ride.status?.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        <strong>MetroSetu</strong> · Driver Portal
        <br />© {new Date().getFullYear()} MetroSetu
      </footer>
    </>
  );
}