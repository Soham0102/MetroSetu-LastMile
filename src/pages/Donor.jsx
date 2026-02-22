import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

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
  title: { textAlign: "center", marginBottom: "5px", color: "#154272" },
  subtitle: { textAlign: "center", marginBottom: "25px", color: "#666", fontSize: "14px" },
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
  error: {
    background: "#ffe0e0",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "6px",
    color: "red",
    fontSize: "13px",
  },
  receipt: {
    marginTop: "20px",
    padding: "20px",
    background: "#f0f9ff",
    border: "2px solid #154272",
    borderRadius: "8px",
    fontSize: "14px",
  },
  receiptTitle: { fontWeight: "bold", marginBottom: "12px", color: "#154272", fontSize: "16px" },
  receiptRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
};

export default function Donor() {
  const navigate = useNavigate();
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");
    if (!donorName.trim()) return setError("Please enter your name");
    const amt = Number(amount);
    if (!amt || amt < 1) return setError("Please enter a valid amount (min ₹1)");

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/donations`, { donorName: donorName.trim(), amount: amt });
      const data = res?.data;
      setReceipt(data?.receipt ?? null);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Payment failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Donate to MetroSetu</h2>
        <p style={styles.subtitle}>Support last-mile connectivity</p>

        {error && <div style={styles.error}>{error}</div>}

        {!receipt ? (
          <form onSubmit={handlePay}>
            <input
              type="text"
              placeholder="Your Name"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
              min="1"
              step="1"
              required
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Processing..." : "Pay"}
            </button>
          </form>
        ) : (
          <>
            <div style={styles.receipt}>
              <div style={styles.receiptTitle}>Payment Receipt</div>
              <div style={styles.receiptRow}>
                <span>Name</span>
                <strong>{receipt.donorName}</strong>
              </div>
              <div style={styles.receiptRow}>
                <span>Amount</span>
                <strong>₹{receipt.amount}</strong>
              </div>
              <div style={styles.receiptRow}>
                <span>Date</span>
                <strong>{new Date(receipt.date).toLocaleString()}</strong>
              </div>
              <div style={styles.receiptRow}>
                <span>Transaction ID</span>
                <strong>{receipt.transactionId}</strong>
              </div>
            </div>
            <button
              type="button"
              style={{ ...styles.button, marginTop: "12px" }}
              onClick={() => navigate("/home")}
            >
              Back to Home
            </button>
          </>
        )}

        <button
          type="button"
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "10px",
            background: "transparent",
            color: "#154272",
            border: "1px solid #154272",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
