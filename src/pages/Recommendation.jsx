// // import { useNavigate } from "react-router-dom";
// // import { getSmartRecommendation } from "../utils/smartWalkingEngine";
// // import { getModeComparison } from "../utils/modeCalculator";
// // import { motion } from "framer-motion";
// // import { useEffect, useState } from "react";
// // import axios from "axios";
// // import {
// //   GoogleMap,
// //   DirectionsRenderer,
// //   useLoadScript
// // } from "@react-google-maps/api";

// // const libraries = ["places"];

// // /* ─── Inline Styles ─────────────────────────────────────────── */
// // const styles = `
// //   @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

// //   :root {
// //     --navy:   #0B1F3A;
// //     --navy2:  #102848;
// //     --accent: #1A6BFF;
// //     --gold:   #C8972A;
// //     --light:  #F4F6FA;
// //     --border: #D3D9E4;
// //     --text:   #1C2B3A;
// //     --muted:  #6B7B8F;
// //     --white:  #FFFFFF;
// //     --danger: #C0392B;
// //     --success:#1A7A4A;
// //     --card-shadow: 0 2px 16px rgba(11,31,58,0.09);
// //   }

// //   * { box-sizing: border-box; margin: 0; padding: 0; }

// //   .gov-page {
// //     font-family: 'DM Sans', sans-serif;
// //     background: var(--light);
// //     min-height: 100vh;
// //     color: var(--text);
// //   }

// //   /* ── Header Banner ── */
// //   .gov-header {
// //     background: var(--navy);
// //     color: var(--white);
// //     padding: 0;
// //     border-bottom: 4px solid var(--gold);
// //   }

// //   .gov-header-inner {
// //     max-width: 1100px;
// //     margin: 0 auto;
// //     padding: 18px 32px;
// //     display: flex;
// //     align-items: center;
// //     gap: 18px;
// //   }

// //   .gov-crest {
// //     width: 52px;
// //     height: 52px;
// //     background: var(--gold);
// //     border-radius: 50%;
// //     display: flex;
// //     align-items: center;
// //     justify-content: center;
// //     font-size: 24px;
// //     flex-shrink: 0;
// //   }

// //   .gov-header-text h1 {
// //     font-family: 'DM Serif Display', serif;
// //     font-size: 1.5rem;
// //     letter-spacing: 0.01em;
// //     line-height: 1.2;
// //   }

// //   .gov-header-text p {
// //     font-size: 0.75rem;
// //     color: #A8BCD4;
// //     text-transform: uppercase;
// //     letter-spacing: 0.12em;
// //     margin-top: 2px;
// //   }

// //   /* ── Breadcrumb ── */
// //   .gov-breadcrumb {
// //     background: var(--navy2);
// //     border-bottom: 1px solid rgba(255,255,255,0.06);
// //   }

// //   .gov-breadcrumb-inner {
// //     max-width: 1100px;
// //     margin: 0 auto;
// //     padding: 10px 32px;
// //     font-size: 0.75rem;
// //     color: #7A9BBF;
// //     letter-spacing: 0.05em;
// //   }

// //   .gov-breadcrumb span {
// //     color: var(--gold);
// //     font-weight: 600;
// //   }

// //   /* ── Main Content ── */
// //   .gov-content {
// //     max-width: 1100px;
// //     margin: 0 auto;
// //     padding: 36px 32px 60px;
// //   }

// //   .gov-section-label {
// //     font-size: 0.68rem;
// //     font-weight: 600;
// //     text-transform: uppercase;
// //     letter-spacing: 0.15em;
// //     color: var(--muted);
// //     margin-bottom: 16px;
// //     display: flex;
// //     align-items: center;
// //     gap: 10px;
// //   }

// //   .gov-section-label::after {
// //     content: '';
// //     flex: 1;
// //     height: 1px;
// //     background: var(--border);
// //   }

// //   /* ── Recommendation Alert Card ── */
// //   .rec-alert {
// //     background: var(--white);
// //     border: 1px solid var(--border);
// //     border-left: 5px solid var(--accent);
// //     border-radius: 4px;
// //     padding: 28px 32px;
// //     margin-bottom: 10px;
// //     box-shadow: var(--card-shadow);
// //     display: flex;
// //     gap: 24px;
// //     align-items: flex-start;
// //   }

// //   .rec-alert-icon {
// //     width: 52px;
// //     height: 52px;
// //     background: #EBF0FF;
// //     border-radius: 50%;
// //     display: flex;
// //     align-items: center;
// //     justify-content: center;
// //     font-size: 24px;
// //     flex-shrink: 0;
// //   }

// //   .rec-alert-body h2 {
// //     font-family: 'DM Serif Display', serif;
// //     font-size: 1.6rem;
// //     color: var(--navy);
// //     margin-bottom: 6px;
// //   }

// //   .rec-alert-body p {
// //     font-size: 0.95rem;
// //     color: var(--muted);
// //     line-height: 1.6;
// //     max-width: 600px;
// //   }

// //   .rec-badge {
// //     display: inline-block;
// //     background: var(--accent);
// //     color: var(--white);
// //     font-size: 0.65rem;
// //     font-weight: 700;
// //     text-transform: uppercase;
// //     letter-spacing: 0.12em;
// //     padding: 3px 10px;
// //     border-radius: 2px;
// //     margin-bottom: 10px;
// //   }

// //   /* ── Metrics Grid ── */
// //   .metrics-grid {
// //     display: grid;
// //     grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
// //     gap: 12px;
// //     margin-bottom: 10px;
// //   }

// //   .metric-card {
// //     background: var(--white);
// //     border: 1px solid var(--border);
// //     border-radius: 4px;
// //     padding: 18px 20px;
// //     box-shadow: var(--card-shadow);
// //   }

// //   .metric-card .metric-label {
// //     font-size: 0.65rem;
// //     font-weight: 600;
// //     text-transform: uppercase;
// //     letter-spacing: 0.12em;
// //     color: var(--muted);
// //     margin-bottom: 8px;
// //     display: flex;
// //     align-items: center;
// //     gap: 6px;
// //   }

// //   .metric-card .metric-value {
// //     font-family: 'DM Serif Display', serif;
// //     font-size: 1.5rem;
// //     color: var(--navy);
// //     line-height: 1;
// //   }

// //   .metric-card .metric-unit {
// //     font-size: 0.7rem;
// //     color: var(--muted);
// //     margin-top: 4px;
// //     font-family: 'DM Sans', sans-serif;
// //     font-weight: 400;
// //   }

// //   .metric-loading {
// //     height: 28px;
// //     background: linear-gradient(90deg, #e8edf4 25%, #d8dfe9 50%, #e8edf4 75%);
// //     background-size: 200% 100%;
// //     animation: shimmer 1.5s infinite;
// //     border-radius: 3px;
// //     width: 70%;
// //   }

// //   @keyframes shimmer {
// //     0% { background-position: 200% 0; }
// //     100% { background-position: -200% 0; }
// //   }

// //   /* ── Comparison Table ── */
// //   .comparison-card {
// //     background: var(--white);
// //     border: 1px solid var(--border);
// //     border-radius: 4px;
// //     box-shadow: var(--card-shadow);
// //     overflow: hidden;
// //     margin-bottom: 10px;
// //   }

// //   .comparison-card-header {
// //     background: var(--navy);
// //     color: var(--white);
// //     padding: 16px 24px;
// //     display: flex;
// //     align-items: center;
// //     justify-content: space-between;
// //   }

// //   .comparison-card-header h3 {
// //     font-family: 'DM Serif Display', serif;
// //     font-size: 1.1rem;
// //     letter-spacing: 0.01em;
// //   }

// //   .comparison-card-header small {
// //     font-size: 0.68rem;
// //     color: #7A9BBF;
// //     text-transform: uppercase;
// //     letter-spacing: 0.1em;
// //   }

// //   .gov-table {
// //     width: 100%;
// //     border-collapse: collapse;
// //     font-size: 0.88rem;
// //   }

// //   .gov-table thead tr {
// //     border-bottom: 2px solid var(--border);
// //   }

// //   .gov-table thead th {
// //     padding: 14px 20px;
// //     text-align: left;
// //     font-size: 0.65rem;
// //     font-weight: 700;
// //     text-transform: uppercase;
// //     letter-spacing: 0.12em;
// //     color: var(--muted);
// //     background: #F9FAFC;
// //   }

// //   .gov-table tbody tr {
// //     border-bottom: 1px solid var(--border);
// //     transition: background 0.15s;
// //   }

// //   .gov-table tbody tr:last-child {
// //     border-bottom: none;
// //   }

// //   .gov-table tbody tr:hover {
// //     background: #F4F6FB;
// //   }

// //   .gov-table tbody tr.recommended {
// //     background: #EEF3FF;
// //     border-left: 3px solid var(--accent);
// //   }

// //   .gov-table tbody tr.recommended td {
// //     font-weight: 600;
// //     color: var(--navy);
// //   }

