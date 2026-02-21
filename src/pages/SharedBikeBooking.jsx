

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root {
    --navy:#0B1F3A; --navy2:#102848; --accent:#1A6BFF; --gold:#C8972A;
    --light:#F4F6FA; --border:#D3D9E4; --text:#1C2B3A; --muted:#6B7B8F;
    --white:#FFFFFF; --success:#1A7A4A; --card-shadow:0 2px 16px rgba(11,31,58,0.09);
    --green:#1A7A4A; --orange:#E07B00;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  .gov-page { font-family:'DM Sans',sans-serif; background:var(--light); min-height:100vh; }
  .gov-header { background:var(--navy); color:#fff; border-bottom:4px solid var(--gold); }
  .gov-header-inner { max-width:900px;margin:0 auto;padding:18px 32px;display:flex;align-items:center;gap:18px; }
  .gov-crest { width:52px;height:52px;background:var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0; }
  .gov-header-text h1 { font-family:'DM Serif Display',serif;font-size:1.4rem; }
  .gov-header-text p { font-size:0.75rem;color:#A8BCD4;text-transform:uppercase;letter-spacing:0.12em;margin-top:2px; }

  .gov-breadcrumb { background:var(--navy2); border-bottom:1px solid rgba(255,255,255,0.06); }
  .gov-breadcrumb-inner { max-width:900px;margin:0 auto;padding:10px 32px;font-size:0.75rem;color:#7A9BBF; }
  .gov-breadcrumb span { color:var(--gold);font-weight:600; }
  .gov-breadcrumb a { color:#7A9BBF;text-decoration:none;cursor:pointer; }
  .gov-breadcrumb a:hover { color:var(--gold); }

  .gov-content { max-width:900px; margin:0 auto; padding:36px 32px 60px; }
  .section-label {
    font-size:0.68rem;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;
    color:var(--muted);margin-bottom:16px;display:flex;align-items:center;gap:10px;
  }
  .section-label::after { content:'';flex:1;height:1px;background:var(--border); }

  .back-btn {
    display:inline-flex;align-items:center;gap:8px;padding:10px 20px;
    background:var(--white);border:1px solid var(--border);border-radius:4px;
    font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:600;
    cursor:pointer;color:var(--navy);transition:all 0.15s;margin-bottom:24px;
  }
  .back-btn:hover { border-color:var(--accent);color:var(--accent); }

  .placeholder-note {
    background:#FFF8E7;border:1px solid #E8C96A;border-radius:4px;
    padding:12px 18px;font-size:0.8rem;color:#7A5A00;margin-bottom:16px;
    display:flex;align-items:center;gap:10px;
  }

  /* Type selector */
  .type-selector { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px; }
  .type-btn {
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
    padding:20px 12px;background:var(--white);border:2px solid var(--border);border-radius:6px;
    cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif;
  }
  .type-btn:hover { border-color:var(--accent); }
  .type-btn.active { border-color:var(--accent);background:#EEF3FF; }
  .type-btn .type-icon { font-size:2rem; }
  .type-btn .type-label { font-size:0.88rem;font-weight:700;color:var(--navy); }
  .type-btn .type-sub { font-size:0.72rem;color:var(--muted); }

  /* Vehicle cards */
  .vehicles-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-bottom:20px; }
  .vehicle-card {
    background:var(--white);border:1px solid var(--border);border-radius:6px;
    padding:18px 20px;box-shadow:var(--card-shadow);
    display:flex;flex-direction:column;gap:10px;
    transition:transform 0.15s,box-shadow 0.15s;
  }
  .vehicle-card:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(11,31,58,0.12); }
  .vehicle-card.selected { border-color:var(--accent);border-width:2px;background:#EEF3FF; }
  .v-top { display:flex;align-items:center;gap:12px; }
  .v-icon { font-size:2rem; }
  .v-name { font-weight:700;font-size:0.95rem;color:var(--navy); }
  .v-brand { font-size:0.75rem;color:var(--muted); }
  .v-meta { display:flex;gap:10px;font-size:0.75rem; }
  .v-badge {
    padding:3px 9px;border-radius:3px;font-weight:700;font-size:0.68rem;
    text-transform:uppercase;letter-spacing:0.08em;
  }
  .badge-green { background:#E0F5EB;color:var(--green); }
  .badge-orange { background:#FFF0D4;color:var(--orange); }
  .v-distance { font-size:0.75rem;color:var(--muted); }
  .v-price { font-family:'DM Serif Display',serif;font-size:1.1rem;color:var(--navy); }
  .v-price span { font-size:0.7rem;font-family:'DM Sans',sans-serif;font-weight:400;color:var(--muted); }
  .v-btn {
    padding:9px;background:var(--accent);color:#fff;border:none;border-radius:4px;
    font-size:0.8rem;font-weight:700;cursor:pointer;transition:all 0.15s;
    font-family:'DM Sans',sans-serif;
  }
  .v-btn:hover { background:#155FE8; }

  /* Booking form */
  .booking-form {
    background:var(--white);border:1px solid var(--border);border-radius:6px;
    box-shadow:var(--card-shadow);overflow:hidden;
  }
  .form-header { background:var(--navy);color:#fff;padding:16px 24px; }
  .form-header h3 { font-family:'DM Serif Display',serif;font-size:1.1rem; }
  .form-body { padding:24px;display:flex;flex-direction:column;gap:16px; }
  .form-group { display:flex;flex-direction:column;gap:6px; }
  .form-group label { font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted); }
  .form-group input, .form-group select {
    padding:11px 14px;border:1px solid var(--border);border-radius:4px;
    font-family:'DM Sans',sans-serif;font-size:0.9rem;color:var(--text);
    outline:none;transition:border-color 0.15s;
  }
  .form-group input:focus, .form-group select:focus { border-color:var(--accent); }
  .form-row { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
  .submit-btn {
    padding:13px;background:var(--accent);color:#fff;border:none;border-radius:4px;
    font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:700;cursor:pointer;
    width:100%;transition:all 0.15s;
  }
  .submit-btn:hover { background:#155FE8;transform:translateY(-1px);box-shadow:0 4px 14px rgba(26,107,255,0.3); }

  /* External links */
  .external-links { display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px; }
  .ext-card {
    background:var(--white);border:1px solid var(--border);border-radius:6px;
    padding:18px 20px;box-shadow:var(--card-shadow);display:flex;flex-direction:column;gap:8px;cursor:pointer;
    transition:transform 0.15s,box-shadow 0.15s;text-decoration:none;
  }
  .ext-card:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(11,31,58,0.12);border-color:var(--accent); }
  .ext-icon { font-size:1.8rem; }
  .ext-name { font-weight:700;font-size:0.95rem;color:var(--navy); }
  .ext-desc { font-size:0.75rem;color:var(--muted);line-height:1.4; }
  .ext-arrow { font-size:0.75rem;color:var(--accent);font-weight:700;margin-top:4px; }

  .gov-footer { background:var(--navy);color:#5A7A9F;text-align:center;padding:20px 32px;font-size:0.72rem;letter-spacing:0.06em;border-top:2px solid var(--gold);margin-top:20px; }

  @media(max-width:700px){
    .gov-content{padding:24px 16px 40px;}
    .gov-header-inner{padding:14px 16px;}
    .type-selector{grid-template-columns:1fr;}
    .form-row{grid-template-columns:1fr;}
    .vehicles-grid{grid-template-columns:1fr;}
  }
`;

const MOCK_VEHICLES = {
  bike: [
    { id: 1, icon: "🏍", name: "Hero Splendor", brand: "Hero", available: true, distance: "0.2 km", pricePerKm: 3.5, priceUnit: "₹3.5/km" },
    { id: 2, icon: "🏍", name: "Honda CB Shine", brand: "Honda", available: true, distance: "0.4 km", pricePerKm: 4, priceUnit: "₹4/km" },
    { id: 3, icon: "🏍", name: "Bajaj Pulsar", brand: "Bajaj", available: false, distance: "0.6 km", pricePerKm: 4.5, priceUnit: "₹4.5/km" },
  ],
  scooty: [
    { id: 4, icon: "🛵", name: "Honda Activa", brand: "Honda", available: true, distance: "0.3 km", pricePerKm: 3.5, priceUnit: "₹3.5/km" },
    { id: 5, icon: "🛵", name: "TVS Jupiter", brand: "TVS", available: true, distance: "0.5 km", pricePerKm: 3.5, priceUnit: "₹3.5/km" },
    { id: 6, icon: "🛵", name: "Suzuki Access", brand: "Suzuki", available: false, distance: "0.8 km", pricePerKm: 4, priceUnit: "₹4/km" },
  ],
};

const EXTERNAL_APPS = [
  { name: "Rapido Bike", icon: "🟡", desc: "Book a quick bike ride on Rapido", url: "https://rapido.bike" },
  { name: "Bounce", icon: "🟠", desc: "Self-ride scooters available nearby", url: "https://bounce.bike" },
  { name: "Yulu", icon: "🟢", desc: "Electric cycles & bikes for rent", url: "https://www.yulu.bike" },
];

const SharedBikeBooking = () => {
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState("bike");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const concessionApproved = !!user?.concessionApproved;

  const vehicles = MOCK_VEHICLES[vehicleType].map((v) => {
    if (!concessionApproved) return v;
    const discounted = v.pricePerKm * 0.75;
    return { ...v, priceUnit: `₹${discounted}/km`, pricePerKm: discounted, originalPriceUnit: v.priceUnit };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } } };

  return (
    <div className="gov-page">
      <style>{styles}</style>

      <header className="gov-header">
        <div className="gov-header-inner">
          <div className="gov-crest">🏍</div>
          <div className="gov-header-text">
            <h1>Shared Bike & Scooty</h1>
            <p>Two-Wheeler Pool Mobility · Government of India</p>
          </div>
        </div>
      </header>

      <div className="gov-breadcrumb">
        <div className="gov-breadcrumb-inner">
          <a onClick={() => navigate("/home")}>HOME</a> &nbsp;›&nbsp;
          <a onClick={() => navigate("/recommendation")}>RECOMMENDATION</a> &nbsp;›&nbsp;
          <span>SHARED BIKE / SCOOTY</span>
        </div>
      </div>

      <main className="gov-content">
        <motion.div variants={containerVariants} initial="hidden" animate="show">

          <motion.div variants={itemVariants}>
            <button className="back-btn" onClick={() => navigate("/recommendation")}>← Back</button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="placeholder-note">
              ⚙️ &nbsp;<strong>Feature in Development:</strong> Booking backend will be connected here. UI is fully ready.
            </div>
          </motion.div>

          {/* External Apps */}
          <motion.div variants={itemVariants}>
            <div className="section-label">Quick Book via App</div>
            <div className="external-links">
              {EXTERNAL_APPS.map((app) => (
                <a
                  key={app.name}
                  className="ext-card"
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="ext-icon">{app.icon}</div>
                  <div className="ext-name">{app.name} ↗</div>
                  <div className="ext-desc">{app.desc}</div>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Type Selector */}
          <motion.div variants={itemVariants}>
            <div className="section-label">Select Vehicle Type</div>
            <div className="type-selector">
              <div
                className={`type-btn${vehicleType === "bike" ? " active" : ""}`}
                onClick={() => { setVehicleType("bike"); setSelectedVehicle(null); }}
              >
                <div className="type-icon">🏍</div>
                <div className="type-label">Bike</div>
                <div className="type-sub">For 1 person · faster</div>
              </div>
              <div
                className={`type-btn${vehicleType === "scooty" ? " active" : ""}`}
                onClick={() => { setVehicleType("scooty"); setSelectedVehicle(null); }}
              >
                <div className="type-icon">🛵</div>
                <div className="type-label">Scooty</div>
                <div className="type-sub">Easy to ride · comfortable</div>
              </div>
            </div>
          </motion.div>

          {/* Available Vehicles */}
          <motion.div variants={itemVariants}>
            <div className="section-label">Available Nearby</div>
            <div className="vehicles-grid">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className={`vehicle-card${selectedVehicle?.id === v.id ? " selected" : ""}${!v.available ? " disabled" : ""}`}
                  style={{ opacity: v.available ? 1 : 0.5 }}
                >
                  <div className="v-top">
                    <div className="v-icon">{v.icon}</div>
                    <div>
                      <div className="v-name">{v.name}</div>
                      <div className="v-brand">{v.brand}</div>
                    </div>
                  </div>
                  <div className="v-meta">
                    <span className={`v-badge ${v.available ? "badge-green" : "badge-orange"}`}>
                      {v.available ? "Available" : "In Use"}
                    </span>
                    <span className="v-distance">📍 {v.distance}</span>
                  </div>
                  <div className="v-price">
                    {v.priceUnit} <span>rental</span>
                    {concessionApproved && <span style={{ display: "block", fontSize: "0.7rem", color: "#0d9488", fontWeight: "600" }}>25% Concession applied</span>}
                  </div>
                  {v.available && (
                    <button
                      className="v-btn"
                      onClick={() => setSelectedVehicle(v)}
                    >
                      {selectedVehicle?.id === v.id ? "✓ Selected" : "Select This"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Booking Form */}
          {!submitted ? (
            <motion.div variants={itemVariants}>
              <div className="section-label">Booking Details</div>
              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="form-header">
                  <h3>
                    {selectedVehicle
                      ? `Booking: ${selectedVehicle.name}`
                      : "Complete Your Booking"}
                  </h3>
                </div>
                <div className="form-body">
                  {!selectedVehicle && (
                    <div style={{ background: "#FFF8E7", border: "1px solid #E8C96A", borderRadius: "4px", padding: "12px 16px", fontSize: "0.82rem", color: "#7A5A00" }}>
                      ⚠️ Please select a vehicle above first
                    </div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Pickup Point</label>
                      <input type="text" placeholder="Your location" required />
                    </div>
                    <div className="form-group">
                      <label>Drop Point</label>
                      <input type="text" placeholder="Destination" required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration</label>
                      <select>
                        <option>30 minutes</option>
                        <option>1 hour</option>
                        <option>2 hours</option>
                        <option>Half day (4 hrs)</option>
                        <option>Full day</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Start Time</label>
                      <input type="time" defaultValue={`${new Date().getHours().toString().padStart(2,"0")}:00`} />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={!selectedVehicle}
                    style={{ opacity: selectedVehicle ? 1 : 0.5, cursor: selectedVehicle ? "pointer" : "not-allowed" }}
                  >
                    🏍 Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <div style={{
                background: "#F0FFF7", border: "1px solid #1A7A4A", borderRadius: "6px",
                padding: "32px", textAlign: "center", boxShadow: "var(--card-shadow)",
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✅</div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.4rem", color: "#0B3A1F", marginBottom: "8px" }}>
                  {selectedVehicle?.name} Booked!
                </div>
                <div style={{ color: "#2E7A50", fontSize: "0.9rem" }}>
                  Your vehicle is ready. Head to the pickup point within 10 minutes.
                </div>
                <button
                  style={{ marginTop: "20px", padding: "10px 24px", background: "#1A7A4A", color: "#fff", border: "none", borderRadius: "4px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
                  onClick={() => navigate("/recommendation")}
                >
                  ← Back to Recommendations
                </button>
              </div>
            </motion.div>
          )}

        </motion.div>
      </main>

      <footer className="gov-footer">
        URBAN MOBILITY INTELLIGENCE SYSTEM · TWO-WHEELER MOBILITY DIVISION · GOVT. OF INDIA
      </footer>
    </div>
  );
};

export default SharedBikeBooking;