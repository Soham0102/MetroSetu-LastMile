import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Recommendation from "./pages/Recommendation";
import VirtualHub from "./pages/VirtualHub";
import PMPLTransit from "./pages/PMPLTransit";
import SharedAutoBooking from "./pages/SharedAutoBooking";
import SharedBikeBooking from "./pages/SharedBikeBooking";
import WalkingDirections from "./pages/WalkingDirections";
import RideBookingPage from "./pages/RideBookingPage";
import RideSessionDetailPage from "./pages/RideSessionDetailPage";
import ConcessionSignup from "./pages/ConcessionSignup";
import Donor from "./pages/Donor";
import AdminDashboard from "./pages/AdminDashboard";

const SOCKET_URL = import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://localhost:5000";

function App() {
  const [, setRefresh] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || user?.isAdmin) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on("concession:approved", (data) => {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      u.concessionApproved = true;
      localStorage.setItem("user", JSON.stringify(u));
      setRefresh((r) => r + 1);
    });
    return () => socket.disconnect();
  }, []);

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup/concession" element={<ConcessionSignup />} />
        <Route path="/donate" element={<Donor />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/recommendation" element={<Recommendation />} />
        <Route path="/virtualhub" element={<VirtualHub />} />
        <Route path="/pmpml-transit" element={<PMPLTransit />} />
        <Route path="/shared-auto-booking" element={<SharedAutoBooking />} />
        <Route path="/shared-bike-booking" element={<SharedBikeBooking />} />
        <Route path="/walking-directions" element={<WalkingDirections />} />

        <Route path="/shared-ride/booking" element={<RideBookingPage />} />
        <Route path="/shared-ride/session/:sessionId" element={<RideSessionDetailPage />} />

      </Routes>
    </>
  );
}

export default App;
