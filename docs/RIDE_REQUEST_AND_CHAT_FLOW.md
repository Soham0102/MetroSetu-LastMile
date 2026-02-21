# Ride Request, Accept/Reject, Chat & Dual Confirmation Flow

This document describes **where changes were made** to implement:

1. **No auto-confirm** — User B gets **Accept** or **Reject** when they see User A’s request.
2. **Mutual ride details** — Either user can open **Chat** to discuss pickup time/location.
3. **Pop-up chat** (Uber/Instamart style) with **suggested questions** and **Confirm** only after **both** users press Confirm.
4. **5-minute idle** — If no messages for 5 minutes after the last message, the chat session expires and closes.

---

## 1. Request flow (no auto-confirm)

### Current behaviour

- **User A** posts a ride request via **SharedAutoBooking** → `POST /api/shared-ride/request` (broadcasts to others).
- **User B** sees nearby riders (same metro, same direction) and previously could only **select** riders and **Continue** to booking (booker-driven confirm).

### Changes

- **No automatic confirmation** when a request is created or when matches are found. Backend already did not set `status: "matched"` on match; that is unchanged.
- **User B** now sees **Accept** and **Reject** on each rider card instead of only “select and continue”.

**Where:**

- **Frontend:** `src/pages/SharedAutoBooking.jsx`
  - Rider list cards: **Accept** / **Reject** buttons when there is no session with that rider; **Chat** when a session exists.
  - `acceptRequest(riderRequestId)` → `POST /api/shared-ride/accept-request`.
  - `rejectRequest(riderRequestId)` → `POST /api/shared-ride/reject-request`.
- **Backend:** `server/controllers/rideSession.controller.js`
  - `acceptRequest`: creates a **RideSession** (status `accepted`), notifies User A via socket `ride:request_accepted`.
  - `rejectRequest`: notifies User A via socket `ride:request_rejected`.

---

## 2. Confirmation logic (only when both confirm)

### Current behaviour

- Confirmation was effectively **booker-only**: one user selected riders and clicked **Confirm** on the booking page → `POST /api/shared-ride/book` → all matched users got `ride:booked`.

### Changes

- Ride is **confirmed only when both users press Confirm** in the chat popup.
- Backend tracks `requesterConfirmed` and `accepterConfirmed` on **RideSession**. When both are true, the server performs the same “book” behaviour (updates ride requests, sets `ride:booked` / `ride:riders_booked`).

**Where:**

- **Backend:** `server/controllers/rideSession.controller.js`
  - `confirmRide` (POST `/session/:sessionId/confirm`): sets `requesterConfirmed` or `accepterConfirmed` for the current user; when **both** are true, updates all related **RideRequest**s to `matched`, generates `groupId`, and emits `ride:booked` and `ride:riders_booked` (same as existing book flow).
- **Frontend:** `src/components/RideChatPopup.jsx`
  - “Do you want to confirm your ride?” text and **Confirm** button.
  - Only after **both** have confirmed, `onRideBooked(booking)` is called and user is sent to the invite/booking view.

---

## 3. Chat UI (pop-up, suggested questions, mutual details)

### Behaviour

- Either User A or User B can open **Chat** from the rider list (once a session exists: after B accepted).
- Chat opens as a **pop-up** over the page (similar to Uber/Instamart).
- **Suggested questions** at the top (e.g. “Can we adjust the pickup time?”, “Are you okay with this location?”).
- Messages and **Confirm** with “Do you want to confirm your ride?”; ride confirms only when **both** press Confirm.

**Where:**

- **Frontend:** `src/components/RideChatPopup.jsx`
  - Pop-up layout, header with other user and meetup/time.
  - `SUGGESTED_QUESTIONS` chips; tap to send as message.
  - Message list, input, send; confirm block with text + Confirm button.
  - Uses `GET /session/:sessionId`, `GET /session/:sessionId/messages`, `POST /session/:sessionId/message`, `POST /session/:sessionId/confirm`.
