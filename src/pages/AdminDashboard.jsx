// import { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { io } from "socket.io-client";

// const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
// const SOCKET_URL = import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://localhost:5000";

// const docLabels = { studentId: "Student ID", corporateId: "Corporate ID", aadhaarCard: "Aadhaar", rationCard: "Ration Card" };

// export default function AdminDashboard() {
//   const navigate = useNavigate();
//   const token = localStorage.getItem("token");
//   const user = JSON.parse(localStorage.getItem("user") || "{}");

//   const [donations, setDonations] = useState({ donations: [], total: 0 });
//   const [applicants, setApplicants] = useState([]);
//   const [driverApplicants, setDriverApplicants] = useState([]);
//   const [history, setHistory] = useState({ donations: { list: [], total: 0 }, concessionHistory: [], driverHistory: [], wallet: null });
//   const [sosAlerts, setSosAlerts] = useState([]);
//   const [activeTab, setActiveTab] = useState("dashboard");
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(null);
//   const [driverActionLoading, setDriverActionLoading] = useState(null);

//   const fetchDonations = useCallback(async () => {
//     if (!token) return;
//     try {
//       const res = await axios.get(`${API_BASE}/donations`, { headers: { Authorization: `Bearer ${token}` } });
//       setDonations({ donations: res.data.donations || [], total: res.data.total || 0 });
//     } catch (e) {
//       if (e.response?.status === 401 || e.response?.status === 403) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         navigate("/login");
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [token, navigate]);

//   const fetchApplicants = useCallback(async () => {
//     if (!token) return;
//     try {
//       const res = await axios.get(`${API_BASE}/auth/concession/applicants`, { headers: { Authorization: `Bearer ${token}` } });
//       setApplicants(res.data || []);
//     } catch (e) {
//       if (e.response?.status === 401 || e.response?.status === 403) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         navigate("/login");
//       }
//     }
//   }, [token, navigate]);

//   const fetchDriverApplicants = useCallback(async () => {
//     if (!token) return;
//     try {
//       const res = await axios.get(`${API_BASE}/auth/driver/applicants`, { headers: { Authorization: `Bearer ${token}` } });
//       setDriverApplicants(res.data || []);
//     } catch (e) {
//       if (e.response?.status === 401 || e.response?.status === 403) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         navigate("/login");
//       }
//     }
//   }, [token, navigate]);

//   const fetchHistory = useCallback(async () => {
//     if (!token) return;
//     try {
//       const res = await axios.get(`${API_BASE}/auth/admin/history`, { headers: { Authorization: `Bearer ${token}` } });
//       setHistory(res.data || { donations: { list: [], total: 0 }, concessionHistory: [], driverHistory: [], wallet: null });
//     } catch (e) {
//       if (e.response?.status === 401 || e.response?.status === 403) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         navigate("/login");
//       }
//     }
//   }, [token, navigate]);

//   const fetchSOSAlerts = useCallback(async () => {
//     if (!token) return;
//     try {
//       const res = await axios.get(`${API_BASE}/auth/admin/sos-alerts`, { headers: { Authorization: `Bearer ${token}` } });
//       setSosAlerts(res.data || []);
//     } catch (e) {
//       if (e.response?.status === 401 || e.response?.status === 403) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         navigate("/login");
//       }
//     }
//   }, [token, navigate]);

//   const refresh = useCallback(() => {
//     fetchDonations();
//     fetchApplicants();
//     fetchDriverApplicants();
//     fetchHistory();
//     fetchSOSAlerts();
//   }, [fetchDonations, fetchApplicants, fetchDriverApplicants, fetchHistory, fetchSOSAlerts]);

//   useEffect(() => {
//     if (!user?.isAdmin) {
//       navigate("/login");
//       return;
//     }
//     refresh();
//   }, [user?.isAdmin, navigate]);

//   useEffect(() => {
//     if (!token || !user?.isAdmin) return;
//     const socket = io(SOCKET_URL, { auth: { token } });
//     socket.on("donation:created", () => fetchDonations());
//     socket.on("driver:submitted", () => fetchDriverApplicants());
//     socket.on("sos:alert", () => fetchSOSAlerts());
//     socket.on("connect_error", () => {});
//     return () => socket.disconnect();
//   }, [token, user?.isAdmin, fetchDonations, fetchDriverApplicants, fetchSOSAlerts]);

//   useEffect(() => {
//     const interval = setInterval(refresh, 5000);
//     return () => clearInterval(interval);
//   }, [refresh]);

//   useEffect(() => {
//     if (activeTab === "history") fetchHistory();
//   }, [activeTab, fetchHistory]);

//   const handleApprove = async (userId) => {
//     setActionLoading(userId);
//     try {
//       await axios.patch(`${API_BASE}/auth/concession/${userId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
//       await fetchApplicants();
//     } catch (e) {
//       alert(e.response?.data?.message || "Failed to approve");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const handleReject = async (userId) => {
//     setActionLoading(userId);
//     try {
//       await axios.patch(`${API_BASE}/auth/concession/${userId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
//       await fetchApplicants();
//     } catch (e) {
//       alert(e.response?.data?.message || "Failed to reject");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const handleDriverApprove = async (userId) => {
//     setDriverActionLoading(userId);
//     try {
//       await axios.patch(`${API_BASE}/auth/driver/${userId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
//       await fetchDriverApplicants();
//       await fetchHistory();
//     } catch (e) {
//       alert(e.response?.data?.message || "Failed to approve");
//     } finally {
//       setDriverActionLoading(null);
//     }
//   };

//   const handleDriverReject = async (userId) => {
//     setDriverActionLoading(userId);
//     try {
//       await axios.patch(`${API_BASE}/auth/driver/${userId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
//       await fetchDriverApplicants();
//       await fetchHistory();
//     } catch (e) {
//       alert(e.response?.data?.message || "Failed to reject");
//     } finally {
//       setDriverActionLoading(null);
//     }
//   };

//   const docUrl = (userId, docType) =>
//     `${API_BASE.replace("/api", "")}/api/auth/concession/document/${userId}/${docType}?token=${encodeURIComponent(token)}`;
//   const driverDocUrl = (userId, docType) =>
//     `${API_BASE.replace("/api", "")}/api/auth/driver/document/${userId}/${docType}?token=${encodeURIComponent(token)}`;

//   if (!user?.isAdmin) return null;

