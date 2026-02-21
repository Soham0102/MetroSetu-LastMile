import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://localhost:5000";

const docLabels = { studentId: "Student ID", corporateId: "Corporate ID", aadhaarCard: "Aadhaar", rationCard: "Ration Card" };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [donations, setDonations] = useState({ donations: [], total: 0 });
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDonations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/donations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations({ donations: res.data.donations || [], total: res.data.total || 0 });
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const fetchApplicants = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/concession/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplicants(res.data || []);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  }, [token, navigate]);

  const refresh = useCallback(() => {
    fetchDonations();
    fetchApplicants();
  }, [fetchDonations, fetchApplicants]);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/login");
      return;
    }
    refresh();
  }, [user?.isAdmin, navigate]);

  useEffect(() => {
    if (!token || !user?.isAdmin) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on("donation:created", () => fetchDonations());
    socket.on("connect_error", () => {});
    return () => socket.disconnect();
  }, [token, user?.isAdmin, fetchDonations]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await axios.patch(`${API_BASE}/auth/concession/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchApplicants();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId);
    try {
      await axios.patch(`${API_BASE}/auth/concession/${userId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchApplicants();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  const docUrl = (userId, docType) =>
    `${API_BASE.replace("/api", "")}/api/auth/concession/document/${userId}/${docType}?token=${encodeURIComponent(token)}`;

  if (!user?.isAdmin) return null;

  const styles = {
    page: { minHeight: "100vh", background: "#f1f5f9", padding: "24px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
    title: { fontSize: "24px", fontWeight: "700", color: "#154272" },
    logout: { padding: "8px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
    section: { background: "white", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#154272", marginBottom: "16px" },
    total: { fontSize: "28px", fontWeight: "700", color: "#0d9488" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
    th: { textAlign: "left", padding: "12px", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: "600" },
    td: { padding: "12px", borderBottom: "1px solid #e2e8f0" },
    applicantCard: { border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "12px", background: "#f8fafc" },
    docLink: { display: "inline-block", marginRight: "8px", marginBottom: "4px", color: "#154272", fontSize: "13px" },
    btn: { marginRight: "8px", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
    approveBtn: { background: "#0d9488", color: "white" },
    rejectBtn: { background: "#dc2626", color: "white" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button style={styles.logout} onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }}>
          Logout
        </button>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Donations</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <p style={styles.total}>Total: ₹{donations.total}</p>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Donor</th>
                  <th style={styles.th}>Amount (₹)</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {(donations.donations || []).map((d) => (
                  <tr key={d._id}>
                    <td style={styles.td}>{d.donorName}</td>
                    <td style={styles.td}>{d.amount}</td>
                    <td style={styles.td}>{new Date(d.date).toLocaleString()}</td>
                    <td style={styles.td}>{d.transactionId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {donations.donations?.length === 0 && <p style={{ color: "#64748b" }}>No donations yet.</p>}
          </>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Concession Verification</h2>
        {applicants.length === 0 ? (
          <p style={{ color: "#64748b" }}>No pending concession applications.</p>
        ) : (
          applicants.map((a) => (
            <div key={a._id} style={styles.applicantCard}>
              <div><strong>{a.name}</strong> · {a.email} · {a.phone}</div>
              <div style={{ marginTop: "6px", fontSize: "13px", color: "#64748b" }}>
                Category: {a.concessionCategory}
              </div>
              <div style={{ marginTop: "8px" }}>
                Documents:{" "}
                {a.concessionDocuments && Object.entries(a.concessionDocuments).map(([type, path]) =>
                  path ? (
                    <a key={type} href={docUrl(a._id, type)} target="_blank" rel="noopener noreferrer" style={styles.docLink}>
                      {docLabels[type] || type} ↗
                    </a>
                  ) : null
                )}
              </div>
              <div style={{ marginTop: "12px" }}>
                <button
                  style={{ ...styles.btn, ...styles.approveBtn }}
                  onClick={() => handleApprove(a._id)}
                  disabled={actionLoading === a._id}
                >
                  {actionLoading === a._id ? "..." : "Approve"}
                </button>
                <button
                  style={{ ...styles.btn, ...styles.rejectBtn }}
                  onClick={() => handleReject(a._id)}
                  disabled={actionLoading === a._id}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
