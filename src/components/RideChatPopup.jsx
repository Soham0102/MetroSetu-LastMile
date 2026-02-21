/**
 * RideChatPopup.jsx
 * Pop-up chat window (Uber/Instamart style) for ride details.
 * - Suggested questions at top
 * - Messages list + input
 * - "Do you want to confirm your ride?" + Confirm button (both users must confirm)
 * - 5 min idle timeout after last message → expire and close
 */

import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const CHAT_IDLE_MS = 5 * 60 * 1000; // 5 minutes

const SUGGESTED_QUESTIONS = [
  "Can we adjust the pickup time?",
  "Are you okay with this location?",
  "I can reach in 10 minutes. Is that fine?",
  "Should we meet at the metro entrance instead?",
  "What time works best for you?",
];

function getInitials(name = "") {
  return name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export default function RideChatPopup({
  sessionId,
  otherUser,
  commonSpot,
  departureTime,
  onClose,
  onRideBooked,
  token,
  incomingMessage,
  expiredSessionId,
}) {
  const myUserId = decodeToken(token || "").id || "";
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [expired, setExpired] = useState(false);
  const messagesEndRef = useRef(null);
  const idleTimerRef = useRef(null);
  const lastMessageAtRef = useRef(null);

  // Live message from socket (parent pushes when ride:chat_message received)
  useEffect(() => {
    if (!incomingMessage || incomingMessage.sessionId !== sessionId || !incomingMessage.message) return;
    setMessages((prev) => [...prev, incomingMessage.message]);
    lastMessageAtRef.current = Date.now();
    resetIdleTimer();
  }, [incomingMessage, sessionId]);

  // Session expired (parent sets when ride:session_expired received)
  useEffect(() => {
    if (expiredSessionId === sessionId) setExpired(true);
  }, [expiredSessionId, sessionId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch session + messages
  useEffect(() => {
    if (!sessionId || !token) return;

    let cancelled = false;
    (async () => {
      try {
        const [sRes, mRes] = await Promise.all([
          fetch(`${API_BASE}/shared-ride/session/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/shared-ride/session/${sessionId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (cancelled) return;
        if (sRes.ok) {
          const sData = await sRes.json();
          setSession(sData);
        }
        if (mRes.ok) {
          const mData = await mRes.json();
          setMessages(mData.messages || []);
          const last = (mData.messages || []).slice(-1)[0];
          if (last?.createdAt) {
            lastMessageAtRef.current = new Date(last.createdAt).getTime();
          }
        }
        // Start 5-min idle timer (from open or from last message)
        resetIdleTimer();
      } catch (e) {
        console.warn(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      handleExpire();
    }, CHAT_IDLE_MS);
  }, []);

  const handleExpire = useCallback(async () => {
    if (expired) return;
    setExpired(true);
    try {
      await fetch(`${API_BASE}/shared-ride/session/${sessionId}/expire`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.warn(e);
    }
    onClose?.();
  }, [sessionId, token, onClose, expired]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const sendMessage = async (text) => {
    const t = (text || input).trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/shared-ride/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: t }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        lastMessageAtRef.current = Date.now();
        resetIdleTimer();
        setInput("");
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      const res = await fetch(`${API_BASE}/shared-ride/session/${sessionId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSession((prev) => ({
          ...prev,
          requesterConfirmed: data.session?.requesterConfirmed ?? prev?.requesterConfirmed,
          accepterConfirmed: data.session?.accepterConfirmed ?? prev?.accepterConfirmed,
        }));
        if (data.booking) {
          onRideBooked?.(data.booking);
          onClose?.();
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setConfirming(false);
    }
  };

  const canShowConfirm =
    session &&
    (session.requesterConfirmed !== undefined || session.accepterConfirmed !== undefined) &&
    messages.length > 0;
  const myConfirmed =
    session &&
    (session.isRequester ? session.requesterConfirmed : session.accepterConfirmed);
  const bothConfirmed = session?.requesterConfirmed && session?.accepterConfirmed;

  if (loading && !session) {
    return (
      <div className="rcp-overlay" onClick={onClose}>
        <div className="rcp-box" onClick={(e) => e.stopPropagation()}>
          <div className="rcp-loading">Loading chat…</div>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="rcp-overlay" onClick={onClose}>
        <div className="rcp-box rcp-box--expired" onClick={(e) => e.stopPropagation()}>
          <div className="rcp-expired">This chat has expired due to inactivity (5 min).</div>
          <button className="rcp-btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const otherName = otherUser?.name || session?.otherUser?.name || "Rider";
  const spotName = commonSpot?.name || session?.commonSpot?.name || "Meetup point";
  const timeStr = (departureTime || session?.departureTime)
    ? new Date(departureTime || session.departureTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <>
      <style>{RCP_STYLES}</style>
      <div className="rcp-overlay" onClick={onClose}>
        <div className="rcp-box" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="rcp-header">
            <div className="rcp-header__av">
              {otherUser?.avatar || session?.otherUser?.avatar ? (
                <img
                  src={otherUser?.avatar || session?.otherUser?.avatar}
                  alt={otherName}
                />
              ) : (
                <span>{getInitials(otherName)}</span>
              )}
            </div>
            <div className="rcp-header__info">
              <div className="rcp-header__name">{otherName}</div>
              <div className="rcp-header__meta">
                {spotName}
                {timeStr ? ` · ${timeStr}` : ""}
              </div>
            </div>
            <button type="button" className="rcp-header__close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Suggested questions */}
          <div className="rcp-suggested">
            <div className="rcp-suggested__label">Suggested</div>
            <div className="rcp-suggested__chips">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  className="rcp-chip"
                  onClick={() => sendMessage(q)}
                  disabled={sending}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="rcp-messages">
            {messages.length === 0 && (
              <div className="rcp-empty">Send a message or tap a suggested question to start.</div>
            )}
            {messages.map((msg) => {
              const isMe = (msg.sender?._id || msg.sender?.id || msg.sender)?.toString() === myUserId;
              return (
                <div
                  key={msg._id}
                  className={`rcp-msg ${isMe ? "rcp-msg--me" : "rcp-msg--them"}`}
                >
                  <div className="rcp-msg__bubble">{msg.text}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Confirm block */}
          {canShowConfirm && !bothConfirmed && (
            <div className="rcp-confirm-block">
              <p className="rcp-confirm__text">Do you want to confirm your ride?</p>
              <button
                type="button"
                className="rcp-confirm__btn"
                onClick={handleConfirm}
                disabled={confirming || myConfirmed}
              >
                {confirming ? "Confirming…" : myConfirmed ? "✓ You confirmed" : "Confirm"}
              </button>
            </div>
          )}

          {bothConfirmed && (
            <div className="rcp-confirm-block rcp-confirm-block--done">
              <p className="rcp-confirm__text">Ride confirmed! Check your invite.</p>
            </div>
          )}

          {/* Input */}
          {!bothConfirmed && (
            <div className="rcp-input-row">
              <input
                type="text"
                className="rcp-input"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={sending}
              />
              <button
                type="button"
                className="rcp-send"
                onClick={() => sendMessage()}
                disabled={sending || !input.trim()}
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const RCP_STYLES = `
.rcp-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,.6); backdrop-filter: blur(8px);
  display: flex; align-items: flex-end; justify-content: center;
  animation: rcp-fadeIn .2s ease;
}
@keyframes rcp-fadeIn { from { opacity: 0; } to { opacity: 1; } }

.rcp-box {
  width: 100%; max-width: 480px; max-height: 85vh;
  background: #0d1520; border-radius: 20px 20px 0 0;
  display: flex; flex-direction: column;
  box-shadow: 0 -4px 24px rgba(0,0,0,.4);
  animation: rcp-slideUp .3s cubic-bezier(.4,0,.2,1);
}
@keyframes rcp-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.rcp-box--expired { max-height: none; padding: 24px; }
.rcp-loading, .rcp-expired {
  color: #7a8a9a; font-size: 14px; padding: 24px; text-align: center;
}
.rcp-btn-close {
  margin-top: 12px; width: 100%;
  background: #3a7ae0; color: #fff; border: none;
  border-radius: 12px; padding: 12px; font-weight: 600; cursor: pointer;
}

.rcp-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
}
.rcp-header__av {
  width: 44px; height: 44px; border-radius: 50%;
  background: #162030; border: 2px solid rgba(58,122,224,.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #3a7ae0;
  overflow: hidden;
}
.rcp-header__av img { width: 100%; height: 100%; object-fit: cover; }
.rcp-header__info { flex: 1; min-width: 0; }
.rcp-header__name { color: #cdd8e8; font-size: 16px; font-weight: 700; }
.rcp-header__meta { color: #4a5a6e; font-size: 12px; margin-top: 2px; }
.rcp-header__close {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,.06); border: none;
  color: #7a8a9a; font-size: 18px; cursor: pointer;
}

.rcp-suggested {
  padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,.04);
  flex-shrink: 0;
}
.rcp-suggested__label {
  color: #2e4258; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px;
}
.rcp-suggested__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.rcp-chip {
  background: #101c2e; border: 1px solid rgba(255,255,255,.06);
  border-radius: 100px; padding: 6px 12px;
  color: #8a9aaa; font-size: 12px; cursor: pointer;
  font-family: inherit; transition: all .15s;
}
.rcp-chip:hover { background: #162035; color: #3a7ae0; }
.rcp-chip:disabled { opacity: .6; cursor: not-allowed; }

.rcp-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
  min-height: 120px; max-height: 280px;
}
.rcp-empty { color: #2e4258; font-size: 13px; text-align: center; padding: 12px; }
.rcp-msg { display: flex; }
.rcp-msg--me { justify-content: flex-end; }
.rcp-msg--them { justify-content: flex-start; }
.rcp-msg__bubble {
  max-width: 80%; padding: 10px 14px; border-radius: 16px;
  font-size: 14px; line-height: 1.4;
}
.rcp-msg--me .rcp-msg__bubble {
  background: #3a7ae0; color: #fff; border-bottom-right-radius: 4px;
}
.rcp-msg--them .rcp-msg__bubble {
  background: #101c2e; color: #cdd8e8; border-bottom-left-radius: 4px;
}

.rcp-confirm-block {
  padding: 12px 16px; border-top: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
}
.rcp-confirm__text { color: #9eb0c4; font-size: 13px; margin-bottom: 10px; }
.rcp-confirm__btn {
  width: 100%; background: #00d084; color: #071a0f;
  border: none; border-radius: 12px; padding: 12px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  font-family: inherit;
}
.rcp-confirm__btn:disabled { opacity: .7; cursor: not-allowed; }
.rcp-confirm-block--done .rcp-confirm__text { color: #00d084; }

.rcp-input-row {
  display: flex; gap: 10px; padding: 12px 16px 20px;
  border-top: 1px solid rgba(255,255,255,.04);
  flex-shrink: 0;
}
.rcp-input {
  flex: 1; background: #101c2e; border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px; padding: 10px 14px;
  color: #cdd8e8; font-size: 14px; outline: none;
}
.rcp-send {
  background: #3a7ae0; color: #fff; border: none;
  border-radius: 12px; padding: 10px 18px;
  font-size: 14px; font-weight: 600; cursor: pointer;
}
.rcp-send:disabled { opacity: .5; cursor: not-allowed; }
`;
