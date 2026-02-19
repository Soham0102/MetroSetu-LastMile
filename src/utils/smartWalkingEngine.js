export const getSmartRecommendation = ({
  distance,
  temperature,
  rain,
  hour,
  aqi,
  safetyScore
}) => {

  // 🟢 Perfect walking condition
  if (
    distance < 1 &&
    aqi < 150 &&
    temperature < 35 &&
    !rain &&
    hour < 20 &&
    safetyScore > 70
  ) {
    return {
      mode: "Walk 🚶",
      reason: "Short distance and safe walking conditions."
    };
  }

  // 🔴 Bad weather or late night
  if (rain || temperature > 38 || hour >= 20) {
    return {
      mode: "Shared Shuttle 🚐",
      reason: "Weather or time not suitable for walking."
    };
  }

  // 🛡 Low safety zone
  if (safetyScore < 50) {
    return {
      mode: "Registered Auto 🛵",
      reason: "Low safety detected. Safer vehicle recommended."
    };
  }

  // Default shared mobility
  return {
    mode: "Shared Shuttle 🚐",
    reason: "Efficient shared transport recommended."
  };
};