// //   .gov-table td {
// //     padding: 14px 20px;
// //     color: var(--text);
// //   }

// //   .mode-chip {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 6px;
// //     font-weight: 600;
// //   }

// //   .rec-tag {
// //     background: var(--accent);
// //     color: #fff;
// //     font-size: 0.6rem;
// //     font-weight: 700;
// //     text-transform: uppercase;
// //     letter-spacing: 0.1em;
// //     padding: 2px 7px;
// //     border-radius: 2px;
// //     vertical-align: middle;
// //     margin-left: 6px;
// //   }

// //   /* ── Action Bar ── */
// //   .action-bar {
// //     background: var(--white);
// //     border: 1px solid var(--border);
// //     border-radius: 4px;
// //     padding: 20px 24px;
// //     display: flex;
// //     gap: 12px;
// //     flex-wrap: wrap;
// //     align-items: center;
// //     box-shadow: var(--card-shadow);
// //   }

// //   .action-bar-label {
// //     font-size: 0.7rem;
// //     font-weight: 700;
// //     text-transform: uppercase;
// //     letter-spacing: 0.12em;
// //     color: var(--muted);
// //     margin-right: 8px;
// //   }

// //   .gov-btn {
// //     display: inline-flex;
// //     align-items: center;
// //     gap: 8px;
// //     padding: 11px 22px;
// //     border-radius: 3px;
// //     font-family: 'DM Sans', sans-serif;
// //     font-size: 0.82rem;
// //     font-weight: 600;
// //     cursor: pointer;
// //     border: 1px solid transparent;
// //     text-decoration: none;
// //     transition: all 0.18s;
// //     letter-spacing: 0.02em;
// //   }

// //   .gov-btn-primary {
// //     background: var(--navy);
// //     color: var(--white);
// //     border-color: var(--navy);
// //   }

// //   .gov-btn-primary:hover {
// //     background: #0d2a55;
// //     box-shadow: 0 4px 12px rgba(11,31,58,0.18);
// //     transform: translateY(-1px);
// //   }

// //   .gov-btn-secondary {
// //     background: var(--white);
// //     color: var(--navy);
// //     border-color: var(--border);
// //   }

// //   .gov-btn-secondary:hover {
// //     border-color: var(--accent);
// //     color: var(--accent);
// //     transform: translateY(-1px);
// //   }

// //   .gov-btn-danger {
// //     background: var(--danger);
// //     color: var(--white);
// //     border-color: var(--danger);
// //   }

// //   .gov-btn-danger:hover {
// //     background: #a93226;
// //     box-shadow: 0 4px 12px rgba(192,57,43,0.22);
// //     transform: translateY(-1px);
// //   }

// //   /* ── Footer ── */
// //   .gov-footer {
// //     background: var(--navy);
// //     color: #5A7A9F;
// //     text-align: center;
// //     padding: 20px 32px;
// //     font-size: 0.72rem;
// //     letter-spacing: 0.06em;
// //     border-top: 2px solid var(--gold);
// //     margin-top: 20px;
// //   }

// //   @media (max-width: 700px) {
// //     .gov-content { padding: 24px 16px 40px; }
// //     .gov-header-inner { padding: 14px 16px; }
// //     .rec-alert { flex-direction: column; }
// //     .metrics-grid { grid-template-columns: 1fr 1fr; }
// //     .action-bar { flex-direction: column; align-items: flex-start; }
// //     .gov-table thead th:nth-child(n+3),
// //     .gov-table td:nth-child(n+3) { display: none; }
// //   }
// // `;

// // const modeIcons = {
// //   Walking: "🚶",
// //   Cycling: "🚲",
// //   Bus: "🚌",
// //   Auto: "🛺",
// //   "E-Rickshaw": "⚡",
// //   Metro: "🚇",
// //   Cab: "🚕",
// // };

// // const Recommendation = () => {
// //   const navigate = useNavigate();
// //   const distance = parseFloat(localStorage.getItem("distance")) || 0.8;
// //   const hour = new Date().getHours();
// //   const [weather, setWeather] = useState(null);
// //   const [aqi, setAqi] = useState(null);
// //   const [busStop, setBusStop] = useState(null);
// //   const [directions, setDirections] = useState(null);

// //   const { isLoaded } = useLoadScript({
// //     googleMapsApiKey: "AIzaSyB-MVI3zWVrKWEvN-MbM7SFx5RSXYHXsHA",
// //     libraries,
// //   });

// //   // Transit route to nearest metro/bus stop
// //   useEffect(() => {
// //     if (!isLoaded) return;

// //     const origin = {
// //       lat: parseFloat(localStorage.getItem("userLat")),
// //       lng: parseFloat(localStorage.getItem("userLng"))
// //     };

// //     // TEMP TEST (Hardcoded Metro - Swargate)
// //     const destination = {
// //       lat: 18.5010,
// //       lng: 73.8620
// //     };

// //     if (!origin.lat || !origin.lng) {
// //       console.log("Origin missing");
// //       return;
// //     }

// //     const directionsService = new window.google.maps.DirectionsService();

// //     directionsService.route(
// //       {
// //         origin: origin,
// //         destination: destination,
// //         travelMode: window.google.maps.TravelMode.TRANSIT,
// //         transitOptions: {
// //           modes: ["BUS"],
// //           routingPreference: "FEWER_TRANSFERS"
// //         }
// //       },
// //       (result, status) => {
// //         if (status === "OK") {
// //           console.log("Transit Result:", result);
// //           setDirections(result);
// //         } else {
// //           console.log("Transit Error:", status);
// //         }
// //       }
// //     );
// //   }, [isLoaded]);

// //   useEffect(() => {
// //     const fetchData = async () => {
// //       const lat = localStorage.getItem("userLat");
// //       const lng = localStorage.getItem("userLng");
// //       if (!lat || !lng) return;

// //       // Weather + AQI
// //       const weatherRes = await axios.get(
// //         `http://localhost:5000/api/weather/smart?lat=${lat}&lng=${lng}`
// //       );
// //       setWeather(weatherRes.data);
// //       setAqi(weatherRes.data.aqi);

// //       // Bus Stop
// //       const busRes = await axios.get(
// //         `http://localhost:5000/api/bus/suggest?lat=${lat}&lng=${lng}`
// //       );
// //       if (busRes.data.name) {
// //         setBusStop(busRes.data);
// //       }

// //       // Transit Route (backend call)
// //       const userLat = parseFloat(lat);
// //       const userLng = parseFloat(lng);
// //       const metroLat = parseFloat(localStorage.getItem("nearestMetroLat")) || 18.5010;
// //       const metroLng = parseFloat(localStorage.getItem("nearestMetroLng")) || 73.8620;

// //       const response = await axios.post(
// //         "http://localhost:5000/api/routes/transit",
// //         {
// //           origin: { lat: userLat, lng: userLng },
// //           destination: { lat: metroLat, lng: metroLng }
// //         }
// //       );

// //       console.log(response.data);
// //     };

// //     fetchData();
// //   }, []);

// //   const result = getSmartRecommendation({
// //     distance,
// //     temperature: weather?.temperature || 30,
// //     rain: weather?.rain || false,
// //     hour,
// //     aqi: aqi || 100,
// //     safetyScore: 80,
// //   });

// //   const modes = getModeComparison(distance);

// //   // Final options array — always built, bus shows pending until loaded
// //   const finalOptions = [
// //     {
// //       type: result.mode,
// //       reason: result.reason,
// //       icon: modeIcons[result.mode] || "🚀",
// //       status: "ready",
// //     },
// //     {
// //       type: "Shuttle",
// //       reason: "3+ riders nearby. Cost sharing possible.",
// //       icon: "🚐",
// //       status: "ready",
// //     },
// //     {
// //       type: "Bus",
// //       reason: busStop
// //         ? `Walk ${busStop.walkingDistance}m to ${busStop.name}`
// //         : "Fetching nearest bus stop...",
// //       icon: "🚌",
// //       status: busStop ? "ready" : "loading",
// //     },
// //   ];

// //   const aqiStatus = (val) => {
// //     if (!val) return { label: "—", color: "#999" };
// //     if (val <= 50) return { label: "Good", color: "#1A7A4A" };
// //     if (val <= 100) return { label: "Moderate", color: "#C8972A" };
// //     return { label: "Poor", color: "#C0392B" };
// //   };

// //   const aqiInfo = aqiStatus(aqi);
// //   const timeDisplay = `${hour.toString().padStart(2, "0")}:00 hrs`;

// //   const containerVariants = {
// //     hidden: {},
// //     show: { transition: { staggerChildren: 0.09 } },
// //   };
// //   const itemVariants = {
// //     hidden: { opacity: 0, y: 18 },
// //     show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
// //   };

// //   return (
// //     <div className="gov-page">
// //       <style>{styles}</style>

