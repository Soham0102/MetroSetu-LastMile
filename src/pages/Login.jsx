import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function Login() {
  const navigate = useNavigate();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");

    if (isAdminLogin) {
      if (!form.username || !form.password) {
        return setError("Username and password are required");
      }
      try {
        setLoading(true);
        const res = await axios.post(`${API_BASE}/auth/admin/login`, {
          username: form.username,
          password: form.password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setLoading(false);
        navigate("/admin");
      } catch (err) {
        setLoading(false);
        setError(err.response?.data?.message || "Invalid admin credentials");
      }
      return;
    }

    if (!form.email || !form.password) {
      return setError("All fields are required");
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setLoading(false);
      navigate("/home");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {isAdminLogin ? "Admin Login" : "Welcome Back"}
        </h2>
        <p style={styles.subtitle}>
          {isAdminLogin ? "MetroSetu Admin" : "Login to MetroSetu"}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        {isAdminLogin ? (
          <>
            <input
              name="username"
              type="text"
              placeholder="Username"
              value={form.username}
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
          </>
        ) : (
          <>
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
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
          </>
        )}

        <button
          style={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          style={styles.adminLink}
          onClick={() => {
            setIsAdminLogin(!isAdminLogin);
            setError("");
            setForm({ email: "", password: "", username: "" });
          }}
        >
          {isAdminLogin ? "← Back to User Login" : "Login as Admin"}
        </button>

        {!isAdminLogin && (
          <p style={styles.linkText}>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        )}
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
  adminLink: {
    width: "100%",
    marginTop: "12px",
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
