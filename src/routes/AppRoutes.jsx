import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Recommendation from "../pages/Recommendation";
import Dashboard from "../pages/Dashboard";
import VirtualHub from "../pages/VirtualHub";
import WomenSafety from "../pages/WomenSafety";
import Signup from "../pages/Signup";
import Login from "../pages/Login";


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/recommendation" element={<Recommendation />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/virtualhub" element={<VirtualHub />} />
      <Route path="/womensafety" element={<WomenSafety />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default AppRoutes;