// //       {/* ── Header ── */}
// //       <header className="gov-header">
// //         <div className="gov-header-inner">
// //           <div className="gov-crest">🏛</div>
// //           <div className="gov-header-text">
// //             <h1>Urban Mobility Intelligence System</h1>
// //             <p>Integrated Transport Advisory · Government of India</p>
// //           </div>
// //         </div>
// //       </header>

// //       {/* ── Breadcrumb ── */}
// //       <div className="gov-breadcrumb">
// //         <div className="gov-breadcrumb-inner">
// //           HOME &nbsp;›&nbsp; MOBILITY DASHBOARD &nbsp;›&nbsp;{" "}
// //           <span>SMART RECOMMENDATION</span>
// //         </div>
// //       </div>

// //       {/* ── Content ── */}
// //       <main className="gov-content">
// //         <motion.div
// //           variants={containerVariants}
// //           initial="hidden"
// //           animate="show"
// //         >
// //           {/* Section: Advisory */}
// //           <motion.div variants={itemVariants}>
// //             <div className="gov-section-label">Advisory Output</div>
// //           </motion.div>

// //           {/* Recommendation Alert */}
// //           <motion.div variants={itemVariants}>
// //             <div className="rec-alert">
// //               <div className="rec-alert-icon">
// //                 {modeIcons[result.mode] || "🚀"}
// //               </div>
// //               <div className="rec-alert-body">
// //                 <div className="rec-badge">Recommended Mode</div>
// //                 <h2>{result.mode}</h2>
// //                 <p>{result.reason}</p>
// //               </div>
// //             </div>
// //           </motion.div>

// //           {/* Section: Suggested Options */}
// //           <motion.div variants={itemVariants} style={{ marginTop: "28px" }}>
// //             <div className="gov-section-label">Suggested Options</div>
// //           </motion.div>

// //           <motion.div variants={itemVariants}>
// //             <div className="comparison-card">
// //               <div className="comparison-card-header">
// //                 <h3>Smart Options for Your Journey</h3>
// //                 <small>Based on live conditions</small>
// //               </div>
// //               <div style={{ padding: "8px 0" }}>
// //                 {finalOptions.map((option, index) => (
// //                   <div
// //                     key={index}
// //                     style={{
// //                       display: "flex",
// //                       alignItems: "flex-start",
// //                       gap: "16px",
// //                       padding: "16px 24px",
// //                       borderBottom: index < finalOptions.length - 1 ? "1px solid var(--border)" : "none",
// //                       background: index === 0 ? "#EEF3FF" : "transparent",
// //                       opacity: option.status === "loading" ? 0.6 : 1,
// //                     }}
// //                   >
// //                     <div style={{
// //                       width: "40px", height: "40px", borderRadius: "50%",
// //                       background: index === 0 ? "var(--accent)" : "#EEF3FF",
// //                       display: "flex", alignItems: "center", justifyContent: "center",
// //                       fontSize: "18px", flexShrink: 0,
// //                     }}>
// //                       {option.icon}
// //                     </div>
// //                     <div style={{ flex: 1 }}>
// //                       <div style={{
// //                         fontWeight: 700, fontSize: "0.95rem",
// //                         color: "var(--navy)", marginBottom: "4px",
// //                         fontFamily: "'DM Sans', sans-serif",
// //                         display: "flex", alignItems: "center", gap: "8px",
// //                       }}>
// //                         {option.type}
// //                         {index === 0 && <span className="rec-tag">Best Match</span>}
// //                         {option.status === "loading" && (
// //                           <span style={{
// //                             fontSize: "0.6rem", fontWeight: 600,
// //                             color: "var(--muted)", textTransform: "uppercase",
// //                             letterSpacing: "0.08em",
// //                           }}>
// //                             Loading...
// //                           </span>
// //                         )}
// //                       </div>
// //                       <div style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5 }}>
// //                         {option.reason}
// //                       </div>
// //                     </div>
// //                     <div style={{
// //                       fontSize: "0.7rem", fontWeight: 700,
// //                       color: index === 0 ? "var(--accent)" : "var(--muted)",
// //                       textTransform: "uppercase", letterSpacing: "0.08em",
// //                       alignSelf: "center", whiteSpace: "nowrap",
// //                     }}>
// //                       {index === 0 ? "✓ Recommended" : index === 1 ? "Group Ride" : "Public Transit"}
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //           </motion.div>

// //           {/* Section: Environmental Conditions */}
// //           <motion.div variants={itemVariants} style={{ marginTop: "28px" }}>
// //             <div className="gov-section-label">Environmental Conditions</div>
// //           </motion.div>

// //           <motion.div variants={itemVariants} className="metrics-grid">
// //             {/* Temperature */}
// //             <div className="metric-card">
// //               <div className="metric-label">🌡 Temperature</div>
// //               {weather ? (
// //                 <>
// //                   <div className="metric-value">{weather.temperature}°</div>
// //                   <div className="metric-unit">Celsius</div>
// //                 </>
// //               ) : (
// //                 <div className="metric-loading" />
// //               )}
// //             </div>

// //             {/* Humidity */}
// //             <div className="metric-card">
// //               <div className="metric-label">💧 Humidity</div>
// //               {weather ? (
// //                 <>
// //                   <div className="metric-value">{weather.humidity}%</div>
// //                   <div className="metric-unit">Relative</div>
// //                 </>
// //               ) : (
// //                 <div className="metric-loading" />
// //               )}
// //             </div>

// //             {/* Rain */}
// //             <div className="metric-card">
// //               <div className="metric-label">🌧 Precipitation</div>
// //               {weather ? (
// //                 <>
// //                   <div
// //                     className="metric-value"
// //                     style={{
// //                       fontSize: "1rem",
// //                       fontFamily: "'DM Sans', sans-serif",
// //                       fontWeight: 600,
// //                       color: weather.rain ? "#1A6BFF" : "#1A7A4A",
// //                       paddingTop: "4px",
// //                     }}
// //                   >
// //                     {weather.rain ? "Rain Active" : "Clear"}
// //                   </div>
// //                   <div className="metric-unit">Current status</div>
// //                 </>
// //               ) : (
// //                 <div className="metric-loading" />
// //               )}
// //             </div>

// //             {/* AQI */}
// //             <div className="metric-card">
// //               <div className="metric-label">🌫 Air Quality</div>
// //               {aqi ? (
// //                 <>
// //                   <div className="metric-value" style={{ color: aqiInfo.color }}>
// //                     {aqi}
// //                   </div>
// //                   <div className="metric-unit" style={{ color: aqiInfo.color }}>
// //                     {aqiInfo.label} · AQI Index
// //                   </div>
// //                 </>
// //               ) : (
// //                 <div className="metric-loading" />
// //               )}
// //             </div>

// //             {/* Distance */}
// //             <div className="metric-card">
// //               <div className="metric-label">📏 Journey Distance</div>
// //               <div className="metric-value">{distance}</div>
// //               <div className="metric-unit">Kilometres</div>
// //             </div>

// //             {/* Time */}
// //             <div className="metric-card">
// //               <div className="metric-label">🕒 Reference Time</div>
// //               <div className="metric-value" style={{ fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, paddingTop: "4px" }}>
// //                 {timeDisplay}
// //               </div>
// //               <div className="metric-unit">Local Standard Time</div>
// //             </div>
// //           </motion.div>

// //           {/* Section: Transit Route Map */}
// //           <motion.div variants={itemVariants} style={{ marginTop: "28px" }}>
// //             <div className="gov-section-label">Transit Route Map</div>
// //           </motion.div>

// //           <motion.div variants={itemVariants}>
// //             <div className="comparison-card" style={{ overflow: "hidden" }}>
// //               <div className="comparison-card-header">
// //                 <h3>Route to Nearest Metro / Bus Stop</h3>
// //                 <small>Live Transit Directions · PMPML</small>
// //               </div>

// //               {isLoaded ? (
// //                 <GoogleMap
// //                   mapContainerStyle={{ width: "100%", height: "450px" }}
// //                   zoom={13}
// //                   center={{
// //                     lat: parseFloat(localStorage.getItem("userLat")) || 18.5204,
// //                     lng: parseFloat(localStorage.getItem("userLng")) || 73.8567,
// //                   }}
// //                   options={{
// //                     streetViewControl: false,
// //                     mapTypeControl: false,
// //                     fullscreenControl: false,
// //                     styles: [
// //                       { featureType: "poi", stylers: [{ visibility: "off" }] },
// //                       { elementType: "geometry", stylers: [{ color: "#f0f4f8" }] },
// //                       { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
// //                       { featureType: "water", stylers: [{ color: "#c8d8e8" }] },
// //                     ],
// //                   }}
// //                 >
// //                   {directions && <DirectionsRenderer directions={directions} />}
// //                 </GoogleMap>
// //               ) : (
// //                 <div style={{
// //                   height: "400px", display: "flex", alignItems: "center",
// //                   justifyContent: "center", background: "#F4F6FA",
// //                   color: "var(--muted)", fontSize: "0.85rem", gap: "10px",
// //                 }}>
// //                   <span>🗺</span> Loading map...
// //                 </div>
// //               )}
// //             </div>
// //           </motion.div>

