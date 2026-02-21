/**
 * WalkingDirections.jsx
 * Route: /walking-directions
 *
 * Shows:
 *  - Google Map with live walking route
 *  - Journey summary (distance, duration, calories, steps)
 *  - Turn-by-turn walking directions with maneuver icons
 *  - Health & environment impact stats
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  GoogleMap,
  DirectionsRenderer,
  useLoadScript,
  Marker,
} from "@react-google-maps/api";

const libraries = ["places"];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --navy:   #0B1F3A;
    --navy2:  #102848;
    --accent: #1A6BFF;
    --gold:   #C8972A;
    --green:  #1A7A4A;
    --green2: #E0F5EB;
    --light:  #F4F6FA;
    --border: #D3D9E4;
    --text:   #1C2B3A;
    --muted:  #6B7B8F;
    --white:  #FFFFFF;
    --card-shadow: 0 2px 16px rgba(11,31,58,0.09);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .walk-page {
    font-family: 'DM Sans', sans-serif;
    background: var(--light);
    min-height: 100vh;
    color: var(--text);
  }

  /* ── Header ── */
  .walk-header {
    background: var(--navy);
    color: #fff;
    border-bottom: 4px solid var(--green);
  }
  .walk-header-inner {
    max-width: 1100px; margin: 0 auto;
    padding: 18px 32px;
    display: flex; align-items: center; gap: 18px;
  }
  .walk-crest {
    width: 52px; height: 52px;
    background: var(--green);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; flex-shrink: 0;
  }
  .walk-header-text h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem; line-height: 1.2;
  }
  .walk-header-text p {
    font-size: 0.75rem; color: #A8BCD4;
    text-transform: uppercase; letter-spacing: 0.12em; margin-top: 2px;
  }

  /* ── Breadcrumb ── */
  .walk-breadcrumb {
    background: var(--navy2);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .walk-breadcrumb-inner {
    max-width: 1100px; margin: 0 auto;
    padding: 10px 32px;
    font-size: 0.75rem; color: #7A9BBF; letter-spacing: 0.05em;
  }
  .walk-breadcrumb span { color: var(--green); font-weight: 600; }
  .walk-breadcrumb a { color: #7A9BBF; text-decoration: none; cursor: pointer; }
  .walk-breadcrumb a:hover { color: var(--green); }

  /* ── Content ── */
  .walk-content {
    max-width: 1100px; margin: 0 auto;
    padding: 36px 32px 60px;
  }

  .section-label {
    font-size: 0.68rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.15em;
    color: var(--muted); margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .section-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  .back-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px;
    background: var(--white); border: 1px solid var(--border); border-radius: 4px;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; color: var(--navy); transition: all 0.15s;
    margin-bottom: 24px;
  }
  .back-btn:hover { border-color: var(--green); color: var(--green); }

  /* ── Map Card ── */
  .card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: var(--card-shadow);
    overflow: hidden;
    margin-bottom: 14px;
  }
  .card-header {
    background: var(--navy); color: #fff;
    padding: 16px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .card-header h3 { font-family: 'DM Serif Display', serif; font-size: 1.1rem; }
  .card-header small { font-size: 0.68rem; color: #7A9BBF; text-transform: uppercase; letter-spacing: 0.1em; }

  /* ── Summary Bar ── */
  .summary-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    border-bottom: 1px solid var(--border);
  }
  .summary-item {
    padding: 16px 20px;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 4px;
  }
  .summary-item:last-child { border-right: none; }
  .s-label {
    font-size: 0.63rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted);
  }
  .s-value {
    font-family: 'DM Serif Display', serif;
    font-size: 1.3rem; color: var(--navy); line-height: 1.1;
  }
  .s-value.green { color: var(--green); }
  .s-unit { font-size: 0.7rem; color: var(--muted); }

  /* ── Step rows ── */
  .steps-list { padding: 0; }

  .step-row {
    display: flex; align-items: flex-start; gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
    position: relative;
  }
  .step-row:last-child { border-bottom: none; }
  .step-row:hover { background: #F7FAFA; }
  .step-row.start-step { background: #F0FFF7; }
  .step-row.end-step   { background: #EEF3FF; }

  /* connector line between steps */
  .step-row:not(:last-child) .step-number::after {
    content: '';
    position: absolute;
    left: 42px;
    top: 52px;
    width: 2px;
    height: calc(100% - 4px);
    background: var(--border);
    z-index: 0;
  }

  .step-number {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--green2);
    border: 2px solid var(--green);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.72rem; font-weight: 800; color: var(--green);
    flex-shrink: 0; position: relative; z-index: 1;
  }
  .step-number.start { background: var(--green); color: #fff; border-color: var(--green); font-size: 14px; }
  .step-number.end   { background: var(--accent); color: #fff; border-color: var(--accent); font-size: 14px; }

  .step-body { flex: 1; }

  .step-maneuver {
    font-size: 0.63rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--muted); margin-bottom: 3px;
    display: flex; align-items: center; gap: 6px;
  }
  .maneuver-icon { font-size: 0.9rem; }

  .step-instruction {
    font-size: 0.9rem; color: var(--text); line-height: 1.55;
    font-weight: 500;
  }
  .step-instruction b { color: var(--navy); }

  .step-meta {
    display: flex; gap: 12px;
    margin-top: 6px; font-size: 0.75rem; color: var(--muted);
  }
  .step-meta-item { display: flex; align-items: center; gap: 4px; }

  /* ── Health Impact Cards ── */
  .impact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }
  .impact-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 20px 22px;
    box-shadow: var(--card-shadow);
    display: flex; flex-direction: column; gap: 8px;
  }
  .impact-card.green-tint { border-left: 4px solid var(--green); background: #FAFFFE; }
  .impact-card.blue-tint  { border-left: 4px solid var(--accent); background: #FAFBFF; }
  .impact-card.gold-tint  { border-left: 4px solid var(--gold); background: #FFFDF5; }

  .impact-icon { font-size: 1.8rem; }
  .impact-label {
    font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted);
  }
  .impact-value {
    font-family: 'DM Serif Display', serif;
    font-size: 1.6rem; line-height: 1;
  }
  .impact-value.green { color: var(--green); }
  .impact-value.blue  { color: var(--accent); }
  .impact-value.gold  { color: var(--gold); }
  .impact-desc { font-size: 0.75rem; color: var(--muted); line-height: 1.4; }

  /* ── State boxes ── */
  .state-box {
    height: 400px; display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 12px; background: #F4F6FA;
    font-size: 0.88rem; color: var(--muted);
  }
  .state-icon { font-size: 2.5rem; }

  /* ── Progress bar (elevation preview) ── */
  .progress-track {
    height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;
    margin-top: 8px;
  }
  .progress-fill {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, var(--green), #5BC88A);
    transition: width 1s ease;
  }

  /* ── Footer ── */
  .walk-footer {
    background: var(--navy); color: #5A7A9F;
    text-align: center; padding: 20px 32px;
    font-size: 0.72rem; letter-spacing: 0.06em;
    border-top: 2px solid var(--green); margin-top: 20px;
  }

  @media (max-width: 700px) {
    .walk-content { padding: 24px 16px 40px; }
    .walk-header-inner { padding: 14px 16px; }
    .summary-bar { grid-template-columns: 1fr 1fr; }
    .impact-grid { grid-template-columns: 1fr 1fr; }
    .step-row { padding: 14px 16px; gap: 12px; }
    .step-row:not(:last-child) .step-number::after { left: 34px; }
  }
`;

/* ── Maneuver icon map ────────────────────────────────────────── */
const maneuverIcons = {
  "turn-left":           { icon: "↰", label: "Turn Left" },
  "turn-right":          { icon: "↱", label: "Turn Right" },
  "turn-slight-left":    { icon: "↖", label: "Slight Left" },
  "turn-slight-right":   { icon: "↗", label: "Slight Right" },
  "turn-sharp-left":     { icon: "⬅", label: "Sharp Left" },
  "turn-sharp-right":    { icon: "➡", label: "Sharp Right" },
  "uturn-left":          { icon: "↩", label: "U-Turn" },
  "uturn-right":         { icon: "↪", label: "U-Turn" },
  "straight":            { icon: "↑", label: "Go Straight" },
  "ramp-left":           { icon: "↰", label: "Take Ramp Left" },
  "ramp-right":          { icon: "↱", label: "Take Ramp Right" },
  "merge":               { icon: "⤵", label: "Merge" },
  "fork-left":           { icon: "⤷", label: "Keep Left" },
  "fork-right":          { icon: "⤶", label: "Keep Right" },
  "ferry":               { icon: "⛴", label: "Take Ferry" },
  "roundabout-left":     { icon: "↺", label: "Roundabout Left" },
  "roundabout-right":    { icon: "↻", label: "Roundabout Right" },
  default:               { icon: "•", label: "Continue" },
};

const getManeuver = (step) => {
  const m = step.maneuver || "default";
  return maneuverIcons[m] || maneuverIcons.default;
};

/* ── Strip HTML tags from instruction ────────────────────────── */
const stripHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

/* ── Calculate health stats ─────────────────────────────────── */
const calcHealth = (distanceMeters) => {
  const km = distanceMeters / 1000;
  const steps = Math.round(km * 1312);            // avg 1312 steps/km
  const calories = Math.round(km * 65);           // avg 65 kcal/km walking
  const co2Saved = (km * 0.21).toFixed(2);        // 210g CO2/km for avg car
  const minutesActive = Math.round(km * 12);      // avg 12 min/km walk
  return { km: km.toFixed(2), steps, calories, co2Saved, minutesActive };
};

/* ── Component ────────────────────────────────────────────────── */
const WalkingDirections = () => {
  const navigate = useNavigate();
  const [directions, setDirections] = useState(null);
  const [status, setStatus] = useState("loading");
  const [destAddress, setDestAddress] = useState("");

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyB-MVI3zWVrKWEvN-MbM7SFx5RSXYHXsHA",
    libraries,
  });

  useEffect(() => {
    if (!isLoaded) return;

    const origin = {
      lat: parseFloat(localStorage.getItem("userLat")),
      lng: parseFloat(localStorage.getItem("userLng")),
    };
    const destination = {
      lat: parseFloat(localStorage.getItem("nearestStationLat")),
    lng: parseFloat(localStorage.getItem("nearestStationLng")),
    };

    // fallback destination if not set — use a nearby landmark
    const dest = (destination.lat && destination.lng)
      ? destination
      : { lat: origin.lat + 0.005, lng: origin.lng + 0.005 };

    // Try to get destination address label
    const savedDest = localStorage.getItem("nearestStation");
    if (savedDest) setDestAddress(savedDest);

    if (!origin.lat || !origin.lng) {
      setStatus("error");
      return;
    }

    const ds = new window.google.maps.DirectionsService();
    ds.route(
      {
        origin,
        destination: dest,
        travelMode: window.google.maps.TravelMode.WALKING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        provideRouteAlternatives: false,
      },
      (result, stat) => {
        if (stat === "OK") {
          setDirections(result);
          setStatus("success");
          // Auto-set destination address from result if not already saved
          if (!savedDest) {
            setDestAddress(result.routes[0].legs[0].end_address.split(",")[0]);
          }
        } else {
          console.error("Walking directions error:", stat);
          setStatus("error");
        }
      }
    );
  }, [isLoaded]);

  const leg = directions?.routes?.[0]?.legs?.[0];
  const health = leg ? calcHealth(leg.distance.value) : null;

  /* ── Walking map style (light, minimal, pedestrian-friendly) ── */
  const mapStyles = [
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },
    { elementType: "geometry", stylers: [{ color: "#f0f4f0" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#e8ede8" }] },
    { featureType: "water", stylers: [{ color: "#b8d4c8" }] },
    { featureType: "landscape.natural", stylers: [{ color: "#daeada" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#c8e6c8" }] },
  ];

  /* ── Custom directions renderer options (green route) ── */
  const directionsOptions = {
    polylineOptions: {
      strokeColor: "#1A7A4A",
      strokeWeight: 5,
      strokeOpacity: 0.85,
    },
    suppressMarkers: false,
    markerOptions: {
      icon: {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      }
    }
  };

  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
  };

  return (
    <div className="walk-page">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="walk-header">
        <div className="walk-header-inner">
          <div className="walk-crest">🚶</div>
          <div className="walk-header-text">
            <h1>Walking Directions</h1>
            <p>Pedestrian Route Advisory · Urban Mobility System</p>
          </div>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <div className="walk-breadcrumb">
        <div className="walk-breadcrumb-inner">
          <a onClick={() => navigate("/")}>HOME</a> &nbsp;›&nbsp;
          <a onClick={() => navigate("/recommendation")}>RECOMMENDATION</a> &nbsp;›&nbsp;
          <span>WALKING DIRECTIONS</span>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="walk-content">
        <motion.div variants={containerVariants} initial="hidden" animate="show">

          <motion.div variants={itemVariants}>
            <button className="back-btn" onClick={() => navigate("/recommendation")}>
              ← Back to Recommendations
            </button>
          </motion.div>

          {/* ── Health & Impact Stats ── */}
          {health && (
            <>
              <motion.div variants={itemVariants}>
                <div className="section-label">Health & Environmental Impact</div>
              </motion.div>
              <motion.div variants={itemVariants} className="impact-grid">
                <div className="impact-card green-tint">
                  <div className="impact-icon">🔥</div>
                  <div className="impact-label">Calories Burned</div>
                  <div className="impact-value green">{health.calories}</div>
                  <div className="impact-desc">kcal for this walk</div>
                </div>
                <div className="impact-card green-tint">
                  <div className="impact-icon">👣</div>
                  <div className="impact-label">Steps</div>
                  <div className="impact-value green">{health.steps.toLocaleString()}</div>
                  <div className="impact-desc">
                    Approx. steps
                    <div className="progress-track" style={{ marginTop: "8px" }}>
                      <div className="progress-fill" style={{ width: `${Math.min((health.steps / 10000) * 100, 100)}%` }} />
                    </div>
                    <span style={{ fontSize: "0.68rem" }}>{Math.round((health.steps / 10000) * 100)}% of daily 10K goal</span>
                  </div>
                </div>
                <div className="impact-card blue-tint">
                  <div className="impact-icon">⏱</div>
                  <div className="impact-label">Active Minutes</div>
                  <div className="impact-value blue">{health.minutesActive}</div>
                  <div className="impact-desc">mins of moderate exercise</div>
                </div>
                <div className="impact-card gold-tint">
                  <div className="impact-icon">🌱</div>
                  <div className="impact-label">CO₂ Saved</div>
                  <div className="impact-value gold">{health.co2Saved} kg</div>
                  <div className="impact-desc">vs. driving the same distance</div>
                </div>
              </motion.div>
            </>
          )}

          {/* ── Map ── */}
          <motion.div variants={itemVariants}>
            <div className="section-label" style={{ marginTop: health ? "8px" : "0" }}>Live Walking Map</div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="card">
              <div className="card-header">
                <h3>Pedestrian Route</h3>
                <small>
                  {leg
                    ? `${leg.distance.text} · ${leg.duration.text}`
                    : "Calculating..."}
                </small>
              </div>

              {/* Map */}
              {loadError ? (
                <div className="state-box">
                  <div className="state-icon">⚠️</div>
                  <div>Failed to load Google Maps. Check API key.</div>
                </div>
              ) : !isLoaded ? (
                <div className="state-box">
                  <div className="state-icon">🗺</div>
                  <div>Loading map...</div>
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "460px" }}
                  zoom={15}
                  center={{
                    lat: parseFloat(localStorage.getItem("userLat")) || 18.5204,
                    lng: parseFloat(localStorage.getItem("userLng")) || 73.8567,
                  }}
                  options={{
                    streetViewControl: true,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    zoomControl: true,
                    styles: mapStyles,
                  }}
                >
                  {directions && (
                    <DirectionsRenderer
                      directions={directions}
                      options={directionsOptions}
                    />
                  )}
                </GoogleMap>
              )}

              {/* Summary Bar */}
              {leg && (
                <div className="summary-bar">
                  <div className="summary-item">
                    <div className="s-label">📏 Distance</div>
                    <div className="s-value">{leg.distance.text}</div>
                    <div className="s-unit">Walking distance</div>
                  </div>
                  <div className="summary-item">
                    <div className="s-label">⏱ Duration</div>
                    <div className="s-value">{leg.duration.text}</div>
                    <div className="s-unit">Estimated time</div>
                  </div>
                  <div className="summary-item">
                    <div className="s-label">📍 From</div>
                    <div className="s-value" style={{ fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, paddingTop: "4px" }}>
                      {leg.start_address.split(",")[0]}
                    </div>
                    <div className="s-unit">Your location</div>
                  </div>
                  <div className="summary-item">
                    <div className="s-label">🏁 To</div>
                    <div className="s-value" style={{ fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, paddingTop: "4px" }}>
                      {destAddress || leg.end_address.split(",")[0]}
                    </div>
                    <div className="s-unit">Destination</div>
                  </div>
                  <div className="summary-item">
                    <div className="s-label">💰 Cost</div>
                    <div className="s-value green">₹0</div>
                    <div className="s-unit">Zero cost</div>
                  </div>
                  <div className="summary-item">
                    <div className="s-label">🌱 Emissions</div>
                    <div className="s-value green">Zero</div>
                    <div className="s-unit">Carbon footprint</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Step-by-step Directions ── */}
          {status === "loading" && (
            <motion.div variants={itemVariants}>
              <div className="card" style={{ marginTop: "14px" }}>
                <div className="card-header"><h3>Fetching route...</h3></div>
                <div className="state-box" style={{ height: "200px" }}>
                  <div className="state-icon">⏳</div>
                  <div>Calculating walking directions...</div>
                </div>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div variants={itemVariants}>
              <div className="card" style={{ marginTop: "14px" }}>
                <div className="card-header"><h3>Route Unavailable</h3></div>
                <div className="state-box" style={{ height: "200px" }}>
                  <div className="state-icon">😞</div>
                  <div>Could not fetch walking route. Your destination may not be set.</div>
                </div>
              </div>
            </motion.div>
          )}

          {status === "success" && leg && (
            <>
              <motion.div variants={itemVariants}>
                <div className="section-label" style={{ marginTop: "24px" }}>Turn-by-Turn Directions</div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="card">
                  <div className="card-header">
                    <h3>🚶 Walking Route — Step by Step</h3>
                    <small>{leg.steps.length} steps · {leg.duration.text}</small>
                  </div>

                  <div className="steps-list">
                    {/* Start marker */}
                    <div className="step-row start-step">
                      <div className="step-number start">📍</div>
                      <div className="step-body">
                        <div className="step-maneuver">
                          <span style={{ color: "var(--green)", fontWeight: 800, textTransform: "uppercase", fontSize: "0.72rem" }}>
                            Start Point
                          </span>
                        </div>
                        <div className="step-instruction">
                          <b>{leg.start_address.split(",")[0]}</b>
                        </div>
                        <div className="step-meta">
                          <span className="step-meta-item">📍 Your current location</span>
                        </div>
                      </div>
                    </div>

                    {/* Walking steps */}
                    {leg.steps.map((step, index) => {
                      const maneuver = getManeuver(step);
                      const cleanInstruction = stripHtml(step.instructions);

                      return (
                        <div className="step-row" key={index}>
                          <div className="step-number">{index + 1}</div>
                          <div className="step-body">
                            <div className="step-maneuver">
                              <span className="maneuver-icon">{maneuver.icon}</span>
                              <span>{maneuver.label}</span>
                            </div>
                            <div
                              className="step-instruction"
                              dangerouslySetInnerHTML={{ __html: step.instructions }}
                            />
                            <div className="step-meta">
                              <span className="step-meta-item">📏 {step.distance.text}</span>
                              <span className="step-meta-item">⏱ {step.duration.text}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* End marker */}
                    <div className="step-row end-step">
                      <div className="step-number end">🏁</div>
                      <div className="step-body">
                        <div className="step-maneuver">
                          <span style={{ color: "var(--accent)", fontWeight: 800, textTransform: "uppercase", fontSize: "0.72rem" }}>
                            You have arrived
                          </span>
                        </div>
                        <div className="step-instruction">
                          <b>{destAddress || leg.end_address.split(",")[0]}</b>
                        </div>
                        <div className="step-meta">
                          <span className="step-meta-item" style={{ color: "var(--green)", fontWeight: 600 }}>
                            ✅ Destination reached
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Walking Tips Card ── */}
              <motion.div variants={itemVariants} style={{ marginTop: "14px" }}>
                <div className="card">
                  <div className="card-header">
                    <h3>🧭 Walking Safety Tips</h3>
                    <small>For this route</small>
                  </div>
                  <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                    {[
                      { icon: "☀️", tip: "Check weather before stepping out. Carry water if temperature is above 30°C." },
                      { icon: "🚦", tip: "Use pedestrian crossings and overpasses where available. Do not jaywalk." },
                      { icon: "📱", tip: "Keep your phone charged and share your live location with a contact." },
                      { icon: "👁", tip: "Stay alert and avoid using headphones in both ears on busy roads." },
                      { icon: "🌙", tip: "If walking after dark, stick to well-lit streets and avoid isolated lanes." },
                      { icon: "🎒", tip: "Wear comfortable footwear. Carry minimal luggage for a comfortable walk." },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{item.icon}</span>
                        <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5 }}>{item.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* ── Action buttons ── */}
          <motion.div variants={itemVariants} style={{ marginTop: "14px" }}>
            <div style={{
              background: "var(--white)", border: "1px solid var(--border)",
              borderRadius: "4px", padding: "18px 24px",
              display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center",
              boxShadow: "var(--card-shadow)",
            }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginRight: "8px" }}>
                Other Options
              </span>
              <button
                style={{ padding: "10px 20px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: "4px", fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                onClick={() => navigate("/pmpml-transit")}
              >
                🚌 Take PMPML Bus Instead
              </button>
              <button
                style={{ padding: "10px 20px", background: "var(--white)", color: "var(--navy)", border: "1px solid var(--border)", borderRadius: "4px", fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                onClick={() => window.open("https://rapido.bike", "_blank")}
              >
                🛺 Book Auto on Rapido ↗
              </button>
              <button
                style={{ padding: "10px 20px", background: "var(--white)", color: "var(--navy)", border: "1px solid var(--border)", borderRadius: "4px", fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                onClick={() => navigate("/recommendation")}
              >
                ← All Modes
              </button>
            </div>
          </motion.div>

        </motion.div>
      </main>

      <footer className="walk-footer">
        URBAN MOBILITY INTELLIGENCE SYSTEM · PEDESTRIAN ADVISORY · GOVT. OF INDIA
      </footer>
    </div>
  );
};

export default WalkingDirections;