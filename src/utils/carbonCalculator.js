export function calculateGreenImpact(distance, mode) {

  const carEmissionPerKm = 0.21; // kg CO2 per km (approx)

  let savedCO2 = 0;

  if (mode.includes("Walk")) {
    savedCO2 = distance * carEmissionPerKm;
  } else if (mode.includes("Shuttle")) {
    savedCO2 = distance * carEmissionPerKm * 0.7;
  } else {
    savedCO2 = 0;
  }

  const fuelSaved = savedCO2 * 0.45; // rough conversion
  const greenScore = Math.round(savedCO2 * 100);

  return {
    savedCO2: savedCO2.toFixed(2),
    fuelSaved: fuelSaved.toFixed(2),
    greenScore
  };
}