// //           {/* Step-by-step instructions */}
// //           {directions && (
// //             <motion.div variants={itemVariants} style={{ marginTop: "12px" }}>
// //               <div className="comparison-card">
// //                 <div className="comparison-card-header">
// //                   <h3>🚌 PMPML Transit Route — Step by Step</h3>
// //                   <small>{directions.routes[0].legs[0].duration.text} · {directions.routes[0].legs[0].distance.text}</small>
// //                 </div>
// //                 <div style={{ padding: "8px 0" }}>
// //                   {directions.routes[0].legs[0].steps.map((step, index) => (
// //                     <div
// //                       key={index}
// //                       style={{
// //                         display: "flex",
// //                         alignItems: "flex-start",
// //                         gap: "14px",
// //                         padding: "14px 24px",
// //                         borderBottom: index < directions.routes[0].legs[0].steps.length - 1
// //                           ? "1px solid var(--border)" : "none",
// //                         background: step.travel_mode === "TRANSIT" ? "#F6F9FF" : "transparent",
// //                       }}
// //                     >
// //                       <div style={{
// //                         width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
// //                         background: step.travel_mode === "WALKING" ? "#EEF3FF" : "var(--accent)",
// //                         display: "flex", alignItems: "center", justifyContent: "center",
// //                         fontSize: "14px",
// //                       }}>
// //                         {step.travel_mode === "WALKING" ? "🚶" : "🚌"}
// //                       </div>
// //                       <div style={{ flex: 1 }}>
// //                         <div style={{
// //                           fontSize: "0.7rem", fontWeight: 700,
// //                           textTransform: "uppercase", letterSpacing: "0.1em",
// //                           color: step.travel_mode === "WALKING" ? "var(--muted)" : "var(--accent)",
// //                           marginBottom: "4px",
// //                         }}>
// //                           {step.travel_mode === "WALKING" ? "Walk" : "Transit"}
// //                         </div>
// //                         <div
// //                           style={{ fontSize: "0.88rem", color: "var(--text)", lineHeight: 1.5 }}
// //                           dangerouslySetInnerHTML={{ __html: step.instructions }}
// //                         />
// //                         <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
// //                           {step.distance.text} · {step.duration.text}
// //                         </div>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             </motion.div>
// //           )}

// //           {/* Section: Comparison */}
// //           <motion.div variants={itemVariants} style={{ marginTop: "28px" }}>
// //             <div className="gov-section-label">Mode Comparison Matrix</div>
// //           </motion.div>

// //           <motion.div variants={itemVariants} className="comparison-card">
// //             <div className="comparison-card-header">
// //               <h3>All Available Transport Modes</h3>
// //               <small>Highlighted row = Recommended</small>
// //             </div>

// //             <table className="gov-table">
// //               <thead>
// //                 <tr>
// //                   <th>Mode</th>
// //                   <th>Est. Time</th>
// //                   <th>Cost</th>
// //                   <th>Carbon Impact</th>
// //                   <th>Safety</th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {modes.map((mode, index) => (
// //                   <tr
// //                     key={index}
// //                     className={mode.mode === result.mode ? "recommended" : ""}
// //                   >
// //                     <td>
// //                       <span className="mode-chip">
// //                         {modeIcons[mode.mode] || "🚗"} {mode.mode}
// //                         {mode.mode === result.mode && (
// //                           <span className="rec-tag">Recommended</span>
// //                         )}
// //                       </span>
// //                     </td>
// //                     <td>{mode.time}</td>
// //                     <td>{mode.cost}</td>
// //                     <td>{mode.carbon}</td>
// //                     <td>{mode.safety}</td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </motion.div>

// //           {/* Action Bar */}
// //           <motion.div variants={itemVariants} style={{ marginTop: "12px" }}>
// //             <div className="action-bar">
// //               <span className="action-bar-label">Navigate To</span>

// //               <button
// //                 className="gov-btn gov-btn-primary"
// //                 onClick={() => navigate("/dashboard")}
// //               >
// //                 🌱 Green Impact Dashboard
// //               </button>

// //               <button
// //                 className="gov-btn gov-btn-secondary"
// //                 onClick={() => navigate("/virtualhub")}
// //               >
// //                 🚐 Virtual Hub Map
// //               </button>

// //               <button
// //                 className="gov-btn gov-btn-danger"
// //                 onClick={() => navigate("/women-safety")}
// //               >
// //                 🛡 Women Safety Mode
// //               </button>
// //             </div>
// //           </motion.div>
// //         </motion.div>
// //       </main>

// //       {/* ── Footer ── */}
// //       <footer className="gov-footer">
// //         URBAN MOBILITY INTELLIGENCE SYSTEM · MINISTRY OF ROAD TRANSPORT & HIGHWAYS · GOVT. OF INDIA
// //       </footer>
// //     </div>
// //   );
// // };

// // export default Recommendation;




// import { useNavigate } from "react-router-dom";
// import { getSmartRecommendation } from "../utils/smartWalkingEngine";
// import { getModeComparison } from "../utils/modeCalculator";
// import { motion } from "framer-motion";
// import { useEffect, useState } from "react";
// import axios from "axios";

// /* ─── Styles ─────────────────────────────────────────────────── */
// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

//   :root {
//     --navy:   #0B1F3A;
//     --navy2:  #102848;
//     --accent: #1A6BFF;
//     --gold:   #C8972A;
//     --light:  #F4F6FA;
//     --border: #D3D9E4;
//     --text:   #1C2B3A;
//     --muted:  #6B7B8F;
//     --white:  #FFFFFF;
//     --danger: #C0392B;
//     --success:#1A7A4A;
//     --card-shadow: 0 2px 16px rgba(11,31,58,0.09);
//   }

//   * { box-sizing: border-box; margin: 0; padding: 0; }

//   .gov-page {
//     font-family: 'DM Sans', sans-serif;
//     background: var(--light);
//     min-height: 100vh;
//     color: var(--text);
//   }

//   /* Header */
//   .gov-header {
//     background: var(--navy);
//     color: var(--white);
//     border-bottom: 4px solid var(--gold);
//   }
//   .gov-header-inner {
//     max-width: 1100px;
//     margin: 0 auto;
//     padding: 18px 32px;
//     display: flex;
//     align-items: center;
//     gap: 18px;
//   }
//   .gov-crest {
//     width: 52px; height: 52px;
//     background: var(--gold);
//     border-radius: 50%;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 24px; flex-shrink: 0;
//   }
//   .gov-header-text h1 {
//     font-family: 'DM Serif Display', serif;
//     font-size: 1.5rem;
//     letter-spacing: 0.01em;
//     line-height: 1.2;
//   }
//   .gov-header-text p {
//     font-size: 0.75rem;
//     color: #A8BCD4;
//     text-transform: uppercase;
//     letter-spacing: 0.12em;
//     margin-top: 2px;
//   }

//   /* Breadcrumb */
//   .gov-breadcrumb { background: var(--navy2); border-bottom: 1px solid rgba(255,255,255,0.06); }
//   .gov-breadcrumb-inner {
//     max-width: 1100px; margin: 0 auto;
//     padding: 10px 32px;
//     font-size: 0.75rem; color: #7A9BBF; letter-spacing: 0.05em;
//   }
//   .gov-breadcrumb span { color: var(--gold); font-weight: 600; }

//   /* Content */
//   .gov-content { max-width: 1100px; margin: 0 auto; padding: 36px 32px 60px; }

//   .gov-section-label {
//     font-size: 0.68rem; font-weight: 600;
//     text-transform: uppercase; letter-spacing: 0.15em;
//     color: var(--muted); margin-bottom: 16px;
//     display: flex; align-items: center; gap: 10px;
//   }
//   .gov-section-label::after {
//     content: ''; flex: 1; height: 1px; background: var(--border);
//   }

//   /* Weather Grid */
//   .metrics-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
//     gap: 12px;
//     margin-bottom: 10px;
//   }
//   .metric-card {
//     background: var(--white);
//     border: 1px solid var(--border);
//     border-radius: 4px;
//     padding: 18px 20px;
//     box-shadow: var(--card-shadow);
//   }
//   .metric-label {
//     font-size: 0.65rem; font-weight: 600;
//     text-transform: uppercase; letter-spacing: 0.12em;
//     color: var(--muted); margin-bottom: 8px;
//   }
//   .metric-value {
//     font-family: 'DM Serif Display', serif;
//     font-size: 1.5rem; color: var(--navy); line-height: 1;
//   }
//   .metric-unit { font-size: 0.7rem; color: var(--muted); margin-top: 4px; }
//   .metric-loading {
//     height: 28px;
//     background: linear-gradient(90deg, #e8edf4 25%, #d8dfe9 50%, #e8edf4 75%);
//     background-size: 200% 100%;
//     animation: shimmer 1.5s infinite;
//     border-radius: 3px; width: 70%;
//   }
//   @keyframes shimmer {
//     0% { background-position: 200% 0; }
//     100% { background-position: -200% 0; }
//   }

