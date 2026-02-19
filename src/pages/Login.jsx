import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.email || !form.password) {
      return setError("All fields are required");
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        form
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setLoading(false);
      navigate("/");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Login to MetroSetu</p>

        {error && <div style={styles.error}>{error}</div>}

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          style={styles.input}
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          style={styles.input}
          onChange={handleChange}
        />

        <button
          style={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={styles.linkText}>
          Don’t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #154272, #1e88e5)"
  },
  card: {
    background: "white",
    padding: "40px",
    borderRadius: "12px",
    width: "350px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
  },
  title: {
    textAlign: "center",
    marginBottom: "5px",
    color: "#154272"
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "25px",
    color: "#666"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px"
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
    fontWeight: "600"
  },
  error: {
    background: "#ffe0e0",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "6px",
    color: "red",
    fontSize: "13px"
  },
  linkText: {
    textAlign: "center",
    marginTop: "15px",
    fontSize: "14px"
  }
};

export default Login;
