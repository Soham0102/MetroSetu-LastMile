import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const CATEGORIES = [
  { value: "", label: "Select category" },
  { value: "Student", label: "Student" },
  { value: "Corporate", label: "Corporate" },
  { value: "Less Privileged", label: "Less Privileged" },
];

const DOCUMENT_LABELS = {
  Student: [{ name: "studentId", label: "Student ID", required: true }],
  Corporate: [{ name: "corporateId", label: "Corporate ID", required: true }],
  "Less Privileged": [
    { name: "aadhaarCard", label: "Aadhaar Card", required: true },
    { name: "rationCard", label: "Ration Card", required: true },
  ],
};

const ConcessionSignup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    concessionCategory: "",
  });
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (fieldName, e) => {
    const file = e.target.files?.[0];
    setDocuments((prev) => ({ ...prev, [fieldName]: file || null }));
  };

  const docsForCategory = form.concessionCategory
    ? DOCUMENT_LABELS[form.concessionCategory] || []
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.phone || !form.password || !form.gender) {
      return setError("All basic fields are required");
    }
    if (!form.concessionCategory) {
      return setError("Please select a concession category");
    }

    const requiredDocs = docsForCategory.filter((d) => d.required);
    for (const doc of requiredDocs) {
      if (!documents[doc.name]) {
        return setError(`Please upload ${doc.label}`);
      }
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("phone", form.phone);
      data.append("password", form.password);
      data.append("gender", form.gender);
      data.append("concessionCategory", form.concessionCategory);
      docsForCategory.forEach(({ name }) => {
        if (documents[name]) data.append(name, documents[name]);
      });

      await axios.post(`${API_BASE}/auth/signup/concession`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
        <h2 style={styles.title}>Concession Sign-Up</h2>
        <p style={styles.subtitle}>Apply for travel concession with document verification</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            style={styles.input}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            style={styles.input}
            onChange={handleChange}
            required
          />
          <input
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            style={styles.input}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            style={styles.input}
            onChange={handleChange}
            required
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

          <label style={styles.label}>Concession Category</label>
          <select
            name="concessionCategory"
            value={form.concessionCategory}
            style={styles.select}
            onChange={handleChange}
            required
          >
            {CATEGORIES.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {docsForCategory.length > 0 && (
            <div style={styles.docSection}>
              <div style={styles.docTitle}>Upload required documents</div>
              {docsForCategory.map(({ name, label, required }) => (
                <div key={name} style={styles.fileRow}>
                  <label style={styles.fileLabel}>
                    {label} {required && "*"}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(name, e)}
                    style={styles.fileInput}
                  />
                  {documents[name] && (
                    <span style={styles.fileName}>{documents[name].name}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Submitting..." : "Submit Concession Application"}
          </button>
        </form>

        <p style={styles.linkText}>
          <Link to="/signup">Back to standard Sign-Up</Link>
        </p>
      </div>
    </div>
  );
};

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
    padding: "40px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "400px",
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
    fontSize: "14px",
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
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    color: "#333",
    fontWeight: "600",
  },
  docSection: {
    marginTop: "8px",
    marginBottom: "20px",
    padding: "16px",
    background: "#f5f5f5",
    borderRadius: "8px",
  },
  docTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#154272",
    marginBottom: "12px",
  },
  fileRow: {
    marginBottom: "12px",
  },
  fileLabel: {
    display: "block",
    fontSize: "12px",
    color: "#555",
    marginBottom: "4px",
  },
  fileInput: {
    width: "100%",
    fontSize: "13px",
  },
  fileName: {
    display: "block",
    fontSize: "12px",
    color: "#154272",
    marginTop: "4px",
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

export default ConcessionSignup;
