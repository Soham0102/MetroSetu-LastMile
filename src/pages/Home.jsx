// // Home.jsx — MetroSetu Government Portal with Google Maps
// import { useNavigate } from "react-router-dom";
// import { useState, useRef } from "react";
// import {
//   GoogleMap,
//   useLoadScript,
//   Marker,
//   Polyline,
//   Autocomplete
// } from "@react-google-maps/api";
// import { metroStations } from "../data/metroStations";
// import { calculateDistance } from "../utils/distance";
// import {
//   GOV_STYLES,
//   GovHeader,
//   GovBreadcrumb,
//   GovNotice,
//   GovFooter
// } from "./GovLayout";

// const LIBRARIES = ["places"];
// const MAP_STYLE = { width: "100%", height: "380px" };
// const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };

// const MAP_OPTIONS = {
//   mapTypeControl: false,
//   streetViewControl: false,
//   fullscreenControl: true,
//   zoomControl: true,
//   styles: [
//     { featureType: "water", stylers: [{ color: "#bfdbfe" }] },
//     { featureType: "landscape", stylers: [{ color: "#f1f5f9" }] },
//     { featureType: "road", stylers: [{ color: "#ffffff" }] },
//     { featureType: "road.arterial", stylers: [{ color: "#e2e8f0" }] },
//     { featureType: "transit.station.rail", stylers: [{ visibility: "on" }, { color: "#154272" }] },
//     { featureType: "poi.park", stylers: [{ color: "#d1fae5" }] },
//     { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
//     { elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
//   ]
// };

// const Home = () => {
//   const navigate = useNavigate();
//   const mapRef = useRef(null);
//   const autocompleteRef = useRef(null);

//   const [location, setLocation] = useState("");
//   const [selectedCoords, setSelectedCoords] = useState(null);
//   const [nearestStation, setNearestStation] = useState(null);
//   const [nearestDistance, setNearestDistance] = useState(null);
//   const [agreed, setAgreed] = useState(false);

//   // NEW: auto-location loading state
//   const [isLocating, setIsLocating] = useState(false);

//   const { isLoaded } = useLoadScript({
//     googleMapsApiKey: "AIzaSyA9spKFBlhfECHHoXnMPRziyuUuhL124yo",
//     libraries: LIBRARIES
//   });

//   // ── Shared helper: given lat/lng + a display address, update all state/localStorage ──
//   const applyLocation = (lat, lng, displayAddress) => {
//     const coords = { lat, lng };

//     setSelectedCoords(coords);
//     setLocation(displayAddress);
//     localStorage.setItem("userLat", lat);
//     localStorage.setItem("userLng", lng);
//     localStorage.setItem("userLocation", displayAddress);

//     // Find nearest metro — same logic as before
//     let minDist = Infinity, nearest = null;
//     metroStations.forEach(s => {
//       const d = parseFloat(calculateDistance(lat, lng, s.lat, s.lng));
//       if (d < minDist) { minDist = d; nearest = s; }
//     });

//     setNearestStation(nearest);
//     setNearestDistance(minDist.toFixed(2));
//     localStorage.setItem("nearestStation", nearest?.name || "");
//     localStorage.setItem("distance", minDist);

//     // Fit bounds — same as before
//     if (mapRef.current && nearest) {
//       const bounds = new window.google.maps.LatLngBounds();
//       bounds.extend(coords);
//       bounds.extend({ lat: nearest.lat, lng: nearest.lng });
//       mapRef.current.fitBounds(bounds);
//     }
//   };

//   // ── Existing: called when user picks from Autocomplete dropdown ──
//   const onPlaceChanged = () => {
//     const place = autocompleteRef.current?.getPlace();
//     if (!place?.geometry) return;

//     const lat = place.geometry.location.lat();
//     const lng = place.geometry.location.lng();
//     applyLocation(lat, lng, place.formatted_address);
//   };

//   // ── NEW: Auto-detect location via browser Geolocation + Geocoding API ──
//   const handleAutoDetect = () => {
//     if (!navigator.geolocation) {
//       alert("Geolocation is not supported by your browser.");
//       return;
//     }

//     setIsLocating(true);

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lng = position.coords.longitude;

//         try {
//           // Reverse geocode using Google Geocoding API
//           const response = await fetch(
//             `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyA9spKFBlhfECHHoXnMPRziyuUuhL124yo`
//           );
//           const data = await response.json();

//           const formattedAddress =
//             data?.results?.[0]?.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