//   const styles = {
//     page: { minHeight: "100vh", background: "#f1f5f9", padding: "24px" },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
//     title: { fontSize: "24px", fontWeight: "700", color: "#154272" },
//     tabs: { display: "flex", gap: "8px", marginBottom: "20px" },
//     tab: (active) => ({ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", background: active ? "#154272" : "#e2e8f0", color: active ? "white" : "#475569" }),
//     logout: { padding: "8px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
//     section: { background: "white", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
//     sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#154272", marginBottom: "16px" },
//     total: { fontSize: "28px", fontWeight: "700", color: "#0d9488" },
//     table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
//     th: { textAlign: "left", padding: "12px", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: "600" },
//     td: { padding: "12px", borderBottom: "1px solid #e2e8f0" },
//     applicantCard: { border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "12px", background: "#f8fafc" },
//     docLink: { display: "inline-block", marginRight: "8px", marginBottom: "4px", color: "#154272", fontSize: "13px" },
//     btn: { marginRight: "8px", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
//     approveBtn: { background: "#0d9488", color: "white" },
//     rejectBtn: { background: "#dc2626", color: "white" },
//     historyRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e8f0", fontSize: "14px" },
//   };

//   return (
//     <div style={styles.page}>
//       <div style={styles.header}>
//         <h1 style={styles.title}>Admin Dashboard</h1>
//         <button style={styles.logout} onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }}>
//           Logout
//         </button>
//       </div>

//       <div style={styles.tabs}>
//         <button style={styles.tab(activeTab === "dashboard")} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
//         <button style={styles.tab(activeTab === "history")} onClick={() => setActiveTab("history")}>History</button>
//       </div>

//       {activeTab === "dashboard" && (
//         <>
//           <div style={styles.section}>
//             <h2 style={styles.sectionTitle}>Revenue & Admin Wallet</h2>
//             {history.wallet && (
//               <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "16px" }}>
//                 <div><span style={{ color: "#64748b", fontSize: "14px" }}>Commission (4% of rides)</span><p style={styles.total}>₹{history.wallet.totalCommission ?? 0}</p></div>
//                 <div><span style={{ color: "#64748b", fontSize: "14px" }}>Concession deduction</span><p style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626" }}>−₹{history.wallet.totalConcessionDeduction ?? 0}</p></div>
//                 <div><span style={{ color: "#64748b", fontSize: "14px" }}>Admin Wallet (Donations − Concession)</span><p style={{ fontSize: "28px", fontWeight: "700", color: "#154272" }}>₹{history.wallet.adminWalletBalance ?? 0}</p></div>
//               </div>
//             )}
//           </div>
//           <div style={styles.section}>
//             <h2 style={styles.sectionTitle}>🆘 SOS Alerts (Emergency)</h2>
//             {(sosAlerts.length === 0) ? (
//               <p style={{ color: "#64748b" }}>No SOS alerts.</p>
//             ) : (
//               sosAlerts.map((a) => (
//                 <div key={a._id} style={{ border: "2px solid #dc2626", borderRadius: "8px", padding: "16px", marginBottom: "12px", background: "#fef2f2" }}>
//                   <p style={{ fontWeight: "700", color: "#b91c1c", marginBottom: "8px" }}>SOS — {new Date(a.createdAt).toLocaleString()}</p>
//                   <p><strong>Rider:</strong> {a.userSnapshot?.name} · {a.userSnapshot?.phone} · {a.userSnapshot?.email} {a.userSnapshot?.gender && ` · ${a.userSnapshot.gender}`}</p>
//                   <p><strong>Driver:</strong> {a.driverSnapshot?.name} · {a.driverSnapshot?.phone}</p>
//                   <p><strong>Pickup:</strong> {a.rideSnapshot?.pickupAddress || `${a.rideSnapshot?.pickupLat}, ${a.rideSnapshot?.pickupLng}`}</p>
//                   <p><strong>Drop:</strong> {a.rideSnapshot?.dropAddress || `${a.rideSnapshot?.dropLat}, ${a.rideSnapshot?.dropLng}`}</p>
//                 </div>
//               ))
//             )}
//           </div>
//           <div style={styles.section}>
//             <h2 style={styles.sectionTitle}>Donations</h2>
//             {loading ? <p>Loading...</p> : (
//               <>
//                 <p style={styles.total}>Total: ₹{donations.total}</p>
//                 <table style={styles.table}>
//                   <thead>
//                     <tr>
//                       <th style={styles.th}>Donor</th>
//                       <th style={styles.th}>Amount (₹)</th>
//                       <th style={styles.th}>Date</th>
//                       <th style={styles.th}>Transaction ID</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {(donations.donations || []).map((d) => (
//                       <tr key={d._id}>
//                         <td style={styles.td}>{d.donorName}</td>
//                         <td style={styles.td}>{d.amount}</td>
//                         <td style={styles.td}>{new Date(d.date).toLocaleString()}</td>
//                         <td style={styles.td}>{d.transactionId}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//                 {donations.donations?.length === 0 && <p style={{ color: "#64748b" }}>No donations yet.</p>}
//               </>
//             )}
//           </div>

