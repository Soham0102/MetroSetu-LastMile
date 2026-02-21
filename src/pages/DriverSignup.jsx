import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const VEHICLE_TYPES = [
  { value: "", label: "Select vehicle type" },
  { value: "Auto", label: "Auto" },
  { value: "Car", label: "Car" },
  { value: "Sedan", label: "Sedan" },
  { value: "Go Sedan", label: "Go Sedan" },
];

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #154272, #1e88e5)",
  },
  card: {
    background: "white",
    padding: "32px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },
  title: { textAlign: "center", marginBottom: "4px", color: "#154272", fontSize: "22px" },
  subtitle: { textAlign: "center", marginBottom: "20px", color: "#666", fontSize: "13px" },
  input: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "white",
    cursor: "pointer",
  },
  label: { display: "block", marginBottom: "4px", fontSize: "12px", color: "#333", fontWeight: "600" },
  docSection: { marginTop: "8px", marginBottom: "16px", padding: "12px", background: "#f5f5f5", borderRadius: "8px" },
  fileInput: { width: "100%", fontSize: "13px", marginTop: "4px" },
  button: {
    width: "100%",
    padding: "12px",
    background: "#154272",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
  },
  backButton: {
    width: "100%",
    marginTop: "10px",
    padding: "10px",
    background: "transparent",
    color: "#154272",
    border: "2px solid #154272",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  error: {
    background: "#ffe0e0",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    color: "red",
    fontSize: "13px",
  },
  linkText: { textAlign: "center", marginTop: "12px", fontSize: "14px" },
};

export default function DriverSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    vehicleType: "",
    vehicleNumber: "",
    licenseNumber: "",
  });
  const [rcFile, setRcFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone || !form.password || !form.gender) {
      return setError("All basic fields are required");
    }
    if (!form.vehicleType || !form.vehicleNumber || !form.licenseNumber) {
      return setError("Vehicle type, vehicle number, and license number are required");
    }
    if (!rcFile) return setError("RC document is required");
    if (!insuranceFile) return setError("Insurance document is required");

    try {
      setLoading(true);
      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("phone", form.phone);
      data.append("password", form.password);
      data.append("gender", form.gender);
      data.append("vehicleType", form.vehicleType);
      data.append("vehicleNumber", form.vehicleNumber);
      data.append("licenseNumber", form.licenseNumber);
      data.append("rc", rcFile);
      data.append("insurance", insuranceFile);
      await axios.post(`${API_BASE}/auth/signup/driver`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLoading(false);
      navigate("/login");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Driver Registration</h2>
        <p style={styles.subtitle}>Register as a driver. Admin approval required before you can accept rides.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Full Name" value={form.name} style={styles.input} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email Address" value={form.email} style={styles.input} onChange={handleChange} required />
          <input name="phone" placeholder="Phone Number" value={form.phone} style={styles.input} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" value={form.password} style={styles.input} onChange={handleChange} required />
          <select name="gender" value={form.gender} style={styles.select} onChange={handleChange} required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <div style={{ marginTop: "16px", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#154272" }}>Vehicle & license</div>
          <select name="vehicleType" value={form.vehicleType} style={styles.select} onChange={handleChange} required>
            {VEHICLE_TYPES.map((opt) => (
              <option key={opt.value || "x"} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input name="vehicleNumber" placeholder="Vehicle Number" value={form.vehicleNumber} style={styles.input} onChange={handleChange} required />
          <input name="licenseNumber" placeholder="License Number" value={form.licenseNumber} style={styles.input} onChange={handleChange} required />

          <div style={styles.docSection}>
            <div style={styles.label}>RC document (required) *</div>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setRcFile(e.target.files?.[0] || null)} style={styles.fileInput} />
            {rcFile && <span style={{ fontSize: "12px", color: "#154272" }}>{rcFile.name}</span>}
            <div style={styles.label}>Insurance document (required) *</div>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)} style={styles.fileInput} />
            {insuranceFile && <span style={{ fontSize: "12px", color: "#154272" }}>{insuranceFile.name}</span>}
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Submitting..." : "Submit Driver Registration"}
          </button>
        </form>

        <button type="button" style={styles.backButton} onClick={() => navigate("/signup")}>
          ← Back to Sign Up
        </button>
        <p style={styles.linkText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
