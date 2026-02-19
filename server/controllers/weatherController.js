const axios = require("axios");

// ================================
// 🔹 Helper: Calculate Heat Index
// ================================
const calculateHeatIndex = (temp, humidity) => {
  // Simple approximation formula
  return (
    -8.784695 +
    1.61139411 * temp +
    2.338549 * humidity -
    0.14611605 * temp * humidity -
    0.012308094 * temp * temp -
    0.016424828 * humidity * humidity +
    0.002211732 * temp * temp * humidity +
    0.00072546 * temp * humidity * humidity -
    0.000003582 * temp * temp * humidity * humidity
  );
};

// ========================================
// 🔹 Get Weather + Rain + Heat Index
// ========================================
exports.getWeatherData = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and Longitude required" });
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}&units=metric`;

    const response = await axios.get(weatherUrl);

    const temperature = response.data.main.temp;
    const humidity = response.data.main.humidity;
    const weatherMain = response.data.weather[0].main;

    const rain = weatherMain === "Rain" || weatherMain === "Drizzle";

    const heatIndex = calculateHeatIndex(temperature, humidity);

    res.json({
      temperature,
      humidity,
      rain,
      heatIndex: parseFloat(heatIndex.toFixed(2))
    });

  } catch (error) {
    console.error("Weather API Error:", error.message);
    res.status(500).json({ message: "Weather fetch failed" });
  }
};


// ========================================
// 🔹 Get AQI Data
// ========================================
exports.getAQI = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and Longitude required" });
    }

    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}`;

    const response = await axios.get(aqiUrl);

    const aqi = response.data.list[0].main.aqi;

    // AQI Level Mapping
    const aqiLevelMap = {
      1: "Good",
      2: "Fair",
      3: "Moderate",
      4: "Poor",
      5: "Very Poor"
    };

    res.json({
      aqi,
      level: aqiLevelMap[aqi] || "Unknown"
    });

  } catch (error) {
    console.error("AQI API Error:", error.message);
    res.status(500).json({ message: "AQI fetch failed" });
  }
};


// ========================================
// 🔹 Combined Smart Environment Data
// ========================================
exports.getSmartEnvironment = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and Longitude required" });
    }

    // Weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}&units=metric`;

    const weatherRes = await axios.get(weatherUrl);

    const temperature = weatherRes.data.main.temp;
    const humidity = weatherRes.data.main.humidity;
    const weatherMain = weatherRes.data.weather[0].main;
    const rain = weatherMain === "Rain" || weatherMain === "Drizzle";

    const heatIndex = calculateHeatIndex(temperature, humidity);

    // AQI
    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}`;

    const aqiRes = await axios.get(aqiUrl);
    const aqi = aqiRes.data.list[0].main.aqi;

    res.json({
      temperature,
      humidity,
      rain,
      heatIndex: parseFloat(heatIndex.toFixed(2)),
      aqi
    });

  } catch (error) {
    console.error("Smart Environment API Error:", error.message);
    res.status(500).json({ message: "Environment fetch failed" });
  }
};
