import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const WomenSafety = () => {

  const navigate = useNavigate();
  const hour = new Date().getHours();

  const isNight = hour >= 20 || hour <= 6;

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      <h1 className="title">🛡 Women Safety Mode</h1>

      <div className="card">
        <h3>Status: {isNight ? "🌙 Night Safety Active" : "☀ Day Mode"}</h3>

        {isNight && (
          <>
            <p>✔ Women-only shuttle preference enabled</p>
            <p>✔ Verified driver required</p>
            <p>✔ Live tracking activated</p>
          </>
        )}

        <br />

        <button
          className="primary-btn"
          style={{ background: "#ff4d6d" }}
          onClick={() => alert("🚨 SOS Alert Sent (Demo)")}
        >
          🚨 Emergency SOS
        </button>

      </div>

      <br />

      <button
        className="primary-btn"
        onClick={() => navigate("/home")}
      >
        ⬅ Back to Home
      </button>

    </motion.div>
  );
};

export default WomenSafety;