//           <div style={styles.section}>
//             <h2 style={styles.sectionTitle}>Concession Verification</h2>
//             {applicants.length === 0 ? (
//               <p style={{ color: "#64748b" }}>No pending concession applications.</p>
//             ) : (
//               applicants.map((a) => (
//                 <div key={a._id} style={styles.applicantCard}>
//                   <div><strong>{a.name}</strong> · {a.email} · {a.phone}</div>
//                   <div style={{ marginTop: "6px", fontSize: "13px", color: "#64748b" }}>Category: {a.concessionCategory}</div>
//                   <div style={{ marginTop: "8px" }}>
//                     Documents:{" "}
//                     {a.concessionDocuments && Object.entries(a.concessionDocuments).map(([type, path]) =>
//                       path ? (
//                         <a key={type} href={docUrl(a._id, type)} target="_blank" rel="noopener noreferrer" style={styles.docLink}>
//                           {docLabels[type] || type} ↗
//                         </a>
//                       ) : null
//                     )}
//                   </div>
//                   <div style={{ marginTop: "12px" }}>
//                     <button style={{ ...styles.btn, ...styles.approveBtn }} onClick={() => handleApprove(a._id)} disabled={actionLoading === a._id}>
//                       {actionLoading === a._id ? "..." : "Approve"}
//                     </button>
//                     <button style={{ ...styles.btn, ...styles.rejectBtn }} onClick={() => handleReject(a._id)} disabled={actionLoading === a._id}>
//                       Reject
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           <div style={styles.section}>
//             <h2 style={styles.sectionTitle}>Driver Verification</h2>
//             <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>Approve drivers before they can accept rides.</p>
//             {driverApplicants.length === 0 ? (
//               <p style={{ color: "#64748b" }}>No pending driver applications.</p>
//             ) : (
//               driverApplicants.map((d) => (
//                 <div key={d._id} style={styles.applicantCard}>
//                   <div><strong>{d.name}</strong> · {d.email} · {d.phone}</div>
//                   <div style={{ marginTop: "6px", fontSize: "13px", color: "#64748b" }}>
//                     {d.vehicleType} · {d.vehicleNumber} · License: {d.licenseNumber}
//                   </div>
//                   <div style={{ marginTop: "8px" }}>
//                     <a href={driverDocUrl(d._id, "rc")} target="_blank" rel="noopener noreferrer" style={styles.docLink}>RC ↗</a>
//                     <a href={driverDocUrl(d._id, "insurance")} target="_blank" rel="noopener noreferrer" style={styles.docLink}>Insurance ↗</a>
//                   </div>
//                   <div style={{ marginTop: "12px" }}>
//                     <button style={{ ...styles.btn, ...styles.approveBtn }} onClick={() => handleDriverApprove(d._id)} disabled={driverActionLoading === d._id}>
//                       {driverActionLoading === d._id ? "..." : "Approve"}
//                     </button>
//                     <button style={{ ...styles.btn, ...styles.rejectBtn }} onClick={() => handleDriverReject(d._id)} disabled={driverActionLoading === d._id}>
//                       Reject
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </>
//       )}

//       {activeTab === "history" && (
//         <>
//           <div style={styles.section}>
//             <h2 style={styles.sectionTitle}>Donations History</h2>
//             <p style={styles.total}>Total: ₹{history.donations?.total ?? 0}</p>
//             <table style={styles.table}>
//               <thead>
//                 <tr>
//                   <th style={styles.th}>Donor</th>
//                   <th style={styles.th}>Amount (₹)</th>
//                   <th style={styles.th}>Date</th>
//                   <th style={styles.th}>Transaction ID</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {(history.donations?.list || []).map((d) => (
//                   <tr key={d._id}>
//                     <td style={styles.td}>{d.donorName}</td>
//                     <td style={styles.td}>{d.amount}</td>
//                     <td style={styles.td}>{new Date(d.date).toLocaleString()}</td>
//                     <td style={styles.td}>{d.transactionId}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             {(history.donations?.list || []).length === 0 && <p style={{ color: "#64748b" }}>No donations.</p>}
//           </div>
//           <div style={styles.section}>
//             <h2 style={styles.sectionTitle}>Concession History</h2>
//             {(history.concessionHistory || []).map((h) => (
//               <div key={h._id} style={styles.historyRow}>
//                 <span><strong>{h.name}</strong> · {h.email} · {h.concessionCategory}</span>
//                 <span style={{ color: h.concessionApproved ? "#0d9488" : "#dc2626" }}>
//                   {h.concessionApproved ? "Approved" : "Rejected"} · {new Date(h.updatedAt).toLocaleString()}
//                 </span>
//               </div>
//             ))}
//             {(history.concessionHistory || []).length === 0 && <p style={{ color: "#64748b" }}>No concession history.</p>}
//           </div>
//           <div style={styles.section}>
//             <h2 style={styles.sectionTitle}>Driver History</h2>
//             {(history.driverHistory || []).map((h) => (
//               <div key={h._id} style={styles.historyRow}>
//                 <span><strong>{h.name}</strong> · {h.email} · {h.vehicleType} · {h.vehicleNumber}</span>
//                 <span style={{ color: h.driverApproved ? "#0d9488" : "#dc2626" }}>
//                   {h.driverApproved ? "Approved" : "Rejected"} · {new Date(h.updatedAt).toLocaleString()}
//                 </span>
//               </div>
//             ))}
//             {(history.driverHistory || []).length === 0 && <p style={{ color: "#64748b" }}>No driver history.</p>}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://localhost:5000";