//           applyLocation(lat, lng, formattedAddress);
//         } catch {
//           // Fallback: use raw coordinates as display address
//           applyLocation(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
//         } finally {
//           setIsLocating(false);
//         }
//       },
//       (error) => {
//         setIsLocating(false);
//         if (error.code === error.PERMISSION_DENIED) {
//           alert("Location permission denied. Please allow location access in your browser settings and try again.");
//         } else {
//           alert("Unable to retrieve your location. Please try again or search manually.");
//         }
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   };

//   const handleSubmit = () => {
//     if (!location || !selectedCoords) {
//       alert("Please select a valid location from the suggestions.");
//       return;
//     }
//     localStorage.setItem("userLocation", location);
//     localStorage.setItem("distance", nearestDistance);
//     navigate("/recommendation");
//   };

//   if (!isLoaded) {
//     return (
//       <>
//         <style>{GOV_STYLES}</style>
//         <GovHeader />
//         <div className="g-loading">
//           <div className="g-spinner" />
//           <p style={{ color: "#154272", fontWeight: 600 }}>Loading Map Services…</p>
//           <p style={{ color: "#718096", fontSize: 12 }}>Please wait while we initialise Google Maps</p>
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <style>{GOV_STYLES}</style>
//       <div className="g-form-page">
//         <GovHeader activeNav="Home" />
//         <GovBreadcrumb crumbs={["Citizen Services", "Last Mile Connectivity Finder"]} />
//         <GovNotice text="This service is live for 18+ metro cities under Smart Cities Mission. Map data is refreshed daily at 06:00 AM IST. For grievances, call 1800-111-550." />

//         {/* HERO */}
//         <div className="g-hero">
//           <div className="g-hero-inner">
//             <div className="g-hero-pill">🏅 Smart Mobility Initiative 2024–25</div>
//             <h2>Find Your Best Last Mile Transport Mode</h2>
//             <p>Search your home location on the map. MetroSetu will instantly identify the nearest metro station and recommend the most efficient, safe, and affordable transport option for your last mile journey.</p>
//           </div>
//         </div>

//         <main id="main">
//           <div className="g-content-wrap">

//             {/* ── LEFT PANEL ── */}
//             <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

//               {/* LOCATION PANEL */}
//               <div className="g-panel">
//                 <div className="g-panel-header">
//                   <div className="g-panel-icon">🗺️</div>
//                   <div>
//                     <h3>Search Your Location</h3>
//                     <p>Fields marked <span style={{ color: "#c62828" }}>*</span> are mandatory. Select location from suggestions only.</p>
//                   </div>
//                 </div>
//                 <div className="g-panel-body">
//                   <div className="g-field">
//                     <label className="g-label" htmlFor="location-search">
//                       Home / Origin Location <span className="g-req">*</span>
//                     </label>
//                     <span className="g-hint">Type your colony, sector, or area and select from dropdown (e.g. Dwarka Sector 12, New Delhi)</span>

//                     {/* ── Search input + Auto-detect button row ── */}
//                     <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
//                       <div className="g-input-wrap" style={{ flex: 1 }}>
//                         <span className="g-input-icon">📍</span>
//                         <Autocomplete
//                           onLoad={ref => (autocompleteRef.current = ref)}
//                           onPlaceChanged={onPlaceChanged}
//                         >
//                           <input
//                             id="location-search"
//                             type="text"
//                             className="g-input with-icon"
//                             placeholder="Start typing your location…"
//                             value={location}
//                             onChange={e => setLocation(e.target.value)}
//                           />
//                         </Autocomplete>
//                       </div>

//                       {/* ── NEW: Auto-Detect Button ── */}
//                       <button
//                         type="button"
//                         onClick={handleAutoDetect}
//                         disabled={isLocating}
//                         title="Auto-detect my current location"
//                         style={{
//                           flexShrink: 0,
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "6px",
//                           padding: "0 14px",
//                           height: "42px",
//                           background: isLocating ? "#e2e8f0" : "#154272",
//                           color: isLocating ? "#718096" : "#fff",
//                           border: "none",
//                           borderRadius: "6px",
//                           fontSize: "12px",
//                           fontWeight: 600,
//                           cursor: isLocating ? "not-allowed" : "pointer",
//                           whiteSpace: "nowrap",
//                           transition: "background 0.2s",
//                         }}
//                       >
//                         {isLocating ? (
//                           <>
//                             <span style={{
//                               display: "inline-block",
//                               width: "13px",
//                               height: "13px",
//                               border: "2px solid #718096",
//                               borderTopColor: "transparent",
//                               borderRadius: "50%",
//                               animation: "spin 0.7s linear infinite"
//                             }} />
//                             Locating…
//                           </>
//                         ) : (
//                           <>📡 Use My Location</>
//                         )}
//                       </button>
//                     </div>

