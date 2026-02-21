import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.phone || !form.password) {
      return setError("All fields are required");
    }
    if (!form.gender) {
      return setError("Please select your gender");
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/auth/signup`, form);
      setLoading(false);
      navigate("/login");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Join MetroSetu Today</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            style={styles.input}
            onChange={handleChange}
          />

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            style={styles.input}
            onChange={handleChange}
          />

          <input
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            style={styles.input}
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            style={styles.input}
            onChange={handleChange}
          />

          <select
            name="gender"
            value={form.gender}
            style={styles.select}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <button
          type="button"
          style={styles.concessionButton}
          onClick={() => navigate("/signup/concession")}
        >
          Apply for Concession
        </button>

        <button
          type="button"
          style={styles.concessionButton}
          onClick={() => navigate("/signup/driver")}
        >
          Register as a Driver
        </button>

        <p style={styles.linkText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #154272, #1e88e5)",
  },
  card: {
    background: "white",
    padding: "40px",
    borderRadius: "12px",
    width: "350px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },
  title: {
    textAlign: "center",
    marginBottom: "5px",
    color: "#154272",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "25px",
    color: "#666",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "white",
    cursor: "pointer",
  },
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
    transition: "0.3s",
  },
  concessionButton: {
    width: "100%",
    padding: "12px",
    marginTop: "12px",
    background: "transparent",
    color: "#154272",
    border: "2px solid #154272",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "0.3s",
  },
  error: {
    background: "#ffe0e0",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "6px",
    color: "red",
    fontSize: "13px",
  },
  linkText: {
    textAlign: "center",
    marginTop: "15px",
    fontSize: "14px",
  },
};