//   /* Mode Cards Grid */
//   .modes-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
//     gap: 14px;
//     margin-bottom: 10px;
//   }

//   .mode-card {
//     background: var(--white);
//     border: 1px solid var(--border);
//     border-radius: 6px;
//     padding: 20px 22px;
//     box-shadow: var(--card-shadow);
//     display: flex;
//     flex-direction: column;
//     gap: 12px;
//     position: relative;
//     transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
//   }
//   .mode-card:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 6px 24px rgba(11,31,58,0.13);
//   }
//   .mode-card.recommended {
//     border-color: var(--accent);
//     border-left: 4px solid var(--accent);
//     background: #f0f5ff;
//   }

//   .mode-card-top {
//     display: flex; align-items: center; gap: 14px;
//   }
//   .mode-icon {
//     width: 48px; height: 48px; border-radius: 50%;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 22px; flex-shrink: 0;
//     background: #EEF3FF;
//   }
//   .mode-icon.highlighted { background: var(--accent); }

//   .mode-card-info { flex: 1; }
//   .mode-card-name {
//     font-family: 'DM Serif Display', serif;
//     font-size: 1.1rem; color: var(--navy);
//     display: flex; align-items: center; gap: 8px;
//   }
//   .rec-badge-small {
//     background: var(--accent); color: #fff;
//     font-size: 0.58rem; font-weight: 700;
//     text-transform: uppercase; letter-spacing: 0.1em;
//     padding: 2px 7px; border-radius: 2px;
//     font-family: 'DM Sans', sans-serif;
//   }
//   .mode-card-desc {
//     font-size: 0.8rem; color: var(--muted); margin-top: 3px; line-height: 1.4;
//   }

//   .mode-meta {
//     display: flex; gap: 14px; font-size: 0.75rem; color: var(--muted);
//     border-top: 1px solid var(--border); padding-top: 10px;
//   }
//   .mode-meta-item { display: flex; flex-direction: column; gap: 2px; }
//   .mode-meta-item strong { color: var(--navy); font-size: 0.85rem; }

//   .mode-btn {
//     display: inline-flex; align-items: center; justify-content: center; gap: 8px;
//     padding: 10px 18px; border-radius: 4px;
//     font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 600;
//     cursor: pointer; border: 1px solid transparent;
//     text-decoration: none; transition: all 0.15s;
//     width: 100%;
//   }
//   .mode-btn-primary { background: var(--navy); color: var(--white); border-color: var(--navy); }
//   .mode-btn-primary:hover { background: #0d2a55; }
//   .mode-btn-secondary { background: var(--white); color: var(--navy); border-color: var(--border); }
//   .mode-btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
//   .mode-btn-danger { background: var(--danger); color: var(--white); }
//   .mode-btn-danger:hover { background: #a93226; }
//   .mode-btn-gold { background: var(--gold); color: var(--white); }
//   .mode-btn-gold:hover { background: #b0821f; }

//   /* Comparison Table */
//   .comparison-card {
//     background: var(--white);
//     border: 1px solid var(--border);
//     border-radius: 4px;
//     box-shadow: var(--card-shadow);
//     overflow: hidden;
//     margin-bottom: 10px;
//   }
//   .comparison-card-header {
//     background: var(--navy); color: var(--white);
//     padding: 16px 24px;
//     display: flex; align-items: center; justify-content: space-between;
//   }
//   .comparison-card-header h3 {
//     font-family: 'DM Serif Display', serif; font-size: 1.1rem;
//   }
//   .comparison-card-header small {
//     font-size: 0.68rem; color: #7A9BBF;
//     text-transform: uppercase; letter-spacing: 0.1em;
//   }
//   .gov-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
//   .gov-table thead tr { border-bottom: 2px solid var(--border); }
//   .gov-table thead th {
//     padding: 14px 20px; text-align: left;
//     font-size: 0.65rem; font-weight: 700;
//     text-transform: uppercase; letter-spacing: 0.12em;
//     color: var(--muted); background: #F9FAFC;
//   }
//   .gov-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s; }
//   .gov-table tbody tr:last-child { border-bottom: none; }
//   .gov-table tbody tr:hover { background: #F4F6FB; }
//   .gov-table tbody tr.recommended { background: #EEF3FF; border-left: 3px solid var(--accent); }
//   .gov-table tbody tr.recommended td { font-weight: 600; color: var(--navy); }
//   .gov-table td { padding: 14px 20px; color: var(--text); }
//   .rec-tag {
//     background: var(--accent); color: #fff;
//     font-size: 0.6rem; font-weight: 700;
//     text-transform: uppercase; letter-spacing: 0.1em;
//     padding: 2px 7px; border-radius: 2px; margin-left: 6px;
//   }

//   /* Footer */
//   .gov-footer {
//     background: var(--navy); color: #5A7A9F;
//     text-align: center; padding: 20px 32px;
//     font-size: 0.72rem; letter-spacing: 0.06em;
//     border-top: 2px solid var(--gold); margin-top: 20px;
//   }

//   @media (max-width: 700px) {
//     .gov-content { padding: 24px 16px 40px; }
//     .gov-header-inner { padding: 14px 16px; }
//     .metrics-grid { grid-template-columns: 1fr 1fr; }
//     .modes-grid { grid-template-columns: 1fr; }
//     .gov-table thead th:nth-child(n+3),
//     .gov-table td:nth-child(n+3) { display: none; }
//   }
// `;

// const modeIcons = {
//   Walking: "🚶",
//   Cycling: "🚲",
//   Bus: "🚌",
//   Auto: "🛺",
//   "E-Rickshaw": "⚡",
//   Metro: "🚇",
//   Cab: "🚕",
// };

// // ─── Mode Options Config ─────────────────────────────────────────
// // Each mode has: id, label, icon, desc, btnLabel, btnStyle, action
// // action: 'navigate' (internal route) | 'external' (open URL) | 'page' (navigate to page)

// const getModeOptions = (result, modes, navigate) => [
//   {
//     id: "walk",
//     label: "Walking",
//     icon: "🚶",
//     desc: "Best for short distances under 1km. Zero cost, zero emissions.",
//     meta: modes.find(m => m.mode === "Walking"),
//     recommended: result.mode === "Walking",
//     buttons: [
//       {
//         label: "Get Walking Directions",
//         style: "primary",
//         action: () => navigate("/walking-directions"),
//       },
//     ],
//   },
//   {
//     id: "pmpml",
//     label: "City Bus",
//     icon: "🚌",
//     desc: "Public city bus service. Most economical for medium distances.",
//     meta: modes.find(m => m.mode === "Bus"),
//     recommended: result.mode === "Bus",
//     buttons: [
//       {
//         label: "View Transit Map & Route",
//         style: "primary",
//         action: () => navigate("/pmpml-transit"),
//       },
//     ],
//   },
//   {
//     id: "auto",
//     label: "(Personal)",
//     icon: "🛺",
//     desc: "Book a personal auto via Rapido. Fast & door-to-door.",
//     meta: modes.find(m => m.mode === "Auto"),
//     recommended: result.mode === "Auto",
//     buttons: [
//       {
//         label: "Book a Personal Ride",
//         style: "gold",
//         action: () => navigate("/personal-ride-booking"),
//       },
//     ],
//   },
//   {
//     id: "shared-auto",
//     label: "Shared Auto",
//     icon: "🤝",
//     desc: "Share an auto with co-passengers going the same way. Save cost.",
//     meta: null,
//     recommended: false,
//     buttons: [
//       {
//         label: "Find Shared Auto",
//         style: "secondary",
//         action: () => navigate("/shared-auto-booking"),
//       },
//     ],
//   },
//   {
//     id: "cab",
//     label: "Cab / Taxi",
//     icon: "🚕",
//     desc: "Comfortable AC cab. Best for longer distances or late hours.",
//     meta: modes.find(m => m.mode === "Cab"),
//     recommended: result.mode === "Cab",
//     buttons: [
//       {
//         label: "Book on Rapido ↗",
//         style: "gold",
//         action: () => window.open("https://rapido.bike", "_blank"),
//       },
//     ],
//   },
//   {
//     id: "bike",
//     label: "Bike / Scooty",
//     icon: "🏍",
//     desc: "Quick two-wheeler ride. Great for beating traffic.",
//     meta: null,
//     recommended: false,
//     buttons: [
//       {
//         label: "Book Shared Bike/Scooty",
//         style: "secondary",
//         action: () => navigate("/shared-bike-booking"),
//       },

//     ],
//   },
// ];

