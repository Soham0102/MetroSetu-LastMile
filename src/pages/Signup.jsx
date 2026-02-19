import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.name || !form.email || !form.phone || !form.password) {
      return setError("All fields are required");
    }

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/auth/signup", form);
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

        <input
          name="name"
          placeholder="Full Name"
          style={styles.input}
          onChange={handleChange}
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          style={styles.input}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone Number"
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
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p style={styles.linkText}>
          Already have an account? <Link to="/login">Login</Link>
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
    fontWeight: "600",
    transition: "0.3s"
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

export default Signup;
