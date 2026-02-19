import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useState } from "react";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "500px"
};

const center = { lat: 18.5204, lng: 73.8567 };

const VirtualHub = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyA9spKFBlhfECHHoXnMPRziyuUuhL124yo",
    libraries
  });

  const [users] = useState([
    { lat: 18.5205, lng: 73.8568 },
    { lat: 18.5207, lng: 73.8569 },
    { lat: 18.5203, lng: 73.8571 },
    { lat: 18.5209, lng: 73.8566 },
    { lat: 18.5206, lng: 73.8567 }
  ]);

  // Calculate centroid
  const calculateCentroid = (points) => {
    const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
    return { lat, lng };
  };

  const hub =
    users.length >= 5 ? calculateCentroid(users) : null;

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>🚐 Dynamic Virtual Hub</h2>
      <p>
        AI clusters nearby commuters (5+ within 200m) and generates a
        temporary pickup hub.
      </p>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={17}
        center={center}
      >
        {/* User markers */}
        {users.map((user, i) => (
          <Marker
            key={i}
            position={user}
            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          />
        ))}

        {/* Hub marker */}
        {hub && (
          <Marker
            position={hub}
            icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          />
        )}
      </GoogleMap>

      {hub && (
        <div style={{ marginTop: "20px" }}>
          <strong>Virtual Hub Activated</strong>
          <p>
            5 commuters detected within 200m radius. Temporary pickup point
            generated.
          </p>
        </div>
      )}
    </div>
  );
};

export default VirtualHub;