//                     {/* Spinner keyframe (inline, scoped) */}
//                     <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

//                     <span style={{ fontSize: "11px", color: "#718096", marginTop: "4px", display: "block" }}>
//                       Or click <strong>📡 Use My Location</strong> to auto-detect via GPS
//                     </span>
//                   </div>

//                   {/* Auto-computed distance */}
//                   <div className="g-field">
//                     <label className="g-label">Distance to Nearest Metro Station</label>
//                     <span className="g-hint">Auto-calculated based on your selected location. Read-only field.</span>
//                     <div className="g-input-wrap">
//                       <span className="g-input-icon">📏</span>
//                       <input
//                         type="text"
//                         className="g-input with-icon with-suffix readonly"
//                         value={nearestDistance || ""}
//                         placeholder="Auto-calculated after location selection"
//                         readOnly
//                       />
//                       <span className="g-input-suffix">km</span>
//                     </div>
//                   </div>

//                   {/* Nearest Station Card */}
//                   {nearestStation && (
//                     <div className="g-station-info">
//                       <span className="g-station-icon">🚇</span>
//                       <div>
//                         <div className="g-station-name">{nearestStation.name}</div>
//                         <div className="g-station-dist">📏 {nearestDistance} km from your location</div>
//                         <div className="g-station-line">✅ Nearest metro station auto-detected</div>
//                       </div>
//                     </div>
//                   )}

//                   <hr className="g-divider" />

//                   {/* Declaration */}
//                   <div style={{ marginBottom: "16px" }}>
//                     <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "#4a5568", lineHeight: "1.6" }}>
//                       <input
//                         type="checkbox"
//                         checked={agreed}
//                         onChange={e => setAgreed(e.target.checked)}
//                         style={{ marginTop: "3px", accentColor: "#154272", width: "15px", height: "15px", flexShrink: 0 }}
//                       />
//                       I declare that the location information provided is accurate and I agree to the
//                       <a href="#" className="g-link" style={{ marginLeft: "4px" }}>Terms of Use</a> and
//                       <a href="#" className="g-link" style={{ marginLeft: "4px" }}>Privacy Policy</a> of the MetroSetu portal.
//                     </label>
//                   </div>

//                   <button
//                     className="g-btn-primary"
//                     onClick={handleSubmit}
//                     disabled={!agreed}
//                     style={{ opacity: agreed ? 1 : 0.55, cursor: agreed ? "pointer" : "not-allowed" }}
//                   >
//                     🔍 Find Best Mode of Transport
//                   </button>

//                   <p className="g-disclaimer">
//                     This is a free Government of India service under Smart Cities Mission. No personal data is stored on servers.
//                   </p>
//                 </div>
//               </div>