- **Frontend:** `src/pages/SharedAutoBooking.jsx`
  - Renders `RideChatPopup` when `chatSessionId` is set; passes `otherUser`, `commonSpot`, `departureTime`, `onClose`, `onRideBooked`, `token`, `incomingMessage`, `expiredSessionId`.

---

## 4. Timeout handling (5 minutes idle)

### Behaviour

- If **no messages are exchanged for 5 minutes after the last message**, the chat session **expires** and the pop-up closes (or shows an “expired” state).
- Timer resets on **send** and on **receive** (socket message).

**Where:**

- **Backend:** `server/controllers/rideSession.controller.js`
  - `RideSession.lastMessageAt` updated on every `sendMessage`.
  - `expireIdleSessions(io)` runs every **60 seconds** (from `server/index.js`): finds sessions with `lastMessageAt` older than 5 minutes and sets `status: "expired"`, then emits `ride:session_expired` to both users.
- **Backend:** `server/index.js`
  - `setInterval(..., 60000)` calling `expireIdleSessions(io)`.
- **Frontend:** `src/components/RideChatPopup.jsx`
  - `CHAT_IDLE_MS = 5 * 60 * 1000`; `resetIdleTimer()` runs on open and on each send/receive; when it fires, calls `POST /session/:sessionId/expire` and `onClose`.
- **Frontend:** `src/pages/SharedAutoBooking.jsx`
  - Listens for `ride:session_expired` and sets `chatExpiredSessionId`; popup receives `expiredSessionId` and shows expired state / closes.

---

## 5. File-level summary (where to change things)

| Area | Files |
|------|--------|
| **Request flow (no auto-confirm, B sees Accept/Reject)** | `src/pages/SharedAutoBooking.jsx` (rider cards, accept/reject handlers); `server/controllers/rideSession.controller.js` (accept/reject); `server/routes/sharedRide.routes.js` (new routes). |
| **Confirmation logic (both must confirm)** | `server/controllers/rideSession.controller.js` (`confirmRide`, dual flags and book emission); `src/components/RideChatPopup.jsx` (Confirm button and “Do you want to confirm your ride?”). |
| **Chat UI (pop-up, suggested questions)** | `src/components/RideChatPopup.jsx` (full popup UI); `src/pages/SharedAutoBooking.jsx` (open chat, pass props, handle `onRideBooked`). |
| **Timeout (5 min idle)** | `server/controllers/rideSession.controller.js` (`lastMessageAt`, `expireIdleSessions`); `server/index.js` (interval); `src/components/RideChatPopup.jsx` (client timer + expire API). |
| **New models** | `server/models/RideSession.js`, `server/models/ChatMessage.js`. |
| **New API routes** | `server/routes/sharedRide.routes.js`: `/accept-request`, `/reject-request`, `/sessions`, `/session/:sessionId`, `/session/:sessionId/messages`, `/session/:sessionId/message`, `/session/:sessionId/confirm`, `/session/:sessionId/expire`. |
| **Socket events** | Emitted: `ride:request_accepted`, `ride:request_rejected`, `ride:chat_message`, `ride:session_expired`, `ride:other_confirmed`; existing `ride:booked` / `ride:riders_booked` when both confirm. Listened (frontend): same in `SharedAutoBooking.jsx`. |

---

## 6. Making it feel realistic in production

- **Request flow:** Keep Accept/Reject as the only way to “join” a ride with someone; avoid auto-adding users to a ride without explicit accept.
- **Confirmation logic:** Do not confirm the ride from a single user action; always require both sides to press Confirm in chat (or an equivalent double opt-in).
- **Chat UI:** Keep the pop-up and suggested questions; optionally add typing indicators and read receipts for a more “real” feel.
- **Timeout:** Keep server-side expiry (e.g. 5 min after last message) and sync with a client-side timer so both see “session expired” even if one user is offline. Consider a short warning (e.g. “Chat will expire in 1 min”) before closing.
- **Persistence:** Messages are stored in **ChatMessage**; you can add pagination or “load older” for long chats.
- **Notifications:** In production, add push/email when someone accepts your request or sends a chat message so users don’t miss the chat window.