// // ─── Component ───────────────────────────────────────────────────
// const Recommendation = () => {
//   const navigate = useNavigate();
//   const distance = parseFloat(localStorage.getItem("distance")) || 0.8;
//   const hour = new Date().getHours();
//   const [weather, setWeather] = useState(null);
//   const [aqi, setAqi] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       const lat = localStorage.getItem("userLat");
//       const lng = localStorage.getItem("userLng");
//       if (!lat || !lng) return;
//       try {
//         const weatherRes = await axios.get(
//           `http://localhost:5000/api/weather/smart?lat=${lat}&lng=${lng}`
//         );
//         setWeather(weatherRes.data);
//         setAqi(weatherRes.data.aqi);
//       } catch (e) {
//         console.error("Weather fetch failed", e);
//       }
//     };
//     fetchData();
//   }, []);

//   const result = getSmartRecommendation({
//     distance,
//     temperature: weather?.temperature || 30,
//     rain: weather?.rain || false,
//     hour,
//     aqi: aqi || 100,
//     safetyScore: 80,
//   });

//   const modes = getModeComparison(distance);
//   const modeOptions = getModeOptions(result, modes, navigate);

//   const aqiStatus = (val) => {
//     if (!val) return { label: "—", color: "#999" };
//     if (val <= 50) return { label: "Good", color: "#1A7A4A" };
//     if (val <= 100) return { label: "Moderate", color: "#C8972A" };
//     return { label: "Poor", color: "#C0392B" };
//   };
//   const aqiInfo = aqiStatus(aqi);
//   const timeDisplay = `${hour.toString().padStart(2, "0")}:00 hrs`;

//   const containerVariants = {
//     hidden: {},
//     show: { transition: { staggerChildren: 0.09 } },
//   };
//   const itemVariants = {
//     hidden: { opacity: 0, y: 18 },
//     show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
//   };

//   const btnClass = (style) => {
//     const map = {
//       primary: "mode-btn mode-btn-primary",
//       secondary: "mode-btn mode-btn-secondary",
//       danger: "mode-btn mode-btn-danger",
//       gold: "mode-btn mode-btn-gold",
//     };
//     return map[style] || "mode-btn mode-btn-secondary";
//   };

//   return (
//     <div className="gov-page">
//       <style>{styles}</style>

//       {/* Header */}
//       <header className="gov-header">
//         <div className="gov-header-inner">
//           <div className="gov-crest">🏛</div>
//           <div className="gov-header-text">
//             <h1>Urban Mobility Intelligence System</h1>
//             <p>Integrated Transport Advisory · Government of India</p>
//           </div>
//         </div>
//       </header>

//       {/* Breadcrumb */}
//       <div className="gov-breadcrumb">
//         <div className="gov-breadcrumb-inner">
//           HOME &nbsp;›&nbsp; MOBILITY DASHBOARD &nbsp;›&nbsp;{" "}
//           <span>SMART RECOMMENDATION</span>
//         </div>
//       </div>

//       {/* Content */}
//       <main className="gov-content">
//         <motion.div variants={containerVariants} initial="hidden" animate="show">

//           {/* ── Section: Weather Conditions ── */}
//           <motion.div variants={itemVariants}>
//             <div className="gov-section-label">Environmental Conditions</div>
//           </motion.div>

//           <motion.div variants={itemVariants} className="metrics-grid">
//             <div className="metric-card">
//               <div className="metric-label">🌡 Temperature</div>
//               {weather ? (
//                 <><div className="metric-value">{weather.temperature}°</div><div className="metric-unit">Celsius</div></>
//               ) : <div className="metric-loading" />}
//             </div>
//             <div className="metric-card">
//               <div className="metric-label">💧 Humidity</div>
//               {weather ? (
//                 <><div className="metric-value">{weather.humidity}%</div><div className="metric-unit">Relative</div></>
//               ) : <div className="metric-loading" />}
//             </div>
//             <div className="metric-card">
//               <div className="metric-label">🌧 Precipitation</div>
//               {weather ? (
//                 <>
//                   <div className="metric-value" style={{ fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, paddingTop: "4px", color: weather.rain ? "#1A6BFF" : "#1A7A4A" }}>
//                     {weather.rain ? "Rain Active" : "Clear"}
//                   </div>
//                   <div className="metric-unit">Current status</div>
//                 </>
//               ) : <div className="metric-loading" />}
//             </div>
//             <div className="metric-card">
//               <div className="metric-label">🌫 Air Quality</div>
//               {aqi ? (
//                 <>
//                   <div className="metric-value" style={{ color: aqiInfo.color }}>{aqi}</div>
//                   <div className="metric-unit" style={{ color: aqiInfo.color }}>{aqiInfo.label} · AQI Index</div>
//                 </>
//               ) : <div className="metric-loading" />}
//             </div>
//             <div className="metric-card">
//               <div className="metric-label">📏 Journey Distance</div>
//               <div className="metric-value">{distance}</div>
//               <div className="metric-unit">Kilometres</div>
//             </div>
//             <div className="metric-card">
//               <div className="metric-label">🕒 Reference Time</div>
//               <div className="metric-value" style={{ fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, paddingTop: "4px" }}>
//                 {timeDisplay}
//               </div>
//               <div className="metric-unit">Local Standard Time</div>
//             </div>
//           </motion.div>

//           {/* ── Section: Available Modes ── */}
//           <motion.div variants={itemVariants} style={{ marginTop: "28px" }}>
//             <div className="gov-section-label">Available Transport Modes</div>
//           </motion.div>

//           {/* Recommended summary banner */}
//           <motion.div variants={itemVariants}>
//             <div style={{
//               background: "var(--white)", border: "1px solid var(--border)",
//               borderLeft: "5px solid var(--accent)", borderRadius: "4px",
//               padding: "18px 24px", marginBottom: "16px",
//               boxShadow: "var(--card-shadow)",
//               display: "flex", alignItems: "center", gap: "16px",
//             }}>
//               <span style={{ fontSize: "2rem" }}>{modeIcons[result.mode] || "🚀"}</span>
//               <div>
//                 <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "4px" }}>
//                   System Recommendation
//                 </div>
//                 <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "var(--navy)" }}>
//                   {result.mode} is the best option for your journey
//                 </div>
//                 <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "4px" }}>{result.reason}</div>
//               </div>
//             </div>
//           </motion.div>

//           {/* Mode Cards */}
//           <motion.div variants={itemVariants} className="modes-grid">
//             {modeOptions.map((option) => {
//               const modeData = option.meta;
//               return (
//                 <div
//                   key={option.id}
//                   className={`mode-card${option.recommended ? " recommended" : ""}`}
//                 >
//                   <div className="mode-card-top">
//                     <div className={`mode-icon${option.recommended ? " highlighted" : ""}`}>
//                       {option.icon}
//                     </div>
//                     <div className="mode-card-info">
//                       <div className="mode-card-name">
//                         {option.label}
//                         {option.recommended && <span className="rec-badge-small">Best Match</span>}
//                       </div>
//                       <div className="mode-card-desc">{option.desc}</div>
//                     </div>
//                   </div>

//                   {modeData && (
//                     <div className="mode-meta">
//                       <div className="mode-meta-item">
//                         <span>Est. Time</span>
//                         <strong>{modeData.time}</strong>
//                       </div>
//                       <div className="mode-meta-item">
//                         <span>Cost</span>
//                         <strong>{modeData.cost}</strong>
//                       </div>
//                       <div className="mode-meta-item">
//                         <span>Carbon</span>
//                         <strong>{modeData.carbon}</strong>
//                       </div>
//                     </div>
//                   )}

//                   <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//                     {option.buttons.map((btn, i) => (
//                       <button
//                         key={i}
//                         className={btnClass(btn.style)}
//                         onClick={btn.action}
//                       >
//                         {btn.label}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               );
//             })}
//           </motion.div>

//           {/* ── Section: Full Comparison Table ── */}
//           <motion.div variants={itemVariants} style={{ marginTop: "28px" }}>
//             <div className="gov-section-label">Mode Comparison Matrix</div>
//           </motion.div>

//           <motion.div variants={itemVariants} className="comparison-card">
//             <div className="comparison-card-header">
//               <h3>All Available Transport Modes</h3>
//               <small>Highlighted row = Recommended</small>
//             </div>
//             <table className="gov-table">
//               <thead>
//                 <tr>
//                   <th>Mode</th>
//                   <th>Est. Time</th>
//                   <th>Cost</th>
//                   <th>Carbon Impact</th>
//                   <th>Safety</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {modes.map((mode, index) => (
//                   <tr key={index} className={mode.mode === result.mode ? "recommended" : ""}>
//                     <td>
//                       <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
//                         {modeIcons[mode.mode] || "🚗"} {mode.mode}
//                         {mode.mode === result.mode && <span className="rec-tag">Recommended</span>}
//                       </span>
//                     </td>
//                     <td>{mode.time}</td>
//                     <td>{mode.cost}</td>
//                     <td>{mode.carbon}</td>
//                     <td>{mode.safety}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </motion.div>

