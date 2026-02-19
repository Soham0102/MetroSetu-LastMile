const express = require("express");
const router = express.Router();

const {
  getWeatherData,
  getAQI,
  getSmartEnvironment
} = require("../controllers/weatherController");

router.get("/", getWeatherData);
router.get("/aqi", getAQI);
router.get("/smart", getSmartEnvironment);

module.exports = router;
