// Home.jsx — MetroSetu Government Portal with Google Maps
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Polyline,
  Autocomplete
} from "@react-google-maps/api";
import { metroStations } from "../data/metroStations";
import { calculateDistance } from "../utils/distance";
import {
  GOV_STYLES,
  GovHeader,
  GovBreadcrumb,
  GovNotice,
  GovFooter
} from "./GovLayout";

const LIBRARIES = ["places"];
const MAP_STYLE = { width: "100%", height: "380px" };
const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };

// Custom map style — clean, government-ish
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
  ]
};

const Home = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [location, setLocation] = useState("");
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [nearestStation, setNearestStation] = useState(null);
  const [nearestDistance, setNearestDistance] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyA9spKFBlhfECHHoXnMPRziyuUuhL124yo",
    libraries: LIBRARIES
  });

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const coords = { lat, lng };

    setSelectedCoords(coords);
    setLocation(place.formatted_address);
    localStorage.setItem("userLat", lat);
    localStorage.setItem("userLng", lng);

    // Find nearest metro
    let minDist = Infinity, nearest = null;
    metroStations.forEach(s => {
      const d = parseFloat(calculateDistance(lat, lng, s.lat, s.lng));
      if (d < minDist) { minDist = d; nearest = s; }
    });

    setNearestStation(nearest);
    setNearestDistance(minDist.toFixed(2));
    localStorage.setItem("nearestStation", nearest?.name || "");
    localStorage.setItem("distance", minDist);

    // Fit bounds
    if (mapRef.current && nearest) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(coords);
      bounds.extend({ lat: nearest.lat, lng: nearest.lng });
      mapRef.current.fitBounds(bounds);
    }
  };

  const handleSubmit = () => {
    if (!location || !selectedCoords) {
      alert("Please select a valid location from the suggestions.");
      return;
    }
    localStorage.setItem("userLocation", location);
    localStorage.setItem("distance", nearestDistance);
    navigate("/recommendation");
  };

  if (!isLoaded) {
    return (
      <>
        <style>{GOV_STYLES}</style>
        <GovHeader />
        <div className="g-loading">
          <div className="g-spinner" />
          <p style={{ color: "#154272", fontWeight: 600 }}>Loading Map Services…</p>
          <p style={{ color: "#718096", fontSize: 12 }}>Please wait while we initialise Google Maps</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{GOV_STYLES}</style>
      <div className="g-form-page">
        <GovHeader activeNav="Home" />
        <GovBreadcrumb crumbs={["Citizen Services", "Last Mile Connectivity Finder"]} />
        <GovNotice text="This service is live for 18+ metro cities under Smart Cities Mission. Map data is refreshed daily at 06:00 AM IST. For grievances, call 1800-111-550." />

        {/* HERO */}
        <div className="g-hero">
          <div className="g-hero-inner">
            <div className="g-hero-pill">🏅 Smart Mobility Initiative 2024–25</div>
            <h2>Find Your Best Last Mile Transport Mode</h2>
            <p>Search your home location on the map. MetroSetu will instantly identify the nearest metro station and recommend the most efficient, safe, and affordable transport option for your last mile journey.</p>
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
                    <p>Fields marked <span style={{color:"#c62828"}}>*</span> are mandatory. Select location from suggestions only.</p>
                  </div>
                </div>
                <div className="g-panel-body">
                  <div className="g-field">
                    <label className="g-label" htmlFor="location-search">
                      Home / Origin Location <span className="g-req">*</span>
                    </label>
                    <span className="g-hint">Type your colony, sector, or area and select from dropdown (e.g. Dwarka Sector 12, New Delhi)</span>
                    <div className="g-input-wrap">
                      <span className="g-input-icon">📍</span>
                      <Autocomplete
                        onLoad={ref => (autocompleteRef.current = ref)}
                        onPlaceChanged={onPlaceChanged}
                      >
                        <input
                          id="location-search"
                          type="text"
                          className="g-input with-icon"
                          placeholder="Start typing your location…"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                        />
                      </Autocomplete>
                    </div>
                  </div>

                  {/* Auto-computed distance */}
                  <div className="g-field">
                    <label className="g-label">Distance to Nearest Metro Station</label>
                    <span className="g-hint">Auto-calculated based on your selected location. Read-only field.</span>
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

                  {/* Nearest Station Card */}
                  {nearestStation && (
                    <div className="g-station-info">
                      <span className="g-station-icon">🚇</span>
                      <div>
                        <div className="g-station-name">{nearestStation.name}</div>
                        <div className="g-station-dist">📏 {nearestDistance} km from your location</div>
                        <div className="g-station-line">✅ Nearest metro station auto-detected</div>
                      </div>
                    </div>
                  )}

                  <hr className="g-divider" />

                  {/* Declaration */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "#4a5568", lineHeight: "1.6" }}>
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        style={{ marginTop: "3px", accentColor: "#154272", width: "15px", height: "15px", flexShrink: 0 }}
                      />
                      I declare that the location information provided is accurate and I agree to the
                      <a href="#" className="g-link" style={{ marginLeft: "4px" }}>Terms of Use</a> and
                      <a href="#" className="g-link" style={{ marginLeft: "4px" }}>Privacy Policy</a> of the MetroSetu portal.
                    </label>
                  </div>

                  <button
                    className="g-btn-primary"
                    onClick={handleSubmit}
                    disabled={!agreed}
                    style={{ opacity: agreed ? 1 : 0.55, cursor: agreed ? "pointer" : "not-allowed" }}
                  >
                    🔍 Find Best Mode of Transport
                  </button>

                  <p className="g-disclaimer">
                    This is a free Government of India service under Smart Cities Mission. No personal data is stored on servers.
                  </p>
                </div>
              </div>

              {/* MAP PANEL */}
              <div className="g-panel">
                <div className="g-panel-header">
                  <div className="g-panel-icon">🗺️</div>
                  <div>
                    <h3>Live Metro Network Map — Pune</h3>
                    <p>
                      {selectedCoords
                        ? "📍 Your location and nearest station highlighted"
                        : "Search a location above to see nearest metro station"}
                    </p>
                  </div>
                </div>
                <div style={{ padding: "14px" }}>
                  {/* Map Legend */}
                  <div style={{ display: "flex", gap: "16px", marginBottom: "10px", flexWrap: "wrap", fontSize: "11.5px", color: "#4a5568" }}>
                    <span>🔵 Your Location</span>
                    <span>🟢 Nearest Metro</span>
                    <span>🔴 Metro Stations</span>
                    <span>─── Route Line</span>
                  </div>
                  <GoogleMap
                    mapContainerStyle={MAP_STYLE}
                    zoom={13}
                    center={selectedCoords || DEFAULT_CENTER}
                    onLoad={map => (mapRef.current = map)}
                    options={MAP_OPTIONS}
                  >
                    {/* User marker */}
                    {selectedCoords && (
                      <Marker
                        position={selectedCoords}
                        icon={{
                          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                          scaledSize: new window.google.maps.Size(40, 40)
                        }}
                        title="Your Location"
                      />
                    )}
                    {/* Metro stations */}
                    {metroStations.map((station, i) => (
                      <Marker
                        key={i}
                        position={{ lat: station.lat, lng: station.lng }}
                        icon={{
                          url: nearestStation?.name === station.name
                            ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                            : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                          scaledSize: new window.google.maps.Size(
                            nearestStation?.name === station.name ? 44 : 32,
                            nearestStation?.name === station.name ? 44 : 32
                          )
                        }}
                        title={station.name}
                      />
                    ))}
                    {/* Polyline */}
                    {selectedCoords && nearestStation && (
                      <Polyline
                        path={[selectedCoords, { lat: nearestStation.lat, lng: nearestStation.lng }]}
                        options={{
                          strokeColor: "#154272",
                          strokeOpacity: 0.9,
                          strokeWeight: 3,
                          icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "16px" }]
                        }}
                      />
                    )}
                  </GoogleMap>
                  <div style={{ marginTop: "8px", padding: "8px 10px", background: "#f5f8fc", border: "1px solid #dde5ef", fontSize: "11px", color: "#718096" }}>
                    ⓘ Map data © Google Maps. Metro station data sourced from Pune Metro Rail Corporation. Last updated: 19 Feb 2025.
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
                    {[["18+","Cities"],["280+","Stations"],["5L+","Daily Users"],["96%","Satisfaction"]].map(([v,l]) => (
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
                      ["2", "MetroSetu auto-detects the nearest metro station"],
                      ["3", "Click 'Find Best Mode' to get a personalised recommendation"],
                      ["4", "View options with cost, time &amp; CO₂ savings estimates"],
                    ].map(([n, t]) => (
                      <div key={n} style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                        <span style={{ background: "#154272", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{n}</span>
                        <span style={{ color: "#4a5568", lineHeight: "1.5" }} dangerouslySetInnerHTML={{ __html: t }} />
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
                    <div className="g-contact-item"><strong>Toll-Free:</strong>1800-111-550</div>
                    <div className="g-contact-item"><strong>Email:</strong>support@metrosetu.gov.in</div>
                    <div className="g-contact-item"><strong>Hours:</strong>Mon–Sat, 6AM–11PM</div>
                    <div className="g-contact-item"><strong>Grievance:</strong><a href="#" className="g-link">Click Here</a></div>
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