//           {/* Action Bar */}
//           <motion.div variants={itemVariants} style={{ marginTop: "12px" }}>
//             <div style={{
//               background: "var(--white)", border: "1px solid var(--border)",
//               borderRadius: "4px", padding: "20px 24px",
//               display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center",
//               boxShadow: "var(--card-shadow)",
//             }}>
//               <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginRight: "8px" }}>
//                 Navigate To
//               </span>
//               <button className="mode-btn mode-btn-primary" style={{ width: "auto" }} onClick={() => navigate("/dashboard")}>
//                 🌱 Green Impact Dashboard
//               </button>
//               <button className="mode-btn mode-btn-secondary" style={{ width: "auto" }} onClick={() => navigate("/virtualhub")}>
//                 🚐 Virtual Hub Map
//               </button>
//               <button className="mode-btn mode-btn-danger" style={{ width: "auto" }} onClick={() => navigate("/women-safety")}>
//                 🛡 Women Safety Mode
//               </button>
//             </div>
//           </motion.div>

//         </motion.div>
//       </main>

//       <footer className="gov-footer">
//         URBAN MOBILITY INTELLIGENCE SYSTEM · MINISTRY OF ROAD TRANSPORT & HIGHWAYS · GOVT. OF INDIA
//       </footer>
//     </div>
//   );
// };

// export default Recommendation;

