const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/weather", require("./routes/weatherRoutes"));
app.use("/api/routes", require("./routes/routes"));
app.use("/api/routes", require("./routes/routesApi"));


app.use("/api/auth", require("./routes/authRoutes"));

app.get("/", (req, res) => {
  res.send("MetroSetu Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
