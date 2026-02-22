const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/** Haversine distance in km (fallback when Google API fails or is not enabled). */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/maps/distance-matrix?originLat=&originLng=&destLat=&destLng=
 * Proxies Google Distance Matrix API; falls back to straight-line distance if API fails.
 */
async function getDistanceMatrix(req, res) {
  const originLat = parseFloat(req.query.originLat);
  const originLng = parseFloat(req.query.originLng);
  const destLat = parseFloat(req.query.destLat);
  const destLng = parseFloat(req.query.destLng);
  if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
    return res.json({
      distanceKm: null,
      durationText: null,
      error: "Missing or invalid originLat, originLng, destLat, or destLng",
    });
  }

  const fallbackKm = haversineKm(originLat, originLng, destLat, destLng);

  if (!GOOGLE_MAPS_API_KEY) {
    return res.json({
      distanceKm: Math.round(fallbackKm * 100) / 100,
      durationText: null,
      error: "Server missing API key; using approximate distance",
    });
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&units=metric&key=${GOOGLE_MAPS_API_KEY}`;
  try {
    const { data } = await axios.get(url);
    if (data.status === "OK") {
      const el = data.rows?.[0]?.elements?.[0];
      if (el && el.status === "OK") {
        const distanceKm = (el.distance?.value ?? 0) / 1000;
        const durationText = el.duration?.text ?? null;
        return res.json({ distanceKm, durationText });
      }
    }
    // Google returned non-OK or no route: use fallback so frontend can still show price
    return res.json({
      distanceKm: Math.round(fallbackKm * 100) / 100,
      durationText: null,
      error: data.status || "No route; using approximate distance",
    });
  } catch (err) {
    return res.json({
      distanceKm: Math.round(fallbackKm * 100) / 100,
      durationText: null,
      error: err.message || "Using approximate distance",
    });
  }
}

module.exports = { getDistanceMatrix };