const docLabels = {
  studentId: "Student ID",
  corporateId: "Corporate ID",
  aadhaarCard: "Aadhaar Card",
  rationCard: "Ration Card",
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #f8f7f5;
    --surface: #ffffff;
    --surface-raised: #fdfcfb;
    --border: #e8e4de;
    --border-soft: #f0ece6;
    --ink: #1c1917;
    --ink-2: #57534e;
    --ink-3: #a8a29e;
    --ink-4: #d6d3d1;
    --amber: #b45309;
    --amber-bg: #fef3c7;
    --green: #15803d;
    --green-bg: #dcfce7;
    --red: #dc2626;
    --red-bg: #fee2e2;
    --red-soft: #fef2f2;
    --blue: #1d4ed8;
    --blue-bg: #dbeafe;
    --purple-bg: #ede9fe;
    --purple: #6d28d9;
    --sidebar-w: 232px;
    --nav-h: 56px;
  }

  html, body { height: 100%; }

  body {
    font-family: 'Instrument Sans', system-ui, sans-serif;
    background: var(--bg);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }

  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.15)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* ── Shell ── */
  .shell { display: flex; height: 100vh; overflow: hidden; }

  /* ── Sidebar ── */
  .sidebar {
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .sidebar-brand {
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--border-soft);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-mark {
    width: 34px; height: 34px;
    background: var(--ink);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .brand-name {
    font-family: 'Instrument Serif', serif;
    font-size: 17px;
    color: var(--ink);
    letter-spacing: -0.2px;
    line-height: 1.1;
  }

  .brand-sub {
    font-size: 10px;
    color: var(--ink-3);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 1px;
  }

  .sidebar-nav {
    padding: 16px 12px;
    flex: 1;
  }

  .nav-group-label {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--ink-4);
    padding: 0 8px;
    margin-bottom: 6px;
    margin-top: 20px;
  }

  .nav-group-label:first-child { margin-top: 0; }

  .nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-2);
    transition: all 0.15s;
    margin-bottom: 1px;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
  }

  .nav-item-left { display: flex; align-items: center; gap: 9px; }

  .nav-item-icon {
    width: 28px; height: 28px;
    border-radius: 6px;
    background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    transition: background 0.15s;
  }

  .nav-item:hover { background: var(--bg); color: var(--ink); }
  .nav-item:hover .nav-item-icon { background: var(--border-soft); }

  .nav-item.active {
    background: var(--ink);
    color: #fff;
  }

  .nav-item.active .nav-item-icon {
    background: rgba(255,255,255,0.12);
  }

  .nav-item.sos-item { color: var(--red); }
  .nav-item.sos-item .nav-item-icon { background: var(--red-bg); }
  .nav-item.sos-item:hover { background: var(--red-soft); }
  .nav-item.sos-item.active { background: var(--red); color: #fff; }
  .nav-item.sos-item.active .nav-item-icon { background: rgba(255,255,255,0.15); }

  .nav-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 20px;
    background: var(--border);
    color: var(--ink-2);
    min-width: 20px;
    text-align: center;
  }

  .nav-item.active .nav-badge {
    background: rgba(255,255,255,0.2);
    color: #fff;
  }

  .nav-badge.urgent {
    background: var(--red);
    color: #fff;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  .nav-item.sos-item .nav-badge { background: var(--red-bg); color: var(--red); }
  .nav-item.sos-item.active .nav-badge { background: rgba(255,255,255,0.2); color: #fff; }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid var(--border-soft);
  }

  .wallet-box {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 12px;
  }

  .wallet-label {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--ink-3);
    margin-bottom: 6px;
  }

  .wallet-val {
    font-family: 'Instrument Serif', serif;
    font-size: 26px;
    color: var(--ink);
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .wallet-sub {
    font-size: 10.5px;
    color: var(--ink-3);
    margin-top: 4px;
  }

  .refresh-info {
    font-size: 11px;
    color: var(--ink-3);
    line-height: 1.6;
  }

  .refresh-time {
    color: var(--ink-2);
    font-weight: 500;
  }

  /* ── Content Area ── */
  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── Top Bar ── */
  .topbar {
    height: var(--nav-h);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    flex-shrink: 0;
  }

  .topbar-title {
    font-family: 'Instrument Serif', serif;
    font-size: 18px;
    color: var(--ink);
    letter-spacing: -0.2px;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px 5px 5px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 24px;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
  }

  .user-avatar {
    width: 26px; height: 26px;
    border-radius: 50%;
    background: var(--ink);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    font-weight: 600;
  }

  .btn-logout {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    background: var(--surface);
    color: var(--ink-2);
    border: 1px solid var(--border);
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-logout:hover {
    border-color: var(--red);
    color: var(--red);
    background: var(--red-soft);
  }

  /* ── Page scroll ── */
  .page-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 28px 32px 60px;
  }

  /* ── Page Header ── */
  .page-hd {
    margin-bottom: 28px;
    animation: fadeIn 0.35s ease;
  }

  .page-hd h1 {
    font-family: 'Instrument Serif', serif;
    font-size: 26px;
    font-weight: 400;
    color: var(--ink);
    letter-spacing: -0.4px;
    margin-bottom: 4px;
  }

  .page-hd p {
    font-size: 13px;
    color: var(--ink-3);
    font-weight: 400;
  }

  /* ── Stat Grid ── */
  .stat-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 20px;
    animation: fadeIn 0.4s ease;
  }

  .stat-grid-4 { grid-template-columns: repeat(4, 1fr); }
  .stat-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .stat-grid-2 { grid-template-columns: repeat(2, 1fr); }

  .stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px 22px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .stat:hover {
    border-color: var(--border-soft);
    box-shadow: 0 2px 12px rgba(28,25,23,0.05);
  }

  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--ink-3);
  }

  .stat-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
  }

  .stat-val {
    font-family: 'Instrument Serif', serif;
    font-size: 32px;
    letter-spacing: -0.8px;
    color: var(--ink);
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-sub {
    font-size: 11.5px;
    color: var(--ink-3);
  }

  .stat.green .stat-val { color: var(--green); }
  .stat.red .stat-val { color: var(--red); }
  .stat.amber .stat-val { color: var(--amber); }

  /* ── Card ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
    animation: fadeIn 0.4s ease;
  }

  .card-head {
    padding: 16px 22px;
    border-bottom: 1px solid var(--border-soft);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-head h2 {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
  }

  .card-head-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .card-count {
    font-size: 11px;
    font-weight: 500;
    color: var(--ink-3);
  }

  .card-body { padding: 20px 22px; }
  .card-body-pad { padding: 0; }

  .card-empty {
    padding: 44px 22px;
    text-align: center;
    color: var(--ink-3);
    font-size: 13px;
  }

  .empty-icon { font-size: 30px; margin-bottom: 10px; }

  /* ── Link style ── */
  .link-btn {
    font-size: 12px;
    font-weight: 600;
    color: var(--red);
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }
  .link-btn:hover { text-decoration: underline; }

  /* ── Table ── */
  .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
  .tbl thead th {
    text-align: left;
    padding: 11px 22px;
    font-size: 10.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--ink-3);
    border-bottom: 1px solid var(--border-soft);
    background: var(--bg);
  }
  .tbl tbody td {
    padding: 13px 22px;
    border-bottom: 1px solid var(--border-soft);
    color: var(--ink-2);
    vertical-align: middle;
  }
  .tbl tbody tr:last-child td { border-bottom: none; }
  .tbl tbody tr:hover td { background: var(--bg); }

  /* ── Applicant card ── */
  .app-card {
    border-bottom: 1px solid var(--border-soft);
    padding: 22px 22px 20px;
    transition: background 0.15s;
  }
  .app-card:last-child { border-bottom: none; }
  .app-card:hover { background: var(--bg); }

  .app-row1 {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 6px;
  }

  .app-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 3px;
  }

  .app-meta {
    font-size: 12px;
    color: var(--ink-3);
  }

  .pill {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 10px;
    border-radius: 20px;
    white-space: nowrap;
  }

  .pill-student { background: var(--blue-bg); color: var(--blue); }
  .pill-corporate { background: var(--purple-bg); color: var(--purple); }
  .pill-less-privileged { background: var(--amber-bg); color: var(--amber); }
  .pill-vehicle { background: var(--bg); color: var(--ink-2); border: 1px solid var(--border); }
  .pill-approved { background: var(--green-bg); color: var(--green); }
  .pill-rejected { background: var(--red-bg); color: var(--red); }

  .app-docs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 12px 0;
  }

  .doc-link {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--ink-2);
    padding: 5px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    text-decoration: none;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .doc-link:hover {
    border-color: var(--ink);
    color: var(--ink);
    background: var(--surface);
  }

  .drv-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 8px 0 12px;
  }

  .drv-tag {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--ink-2);
    padding: 4px 10px;
    background: var(--bg);
    border-radius: 5px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .app-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  /* ── Buttons ── */
  .btn {
    padding: 8px 18px;
    font-size: 12.5px;
    font-weight: 600;
    font-family: inherit;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    letter-spacing: 0.01em;
  }

  .btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-approve {
    background: var(--ink);
    color: #fff;
  }
  .btn-approve:hover:not(:disabled) { background: #2c2825; }

  .btn-reject {
    background: var(--surface);
    color: var(--red);
    border: 1px solid var(--red-bg);
  }
  .btn-reject:hover:not(:disabled) { background: var(--red-soft); border-color: var(--red); }

  /* ── SOS Card ── */
  .sos-card {
    border-radius: 10px;
    padding: 20px 22px;
    margin-bottom: 12px;
    border: 1.5px solid var(--border);
    background: var(--surface);
    transition: border-color 0.15s;
  }

  .sos-card.active {
    border-color: var(--red);
    background: var(--red-soft);
  }

  .sos-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .sos-time {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink-2);
  }
  .sos-card.active .sos-time { color: var(--red); }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 4px 10px;
    border-radius: 20px;
  }

  .status-active {
    background: var(--red);
    color: #fff;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  .status-acknowledged { background: var(--amber-bg); color: var(--amber); }
  .status-resolved { background: var(--green-bg); color: var(--green); }

  .sos-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .sos-field-label {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--ink-3);
    margin-bottom: 3px;
  }

  .sos-field-val {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.45;
  }

  .sos-field-sub {
    font-size: 11.5px;
    color: var(--ink-3);
    margin-top: 1px;
  }

  /* ── History items ── */
  .hist-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 22px;
    border-bottom: 1px solid var(--border-soft);
    gap: 16px;
    transition: background 0.15s;
  }
  .hist-row:last-child { border-bottom: none; }
  .hist-row:hover { background: var(--bg); }

  .hist-name {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 2px;
  }

  .hist-meta {
    font-size: 11.5px;
    color: var(--ink-3);
  }

  .hist-right { text-align: right; flex-shrink: 0; }

  .hist-date {
    font-size: 11px;
    color: var(--ink-3);
    margin-top: 4px;
  }

  /* ── Shimmer ── */
  .shimmer {
    height: 32px; width: 60%; border-radius: 6px;
    background: linear-gradient(90deg, var(--bg) 25%, var(--border-soft) 50%, var(--bg) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
  }

  /* ── Mobile tabs ── */
  @media (max-width: 900px) {
    .shell { flex-direction: column; height: auto; }
    .sidebar { display: none; }
    .content-area { overflow: visible; }
    .page-scroll { overflow: visible; }

    .mobile-header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 14px 16px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .mobile-brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .mobile-tabs {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 0;
    }

    .mob-tab {
      padding: 7px 14px;
      font-size: 12.5px;
      font-weight: 600;
      font-family: inherit;
      border: none;
      border-bottom: 2px solid transparent;
      background: none;
      color: var(--ink-3);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .mob-tab.active {
      color: var(--ink);
      border-bottom-color: var(--ink);
    }

    .mob-tab.sos-tab { color: var(--red); }
    .mob-tab.sos-tab.active { border-bottom-color: var(--red); }

    .mob-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 10px;
      background: var(--red);
      color: #fff;
    }

    .page-scroll { padding: 20px 16px 40px; }
    .stat-grid-4 { grid-template-columns: repeat(2, 1fr); }
    .stat-grid-3 { grid-template-columns: repeat(2, 1fr); }
    .sos-grid { grid-template-columns: 1fr; }
    .topbar { display: none; }
  }

  @media (min-width: 901px) {
    .mobile-header { display: none; }
  }

  @media (max-width: 480px) {
    .stat-grid-4, .stat-grid-3, .stat-grid-2 { grid-template-columns: 1fr; }
    .app-row1 { flex-direction: column; }
  }
`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [donations, setDonations] = useState({ donations: [], total: 0 });
  const [applicants, setApplicants] = useState([]);
  const [driverApplicants, setDriverApplicants] = useState([]);
  const [history, setHistory] = useState({ donations: { list: [], total: 0 }, concessionHistory: [], driverHistory: [], wallet: null });
  const [sosAlerts, setSosAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [driverActionLoading, setDriverActionLoading] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const fetchDonations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/donations`, { headers: { Authorization: `Bearer ${token}` } });
      setDonations({ donations: res.data.donations || [], total: res.data.total || 0 });
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }
    } finally { setLoading(false); }
  }, [token, navigate]);

  const fetchApplicants = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/concession/applicants`, { headers: { Authorization: `Bearer ${token}` } });
      setApplicants(res.data || []);
    } catch (e) { if (e.response?.status === 401 || e.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); } }
  }, [token, navigate]);

  const fetchDriverApplicants = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/driver/applicants`, { headers: { Authorization: `Bearer ${token}` } });
      setDriverApplicants(res.data || []);
    } catch (e) { if (e.response?.status === 401 || e.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); } }
  }, [token, navigate]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/admin/history`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data || { donations: { list: [], total: 0 }, concessionHistory: [], driverHistory: [], wallet: null });
    } catch (e) { if (e.response?.status === 401 || e.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); } }
  }, [token, navigate]);

  const fetchSOSAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/admin/sos-alerts`, { headers: { Authorization: `Bearer ${token}` } });
      setSosAlerts(res.data || []);
    } catch (e) { if (e.response?.status === 401 || e.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); } }
  }, [token, navigate]);

  const refresh = useCallback(() => {
    fetchDonations(); fetchApplicants(); fetchDriverApplicants(); fetchHistory(); fetchSOSAlerts();
  }, [fetchDonations, fetchApplicants, fetchDriverApplicants, fetchHistory, fetchSOSAlerts]);

  useEffect(() => {
    if (!user?.isAdmin) { navigate("/login"); return; }
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

  useEffect(() => { const t = setInterval(refresh, 5000); return () => clearInterval(t); }, [refresh]);
  useEffect(() => { if (activeTab === "history") fetchHistory(); }, [activeTab, fetchHistory]);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try { await axios.patch(`${API_BASE}/auth/concession/${userId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } }); await fetchApplicants(); }
    catch (e) { alert(e.response?.data?.message || "Failed to approve"); } finally { setActionLoading(null); }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId);
    try { await axios.patch(`${API_BASE}/auth/concession/${userId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } }); await fetchApplicants(); }
    catch (e) { alert(e.response?.data?.message || "Failed to reject"); } finally { setActionLoading(null); }
  };

  const handleDriverApprove = async (userId) => {
    setDriverActionLoading(userId);
    try { await axios.patch(`${API_BASE}/auth/driver/${userId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } }); await fetchDriverApplicants(); await fetchHistory(); }
    catch (e) { alert(e.response?.data?.message || "Failed to approve"); } finally { setDriverActionLoading(null); }
  };

  const handleDriverReject = async (userId) => {
    setDriverActionLoading(userId);
    try { await axios.patch(`${API_BASE}/auth/driver/${userId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } }); await fetchDriverApplicants(); await fetchHistory(); }
    catch (e) { alert(e.response?.data?.message || "Failed to reject"); } finally { setDriverActionLoading(null); }
  };

  const docUrl = (userId, docType) => `${API_BASE.replace("/api", "")}/api/auth/concession/document/${userId}/${docType}?token=${encodeURIComponent(token)}`;
  const driverDocUrl = (userId, docType) => `${API_BASE.replace("/api", "")}/api/auth/driver/document/${userId}/${docType}?token=${encodeURIComponent(token)}`;

  if (!user?.isAdmin) return null;

  const activeSOS = sosAlerts.filter((a) => a.status === "active").length;
  const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : "A";

  const tabs = [
    { id: "overview", label: "Overview", icon: "◈" },
    { id: "concession", label: "Concessions", icon: "🎫", count: applicants.length || null },
    { id: "drivers", label: "Drivers", icon: "🚗", count: driverApplicants.length || null },
    { id: "donations", label: "Donations", icon: "💛" },
    { id: "sos", label: "SOS Alerts", icon: "🆘", count: activeSOS || null, urgent: activeSOS > 0 },
    { id: "history", label: "History", icon: "📋" },
  ];

  const tabLabel = tabs.find((t) => t.id === activeTab)?.label || "Overview";

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };

  return (
    <>
      <style>{S}</style>

      {/* ── MOBILE HEADER ── */}
      <div className="mobile-header">
        <div className="mobile-brand-row">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div className="brand-mark">🚇</div>
            <div>
              <div className="brand-name">MetroSetu</div>
              <div className="brand-sub">Admin</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="user-pill">
              <div className="user-avatar">{avatarLetter}</div>
              {user.name || "Admin"}
            </div>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>
        <div className="mobile-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`mob-tab ${activeTab === t.id ? "active" : ""} ${t.urgent ? "sos-tab" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {t.count ? <span className="mob-badge">{t.count}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="shell">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">🚇</div>
            <div>
              <div className="brand-name">MetroSetu</div>
              <div className="brand-sub">Admin Panel</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-group-label">Navigation</div>
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`nav-item ${activeTab === t.id ? "active" : ""} ${t.urgent ? "sos-item" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <div className="nav-item-left">
                  <div className="nav-item-icon">{t.icon}</div>
                  {t.label}
                </div>
                {t.count ? (
                  <span className={`nav-badge ${t.urgent ? "urgent" : ""}`}>{t.count}</span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            {history.wallet && (
              <div className="wallet-box">
                <div className="wallet-label">Admin Wallet</div>
                <div className="wallet-val">₹{history.wallet.adminWalletBalance ?? 0}</div>
                <div className="wallet-sub">Donations − Concessions</div>
              </div>
            )}
            <div className="refresh-info">
              Refreshed at <span className="refresh-time">{now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              <br />Auto-refresh every 5s
            </div>
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <div className="content-area">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-title">{tabLabel}</div>
            <div className="topbar-right">
              <div className="user-pill">
                <div className="user-avatar">{avatarLetter}</div>
                {user.name || "Admin"}
              </div>
              <button className="btn-logout" onClick={logout}>Logout</button>
            </div>
          </div>

          <div className="page-scroll">

            {/* ═══ OVERVIEW ═══ */}
            {activeTab === "overview" && (
              <>
                <div className="page-hd">
                  <h1>Dashboard Overview</h1>
                  <p>{now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>

                <div className="stat-grid stat-grid-4">
                  <div className="stat">
                    <div className="stat-top">
                      <div className="stat-label">Total Donations</div>
                      <div className="stat-icon" style={{ background: "#fef3c7" }}>💰</div>
                    </div>
                    <div className="stat-val">₹{donations.total || 0}</div>
                    <div className="stat-sub">{donations.donations?.length || 0} contributors</div>
                  </div>
                  <div className="stat green">
                    <div className="stat-top">
                      <div className="stat-label">Commission (4%)</div>
                      <div className="stat-icon" style={{ background: "#dcfce7" }}>📊</div>
                    </div>
                    <div className="stat-val">₹{history.wallet?.totalCommission ?? 0}</div>
                    <div className="stat-sub">From personal rides</div>
                  </div>
                  <div className="stat red">
                    <div className="stat-top">
                      <div className="stat-label">Concession Cost</div>
                      <div className="stat-icon" style={{ background: "#fee2e2" }}>🎫</div>
                    </div>
                    <div className="stat-val">−₹{history.wallet?.totalConcessionDeduction ?? 0}</div>
                    <div className="stat-sub">25% discount subsidy</div>
                  </div>
                  <div className="stat">
                    <div className="stat-top">
                      <div className="stat-label">Net Wallet</div>
                      <div className="stat-icon" style={{ background: "#f1f5f9" }}>🏦</div>
                    </div>
                    <div className="stat-val">₹{history.wallet?.adminWalletBalance ?? 0}</div>
                    <div className="stat-sub">Running balance</div>
                  </div>
                </div>

                <div className="stat-grid stat-grid-3">
                  <div className="stat" style={{ cursor: "pointer" }} onClick={() => setActiveTab("concession")}>
                    <div className="stat-top">
                      <div className="stat-label">Pending Concessions</div>
                      <div className="stat-icon" style={{ background: "#ede9fe" }}>📝</div>
                    </div>
                    <div className="stat-val">{applicants.length}</div>
                    <div className="stat-sub">Awaiting verification</div>
                  </div>
                  <div className="stat" style={{ cursor: "pointer" }} onClick={() => setActiveTab("drivers")}>
                    <div className="stat-top">
                      <div className="stat-label">Pending Drivers</div>
                      <div className="stat-icon" style={{ background: "#dbeafe" }}>🚗</div>
                    </div>
                    <div className="stat-val">{driverApplicants.length}</div>
                    <div className="stat-sub">Awaiting approval</div>
                  </div>
                  <div className={`stat ${activeSOS > 0 ? "red" : ""}`} style={{ cursor: "pointer" }} onClick={() => setActiveTab("sos")}>
                    <div className="stat-top">
                      <div className="stat-label">Active SOS</div>
                      <div className="stat-icon" style={{ background: activeSOS > 0 ? "#fee2e2" : "#f1f5f9" }}>🆘</div>
                    </div>
                    <div className="stat-val">{activeSOS}</div>
                    <div className="stat-sub">{activeSOS > 0 ? "Requires immediate attention" : "All clear"}</div>
                  </div>
                </div>

                {activeSOS > 0 && (
                  <div className="card">
                    <div className="card-head">
                      <h2>Active SOS Alerts</h2>
                      <button className="link-btn" onClick={() => setActiveTab("sos")}>View all →</button>
                    </div>
                    <div className="card-body">
                      {sosAlerts.filter((a) => a.status === "active").slice(0, 2).map((a) => (
                        <div key={a._id} className="sos-card active" style={{ marginBottom: 10 }}>
                          <div className="sos-top">
                            <div className="sos-time">{new Date(a.createdAt).toLocaleString("en-IN")}</div>
                            <span className="status-pill status-active">Active</span>
                          </div>
                          <div className="sos-grid">
                            <div>
                              <div className="sos-field-label">Passenger</div>
                              <div className="sos-field-val">{a.userSnapshot?.name} {a.userSnapshot?.gender && `· ${a.userSnapshot.gender}`}</div>
                              <div className="sos-field-sub">📞 {a.userSnapshot?.phone}</div>
                            </div>
                            <div>
                              <div className="sos-field-label">Driver</div>
                              <div className="sos-field-val">{a.driverSnapshot?.name}</div>
                              <div className="sos-field-sub">📞 {a.driverSnapshot?.phone}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ CONCESSIONS ═══ */}
            {activeTab === "concession" && (
              <>
                <div className="page-hd">
                  <h1>Concession Applications</h1>
                  <p>Review and verify — Student, Corporate, Less Privileged</p>
                </div>
                <div className="card">
                  <div className="card-head">
                    <h2>Pending Applications</h2>
                    <span className="card-count">{applicants.length} pending</span>
                  </div>
                  {applicants.length === 0 ? (
                    <div className="card-empty">
                      <div className="empty-icon">✅</div>
                      All concession applications reviewed
                    </div>
                  ) : (
                    <div className="card-body-pad">
                      {applicants.map((a) => {
                        const catClass = `pill-${(a.concessionCategory || "").toLowerCase().replace(/\s+/g, "-")}`;
                        return (
                          <div key={a._id} className="app-card">
                            <div className="app-row1">
                              <div>
                                <div className="app-name">{a.name}</div>
                                <div className="app-meta">{a.email} · {a.phone}{a.gender && ` · ${a.gender}`}</div>
                              </div>
                              <span className={`pill ${catClass}`}>{a.concessionCategory}</span>
                            </div>
                            <div className="app-docs">
                              {a.concessionDocuments && Object.entries(a.concessionDocuments).map(([type, path]) =>
                                path ? (
                                  <a key={type} href={docUrl(a._id, type)} target="_blank" rel="noopener noreferrer" className="doc-link">
                                    📄 {docLabels[type] || type}
                                  </a>
                                ) : null
                              )}
                            </div>
                            <div className="app-actions">
                              <button className="btn btn-approve" onClick={() => handleApprove(a._id)} disabled={actionLoading === a._id}>
                                {actionLoading === a._id ? "Processing…" : "✓ Approve"}
                              </button>
                              <button className="btn btn-reject" onClick={() => handleReject(a._id)} disabled={actionLoading === a._id}>
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ═══ DRIVERS ═══ */}
            {activeTab === "drivers" && (
              <>
                <div className="page-hd">
                  <h1>Driver Applications</h1>
                  <p>Verify documents and approve drivers — Auto, Cab, Sedan</p>
                </div>
                <div className="card">
                  <div className="card-head">
                    <h2>Pending Drivers</h2>
                    <span className="card-count">{driverApplicants.length} pending</span>
                  </div>
                  {driverApplicants.length === 0 ? (
                    <div className="card-empty">
                      <div className="empty-icon">✅</div>
                      No pending driver applications
                    </div>
                  ) : (
                    <div className="card-body-pad">
                      {driverApplicants.map((d) => (
                        <div key={d._id} className="app-card">
                          <div className="app-row1">
                            <div>
                              <div className="app-name">{d.name}</div>
                              <div className="app-meta">{d.email} · {d.phone}{d.gender && ` · ${d.gender}`}</div>
                            </div>
                            <span className="pill pill-vehicle">{d.vehicleType || "Unknown"}</span>
                          </div>
                          <div className="drv-tags">
                            <span className="drv-tag">🔢 {d.vehicleNumber || "—"}</span>
                            <span className="drv-tag">📋 {d.licenseNumber || "—"}</span>
                          </div>
                          <div className="app-docs">
                            <a href={driverDocUrl(d._id, "rc")} target="_blank" rel="noopener noreferrer" className="doc-link">📄 RC Book</a>
                            <a href={driverDocUrl(d._id, "insurance")} target="_blank" rel="noopener noreferrer" className="doc-link">📄 Insurance</a>
                          </div>
                          <div className="app-actions">
                            <button className="btn btn-approve" onClick={() => handleDriverApprove(d._id)} disabled={driverActionLoading === d._id}>
                              {driverActionLoading === d._id ? "Processing…" : "✓ Approve"}
                            </button>
                            <button className="btn btn-reject" onClick={() => handleDriverReject(d._id)} disabled={driverActionLoading === d._id}>
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ═══ DONATIONS ═══ */}
            {activeTab === "donations" && (
              <>
                <div className="page-hd">
                  <h1>Donations</h1>
                  <p>All contributions received through the platform</p>
                </div>
                <div className="stat-grid stat-grid-2" style={{ marginBottom: 20 }}>
                  <div className="stat">
                    <div className="stat-top">
                      <div className="stat-label">Total Collected</div>
                      <div className="stat-icon" style={{ background: "#fef3c7" }}>💰</div>
                    </div>
                    <div className="stat-val">₹{donations.total || 0}</div>
                    <div className="stat-sub">All time</div>
                  </div>
                  <div className="stat">
                    <div className="stat-top">
                      <div className="stat-label">Total Donors</div>
                      <div className="stat-icon" style={{ background: "#f0fdf4" }}>👥</div>
                    </div>
                    <div className="stat-val">{donations.donations?.length || 0}</div>
                    <div className="stat-sub">Unique transactions</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-head"><h2>Donation Records</h2></div>
                  {loading ? (
                    <div className="card-body"><div className="shimmer" /></div>
                  ) : donations.donations?.length === 0 ? (
                    <div className="card-empty"><div className="empty-icon">💛</div>No donations yet</div>
                  ) : (
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Donor</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Transaction ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.donations.map((d) => (
                          <tr key={d._id}>
                            <td style={{ fontWeight: 600, color: "var(--ink)" }}>{d.donorName}</td>
                            <td style={{ fontWeight: 700, color: "var(--green)" }}>₹{d.amount}</td>
                            <td>{new Date(d.date).toLocaleDateString("en-IN")}</td>
                            <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-3)" }}>{d.transactionId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* ═══ SOS ═══ */}
            {activeTab === "sos" && (
              <>
                <div className="page-hd">
                  <h1>SOS Alerts</h1>
                  <p>Emergency alerts triggered by passengers during rides</p>
                </div>
                {sosAlerts.length === 0 ? (
                  <div className="card">
                    <div className="card-empty"><div className="empty-icon">🛡️</div>No SOS alerts — all clear</div>
                  </div>
                ) : (
                  sosAlerts.map((a) => (
                    <div key={a._id} className={`sos-card ${a.status}`}>
                      <div className="sos-top">
                        <div className="sos-time">{new Date(a.createdAt).toLocaleString("en-IN")}</div>
                        <span className={`status-pill status-${a.status}`}>{a.status}</span>
                      </div>
                      <div className="sos-grid">
                        <div>
                          <div className="sos-field-label">Passenger</div>
                          <div className="sos-field-val">{a.userSnapshot?.name}{a.userSnapshot?.gender && ` · ${a.userSnapshot.gender}`}</div>
                          <div className="sos-field-sub">📞 {a.userSnapshot?.phone}</div>
                          <div className="sos-field-sub" style={{ color: "var(--ink-3)", fontSize: 11 }}>{a.userSnapshot?.email}</div>
                        </div>
                        <div>
                          <div className="sos-field-label">Driver</div>
                          <div className="sos-field-val">{a.driverSnapshot?.name}</div>
                          <div className="sos-field-sub">📞 {a.driverSnapshot?.phone}</div>
                        </div>
                        <div>
                          <div className="sos-field-label">Pickup</div>
                          <div className="sos-field-val">{a.rideSnapshot?.pickupAddress || `${a.rideSnapshot?.pickupLat}, ${a.rideSnapshot?.pickupLng}`}</div>
                        </div>
                        <div>
                          <div className="sos-field-label">Drop-off</div>
                          <div className="sos-field-val">{a.rideSnapshot?.dropAddress || `${a.rideSnapshot?.dropLat}, ${a.rideSnapshot?.dropLng}`}</div>
                        </div>
                        <div>
                          <div className="sos-field-label">Ride</div>
                          <div className="sos-field-val">{a.rideSnapshot?.vehicleType || "—"} · ₹{a.rideSnapshot?.offeredPrice || "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* ═══ HISTORY ═══ */}
            {activeTab === "history" && (
              <>
                <div className="page-hd">
                  <h1>History</h1>
                  <p>Past decisions and records across all categories</p>
                </div>

                <div className="card">
                  <div className="card-head">
                    <h2>Donation History</h2>
                    <span className="card-count">Total: ₹{history.donations?.total ?? 0}</span>
                  </div>
                  {(history.donations?.list || []).length === 0 ? (
                    <div className="card-empty">No donation history</div>
                  ) : (
                    <table className="tbl">
                      <thead><tr><th>Donor</th><th>Amount</th><th>Date</th><th>Transaction ID</th></tr></thead>
                      <tbody>
                        {(history.donations?.list || []).map((d) => (
                          <tr key={d._id}>
                            <td style={{ fontWeight: 600, color: "var(--ink)" }}>{d.donorName}</td>
                            <td style={{ fontWeight: 700, color: "var(--green)" }}>₹{d.amount}</td>
                            <td>{new Date(d.date).toLocaleDateString("en-IN")}</td>
                            <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-3)" }}>{d.transactionId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="card">
                  <div className="card-head"><h2>Concession History</h2></div>
                  {(history.concessionHistory || []).length === 0 ? (
                    <div className="card-empty">No concession history</div>
                  ) : (
                    <div className="card-body-pad">
                      {(history.concessionHistory || []).map((h) => (
                        <div key={h._id} className="hist-row">
                          <div>
                            <div className="hist-name">{h.name}</div>
                            <div className="hist-meta">{h.email} · {h.concessionCategory}</div>
                          </div>
                          <div className="hist-right">
                            <span className={`pill ${h.concessionApproved ? "pill-approved" : "pill-rejected"}`}>
                              {h.concessionApproved ? "Approved" : "Rejected"}
                            </span>
                            <div className="hist-date">{new Date(h.updatedAt).toLocaleDateString("en-IN")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="card-head"><h2>Driver History</h2></div>
                  {(history.driverHistory || []).length === 0 ? (
                    <div className="card-empty">No driver history</div>
                  ) : (
                    <div className="card-body-pad">
                      {(history.driverHistory || []).map((h) => (
                        <div key={h._id} className="hist-row">
                          <div>
                            <div className="hist-name">{h.name}</div>
                            <div className="hist-meta">{h.email} · {h.vehicleType} · {h.vehicleNumber}</div>
                          </div>
                          <div className="hist-right">
                            <span className={`pill ${h.driverApproved ? "pill-approved" : "pill-rejected"}`}>
                              {h.driverApproved ? "Approved" : "Rejected"}
                            </span>
                            <div className="hist-date">{new Date(h.updatedAt).toLocaleDateString("en-IN")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}