//               {/* MAP PANEL */}
//               <div className="g-panel">
//                 <div className="g-panel-header">
//                   <div className="g-panel-icon">🗺️</div>
//                   <div>
//                     <h3>Live Metro Network Map — Pune</h3>
//                     <p>
//                       {selectedCoords
//                         ? "📍 Your location and nearest station highlighted"
//                         : "Search a location above to see nearest metro station"}
//                     </p>
//                   </div>
//                 </div>
//                 <div style={{ padding: "14px" }}>
//                   {/* Map Legend */}
//                   <div style={{ display: "flex", gap: "16px", marginBottom: "10px", flexWrap: "wrap", fontSize: "11.5px", color: "#4a5568" }}>
//                     <span>🔵 Your Location</span>
//                     <span>🟢 Nearest Metro</span>
//                     <span>🔴 Metro Stations</span>
//                     <span>─── Route Line</span>
//                   </div>
//                   <GoogleMap
//                     mapContainerStyle={MAP_STYLE}
//                     zoom={13}
//                     center={selectedCoords || DEFAULT_CENTER}
//                     onLoad={map => (mapRef.current = map)}
//                     options={MAP_OPTIONS}
//                   >
//                     {/* User marker */}
//                     {selectedCoords && (
//                       <Marker
//                         position={selectedCoords}
//                         icon={{
//                           url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
//                           scaledSize: new window.google.maps.Size(40, 40)
//                         }}
//                         title="Your Location"
//                       />
//                     )}
//                     {/* Metro stations */}
//                     {metroStations.map((station, i) => (
//                       <Marker
//                         key={i}
//                         position={{ lat: station.lat, lng: station.lng }}
//                         icon={{
//                           url: nearestStation?.name === station.name
//                             ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
//                             : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
//                           scaledSize: new window.google.maps.Size(
//                             nearestStation?.name === station.name ? 44 : 32,
//                             nearestStation?.name === station.name ? 44 : 32
//                           )
//                         }}
//                         title={station.name}
//                       />
//                     ))}
//                     {/* Polyline */}
//                     {selectedCoords && nearestStation && (
//                       <Polyline
//                         path={[selectedCoords, { lat: nearestStation.lat, lng: nearestStation.lng }]}
//                         options={{
//                           strokeColor: "#154272",
//                           strokeOpacity: 0.9,
//                           strokeWeight: 3,
//                           icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "16px" }]
//                         }}
//                       />
//                     )}
//                   </GoogleMap>
//                   <div style={{ marginTop: "8px", padding: "8px 10px", background: "#f5f8fc", border: "1px solid #dde5ef", fontSize: "11px", color: "#718096" }}>
//                     ⓘ Map data © Google Maps. Metro station data sourced from Pune Metro Rail Corporation. Last updated: 19 Feb 2025.
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* ── SIDEBAR ── */}
//             <aside className="g-sidebar">
//               {/* Modes */}
//               <div className="g-sidebar-card">
//                 <div className="g-sidebar-head">🚦 Supported Transport Modes</div>
//                 <div className="g-sidebar-body">
//                   <div className="g-mode-list">
//                     {[
//                       ["🚶", "Walking", "Upto 1 km"],
//                       ["🚲", "Cycle / E-Cycle", "1 – 3 km"],
//                       ["🛵", "E-Rickshaw / Auto", "1 – 5 km"],
//                       ["🚌", "City Bus / Feeder", "2 – 8 km"],
//                       ["🚕", "App-based Cab", "Any distance"],
//                     ].map(([e, n, r]) => (
//                       <div key={n} className="g-mode-item">
//                         <span className="g-mode-emoji">{e}</span>
//                         <div className="g-mode-info">
//                           <strong>{n}</strong><span>{r}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* Stats */}
//               <div className="g-sidebar-card">
//                 <div className="g-sidebar-head">📊 MetroSetu at a Glance</div>
//                 <div className="g-sidebar-body">
//                   <div className="g-stats-grid">
//                     {[["18+", "Cities"], ["280+", "Stations"], ["5L+", "Daily Users"], ["96%", "Satisfaction"]].map(([v, l]) => (
//                       <div key={l} className="g-stat-box">
//                         <strong>{v}</strong><span>{l}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* How it Works */}
//               <div className="g-sidebar-card">
//                 <div className="g-sidebar-head">ℹ️ How It Works</div>
//                 <div className="g-sidebar-body">
//                   <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//                     {[
//                       ["1", "Search your home location in the search box above"],
//                       ["2", "MetroSetu auto-detects the nearest metro station"],
//                       ["3", "Click 'Find Best Mode' to get a personalised recommendation"],
//                       ["4", "View options with cost, time &amp; CO₂ savings estimates"],
//                     ].map(([n, t]) => (
//                       <div key={n} style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
//                         <span style={{ background: "#154272", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{n}</span>
//                         <span style={{ color: "#4a5568", lineHeight: "1.5" }} dangerouslySetInnerHTML={{ __html: t }} />
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* Helpdesk */}
//               <div className="g-sidebar-card">
//                 <div className="g-sidebar-head">📞 Helpdesk &amp; Support</div>
//                 <div className="g-sidebar-body">
//                   <div className="g-contact-list">
//                     <div className="g-contact-item"><strong>Toll-Free:</strong>1800-111-550</div>
//                     <div className="g-contact-item"><strong>Email:</strong>support@metrosetu.gov.in</div>
//                     <div className="g-contact-item"><strong>Hours:</strong>Mon–Sat, 6AM–11PM</div>
//                     <div className="g-contact-item"><strong>Grievance:</strong><a href="#" className="g-link">Click Here</a></div>
//                   </div>
//                 </div>
//               </div>
//             </aside>
//           </div>
//         </main>

//         <GovFooter />
//       </div>
//     </>
//   );
// };

// export default Home;



// Home.jsx — MetroSetu Government Portal with Dynamic Google Places Metro Fetch
import { useNavigate } from "react-router-dom";
import { useState, useRef, useCallback } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Polyline,
  Autocomplete,
  InfoWindow,
} from "@react-google-maps/api";
import { calculateDistance } from "../utils/distance";
import { fetchNearbyMetroStations, findNearestStation } from "../utils/fetchNearbyMetro";
import {
  GOV_STYLES,
  GovHeader,
  GovBreadcrumb,
  GovNotice,
  GovFooter,
} from "./GovLayout";

// ─── Constants ────────────────────────────────────────────────────────────────
const LIBRARIES = ["places"];
const MAP_STYLE = { width: "100%", height: "380px" };
const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };

const MAP_OPTIONS = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  styles: [
    { featureType: "water", stylers: [{ color: "#bfdbfe" }] },
    { featureType: "landscape", stylers: [{ color: "#f1f5f9" }] },
    { featureType: "road", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", stylers: [{ color: "#e2e8f0" }] },
    { featureType: "transit.station.rail", stylers: [{ visibility: "on" }, { color: "#154272" }] },
    { featureType: "poi.park", stylers: [{ color: "#d1fae5" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Location state
  const [location, setLocation] = useState("");
  const [selectedCoords, setSelectedCoords] = useState(null);

  // Dynamic metro stations fetched from Google Places
  const [metroStations, setMetroStations] = useState([]);   // all nearby stations
  const [nearestStation, setNearestStation] = useState(null);
  const [nearestDistance, setNearestDistance] = useState(null);

  // UI state
  const [agreed, setAgreed] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isFetchingMetro, setIsFetchingMetro] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [activeInfoWindow, setActiveInfoWindow] = useState(null); // placeId of clicked station

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyA9spKFBlhfECHHoXnMPRziyuUuhL124yo",
    libraries: LIBRARIES,
  });

  // ─── Core: fetch metro stations + find nearest ──────────────────────────────
  /**
   * Called after we have a confirmed lat/lng.
   * Fetches real metro stations from Google Places, finds nearest,
   * updates all state + localStorage, and fits map bounds.
   */
  const resolveMetroAndApply = useCallback(async (lat, lng, displayAddress) => {
    setFetchError("");
    setIsFetchingMetro(true);

    const coords = { lat, lng };
    setSelectedCoords(coords);
    setLocation(displayAddress);
    localStorage.setItem("userLat", lat);
    localStorage.setItem("userLng", lng);
    localStorage.setItem("userLocation", displayAddress);

    try {
      // 1. Fetch all nearby metro stations dynamically
      const stations = await fetchNearbyMetroStations(lat, lng);

      if (!stations || stations.length === 0) {
        setFetchError("No metro stations found within 10 km of this location.");
        setMetroStations([]);
        setNearestStation(null);
        setNearestDistance(null);
        setIsFetchingMetro(false);
        return;
      }

      setMetroStations(stations);

      // 2. Find nearest from fetched list
      const { nearest, distanceKm } = findNearestStation(lat, lng, stations, calculateDistance);
      setNearestStation(nearest);
      setNearestDistance(distanceKm);
      localStorage.setItem("nearestStation", nearest?.name || "");
      localStorage.setItem("distance", distanceKm);
      localStorage.setItem("nearestStationLat", nearest.lat);
      localStorage.setItem("nearestStationLng", nearest.lng);

      // 3. Fit map bounds to show user + all stations
      if (mapRef.current && nearest) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(coords);
        stations.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
        mapRef.current.fitBounds(bounds);
      }
    } catch (err) {
      console.error("Metro fetch error:", err);
      setFetchError(
        "Could not fetch nearby metro stations. Check your network or API key restrictions."
      );
      setMetroStations([]);
      setNearestStation(null);
      setNearestDistance(null);
    } finally {
      setIsFetchingMetro(false);
    }
  }, []);

  // ─── Autocomplete handler ────────────────────────────────────────────────────
  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    resolveMetroAndApply(lat, lng, place.formatted_address);
  };

  // ─── Auto-detect via GPS ─────────────────────────────────────────────────────
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Reverse geocode to get a human-readable address
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyA9spKFBlhfECHHoXnMPRziyuUuhL124yo`
          );
          const data = await res.json();
          const formattedAddress =
            data?.results?.[0]?.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

          await resolveMetroAndApply(lat, lng, formattedAddress);
        } catch {
          await resolveMetroAndApply(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission denied. Please allow location access and try again.");
        } else {
          alert("Unable to retrieve your location. Try searching manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─── Form submit ─────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!location || !selectedCoords) {
      alert("Please select a valid location from the suggestions.");
      return;
    }
    localStorage.setItem("userLocation", location);
    localStorage.setItem("distance", nearestDistance);
    navigate("/recommendation");
  };

  // ─── Loading screen ───────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <>
        <style>{GOV_STYLES}</style>
        <GovHeader />
        <div className="g-loading">
          <div className="g-spinner" />
          <p style={{ color: "#154272", fontWeight: 600 }}>Loading Map Services…</p>
          <p style={{ color: "#718096", fontSize: 12 }}>
            Please wait while we initialise Google Maps
          </p>
        </div>
      </>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{GOV_STYLES}
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>

      <div className="g-form-page">
        <GovHeader activeNav="Home" />
        <GovBreadcrumb crumbs={["Citizen Services", "Last Mile Connectivity Finder"]} />
        <GovNotice text="This service is live for 18+ metro cities under Smart Cities Mission. Map data is refreshed daily at 06:00 AM IST. For grievances, call 1800-111-550." />

        {/* HERO */}
        <div className="g-hero">
          <div className="g-hero-inner">
            <div className="g-hero-pill">🏅 Smart Mobility Initiative 2024–25</div>
            <h2>Find Your Best Last Mile Transport Mode</h2>
            <p>
              Search your home location on the map. MetroSetu will instantly identify the nearest
              metro station and recommend the most efficient, safe, and affordable transport option
              for your last mile journey.
            </p>
          </div>
        </div>

        <main id="main">
          <div className="g-content-wrap">

            {/* ── LEFT PANEL ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* LOCATION PANEL */}
              <div className="g-panel">
                <div className="g-panel-header">
                  <div className="g-panel-icon">🗺️</div>
                  <div>
                    <h3>Search Your Location</h3>
                    <p>
                      Fields marked <span style={{ color: "#c62828" }}>*</span> are mandatory.
                      Select location from suggestions only.
                    </p>
                  </div>
                </div>

                <div className="g-panel-body">

                  {/* ── Location search field ── */}
                  <div className="g-field">
                    <label className="g-label" htmlFor="location-search">
                      Home / Origin Location <span className="g-req">*</span>
                    </label>
                    <span className="g-hint">
                      Type your colony, sector, or area and select from dropdown
                      (e.g. Dwarka Sector 12, New Delhi)
                    </span>

                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      {/* Search input with Autocomplete */}
                      <div className="g-input-wrap" style={{ flex: 1 }}>
                        <span className="g-input-icon">📍</span>
                        <Autocomplete
                          onLoad={(ref) => (autocompleteRef.current = ref)}
                          onPlaceChanged={onPlaceChanged}
                        >
                          <input
                            id="location-search"
                            type="text"
                            className="g-input with-icon"
                            placeholder="Start typing your location…"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                          />
                        </Autocomplete>
                      </div>

                      {/* Auto-detect button */}
                      <button
                        type="button"
                        onClick={handleAutoDetect}
                        disabled={isLocating || isFetchingMetro}
                        title="Auto-detect my current location"
                        style={{
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "0 14px",
                          height: "42px",
                          background: isLocating || isFetchingMetro ? "#e2e8f0" : "#154272",
                          color: isLocating || isFetchingMetro ? "#718096" : "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: isLocating || isFetchingMetro ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                          transition: "background 0.2s",
                        }}
                      >
                        {isLocating ? (
                          <>
                            <span style={{
                              display: "inline-block",
                              width: "13px", height: "13px",
                              border: "2px solid #718096",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              animation: "spin 0.7s linear infinite",
                            }} />
                            Locating…
                          </>
                        ) : (
                          <>📡 Use My Location</>
                        )}
                      </button>
                    </div>

                    <span style={{ fontSize: "11px", color: "#718096", marginTop: "4px", display: "block" }}>
                      Or click <strong>📡 Use My Location</strong> to auto-detect via GPS
                    </span>
                  </div>

                  {/* ── Metro fetch status ── */}
                  {isFetchingMetro && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", background: "#eff6ff",
                      border: "1px solid #bfdbfe", borderRadius: "6px",
                      fontSize: "12px", color: "#154272", marginBottom: "12px",
                    }}>
                      <span style={{
                        display: "inline-block", width: "14px", height: "14px",
                        border: "2px solid #154272", borderTopColor: "transparent",
                        borderRadius: "50%", animation: "spin 0.7s linear infinite",
                      }} />
                      Fetching nearby metro stations from Google Maps…
                    </div>
                  )}

                  {/* ── Fetch error ── */}
                  {fetchError && !isFetchingMetro && (
                    <div style={{
                      padding: "10px 14px", background: "#fff5f5",
                      border: "1px solid #fed7d7", borderRadius: "6px",
                      fontSize: "12px", color: "#c53030", marginBottom: "12px",
                    }}>
                      ⚠️ {fetchError}
                    </div>
                  )}

                  {/* ── Auto-computed distance ── */}
                  <div className="g-field">
                    <label className="g-label">Distance to Nearest Metro Station</label>
                    <span className="g-hint">
                      Auto-calculated based on your selected location. Read-only field.
                    </span>
                    <div className="g-input-wrap">
                      <span className="g-input-icon">📏</span>
                      <input
                        type="text"
                        className="g-input with-icon with-suffix readonly"
                        value={nearestDistance || ""}
                        placeholder="Auto-calculated after location selection"
                        readOnly
                      />
                      <span className="g-input-suffix">km</span>
                    </div>
                  </div>

                  {/* ── Nearest Station Card ── */}
                  {nearestStation && (
                    <div className="g-station-info">
                      <span className="g-station-icon">🚇</span>
                      <div>
                        <div className="g-station-name">{nearestStation.name}</div>
                        <div className="g-station-dist">
                          📏 {nearestDistance} km from your location
                        </div>
                        <div style={{ fontSize: "11px", color: "#2d6a4f", marginTop: "2px" }}>
                          📍 {nearestStation.vicinity}
                        </div>
                        <div className="g-station-line">
                          ✅ Fetched live from Google Maps
                        </div>
                        {metroStations.length > 1 && (
                          <div style={{ fontSize: "11px", color: "#718096", marginTop: "4px" }}>
                            🗺️ {metroStations.length} metro stations found nearby — click markers on map for details
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <hr className="g-divider" />

                  {/* ── Declaration ── */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{
                      display: "flex", alignItems: "flex-start", gap: "10px",
                      cursor: "pointer", fontSize: "12px", color: "#4a5568", lineHeight: "1.6",
                    }}>
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        style={{
                          marginTop: "3px", accentColor: "#154272",
                          width: "15px", height: "15px", flexShrink: 0,
                        }}
                      />
                      I declare that the location information provided is accurate and I agree to the{" "}
                      <a href="#" className="g-link" style={{ marginLeft: "4px" }}>Terms of Use</a> and
                      <a href="#" className="g-link" style={{ marginLeft: "4px" }}>Privacy Policy</a> of the MetroSetu portal.
                    </label>
                  </div>

                  <button
                    className="g-btn-primary"
                    onClick={handleSubmit}
                    disabled={!agreed || isFetchingMetro}
                    style={{
                      opacity: agreed && !isFetchingMetro ? 1 : 0.55,
                      cursor: agreed && !isFetchingMetro ? "pointer" : "not-allowed",
                    }}
                  >
                    🔍 Find Best Mode of Transport
                  </button>

                  <p className="g-disclaimer">
                    This is a free Government of India service under Smart Cities Mission. No personal
                    data is stored on servers.
                  </p>
                </div>
              </div>

              {/* MAP PANEL */}
              <div className="g-panel">
                <div className="g-panel-header">
                  <div className="g-panel-icon">🗺️</div>
                  <div>
                    <h3>Live Metro Network Map</h3>
                    <p>
                      {selectedCoords
                        ? `📍 Showing ${metroStations.length} live metro stations near you`
                        : "Search a location above to see nearby metro stations"}
                    </p>
                  </div>
                </div>

                <div style={{ padding: "14px" }}>
                  {/* Legend */}
                  <div style={{
                    display: "flex", gap: "16px", marginBottom: "10px",
                    flexWrap: "wrap", fontSize: "11.5px", color: "#4a5568",
                  }}>
                    <span>🔵 Your Location</span>
                    <span>🟢 Nearest Metro</span>
                    <span>🔴 Other Metro Stations</span>
                    <span>─── Route Line</span>
                  </div>

                  <GoogleMap
                    mapContainerStyle={MAP_STYLE}
                    zoom={13}
                    center={selectedCoords || DEFAULT_CENTER}
                    onLoad={(map) => (mapRef.current = map)}
                    options={MAP_OPTIONS}
                  >
                    {/* User location marker */}
                    {selectedCoords && (
                      <Marker
                        position={selectedCoords}
                        icon={{
                          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                          scaledSize: new window.google.maps.Size(40, 40),
                        }}
                        title="Your Location"
                      />
                    )}

                    {/* All dynamically fetched metro station markers */}
                    {metroStations.map((station) => {
                      const isNearest = nearestStation?.placeId === station.placeId;
                      return (
                        <Marker
                          key={station.placeId}
                          position={{ lat: station.lat, lng: station.lng }}
                          icon={{
                            // url: isNearest
                            //   ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                            //   : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                            url:"/icons/metro.png",
                            scaledSize: new window.google.maps.Size(
                              isNearest ? 44 : 32,
                              isNearest ? 44 : 32
                            ),
                          }}
                          title={station.name}
                          onClick={() =>
                            setActiveInfoWindow(
                              activeInfoWindow === station.placeId ? null : station.placeId
                            )
                          }
                        >
                          {/* InfoWindow on click */}
                          {activeInfoWindow === station.placeId && (
                            <InfoWindow onCloseClick={() => setActiveInfoWindow(null)}>
                              <div style={{ fontSize: "12px", maxWidth: "180px" }}>
                                <strong style={{ color: "#154272" }}>{station.name}</strong>
                                {isNearest && (
                                  <div style={{
                                    background: "#154272", color: "#fff",
                                    fontSize: "10px", padding: "2px 6px",
                                    borderRadius: "3px", display: "inline-block",
                                    marginTop: "4px", marginBottom: "4px",
                                  }}>
                                    ⭐ Nearest Station
                                  </div>
                                )}
                                <div style={{ color: "#4a5568", marginTop: "4px" }}>
                                  {station.vicinity}
                                </div>
                                {isNearest && nearestDistance && (
                                  <div style={{ color: "#2d6a4f", fontWeight: 600, marginTop: "4px" }}>
                                    📏 {nearestDistance} km from you
                                  </div>
                                )}
                              </div>
                            </InfoWindow>
                          )}
                        </Marker>
                      );
                    })}

                    {/* Polyline: user → nearest station */}
                    {selectedCoords && nearestStation && (
                      <Polyline
                        path={[
                          selectedCoords,
                          { lat: nearestStation.lat, lng: nearestStation.lng },
                        ]}
                        options={{
                          strokeColor: "#154272",
                          strokeOpacity: 0.9,
                          strokeWeight: 3,
                          icons: [{
                            icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                            offset: "0",
                            repeat: "16px",
                          }],
                        }}
                      />
                    )}
                  </GoogleMap>

                  <div style={{
                    marginTop: "8px", padding: "8px 10px",
                    background: "#f5f8fc", border: "1px solid #dde5ef",
                    fontSize: "11px", color: "#718096",
                  }}>
                    ⓘ Metro station data fetched live from Google Places API. Map data © Google Maps.
                    {metroStations.length > 0 && (
                      <span style={{ marginLeft: "6px", color: "#154272", fontWeight: 600 }}>
                        {metroStations.length} stations loaded.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── SIDEBAR ── */}
            <aside className="g-sidebar">
              {/* Modes */}
              <div className="g-sidebar-card">
                <div className="g-sidebar-head">🚦 Supported Transport Modes</div>
                <div className="g-sidebar-body">
                  <div className="g-mode-list">
                    {[
                      ["🚶", "Walking", "Upto 1 km"],
                      ["🚲", "Cycle / E-Cycle", "1 – 3 km"],
                      ["🛵", "E-Rickshaw / Auto", "1 – 5 km"],
                      ["🚌", "City Bus / Feeder", "2 – 8 km"],
                      ["🚕", "App-based Cab", "Any distance"],
                    ].map(([e, n, r]) => (
                      <div key={n} className="g-mode-item">
                        <span className="g-mode-emoji">{e}</span>
                        <div className="g-mode-info">
                          <strong>{n}</strong><span>{r}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="g-sidebar-card">
                <div className="g-sidebar-head">📊 MetroSetu at a Glance</div>
                <div className="g-sidebar-body">
                  <div className="g-stats-grid">
                    {[["18+", "Cities"], ["280+", "Stations"], ["5L+", "Daily Users"], ["96%", "Satisfaction"]].map(([v, l]) => (
                      <div key={l} className="g-stat-box">
                        <strong>{v}</strong><span>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="g-sidebar-card">
                <div className="g-sidebar-head">ℹ️ How It Works</div>
                <div className="g-sidebar-body">
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      ["1", "Search your home location in the search box above"],
                      ["2", "MetroSetu fetches real metro stations live from Google Maps"],
                      ["3", "Click 'Find Best Mode' to get a personalised recommendation"],
                      ["4", "View options with cost, time &amp; CO₂ savings estimates"],
                    ].map(([n, t]) => (
                      <div key={n} style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                        <span style={{
                          background: "#154272", color: "#fff", borderRadius: "50%",
                          width: "20px", height: "20px", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 700, flexShrink: 0,
                        }}>{n}</span>
                        <span
                          style={{ color: "#4a5568", lineHeight: "1.5" }}
                          dangerouslySetInnerHTML={{ __html: t }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Helpdesk */}
              <div className="g-sidebar-card">
                <div className="g-sidebar-head">📞 Helpdesk &amp; Support</div>
                <div className="g-sidebar-body">
                  <div className="g-contact-list">
                    <div className="g-contact-item"><strong>Toll-Free:</strong> 1800-111-550</div>
                    <div className="g-contact-item"><strong>Email:</strong> support@metrosetu.gov.in</div>
                    <div className="g-contact-item"><strong>Hours:</strong> Mon–Sat, 6AM–11PM</div>
                    <div className="g-contact-item">
                      <strong>Grievance:</strong> <a href="#" className="g-link">Click Here</a>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </main>

        <GovFooter />
      </div>
    </>
  );
};

export default Home;