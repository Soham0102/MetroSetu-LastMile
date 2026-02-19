export function calculateCentroid(points) {

  const latSum = points.reduce((sum, p) => sum + p.lat, 0);
  const lngSum = points.reduce((sum, p) => sum + p.lng, 0);

  return {
    lat: latSum / points.length,
    lng: lngSum / points.length
  };
}
