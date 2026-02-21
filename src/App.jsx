import { Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
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