// Recommendation.jsx — MetroSetu Clean Recommendation Page
import { useNavigate } from "react-router-dom";
import { getSmartRecommendation } from "../utils/smartWalkingEngine";
import { getModeComparison } from "../utils/modeCalculator";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #f5f5f5;
    color: #111;
    -webkit-font-smoothing: antialiased;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Navbar ── */
  .nav {
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
    padding: 0 32px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: #111;
  }
  .nav-logo {
    width: 32px; height: 32px;
    background: #111;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }
  .nav-name {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 4px;
    list-style: none;
  }
  .nav-links a {
    color: #666;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    padding: 6px 14px;
    border-radius: 6px;
    transition: all 0.15s;
  }
  .nav-links a:hover { color: #111; background: #f5f5f5; }
  .nav-links a.active { color: #111; background: #f0f0f0; font-weight: 600; }
  .nav-user {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #333;
  }
  .nav-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: #111;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600;
  }

  /* ── Page Header ── */
  .page-header {
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
    padding: 40px 32px 36px;
  }
  .page-header-inner {
    max-width: 1120px;
    margin: 0 auto;
  }
  .page-tag {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #666;
    margin-bottom: 12px;
  }
  .page-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: #111;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  .page-header p {
    font-size: 14px;
    color: #888;
    line-height: 1.6;
    max-width: 540px;
  }

  /* ── Main ── */
  .main {
    max-width: 1120px;
    margin: 0 auto;
    padding: 28px 32px 60px;
  }

  /* ── Section ── */
  .section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    margin-top: 32px;
  }
  .section-head:first-child { margin-top: 0; }
  .section-head h2 {
    font-size: 14px;
    font-weight: 600;
    color: #111;
  }
  .section-head span {
    font-size: 13px;
    color: #999;
    font-weight: 400;
  }
  .section-line {
    flex: 1;
    height: 1px;
    background: #e5e5e5;
    margin-left: 12px;
  }

  /* ── Recommendation Banner ── */
  .rec-banner {
    background: #111;
    border-radius: 10px;
    padding: 24px 28px;
    display: flex;
    align-items: center;
    gap: 18px;
    color: #fff;
    margin-bottom: 8px;
  }
  .rec-banner-icon {
    width: 52px; height: 52px;
    border-radius: 10px;
    background: rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; flex-shrink: 0;
  }
  .rec-banner-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #999;
    margin-bottom: 4px;
  }
  .rec-banner-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .rec-banner-reason {
    font-size: 13px;
    color: #aaa;
    line-height: 1.5;
  }

  /* ── Metrics Grid ── */
  .metrics {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
  }
  .metric {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 18px;
    transition: border-color 0.15s;
  }
  .metric:hover { border-color: #ccc; }
  .metric-icon {
    font-size: 16px;
    margin-bottom: 10px;
  }
  .metric-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #999;
    margin-bottom: 6px;
  }
  .metric-val {
    font-size: 22px;
    font-weight: 700;
    color: #111;
    line-height: 1;
  }
  .metric-unit {
    font-size: 11px;
    color: #999;
    margin-top: 3px;
  }
  .metric-shimmer {
    height: 24px; width: 60%;
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e5 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  /* ── Mode Cards ── */
  .modes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 12px;
  }
  .mode-card {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: border-color 0.15s, box-shadow 0.2s;
    position: relative;
  }
  .mode-card:hover {
    border-color: #ccc;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .mode-card.best {
    border-color: #111;
    border-width: 1.5px;
  }
  .mode-card.best::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: #111;
    border-radius: 10px 10px 0 0;
  }
  .mode-top {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .mode-emoji {
    width: 44px; height: 44px;
    border-radius: 10px;
    background: #f5f5f5;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .mode-card.best .mode-emoji {
    background: #111;
  }
  .mode-label {
    font-size: 15px;
    font-weight: 600;
    color: #111;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mode-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    background: #111;
    color: #fff;
    border-radius: 4px;
  }
  .mode-desc {
    font-size: 12px;
    color: #888;
    line-height: 1.5;
    margin-top: 2px;
  }
  .mode-data {
    display: flex;
    gap: 8px;
    border-top: 1px solid #f0f0f0;
    padding-top: 14px;
  }
  .mode-data-item {
    flex: 1;
    text-align: center;
    padding: 8px 4px;
    background: #fafafa;
    border-radius: 6px;
  }
  .mode-card.best .mode-data-item {
    background: #f5f5f5;
  }
  .mode-data-key {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #999;
    margin-bottom: 3px;
  }
  .mode-data-val {
    font-size: 14px;
    font-weight: 700;
    color: #111;
  }

  /* ── Buttons ── */
  .btn {
    width: 100%;
    padding: 10px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .btn-dark {
    background: #111;
    color: #fff;
  }
  .btn-dark:hover {
    background: #333;
  }
  .btn-outline {
    background: #fff;
    color: #333;
    border: 1px solid #ddd;
  }
  .btn-outline:hover {
    border-color: #111;
    color: #111;
  }
  .btn-amber {
    background: #f59e0b;
    color: #fff;
  }
  .btn-amber:hover {
    background: #d97706;
  }
  .btn-green {
    background: #10b981;
    color: #fff;
  }
  .btn-green:hover {
    background: #059669;
  }

  /* ── Quick Actions ── */
  .quick-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .quick-card {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .quick-card:hover {
    border-color: #111;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .quick-icon {
    width: 36px; height: 36px;
    border-radius: 8px;
    background: #f5f5f5;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .quick-text strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #111;
    margin-bottom: 2px;
  }
  .quick-text span {
    font-size: 11px;
    color: #999;
  }

  /* ── Footer ── */
  .footer {
    background: #fff;
    border-top: 1px solid #e5e5e5;
    text-align: center;
    padding: 28px 24px;
    font-size: 12px;
    color: #999;
  }
  .footer strong {
    color: #111;
    font-weight: 700;
  }
  .footer a {
    color: #666;
    text-decoration: none;
  }
  .footer a:hover { text-decoration: underline; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .nav { padding: 0 16px; }
    .nav-links { display: none; }
    .page-header { padding: 28px 16px 24px; }
    .main { padding: 20px 16px 40px; }
    .metrics { grid-template-columns: repeat(2, 1fr); }
    .modes { grid-template-columns: 1fr; }
    .quick-row { grid-template-columns: 1fr; }
    .rec-banner { flex-direction: column; text-align: center; }
  }
  @media (max-width: 480px) {
    .metrics { grid-template-columns: 1fr; }
    .mode-data { flex-direction: column; gap: 6px; }
    .page-header h1 { font-size: 22px; }
  }
`;

const modeIcons = {
  Walking: "🚶",
  Cycling: "🚲",
  Bus: "🚌",
  Auto: "🛺",
  "E-Rickshaw": "⚡",
  Metro: "🚇",
};

const getModeOptions = (result, modes, navigate) => [
  {
    id: "walk",
    label: "Walking",
    icon: "🚶",
    desc: "Best for short distances under 1 km. Zero cost, zero emissions.",
    meta: modes.find((m) => m.mode === "Walking"),
    recommended: result.mode === "Walking",
    btnLabel: "Get Directions",
    btnStyle: "dark",
    action: () => navigate("/walking-directions"),
  },
  {
    id: "pmpml",
    label: "City Bus",
    icon: "🚌",
    desc: "Public city bus service. Most economical for medium distances.",
    meta: modes.find((m) => m.mode === "Bus"),
    recommended: result.mode === "Bus",
    btnLabel: "View Routes",
    btnStyle: "green",
    action: () => navigate("/pmpml-transit"),
  },
  {
    id: "auto",
    label: "Personal Auto",
    icon: "🛺",
    desc: "Book a personal auto ride. Fast, convenient & door-to-door.",
    meta: modes.find((m) => m.mode === "Auto"),
    recommended: result.mode === "Auto",
    btnLabel: "Book Ride",
    btnStyle: "amber",
    action: () => navigate("/personal-ride-booking"),
  },
  {
    id: "shared-auto",
    label: "Shared Auto",
    icon: "🤝",
    desc: "Share an auto with co-passengers going the same way.",
    meta: null,
    recommended: false,
    btnLabel: "Find Shared Ride",
    btnStyle: "outline",
    action: () => navigate("/shared-auto-booking"),
  },
  {
    id: "bike",
    label: "Bike / Scooty",
    icon: "🏍️",
    desc: "Quick two-wheeler ride for beating traffic.",
    meta: null,
    recommended: false,
    btnLabel: "Book Two-Wheeler",
    btnStyle: "outline",
    action: () => navigate("/shared-bike-booking"),
  },
];

const Recommendation = () => {
  const navigate = useNavigate();
  const distance = parseFloat(localStorage.getItem("distance")) || 0.8;
  const hour = new Date().getHours();

  const [userName, setUserName] = useState("");
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUserName(JSON.parse(stored).name || "");
      } catch {
        setUserName("");
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const lat = localStorage.getItem("userLat");
      const lng = localStorage.getItem("userLng");
      if (!lat || !lng) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/weather/smart?lat=${lat}&lng=${lng}`
        );
        setWeather(res.data);
        setAqi(res.data.aqi);
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };
    fetchData();
  }, []);

  const result = getSmartRecommendation({
    distance,
    temperature: weather?.temperature || 30,
    rain: weather?.rain || false,
    hour,
    aqi: aqi || 100,
    safetyScore: 80,
  });

  const modes = getModeComparison(distance);
  const modeOptions = getModeOptions(result, modes, navigate);

  const aqiStatus = (val) => {
    if (!val) return { label: "—", color: "#999" };
    if (val <= 50) return { label: "Good", color: "#10b981" };
    if (val <= 100) return { label: "Moderate", color: "#f59e0b" };
    return { label: "Poor", color: "#ef4444" };
  };
  const aqiInfo = aqiStatus(aqi);
  const timeDisplay = `${hour.toString().padStart(2, "0")}:00`;
  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : "U";

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  const btnCls = (s) =>
    ({ dark: "btn btn-dark", outline: "btn btn-outline", amber: "btn btn-amber", green: "btn btn-green" }[s] || "btn btn-outline");

  return (
    <>
      <style>{STYLES}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <a href="/" className="nav-brand">
          <div className="nav-logo">🚇</div>
          <span className="nav-name">MetroSetu</span>
        </a>
        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/recommendation" className="active">Recommendation</a></li>
          <li><a href="/pooling">Pool Ride</a></li>
          <li><a href="/personal-ride">Personal Ride</a></li>
          <li><a href="/donation">Donate</a></li>
        </ul>
        <div className="nav-user">
          <div className="nav-avatar">{avatarLetter}</div>
          {userName || "Guest"}
        </div>
      </nav>

      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-tag">
            {userName ? `Hi ${userName} —` : ""} Smart Travel Advisory
          </div>
          <h1>Recommended Transport Mode</h1>
          <p>
            Based on your journey distance, live weather, air quality, and
            time of day — here's what works best for you.
          </p>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="main">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* Banner */}
          <motion.div variants={item}>
            <div className="rec-banner">
              <div className="rec-banner-icon">
                {modeIcons[result.mode] || "🚀"}
              </div>
              <div>
                <div className="rec-banner-label">Recommended for you</div>
                <div className="rec-banner-title">
                  {result.mode} is the best option
                </div>
                <div className="rec-banner-reason">{result.reason}</div>
              </div>
            </div>
          </motion.div>

          {/* Conditions */}
          <motion.div variants={item}>
            <div className="section-head">
              <h2>Conditions</h2>
              <span>— real-time factors</span>
              <div className="section-line" />
            </div>
          </motion.div>

          <motion.div variants={item} className="metrics">
            <div className="metric">
              <div className="metric-icon">🌡️</div>
              <div className="metric-label">Temperature</div>
              {weather ? (
                <>
                  <div className="metric-val">{weather.temperature}°</div>
                  <div className="metric-unit">Celsius</div>
                </>
              ) : <div className="metric-shimmer" />}
            </div>
            <div className="metric">
              <div className="metric-icon">💧</div>
              <div className="metric-label">Humidity</div>
              {weather ? (
                <>
                  <div className="metric-val">{weather.humidity}%</div>
                  <div className="metric-unit">Relative</div>
                </>
              ) : <div className="metric-shimmer" />}
            </div>
            <div className="metric">
              <div className="metric-icon">🌧️</div>
              <div className="metric-label">Rain</div>
              {weather ? (
                <>
                  <div className="metric-val" style={{
                    fontSize: 16,
                    color: weather.rain ? "#6366f1" : "#10b981"
                  }}>
                    {weather.rain ? "Active" : "Clear"}
                  </div>
                  <div className="metric-unit">Now</div>
                </>
              ) : <div className="metric-shimmer" />}
            </div>
            <div className="metric">
              <div className="metric-icon">🌫️</div>
              <div className="metric-label">AQI</div>
              {aqi ? (
                <>
                  <div className="metric-val" style={{ color: aqiInfo.color }}>{aqi}</div>
                  <div className="metric-unit" style={{ color: aqiInfo.color }}>{aqiInfo.label}</div>
                </>
              ) : <div className="metric-shimmer" />}
            </div>
            <div className="metric">
              <div className="metric-icon">📏</div>
              <div className="metric-label">Distance</div>
              <div className="metric-val">{distance}</div>
              <div className="metric-unit">km</div>
            </div>
            <div className="metric">
              <div className="metric-icon">🕒</div>
              <div className="metric-label">Time</div>
              <div className="metric-val" style={{ fontSize: 18 }}>{timeDisplay}</div>
              <div className="metric-unit">Local</div>
            </div>
          </motion.div>

          {/* Modes */}
          <motion.div variants={item}>
            <div className="section-head">
              <h2>Transport Options</h2>
              <span>— choose your mode</span>
              <div className="section-line" />
            </div>
          </motion.div>

          <motion.div variants={item} className="modes">
            {modeOptions.map((opt) => (
              <div
                key={opt.id}
                className={`mode-card${opt.recommended ? " best" : ""}`}
              >
                <div className="mode-top">
                  <div className="mode-emoji">{opt.icon}</div>
                  <div>
                    <div className="mode-label">
                      {opt.label}
                      {opt.recommended && <span className="mode-badge">Best</span>}
                    </div>
                    <div className="mode-desc">{opt.desc}</div>
                  </div>
                </div>

                {opt.meta && (
                  <div className="mode-data">
                    <div className="mode-data-item">
                      <div className="mode-data-key">Time</div>
                      <div className="mode-data-val">{opt.meta.time}</div>
                    </div>
                    <div className="mode-data-item">
                      <div className="mode-data-key">Cost</div>
                      <div className="mode-data-val">{opt.meta.cost}</div>
                    </div>
                    <div className="mode-data-item">
                      <div className="mode-data-key">Carbon</div>
                      <div className="mode-data-val">{opt.meta.carbon}</div>
                    </div>
                  </div>
                )}

                <button className={btnCls(opt.btnStyle)} onClick={opt.action}>
                  {opt.btnLabel}
                </button>
              </div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item}>
            <div className="section-head" style={{ marginTop: 32 }}>
              <h2>Quick Actions</h2>
              <div className="section-line" />
            </div>
          </motion.div>

          <motion.div variants={item} className="quick-row">
            <div className="quick-card" onClick={() => navigate("/dashboard")}>
              <div className="quick-icon">🌱</div>
              <div className="quick-text">
                <strong>Green Impact</strong>
                <span>CO₂ savings dashboard</span>
              </div>
            </div>
            <div className="quick-card" onClick={() => navigate("/virtualhub")}>
              <div className="quick-icon">🗺️</div>
              <div className="quick-text">
                <strong>Virtual Hub</strong>
                <span>Interactive transport map</span>
              </div>
            </div>
            <div className="quick-card" onClick={() => navigate("/women-safety")}>
              <div className="quick-icon">🛡️</div>
              <div className="quick-text">
                <strong>Women Safety</strong>
                <span>Safe travel features</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <strong>MetroSetu</strong> · Smart Last Mile Connectivity
        <br />
        © {new Date().getFullYear()} MetroSetu · <a href="#">Privacy</a> · <a href="#">Terms</a>
      </footer>
    </>
  );
};

export default Recommendation;