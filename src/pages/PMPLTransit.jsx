/**
 * PMPLTransit.jsx
 * Route: /pmpml-transit
 *
 * Shows:
 *  - Google Map with live transit directions (PMPML bus)
 *  - Step-by-step route: walk segments + bus number + boarding/alighting stops
 *  - Journey summary (distance, duration, cost)
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  GoogleMap,
  DirectionsRenderer,
  useLoadScript,
} from "@react-google-maps/api";

const libraries = ["places"];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root {
    --navy:#0B1F3A; --navy2:#102848; --accent:#1A6BFF; --gold:#C8972A;
    --light:#F4F6FA; --border:#D3D9E4; --text:#1C2B3A; --muted:#6B7B8F;
    --white:#FFFFFF; --card-shadow:0 2px 16px rgba(11,31,58,0.09);
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'DM Sans',sans-serif; background:var(--light); color:var(--text); }

  .gov-page { font-family:'DM Sans',sans-serif; background:var(--light); min-height:100vh; }
  .gov-header { background:var(--navy); color:#fff; border-bottom:4px solid var(--gold); }
  .gov-header-inner { max-width:1100px; margin:0 auto; padding:18px 32px; display:flex; align-items:center; gap:18px; }
  .gov-crest { width:52px;height:52px;background:var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0; }
  .gov-header-text h1 { font-family:'DM Serif Display',serif; font-size:1.5rem; }
  .gov-header-text p { font-size:0.75rem; color:#A8BCD4; text-transform:uppercase; letter-spacing:0.12em; margin-top:2px; }

  .gov-breadcrumb { background:var(--navy2); border-bottom:1px solid rgba(255,255,255,0.06); }
  .gov-breadcrumb-inner { max-width:1100px;margin:0 auto;padding:10px 32px;font-size:0.75rem;color:#7A9BBF;letter-spacing:0.05em; }
  .gov-breadcrumb span { color:var(--gold);font-weight:600; }
  .gov-breadcrumb a { color:#7A9BBF; text-decoration:none; cursor:pointer; }
  .gov-breadcrumb a:hover { color:var(--gold); }

  .gov-content { max-width:1100px; margin:0 auto; padding:36px 32px 60px; }
  .gov-section-label {
    font-size:0.68rem;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;
    color:var(--muted);margin-bottom:16px;display:flex;align-items:center;gap:10px;
  }
  .gov-section-label::after { content:'';flex:1;height:1px;background:var(--border); }

  .card { background:var(--white);border:1px solid var(--border);border-radius:6px;box-shadow:var(--card-shadow);overflow:hidden;margin-bottom:14px; }
  .card-header { background:var(--navy);color:#fff;padding:16px 24px;display:flex;align-items:center;justify-content:space-between; }
  .card-header h3 { font-family:'DM Serif Display',serif;font-size:1.1rem; }
  .card-header small { font-size:0.68rem;color:#7A9BBF;text-transform:uppercase;letter-spacing:0.1em; }

  /* Summary bar */
  .summary-bar {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
    gap:0; border-bottom:1px solid var(--border);
  }
  .summary-item { padding:16px 20px; border-right:1px solid var(--border); }
  .summary-item:last-child { border-right:none; }
  .summary-item .s-label { font-size:0.63rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);margin-bottom:6px; }
  .summary-item .s-value { font-family:'DM Serif Display',serif;font-size:1.3rem;color:var(--navy); }
  .summary-item .s-unit { font-size:0.7rem;color:var(--muted);margin-top:2px; }

  /* Steps */
  .step-row {
    display:flex; align-items:flex-start; gap:14px;
    padding:16px 24px; border-bottom:1px solid var(--border);
    transition:background 0.15s;
  }
  .step-row:last-child { border-bottom:none; }
  .step-row:hover { background:#F7F9FC; }
  .step-row.transit-step { background:#F0F5FF; }
  .step-icon {
    width:36px;height:36px;border-radius:50%;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;font-size:15px;
    background:#EEF3FF;
  }
  .step-icon.bus { background:var(--accent);color:#fff; }
  .step-mode-label { font-size:0.63rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px; }
  .step-mode-label.walking { color:var(--muted); }
  .step-mode-label.transit { color:var(--accent); }
  .step-instruction { font-size:0.88rem;color:var(--text);line-height:1.5; }
  .step-meta { font-size:0.75rem;color:var(--muted);margin-top:4px; }
  .bus-chip {
    display:inline-flex;align-items:center;gap:5px;
    background:var(--accent);color:#fff;
    font-size:0.72rem;font-weight:700;
    padding:3px 10px;border-radius:3px;
    margin:4px 0;
  }
  .stop-info { font-size:0.78rem;color:var(--navy);font-weight:600;margin-top:4px; }

  /* Back btn */
  .back-btn {
    display:inline-flex;align-items:center;gap:8px;
    padding:10px 20px;background:var(--white);
    border:1px solid var(--border);border-radius:4px;
    font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:600;
    cursor:pointer;color:var(--navy);transition:all 0.15s;margin-bottom:20px;
  }
  .back-btn:hover { border-color:var(--accent);color:var(--accent); }

  /* Loading/Error states */
  .state-box {
    height:400px;display:flex;align-items:center;justify-content:center;
    flex-direction:column;gap:12px;background:#F4F6FA;
    font-size:0.88rem;color:var(--muted);
  }
  .state-box .state-icon { font-size:2rem; }

  .gov-footer { background:var(--navy);color:#5A7A9F;text-align:center;padding:20px 32px;font-size:0.72rem;letter-spacing:0.06em;border-top:2px solid var(--gold); }

  @media(max-width:700px){
    .gov-content{padding:24px 16px 40px;}
    .gov-header-inner{padding:14px 16px;}
    .summary-bar{grid-template-columns:1fr 1fr;}
  }
`;

const PMPLTransit = () => {
  const navigate = useNavigate();
  const [directions, setDirections] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | success | error

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

    if (!origin.lat || !origin.lng) {
      setStatus("error");
      return;
    }

    const ds = new window.google.maps.DirectionsService();
    ds.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.TRANSIT,
        transitOptions: {
          modes: ["BUS"],
          routingPreference: "FEWER_TRANSFERS",
        },
      },
      (result, stat) => {
        if (stat === "OK") {
          setDirections(result);
          setStatus("success");
        } else {
          console.error("Directions error:", stat);
          setStatus("error");
        }
      }
    );
  }, [isLoaded]);

  // Extract structured step data for detailed rendering
  const renderStepDetail = (step, index, total) => {
    const isTransit = step.travel_mode === "TRANSIT";
    const transit = step.transit;

    return (
      <div
        key={index}
        className={`step-row${isTransit ? " transit-step" : ""}`}
      >
        <div className={`step-icon${isTransit ? " bus" : ""}`}>
          {isTransit ? "🚌" : "🚶"}
        </div>
        <div style={{ flex: 1 }}>
          <div className={`step-mode-label${isTransit ? " transit" : " walking"}`}>
            {isTransit ? "Take Bus" : "Walk"}
          </div>

          {isTransit && transit ? (
            <>
              <div className="bus-chip">
                🚌 {transit.line?.short_name || transit.line?.name || "Bus"}
                &nbsp;—&nbsp;{transit.line?.vehicle?.name || "PMPML"}
              </div>
              <div className="stop-info">
                Board: <strong>{transit.departure_stop?.name}</strong>
              </div>
              <div className="stop-info">
                Alight: <strong>{transit.arrival_stop?.name}</strong>
              </div>
              {transit.num_stops && (
                <div className="step-meta">{transit.num_stops} stops</div>
              )}
            </>
          ) : (
            <div
              className="step-instruction"
              dangerouslySetInnerHTML={{ __html: step.instructions }}
            />
          )}

          <div className="step-meta">
            {step.distance?.text} · {step.duration?.text}
          </div>
        </div>
      </div>
    );
  };

  const leg = directions?.routes?.[0]?.legs?.[0];

  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } } };

  return (
    <div className="gov-page">
      <style>{styles}</style>

      <header className="gov-header">
        <div className="gov-header-inner">
          <div className="gov-crest">🚌</div>
          <div className="gov-header-text">
            <h1>PMPML Transit Route</h1>
            <p>Pune Mahanagar Parivahan Mahamandal Ltd · Live Directions</p>
          </div>
        </div>
      </header>

      <div className="gov-breadcrumb">
        <div className="gov-breadcrumb-inner">
          <a onClick={() => navigate("/")}>HOME</a> &nbsp;›&nbsp;{" "}
          <a onClick={() => navigate("/recommendation")}>RECOMMENDATION</a> &nbsp;›&nbsp;{" "}
          <span>PMPML TRANSIT MAP</span>
        </div>
      </div>

      <main className="gov-content">
        <motion.div variants={containerVariants} initial="hidden" animate="show">

          <motion.div variants={itemVariants}>
            <button className="back-btn" onClick={() => navigate("/recommendation")}>
              ← Back to Recommendations
            </button>
          </motion.div>

          {/* Map Section */}
          <motion.div variants={itemVariants}>
            <div className="gov-section-label">Live Transit Map</div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="card">
              <div className="card-header">
                <h3>Route to Nearest Metro / Bus Stop</h3>
                <small>PMPML · Live Directions</small>
              </div>

              {loadError ? (
                <div className="state-box">
                  <div className="state-icon">⚠️</div>
                  <div>Failed to load Google Maps. Check your API key.</div>
                </div>
              ) : !isLoaded ? (
                <div className="state-box">
                  <div className="state-icon">🗺</div>
                  <div>Loading map...</div>
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "480px" }}
                  zoom={13}
                  center={{
                    lat: parseFloat(localStorage.getItem("userLat")) || 18.5204,
                    lng: parseFloat(localStorage.getItem("userLng")) || 73.8567,
                  }}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    styles: [
                      { featureType: "poi", stylers: [{ visibility: "off" }] },
                      { elementType: "geometry", stylers: [{ color: "#f0f4f8" }] },
                      { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                      { featureType: "water", stylers: [{ color: "#c8d8e8" }] },
                    ],
                  }}
                >
                  {directions && <DirectionsRenderer directions={directions} />}
                </GoogleMap>
              )}

              {/* Journey Summary Bar */}
              {leg && (
                <div className="summary-bar">
                  <div className="summary-item">
                    <div className="s-label">Total Distance</div>
                    <div className="s-value">{leg.distance?.text}</div>
                    <div className="s-unit">End-to-end</div>
                  </div>
                  <div className="summary-item">
                    <div className="s-label">Est. Duration</div>
                    <div className="s-value">{leg.duration?.text}</div>
                    <div className="s-unit">Including wait time</div>
                  </div>
                  <div className="summary-item">
                    <div className="s-label">From</div>
                    <div className="s-value" style={{ fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif", marginTop: "4px" }}>
                      {leg.start_address?.split(",")[0]}
                    </div>
                    <div className="s-unit">Your location</div>
                  </div>
                  <div className="summary-item">
                    <div className="s-label">To</div>
                    <div className="s-value" style={{ fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif", marginTop: "4px" }}>
                      {leg.end_address?.split(",")[0]}
                    </div>
                    <div className="s-unit">Destination stop</div>
                  </div>
                  <div className="summary-item">
                    <div className="s-label">Est. Fare</div>
                    <div className="s-value">₹10–20</div>
                    <div className="s-unit">PMPML standard</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Step-by-step */}
          {status === "loading" && (
            <motion.div variants={itemVariants}>
              <div className="card">
                <div className="card-header"><h3>Loading route...</h3></div>
                <div className="state-box"><div className="state-icon">⏳</div><div>Fetching live bus directions...</div></div>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div variants={itemVariants}>
              <div className="card">
                <div className="card-header"><h3>Route Unavailable</h3></div>
                <div className="state-box">
                  <div className="state-icon">😞</div>
                  <div>Could not fetch transit route. Location may be missing or no bus route found.</div>
                </div>
              </div>
            </motion.div>
          )}

          {status === "success" && leg && (
            <motion.div variants={itemVariants}>
              <div className="gov-section-label" style={{ marginTop: "24px" }}>Step-by-Step Directions</div>
              <div className="card">
                <div className="card-header">
                  <h3>🚌 PMPML Route — Detailed Steps</h3>
                  <small>{leg.duration?.text} · {leg.distance?.text}</small>
                </div>
                {leg.steps.map((step, i) => renderStepDetail(step, i, leg.steps.length))}
              </div>
            </motion.div>
          )}

        </motion.div>
      </main>

      <footer className="gov-footer">
        URBAN MOBILITY INTELLIGENCE SYSTEM · PMPML TRANSIT ADVISORY · GOVT. OF INDIA
      </footer>
    </div>
  );
};

export default PMPLTransit;