const axios = require("axios");

exports.getTransitRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body;

    const response = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        origin: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng
            }
          }
        },
        travelMode: "TRANSIT"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline"
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    res.status(500).json({ message: "Route fetch failed" });
  }
};
