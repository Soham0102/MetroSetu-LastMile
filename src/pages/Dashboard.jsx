import { calculateGreenImpact } from "../utils/carbonCalculator";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {

  const navigate = useNavigate();

  // Demo values (later dynamic karenge)
  const distance = 0.8;
  const mode = "Walk 🚶";

  const impact = calculateGreenImpact(distance, mode);

  // Dynamic badge logic
  let badge = "🌱 Green Starter";
  if (impact.greenScore > 50) badge = "🏅 Metro Champion";
  if (impact.greenScore > 100) badge = "🚀 Climate Leader";

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      <h1 className="title">🌱 Green Impact Dashboard</h1>

      {/* Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px",
        marginTop: "30px"
      }}>

        {/* CO2 Saved */}
        <div className="card">
          <h3>CO₂ Saved</h3>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ fontSize: "24px", fontWeight: "bold" }}
          >
            {impact.savedCO2} kg
          </motion.p>
        </div>

        {/* Fuel Saved */}
        <div className="card">
          <h3>Fuel Saved</h3>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: "24px", fontWeight: "bold" }}
          >
            {impact.fuelSaved} liters
          </motion.p>
        </div>

        {/* Green Score */}
        <div className="card">
          <h3>Green Score</h3>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#00a86b"
            }}
          >
            {impact.greenScore}
          </motion.p>
        </div>

        {/* Badge */}
        <div className="card">
          <h3>Badge Earned</h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{ fontSize: "22px", fontWeight: "bold" }}
          >
            {badge}
          </motion.p>
        </div>

      </div>

      {/* Back Button */}
      <div style={{ marginTop: "40px" }}>
        <button
          className="primary-btn"
          onClick={() => navigate("/home")}
        >
          ⬅ Back to Home
        </button>
      </div>

    </motion.div>
  );
};

export default Dashboard;
