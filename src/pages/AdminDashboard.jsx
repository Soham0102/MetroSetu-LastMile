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
  const [driverApplicants, setDriverApplicants] = useState([]);
  const [history, setHistory] = useState({ donations: { list: [], total: 0 }, concessionHistory: [], driverHistory: [], wallet: null });
  const [sosAlerts, setSosAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [driverActionLoading, setDriverActionLoading] = useState(null);

  const fetchDonations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/donations`, { headers: { Authorization: `Bearer ${token}` } });
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
      const res = await axios.get(`${API_BASE}/auth/concession/applicants`, { headers: { Authorization: `Bearer ${token}` } });
      setApplicants(res.data || []);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  }, [token, navigate]);

  const fetchDriverApplicants = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/driver/applicants`, { headers: { Authorization: `Bearer ${token}` } });
      setDriverApplicants(res.data || []);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  }, [token, navigate]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/admin/history`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data || { donations: { list: [], total: 0 }, concessionHistory: [], driverHistory: [], wallet: null });
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  }, [token, navigate]);

  const fetchSOSAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/admin/sos-alerts`, { headers: { Authorization: `Bearer ${token}` } });
      setSosAlerts(res.data || []);
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
    fetchDriverApplicants();
    fetchHistory();
    fetchSOSAlerts();
  }, [fetchDonations, fetchApplicants, fetchDriverApplicants, fetchHistory, fetchSOSAlerts]);

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
    socket.on("driver:submitted", () => fetchDriverApplicants());
    socket.on("sos:alert", () => fetchSOSAlerts());
    socket.on("connect_error", () => {});
    return () => socket.disconnect();
  }, [token, user?.isAdmin, fetchDonations, fetchDriverApplicants, fetchSOSAlerts]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab, fetchHistory]);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await axios.patch(`${API_BASE}/auth/concession/${userId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
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
      await axios.patch(`${API_BASE}/auth/concession/${userId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchApplicants();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDriverApprove = async (userId) => {
    setDriverActionLoading(userId);
    try {
      await axios.patch(`${API_BASE}/auth/driver/${userId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchDriverApplicants();
      await fetchHistory();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to approve");
    } finally {
      setDriverActionLoading(null);
    }
  };

  const handleDriverReject = async (userId) => {
    setDriverActionLoading(userId);
    try {
      await axios.patch(`${API_BASE}/auth/driver/${userId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchDriverApplicants();
      await fetchHistory();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to reject");
    } finally {
      setDriverActionLoading(null);
    }
  };

  const docUrl = (userId, docType) =>
    `${API_BASE.replace("/api", "")}/api/auth/concession/document/${userId}/${docType}?token=${encodeURIComponent(token)}`;
  const driverDocUrl = (userId, docType) =>
    `${API_BASE.replace("/api", "")}/api/auth/driver/document/${userId}/${docType}?token=${encodeURIComponent(token)}`;

  if (!user?.isAdmin) return null;

  const styles = {
    page: { minHeight: "100vh", background: "#f1f5f9", padding: "24px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
    title: { fontSize: "24px", fontWeight: "700", color: "#154272" },
    tabs: { display: "flex", gap: "8px", marginBottom: "20px" },
    tab: (active) => ({ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", background: active ? "#154272" : "#e2e8f0", color: active ? "white" : "#475569" }),
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
    historyRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e8f0", fontSize: "14px" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button style={styles.logout} onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }}>
          Logout
        </button>
      </div>

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === "dashboard")} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button style={styles.tab(activeTab === "history")} onClick={() => setActiveTab("history")}>History</button>
      </div>

      {activeTab === "dashboard" && (
        <>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Revenue & Admin Wallet</h2>
            {history.wallet && (
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "16px" }}>
                <div><span style={{ color: "#64748b", fontSize: "14px" }}>Commission (4% of rides)</span><p style={styles.total}>₹{history.wallet.totalCommission ?? 0}</p></div>
                <div><span style={{ color: "#64748b", fontSize: "14px" }}>Concession deduction</span><p style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626" }}>−₹{history.wallet.totalConcessionDeduction ?? 0}</p></div>
                <div><span style={{ color: "#64748b", fontSize: "14px" }}>Admin Wallet (Donations − Concession)</span><p style={{ fontSize: "28px", fontWeight: "700", color: "#154272" }}>₹{history.wallet.adminWalletBalance ?? 0}</p></div>
              </div>
            )}
          </div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🆘 SOS Alerts (Emergency)</h2>
            {(sosAlerts.length === 0) ? (
              <p style={{ color: "#64748b" }}>No SOS alerts.</p>
            ) : (
              sosAlerts.map((a) => (
                <div key={a._id} style={{ border: "2px solid #dc2626", borderRadius: "8px", padding: "16px", marginBottom: "12px", background: "#fef2f2" }}>
                  <p style={{ fontWeight: "700", color: "#b91c1c", marginBottom: "8px" }}>SOS — {new Date(a.createdAt).toLocaleString()}</p>
                  <p><strong>Rider:</strong> {a.userSnapshot?.name} · {a.userSnapshot?.phone} · {a.userSnapshot?.email} {a.userSnapshot?.gender && ` · ${a.userSnapshot.gender}`}</p>
                  <p><strong>Driver:</strong> {a.driverSnapshot?.name} · {a.driverSnapshot?.phone}</p>
                  <p><strong>Pickup:</strong> {a.rideSnapshot?.pickupAddress || `${a.rideSnapshot?.pickupLat}, ${a.rideSnapshot?.pickupLng}`}</p>
                  <p><strong>Drop:</strong> {a.rideSnapshot?.dropAddress || `${a.rideSnapshot?.dropLat}, ${a.rideSnapshot?.dropLng}`}</p>
                </div>
              ))
            )}
          </div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Donations</h2>
            {loading ? <p>Loading...</p> : (
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
                  <div style={{ marginTop: "6px", fontSize: "13px", color: "#64748b" }}>Category: {a.concessionCategory}</div>
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
                    <button style={{ ...styles.btn, ...styles.approveBtn }} onClick={() => handleApprove(a._id)} disabled={actionLoading === a._id}>
                      {actionLoading === a._id ? "..." : "Approve"}
                    </button>
                    <button style={{ ...styles.btn, ...styles.rejectBtn }} onClick={() => handleReject(a._id)} disabled={actionLoading === a._id}>
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Driver Verification</h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>Approve drivers before they can accept rides.</p>
            {driverApplicants.length === 0 ? (
              <p style={{ color: "#64748b" }}>No pending driver applications.</p>
            ) : (
              driverApplicants.map((d) => (
                <div key={d._id} style={styles.applicantCard}>
                  <div><strong>{d.name}</strong> · {d.email} · {d.phone}</div>
                  <div style={{ marginTop: "6px", fontSize: "13px", color: "#64748b" }}>
                    {d.vehicleType} · {d.vehicleNumber} · License: {d.licenseNumber}
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <a href={driverDocUrl(d._id, "rc")} target="_blank" rel="noopener noreferrer" style={styles.docLink}>RC ↗</a>
                    <a href={driverDocUrl(d._id, "insurance")} target="_blank" rel="noopener noreferrer" style={styles.docLink}>Insurance ↗</a>
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <button style={{ ...styles.btn, ...styles.approveBtn }} onClick={() => handleDriverApprove(d._id)} disabled={driverActionLoading === d._id}>
                      {driverActionLoading === d._id ? "..." : "Approve"}
                    </button>
                    <button style={{ ...styles.btn, ...styles.rejectBtn }} onClick={() => handleDriverReject(d._id)} disabled={driverActionLoading === d._id}>
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Donations History</h2>
            <p style={styles.total}>Total: ₹{history.donations?.total ?? 0}</p>
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
                {(history.donations?.list || []).map((d) => (
                  <tr key={d._id}>
                    <td style={styles.td}>{d.donorName}</td>
                    <td style={styles.td}>{d.amount}</td>
                    <td style={styles.td}>{new Date(d.date).toLocaleString()}</td>
                    <td style={styles.td}>{d.transactionId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(history.donations?.list || []).length === 0 && <p style={{ color: "#64748b" }}>No donations.</p>}
          </div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Concession History</h2>
            {(history.concessionHistory || []).map((h) => (
              <div key={h._id} style={styles.historyRow}>
                <span><strong>{h.name}</strong> · {h.email} · {h.concessionCategory}</span>
                <span style={{ color: h.concessionApproved ? "#0d9488" : "#dc2626" }}>
                  {h.concessionApproved ? "Approved" : "Rejected"} · {new Date(h.updatedAt).toLocaleString()}
                </span>
              </div>
            ))}
            {(history.concessionHistory || []).length === 0 && <p style={{ color: "#64748b" }}>No concession history.</p>}
          </div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Driver History</h2>
            {(history.driverHistory || []).map((h) => (
              <div key={h._id} style={styles.historyRow}>
                <span><strong>{h.name}</strong> · {h.email} · {h.vehicleType} · {h.vehicleNumber}</span>
                <span style={{ color: h.driverApproved ? "#0d9488" : "#dc2626" }}>
                  {h.driverApproved ? "Approved" : "Rejected"} · {new Date(h.updatedAt).toLocaleString()}
                </span>
              </div>
            ))}
            {(history.driverHistory || []).length === 0 && <p style={{ color: "#64748b" }}>No driver history.</p>}
          </div>
        </>
      )}
    </div>
  );
}
