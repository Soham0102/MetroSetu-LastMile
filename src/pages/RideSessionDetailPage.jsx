/**
 * RideSessionDetailPage.jsx
 * Ride Request Detail / Confirmation page.
 * - Shows common spot, proposed/final time, other user.
 * - If the other user set a final time, this user sees Accept / Reject.
 * - If accepted, both are redirected to the booking confirmation (invite) view.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function getInitials(name = "") {
  return name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function openGoogleMaps(lat, lng) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
}

export default function RideSessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";
  const myUserId = decodeToken(token).id || "";

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!sessionId || !token) {
      setError("Missing session or login");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/shared-ride/session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError(res.status === 404 ? "Session not found" : "Failed to load");
          setSession(null);
          return;
        }
        const data = await res.json();
        setSession(data);
      } catch (e) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, token]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    socket.on("ride:booked", (data) => {
      if (data.redirect && data.bookedRiderIds?.includes(myUserId)) {
        localStorage.setItem("inviteBooking", JSON.stringify(data));
        navigate("/shared-ride/booking?mode=invited");
      }
    });
    socket.on("ride:final_time_proposed", (data) => {
      if (data.sessionId === sessionId) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                finalTime: data.finalTime,
                finalTimeProposedBy: data.proposedBy,
                commonSpot: data.commonSpot || prev.commonSpot,
              }
            : null
        );
      }
    });
    socket.on("ride:final_time_rejected", (data) => {
      if (data.sessionId === sessionId) {
        setSession((prev) =>
          prev ? { ...prev, finalTime: null, finalTimeProposedBy: null } : null
        );
      }
    });
    return () => socket.disconnect();
  }, [token, sessionId, myUserId, navigate]);

  const needToAcceptFinal =
    session?.finalTime &&
    session?.finalTimeProposedBy &&
    String(session.finalTimeProposedBy) !== myUserId &&
    !session?.finalTimeAccepted;
  const confirmed = session?.finalTimeAccepted || session?.status === "both_confirmed";
  const spot = session?.commonSpot;
  const finalTimeStr = session?.finalTime
    ? new Date(session.finalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const proposedTimeStr = session?.proposedTime
    ? new Date(session.proposedTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const handleAcceptFinal = async () => {
    if (accepting) return;
    setAccepting(true);
    try {
      const res = await fetch(`${API_BASE}/shared-ride/session/${sessionId}/accept-final-time`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.booking) {
        localStorage.setItem("inviteBooking", JSON.stringify(data.booking));
        navigate("/shared-ride/booking?mode=invited");
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectFinal = async () => {
    if (rejecting) return;
    setRejecting(true);
    try {
      const res = await fetch(`${API_BASE}/shared-ride/session/${sessionId}/reject-final-time`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession((prev) =>
          prev
            ? { ...prev, finalTime: null, finalTimeProposedBy: null }
            : null
        );
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="rsd-root">
        <div className="rsd-loading">Loading ride details…</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="rsd-root">
        <div className="rsd-error">
          <p>{error || "Session not found"}</p>
          <button type="button" className="rsd-btn" onClick={() => navigate("/shared-auto-booking")}>
            Back to shared ride
          </button>
        </div>
      </div>
    );
  }

  const otherName = session?.otherUser?.name || "Rider";

  return (
    <>
      <style>{RSD_STYLES}</style>
      <div className="rsd-root">
        <button type="button" className="rsd-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="rsd-card">
          <h1 className="rsd-title">Ride request details</h1>
          <p className="rsd-with">With {otherName}</p>

          {spot && (
            <div className="rsd-spot">
              <div className="rsd-spot__icon">📍</div>
              <div>
                <div className="rsd-spot__name">{spot.name}</div>
                <div className="rsd-spot__addr">{spot.address}</div>
              </div>
              <button
                type="button"
                className="rsd-spot__nav"
                onClick={() => openGoogleMaps(spot.lat, spot.lng)}
              >
                Directions
              </button>
            </div>
          )}

          <div className="rsd-meta">
            {proposedTimeStr && (
              <div className="rsd-meta__row">
                <span>Proposed time</span>
                <strong>{proposedTimeStr}</strong>
              </div>
            )}
            {finalTimeStr && (
              <div className="rsd-meta__row">
                <span>Final pickup time</span>
                <strong>{finalTimeStr}</strong>
              </div>
            )}
          </div>

          {needToAcceptFinal && (
            <div className="rsd-confirm-block">
              <p className="rsd-confirm__text">
                Confirm pickup at <strong>{finalTimeStr}</strong>?
              </p>
              <div className="rsd-confirm__actions">
                <button
                  type="button"
                  className="rsd-confirm-reject"
                  onClick={handleRejectFinal}
                  disabled={rejecting}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="rsd-confirm-accept"
                  onClick={handleAcceptFinal}
                  disabled={accepting}
                >
                  {accepting ? "Confirming…" : "Accept"}
                </button>
              </div>
            </div>
          )}

          {confirmed && (
            <div className="rsd-confirmed">
              <p>Ride confirmed. You can view the details on the booking page.</p>
              <button
                type="button"
                className="rsd-btn rsd-btn--primary"
                onClick={() => {
                  const invite = localStorage.getItem("inviteBooking");
                  if (invite) {
                    navigate("/shared-ride/booking?mode=invited");
                  } else {
                    navigate("/shared-auto-booking");
                  }
                }}
              >
                View ride
              </button>
            </div>
          )}

          {!needToAcceptFinal && !confirmed && (
            <p className="rsd-hint">
              Open the chat from the shared ride page to propose or set a final time.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

const RSD_STYLES = `
.rsd-root {
  min-height: 100vh; background: #0d1520;
  font-family: 'DM Sans', sans-serif;
  padding: 20px; padding-top: 60px;
}
.rsd-loading, .rsd-error {
  text-align: center; color: #7a8a9a;
  padding: 40px 20px;
}
.rsd-error p { margin-bottom: 16px; }
.rsd-back {
  position: absolute; top: 14px; left: 14px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
  border-radius: 100px; color: #9eb0c4;
  padding: 8px 16px; font-size: 13px; cursor: pointer;
  font-family: inherit;
}
.rsd-card {
  max-width: 420px; margin: 0 auto;
  background: #101c2e; border: 1px solid rgba(255,255,255,.06);
  border-radius: 20px; padding: 24px;
}
.rsd-title { color: #cdd8e8; font-size: 20px; font-weight: 800; margin-bottom: 4px; }
.rsd-with { color: #4a5a6e; font-size: 14px; margin-bottom: 20px; }
.rsd-spot {
  display: flex; align-items: flex-start; gap: 12px;
  background: rgba(0,208,132,.08); border: 1px solid rgba(0,208,132,.2);
  border-radius: 14px; padding: 14px; margin-bottom: 16px;
}
.rsd-spot__icon { font-size: 20px; flex-shrink: 0; }
.rsd-spot__name { color: #cdd8e8; font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.rsd-spot__addr { color: #3a5a4a; font-size: 12px; }
.rsd-spot__nav {
  margin-left: auto; background: rgba(0,208,132,.2);
  border: 1px solid #00d084; color: #00d084;
  border-radius: 8px; padding: 6px 12px;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.rsd-meta { margin-bottom: 16px; }
.rsd-meta__row {
  display: flex; justify-content: space-between; align-items: center;
  color: #7a8a9a; font-size: 13px; margin-bottom: 8px;
}
.rsd-meta__row strong { color: #cdd8e8; }
.rsd-confirm-block {
  padding: 16px 0; border-top: 1px solid rgba(255,255,255,.06);
}
.rsd-confirm__text { color: #cdd8e8; font-size: 14px; margin-bottom: 12px; }
.rsd-confirm__text strong { color: #00d084; }
.rsd-confirm__actions { display: flex; gap: 12px; }
.rsd-confirm-reject {
  flex: 1; background: rgba(248,81,73,.15);
  border: 1px solid rgba(248,81,73,.35);
  border-radius: 12px; color: #f85149;
  padding: 12px; font-weight: 600; cursor: pointer;
}
.rsd-confirm-accept {
  flex: 1; background: #00d084; color: #071a0f;
  border: none; border-radius: 12px;
  padding: 12px; font-weight: 700; cursor: pointer;
}
.rsd-confirm-accept:disabled { opacity: .7; cursor: not-allowed; }
.rsd-confirmed {
  padding-top: 16px; border-top: 1px solid rgba(255,255,255,.06);
}
.rsd-confirmed p { color: #00d084; font-size: 14px; margin-bottom: 12px; }
.rsd-hint { color: #2e4258; font-size: 12px; }
.rsd-btn {
  display: block; width: 100%;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px; color: #9eb0c4;
  padding: 12px; font-size: 14px; cursor: pointer;
  font-family: inherit;
}
.rsd-btn--primary {
  background: #3a7ae0; color: #fff; border-color: #3a7ae0;
  font-weight: 600; margin-top: 8px;
}
`;
