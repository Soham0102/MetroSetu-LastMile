/**
 * fetchNearbyMetro.js
 *
 * Fetches real metro/subway stations near a given lat/lng
 * via Vite's dev proxy → Google Places Nearby Search API.
 *
 * The request goes to /api/places/nearbysearch/json
 * which Vite rewrites to https://maps.googleapis.com/maps/api/place/nearbysearch/json
 * — bypassing CORS completely.
 */

const GOOGLE_API_KEY = "AIzaSyA9spKFBlhfECHHoXnMPRziyuUuhL124yo";

/**
 * Fetch nearby metro stations using Google Places Nearby Search.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius - in metres (default 10 km)
 * @returns {Promise<Array<{ name, lat, lng, placeId, vicinity }>>}
 */
export const fetchNearbyMetroStations = async (lat, lng, radius = 10000) => {
  // Goes through Vite proxy → no CORS issue
  const url =
    `/api/places/nearbysearch/json` +
    `?location=${lat},${lng}` +
    `&radius=${radius}` +
    `&type=subway_station` +
    `&key=${GOOGLE_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Places API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API returned status: ${data.status} — ${data.error_message || ""}`);
  }

  return (data.results || []).map((place) => ({
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    placeId: place.place_id,
    vicinity: place.vicinity || "",
  }));
};

/**
 * Find the nearest station from a list using your existing calculateDistance util.
 *
 * @param {number} userLat
 * @param {number} userLng
 * @param {Array}  stations
 * @param {Function} calculateDistance
 * @returns {{ nearest: Object, distanceKm: string } | null}
 */
export const findNearestStation = (userLat, userLng, stations, calculateDistance) => {
  if (!stations || stations.length === 0) return null;

  let minDist = Infinity;
  let nearest = null;

  stations.forEach((s) => {
    const d = parseFloat(calculateDistance(userLat, userLng, s.lat, s.lng));
    if (d < minDist) {
      minDist = d;
      nearest = s;
    }
  });

  return { nearest, distanceKm: minDist.toFixed(2) };
};