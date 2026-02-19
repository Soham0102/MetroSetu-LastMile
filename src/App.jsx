import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Recommendation from "./pages/Recommendation";
import VirtualHub from "./pages/VirtualHub";

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
      </Routes>
    </>
  );
}

export default App;
